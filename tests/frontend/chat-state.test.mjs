import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

class Element {
    constructor(tag = 'element') { this.tag = tag; this.children = []; this.attributes = {}; this.value = ''; this.classList = { add() {}, remove() {} }; }
    get childNodes() { return this.children; }
    append(...children) { this.children.push(...children); if (this.tag === 'select' && !this.value) this.value = this.children[0]?.value || ''; }
    replaceChildren(...children) { this.children = []; if (this.tag === 'select') this.value = ''; this.append(...children); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    dispatchEvent() { return true; }
    scrollIntoView() {}
    querySelectorAll() { return []; }
}

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const state = { agents: [{ alias: 'assistant' }], actions: [], timezone: 'Asia/Tokyo' };

test('接続の業務権限が空なら会話のみと表示し、接続設定へ案内する', async () => {
    const conversationState = { ...state, agents: [{ alias: 'assistant', connection_id: 'one' }], connections: [{ id: 'one', permissions: {} }] };
    const { chat, calls } = await fixture(url => Promise.resolve(url.endsWith('/state') ? conversationState : { conversations: [] }));
    await tick(); await tick();

    assert.equal(chat.businessStatus.hidden, false);
    assert.equal(chat.businessStatus.textContent, '会話のみ');
    assert.equal(chat.businessStatus.href, '/fourmix-intelligence#fi-connections');
    assert.equal(chat.submit.disabled, false);
    assert.equal(calls.some(call => call.options?.method === 'PUT'), false);
});

test('接続に業務を許可した場合は会話のみの案内を隠す', async () => {
    let permissions = { 'records.lookup': 'disabled' };
    const { chat } = await fixture(url => Promise.resolve(url.endsWith('/state') ? { ...state, agents: [{ alias: 'assistant', connection_id: 'one' }], connections: [{ id: 'one', permissions }] } : { conversations: [] }));
    await tick(); await tick();

    assert.equal(chat.businessStatus.textContent, '会話のみ');
    assert.equal(chat.businessStatus.hidden, false);
    assert.equal(chat.businessStatus.href, '/fourmix-intelligence#fi-connections');
    permissions = { 'records.lookup': 'review' };
    await chat.recover();
    assert.equal(chat.businessStatus.hidden, true);
});

async function fixture(handler, conversationId, alias = 'assistant') {
    const calls = [];
    const context = vm.createContext({
        HTMLElement: Element, window: {}, document: { defaultView: { addEventListener() {}, removeEventListener() {}, performance: { now: () => 0 }, setInterval: () => 1, clearInterval() {} }, createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag) },
        customElements: { get() {}, define() {} }, AbortController, URLSearchParams, TextEncoder,
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    });
    const dependency = new vm.SyntheticModule(['request'], function () {
        this.setExport('request', (url, options) => { calls.push({ url, options }); return url.includes('/attachments?') ? Promise.resolve({ data: [], policy: { extensions: ['png', 'pdf'], max_bytes: 1000000, max_files: 5 } }) : handler(url, options); });
    }, { context });
    const markdown = new vm.SyntheticModule(['renderMarkdown', 'configureRendering'], function () {
        this.setExport('renderMarkdown', text => { const element = new Element('div'); element.textContent = text; return element; });
        this.setExport('configureRendering', () => {});
    }, { context });
    const source = await readFile(new URL('../../resources/js/chat.js', import.meta.url), 'utf8');
    const module = new vm.SourceTextModule(source, { context });
    await module.link(specifier => specifier === './markdown.js' ? markdown : dependency);
    await module.evaluate();
    const chat = new module.namespace.FourmixIntelligenceChat();
    if (alias) chat.setAttribute('alias', alias);
    if (conversationId) chat.setAttribute('conversation-id', conversationId);
    chat.connectedCallback();
    chat.input.value = '保存前の依頼';
    return { chat, calls };
}

function assertBusy(chat) {
    assert.equal(chat.panel.attributes['aria-busy'], 'true');
    for (const control of ['submit', 'fresh', 'retry', 'history', 'more']) {
        assert.equal(chat[control].disabled, true, `${control} must stay disabled until initialization completes`);
    }
}

