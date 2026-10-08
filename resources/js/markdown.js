
const generatedArtifactLinks = new WeakMap();
export function bindGeneratedArtifactLinks(target, artifacts = [], open) {
    for (const link of target.querySelectorAll('a[data-artifact-autolink]')) {
        if (artifacts.some(item => typeof item?.name === 'string' && item.name === link.getAttribute('data-artifact-autolink'))) {
            link.replaceWith(document.createTextNode(link.textContent));
        }
    }

    for (const link of target.querySelectorAll('a')) {
        const href = generatedArtifactLinks.get(link) || link.getAttribute('data-generated-source') || link.getAttribute('href');
        if (!href) continue;
        let generated = false;
        try { generated = new URL(href, 'https://fourmix.invalid').pathname.replace(/\/$/, '') === '/api/v3/generated-artifacts'; } catch {}
        if (!generated) continue;
        generatedArtifactLinks.set(link, href); link.removeAttribute('href'); link.removeAttribute('target'); link.removeAttribute('data-generated-source');
        link.setAttribute('role', 'button'); link.tabIndex = 0;
        const artifact = artifacts.find(item => item && typeof item.download_url === 'string' && item.download_url === href);
        const activate = event => {
            event.preventDefault(); event.stopPropagation();
            if (artifact && typeof open === 'function') { open(artifact); return; }
            let notice = target.querySelector('[data-generated-link-notice]');
            if (!notice) { notice = document.createElement('p'); notice.setAttribute('data-generated-link-notice', ''); notice.setAttribute('role', 'status'); target.append(notice); }
            notice.textContent = 'このリンクは利用できません。「作成したファイル」の保存ボタンをご利用ください。表示されない場合はファイルを作成し直してください。';
        };
        link.onclick = activate; link.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') activate(event); };
    }
}
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
let defaults = {};
let sequence = 0;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);
const element = (tag, text = '', className = '') => { const node = document.createElement(tag); node.textContent = text; node.className = className; return node; };

/** Options must come from trusted host settings, never from AI output. */
export function configureRendering(options = {}) { defaults = { ...options }; }

function safeUrl(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\u007f]|&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z]+);/i.test(value)) return null;
    try {
        const url = new URL(value, window.location.href);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null;
    } catch { return null; }
}

function imagePolicy(url, options) {
    if (!url) return null;
    try { if (/\.svg(?:z)?$/i.test(decodeURIComponent(url.pathname))) return null; } catch { return null; }
    const sameOrigin = url.origin === window.location.origin;
    const exact = (options.attachmentUrls || []).some(value => safeUrl(value)?.href === url.href);
    const prefix = (options.attachmentUrlPrefixes || []).some(value => {
        const trusted = safeUrl(value);
        return trusted && trusted.origin === window.location.origin && !trusted.search && !trusted.hash
            && trusted.pathname.endsWith('/') && url.pathname.startsWith(trusted.pathname);
    });
    const attachment = sameOrigin && (exact || prefix);
    const allowed = (options.allowedImageOrigins || []).some(value => safeUrl(value)?.origin === url.origin);
    return { attachment, auto: attachment || allowed };
}

function matchesImageSignature(chunks, type) {
    const header = new Uint8Array(64); let offset = 0;
    for (const chunk of chunks) { const part = chunk.subarray(0, header.length - offset); header.set(part, offset); offset += part.length; if (offset === header.length) break; }
    const starts = bytes => bytes.every((value, index) => header[index] === value);
    const ascii = (start, end) => String.fromCharCode(...header.subarray(start, end));
    if (type === 'image/png') return starts([137, 80, 78, 71, 13, 10, 26, 10]);
    if (type === 'image/jpeg') return starts([255, 216, 255]);
    if (type === 'image/gif') return ['GIF87a', 'GIF89a'].includes(ascii(0, 6));
    if (type === 'image/webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    if (type === 'image/avif') return ascii(4, 8) === 'ftyp' && /(?:avif|avis)/.test(ascii(8, offset));
    return false;
}

async function loadImage(url, policy, image, status, signal, failed) {
    status.textContent = '画像を読み込んでいます…';
    const response = await fetch(url.href, { credentials: policy.attachment ? 'same-origin' : 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal });
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!response.ok || !imageTypes.has(type)) throw new Error('対応する形式の画像を取得できませんでした。');
    const limit = 8 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) throw new Error('画像が大きすぎます（上限8MB）。');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('画像を取得できませんでした。');
    const chunks = []; let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read(); if (done) break;
            size += value.byteLength;
            if (size > limit) { await reader.cancel(); throw new Error('画像が大きすぎます（上限8MB）。'); }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    signal.throwIfAborted();
    if (!matchesImageSignature(chunks, type)) throw new Error('画像の形式を確認できませんでした。');
    const blobUrl = URL.createObjectURL(new Blob(chunks, { type }));
    image.onload = () => { URL.revokeObjectURL(blobUrl); status.textContent = ''; };
    image.onerror = () => { URL.revokeObjectURL(blobUrl); status.textContent = '画像を表示できませんでした。'; image.remove(); failed(); };
    signal.addEventListener('abort', () => { URL.revokeObjectURL(blobUrl); image.removeAttribute('src'); }, { once: true });
    image.src = blobUrl;
}

