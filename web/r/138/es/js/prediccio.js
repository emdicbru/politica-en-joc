// El teu mapa d'escons (#escons). Cadascú fa la seva predicció del 29N triant el percentatge de vot de cada partit (i, si
// vol, el d'una circumscripció concreta) i l'app reparteix els 350 escons província a província amb la Llei d'Hondt i la
// barrera del 3 % (nitProv / espCompute de la nit electoral), amb els diputats de cada circumscripció del 29N.
// Model: el vot de cada partit es reparteix entre les circumscripcions com el 2023 (Ministeri de l'Interior, NIT_2023);
// Podemos, que el 2023 anava dins de Sumar, com Sumar; SALF, que no s'hi presentava, meitat com Vox i meitat com el total
// de vots. El vot en blanc i la participació són els del 2023. És una eina de joc, no cap enquesta ni cap estimació.
// Es comparteix amb un enllaç (#escons/<codi>, tota la predicció dins del codi: no es desa enlloc) i amb una imatge.
// Durant la veda d'enquestes (pollsBlocked) no s'ofereix la mitjana d'enquestes com a punt de partida.

const PRD_IDS = ["pp", "psoe", "vox", "fa", "podemos", "salf", "erc", "junts", "bildu", "pnv", "bng", "cc", "upn"];
const PRD_KEY = "r29n-escons";
const PRD = { party: null, t: null, o: {}, sel: null, edit: null, from: "2023", name: "", shared: null, d: null, raf: 0, view: "mapa" };

// ---------- Base: els vots del 2023 per circumscripció ----------
let prdBaseCache = null;
function prdBase() {
  if (prdBaseCache) return prdBaseCache;
  const provs = SIM_PROVS.map((p) => {
    const b = NIT_2023[p.code], v = {};
    Object.entries(b.v).forEach(([k, n]) => { const kk = PRD_IDS.includes(k) ? k : "altres"; v[kk] = (v[kk] || 0) + n; });
    return { code: p.code, i: p.i, ccaa: p.ccaa, v, b: b.b, V: Object.values(b.v).reduce((a, c) => a + c, 0) + b.b };
  });
  const V = provs.reduce((a, p) => a + p.V, 0), tot = {};
  provs.forEach((p) => Object.entries(p.v).forEach(([k, n]) => { tot[k] = (tot[k] || 0) + n; }));
  const blank = (provs.reduce((a, p) => a + p.b, 0) / V) * 100;
  // Quina part del vot de cada partit va a cada circumscripció
  const pat = (k, p) => {
    if (k === "podemos") return pat("fa", p);
    if (k === "salf") return 0.5 * pat("vox", p) + 0.5 * (p.V / V);
    return tot[k] ? (p.v[k] || 0) / tot[k] : 0;
  };
  const s23 = Object.fromEntries([...PRD_IDS, "altres"].map((k) => [k, Math.round(((tot[k] || 0) / V) * 1000) / 10]));
  // On es presenta cada partit i com se'n diu l'àmbit (per als partits d'una sola comunitat)
  const where = {};
  PRD_IDS.forEach((k) => {
    const ps = provs.filter((p) => pat(k, p) > 0);
    const cc = [...new Set(ps.map((p) => p.ccaa))];
    where[k] = { codes: new Set(ps.map((p) => p.code)), ccaa: ps.length < provs.length - 2 ? cc : null };
  });
  prdBaseCache = { provs, V, tot, blank, pat, s23, where };
  return prdBaseCache;
}

// Punts de partida: els resultats del 2023 o (fora de la veda i abans dels resultats) la mitjana de les enquestes
const prdPollsOk = () => typeof POLL_PCT !== "undefined" && POLL_PCT.length && !(typeof pollsBlocked === "function" && pollsBlocked()) && !(typeof espFase === "function" && ["nit", "despres"].includes(espFase()));
function prdStart(from) {
  const B = prdBase(), t = {};
  PRD_IDS.forEach((k) => { t[k] = B.s23[k] || 0; });
  if (from === "enquestes" && prdPollsOk()) {
    POLL_PCT_KEYS.forEach((k, j) => {
      const xs = POLL_PCT.map((r) => r[j]).filter((x) => typeof x === "number");
      if (xs.length) t[k] = Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
    });
  }
  return t;
}
const prdSum = (t) => PRD_IDS.reduce((a, k) => a + (t[k] || 0), 0);

