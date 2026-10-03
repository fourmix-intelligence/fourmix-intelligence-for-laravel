import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test' });
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
const context = vm.createContext({
    window: dom.window, document: dom.window.document, location: dom.window.location, URL,
    HTMLElement: dom.window.HTMLElement, customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent,
});
const request = new vm.SyntheticModule(['request'], function () { this.setExport('request', async () => {}); }, { context });
const markdown = new vm.SyntheticModule(['renderMarkdown', 'configureRendering'], function () { this.setExport('renderMarkdown', () => {}); this.setExport('configureRendering', () => {}); }, { context });
const source = new vm.SourceTextModule(await readFile(new URL('../../resources/js/chat.js', import.meta.url), 'utf8'), { context });
await source.link(specifier => specifier === './markdown.js' ? markdown : request);
await source.evaluate();

async function show(action) {
    dom.window.document.body.replaceChildren();
    await source.namespace.showAction({ call: async () => ({ operation: 'records.save', ...action }) }, 'synthetic-action', dom.window.document.body, async () => {});
    return dom.window.document.querySelector('dialog');
}

test('完了した結果の案内と同一オリジンの業務リンクを示し、任意の詳細データは折り畳む', async () => {
    const dialog = await show({ state: 'succeeded', data: { saved: true, message: '情報を保存しました。', url: '/records/1?month=2027-11', extra: { revision: 2 } } });
    assert.ok([...dialog.querySelectorAll('p')].some(paragraph => paragraph.textContent === '情報を保存しました。'));
    const link = dialog.querySelector('a');
    assert.equal(link.textContent, '業務画面で結果を見る');
    assert.equal(link.href, 'https://app.example.test/records/1?month=2027-11');
    const details = dialog.querySelector('details');
    assert.equal(details.open, false);
    assert.equal(details.querySelector('summary').textContent, '結果の詳細');
    assert.deepEqual(JSON.parse(details.querySelector('pre').textContent), { saved: true, message: '情報を保存しました。', url: '/records/1?month=2027-11', extra: { revision: 2 } });
    assert.equal(dialog.querySelectorAll('div > pre').length, 0);
});

test('業務結果のリンクで危険なスキーム・別オリジン・不正なURLを許可せず、メッセージをHTMLとして実行しない', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'https://other.example.test/result', '//other.example.test/result', 'http://[']) {
        const dialog = await show({ state: 'succeeded', data: { message: '<img src=x onerror=alert(1)>', url } });
        assert.equal(dialog.querySelectorAll('a,img,script').length, 0);
        assert.ok([...dialog.querySelectorAll('p')].some(paragraph => paragraph.textContent === '<img src=x onerror=alert(1)>'));
        assert.equal(dialog.querySelector('details').open, false);
    }
});

test('結果不明の状態ではデータ内の保存メッセージを完了案内として扱わない', async () => {
    const dialog = await show({ state: 'unknown_effect', message: '実行結果を確認してください。', data: { saved: true, message: '情報を保存しました。', url: '/records/1' } });
    const messages = [...dialog.querySelectorAll('p')].map(paragraph => paragraph.textContent);
    assert.ok(messages.some(message => message.includes('結果の確認が必要')));
    assert.ok(messages.includes('実行結果を確認してください。'));
    assert.equal(messages.includes('情報を保存しました。'), false);
    assert.equal(dialog.querySelector('a'), null);
    assert.equal(dialog.querySelector('details').open, false);
});

test('確認前の操作は宿主の確認画面への案内を優先し、結果のリンクとして扱わない', async () => {
    const dialog = await show({ state: 'confirmation_required', preview: { amount: 100 }, url: '/reviews/1' });
    assert.equal(dialog.querySelector('a').textContent, 'このアプリケーションの確認画面で確認');
    assert.equal(dialog.querySelector('details'), null);
    assert.equal(dialog.querySelector('input'), null);
});

test('汎用の確認文を表示し、承認結果をアプリケーションのチャットへ通知する', async () => {
    dom.window.document.body.replaceChildren(); let changed, calls = 0, notified;
    dom.window.addEventListener('fourmix:action-changed', event => { notified = event.detail; }, { once: true });
    await source.namespace.showAction({ call: async () => ++calls === 1 ? { state: 'confirmation_required', operation: 'notes.create', preview: { title: '合成備忘' } }
        : { state: 'succeeded', operation: 'notes.create', data: { saved: true } } }, 'synthetic-action', dom.window.document.body, async result => { changed = result; });
    const dialog = dom.window.document.querySelector('dialog');
    assert.match(dialog.textContent, /対象と変更内容を確認しました。/); assert.equal(dialog.textContent.includes('金額'), false);
    const checkbox = dialog.querySelector('input'); checkbox.checked = true; checkbox.dispatchEvent(new dom.window.Event('change'));
    await [...dialog.querySelectorAll('button')].find(button => button.textContent === '確認して実行').onclick();
    assert.equal(changed.state, 'succeeded'); assert.equal(notified.state, 'succeeded'); assert.equal(notified.id, 'synthetic-action'); assert.equal(calls, 2);
});
