//#region resources/js/business-results.js
var e = (e) => e, t = {
	id: "ID",
	identify: "ID",
	key: "ID",
	name: "名前",
	title: "タイトル",
	summary: "件名",
	description: "説明",
	content: "本文",
	status: "状態",
	price: "価格",
	stock: "在庫",
	quantity: "数量",
	updated_at: "更新日時",
	revision: "更新番号",
	order_id: "受注ID",
	product_id: "商品ID",
	product_class_id: "商品規格ID",
	customer_id: "会員ID",
	shipping_id: "配送ID",
	post_id: "投稿ID"
}, n = (e, t, n) => {
	let r = document.createElement(e);
	return t !== void 0 && (r.textContent = String(t)), n && (r.className = n), r;
}, r = (e) => e == null ? "—" : typeof e == "object" ? JSON.stringify(e) : String(e);
function i(e, t = 0) {
	if (t > 12 || !e || Array.isArray(e) || typeof e != "object") return e;
	if (e.data !== void 0) return i(e.data, t + 1);
	if (e.structuredContent) return i(e.structuredContent, t + 1);
	if (Array.isArray(e.content) && e.content.length === 1 && e.content[0]?.type === "text") try {
		return i(JSON.parse(e.content[0].text), t + 1);
	} catch {}
	return e;
}
function a(e, t = 0) {
	if (t > 12) return null;
	if (Array.isArray(e)) return e.filter((e) => e && typeof e == "object");
	if (!e || typeof e != "object") return null;
	for (let t of [
		"items",
		"records",
		"results",
		"projects",
		"issues",
		"products",
		"orders",
		"customers",
		"models",
		"objects",
		"apps",
		"comments",
		"nodes",
		"edges"
	]) if (Array.isArray(e[t])) return e[t].map((e) => e.node || e).filter((e) => e && typeof e == "object");
	let n = i(e);
	return n === e ? e.result === void 0 ? null : a(e.result, t + 1) : a(n, t + 1);
}
function o(i, a, s = 0) {
	if (!a || typeof a != "object" || s >= 8) {
		i.append(n("p", r(a)));
		return;
	}
	let c = n("dl", void 0, "fmi-business__details");
	for (let [i, l] of Object.entries(a)) {
		let a = n("div");
		a.append(n("dt", e(t[i] || i)));
		let u = n("dd");
		if (l && typeof l == "object") {
			let t = n("details");
			t.append(n("summary", e("詳細を開く"))), o(t, l, s + 1), u.append(t);
		} else u.append(n("span", r(l)));
		a.append(u), c.append(a);
	}
	i.append(c);
}
function s(t, r) {
	let i = n("button", e(t));
	return i.type = "button", i.addEventListener("click", r), i;
}
function c(i, a, o, c, l) {
	let u = n("div", void 0, "fmi-business__scroll");
	u.tabIndex = 0, u.setAttribute("aria-label", e("全項目の一覧。左右にスクロールできます"));
	let d = n("table"), f = n("thead"), p = n("tr"), m = [...new Set(a.flatMap((e) => Object.keys(e)))];
	c && p.append(n("th", e("比較対象"))), m.forEach((r) => {
		let i = n("th", e(t[r] || r));
		i.scope = "col", p.append(i);
	}), o && p.append(n("th", e("詳細"))), f.append(p), d.append(f);
	let h = n("tbody");
	a.forEach((t) => {
		let i = n("tr");
		if (c) {
			let a = n("td"), o = n("input");
			o.type = "checkbox", o.checked = c.has(t), o.disabled = !o.checked && c.size >= 10, o.setAttribute("aria-label", r(t.title || t.name || t.summary || t.id || t.key || t.order_id || t.product_class_id || t.product_id || t.customer_id || t.shipping_id) + e("を比較する")), o.addEventListener("change", () => {
				o.checked ? c.add(t) : c.delete(t), l();
			}), a.append(o), i.append(a);
		}
		if (m.forEach((e) => {
			let a = r(t[e]), o = n("td"), s = n("span", a.length > 240 ? a.slice(0, 240) + "…" : a);
			s.title = a, o.append(s), i.append(o);
		}), o) {
			let e = n("td");
			e.append(s("詳細", () => o(t))), i.append(e);
		}
		h.append(i);
	}), d.append(h), u.append(d), i.append(u);
}
function l(t, l, u) {
	let d = l?.data?.workbench || l?.workbench || l?.result?.data?.workbench, f = Array.isArray(d?.views) ? d.views.filter((e) => e && e.origin === "tool_result" && e.data && typeof e.data == "object") : [];
	if (!f.length && !d?.omitted_views) return;
	let p = n("details", void 0, "fmi-business");
	p.append(n("summary", e("仕事に使った情報を見る"))), d?.omitted_views && p.append(n("p", e("保存した結果の一部を表示しています。必要な情報は会話から取得し直してください。")));
	for (let t of f.slice(0, 12)) {
		let l = n("section"), d = n("h4", t.title || e("取得した情報"));
		l.append(d), t.partial && l.append(n("p", e("一部の情報を表示しています。続きは連携先で確認してください。")));
		let f = a(t.data)?.map((e) => ({
			...e,
			...e.data && typeof e.data == "object" && !Array.isArray(e.data) ? e.data : {}
		})).map(({ data: e, ...t }) => t), m = n("div", void 0, "fmi-business__controls"), h = n("div"), g = /* @__PURE__ */ new Set();
		if (f) {
			let i = n("input");
			i.type = "search", i.placeholder = e("表示中の行を絞り込む"), i.setAttribute("aria-label", i.placeholder);
			let a = n("span"), d = s("選択したデータを比較", () => {
				h.replaceChildren();
				let t = [...g];
				t.length < 2 || (h.append(s("一覧へ戻る", p)), c(h, t, null), t.forEach((t, r) => {
					let i = n("details");
					i.append(n("summary", e("詳細") + " " + (r + 1))), o(i, t), h.append(i);
				}));
			});
			function p() {
				let n = f.filter((e) => r(e).toLocaleLowerCase().includes(i.value.toLocaleLowerCase()));
				h.replaceChildren(), a.textContent = n.length + e("件"), d.disabled = g.size < 2, c(h, n, (e) => {
					h.replaceChildren(), h.append(s("一覧へ戻る", p)), u && h.append(s("この内容で相談", () => u({
						view: t,
						row: e
					}))), o(h, e);
				}, g, () => {
					d.disabled = g.size < 2, h.querySelectorAll("input[type=checkbox]").forEach((e) => {
						e.disabled = !e.checked && g.size >= 10;
					});
				});
			}
			i.addEventListener("input", p), m.append(i, a, d), l.append(m, h), p();
		} else o(h, i(t.data)), l.append(h);
		if (i(t.data)?.aggregation && f?.every((e) => Number.isFinite(e.value) && Object.hasOwn(e, "label"))) {
			let t = n("details");
			t.append(n("summary", e("集計グラフ")));
			let i = Math.max(1, ...f.map((e) => Math.abs(e.value)));
			f.forEach((e) => {
				let a = n("div", void 0, "fmi-business__bar"), o = n("span", r(e.label) + "：" + r(e.value)), s = n("span");
				s.style.width = Math.abs(e.value) / i * 100 + "%", s.className = e.value < 0 ? "negative" : "", a.append(o, s), t.append(a);
			}), l.append(t);
		}
		p.append(l);
	}
	t.append(p);
}
//#endregion
export { l as renderBusinessResults };
