// Centre de control · 🧭 Test d'afinitat: quanta gent l'ha fet i què ha respost, a partir dels comptadors anònims
// de stats.js (stats/{dia}_{n}). No hi ha cap identificador de persona: cada test acabat només suma 1 a comptadors com
// «territori: Catalunya», «partit amb més afinitat: ERC», «casella del mapa 3_8» o «afirmació lloguer: molt d'acord».
//   f.assembla  tests acabats (des del 10-11-2026, quan es va estrenar)
//   at  territori · ap  partit amb més afinitat · ag  casella del mapa «x_y» (0–10) · aq  resposta «id_v» (v: -2…2, s = saltada)
//   ai  afirmacions marcades amb ☆ (des del 14-11-2026)
const CTA = { days: null, loading: false, range: 0, at: 0 };
const CTA_FROM = "2026-11-10"; // estrena del test
const CTA_RES_FROM = "2026-11-14"; // des d'aquest dia es desen també les respostes

function ctaDayList() {
  const out = [];
  const today = Stats.day();
  for (let t = Date.parse(CTA_FROM + "T12:00:00Z"); ; t += 864e5) {
    const d = Stats.day(new Date(t));
    out.push(d);
    if (d >= today || out.length > 400) break;
  }
  return out;
}
async function ctaLoad() {
  if (CTA.loading) return;
  CTA.loading = true;
  const list = ctaDayList();
  const days = Object.fromEntries(list.map((d) => [d, {}]));
  // De 25 en 25 dies (com a molt 250 documents per consulta)
  for (let i = 0; i < list.length; i += 25) {
    const part = list.slice(i, i + 25);
    const docs = await window.Online.statsRange(part[0], part[part.length - 1]);
    (docs || []).forEach((doc) => {
      const d = days[doc.id.split("_")[0]];
      if (!d) return;
      const f = Number(doc.f?.assembla) || 0;
      if (f) d.n = (d.n || 0) + f;
      for (const k of ["at", "ap", "ag", "aq", "ai"]) {
        if (!doc[k] || typeof doc[k] !== "object") continue;
        const m = (d[k] ||= {});
        for (const [kk, vv] of Object.entries(doc[k])) m[kk] = (m[kk] || 0) + (Number(vv) || 0);
      }
    });
  }
  CTA.days = days;
  CTA.at = Date.now();
  CTA.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "afinitat") renderControl(true);
}
function ctaSum(keys) {
  const s = { n: 0 };
  keys.forEach((day) => {
    const d = CTA.days[day] || {};
    s.n += d.n || 0;
    for (const k of ["at", "ap", "ag", "aq", "ai"]) {
      if (!d[k]) continue;
      const m = (s[k] ||= {});
      for (const [kk, vv] of Object.entries(d[k])) m[kk] = (m[kk] || 0) + vv;
    }
  });
  return s;
}
const ctaPct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : "—");