function decorateCode(code, language, tasks, signal) {
    const pre = code.parentElement;
    const toolbar = element('div', '', 'fi-code-toolbar fi:flex fi:items-center fi:justify-between fi:gap-3');
    const label = element('span', language || 'テキスト');
    const copy = element('button', 'コピー', 'fi-button fi-button-ghost fi:whitespace-nowrap'); copy.type = 'button'; copy.setAttribute('aria-live', 'polite');
    const raw = code.textContent;
    copy.onclick = async () => {
        try { await navigator.clipboard.writeText(raw); copy.textContent = 'コピーしました'; }
        catch { copy.textContent = 'コピーできません'; copy.title = 'コードを選択してコピーしてください。'; }
    };
    toolbar.append(label, copy); pre.before(toolbar); pre.classList.add('fi-code-content');
    if (language && language !== 'mermaid' && raw.length <= 50000) tasks.push(import('highlight.js/lib/common').then(({ default: highlight }) => {
        if (signal.aborted || !highlight.getLanguage(language)) return;
        const fragment = DOMPurify.sanitize(highlight.highlight(raw, { language, ignoreIllegals: true }).value, { RETURN_DOM_FRAGMENT: true, ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class'], ALLOW_DATA_ATTR: false });
        for (const span of fragment.querySelectorAll('span')) {
            const classes = [...span.classList].filter(value => /^hljs-[a-z0-9_-]+$/.test(value)); span.className = classes.join(' ');
        }
        code.replaceChildren(fragment);
    }).catch(() => {}));
}

/** AI output is inert Markdown: raw HTML and external images are never activated. */
export function renderMarkdown(text, overrides = {}) {
    const options = { ...defaults, ...overrides };
    const abort = new AbortController(); const tasks = []; const embeds = [];
    const container = document.createElement('div');
    container.className = 'fi-markdown fi:min-w-0 fi:space-y-3 fi:break-words';
    container.dispose = () => abort.abort();
    const marker = `fi-embed-${++sequence}-`;
    const markdown = new Marked({ gfm: true, breaks: true, async: false, renderer: {
        html: ({ text }) => escape(text),
        image: token => { const id = marker + embeds.length; embeds.push({ id, token }); return `<span id="${id}"></span>`; },
        code: token => { const id = marker + embeds.length; embeds.push({ id, code: token }); return `<div id="${id}"></div>`; },
        link: function (token) {
            const url = safeUrl(token.href); const label = this.parser.parseInline(token.tokens);
            if (url && /^\/connection-actions\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(url.pathname) && !url.search && !url.hash) return `${label}（正式な操作確認カードで内容を確認してください）`;
            const autoFile = token.raw === token.text && !/^(?:https?:\/\/|www\.)/i.test(token.raw || '') ? ` data-artifact-autolink="${escape(token.text)}"` : '';
            const generatedSource = url?.pathname.replace(/\/$/, '') === '/api/v3/generated-artifacts' ? ` data-generated-source="${escape(token.href)}"` : '';
            return url ? `<a href="${escape(url.href)}"${generatedSource}${autoFile}${token.title ? ` title="${escape(token.title)}"` : ''}>${label}</a>` : label;
        },
    } });
    if (!DOMPurify.isSupported) { container.textContent = String(text); container.ready = Promise.resolve(); return container; }
    const source = String(text);
    container.append(DOMPurify.sanitize(source.length <= 200000 ? markdown.parse(source) : `<p>${escape(source)}</p>`, {
        RETURN_DOM_FRAGMENT: true,
        ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'del', 'blockquote', 'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'],
        ALLOWED_ATTR: ['id', 'href', 'title', 'start', 'align'],
        ADD_URI_SAFE_ATTR: ['align'],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        ALLOWED_URI_REGEXP: /^https?:\/\//i,
    }));
    for (const table of container.querySelectorAll('table')) {
        const scroll = document.createElement('div');
        scroll.className = 'fi:max-w-full fi:overflow-x-auto';
        table.before(scroll); scroll.append(table);
        scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', '表（横にスクロールできます）');
        for (const cell of table.querySelectorAll('[align]')) { cell.style.textAlign = cell.getAttribute('align'); cell.removeAttribute('align'); }
    }
    for (const link of container.querySelectorAll('a[href]')) {
        link.target = '_blank'; link.rel = 'noopener noreferrer';
    }
    let diagrams = 0;
    for (const embed of embeds) {
        const target = container.querySelector(`#${embed.id}`); if (!target) continue; target.removeAttribute('id');
        if (embed.code) {
            const requestedLanguage = (embed.code.lang || '').split(/\s+/)[0].toLowerCase();
            const language = /^[a-z0-9_.+#-]{1,40}$/.test(requestedLanguage) ? requestedLanguage : '';
            const block = element('div', '', 'fi-code-block fi:min-w-0 fi:overflow-hidden'); const pre = element('pre'); const code = element('code', embed.code.text); pre.append(code); block.append(pre); target.replaceWith(block);
            if (!options.streaming) decorateCode(code, language, tasks, abort.signal);
            if (!options.streaming && language === 'mermaid' && ++diagrams <= 6) {
                const figure = element('figure', '', 'fi-diagram fi:max-w-full fi:overflow-x-auto');
                const status = element('p', '図を作成しています…', 'fi:my-2 fi:text-sm'); status.setAttribute('role', 'status'); figure.append(status); block.before(figure);
                tasks.push(import('./mermaid.js').then(({ renderDiagram }) => renderDiagram(embed.code.text, { signal: abort.signal })).then(svg => {
                    if (abort.signal.aborted) return;
                    const canvas = element('div', '', 'fi-diagram-canvas'); canvas.tabIndex = 0; canvas.setAttribute('role', 'region'); canvas.setAttribute('aria-label', '図（拡大時は上下左右にスクロールできます）'); canvas.append(svg);
                    const fitWidth = svg.getAttribute('width'); const bounds = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
                    const naturalWidth = bounds.length === 4 && bounds.every(Number.isFinite) ? Math.min(1920, Math.max(1, bounds[2])) : Number(fitWidth);
                    const zoom = element('button', '図を拡大', 'fi-button fi-button-secondary'); zoom.type = 'button'; zoom.setAttribute('aria-pressed', 'false');
                    zoom.onclick = () => { const expanded = zoom.getAttribute('aria-pressed') !== 'true'; zoom.setAttribute('aria-pressed', String(expanded)); zoom.textContent = expanded ? '図を元の大きさに戻す' : '図を拡大'; svg.setAttribute('width', expanded ? String(naturalWidth) : fitWidth); svg.style.maxWidth = expanded ? 'none' : '100%'; };
                    figure.replaceChildren(zoom, canvas); const details = element('details'); details.append(element('summary', '図のコードを確認'), block); figure.append(details);
                }).catch(() => { if (!abort.signal.aborted) status.textContent = '図を表示できませんでした。以下のコードを確認してください。'; }));
            } else if (!options.streaming && language === 'mermaid') {
                block.before(element('p', '1つの回答で表示できる図は6つまでです。以下のコードを確認してください。', 'fi:text-sm'));
            }
        } else {
            if (options.streaming) { target.replaceWith(element('span', `${embed.token.text || '画像'}（回答後に表示）`)); continue; }
            const url = safeUrl(embed.token.href); const policy = imagePolicy(url, options);
            if (!policy) { target.replaceWith(element('span', `${embed.token.text || '画像'}（この画像形式・URLは表示できません）`)); continue; }
            const figure = element('span', '', 'fi-image-placeholder fi:inline-flex fi:max-w-full fi:flex-col fi:gap-2');
            const status = element('span', policy.auto ? '画像を読み込んでいます…' : '外部画像です。読み込むと画像の提供元にアクセスします。', 'fi:text-sm'); status.setAttribute('role', 'status');
            const image = element('img'); image.alt = embed.token.text || 'AI回答の画像'; image.className = 'fi:max-w-full fi:h-auto fi:rounded-lg'; image.referrerPolicy = 'no-referrer';
            const load = element('button', policy.auto ? '再読み込み' : '画像を読み込む', 'fi-button fi-button-secondary fi:whitespace-nowrap'); load.type = 'button';
            const run = async () => {
                if (abort.signal.aborted) return; load.disabled = true;
                try { await loadImage(url, policy, image, status, abort.signal, () => { load.hidden = false; }); if (!abort.signal.aborted) { figure.append(image); load.hidden = true; } }
                catch (error) { if (!abort.signal.aborted) { status.textContent = /[ぁ-んァ-ヶ一-龠]/.test(error.message || '') ? error.message : '画像を取得できませんでした。通信と画像の公開設定を確認してください。'; load.hidden = false; } }
                finally { load.disabled = false; }
            };
            load.onclick = run; figure.append(status, load); target.replaceWith(figure);
            if (policy.auto) tasks.push(run());
        }
    }
    container.ready = Promise.allSettled(tasks);
    if (typeof MutationObserver !== 'undefined') {
        let attached = false;
        const observer = new MutationObserver(() => { if (container.isConnected) attached = true; else if (attached) { abort.abort(); observer.disconnect(); } });
        observer.observe(document.body, { childList: true, subtree: true }); abort.signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    }
    bindGeneratedArtifactLinks(container);
    return container;
}
