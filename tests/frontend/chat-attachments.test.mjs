import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const conversation = '12345678-1234-4234-8234-123456789012';
const id = '22345678-1234-4234-8234-123456789012';
const policy = { extensions: ['png', 'pdf'], max_bytes: 1000, max_files: 5 };
const metadata = { id, name: '確認資料.png', mime: 'image/png', size: 3, expires_at: 4000000000 };
async function fixture(handler, attributes = {}) {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test' }); dom.window.HTMLElement.prototype.scrollIntoView = function () {};
    dom.window.HTMLDialogElement.prototype.show = function () { this.open = true; }; dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
    const calls = [], rendering = [], revoked = [], disposed = [];
    class TestURL extends URL { static createObjectURL() { return 'blob:synthetic-preview'; } static revokeObjectURL(url) { revoked.push(url); } }
    const context = vm.createContext({ window: dom.window, document: dom.window.document, location: dom.window.location, HTMLElement: dom.window.HTMLElement, customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent, FormData: dom.window.FormData, URL: TestURL, URLSearchParams, AbortController, TextEncoder, crypto: webcrypto });
    const dependency = new vm.SyntheticModule(['request'], function () { this.setExport('request', async (url, options) => {
        calls.push({ url, options }); const custom = handler?.(url, options, dom); if (custom !== undefined) return custom;
        if (url.endsWith('/state')) return { agents: [{ alias: 'assistant' }], actions: [], timezone: 'Asia/Tokyo', rendering: { attachmentUrlPrefixes: ['/fourmix-intelligence/attachments/'], allowedImageOrigins: [] } };
        if (url.includes('/attachments?')) return { policy, data: [] };
        if (url.endsWith('/history')) return options.body.conversation_id ? { messages: [], has_more: false } : { conversations: [] };
        if (url.endsWith('/chat')) return { conversation_id: conversation, result: { answer: '確認しました。' } };
        if (url.endsWith('/attachments')) return { conversation_id: conversation, attachment: metadata };
        return {};
    }); }, { context });
    const markdown = new vm.SyntheticModule(['renderMarkdown', 'configureRendering'], function () {
        this.setExport('configureRendering', options => rendering.push(options)); this.setExport('renderMarkdown', (text, options) => { const node = dom.window.document.createElement('div'); node.className = 'fi-markdown'; node.textContent = text; node.dispose = () => disposed.push(text); node.options = options; return node; });
    }, { context });
    const module = new vm.SourceTextModule(await readFile(new URL('../../resources/js/chat.js', import.meta.url), 'utf8'), { context }); await module.link(specifier => specifier === './markdown.js' ? markdown : dependency); await module.evaluate();
    const chat = dom.window.document.createElement('fourmix-intelligence-chat'); chat.setAttribute('alias', 'assistant'); for (const [name, value] of Object.entries(attributes)) chat.setAttribute(name, value); dom.window.document.body.append(chat); await tick(); await tick();
    return { chat, dom, calls, rendering, revoked, disposed, module, context, dependency, file: (name = '確認資料.png', contents = 'png', type = 'image/png') => new dom.window.File([contents], name, { type }) };
}

test('助手の表示名と履歴を一つのヘッダーにまとめ、技術的な呼び出し名を表示しない', async () => {
    const { chat, calls } = await fixture(url => url.endsWith('/state') ? { agents: [{ alias: 'assistant', name: '確認アシスタント' }], actions: [] } : undefined);
    assert.equal(chat.activeAlias, 'assistant');
    assert.equal(chat.agentTitle.textContent, '確認アシスタント');
    assert.equal(chat.toolbar.querySelectorAll('select').length, 0);
    assert.equal(chat.history.parentElement, chat.toolbar);
    assert.equal(chat.fresh.parentElement, chat.toolbar);
    assert.equal(chat.retry.parentElement, chat.toolbar);
    chat.message('assistant', '確認しました。');
    assert.match(chat.messages.textContent, /確認アシスタント/);
    assert.equal(chat.messages.textContent.includes('assistant'), false);
    assert.equal(calls.some(call => call.url.includes('/agents?')), false);
});