test('AI未選択では添付の確認中表示を残さず、送信・添付を無効にする', async () => {
    const { chat, calls } = await fixture(() => Promise.resolve({ ...state, agents: [] }), undefined, '');
    await tick();
    assert.match(chat.attachmentHelp.textContent, /AIを設定すると/);
    assert.equal(chat.attachButton.disabled, true);
    assert.equal(chat.submit.disabled, true);
    assert.equal(chat.attachmentPolicy, null);
    assert.equal(chat.activeAlias, ''); assert.equal(chat.input.disabled, true); assert.equal(chat.setupLink.hidden, false);
    assert.equal(calls.some(call => call.url.includes('/attachments?')), false);
});

test('AI選択後も会話一覧と確認状態の取得が終わるまで送信・切替を受け付けない', async () => {
    const history = deferred(), approvals = deferred();
    const { chat, calls } = await fixture(url => url.endsWith('/state') ? Promise.resolve(state)
        : url.endsWith('/history') ? history.promise : Promise.resolve({ result: { answer: '応答' } }), 'conversation-1');
    chat.pending = () => approvals.promise;
    await tick();
    assert.equal(chat.activeAlias, 'assistant');
    assertBusy(chat);
    assert.equal(chat.notice.hidden, false);
    assert.match(chat.notice.textContent, /確認しています/);
    await chat.send();
    chat.fresh.onclick();
    await chat.history.onclick();
    assert.equal(chat.conversationId, 'conversation-1');
    assert.equal(chat.input.value, '保存前の依頼');
    assert.equal(calls.filter(call => call.url.endsWith('/history')).length, 1);
    assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
    history.resolve({ conversations: [], messages: [] });
    await tick();
    assertBusy(chat);
    approvals.resolve();
    await tick();
    assert.equal(chat.ready, true);
    assert.equal(chat.panel.attributes['aria-busy'], 'false');
    assert.equal(chat.submit.disabled, false);
    assert.equal(chat.fresh.disabled, false);
    await chat.send();
    assert.equal(calls.filter(call => call.url.endsWith('/chat')).length, 1);
    assert.equal(chat.empty.hidden, true);
    assert.equal(chat.messages.hidden, false);
});

test('会話メッセージの読込み中も初期化のロックを維持する', async () => {
    const messages = deferred();
    const { chat, calls } = await fixture((url, options) => url.endsWith('/state') ? Promise.resolve(state)
        : options.body.conversation_id ? messages.promise : Promise.resolve({ conversations: [] }), 'conversation-1');
    await tick();
    assert.equal(calls.filter(call => call.url.endsWith('/history')).length, 2);
    assertBusy(chat);
    messages.resolve({ messages: [{ role: 'user', content: '以前の依頼' }], has_more: false });
    await tick();
    assert.equal(chat.submit.disabled, false);
    assert.equal(chat.history.disabled, false);
    assert.equal(chat.input.value, '保存前の依頼');
});

test('履歴の初期取得に失敗した場合は読込みだけ再試行でき、業務依頼は再送しない', async () => {
    let failed = true;
    const { chat, calls } = await fixture(url => url.endsWith('/state') ? Promise.resolve(state)
        : failed ? Promise.reject(new Error('履歴を取得できませんでした。')) : Promise.resolve({ conversations: [] }));
    await tick();
    assert.equal(chat.ready, false);
    assert.equal(chat.submit.disabled, true);
    assert.equal(chat.retry.disabled, false);
    assert.equal(chat.fresh.disabled, false);
    assert.equal(chat.notice.attributes.role, 'alert');
    assert.equal(chat.notice.hidden, false);
    assert.equal(chat.empty.hidden, false);
    await chat.send();
    assert.equal(chat.input.value, '保存前の依頼');
    failed = false;
    await chat.retry.onclick();
    assert.equal(chat.ready, true);
    assert.equal(chat.submit.disabled, false);
    assert.equal(chat.input.value, '保存前の依頼');
    assert.equal(calls.some(call => call.url.endsWith('/chat')), false);
});
