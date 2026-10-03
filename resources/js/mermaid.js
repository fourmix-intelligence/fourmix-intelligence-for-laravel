import DOMPurify from 'dompurify';

let sequence = 0;
let queue = Promise.resolve();
const types = /^(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|timeline|quadrantChart|xychart(?:-beta)?|gitGraph|mindmap)\b/;

/** Untrusted diagrams cannot provide configuration, HTML, actions, CSS or remote resources. */
export function diagramSourceIsSafe(source) {
    return typeof source === 'string' && source.length <= 12000 && source.split('\n').length <= 160
        && types.test(source.trimStart())
        && !/%%\s*\{|^\s*---|<\/?[a-zA-Z!]|&(?:lt|gt|#0*60|#x0*3c);|(?:https?:|data:|javascript:|file:|vbscript:|\/\/)|\b(?:click|href|callback|foreignObject|classDef|linkStyle|image)\b|^\s*style\b|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/im.test(source)
        && (source.match(/(?:-->|==>|-\.->|->>|-->>|-->\>|--)/g) || []).length <= 200
        && (source.match(/[;[{]/g) || []).length <= 200;
}

/** Only local fragment references in the generated SVG are allowed. */
export function sanitizeDiagram(svg) {
    const fragment = DOMPurify.sanitize(svg, {
        RETURN_DOM_FRAGMENT: true, USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['foreignObject', 'a', 'image', 'script', 'iframe', 'animate', 'animateMotion', 'animateTransform', 'set'],
        FORBID_ATTR: ['href', 'xlink:href'], ALLOW_DATA_ATTR: false,
    });
    const result = fragment.querySelector('svg');
    if (!result) throw new Error('図を表示できませんでした。');
    for (const element of result.querySelectorAll('*')) {
        for (const attribute of [...element.attributes]) {
            if (/^on/i.test(attribute.name) || /(?:https?:|data:|javascript:|@import|expression\s*\()/i.test(attribute.value)
                || /url\s*\((?!\s*['"]?#[-\w]+['"]?\s*\))/i.test(attribute.value)) element.removeAttribute(attribute.name);
        }
    }
    for (const style of result.querySelectorAll('style')) {
        if (/@import|expression\s*\(|(?:https?:|data:|javascript:)|url\s*\((?!\s*['"]?#[-\w]+['"]?\s*\))/i.test(style.textContent)) style.remove();
    }
    result.setAttribute('role', 'img'); result.setAttribute('aria-label', 'AIが作成した図');
    const bounds = (result.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const width = bounds.length === 4 && bounds.every(Number.isFinite) && bounds[2] > 0 && bounds[3] > 0
        ? Math.min(bounds[2], 960, bounds[2] * 480 / bounds[3]) : 320;
    result.removeAttribute('height'); result.removeAttribute('style');
    result.setAttribute('width', String(width)); result.style.maxWidth = '100%'; result.style.height = 'auto';
    return result;
}

/** Mermaid owns a global configuration; serialize renders and reset it for each request. */
export function renderDiagram(source, { signal } = {}) {
    if (!diagramSourceIsSafe(source)) return Promise.reject(new Error('安全性または複雑さの条件を満たさないため、図のコードを表示しています。'));
    const work = async () => {
        signal?.throwIfAborted();
        const { default: mermaid } = await import('mermaid');
        signal?.throwIfAborted();
        mermaid.initialize({
            startOnLoad: false, securityLevel: 'strict', htmlLabels: false, suppressErrorRendering: true,
            maxTextSize: 12000, maxEdges: 200, theme: 'neutral',
            secure: ['secure', 'securityLevel', 'htmlLabels', 'startOnLoad', 'maxTextSize', 'maxEdges', 'suppressErrorRendering', 'theme', 'themeCSS', 'dompurifyConfig'],
        });
        const id = `fi-diagram-${++sequence}`;
        try {
            const { svg } = await mermaid.render(id, source);
            signal?.throwIfAborted();
            return sanitizeDiagram(svg);
        } finally {
            document.getElementById(id)?.remove(); document.getElementById(`d${id}`)?.remove();
        }
    };
    const pending = queue.then(work, work); queue = pending.catch(() => {});
    return pending;
}
