import { request } from './sdk.js';

const element = (tag, text = '', className = '') => { const node = document.createElement(tag); node.textContent = text; node.className = className; return node; };
let floatingSequence = 0;
const objectContext = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const controlIcon = pathData => { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(key, value); const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', pathData); svg.append(path); return svg; };

/** A persistent native chat surface; closing never cancels or resends a request. */
export class FourmixIntelligenceFloatingChat extends HTMLElement {
    static get observedAttributes() { return ['position', 'label', 'title', 'alias', 'surface', 'initial-prompt', 'context', 'api-base', 'csrf-token', 'conversation-id', 'fallback-url', 'assistant-name', 'input-placeholder', 'composer-max-height', 'launcher-hidden', 'history-layout']; }
    connectedCallback() {
        this.openHandler ||= event => {
            const detail = objectContext(event.detail);
            if (detail.id && detail.id !== this.id) return;
            if (detail.alias && detail.alias !== this.getAttribute('alias')) return;
            const source = event.target?.closest?.('fourmix-intelligence-floating-chat');
            if (source && source !== this) return;
            if (!source && !detail.id) {
                const candidate = [...document.querySelectorAll('fourmix-intelligence-floating-chat')].find(widget => !detail.alias || widget.getAttribute('alias') === detail.alias);
                if (candidate !== this) return;
            }
            if (detail.context) this.context = detail.context;
            if (!this.chat && typeof detail.initialPrompt === 'string') this.setAttribute('initial-prompt', detail.initialPrompt);
            this.open();
        };
        document.addEventListener('fourmix:open-chat', this.openHandler);
        this.surfaceHandler ||= event => { if (Array.isArray(event.detail)) { this.surfaceGeneration = (this.surfaceGeneration || 0) + 1; this.applySurface(event.detail); } };
        document.defaultView.addEventListener('fourmix:surfaces', this.surfaceHandler);
        if (this.initialized) { this.refreshSurface(); return; } this.initialized = true;
        this.launcher = element('a', '', 'fi-floating-launcher'); this.launcher.setAttribute('aria-haspopup', 'dialog'); this.launcher.setAttribute('aria-expanded', 'false');
        const mark = element('span', '', 'fi-floating-mark'); mark.setAttribute('aria-hidden', 'true');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '20'); svg.setAttribute('height', '20'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M4 4h16v12H9l-5 4V4Z'); svg.append(path); mark.append(svg); this.launcher.append(mark);
        this.launcherLabel = element('span'); this.launcher.append(this.launcherLabel);
        this.dialog = element('dialog', '', 'fi-floating-dialog'); this.dialog.id = `fi-floating-dialog-${++floatingSequence}`; this.dialog.setAttribute('aria-modal', 'false'); this.launcher.setAttribute('aria-controls', this.dialog.id);
        const header = this.header = element('header', '', 'fi-floating-header'); this.heading = element('h2', '', 'fi:sr-only'); this.heading.id = `${this.dialog.id}-title`; this.dialog.setAttribute('aria-labelledby', this.heading.id);
        this.closeButton = element('button', '', 'fi-button fi-button-ghost fi-chat-icon-button fi-floating-close'); this.closeButton.append(controlIcon('M6 6l12 12M18 6 6 18')); this.closeButton.type = 'button'; this.closeButton.setAttribute('aria-label', 'AIチャットを閉じる'); this.closeButton.title = 'AIチャットを閉じる'; this.closeButton.onclick = () => this.close();
        this.body = element('div', '', 'fi-floating-body');
        const description = element('p', '閉じても会話と入力中の内容は保持されます。', 'fi:sr-only'); description.id = `${this.dialog.id}-description`; this.dialog.setAttribute('aria-describedby', description.id);
        this.fallback = element('a', '', 'fi-button fi-button-ghost fi-chat-icon-button fi-floating-fallback'); this.fallback.append(controlIcon('M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7')); this.fallback.setAttribute('aria-label', '独立したチャット画面で開く'); this.fallback.title = '独立したチャット画面で開く';
        this.windowActions = element('div', '', 'fi-floating-window-actions'); this.windowActions.append(this.fallback, this.closeButton); header.append(this.heading, description, this.windowActions); this.dialog.append(header, this.body); this.replaceChildren(this.launcher, this.dialog);
        this.launcher.onclick = event => { if (typeof this.dialog.show !== 'function' || !customElements.get('fourmix-intelligence-chat')) return; event.preventDefault(); this.open(); };
        this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
        this.dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); } });
        this.dialog.addEventListener('close', () => { this.launcher.setAttribute('aria-expanded', 'false'); if (this.restoreFocusOnClose) { const target = this.returnFocus?.isConnected ? this.returnFocus : this.launcher; target.focus({ preventScroll: true }); } this.restoreFocusOnClose = false; this.dispatchEvent(new CustomEvent('fourmix:floating-close', { bubbles: true, composed: true })); });
        this.sync();
        this.refreshSurface();
    }
    disconnectedCallback() { document.removeEventListener('fourmix:open-chat', this.openHandler); document.defaultView.removeEventListener('fourmix:surfaces', this.surfaceHandler); this.surfaceGeneration = (this.surfaceGeneration || 0) + 1; }
    attributeChangedCallback(name) { if (name === 'context') this.businessContext = undefined; if (this.initialized) { this.sync(); if (['surface', 'api-base'].includes(name)) this.refreshSurface(); } }
    applySurface(surfaces) {
        const name = this.getAttribute('surface'); if (!name) return;
        this.surfaceEnabled = surfaces.find(surface => surface.name === name)?.enabled === true;
        if (!this.surfaceEnabled) this.close(); this.sync();
    }
    async refreshSurface() {
        if (!this.getAttribute('surface')) { this.surfaceEnabled = true; this.sync(); return; }
        const generation = this.surfaceGeneration = (this.surfaceGeneration || 0) + 1;
        this.surfaceEnabled = false; this.close(); this.sync();
        try { const state = await request(`${(this.getAttribute('api-base') || '/fourmix-intelligence').replace(/\/$/, '')}/state`, { csrfToken: this.getAttribute('csrf-token') || undefined }); if (generation === this.surfaceGeneration && this.isConnected) this.applySurface(state.surfaces || []); }
        catch (error) { if (generation === this.surfaceGeneration && this.isConnected) this.dispatchEvent(new CustomEvent('fourmix:error', { detail: { message: error.message }, bubbles: true, composed: true })); }
    }
    get context() { if (this.businessContext !== undefined) return this.businessContext; try { return objectContext(JSON.parse(this.getAttribute('context') || '{}')); } catch { return {}; } }
    set context(value) { this.businessContext = objectContext(value); if (this.chat) this.chat.context = this.businessContext; }
    sync() {
        const position = this.getAttribute('position') === 'left' ? 'left' : 'right'; this.dataset.position = position; this.dialog.dataset.position = position;
        this.launcherLabel.textContent = this.getAttribute('label') || 'AIに相談'; this.heading.textContent = this.getAttribute('title') || 'AIアシスタント';
        this.launcher.hidden = this.hasAttribute('launcher-hidden') || (this.getAttribute('surface') && this.surfaceEnabled !== true);
        const base = this.getAttribute('api-base') || '/fourmix-intelligence'; const defaultUrl = `${base.replace(/\/$/, '')}/chat`;
        let url;
        try { const candidate = new URL(this.getAttribute('fallback-url') || defaultUrl, location.origin); if (candidate.origin === location.origin && ['http:', 'https:'].includes(candidate.protocol)) url = candidate.href; } catch { /* The host may omit an invalid fallback URL. */ }
        this.launcher.href = this.fallback.href = url || '#'; this.fallback.hidden = !url;
        if (this.chat) {
            for (const name of ['alias', 'surface', 'initial-prompt', 'context', 'api-base', 'csrf-token', 'conversation-id', 'assistant-name', 'input-placeholder', 'composer-max-height', 'history-layout']) { const value = this.getAttribute(name); if (value !== null) this.chat.setAttribute(name, value); }
            this.chat.setAttribute('composer-max-height', this.getAttribute('composer-max-height') || '112');
            this.chat.setAttribute('presentation', 'floating');
            this.chat.setAttribute('layout', 'fill');
            this.chat.context = this.context;
        }
    }
    open() {
        if (!this.initialized || (this.getAttribute('surface') && this.surfaceEnabled !== true) || typeof this.dialog.show !== 'function' || !customElements.get('fourmix-intelligence-chat')) return false;
        if (this.dialog.open) return true;
        this.returnFocus = document.activeElement;
        if (!this.chat) { this.chat = document.createElement('fourmix-intelligence-chat'); this.chat.setAttribute('aria-label', 'Fourmix IntelligenceのAIチャット'); this.sync(); this.body.append(this.chat); if (this.chat.toolbar) { this.chat.toolbar.append(this.windowActions); this.header.classList.add('fi-floating-header-merged'); } }
        this.dialog.show(); this.launcher.setAttribute('aria-expanded', 'true');
        this.chat.resizeInput?.();
        if (this.returnFocus?.isConnected && !this.dialog.contains(this.returnFocus)) this.returnFocus.focus({ preventScroll: true });
        this.dispatchEvent(new CustomEvent('fourmix:floating-open', { bubbles: true, composed: true })); return true;
    }
    close() { if (this.dialog?.open) { this.restoreFocusOnClose = this.dialog.contains(document.activeElement); this.dialog.close(); } }
}
if (!customElements.get('fourmix-intelligence-floating-chat')) customElements.define('fourmix-intelligence-floating-chat', FourmixIntelligenceFloatingChat);