test('全画面の履歴は側面に開き、会話カードから切り替えても未送信の草稿を保持する', async () => {
    const messages = deferred();
    const { chat, dom, calls } = await fixture((url, options) => url.endsWith('/history')
        ? options.body.conversation_id ? messages.promise : { conversations: [{ identify: conversation, title: '資料の相談', updated_at: '2026-10-03T12:00:00+09:00' }] } : undefined);
    chat.input.value = 'まだ送らない依頼'; chat.history.click();
    assert.equal(chat.historyLayout, 'drawer'); assert.equal(chat.historyPanel.hidden, false);
    assert.equal(chat.history.getAttribute('aria-expanded'), 'true'); assert.equal(dom.window.document.activeElement, chat.historyClose);
    assert.equal(chat.historyList.querySelectorAll('select').length, 0);
    const choice = chat.historyList.querySelector('button'); assert.match(choice.textContent, /資料の相談/); choice.click(); await tick();
    assert.match(chat.historyStatus.textContent, /読み込んでいます/); assert.equal(choice.disabled, true); assert.equal(chat.submit.disabled, true);
    messages.resolve({ messages: [{ role: 'assistant', content: '以前の回答です。' }], has_more: false }); await tick(); await tick();
    assert.equal(chat.conversationId, conversation); assert.equal(chat.historyPanel.hidden, true);
    assert.equal(chat.history.getAttribute('aria-expanded'), 'false'); assert.equal(dom.window.document.activeElement, chat.history);
    assert.equal(chat.input.value, 'まだ送らない依頼'); assert.match(chat.messages.textContent, /以前の回答/);
    assert.equal(chat.historyList.querySelector('button').getAttribute('aria-current'), 'true');
    assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
});

test('履歴の取得失敗時は側面を閉じず、閉じる操作とEscapeは草稿や会話を変更しない', async () => {
    const { chat, dom, calls } = await fixture((url, options) => url.endsWith('/history') ? options.body.conversation_id
        ? Promise.reject(new Error('この会話を読み込めませんでした。')) : { conversations: [{ identify: conversation, title: '保存した会話' }] } : undefined);
    chat.input.value = '保持する草稿'; chat.history.click(); chat.historyList.querySelector('button').click(); await tick(); await tick();
    assert.equal(chat.historyPanel.hidden, false); assert.match(chat.historyStatus.textContent, /読み込めません/);
    assert.equal(chat.input.value, '保持する草稿'); assert.equal(chat.conversationId, null);
    const escape = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }); chat.historyClose.dispatchEvent(escape);
    assert.equal(escape.defaultPrevented, true); assert.equal(chat.historyPanel.hidden, true);
    chat.history.click(); chat.historyClose.click(); assert.equal(chat.historyPanel.hidden, true);
    assert.equal(chat.input.value, '保持する草稿'); assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
});

test('ページと側窓を同時に置いても、設定AI・草稿・会話履歴を混ぜず利用者に切替を出さない', async () => {
    const { chat, calls, dom } = await fixture((url, options) => url.endsWith('/state') ? { agents: [{ alias: 'assistant', name: '確認AI' }, { alias: 'editor', name: '文章AI' }],
        surfaces: [{ name: 'page', enabled: true, alias: 'assistant' }, { name: 'floating', enabled: true, alias: 'editor' }], actions: [] }
        : url.endsWith('/history') ? { conversations: [{ identify: options.body.alias === 'editor' ? id : conversation, title: options.body.alias === 'editor' ? '文章の相談' : '情報の相談' }] } : undefined);
    chat.input.value = 'ページの草稿';
    const second = dom.window.document.createElement('fourmix-intelligence-chat'); second.setAttribute('surface', 'floating'); second.setAttribute('alias', 'assistant'); dom.window.document.body.append(second); await tick(); await tick();
    assert.equal(second.activeAlias, 'editor'); assert.equal(second.agentTitle.textContent, '文章AI'); assert.equal(second.toolbar.querySelectorAll('select').length, 0);
    second.input.value = '側窓の草稿'; second.history.click(); await second.historyList.querySelector('button').onclick();
    assert.match(second.historyList.textContent, /文章の相談/); assert.equal(second.historyList.textContent.includes('情報の相談'), false);
    assert.equal(chat.input.value, 'ページの草稿'); assert.equal(second.input.value, '側窓の草稿'); assert.equal(chat.conversationId, null); assert.equal(second.conversationId, id);
    assert.equal(calls.filter(call => call.url.endsWith('/history')).at(-1).options.body.alias, 'editor');
    assert.equal(calls.filter(call => call.url.endsWith('/history')).at(-1).options.body.surface, 'floating');
});

test('無効なsurfaceでは別AIへフォールバックせず、入力を無効にして設定へ案内する', async () => {
    const { chat, calls } = await fixture(url => url.endsWith('/state') ? { agents: [{ alias: 'assistant', name: '利用できるAI' }], surfaces: [{ name: 'page', enabled: false, alias: 'assistant' }], actions: [] } : undefined, { surface: 'page' });
    assert.equal(chat.activeAlias, ''); assert.equal(chat.input.disabled, true); assert.equal(chat.submit.disabled, true); assert.match(chat.notice.textContent, /無効/); assert.equal(chat.setupLink.hidden, false);
    assert.equal(calls.some(call => call.url.endsWith('/history') || call.url.includes('/attachments?') || call.url.endsWith('/chat')), false);
});

