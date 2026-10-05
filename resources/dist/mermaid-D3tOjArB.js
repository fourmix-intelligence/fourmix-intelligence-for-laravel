import { t as e } from "./purify-es-DSFSk3Xv.js";
//#region resources/js/mermaid.js
var t = 0, n = Promise.resolve(), r = /^(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|timeline|quadrantChart|xychart(?:-beta)?|gitGraph|mindmap)\b/;
function i(e) {
	return typeof e == "string" && e.length <= 12e3 && e.split("\n").length <= 160 && r.test(e.trimStart()) && !/%%\s*\{|^\s*---|<\/?[a-zA-Z!]|&(?:lt|gt|#0*60|#x0*3c);|(?:https?:|data:|javascript:|file:|vbscript:|\/\/)|\b(?:click|href|callback|foreignObject|classDef|linkStyle|image)\b|^\s*style\b|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/im.test(e) && (e.match(/(?:-->|==>|-\.->|->>|-->>|-->\>|--)/g) || []).length <= 200 && (e.match(/[;[{]/g) || []).length <= 200;
}
function a(t) {
	let n = e.sanitize(t, {
		RETURN_DOM_FRAGMENT: !0,
		USE_PROFILES: {
			svg: !0,
			svgFilters: !0
		},
		FORBID_TAGS: [
			"foreignObject",
			"a",
			"image",
			"script",
			"iframe",
			"animate",
			"animateMotion",
			"animateTransform",
			"set"
		],
		FORBID_ATTR: ["href", "xlink:href"],
		ALLOW_DATA_ATTR: !1
	}).querySelector("svg");
	if (!n) throw Error("図を表示できませんでした。");
	for (let e of n.querySelectorAll("*")) for (let t of [...e.attributes]) (/^on/i.test(t.name) || /(?:https?:|data:|javascript:|@import|expression\s*\()/i.test(t.value) || /url\s*\((?!\s*['"]?#[-\w]+['"]?\s*\))/i.test(t.value)) && e.removeAttribute(t.name);
	for (let e of n.querySelectorAll("style")) /@import|expression\s*\(|(?:https?:|data:|javascript:)|url\s*\((?!\s*['"]?#[-\w]+['"]?\s*\))/i.test(e.textContent) && e.remove();
	n.setAttribute("role", "img"), n.setAttribute("aria-label", "AIが作成した図");
	let r = (n.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number), i = r.length === 4 && r.every(Number.isFinite) && r[2] > 0 && r[3] > 0 ? Math.min(r[2], 960, r[2] * 480 / r[3]) : 320;
	return n.removeAttribute("height"), n.removeAttribute("style"), n.setAttribute("width", String(i)), n.style.maxWidth = "100%", n.style.height = "auto", n;
}
function o(e, { signal: r } = {}) {
	if (!i(e)) return Promise.reject(/* @__PURE__ */ Error("安全性または複雑さの条件を満たさないため、図のコードを表示しています。"));
	let o = async () => {
		r?.throwIfAborted();
		let { default: n } = await import("./mermaid-core-D268S2XQ.js");
		r?.throwIfAborted(), n.initialize({
			startOnLoad: !1,
			securityLevel: "strict",
			htmlLabels: !1,
			suppressErrorRendering: !0,
			maxTextSize: 12e3,
			maxEdges: 200,
			theme: "neutral",
			secure: [
				"secure",
				"securityLevel",
				"htmlLabels",
				"startOnLoad",
				"maxTextSize",
				"maxEdges",
				"suppressErrorRendering",
				"theme",
				"themeCSS",
				"dompurifyConfig"
			]
		});
		let i = `fi-diagram-${++t}`;
		try {
			let { svg: t } = await n.render(i, e);
			return r?.throwIfAborted(), a(t);
		} finally {
			document.getElementById(i)?.remove(), document.getElementById(`d${i}`)?.remove();
		}
	}, s = n.then(o, o);
	return n = s.catch(() => {}), s;
}
//#endregion
export { o as renderDiagram };
