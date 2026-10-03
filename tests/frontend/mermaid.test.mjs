import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test' });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element; globalThis.SVGElement = dom.window.SVGElement;
globalThis.CSSStyleSheet = dom.window.CSSStyleSheet;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: Math.max(40, this.textContent.length * 8), height: 20 }; };
dom.window.SVGElement.prototype.getComputedTextLength = function () { return this.textContent.length * 8; };
const { renderDiagram, diagramSourceIsSafe, sanitizeDiagram } = await import('../../resources/js/mermaid.js');
const { renderMarkdown } = await import('../../resources/js/markdown.js');

test('公式Mermaidエンジンでフローとシーケンスを描画し、HTML・リンク・外部資源を含めない', async () => {
    for (const source of ['flowchart LR\n A[確認] --> B[実行]\n B --> C[結果]', 'sequenceDiagram\n participant A as 利用者\n participant B as AI\n A->>B: 確認\n B-->>A: 結果']) {
        const diagram = await renderDiagram(source);
        assert.equal(diagram.tagName.toLowerCase(), 'svg');
        assert.ok(diagram.querySelectorAll('path,rect,line').length > 0);
        assert.match(diagram.textContent, /確認/);
        assert.equal(diagram.querySelectorAll('foreignObject,a,image,script,[onclick],[href]').length, 0);
        assert.equal(document.querySelectorAll('[id^=fi-diagram-],[id^=dfi-diagram-]').length, 0);
    }
});

test('図から設定変更・HTML・操作・外部リンク・CSS・過大な入力を拒否する', async () => {
    for (const source of [
        '%%{init: {"securityLevel":"loose"}}%%\nflowchart LR\n A-->B',
        '---\nconfig:\n securityLevel: loose\n---\nflowchart LR\n A-->B',
        'flowchart LR\n A[<img src=x onerror=alert(1)>]-->B',
        'flowchart LR\n A[&lt;img onerror=x&gt;]-->B',
        'flowchart LR\n A-->B\n click A "https://example.test"',
        'flowchart LR\n A-->B\n style A fill:url(https://example.test/track)',
        'flowchart LR\n A-->B\n classDef custom color:red',
        'flowchart LR\n' + 'A-->B\n'.repeat(170),
        'flowchart LR\n A[' + 'a'.repeat(12000) + ']',
    ]) { assert.equal(diagramSourceIsSafe(source), false); await assert.rejects(renderDiagram(source)); }
});

test('SVGを二重に清掃し、アニメーション・foreignObject・外部参照と危険なCSSを取り除く', () => {
    const diagram = sanitizeDiagram('<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>bad</div></foreignObject><script>alert(1)</script><image href="https://example.test/track"/><a href="javascript:alert(1)"><text>link</text></a><style>@import "https://example.test/a.css";</style><rect onclick="alert(1)" fill="url(https://example.test/a)"/><animate attributeName="href"/><path marker-end="url(#arrow)"/><defs><marker id="arrow"><path d="M0 0"/></marker></defs></svg>');
    assert.equal(diagram.querySelectorAll('foreignObject,image,script,a,animate,style,[onclick]').length, 0);
    assert.equal(diagram.querySelector('rect').getAttribute('fill'), null);
    assert.equal(diagram.querySelector('path').getAttribute('marker-end'), 'url(#arrow)');
});

test('小さな縦長の図は会話幅まで拡大せず、大きな図も高さ480px以内に収める', () => {
    const small = sanitizeDiagram('<svg viewBox="4 4 168 223.2" width="100%" style="max-width:100%"/>');
    assert.equal(small.getAttribute('width'), '168');
    const tall = sanitizeDiagram('<svg viewBox="0 0 400 1600" width="100%"/>');
    assert.equal(tall.getAttribute('width'), '120');
    assert.equal(tall.style.maxWidth, '100%');
    assert.equal(tall.style.height, 'auto');
});

test('不正な構文はコード付きの日本語表示へ戻し、破棄された描画は後から追加されない', async () => {
    const invalid = renderMarkdown('```mermaid\nflowchart LR\n A[unterminated\n```');
    await invalid.ready;
    assert.equal(invalid.querySelector('svg'), null); assert.match(invalid.textContent, /図を表示できませんでした/);
    assert.match(invalid.querySelector('code').textContent, /unterminated/); invalid.dispose();
    const result = renderMarkdown('```mermaid\nflowchart LR\n A-->B\n```');
    result.dispose(); await result.ready; assert.equal(result.querySelector('svg'), null);
});