test('管理で接続またはAIを変更した後の再読込は旧会話を引き継がず草稿を保持する', async () => {
    let grant = 'first'; const { chat } = await fixture(url => url.endsWith('/state') ? { agents: [{ alias: 'assistant', name: '確認AI', connection_id: 'one', grant_id: grant }], actions: [] } : undefined);
    chat.conversationId = conversation; chat.message('assistant', '古い回答'); chat.input.value = '変更前の草稿'; grant = 'second'; await chat.recover();
    assert.equal(chat.conversationId, null); assert.equal(chat.messages.childNodes.length, 0); assert.equal(chat.input.value, '変更前の草稿');
});

test('設定AIのsnapshotを会話・履歴・添付の各要求へ固定して渡す', async () => {
    const expected = { connection_id: id, grant_id: conversation, connection_revision: 4 };
    const { chat, calls, file } = await fixture(url => url.endsWith('/state') ? { agents: [{ alias: 'assistant', name: '確認AI', ...expected }], actions: [] } : undefined);
    const api = chat.api; await api.history('assistant'); await api.ask('assistant', '確認依頼');
    await api.uploadAttachment('assistant', file(), { conversationId: conversation, requestId: id });
    await api.deleteAttachment('assistant', conversation, id);
    for (const call of calls.filter(item => item.url.endsWith('/history') || item.url.endsWith('/chat') || item.options.method === 'DELETE')) {
        assert.equal(JSON.stringify(call.options.body.expected_selection), JSON.stringify(expected));
    }
    const upload = calls.find(call => call.url.endsWith('/attachments') && call.options.method === 'POST');
    for (const [key, value] of Object.entries(expected)) assert.equal(upload.options.body.get(`expected_selection[${key}]`), String(value));
    for (const raw of [calls.find(call => call.url.includes('/attachments?')).url, api.attachmentUrl('assistant', conversation, id)]) {
        const url = new URL(raw, 'https://app.example.test');
        for (const [key, value] of Object.entries(expected)) assert.equal(url.searchParams.get(`expected_selection[${key}]`), String(value));
    }
    expected.grant_id = 'mutated'; assert.equal(api.expectedSelection.grant_id, conversation);
});

test('別画面からAI変更通知を受けた草稿は自動送信せず、本人の再読込後だけ新しいsnapshotに更新する', async () => {
    let revision = 1; const { chat, calls, dom } = await fixture(url => url.endsWith('/state') ? {
        agents: [{ alias: 'assistant', name: `確認AI${revision}`, connection_id: id, grant_id: conversation, connection_revision: revision }],
        surfaces: [{ name: 'page', enabled: true, alias: 'assistant' }], actions: [],
    } : undefined, { surface: 'page' });
    chat.input.value = 'AI変更前の草稿'; revision = 2;
    dom.window.dispatchEvent(new dom.window.CustomEvent('fourmix:surfaces', { detail: [{ name: 'page', enabled: true, connection_id: id, grant_id: conversation, connection_revision: 2 }] }));
    assert.equal(chat.submit.disabled, true); assert.equal(chat.api.expectedSelection.connection_revision, 1); assert.match(chat.notice.textContent, /再読み込み/);
    await chat.send(); assert.equal(calls.some(call => call.url.endsWith('/chat')), false); assert.equal(chat.input.value, 'AI変更前の草稿');
    await chat.recover(); assert.equal(chat.api.expectedSelection.connection_revision, 2); assert.equal(chat.agentTitle.textContent, '確認AI2');
    assert.equal(chat.input.value, 'AI変更前の草稿'); assert.equal(chat.submit.disabled, false); assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
});

test('別タブのAI変更をserver409で検出した場合も草稿を保持して自動再送しない', async () => {
    const conflict = Object.assign(new Error('チャットのAI設定が変更されました。入力内容を確認して画面を再読み込みしてください。'), { status: 409 });
    const { chat, calls } = await fixture(url => url.endsWith('/chat') ? Promise.reject(conflict) : undefined);
    chat.input.value = '以前のAIへの依頼'; await chat.send(); await chat.send();
    assert.equal(chat.selectionStale, true); assert.equal(chat.submit.disabled, true); assert.equal(chat.retry.disabled, false);
    assert.equal(chat.input.value, '以前のAIへの依頼'); assert.match(chat.notice.textContent, /再読み込み/);
    assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
});

