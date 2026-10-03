import assert from 'node:assert/strict';
import test from 'node:test';
import { readStream } from '../../resources/js/stream.js';

const event = (type, data) => JSON.stringify({ type, data }) + '\n';
const response = chunks => ({ body: new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }) });

test('分割された日本語・複数イベント・空の接続維持行を順番に読み取り、完了結果だけを返す', async () => {
    const bytes = new TextEncoder().encode(event('run.status', { message: '考えています' }) + '\n' + event('assistant.delta', { text: '日本語の回答' }) + event('run.completed', { result: { answer: '日本語の回答' } }));
    const chunks = []; for (let index = 0; index < bytes.length; index += 2) chunks.push(bytes.slice(index, index + 2));
    const received = []; const result = await readStream(response(chunks), item => received.push(item));
    assert.deepEqual(received.map(item => item.type), ['run.status', 'assistant.delta', 'run.completed']);
    assert.equal(received[1].data.text, '日本語の回答'); assert.equal(result.result.answer, '日本語の回答');
});

test('途中終了・不正な行・失敗イベントを完了として扱わない', async () => {
    for (const text of [event('assistant.delta', { text: '途中' }), 'not-json\n', event('run.failed', {}), event('run.completed', {})]) {
        await assert.rejects(readStream(response([new TextEncoder().encode(text)]), () => {}));
    }
});

test('内部イベントをUIへ渡さず、エラー時も接続を解放する', async () => {
    const received = []; let cancelled = false;
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(event('reasoning.delta', { text: 'internal' }) + event('run.failed', { status_code: 409 }))); }, cancel() { cancelled = true; } });
    await assert.rejects(readStream({ body }, item => received.push(item)), error => error.status === 409);
    assert.deepEqual(received.map(item => item.type), ['run.failed']); assert.equal(cancelled, true); assert.equal(body.locked, false);
});

test('利用者の停止で読み取りが中断された場合も、接続を解放して再試行しない', async () => {
    let reads = 0, released = false;
    const abort = new DOMException('停止', 'AbortError');
    const body = { getReader() { return { async read() { reads++; throw abort; }, async cancel() {}, releaseLock() { released = true; } }; } };
    await assert.rejects(readStream({ body }, () => {}), error => error.name === 'AbortError');
    assert.equal(reads, 1); assert.equal(released, true);
});
