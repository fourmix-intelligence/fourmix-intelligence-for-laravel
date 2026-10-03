import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ja"><body></body></html>', { url: 'https://app.example.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const webp = new TextEncoder().encode('RIFF0000WEBP');
const { renderMarkdown, configureRendering } = await import('../../resources/js/markdown.js');
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const context = vm.createContext({
    window: dom.window, document, HTMLElement: dom.window.HTMLElement,
    customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent, AbortController,
});
const request = new vm.SyntheticModule(['request'], function () { this.setExport('request', async () => { throw new Error('通信は実行しません。'); }); }, { context });
const markdown = new vm.SyntheticModule(['renderMarkdown', 'configureRendering'], function () { this.setExport('renderMarkdown', renderMarkdown); this.setExport('configureRendering', configureRendering); }, { context });
const chatModule = new vm.SourceTextModule(await readFile(new URL('../../resources/js/chat.js', import.meta.url), 'utf8'), { context });
await chatModule.link(specifier => specifier === './markdown.js' ? markdown : request);
await chatModule.evaluate();

function render(text, role = 'assistant') {
    const chat = new chatModule.namespace.FourmixIntelligenceChat();
    chat.messages = document.createElement('div');
    document.body.replaceChildren(chat.messages);
    chat.message(role, text);
    return chat.messages;
}

test('集計回答の数値を保って表・段落・リスト・コードを表示し、表には横スクロール領域を付ける', () => {
    const result = render('# 集計結果\n\n原始データから**再計算**しました。\n\n| 年月 | 売上 | 仕入 | 利益 |\n| --- | ---: | ---: | ---: |\n| 2026年04月 | ¥123,456,789 | ¥23,456,789 | ¥100,000,000 |\n| 2026年05月 | ¥0 | ¥1,000 | ¥-1,000 |\n\n- 金額は円です\n- 数値を変更していません\n\n```json\n{"amount":0}\n```');
    assert.equal(result.querySelectorAll('table').length, 1);
    assert.equal(result.querySelectorAll('tbody tr').length, 2);
    assert.deepEqual([...result.querySelectorAll('th')].map(cell => cell.textContent), ['年月', '売上', '仕入', '利益']);
    assert.deepEqual([...result.querySelector('tbody tr:last-child').children].map(cell => cell.textContent), ['2026年05月', '¥0', '¥1,000', '¥-1,000']);
    assert.equal(result.querySelector('strong').textContent, '再計算');
    assert.equal(result.querySelectorAll('li').length, 2);
    assert.equal(result.querySelector('pre code').textContent.trim(), '{"amount":0}');
    assert.ok(result.querySelector('table').parentElement.classList.contains('fi:overflow-x-auto'));
    assert.ok(result.querySelector('table').parentElement.classList.contains('fi:max-w-full'));
    assert.equal(result.querySelectorAll('th')[1].style.textAlign, 'right');
});

test('逐次表示中も表と文章を安全に描画し、画像取得と図の実行を回答完了まで待つ', async () => {
    const previousFetch = globalThis.fetch; let requests = 0;
    globalThis.fetch = async () => { requests++; throw new Error('画像はまだ取得しない'); };
    try {
        const result = renderMarkdown('| ID | 件名 |\n| --- | --- |\n| 1 | 確認 |\n\n**途中の回答**\n\n<img src=x onerror=alert(1)>\n\n![添付](/attachment)\n\n```mermaid\nflowchart LR\nA-->B\n```',
            { streaming: true, attachmentUrls: ['https://app.example.test/attachment'] });
        await result.ready;
        assert.equal(result.querySelectorAll('table').length, 1);
        assert.equal(result.querySelector('strong').textContent, '途中の回答');
        assert.equal(result.querySelectorAll('img,svg,script').length, 0);
        assert.equal(result.querySelector('pre code').textContent.trim(), 'flowchart LR\nA-->B');
        assert.equal(requests, 0); result.dispose();
    } finally { globalThis.fetch = previousFetch; }
});

test('コードを安全に色分けし、原文をコピーする。未知の言語は原文のまま表示する', async () => {
    const source = 'const value = "<img src=x onerror=alert(1)>";';
    const result = renderMarkdown('```javascript\n' + source + '\n```\n\n```unknown-language\nplain\n```');
    let copied;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async text => { copied = text; } } } });
    await result.ready;
    assert.ok(result.querySelector('.hljs-keyword'));
    assert.equal(result.querySelector('code').textContent, source);
    assert.equal(result.querySelectorAll('img,[onerror]').length, 0);
    await result.querySelector('button').onclick();
    assert.equal(copied, source);
    assert.match(result.querySelector('button').textContent, /コピーしました/);
    assert.equal(result.querySelectorAll('code')[1].textContent, 'plain');
    result.dispose();
});

test('外部画像は操作前に通信しない。読み込み操作でもCookie・referrerを送らない', async () => {
    const calls = []; const original = globalThis.fetch;
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(png, { headers: { 'Content-Type': 'image/png' } }); };
    try {
        const result = renderMarkdown('![写真](https://images.example.test/sample.png)');
        await result.ready;
        assert.equal(calls.length, 0); assert.equal(result.querySelector('img'), null);
        assert.match(result.textContent, /外部画像/);
        await result.querySelector('button').onclick();
        assert.equal(calls.length, 1); assert.equal(calls[0].options.credentials, 'omit');
        assert.equal(calls[0].options.referrerPolicy, 'no-referrer'); assert.equal(calls[0].options.redirect, 'error');
        assert.match(result.querySelector('img').src, /^blob:/);
        result.dispose();
    } finally { globalThis.fetch = original; }
});

