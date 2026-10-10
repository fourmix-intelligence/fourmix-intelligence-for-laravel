import { t as e } from "./purify-es-DSFSk3Xv.js";
//#region resources/js/floating.js
var t = (e, t = "", n = "") => {
	let r = document.createElement(e);
	return r.textContent = t, r.className = n, r;
}, n = 0, r = (e) => e && typeof e == "object" && !Array.isArray(e) ? e : {}, i = (e) => {
	let t = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	for (let [e, n] of Object.entries({
		viewBox: "0 0 24 24",
		width: "18",
		height: "18",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "1.6",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": "true"
	})) t.setAttribute(e, n);
	let n = document.createElementNS("http://www.w3.org/2000/svg", "path");
	return n.setAttribute("d", e), t.append(n), t;
}, a = class extends HTMLElement {
	static get observedAttributes() {
		return [
			"position",
			"label",
			"title",
			"alias",
			"surface",
			"initial-prompt",
			"context",
			"api-base",
			"csrf-token",
			"conversation-id",
			"fallback-url",
			"assistant-name",
			"input-placeholder",
			"composer-max-height",
			"launcher-hidden",
			"history-layout"
		];
	}
	connectedCallback() {
		if (this.openHandler ||= (e) => {
			let t = r(e.detail);
			if (t.id && t.id !== this.id || t.alias && t.alias !== this.getAttribute("alias")) return;
			let n = e.target?.closest?.("fourmix-intelligence-floating-chat");
			n && n !== this || (n || t.id || [...document.querySelectorAll("fourmix-intelligence-floating-chat")].find((e) => !t.alias || e.getAttribute("alias") === t.alias) === this) && (t.context && (this.context = t.context), !this.chat && typeof t.initialPrompt == "string" && this.setAttribute("initial-prompt", t.initialPrompt), this.open());
		}, document.addEventListener("fourmix:open-chat", this.openHandler), this.surfaceHandler ||= (e) => {
			Array.isArray(e.detail) && (this.surfaceGeneration = (this.surfaceGeneration || 0) + 1, this.applySurface(e.detail));
		}, document.defaultView.addEventListener("fourmix:surfaces", this.surfaceHandler), this.initialized) {
			this.refreshSurface();
			return;
		}
		this.initialized = !0, this.launcher = t("a", "", "fi-floating-launcher"), this.launcher.setAttribute("aria-haspopup", "dialog"), this.launcher.setAttribute("aria-expanded", "false");
		let e = t("span", "", "fi-floating-mark");
		e.setAttribute("aria-hidden", "true");
		let a = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		a.setAttribute("viewBox", "0 0 24 24"), a.setAttribute("width", "20"), a.setAttribute("height", "20"), a.setAttribute("fill", "none"), a.setAttribute("stroke", "currentColor"), a.setAttribute("stroke-width", "1.6");
		let o = document.createElementNS("http://www.w3.org/2000/svg", "path");
		o.setAttribute("d", "M4 4h16v12H9l-5 4V4Z"), a.append(o), e.append(a), this.launcher.append(e), this.launcherLabel = t("span"), this.launcher.append(this.launcherLabel), this.dialog = t("dialog", "", "fi-floating-dialog"), this.dialog.id = `fi-floating-dialog-${++n}`, this.dialog.setAttribute("aria-modal", "false"), this.launcher.setAttribute("aria-controls", this.dialog.id);
		let s = this.header = t("header", "", "fi-floating-header");
		this.heading = t("h2", "", "fi:sr-only"), this.heading.id = `${this.dialog.id}-title`, this.dialog.setAttribute("aria-labelledby", this.heading.id), this.closeButton = t("button", "", "fi-button fi-button-ghost fi-chat-icon-button fi-floating-close"), this.closeButton.append(i("M6 6l12 12M18 6 6 18")), this.closeButton.type = "button", this.closeButton.setAttribute("aria-label", "AIチャットを閉じる"), this.closeButton.title = "AIチャットを閉じる", this.closeButton.onclick = () => this.close(), this.body = t("div", "", "fi-floating-body");
		let c = t("p", "閉じても会話と入力中の内容は保持されます。", "fi:sr-only");
		c.id = `${this.dialog.id}-description`, this.dialog.setAttribute("aria-describedby", c.id), this.fallback = t("a", "", "fi-button fi-button-ghost fi-chat-icon-button fi-floating-fallback"), this.fallback.append(i("M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7")), this.fallback.setAttribute("aria-label", "独立したチャット画面で開く"), this.fallback.title = "独立したチャット画面で開く", this.windowActions = t("div", "", "fi-floating-window-actions"), this.windowActions.append(this.fallback, this.closeButton), s.append(this.heading, c, this.windowActions), this.dialog.append(s, this.body), this.replaceChildren(this.launcher, this.dialog), this.launcher.onclick = (e) => {
			typeof this.dialog.show == "function" && customElements.get("fourmix-intelligence-chat") && (e.preventDefault(), this.open());
		}, this.dialog.addEventListener("cancel", (e) => {
			e.preventDefault(), this.close();
		}), this.dialog.addEventListener("keydown", (e) => {
			e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), this.close());
		}), this.dialog.addEventListener("close", () => {
			this.launcher.setAttribute("aria-expanded", "false"), this.restoreFocusOnClose && (this.returnFocus?.isConnected ? this.returnFocus : this.launcher).focus({ preventScroll: !0 }), this.restoreFocusOnClose = !1, this.dispatchEvent(new CustomEvent("fourmix:floating-close", {
				bubbles: !0,
				composed: !0
			}));
		}), this.sync(), this.refreshSurface();
	}
	disconnectedCallback() {
		document.removeEventListener("fourmix:open-chat", this.openHandler), document.defaultView.removeEventListener("fourmix:surfaces", this.surfaceHandler), this.surfaceGeneration = (this.surfaceGeneration || 0) + 1;
	}
	attributeChangedCallback(e) {
		e === "context" && (this.businessContext = void 0), this.initialized && (this.sync(), ["surface", "api-base"].includes(e) && this.refreshSurface());
	}
	applySurface(e) {
		let t = this.getAttribute("surface");
		t && (this.surfaceEnabled = e.find((e) => e.name === t)?.enabled === !0, this.surfaceEnabled || this.close(), this.sync());
	}
	async refreshSurface() {
		if (!this.getAttribute("surface")) {
			this.surfaceEnabled = !0, this.sync();
			return;
		}
		let e = this.surfaceGeneration = (this.surfaceGeneration || 0) + 1;
		this.surfaceEnabled = !1, this.close(), this.sync();
		try {
			let t = await $(`${(this.getAttribute("api-base") || "/fourmix-intelligence").replace(/\/$/, "")}/state`, { csrfToken: this.getAttribute("csrf-token") || void 0 });
			e === this.surfaceGeneration && this.isConnected && this.applySurface(t.surfaces || []);
		} catch (t) {
			e === this.surfaceGeneration && this.isConnected && this.dispatchEvent(new CustomEvent("fourmix:error", {
				detail: { message: t.message },
				bubbles: !0,
				composed: !0
			}));
		}
	}
	get context() {
		if (this.businessContext !== void 0) return this.businessContext;
		try {
			return r(JSON.parse(this.getAttribute("context") || "{}"));
		} catch {
			return {};
		}
	}
	set context(e) {
		this.businessContext = r(e), this.chat && (this.chat.context = this.businessContext);
	}
	sync() {
		let e = this.getAttribute("position") === "left" ? "left" : "right";
		this.dataset.position = e, this.dialog.dataset.position = e, this.launcherLabel.textContent = this.getAttribute("label") || "AIに相談", this.heading.textContent = this.getAttribute("title") || "AIアシスタント", this.launcher.hidden = this.hasAttribute("launcher-hidden") || this.getAttribute("surface") && this.surfaceEnabled !== !0;
		let t = `${(this.getAttribute("api-base") || "/fourmix-intelligence").replace(/\/$/, "")}/chat`, n;
		try {
			let e = new URL(this.getAttribute("fallback-url") || t, location.origin);
			e.origin === location.origin && ["http:", "https:"].includes(e.protocol) && (n = e.href);
		} catch {}
		if (this.launcher.href = this.fallback.href = n || "#", this.fallback.hidden = !n, this.chat) {
			for (let e of [
				"alias",
				"surface",
				"initial-prompt",
				"context",
				"api-base",
				"csrf-token",
				"conversation-id",
				"assistant-name",
				"input-placeholder",
				"composer-max-height",
				"history-layout"
			]) {
				let t = this.getAttribute(e);
				t !== null && this.chat.setAttribute(e, t);
			}
			this.chat.setAttribute("composer-max-height", this.getAttribute("composer-max-height") || "112"), this.chat.setAttribute("presentation", "floating"), this.chat.setAttribute("layout", "fill"), this.chat.context = this.context;
		}
	}
	open() {
		return !this.initialized || this.getAttribute("surface") && this.surfaceEnabled !== !0 || typeof this.dialog.show != "function" || !customElements.get("fourmix-intelligence-chat") ? !1 : this.dialog.open ? !0 : (this.returnFocus = document.activeElement, this.chat || (this.chat = document.createElement("fourmix-intelligence-chat"), this.chat.setAttribute("aria-label", "Fourmix IntelligenceのAIチャット"), this.sync(), this.body.append(this.chat), this.chat.toolbar && (this.chat.toolbar.append(this.windowActions), this.header.classList.add("fi-floating-header-merged"))), this.dialog.show(), this.launcher.setAttribute("aria-expanded", "true"), this.chat.resizeInput?.(), this.returnFocus?.isConnected && !this.dialog.contains(this.returnFocus) && this.returnFocus.focus({ preventScroll: !0 }), this.dispatchEvent(new CustomEvent("fourmix:floating-open", {
			bubbles: !0,
			composed: !0
		})), !0);
	}
	close() {
		this.dialog?.open && (this.restoreFocusOnClose = this.dialog.contains(document.activeElement), this.dialog.close());
	}
};
customElements.get("fourmix-intelligence-floating-chat") || customElements.define("fourmix-intelligence-floating-chat", a);
//#endregion
//#region node_modules/marked/lib/marked.esm.js
function o() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var s = o();
function c(e) {
	s = e;
}
var l = { exec: () => null };
function u(e) {
	let t = [];
	return (n) => {
		let r = Math.max(0, Math.min(3, n - 1)), i = t[r];
		return i || (i = e(r), t[r] = i), i;
	};
}
function d(e, t = "") {
	let n = typeof e == "string" ? e : e.source, r = {
		replace: (e, t) => {
			let i = typeof t == "string" ? t : t.source;
			return i = i.replace(p.caret, "$1"), n = n.replace(e, i), r;
		},
		getRegex: () => new RegExp(n, t)
	};
	return r;
}
var f = ((e = "") => {
	try {
		return !!RegExp("(?<=1)(?<!1)" + e);
	} catch {
		return !1;
	}
})(), p = {
	codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	endingSpaceTabChar: /[ \t]$/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	leadingSpaceTab: /^[ \t]+/,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/g,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: u((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: u((e) => RegExp(`^ {0,${e}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),
	fencesBeginRegex: u((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: u((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: u((e) => RegExp(`^ {0,${e}}(?:</?(?:${S})(?: +|$|/?>)|<(?:script|pre|style|textarea|!--))`, "i")),
	blockquoteBeginRegex: u((e) => RegExp(`^ {0,${e}}>`))
}, m = /^(?:[ \t]*(?:\n|$))+/, h = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, g = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, _ = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, v = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, y = / {0,3}(?:[*+-]|\d{1,9}[.)])/, b = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, x = d(b).replace(/bull/g, y).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), ee = d(b).replace(/bull/g, y).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), te = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/, ne = /^[^\n]+/, re = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, ie = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", re).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ae = d(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, y).getRegex(), S = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", oe = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, se = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", oe).replace("tag", S).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ce = (e) => d(te).replace("hr", _).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", e).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", S).getRegex(), le = ce(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/), ue = ce(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/), de = {
	blockquote: d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ue).getRegex(),
	code: h,
	def: ie,
	fences: g,
	heading: v,
	hr: _,
	html: se,
	lheading: x,
	list: ae,
	newline: m,
	paragraph: le,
	table: l,
	text: ne
}, fe = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", _).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", S).getRegex(), pe = {
	...de,
	lheading: ee,
	table: fe,
	paragraph: d(te).replace("hr", _).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", fe).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", S).getRegex()
}, me = {
	...de,
	html: d("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", oe).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: l,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: d(te).replace("hr", _).replace("heading", " *#{1,6} *[^\n]").replace("lheading", x).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, he = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, ge = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, _e = /^( {2,}|\\)\n(?!\s*$)[ \t]*/, ve = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, C = /[\p{P}\p{S}]/u, w = /[\s\p{P}\p{S}]/u, T = /[^\s\p{P}\p{S}]/u, ye = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, w).getRegex(), be = /[\p{Pi}\p{Ps}"']/u, xe = /(?!~)[\p{P}\p{S}]/u, Se = /(?!~)[\s\p{P}\p{S}]/u, Ce = /(?:[^\s\p{P}\p{S}]|~)/u, we = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", f ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), Te = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, Ee = d(Te, "u").replace(/punct/g, C).getRegex(), De = d(Te, "u").replace(/punct/g, xe).getRegex(), Oe = d(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/, "u").replace(/openQuote/g, be).replace(/punct/g, C).getRegex(), ke = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Ae = d(ke, "gu").replace(/notPunctSpace/g, T).replace(/punctSpace/g, w).replace(/punct/g, C).getRegex(), je = d(ke, "gu").replace(/notPunctSpace/g, Ce).replace(/punctSpace/g, Se).replace(/punct/g, xe).getRegex(), Me = d("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, T).replace(/punctSpace/g, w).replace(/punct/g, C).getRegex(), Ne = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, T).replace(/punctSpace/g, w).replace(/punct/g, C).getRegex(), Pe = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, T).replace(/punctSpace/g, w).replace(/punct/g, C).getRegex(), Fe = d(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, C).getRegex(), Ie = d("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, T).replace(/punctSpace/g, w).replace(/punct/g, C).getRegex(), Le = d(/\\(punct)/, "gu").replace(/punct/g, C).getRegex(), Re = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ze = d(oe).replace("(?:-->|$)", "-->").getRegex(), Be = d("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ze).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Ve = /\[(?:\\[\s\S]|[^\[\]\\])*\]/, E = d(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets", Ve).getRegex(), He = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", E).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ue = d(/^!?\[(label)\]\[(ref)\]/).replace("label", E).replace("ref", re).getRegex(), We = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", re).getRegex(), Ge = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/, Ke = d(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets", Ve).getRegex(), qe = d("reflink|nolink(?!\\()", "g").replace("reflink", d(/^!?\[(label)\]\[(ref)\]/).replace("label", Ke).replace("ref", Ge).getRegex()).replace("nolink", d(/^!?\[(ref)\](?:\[\])?/).replace("ref", Ge).getRegex()).getRegex(), Je = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, Ye = d(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g, /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(), D = {
	_backpedal: l,
	anyPunctuation: Le,
	autolink: Re,
	blockSkip: we,
	br: _e,
	code: ge,
	del: l,
	delLDelim: l,
	delRDelim: l,
	emStrongLDelim: Ee,
	emStrongRDelimAst: Ae,
	emStrongRDelimUnd: Ne,
	escape: he,
	link: He,
	nolink: We,
	punctuation: ye,
	reflink: Ue,
	reflinkSearch: qe,
	tag: Be,
	text: ve,
	url: l
}, Xe = {
	...D,
	emStrongLDelim: Oe,
	emStrongRDelimAst: Me,
	emStrongRDelimUnd: Pe,
	link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", E).getRegex(),
	reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", E).getRegex()
}, Ze = {
	...D,
	emStrongRDelimAst: je,
	emStrongLDelim: De,
	delLDelim: Fe,
	delRDelim: Ie,
	url: d(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol", Ye).replace("protocol", Je).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: d(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol", Je).replace(/emailProtocol/g, /(?:mailto|xmpp):/).getRegex()
}, Qe = {
	...Ze,
	br: d(_e).replace("{2,}", "*").getRegex(),
	text: d(Ze.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, O = {
	normal: de,
	gfm: pe,
	pedantic: me
}, k = {
	normal: D,
	gfm: Ze,
	breaks: Qe,
	pedantic: Xe
}, $e = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, et = (e) => $e[e];
function A(e, t) {
	if (t) {
		if (p.escapeTest.test(e)) return e.replace(p.escapeReplace, et);
	} else if (p.escapeTestNoEncode.test(e)) return e.replace(p.escapeReplaceNoEncode, et);
	return e;
}
function tt(e) {
	return e.replace(p.numericCharacterReference, (e, t, n) => {
		let r = t === void 0 ? Number.parseInt(n, 16) : Number.parseInt(t, 10);
		return r === 0 || r > 1114111 || r >= 55296 && r <= 57343 ? "�" : String.fromCodePoint(r);
	});
}
function nt(e) {
	try {
		e = encodeURI(e).replace(p.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function rt(e, t) {
	let n = e.replace(p.findPipe, (e, t, n) => {
		let r = !1, i = t;
		for (; --i >= 0 && n[i] === "\\";) r = !r;
		return r ? "|" : " |";
	}).split(p.splitPipe), r = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t) {
		if (n.length > t) n.splice(t);
		else for (; n.length < t;) n.push("");
	}
	for (; r < n.length; r++) n[r] = n[r].trim().replace(p.slashPipe, "|");
	return n;
}
function j(e, t, n) {
	let r = e.length;
	if (r === 0) return "";
	let i = 0;
	for (; i < r;) {
		let a = e.charAt(r - i - 1);
		if (a === t && !n) i++;
		else if (a !== t && n) i++;
		else break;
	}
	return e.slice(0, r - i);
}
function it(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && p.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function M(e) {
	return e.trim().toLowerCase().toUpperCase().toLowerCase();
}
function at(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function ot(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function st(e, t, n, r, i) {
	let a = t.href, o = t.title || null, s = e[1].replace(i.other.outputLinkReplace, "$1"), c = e[0].charAt(0) === "!";
	r.state.inLink = !0;
	let l = r.state.linkEmitted, u = r.state.inRawBlock;
	r.state.linkEmitted = !1;
	let d = r.inlineTokens(s), f = r.state.linkEmitted;
	if (r.state.linkEmitted = l, r.state.inLink = !1, !c) {
		if (f) {
			r.state.inRawBlock = u;
			return;
		}
		r.state.linkEmitted = !0;
	}
	return {
		type: c ? "image" : "link",
		raw: n,
		href: a,
		title: o,
		text: s,
		tokens: d
	};
}
function ct(e, t, n) {
	let r = e.match(n.other.indentCodeCompensation);
	if (r === null) return t;
	let i = r[1];
	return t.split("\n").map((e) => {
		let t = e.match(n.other.beginningSpace);
		if (t === null) return e;
		let [r] = t;
		return e.slice(Math.min(r.length, i.length));
	}).join("\n");
}
function lt(e, t, n, r) {
	if (!t.includes("<")) return !1;
	for (let i = 0; i < t.length; i++) {
		if (t[i] === "\\") {
			i++;
			continue;
		}
		if (t[i] === "`") {
			let e = r.inline.code.exec(t.slice(i));
			if (e) {
				i += e[0].length - 1;
				continue;
			}
		}
		if (t[i] !== "<") continue;
		let a = e.slice(n + i), o = r.inline.tag.exec(a) || r.inline.autolink.exec(a);
		if (o) {
			if (o[0].length > t.length - i) return !0;
			i += o[0].length - 1;
		}
	}
	return !1;
}
var N = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || s;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let e = this.options.pedantic ? t[0] : it(t[0]);
			return {
				type: "code",
				raw: e,
				codeBlockStyle: "indented",
				text: e.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let e = t[0], n = ct(e, t[3] || "", this.rules);
			return {
				type: "code",
				raw: e,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: n
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let e = t[2].trim();
			if (this.rules.other.endingHash.test(e)) {
				let t = j(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceTabChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: j(t[0], "\n"),
				depth: t[1].length,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: j(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = j(t[0], "\n").split("\n"), n = "", r = "", i = [];
			for (; e.length > 0;) {
				let t = !1, a = [], o = 0;
				for (; o < e.length; o++) if (this.rules.other.blockquoteStart.test(e[o])) a.push(e[o]), t = !0;
				else if (!t) a.push(e[o]);
				else break;
				e = e.slice(o);
				let s = a.join("\n"), c = s.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
				n = n ? `${n}
${s}` : s, r = r ? `${r}
${c}` : c;
				let l = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = l, e.length === 0) break;
				let u = i.at(-1);
				if (u?.type === "code") break;
				if (u?.type === "blockquote") {
					let t = u, a = e.join("\n"), o = t.raw + "\n" + a.replace(this.rules.other.blockquoteSetextReplace2, ""), s = this.blockquote(o);
					i[i.length - 1] = s;
					let c = o.substring(s.raw.length).replace(/^\n/, ""), l = c ? c.split("\n").length : 0, d = l ? e.slice(0, -l) : e;
					d.length > 0 && (n = `${n}
${d.join("\n")}`), r = r.substring(0, r.length - t.text.length) + s.text;
					break;
				}
				if (u?.type === "list") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.list(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - u.raw.length) + o.raw, r = r.substring(0, r.length - t.raw.length) + o.raw, e = a.substring(i.at(-1).raw.length).split("\n");
					continue;
				}
			}
			return {
				type: "blockquote",
				raw: n,
				tokens: i,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = t[1].trim(), r = n.length > 1, i = {
				type: "list",
				raw: "",
				ordered: r,
				start: r ? +n.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
			let a = this.rules.other.listItemRegex(n), o = !1;
			for (; e;) {
				let n = !1, r = "", s = "";
				if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
				r = t[0], e = e.substring(r.length);
				let c = t[2].split("\n", 1)[0], l = t[1].length, u = this.options.pedantic ? ot(c, l) : c.replace(this.rules.other.leadingSpaceTab, (e) => ot(e, l)), d = e.split("\n", 1)[0], f = !u.trim(), p = 0;
				if (this.options.pedantic ? (p = 2, s = u.trimStart()) : f ? p = l + 1 : (p = u.search(this.rules.other.nonSpaceChar), p = p > 4 ? 1 : p, s = u.slice(p), p += l), f && this.rules.other.blankLine.test(d) && (r += d + "\n", e = e.substring(d.length + 1), n = !0), !n) {
					let t = this.rules.other.nextBulletRegex(p), n = this.rules.other.hrRegex(p), i = this.rules.other.fencesBeginRegex(p), a = this.rules.other.headingBeginRegex(p), o = this.rules.other.htmlBeginRegex(p), c = this.rules.other.blockquoteBeginRegex(p);
					for (; e;) {
						let l = e.split("\n", 1)[0], m;
						if (d = l, this.options.pedantic ? (d = d.replace(this.rules.other.listReplaceNesting, "  "), m = d) : m = d.replace(this.rules.other.leadingSpaceTab, (e) => e.replace(this.rules.other.tabCharGlobal, "    ")), i.test(d) || a.test(d) || o.test(d) || c.test(d) || t.test(d) || n.test(d)) break;
						if (m.search(this.rules.other.nonSpaceChar) >= p || !d.trim()) s += "\n" + m.slice(p);
						else {
							if (f || u.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || i.test(u) || a.test(u) || n.test(u)) break;
							s += "\n" + d;
						}
						f = !d.trim(), r += l + "\n", e = e.substring(l.length + 1), u = m.slice(p);
					}
				}
				i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(r) && (o = !0)), i.items.push({
					type: "list_item",
					raw: r,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(s),
					loose: !1,
					text: s,
					tokens: []
				}), i.raw += r;
			}
			let s = i.items.at(-1);
			if (s) s.raw = s.raw.trimEnd(), s.text = s.text.trimEnd();
			else return;
			i.raw = i.raw.trimEnd();
			for (let e of i.items) if (this.lexer.state.top = !1, e.tokens = this.lexer.blockTokens(e.text, []), !i.loose) {
				let t = e.tokens.filter((e) => e.type === "space");
				i.loose = t.length > 0 && t.some((e) => this.rules.other.anyLine.test(e.raw));
			}
			for (let e of i.items) {
				let t = e.tokens[0];
				if (e.task && (t?.type === "text" || t?.type === "paragraph")) {
					e.text = e.text.replace(this.rules.other.listReplaceTask, ""), t.raw = t.raw.replace(this.rules.other.listReplaceTask, ""), t.text = t.text.replace(this.rules.other.listReplaceTask, "");
					for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)) {
						this.lexer.inlineQueue[e].src = this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask, "");
						break;
					}
					let n = this.rules.other.listTaskCheckbox.exec(e.raw);
					if (n) {
						let t = {
							type: "checkbox",
							raw: n[0] + " ",
							checked: n[0] !== "[ ]"
						};
						e.checked = t.checked, i.loose ? e.tokens[0] && ["paragraph", "text"].includes(e.tokens[0].type) && "tokens" in e.tokens[0] && e.tokens[0].tokens ? (e.tokens[0].raw = t.raw + e.tokens[0].raw, e.tokens[0].text = t.raw + e.tokens[0].text, e.tokens[0].tokens.unshift(t)) : e.tokens.unshift({
							type: "paragraph",
							raw: t.raw,
							text: t.raw,
							tokens: [t]
						}) : e.tokens.unshift(t);
					}
				} else e.task &&= !1;
			}
			if (i.loose) for (let e of i.items) {
				e.loose = !0;
				for (let t of e.tokens) t.type === "text" && (t.type = "paragraph");
			}
			return i;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) {
			let e = it(t[0]);
			return {
				type: "html",
				block: !0,
				raw: e,
				pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
				text: e
			};
		}
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			let e = M(t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), n = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: e,
				raw: j(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = rt(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: j(t[0], "\n"),
			header: [],
			align: [],
			rows: []
		};
		if (n.length === r.length) {
			for (let e of r) this.rules.other.tableAlignRight.test(e) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(e) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(e) ? a.align.push("left") : a.align.push(null);
			for (let e = 0; e < n.length; e++) a.header.push({
				text: n[e],
				tokens: this.lexer.inline(n[e]),
				header: !0,
				align: a.align[e]
			});
			for (let e of i) a.rows.push(rt(e, a.header.length).map((e, t) => ({
				text: e,
				tokens: this.lexer.inline(e),
				header: !1,
				align: a.align[t]
			})));
			return a;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) {
			let e = t[1].trim();
			return {
				type: "heading",
				raw: j(t[0], "\n"),
				depth: t[2].charAt(0) === "=" ? 1 : 2,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let e = t[1].charAt(t[1].length - 1) === "\n" ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let n = t[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && lt(e, t[1], n, this.rules)) return;
			let r = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(r)) {
				if (!this.rules.other.endAngleBracket.test(r)) return;
				let e = j(r.slice(0, -1), "\\");
				if ((r.length - e.length) % 2 == 0) return;
			} else {
				let e = at(t[2], "()");
				if (e === -2) return;
				if (e > -1) {
					let n = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + e;
					t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "";
				}
			}
			let i = t[2], a = "";
			if (this.options.pedantic) {
				let e = this.rules.other.pedanticHrefTitle.exec(i);
				e && (i = e[1], a = e[3]);
			} else a = t[3] ? t[3].slice(1, -1) : "";
			return i = i.trim(), this.rules.other.startAngleBracket.test(i) && (i = this.options.pedantic && !this.rules.other.endAngleBracket.test(r) ? i.slice(1) : i.slice(1, -1)), st(t, {
				href: i && i.replace(this.rules.inline.anyPunctuation, "$1"),
				title: a && a.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let r = n[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && lt(e, n[1], r, this.rules)) return;
			let i = t[M((n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "))];
			if (!i) {
				let e = n[0].charAt(0);
				return {
					type: "text",
					raw: e,
					text: e
				};
			}
			return st(n, i, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let r = this.rules.inline.emStrongLDelim.exec(e);
		if (!(!r || !r[1] && !r[2] && !r[3] && !r[4] || r[4] && n.match(this.rules.other.unicodeAlphaNumeric)) && (!(r[1] || r[3]) || !n || this.rules.inline.punctuation.exec(n))) {
			let i = [...r[0]].length - 1, a, o, s = i, c = 0, l = r[0][0], u = n === l, d = l === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (d.lastIndex = 0, t = t.slice(-1 * e.length + i); (r = d.exec(t)) !== null;) {
				if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
				if (o = [...a].length, r[3] || r[4]) {
					s += o;
					continue;
				}
				if (r[5] || r[6]) {
					if (i % 3 && !((i + o) % 3)) {
						c += o;
						continue;
					}
					if (u) break;
				}
				if (s -= o, s > 0) continue;
				o = Math.min(o, o + s + c);
				let t = [...r[0]][0].length, n = e.slice(0, i + r.index + t + o);
				if (Math.min(i, o) % 2) {
					let e = n.slice(1, -1);
					return {
						type: "em",
						raw: n,
						text: e,
						tokens: this.lexer.inlineTokens(e)
					};
				}
				let l = n.slice(2, -2);
				return {
					type: "strong",
					raw: n,
					text: l,
					tokens: this.lexer.inlineTokens(l)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let e = t[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(e), r = this.rules.other.startingSpaceChar.test(e) && this.rules.other.endingSpaceChar.test(e);
			return n && r && (e = e.substring(1, e.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: e
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e, t, n = "") {
		let r = this.rules.inline.delLDelim.exec(e);
		if (r && (!r[1] || !n || this.rules.inline.punctuation.exec(n))) {
			let n = [...r[0]].length - 1, i, a, o = n, s = this.rules.inline.delRDelim;
			for (s.lastIndex = 0, t = t.slice(-1 * e.length + n); (r = s.exec(t)) !== null;) {
				if (i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !i || (a = [...i].length, a !== n)) continue;
				if (r[3] || r[4]) {
					o += a;
					continue;
				}
				if (o -= a, o > 0) continue;
				a = Math.min(a, a + o);
				let t = [...r[0]][0].length, s = e.slice(0, n + r.index + t + a), c = s.slice(n, -n);
				return {
					type: "del",
					raw: s,
					text: c,
					tokens: this.lexer.inlineTokens(c)
				};
			}
		}
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let e, n;
			return t[2] === "@" ? (e = t[1], n = "mailto:" + e) : (e = t[1], n = e), {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let e, n;
			if (t[2] === "@") e = t[0], n = "mailto:" + e;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				e = t[0], n = t[1] === "www." ? "http://" + t[0] : t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let e = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: e ? t[0] : tt(t[0]),
				escaped: e
			};
		}
	}
}, P = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || s, this.options.tokenizer = this.options.tokenizer || new N(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			linkEmitted: !1,
			top: !0
		};
		let t = {
			other: p,
			block: O.normal,
			inline: k.normal
		};
		this.options.pedantic ? (t.block = O.pedantic, t.inline = k.pedantic) : this.options.gfm && (t.block = O.gfm, t.inline = this.options.breaks ? k.breaks : k.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: O,
			inline: k
		};
	}
	static lex(t, n) {
		return new e(n).lex(t);
	}
	static lexInline(t, n) {
		return new e(n).inlineTokens(t);
	}
	lex(e) {
		e = e.replace(p.carriageReturn, "\n"), this.blockTokens(e, this.tokens);
		for (let e = 0; e < this.inlineQueue.length; e++) {
			let t = this.inlineQueue[e];
			this.inlineTokens(t.src, t.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(p.tabCharGlobal, "    ").replace(p.spaceLine, ""));
		let r = 1 / 0;
		for (; e;) {
			if (e.length < r) r = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			let i;
			if (this.options.extensions?.block?.some((n) => (i = n.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), !0) : !1)) continue;
			if (i = this.tokenizer.space(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				i.raw.length === 1 && n !== void 0 ? n.raw += "\n" : t.push(i);
				continue;
			}
			if (i = this.tokenizer.code(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.at(-1).src = n.text) : t.push(i);
				continue;
			}
			if (i = this.tokenizer.fences(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.heading(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.hr(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.blockquote(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.list(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.html(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.def(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.raw, this.inlineQueue.at(-1).src = n.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = {
					href: i.href,
					title: i.title
				}, t.push(i));
				continue;
			}
			if (i = this.tokenizer.table(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.lheading(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			let a = e;
			if (this.options.extensions?.startBlock) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startBlock.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (a = e.substring(0, t + 1));
			}
			if (this.state.top && (i = this.tokenizer.paragraph(a))) {
				let r = t.at(-1);
				n && r?.type === "paragraph" ? (r.raw += (r.raw.endsWith("\n") ? "" : "\n") + i.raw, r.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = r.text) : t.push(i), n = a.length !== e.length, e = e.substring(i.raw.length);
				continue;
			}
			if (i = this.tokenizer.text(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n.text) : t.push(i);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	linkInText(e) {
		if (!e.includes("[")) return !1;
		let t = this.tokenizer.rules.inline.link;
		for (let n of e.matchAll(this.tokenizer.rules.inline.blockSkip)) if (t.test(n[0]) && e.charAt(n.index - 1) !== "!") return !0;
		for (let t of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
			let e = t[0], n = e.lastIndexOf("[");
			if (e.charAt(0) !== "!" && Object.hasOwn(this.tokens.links, M(e.slice(n + 1, -1))) && !(n > 1 && this.linkInText(e.slice(1, n - 1)))) return !0;
		}
		return !1;
	}
	inlineTokens(e, t = []) {
		this.tokenizer.lexer = this;
		let n = e;
		if (this.tokens.links && e.includes("[")) {
			let e = this.tokenizer.rules.inline.reflinkSearch, t = (n) => {
				let r = n.lastIndexOf("[");
				if (!Object.hasOwn(this.tokens.links, M(n.slice(r + 1, -1)))) return n;
				if (r > 1 && n.charAt(0) !== "!") {
					let i = n.slice(1, r - 1);
					if (this.linkInText(i)) return "[" + i.replace(e, t) + "][" + "a".repeat(n.length - r - 2) + "]";
				}
				return "[" + "a".repeat(n.length - 2) + "]";
			};
			n = n.replace(e, t);
		}
		n = n.replace(this.tokenizer.rules.inline.anyPunctuation, (e) => "+".repeat(e.length)), n = n.replace(this.tokenizer.rules.inline.blockSkip, (e, t, n) => {
			let r = n ? n.length : 0;
			return e.slice(0, r) + "[" + "a".repeat(e.length - r - 2) + "]";
		}), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let r = !1, i = "", a = 1 / 0;
		for (; e;) {
			if (e.length < a) a = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			r || (i = ""), r = !1;
			let o;
			if (this.options.extensions?.inline?.some((n) => (o = n.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
			if (o = this.tokenizer.escape(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.tag(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.link(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(o.raw.length);
				let n = t.at(-1);
				o.type === "text" && n?.type === "text" ? (n.raw += o.raw, n.text += o.text) : t.push(o);
				continue;
			}
			if (o = this.tokenizer.emStrong(e, n, i)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.codespan(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.br(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.del(e, n, i)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (o = this.tokenizer.autolink(e)) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			if (!this.state.inLink && (o = this.tokenizer.url(e))) {
				e = e.substring(o.raw.length), t.push(o);
				continue;
			}
			let s = e;
			if (this.options.extensions?.startInline) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startInline.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (s = e.substring(0, t + 1));
			}
			if (o = this.tokenizer.inlineText(s)) {
				e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (i = o.raw.slice(-1)), r = !0;
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += o.raw, n.text += o.text) : t.push(o);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(e) {
		let t = "Infinite loop on byte: " + e;
		if (this.options.silent) console.error(t);
		else throw Error(t);
	}
}, F = class {
	options;
	parser;
	constructor(e) {
		this.options = e || s;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(p.notSpaceStart)?.[0], i = e ? e.replace(p.endingNewline, "") + "\n" : "";
		return r ? "<pre><code class=\"language-" + A(r) + "\">" + (n ? i : A(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : A(i, !0)) + "</code></pre>\n";
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return "<hr>\n";
	}
	list(e) {
		let t = e.ordered, n = e.start, r = "";
		for (let t = 0; t < e.items.length; t++) {
			let n = e.items[t];
			r += this.listitem(n);
		}
		let i = t ? "ol" : "ul", a = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + i + a + ">\n" + r + "</" + i + ">\n";
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let t = 0; t < e.header.length; t++) n += this.tablecell(e.header[t]);
		t += this.tablerow({ text: n });
		let r = "";
		for (let t = 0; t < e.rows.length; t++) {
			let i = e.rows[t];
			n = "";
			for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
			r += this.tablerow({ text: n });
		}
		return r &&= `<tbody>${r}</tbody>`, "<table>\n<thead>\n" + t + "</thead>\n" + r + "</table>\n";
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${A(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, text: n, tokens: r, autolink: i }) {
		let a = i ? A(n, !0) : this.parser.parseInline(r), o = nt(e);
		if (o === null) return a;
		e = A(o, i);
		let s = "<a href=\"" + e + "\"";
		return t && (s += " title=\"" + A(t) + "\""), s += ">" + a + "</a>", s;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = nt(e);
		if (i === null) return A(n);
		e = i;
		let a = `<img src="${A(e)}" alt="${A(n)}"`;
		return t && (a += ` title="${A(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : A(e.text);
	}
}, ut = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
}, I = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || s, this.options.renderer = this.options.renderer || new F(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new ut();
	}
	static parse(t, n) {
		return new e(n).parse(t);
	}
	static parseInline(t, n) {
		return new e(n).parseInline(t);
	}
	parse(e) {
		this.renderer.parser = this;
		let t = "";
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (this.options.extensions?.renderers?.[r.type]) {
				let e = r, n = this.options.extensions.renderers[e.type].call({ parser: this }, e);
				if (n !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"checkbox",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(e.type)) {
					t += n || "";
					continue;
				}
			}
			let i = r;
			switch (i.type) {
				case "space":
					t += this.renderer.space(i);
					break;
				case "hr":
					t += this.renderer.hr(i);
					break;
				case "heading":
					t += this.renderer.heading(i);
					break;
				case "code":
					t += this.renderer.code(i);
					break;
				case "table":
					t += this.renderer.table(i);
					break;
				case "blockquote":
					t += this.renderer.blockquote(i);
					break;
				case "list":
					t += this.renderer.list(i);
					break;
				case "checkbox":
					t += this.renderer.checkbox(i);
					break;
				case "html":
					t += this.renderer.html(i);
					break;
				case "def":
					t += this.renderer.def(i);
					break;
				case "paragraph":
					t += this.renderer.paragraph(i);
					break;
				case "text":
					t += this.renderer.text(i);
					break;
				default: {
					let e = "Token with \"" + i.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return t;
	}
	parseInline(e, t = this.renderer) {
		this.renderer.parser = this;
		let n = "";
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.options.extensions?.renderers?.[i.type]) {
				let e = this.options.extensions.renderers[i.type].call({ parser: this }, i);
				if (e !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"checkbox",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(i.type)) {
					n += e || "";
					continue;
				}
			}
			let a = i;
			switch (a.type) {
				case "escape":
					n += t.text(a);
					break;
				case "html":
					n += t.html(a);
					break;
				case "link":
					n += t.link(a);
					break;
				case "image":
					n += t.image(a);
					break;
				case "checkbox":
					n += t.checkbox(a);
					break;
				case "strong":
					n += t.strong(a);
					break;
				case "em":
					n += t.em(a);
					break;
				case "codespan":
					n += t.codespan(a);
					break;
				case "br":
					n += t.br(a);
					break;
				case "del":
					n += t.del(a);
					break;
				case "text":
					n += t.text(a);
					break;
				default: {
					let e = "Token with \"" + a.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return n;
	}
}, L = class {
	options;
	block;
	constructor(e) {
		this.options = e || s;
	}
	static passThroughHooks = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? P.lex : P.lexInline;
	}
	provideParser(e = this.block) {
		return e ? I.parse : I.parseInline;
	}
}, dt = class {
	defaults = o();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = I;
	Renderer = F;
	TextRenderer = ut;
	Lexer = P;
	Tokenizer = N;
	Hooks = L;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
			case "table": {
				let e = r;
				for (let r of e.header) n = n.concat(this.walkTokens(r.tokens, t));
				for (let r of e.rows) for (let e of r) n = n.concat(this.walkTokens(e.tokens, t));
				break;
			}
			case "list": {
				let e = r;
				n = n.concat(this.walkTokens(e.items, t));
				break;
			}
			default: {
				let e = r;
				this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
					let i = e[r].flat(1 / 0);
					n = n.concat(this.walkTokens(i, t));
				}) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((e) => {
			let n = { ...e };
			if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e) => {
				if (!e.name) throw Error("extension name required");
				if ("renderer" in e) {
					let n = t.renderers[e.name];
					n ? t.renderers[e.name] = function(...t) {
						let r = e.renderer.apply(this, t);
						return r === !1 && (r = n.apply(this, t)), r;
					} : t.renderers[e.name] = e.renderer;
				}
				if ("tokenizer" in e) {
					if (!e.level || e.level !== "block" && e.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
					let n = t[e.level];
					n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && (e.level === "block" ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : e.level === "inline" && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start]));
				}
				"childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens);
			}), n.extensions = t), e.renderer) {
				let t = this.defaults.renderer || new F(this.defaults);
				for (let n in e.renderer) {
					if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
					if (["options", "parser"].includes(n)) continue;
					let r = n, i = e.renderer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n || "";
					};
				}
				n.renderer = t;
			}
			if (e.tokenizer) {
				let t = this.defaults.tokenizer || new N(this.defaults);
				for (let n in e.tokenizer) {
					if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(n)) continue;
					let r = n, i = e.tokenizer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.tokenizer = t;
			}
			if (e.hooks) {
				let t = this.defaults.hooks || new L();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					t[r] = L.passThroughHooks.has(n) ? (e) => {
						if (this.defaults.async && L.passThroughHooksRespectAsync.has(n)) return (async () => {
							let n = await i.call(t, e);
							return a.call(t, n);
						})();
						let r = i.call(t, e);
						return a.call(t, r);
					} : (...e) => {
						if (this.defaults.async) return (async () => {
							let n = await i.apply(t, e);
							return n === !1 && (n = await a.apply(t, e)), n;
						})();
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.hooks = t;
			}
			if (e.walkTokens) {
				let t = this.defaults.walkTokens, r = e.walkTokens;
				n.walkTokens = function(e) {
					let n = [];
					return n.push(r.call(this, e)), t && (n = n.concat(t.call(this, e))), n;
				};
			}
			this.defaults = {
				...this.defaults,
				...n
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return P.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return I.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (t, n) => {
			let r = { ...n }, i = {
				...this.defaults,
				...r
			}, a = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && r.async === !1) return a(/* @__PURE__ */ Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof t > "u" || t === null) return a(/* @__PURE__ */ Error("marked(): input parameter is undefined or null"));
			if (typeof t != "string") return a(/* @__PURE__ */ Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? P.lex : P.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? I.parse : I.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? P.lex : P.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? I.parse : I.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + A(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}, R = new dt();
function z(e, t) {
	return R.parse(e, t);
}
z.options = z.setOptions = function(e) {
	return R.setOptions(e), z.defaults = R.defaults, c(z.defaults), z;
}, z.getDefaults = o, z.defaults = s;
function ft(...e) {
	return R.use(...e), z.defaults = R.defaults, c(z.defaults), z;
}
z.use = ft, z.walkTokens = function(e, t) {
	return R.walkTokens(e, t);
}, z.parseInline = R.parseInline, z.Parser = I, z.parser = I.parse, z.Renderer = F, z.TextRenderer = ut, z.Lexer = P, z.lexer = P.lex, z.Tokenizer = N, z.Hooks = L, z.parse = z, z.options, z.setOptions, z.walkTokens, z.parseInline, I.parse, P.lex;
//#endregion
//#region resources/js/markdown.js
var pt = /* @__PURE__ */ new WeakMap();
function mt(e, t = [], n) {
	for (let n of e.querySelectorAll("a[data-artifact-autolink]")) t.some((e) => typeof e?.name == "string" && e.name === n.getAttribute("data-artifact-autolink")) && n.replaceWith(document.createTextNode(n.textContent));
	for (let r of e.querySelectorAll("a")) {
		let i = pt.get(r) || r.getAttribute("data-generated-source") || r.getAttribute("href");
		if (!i) continue;
		let a = !1;
		try {
			a = new URL(i, "https://fourmix.invalid").pathname.replace(/\/$/, "") === "/api/v3/generated-artifacts";
		} catch {}
		if (!a) continue;
		pt.set(r, i), r.removeAttribute("href"), r.removeAttribute("target"), r.removeAttribute("data-generated-source"), r.setAttribute("role", "button"), r.tabIndex = 0;
		let o = t.find((e) => e && typeof e.download_url == "string" && e.download_url === i), s = (t) => {
			if (t.preventDefault(), t.stopPropagation(), o && typeof n == "function") {
				n(o);
				return;
			}
			let r = e.querySelector("[data-generated-link-notice]");
			r || (r = document.createElement("p"), r.setAttribute("data-generated-link-notice", ""), r.setAttribute("role", "status"), e.append(r)), r.textContent = "このリンクは利用できません。「作成したファイル」の保存ボタンをご利用ください。表示されない場合はファイルを作成し直してください。";
		};
		r.onclick = s, r.onkeydown = (e) => {
			(e.key === "Enter" || e.key === " ") && s(e);
		};
	}
}
var B = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), ht = {}, gt = 0, _t = /* @__PURE__ */ new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/avif"
]), V = (e, t = "", n = "") => {
	let r = document.createElement(e);
	return r.textContent = t, r.className = n, r;
};
function vt(e = {}) {
	ht = { ...e };
}
function H(e) {
	if (typeof e != "string" || /[\u0000-\u0020\u007f]|&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z]+);/i.test(e)) return null;
	try {
		let t = new URL(e, window.location.href);
		return ["https:", "http:"].includes(t.protocol) && !t.username && !t.password ? t : null;
	} catch {
		return null;
	}
}
function yt(e, t) {
	if (!e) return null;
	try {
		if (/\.svg(?:z)?$/i.test(decodeURIComponent(e.pathname))) return null;
	} catch {
		return null;
	}
	let n = e.origin === window.location.origin, r = (t.attachmentUrls || []).some((t) => H(t)?.href === e.href), i = (t.attachmentUrlPrefixes || []).some((t) => {
		let n = H(t);
		return n && n.origin === window.location.origin && !n.search && !n.hash && n.pathname.endsWith("/") && e.pathname.startsWith(n.pathname);
	}), a = n && (r || i), o = (t.allowedImageOrigins || []).some((t) => H(t)?.origin === e.origin);
	return {
		attachment: a,
		auto: a || o
	};
}
function bt(e, t) {
	let n = /* @__PURE__ */ new Uint8Array(64), r = 0;
	for (let t of e) {
		let e = t.subarray(0, n.length - r);
		if (n.set(e, r), r += e.length, r === n.length) break;
	}
	let i = (e) => e.every((e, t) => n[t] === e), a = (e, t) => String.fromCharCode(...n.subarray(e, t));
	return t === "image/png" ? i([
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	]) : t === "image/jpeg" ? i([
		255,
		216,
		255
	]) : t === "image/gif" ? ["GIF87a", "GIF89a"].includes(a(0, 6)) : t === "image/webp" ? a(0, 4) === "RIFF" && a(8, 12) === "WEBP" : t === "image/avif" && a(4, 8) === "ftyp" && /(?:avif|avis)/.test(a(8, r));
}
async function xt(e, t, n, r, i, a) {
	r.textContent = "画像を読み込んでいます…";
	let o = await fetch(e.href, {
		credentials: t.attachment ? "same-origin" : "omit",
		redirect: "error",
		referrerPolicy: "no-referrer",
		signal: i
	}), s = o.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
	if (!o.ok || !_t.has(s)) throw Error("対応する形式の画像を取得できませんでした。");
	let c = 8388608;
	if (Number(o.headers.get("content-length")) > c) throw Error("画像が大きすぎます（上限8MB）。");
	let l = o.body?.getReader();
	if (!l) throw Error("画像を取得できませんでした。");
	let u = [], d = 0;
	try {
		for (;;) {
			let { done: e, value: t } = await l.read();
			if (e) break;
			if (d += t.byteLength, d > c) throw await l.cancel(), Error("画像が大きすぎます（上限8MB）。");
			u.push(t);
		}
	} finally {
		l.releaseLock();
	}
	if (i.throwIfAborted(), !bt(u, s)) throw Error("画像の形式を確認できませんでした。");
	let f = URL.createObjectURL(new Blob(u, { type: s }));
	n.onload = () => {
		URL.revokeObjectURL(f), r.textContent = "";
	}, n.onerror = () => {
		URL.revokeObjectURL(f), r.textContent = "画像を表示できませんでした。", n.remove(), a();
	}, i.addEventListener("abort", () => {
		URL.revokeObjectURL(f), n.removeAttribute("src");
	}, { once: !0 }), n.src = f;
}
function St(t, n, r, i) {
	let a = t.parentElement, o = V("div", "", "fi-code-toolbar fi:flex fi:items-center fi:justify-between fi:gap-3"), s = V("span", n || "テキスト"), c = V("button", "コピー", "fi-button fi-button-ghost fi:whitespace-nowrap");
	c.type = "button", c.setAttribute("aria-live", "polite");
	let l = t.textContent;
	c.onclick = async () => {
		try {
			await navigator.clipboard.writeText(l), c.textContent = "コピーしました";
		} catch {
			c.textContent = "コピーできません", c.title = "コードを選択してコピーしてください。";
		}
	}, o.append(s, c), a.before(o), a.classList.add("fi-code-content"), n && n !== "mermaid" && l.length <= 5e4 && r.push(import("./common-CrXoIpMT.js").then(({ default: r }) => {
		if (i.aborted || !r.getLanguage(n)) return;
		let a = e.sanitize(r.highlight(l, {
			language: n,
			ignoreIllegals: !0
		}).value, {
			RETURN_DOM_FRAGMENT: !0,
			ALLOWED_TAGS: ["span"],
			ALLOWED_ATTR: ["class"],
			ALLOW_DATA_ATTR: !1
		});
		for (let e of a.querySelectorAll("span")) e.className = [...e.classList].filter((e) => /^hljs-[a-z0-9_-]+$/.test(e)).join(" ");
		t.replaceChildren(a);
	}).catch(() => {}));
}
function U(t, n = {}) {
	let r = {
		...ht,
		...n
	}, i = new AbortController(), a = [], o = [], s = document.createElement("div");
	s.className = "fi-markdown fi:min-w-0 fi:space-y-3 fi:break-words", s.dispose = () => i.abort();
	let c = `fi-embed-${++gt}-`, l = new dt({
		gfm: !0,
		breaks: !0,
		async: !1,
		renderer: {
			html: ({ text: e }) => B(e),
			image: (e) => {
				let t = c + o.length;
				return o.push({
					id: t,
					token: e
				}), `<span id="${t}"></span>`;
			},
			code: (e) => {
				let t = c + o.length;
				return o.push({
					id: t,
					code: e
				}), `<div id="${t}"></div>`;
			},
			link: function(e) {
				let t = H(e.href), n = this.parser.parseInline(e.tokens);
				if (t && /^\/connection-actions\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(t.pathname) && !t.search && !t.hash) return `${n}（正式な操作確認カードで内容を確認してください）`;
				let r = e.raw === e.text && !/^(?:https?:\/\/|www\.)/i.test(e.raw || "") ? ` data-artifact-autolink="${B(e.text)}"` : "", i = t?.pathname.replace(/\/$/, "") === "/api/v3/generated-artifacts" ? ` data-generated-source="${B(e.href)}"` : "";
				return t ? `<a href="${B(t.href)}"${i}${r}${e.title ? ` title="${B(e.title)}"` : ""}>${n}</a>` : n;
			}
		}
	});
	if (!e.isSupported) return s.textContent = String(t), s.ready = Promise.resolve(), s;
	let u = String(t);
	s.append(e.sanitize(u.length <= 2e5 ? l.parse(u) : `<p>${B(u)}</p>`, {
		RETURN_DOM_FRAGMENT: !0,
		ALLOWED_TAGS: /* @__PURE__ */ "div.span.p.br.strong.em.del.blockquote.ul.ol.li.code.pre.table.thead.tbody.tr.th.td.a.h1.h2.h3.h4.h5.h6.hr".split("."),
		ALLOWED_ATTR: [
			"id",
			"href",
			"title",
			"start",
			"align"
		],
		ADD_URI_SAFE_ATTR: ["align"],
		ALLOW_DATA_ATTR: !1,
		ALLOW_ARIA_ATTR: !1,
		ALLOWED_URI_REGEXP: /^https?:\/\//i
	}));
	for (let e of s.querySelectorAll("table")) {
		let t = document.createElement("div");
		t.className = "fi:max-w-full fi:overflow-x-auto", e.before(t), t.append(e), t.tabIndex = 0, t.setAttribute("role", "region"), t.setAttribute("aria-label", "表（横にスクロールできます）");
		for (let t of e.querySelectorAll("[align]")) t.style.textAlign = t.getAttribute("align"), t.removeAttribute("align");
	}
	for (let e of s.querySelectorAll("a[href]")) e.target = "_blank", e.rel = "noopener noreferrer";
	let d = 0;
	for (let e of o) {
		let t = s.querySelector(`#${e.id}`);
		if (t) {
			if (t.removeAttribute("id"), e.code) {
				let n = (e.code.lang || "").split(/\s+/)[0].toLowerCase(), o = /^[a-z0-9_.+#-]{1,40}$/.test(n) ? n : "", s = V("div", "", "fi-code-block fi:min-w-0 fi:overflow-hidden"), c = V("pre"), l = V("code", e.code.text);
				if (c.append(l), s.append(c), t.replaceWith(s), r.streaming || St(l, o, a, i.signal), !r.streaming && o === "mermaid" && ++d <= 6) {
					let t = V("figure", "", "fi-diagram fi:max-w-full fi:overflow-x-auto"), n = V("p", "図を作成しています…", "fi:my-2 fi:text-sm");
					n.setAttribute("role", "status"), t.append(n), s.before(t), a.push(import("./mermaid-D3tOjArB.js").then(({ renderDiagram: t }) => t(e.code.text, { signal: i.signal })).then((e) => {
						if (i.signal.aborted) return;
						let n = V("div", "", "fi-diagram-canvas");
						n.tabIndex = 0, n.setAttribute("role", "region"), n.setAttribute("aria-label", "図（拡大時は上下左右にスクロールできます）"), n.append(e);
						let r = e.getAttribute("width"), a = (e.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number), o = a.length === 4 && a.every(Number.isFinite) ? Math.min(1920, Math.max(1, a[2])) : Number(r), c = V("button", "図を拡大", "fi-button fi-button-secondary");
						c.type = "button", c.setAttribute("aria-pressed", "false"), c.onclick = () => {
							let t = c.getAttribute("aria-pressed") !== "true";
							c.setAttribute("aria-pressed", String(t)), c.textContent = t ? "図を元の大きさに戻す" : "図を拡大", e.setAttribute("width", t ? String(o) : r), e.style.maxWidth = t ? "none" : "100%";
						}, t.replaceChildren(c, n);
						let l = V("details");
						l.append(V("summary", "図のコードを確認"), s), t.append(l);
					}).catch(() => {
						i.signal.aborted || (n.textContent = "図を表示できませんでした。以下のコードを確認してください。");
					}));
				} else !r.streaming && o === "mermaid" && s.before(V("p", "1つの回答で表示できる図は6つまでです。以下のコードを確認してください。", "fi:text-sm"));
			} else {
				if (r.streaming) {
					t.replaceWith(V("span", `${e.token.text || "画像"}（回答後に表示）`));
					continue;
				}
				let n = H(e.token.href), o = yt(n, r);
				if (!o) {
					t.replaceWith(V("span", `${e.token.text || "画像"}（この画像形式・URLは表示できません）`));
					continue;
				}
				let s = V("span", "", "fi-image-placeholder fi:inline-flex fi:max-w-full fi:flex-col fi:gap-2"), c = V("span", o.auto ? "画像を読み込んでいます…" : "外部画像です。読み込むと画像の提供元にアクセスします。", "fi:text-sm");
				c.setAttribute("role", "status");
				let l = V("img");
				l.alt = e.token.text || "AI回答の画像", l.className = "fi:max-w-full fi:h-auto fi:rounded-lg", l.referrerPolicy = "no-referrer";
				let u = V("button", o.auto ? "再読み込み" : "画像を読み込む", "fi-button fi-button-secondary fi:whitespace-nowrap");
				u.type = "button";
				let d = async () => {
					if (!i.signal.aborted) {
						u.disabled = !0;
						try {
							await xt(n, o, l, c, i.signal, () => {
								u.hidden = !1;
							}), i.signal.aborted || (s.append(l), u.hidden = !0);
						} catch (e) {
							i.signal.aborted || (c.textContent = /[ぁ-んァ-ヶ一-龠]/.test(e.message || "") ? e.message : "画像を取得できませんでした。通信と画像の公開設定を確認してください。", u.hidden = !1);
						} finally {
							u.disabled = !1;
						}
					}
				};
				u.onclick = d, s.append(c, u), t.replaceWith(s), o.auto && a.push(d());
			}
		}
	}
	if (s.ready = Promise.allSettled(a), typeof MutationObserver < "u") {
		let e = !1, t = new MutationObserver(() => {
			s.isConnected ? e = !0 : e && (i.abort(), t.disconnect());
		});
		t.observe(document.body, {
			childList: !0,
			subtree: !0
		}), i.signal.addEventListener("abort", () => t.disconnect(), { once: !0 });
	}
	return mt(s), s;
}
//#endregion
//#region resources/js/chat.js
var Ct = class {
	constructor(e = "/fourmix-intelligence", t, n = "page") {
		this.base = e.replace(/\/$/, ""), this.csrfToken = t, this.surfaceName = n;
	}
	expectation(e) {
		return this.expectedSelection = e ? {
			connection_id: e.connection_id,
			grant_id: e.grant_id,
			connection_revision: e.connection_revision
		} : null, this;
	}
	selectionBody() {
		return this.expectedSelection ? { expected_selection: { ...this.expectedSelection } } : {};
	}
	selectionQuery() {
		return this.expectedSelection ? Object.fromEntries(Object.entries(this.expectedSelection).map(([e, t]) => [`expected_selection[${e}]`, String(t)])) : {};
	}
	call(e, t = {}) {
		return $(`${this.base}/${e}`, {
			csrfToken: this.csrfToken,
			...t
		});
	}
	state() {
		return this.call("state");
	}
	agents(e) {
		return this.call(`agents?connection_id=${encodeURIComponent(e)}`);
	}
	select(e, t, n) {
		return this.call(`agents/${encodeURIComponent(e)}`, {
			method: "PUT",
			body: {
				connection_id: t,
				grant_id: n
			}
		});
	}
	surface(e, t) {
		return this.call(`surfaces/${encodeURIComponent(e)}`, {
			method: "PUT",
			body: t
		});
	}
	ask(e, t, { conversationId: n, context: r = {}, attachmentIds: i = [], signal: a, onEvent: o } = {}) {
		return this.call("chat", {
			method: "POST",
			body: {
				surface: this.surfaceName,
				alias: e,
				...this.selectionBody(),
				message: t,
				context: r,
				attachment_ids: i,
				...n ? { conversation_id: n } : {}
			},
			signal: a,
			onEvent: o
		});
	}
	history(e, t, n) {
		return this.call("history", {
			method: "POST",
			body: {
				surface: this.surfaceName,
				alias: e,
				...this.selectionBody(),
				...t ? { conversation_id: t } : {},
				...n ? { before_id: n } : {}
			}
		});
	}
	runControl(e, t, n, r = !1) {
		return this.call("run-control", {
			method: "POST",
			body: {
				surface: this.surfaceName,
				alias: e,
				...this.selectionBody(),
				conversation_id: t,
				run_id: n,
				cancel: r
			}
		});
	}
	attachments(e, t) {
		return this.call(`attachments?${new URLSearchParams({
			surface: this.surfaceName,
			alias: e,
			...this.selectionQuery(),
			...t ? { conversation_id: t } : {}
		})}`);
	}
	uploadAttachment(e, t, { conversationId: n, requestId: r = crypto.randomUUID(), signal: i } = {}) {
		let a = new FormData();
		a.set("surface", this.surfaceName), a.set("alias", e);
		for (let [e, t] of Object.entries(this.selectionQuery())) a.set(e, t);
		return a.set("file", t), a.set("request_id", r), n && a.set("conversation_id", n), this.call("attachments", {
			method: "POST",
			body: a,
			signal: i
		});
	}
	attachmentUrl(e, t, n) {
		return `${this.base}/attachments/${encodeURIComponent(t)}/${encodeURIComponent(n)}/content?${new URLSearchParams({
			surface: this.surfaceName,
			alias: e,
			...this.selectionQuery()
		})}`;
	}
	artifactUrl(e, t, n) {
		return `${this.base}/artifacts/${encodeURIComponent(t)}/${encodeURIComponent(n)}/content?${new URLSearchParams({
			surface: this.surfaceName,
			alias: e,
			...this.selectionQuery()
		})}`;
	}
	deleteAttachment(e, t, n) {
		return this.call(`attachments/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, {
			method: "DELETE",
			body: {
				surface: this.surfaceName,
				alias: e,
				...this.selectionBody()
			}
		});
	}
};
window.FourmixIntelligenceSDK = {
	Client: Ct,
	request: $,
	Rendering: {
		configure: vt,
		render: U
	}
};
var W = (e, t = "", n = "") => {
	let r = document.createElement(e);
	return r.textContent = t, r.className = n, r;
}, G = {
	confirmation_required: "確認待ち",
	succeeded: "完了",
	rejected: "実行せず終了",
	unknown_effect: "結果の確認が必要",
	running: "処理中",
	expired: "確認期限切れ"
}, wt = (e, t) => {
	try {
		return new Intl.DateTimeFormat("ja-JP", {
			...t ? { timeZone: t } : {},
			dateStyle: "short",
			timeStyle: "short"
		}).format(new Date(e));
	} catch {
		return "";
	}
};
function K(e) {
	let t = {
		chat: "M4 4h16v12H9l-5 4V4Z",
		plus: "M12 5v14M5 12h14",
		history: "M4 9a8 8 0 1 1 1 9M4 4v5h5M12 8v5l3 2",
		refresh: "M4 9a8 8 0 0 1 14-3l2 3M20 15a8 8 0 0 1-14 3l-2-3M20 4v5h-5M4 20v-5h5",
		send: "M12 19V5M6 11l6-6 6 6",
		close: "M6 6l12 12M18 6 6 18",
		attach: "M8 13 14 7a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9",
		files: "M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6",
		help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
		shield: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"
	}, n = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	for (let [e, t] of Object.entries({
		viewBox: "0 0 24 24",
		width: "18",
		height: "18",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "1.6",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": "true"
	})) n.setAttribute(e, t);
	n.setAttribute("class", "fi:shrink-0");
	let r = document.createElementNS("http://www.w3.org/2000/svg", "path");
	return r.setAttribute("d", t[e] || t.chat), n.append(r), n;
}
var q = (e, t, n = "primary", r) => {
	let i = W("button", "", `fi-button ${n === "primary" ? "" : `fi-button-${n}`} fi:gap-2 fi:whitespace-nowrap`);
	return i.type = "button", i.onclick = t, r && i.append(K(r)), e && i.append(W("span", e)), i;
}, Tt = 0, Et = 0;
function Dt(e) {
	if (typeof e != "string" || !e.trim()) return null;
	try {
		let t = new URL(e, location.origin);
		return t.origin === location.origin && ["https:", "http:"].includes(t.protocol) ? t.href : null;
	} catch {
		return null;
	}
}
function J(e, t) {
	t.replaceChildren();
	let n = e.data;
	if (e.state === "succeeded") {
		if (n && typeof n == "object" && !Array.isArray(n)) {
			typeof n.message == "string" && n.message.trim() && t.append(W("p", n.message, "fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words"));
			let e = Dt(n.url);
			if (e) {
				let n = W("a", "業務画面で結果を見る", "fi-button");
				n.href = e, t.append(n);
			}
		} else typeof n == "string" && t.append(W("p", n, "fi:whitespace-pre-wrap fi:break-words"));
	} else typeof e.message == "string" && t.append(W("p", e.message, "fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words"));
	if (n !== void 0 || e.preview !== void 0) {
		let r = W("details", "", "fi:rounded-xl fi:bg-raised fi:p-3");
		r.append(W("summary", "結果の詳細", "fi:cursor-pointer fi:text-sm fi:text-secondary"), W("pre", JSON.stringify(n ?? e.preview, null, 2), "fi:mt-3 fi:whitespace-pre-wrap fi:break-words fi:text-xs")), t.append(r);
	}
}
async function Ot(e, t, n, r) {
	let i = W("dialog", "", "fi-dialog fi:open:flex fi:open:flex-col fi:w-full fi:max-w-xl fi:max-h-[85dvh] fi:overflow-hidden fi:rounded-2xl fi:border fi:border-line fi:bg-surface fi:p-0 fi:text-ink"), a = W("header", "", "fi-dialog-header fi:flex fi:shrink-0 fi:items-start fi:gap-3 fi:border-b fi:border-line fi:px-6 fi:py-5"), o = W("span", "", "fi:flex fi:size-10 fi:shrink-0 fi:items-center fi:justify-center fi:rounded-xl fi:bg-raised fi:text-secondary");
	o.append(K("shield"));
	let s = W("div", "", "fi:min-w-0 fi:space-y-1"), c = W("h2", "業務操作の確認", "fi:text-lg fi:font-semibold");
	c.id = `fi-action-title-${++Tt}`;
	let l = W("p", "操作の内容を読み込んでいます…", "fi:text-sm fi:text-secondary fi:break-words");
	l.setAttribute("role", "status"), l.setAttribute("aria-live", "polite"), s.append(c, l), a.append(o, s), i.setAttribute("aria-labelledby", c.id), i.setAttribute("aria-busy", "true");
	let u = W("div", "", "fi-dialog-body fi:min-h-0 fi:flex-1 fi:overflow-y-auto fi:space-y-5 fi:px-6 fi:py-5"), d = W("footer", "", "fi-dialog-footer fi:flex fi:shrink-0 fi:flex-wrap fi:items-center fi:justify-end fi:gap-2 fi:border-t fi:border-line fi:px-6 fi:py-4");
	d.append(q("閉じる", () => i.close(), "secondary")), i.append(a, u, d), n.append(i), i.showModal(), i.addEventListener("close", () => i.remove(), { once: !0 });
	try {
		let i = await e.call(`actions/${encodeURIComponent(t)}`);
		l.textContent = `${i.operation} · ${G[i.state] || "状態を確認できません"}`, i.state !== "confirmation_required" && (c.textContent = "業務操作の結果");
		let a = new CustomEvent("fourmix:review", {
			detail: {
				action: i,
				container: u
			},
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		n.dispatchEvent(a);
		let o = !1, s = Dt(i.url);
		if (s) {
			let e = W("a", "このアプリケーションの確認画面で確認", "fi-button");
			e.href = s, u.append(e), o = !0;
		}
		let f = W("div", "", "fi:space-y-3");
		if (u.append(f), a.defaultPrevented || (i.state === "confirmation_required" ? o || f.append(W("pre", JSON.stringify(i.preview ?? {}, null, 2), "fi:whitespace-pre-wrap fi:break-words fi:rounded-lg fi:bg-raised fi:p-4 fi:text-sm")) : J(i, f)), i.expires_at && u.append(W("p", `確認期限：${wt(i.expires_at, e.timezone)}`, "fi:text-sm fi:text-secondary")), i.state === "confirmation_required" && !o) {
			let n = W("label", "", "fi:flex fi:items-start fi:gap-3 fi:rounded-xl fi:bg-raised fi:p-4 fi:text-sm fi:leading-relaxed"), i = W("input", "", "fi:mt-1 fi:shrink-0");
			i.type = "checkbox", n.append(i, W("span", "対象と変更内容を確認しました。"));
			let o = W("div", "", "fi:flex fi:flex-wrap fi:items-center fi:gap-2"), s = q("確認して実行", () => m("confirm")), p = q("実行しない", () => m("reject"), "danger");
			s.disabled = !0, i.onchange = () => {
				s.disabled = !i.checked;
			};
			async function m(u) {
				s.disabled = p.disabled = i.disabled = !0;
				let d;
				try {
					d = await e.call(`actions/${encodeURIComponent(t)}/${u}`, {
						method: "POST",
						body: { acknowledge: i.checked }
					});
				} catch (e) {
					l.textContent = `${e.message} 再実行の前に操作履歴を確認してください。`;
					return;
				}
				l.textContent = G[d.state] || "状態を確認できません", c.textContent = "業務操作の結果", n.remove(), o.remove(), a.defaultPrevented || J(d, f);
				try {
					await r(d);
				} catch {
					l.textContent = `${G[d.state] || "結果を受信しました"}。操作一覧を更新できませんでした。再読み込みして確認してください。`;
				}
				document.defaultView?.dispatchEvent(new CustomEvent("fourmix:action-changed", { detail: {
					id: t,
					state: d.state
				} }));
			}
			o.append(p, s), u.append(n), d.append(o);
		}
	} catch (e) {
		l.textContent = e.message;
	} finally {
		i.setAttribute("aria-busy", "false");
	}
}
var kt = class extends HTMLElement {
	connectedCallback() {
		if (this.surfaceHandler ||= (e) => {
			let t = Array.isArray(e.detail) && e.detail.find((e) => e.name === this.getAttribute("surface"));
			t && (!t.enabled || t.connection_id !== this.api?.expectedSelection?.connection_id || t.grant_id !== this.api?.expectedSelection?.grant_id || t.connection_revision != null && String(t.connection_revision) !== String(this.api?.expectedSelection?.connection_revision)) && this.invalidateSelection();
		}, document.defaultView?.addEventListener("fourmix:surfaces", this.surfaceHandler), this.actionHandler ||= (e) => this.refreshActionResults(e?.detail?.state), document.defaultView?.addEventListener("fourmix:action-changed", this.actionHandler), document.defaultView?.addEventListener("focus", this.actionHandler), this.initialized) {
			this.mergePageHeader();
			return;
		}
		this.initialized = !0, this.api = new Ct(this.getAttribute("api-base") || "/fourmix-intelligence", this.getAttribute("csrf-token"), this.getAttribute("surface") || "page"), this.conversationId = this.getAttribute("conversation-id") || null, this.attachments = [], this.attachmentMetadata = /* @__PURE__ */ new Map(), this.attachmentPolicy = null, this.artifactDownloads = /* @__PURE__ */ new Set(), this.panel = W("section", "", "fi-chat"), this.append(this.panel);
		let e = this.toolbar = W("header", "", "fi-chat-toolbar"), t = W("label", "", "fi-chat-agent");
		t.append(K("chat"), W("span", "使用するAI", "fi:sr-only")), this.agentTitle = W("span", this.getAttribute("assistant-name") || "AIアシスタント", "fi-chat-agent-title"), t.append(this.agentTitle), this.activeAlias = "", this.fresh = q("新しい会話", () => {
			this.isBusy() || this.sendUncertain || (this.resetConversation(), this.recover());
		}, "ghost", "plus"), this.fresh.classList.add("fi-chat-header-button"), this.fresh.setAttribute("aria-label", "新しい会話"), this.fresh.title = "新しい会話", this.retry = q("", () => this.recover(), "ghost", "refresh"), this.retry.classList.add("fi-chat-icon-button"), this.retry.setAttribute("aria-label", "AIと履歴を再読み込み"), this.retry.title = "AIと履歴を再読み込み", this.history = q("会話履歴", () => {
			this.isBusy() || this.toggleHistory();
		}, "ghost", "history"), this.history.classList.add("fi-chat-header-button"), this.history.setAttribute("aria-label", "会話履歴"), this.history.title = "会話履歴", this.history.setAttribute("aria-expanded", "false"), this.businessStatus = W("a", "", "fi-chat-business-status"), this.businessStatus.hidden = !0, e.append(t, this.businessStatus, this.history, this.fresh, this.retry), this.panel.append(e), this.mergePageHeader();
		let n = this.getAttribute("history-layout");
		if (this.historyLayout = ["drawer", "dropdown"].includes(n) ? n : this.closest?.("fourmix-intelligence-floating-chat") ? "dropdown" : "drawer", this.historyPanel = W("div", "", `fi-chat-history-panel fi-chat-history-${this.historyLayout}`), this.historyPanel.hidden = !0, this.historyPanel.id = `fi-chat-history-${++Et}`, this.history.setAttribute("aria-controls", this.historyPanel.id), this.historyLayout === "drawer") {
			let e = q("", () => this.toggleHistory(!1), "ghost");
			e.className = "fi-chat-history-backdrop", e.setAttribute("aria-label", "会話履歴を閉じる"), e.tabIndex = -1, this.historyPanel.append(e);
		}
		let r = W("aside", "", "fi-chat-history-content");
		r.setAttribute("role", "region");
		let i = W("header", "", "fi-chat-history-header"), a = W("h2", "会話履歴");
		a.id = `${this.historyPanel.id}-title`, r.setAttribute("aria-labelledby", a.id), this.historyClose = q("", () => this.toggleHistory(!1), "ghost", "close"), this.historyClose.classList.add("fi-chat-icon-button"), this.historyClose.setAttribute("aria-label", "会話履歴を閉じる"), i.append(a, this.historyClose), r.append(i), this.historyStatus = W("p", "会話履歴はまだありません", "fi-chat-history-status"), this.historyStatus.setAttribute("role", "status"), this.historyStatus.setAttribute("aria-live", "polite"), this.historyList = W("div", "", "fi-chat-history-list"), this.historyList.setAttribute("aria-label", "これまでの会話"), r.append(this.historyStatus, this.historyList), this.historyPanel.append(r), this.panel.append(this.historyPanel), this.panel.onkeydown = (e) => {
			e.key === "Escape" && !this.historyPanel.hidden && (e.preventDefault(), e.stopPropagation(), this.toggleHistory(!1));
		}, this.notice = W("p", "", "fi-chat-notice fi:shrink-0 fi:px-5 fi:py-3 fi:text-sm fi:leading-relaxed fi:text-secondary"), this.notice.hidden = !0, this.notice.setAttribute("role", "status"), this.notice.setAttribute("aria-live", "polite"), this.notice.setAttribute("aria-atomic", "true"), this.panel.append(this.notice), this.setupLink = W("a", "接続とチャットを設定", "fi:shrink-0 fi:px-5 fi:py-2 fi:text-sm fi:underline fi:underline-offset-4"), this.setupLink.href = `${this.api.base}#fi-surfaces`, this.setupLink.hidden = !0, this.panel.append(this.setupLink), this.viewport = W("div", "", "fi-chat-viewport fi:min-h-0 fi:flex-1 fi:overflow-y-auto fi:overscroll-contain fi:px-5 fi:py-6 fi:sm:px-7"), this.empty = W("div", "", "fi-chat-empty fi:flex fi:min-h-52 fi:h-full fi:flex-col fi:items-center fi:justify-center fi:gap-4 fi:py-6 fi:text-center");
		let o = W("div", "", "fi:flex fi:size-14 fi:shrink-0 fi:items-center fi:justify-center fi:rounded-2xl fi:bg-raised fi:text-secondary");
		o.append(K("chat")), this.empty.append(o, W("h2", "どのようなお手伝いをしましょうか？", "fi:text-lg fi:font-semibold fi:tracking-tight"), W("p", "質問や相談したいことを入力してください。", "fi:max-w-sm fi:text-sm fi:leading-relaxed fi:text-secondary"));
		let s = W("div", "", "fi:flex fi:flex-wrap fi:justify-center fi:gap-2 fi:pt-1");
		for (let e of [
			"情報を整理する",
			"内容を確認する",
			"アイデアを相談する"
		]) s.append(W("span", e, "fi:rounded-full fi:bg-raised fi:px-3 fi:py-1.5 fi:text-xs fi:text-secondary"));
		this.empty.append(s), this.messages = W("div", "", "fi:space-y-6"), this.messages.setAttribute("role", "log"), this.messages.setAttribute("aria-label", "AIとの会話"), this.messages.setAttribute("aria-live", "polite"), this.messages.setAttribute("aria-relevant", "additions"), this.more = q("以前のメッセージを表示", async () => {
			if (!this.isBusy() && this.ready) try {
				await this.loadHistory(this.conversationId, this.beforeId);
			} catch (e) {
				this.setNotice(e.message, "error");
			}
		}, "ghost", "history"), this.more.hidden = !0, this.viewport.append(this.empty, this.more, this.messages), this.panel.append(this.viewport), this.progress = W("div", "", "fi-chat-progress"), this.progress.hidden = !0;
		let c = this.progressActivity = W("span", "", "fi:size-1.5 fi:shrink-0 fi:rounded-full fi:bg-emerald-500");
		c.setAttribute("aria-hidden", "true"), this.progressLabel = W("span", "", "fi:min-w-0 fi:truncate"), this.progressLabel.setAttribute("role", "status"), this.progressLabel.setAttribute("aria-live", "polite"), this.progressTime = W("span", "", "fi:shrink-0 fi:tabular-nums"), this.progressTime.setAttribute("aria-live", "off"), this.progress.append(c, this.progressLabel, this.progressTime), this.panel.append(this.progress), this.approvals = W("div", "", "fi-chat-approvals fi:flex fi:shrink-0 fi:flex-wrap fi:gap-2 fi:border-t fi:border-line fi:px-5 fi:py-3"), this.approvals.hidden = !0, this.panel.append(this.approvals);
		let l = W("form", "", "fi-chat-composer"), u = W("label", "", "fi:block");
		u.append(W("span", "AIへの依頼", "fi:sr-only")), this.input = W("textarea", "", "fi-chat-input"), this.input.rows = 1, this.input.maxLength = 1e4, this.input.placeholder = this.getAttribute("input-placeholder") || "質問や依頼を入力…", this.input.value = this.getAttribute("initial-prompt") || "", this.input.oninput = () => this.resizeInput(), u.append(this.input), this.attachmentCards = W("div", "", "fi-chat-attachments"), this.attachmentCards.hidden = !0, this.attachmentCards.setAttribute("aria-label", "送信する添付ファイル"), l.append(this.attachmentCards), this.fileInput = W("input"), this.fileInput.type = "file", this.fileInput.multiple = !0, this.fileInput.hidden = !0, this.fileInput.setAttribute("aria-label", "添付するファイル"), this.fileInput.onchange = () => {
			let e = [...this.fileInput.files || []];
			this.fileInput.value = "", this.addFiles(e);
		}, this.attachButton = q("ファイルを添付", () => {
			this.additions.open = !1, this.fileInput.click();
		}, "ghost", "attach"), this.attachButton.setAttribute("aria-label", "ファイルを添付"), l.append(this.fileInput), this.storedButton = q("保存済みファイル", () => this.checkAttachments(), "ghost", "files"), this.storedButton.setAttribute("aria-label", "保存済みファイル");
		let d = W("details", "", "fi-chat-help"), f = W("summary", "", "fi-button fi-button-ghost");
		f.append(K("help"), W("span", "添付形式と利用条件")), f.setAttribute("aria-label", "添付形式と利用条件"), this.attachmentHelp = W("p", "添付の利用条件を確認しています…", "fi-attachment-help"), d.append(f, this.attachmentHelp), this.storedAttachments = W("details", "", "fi-attachment-stored"), this.storedAttachments.hidden = !0, l.ondragover = (e) => {
			e.dataTransfer?.types?.includes("Files") && (e.preventDefault(), e.dataTransfer && (e.dataTransfer.dropEffect = this.isBusy() ? "none" : "copy"));
		}, l.ondrop = (e) => {
			e.dataTransfer?.files?.length && (e.preventDefault(), this.addFiles([...e.dataTransfer.files]));
		}, this.input.onpaste = (e) => {
			let t = [...e.clipboardData?.files || []];
			t.length && (e.preventDefault(), this.addFiles(t));
		};
		let p = W("div", "", "fi-chat-composer-row");
		this.additions = W("details", "", "fi-chat-additions");
		let m = W("summary", "", "fi-chat-additions-toggle"), h = K("plus");
		h.setAttribute("width", "20"), h.setAttribute("height", "20"), m.append(h), m.setAttribute("aria-label", "添付と利用条件"), m.title = "ファイルを添付・保存済みファイル・利用条件";
		let g = W("div", "", "fi-chat-additions-menu");
		g.append(this.attachButton, this.storedButton, this.storedAttachments, d), this.additions.append(m, g), this.submit = q("", null, "primary", "send"), this.submit.classList.add("fi-chat-send"), this.submit.type = "submit", this.submit.setAttribute("aria-label", "送信"), this.submit.title = "送信", this.cancel = q("", () => this.requestStop(), "secondary", "close"), this.cancel.classList.add("fi-chat-send"), this.cancel.setAttribute("aria-label", "停止"), this.cancel.title = "停止", this.cancel.hidden = !0, this.recovery = q("結果を確認", () => this.checkRunResult(), "secondary", "history"), this.recovery.hidden = !0, this.panel.append(this.recovery), p.append(this.additions, u, this.cancel, this.submit), l.append(p), this.panel.append(l), this.resizeInput(), l.onsubmit = (e) => {
			e.preventDefault(), this.send();
		}, this.recover();
	}
	disconnectedCallback() {
		this.historyRequest = (this.historyRequest || 0) + 1, this.attachmentListRequest = (this.attachmentListRequest || 0) + 1, document.defaultView?.removeEventListener("fourmix:surfaces", this.surfaceHandler), document.defaultView?.removeEventListener("fourmix:action-changed", this.actionHandler), document.defaultView?.removeEventListener("focus", this.actionHandler), this.abort?.abort(), this.stopProgress(), this.clearStreamRender(), this.uploadAbort?.abort(), this.disposeMessages();
		for (let e of this.attachments || []) this.revokePreview(e);
	}
	mergePageHeader() {
		let e = this.closest?.(".fi-sdk-chat-layout"), t = e?.querySelector(".fi-sdk-header");
		if (!t || t.hidden) return;
		let n = t.querySelector(".fi-sdk-brand"), r = t.querySelector(".fi-sdk-header-actions");
		n && r && (this.toolbar.prepend(n), this.toolbar.append(r), this.toolbar.classList.add("fi-chat-toolbar-branded"), t.hidden = !0, e.classList.add("fi-sdk-chat-merged"));
	}
	resizeInput() {
		if (!this.input?.style) return;
		let e = Math.max(48, Math.min(320, Number(this.getAttribute("composer-max-height")) || 160));
		this.input.style.height = "auto", this.input.style.height = `${Math.max(40, Math.min(e, this.input.scrollHeight || 40))}px`, this.input.style.overflowY = this.input.scrollHeight > e ? "auto" : "hidden";
	}
	event(e, t) {
		this.dispatchEvent(new CustomEvent(`fourmix:${e}`, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	setNotice(e, t = "info") {
		this.notice.textContent = e, this.notice.hidden = !e, this.notice.setAttribute("data-tone", t), this.notice.setAttribute("role", t === "error" ? "alert" : "status"), this.notice.setAttribute("aria-live", t === "error" ? "assertive" : "polite");
	}
	startProgress() {
		this.stopProgress(), this.startedAt = document.defaultView.performance.now(), this.progress.hidden = !1, this.progressActivity.classList.add("fi:motion-safe:animate-pulse"), this.progressLabel.textContent = "AIに接続しています", this.tickProgress(), this.progressTimer = document.defaultView.setInterval(() => this.tickProgress(), 1e3);
	}
	tickProgress() {
		if (this.startedAt == null) return;
		let e = Math.floor((document.defaultView.performance.now() - this.startedAt) / 1e3);
		this.progressTime.textContent = `${e}秒`, this.progressTime.setAttribute("aria-label", `経過時間 ${e}秒`);
	}
	stopProgress() {
		this.progressTimer != null && (this.tickProgress(), document.defaultView.clearInterval(this.progressTimer)), this.progressTimer = null, this.progressActivity?.classList.remove("fi:motion-safe:animate-pulse");
	}
	streamEvent(e) {
		if (this.event("progress", e), e.type === "run.created" && typeof e.data.conversation_id == "string" && (this.conversationId = e.data.conversation_id), e.type === "run.created" && /^[0-9a-f-]{36}$/i.test(e.data.run_id || "") && (this.activeRunId = e.data.run_id, this.saveRunRecovery(), this.stopQueued && this.requestStop()), e.type === "run.failed" && (this.runCancelled = e.data.code === "RUN_CANCELLED", this.runTerminal = this.runCancelled), e.type === "run.completed" && (this.runTerminal = !0), e.type === "run.status" && (this.progressLabel.textContent = typeof e.data.message == "string" ? e.data.message : "AIが作業しています"), ["assistant.delta", "assistant.message"].includes(e.type) && typeof e.data.text == "string") {
			let t = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight < 160;
			this.liveAnswer || (this.liveAnswer = this.message("assistant", ""), this.liveAnswer.content = this.liveAnswer.querySelector(".fi-markdown"), this.liveAnswer.content?.dispose?.(), this.liveAnswer.text = ""), this.liveAnswer.text = e.type === "assistant.delta" ? this.liveAnswer.text + e.data.text : e.data.text, this.renderStreamAnswer(e.type === "assistant.message"), this.progressLabel.textContent = "回答を作成しています", t && this.liveAnswer.scrollIntoView({ block: "nearest" });
		}
	}
	async requestStop() {
		if (this.abort && !this.stopRequested) {
			if (this.stopQueued = !0, this.cancel.disabled = !0, !this.activeRunId) {
				this.progressLabel.textContent = "接続後に停止を依頼します";
				return;
			}
			try {
				let e = await this.api.runControl(this.activeAlias, this.conversationId, this.activeRunId, !0);
				this.stopRequested = e.cancel_requested === !0, this.progressLabel.textContent = this.stopRequested ? "停止を依頼しました。終了を確認しています" : "処理の結果を確認しています", ["completed", "failed"].includes(e.status) && (this.runTerminal = !0);
			} catch {
				this.cancel.disabled = !1, this.setNotice("停止の受付を確認できませんでした。結果は未確認です。", "error");
			}
		}
	}
	async checkRunResult() {
		if (!this.activeRunId || !this.conversationId) {
			this.setNotice("処理IDを受け取る前に通信が終了しました。結果は未確認です。", "error");
			return;
		}
		try {
			let e = await this.api.runControl(this.activeAlias, this.conversationId, this.activeRunId);
			if (!["completed", "failed"].includes(e.status)) {
				this.setNotice("処理中です。新しく送信せず、しばらくして結果を確認してください。");
				return;
			}
			this.sendUncertain = !1, this.runTerminal = !0, this.runCancelled = e.cancelled === !0, this.clearRunRecovery(), this.setNotice(e.cancelled ? "停止が完了しました。実行済みの操作は元に戻りません。" : "処理が終了したことを確認しました。"), await this.loadHistory(this.conversationId), this.recovery.hidden = !0, this.updateControls();
		} catch {
			this.setNotice("結果を確認できませんでした。重複して送信しないでください。", "error");
		}
	}
	saveRunRecovery() {
		try {
			this.recoveryKey && sessionStorage.setItem(this.recoveryKey, JSON.stringify({
				run_id: this.activeRunId || null,
				conversation_id: this.conversationId || null
			}));
		} catch {}
	}
	clearRunRecovery() {
		try {
			this.recoveryKey && sessionStorage.removeItem(this.recoveryKey);
		} catch {}
	}
	renderStreamAnswer(e = !1) {
		if (!this.liveAnswer) return;
		let t = document.defaultView.performance.now();
		if (!e && this.liveAnswer.renderedAt != null && t - this.liveAnswer.renderedAt < 100) {
			this.renderTimer ??= document.defaultView.setTimeout(() => {
				this.renderTimer = null, this.renderStreamAnswer(!0);
			}, 100);
			return;
		}
		this.clearStreamRender();
		let n = U(this.liveAnswer.text, {
			...this.rendering,
			streaming: !0
		});
		this.liveAnswer.content?.dispose?.(), this.liveAnswer.content?.replaceWith(n), this.liveAnswer.content = n, this.liveAnswer.renderedAt = t;
	}
	clearStreamRender() {
		this.renderTimer != null && document.defaultView.clearTimeout(this.renderTimer), this.renderTimer = null;
	}
	finishAnswer(e) {
		if (this.clearStreamRender(), !this.liveAnswer) return this.message("assistant", e);
		let t = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight < 160, n = U(e, this.rendering);
		this.liveAnswer.content?.replaceWith(n), t && this.liveAnswer.scrollIntoView({ block: "nearest" });
		let r = this.liveAnswer;
		return this.liveAnswer = null, r;
	}
	invalidateSelection() {
		this.abortArtifactDownloads(), this.selectionStale = !0, this.setNotice("このチャットの接続・AI・権限が変更されています。草稿は保持しています。「再読み込み」で現在の設定を確認してから送信してください。", "error"), this.updateControls();
	}
	refreshEmpty() {
		if (this.empty) {
			let e = this.messages.childNodes.length === 0;
			this.empty.hidden = !e, this.messages.hidden = e;
		}
	}
	isBusy() {
		return this.loading || !!this.abort || !!this.uploading;
	}
	abortArtifactDownloads() {
		for (let e of this.artifactDownloads || []) e.abort();
		this.artifactDownloads?.clear();
	}
	disposeMessages() {
		this.abortArtifactDownloads();
		for (let e of this.messages?.querySelectorAll?.(".fi-markdown") || []) e.dispose?.();
	}
	renderArtifacts(e, t, n = this.conversationId) {
		if (!e || !n || !Array.isArray(t)) return;
		let r = W("div", "", "fi-message-attachments fi-generated-files");
		r.setAttribute("aria-label", "生成ファイル");
		for (let e of t.slice(0, 20)) {
			if (!e || typeof e.id != "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id) || typeof e.name != "string") continue;
			let t = W("div", "", "fi-generated-file"), i = W("span", `${e.name} · ${this.fileSize(e.size)}`), a = W("p", "", "fi:text-xs fi:text-secondary");
			a.setAttribute("role", "status");
			let o = this.api.artifactUrl(this.activeAlias, n, e.id), s = q("ダウンロード", async () => {
				if (this.selectionStale || !this.ready) {
					a.textContent = "現在のAI設定を再読み込みしてください。";
					return;
				}
				if (this.attachmentExpired(e)) {
					a.textContent = "生成ファイルの利用期限が切れています。";
					return;
				}
				let t = new AbortController();
				this.artifactDownloads.add(t), s.disabled = !0, a.textContent = "";
				try {
					let n = await fetch(o, {
						credentials: "same-origin",
						signal: t.signal,
						headers: { Accept: "application/octet-stream" },
						redirect: "error"
					});
					if (!n.ok) throw Error({
						401: "再ログインして取得してください。",
						403: "この生成ファイルを取得する権限がありません。",
						404: "この会話の生成ファイルを確認できません。",
						410: "生成ファイルの利用期限が切れています。"
					}[n.status] || "生成ファイルを取得できませんでした。再試行してください。");
					let r = await n.blob();
					if (t.signal.aborted) return;
					if (Number.isFinite(e.size) && r.size !== e.size) throw Error("生成ファイルの内容を確認できませんでした。");
					let i = URL.createObjectURL(r), a = W("a");
					a.href = i, a.download = e.name, a.click(), document.defaultView.setTimeout(() => URL.revokeObjectURL(i), 1e3);
				} catch (e) {
					t.signal.aborted || (a.textContent = e.message || "生成ファイルを取得できませんでした。");
				} finally {
					this.artifactDownloads.delete(t), s.disabled = !1;
				}
			}, "secondary");
			s.dataset.artifactId = e.id, t.append(i, s, a), r.append(t);
		}
		r.childNodes.length && e.querySelector(".fi-chat-assistant")?.append(r), mt?.(e, t, (t) => e.querySelector(`[data-artifact-id="${t.id}"]`)?.click());
	}
	clearMessages() {
		this.disposeMessages(), this.messages.replaceChildren();
	}
	revokePreview(e) {
		e.previewUrl &&= (URL.revokeObjectURL(e.previewUrl), null);
	}
	clearAttachments() {
		for (let e of this.attachments) this.revokePreview(e);
		this.attachments = [], this.renderAttachments();
	}
	resetConversation() {
		this.historyRequest = (this.historyRequest || 0) + 1, this.attachmentListRequest = (this.attachmentListRequest || 0) + 1, this.historyLoadingOwner != null && (this.loading = !1, this.historyLoadingOwner = null), this.clearStreamRender(), this.stopProgress(), this.startedAt = null, this.progress.hidden = !0, this.conversationId = null, this.toggleHistory(!1, !1), this.conversations = [], this.renderConversations(), this.clearMessages(), this.clearAttachments(), this.attachmentMetadata.clear(), this.storedAttachments.hidden = !0, this.storedAttachments.open = !1, this.storedAttachments.replaceChildren(), this.sendUncertain = !1, this.beforeId = null, this.more.hidden = !0, this.refreshEmpty();
	}
	businessContext() {
		let e = this.context;
		if (e === void 0) try {
			e = JSON.parse(this.getAttribute("context") || "{}");
		} catch {
			throw Error("画面の業務情報を確認できません。管理者に確認してください。");
		}
		if (!e || typeof e != "object" || Array.isArray(e)) return {};
		let t;
		try {
			t = JSON.stringify(e);
		} catch {
			throw Error("画面の業務情報を確認できません。管理者に確認してください。");
		}
		if (new TextEncoder().encode(t).length > 16384) throw Error("画面の業務情報が大きすぎます。管理者に確認してください。");
		return JSON.parse(t);
	}
	updateControls() {
		let e = this.isBusy(), t = !this.ready || !this.activeAlias || !!this.selectionStale;
		this.submit.disabled = e || t || !!this.sendUncertain || this.attachments.some((e) => e.state !== "uploaded"), this.input.disabled = t, this.submit.hidden = !!this.abort, this.cancel.hidden = !this.abort, this.fresh.disabled = e || !!this.sendUncertain, this.retry.disabled = e, this.history.disabled = this.more.disabled = e || t || !!this.sendUncertain;
		for (let n of this.historyList.querySelectorAll?.("button") || []) n.disabled = e || t || !!this.sendUncertain;
		this.attachButton.disabled = this.fileInput.disabled = e || t || !this.attachmentPolicy, this.storedButton.disabled = e || t || !this.conversationId, this.panel.setAttribute("aria-busy", String(e));
		for (let t of this.attachmentCards.querySelectorAll?.("button") || []) t.disabled = e;
		for (let t of this.storedAttachments.querySelectorAll?.("button") || []) {
			let n = this.attachments.some((e) => e.attachment?.id === t.dataset.attachmentId);
			t.disabled = e || n || this.attachmentExpired(this.attachmentMetadata.get(t.dataset.attachmentId)), t.textContent = n ? "選択済み" : "送信対象に追加";
		}
	}
	async recover() {
		if (this.isBusy()) return;
		let e = this.sendUncertain;
		this.loading = !0, this.ready = !1, this.updateControls(), this.setNotice("接続とAIの利用許可を確認しています…");
		try {
			await this.initialize(), this.ready = !0, e && this.setNotice("履歴と操作結果を確認してください。入力と添付は保持しています。依頼は再送していません。", "info");
		} catch (e) {
			this.setNotice(`${e.message} 「再読み込み」から利用状態を確認できます。業務の依頼は再送しません。`, "error"), this.event("error", { message: this.notice.textContent });
		} finally {
			this.loading = !1, this.updateControls(), this.refreshEmpty();
		}
	}
	async initialize() {
		let e = await this.api.state();
		this.rendering = {
			attachmentUrlPrefixes: [],
			allowedImageOrigins: [],
			...e.rendering || {}
		}, vt(this.rendering), this.api.timezone = e.timezone;
		let t = this.getAttribute("surface"), n = (e.surfaces || []).find((e) => e.name === t), r = t ? n?.enabled ? n.alias : "" : this.getAttribute("alias"), i = (e.agents || []).find((e) => e.alias === r), a = (e.connections || []).find((e) => e.id === i?.connection_id), o = i?.connection_revision ?? a?.revision, s = i ? `${i.alias}:${i.connection_id || ""}:${i.grant_id || ""}:${o || ""}` : "";
		if (this.bindingIdentity !== void 0 && this.bindingIdentity !== s && this.resetConversation(), this.bindingIdentity = s, this.activeAlias = i ? r : "", this.recoveryKey = s ? `fourmix-run:${this.api.base}:${t || ""}:${s}` : null, !this.activeRunId && this.recoveryKey) try {
			let e = JSON.parse(sessionStorage.getItem(this.recoveryKey) || "null");
			e && (this.activeRunId = e.run_id, this.conversationId = e.conversation_id, this.sendUncertain = !0, this.recovery.hidden = !1);
		} catch {}
		this.api.expectation(i?.connection_id && i?.grant_id && o != null ? {
			connection_id: i.connection_id,
			grant_id: i.grant_id,
			connection_revision: o
		} : null), this.selectionStale = !1;
		let c = !!i && a && !Object.values(a.permissions || {}).some((e) => ["review", "automatic"].includes(e));
		this.businessStatus.hidden = !c, this.businessStatus.textContent = "会話のみ", this.businessStatus.href = `${this.api.base}#fi-connections`, this.businessStatus.title = "この接続に業務操作は許可されていません。接続の権限を設定すると、許可の範囲で業務を利用できます。", this.businessStatus.setAttribute("aria-label", `${this.businessStatus.textContent}：${this.businessStatus.title}`), this.agentName = i?.name || i?.assistant_name || n?.agent_name || this.getAttribute("assistant-name") || "AIアシスタント", this.agentTitle.textContent = this.agentName, this.setupLink.hidden = !!this.activeAlias, this.activeAlias || (this.setNotice(t && (!n || !n.enabled) ? "このチャット画面は無効になっています。" : "このチャット画面のAIはまだ設定されていません。接続管理で設定してください。"), this.attachmentPolicy = null, this.attachmentMetadata.clear(), this.storedAttachments.hidden = !0, this.attachmentHelp.textContent = "AIを設定すると、添付ファイルの利用条件が表示されます。"), this.activeAlias && (await this.refreshConversations(), this.conversationId ? await this.loadHistory(this.conversationId) : await this.refreshAttachmentList()), await this.pending(e), this.activeAlias && !this.selectionStale && this.setNotice(this.attachmentError ? this.attachmentHelp.textContent : "", this.attachmentError ? "error" : "info");
	}
	toggleHistory(e = this.historyPanel.hidden, t = !0) {
		this.historyPanel.hidden = !e, this.history.setAttribute("aria-expanded", String(e)), e ? this.historyClose.focus?.() : t && this.history.focus?.();
	}
	renderConversations() {
		this.historyList.replaceChildren(), this.historyStatus.hidden = !!this.conversations?.length, this.historyStatus.textContent = "会話履歴はまだありません";
		for (let e of this.conversations || []) {
			let t = q("", async () => {
				if (!this.isBusy() && this.ready) {
					this.historyStatus.hidden = !1, this.historyStatus.textContent = "会話を読み込んでいます…";
					try {
						await this.loadHistory(e.identify), this.toggleHistory(!1);
					} catch (e) {
						this.historyStatus.textContent = e.message, this.setNotice(e.message, "error");
					}
				}
			}, "ghost");
			t.className = "fi-chat-history-item", t.setAttribute("aria-current", String(e.identify === this.conversationId)), t.append(W("span", e.title || "会話", "fi-chat-history-item-title")), e.updated_at && t.append(W("span", wt(e.updated_at, this.api.timezone), "fi-chat-history-item-date")), this.historyList.append(t);
		}
		this.updateControls();
	}
	async refreshConversations() {
		this.historyStatus.hidden = !1, this.historyStatus.textContent = "会話履歴を読み込んでいます…", this.historyList.setAttribute("aria-busy", "true");
		try {
			let e = await this.api.history(this.activeAlias);
			this.conversations = e.conversations || [], this.renderConversations();
		} catch (e) {
			throw e.status === 409 && this.invalidateSelection(), this.historyStatus.hidden = !1, this.historyStatus.textContent = e.message, e;
		} finally {
			this.historyList.setAttribute("aria-busy", "false");
		}
	}
	async refreshAttachmentList(e = this.conversationId) {
		let t = this.activeAlias, n = this.attachmentListRequest = (this.attachmentListRequest || 0) + 1, r = () => n === this.attachmentListRequest && t === this.activeAlias && e === this.conversationId && !this.selectionStale;
		this.attachmentError = !1;
		try {
			let t = await this.api.attachments(this.activeAlias, e);
			if (!r()) return;
			if (!t.policy || !Array.isArray(t.data)) throw Error("添付の利用条件を確認できませんでした。");
			this.attachmentPolicy = t.policy, this.attachmentMetadata = new Map(t.data.map((e) => [e.id, e])), this.fileInput.accept = (t.policy.extensions || []).map((e) => `.${String(e).replace(/^\./, "")}`).join(","), this.attachmentHelp.textContent = `添付：${(t.policy.extensions || []).join("・")} ／ 1ファイル最大 ${this.fileSize(t.policy.max_bytes)} ／ 1回の送信は最大${t.policy.max_files}件`;
		} catch (e) {
			if (!r()) return;
			if (e.status === 409) throw this.invalidateSelection(), e;
			this.attachmentError = !0, this.attachmentPolicy = null, this.attachmentMetadata.clear(), this.storedAttachments.hidden = !0, this.attachmentHelp.textContent = `${e.message} 文字での会話は利用できます。`;
		}
		this.renderAttachments(), this.storedAttachments.open && !this.attachmentError && this.renderStoredAttachments();
	}
	fileSize(e) {
		return Number.isFinite(e) ? e < 1048576 ? `${Math.ceil(e / 1024)}KB` : `${(e / 1048576).toFixed(1)}MB` : "未確認";
	}
	attachmentExpired(e) {
		return Number.isFinite(e?.expires_at) && e.expires_at * 1e3 <= Date.now();
	}
	attachmentLink(e, t = this.conversationId) {
		if (this.attachmentExpired(e)) return W("p", `${e.name || "添付ファイル"}（利用期限切れ）`, "fi:text-xs fi:text-secondary");
		let n = W("a", e.name || "添付ファイル", "fi-attachment-link");
		if (n.href = this.api.attachmentUrl(this.activeAlias, t, e.id), n.target = "_blank", n.rel = "noopener noreferrer", [
			"image/png",
			"image/jpeg",
			"image/gif",
			"image/webp",
			"image/avif"
		].includes(e.mime)) {
			let t = W("img", "", "fi-attachment-preview");
			t.src = n.href, t.alt = e.name || "添付画像", t.loading = "lazy", t.onerror = () => t.remove(), n.prepend(t);
		}
		return n;
	}
	renderAttachments() {
		if (this.attachmentCards) {
			this.attachmentCards.replaceChildren(), this.attachmentCards.hidden = !this.attachments.length;
			for (let e of this.attachments) {
				let t = W("div", "", "fi-attachment-card");
				if (t.dataset.state = e.state, e.previewUrl) {
					let n = W("img", "", "fi-attachment-preview");
					n.src = e.previewUrl, n.alt = e.file.name, t.append(n);
				}
				let n = W("div", "", "fi-attachment-caption");
				if (n.append(W("p", e.attachment?.name || e.file?.name || "添付ファイル", "fi:font-medium"), W("p", `${this.fileSize(e.attachment?.size ?? e.file?.size)} · ${{
					queued: "アップロード待ち",
					uploading: "アップロード中",
					uploaded: "送信するファイル",
					unknown: "結果の確認が必要",
					failed: "アップロードできませんでした"
				}[e.state]}`, "fi:text-xs fi:text-secondary")), t.append(n), e.error && t.append(W("p", e.error, "fi:text-xs fi:text-secondary")), [
					"unknown",
					"failed",
					"queued"
				].includes(e.state)) {
					let n = q(e.state === "queued" ? "アップロード" : "同じアップロードを再確認", () => this.uploadEntries([e]), "secondary");
					t.append(n);
				}
				e.state === "unknown" && t.append(q("保存済みファイルを確認", () => this.checkAttachments(), "ghost"));
				let r = q("選択を外す", () => {
					this.isBusy() || (this.revokePreview(e), this.attachments = this.attachments.filter((t) => t !== e), this.renderAttachments(), this.updateControls());
				}, "ghost");
				t.append(r), this.attachmentCards.append(t);
			}
			this.updateControls();
		}
	}
	async checkAttachments() {
		if (!(this.isBusy() || this.selectionStale)) {
			this.loading = !0, this.updateControls();
			try {
				await this.refreshAttachmentList(), this.attachmentError || (this.additions.open = !0, this.storedAttachments.open = !0, this.renderStoredAttachments());
			} finally {
				this.loading = !1, this.updateControls();
			}
		}
	}
	renderStoredAttachments() {
		this.storedAttachments.hidden = !1, this.storedAttachments.replaceChildren(W("summary", `保存済みファイル ${this.attachmentMetadata.size}件`)), this.storedAttachments.append(W("p", "今回送信するファイルを選択してください。選択を外しても、保存済みファイルは削除されません。", "fi:text-xs fi:text-secondary"));
		for (let e of this.attachmentMetadata.values()) {
			let t = W("div", "", "fi-attachment-card");
			t.append(this.attachmentLink(e));
			let n = q("送信対象に追加", () => {
				if (!(this.isBusy() || !this.attachmentPolicy || this.attachments.some((t) => t.attachment?.id === e.id))) {
					if (this.attachments.length >= this.attachmentPolicy.max_files) {
						this.setNotice(`1回の送信で選べるファイルは最大${this.attachmentPolicy.max_files}件です。不要な選択を外してください。`, "error");
						return;
					}
					if (this.attachmentExpired(e)) {
						this.setNotice("このファイルは利用期限が切れています。新しいファイルを添付してください。", "error");
						return;
					}
					this.attachments.push({
						state: "uploaded",
						attachment: e
					}), this.renderAttachments(), this.updateControls();
				}
			}, "secondary");
			n.dataset.attachmentId = e.id, t.append(n), this.storedAttachments.append(t);
		}
		this.updateControls();
	}
	async addFiles(e) {
		if (this.selectionStale) {
			this.invalidateSelection();
			return;
		}
		if (this.isBusy() || !this.ready || !this.attachmentPolicy) {
			this.setNotice("添付の利用条件を確認してからファイルを選択してください。", "error");
			return;
		}
		if (this.attachments.some((e) => e.state === "unknown")) {
			this.setNotice("結果が不明なアップロードを先に確認してください。同じファイルを自動で再アップロードしません。", "error");
			return;
		}
		let t = this.attachmentPolicy, n = (t.extensions || []).map((e) => String(e).replace(/^\./, "").toLowerCase());
		if (e.length + this.attachments.length > t.max_files) {
			this.setNotice(`1回の送信で選べるファイルは最大${t.max_files}件です。不要な選択を外してください。`, "error");
			return;
		}
		for (let r of e) if (!n.includes(r.name.split(".").pop().toLowerCase()) || r.size > t.max_bytes || !r.size) {
			this.setNotice(`${r.name}は添付できません。対応する形式とサイズを確認してください。`, "error");
			return;
		}
		this.setNotice("");
		let r = e.map((e) => ({
			file: e,
			requestId: crypto.randomUUID(),
			state: "queued",
			previewUrl: [
				"image/png",
				"image/jpeg",
				"image/gif",
				"image/webp",
				"image/avif"
			].includes(e.type) && URL.createObjectURL ? URL.createObjectURL(e) : null
		}));
		this.attachments.push(...r), this.renderAttachments(), await this.uploadEntries(r);
	}
	async uploadEntries(e) {
		if (!this.isBusy() && this.ready && this.activeAlias && !this.selectionStale) {
			this.uploading = !0, this.uploadAbort = new AbortController(), this.updateControls();
			try {
				for (let t of e) {
					t.state = "uploading", t.error = "", this.renderAttachments(), Object.hasOwn(t, "uploadConversation") || (t.uploadConversation = this.conversationId);
					try {
						let e = await this.api.uploadAttachment(this.activeAlias, t.file, {
							conversationId: t.uploadConversation,
							requestId: t.requestId,
							signal: this.uploadAbort.signal
						});
						if (!e.conversation_id || !e.attachment?.id) throw Error("アップロード結果を確認できませんでした。");
						this.conversationId = e.conversation_id, this.renderConversations(), t.attachment = e.attachment, t.state = "uploaded", this.attachmentMetadata.set(e.attachment.id, e.attachment), this.event("attachment", e);
					} catch (e) {
						/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.data?.conversation_id || "") && (this.conversationId = e.data.conversation_id, this.renderConversations()), t.state = e.status >= 400 && e.status < 500 && e.status !== 409 ? "failed" : "unknown", t.error = e.message, e.status === 409 && !e.data?.conversation_id ? this.invalidateSelection() : this.setNotice(`${e.message} 保存済みファイルを確認してください。自動でアップロードや依頼を繰り返しません。`, "error");
						break;
					}
					this.renderAttachments();
				}
			} finally {
				this.uploading = !1, this.uploadAbort = null, this.renderAttachments(), this.updateControls();
			}
		}
	}
	message(e, t, n = [], r = this.conversationId, i = null, a = []) {
		let o = e === "user", s = W("article", "", `fi-chat-message fi:min-w-0 fi:flex ${o ? "fi:justify-end" : "fi:justify-start"}`), c = W("div", "", o ? "fi-chat-user fi:max-w-[88%] fi:space-y-1 fi:rounded-2xl fi:rounded-tr-md fi:bg-raised fi:px-4 fi:py-3" : "fi-chat-assistant fi:w-full fi:min-w-0 fi:space-y-3"), l = !o && i && [
			"succeeded",
			"rejected",
			"expired"
		].includes(i.state) ? i : null, u = W("p", "", "fi:flex fi:items-center fi:gap-2 fi:text-xs fi:font-semibold fi:text-secondary");
		if (o || u.append(K(l ? "shield" : "chat")), u.append(W("span", o ? "あなた" : l ? "このアプリケーション" : this.agentName || "AI アシスタント")), l) {
			let e = W("div", "", "fi:space-y-3");
			J(l, e), c.append(u, W("p", {
				succeeded: "業務操作が完了しました。",
				rejected: "業務操作は実行せず終了しました。",
				expired: "確認期限が切れました。業務操作は実行されていません。"
			}[l.state]), e);
		} else c.append(u, o ? W("p", t, "fi:text-sm fi:leading-relaxed fi:whitespace-pre-wrap fi:break-words") : U(t, this.rendering));
		if (n.length) {
			let e = W("div", "", "fi-message-attachments");
			for (let t of n) {
				let n = this.attachmentMetadata.get(t);
				if (n) e.append(this.attachmentLink(n, r));
				else {
					let n = W("p", "添付ファイルを確認しています…", "fi:text-xs fi:text-secondary");
					n.dataset.pendingAttachment = t, e.append(n);
				}
			}
			c.append(e);
		}
		return s.append(c), this.messages.append(s), o || this.renderArtifacts(s, a, r), this.refreshEmpty(), s.scrollIntoView({ block: "nearest" }), s;
	}
	async loadHistory(e, t) {
		if (this.abort || this.uploading || this.selectionStale || !e) return;
		let n = this.activeAlias, r = this.historyRequest = (this.historyRequest || 0) + 1, i = () => r === this.historyRequest && n === this.activeAlias && !this.selectionStale;
		e !== this.conversationId && this.abortArtifactDownloads();
		let a = !this.loading || this.historyLoadingOwner != null;
		a && (this.historyLoadingOwner = r, this.loading = !0, this.setNotice("会話を読み込んでいます…")), this.updateControls();
		try {
			let n = await this.api.history(this.activeAlias, e, t);
			if (!i()) return;
			this.conversationId !== e && (this.stopProgress(), this.startedAt = null, this.progress.hidden = !0, this.conversationId && (this.clearAttachments(), this.storedAttachments.hidden = !0, this.storedAttachments.open = !1, this.storedAttachments.replaceChildren())), this.conversationId = e, this.attachmentMetadata.clear();
			let r = t ? [...this.messages.childNodes] : [];
			t ? this.messages.replaceChildren() : this.clearMessages();
			for (let t of n.messages || []) this.message(t.role, String(t.content || ""), t.attachment_ids || [], e, t.application_receipt, t.artifacts || []);
			if (this.messages.append(...r), this.refreshEmpty(), this.beforeId = n.has_more ? n.before_id : null, this.more.hidden = !this.beforeId, this.renderConversations(), this.runTerminal && (this.sendUncertain = !1), this.event("history", n), !t && n.latest_run?.status === "failed" && this.message("assistant", n.latest_run.cancelled === !0 ? "この依頼は停止しました。実行済みの操作は元に戻りません。" : "この依頼の応答を完了できませんでした。再送する前に、会話履歴と操作結果を確認してください。"), !t) {
				let e = {
					succeeded: "業務操作が完了しました",
					rejected: "業務操作は実行せず終了しました",
					expired: "確認期限が切れました"
				}[n.messages?.at(-1)?.application_receipt?.state];
				e && (this.stopProgress(), this.progressLabel.textContent = e);
			}
			if (await this.refreshAttachmentList(e), !i() || this.conversationId !== e) return;
			for (let t of this.messages.querySelectorAll("[data-pending-attachment]")) {
				let n = this.attachmentMetadata.get(t.dataset.pendingAttachment);
				n ? t.replaceWith(this.attachmentLink(n, e)) : t.textContent = "添付ファイル（利用期限や取得権限を確認してください）";
			}
			a && this.setNotice(this.attachmentError ? this.attachmentHelp.textContent : "", this.attachmentError ? "error" : "info");
		} catch (e) {
			if (!i()) return;
			throw e.status === 409 && this.invalidateSelection(), e;
		} finally {
			this.historyLoadingOwner === r && (this.loading = !1, this.historyLoadingOwner = null), this.updateControls();
		}
	}
	async refreshActionResults(e) {
		if (this.ready && !this.isBusy() && !this.selectionStale && this.conversationId) {
			try {
				await this.loadHistory(this.conversationId);
			} catch (e) {
				e.status !== 409 && this.setNotice([401, 419].includes(e.status) ? `${e.message} 同じ操作を再実行する必要はありません。` : "操作の実行結果を会話へ反映できませんでした。再読み込みして結果を確認してください。同じ操作を再実行する必要はありません。", "error");
				return;
			}
			try {
				await this.pending(await this.api.state()), this.approvals.hidden && G[e] && (this.progressLabel.textContent = G[e]);
			} catch (e) {
				e.status === 409 ? this.invalidateSelection() : this.setNotice([401, 419].includes(e.status) ? `${e.message} 同じ操作を再実行する必要はありません。` : "会話履歴は更新しました。確認待ちの一覧を更新できませんでした。再読み込みして確認してください。同じ操作を再実行する必要はありません。", "error");
			}
		}
	}
	async pending(e) {
		this.approvals.replaceChildren();
		for (let t of e.actions || []) if (t.state === "confirmation_required") {
			let n = (e.tools || []).find((e) => e.name === t.operation)?.description, r = q(`操作を確認：${n?.split("。")[0] || t.operation}`, () => Ot(this.api, t.id, this, async () => this.pending(await this.api.state())), "secondary", "shield");
			r.title = n || t.operation, this.approvals.append(r);
		}
		this.approvals.hidden = this.approvals.childNodes.length === 0;
	}
	async send() {
		if (this.isBusy() || !this.ready || !this.activeAlias || this.selectionStale || this.sendUncertain || this.attachments.some((e) => e.state !== "uploaded")) return;
		let e = this.input.value, t = [...this.attachments], n = t.map((e) => e.attachment.id);
		if (!e.trim() && !n.length) return;
		if (t.some((e) => this.attachmentExpired(e.attachment))) {
			this.setNotice("添付ファイルの利用期限が切れています。選択を外し、新しいファイルを添付してください。", "error");
			return;
		}
		let r;
		try {
			r = this.businessContext();
		} catch (e) {
			this.setNotice(e.message, "error");
			return;
		}
		let i = e.trim() || "添付ファイルの内容を確認し、要点を日本語でまとめてください。";
		this.message("user", i, n), this.activeRunId = null, this.stopQueued = !1, this.stopRequested = !1, this.runTerminal = !1, this.runCancelled = !1, this.cancel.disabled = !1, this.recovery.hidden = !0, this.abort = new AbortController(), this.saveRunRecovery(), this.liveAnswer = null, this.updateControls(), this.cancel.hidden = !1, this.setNotice(""), this.startProgress(), this.input.value = "", this.resizeInput();
		try {
			let e = await this.api.ask(this.activeAlias, i, {
				conversationId: this.conversationId,
				context: r,
				attachmentIds: n,
				signal: this.abort.signal,
				onEvent: (e) => this.streamEvent(e)
			});
			this.runTerminal = !0, this.conversationId = e.conversation_id || this.conversationId, this.renderConversations(), this.renderArtifacts(this.finishAnswer(e.result?.answer || e.answer || "応答を受け取りました。"), e.result?.data?.artifacts || e.result?.artifacts || e.data?.artifacts || e.artifacts || []), this.stopProgress(), this.progressLabel.textContent = e.result?.data?.run_outcome === "confirmation_required" ? "内容を確認して承認してください" : "回答が完了しました";
			for (let e of t) this.revokePreview(e);
			this.attachments = this.attachments.filter((e) => !t.includes(e)), this.renderAttachments(), this.setNotice("");
			try {
				await this.refreshConversations();
			} catch {
				this.setNotice("回答は受信しました。会話一覧を更新できなかったため、再読み込みして履歴をご確認ください。", "error");
			}
			this.event("response", e);
		} catch (t) {
			this.stopProgress(), this.progressLabel.textContent = t.name === "AbortError" ? "待機を終了しました" : "応答が中断されました", this.liveAnswer &&= (this.renderStreamAnswer(!0), this.liveAnswer.append(W("p", "途中まで受信した回答です。完了結果は会話履歴で確認してください。", "fi:text-xs fi:text-secondary")), null), this.input.value || (this.input.value = e, this.resizeInput()), this.sendUncertain = !this.runTerminal, this.recovery.hidden = this.runTerminal, this.runCancelled ? (this.progressLabel.textContent = "停止が完了しました", this.setNotice("停止が完了しました。実行済みの操作は元に戻りません。")) : t.status === 409 ? this.invalidateSelection() : this.setNotice(t.name === "AbortError" ? "応答の待機をやめました。サーバー側の処理は続く場合があります。草稿と添付は保持しています。履歴と操作結果を確認してください。" : `${t.message} 草稿と添付は保持しています。履歴と操作結果を確認してから、次の依頼を送ってください。`, "error"), this.event("error", { message: this.notice.textContent });
		} finally {
			this.stopProgress(), this.runTerminal && this.clearRunRecovery(), this.abort = null, this.updateControls(), this.cancel.hidden = !0;
			try {
				await this.pending(await this.api.state());
			} catch {}
		}
	}
};
customElements.get("fourmix-intelligence-chat") || customElements.define("fourmix-intelligence-chat", kt);
//#endregion
//#region resources/js/tool-groups.js
var Y = (e, t = "", n = "") => {
	let r = document.createElement(e);
	return r.textContent = t, r.className = n, r;
};
function At(e, t, { labels: n = {}, permissions: r = {}, mode: i = "permissions" } = {}) {
	if (e.replaceChildren(), !t.length) {
		e.append(Y("p", "利用できる業務操作はありません。アプリケーションの管理者に確認してください。", "fi-empty-state"));
		return;
	}
	let a = Y("label", "", "fi-tool-search fi-form-field");
	a.append(Y("span", "業務操作を検索", "fi-form-label"));
	let o = Y("input", "", "fi-field");
	o.type = "search", o.placeholder = "業務名・操作名で絞り込み", a.append(o), e.append(a);
	let s = Y("p", "条件に一致する操作はありません。検索語を変えてください。", "fi-empty-state");
	s.hidden = !0;
	let c = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = e.domain || "general";
		c.has(t) || c.set(t, []), c.get(t).push(e);
	}
	for (let [t, a] of c) {
		let o = Y("details", "", "fi-tool-group"), s = n[t] || a[0].keywords?.[0] || (t === "general" ? "その他の業務" : t), c = Y("summary", "", "fi-tool-summary");
		c.append(Y("span", s, "fi-tool-summary-title"));
		let l = Y("span", "", "fi-tool-summary-count");
		c.append(l), o.append(c);
		let u = Y("div", "", "fi-tool-content fi:space-y-3"), d = () => {
			let e = [...o.querySelectorAll("[data-tool-row] input, [data-tool-row] select")].filter((e) => i === "permissions" ? e.value !== "disabled" : e.checked).length;
			l.textContent = `${a.length}件 · ${i === "permissions" ? "許可" : "選択"} ${e}件`;
		}, f = Y("div", "", "fi-tool-bulk-actions fi:flex fi:flex-wrap fi:gap-2"), p = (e, t, n) => {
			let r = Y("button", e, "fi-button fi-button-quiet");
			r.type = "button", r.onclick = () => {
				for (let e of o.querySelectorAll("[data-tool-row]")) if (!e.hidden && (t === "all" || e.dataset.readOnly === "true" == (t === "read"))) {
					let t = e.querySelector("input, select");
					i === "permissions" ? t.value = n : t.checked = n;
				}
				d();
			}, f.append(r);
		};
		i === "permissions" ? (p("参照を許可", "read", "review"), p("更新は毎回確認", "write", "review"), p("すべて許可しない", "all", "disabled")) : (p("参照を選択", "read", !0), p("更新を選択", "write", !0), p("選択を解除", "all", !1)), u.append(f);
		for (let e of a) {
			let t = Y("label", "", `fi-tool-row${i === "selection" ? " fi-tool-selection" : ""}`);
			t.dataset.toolRow = "", t.dataset.readOnly = String(e.read_only), t.dataset.search = [
				e.name,
				e.description,
				s,
				...e.keywords || []
			].join(" ").toLocaleLowerCase();
			let n = e.description || e.name, a = n.split(/[。\n]/)[0], o = Y("span", "", "fi-tool-caption fi:min-w-0 fi:break-words");
			o.title = n, o.append(Y("span", a.length > 90 ? `${a.slice(0, 90)}…` : a, "fi-tool-title"));
			let c = Y("span", e.read_only ? "参照" : "更新", "fi-pill");
			if (c.dataset.effect = e.read_only ? "read" : "write", o.append(c), i === "permissions") {
				let n = Y("select", "", "fi-field fi-tool-control fi:shrink-0");
				n.name = e.name;
				for (let [t, r] of [
					["disabled", "許可しない"],
					["review", e.read_only ? "参照を許可" : "毎回内容を確認"],
					...e.read_only ? [] : [["automatic", "継続して許可"]]
				]) {
					let e = Y("option", r);
					e.value = t, n.append(e);
				}
				n.value = e.read_only && r[e.name] === "automatic" ? "review" : r[e.name] || "disabled", n.onchange = d, t.append(o, n);
			} else {
				let n = Y("input");
				n.type = "checkbox", n.name = "allowed_operations", n.value = e.name, n.onchange = d, t.append(n, o);
			}
			u.append(t);
		}
		o.append(u), e.append(o), d();
	}
	e.append(s), o.oninput = () => {
		let t = o.value.trim().toLocaleLowerCase(), n = 0;
		for (let r of e.querySelectorAll("details")) {
			let e = 0;
			for (let n of r.querySelectorAll("[data-tool-row]")) n.hidden = !n.dataset.search.includes(t), n.hidden || e++;
			r.hidden = !e, n += e, t && e ? r.open = !0 : t || (r.open = !1);
		}
		s.hidden = n !== 0;
	};
}
//#endregion
//#region resources/js/management.js
var X = (e, t = "", n = "") => {
	let r = document.createElement(e);
	return r.textContent = t, r.className = n, r;
}, jt = {
	personal: "個人",
	workspace: "ワークスペース",
	organization: "組織"
}, Mt = {
	pending: "接続確認待ち",
	ready: "接続済み",
	confirmation_required: "確認待ち",
	succeeded: "完了",
	rejected: "実行せず終了",
	unknown_effect: "結果の確認が必要",
	running: "処理中",
	expired: "確認期限切れ"
}, Z = (e, t) => {
	let n = e.textContent;
	return e.disabled = !0, e.textContent = t, () => {
		e.disabled = !1, e.textContent = n;
	};
}, Nt = (e, t, n = "fi-button fi-button-secondary") => {
	let r = X("button", e, n);
	return r.type = "button", r.onclick = t, r;
}, Q = (e, t) => {
	let n = X("label", "", "fi-form-field");
	return n.append(X("span", e, "fi-form-label"), t), n;
}, Pt = (e) => Object.fromEntries([...e.querySelectorAll("select")].map((e) => [e.name, e.value])), Ft = () => {
	let e = X("label", "", "fi-permission-acknowledgement"), t = X("input");
	return t.type = "checkbox", t.name = "acknowledge_automatic", e.append(t, X("span", "継続して許可する更新は、毎回の確認なしで実行されることを確認しました。")), e;
};
function It(e, { request: t, Client: n, showAction: r, datetime: i, renderToolGroups: a }) {
	let o = new n(e.dataset.base), s, c, l = (t, n = "error") => {
		let r = e.querySelector("[data-notice]");
		r.textContent = t, r.dataset.tone = n, r.hidden = !1;
	}, u = () => {
		e.querySelector("[data-code]").value = "", e.querySelector("[data-application-url]").value = "", e.querySelector("[data-pairing]").hidden = !0, c = null;
	}, d = (t) => {
		c = t.id, e.querySelector("[data-code]").value = t.code, e.querySelector("[data-application-url]").value = t.application_url, e.querySelector("[data-pairing]").hidden = !1, e.querySelector("[data-pairing]").scrollIntoView({ block: "nearest" });
	}, f = (e) => {
		let t = X("span", Mt[e] || "状態を確認してください", "fi-pill");
		return t.dataset.tone = ["ready", "succeeded"].includes(e) ? "success" : [
			"pending",
			"confirmation_required",
			"unknown_effect",
			"running"
		].includes(e) ? "warning" : "neutral", t;
	};
	async function p() {
		s = await t(e.dataset.api), o.timezone = s.timezone, c && !s.connections.some((e) => e.id === c && e.state === "pending") && u();
		let n = e.querySelector("[data-connections]");
		n.replaceChildren();
		for (let e of s.connections.filter((e) => e.state !== "revoked")) {
			let t = X("section", "", "fi-connection-card"), r = X("div", "", "fi-record-body");
			r.append(X("h3", e.name, "fi-record-title"), X("p", `${e.state === "pending" ? "Fourmix Intelligenceでの接続待ち" : jt[e.scope] || "接続範囲を確認"} · ${e.host_mode === "system" ? "システム権限" : "本人のアカウント権限"}`, "fi-record-meta")), t.append(r, f(e.state));
			let i = X("details", "", "fi:basis-full fi:space-y-4");
			i.append(X("summary", "接続名と権限を変更", "fi:cursor-pointer fi:text-sm"));
			let m = X("form", "", "fi:space-y-3"), h = X("input", "", "fi-field");
			h.required = !0, h.maxLength = 100, h.value = e.name;
			let g = X("button", "接続名を保存", "fi-button fi-button-secondary");
			g.type = "submit", m.append(Q("接続名", h), g), m.onsubmit = async (t) => {
				t.preventDefault();
				let n = Z(g, "保存しています…");
				try {
					await o.call(`connections/${encodeURIComponent(e.id)}`, {
						method: "PATCH",
						body: { name: h.value }
					}), await p(), l("接続名を変更しました。", "success");
				} catch (e) {
					l(e.message);
				} finally {
					n();
				}
			};
			let _ = X("form", "", "fi:space-y-4"), v = X("div");
			a(v, s.tools, {
				labels: s.domain_labels,
				permissions: e.permissions || {}
			});
			let y = Ft(), b = X("button", "権限を保存して接続キーを再発行", "fi-button");
			b.type = "submit", _.append(X("p", "この接続に許可する業務を設定します。変更すると現在の接続とAI設定を解除し、新しいキーで接続を確認します。", "fi-form-help"), v, y, b), _.onsubmit = async (t) => {
				t.preventDefault();
				let n = Z(b, "接続キーを再発行しています…");
				try {
					let t = await o.call(`connections/${encodeURIComponent(e.id)}/permissions`, {
						method: "PUT",
						body: {
							modes: Pt(v),
							acknowledge_automatic: y.querySelector("input").checked
						}
					});
					d(t), await p(), l("権限を保存しました。新しいキーで接続を確認し、各チャットのAIを設定し直してください。", "success");
				} catch (e) {
					l(e.message);
				} finally {
					n();
				}
			}, i.append(m, _), t.append(i), t.append(Nt(e.state === "pending" ? "接続をキャンセル" : "接続を削除", async (t) => {
				let n = Z(t.currentTarget, "削除しています…");
				try {
					await o.call(`connections/${encodeURIComponent(e.id)}`, { method: "DELETE" }), c === e.id && u(), await p(), l("接続を削除しました。", "success");
				} catch (e) {
					l(e.message);
				} finally {
					n();
				}
			}, "fi-button fi-button-danger")), n.append(t);
		}
		n.childElementCount || n.append(X("p", "現在の接続はありません。新しい接続を作成してください。", "fi-empty-state")), a(e.querySelector("[data-new-tools]"), s.tools, {
			labels: s.domain_labels,
			permissions: {}
		}), e.querySelector("[data-connection-form] button[type=submit]").disabled = !1;
		let m = e.querySelector("[data-surfaces]");
		m.replaceChildren();
		let h = /* @__PURE__ */ new Map();
		for (let e of s.surfaces || []) {
			let t = X("section", "", "fi-card fi:space-y-4"), n = e.type === "page" ? "チャットページ" : "フローティングチャット";
			t.append(X("h3", e.title || n, "fi-record-title"), X("p", `${n} · ${e.configured ? e.agent_name : "AI未設定"}`, "fi-record-meta"));
			let r = X("form", "", "fi-form-grid");
			r.dataset.surface = e.name;
			let i = X("input");
			i.type = "checkbox", i.checked = e.enabled;
			let a = X("label", "", "fi:flex fi:items-center fi:gap-2 fi:sm:col-span-2");
			a.append(i, X("span", "このチャットを表示する"));
			let c = X("select", "", "fi-field"), u = X("option", "接続を選択してください");
			u.value = "", c.append(u);
			for (let e of s.connections.filter((e) => e.state === "ready")) {
				let t = X("option", e.name);
				t.value = e.id, c.append(t);
			}
			c.value = e.connection_id || "";
			let d = X("select", "", "fi-field"), f = X("p", "", "fi-form-help fi:sm:col-span-2");
			f.setAttribute("role", "status");
			let g = X("button", "このチャットの設定を保存", "fi-button");
			g.type = "submit";
			let _ = [], v = 0, y = !1, b = () => {
				g.disabled = i.checked && y && !(c.value && d.value && _.some((e) => e.grant_id === d.value && (e.audience || "internal") === "internal"));
			}, x = () => {
				let e = _.find((e) => e.grant_id === d.value);
				f.textContent = e ? `Fourmix Intelligenceの利用範囲：${jt[e.scope] || "未確認"} · 資料庫 ${(e.dataset_ids || []).length}件 · 外部サービス ${(e.capability_ids || []).length}件。能力はFourmix Intelligenceで管理します。` : "この接続に利用を許可したAIがありません。Fourmix IntelligenceでAIの利用許可を確認してください。", b();
			}, ee = async () => {
				let t = ++v, n = c.value;
				_ = [], d.replaceChildren(), d.disabled = !0, g.disabled = !0;
				let i = X("option", n ? "AIを読み込んでいます…" : "接続を選択してください");
				if (i.value = "", d.append(i), f.textContent = "接続と、このチャットで使うAIを設定してください。", b(), n) try {
					h.has(n) || h.set(n, o.agents(n));
					let i = await h.get(n);
					if (v !== t || !r.isConnected) return;
					_ = i.agents || [], d.replaceChildren();
					for (let e of _) {
						let t = (e.audience || "internal") !== "internal", n = X("option", `${e.name || "AIアシスタント"}${t ? "（対外向け・開発者API専用）" : ""}`);
						n.value = e.grant_id, n.disabled = t, d.append(n);
					}
					if (!_.length) {
						let e = X("option", "利用できるAIがありません");
						e.value = "", d.append(e);
					}
					n === e.connection_id && _.some((t) => t.grant_id === e.grant_id) && (d.value = e.grant_id);
					let a = _.filter((e) => (e.audience || "internal") === "internal");
					d.disabled = !a.length, a.some((e) => e.grant_id === d.value) || (d.value = a[0]?.grant_id || ""), x(), _.length && !a.length && (f.textContent = "対外向けAIには顧客の識別が必要です。標準チャットには社内向けAIを設定してください。");
				} catch (e) {
					if (v !== t || !r.isConnected) return;
					h.delete(n), d.replaceChildren();
					let i = X("option", "AIの一覧を取得できませんでした");
					i.value = "", d.append(i), d.disabled = !0, f.textContent = e.message, b();
				}
			};
			c.onchange = () => (y = !0, ee()), d.onchange = () => {
				y = !0, x();
			}, i.onchange = b, r.append(a, Q("接続", c), Q("使用するAI", d), f, g), t.append(r), m.append(t), ee(), r.onsubmit = async (t) => {
				t.preventDefault();
				let n = Z(g, "保存しています…");
				try {
					let t = {
						enabled: i.checked,
						...i.checked && y && c.value && d.value ? {
							connection_id: c.value,
							grant_id: d.value
						} : {}
					}, n = await o.surface(e.name, t);
					window.dispatchEvent(new window.CustomEvent("fourmix:surfaces", { detail: n.surfaces })), await p(), l("このチャットの接続・AI・表示設定を保存しました。", "success");
				} catch (e) {
					l(e.message);
				} finally {
					n(), b();
				}
			};
		}
		(s.surfaces || []).length || m.append(X("p", "チャットUIはアプリケーションの設定で無効になっています。", "fi-empty-state"));
		let g = e.querySelector("[data-actions]");
		g.replaceChildren();
		let _ = new Map((s.tools || []).map((e) => [e.name, e]));
		for (let t of s.actions || []) {
			let n = X("div", "", "fi-history-row"), a = X("div", "", "fi-record-body");
			a.append(X("h3", _.get(t.operation)?.description?.split(/[。\n]/)[0] || t.operation, "fi-record-title"), X("p", i(t.created_at, o.timezone), "fi-record-meta")), n.append(a, f(t.state), Nt(t.state === "confirmation_required" ? "内容を確認" : "実行結果を見る", () => r(o, t.id, e, p))), g.append(n);
		}
		(s.actions || []).length || g.append(X("p", "操作履歴はまだありません。", "fi-empty-state"));
	}
	e.querySelector("[data-connection-form]").onsubmit = async (n) => {
		n.preventDefault();
		let r = n.target, i = Z(r.querySelector("button[type=submit]"), "接続キーを作成しています…");
		try {
			let n = await t(e.dataset.key, {
				method: "POST",
				body: {
					name: r.elements.name.value,
					host_mode: r.elements.host_mode.value,
					modes: Pt(e.querySelector("[data-new-tools]")),
					acknowledge_automatic: r.elements.acknowledge_automatic.checked
				}
			});
			d(n), await p(), l("接続キーを作成しました。Fourmix Intelligenceのサービス接続で、アプリケーションURLとキーを入力してください。", "success");
		} catch (e) {
			l(e.message);
		} finally {
			i();
		}
	}, e.querySelector("[data-refresh]").onclick = async (e) => {
		let t = Z(e.currentTarget, "更新しています…");
		try {
			await p(), l("接続状態を更新しました。", "success");
		} catch (e) {
			l(e.message);
		} finally {
			t();
		}
	}, e.querySelector("[data-copy-key]").onclick = async () => {
		let t = e.querySelector("[data-code]");
		try {
			if (!window.navigator?.clipboard) {
				t.select(), l("キーを選択しました。コピーして使用してください。", "success");
				return;
			}
			await window.navigator.clipboard.writeText(t.value), l("接続キーをコピーしました。", "success");
		} catch {
			t.select(), l("選択したキーを手動でコピーしてください。");
		}
	}, p().catch((e) => l(e.message));
}
//#endregion
//#region resources/js/stream.js
async function Lt(e, t) {
	if (!e.body?.getReader) throw Error("応答を読み取れません。会話履歴を確認してください。");
	let n = e.body.getReader(), r = new TextDecoder("utf-8", { fatal: !0 }), i = "";
	try {
		for (;;) {
			let { value: e, done: a } = await n.read();
			if (i += r.decode(e, { stream: !a }), i.length > 2097152) throw Error("応答が大きすぎます。会話履歴を確認してください。");
			let o;
			for (; (o = i.indexOf("\n")) !== -1;) {
				let e = i.slice(0, o).trim();
				if (i = i.slice(o + 1), !e) continue;
				let n;
				try {
					n = JSON.parse(e);
				} catch {
					throw Error("応答の形式を確認できません。会話履歴を確認してください。");
				}
				if (!n || typeof n.type != "string" || !n.data || typeof n.data != "object" || Array.isArray(n.data)) throw Error("応答の形式を確認できません。");
				if ([
					"run.created",
					"run.status",
					"assistant.delta",
					"assistant.message",
					"run.completed",
					"run.failed"
				].includes(n.type)) {
					if (t(n), n.type === "run.failed") {
						let e = /* @__PURE__ */ Error("AIの処理を完了できませんでした。会話履歴と操作結果を確認してください。");
						throw [
							401,
							403,
							409,
							422,
							429
						].includes(n.data.status_code) && (e.status = n.data.status_code), e;
					}
					if (n.type === "run.completed") {
						if (!n.data.result || typeof n.data.result != "object" || typeof n.data.result.answer != "string") throw Error("回答の完了を確認できません。会話履歴を確認してください。");
						return n.data;
					}
				}
			}
			if (a) throw Error("通信が途中で終了しました。会話履歴と操作結果を確認してください。");
		}
	} finally {
		try {
			await n.cancel();
		} catch {}
		n.releaseLock();
	}
}
//#endregion
//#region resources/js/sdk.js
async function $(e, { method: t = "GET", body: n, signal: r, csrfToken: i, onEvent: a } = {}) {
	let o = i ?? document.querySelector("meta[name=\"csrf-token\"]")?.content, s = document.cookie.split("; ").find((e) => e.startsWith("XSRF-TOKEN="))?.slice(11), c;
	try {
		let i = n instanceof FormData;
		c = await fetch(e, {
			method: t,
			signal: r,
			credentials: "same-origin",
			headers: {
				Accept: a ? "application/x-ndjson" : "application/json",
				...n && !i ? { "Content-Type": "application/json" } : {},
				...o ? { "X-CSRF-TOKEN": o } : s ? { "X-XSRF-TOKEN": decodeURIComponent(s) } : {}
			},
			...n ? { body: i ? n : JSON.stringify(n) } : {}
		});
	} catch (e) {
		throw e.name === "AbortError" ? e : Error("通信できませんでした。接続を確認してから、AIと履歴を再読み込みしてください。");
	}
	if (c.ok && a && c.headers.get("Content-Type")?.includes("application/x-ndjson")) return Lt(c, a);
	let l = await c.json().catch(() => ({}));
	if (!c.ok) {
		let e = "処理を完了できませんでした。接続と利用許可を確認してください。", t = {
			"server error": e,
			forbidden: "この操作の利用許可がありません。接続と権限を確認してください。",
			"not found": "対象が見つかりません。接続とAIの設定を確認してください。",
			unauthenticated: "ログインの有効期限が切れました。再ログインしてください。",
			"too many requests": "依頼が集中しています。少し待ってから再度操作してください。"
		}, n = typeof l.message == "string" ? l.message.trim() : "", r = (e) => typeof e == "string" && /[\u3040-\u30ff\u3400-\u9fff]/u.test(e), i = c.status === 422 && l.errors && typeof l.errors == "object" ? Object.values(l.errors).flat().find(r) : null, a = c.status >= 500 ? e : r(n) ? n : i || t[n.toLocaleLowerCase().replace(/[.!]$/, "")] || (c.status === 419 ? "画面の有効期限が切れました。再読み込みしてください。" : e), o = Error(a);
		throw o.status = c.status, c.status === 409 && typeof l.conversation_id == "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(l.conversation_id) && (o.data = {
			conversation_id: l.conversation_id,
			state: "unknown"
		}), o;
	}
	return l;
}
for (let e of document.querySelectorAll("[data-fourmix-management]")) It(e, {
	request: $,
	Client: Ct,
	showAction: Ot,
	datetime: wt,
	renderToolGroups: At
});
//#endregion
export { $ as request };