// ---------- Càlcul ----------
function prdCompute(t, o = {}) {
  const B = prdBase();
  // Si els partits passen del 100 % (menys el blanc), es redueixen tots en proporció
  const room = 100 - B.blank, sum = prdSum(t), f = sum > room ? room / sum : 1;
  const altres = Math.max(0, room - sum * f);
  const provs = B.provs.map((p) => {
    const vots = {};
    const ov = o[p.code];
    if (ov) {
      const proom = 100 - (p.b / p.V) * 100, ps = PRD_IDS.reduce((a, k) => a + (ov[k] || 0), 0), pf = ps > proom ? proom / ps : 1;
      PRD_IDS.forEach((k) => { if (ov[k]) vots[k] = Math.round((p.V * ov[k] * pf) / 100); });
      vots.altres = Math.round((p.V * Math.max(0, proom - ps * pf)) / 100);
    } else {
      PRD_IDS.forEach((k) => { const n = B.pat(k, p) * ((t[k] || 0) * f / 100) * B.V; if (n > 0) vots[k] = Math.round(n); });
      vots.altres = Math.round(B.pat("altres", p) * (altres / 100) * B.V);
    }
    return { code: p.code, escrutat: 100, vots, blanc: p.b };
  });
  const d = espCompute({ escrutat: 100, participacio: null, actualitzat: null, provs });
  d.over = sum > room ? sum - room : 0;
  d.altres = altres;
  return d;
}
// Percentatge d'un partit a l'àmbit on es presenta (p. ex. ERC a Catalunya)
function prdLocal(d, k) {
  const w = prdBase().where[k];
  if (!w?.ccaa) return null;
  let v = 0, tot = 0;
  d.provs.forEach((p) => { if (w.codes.has(p.code)) { v += p.vots[k] || 0; tot += p.valid; } });
  return tot ? { pct: (v / tot) * 100, where: w.ccaa.length === 1 ? w.ccaa[0] : null } : null;
}

// ---------- Codi de l'enllaç: v1~pp.psoe.…~CODI:pp.psoe.…,…~nom ----------
function prdEncode(t, o, name) {
  const n = (x) => Math.round((x || 0) * 10);
  const ov = Object.entries(o).map(([c, x]) => `${c}:${PRD_IDS.map((k) => n(x[k])).join(".")}`).join(",");
  return `1~${PRD_IDS.map((k) => n(t[k])).join(".")}~${ov}~${encodeURIComponent((name || "").replace(/~/g, "").slice(0, 40))}`;
}
function prdDecode(code) {
  try {
    const [v, a, ov, name] = decodeURIComponent(code).split("~");
    if (v !== "1") return null;
    const nums = (s) => s.split(".").map((x) => Math.max(0, Math.min(1000, Number(x) || 0)) / 10);
    const t = Object.fromEntries(nums(a).map((x, i) => [PRD_IDS[i], x]).filter(([k]) => k));
    const o = {};
    (ov || "").split(",").filter(Boolean).forEach((s) => { const [c, xs] = s.split(":"); if (SIM_PROVS.some((p) => p.code === c) && xs) o[c] = Object.fromEntries(nums(xs).map((x, i) => [PRD_IDS[i], x]).filter(([k]) => k)); });
    return { t, o, name: (name || "").slice(0, 40) };
  } catch { return null; }
}
const prdUrl = (t, o, name) => `${location.origin}${location.pathname}#escons/${prdEncode(t, o, name)}`;

