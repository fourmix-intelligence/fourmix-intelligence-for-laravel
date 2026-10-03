/** Read the server's display events once; a truncated answer is never a completed run. */
export async function readStream(response, onEvent) {
    if (!response.body?.getReader) throw new Error('応答を読み取れません。会話履歴を確認してください。');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let buffer = '';
    try {
        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            if (buffer.length > 2 * 1024 * 1024) throw new Error('応答が大きすぎます。会話履歴を確認してください。');
            let end;
            while ((end = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
                if (!line) continue;
                let event;
                try { event = JSON.parse(line); } catch { throw new Error('応答の形式を確認できません。会話履歴を確認してください。'); }
                if (!event || typeof event.type !== 'string' || !event.data || typeof event.data !== 'object' || Array.isArray(event.data)) throw new Error('応答の形式を確認できません。');
                if (!['run.created', 'run.status', 'assistant.delta', 'assistant.message', 'run.completed', 'run.failed'].includes(event.type)) continue;
                onEvent(event);
                if (event.type === 'run.failed') {
                    const failure = new Error('AIの処理を完了できませんでした。会話履歴と操作結果を確認してください。');
                    if ([401, 403, 409, 422, 429].includes(event.data.status_code)) failure.status = event.data.status_code;
                    throw failure;
                }
                if (event.type === 'run.completed') {
                    if (!event.data.result || typeof event.data.result !== 'object' || typeof event.data.result.answer !== 'string') throw new Error('回答の完了を確認できません。会話履歴を確認してください。');
                    return event.data;
                }
            }
            if (done) throw new Error('通信が途中で終了しました。会話履歴と操作結果を確認してください。');
        }
    } finally {
        try { await reader.cancel(); } catch { /* The connection may already be closed. */ }
        reader.releaseLock();
    }
}