test('認証添付のみ同一originのCookie付きで自動表示し、prefix類似・別originには権限を渡さない', async () => {
    const calls = []; const original = globalThis.fetch;
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(webp, { headers: { 'Content-Type': 'image/webp' } }); };
    configureRendering({ attachmentUrlPrefixes: ['/fi/attachments/conversation/'] });
    try {
        const result = renderMarkdown('![添付](/fi/attachments/conversation/abc/content?alias=assistant)\n\n![類似](/fi/attachments/conversation-malicious/image)\n\n![別origin](https://images.example.test/fi/attachments/conversation/image)');
        await result.ready;
        assert.equal(calls.length, 1); assert.equal(calls[0].options.credentials, 'same-origin');
        assert.equal(result.querySelectorAll('img').length, 1); result.dispose();
    } finally { configureRendering({}); globalThis.fetch = original; }
});

test('画像の危険なscheme・SVG・偽装MIME・上限超過を拒否し、破棄後は非同期結果を追加しない', async () => {
    const original = globalThis.fetch; let resolve;
    try {
        const invalid = renderMarkdown('![a](data:image/png;base64,aaa) ![b](javascript:alert(1)) ![c](https://images.example.test/x.svg)');
        assert.equal(invalid.querySelectorAll('button,img').length, 0);
        for (const headers of [{ 'Content-Type': 'image/svg+xml' }, { 'Content-Type': 'text/html' }, { 'Content-Type': 'image/png' }, { 'Content-Type': 'image/png', 'Content-Length': String(9 * 1024 * 1024) }]) {
            globalThis.fetch = async () => new Response('not an image', { headers });
            const result = renderMarkdown('![画像](https://images.example.test/no-extension)');
            await result.querySelector('button').onclick(); assert.equal(result.querySelector('img'), null);
            assert.match(result.textContent, /取得できません|大きすぎ|形式を確認できません/); result.dispose();
        }
        globalThis.fetch = () => new Promise(done => { resolve = done; });
        const result = renderMarkdown('![添付](/attachment)', { attachmentUrls: ['https://app.example.test/attachment'] });
        result.dispose(); resolve(new Response(png, { headers: { 'Content-Type': 'image/png' } }));
        await result.ready; assert.equal(result.querySelector('img'), null);
    } finally { globalThis.fetch = original; }
});

test('明示された画像originのみCookie無しで自動取得し、リンクの相対URLを安全に解決する', async () => {
    const original = globalThis.fetch; const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(png, { headers: { 'Content-Type': 'image/png' } }); };
    try {
        const result = renderMarkdown('![a](https://cdn.example.test/p.png) ![b](https://cdn.example.test.evil/p.png) [添付](/documents/1)', { allowedImageOrigins: ['https://cdn.example.test'] });
        await result.ready; assert.equal(calls.length, 1); assert.equal(calls[0].options.credentials, 'omit');
        assert.equal(result.querySelector('a').href, 'https://app.example.test/documents/1'); result.dispose();
    } finally { globalThis.fetch = original; }
});

test('回答中のHTML・画像・イベント属性をDOMへ展開せず、危険なURLをリンクにしない', () => {
    const result = render('<script>window.fiXssExecuted=true</script>\n\n<img src=x onerror="window.fiXssExecuted=true">\n\n<svg onload="window.fiXssExecuted=true"></svg>\n\n[危険](javascript:alert%281%29) [data](data:text/html;base64,PHNjcmlwdD4=) [encoded](java&#x73;cript:alert%281%29) [control](java&#x09;script:alert%281%29) [安全](https://example.test/docs)\n\n![外部画像](https://example.test/tracking.png)\n\n```html\n<img src=x onerror=alert(1)>\n```');
    assert.equal(result.querySelector('.fi-markdown').querySelectorAll('script,img,svg,iframe,object,embed,form,input').length, 0);
    assert.equal(result.querySelectorAll('[onerror],[onload],[onclick]').length, 0);
    assert.deepEqual([...result.querySelectorAll('a[href]')].map(link => link.getAttribute('href')), ['https://example.test/docs']);
    assert.equal(result.querySelector('a[href]').getAttribute('rel'), 'noopener noreferrer');
    assert.match(result.textContent, /<script>window.fiXssExecuted=true<\/script>/);
    assert.equal(result.querySelector('pre code').textContent.trim(), '<img src=x onerror=alert(1)>');
    assert.equal(dom.window.fiXssExecuted, undefined);
});

test('ユーザー自身の入力はMarkdownやHTMLとして解釈しない', () => {
    const result = render('**ユーザー入力** <img src=x onerror=alert(1)>', 'user');
    assert.equal(result.querySelectorAll('strong,img,.fi-markdown').length, 0);
    assert.match(result.textContent, /\*\*ユーザー入力\*\*/);
});
