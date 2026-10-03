import { t as e } from "./purify-es-BMC2t3Ry.js";
import { n as t } from "./chunk-Y2CYZVJY-DdxqPB5t.js";
import { h as n, m as r, p as i } from "./src-CXWI7ZhK.js";
import { $ as a, I as o, J as s, K as c, L as l, N as u, P as d, Q as f, S as p, T as m, V as h, W as g, Z as _, b as v, c as y, f as b, g as x, j as S, l as C, m as w, n as T, p as E, r as D, s as O, t as k, u as A, w as ee, x as j, y as M } from "./chunk-VPRB5NB3-7XLf7LvO.js";
import { C as N, S as P, _ as F, a as I, b as L, f as R, g as z, i as te, l as ne, o as re, p as ie, y as ae } from "./chunk-3YJQHVM4-Cgh6-DNH.js";
import { r as oe } from "./chunk-HJ2JQQFS-D_rebrvl.js";
import { a as se } from "./chunk-E2ZNV5FY-BXozRLj1.js";
import { t as ce } from "./chunk-DUW6YSOI-DmQn-byd.js";
import "./chunk-4EA7E6EY-C-EgExuy.js";
import { o as le } from "./chunk-XC4XBNZT-DBen944y.js";
import { r as ue } from "./chunk-DBDB3WZW-ZjnEAAPd.js";
import { a as de, c as fe, i as B, l as pe } from "./chunk-2BW5OAIV-BcQEcD11.js";
import { r as me } from "./chunk-NTY3LDVX-COpR_TYK.js";
//#region ../../../work/node_modules/mermaid/dist/chunks/mermaid.core/chunk-Z6ETV63D.mjs
var he = /* @__PURE__ */ t((e) => {
	let { securityLevel: t } = v(), n = i("body");
	if (t === "sandbox") {
		let t = i(`#i${e}`).node()?.contentDocument ?? document;
		n = i(t.body);
	}
	return n.select(`#${e}`);
}, "selectSvgElement");
//#endregion
//#region ../../../work/node_modules/es-toolkit/dist/compat/_internal/isPrototype.mjs
function ge(e) {
	let t = e?.constructor;
	return e === (typeof t == "function" ? t.prototype : Object.prototype);
}
//#endregion
//#region ../../../work/node_modules/es-toolkit/dist/compat/predicate/isEmpty.mjs
function _e(e) {
	if (e == null) return !0;
	if (P(e)) return typeof e.splice != "function" && typeof e != "string" && !N(e) && !ae(e) && !L(e) ? !1 : e.length === 0;
	if (typeof e == "object" || typeof e == "function") {
		if (e instanceof Map || e instanceof Set) return e.size === 0;
		let t = Object.keys(e);
		return ge(e) ? t.filter((e) => e !== "constructor").length === 0 : t.length === 0;
	}
	return !0;
}
//#endregion
//#region ../../../work/node_modules/mermaid/dist/chunks/mermaid.core/chunk-SVEVUXB4.mjs
var ve = {
	common: O,
	getConfig: M,
	insertCluster: me,
	insertEdge: B,
	insertEdgeLabel: de,
	insertMarkers: fe,
	insertNode: ue,
	interpolateToCurve: R,
	labelHelper: le,
	log: r,
	positionEdgeLabel: pe
}, ye = [
	"elk.stress",
	"elk.force",
	"elk.mrtree",
	"elk.sporeOverlap",
	"elk.box",
	"elk.rectpacking"
], be = /* @__PURE__ */ Object.create(null), xe = /* @__PURE__ */ t((e) => {
	for (let t of e) be[t.name] = t;
}, "registerLayoutLoaders"), Se = /* @__PURE__ */ t(() => {
	let e = /* @__PURE__ */ t(async () => await import("./elk-IJKZMXRS-BCBaib-N.js"), "loader");
	return [{
		name: "elk",
		loader: e,
		algorithm: "elk.layered"
	}, ...ye.map((t) => ({
		name: t,
		loader: e,
		algorithm: t
	}))];
}, "elkLayoutLoaders");
(/* @__PURE__ */ t(() => {
	xe([
		{
			name: "dagre",
			loader: /* @__PURE__ */ t(async () => await import("./dagre-W4DXFKR2-0nkE_Ez9.js"), "loader")
		},
		{
			name: "swimlane",
			loader: /* @__PURE__ */ t(async () => await import("./swimlanes-N4OXWK64-B1C-9Kt7.js"), "loader")
		},
		{
			name: "cose-bilkent",
			loader: /* @__PURE__ */ t(async () => await import("./cose-bilkent-JH36ORCC-BthOKAjq.js"), "loader")
		},
		...Se()
	]);
}, "registerDefaultLayoutLoaders"))();
var Ce = /* @__PURE__ */ t(async (e, t) => {
	if (!Object.hasOwn(be, e.layoutAlgorithm)) throw Error(`Unknown layout algorithm: ${e.layoutAlgorithm}`);
	if (e.diagramId) for (let t of e.nodes) {
		let n = t.domId || t.id;
		t.domId = `${e.diagramId}-${n}`;
	}
	let n = be[e.layoutAlgorithm], r = await n.loader();
	return ce(t, e.config), r.render(e, t, ve, { algorithm: n.algorithm });
}, "render"), we = "dagre", Te = /* @__PURE__ */ t((e = "", { fallback: t = we } = {}) => {
	if (Object.hasOwn(be, e)) return e;
	for (let n of [t, we]) if (Object.hasOwn(be, n)) return r.warn(`Layout algorithm ${e} is not registered. Using ${n} as fallback.`), n;
	throw Error(`Neither layout algorithm ${e}, ${t}, nor ${we} is registered.`);
}, "getRegisteredLayoutAlgorithm");
//#endregion
//#region ../../../work/node_modules/mermaid/dist/chunks/mermaid.core/chunk-LNGE3PJU.mjs
function Ee(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
t(Ee, "getDefaultExportFromCjs");
var V = {}, De = {}, H = {}, Oe;
function U() {
	if (Oe) return H;
	Oe = 1;
	function e(e) {
		return e == null;
	}
	t(e, "isNothing");
	function n(e) {
		return typeof e == "object" && !!e;
	}
	t(n, "isObject");
	function r(t) {
		return Array.isArray(t) ? t : e(t) ? [] : [t];
	}
	t(r, "toArray");
	function i(e, t) {
		if (t) {
			let n = Object.keys(t);
			for (let r = 0, i = n.length; r < i; r += 1) {
				let i = n[r];
				e[i] = t[i];
			}
		}
		return e;
	}
	t(i, "extend");
	function a(e, t) {
		let n = "";
		for (let r = 0; r < t; r += 1) n += e;
		return n;
	}
	t(a, "repeat");
	function o(e) {
		return e === 0 && 1 / e == -Infinity;
	}
	return t(o, "isNegativeZero"), H.isNothing = e, H.isObject = n, H.toArray = r, H.repeat = a, H.isNegativeZero = o, H.extend = i, H;
}
t(U, "requireCommon");
var ke, Ae;
function W() {
	if (Ae) return ke;
	Ae = 1;
	function e(e, t) {
		let n = "", r = e.reason || "(unknown reason)";
		return e.mark ? (e.mark.name && (n += "in \"" + e.mark.name + "\" "), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (n += "\n\n" + e.mark.snippet), r + " " + n) : r;
	}
	t(e, "formatError");
	function n(t, n) {
		Error.call(this), this.name = "YAMLException", this.reason = t, this.mark = n, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = (/* @__PURE__ */ Error()).stack || "";
	}
	return t(n, "YAMLException2"), n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n.prototype.toString = /* @__PURE__ */ t(function(t) {
		return this.name + ": " + e(this, t);
	}, "toString"), ke = n, ke;
}
t(W, "requireException");
var je, Me;
function Ne() {
	if (Me) return je;
	Me = 1;
	let e = U();
	function n(e, t, n, r, i) {
		let a = "", o = "", s = Math.floor(i / 2) - 1;
		return r - t > s && (a = " ... ", t = r - s + a.length), n - r > s && (o = " ...", n = r + s - o.length), {
			str: a + e.slice(t, n).replace(/\t/g, "→") + o,
			pos: r - t + a.length
		};
	}
	t(n, "getLine");
	function r(t, n) {
		return e.repeat(" ", n - t.length) + t;
	}
	t(r, "padStart");
	function i(t, i) {
		if (i = Object.create(i || null), !t.buffer) return null;
		i.maxLength || (i.maxLength = 79), typeof i.indent != "number" && (i.indent = 1), typeof i.linesBefore != "number" && (i.linesBefore = 3), typeof i.linesAfter != "number" && (i.linesAfter = 2);
		let a = /\r?\n|\r|\0/g, o = [0], s = [], c, l = -1;
		for (; c = a.exec(t.buffer);) s.push(c.index), o.push(c.index + c[0].length), t.position <= c.index && l < 0 && (l = o.length - 2);
		l < 0 && (l = o.length - 1);
		let u = "", d = Math.min(t.line + i.linesAfter, s.length).toString().length, f = i.maxLength - (i.indent + d + 3);
		for (let a = 1; a <= i.linesBefore && !(l - a < 0); a++) {
			let c = n(t.buffer, o[l - a], s[l - a], t.position - (o[l] - o[l - a]), f);
			u = e.repeat(" ", i.indent) + r((t.line - a + 1).toString(), d) + " | " + c.str + "\n" + u;
		}
		let p = n(t.buffer, o[l], s[l], t.position, f);
		u += e.repeat(" ", i.indent) + r((t.line + 1).toString(), d) + " | " + p.str + "\n", u += e.repeat("-", i.indent + d + 3 + p.pos) + "^\n";
		for (let a = 1; a <= i.linesAfter && !(l + a >= s.length); a++) {
			let c = n(t.buffer, o[l + a], s[l + a], t.position - (o[l] - o[l + a]), f);
			u += e.repeat(" ", i.indent) + r((t.line + a + 1).toString(), d) + " | " + c.str + "\n";
		}
		return u.replace(/\n$/, "");
	}
	return t(i, "makeSnippet"), je = i, je;
}
t(Ne, "requireSnippet");
var Pe, Fe;
function G() {
	if (Fe) return Pe;
	Fe = 1;
	let e = W(), n = [
		"kind",
		"multi",
		"resolve",
		"construct",
		"instanceOf",
		"predicate",
		"represent",
		"representName",
		"defaultStyle",
		"styleAliases"
	], r = [
		"scalar",
		"sequence",
		"mapping"
	];
	function i(e) {
		let t = {};
		return e !== null && Object.keys(e).forEach(function(n) {
			e[n].forEach(function(e) {
				t[String(e)] = n;
			});
		}), t;
	}
	t(i, "compileStyleAliases");
	function a(t, a) {
		if (a ||= {}, Object.keys(a).forEach(function(r) {
			if (n.indexOf(r) === -1) throw new e("Unknown option \"" + r + "\" is met in definition of \"" + t + "\" YAML type.");
		}), this.options = a, this.tag = t, this.kind = a.kind || null, this.resolve = a.resolve || function() {
			return !0;
		}, this.construct = a.construct || function(e) {
			return e;
		}, this.instanceOf = a.instanceOf || null, this.predicate = a.predicate || null, this.represent = a.represent || null, this.representName = a.representName || null, this.defaultStyle = a.defaultStyle || null, this.multi = a.multi || !1, this.styleAliases = i(a.styleAliases || null), r.indexOf(this.kind) === -1) throw new e("Unknown kind \"" + this.kind + "\" is specified for \"" + t + "\" YAML type.");
	}
	return t(a, "Type2"), Pe = a, Pe;
}
t(G, "requireType");
var Ie, Le;
function Re() {
	if (Le) return Ie;
	Le = 1;
	let e = W(), n = G();
	function r(e, t) {
		let n = [];
		return e[t].forEach(function(e) {
			let t = n.length;
			n.forEach(function(n, r) {
				n.tag === e.tag && n.kind === e.kind && n.multi === e.multi && (t = r);
			}), n[t] = e;
		}), n;
	}
	t(r, "compileList");
	function i() {
		let e = {
			scalar: {},
			sequence: {},
			mapping: {},
			fallback: {},
			multi: {
				scalar: [],
				sequence: [],
				mapping: [],
				fallback: []
			}
		};
		function n(t) {
			t.multi ? (e.multi[t.kind].push(t), e.multi.fallback.push(t)) : e[t.kind][t.tag] = e.fallback[t.tag] = t;
		}
		t(n, "collectType");
		for (let e = 0, t = arguments.length; e < t; e += 1) arguments[e].forEach(n);
		return e;
	}
	t(i, "compileMap");
	function a(e) {
		return this.extend(e);
	}
	return t(a, "Schema2"), a.prototype.extend = /* @__PURE__ */ t(function(t) {
		let o = [], s = [];
		if (t instanceof n) s.push(t);
		else if (Array.isArray(t)) s = s.concat(t);
		else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit))) t.implicit && (o = o.concat(t.implicit)), t.explicit && (s = s.concat(t.explicit));
		else throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
		o.forEach(function(t) {
			if (!(t instanceof n)) throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
			if (t.loadKind && t.loadKind !== "scalar") throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
			if (t.multi) throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
		}), s.forEach(function(t) {
			if (!(t instanceof n)) throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		});
		let c = Object.create(a.prototype);
		return c.implicit = (this.implicit || []).concat(o), c.explicit = (this.explicit || []).concat(s), c.compiledImplicit = r(c, "implicit"), c.compiledExplicit = r(c, "explicit"), c.compiledTypeMap = i(c.compiledImplicit, c.compiledExplicit), c;
	}, "extend"), Ie = a, Ie;
}
t(Re, "requireSchema");
var ze, Be;
function Ve() {
	return Be ? ze : (Be = 1, ze = new (G())("tag:yaml.org,2002:str", {
		kind: "scalar",
		construct: /* @__PURE__ */ t(function(e) {
			return e === null ? "" : e;
		}, "construct")
	}), ze);
}
t(Ve, "requireStr");
var He, Ue;
function We() {
	return Ue ? He : (Ue = 1, He = new (G())("tag:yaml.org,2002:seq", {
		kind: "sequence",
		construct: /* @__PURE__ */ t(function(e) {
			return e === null ? [] : e;
		}, "construct")
	}), He);
}
t(We, "requireSeq");
var Ge, Ke;
function qe() {
	return Ke ? Ge : (Ke = 1, Ge = new (G())("tag:yaml.org,2002:map", {
		kind: "mapping",
		construct: /* @__PURE__ */ t(function(e) {
			return e === null ? {} : e;
		}, "construct")
	}), Ge);
}
t(qe, "requireMap");
var Je, Ye;
function Xe() {
	return Ye ? Je : (Ye = 1, Je = new (Re())({ explicit: [
		Ve(),
		We(),
		qe()
	] }), Je);
}
t(Xe, "requireFailsafe");
var Ze, Qe;
function $e() {
	if (Qe) return Ze;
	Qe = 1;
	let e = G();
	function n(e) {
		if (e === null) return !0;
		let t = e.length;
		return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
	}
	t(n, "resolveYamlNull");
	function r() {
		return null;
	}
	t(r, "constructYamlNull");
	function i(e) {
		return e === null;
	}
	return t(i, "isNull"), Ze = new e("tag:yaml.org,2002:null", {
		kind: "scalar",
		resolve: n,
		construct: r,
		predicate: i,
		represent: {
			canonical: /* @__PURE__ */ t(function() {
				return "~";
			}, "canonical"),
			lowercase: /* @__PURE__ */ t(function() {
				return "null";
			}, "lowercase"),
			uppercase: /* @__PURE__ */ t(function() {
				return "NULL";
			}, "uppercase"),
			camelcase: /* @__PURE__ */ t(function() {
				return "Null";
			}, "camelcase"),
			empty: /* @__PURE__ */ t(function() {
				return "";
			}, "empty")
		},
		defaultStyle: "lowercase"
	}), Ze;
}
t($e, "require_null");
var et, tt;
function nt() {
	if (tt) return et;
	tt = 1;
	let e = G();
	function n(e) {
		if (e === null) return !1;
		let t = e.length;
		return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
	}
	t(n, "resolveYamlBoolean");
	function r(e) {
		return e === "true" || e === "True" || e === "TRUE";
	}
	t(r, "constructYamlBoolean");
	function i(e) {
		return Object.prototype.toString.call(e) === "[object Boolean]";
	}
	return t(i, "isBoolean"), et = new e("tag:yaml.org,2002:bool", {
		kind: "scalar",
		resolve: n,
		construct: r,
		predicate: i,
		represent: {
			lowercase: /* @__PURE__ */ t(function(e) {
				return e ? "true" : "false";
			}, "lowercase"),
			uppercase: /* @__PURE__ */ t(function(e) {
				return e ? "TRUE" : "FALSE";
			}, "uppercase"),
			camelcase: /* @__PURE__ */ t(function(e) {
				return e ? "True" : "False";
			}, "camelcase")
		},
		defaultStyle: "lowercase"
	}), et;
}
t(nt, "requireBool");
var rt, it;
function at() {
	if (it) return rt;
	it = 1;
	let e = U(), n = G();
	function r(e) {
		return e >= 48 && e <= 57 || e >= 65 && e <= 70 || e >= 97 && e <= 102;
	}
	t(r, "isHexCode");
	function i(e) {
		return e >= 48 && e <= 55;
	}
	t(i, "isOctCode");
	function a(e) {
		return e >= 48 && e <= 57;
	}
	t(a, "isDecCode");
	function o(e) {
		if (e === null) return !1;
		let t = e.length, n = 0, o = !1;
		if (!t) return !1;
		let c = e[n];
		if ((c === "-" || c === "+") && (c = e[++n]), c === "0") {
			if (n + 1 === t) return !0;
			if (c = e[++n], c === "b") {
				for (n++; n < t; n++) {
					if (c = e[n], c !== "0" && c !== "1") return !1;
					o = !0;
				}
				return o && isFinite(s(e));
			}
			if (c === "x") {
				for (n++; n < t; n++) {
					if (!r(e.charCodeAt(n))) return !1;
					o = !0;
				}
				return o && isFinite(s(e));
			}
			if (c === "o") {
				for (n++; n < t; n++) {
					if (!i(e.charCodeAt(n))) return !1;
					o = !0;
				}
				return o && isFinite(s(e));
			}
		}
		for (; n < t; n++) {
			if (!a(e.charCodeAt(n))) return !1;
			o = !0;
		}
		return o ? isFinite(s(e)) : !1;
	}
	t(o, "resolveYamlInteger");
	function s(e) {
		let t = e, n = 1, r = t[0];
		if ((r === "-" || r === "+") && (r === "-" && (n = -1), t = t.slice(1), r = t[0]), t === "0") return 0;
		if (r === "0") {
			if (t[1] === "b") return n * parseInt(t.slice(2), 2);
			if (t[1] === "x") return n * parseInt(t.slice(2), 16);
			if (t[1] === "o") return n * parseInt(t.slice(2), 8);
		}
		return n * parseInt(t, 10);
	}
	t(s, "parseYamlInteger");
	function c(e) {
		return s(e);
	}
	t(c, "constructYamlInteger");
	function l(t) {
		return Object.prototype.toString.call(t) === "[object Number]" && t % 1 == 0 && !e.isNegativeZero(t);
	}
	return t(l, "isInteger"), rt = new n("tag:yaml.org,2002:int", {
		kind: "scalar",
		resolve: o,
		construct: c,
		predicate: l,
		represent: {
			binary: /* @__PURE__ */ t(function(e) {
				return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
			}, "binary"),
			octal: /* @__PURE__ */ t(function(e) {
				return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
			}, "octal"),
			decimal: /* @__PURE__ */ t(function(e) {
				return e.toString(10);
			}, "decimal"),
			hexadecimal: /* @__PURE__ */ t(function(e) {
				return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
			}, "hexadecimal")
		},
		defaultStyle: "decimal",
		styleAliases: {
			binary: [2, "bin"],
			octal: [8, "oct"],
			decimal: [10, "dec"],
			hexadecimal: [16, "hex"]
		}
	}), rt;
}
t(at, "requireInt");
var ot, st;
function ct() {
	if (st) return ot;
	st = 1;
	let e = U(), n = G(), r = /* @__PURE__ */ RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"), i = /* @__PURE__ */ RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	function a(e) {
		return e === null || !r.test(e) ? !1 : isFinite(parseFloat(e, 10)) ? !0 : i.test(e);
	}
	t(a, "resolveYamlFloat");
	function o(e) {
		let t = e.toLowerCase(), n = t[0] === "-" ? -1 : 1;
		return "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? n === 1 ? Infinity : -Infinity : t === ".nan" ? NaN : n * parseFloat(t, 10);
	}
	t(o, "constructYamlFloat");
	let s = /^[-+]?[0-9]+e/;
	function c(t, n) {
		if (isNaN(t)) switch (n) {
			case "lowercase": return ".nan";
			case "uppercase": return ".NAN";
			case "camelcase": return ".NaN";
		}
		else if (t === Infinity) switch (n) {
			case "lowercase": return ".inf";
			case "uppercase": return ".INF";
			case "camelcase": return ".Inf";
		}
		else if (t === -Infinity) switch (n) {
			case "lowercase": return "-.inf";
			case "uppercase": return "-.INF";
			case "camelcase": return "-.Inf";
		}
		else if (e.isNegativeZero(t)) return "-0.0";
		let r = t.toString(10);
		return s.test(r) ? r.replace("e", ".e") : r;
	}
	t(c, "representYamlFloat");
	function l(t) {
		return Object.prototype.toString.call(t) === "[object Number]" && (t % 1 != 0 || e.isNegativeZero(t));
	}
	return t(l, "isFloat"), ot = new n("tag:yaml.org,2002:float", {
		kind: "scalar",
		resolve: a,
		construct: o,
		predicate: l,
		represent: c,
		defaultStyle: "lowercase"
	}), ot;
}
t(ct, "requireFloat");
var lt, ut;
function dt() {
	return ut ? lt : (ut = 1, lt = Xe().extend({ implicit: [
		$e(),
		nt(),
		at(),
		ct()
	] }), lt);
}
t(dt, "requireJson");
var ft, pt;
function mt() {
	return pt ? ft : (pt = 1, ft = dt(), ft);
}
t(mt, "requireCore");
var ht, gt;
function _t() {
	if (gt) return ht;
	gt = 1;
	let e = G(), n = /* @__PURE__ */ RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"), r = /* @__PURE__ */ RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
	function i(e) {
		return e === null ? !1 : n.exec(e) !== null || r.exec(e) !== null;
	}
	t(i, "resolveYamlTimestamp");
	function a(e) {
		let t = 0, i = null, a = n.exec(e);
		if (a === null && (a = r.exec(e)), a === null) throw Error("Date resolve error");
		let o = +a[1], s = a[2] - 1, c = +a[3];
		if (!a[4]) return new Date(Date.UTC(o, s, c));
		let l = +a[4], u = +a[5], d = +a[6];
		if (a[7]) {
			for (t = a[7].slice(0, 3); t.length < 3;) t += "0";
			t = +t;
		}
		if (a[9]) {
			let e = +a[10], t = +(a[11] || 0);
			i = (e * 60 + t) * 6e4, a[9] === "-" && (i = -i);
		}
		let f = new Date(Date.UTC(o, s, c, l, u, d, t));
		return i && f.setTime(f.getTime() - i), f;
	}
	t(a, "constructYamlTimestamp");
	function o(e) {
		return e.toISOString();
	}
	return t(o, "representYamlTimestamp"), ht = new e("tag:yaml.org,2002:timestamp", {
		kind: "scalar",
		resolve: i,
		construct: a,
		instanceOf: Date,
		represent: o
	}), ht;
}
t(_t, "requireTimestamp");
var vt, yt;
function bt() {
	if (yt) return vt;
	yt = 1;
	let e = G();
	function n(e) {
		return e === "<<" || e === null;
	}
	return t(n, "resolveYamlMerge"), vt = new e("tag:yaml.org,2002:merge", {
		kind: "scalar",
		resolve: n
	}), vt;
}
t(bt, "requireMerge");
var xt, St;
function Ct() {
	if (St) return xt;
	St = 1;
	let e = G();
	function n(e) {
		if (e === null) return !1;
		let t = 0, n = e.length;
		for (let r = 0; r < n; r++) {
			let n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r".indexOf(e.charAt(r));
			if (!(n > 64)) {
				if (n < 0) return !1;
				t += 6;
			}
		}
		return t % 8 == 0;
	}
	t(n, "resolveYamlBinary");
	function r(e) {
		let t = e.replace(/[\r\n=]/g, ""), n = t.length, r = 0, i = [];
		for (let e = 0; e < n; e++) e % 4 == 0 && e && (i.push(r >> 16 & 255), i.push(r >> 8 & 255), i.push(r & 255)), r = r << 6 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r".indexOf(t.charAt(e));
		let a = n % 4 * 6;
		return a === 0 ? (i.push(r >> 16 & 255), i.push(r >> 8 & 255), i.push(r & 255)) : a === 18 ? (i.push(r >> 10 & 255), i.push(r >> 2 & 255)) : a === 12 && i.push(r >> 4 & 255), new Uint8Array(i);
	}
	t(r, "constructYamlBinary");
	function i(e) {
		let t = "", n = 0, r = e.length, i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
		for (let a = 0; a < r; a++) a % 3 == 0 && a && (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]), n = (n << 8) + e[a];
		let a = r % 3;
		return a === 0 ? (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]) : a === 2 ? (t += i[n >> 10 & 63], t += i[n >> 4 & 63], t += i[n << 2 & 63], t += i[64]) : a === 1 && (t += i[n >> 2 & 63], t += i[n << 4 & 63], t += i[64], t += i[64]), t;
	}
	t(i, "representYamlBinary");
	function a(e) {
		return Object.prototype.toString.call(e) === "[object Uint8Array]";
	}
	return t(a, "isBinary"), xt = new e("tag:yaml.org,2002:binary", {
		kind: "scalar",
		resolve: n,
		construct: r,
		predicate: a,
		represent: i
	}), xt;
}
t(Ct, "requireBinary");
var wt, Tt;
function Et() {
	if (Tt) return wt;
	Tt = 1;
	let e = G(), n = Object.prototype.hasOwnProperty, r = Object.prototype.toString;
	function i(e) {
		if (e === null) return !0;
		let t = [], i = e;
		for (let e = 0, a = i.length; e < a; e += 1) {
			let a = i[e], o = !1;
			if (r.call(a) !== "[object Object]") return !1;
			let s;
			for (s in a) if (n.call(a, s)) {
				if (!o) o = !0;
				else return !1;
			}
			if (!o) return !1;
			if (t.indexOf(s) === -1) t.push(s);
			else return !1;
		}
		return !0;
	}
	t(i, "resolveYamlOmap");
	function a(e) {
		return e === null ? [] : e;
	}
	return t(a, "constructYamlOmap"), wt = new e("tag:yaml.org,2002:omap", {
		kind: "sequence",
		resolve: i,
		construct: a
	}), wt;
}
t(Et, "requireOmap");
var Dt, Ot;
function kt() {
	if (Ot) return Dt;
	Ot = 1;
	let e = G(), n = Object.prototype.toString;
	function r(e) {
		if (e === null) return !0;
		let t = e, r = Array(t.length);
		for (let e = 0, i = t.length; e < i; e += 1) {
			let i = t[e];
			if (n.call(i) !== "[object Object]") return !1;
			let a = Object.keys(i);
			if (a.length !== 1) return !1;
			r[e] = [a[0], i[a[0]]];
		}
		return !0;
	}
	t(r, "resolveYamlPairs");
	function i(e) {
		if (e === null) return [];
		let t = e, n = Array(t.length);
		for (let e = 0, r = t.length; e < r; e += 1) {
			let r = t[e], i = Object.keys(r);
			n[e] = [i[0], r[i[0]]];
		}
		return n;
	}
	return t(i, "constructYamlPairs"), Dt = new e("tag:yaml.org,2002:pairs", {
		kind: "sequence",
		resolve: r,
		construct: i
	}), Dt;
}
t(kt, "requirePairs");
var At, jt;
function Mt() {
	if (jt) return At;
	jt = 1;
	let e = G(), n = Object.prototype.hasOwnProperty;
	function r(e) {
		if (e === null) return !0;
		let t = e;
		for (let e in t) if (n.call(t, e) && t[e] !== null) return !1;
		return !0;
	}
	t(r, "resolveYamlSet");
	function i(e) {
		return e === null ? {} : e;
	}
	return t(i, "constructYamlSet"), At = new e("tag:yaml.org,2002:set", {
		kind: "mapping",
		resolve: r,
		construct: i
	}), At;
}
t(Mt, "requireSet");
var Nt, Pt;
function Ft() {
	return Pt ? Nt : (Pt = 1, Nt = mt().extend({
		implicit: [_t(), bt()],
		explicit: [
			Ct(),
			Et(),
			kt(),
			Mt()
		]
	}), Nt);
}
t(Ft, "require_default");
var It;
function Lt() {
	if (It) return De;
	It = 1;
	let e = U(), n = W(), r = Ne(), i = Ft(), a = Object.prototype.hasOwnProperty, o = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, s = /[\x85\u2028\u2029]/, c = /[,\[\]{}]/, l = /^(?:!|!!|![0-9A-Za-z-]+!)$/, u = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
	function d(e) {
		return Object.prototype.toString.call(e);
	}
	t(d, "_class");
	function f(e) {
		return e === 10 || e === 13;
	}
	t(f, "isEol");
	function p(e) {
		return e === 9 || e === 32;
	}
	t(p, "isWhiteSpace");
	function m(e) {
		return e === 9 || e === 32 || e === 10 || e === 13;
	}
	t(m, "isWsOrEol");
	function h(e) {
		return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
	}
	t(h, "isFlowIndicator");
	function g(e) {
		if (e >= 48 && e <= 57) return e - 48;
		let t = e | 32;
		return t >= 97 && t <= 102 ? t - 97 + 10 : -1;
	}
	t(g, "fromHexCode");
	function _(e) {
		return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
	}
	t(_, "escapedHexLen");
	function v(e) {
		return e >= 48 && e <= 57 ? e - 48 : -1;
	}
	t(v, "fromDecimalCode");
	function y(e) {
		switch (e) {
			case 48: return "\0";
			case 97: return "\x07";
			case 98: return "\b";
			case 116: return "	";
			case 9: return "	";
			case 110: return "\n";
			case 118: return "\v";
			case 102: return "\f";
			case 114: return "\r";
			case 101: return "\x1B";
			case 32: return " ";
			case 34: return "\"";
			case 47: return "/";
			case 92: return "\\";
			case 78: return "";
			case 95: return "\xA0";
			case 76: return "\u2028";
			case 80: return "\u2029";
			default: return "";
		}
	}
	t(y, "simpleEscapeSequence");
	function b(e) {
		return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode((e - 65536 >> 10) + 55296, (e - 65536 & 1023) + 56320);
	}
	t(b, "charFromCodepoint");
	function x(e, t, n) {
		t === "__proto__" ? Object.defineProperty(e, t, {
			configurable: !0,
			enumerable: !0,
			writable: !0,
			value: n
		}) : e[t] = n;
	}
	t(x, "setProperty");
	let S = Array(256), C = Array(256);
	for (let e = 0; e < 256; e++) S[e] = +!!y(e), C[e] = y(e);
	function w(e, t) {
		this.input = e, this.filename = t.filename || null, this.schema = t.schema || i, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.maxDepth = typeof t.maxDepth == "number" ? t.maxDepth : 100, this.maxTotalMergeKeys = typeof t.maxTotalMergeKeys == "number" ? t.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
	}
	t(w, "State");
	function T(e, t) {
		let i = {
			name: e.filename,
			buffer: e.input.slice(0, -1),
			position: e.position,
			line: e.line,
			column: e.position - e.lineStart
		};
		return i.snippet = r(i), new n(t, i);
	}
	t(T, "generateError");
	function E(e, t) {
		throw T(e, t);
	}
	t(E, "throwError");
	function D(e, t) {
		e.onWarning && e.onWarning.call(null, T(e, t));
	}
	t(D, "throwWarning");
	function O(e, t, n) {
		let r = e.anchorMapTransactions;
		if (r.length !== 0) {
			let n = r[r.length - 1];
			a.call(n, t) || (n[t] = {
				existed: a.call(e.anchorMap, t),
				value: e.anchorMap[t]
			});
		}
		e.anchorMap[t] = n;
	}
	t(O, "storeAnchor");
	function k(e) {
		e.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
	}
	t(k, "beginAnchorTransaction");
	function A(e) {
		let t = e.anchorMapTransactions.pop(), n = e.anchorMapTransactions;
		if (n.length === 0) return;
		let r = n[n.length - 1], i = Object.keys(t);
		for (let e = 0, n = i.length; e < n; e += 1) {
			let n = i[e];
			a.call(r, n) || (r[n] = t[n]);
		}
	}
	t(A, "commitAnchorTransaction");
	function ee(e) {
		let t = e.anchorMapTransactions.pop(), n = Object.keys(t);
		for (let r = n.length - 1; r >= 0; --r) {
			let i = t[n[r]];
			i.existed ? e.anchorMap[n[r]] = i.value : delete e.anchorMap[n[r]];
		}
	}
	t(ee, "rollbackAnchorTransaction");
	function j(e) {
		return {
			position: e.position,
			line: e.line,
			lineStart: e.lineStart,
			lineIndent: e.lineIndent,
			firstTabInLine: e.firstTabInLine,
			tag: e.tag,
			anchor: e.anchor,
			kind: e.kind,
			result: e.result
		};
	}
	t(j, "snapshotState");
	function M(e, t) {
		e.position = t.position, e.line = t.line, e.lineStart = t.lineStart, e.lineIndent = t.lineIndent, e.firstTabInLine = t.firstTabInLine, e.tag = t.tag, e.anchor = t.anchor, e.kind = t.kind, e.result = t.result;
	}
	t(M, "restoreState");
	let N = {
		YAML: /* @__PURE__ */ t(function(e, t, n) {
			e.version !== null && E(e, "duplication of %YAML directive"), n.length !== 1 && E(e, "YAML directive accepts exactly one argument");
			let r = /^([0-9]+)\.([0-9]+)$/.exec(n[0]);
			r === null && E(e, "ill-formed argument of the YAML directive");
			let i = parseInt(r[1], 10), a = parseInt(r[2], 10);
			i !== 1 && E(e, "unacceptable YAML version of the document"), e.version = n[0], e.checkLineBreaks = a < 2, a !== 1 && a !== 2 && D(e, "unsupported YAML version of the document");
		}, "handleYamlDirective"),
		TAG: /* @__PURE__ */ t(function(e, t, n) {
			let r;
			n.length !== 2 && E(e, "TAG directive accepts exactly two arguments");
			let i = n[0];
			r = n[1], l.test(i) || E(e, "ill-formed tag handle (first argument) of the TAG directive"), a.call(e.tagMap, i) && E(e, "there is a previously declared suffix for \"" + i + "\" tag handle"), u.test(r) || E(e, "ill-formed tag prefix (second argument) of the TAG directive");
			try {
				r = decodeURIComponent(r);
			} catch {
				E(e, "tag prefix is malformed: " + r);
			}
			e.tagMap[i] = r;
		}, "handleTagDirective")
	};
	function P(e, t, n, r) {
		if (t < n) {
			let i = e.input.slice(t, n);
			if (r) for (let t = 0, n = i.length; t < n; t += 1) {
				let n = i.charCodeAt(t);
				n === 9 || n >= 32 && n <= 1114111 || E(e, "expected valid JSON character");
			}
			else o.test(i) && E(e, "the stream contains non-printable characters");
			e.result += i;
		}
	}
	t(P, "captureSegment");
	function F(t, n, r, i) {
		e.isObject(r) || E(t, "cannot merge mappings; the provided source object is unacceptable");
		let o = Object.keys(r);
		for (let e = 0, s = o.length; e < s; e += 1) {
			let s = o[e];
			t.maxTotalMergeKeys !== -1 && ++t.totalMergeKeys > t.maxTotalMergeKeys && E(t, "merge keys exceeded maxTotalMergeKeys (" + t.maxTotalMergeKeys + ")"), a.call(n, s) || (x(n, s, r[s]), i[s] = !0);
		}
	}
	t(F, "mergeMappings");
	function I(e, t, n, r, i, o, s, c, l) {
		if (Array.isArray(i)) {
			i = Array.prototype.slice.call(i);
			for (let t = 0, n = i.length; t < n; t += 1) Array.isArray(i[t]) && E(e, "nested arrays are not supported inside keys"), typeof i == "object" && d(i[t]) === "[object Object]" && (i[t] = "[object Object]");
		}
		if (typeof i == "object" && d(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), r === "tag:yaml.org,2002:merge") {
			if (Array.isArray(o)) for (let r = 0, i = o.length; r < i; r += 1) F(e, t, o[r], n);
			else F(e, t, o, n);
		} else !e.json && !a.call(n, i) && a.call(t, i) && (e.line = s || e.line, e.lineStart = c || e.lineStart, e.position = l || e.position, E(e, "duplicated mapping key")), x(t, i, o), delete n[i];
		return t;
	}
	t(I, "storeMappingPair");
	function L(e) {
		let t = e.input.charCodeAt(e.position);
		t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : E(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
	}
	t(L, "readLineBreak");
	function R(e, t, n) {
		let r = 0, i = e.input.charCodeAt(e.position);
		for (; i !== 0;) {
			for (; p(i);) i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
			if (t && i === 35) do
				i = e.input.charCodeAt(++e.position);
			while (i !== 10 && i !== 13 && i !== 0);
			if (f(i)) for (L(e), i = e.input.charCodeAt(e.position), r++, e.lineIndent = 0; i === 32;) e.lineIndent++, i = e.input.charCodeAt(++e.position);
			else break;
		}
		return n !== -1 && r !== 0 && e.lineIndent < n && D(e, "deficient indentation"), r;
	}
	t(R, "skipSeparationSpace");
	function z(e) {
		let t = e.position, n = e.input.charCodeAt(t);
		return !!((n === 45 || n === 46) && n === e.input.charCodeAt(t + 1) && n === e.input.charCodeAt(t + 2) && (t += 3, n = e.input.charCodeAt(t), n === 0 || m(n)));
	}
	t(z, "testDocumentSeparator");
	function te(t, n) {
		n === 1 ? t.result += " " : n > 1 && (t.result += e.repeat("\n", n - 1));
	}
	t(te, "writeFoldedLines");
	function ne(e, t, n) {
		let r, i, a, o, s, c, l = e.kind, u = e.result, d = e.input.charCodeAt(e.position);
		if (m(d) || h(d) || d === 35 || d === 38 || d === 42 || d === 33 || d === 124 || d === 62 || d === 39 || d === 34 || d === 37 || d === 64 || d === 96) return !1;
		if (d === 63 || d === 45) {
			let t = e.input.charCodeAt(e.position + 1);
			if (m(t) || n && h(t)) return !1;
		}
		for (e.kind = "scalar", e.result = "", r = i = e.position, a = !1; d !== 0;) {
			if (d === 58) {
				let t = e.input.charCodeAt(e.position + 1);
				if (m(t) || n && h(t)) break;
			} else if (d === 35) {
				if (m(e.input.charCodeAt(e.position - 1))) break;
			} else if (e.position === e.lineStart && z(e) || n && h(d)) break;
			else if (f(d)) {
				if (o = e.line, s = e.lineStart, c = e.lineIndent, R(e, !1, -1), e.lineIndent >= t) {
					a = !0, d = e.input.charCodeAt(e.position);
					continue;
				}
				e.position = i, e.line = o, e.lineStart = s, e.lineIndent = c;
				break;
			}
			a &&= (P(e, r, i, !1), te(e, e.line - o), r = i = e.position, !1), p(d) || (i = e.position + 1), d = e.input.charCodeAt(++e.position);
		}
		return P(e, r, i, !1), e.result ? !0 : (e.kind = l, e.result = u, !1);
	}
	t(ne, "readPlainScalar");
	function re(e, t) {
		let n, r, i = e.input.charCodeAt(e.position);
		if (i !== 39) return !1;
		for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (i = e.input.charCodeAt(e.position)) !== 0;) if (i === 39) {
			if (P(e, n, e.position, !0), i = e.input.charCodeAt(++e.position), i === 39) n = e.position, e.position++, r = e.position;
			else return !0;
		} else f(i) ? (P(e, n, r, !0), te(e, R(e, !1, t)), n = r = e.position) : e.position === e.lineStart && z(e) ? E(e, "unexpected end of the document within a single quoted scalar") : (e.position++, p(i) || (r = e.position));
		E(e, "unexpected end of the stream within a single quoted scalar");
	}
	t(re, "readSingleQuotedScalar");
	function ie(e, t) {
		let n, r, i, a = e.input.charCodeAt(e.position);
		if (a !== 34) return !1;
		for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (a = e.input.charCodeAt(e.position)) !== 0;) if (a === 34) return P(e, n, e.position, !0), e.position++, !0;
		else if (a === 92) {
			if (P(e, n, e.position, !0), a = e.input.charCodeAt(++e.position), f(a)) R(e, !1, t);
			else if (a < 256 && S[a]) e.result += C[a], e.position++;
			else if ((i = _(a)) > 0) {
				let t = i, n = 0;
				for (; t > 0; t--) a = e.input.charCodeAt(++e.position), (i = g(a)) >= 0 ? n = (n << 4) + i : E(e, "expected hexadecimal character");
				e.result += b(n), e.position++;
			} else E(e, "unknown escape sequence");
			n = r = e.position;
		} else f(a) ? (P(e, n, r, !0), te(e, R(e, !1, t)), n = r = e.position) : e.position === e.lineStart && z(e) ? E(e, "unexpected end of the document within a double quoted scalar") : (e.position++, p(a) || (r = e.position));
		E(e, "unexpected end of the stream within a double quoted scalar");
	}
	t(ie, "readDoubleQuotedScalar");
	function ae(e, t) {
		let n = !0, r, i, a, o = e.tag, s, c = e.anchor, l, u, d, f, p = /* @__PURE__ */ Object.create(null), h, g, _, v = e.input.charCodeAt(e.position);
		if (v === 91) l = 93, f = !1, s = [];
		else if (v === 123) l = 125, f = !0, s = {};
		else return !1;
		for (e.anchor !== null && O(e, e.anchor, s), v = e.input.charCodeAt(++e.position); v !== 0;) {
			if (R(e, !0, t), v = e.input.charCodeAt(e.position), v === l) return e.position++, e.tag = o, e.anchor = c, e.kind = f ? "mapping" : "sequence", e.result = s, !0;
			n ? v === 44 && E(e, "expected the node content, but found ','") : E(e, "missed comma between flow collection entries"), g = h = _ = null, u = d = !1, v === 63 && m(e.input.charCodeAt(e.position + 1)) && (u = d = !0, e.position++, R(e, !0, t)), r = e.line, i = e.lineStart, a = e.position, B(e, t, 1, !1, !0), g = e.tag, h = e.result, R(e, !0, t), v = e.input.charCodeAt(e.position), (d || e.line === r) && v === 58 && (u = !0, v = e.input.charCodeAt(++e.position), R(e, !0, t), B(e, t, 1, !1, !0), _ = e.result), f ? I(e, s, p, g, h, _, r, i, a) : u ? s.push(I(e, null, p, g, h, _, r, i, a)) : s.push(h), R(e, !0, t), v = e.input.charCodeAt(e.position), v === 44 ? (n = !0, v = e.input.charCodeAt(++e.position)) : n = !1;
		}
		E(e, "unexpected end of the stream within a flow collection");
	}
	t(ae, "readFlowCollection");
	function oe(t, n) {
		let r, i = 1, a = !1, o = !1, s = n, c = 0, l = !1, u, d = t.input.charCodeAt(t.position);
		if (d === 124) r = !1;
		else if (d === 62) r = !0;
		else return !1;
		for (t.kind = "scalar", t.result = ""; d !== 0;) if (d = t.input.charCodeAt(++t.position), d === 43 || d === 45) i === 1 ? i = d === 43 ? 3 : 2 : E(t, "repeat of a chomping mode identifier");
		else if ((u = v(d)) >= 0) u === 0 ? E(t, "bad explicit indentation width of a block scalar; it cannot be less than one") : o ? E(t, "repeat of an indentation width identifier") : (s = n + u - 1, o = !0);
		else break;
		if (p(d)) {
			do
				d = t.input.charCodeAt(++t.position);
			while (p(d));
			if (d === 35) do
				d = t.input.charCodeAt(++t.position);
			while (!f(d) && d !== 0);
		}
		for (; d !== 0;) {
			for (L(t), t.lineIndent = 0, d = t.input.charCodeAt(t.position); (!o || t.lineIndent < s) && d === 32;) t.lineIndent++, d = t.input.charCodeAt(++t.position);
			if (!o && t.lineIndent > s && (s = t.lineIndent), f(d)) {
				c++;
				continue;
			}
			if (!o && s === 0 && E(t, "missing indentation for block scalar"), t.lineIndent < s) {
				i === 3 ? t.result += e.repeat("\n", a ? 1 + c : c) : i === 1 && a && (t.result += "\n");
				break;
			}
			r ? p(d) ? (l = !0, t.result += e.repeat("\n", a ? 1 + c : c)) : l ? (l = !1, t.result += e.repeat("\n", c + 1)) : c === 0 ? a && (t.result += " ") : t.result += e.repeat("\n", c) : t.result += e.repeat("\n", a ? 1 + c : c), a = !0, o = !0, c = 0;
			let n = t.position;
			for (; !f(d) && d !== 0;) d = t.input.charCodeAt(++t.position);
			P(t, n, t.position, !1);
		}
		return !0;
	}
	t(oe, "readBlockScalar");
	function se(e, t) {
		let n = e.tag, r = e.anchor, i = [], a = !1;
		if (e.firstTabInLine !== -1) return !1;
		e.anchor !== null && O(e, e.anchor, i);
		let o = e.input.charCodeAt(e.position);
		for (; o !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, E(e, "tab characters must not be used in indentation")), o === 45 && m(e.input.charCodeAt(e.position + 1)));) {
			if (a = !0, e.position++, R(e, !0, -1) && e.lineIndent <= t) {
				i.push(null), o = e.input.charCodeAt(e.position);
				continue;
			}
			let n = e.line;
			if (B(e, t, 3, !1, !0), i.push(e.result), R(e, !0, -1), o = e.input.charCodeAt(e.position), (e.line === n || e.lineIndent > t) && o !== 0) E(e, "bad indentation of a sequence entry");
			else if (e.lineIndent < t) break;
		}
		return a ? (e.tag = n, e.anchor = r, e.kind = "sequence", e.result = i, !0) : !1;
	}
	t(se, "readBlockSequence");
	function ce(e, t, n) {
		let r, i, a, o, s = e.tag, c = e.anchor, l = {}, u = /* @__PURE__ */ Object.create(null), d = null, f = null, h = null, g = !1, _ = !1;
		if (e.firstTabInLine !== -1) return !1;
		e.anchor !== null && O(e, e.anchor, l);
		let v = e.input.charCodeAt(e.position);
		for (; v !== 0;) {
			!g && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, E(e, "tab characters must not be used in indentation"));
			let y = e.input.charCodeAt(e.position + 1), b = e.line;
			if ((v === 63 || v === 58) && m(y)) v === 63 ? (g && (I(e, l, u, d, f, null, i, a, o), d = f = h = null), _ = !0, g = !0, r = !0) : g ? (g = !1, r = !0) : E(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, v = y;
			else {
				if (i = e.line, a = e.lineStart, o = e.position, !B(e, n, 2, !1, !0)) break;
				if (e.line === b) {
					for (v = e.input.charCodeAt(e.position); p(v);) v = e.input.charCodeAt(++e.position);
					if (v === 58) v = e.input.charCodeAt(++e.position), m(v) || E(e, "a whitespace character is expected after the key-value separator within a block mapping"), g && (I(e, l, u, d, f, null, i, a, o), d = f = h = null), _ = !0, g = !1, r = !1, d = e.tag, f = e.result;
					else if (_) E(e, "can not read an implicit mapping pair; a colon is missed");
					else return e.tag = s, e.anchor = c, !0;
				} else if (_) E(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
				else return e.tag = s, e.anchor = c, !0;
			}
			if ((e.line === b || e.lineIndent > t) && (g && (i = e.line, a = e.lineStart, o = e.position), B(e, t, 4, !0, r) && (g ? f = e.result : h = e.result), g || (I(e, l, u, d, f, h, i, a, o), d = f = h = null), R(e, !0, -1), v = e.input.charCodeAt(e.position)), (e.line === b || e.lineIndent > t) && v !== 0) E(e, "bad indentation of a mapping entry");
			else if (e.lineIndent < t) break;
		}
		return g && I(e, l, u, d, f, null, i, a, o), _ && (e.tag = s, e.anchor = c, e.kind = "mapping", e.result = l), _;
	}
	t(ce, "readBlockMapping");
	function le(e) {
		let t = !1, n = !1, r, i, o = e.input.charCodeAt(e.position);
		if (o !== 33) return !1;
		e.tag !== null && E(e, "duplication of a tag property"), o = e.input.charCodeAt(++e.position), o === 60 ? (t = !0, o = e.input.charCodeAt(++e.position)) : o === 33 ? (n = !0, r = "!!", o = e.input.charCodeAt(++e.position)) : r = "!";
		let s = e.position;
		if (t) {
			do
				o = e.input.charCodeAt(++e.position);
			while (o !== 0 && o !== 62);
			e.position < e.length ? (i = e.input.slice(s, e.position), o = e.input.charCodeAt(++e.position)) : E(e, "unexpected end of the stream within a verbatim tag");
		} else {
			for (; o !== 0 && !m(o);) o === 33 && (n ? E(e, "tag suffix cannot contain exclamation marks") : (r = e.input.slice(s - 1, e.position + 1), l.test(r) || E(e, "named tag handle cannot contain such characters"), n = !0, s = e.position + 1)), o = e.input.charCodeAt(++e.position);
			i = e.input.slice(s, e.position), c.test(i) && E(e, "tag suffix cannot contain flow indicator characters");
		}
		i && !u.test(i) && E(e, "tag name cannot contain such characters: " + i);
		try {
			i = decodeURIComponent(i);
		} catch {
			E(e, "tag name is malformed: " + i);
		}
		return t ? e.tag = i : a.call(e.tagMap, r) ? e.tag = e.tagMap[r] + i : r === "!" ? e.tag = "!" + i : r === "!!" ? e.tag = "tag:yaml.org,2002:" + i : E(e, "undeclared tag handle \"" + r + "\""), !0;
	}
	t(le, "readTagProperty");
	function ue(e) {
		let t = e.input.charCodeAt(e.position);
		if (t !== 38) return !1;
		e.anchor !== null && E(e, "duplication of an anchor property"), t = e.input.charCodeAt(++e.position);
		let n = e.position;
		for (; t !== 0 && !m(t) && !h(t);) t = e.input.charCodeAt(++e.position);
		return e.position === n && E(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(n, e.position), !0;
	}
	t(ue, "readAnchorProperty");
	function de(e) {
		let t = e.input.charCodeAt(e.position);
		if (t !== 42) return !1;
		t = e.input.charCodeAt(++e.position);
		let n = e.position;
		for (; t !== 0 && !m(t) && !h(t);) t = e.input.charCodeAt(++e.position);
		e.position === n && E(e, "name of an alias node must contain at least one character");
		let r = e.input.slice(n, e.position);
		return a.call(e.anchorMap, r) || E(e, "unidentified alias \"" + r + "\""), e.result = e.anchorMap[r], R(e, !0, -1), !0;
	}
	t(de, "readAlias");
	function fe(e, t, n, r) {
		let i = j(e);
		return k(e), M(e, t), e.tag = null, e.anchor = null, e.kind = null, e.result = null, ce(e, n, r) && e.kind === "mapping" ? (A(e), !0) : (ee(e), M(e, i), !1);
	}
	t(fe, "tryReadBlockMappingFromProperty");
	function B(e, t, n, r, i) {
		let o, s, c = 1, l = !1, u = !1, d = null, f, p, m;
		e.depth >= e.maxDepth && E(e, "nesting exceeded maxDepth (" + e.maxDepth + ")"), e.depth += 1, e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null;
		let h = o = s = n === 4 || n === 3;
		if (r && R(e, !0, -1) && (l = !0, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)), c === 1) for (;;) {
			let n = e.input.charCodeAt(e.position), r = j(e);
			if (l && (n === 33 && e.tag !== null || n === 38 && e.anchor !== null) || !le(e) && !ue(e)) break;
			d === null && (d = r), R(e, !0, -1) ? (l = !0, s = h, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)) : s = !1;
		}
		if (s &&= l || i, c === 1 || n === 4) {
			if (p = n === 1 || n === 2 ? t : t + 1, m = e.position - e.lineStart, c === 1) {
				if (s && (se(e, m) || ce(e, m, p)) || ae(e, p)) u = !0;
				else {
					let t = e.input.charCodeAt(e.position);
					d !== null && h && !s && t !== 124 && t !== 62 && fe(e, d, d.position - d.lineStart, p) || o && oe(e, p) || re(e, p) || ie(e, p) ? u = !0 : de(e) ? (u = !0, (e.tag !== null || e.anchor !== null) && E(e, "alias node should not have any properties")) : ne(e, p, n === 1) && (u = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && O(e, e.anchor, e.result);
				}
			} else c === 0 && (u = s && se(e, m));
		}
		if (e.tag === null) e.anchor !== null && O(e, e.anchor, e.result);
		else if (e.tag === "?") {
			e.result !== null && e.kind !== "scalar" && E(e, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + e.kind + "\"");
			for (let t = 0, n = e.implicitTypes.length; t < n; t += 1) if (f = e.implicitTypes[t], f.resolve(e.result)) {
				e.result = f.construct(e.result), e.tag = f.tag, e.anchor !== null && O(e, e.anchor, e.result);
				break;
			}
		} else if (e.tag !== "!") {
			if (a.call(e.typeMap[e.kind || "fallback"], e.tag)) f = e.typeMap[e.kind || "fallback"][e.tag];
			else {
				f = null;
				let t = e.typeMap.multi[e.kind || "fallback"];
				for (let n = 0, r = t.length; n < r; n += 1) if (e.tag.slice(0, t[n].tag.length) === t[n].tag) {
					f = t[n];
					break;
				}
			}
			f || E(e, "unknown tag !<" + e.tag + ">"), e.result !== null && f.kind !== e.kind && E(e, "unacceptable node kind for !<" + e.tag + "> tag; it should be \"" + f.kind + "\", not \"" + e.kind + "\""), f.resolve(e.result, e.tag) ? (e.result = f.construct(e.result, e.tag), e.anchor !== null && O(e, e.anchor, e.result)) : E(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
		}
		return e.listener !== null && e.listener("close", e), --e.depth, e.tag !== null || e.anchor !== null || u;
	}
	t(B, "composeNode");
	function pe(e) {
		let t = e.position, n = !1, r;
		for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (r = e.input.charCodeAt(e.position)) !== 0 && (R(e, !0, -1), r = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || r !== 37));) {
			n = !0, r = e.input.charCodeAt(++e.position);
			let t = e.position;
			for (; r !== 0 && !m(r);) r = e.input.charCodeAt(++e.position);
			let i = e.input.slice(t, e.position), o = [];
			for (i.length < 1 && E(e, "directive name must not be less than one character in length"); r !== 0;) {
				for (; p(r);) r = e.input.charCodeAt(++e.position);
				if (r === 35) {
					do
						r = e.input.charCodeAt(++e.position);
					while (r !== 0 && !f(r));
					break;
				}
				if (f(r)) break;
				for (t = e.position; r !== 0 && !m(r);) r = e.input.charCodeAt(++e.position);
				o.push(e.input.slice(t, e.position));
			}
			r !== 0 && L(e), a.call(N, i) ? N[i](e, i, o) : D(e, "unknown document directive \"" + i + "\"");
		}
		if (R(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, R(e, !0, -1)) : n && E(e, "directives end mark is expected"), B(e, e.lineIndent - 1, 4, !1, !0), R(e, !0, -1), e.checkLineBreaks && s.test(e.input.slice(t, e.position)) && D(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && z(e)) {
			e.input.charCodeAt(e.position) === 46 && (e.position += 3, R(e, !0, -1));
			return;
		}
		e.position < e.length - 1 && E(e, "end of the stream or a document separator is expected");
	}
	t(pe, "readDocument");
	function me(e, t) {
		e = String(e), t ||= {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += "\n"), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
		let n = new w(e, t), r = e.indexOf("\0");
		for (r !== -1 && (n.position = r, E(n, "null byte is not allowed in input")), n.input += "\0"; n.input.charCodeAt(n.position) === 32;) n.lineIndent += 1, n.position += 1;
		for (; n.position < n.length - 1;) pe(n);
		return n.documents;
	}
	t(me, "loadDocuments");
	function he(e, t, n) {
		typeof t == "object" && t && n === void 0 && (n = t, t = null);
		let r = me(e, n);
		if (typeof t != "function") return r;
		for (let e = 0, n = r.length; e < n; e += 1) t(r[e]);
	}
	t(he, "loadAll2");
	function ge(e, t) {
		let r = me(e, t);
		if (r.length !== 0) {
			if (r.length === 1) return r[0];
			throw new n("expected a single document in the stream, but found more");
		}
	}
	return t(ge, "load2"), De.loadAll = he, De.load = ge, De;
}
t(Lt, "requireLoader");
var Rt = {}, zt;
function Bt() {
	if (zt) return Rt;
	zt = 1;
	let e = U(), n = W(), r = Ft(), i = Object.prototype.toString, a = Object.prototype.hasOwnProperty, o = 65279, s = {};
	s[0] = "\\0", s[7] = "\\a", s[8] = "\\b", s[9] = "\\t", s[10] = "\\n", s[11] = "\\v", s[12] = "\\f", s[13] = "\\r", s[27] = "\\e", s[34] = "\\\"", s[92] = "\\\\", s[133] = "\\N", s[160] = "\\_", s[8232] = "\\L", s[8233] = "\\P";
	let c = [
		"y",
		"Y",
		"yes",
		"Yes",
		"YES",
		"on",
		"On",
		"ON",
		"n",
		"N",
		"no",
		"No",
		"NO",
		"off",
		"Off",
		"OFF"
	], l = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
	function u(e, t) {
		if (t === null) return {};
		let n = {}, r = Object.keys(t);
		for (let i = 0, o = r.length; i < o; i += 1) {
			let o = r[i], s = String(t[o]);
			o.slice(0, 2) === "!!" && (o = "tag:yaml.org,2002:" + o.slice(2));
			let c = e.compiledTypeMap.fallback[o];
			c && a.call(c.styleAliases, s) && (s = c.styleAliases[s]), n[o] = s;
		}
		return n;
	}
	t(u, "compileStyleMap");
	function d(t) {
		let r, i, a = t.toString(16).toUpperCase();
		if (t <= 255) r = "x", i = 2;
		else if (t <= 65535) r = "u", i = 4;
		else if (t <= 4294967295) r = "U", i = 8;
		else throw new n("code point within a string may not be greater than 0xFFFFFFFF");
		return "\\" + r + e.repeat("0", i - a.length) + a;
	}
	t(d, "encodeHex");
	function f(t) {
		this.schema = t.schema || r, this.indent = Math.max(1, t.indent || 2), this.noArrayIndent = t.noArrayIndent || !1, this.skipInvalid = t.skipInvalid || !1, this.flowLevel = e.isNothing(t.flowLevel) ? -1 : t.flowLevel, this.styleMap = u(this.schema, t.styles || null), this.sortKeys = t.sortKeys || !1, this.lineWidth = t.lineWidth || 80, this.noRefs = t.noRefs || !1, this.noCompatMode = t.noCompatMode || !1, this.condenseFlow = t.condenseFlow || !1, this.quotingType = t.quotingType === "\"" ? 2 : 1, this.forceQuotes = t.forceQuotes || !1, this.replacer = typeof t.replacer == "function" ? t.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
	}
	t(f, "State");
	function p(t, n) {
		let r = e.repeat(" ", n), i = 0, a = "", o = t.length;
		for (; i < o;) {
			let e, n = t.indexOf("\n", i);
			n === -1 ? (e = t.slice(i), i = o) : (e = t.slice(i, n + 1), i = n + 1), e.length && e !== "\n" && (a += r), a += e;
		}
		return a;
	}
	t(p, "indentString");
	function m(t, n) {
		return "\n" + e.repeat(" ", t.indent * n);
	}
	t(m, "generateNextLine");
	function h(e, t) {
		for (let n = 0, r = e.implicitTypes.length; n < r; n += 1) if (e.implicitTypes[n].resolve(t)) return !0;
		return !1;
	}
	t(h, "testImplicitResolving");
	function g(e) {
		return e === 32 || e === 9;
	}
	t(g, "isWhitespace");
	function _(e) {
		return e >= 32 && e <= 126 || e >= 161 && e <= 55295 && e !== 8232 && e !== 8233 || e >= 57344 && e <= 65533 && e !== o || e >= 65536 && e <= 1114111;
	}
	t(_, "isPrintable");
	function v(e) {
		return _(e) && e !== o && e !== 13 && e !== 10;
	}
	t(v, "isNsCharOrWhitespace");
	function y(e, t, n) {
		let r = v(e), i = r && !g(e);
		return (n ? r : r && e !== 44 && e !== 91 && e !== 93 && e !== 123 && e !== 125) && e !== 35 && !(t === 58 && !i) || v(t) && !g(t) && e === 35 || t === 58 && i;
	}
	t(y, "isPlainSafe");
	function b(e) {
		return _(e) && e !== o && !g(e) && e !== 45 && e !== 63 && e !== 58 && e !== 44 && e !== 91 && e !== 93 && e !== 123 && e !== 125 && e !== 35 && e !== 38 && e !== 42 && e !== 33 && e !== 124 && e !== 61 && e !== 62 && e !== 39 && e !== 34 && e !== 37 && e !== 64 && e !== 96;
	}
	t(b, "isPlainSafeFirst");
	function x(e) {
		return !g(e) && e !== 58;
	}
	t(x, "isPlainSafeLast");
	function S(e, t) {
		let n = e.charCodeAt(t), r;
		return n >= 55296 && n <= 56319 && t + 1 < e.length && (r = e.charCodeAt(t + 1), r >= 56320 && r <= 57343) ? (n - 55296) * 1024 + r - 56320 + 65536 : n;
	}
	t(S, "codePointAt");
	function C(e) {
		return /^\n* /.test(e);
	}
	t(C, "needIndentIndicator");
	function w(e, t, n, r, i, a, o, s) {
		let c, l = 0, u = null, d = !1, f = !1, p = r !== -1, m = -1, h = b(S(e, 0)) && x(S(e, e.length - 1));
		if (t || o) for (c = 0; c < e.length; l >= 65536 ? c += 2 : c++) {
			if (l = S(e, c), !_(l)) return 5;
			h &&= y(l, u, s), u = l;
		}
		else {
			for (c = 0; c < e.length; l >= 65536 ? c += 2 : c++) {
				if (l = S(e, c), l === 10) d = !0, p && (f ||= c - m - 1 > r && e[m + 1] !== " ", m = c);
				else if (!_(l)) return 5;
				h &&= y(l, u, s), u = l;
			}
			f ||= p && c - m - 1 > r && e[m + 1] !== " ";
		}
		return !d && !f ? h && !o && !i(e) ? 1 : a === 2 ? 5 : 2 : n > 9 && C(e) ? 5 : o ? a === 2 ? 5 : 2 : f ? 4 : 3;
	}
	t(w, "chooseScalarStyle");
	function T(e, r, i, a, o) {
		e.dump = (function() {
			if (r.length === 0) return e.quotingType === 2 ? "\"\"" : "''";
			if (!e.noCompatMode && (c.indexOf(r) !== -1 || l.test(r))) return e.quotingType === 2 ? "\"" + r + "\"" : "'" + r + "'";
			let s = e.indent * Math.max(1, i), u = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - s), d = a || e.flowLevel > -1 && i >= e.flowLevel;
			function f(t) {
				return h(e, t);
			}
			switch (t(f, "testAmbiguity"), w(r, d, e.indent, u, f, e.quotingType, e.forceQuotes && !a, o)) {
				case 1: return r;
				case 2: return "'" + r.replace(/'/g, "''") + "'";
				case 3: return "|" + E(r, e.indent) + D(p(r, s));
				case 4: return ">" + E(r, e.indent) + D(p(O(r, u), s));
				case 5: return "\"" + A(r) + "\"";
				default: throw new n("impossible error: invalid scalar style");
			}
		})();
	}
	t(T, "writeScalar");
	function E(e, t) {
		let n = C(e) ? String(t) : "", r = e[e.length - 1] === "\n";
		return n + (r && (e[e.length - 2] === "\n" || e === "\n") ? "+" : r ? "" : "-") + "\n";
	}
	t(E, "blockHeader");
	function D(e) {
		return e[e.length - 1] === "\n" ? e.slice(0, -1) : e;
	}
	t(D, "dropEndingNewline");
	function O(e, t) {
		let n = /(\n+)([^\n]*)/g, r = (function() {
			let r = e.indexOf("\n");
			return r = r === -1 ? e.length : r, n.lastIndex = r, k(e.slice(0, r), t);
		})(), i = e[0] === "\n" || e[0] === " ", a, o;
		for (; o = n.exec(e);) {
			let e = o[1], n = o[2];
			a = n[0] === " ", r += e + (!i && !a && n !== "" ? "\n" : "") + k(n, t), i = a;
		}
		return r;
	}
	t(O, "foldString");
	function k(e, t) {
		if (e === "" || e[0] === " ") return e;
		let n = / [^ ]/g, r, i = 0, a, o = 0, s = 0, c = "";
		for (; r = n.exec(e);) s = r.index, s - i > t && (a = o > i ? o : s, c += "\n" + e.slice(i, a), i = a + 1), o = s;
		return c += "\n", e.length - i > t && o > i ? c += e.slice(i, o) + "\n" + e.slice(o + 1) : c += e.slice(i), c.slice(1);
	}
	t(k, "foldLine");
	function A(e) {
		let t = "", n = 0;
		for (let r = 0; r < e.length; n >= 65536 ? r += 2 : r++) {
			n = S(e, r);
			let i = s[n];
			!i && _(n) ? (t += e[r], n >= 65536 && (t += e[r + 1])) : t += i || d(n);
		}
		return t;
	}
	t(A, "escapeString");
	function ee(e, t, n) {
		let r = "", i = e.tag;
		for (let i = 0, a = n.length; i < a; i += 1) {
			let a = n[i];
			e.replacer && (a = e.replacer.call(n, String(i), a)), (F(e, t, a, !1, !1) || a === void 0 && F(e, t, null, !1, !1)) && (r !== "" && (r += "," + (e.condenseFlow ? "" : " ")), r += e.dump);
		}
		e.tag = i, e.dump = "[" + r + "]";
	}
	t(ee, "writeFlowSequence");
	function j(e, t, n, r) {
		let i = "", a = e.tag;
		for (let a = 0, o = n.length; a < o; a += 1) {
			let o = n[a];
			e.replacer && (o = e.replacer.call(n, String(a), o)), (F(e, t + 1, o, !0, !0, !1, !0) || o === void 0 && F(e, t + 1, null, !0, !0, !1, !0)) && ((!r || i !== "") && (i += m(e, t)), e.dump && e.dump.charCodeAt(0) === 10 ? i += "-" : i += "- ", i += e.dump);
		}
		e.tag = a, e.dump = i || "[]";
	}
	t(j, "writeBlockSequence");
	function M(e, t, n) {
		let r = "", i = e.tag, a = Object.keys(n);
		for (let i = 0, o = a.length; i < o; i += 1) {
			let o = "";
			r !== "" && (o += ", "), e.condenseFlow && (o += "\"");
			let s = a[i], c = n[s];
			e.replacer && (c = e.replacer.call(n, s, c)), F(e, t, s, !1, !1) && (e.dump.length > 1024 && (o += "? "), o += e.dump + (e.condenseFlow ? "\"" : "") + ":" + (e.condenseFlow ? "" : " "), F(e, t, c, !1, !1) && (o += e.dump, r += o));
		}
		e.tag = i, e.dump = "{" + r + "}";
	}
	t(M, "writeFlowMapping");
	function N(e, t, r, i) {
		let a = "", o = e.tag, s = Object.keys(r);
		if (e.sortKeys === !0) s.sort();
		else if (typeof e.sortKeys == "function") s.sort(e.sortKeys);
		else if (e.sortKeys) throw new n("sortKeys must be a boolean or a function");
		for (let n = 0, o = s.length; n < o; n += 1) {
			let o = "";
			(!i || a !== "") && (o += m(e, t));
			let c = s[n], l = r[c];
			if (e.replacer && (l = e.replacer.call(r, c, l)), !F(e, t + 1, c, !0, !0, !0)) continue;
			let u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024;
			u && (e.dump && e.dump.charCodeAt(0) === 10 ? o += "?" : o += "? "), o += e.dump, u && (o += m(e, t)), F(e, t + 1, l, !0, u) && (e.dump && e.dump.charCodeAt(0) === 10 ? o += ":" : o += ": ", o += e.dump, a += o);
		}
		e.tag = o, e.dump = a || "{}";
	}
	t(N, "writeBlockMapping");
	function P(e, t, r) {
		let o = r ? e.explicitTypes : e.implicitTypes;
		for (let s = 0, c = o.length; s < c; s += 1) {
			let c = o[s];
			if ((c.instanceOf || c.predicate) && (!c.instanceOf || typeof t == "object" && t instanceof c.instanceOf) && (!c.predicate || c.predicate(t))) {
				if (e.tag = r ? c.multi && c.representName ? c.representName(t) : c.tag : "?", c.represent) {
					let r = e.styleMap[c.tag] || c.defaultStyle, o;
					if (i.call(c.represent) === "[object Function]") o = c.represent(t, r);
					else if (a.call(c.represent, r)) o = c.represent[r](t, r);
					else throw new n("!<" + c.tag + "> tag resolver accepts not \"" + r + "\" style");
					e.dump = o;
				}
				return !0;
			}
		}
		return !1;
	}
	t(P, "detectType");
	function F(e, t, r, a, o, s, c) {
		e.tag = null, e.dump = r, P(e, r, !1) || P(e, r, !0);
		let l = i.call(e.dump), u = a;
		a &&= e.flowLevel < 0 || e.flowLevel > t;
		let d = l === "[object Object]" || l === "[object Array]", f, p;
		if (d && (f = e.duplicates.indexOf(r), p = f !== -1), (e.tag !== null && e.tag !== "?" || p || e.indent !== 2 && t > 0) && (o = !1), p && e.usedDuplicates[f]) e.dump = "*ref_" + f;
		else {
			if (d && p && !e.usedDuplicates[f] && (e.usedDuplicates[f] = !0), l === "[object Object]") a && Object.keys(e.dump).length !== 0 ? (N(e, t, e.dump, o), p && (e.dump = "&ref_" + f + e.dump)) : (M(e, t, e.dump), p && (e.dump = "&ref_" + f + " " + e.dump));
			else if (l === "[object Array]") a && e.dump.length !== 0 ? (e.noArrayIndent && !c && t > 0 ? j(e, t - 1, e.dump, o) : j(e, t, e.dump, o), p && (e.dump = "&ref_" + f + e.dump)) : (ee(e, t, e.dump), p && (e.dump = "&ref_" + f + " " + e.dump));
			else if (l === "[object String]") e.tag !== "?" && T(e, e.dump, t, s, u);
			else if (l === "[object Undefined]") return !1;
			else {
				if (e.skipInvalid) return !1;
				throw new n("unacceptable kind of an object to dump " + l);
			}
			if (e.tag !== null && e.tag !== "?") {
				let t = encodeURI(e.tag[0] === "!" ? e.tag.slice(1) : e.tag).replace(/!/g, "%21");
				t = e.tag[0] === "!" ? "!" + t : t.slice(0, 18) === "tag:yaml.org,2002:" ? "!!" + t.slice(18) : "!<" + t + ">", e.dump = t + " " + e.dump;
			}
		}
		return !0;
	}
	t(F, "writeNode");
	function I(e, t) {
		let n = [], r = [];
		L(e, n, r);
		let i = r.length;
		for (let e = 0; e < i; e += 1) t.duplicates.push(n[r[e]]);
		t.usedDuplicates = Array(i);
	}
	t(I, "getDuplicateReferences");
	function L(e, t, n) {
		if (typeof e == "object" && e) {
			let r = t.indexOf(e);
			if (r !== -1) n.indexOf(r) === -1 && n.push(r);
			else if (t.push(e), Array.isArray(e)) for (let r = 0, i = e.length; r < i; r += 1) L(e[r], t, n);
			else {
				let r = Object.keys(e);
				for (let i = 0, a = r.length; i < a; i += 1) L(e[r[i]], t, n);
			}
		}
	}
	t(L, "inspectNode");
	function R(e, t) {
		t ||= {};
		let n = new f(t);
		n.noRefs || I(e, n);
		let r = e;
		return n.replacer && (r = n.replacer.call({ "": r }, "", r)), F(n, 0, r, !0, !0) ? n.dump + "\n" : "";
	}
	return t(R, "dump2"), Rt.dump = R, Rt;
}
t(Bt, "requireDumper");
var Vt;
function Ht() {
	if (Vt) return V;
	Vt = 1;
	let e = Lt(), n = Bt();
	function r(e, t) {
		return function() {
			throw Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
		};
	}
	return t(r, "renamed"), V.Type = G(), V.Schema = Re(), V.FAILSAFE_SCHEMA = Xe(), V.JSON_SCHEMA = dt(), V.CORE_SCHEMA = mt(), V.DEFAULT_SCHEMA = Ft(), V.load = e.load, V.loadAll = e.loadAll, V.dump = n.dump, V.YAMLException = W(), V.types = {
		binary: Ct(),
		float: ct(),
		map: qe(),
		null: $e(),
		pairs: kt(),
		set: Mt(),
		timestamp: _t(),
		bool: nt(),
		int: at(),
		merge: bt(),
		omap: Et(),
		seq: We(),
		str: Ve()
	}, V.safeLoad = r("safeLoad", "load"), V.safeLoadAll = r("safeLoadAll", "loadAll"), V.safeDump = r("safeDump", "dump"), V;
}
t(Ht, "requireJsYaml");
var { Type: Ut, Schema: Wt, FAILSAFE_SCHEMA: Gt, JSON_SCHEMA: Kt, CORE_SCHEMA: qt, DEFAULT_SCHEMA: Jt, load: Yt, loadAll: Xt, dump: Zt, YAMLException: Qt, types: $t, safeLoad: en, safeLoadAll: tn, safeDump: nn } = /* @__PURE__ */ Ee(Ht()), rn = "comm", an = "rule", on = "decl", sn = "@import", cn = "@namespace", ln = "@keyframes", un = "@layer", dn = Math.abs, fn = String.fromCharCode;
function pn(e) {
	return e.trim();
}
function mn(e, t, n) {
	return e.replace(t, n);
}
function K(e, t) {
	return e.charCodeAt(t) | 0;
}
function hn(e, t, n) {
	return e.slice(t, n);
}
function q(e) {
	return e.length;
}
function gn(e) {
	return e.length;
}
function _n(e, t) {
	return t.push(e), e;
}
//#endregion
//#region ../../../work/node_modules/stylis/src/Tokenizer.js
var vn = 1, yn = 1, bn = 0, J = 0, Y = 0, xn = "";
function Sn(e, t, n, r, i, a, o, s) {
	return {
		value: e,
		root: t,
		parent: n,
		type: r,
		props: i,
		children: a,
		line: vn,
		column: yn,
		length: o,
		return: "",
		siblings: s
	};
}
function Cn() {
	return Y;
}
function wn() {
	return Y = J > 0 ? K(xn, --J) : 0, yn--, Y === 10 && (yn = 1, vn--), Y;
}
function X() {
	return Y = J < bn ? K(xn, J++) : 0, yn++, Y === 10 && (yn = 1, vn++), Y;
}
function Z() {
	return K(xn, J);
}
function Tn() {
	return J;
}
function En(e, t) {
	return hn(xn, e, t);
}
function Dn(e) {
	switch (e) {
		case 0:
		case 9:
		case 10:
		case 13:
		case 32: return 5;
		case 33:
		case 43:
		case 44:
		case 47:
		case 62:
		case 64:
		case 126:
		case 59:
		case 123:
		case 125: return 4;
		case 58: return 3;
		case 34:
		case 39:
		case 40:
		case 91: return 2;
		case 41:
		case 93: return 1;
	}
	return 0;
}
function On(e) {
	return vn = yn = 1, bn = q(xn = e), J = 0, [];
}
function kn(e) {
	return xn = "", e;
}
function An(e) {
	return pn(En(J - 1, Nn(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function jn(e) {
	for (; (Y = Z()) && Y < 33;) X();
	return Dn(e) > 2 || Dn(Y) > 3 ? "" : " ";
}
function Mn(e, t) {
	for (; --t && X() && !(Y < 48 || Y > 102 || Y > 57 && Y < 65 || Y > 70 && Y < 97););
	return En(e, Tn() + (t < 6 && Z() == 32 && X() == 32));
}
function Nn(e) {
	for (; X();) switch (Y) {
		case e: return J;
		case 34:
		case 39:
			e !== 34 && e !== 39 && Nn(Y);
			break;
		case 40:
			e === 41 && Nn(e);
			break;
		case 92: X();
	}
	return J;
}
function Pn(e, t) {
	for (; X() && e + Y !== 57 && (e + Y !== 84 || Z() !== 47););
	return "/*" + En(t, J - 1) + "*" + fn(e === 47 ? e : X());
}
function Fn(e) {
	for (; !Dn(Z());) X();
	return En(e, J);
}
//#endregion
//#region ../../../work/node_modules/stylis/src/Parser.js
function In(e) {
	return kn(Ln("", null, null, null, [""], e = On(e), 0, [0], e));
}
function Ln(e, t, n, r, i, a, o, s, c) {
	for (var l = 0, u = 0, d = o, f = 0, p = 0, m = 0, h = 1, g = 1, _ = 1, v = 0, y = 0, b = "", x = i, S = a, C = r, w = b; g;) switch (m = y, y = X()) {
		case 40:
			m != 108 && K(w, d - 1) == 58 ? (v++, w += "(") : w += An(y);
			break;
		case 41:
			v--, w += ")";
			break;
		case 34:
		case 39:
		case 91:
			w += An(y);
			break;
		case 9:
		case 10:
		case 13:
		case 32:
			if (v > 0) {
				w += fn(y);
				break;
			}
			w += jn(m);
			break;
		case 92:
			w += Mn(Tn() - 1, 7);
			continue;
		case 47:
			switch (Z()) {
				case 42:
				case 47:
					_n(zn(Pn(X(), Tn()), t, n, c), c), (Dn(m || 1) == 5 || Dn(Z() || 1) == 5) && q(w) && hn(w, -1, void 0) !== " " && (w += " ");
					break;
				default: w += "/";
			}
			break;
		case 123 * h: s[l++] = q(w) * _;
		case 125 * h:
		case 59:
		case 0:
			if (v > 0 && y) {
				w += fn(y);
				break;
			}
			switch (y) {
				case 0:
				case 125: g = 0;
				case 59 + u:
					_ == -1 && (w = mn(w, /\f/g, "")), p > 0 && (q(w) - d || h === 0) && _n(p > 32 ? Bn(w + ";", r, n, d - 1, c) : Bn(mn(w, " ", "") + ";", r, n, d - 2, c), c);
					break;
				case 59: w += ";";
				default: if (_n(C = Rn(w, t, n, l, u, i, s, b, x = [], S = [], d, a), a), y === 123) {
					if (u === 0) Ln(w, t, C, C, x, a, d, s, S);
					else {
						switch (f) {
							case 99: if (K(w, 3) === 110) break;
							case 108: if (K(w, 2) === 97) break;
							default: u = 0;
							case 100:
							case 109:
							case 115:
						}
						u ? Ln(e, C, C, r && _n(Rn(e, C, C, 0, 0, i, s, b, i, x = [], d, S), S), i, S, d, s, r ? x : S) : Ln(w, C, C, C, [""], S, 0, s, S);
					}
				}
			}
			l = u = p = 0, h = _ = 1, b = w = "", d = o;
			break;
		case 58: d = 1 + q(w), p = m;
		default:
			if (h < 1) {
				if (y == 123) --h;
				else if (y == 125 && h++ == 0 && wn() == 125) continue;
			}
			switch (w += fn(y), y * h) {
				case 38:
					_ = u > 0 ? 1 : (w += "\f", -1);
					break;
				case 44:
					if (v > 0) break;
					s[l++] = (q(w) - 1) * _, _ = 1;
					break;
				case 64:
					Z() === 45 && (w += An(X())), f = Z(), u = d = q(b = w += Fn(Tn())), y++;
					break;
				case 45: m === 45 && q(w) == 2 && (h = 0);
			}
	}
	return a;
}
function Rn(e, t, n, r, i, a, o, s, c, l, u, d) {
	for (var f = i - 1, p = i === 0 ? a : [""], m = gn(p), h = 0, g = 0, _ = 0; h < r; ++h) for (var v = 0, y = hn(e, f + 1, f = dn(g = o[h])), b = e; v < m; ++v) (b = pn(g > 0 ? p[v] + " " + y : mn(y, /&\f/g, p[v]))) && (c[_++] = b);
	return Sn(e, t, n, i === 0 ? an : s, c, l, u, d);
}
function zn(e, t, n, r) {
	return Sn(e, t, n, rn, fn(Cn()), hn(e, 2, -2), 0, r);
}
function Bn(e, t, n, r, i) {
	return Sn(e, t, n, on, hn(e, 0, r), hn(e, r + 1, -1), r, i);
}
//#endregion
//#region ../../../work/node_modules/stylis/src/Serializer.js
function Vn(e, t) {
	for (var n = "", r = 0; r < e.length; r++) n += t(e[r], r, e, t) || "";
	return n;
}
function Hn(e, t, n, r) {
	switch (e.type) {
		case un: if (e.children.length) break;
		case sn:
		case cn:
		case on: return e.return = e.return || e.value;
		case rn: return "";
		case ln: return e.return = e.value + "{" + Vn(e.children, r) + "}";
		case an: if (!q(e.value = e.props.join(","))) return "";
	}
	return q(n = Vn(e.children, r)) ? e.return = e.value + "{" + n + "}" : "";
}
//#endregion
//#region ../../../work/node_modules/stylis/src/Middleware.js
function Un(e) {
	var t = gn(e);
	return function(n, r, i, a) {
		for (var o = "", s = 0; s < t; s++) o += e[s](n, r, i, a) || "";
		return o;
	};
}
//#endregion
//#region ../../../work/node_modules/mermaid/dist/mermaid.core.mjs
var Wn = "c4", Gn = {
	id: Wn,
	detector: /* @__PURE__ */ t((e) => /^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./c4Diagram-CRA5TL53-ocrCWY-R.js");
		return {
			id: Wn,
			diagram: e
		};
	}, "loader")
}, Kn = "flowchart-v2", qn = {
	id: Kn,
	detector: /* @__PURE__ */ t((e) => /^\s*(graph|flowchart)/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./flowDiagram-OXPTDLAJ-7HcAV74J.js");
		return {
			id: Kn,
			diagram: e
		};
	}, "loader")
}, Jn = "agentflow", Yn = {
	id: Jn,
	detector: /* @__PURE__ */ t((e) => /^\s*agentflow-beta\b/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-2UJZ2QOL-CTgM2GiR.js");
		return {
			id: Jn,
			diagram: e
		};
	}, "loader")
}, Xn = "swimlane", Zn = {
	id: Xn,
	detector: /* @__PURE__ */ t((e) => /^\s*swimlane-beta\b/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./swimlanesDiagram-K3J5GTZL-Bs1JffEk.js");
		return {
			id: Xn,
			diagram: e
		};
	}, "loader")
}, Qn = "er", $n = {
	id: Qn,
	detector: /* @__PURE__ */ t((e) => /^\s*erDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./erDiagram-O2IAPWRE-CgR9jEEG.js");
		return {
			id: Qn,
			diagram: e
		};
	}, "loader")
}, er = "gitGraph", tr = {
	id: er,
	detector: /* @__PURE__ */ t((e) => /^\s*gitGraph/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./gitGraphDiagram-XJZIOB7I-VplVscpY.js");
		return {
			id: er,
			diagram: e
		};
	}, "loader")
}, nr = "gantt", rr = {
	id: nr,
	detector: /* @__PURE__ */ t((e) => /^\s*gantt/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./ganttDiagram-R7TSEDQI-7dYI57mS.js");
		return {
			id: nr,
			diagram: e
		};
	}, "loader")
}, ir = "info", ar = {
	id: ir,
	detector: /* @__PURE__ */ t((e) => /^\s*info/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./infoDiagram-5W2HQ5XZ-BY-R-uOz.js");
		return {
			id: ir,
			diagram: e
		};
	}, "loader")
}, or = "pie", sr = {
	id: or,
	detector: /* @__PURE__ */ t((e) => /^\s*pie/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./pieDiagram-CAPJLFHJ-CXp3Ww-Q.js");
		return {
			id: or,
			diagram: e
		};
	}, "loader")
}, cr = "quadrantChart", lr = {
	id: cr,
	detector: /* @__PURE__ */ t((e) => /^\s*quadrantChart/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./quadrantDiagram-GDMTTRAM-DDziN6mn.js");
		return {
			id: cr,
			diagram: e
		};
	}, "loader")
}, ur = "xychart", dr = {
	id: ur,
	detector: /* @__PURE__ */ t((e) => /^\s*xychart(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./xychartDiagram-TAQBALBS-D_OrIS69.js");
		return {
			id: ur,
			diagram: e
		};
	}, "loader")
}, fr = "requirement", pr = {
	id: fr,
	detector: /* @__PURE__ */ t((e) => /^\s*requirement(Diagram)?/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./requirementDiagram-X7JNWC4A-dqGShHED.js");
		return {
			id: fr,
			diagram: e
		};
	}, "loader")
}, mr = "sequence", hr = {
	id: mr,
	detector: /* @__PURE__ */ t((e) => /^\s*sequenceDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./sequenceDiagram-ZO4K6R2Y-Dz7H4u49.js");
		return {
			id: mr,
			diagram: e
		};
	}, "loader")
}, gr = "classDiagram", _r = {
	id: gr,
	detector: /* @__PURE__ */ t((e) => /^\s*classDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./classDiagram-v2-K4WV4PDN-I43yuYQ3.js");
		return {
			id: gr,
			diagram: e
		};
	}, "loader")
}, vr = "stateDiagram", yr = {
	id: vr,
	detector: /* @__PURE__ */ t((e) => /^\s*stateDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./stateDiagram-v2-TBUQTH76-DnnMVDp_.js");
		return {
			id: vr,
			diagram: e
		};
	}, "loader")
}, br = "journey", xr = {
	id: br,
	detector: /* @__PURE__ */ t((e) => /^\s*journey/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./journeyDiagram-COXZFDF6-B17HuoCZ.js");
		return {
			id: br,
			diagram: e
		};
	}, "loader")
}, Sr = 4, Cr = 75, wr = /* @__PURE__ */ t((e) => {
	let t = [];
	for (let n of e.split(/\s+/)) {
		let e = [...n];
		for (; e.length > Cr;) t.push(e.slice(0, Cr).join("")), e = e.slice(Cr);
		e.length > 0 && t.push(e.join(""));
	}
	let n = [], r = "";
	for (let e of t) {
		let t = r ? `${r} ${e}` : e;
		[...t].length > Cr ? (n.push(r), r = e) : r = t;
	}
	if (r && n.push(r), n.length > Sr) {
		n.length = Sr;
		let e = n[Sr - 1] ?? "";
		n[Sr - 1] = `${[...e].slice(0, Cr - 3).join("")}...`;
	}
	return n;
}, "wrapErrorMessage"), Tr = { draw: /* @__PURE__ */ t((e, t, n, i) => {
	r.debug("rendering svg for syntax error\n");
	let a = he(t), o = a.append("g"), s = wr(i?.db.getErrorMessage?.() ?? ""), c = s.length > 0 ? 500 + s.length * 56 : 512;
	a.attr("viewBox", `0 0 2412 ${c}`), y(a, 100, c, !0), o.append("path").attr("class", "error-icon").attr("d", "m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z"), o.append("path").attr("class", "error-icon").attr("d", "m459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z"), o.append("path").attr("class", "error-icon").attr("d", "m340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z"), o.append("path").attr("class", "error-icon").attr("d", "m400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z"), o.append("path").attr("class", "error-icon").attr("d", "m496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z"), o.append("path").attr("class", "error-icon").attr("d", "m436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z"), o.append("text").attr("class", "error-text").attr("x", 1440).attr("y", 250).attr("font-size", "150px").style("text-anchor", "middle").text("Syntax error in text"), o.append("text").attr("class", "error-text").attr("x", 1250).attr("y", 400).attr("font-size", "100px").style("text-anchor", "middle").text(`mermaid version ${n}`), s.forEach((e, t) => {
		o.append("text").attr("class", "error-text").attr("x", 1440).attr("y", 510 + t * 56).attr("font-size", "42px").style("text-anchor", "middle").text(e);
	});
}, "draw") }, Er = Tr, Dr, Or = {
	db: {
		clear() {
			Dr = void 0;
		},
		setErrorMessage(e) {
			Dr = e;
		},
		getErrorMessage() {
			return Dr;
		}
	},
	renderer: Tr,
	parser: { parse: /* @__PURE__ */ t(() => {}, "parse") }
}, kr = "flowchart-elk", Ar = {
	id: kr,
	detector: /* @__PURE__ */ t((e, t = {}) => /^\s*flowchart-elk/.test(e) ? (t.layout = "elk", !0) : !1, "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./flowDiagram-OXPTDLAJ-7HcAV74J.js");
		return {
			id: kr,
			diagram: e
		};
	}, "loader")
}, jr = "timeline", Mr = {
	id: jr,
	detector: /* @__PURE__ */ t((e) => /^\s*timeline/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./timeline-definition-YOQAKGHF-CGPHqzfi.js");
		return {
			id: jr,
			diagram: e
		};
	}, "loader")
}, Nr = "mindmap", Pr = {
	id: Nr,
	detector: /* @__PURE__ */ t((e) => /^\s*mindmap/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./mindmap-definition-LZFPQGKD-B58tYwdZ.js");
		return {
			id: Nr,
			diagram: e
		};
	}, "loader")
}, Fr = "kanban", Ir = {
	id: Fr,
	detector: /* @__PURE__ */ t((e) => /^\s*kanban/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./kanban-definition-P3RFRI5V-yU6scC_I.js");
		return {
			id: Fr,
			diagram: e
		};
	}, "loader")
}, Lr = "sankey", Rr = {
	id: Lr,
	detector: /* @__PURE__ */ t((e) => /^\s*sankey(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./sankeyDiagram-UM26HJRW-CeNMzvE-.js");
		return {
			id: Lr,
			diagram: e
		};
	}, "loader")
}, zr = "packet", Br = {
	id: zr,
	detector: /* @__PURE__ */ t((e) => /^\s*packet(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-UMYRVEAY-PusZN-Kl.js");
		return {
			id: zr,
			diagram: e
		};
	}, "loader")
}, Vr = "radar", Hr = {
	id: Vr,
	detector: /* @__PURE__ */ t((e) => /^\s*radar-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-YEKJPTXX-4bFPAZF6.js");
		return {
			id: Vr,
			diagram: e
		};
	}, "loader")
}, Ur = "block", Wr = {
	id: Ur,
	detector: /* @__PURE__ */ t((e) => /^\s*block(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./blockDiagram-E7TT5TSB-BPy-WtCe.js");
		return {
			id: Ur,
			diagram: e
		};
	}, "loader")
}, Gr = "treeView", Kr = {
	id: Gr,
	detector: /* @__PURE__ */ t((e) => /^\s*treeView-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-PFPMY2P6-CE3cxRyk.js");
		return {
			id: Gr,
			diagram: e
		};
	}, "loader")
}, qr = "architecture", Jr = {
	id: qr,
	detector: /* @__PURE__ */ t((e) => /^\s*architecture/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./architectureDiagram-47P4ROYG-B5-CT08G.js");
		return {
			id: qr,
			diagram: e
		};
	}, "loader")
}, Yr = "eventmodeling", Xr = {
	id: Yr,
	detector: /* @__PURE__ */ t((e) => /^\s*eventmodeling/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-ZIFT7M5P-BIyFVhur.js");
		return {
			id: Yr,
			diagram: e
		};
	}, "loader")
}, Zr = "ishikawa", Qr = {
	id: Zr,
	detector: /* @__PURE__ */ t((e) => /^\s*ishikawa(-beta)?\b/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./ishikawaDiagram-K3B6WC7H-C7QyjAHP.js");
		return {
			id: Zr,
			diagram: e
		};
	}, "loader")
}, $r = "venn", ei = {
	id: $r,
	detector: /* @__PURE__ */ t((e) => /^\s*venn-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./vennDiagram-BLWOH2XV-ChtCWgb3.js");
		return {
			id: $r,
			diagram: e
		};
	}, "loader")
}, ti = "treemap", ni = {
	id: ti,
	detector: /* @__PURE__ */ t((e) => /^\s*treemap/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./diagram-OVF4WLC6-DQKiPVC_.js");
		return {
			id: ti,
			diagram: e
		};
	}, "loader")
}, ri = "usecase", ii = {
	id: ri,
	detector: /* @__PURE__ */ t((e) => /^\s*usecase-beta(?:\s|$)/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./usecaseDiagram-VIAY4XPW--PJCpcty.js");
		return {
			id: ri,
			diagram: e
		};
	}, "loader")
}, ai = "wardley", oi = {
	id: ai,
	detector: /* @__PURE__ */ t((e) => /^\s*wardley-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./wardleyDiagram-YMQ3BMBF-D50979YZ.js");
		return {
			id: ai,
			diagram: e
		};
	}, "loader")
}, si = "cynefin", ci = {
	id: si,
	detector: /* @__PURE__ */ t((e) => /^\s*cynefin-beta(?:[\s:]|$)/.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./cynefinDiagram-3GCD6N5R-u8z-_zF0.js");
		return {
			id: si,
			diagram: e
		};
	}, "loader")
}, li = "railroad", ui = {
	id: li,
	detector: /* @__PURE__ */ t((e) => /^\s*railroad-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./railroadDiagram-SM67HX2B-F40jrAuM.js");
		return {
			id: li,
			diagram: e
		};
	}, "loader")
}, di = "railroadEbnf", fi = {
	id: di,
	detector: /* @__PURE__ */ t((e) => /^\s*railroad-ebnf-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./ebnfDiagram-VR2GEFS7-CRFG10Z0.js");
		return {
			id: di,
			diagram: e
		};
	}, "loader")
}, pi = "railroadAbnf", mi = {
	id: pi,
	detector: /* @__PURE__ */ t((e) => /^\s*railroad-abnf-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./abnfDiagram-YUKMZFIV-BIkzt5VZ.js");
		return {
			id: pi,
			diagram: e
		};
	}, "loader")
}, hi = "railroadPeg", gi = {
	id: hi,
	detector: /* @__PURE__ */ t((e) => /^\s*railroad-peg-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ t(async () => {
		let { diagram: e } = await import("./pegDiagram-BGZESJAR-BYgbaLGE.js");
		return {
			id: hi,
			diagram: e
		};
	}, "loader")
}, _i = !1, vi = /* @__PURE__ */ t(() => {
	_i || (_i = !0, u("error", Or, (e) => e.toLowerCase().trim() === "error"), u("---", {
		db: { clear: /* @__PURE__ */ t(() => {}, "clear") },
		styles: {},
		renderer: { draw: /* @__PURE__ */ t(() => {}, "draw") },
		parser: { parse: /* @__PURE__ */ t(() => {
			throw Error("Diagrams beginning with --- are not valid. If you were trying to use a YAML front-matter, please ensure that you've correctly opened and closed the YAML front-matter with un-indented `---` blocks");
		}, "parse") },
		init: /* @__PURE__ */ t(() => null, "init")
	}, (e) => e.toLowerCase().trimStart().startsWith("---")), d(Ar, Pr, Jr), d(Yn, Gn, Ir, _r, $n, rr, ar, sr, pr, hr, Zn, qn, Mr, tr, yr, xr, lr, Rr, Br, dr, Wr, Xr, Kr, Hr, Qr, ni, ui, fi, mi, gi, ei, oi, ci, ii));
}, "addDiagrams"), yi = /* @__PURE__ */ t(async () => {
	r.debug("Loading registered diagrams");
	let e = (await Promise.allSettled(Object.entries(w).map(async ([e, { detector: t, loader: n }]) => {
		if (n) try {
			j(e);
		} catch {
			try {
				let { diagram: e, id: r } = await n();
				u(r, e, t);
			} catch (t) {
				throw r.error(`Failed to load external diagram with key ${e}. Removing from detectors.`), delete w[e], t;
			}
		}
	}))).filter((e) => e.status === "rejected");
	if (e.length > 0) {
		r.error(`Failed to load ${e.length} external diagrams`);
		for (let t of e) r.error(t);
		throw Error(`Failed to load ${e.length} external diagrams`);
	}
}, "loadRegisteredDiagrams"), bi = "graphics-document document";
function xi(e, t) {
	e.attr("role", bi), t !== "" && e.attr("aria-roledescription", t);
}
t(xi, "setA11yDiagramInfo");
function Si(e, t, n, r) {
	if (e.insert !== void 0) {
		if (n) {
			let t = `chart-desc-${r}`;
			e.attr("aria-describedby", t), e.insert("desc", ":first-child").attr("id", t).text(n);
		}
		if (t) {
			let n = `chart-title-${r}`;
			e.attr("aria-labelledby", n), e.insert("title", ":first-child").attr("id", n).text(t);
		}
	}
}
t(Si, "addSVGa11yTitleDescription");
var Ci = class e {
	constructor(e, t, n, r, i) {
		this.type = e, this.text = t, this.db = n, this.parser = r, this.renderer = i;
	}
	static {
		t(this, "Diagram");
	}
	static async fromText(t, n = {}) {
		let i = typeof t == "string" ? {
			raw: t,
			cleaned: t
		} : t, a = M(), o = E(i.cleaned, a);
		try {
			j(o);
		} catch {
			let e = p(o);
			if (!e) throw new k(`Diagram ${o} not found.`);
			let { id: t, diagram: n } = await e();
			u(t, n);
		}
		let { db: s, parser: c, renderer: l, init: d } = j(o);
		c.parser && (c.parser.yy = s), s.clear?.(), d?.(a), n.title && s.setDiagramTitle?.(n.title);
		let f = i.cleaned;
		if (s.preserveCommentsWhenParsing && i.withComments) {
			let e = a.maxTextSize ?? b.maxTextSize;
			i.withComments.length > e ? r.warn(`Comment-preserving source exceeds maxTextSize (${i.withComments.length} > ${e}); parsing the comment-stripped text instead. Reported source positions will not account for comment lines.`) : f = i.withComments;
		}
		let m = re(f) + "\n";
		return i.frontmatterLineOffset && s.setFrontmatterLineOffset?.(i.frontmatterLineOffset), await c.parse(m), new e(o, m, s, c, l);
	}
	async render(e, t) {
		await this.renderer.draw(this.text, e, t, this);
	}
	getParser() {
		return this.parser;
	}
	getType() {
		return this.type;
	}
}, wi = [], Ti = /* @__PURE__ */ t(() => {
	wi.forEach((e) => {
		e();
	}), wi = [];
}, "attachFunctions"), Ei = /* @__PURE__ */ t((e) => e.replace(/^\s*%%(?!{)[^\n]+\n?/gm, "").trimStart(), "cleanupComments");
function Di(e) {
	let t = S(e);
	if (!t) return {
		text: e,
		metadata: {}
	};
	let n = t.indent, r = Yt(n ? t.body.split("\n").map((e) => e.startsWith(n) ? e.slice(n.length) : e).join("\n") : t.body, { schema: Kt }) ?? {};
	r = typeof r == "object" && !Array.isArray(r) ? r : {};
	let i = {};
	return r.displayMode && (i.displayMode = r.displayMode.toString()), r.title && (i.title = r.title.toString()), r.config && (i.config = r.config), {
		text: e.slice(t.length),
		metadata: i
	};
}
t(Di, "extractFrontMatter");
var Oi = /* @__PURE__ */ t((e) => e.replace(/\r\n?/g, "\n").replace(/<(\w+)([^>]*)>/g, (e, t, n) => "<" + t + n.replace(/="([^"]*)"/g, "='$1'") + ">"), "cleanupText"), ki = /* @__PURE__ */ t((e) => {
	let { text: t, metadata: n } = Di(e), { displayMode: r, title: i, config: a = {} } = n;
	return r && (a.gantt ||= {}, a.gantt.displayMode = r), {
		title: i,
		config: a,
		text: t
	};
}, "processFrontmatter"), Ai = /* @__PURE__ */ t((e) => {
	let t = F.detectInit(e) ?? {}, n = F.detectDirective(e, "wrap");
	return Array.isArray(n) ? t.wrap = n.some(({ type: e }) => e === "wrap") : n?.type === "wrap" && (t.wrap = !0), {
		text: z(e),
		directive: t
	};
}, "processDirectives");
function ji(e) {
	let t = e, n = Oi(e), r = ki(n), i = Ai(r.text), a = te(r.config, i.directive), o = i.text;
	return {
		code: {
			raw: t,
			cleaned: Ei(o),
			withComments: o,
			frontmatterLineOffset: n.length > r.text.length ? (n.substring(0, n.length - r.text.length).match(/\n/g) ?? []).length : 0
		},
		title: r.title,
		config: a
	};
}
t(ji, "preprocessDiagram");
function Mi(e) {
	let t = new TextEncoder().encode(e), n = Array.from(t, (e) => String.fromCodePoint(e)).join("");
	return btoa(n);
}
t(Mi, "toBase64");
var Ni = 5e4, Pi = "graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa", Fi = "sandbox", Ii = "loose", Li = "http://www.w3.org/2000/svg", Ri = "http://www.w3.org/1999/xlink", zi = "http://www.w3.org/1999/xhtml", Bi = "100%", Vi = "100%", Hi = "border:0;margin:0;", Ui = "margin:0", Wi = "allow-top-navigation-by-user-activation allow-popups", Gi = "The \"iframe\" tag is not supported by your browser.", Ki = ["foreignobject"], qi = ["dominant-baseline"];
function Ji(e) {
	let t = ji(e);
	o();
	let n;
	try {
		n = E(t.code.cleaned, M());
	} catch {
		n = void 0;
	}
	return c(n), T(t.config ?? {}), t;
}
t(Ji, "processAndSetConfigs");
async function Yi(e, t) {
	vi();
	try {
		let { code: t, config: n } = Ji(e);
		return {
			diagramType: (await Ci.fromText(t)).type,
			config: n
		};
	} catch (e) {
		if (t?.suppressErrors) return !1;
		throw e;
	} finally {
		c(void 0);
	}
}
t(Yi, "parse");
var Xi = /* @__PURE__ */ t((e, t, n = []) => `.${e} ${t} ${l(`{ ${n.join(" !important; ")} !important; }`)}`, "cssImportantStyles"), Zi = /* @__PURE__ */ t((e, t = /* @__PURE__ */ new Map()) => {
	let n = new CSSStyleSheet();
	if (e.fontFamily !== void 0 && n.insertRule(`:root { --mermaid-font-family: ${e.fontFamily}}`, n.cssRules.length), e.altFontFamily !== void 0 && n.insertRule(`:root { --mermaid-alt-font-family: ${e.altFontFamily}}`, n.cssRules.length), t instanceof Map) {
		let r = ee(e) ? ["> *", "span"] : [
			"rect",
			"polygon",
			"ellipse",
			"circle",
			"path"
		];
		t.forEach((e) => {
			_e(e.styles) || r.forEach((t) => {
				n.insertRule(Xi(e.id, t, e.styles), n.cssRules.length);
			}), _e(e.textStyles) || n.insertRule(Xi(e.id, "tspan", (e?.textStyles || []).map((e) => e.replace("color", "fill"))), n.cssRules.length);
		});
	}
	let r = "";
	if (e.themeCSS !== void 0) {
		if (typeof n.replaceSync == "function") {
			let t = new CSSStyleSheet();
			t.replaceSync(e.themeCSS), r = C(t) + "\n";
		} else r += `${e.themeCSS}
`;
	}
	return r + C(n);
}, "createCssStyles"), Qi = /* @__PURE__ */ t((e, n) => Vn(In(`${e}{${n}}`), Un([/* @__PURE__ */ t(function(t, n, i, a) {
	if (t.type === "rule" && Array.isArray(t.props)) {
		if (t.parent && t.parent.type === "@keyframes") return;
		t.props = t.props.map((n) => n === e && Array.isArray(t.children) && t.children.every((e) => e.type === "decl" && (/* @__PURE__ */ new Set([
			"font-family",
			"font-size",
			"fill"
		])).has(e.props)) ? n : !n.startsWith(`${e} `) && !n.startsWith(`${e}>`) || n.startsWith(`${e} ||`) ? `${e} ${n}` : n);
	} else t.type.startsWith("@") && ([
		"@media",
		"@supports",
		"@layer",
		"@scope",
		"@container",
		"@starting-style",
		"@keyframes"
	].includes(t.type) || (r.warn(`Removing unsupported at-rule ${t.type} from CSS`), t.type = rn));
}, "addNamespace"), Hn])), "compileCSS"), $i = /* @__PURE__ */ t((e, t, n, r) => {
	let i = Zi(e, n);
	return Qi(r, _(t, i, {
		...e.themeVariables,
		theme: e.theme,
		look: e.look
	}, r));
}, "createUserStyles"), ea = /* @__PURE__ */ t((e = "", t, n) => {
	let r = e;
	return !n && !t && (r = r.replace(/marker-end="url\([\d+./:=?A-Za-z-]*?#/g, "marker-end=\"url(#")), r = I(r), r = r.replace(/<br>/g, "<br/>"), r;
}, "cleanUpSvgCode"), ta = /* @__PURE__ */ t((e = "", t) => `<iframe style="width:${Bi};height:${t?.viewBox?.baseVal?.height ? t.viewBox.baseVal.height + "px" : Vi};${Hi}" src="data:text/html;charset=UTF-8;base64,${Mi(`<body style="${Ui}">${e}</body>`)}" sandbox="${Wi}">
  ${Gi}
</iframe>`, "putIntoIFrame"), na = /* @__PURE__ */ t((e, t, n, r, i) => {
	let a = e.append("div");
	a.attr("id", n), r && a.attr("style", r);
	let o = a.append("svg").attr("id", t).attr("width", "100%").attr("xmlns", Li);
	return i && o.attr("xmlns:xlink", i), o.append("g"), e;
}, "appendDivSvgG");
function ra(e, t) {
	return e.append("iframe").attr("id", t).attr("style", "width: 100%; height: 100%;").attr("sandbox", "");
}
t(ra, "sandboxedIframe");
var ia = /* @__PURE__ */ t((e, t, n, r) => {
	e.getElementById(t)?.remove(), e.getElementById(n)?.remove(), e.getElementById(r)?.remove();
}, "removeExistingElements"), aa = /* @__PURE__ */ t(async function(n, a, o) {
	vi();
	let s = Ji(a), c = s.code;
	a = c.cleaned;
	let l = M();
	r.debug(l), a.length > (l?.maxTextSize ?? Ni) && (a = Pi, c = {
		raw: a,
		cleaned: a
	});
	let u = `#${n}`, d = "i" + n, f = "#" + d, p = "d" + n, m = "#" + p, h = /* @__PURE__ */ t(() => {
		let e = i(_ ? f : m).node();
		e && "remove" in e && e.remove();
	}, "removeTempElements"), g = i(document.body), _ = l.securityLevel === Fi, v = l.securityLevel === Ii, y = l.fontFamily;
	if (o !== void 0) {
		if (o && (o.innerHTML = ""), _) {
			let e = ra(i(o), d);
			g = i(e.nodes()[0].contentDocument.body), g.node().style.margin = "0";
		} else g = i(o);
		na(g, n, p, `font-family: ${y}`, Ri);
	} else {
		if (ia(document, n, p, d), _) {
			let e = ra(i(document.body), d);
			g = i(e.nodes()[0].contentDocument.body), g.node().style.margin = "0";
		} else g = i("body");
		na(g, n, p);
	}
	let b, S;
	try {
		b = await Ci.fromText(c, { title: s.title });
	} catch (e) {
		if (l.suppressErrorRendering) throw h(), e;
		b = await Ci.fromText("error"), S = e, b.db.setErrorMessage?.(ne(e));
	}
	let C = g.select(m).node(), w = b.type, T = C.firstChild, E = T.firstChild, D = b.renderer.getClasses?.(a, b), O = $i(l, w, D, u), k = document.createElement("style");
	k.innerHTML = O, T.insertBefore(k, E);
	try {
		await b.renderer.draw(a, n, "12.1.0", b);
	} catch (e) {
		throw l.suppressErrorRendering ? h() : Er.draw(a, n, "12.1.0"), e;
	}
	let A = g.select(`${m} svg`), ee = b.db.getAccTitle?.(), j = b.db.getAccDescription?.();
	la(w, A, ee, j);
	let N = (/* @__PURE__ */ t(() => {
		g.select(`[id="${n}"]`).selectAll("foreignobject > *").attr("xmlns", zi);
		let t = g.select(m).node().innerHTML;
		if (r.debug("config.arrowMarkerAbsolute", l.arrowMarkerAbsolute), t = ea(t, _, x(l.arrowMarkerAbsolute)), _) {
			let e = g.select(m + " svg").node();
			t = ta(t, e);
		} else v || (t = e.sanitize(t, {
			ADD_TAGS: Ki,
			ADD_ATTR: qi,
			HTML_INTEGRATION_POINTS: { foreignobject: !0 }
		}));
		return Ti(), t;
	}, "serializeSvg"))();
	if (S) throw S;
	return h(), {
		diagramType: w,
		svg: N,
		bindFunctions: b.db.bindFunctions
	};
}, "renderDiagram"), oa = /* @__PURE__ */ t(async function(e, t, n) {
	try {
		return await aa(e, t, n);
	} finally {
		c(void 0);
	}
}, "render");
function sa(e = {}) {
	let t = D({}, e);
	t?.fontFamily && !t.themeVariables?.fontFamily && (t.themeVariables ||= {}, t.themeVariables.fontFamily = t.fontFamily), h(t);
	let r = A.theme;
	t?.theme && Object.hasOwn(f, t.theme) ? t.themeVariables = f[t.theme].getThemeVariables(t.themeVariables) : t && (t.theme != null && t.theme !== "null" && (t.theme = r), t.themeVariables = f[r].getThemeVariables(t.themeVariables));
	let i = typeof t == "object" ? s(t) : m();
	n(i.logLevel), vi();
}
t(sa, "initialize");
var ca = /* @__PURE__ */ t((e, t = {}) => {
	let { code: n } = ji(e);
	return Ci.fromText(n, t);
}, "getDiagramFromText");
function la(e, t, n, r) {
	xi(t, e), Si(t, n, r, t.attr("id"));
}
t(la, "addA11yInfo");
var Q = Object.freeze({
	render: oa,
	parse: Yi,
	getDiagramFromText: ca,
	initialize: sa,
	getConfig: M,
	setConfig: g,
	getSiteConfig: m,
	updateSiteConfig: a,
	reset: /* @__PURE__ */ t(() => {
		o();
	}, "reset"),
	globalReset: /* @__PURE__ */ t(() => {
		o(A);
	}, "globalReset"),
	defaultConfig: A
});
n(M().logLevel), o(M());
var ua = /* @__PURE__ */ t((e, t, n) => {
	r.warn(e), ie(e) ? (n && n(e.str, e.hash), t.push({
		...e,
		message: e.str,
		error: e
	})) : (n && n(e), e instanceof Error && t.push({
		str: e.message,
		message: e.message,
		hash: e.name,
		error: e
	}));
}, "handleError"), da = /* @__PURE__ */ t(async function(e = { querySelector: ".mermaid" }) {
	try {
		await fa(e);
	} catch (t) {
		if (ie(t) && r.error(t.str), $.parseError && $.parseError(t), !e.suppressErrors) throw r.error("Use the suppressErrors option to suppress these errors"), t;
	}
}, "run"), fa = /* @__PURE__ */ t(async function({ postRenderCallback: e, querySelector: t, nodes: n } = { querySelector: ".mermaid" }) {
	let i = Q.getConfig();
	r.debug(`${e ? "" : "No "}Callback function found`);
	let a;
	if (n) a = n;
	else if (t) a = document.querySelectorAll(t);
	else throw Error("Nodes and querySelector are both undefined");
	r.debug(`Found ${a.length} diagrams`), i?.startOnLoad !== void 0 && (r.debug("Start On Load: " + i?.startOnLoad), Q.updateSiteConfig({ startOnLoad: i?.startOnLoad }));
	let o = new F.InitIDGenerator(i.deterministicIds, i.deterministicIDSeed), s, c = [];
	for (let t of Array.from(a)) {
		if (r.info("Rendering diagram: " + t.id), t.getAttribute("data-processed")) continue;
		t.setAttribute("data-processed", "true");
		let n = `mermaid-${o.next()}`;
		s = t.innerHTML, s = se(F.entityDecode(s)).trim().replace(/<br\s*\/?>/gi, "<br/>");
		let i = F.detectInit(s);
		i && r.debug("Detected early reinit: ", i);
		try {
			let { svg: r, bindFunctions: i } = await Sa(n, s, t);
			t.innerHTML = r, e && await e(n), i && i(t);
		} catch (e) {
			ua(e, c, $.parseError);
		}
	}
	if (c.length > 0) throw c[0];
}, "runThrowsErrors"), pa = /* @__PURE__ */ t(function(e) {
	Q.initialize(e);
}, "initialize"), ma = /* @__PURE__ */ t(async function(e, t, n) {
	r.warn("mermaid.init is deprecated. Please use run instead."), e && pa(e);
	let i = {
		postRenderCallback: n,
		querySelector: ".mermaid"
	};
	typeof t == "string" ? i.querySelector = t : t && (i.nodes = t instanceof HTMLElement ? [t] : t), await da(i);
}, "init"), ha = /* @__PURE__ */ t(async (e, { lazyLoad: t = !0 } = {}) => {
	vi(), d(...e), t === !1 && await yi();
}, "registerExternalDiagrams"), ga = /* @__PURE__ */ t(function() {
	if ($.startOnLoad) {
		let { startOnLoad: e } = Q.getConfig();
		e && $.run().catch((e) => r.error("Mermaid failed to initialize", e));
	}
}, "contentLoaded");
typeof document < "u" && window.addEventListener("load", ga, !1);
var _a = /* @__PURE__ */ t(function(e) {
	$.parseError = e;
}, "setParseErrorHandler"), va = [], ya = !1, ba = /* @__PURE__ */ t(async () => {
	if (!ya) {
		for (ya = !0; va.length > 0;) {
			let e = va.shift();
			if (e) try {
				await e();
			} catch (e) {
				r.error("Error executing queue", e);
			}
		}
		ya = !1;
	}
}, "executeQueue"), xa = /* @__PURE__ */ t(async (e, n) => new Promise((i, a) => {
	let o = /* @__PURE__ */ t(() => new Promise((t, o) => {
		Q.parse(e, n).then((e) => {
			t(e), i(e);
		}, (e) => {
			r.error("Error parsing", e), $.parseError?.(e), o(e), a(e);
		});
	}), "performCall");
	va.push(o), ba().catch(a);
}), "parse"), Sa = /* @__PURE__ */ t((e, n, i) => new Promise((a, o) => {
	let s = /* @__PURE__ */ t(() => new Promise((t, s) => {
		Q.render(e, n, i).then((e) => {
			t(e), a(e);
		}, (e) => {
			r.error("Error parsing", e), $.parseError?.(e), s(e), o(e);
		});
	}), "performCall");
	va.push(s), ba().catch(o);
}), "render"), $ = {
	startOnLoad: !0,
	mermaidAPI: Q,
	parse: xa,
	render: Sa,
	init: ma,
	run: da,
	registerExternalDiagrams: ha,
	registerLayoutLoaders: xe,
	initialize: pa,
	parseError: void 0,
	contentLoaded: ga,
	setParseErrorHandler: _a,
	detectType: E,
	registerIconPacks: oe,
	getRegisteredDiagramsMetadata: /* @__PURE__ */ t(() => Object.keys(w).map((e) => ({ id: e })), "getRegisteredDiagramsMetadata")
}, Ca = $;
//#endregion
export { he as a, Ca as default, Ce as i, Yt as n, Te as r, Kt as t };
