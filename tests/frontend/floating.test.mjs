import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture({ nativeDialog = true, state = async () => ({ surfaces: [{ name: 'floating', enabled: true }] }) } = {}) {
    const dom = new JSDOM('<!doctype html><html><body><button id="host-trigger">AIを開く</button></body></html>', { url: 'https://app.example.test' });
    const lifecycle = { connected: 0, disconnected: 0, sent: 0, modal: 0, modeless: 0 };
    if (nativeDialog) {
        dom.window.HTMLDialogElement.prototype.show = function () { lifecycle.modeless++; this.open = true; this.querySelector('textarea')?.focus(); };
        dom.window.HTMLDialogElement.prototype.showModal = function () { lifecycle.modal++; this.open = true; };
        dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
    }
    class Chat extends dom.window.HTMLElement {
        connectedCallback() {
            lifecycle.connected++;
            if (this.initialized) return; this.initialized = true;
            this.toolbar = dom.window.document.createElement('header'); this.toolbar.className = 'fi-chat-toolbar'; this.append(this.toolbar);
            this.input = dom.window.document.createElement('textarea'); this.input.value = this.getAttribute('initial-prompt') || ''; this.append(this.input);
            this.conversationId = 'conversation-a'; this.attachments = [{ id: 'file-a' }];
        }
        disconnectedCallback() { lifecycle.disconnected++; }
        send() { lifecycle.sent++; }
    }
    dom.window.customElements.define('fourmix-intelligence-chat', Chat);
    const context = vm.createContext({ document: dom.window.document, location: dom.window.location, HTMLElement: dom.window.HTMLElement, customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent, URL });
    const dependency = new vm.SyntheticModule(['request'], function () { this.setExport('request', state); }, { context });
    const module = new vm.SourceTextModule(await readFile(new URL('../../resources/js/floating.js', import.meta.url), 'utf8'), { context }); await module.link(() => dependency); await module.evaluate();
    const create = (attributes = {}) => { const widget = dom.window.document.createElement('fourmix-intelligence-floating-chat'); for (const [key, value] of Object.entries(attributes)) widget.setAttribute(key, value); dom.window.document.body.append(widget); return widget; };
    return { dom, lifecycle, create };
}

test('初回に開くまでチャットを作らず、閉じても草稿・会話・添付を保持して再送しない', async () => {
    const { lifecycle, create } = await fixture(); const widget = create({ alias: 'assistant', 'initial-prompt': '最初の依頼' });
    assert.equal(lifecycle.connected, 0); assert.equal(widget.querySelector('fourmix-intelligence-chat'), null);
    assert.equal(widget.open(), true); const chat = widget.chat; chat.input.value = '保存前の草稿';
    widget.open(); assert.equal(lifecycle.modal, 0); assert.equal(lifecycle.modeless, 1);
    widget.close(); assert.equal(chat.isConnected, true); assert.equal(lifecycle.disconnected, 0);
    widget.open(); assert.equal(widget.chat, chat); assert.equal(lifecycle.connected, 1); assert.equal(lifecycle.sent, 0);
    assert.equal(chat.input.value, '保存前の草稿'); assert.equal(chat.conversationId, 'conversation-a'); assert.deepEqual(chat.attachments, [{ id: 'file-a' }]);
});

test('浮動画面は一つのチャットヘッダーへ閉じると独立画面の操作を統合する', async () => {
    const { create } = await fixture(); const widget = create({ 'assistant-name': '確認アシスタント', 'composer-max-height': '120', 'input-placeholder': '内容を入力' });
    widget.open();
    assert.equal(widget.querySelector('footer'), null);
    assert.equal(widget.windowActions.parentElement, widget.chat.toolbar);
    assert.equal(widget.header.classList.contains('fi-floating-header-merged'), true);
    assert.equal(widget.closeButton.textContent, '');
    assert.equal(widget.closeButton.getAttribute('aria-label'), 'AIチャットを閉じる');
    assert.equal(widget.fallback.getAttribute('aria-label'), '独立したチャット画面で開く');
    assert.equal(widget.chat.getAttribute('layout'), 'fill');
    assert.equal(widget.chat.getAttribute('assistant-name'), '確認アシスタント');
    assert.equal(widget.chat.getAttribute('composer-max-height'), '120');
    assert.equal(widget.chat.getAttribute('input-placeholder'), '内容を入力');
});

