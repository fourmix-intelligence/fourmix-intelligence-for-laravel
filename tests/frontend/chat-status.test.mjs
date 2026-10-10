import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

async function fixture(t) {
    const dom = new JSDOM('<meta name="csrf-token" content="synthetic">', { url: 'https://app.example.test' });
    t?.after(() => dom.window.close());
    dom.window.HTMLElement.prototype.scrollIntoView = function () {};
    const state = { timezone: 'Asia/Tokyo', surfaces: [{ name: 'page', enabled: true, alias: 'ui-page' }],
        agents: [{ alias: 'ui-page', connection_id: 'connection-a', grant_id: 'grant-a', connection_revision: 1, name: '合成アシスタント' }],
        connections: [{ id: 'connection-a', revision: 1, permissions: { 'records.save': 'review' } }], actions: [] };
    let history = { messages: [] };
    const failures = new Map(), calls = [];
    const context = vm.createContext({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
        customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent, URL, URLSearchParams, AbortController });
    const sdk = new vm.SyntheticModule(['request'], function () {
        this.setExport('request', async (url, options = {}) => {
            calls.push(url);
            if (failures.has(url)) throw failures.get(url);
            if (url.endsWith('/state')) return state;
            if (url.endsWith('/history')) return options.body?.conversation_id ? history : { conversations: [] };
            if (url.includes('/attachments?')) return { policy: { extensions: ['txt'], max_bytes: 2048, max_files: 5 }, data: [] };
            throw new Error(`想定外の通信: ${url}`);
        });
    }, { context });
    const markdown = new vm.SyntheticModule(['renderMarkdown', 'configureRendering'], function () {
        this.setExport('configureRendering', () => {});
        this.setExport('renderMarkdown', text => { const element = dom.window.document.createElement('div'); element.textContent = text; return element; });
    }, { context });
    const module = new vm.SourceTextModule(await readFile(new URL('../../resources/js/chat.js', import.meta.url), 'utf8'), { context });
    await module.link(specifier => specifier === './sdk.js' ? sdk : markdown);
    await module.evaluate();
    const chat = dom.window.document.createElement('fourmix-intelligence-chat');
    chat.setAttribute('surface', 'page');
    dom.window.document.body.append(chat);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(chat.ready, true);
    chat.conversationId = 'conversation-a';
    chat.progress.hidden = false;
    chat.progressLabel.textContent = '内容を確認して承認してください';
    return { chat, dom, calls, history: messages => { history = { messages }; },
        fail: (path, status, message) => failures.set(`/fourmix-intelligence/${path}`, Object.assign(new Error(message), { status })) };
}

for (const [state, label] of Object.entries({ succeeded: '業務操作が完了しました', rejected: '業務操作は実行せず終了しました', expired: '確認期限が切れました' })) {
    test(`操作結果 ${state} を履歴から読み込むと確認待ちの表示を更新する`, async () => {
        const fixtureData = await fixture();
        fixtureData.history([{ role: 'assistant', content: '', application_receipt: { state, data: { message: '合成結果' } } }]);
        await fixtureData.chat.loadHistory('conversation-a');
        assert.equal(fixtureData.chat.progressLabel.textContent, label);
        assert.match(fixtureData.chat.messages.textContent, /このアプリケーション/);
        fixtureData.dom.window.close();
    });
}

test('過去のページにある完了結果で現在の進行表示を上書きしない', async () => {
    const fixtureData = await fixture();
    fixtureData.chat.progressLabel.textContent = '回答が完了しました';
    fixtureData.history([{ role: 'assistant', content: '', application_receipt: { state: 'rejected' } }]);
    await fixtureData.chat.loadHistory('conversation-a', 'older-message');
    assert.equal(fixtureData.chat.progressLabel.textContent, '回答が完了しました');
    fixtureData.dom.window.close();
});

test('確認ボタンは操作名だけを表示し、詳しい説明は保持する', async () => {
    const { chat, dom } = await fixture();
    const description = '登録情報を更新。対象と変更内容を確認してください。';
    await chat.pending({ actions: [{ id: 'action-a', operation: 'records.save', state: 'confirmation_required' }], tools: [{ name: 'records.save', description }] });
    const button = chat.approvals.querySelector('button');
    assert.equal(button.textContent, '操作を確認：登録情報を更新');
    assert.equal(button.title, description);
    dom.window.close();
});

test('操作結果を取得後に確認待ち一覧の更新が失敗しても、結果の反映失敗と表示しない', async t => {
    const { chat, dom, history, fail, calls } = await fixture(t);
    history([{ role: 'assistant', content: '', application_receipt: { state: 'succeeded', data: { message: '登録済みの合成結果' } } }]);
    fail('state', 502, '処理を完了できませんでした。');
    await chat.refreshActionResults();
    assert.match(chat.messages.textContent, /登録済みの合成結果/);
    assert.equal(chat.progressLabel.textContent, '業務操作が完了しました');
    assert.match(chat.notice.textContent, /会話履歴は更新しました/);
    assert.match(chat.notice.textContent, /確認待ちの一覧を更新できませんでした/);
    assert.doesNotMatch(chat.notice.textContent, /実行結果を会話へ反映できませんでした/);
    assert.equal(calls.filter(url => url.endsWith('/chat')).length, 0);
    dom.window.close();
});

for (const path of ['history', 'state']) {
    for (const [status, message] of [[401, 'ログインの有効期限が切れました。再ログインしてください。'], [419, '画面の有効期限が切れました。再読み込みしてください。']]) {
        test(`${path} の再読み込みが ${status} になったら、有効期限の案内を残す`, async t => {
            const { chat, dom, fail } = await fixture(t);
            fail(path, status, message);
            await chat.refreshActionResults();
            assert.match(chat.notice.textContent, new RegExp(message));
            assert.match(chat.notice.textContent, /同じ操作を再実行する必要はありません/);
            dom.window.close();
        });
    }
}

test('操作結果の再読み込みで設定変更を検出したら、送信停止と設定確認の案内を保持する', async t => {
    const { chat, dom, fail } = await fixture(t);
    fail('history', 409, '接続が更新されています。');
    await chat.refreshActionResults();
    assert.equal(chat.selectionStale, true);
    assert.equal(chat.submit.disabled, true);
    assert.match(chat.notice.textContent, /接続・AI・権限が変更されています/);
    dom.window.close();
});

test('結果を取得後に一覧の更新で設定変更を検出した場合も、草稿を残して送信を停止する', async t => {
    const { chat, dom, history, fail } = await fixture(t);
    chat.input.value = '次に相談する草稿';
    history([{ role: 'assistant', content: '', application_receipt: { state: 'rejected' } }]);
    fail('state', 409, '接続が更新されています。');
    await chat.refreshActionResults();
    assert.equal(chat.selectionStale, true);
    assert.equal(chat.submit.disabled, true);
    assert.equal(chat.input.value, '次に相談する草稿');
    assert.match(chat.messages.textContent, /業務操作は実行せず終了しました/);
    dom.window.close();
});