// ---------- Mapa: cada circumscripció amb els seus escons en punts ----------
const prdMix = (hex, a) => {
  const h = hex.replace("#", ""), n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const bg = [255, 250, 240], rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c, i) => Math.round(bg[i] + (c - bg[i]) * a));
  return `rgb(${rgb.join(",")})`;
};
const PRD_DOT = { r: 4.1, gap: 9.4 };
// Els grups de punts de cada circumscripció, separats perquè no se solapin (amb una línia si s'han hagut de moure)
function prdClusters(d) {
  const M = SIM_MAP, { gap } = PRD_DOT;
  const cl = d.provs.map((p) => {
    const g = M.provs[p.code], n = p.seats;
    const cols = n <= 3 ? n : Math.ceil(Math.sqrt(n * 1.5)), rows = Math.ceil(n / cols);
    const ks = Object.entries(p.an.won).sort((a, b) => b[1] - a[1] || (ESP_ORDER.indexOf(a[0]) - ESP_ORDER.indexOf(b[0])));
    const seq = ks.flatMap(([k, m]) => Array(m).fill(k));
    return { p, x0: g.x, y0: g.y, x: g.x, y: g.y, w: cols * gap, h: rows * gap, cols, rows, seq };
  });
  const can = M.can, inCan = (c) => c.y0 > can.y && c.x0 > can.x;
  for (let it = 0; it < 160; it++) {
    for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) {
      const A = cl[a], Bc = cl[b];
      if (inCan(A) !== inCan(Bc)) continue;
      const ox = (A.w + Bc.w) / 2 + 3 - Math.abs(A.x - Bc.x), oy = (A.h + Bc.h) / 2 + 3 - Math.abs(A.y - Bc.y);
      if (ox <= 0 || oy <= 0) continue;
      // S'aparten pel costat on se solapen menys; el grup gran es mou menys
      const wa = Bc.seq.length / (A.seq.length + Bc.seq.length), wb = 1 - wa;
      if (ox < oy) { const s = Math.sign(A.x - Bc.x || a - b); A.x += s * ox * wa; Bc.x -= s * ox * wb; }
      else { const s = Math.sign(A.y - Bc.y || a - b); A.y += s * oy * wa; Bc.y -= s * oy * wb; }
    }
    cl.forEach((c) => { c.x += (c.x0 - c.x) * 0.04; c.y += (c.y0 - c.y) * 0.04; c.x = Math.max(c.w / 2 + 2, Math.min(M.w - c.w / 2 - 2, c.x)); c.y = Math.max(c.h / 2 + 2, Math.min(M.h - c.h / 2 - 2, c.y)); });
  }
  cl.forEach((c) => {
    c.dots = c.seq.map((k, j) => {
      const row = Math.floor(j / c.cols), inRow = Math.min(c.cols, c.seq.length - row * c.cols), col = j % c.cols;
      return { k, x: c.x + (col - (inRow - 1) / 2) * gap, y: c.y + (row - (c.rows - 1) / 2) * gap };
    });
    c.moved = Math.hypot(c.x - c.x0, c.y - c.y0) > Math.max(c.w, c.h) / 2 + 4;
  });
  return cl;
}
function prdMapSvg(d) {
  const cl = prdClusters(d), { r } = PRD_DOT;
  const dots = cl.map((c) => `${c.moved ? `<path class="prd-lead" d="M${c.x0.toFixed(1)} ${c.y0.toFixed(1)}L${c.x.toFixed(1)} ${c.y.toFixed(1)}"/><circle class="prd-anchor" cx="${c.x0.toFixed(1)}" cy="${c.y0.toFixed(1)}" r="2.2"/>` : ""}
    <g class="prd-cl${PRD.sel === c.p.i ? " sel" : ""}">${c.dots.map((o) => `<circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${r}" fill="${nitParty(o.k).color}"/>`).join("")}</g>`).join("");
  return simSpainMap("prd-map").replace("</svg>", `<g class="prd-dots" aria-hidden="true">${dots}</g></svg>`);
}
function prdPaintMap(root, d) {
  const svg = $(".prd-map", root);
  if (!svg) return;
  simPaintMap(svg, (i) => {
    const p = d.provs.find((x) => x.i === i);
    if (!p) return {};
    const w = p.winner ? nitParty(p.winner) : null, share = w ? (p.vots[p.winner] || 0) / p.valid : 0;
    const seats = Object.entries(p.an.won).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${nitSig(k)} ${n}`).join(", ");
    return { fill: w ? prdMix(w.color, 0.22 + Math.min(0.4, Math.max(0, share - 0.2))) : "var(--card)", sel: i === PRD.sel, label: `${p.name}, ${p.seats} ${p.seats === 1 ? "escaño" : "escaños"}: ${seats}` };
  });
  simMapPick(svg, (i) => { PRD.sel = PRD.sel === i ? null : i; PRD.edit = null; prdPaint(); setTimeout(() => $("#prd-prov")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50); });
}

// ---------- Pàgina ----------
function prdLoadDraft() {
  const s = store.get(PRD_KEY, null);
  if (s && s.t) { PRD.t = { ...prdStart("2023"), ...s.t }; PRD.o = s.o || {}; PRD.from = s.from || "2023"; PRD.name = s.name || ""; }
  else PRD.t = prdStart(prdPollsOk() ? "enquestes" : "2023"), PRD.from = prdPollsOk() ? "enquestes" : "2023";
}
const prdSave = () => store.set(PRD_KEY, { t: PRD.t, o: PRD.o, from: PRD.from, name: PRD.name });

function renderEscons(arg) {
  const root = $("#escons-page");
  if (!root) return;
  PRD.shared = arg ? prdDecode(arg) : null;
  if (arg && !PRD.shared) { toast("Este enlace de predicción no es válido"); location.replace("#escons"); return; }
  if (!PRD.shared && !PRD.t) prdLoadDraft();
  PRD.sel = null; PRD.edit = null;
  const sh = PRD.shared;
  root.innerHTML = `<div class="prd">
    <header class="prd-head">
      <p class="prd-k">29N · Elecciones generales</p>
      <h1>${sh ? (sh.name ? `La predicción de ${esc(sh.name)}` : "Una predicción del 29N") : "Tu mapa de escaños"}</h1>
      <p class="prd-lead-t">${sh ? "Así quedaría el Congreso con estos porcentajes de voto, provincia a provincia. Toca una circunscripción para ver cómo se reparten los escaños." : "Elige el porcentaje de voto de cada partido y mira cómo se reparten los 350 escaños, provincia a provincia, con la ley D'Hondt. Después, compártelo con una imagen o un enlace."}</p>
      ${sh ? `<div class="prd-acts"><button class="btn primary" type="button" data-prd-copy>✏️ Haz tu versión</button><a class="btn" href="#escons">Haz la tuya desde cero</a></div>` : ""}
    </header>
    <div class="prd-grid">
      ${sh ? "" : `<aside class="prd-ctl card" aria-label="Porcentaje de voto de cada partido">${prdControlsHtml()}</aside>`}
      <div class="prd-out" id="prd-out"></div>
    </div>
    <details class="prd-met"><summary>Cómo se calcula</summary>
      <p>Cada partido reparte sus votos entre las 52 circunscripciones como lo hizo en 2023 (resultados del Ministerio del Interior). Podemos, que en 2023 iba dentro de Sumar, se reparte como Sumar; SALF, que no se presentaba, mitad como Vox y mitad según el total de votos de cada lugar. El voto en blanco y la participación son los de 2023, y «otros» es lo que queda hasta el 100 %.</p>
      <p>En cada circunscripción se aplican la barrera del 3 % y la ley D'Hondt con los diputados que le tocan el 29N (Madrid, 38; Cádiz, 8). Si tocas una circunscripción, puedes cambiar sus porcentajes a mano.</p>
      <p>Es una herramienta para jugar con los números: no es ninguna encuesta ni ninguna estimación de Política en Joc. Del 24 al 28 de noviembre no se pueden publicar encuestas (artículo 69.7 de la LOREG), y por eso estos días no te ofrecemos la media de encuestas como punto de partida.</p>
    </details>
  </div>`;
  if (!sh) prdBindControls(root);
  $("[data-prd-copy]", root)?.addEventListener("click", () => { PRD.t = { ...prdStart("2023"), ...sh.t }; PRD.o = { ...sh.o }; PRD.name = ""; PRD.from = "enllaç"; prdSave(); location.hash = "#escons"; });
  prdPaint();
}

function prdControlsHtml() {
  const B = prdBase();
  return `<div class="prd-ctl-h"><h2>Voto a cada partido</h2>
      <div class="prd-from" role="group" aria-label="Punto de partida"><span>Parte de:</span>
        <button type="button" data-from="2023" class="${PRD.from === "2023" ? "on" : ""}">Resultados de 2023</button>
        ${prdPollsOk() ? `<button type="button" data-from="enquestes" class="${PRD.from === "enquestes" ? "on" : ""}">Media de encuestas</button>` : ""}
      </div></div>
    <div class="prd-rows">${PRD_IDS.map((k) => {
      const p = nitParty(k), reg = !!B.where[k].ccaa, max = reg ? 6 : k === "pp" || k === "psoe" ? 45 : 30;
      return `<div class="prd-row" style="--c:${p.color}" data-row="${k}">
        <span class="prd-n"><i></i><b>${esc(p.sig)}</b><small data-loc="${k}"></small></span>
        <input class="prd-rng" type="range" min="0" max="${max}" step="0.1" value="${PRD.t[k] || 0}" data-k="${k}" aria-label="${esc(p.sig)}: porcentaje de voto">
        <span class="prd-num"><button type="button" data-step="-1" data-k="${k}" aria-label="Quita una décima a ${esc(p.sig)}">−</button><input type="text" inputmode="decimal" value="${prdFmt(PRD.t[k] || 0)}" data-k="${k}" aria-label="${esc(p.sig)}, porcentaje"><button type="button" data-step="1" data-k="${k}" aria-label="Añade una décima a ${esc(p.sig)}">+</button></span>
        <b class="prd-seats" data-seats="${k}" title="Escaños">0</b>
      </div>`;
    }).join("")}</div>
    <p class="prd-sum" data-sum></p>
    <div class="prd-mini" data-mini aria-live="polite"></div>`;
}
const prdFmt = (x) => (Math.round(x * 10) / 10).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const prdParse = (s) => { const n = Number(String(s).replace(",", ".").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n * 10) / 10)) : null; };

function prdBindControls(root) {
  const ctl = $(".prd-ctl", root);
  const set = (k, v, from) => {
    PRD.t[k] = Math.max(0, Math.min(100, Math.round(v * 10) / 10));
    if (from !== "rng") $(`.prd-rng[data-k="${k}"]`, ctl).value = PRD.t[k];
    if (from !== "txt") $(`.prd-num input[data-k="${k}"]`, ctl).value = prdFmt(PRD.t[k]);
    PRD.from = ""; $$(".prd-from button", ctl).forEach((b) => b.classList.remove("on"));
    prdSave(); prdQueue();
  };
  ctl.addEventListener("input", (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (e.target.type === "range") set(k, Number(e.target.value), "rng");
    else { const v = prdParse(e.target.value); if (v !== null) set(k, v, "txt"); }
  });
  ctl.addEventListener("change", (e) => { if (e.target.dataset.k && e.target.type !== "range") e.target.value = prdFmt(PRD.t[e.target.dataset.k] || 0); });
  ctl.addEventListener("click", (e) => {
    const st = e.target.closest("[data-step]");
    if (st) { const k = st.dataset.k; set(k, (PRD.t[k] || 0) + Number(st.dataset.step) / 10); return; }
    const fr = e.target.closest("[data-from]");
    if (fr) {
      if (Object.keys(PRD.o).length && !confirm("También se borrarán los cambios que has hecho en circunscripciones concretas. ¿Continuamos?")) return;
      PRD.from = fr.dataset.from; PRD.t = prdStart(PRD.from); PRD.o = {}; prdSave();
      $$(".prd-row", ctl).forEach((row) => { const k = row.dataset.row; $(".prd-rng", row).value = PRD.t[k]; $(".prd-num input", row).value = prdFmt(PRD.t[k]); });
      $$(".prd-from button", ctl).forEach((b) => b.classList.toggle("on", b.dataset.from === PRD.from));
      prdPaint();
    }
  });
}
const prdQueue = () => { cancelAnimationFrame(PRD.raf); PRD.raf = requestAnimationFrame(prdPaint); };

// La predicció que es mostra: la compartida o la pròpia
const prdCur = () => (PRD.shared ? { t: { ...prdStart("2023"), ...PRD.shared.t }, o: PRD.shared.o, name: PRD.shared.name } : { t: PRD.t, o: PRD.o, name: PRD.name });

function prdPaint() {
  const root = $("#escons-page"), out = $("#prd-out", root);
  if (!out) return;
  const cur = prdCur(), d = prdCompute(cur.t, cur.o);
  PRD.d = d;
  // Controls: escons de cada partit, percentatge on es presenta i la suma
  if (!PRD.shared) {
    PRD_IDS.forEach((k) => {
      const s = $(`[data-seats="${k}"]`, root); if (s) s.textContent = d.seats[k] || 0;
      const l = $(`[data-loc="${k}"]`, root), loc = prdLocal(d, k);
      if (l) l.textContent = loc && loc.where ? `≈ ${prdFmt(loc.pct)} % a ${loc.where}` : loc ? `≈ ${prdFmt(loc.pct)} % donde se presenta` : "";
    });
    const mini = $("[data-mini]", root);
    if (mini) mini.innerHTML = d.ranking.filter((k) => d.seats[k]).slice(0, 5).map((k) => `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} <b>${d.seats[k]}</b></span>`).join("") + NIT_GOV.map((g) => { const n = g.core.reduce((a, k) => a + (d.seats[k] || 0), 0); return `<em class="${n >= NIT_MAJ ? "ok" : ""}">${g.core.map(nitSig).join("+")} ${n}</em>`; }).join("");
    const B = prdBase(), sum = prdSum(cur.t);
    const el = $("[data-sum]", root);
    el.classList.toggle("over", d.over > 0);
    el.innerHTML = d.over > 0
      ? `⚠️ Los partidos suman <b>${prdFmt(sum)} %</b>: te pasas ${prdFmt(d.over)} puntos. Los reducimos todos en proporción; quita votos a alguien para que cuadre.`
      : `Partidos: <b>${prdFmt(sum)} %</b> · en blanco: ${prdFmt(B.blank)} % · otras candidaturas: ${prdFmt(d.altres)} %${Object.keys(cur.o).length ? ` · <b>${Object.keys(cur.o).length}</b> circunscripciones retocadas a mano <button type="button" class="linkish" data-prd-unall>deshazlo</button>` : ""}`;
    $("[data-prd-unall]", el)?.addEventListener("click", () => { PRD.o = {}; prdSave(); prdPaint(); });
  }
  const ref = nit2023();
  const p = PRD.sel !== null ? d.provs.find((x) => x.i === PRD.sel) : null;
  const ballen = d.ballen.slice(0, 6);
  out.innerHTML = `
    <section class="card prd-sum-card">
      <div class="prd-top">${nitHemi(d, "").replace(/<small>[^<]*<\/small>/, "<small>escons</small>")}<div class="prd-verdict">${prdVerdict(d)}</div></div>
      ${nitRace(d, { compare: true, open: PRD.party })}
      <p class="prd-note">Diferencia con 2023: escaños que sacó cada partido (Sumar, ahora Frente Amplio y Podemos, sacó 31).</p>
      <div class="prd-share">
        <button class="btn primary" type="button" data-prd-img>🖼️ Descarga la imagen</button>
        <button class="btn" type="button" data-prd-link>🔗 Copia el enlace</button>
        ${navigator.share ? `<button class="btn" type="button" data-prd-share>📤 Comparte</button>` : ""}
      </div>
      ${PRD.shared ? "" : `<label class="prd-name">Tu nombre en la imagen y el enlace <small>(opcional)</small><input type="text" maxlength="40" value="${esc(PRD.name)}" placeholder="Por ejemplo, Laia" data-prd-name></label>`}
    </section>
    <section class="card prd-mapcard">
      <div class="prd-maph"><h2>Escaños por circunscripción</h2><p class="muted">Cada punto es un escaño. El color de fondo es el partido más votado: cuanto más intenso, más amplia es su victoria.</p></div>
      <div class="prd-mapbox">${prdMapSvg(d)}</div>
      <div id="prd-prov" class="prd-prov">${p ? prdProvHtml(p, ref) : `<p class="muted nt-pick">👆 Toca una circunscripción para ver cómo se reparten los escaños${PRD.shared ? "" : " o cambiar sus porcentajes"}.</p>`}</div>
    </section>
    ${nitGovHtml(d, "con esta predicción")}
    ${ballen.length ? `<section class="card prd-fil"><h2>Los escaños que penderían de un hilo</h2><p class="muted">Donde el último escaño se decidiría por menos de un 1 % de los votos. Toca uno para verlo en el mapa.</p><div class="nt-duels">${ballen.map((x) => nitDuel(x)).join("")}</div></section>` : ""}
    <section class="card prd-tab"><details><summary>Todas las circunscripciones</summary>${prdTableHtml(d, ref)}</details></section>`;
  prdPaintMap(out, d);
  prdBindOut(out, d);
}

// Frase de resum: qui guanya i si algú arriba a 176
function prdVerdict(d) {
  const [a, b] = d.ranking;
  if (!a) return "";
  const g = NIT_GOV.map((x) => nitGov(d, x));
  const line = (x) => `${x.core.map((k) => nitSig(k)).join(" + ")}: <b>${x.sum}</b>${x.sum >= NIT_MAJ ? " · mayoría absoluta" : x.st === "suports" ? ` · con apoyos, ${x.all}` : ""}`;
  return `<p class="prd-v1"><span style="--c:${nitParty(a).color}"><i></i>${esc(nitSig(a))}</span> gana con <b>${d.seats[a] || 0}</b> escaños${b ? `, ${(d.seats[a] || 0) - (d.seats[b] || 0)} más que ${esc(nitSig(b))}` : ""}.</p>
    <ul class="prd-v2">${g.map((x) => `<li>${line(x)}</li>`).join("")}</ul>
    <p class="prd-v3">Mayoría absoluta: 176</p>`;
}

function prdProvHtml(p, ref) {
  if (PRD.edit === p.code) return prdProvEditHtml(p);
  const retoc = !!prdCur().o[p.code];
  return `${nitProvDetail(p, ref)}
    <div class="prd-pv-v">${Object.entries(p.vots).filter(([k, n]) => k !== "altres" && n > 0).sort((x, y) => y[1] - x[1]).map(([k, n]) => `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} ${espPct((n / p.valid) * 100)}</span>`).join("")}</div>
    ${PRD.shared ? "" : `<div class="prd-pv-act"><button class="btn sm" type="button" data-prd-edit="${p.code}">✏️ Cambia los votos de aquí</button>${retoc ? `<button class="btn sm ghost" type="button" data-prd-unedit="${p.code}">Vuelve al cálculo general</button><span class="prd-retoc">Retocada a mano</span>` : ""}</div>`}`;
}
function prdProvEditHtml(p) {
  const B = prdBase(), ov = prdCur().o[p.code];
  const ks = PRD_IDS.filter((k) => B.where[k].codes.has(p.code) || k === "podemos" || k === "salf");
  const val = (k) => ov ? (ov[k] || 0) : Math.round(((p.vots[k] || 0) / p.valid) * 1000) / 10;
  return `<h3>${esc(p.name)} <small>· ${p.seats} ${p.seats === 1 ? "escaño" : "escaños"}</small></h3>
    <p class="muted">Porcentaje de voto en ${esc(p.name)}. Esta circunscripción ya no seguirá los cambios generales hasta que la devuelvas al cálculo general.</p>
    <div class="prd-rows prd-rows-pv">${ks.map((k) => { const pp = nitParty(k); return `<div class="prd-row" style="--c:${pp.color}"><span class="prd-n"><i></i><b>${esc(pp.sig)}</b></span>
      <input class="prd-rng" type="range" min="0" max="70" step="0.1" value="${val(k)}" data-pk="${k}" aria-label="${esc(pp.sig)} a ${esc(p.name)}">
      <span class="prd-num"><input type="text" inputmode="decimal" value="${prdFmt(val(k))}" data-pk="${k}" aria-label="${esc(pp.sig)}, porcentaje en ${esc(p.name)}"></span>
      <b class="prd-seats">${p.an.won[k] || 0}</b></div>`; }).join("")}</div>
    <div class="prd-pv-act"><button class="btn sm primary" type="button" data-prd-done>Hecho</button><button class="btn sm ghost" type="button" data-prd-unedit="${p.code}">Vuelve al cálculo general</button></div>`;
}

function prdTableHtml(d, ref) {
  const rows = [...d.provs].sort((a, b) => b.seats - a.seats || a.name.localeCompare(b.name));
  return `<div class="prd-tw"><table class="prd-t"><thead><tr><th>Circunscripción</th><th>Escaños</th><th>Reparto</th><th>Primero</th><th>Último escaño</th></tr></thead><tbody>${rows.map((p) => {
    const r23 = ref.provs.find((x) => x.code === p.code);
    const ch = Object.keys({ ...p.an.won, ...(r23?.won || {}) }).filter((k) => (p.an.won[k] || 0) !== (r23?.won[k] || 0));
    return `<tr data-prov="${p.i}"><th scope="row">${esc(p.name)}${prdCur().o[p.code] ? " ✏️" : ""}</th><td>${p.seats}</td>
      <td class="prd-t-s">${Object.entries(p.an.won).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} ${n}</span>`).join("")}${ch.length && r23 ? `<small title="Cambios respecto a 2023">≠ 2023</small>` : ""}</td>
      <td>${p.winner ? `${esc(nitSig(p.winner))} ${espPct((p.vots[p.winner] / p.valid) * 100)}` : ""}</td>
      <td>${p.an.challenger ? `${esc(nitSig(p.an.holder))} · a ${esc(nitSig(p.an.challenger))} le faltan ${nitN(p.an.need)} votos (${nitPct(p.an.margin, 2)})` : ""}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function prdBindOut(out, d) {
  $("[data-prd-name]", out)?.addEventListener("input", (e) => { PRD.name = e.target.value.trim().slice(0, 40); prdSave(); });
  $("[data-prd-img]", out)?.addEventListener("click", () => prdShareImage(d, false));
  $("[data-prd-share]", out)?.addEventListener("click", () => prdShareImage(d, true));
  $("[data-prd-link]", out)?.addEventListener("click", async () => {
    const c = prdCur(), url = prdUrl(c.t, c.o, c.name);
    try { await navigator.clipboard.writeText(url); toast("Enlace copiado: quien lo abra verá tu predicción y podrá mirar el detalle"); }
    catch { prompt("Copia este enlace:", url); }
    window.Stats?.add("sh", 1, "escons_link");
  });
  out.addEventListener("click", (e) => {
    const t = e.target;
    const go = t.closest("[data-prov]");
    if (go && !t.closest(".prd-prov")) { PRD.sel = Number(go.dataset.prov); PRD.edit = null; prdPaint(); $("#prd-prov")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const pa = t.closest(".nt-row[data-party]");
    if (pa) { PRD.party = PRD.party === pa.dataset.party ? null : pa.dataset.party; prdPaint(); return; }
    const ed = t.closest("[data-prd-edit]");
    if (ed) { PRD.edit = ed.dataset.prdEdit; prdPaint(); return; }
    const un = t.closest("[data-prd-unedit]");
    if (un) { delete PRD.o[un.dataset.prdUnedit]; PRD.edit = null; prdSave(); prdPaint(); return; }
    if (t.closest("[data-prd-done]")) { PRD.edit = null; prdPaint(); }
  });
  // Retoc d'una circumscripció
  const pv = $(".prd-rows-pv", out);
  if (pv) {
    const p = d.provs.find((x) => x.code === PRD.edit);
    pv.addEventListener("input", (e) => {
      const k = e.target.dataset.pk;
      if (!k || !p) return;
      const v = e.target.type === "range" ? Number(e.target.value) : prdParse(e.target.value);
      if (v === null) return;
      if (!PRD.o[p.code]) PRD.o[p.code] = Object.fromEntries($$("[data-pk].prd-rng", pv).map((r) => [r.dataset.pk, Number(r.value)]));
      PRD.o[p.code][k] = Math.round(v * 10) / 10;
      if (e.target.type === "range") $(`.prd-num input[data-pk="${k}"]`, pv).value = prdFmt(v); else $(`.prd-rng[data-pk="${k}"]`, pv).value = v;
      prdSave();
      // Només s'actualitzen els escons d'aquí; la resta, en deixar anar
      const dd = prdCompute(PRD.t, PRD.o), np = dd.provs.find((x) => x.code === p.code);
      $$(".prd-row", pv).forEach((row) => { const kk = $("[data-pk]", row).dataset.pk; $(".prd-seats", row).textContent = np.an.won[kk] || 0; });
    });
    pv.addEventListener("change", (e) => { if (e.target.dataset.pk) prdQueue(); });
  }
}

// ---------- Imatge (1080 × 1350) ----------
function prdCanvas(d, name) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d", MUTED = "#5e5a74";
  const display = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#ffcf3d"; c.fillRect(0, 0, W, 14);
  // Capçalera
  c.textAlign = "left"; c.fillStyle = MUTED; c.font = sans(28, 700);
  c.fillText("Elecciones generales · 29 de noviembre", 56, 76);
  c.fillStyle = INK; c.font = display(50);
  c.fillText(name ? `La predicción de ${name}` : "Mi predicción", 56, 140, W - 112);
  // Hemicicle
  const ids = Object.keys(d.seats).filter((k) => d.seats[k]).sort((a, b) => (ESP_ORDER.indexOf(a) + 1 || 50) - (ESP_ORDER.indexOf(b) + 1 || 50));
  const seats = hemicycleSeats(350), cx = 300, cy = 450, R = 240;
  let n = 0;
  ids.forEach((k) => { c.fillStyle = nitParty(k).color; for (let j = 0; j < d.seats[k]; j++) { const s = seats[n++]; c.beginPath(); c.arc(cx + s.x * R, cy + s.y * R, 5.6, 0, Math.PI * 2); c.fill(); } });
  c.textAlign = "center"; c.fillStyle = INK; c.font = display(40); c.fillText("350", cx, cy - 8);
  c.font = sans(21, 700); c.fillStyle = MUTED; c.fillText("escaños · mayoría absoluta: 176", cx, cy + 34);
  // Llegenda: escons i diferència amb el 2023
  const rows = d.ranking.filter((k) => d.seats[k]);
  rows.splice(12);
  const col = (k) => nitParty(k).color, lh = rows.length > 10 ? 26 : 30;
  let y = 196;
  c.textAlign = "left";
  rows.forEach((k) => {
    const s = d.seats[k], ref = nit2023().seats[k], diff = ref === undefined ? null : s - ref;
    c.fillStyle = col(k); c.beginPath(); c.arc(588, y - 8, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.font = sans(24, 800); c.fillText(nitSig(k), 608, y);
    c.textAlign = "right"; c.font = display(24); c.fillText(String(s), 900, y);
    c.font = sans(20, 700); c.fillStyle = diff > 0 ? "#12804a" : diff < 0 ? "#d2331a" : MUTED;
    c.fillText(diff === null ? "nou" : diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}`, 970, y);
    c.font = sans(20, 600); c.fillStyle = MUTED; c.fillText(espPct((d.tot[k] / d.valid) * 100), 1040, y);
    c.textAlign = "left"; y += lh;
  });
  // Blocs
  const g = NIT_GOV.map((x) => nitGov(d, x));
  c.font = sans(23, 700); c.fillStyle = INK; c.textAlign = "left";
  g.forEach((x, j) => c.fillText(`${x.core.map(nitSig).join(" + ")}: ${x.sum}${x.sum >= NIT_MAJ ? " ✔ mayoría" : ""}`, 56 + j * 500, 566));
  // Mapa amb els punts
  const M = SIM_MAP, sc = Math.min((W - 80) / M.w, 640 / M.h), ox = (W - M.w * sc) / 2, oy = 596;
  c.save(); c.translate(ox, oy); c.scale(sc, sc);
  c.beginPath(); c.roundRect ? c.roundRect(0, 0, M.w, M.h, 14) : c.rect(0, 0, M.w, M.h); c.fillStyle = "#dcebf3"; c.fill(); c.clip();
  c.fillStyle = "#efe6d2"; c.strokeStyle = "#c9bc9f"; c.lineWidth = 1; const bg = new Path2D(M.bg); c.fill(bg); c.stroke(bg);
  c.setLineDash([5, 4]); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.roundRect ? c.roundRect(M.can.x, M.can.y, M.can.w, M.can.h, 10) : c.rect(M.can.x, M.can.y, M.can.w, M.can.h); c.stroke(); c.setLineDash([]);
  d.provs.forEach((p) => {
    const path = new Path2D(M.provs[p.code].d), w = p.winner ? nitParty(p.winner) : null, share = w ? (p.vots[p.winner] || 0) / p.valid : 0;
    c.fillStyle = w ? prdMix(w.color, 0.22 + Math.min(0.4, Math.max(0, share - 0.2))) : "#fffaf0"; c.fill(path);
    c.strokeStyle = "rgba(23,23,61,.55)"; c.lineWidth = 0.8; c.stroke(path);
  });
  const cl = prdClusters(d);
  cl.forEach((k) => { if (!k.moved) return; c.strokeStyle = "rgba(23,23,61,.6)"; c.lineWidth = 1; c.beginPath(); c.moveTo(k.x0, k.y0); c.lineTo(k.x, k.y); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(k.x0, k.y0, 2.2, 0, Math.PI * 2); c.fill(); });
  cl.forEach((k) => k.dots.forEach((o) => { c.fillStyle = "#fffaf0"; c.beginPath(); c.arc(o.x, o.y, PRD_DOT.r + 0.9, 0, Math.PI * 2); c.fill(); c.fillStyle = nitParty(o.k).color; c.beginPath(); c.arc(o.x, o.y, PRD_DOT.r, 0, Math.PI * 2); c.fill(); }));
  c.restore();
  // Peu
  c.textAlign = "left"; c.fillStyle = INK; c.font = display(28); c.fillText("Política en Joc", 56, H - 46);
  c.textAlign = "right"; c.font = sans(21, 600); c.fillStyle = MUTED;
  c.fillText("Haz la tuya: politicaenjoc.cat/es/#escons", W - 56, H - 60);
  c.fillText("Predicción personal, no es ninguna encuesta", W - 56, H - 32);
  return cv;
}
async function prdShareImage(d, native) {
  const c = prdCur();
  try { await document.fonts?.ready; } catch { /* sense fonts */ }
  const cv = prdCanvas(d, c.name), url = prdUrl(c.t, c.o, c.name);
  const [a, b] = d.ranking;
  const text = `${c.name ? `La predicción de ${c.name} para el 29N` : "Mi predicción para el 29N"}: ${nitSig(a)} ${d.seats[a]}, ${nitSig(b)} ${d.seats[b]}. Mírala provincia a provincia y haz la tuya:
${url}`;
  if (native) return shareCanvas(cv, "prediccio-29n.png", text, "escons");
  window.Stats?.add("sh", 1, "escons_descarrega");
  const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
  if (!blob) return;
  const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = "prediccio-29n.png"; document.body.appendChild(el); el.click(); el.remove();
  setTimeout(() => URL.revokeObjectURL(el.href), 2000);
  toast("Imagen descargada");
}