test('浮動ウィンドウの履歴は軽量メニューで開き、宿主の指定で側面にも変更できる', async () => {
    const { chat: initial, dom, context, dependency } = await fixture(); initial.remove();
    const floating = new vm.SourceTextModule(await readFile(new URL('../../resources/js/floating.js', import.meta.url), 'utf8'), { context }); await floating.link(() => dependency); await floating.evaluate();
    const widget = dom.window.document.createElement('fourmix-intelligence-floating-chat'); widget.setAttribute('alias', 'assistant'); dom.window.document.body.append(widget); widget.open(); await tick(); await tick();
    assert.equal(widget.chat.historyLayout, 'dropdown'); widget.chat.history.click(); assert.equal(widget.chat.historyPanel.hidden, false);
    assert.equal(widget.chat.historyPanel.querySelector('.fi-chat-history-backdrop'), null); assert.match(widget.chat.historyStatus.textContent, /まだありません/);
    widget.chat.historyClose.click(); assert.equal(widget.dialog.open, true); assert.equal(widget.chat.historyPanel.hidden, true);
    const custom = dom.window.document.createElement('fourmix-intelligence-floating-chat'); custom.setAttribute('alias', 'assistant'); custom.setAttribute('history-layout', 'drawer'); dom.window.document.body.append(custom); custom.open(); await tick(); await tick();
    assert.equal(custom.chat.historyLayout, 'drawer'); assert.ok(custom.chat.historyPanel.querySelector('.fi-chat-history-backdrop'));
});

test('浮動画面の入力は独立画面より低い上限で伸び、宿主の指定と再開時の草稿を保つ', async () => {
    const { chat: page, dom, context, dependency } = await fixture();
    Object.defineProperty(page.input, 'scrollHeight', { get: () => 260 }); page.resizeInput(); assert.equal(page.input.style.height, '160px');
    const floating = new vm.SourceTextModule(await readFile(new URL('../../resources/js/floating.js', import.meta.url), 'utf8'), { context }); await floating.link(() => dependency); await floating.evaluate();
    const widget = dom.window.document.createElement('fourmix-intelligence-floating-chat'); widget.setAttribute('alias', 'assistant'); dom.window.document.body.append(widget); widget.open(); await tick(); await tick();
    assert.equal(widget.chat.getAttribute('presentation'), 'floating'); assert.equal(page.getAttribute('presentation'), null);
    Object.defineProperty(widget.chat.input, 'scrollHeight', { get: () => 260 }); widget.chat.input.value = '入力中の長い依頼'; widget.chat.resizeInput();
    assert.equal(widget.chat.input.rows, 1); assert.equal(widget.chat.input.style.height, '112px'); assert.equal(widget.chat.input.style.overflowY, 'auto');
    widget.setAttribute('composer-max-height', '160'); widget.chat.resizeInput(); assert.equal(widget.chat.input.style.height, '160px');
    widget.close(); widget.open(); assert.equal(widget.chat.input.value, '入力中の長い依頼'); assert.equal(widget.chat.input.style.height, '160px');
    assert.equal(page.input.style.height, '160px');
});

test('FinCubeと同じ一列の入力で添付を折り畳み、応答中は送信の位置に停止だけを表示する', async () => {
    const response = deferred(); const { chat, calls } = await fixture(url => url.endsWith('/chat') ? response.promise : undefined);
    const row = chat.input.closest('.fi-chat-composer-row'); assert.ok(row);
    assert.equal(chat.additions.parentElement, row); assert.equal(chat.submit.parentElement, row); assert.equal(chat.cancel.parentElement, row);
    assert.equal(chat.submit.textContent, ''); assert.equal(chat.submit.getAttribute('aria-label'), '送信'); assert.equal(chat.additions.open, false);
    assert.equal(chat.additions.contains(chat.attachButton), true); assert.equal(chat.additions.contains(chat.storedButton), true);
    chat.additions.open = true; chat.attachButton.click(); assert.equal(chat.additions.open, false); assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
    chat.input.value = '確認してください'; const sending = chat.send(); await tick();
    assert.equal(chat.submit.hidden, true); assert.equal(chat.cancel.hidden, false); assert.equal(chat.cancel.textContent, '');
    assert.equal(chat.cancel.getAttribute('aria-label'), '応答の待機をやめる');
    response.resolve({ conversation_id: conversation, result: { answer: '確認しました。' } }); await sending;
    assert.equal(chat.submit.hidden, false); assert.equal(chat.cancel.hidden, true); assert.equal(chat.input.value, '');
});

test('入力欄は一行から上限まで伸び、送信後に縮み、添付の利用条件は閉じたヘルプに置く', async () => {
    const { chat } = await fixture(undefined, { 'composer-max-height': '100', 'input-placeholder': '確認したい内容を入力' });
    assert.equal(chat.input.rows, 1);
    assert.equal(chat.input.placeholder, '確認したい内容を入力');
    assert.equal(chat.attachmentHelp.parentElement.tagName, 'DETAILS');
    assert.equal(chat.attachmentHelp.parentElement.open, false);
    assert.equal(chat.attachButton.getAttribute('aria-label'), 'ファイルを添付');
    assert.equal(chat.storedButton.getAttribute('aria-label'), '保存済みファイル');
    let height = 240;
    Object.defineProperty(chat.input, 'scrollHeight', { get: () => height });
    chat.input.value = '長い依頼'; chat.input.oninput();
    assert.equal(chat.input.style.height, '100px');
    assert.equal(chat.input.style.overflowY, 'auto');
    height = 40; await chat.send();
    assert.equal(chat.input.value, '');
    assert.equal(chat.input.style.height, '40px');
    assert.equal(chat.input.style.overflowY, 'hidden');
});

