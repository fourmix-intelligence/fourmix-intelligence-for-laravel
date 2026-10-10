import { request } from './sdk.js';
import { renderMarkdown, configureRendering } from './markdown.js';
import * as GeneratedLinks from './markdown.js';

/** Public browser API for hosts with their own UI. */
export class FourmixIntelligenceUI {
    constructor(base = '/fourmix-intelligence', csrfToken, surfaceName = 'page') { this.base = base.replace(/\/$/, ''); this.csrfToken = csrfToken; this.surfaceName = surfaceName; }
    expectation(selection) { this.expectedSelection = selection ? { connection_id: selection.connection_id, grant_id: selection.grant_id, connection_revision: selection.connection_revision } : null; return this; }
    selectionBody() { return this.expectedSelection ? { expected_selection: { ...this.expectedSelection } } : {}; }
    selectionQuery() { return this.expectedSelection ? Object.fromEntries(Object.entries(this.expectedSelection).map(([key, value]) => [`expected_selection[${key}]`, String(value)])) : {}; }
    call(path, options = {}) { return request(`${this.base}/${path}`, { csrfToken: this.csrfToken, ...options }); }
    state() { return this.call('state'); }
    agents(connectionId) { return this.call(`agents?connection_id=${encodeURIComponent(connectionId)}`); }
    select(alias, connectionId, grantId) { return this.call(`agents/${encodeURIComponent(alias)}`, { method: 'PUT', body: { connection_id: connectionId, grant_id: grantId } }); }
    surface(name, configuration) { return this.call(`surfaces/${encodeURIComponent(name)}`, { method: 'PUT', body: configuration }); }
    ask(alias, message, { conversationId, context = {}, attachmentIds = [], signal, onEvent } = {}) { return this.call('chat', { method: 'POST', body: { surface: this.surfaceName, alias, ...this.selectionBody(), message, context, attachment_ids: attachmentIds, ...(conversationId ? { conversation_id: conversationId } : {}) }, signal, onEvent }); }
    history(alias, conversationId, beforeId) { return this.call('history', { method: 'POST', body: { surface: this.surfaceName, alias, ...this.selectionBody(), ...(conversationId ? { conversation_id: conversationId } : {}), ...(beforeId ? { before_id: beforeId } : {}) } }); }
    runControl(alias, conversationId, runId, cancel = false) { return this.call('run-control', { method: 'POST', body: { surface: this.surfaceName, alias, ...this.selectionBody(), conversation_id: conversationId, run_id: runId, cancel } }); }
    attachments(alias, conversationId) { return this.call(`attachments?${new URLSearchParams({ surface: this.surfaceName, alias, ...this.selectionQuery(), ...(conversationId ? { conversation_id: conversationId } : {}) })}`); }
    uploadAttachment(alias, file, { conversationId, requestId = crypto.randomUUID(), signal } = {}) { const body = new FormData(); body.set('surface', this.surfaceName); body.set('alias', alias); for (const [key, value] of Object.entries(this.selectionQuery())) body.set(key, value); body.set('file', file); body.set('request_id', requestId); if (conversationId) body.set('conversation_id', conversationId); return this.call('attachments', { method: 'POST', body, signal }); }
    attachmentUrl(alias, conversationId, id) { return `${this.base}/attachments/${encodeURIComponent(conversationId)}/${encodeURIComponent(id)}/content?${new URLSearchParams({ surface: this.surfaceName, alias, ...this.selectionQuery() })}`; }
    artifactUrl(alias, conversationId, id) { return `${this.base}/artifacts/${encodeURIComponent(conversationId)}/${encodeURIComponent(id)}/content?${new URLSearchParams({ surface: this.surfaceName, alias, ...this.selectionQuery() })}`; }
    deleteAttachment(alias, conversationId, id) { return this.call(`attachments/${encodeURIComponent(conversationId)}/${encodeURIComponent(id)}`, { method: 'DELETE', body: { surface: this.surfaceName, alias, ...this.selectionBody() } }); }
}
window.FourmixIntelligenceSDK = { Client: FourmixIntelligenceUI, request, Rendering: { configure: configureRendering, render: renderMarkdown } };
export const node = (tag, text = '', className = '') => { const item = document.createElement(tag); item.textContent = text; item.className = className; return item; };
export const states = { confirmation_required: '確認待ち', succeeded: '完了', rejected: '実行せず終了', unknown_effect: '結果の確認が必要', running: '処理中', expired: '確認期限切れ' };
export const datetime = (value, timeZone) => { try { return new Intl.DateTimeFormat('ja-JP', { ...(timeZone ? { timeZone } : {}), dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); } catch { return ''; } };
function icon(name) {
    const paths = { chat: 'M4 4h16v12H9l-5 4V4Z', plus: 'M12 5v14M5 12h14', history: 'M4 9a8 8 0 1 1 1 9M4 4v5h5M12 8v5l3 2', refresh: 'M4 9a8 8 0 0 1 14-3l2 3M20 15a8 8 0 0 1-14 3l-2-3M20 4v5h-5M4 20v-5h5', send: 'M12 19V5M6 11l6-6 6 6', close: 'M6 6l12 12M18 6 6 18', attach: 'M8 13 14 7a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9', files: 'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6', help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6' };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [attribute, value] of Object.entries({ viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(attribute, value);
    svg.setAttribute('class', 'fi:shrink-0');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', paths[name] || paths.chat); svg.append(path);
    return svg;
}
export const button = (text, fn, variant = 'primary', iconName) => {
    const item = node('button', '', `fi-button ${variant === 'primary' ? '' : `fi-button-${variant}`} fi:gap-2 fi:whitespace-nowrap`);
    item.type = 'button'; item.onclick = fn;
    if (iconName) item.append(icon(iconName));
    if (text) item.append(node('span', text));
    return item;
};
let dialogSequence = 0;
let historySequence = 0;

function hostUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try { const url = new URL(value, location.origin); return url.origin === location.origin && ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
}

function actionResult(action, container) {
    container.replaceChildren();
    const result = action.data;
    if (action.state === 'succeeded') {
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            if (typeof result.message === 'string' && result.message.trim()) container.append(node('p', result.message, 'fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words'));
            const url = hostUrl(result.url);
            if (url) { const link = node('a', '業務画面で結果を見る', 'fi-button'); link.href = url; container.append(link); }
        } else if (typeof result === 'string') container.append(node('p', result, 'fi:whitespace-pre-wrap fi:break-words'));
    } else if (typeof action.message === 'string') container.append(node('p', action.message, 'fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words'));
    if (result !== undefined || action.preview !== undefined) {
        const details = node('details', '', 'fi:rounded-xl fi:bg-raised fi:p-3'); details.append(node('summary', '結果の詳細', 'fi:cursor-pointer fi:text-sm fi:text-secondary'), node('pre', JSON.stringify(result ?? action.preview, null, 2), 'fi:mt-3 fi:whitespace-pre-wrap fi:break-words fi:text-xs')); container.append(details);
    }
}

export async function showAction(api, id, parent, onChanged) {
    const dialog = node('dialog', '', 'fi-dialog fi:open:flex fi:open:flex-col fi:w-full fi:max-w-xl fi:max-h-[85dvh] fi:overflow-hidden fi:rounded-2xl fi:border fi:border-line fi:bg-surface fi:p-0 fi:text-ink');
    const header = node('header', '', 'fi-dialog-header fi:flex fi:shrink-0 fi:items-start fi:gap-3 fi:border-b fi:border-line fi:px-6 fi:py-5');
    const badge = node('span', '', 'fi:flex fi:size-10 fi:shrink-0 fi:items-center fi:justify-center fi:rounded-xl fi:bg-raised fi:text-secondary'); badge.append(icon('shield'));
    const heading = node('div', '', 'fi:min-w-0 fi:space-y-1'); const title = node('h2', '業務操作の確認', 'fi:text-lg fi:font-semibold'); title.id = `fi-action-title-${++dialogSequence}`;
    const status = node('p', '操作の内容を読み込んでいます…', 'fi:text-sm fi:text-secondary fi:break-words'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    heading.append(title, status); header.append(badge, heading); dialog.setAttribute('aria-labelledby', title.id); dialog.setAttribute('aria-busy', 'true');
    const content = node('div', '', 'fi-dialog-body fi:min-h-0 fi:flex-1 fi:overflow-y-auto fi:space-y-5 fi:px-6 fi:py-5');
    const footer = node('footer', '', 'fi-dialog-footer fi:flex fi:shrink-0 fi:flex-wrap fi:items-center fi:justify-end fi:gap-2 fi:border-t fi:border-line fi:px-6 fi:py-4'); footer.append(button('閉じる', () => dialog.close(), 'secondary'));
    dialog.append(header, content, footer); parent.append(dialog); dialog.showModal(); dialog.addEventListener('close', () => dialog.remove(), { once: true });
    try {
        const action = await api.call(`actions/${encodeURIComponent(id)}`); status.textContent = `${action.operation} · ${states[action.state] || '状態を確認できません'}`; if (action.state !== 'confirmation_required') title.textContent = '業務操作の結果';
        const renderEvent = new CustomEvent('fourmix:review', { detail: { action, container: content }, bubbles: true, composed: true, cancelable: true }); parent.dispatchEvent(renderEvent);
        let hostReview = false;
        const reviewUrl = hostUrl(action.url);
        if (reviewUrl) { const link = node('a', 'このアプリケーションの確認画面で確認', 'fi-button'); link.href = reviewUrl; content.append(link); hostReview = true; }
        const body = node('div', '', 'fi:space-y-3'); content.append(body);
        if (!renderEvent.defaultPrevented) {
            if (action.state === 'confirmation_required') { if (!hostReview) body.append(node('pre', JSON.stringify(action.preview ?? {}, null, 2), 'fi:whitespace-pre-wrap fi:break-words fi:rounded-lg fi:bg-raised fi:p-4 fi:text-sm')); }
            else actionResult(action, body);
        }
        if (action.expires_at) content.append(node('p', `確認期限：${datetime(action.expires_at, api.timezone)}`, 'fi:text-sm fi:text-secondary'));
        if (action.state === 'confirmation_required' && !hostReview) {
            const label = node('label', '', 'fi:flex fi:items-start fi:gap-3 fi:rounded-xl fi:bg-raised fi:p-4 fi:text-sm fi:leading-relaxed'); const acknowledge = node('input', '', 'fi:mt-1 fi:shrink-0'); acknowledge.type = 'checkbox'; label.append(acknowledge, node('span', '対象と変更内容を確認しました。'));
            const controls = node('div', '', 'fi:flex fi:flex-wrap fi:items-center fi:gap-2'); const confirm = button('確認して実行', () => execute('confirm')); const reject = button('実行しない', () => execute('reject'), 'danger'); confirm.disabled = true; acknowledge.onchange = () => { confirm.disabled = !acknowledge.checked; };
            async function execute(actionName) { confirm.disabled = reject.disabled = acknowledge.disabled = true;
                let result;
                try { result = await api.call(`actions/${encodeURIComponent(id)}/${actionName}`, { method: 'POST', body: { acknowledge: acknowledge.checked } }); }
                catch (error) { status.textContent = `${error.message} 再実行の前に操作履歴を確認してください。`; return; }
                status.textContent = states[result.state] || '状態を確認できません'; title.textContent = '業務操作の結果'; label.remove(); controls.remove(); if (!renderEvent.defaultPrevented) actionResult(result, body);
                try { await onChanged(result); } catch { status.textContent = `${states[result.state] || '結果を受信しました'}。操作一覧を更新できませんでした。再読み込みして確認してください。`; }
                document.defaultView?.dispatchEvent(new CustomEvent('fourmix:action-changed', { detail: { id, state: result.state } }));
            }
            controls.append(reject, confirm); content.append(label); footer.append(controls);
        }
    } catch (error) { status.textContent = error.message; }
    finally { dialog.setAttribute('aria-busy', 'false'); }
}

export class FourmixIntelligenceChat extends HTMLElement {
    connectedCallback() {
        this.surfaceHandler ||= event => { const surface = Array.isArray(event.detail) && event.detail.find(item => item.name === this.getAttribute('surface')); if (surface && (!surface.enabled || surface.connection_id !== this.api?.expectedSelection?.connection_id || surface.grant_id !== this.api?.expectedSelection?.grant_id || (surface.connection_revision != null && String(surface.connection_revision) !== String(this.api?.expectedSelection?.connection_revision)))) this.invalidateSelection(); };
        document.defaultView?.addEventListener('fourmix:surfaces', this.surfaceHandler);
        this.actionHandler ||= event => this.refreshActionResults(event?.detail?.state);
        document.defaultView?.addEventListener('fourmix:action-changed', this.actionHandler);
        document.defaultView?.addEventListener('focus', this.actionHandler);
        if (this.initialized) { this.mergePageHeader(); return; } this.initialized = true; this.api = new FourmixIntelligenceUI(this.getAttribute('api-base') || '/fourmix-intelligence', this.getAttribute('csrf-token'), this.getAttribute('surface') || 'page'); this.conversationId = this.getAttribute('conversation-id') || null;
        this.attachments = []; this.attachmentMetadata = new Map(); this.attachmentPolicy = null; this.artifactDownloads = new Set();
        this.panel = node('section', '', 'fi-chat'); this.append(this.panel);
        const toolbar = this.toolbar = node('header', '', 'fi-chat-toolbar');
        const label = node('label', '', 'fi-chat-agent'); label.append(icon('chat'), node('span', '使用するAI', 'fi:sr-only'));
        this.agentTitle = node('span', this.getAttribute('assistant-name') || 'AIアシスタント', 'fi-chat-agent-title'); label.append(this.agentTitle); this.activeAlias = '';
        this.fresh = button('新しい会話', () => { if (this.isBusy() || this.sendUncertain) return; this.resetConversation(); this.recover(); }, 'ghost', 'plus');
        this.fresh.classList.add('fi-chat-header-button'); this.fresh.setAttribute('aria-label', '新しい会話'); this.fresh.title = '新しい会話';
        this.retry = button('', () => this.recover(), 'ghost', 'refresh'); this.retry.classList.add('fi-chat-icon-button'); this.retry.setAttribute('aria-label', 'AIと履歴を再読み込み'); this.retry.title = 'AIと履歴を再読み込み';
        this.history = button('会話履歴', () => { if (!this.isBusy()) this.toggleHistory(); }, 'ghost', 'history'); this.history.classList.add('fi-chat-header-button'); this.history.setAttribute('aria-label', '会話履歴'); this.history.title = '会話履歴'; this.history.setAttribute('aria-expanded', 'false');
        this.businessStatus = node('a', '', 'fi-chat-business-status'); this.businessStatus.hidden = true;
        toolbar.append(label, this.businessStatus, this.history, this.fresh, this.retry); this.panel.append(toolbar);
        this.mergePageHeader();
        const mode = this.getAttribute('history-layout'); this.historyLayout = ['drawer', 'dropdown'].includes(mode) ? mode : this.closest?.('fourmix-intelligence-floating-chat') ? 'dropdown' : 'drawer';
        this.historyPanel = node('div', '', `fi-chat-history-panel fi-chat-history-${this.historyLayout}`); this.historyPanel.hidden = true;
        this.historyPanel.id = `fi-chat-history-${++historySequence}`; this.history.setAttribute('aria-controls', this.historyPanel.id);
        if (this.historyLayout === 'drawer') { const backdrop = button('', () => this.toggleHistory(false), 'ghost'); backdrop.className = 'fi-chat-history-backdrop'; backdrop.setAttribute('aria-label', '会話履歴を閉じる'); backdrop.tabIndex = -1; this.historyPanel.append(backdrop); }
        const historyContent = node('aside', '', 'fi-chat-history-content'); historyContent.setAttribute('role', 'region');
        const historyHeader = node('header', '', 'fi-chat-history-header'); const historyTitle = node('h2', '会話履歴'); historyTitle.id = `${this.historyPanel.id}-title`; historyContent.setAttribute('aria-labelledby', historyTitle.id);
        this.historyClose = button('', () => this.toggleHistory(false), 'ghost', 'close'); this.historyClose.classList.add('fi-chat-icon-button'); this.historyClose.setAttribute('aria-label', '会話履歴を閉じる');
        historyHeader.append(historyTitle, this.historyClose); historyContent.append(historyHeader);
        this.historyStatus = node('p', '会話履歴はまだありません', 'fi-chat-history-status'); this.historyStatus.setAttribute('role', 'status'); this.historyStatus.setAttribute('aria-live', 'polite');
        this.historyList = node('div', '', 'fi-chat-history-list'); this.historyList.setAttribute('aria-label', 'これまでの会話'); historyContent.append(this.historyStatus, this.historyList); this.historyPanel.append(historyContent); this.panel.append(this.historyPanel);
        this.panel.onkeydown = event => { if (event.key === 'Escape' && !this.historyPanel.hidden) { event.preventDefault(); event.stopPropagation(); this.toggleHistory(false); } };
        this.notice = node('p', '', 'fi-chat-notice fi:shrink-0 fi:px-5 fi:py-3 fi:text-sm fi:leading-relaxed fi:text-secondary'); this.notice.hidden = true; this.notice.setAttribute('role', 'status'); this.notice.setAttribute('aria-live', 'polite'); this.notice.setAttribute('aria-atomic', 'true'); this.panel.append(this.notice);
        this.setupLink = node('a', '接続とチャットを設定', 'fi:shrink-0 fi:px-5 fi:py-2 fi:text-sm fi:underline fi:underline-offset-4'); this.setupLink.href = `${this.api.base}#fi-surfaces`; this.setupLink.hidden = true; this.panel.append(this.setupLink);
        this.viewport = node('div', '', 'fi-chat-viewport fi:min-h-0 fi:flex-1 fi:overflow-y-auto fi:overscroll-contain fi:px-5 fi:py-6 fi:sm:px-7');
        this.empty = node('div', '', 'fi-chat-empty fi:flex fi:min-h-52 fi:h-full fi:flex-col fi:items-center fi:justify-center fi:gap-4 fi:py-6 fi:text-center');
        const welcomeIcon = node('div', '', 'fi:flex fi:size-14 fi:shrink-0 fi:items-center fi:justify-center fi:rounded-2xl fi:bg-raised fi:text-secondary'); welcomeIcon.append(icon('chat'));
        this.empty.append(welcomeIcon, node('h2', 'どのようなお手伝いをしましょうか？', 'fi:text-lg fi:font-semibold fi:tracking-tight'), node('p', '質問や相談したいことを入力してください。', 'fi:max-w-sm fi:text-sm fi:leading-relaxed fi:text-secondary'));
        const ideas = node('div', '', 'fi:flex fi:flex-wrap fi:justify-center fi:gap-2 fi:pt-1'); for (const idea of ['情報を整理する', '内容を確認する', 'アイデアを相談する']) ideas.append(node('span', idea, 'fi:rounded-full fi:bg-raised fi:px-3 fi:py-1.5 fi:text-xs fi:text-secondary')); this.empty.append(ideas);
        this.messages = node('div', '', 'fi:space-y-6'); this.messages.setAttribute('role', 'log'); this.messages.setAttribute('aria-label', 'AIとの会話'); this.messages.setAttribute('aria-live', 'polite'); this.messages.setAttribute('aria-relevant', 'additions');
        this.more = button('以前のメッセージを表示', async () => { if (this.isBusy() || !this.ready) return; try { await this.loadHistory(this.conversationId, this.beforeId); } catch (error) { this.setNotice(error.message, 'error'); } }, 'ghost', 'history'); this.more.hidden = true;
        this.viewport.append(this.empty, this.more, this.messages); this.panel.append(this.viewport);
        this.progress = node('div', '', 'fi-chat-progress'); this.progress.hidden = true;
        const activity = this.progressActivity = node('span', '', 'fi:size-1.5 fi:shrink-0 fi:rounded-full fi:bg-emerald-500'); activity.setAttribute('aria-hidden', 'true');
        this.progressLabel = node('span', '', 'fi:min-w-0 fi:truncate'); this.progressLabel.setAttribute('role', 'status'); this.progressLabel.setAttribute('aria-live', 'polite');
        this.progressTime = node('span', '', 'fi:shrink-0 fi:tabular-nums'); this.progressTime.setAttribute('aria-live', 'off');
        this.progress.append(activity, this.progressLabel, this.progressTime); this.panel.append(this.progress);
        this.approvals = node('div', '', 'fi-chat-approvals fi:flex fi:shrink-0 fi:flex-wrap fi:gap-2 fi:border-t fi:border-line fi:px-5 fi:py-3'); this.approvals.hidden = true; this.panel.append(this.approvals);
        const form = node('form', '', 'fi-chat-composer'); const inputLabel = node('label', '', 'fi:block'); inputLabel.append(node('span', 'AIへの依頼', 'fi:sr-only'));
        this.input = node('textarea', '', 'fi-chat-input'); this.input.rows = 1; this.input.maxLength = 10000; this.input.placeholder = this.getAttribute('input-placeholder') || '質問や依頼を入力…'; this.input.value = this.getAttribute('initial-prompt') || ''; this.input.oninput = () => this.resizeInput(); inputLabel.append(this.input);
        this.attachmentCards = node('div', '', 'fi-chat-attachments'); this.attachmentCards.hidden = true; this.attachmentCards.setAttribute('aria-label', '送信する添付ファイル'); form.append(this.attachmentCards);
        this.fileInput = node('input'); this.fileInput.type = 'file'; this.fileInput.multiple = true; this.fileInput.hidden = true; this.fileInput.setAttribute('aria-label', '添付するファイル');
        this.fileInput.onchange = () => { const files = [...(this.fileInput.files || [])]; this.fileInput.value = ''; this.addFiles(files); };
        this.attachButton = button('ファイルを添付', () => { this.additions.open = false; this.fileInput.click(); }, 'ghost', 'attach'); this.attachButton.setAttribute('aria-label', 'ファイルを添付'); form.append(this.fileInput);
        this.storedButton = button('保存済みファイル', () => this.checkAttachments(), 'ghost', 'files'); this.storedButton.setAttribute('aria-label', '保存済みファイル');
        const help = node('details', '', 'fi-chat-help'); const helpSummary = node('summary', '', 'fi-button fi-button-ghost'); helpSummary.append(icon('help'), node('span', '添付形式と利用条件')); helpSummary.setAttribute('aria-label', '添付形式と利用条件');
        this.attachmentHelp = node('p', '添付の利用条件を確認しています…', 'fi-attachment-help'); help.append(helpSummary, this.attachmentHelp);
        this.storedAttachments = node('details', '', 'fi-attachment-stored'); this.storedAttachments.hidden = true;
        form.ondragover = event => { if (event.dataTransfer?.types?.includes('Files')) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = this.isBusy() ? 'none' : 'copy'; } };
        form.ondrop = event => { if (event.dataTransfer?.files?.length) { event.preventDefault(); this.addFiles([...event.dataTransfer.files]); } };
        this.input.onpaste = event => { const files = [...(event.clipboardData?.files || [])]; if (files.length) { event.preventDefault(); this.addFiles(files); } };
        const composerRow = node('div', '', 'fi-chat-composer-row');
        this.additions = node('details', '', 'fi-chat-additions'); const additionsToggle = node('summary', '', 'fi-chat-additions-toggle'); const plus = icon('plus'); plus.setAttribute('width', '20'); plus.setAttribute('height', '20'); additionsToggle.append(plus); additionsToggle.setAttribute('aria-label', '添付と利用条件'); additionsToggle.title = 'ファイルを添付・保存済みファイル・利用条件';
        const additionsMenu = node('div', '', 'fi-chat-additions-menu'); additionsMenu.append(this.attachButton, this.storedButton, this.storedAttachments, help); this.additions.append(additionsToggle, additionsMenu);
        this.submit = button('', null, 'primary', 'send'); this.submit.classList.add('fi-chat-send'); this.submit.type = 'submit'; this.submit.setAttribute('aria-label', '送信'); this.submit.title = '送信';
        this.cancel = button('', () => this.requestStop(), 'secondary', 'close'); this.cancel.classList.add('fi-chat-send'); this.cancel.setAttribute('aria-label', '停止'); this.cancel.title = '停止'; this.cancel.hidden = true;
        this.recovery = button('結果を確認', () => this.checkRunResult(), 'secondary', 'history'); this.recovery.hidden = true; this.panel.append(this.recovery);
        composerRow.append(this.additions, inputLabel, this.cancel, this.submit); form.append(composerRow); this.panel.append(form); this.resizeInput();
        form.onsubmit = event => { event.preventDefault(); this.send(); };
        this.recover();
    }
    disconnectedCallback() { this.historyRequest = (this.historyRequest || 0) + 1; this.attachmentListRequest = (this.attachmentListRequest || 0) + 1; document.defaultView?.removeEventListener('fourmix:surfaces', this.surfaceHandler); document.defaultView?.removeEventListener('fourmix:action-changed', this.actionHandler); document.defaultView?.removeEventListener('focus', this.actionHandler); this.abort?.abort(); this.stopProgress(); this.clearStreamRender(); this.uploadAbort?.abort(); this.disposeMessages(); for (const entry of this.attachments || []) this.revokePreview(entry); }
    mergePageHeader() {
        const shell = this.closest?.('.fi-sdk-chat-layout');
        const header = shell?.querySelector('.fi-sdk-header');
        if (!header || header.hidden) return;
        const brand = header.querySelector('.fi-sdk-brand');
        const actions = header.querySelector('.fi-sdk-header-actions');
        if (!brand || !actions) return;
        this.toolbar.prepend(brand); this.toolbar.append(actions);
        this.toolbar.classList.add('fi-chat-toolbar-branded');
        header.hidden = true; shell.classList.add('fi-sdk-chat-merged');
    }
    resizeInput() {
        if (!this.input?.style) return;
        const limit = Math.max(48, Math.min(320, Number(this.getAttribute('composer-max-height')) || 160));
        this.input.style.height = 'auto';
        this.input.style.height = `${Math.max(40, Math.min(limit, this.input.scrollHeight || 40))}px`;
        this.input.style.overflowY = this.input.scrollHeight > limit ? 'auto' : 'hidden';
    }
    event(name, detail) { this.dispatchEvent(new CustomEvent(`fourmix:${name}`, { detail, bubbles: true, composed: true })); }
    setNotice(text, tone = 'info') { this.notice.textContent = text; this.notice.hidden = !text; this.notice.setAttribute('data-tone', tone); this.notice.setAttribute('role', tone === 'error' ? 'alert' : 'status'); this.notice.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite'); }
    startProgress() {
        this.stopProgress(); this.startedAt = document.defaultView.performance.now(); this.progress.hidden = false;
        this.progressActivity.classList.add('fi:motion-safe:animate-pulse');
        this.progressLabel.textContent = 'AIに接続しています'; this.tickProgress();
        this.progressTimer = document.defaultView.setInterval(() => this.tickProgress(), 1000);
    }
    tickProgress() { if (this.startedAt == null) return; const seconds = Math.floor((document.defaultView.performance.now() - this.startedAt) / 1000); this.progressTime.textContent = `${seconds}秒`; this.progressTime.setAttribute('aria-label', `経過時間 ${seconds}秒`); }
    stopProgress() { if (this.progressTimer != null) { this.tickProgress(); document.defaultView.clearInterval(this.progressTimer); } this.progressTimer = null; this.progressActivity?.classList.remove('fi:motion-safe:animate-pulse'); }
    streamEvent(event) {
        this.event('progress', event);
        if (event.type === 'run.created' && typeof event.data.conversation_id === 'string') this.conversationId = event.data.conversation_id;
        if (event.type === 'run.created' && /^[0-9a-f-]{36}$/i.test(event.data.run_id || '')) { this.activeRunId = event.data.run_id; this.saveRunRecovery(); if (this.stopQueued) this.requestStop(); }
        if (event.type === 'run.failed') { this.runCancelled = event.data.code === 'RUN_CANCELLED'; this.runTerminal = this.runCancelled; }
        if (event.type === 'run.completed') this.runTerminal = true;
        if (event.type === 'run.status') this.progressLabel.textContent = typeof event.data.message === 'string' ? event.data.message : 'AIが作業しています';
        if (['assistant.delta', 'assistant.message'].includes(event.type) && typeof event.data.text === 'string') {
            const follow = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight < 160;
            if (!this.liveAnswer) {
                this.liveAnswer = this.message('assistant', '');
                this.liveAnswer.content = this.liveAnswer.querySelector('.fi-markdown');
                this.liveAnswer.content?.dispose?.();
                this.liveAnswer.text = '';
            }
            this.liveAnswer.text = event.type === 'assistant.delta' ? this.liveAnswer.text + event.data.text : event.data.text;
            this.renderStreamAnswer(event.type === 'assistant.message');
            this.progressLabel.textContent = '回答を作成しています';
            if (follow) this.liveAnswer.scrollIntoView({ block: 'nearest' });
        }
    }
    async requestStop() {
        if (!this.abort || this.stopRequested) return;
        this.stopQueued = true; this.cancel.disabled = true;
        if (!this.activeRunId) { this.progressLabel.textContent = '接続後に停止を依頼します'; return; }
        try {
            const result = await this.api.runControl(this.activeAlias, this.conversationId, this.activeRunId, true);
            this.stopRequested = result.cancel_requested === true;
            this.progressLabel.textContent = this.stopRequested ? '停止を依頼しました。終了を確認しています' : '処理の結果を確認しています';
            if (['completed', 'failed'].includes(result.status)) this.runTerminal = true;
        } catch (error) { this.cancel.disabled = false; this.setNotice('停止の受付を確認できませんでした。結果は未確認です。', 'error'); }
    }
    async checkRunResult() {
        if (!this.activeRunId || !this.conversationId) { this.setNotice('処理IDを受け取る前に通信が終了しました。結果は未確認です。', 'error'); return; }
        try {
            const result = await this.api.runControl(this.activeAlias, this.conversationId, this.activeRunId);
            if (!['completed', 'failed'].includes(result.status)) { this.setNotice('処理中です。新しく送信せず、しばらくして結果を確認してください。'); return; }
            this.sendUncertain = false; this.runTerminal = true; this.runCancelled = result.cancelled === true;
            this.clearRunRecovery();
            this.setNotice(result.cancelled ? '停止が完了しました。実行済みの操作は元に戻りません。' : '処理が終了したことを確認しました。');
            await this.loadHistory(this.conversationId); this.recovery.hidden = true; this.updateControls();
        } catch (error) { this.setNotice('結果を確認できませんでした。重複して送信しないでください。', 'error'); }
    }
    saveRunRecovery() { try { if (this.recoveryKey) sessionStorage.setItem(this.recoveryKey, JSON.stringify({ run_id: this.activeRunId || null, conversation_id: this.conversationId || null })); } catch { /* Keep in-memory result isolation. */ } }
    clearRunRecovery() { try { if (this.recoveryKey) sessionStorage.removeItem(this.recoveryKey); } catch { /* Storage is optional. */ } }
    renderStreamAnswer(force = false) {
        if (!this.liveAnswer) return;
        const now = document.defaultView.performance.now();
        if (!force && this.liveAnswer.renderedAt != null && now - this.liveAnswer.renderedAt < 100) {
            if (this.renderTimer == null) this.renderTimer = document.defaultView.setTimeout(() => { this.renderTimer = null; this.renderStreamAnswer(true); }, 100);
            return;
        }
        this.clearStreamRender();
        const markup = renderMarkdown(this.liveAnswer.text, { ...this.rendering, streaming: true });
        this.liveAnswer.content?.dispose?.(); this.liveAnswer.content?.replaceWith(markup); this.liveAnswer.content = markup; this.liveAnswer.renderedAt = now;
    }
    clearStreamRender() { if (this.renderTimer != null) document.defaultView.clearTimeout(this.renderTimer); this.renderTimer = null; }
    finishAnswer(text) {
        this.clearStreamRender();
        if (!this.liveAnswer) return this.message('assistant', text);
        const follow = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight < 160;
        const markup = renderMarkdown(text, this.rendering); this.liveAnswer.content?.replaceWith(markup); if (follow) this.liveAnswer.scrollIntoView({ block: 'nearest' }); const item = this.liveAnswer; this.liveAnswer = null; return item;
    }
    invalidateSelection() { this.abortArtifactDownloads(); this.selectionStale = true; this.setNotice('このチャットの接続・AI・権限が変更されています。草稿は保持しています。「再読み込み」で現在の設定を確認してから送信してください。', 'error'); this.updateControls(); }
    refreshEmpty() { if (this.empty) { const empty = this.messages.childNodes.length === 0; this.empty.hidden = !empty; this.messages.hidden = empty; } }
    isBusy() { return this.loading || !!this.abort || !!this.uploading; }
    abortArtifactDownloads() { for (const controller of this.artifactDownloads || []) controller.abort(); this.artifactDownloads?.clear(); }
    disposeMessages() { this.abortArtifactDownloads(); for (const markup of this.messages?.querySelectorAll?.('.fi-markdown') || []) markup.dispose?.(); }
    renderArtifacts(item, artifacts, conversationId = this.conversationId) {
        if (!item || !conversationId || !Array.isArray(artifacts)) return;
        const files = node('div', '', 'fi-message-attachments fi-generated-files'); files.setAttribute('aria-label', '生成ファイル');
        for (const metadata of artifacts.slice(0, 20)) {
            if (!metadata || typeof metadata.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadata.id) || typeof metadata.name !== 'string') continue;
            const card = node('div', '', 'fi-generated-file'); const label = node('span', `${metadata.name} · ${this.fileSize(metadata.size)}`); const error = node('p', '', 'fi:text-xs fi:text-secondary'); error.setAttribute('role', 'status');
            const url = this.api.artifactUrl(this.activeAlias, conversationId, metadata.id);
            const download = button('ダウンロード', async () => {
                if (this.selectionStale || !this.ready) { error.textContent = '現在のAI設定を再読み込みしてください。'; return; }
                if (this.attachmentExpired(metadata)) { error.textContent = '生成ファイルの利用期限が切れています。'; return; }
                const controller = new AbortController(); this.artifactDownloads.add(controller); download.disabled = true; error.textContent = '';
                try {
                    const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal, headers: { Accept: 'application/octet-stream' }, redirect: 'error' });
                    if (!response.ok) { const messages = { 401: '再ログインして取得してください。', 403: 'この生成ファイルを取得する権限がありません。', 404: 'この会話の生成ファイルを確認できません。', 410: '生成ファイルの利用期限が切れています。' }; throw new Error(messages[response.status] || '生成ファイルを取得できませんでした。再試行してください。'); }
                    const body = await response.blob(); if (controller.signal.aborted) return;
                    if (Number.isFinite(metadata.size) && body.size !== metadata.size) throw new Error('生成ファイルの内容を確認できませんでした。');
                    const objectUrl = URL.createObjectURL(body); const link = node('a'); link.href = objectUrl; link.download = metadata.name; link.click(); document.defaultView.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                } catch (failure) { if (!controller.signal.aborted) error.textContent = failure.message || '生成ファイルを取得できませんでした。'; }
                finally { this.artifactDownloads.delete(controller); download.disabled = false; }
            }, 'secondary');
            download.dataset.artifactId = metadata.id; card.append(label, download, error); files.append(card);
        }
        if (files.childNodes.length) item.querySelector('.fi-chat-assistant')?.append(files);
        GeneratedLinks.bindGeneratedArtifactLinks?.(item, artifacts, metadata => item.querySelector(`[data-artifact-id="${metadata.id}"]`)?.click());
    }
    clearMessages() { this.disposeMessages(); this.messages.replaceChildren(); }
    revokePreview(entry) { if (entry.previewUrl) { URL.revokeObjectURL(entry.previewUrl); entry.previewUrl = null; } }
    clearAttachments() { for (const entry of this.attachments) this.revokePreview(entry); this.attachments = []; this.renderAttachments(); }
    resetConversation() { this.historyRequest = (this.historyRequest || 0) + 1; this.attachmentListRequest = (this.attachmentListRequest || 0) + 1; if (this.historyLoadingOwner != null) { this.loading = false; this.historyLoadingOwner = null; } this.clearStreamRender(); this.stopProgress(); this.startedAt = null; this.progress.hidden = true; this.conversationId = null; this.toggleHistory(false, false); this.conversations = []; this.renderConversations(); this.clearMessages(); this.clearAttachments(); this.attachmentMetadata.clear(); this.storedAttachments.hidden = true; this.storedAttachments.open = false; this.storedAttachments.replaceChildren(); this.sendUncertain = false; this.beforeId = null; this.more.hidden = true; this.refreshEmpty(); }
    businessContext() {
        let value = this.context;
        if (value === undefined) { try { value = JSON.parse(this.getAttribute('context') || '{}'); } catch { throw new Error('画面の業務情報を確認できません。管理者に確認してください。'); } }
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        let encoded; try { encoded = JSON.stringify(value); } catch { throw new Error('画面の業務情報を確認できません。管理者に確認してください。'); }
        if (new TextEncoder().encode(encoded).length > 16384) throw new Error('画面の業務情報が大きすぎます。管理者に確認してください。');
        return JSON.parse(encoded);
    }
    updateControls() {
        const busy = this.isBusy(), unavailable = !this.ready || !this.activeAlias || !!this.selectionStale; this.submit.disabled = busy || unavailable || !!this.sendUncertain || this.attachments.some(entry => entry.state !== 'uploaded');
        this.input.disabled = unavailable;
        this.submit.hidden = !!this.abort; this.cancel.hidden = !this.abort;
        this.fresh.disabled = busy || !!this.sendUncertain; this.retry.disabled = busy; this.history.disabled = this.more.disabled = busy || unavailable || !!this.sendUncertain;
        for (const choice of this.historyList.querySelectorAll?.('button') || []) choice.disabled = busy || unavailable || !!this.sendUncertain;
        this.attachButton.disabled = this.fileInput.disabled = busy || unavailable || !this.attachmentPolicy;
        this.storedButton.disabled = busy || unavailable || !this.conversationId;
        this.panel.setAttribute('aria-busy', String(busy));
        for (const control of this.attachmentCards.querySelectorAll?.('button') || []) control.disabled = busy;
        for (const control of this.storedAttachments.querySelectorAll?.('button') || []) {
            const selected = this.attachments.some(entry => entry.attachment?.id === control.dataset.attachmentId);
            control.disabled = busy || selected || this.attachmentExpired(this.attachmentMetadata.get(control.dataset.attachmentId));
            control.textContent = selected ? '選択済み' : '送信対象に追加';
        }
    }
    async recover() {
        if (this.isBusy()) return; const uncertain = this.sendUncertain; this.loading = true; this.ready = false; this.updateControls(); this.setNotice('接続とAIの利用許可を確認しています…');
        try { await this.initialize(); this.ready = true; if (uncertain) this.setNotice('履歴と操作結果を確認してください。入力と添付は保持しています。依頼は再送していません。', 'info'); }
        catch (error) { this.setNotice(`${error.message} 「再読み込み」から利用状態を確認できます。業務の依頼は再送しません。`, 'error'); this.event('error', { message: this.notice.textContent }); }
        finally { this.loading = false; this.updateControls(); this.refreshEmpty(); }
    }
    async initialize() {
        const state = await this.api.state(); this.rendering = { attachmentUrlPrefixes: [], allowedImageOrigins: [], ...(state.rendering || {}) }; configureRendering(this.rendering); this.api.timezone = state.timezone;
        const surfaceName = this.getAttribute('surface'); const surface = (state.surfaces || []).find(item => item.name === surfaceName);
        const selectedAlias = surfaceName ? surface?.enabled ? surface.alias : '' : this.getAttribute('alias');
        const selection = (state.agents || []).find(item => item.alias === selectedAlias);
        const connection = (state.connections || []).find(item => item.id === selection?.connection_id);
        const revision = selection?.connection_revision ?? connection?.revision;
        const binding = selection ? `${selection.alias}:${selection.connection_id || ''}:${selection.grant_id || ''}:${revision || ''}` : '';
        if (this.bindingIdentity !== undefined && this.bindingIdentity !== binding) this.resetConversation();
        this.bindingIdentity = binding; this.activeAlias = selection ? selectedAlias : '';
        this.recoveryKey = binding ? `fourmix-run:${this.api.base}:${surfaceName || ''}:${binding}` : null;
        if (!this.activeRunId && this.recoveryKey) { try { const saved = JSON.parse(sessionStorage.getItem(this.recoveryKey) || 'null'); if (saved) { this.activeRunId = saved.run_id; this.conversationId = saved.conversation_id; this.sendUncertain = true; this.recovery.hidden = false; } } catch { /* Do not trust malformed local recovery data. */ } }
        this.api.expectation(selection?.connection_id && selection?.grant_id && revision != null ? { connection_id: selection.connection_id, grant_id: selection.grant_id, connection_revision: revision } : null); this.selectionStale = false;
        const conversationOnly = !!selection && connection && !Object.values(connection.permissions || {}).some(mode => ['review', 'automatic'].includes(mode));
        this.businessStatus.hidden = !conversationOnly;
        this.businessStatus.textContent = '会話のみ';
        this.businessStatus.href = `${this.api.base}#fi-connections`;
        this.businessStatus.title = 'この接続に業務操作は許可されていません。接続の権限を設定すると、許可の範囲で業務を利用できます。';
        this.businessStatus.setAttribute('aria-label', `${this.businessStatus.textContent}：${this.businessStatus.title}`);
        this.agentName = selection?.name || selection?.assistant_name || surface?.agent_name || this.getAttribute('assistant-name') || 'AIアシスタント'; this.agentTitle.textContent = this.agentName;
        this.setupLink.hidden = !!this.activeAlias;
        if (!this.activeAlias) {
            this.setNotice(surfaceName && (!surface || !surface.enabled) ? 'このチャット画面は無効になっています。' : 'このチャット画面のAIはまだ設定されていません。接続管理で設定してください。');
            this.attachmentPolicy = null; this.attachmentMetadata.clear(); this.storedAttachments.hidden = true;
            this.attachmentHelp.textContent = 'AIを設定すると、添付ファイルの利用条件が表示されます。';
        }
        if (this.activeAlias) { await this.refreshConversations(); if (this.conversationId) await this.loadHistory(this.conversationId); else await this.refreshAttachmentList(); }
        await this.pending(state); if (this.activeAlias && !this.selectionStale) this.setNotice(this.attachmentError ? this.attachmentHelp.textContent : '', this.attachmentError ? 'error' : 'info');
    }
    toggleHistory(open = this.historyPanel.hidden, restoreFocus = true) {
        this.historyPanel.hidden = !open; this.history.setAttribute('aria-expanded', String(open));
        if (open) this.historyClose.focus?.(); else if (restoreFocus) this.history.focus?.();
    }
    renderConversations() {
        this.historyList.replaceChildren(); this.historyStatus.hidden = !!this.conversations?.length; this.historyStatus.textContent = '会話履歴はまだありません';
        for (const conversation of this.conversations || []) {
            const choice = button('', async () => {
                if (this.isBusy() || !this.ready) return;
                this.historyStatus.hidden = false; this.historyStatus.textContent = '会話を読み込んでいます…';
                try { await this.loadHistory(conversation.identify); this.toggleHistory(false); }
                catch (error) { this.historyStatus.textContent = error.message; this.setNotice(error.message, 'error'); }
            }, 'ghost'); choice.className = 'fi-chat-history-item'; choice.setAttribute('aria-current', String(conversation.identify === this.conversationId));
            choice.append(node('span', conversation.title || '会話', 'fi-chat-history-item-title'));
            if (conversation.updated_at) choice.append(node('span', datetime(conversation.updated_at, this.api.timezone), 'fi-chat-history-item-date'));
            this.historyList.append(choice);
        }
        this.updateControls();
    }
    async refreshConversations() {
        this.historyStatus.hidden = false; this.historyStatus.textContent = '会話履歴を読み込んでいます…'; this.historyList.setAttribute('aria-busy', 'true');
        try { const result = await this.api.history(this.activeAlias); this.conversations = result.conversations || []; this.renderConversations(); }
        catch (error) { if (error.status === 409) this.invalidateSelection(); this.historyStatus.hidden = false; this.historyStatus.textContent = error.message; throw error; }
        finally { this.historyList.setAttribute('aria-busy', 'false'); }
    }
    async refreshAttachmentList(conversationId = this.conversationId) {
        const alias = this.activeAlias, request = this.attachmentListRequest = (this.attachmentListRequest || 0) + 1;
        const current = () => request === this.attachmentListRequest && alias === this.activeAlias && conversationId === this.conversationId && !this.selectionStale;
        this.attachmentError = false;
        try {
            const result = await this.api.attachments(this.activeAlias, conversationId);
            if (!current()) return;
            if (!result.policy || !Array.isArray(result.data)) throw new Error('添付の利用条件を確認できませんでした。');
            this.attachmentPolicy = result.policy; this.attachmentMetadata = new Map(result.data.map(file => [file.id, file]));
            this.fileInput.accept = (result.policy.extensions || []).map(extension => `.${String(extension).replace(/^\./, '')}`).join(',');
            this.attachmentHelp.textContent = `添付：${(result.policy.extensions || []).join('・')} ／ 1ファイル最大 ${this.fileSize(result.policy.max_bytes)} ／ 1回の送信は最大${result.policy.max_files}件`;
        } catch (error) { if (!current()) return; if (error.status === 409) { this.invalidateSelection(); throw error; } this.attachmentError = true; this.attachmentPolicy = null; this.attachmentMetadata.clear(); this.storedAttachments.hidden = true; this.attachmentHelp.textContent = `${error.message} 文字での会話は利用できます。`; }
        this.renderAttachments(); if (this.storedAttachments.open && !this.attachmentError) this.renderStoredAttachments();
    }
    fileSize(bytes) { return Number.isFinite(bytes) ? bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB` : '未確認'; }
    attachmentExpired(metadata) { return Number.isFinite(metadata?.expires_at) && metadata.expires_at * 1000 <= Date.now(); }
    attachmentLink(metadata, conversationId = this.conversationId) {
        if (this.attachmentExpired(metadata)) return node('p', `${metadata.name || '添付ファイル'}（利用期限切れ）`, 'fi:text-xs fi:text-secondary');
        const link = node('a', metadata.name || '添付ファイル', 'fi-attachment-link'); link.href = this.api.attachmentUrl(this.activeAlias, conversationId, metadata.id); link.target = '_blank'; link.rel = 'noopener noreferrer';
        if (['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'].includes(metadata.mime)) { const image = node('img', '', 'fi-attachment-preview'); image.src = link.href; image.alt = metadata.name || '添付画像'; image.loading = 'lazy'; image.onerror = () => image.remove(); link.prepend(image); }
        return link;
    }
    renderAttachments() {
        if (!this.attachmentCards) return; this.attachmentCards.replaceChildren(); this.attachmentCards.hidden = !this.attachments.length;
        for (const entry of this.attachments) {
            const card = node('div', '', 'fi-attachment-card'); card.dataset.state = entry.state;
            if (entry.previewUrl) { const image = node('img', '', 'fi-attachment-preview'); image.src = entry.previewUrl; image.alt = entry.file.name; card.append(image); }
            const title = node('div', '', 'fi-attachment-caption'); title.append(node('p', entry.attachment?.name || entry.file?.name || '添付ファイル', 'fi:font-medium'), node('p', `${this.fileSize(entry.attachment?.size ?? entry.file?.size)} · ${{ queued: 'アップロード待ち', uploading: 'アップロード中', uploaded: '送信するファイル', unknown: '結果の確認が必要', failed: 'アップロードできませんでした' }[entry.state]}`, 'fi:text-xs fi:text-secondary')); card.append(title);
            if (entry.error) card.append(node('p', entry.error, 'fi:text-xs fi:text-secondary'));
            if (['unknown', 'failed', 'queued'].includes(entry.state)) { const retry = button(entry.state === 'queued' ? 'アップロード' : '同じアップロードを再確認', () => this.uploadEntries([entry]), 'secondary'); card.append(retry); }
            if (entry.state === 'unknown') card.append(button('保存済みファイルを確認', () => this.checkAttachments(), 'ghost'));
            const remove = button('選択を外す', () => { if (this.isBusy()) return; this.revokePreview(entry); this.attachments = this.attachments.filter(item => item !== entry); this.renderAttachments(); this.updateControls(); }, 'ghost'); card.append(remove); this.attachmentCards.append(card);
        }
        this.updateControls();
    }
    async checkAttachments() {
        if (this.isBusy() || this.selectionStale) return; this.loading = true; this.updateControls();
        try { await this.refreshAttachmentList(); if (!this.attachmentError) { this.additions.open = true; this.storedAttachments.open = true; this.renderStoredAttachments(); }
        } finally { this.loading = false; this.updateControls(); }
    }
    renderStoredAttachments() {
        this.storedAttachments.hidden = false; this.storedAttachments.replaceChildren(node('summary', `保存済みファイル ${this.attachmentMetadata.size}件`));
        this.storedAttachments.append(node('p', '今回送信するファイルを選択してください。選択を外しても、保存済みファイルは削除されません。', 'fi:text-xs fi:text-secondary'));
        for (const metadata of this.attachmentMetadata.values()) {
            const row = node('div', '', 'fi-attachment-card'); row.append(this.attachmentLink(metadata));
            const choose = button('送信対象に追加', () => {
                if (this.isBusy() || !this.attachmentPolicy || this.attachments.some(entry => entry.attachment?.id === metadata.id)) return;
                if (this.attachments.length >= this.attachmentPolicy.max_files) { this.setNotice(`1回の送信で選べるファイルは最大${this.attachmentPolicy.max_files}件です。不要な選択を外してください。`, 'error'); return; }
                if (this.attachmentExpired(metadata)) { this.setNotice('このファイルは利用期限が切れています。新しいファイルを添付してください。', 'error'); return; }
                this.attachments.push({ state: 'uploaded', attachment: metadata }); this.renderAttachments(); this.updateControls();
            }, 'secondary'); choose.dataset.attachmentId = metadata.id; row.append(choose); this.storedAttachments.append(row);
        }
        this.updateControls();
    }
    async addFiles(files) {
        if (this.selectionStale) { this.invalidateSelection(); return; }
        if (this.isBusy() || !this.ready || !this.attachmentPolicy) { this.setNotice('添付の利用条件を確認してからファイルを選択してください。', 'error'); return; }
        if (this.attachments.some(entry => entry.state === 'unknown')) { this.setNotice('結果が不明なアップロードを先に確認してください。同じファイルを自動で再アップロードしません。', 'error'); return; }
        const policy = this.attachmentPolicy, extensions = (policy.extensions || []).map(extension => String(extension).replace(/^\./, '').toLowerCase());
        if (files.length + this.attachments.length > policy.max_files) { this.setNotice(`1回の送信で選べるファイルは最大${policy.max_files}件です。不要な選択を外してください。`, 'error'); return; }
        for (const file of files) { if (!extensions.includes(file.name.split('.').pop().toLowerCase()) || file.size > policy.max_bytes || !file.size) { this.setNotice(`${file.name}は添付できません。対応する形式とサイズを確認してください。`, 'error'); return; } }
        this.setNotice('');
        const entries = files.map(file => ({ file, requestId: crypto.randomUUID(), state: 'queued', previewUrl: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'].includes(file.type) && URL.createObjectURL ? URL.createObjectURL(file) : null })); this.attachments.push(...entries); this.renderAttachments(); await this.uploadEntries(entries);
    }
    async uploadEntries(entries) {
        if (this.isBusy() || !this.ready || !this.activeAlias || this.selectionStale) return; this.uploading = true; this.uploadAbort = new AbortController(); this.updateControls();
        try { for (const entry of entries) {
            entry.state = 'uploading'; entry.error = ''; this.renderAttachments();
            if (!Object.hasOwn(entry, 'uploadConversation')) entry.uploadConversation = this.conversationId;
            try { const result = await this.api.uploadAttachment(this.activeAlias, entry.file, { conversationId: entry.uploadConversation, requestId: entry.requestId, signal: this.uploadAbort.signal });
                if (!result.conversation_id || !result.attachment?.id) throw new Error('アップロード結果を確認できませんでした。');
                this.conversationId = result.conversation_id; this.renderConversations(); entry.attachment = result.attachment; entry.state = 'uploaded'; this.attachmentMetadata.set(result.attachment.id, result.attachment); this.event('attachment', result);
            } catch (error) { if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(error.data?.conversation_id || '')) { this.conversationId = error.data.conversation_id; this.renderConversations(); }
                entry.state = error.status >= 400 && error.status < 500 && error.status !== 409 ? 'failed' : 'unknown'; entry.error = error.message; if (error.status === 409 && !error.data?.conversation_id) this.invalidateSelection(); else this.setNotice(`${error.message} 保存済みファイルを確認してください。自動でアップロードや依頼を繰り返しません。`, 'error'); break; }
            this.renderAttachments();
        } } finally { this.uploading = false; this.uploadAbort = null; this.renderAttachments(); this.updateControls(); }
    }
    message(role, text, attachmentIds = [], conversationId = this.conversationId, applicationReceipt = null, artifacts = []) {
        const user = role === 'user'; const item = node('article', '', `fi-chat-message fi:min-w-0 fi:flex ${user ? 'fi:justify-end' : 'fi:justify-start'}`);
        const bubble = node('div', '', user ? 'fi-chat-user fi:max-w-[88%] fi:space-y-1 fi:rounded-2xl fi:rounded-tr-md fi:bg-raised fi:px-4 fi:py-3' : 'fi-chat-assistant fi:w-full fi:min-w-0 fi:space-y-3');
        const receipt = !user && applicationReceipt && ['succeeded', 'rejected', 'expired'].includes(applicationReceipt.state) ? applicationReceipt : null;
        const author = node('p', '', 'fi:flex fi:items-center fi:gap-2 fi:text-xs fi:font-semibold fi:text-secondary'); if (!user) author.append(icon(receipt ? 'shield' : 'chat')); author.append(node('span', user ? 'あなた' : receipt ? 'このアプリケーション' : this.agentName || 'AI アシスタント'));
        if (receipt) {
            const result = node('div', '', 'fi:space-y-3'); actionResult(receipt, result);
            bubble.append(author, node('p', { succeeded: '業務操作が完了しました。', rejected: '業務操作は実行せず終了しました。', expired: '確認期限が切れました。業務操作は実行されていません。' }[receipt.state]), result);
        } else bubble.append(author, user ? node('p', text, 'fi:text-sm fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words') : renderMarkdown(text, this.rendering));
        if (attachmentIds.length) { const files = node('div', '', 'fi-message-attachments'); for (const id of attachmentIds) { const metadata = this.attachmentMetadata.get(id); if (metadata) files.append(this.attachmentLink(metadata, conversationId)); else { const placeholder = node('p', '添付ファイルを確認しています…', 'fi:text-xs fi:text-secondary'); placeholder.dataset.pendingAttachment = id; files.append(placeholder); } } bubble.append(files); }
        item.append(bubble); this.messages.append(item); if (!user) this.renderArtifacts(item, artifacts, conversationId); this.refreshEmpty(); item.scrollIntoView({ block: 'nearest' }); return item;
    }
    async loadHistory(id, beforeId) {
        if (this.abort || this.uploading || this.selectionStale || !id) return;
        const alias = this.activeAlias, request = this.historyRequest = (this.historyRequest || 0) + 1;
        const current = () => request === this.historyRequest && alias === this.activeAlias && !this.selectionStale;
        if (id !== this.conversationId) this.abortArtifactDownloads(); const ownsLoading = !this.loading || this.historyLoadingOwner != null; if (ownsLoading) { this.historyLoadingOwner = request; this.loading = true; this.setNotice('会話を読み込んでいます…'); } this.updateControls();
        try { const result = await this.api.history(this.activeAlias, id, beforeId);
            if (!current()) return;
            if (this.conversationId !== id) { this.stopProgress(); this.startedAt = null; this.progress.hidden = true; if (this.conversationId) { this.clearAttachments(); this.storedAttachments.hidden = true; this.storedAttachments.open = false; this.storedAttachments.replaceChildren(); } } this.conversationId = id;
            this.attachmentMetadata.clear();
            const previous = beforeId ? [...this.messages.childNodes] : []; if (beforeId) this.messages.replaceChildren(); else this.clearMessages();
            for (const message of result.messages || []) this.message(message.role, String(message.content || ''), message.attachment_ids || [], id, message.application_receipt, message.artifacts || []); this.messages.append(...previous); this.refreshEmpty(); this.beforeId = result.has_more ? result.before_id : null; this.more.hidden = !this.beforeId; this.renderConversations(); if (this.runTerminal) this.sendUncertain = false; this.event('history', result);
            if (!beforeId && result.latest_run?.status === 'failed') {
                this.message('assistant', result.latest_run.cancelled === true
                    ? 'この依頼は停止しました。実行済みの操作は元に戻りません。'
                    : 'この依頼の応答を完了できませんでした。再送する前に、会話履歴と操作結果を確認してください。');
            }
            if (!beforeId) {
                const receipt = result.messages?.at(-1)?.application_receipt;
                const outcome = { succeeded: '業務操作が完了しました', rejected: '業務操作は実行せず終了しました', expired: '確認期限が切れました' }[receipt?.state];
                if (outcome) { this.stopProgress(); this.progressLabel.textContent = outcome; }
            }
            await this.refreshAttachmentList(id);
            if (!current() || this.conversationId !== id) return;
            for (const placeholder of this.messages.querySelectorAll('[data-pending-attachment]')) {
                const metadata = this.attachmentMetadata.get(placeholder.dataset.pendingAttachment);
                if (metadata) placeholder.replaceWith(this.attachmentLink(metadata, id));
                else placeholder.textContent = '添付ファイル（利用期限や取得権限を確認してください）';
            }
            if (ownsLoading) this.setNotice(this.attachmentError ? this.attachmentHelp.textContent : '', this.attachmentError ? 'error' : 'info');
        } catch (error) { if (!current()) return; if (error.status === 409) this.invalidateSelection(); throw error; } finally { if (this.historyLoadingOwner === request) { this.loading = false; this.historyLoadingOwner = null; } this.updateControls(); }
    }
    async refreshActionResults(actionState) {
        if (!this.ready || this.isBusy() || this.selectionStale || !this.conversationId) return;
        try {
            await this.loadHistory(this.conversationId);
        } catch (error) {
            if (error.status !== 409) this.setNotice([401, 419].includes(error.status) ? `${error.message} 同じ操作を再実行する必要はありません。` : '操作の実行結果を会話へ反映できませんでした。再読み込みして結果を確認してください。同じ操作を再実行する必要はありません。', 'error');
            return;
        }
        try {
            await this.pending(await this.api.state());
            if (this.approvals.hidden && states[actionState]) this.progressLabel.textContent = states[actionState];
        } catch (error) {
            if (error.status === 409) this.invalidateSelection();
            else this.setNotice([401, 419].includes(error.status) ? `${error.message} 同じ操作を再実行する必要はありません。` : '会話履歴は更新しました。確認待ちの一覧を更新できませんでした。再読み込みして確認してください。同じ操作を再実行する必要はありません。', 'error');
        }
    }
    async pending(state) { this.approvals.replaceChildren(); for (const action of state.actions || []) if (action.state === 'confirmation_required') { const description = (state.tools || []).find(tool => tool.name === action.operation)?.description; const label = description?.split('。')[0] || action.operation; const review = button(`操作を確認：${label}`, () => showAction(this.api, action.id, this, async () => this.pending(await this.api.state())), 'secondary', 'shield'); review.title = description || action.operation; this.approvals.append(review); } this.approvals.hidden = this.approvals.childNodes.length === 0; }
    async send() {
        if (this.isBusy() || !this.ready || !this.activeAlias || this.selectionStale || this.sendUncertain || this.attachments.some(entry => entry.state !== 'uploaded')) return;
        const draft = this.input.value, entries = [...this.attachments], attachmentIds = entries.map(entry => entry.attachment.id); if (!draft.trim() && !attachmentIds.length) return;
        if (entries.some(entry => this.attachmentExpired(entry.attachment))) { this.setNotice('添付ファイルの利用期限が切れています。選択を外し、新しいファイルを添付してください。', 'error'); return; }
        let context; try { context = this.businessContext(); } catch (error) { this.setNotice(error.message, 'error'); return; }
        const message = draft.trim() || '添付ファイルの内容を確認し、要点を日本語でまとめてください。'; this.message('user', message, attachmentIds); this.activeRunId = null; this.stopQueued = false; this.stopRequested = false; this.runTerminal = false; this.runCancelled = false; this.cancel.disabled = false; this.recovery.hidden = true; this.abort = new AbortController(); this.saveRunRecovery(); this.liveAnswer = null; this.updateControls(); this.cancel.hidden = false; this.setNotice(''); this.startProgress();
        this.input.value = ''; this.resizeInput();
        try { const result = await this.api.ask(this.activeAlias, message, { conversationId: this.conversationId, context, attachmentIds, signal: this.abort.signal, onEvent: event => this.streamEvent(event) }); this.runTerminal = true; this.conversationId = result.conversation_id || this.conversationId; this.renderConversations(); this.renderArtifacts(this.finishAnswer(result.result?.answer || result.answer || '応答を受け取りました。'), result.result?.data?.artifacts || result.result?.artifacts || result.data?.artifacts || result.artifacts || []);
            this.stopProgress(); this.progressLabel.textContent = result.result?.data?.run_outcome === 'confirmation_required' ? '内容を確認して承認してください' : '回答が完了しました';
            for (const entry of entries) this.revokePreview(entry); this.attachments = this.attachments.filter(entry => !entries.includes(entry)); this.renderAttachments(); this.setNotice(''); try { await this.refreshConversations(); } catch { this.setNotice('回答は受信しました。会話一覧を更新できなかったため、再読み込みして履歴をご確認ください。', 'error'); } this.event('response', result);
        } catch (error) { this.stopProgress(); this.progressLabel.textContent = error.name === 'AbortError' ? '待機を終了しました' : '応答が中断されました'; if (this.liveAnswer) { this.renderStreamAnswer(true); this.liveAnswer.append(node('p', '途中まで受信した回答です。完了結果は会話履歴で確認してください。', 'fi:text-xs fi:text-secondary')); this.liveAnswer = null; } if (!this.input.value) { this.input.value = draft; this.resizeInput(); } this.sendUncertain = !this.runTerminal; this.recovery.hidden = this.runTerminal; if (this.runCancelled) { this.progressLabel.textContent = '停止が完了しました'; this.setNotice('停止が完了しました。実行済みの操作は元に戻りません。'); } else if (error.status === 409) this.invalidateSelection(); else this.setNotice(error.name === 'AbortError' ? '応答の待機をやめました。サーバー側の処理は続く場合があります。草稿と添付は保持しています。履歴と操作結果を確認してください。' : `${error.message} 草稿と添付は保持しています。履歴と操作結果を確認してから、次の依頼を送ってください。`, 'error'); this.event('error', { message: this.notice.textContent }); }
        finally { this.stopProgress(); if (this.runTerminal) this.clearRunRecovery(); this.abort = null; this.updateControls(); this.cancel.hidden = true; try { await this.pending(await this.api.state()); } catch { /* Keep the main error visible. */ } }
    }
}
if (!customElements.get('fourmix-intelligence-chat')) customElements.define('fourmix-intelligence-chat', FourmixIntelligenceChat);