// El mapa: on es col·loca la gent (cada casella, una unitat dels eixos), amb els partits a sobre
function ctaMap(grid) {
  const cells = Object.entries(grid || {}).map(([k, v]) => { const [x, y] = k.split("_").map(Number); return { x, y, v }; }).filter((c) => !isNaN(c.x) && !isNaN(c.y));
  const total = cells.reduce((a, c) => a + c.v, 0);
  if (!total) return `<p class="muted">Encara no hi ha posicions.</p>`;
  const max = Math.max(...cells.map((c) => c.v));
  const W = 440, P = 34, S = (W - 2 * P) / 11;
  const px = (x) => P + x * S, py = (y) => W - P - (y + 1) * S;
  const mx = cells.reduce((a, c) => a + c.x * c.v, 0) / total, my = cells.reduce((a, c) => a + c.y * c.v, 0) / total;
  const parties = (typeof assemblaPartyPos === "function" ? ASSEMBLA_PARTIES : []).map((id) => { const p = PARTIES.find((q) => q.id === id), q = assemblaPartyPos(id); return p && q ? { p, q } : null; }).filter(Boolean);
  return `<svg class="cta-map" viewBox="0 0 ${W} ${W}" role="img" aria-label="On es col·loquen les persones que han fet el test">
    <rect x="${P}" y="${P}" width="${W - 2 * P}" height="${W - 2 * P}" fill="#fff" stroke="#17173d" stroke-width="1.5"/>
    ${cells.map((c) => `<rect x="${px(c.x)}" y="${py(c.y)}" width="${S}" height="${S}" fill="#d2331a" fill-opacity="${(0.1 + 0.9 * (c.v / max)).toFixed(2)}"><title>${c.v} persones</title></rect>`).join("")}
    <path d="M${px(5.5)} ${P}V${W - P}M${P} ${py(4.5)}H${W - P}" stroke="#17173d" stroke-dasharray="3 5" opacity=".4"/>
    ${parties.map(({ p, q }) => `<g><circle cx="${px(q.x * 1.0) + S / 2}" cy="${py(q.y) + S / 2}" r="6" fill="${p.color}" stroke="#17173d" stroke-width="1.5"/><text x="${px(q.x) + S / 2 + 9}" y="${py(q.y) + S / 2 + 4}" font-size="11" font-weight="800" fill="#17173d">${esc(p.sig)}</text></g>`).join("")}
    <circle cx="${px(mx) + S / 2}" cy="${py(my) + S / 2}" r="9" fill="#ffcf3d" stroke="#17173d" stroke-width="3"><title>Mitjana</title></circle>
    <text x="${P}" y="${W - 10}" font-size="12" font-weight="700" fill="#5e5a74">← Esquerra</text><text x="${W - P}" y="${W - 10}" font-size="12" font-weight="700" fill="#5e5a74" text-anchor="end">Dreta →</text>
    <text x="14" y="${P}" font-size="12" font-weight="700" fill="#5e5a74" transform="rotate(-90 14 ${P})" text-anchor="end">Independentisme ↑</text>
  </svg>
  <p class="muted">Cada casella pinta més fosca com més gent hi cau. El punt groc és la mitjana (esquerra–dreta ${fmt(Math.round(mx * 10) / 10)}, centralisme–independentisme ${fmt(Math.round(my * 10) / 10)}); els partits, amb el mateix càlcul que al test.</p>`;
}

// Respostes de cada afirmació: barra apilada de «molt d'acord» a «molt en desacord»
function ctaAnswers(aq, ai) {
  if (typeof ASSEMBLA_ITEMS === "undefined") return "";
  const COL = { 2: "#0f7a43", 1: "#7ccf9a", 0: "#c9c4b6", "-1": "#ff9d85", "-2": "#d2331a" };
  const rows = ASSEMBLA_ITEMS.map((it) => {
    const c = {}; let tot = 0;
    for (const v of ["2", "1", "0", "-1", "-2", "s"]) { const n = aq?.[`${it.id}_${v}`] || 0; c[v] = n; tot += n; }
    const ans = tot - c.s, agree = c["2"] + c["1"], dis = c["-1"] + c["-2"];
    return { it, c, tot, ans, net: ans ? (agree - dis) / ans : 0, imp: ai?.[it.id] || 0 };
  }).filter((r) => r.tot > 0);
  if (!rows.length) return `<p class="muted">Encara no hi ha respostes desades (es compten des del ${CTA_RES_FROM.split("-").reverse().join("-")}).</p>`;
  rows.sort((a, b) => b.net - a.net);
  const text = (it) => (typeof assemblaText === "function" ? assemblaText(it, "cat") || assemblaText(it, "resta") || it.q : it.q);
  return `<p class="cta-leg">${[["2", "Molt d'acord"], ["1", "D'acord"], ["0", "Neutral"], ["-1", "En desacord"], ["-2", "Molt en desacord"]].map(([v, l]) => `<span><i style="background:${COL[v]}"></i>${l}</span>`).join("")}</p>
    <ol class="cta-q">${rows.map((r) => `<li><div class="cta-qt"><b>${esc(text(r.it))}</b><small>${esc(r.it.t)} · ${fmt(r.ans)} respostes${r.c.s ? ` · ${fmt(r.c.s)} saltades` : ""}${r.imp ? ` · ☆ ${fmt(r.imp)}` : ""}</small></div>
      <div class="cta-qb">${["2", "1", "0", "-1", "-2"].map((v) => r.c[v] ? `<i style="width:${(r.c[v] / r.ans) * 100}%;background:${COL[v]}" title="${r.c[v]}"></i>` : "").join("")}</div>
      <em class="${r.net >= 0 ? "pos" : "neg"}">${r.net >= 0 ? "+" : ""}${Math.round(r.net * 100)}</em></li>`).join("")}</ol>
    <p class="muted">Ordenades de més a menys acord. El número és el saldo: % d'acord menys % de desacord entre qui ha respost. Les afirmacions surten com les veu un votant de Catalunya (a la resta de territoris canvia el nom del territori o de la llengua).</p>`;
}