test('初回添付はモデルを呼ばず空の会話を作り、続く添付をその会話へ順番にアップロードする', async () => {
    const first = deferred(); let uploads = 0;
    const { chat, file, calls } = await fixture((url, options) => url.endsWith('/attachments') && options.method === 'POST' ? ++uploads === 1 ? first.promise : { conversation_id: conversation, attachment: { ...metadata, id: '32345678-1234-4234-8234-123456789012', name: '次の資料.pdf' } } : undefined);
    const uploading = chat.addFiles([file(), file('次の資料.pdf', 'pdf', 'application/pdf')]); await tick();
    for (const control of ['submit', 'fresh', 'history', 'attachButton']) assert.equal(chat[control].disabled, true);
    assert.equal(uploads, 1); assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
    first.resolve({ conversation_id: conversation, attachment: metadata }); await uploading;
    const sent = calls.filter(call => call.url.endsWith('/attachments') && call.options.method === 'POST'); assert.equal(sent.length, 2);
    assert.equal(sent[0].options.body.get('conversation_id'), null); assert.equal(sent[1].options.body.get('conversation_id'), conversation);
    assert.equal(chat.attachments.every(entry => entry.state === 'uploaded'), true); assert.equal(chat.submit.disabled, false);
    await chat.send(); const ask = calls.find(call => call.url.endsWith('/chat'));
    assert.equal(ask.options.body.conversation_id, conversation); assert.equal(ask.options.body.attachment_ids.length, 2); assert.match(ask.options.body.message, /添付ファイル/);
    assert.equal(chat.attachments.length, 0);
});

test('結果不明のアップロードは自動再送せず、明示的な再試行で同じUUIDと元の会話指定を維持する', async () => {
    let uploads = 0;
    const error = Object.assign(new Error('保存結果を確認してください。'), { status: 409, data: { state: 'unknown', conversation_id: conversation } });
    const { chat, file, calls } = await fixture((url, options) => url.endsWith('/attachments') && options.method === 'POST' ? ++uploads === 1 ? Promise.reject(error) : { conversation_id: conversation, attachment: metadata } : undefined);
    chat.input.value = '残す草稿'; await chat.addFiles([file()]); assert.equal(chat.attachments[0].state, 'unknown'); assert.equal(chat.conversationId, conversation);
    assert.equal(chat.submit.disabled, true); await chat.send(); await chat.recover(); assert.equal(uploads, 1); assert.equal(chat.input.value, '残す草稿');
    await chat.uploadEntries([chat.attachments[0]]); assert.equal(uploads, 2); assert.equal(chat.attachments[0].state, 'uploaded');
    const sent = calls.filter(call => call.url.endsWith('/attachments') && call.options.method === 'POST'); assert.equal(sent[0].options.body.get('request_id'), sent[1].options.body.get('request_id'));
    assert.equal(sent[0].options.body.get('conversation_id'), null); assert.equal(sent[1].options.body.get('conversation_id'), null);
});

test('policyの形式・サイズ・送信する件数を超える添付を送らず、文字の会話は引き続き使える', async () => {
    const { chat, file, calls } = await fixture(); await chat.addFiles([file('script.svg', 'svg', 'image/svg+xml')]); await chat.addFiles([file('大きい.pdf', 'x'.repeat(1001), 'application/pdf')]);
    assert.equal(calls.some(call => call.options.method === 'POST' && call.url.endsWith('/attachments')), false);
    chat.attachments = Array.from({ length: 5 }, (_, index) => ({ state: 'uploaded', attachment: { ...metadata, id: String(index) } })); await chat.addFiles([file()]); assert.match(chat.notice.textContent, /最大5件/); chat.clearAttachments();
    chat.input.value = '文字で相談'; await chat.send(); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
});

test('過去の保存ファイルが6件あっても、今回の送信上限内なら同じ会話で新しい添付を保存できる', async () => {
    const saved = Array.from({ length: 6 }, (_, index) => ({ ...metadata, id: `4000000${index}-1234-4234-8234-123456789012` }));
    const { chat, file, calls } = await fixture(url => url.includes('/attachments?') ? { policy, data: saved } : undefined, { 'conversation-id': conversation });
    assert.equal(chat.attachmentMetadata.size, 6); assert.match(chat.attachmentHelp.textContent, /1回の送信は最大5件/);
    await chat.addFiles([file()]); assert.equal(chat.attachments.length, 1); assert.equal(chat.attachments[0].state, 'uploaded');
    assert.equal(calls.filter(call => call.url.endsWith('/attachments') && call.options.method === 'POST').length, 1);
});

