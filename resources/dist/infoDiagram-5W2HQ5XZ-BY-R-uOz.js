import { n as e } from "./mermaid-parser-core-DkeADed9.js";
import { n as t } from "./chunk-Y2CYZVJY-DdxqPB5t.js";
import { m as n } from "./src-CXWI7ZhK.js";
import { c as r } from "./chunk-VPRB5NB3-7XLf7LvO.js";
import { a as i } from "./mermaid-core-C1_aUh50.js";
//#region ../../../work/node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-5W2HQ5XZ.mjs
var a = { parse: /* @__PURE__ */ t(async (t) => {
	let r = await e("info", t);
	n.debug(r);
}, "parse") }, o = { version: "12.1.0" }, s = {
	parser: a,
	db: { getVersion: /* @__PURE__ */ t(() => o.version, "getVersion") },
	renderer: { draw: /* @__PURE__ */ t((e, t, a) => {
		n.debug("rendering info diagram\n" + e);
		let o = i(t);
		r(o, 100, 400, !0), o.append("g").append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${a}`);
	}, "draw") }
};
//#endregion
export { s as diagram };