function ctlAfinitatHtml() {
  if (!CTA.days) { ctaLoad(); return `<div class="card"><p class="muted">Carregant les dades del test…</p></div>`; }
  const all = Object.keys(CTA.days).sort();
  const keys = CTA.range ? all.slice(-CTA.range) : all;
  const S = ctaSum(keys);
  const res = ctaSum(keys.filter((d) => d >= CTA_RES_FROM));
  const withRes = Object.values(res.at || {}).reduce((a, b) => a + b, 0);
  const terr = Object.fromEntries(Object.entries(typeof ASSEMBLA_TERR !== "undefined" ? ASSEMBLA_TERR : {}).map(([k, t]) => [k, t.name]));
  const pn = Object.fromEntries((typeof PARTIES !== "undefined" ? PARTIES : []).map((p) => [p.id, p.sig]));
  const perDay = all.map((d) => [d, CTA.days[d].n || 0]);
  const maxDay = Math.max(1, ...perDay.map(([, n]) => n));
  const today = perDay[perDay.length - 1]?.[1] || 0;
  return `
    <div class="ctl-head-row"><div class="ctl-seg" role="radiogroup">${[[0, "Tot"], [7, "7 dies"], [1, "Avui"]].map(([k, t]) => `<button type="button" role="radio" aria-checked="${CTA.range === k}" class="${CTA.range === k ? "on" : ""}" data-carange="${k}">${t}</button>`).join("")}</div>
      <button type="button" class="btn ghost sm" data-carefresh>Actualitza</button></div>
    <section class="card cta-kpis">
      <div><small>Tests acabats</small><b>${fmt(S.n)}</b><span class="muted">${CTA.range ? "en el període" : `des del ${CTA_FROM.split("-").reverse().join("-")}`}</span></div>
      <div><small>Avui</small><b>${fmt(today)}</b></div>
      <div><small>Amb resultats desats</small><b>${fmt(withRes)}</b><span class="muted">des del ${CTA_RES_FROM.split("-").reverse().join("-")}</span></div>
    </section>
    <section class="card"><h2 class="section-title sm">Tests acabats cada dia</h2>
      <div class="cta-days">${perDay.map(([d, n]) => `<div title="${d}: ${n}"><i style="height:${(n / maxDay) * 100}%"></i><b>${n || ""}</b><small>${d.slice(8)}/${d.slice(5, 7)}</small></div>`).join("")}</div>
      <p class="muted">Compta cada test acabat: si algú el repeteix, compta dues vegades. No es guarda res que identifiqui ningú.</p></section>
    <div class="cta-grid">
      <section class="card"><h2 class="section-title sm">Partit amb més afinitat</h2>${ctuBars(res.ap, pn, { max: 12 })}</section>
      <section class="card"><h2 class="section-title sm">On voten</h2>${ctuBars(res.at, terr, { max: 8 })}</section>
    </div>
    <section class="card"><h2 class="section-title sm">On es col·loca la gent</h2>${ctaMap(res.ag)}</section>
    <section class="card"><h2 class="section-title sm">Què responen, afirmació per afirmació</h2>${ctaAnswers(res.aq, res.ai)}</section>
    <p class="muted">Dades anònimes i agregades: cada test acabat suma 1 a uns comptadors per dia (territori, partit, casella del mapa i resposta de cada afirmació). No hi ha cap identificador de persona ni de dispositiu, i no es pot saber què ha respost ningú en concret. ${CTA.at ? `Carregat ${ctlRel(CTA.at)}.` : ""}</p>`;
}
function ctlAfinitatBind(root) {
  $$("[data-carange]", root).forEach((b) => b.addEventListener("click", () => { CTA.range = Number(b.dataset.carange); renderControl(true); }));
  $("[data-carefresh]", root)?.addEventListener("click", () => { CTA.days = null; renderControl(true); });
}