test('保存済み一覧から複数ファイルを選べるが、今回の選択を最大件数より増やさない', async () => {
    const saved = Array.from({ length: 6 }, (_, index) => ({ ...metadata, id: `4000000${index}-1234-4234-8234-123456789012` }));
    const { chat } = await fixture(url => url.includes('/attachments?') ? { policy, data: saved } : undefined, { 'conversation-id': conversation });
    await chat.checkAttachments(); const choices = [...chat.storedAttachments.querySelectorAll('button')];
    for (const button of choices) button.click(); assert.equal(chat.attachments.length, 5); assert.equal(chat.storedAttachments.hidden, false); assert.match(chat.notice.textContent, /最大5件/);
    assert.equal(choices[0].disabled, true); assert.equal(choices[0].textContent, '選択済み');
});

test('アップロード済みの選択を外してもDELETEせず、画像の一時URLを解放する', async () => {
    const { chat, file, calls, revoked } = await fixture(); await chat.addFiles([file()]);
    [...chat.attachmentCards.querySelectorAll('button')].find(button => button.textContent === '選択を外す').click();
    assert.equal(chat.attachments.length, 0); assert.deepEqual(revoked, ['blob:synthetic-preview']); assert.equal(calls.some(call => call.options.method === 'DELETE'), false);
    assert.equal(chat.attachmentMetadata.size, 1);
});

test('会話履歴の添付は現在のaliasに結び付く私有URLで表示し、期限切れのファイルは取得しない', async () => {
    const { chat } = await fixture((url, options) => url.includes('/attachments?') ? { policy, data: [metadata, { ...metadata, id: 'expired', name: '古い.pdf', mime: 'application/pdf', expires_at: 1 }] }
        : url.endsWith('/history') && options.body.conversation_id ? { messages: [{ role: 'user', content: '資料の確認', attachment_ids: [id, 'expired'] }] } : undefined, { 'conversation-id': conversation });
    const link = chat.messages.querySelector('.fi-attachment-link'); const attachmentURL = new URL(link.href); assert.ok(attachmentURL.pathname.endsWith(`/attachments/${conversation}/${id}/content`)); assert.equal(attachmentURL.searchParams.get('alias'), 'assistant'); assert.equal(attachmentURL.searchParams.get('surface'), 'page');
    assert.equal(chat.messages.querySelector('img').src, link.href); assert.match(chat.messages.textContent, /利用期限切れ/); assert.equal(chat.messages.querySelectorAll('a').length, 1);
});

test('送信直後に入力を空にし、応答を待つ間に書いた次の依頼を消さない', async () => {
    const wait = deferred(); const { chat, calls } = await fixture(url => url.endsWith('/chat') ? wait.promise : undefined);
    chat.input.value = '送信する依頼'; const sending = chat.send(); await tick();
    assert.equal(chat.input.value, ''); assert.match(chat.messages.textContent, /送信する依頼/);
    chat.input.value = '次の依頼'; wait.resolve({ conversation_id: conversation, result: { answer: '受信しました。' } }); await sending;
    assert.equal(chat.input.value, '次の依頼'); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
});

test('実際の状態と本文を逐次表示し、実時間の秒数を更新して完了後は計時を止める', async () => {
    const wait = deferred(); let progress;
    const { chat, dom } = await fixture((url, options) => { if (url.endsWith('/chat')) { progress = options.onEvent; return wait.promise; } });
    let now = 0, timer, stopped = false;
    Object.defineProperty(dom.window.performance, 'now', { value: () => now });
    dom.window.setInterval = callback => { timer = callback; return 7; }; dom.window.clearInterval = () => { stopped = true; };
    chat.input.value = '合成の相談'; const sending = chat.send();
    assert.equal(chat.progress.hidden, false); assert.equal(chat.progressTime.textContent, '0秒');
    progress({ type: 'run.created', data: { conversation_id: conversation } });
    progress({ type: 'run.status', data: { message: '必要な情報を取得・確認しています' } });
    assert.match(chat.progressLabel.textContent, /必要な情報/); assert.equal(chat.conversationId, conversation);
    now = 4200; timer(); assert.equal(chat.progressTime.textContent, '4秒');
    progress({ type: 'assistant.delta', data: { text: '途中の' } }); progress({ type: 'assistant.delta', data: { text: '回答' } });
    await new Promise(resolve => setTimeout(resolve, 130));
    assert.match(chat.messages.textContent, /途中の回答/); assert.equal(chat.messages.querySelectorAll('article').length, 2);
    chat.input.value = '次の相談'; wait.resolve({ conversation_id: conversation, result: { answer: '完成した回答' } }); await sending;
    assert.equal(stopped, true); assert.equal(chat.progressTime.textContent, '4秒'); assert.equal(chat.progressLabel.textContent, '回答が完了しました');
    now = 12000; chat.stopProgress();
    assert.equal(chat.progressTime.textContent, '4秒');
    assert.equal(chat.progressActivity.classList.contains('fi:motion-safe:animate-pulse'), false);
    assert.match(chat.messages.textContent, /完成した回答/); assert.equal(chat.messages.textContent.includes('途中の回答'), false);
    assert.equal(chat.messages.querySelectorAll('article').length, 2); assert.equal(chat.input.value, '次の相談');
});