test('入口を非表示にしても業務画面のイベントから開け、切替で草稿を失わない', async () => {
    const { dom, create } = await fixture(); const widget = create({ id: 'header-only', 'launcher-hidden': '' });
    assert.equal(widget.launcher.hidden, true);
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { id: 'header-only' } }));
    assert.equal(widget.dialog.open, true); widget.chat.input.value = '残す草稿'; widget.close();
    widget.removeAttribute('launcher-hidden'); assert.equal(widget.launcher.hidden, false);
    widget.setAttribute('launcher-hidden', ''); assert.equal(widget.launcher.hidden, true);
    widget.open(); assert.equal(widget.chat.input.value, '残す草稿');
});

test('開閉で業務画面のフォーカスを奪わず、側窓内のEscapeで閉じる', async () => {
    const { dom, create } = await fixture(); const widget = create(); const trigger = dom.window.document.querySelector('#host-trigger'); trigger.focus();
    widget.open(); assert.equal(dom.window.document.activeElement, trigger);
    assert.equal(widget.launcher.getAttribute('aria-expanded'), 'true');
    assert.equal(widget.dialog.getAttribute('aria-labelledby'), widget.heading.id);
    assert.equal(widget.launcher.getAttribute('aria-controls'), widget.dialog.id);
    widget.chat.input.focus(); const escape = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }); widget.chat.input.dispatchEvent(escape);
    assert.equal(escape.defaultPrevented, true); assert.equal(widget.dialog.open, false);
    assert.equal(widget.launcher.getAttribute('aria-expanded'), 'false'); assert.equal(dom.window.document.activeElement, trigger);
});

test('側窓はモーダルを開かず、開いたまま背景の一覧を操作しても閉じる際にフォーカスを奪わない', async () => {
    const { dom, lifecycle, create } = await fixture(); const widget = create(); const trigger = dom.window.document.querySelector('#host-trigger');
    const background = dom.window.document.createElement('button'); background.textContent = '一覧を操作'; dom.window.document.body.append(background);
    let clicks = 0; background.onclick = () => { clicks++; background.focus(); }; trigger.focus(); widget.open();
    assert.equal(lifecycle.modal, 0); assert.equal(lifecycle.modeless, 1); assert.equal(widget.dialog.getAttribute('aria-modal'), 'false');
    widget.chat.input.value = '送信前の草稿'; background.click(); assert.equal(clicks, 1); assert.equal(dom.window.document.activeElement, background);
    assert.equal(dom.window.document.body.hasAttribute('inert'), false); assert.equal(dom.window.document.body.style.overflow, '');
    widget.close(); assert.equal(dom.window.document.activeElement, background); widget.open(); assert.equal(dom.window.document.activeElement, background);
    assert.equal(widget.chat.input.value, '送信前の草稿'); assert.equal(lifecycle.sent, 0);
});

test('位置・文言・接続設定と業務contextを渡し、変更時も入力中の依頼を上書きしない', async () => {
    const { create } = await fixture(); const widget = create({ position: 'left', label: '<img src=x>', title: '<script>見出し</script>', alias: 'custom-assistant', 'api-base': '/integration/ai', 'initial-prompt': '開始時の依頼', context: '{"record_id":7}', 'csrf-token': 'synthetic-csrf' });
    widget.open(); assert.equal(widget.dataset.position, 'left'); assert.equal(widget.dialog.dataset.position, 'left');
    assert.equal(widget.querySelectorAll('img,script').length, 0); assert.equal(widget.heading.textContent, '<script>見出し</script>');
    assert.equal(widget.chat.getAttribute('alias'), 'custom-assistant'); assert.equal(widget.chat.getAttribute('api-base'), '/integration/ai'); assert.equal(widget.chat.getAttribute('csrf-token'), 'synthetic-csrf');
    assert.equal(widget.chat.context.record_id, 7); assert.equal(widget.chat.input.value, '開始時の依頼');
    widget.chat.input.value = '入力中'; widget.context = { record_id: 8 }; assert.equal(widget.chat.context.record_id, 8);
    widget.setAttribute('context', '{"record_id":9}'); assert.equal(widget.chat.context.record_id, 9); assert.equal(widget.chat.input.value, '入力中');
    widget.setAttribute('context', '[1,2]'); assert.equal(Object.keys(widget.chat.context).length, 0);
});