test('流式応答が中断しても途中の本文を保持し、完了を装わず同じ操作を再送しない', async () => {
    const wait = deferred(); let progress;
    const { chat, calls } = await fixture((url, options) => { if (url.endsWith('/chat')) { progress = options.onEvent; return wait.promise; } });
    chat.input.value = '合成の相談'; const sending = chat.send();
    progress({ type: 'assistant.delta', data: { text: '<img src=x onerror=alert(1)>途中' } });
    assert.equal(chat.messages.querySelector('img'), null);
    wait.reject(new DOMException('停止', 'AbortError')); await sending;
    assert.match(chat.messages.textContent, /途中まで受信した回答/); assert.equal(chat.progressLabel.textContent, '待機を終了しました');
    assert.equal(chat.progressTimer, null); assert.equal(chat.input.value, '合成の相談'); assert.equal(chat.sendUncertain, true);
    await chat.send(); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
});

test('別画面で承認して戻ると実行結果を取得し、依頼を再送しない', async () => {
    const { chat, dom, calls } = await fixture((url, options) => url.endsWith('/history') && options.body.conversation_id
        ? { messages: [{ role: 'assistant', content: '業務操作が完了しました。' }], has_more: false } : undefined, { 'conversation-id': conversation });
    chat.input.value = 'まだ送らない依頼'; dom.window.dispatchEvent(new dom.window.Event('focus')); await tick(); await tick();
    assert.match(chat.messages.textContent, /業務操作が完了/); assert.equal(chat.input.value, 'まだ送らない依頼');
    assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
});

test('実行結果はAIの発言と区別し、保存案内と結果リンクを表示して技術的な詳細を折り畳む', async () => {
    const { chat } = await fixture((url, options) => url.endsWith('/history') && options.body.conversation_id
        ? { messages: [{ role: 'assistant', content: '業務操作が完了しました。内部結果の原文', application_receipt: { id: 'review-1', state: 'succeeded', operation: 'notes.create', data: { message: '備忘を保存しました。', url: '/notes/7', note: { id: 7 } } } }], has_more: false }
        : undefined, { 'conversation-id': conversation });
    assert.match(chat.messages.textContent, /このアプリケーション/); assert.match(chat.messages.textContent, /備忘を保存しました/);
    assert.equal(chat.messages.querySelector('a').href, 'https://app.example.test/notes/7');
    assert.equal(chat.messages.querySelector('details').open, false);
    assert.equal(chat.messages.textContent.includes('内部結果の原文'), false);
});

test('送信に失敗した場合も草稿と添付を保持し、履歴を確認するまで同じ依頼を繰り返さない', async () => {
    const { chat, file, calls } = await fixture(url => url.endsWith('/chat') ? Promise.reject(new Error('通信できませんでした。')) : undefined);
    await chat.addFiles([file()]); chat.input.value = 'この資料で業務を確認'; await chat.send();
    assert.equal(chat.input.value, 'この資料で業務を確認'); assert.equal(chat.attachments.length, 1); assert.equal(chat.submit.disabled, true);
    await chat.send(); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
    await chat.recover(); assert.equal(chat.sendUncertain, false); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1); assert.equal(chat.input.value, 'この資料で業務を確認');
});

test('業務contextを実際に送り、巨大なcontextは送らず、Markdown設定を各チャットに適用する', async () => {
    const { chat, calls, rendering, disposed, dom } = await fixture(undefined, { context: '{"record_id":1}' }); chat.context = { record_id: 2 }; chat.input.value = '確認'; await chat.send();
    assert.equal(calls.find(call => call.url.endsWith('/chat')).options.body.context.record_id, 2); assert.equal(rendering[0].attachmentUrlPrefixes[0], '/fourmix-intelligence/attachments/');
    assert.equal(chat.messages.querySelector('.fi-markdown').options.attachmentUrlPrefixes[0], '/fourmix-intelligence/attachments/');
    chat.context = { text: '大'.repeat(6000) }; chat.input.value = '残す'; await chat.send(); assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1); assert.equal(chat.input.value, '残す');
    chat.fresh.click(); await tick(); assert.ok(disposed.includes('確認しました。'));
    const renderingApi = dom.window.FourmixIntelligenceSDK.Rendering; assert.equal(typeof renderingApi.render, 'function'); assert.equal(typeof renderingApi.configure, 'function');
});

test('ファイル貼付けとdropを受け付け、追加中は履歴・AI切替を変更しない', async () => {
    const wait = deferred(); const { chat, file, dom, calls } = await fixture((url, options) => url.endsWith('/attachments') && options.method === 'POST' ? wait.promise : undefined);
    const paste = new dom.window.Event('paste', { cancelable: true }); Object.defineProperty(paste, 'clipboardData', { value: { files: [file()] } }); chat.input.dispatchEvent(paste); await tick(); assert.equal(paste.defaultPrevented, true);
    chat.fresh.click(); assert.equal(chat.uploading, true); assert.equal(calls.filter(call => call.url.endsWith('/attachments') && call.options.method === 'POST').length, 1);
    wait.resolve({ conversation_id: conversation, attachment: metadata }); await tick(); await tick();
    const drop = new dom.window.Event('drop', { cancelable: true }); Object.defineProperty(drop, 'dataTransfer', { value: { files: [file('drop.pdf', 'pdf', 'application/pdf')] } }); chat.input.closest('form').dispatchEvent(drop); await tick(); assert.equal(drop.defaultPrevented, true);
});

test('実際のフローティングチャットを閉じてもアップロードを中止せず、開き直しても会話を再初期化しない', async () => {
    const wait = deferred(); const { chat: initial, dom, context, dependency, calls, file } = await fixture((url, options) => url.endsWith('/attachments') && options.method === 'POST' ? wait.promise : undefined);
    initial.remove();
    const floating = new vm.SourceTextModule(await readFile(new URL('../../resources/js/floating.js', import.meta.url), 'utf8'), { context }); await floating.link(() => dependency); await floating.evaluate();
    const widget = dom.window.document.createElement('fourmix-intelligence-floating-chat'); widget.setAttribute('alias', 'assistant'); dom.window.document.body.append(widget); widget.open(); await tick(); await tick();
    const chat = widget.chat; chat.input.value = '確認前の草稿'; const upload = chat.addFiles([file()]); await tick();
    const signal = calls.find(call => call.url.endsWith('/attachments') && call.options.method === 'POST').options.signal;
    const stateReads = calls.filter(call => call.url.endsWith('/state')).length; widget.close(); assert.equal(signal.aborted, false); assert.equal(chat.isConnected, true);
    widget.open(); assert.equal(widget.chat, chat); assert.equal(chat.input.value, '確認前の草稿'); assert.equal(chat.uploading, true); assert.equal(calls.filter(call => call.url.endsWith('/state')).length, stateReads);
    wait.resolve({ conversation_id: conversation, attachment: metadata }); await upload; assert.equal(chat.attachments[0].attachment.id, id); assert.equal(chat.conversationId, conversation);
});

test('公開APIはmultipartアップロードと明示削除を提供し、API用の秘密を添付URLに含めない', async () => {
    const { module, file, calls } = await fixture(); const api = new module.namespace.FourmixIntelligenceUI('/custom-ai', 'synthetic-csrf');
    await api.uploadAttachment('assistant', file(), { conversationId: conversation, requestId: id });
    const upload = calls.find(call => call.url === '/custom-ai/attachments'); assert.equal(upload.options.body.get('file').name, '確認資料.png'); assert.equal(upload.options.body.get('alias'), 'assistant'); assert.equal(upload.options.body.get('request_id'), id); assert.equal(upload.options.csrfToken, 'synthetic-csrf');
    assert.equal(api.attachmentUrl('assistant', conversation, id), `/custom-ai/attachments/${conversation}/${id}/content?surface=page&alias=assistant`); assert.equal(upload.options.body.get('surface'), 'page');
    await api.deleteAttachment('assistant', conversation, id); const deletion = calls.find(call => call.options.method === 'DELETE'); assert.equal(deletion.options.body.alias, 'assistant');
});

test('添付の取得に失敗しても文字の会話は使え、ファイル名をHTMLとして表示しない', async () => {
    const text = await fixture(url => url.includes('/attachments?') ? Promise.reject(new Error('添付の条件を取得できません。')) : undefined);
    assert.equal(text.chat.ready, true); assert.equal(text.chat.attachButton.disabled, true); assert.match(text.chat.notice.textContent, /文字での会話は利用できます/);
    text.chat.input.value = '文字だけの相談'; await text.chat.send(); assert.equal(text.calls.filter(call => call.url.endsWith('/chat')).length, 1);
    const name = '<img src=x onerror=alert(1)>.pdf';
    const { chat, file } = await fixture((url, options) => url.endsWith('/attachments') && options.method === 'POST' ? { conversation_id: conversation, attachment: { ...metadata, name, mime: 'application/pdf' } } : undefined);
    await chat.addFiles([file(name, 'pdf', 'application/pdf')]); assert.match(chat.attachmentCards.textContent, /<img src=x onerror=alert\(1\)>/); assert.equal(chat.attachmentCards.querySelectorAll('img,script').length, 0);
});