test('宿主のopenイベントで対象の入口だけを開き、既存の草稿を新しいpromptで置き換えない', async () => {
    const { dom, create } = await fixture(); const first = create({ id: 'first', alias: 'assistant' }), second = create({ id: 'second', alias: 'another' }), duplicate = create({ alias: 'another' });
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { id: 'second', initialPrompt: 'イベントの依頼', context: { record_id: 4 } } }));
    assert.equal(first.dialog.open, false); assert.equal(second.dialog.open, true); assert.equal(second.chat.input.value, 'イベントの依頼'); assert.equal(second.chat.context.record_id, 4);
    second.close(); second.chat.input.value = '途中の依頼';
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { alias: 'another', initialPrompt: '別の依頼' } }));
    assert.equal(second.chat.input.value, '途中の依頼');
    assert.equal(duplicate.dialog.open, false);
});

test('native dialogを使えない環境では独立画面のリンクを保ち、危険なfallback URLは採用しない', async () => {
    const { dom, create } = await fixture({ nativeDialog: false }); const widget = create({ 'fallback-url': '/assistant?alias=assistant' });
    assert.equal(widget.open(), false); assert.equal(widget.chat, undefined);
    const click = new dom.window.MouseEvent('click', { cancelable: true }); widget.launcher.onclick(click);
    assert.equal(click.defaultPrevented, false); assert.equal(widget.launcher.href, 'https://app.example.test/assistant?alias=assistant');
    for (const url of ['javascript:alert(1)', 'https://other.example.test/chat', '//other.example.test/chat']) { widget.setAttribute('fallback-url', url); assert.equal(widget.fallback.hidden, true); assert.equal(widget.launcher.getAttribute('href'), '#'); }
});

test('取り外した入口は宿主のopenイベントを処理せず、再接続してもUIを重複させない', async () => {
    const { dom, create } = await fixture(); const widget = create({ id: 'detached' }); widget.remove();
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { id: 'detached' } })); assert.equal(widget.chat, undefined);
    dom.window.document.body.append(widget); assert.equal(widget.querySelectorAll('dialog').length, 1); assert.equal(widget.querySelectorAll('.fi-floating-launcher').length, 1);
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { id: 'detached' } })); assert.equal(widget.dialog.open, true);
});

test('初期状態で無効な側窓は入口を隠し、開くイベントでも会話を作らない', async () => {
    const { create, dom, lifecycle } = await fixture({ state: async () => ({ surfaces: [{ name: 'floating', enabled: false }] }) });
    const widget = create({ id: 'disabled', surface: 'floating' }); await tick();
    assert.equal(widget.launcher.hidden, true); assert.equal(widget.open(), false);
    dom.window.document.dispatchEvent(new dom.window.CustomEvent('fourmix:open-chat', { detail: { id: 'disabled' } }));
    assert.equal(lifecycle.connected, 0); assert.equal(widget.dialog.open, false);
});

test('画面別設定の保存で側窓を即時閉じ、再開しても草稿を維持し宿主の入口非表示を尊重する', async () => {
    const { create, dom, lifecycle } = await fixture(); const widget = create({ surface: 'floating' }); await tick();
    assert.equal(widget.launcher.hidden, false); assert.equal(widget.open(), true); widget.chat.input.value = '残す草稿';
    dom.window.dispatchEvent(new dom.window.CustomEvent('fourmix:surfaces', { detail: [{ name: 'page', enabled: true }, { name: 'floating', enabled: false }] }));
    assert.equal(widget.dialog.open, false); assert.equal(widget.launcher.hidden, true); assert.equal(widget.open(), false);
    widget.setAttribute('launcher-hidden', '');
    dom.window.dispatchEvent(new dom.window.CustomEvent('fourmix:surfaces', { detail: [{ name: 'floating', enabled: true }] }));
    assert.equal(widget.launcher.hidden, true); assert.equal(widget.open(), true); assert.equal(widget.chat.input.value, '残す草稿'); assert.equal(lifecycle.sent, 0);
    widget.removeAttribute('launcher-hidden'); assert.equal(widget.launcher.hidden, false);
});

test('遅い初期状態の返却で後から保存した無効設定を上書きしない', async () => {
    let resolve; const delayed = new Promise(done => { resolve = done; });
    const { create, dom } = await fixture({ state: () => delayed }); const widget = create({ surface: 'floating' });
    assert.equal(widget.open(), false);
    dom.window.dispatchEvent(new dom.window.CustomEvent('fourmix:surfaces', { detail: [{ name: 'floating', enabled: false }] }));
    resolve({ surfaces: [{ name: 'floating', enabled: true }] }); await tick();
    assert.equal(widget.launcher.hidden, true); assert.equal(widget.open(), false);
});
