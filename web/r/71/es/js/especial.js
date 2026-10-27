// Especial del 29N: l'app canvia sola de fase segons l'hora oficial (jornada de reflexió, jornada electoral,
// nit electoral i l'endemà). Des de la Sala de control (control.js) es poden forçar fases, obrir o tancar la porra,
// entrar la participació oficial, posar un missatge i fer un simulacre. La configuració arriba en directe
// (escolta de Firestore) i els resultats s'actualitzen sols cada pocs segons, sense recarregar.
// Si la configuració no es pot llegir, l'horari automàtic funciona igualment.
//
// Regles: res de propaganda el 28N i el 29N, i cap enquesta (ni la suma de les porres) fins que tanquin els col·legis.

const ESP_T = {
  porra: Date.UTC(2026, 10, 19, 23),   // 20N 00:00: s'obre la porra
  previa: Date.UTC(2026, 10, 27, 23),  // 28N 00:00: jornada de reflexió
  dia: Date.UTC(2026, 10, 28, 23),     // 29N 00:00: jornada electoral
  obre: Date.UTC(2026, 10, 29, 8),     // 29N 09:00: obren els col·legis
  nit: Date.UTC(2026, 10, 29, 19),     // 29N 20:00: tanquen els col·legis (a Canàries, una hora més tard)
  endema: Date.UTC(2026, 10, 30, 5),   // 30N 06:00
  fi: Date.UTC(2026, 11, 20, 23),      // 21D: s'acaba l'especial
};
const ESP_KEY = "r29n-esp";            // darrera configuració llegida (per pintar de seguida)
const ESP_PORRA_KEY = "r29n-porra";    // la porra de cada persona (només al dispositiu)
const ESP_PRED_KEY = "r29n-nit";       // prediccions de la nit electoral (només al dispositiu)
const ESP_PREVIEW_KEY = "r29n-esp-preview"; // previsualització de la Sala de control (només aquesta pestanya)
const ESP_DEFAULT = {
  fase: "auto", resultats: "auto", porra: "auto", missatge: "",
  participacio: [{ h: "14:00", v: null, ref: 40.48 }, { h: "18:00", v: null, ref: 53.12 }],
  simInici: 0, simDurada: 20, log: [],
};
// Ordre a l'hemicicle (d'esquerra a dreta, aproximat) i referència del 2023 (escons, % de vots)
const ESP_ORDER = ["podemos", "bildu", "bng", "fa", "erc", "psoe", "pnv", "cc", "junts", "pp", "salf", "vox"];
const ESP_2023 = { pp: [137, 33.05], psoe: [121, 31.7], vox: [33, 12.39], fa: [31, 12.31], erc: [7, 1.89], junts: [7, 1.6], bildu: [6, 1.36], pnv: [5, 1.12], bng: [1, 0.62], cc: [1, 0.47] };
const ESP_POLL = { simulacre: 12000, oficial: 25000 };

const Esp = {
  cfg: Object.assign({}, ESP_DEFAULT, store.get(ESP_KEY, {})),
  live: false,     // escolta de la configuració activa
  data: null,      // resultats calculats
  prev: null,      // resultats anteriors (per detectar canvis)
  feed: [],        // última hora de l'escrutini
  timer: 0,
  fetchedAt: 0,
};

function espPreview() {
  try { return JSON.parse(sessionStorage.getItem(ESP_PREVIEW_KEY) || "null"); } catch { return null; }
}
const espNow = () => {
  const pv = espPreview();
  return pv?.t ? pv.t + (Date.now() - (pv.at || Date.now())) : Date.now();
};

// Fase efectiva: la forçada a la Sala de control o la de l'horari
function espFase() {
  const pv = espPreview();
  if (pv?.fase && pv.fase !== "auto") return pv.fase;
  if (Esp.cfg.fase && Esp.cfg.fase !== "auto") return Esp.cfg.fase;
  const t = espNow();
  if (t >= ESP_T.fi || t < ESP_T.previa) return "off";
  if (t < ESP_T.dia) return "previa";
  if (t < ESP_T.nit) return "dia";
  if (t < ESP_T.endema) return "nit";
  return "despres";
}
function espResultsMode() {
  const pv = espPreview();
  const m = pv?.resultats && pv.resultats !== "auto" ? pv.resultats : Esp.cfg.resultats;
  if (m && m !== "auto") return m;
  return ["nit", "despres"].includes(espFase()) ? "oficial" : "off";
}
function espPorraState() {
  const m = Esp.cfg.porra;
  if (m === "off") return "off";
  if (m === "oberta") return "oberta";
  if (m === "tancada") return "tancada";
  const t = espNow();
  if (t < ESP_T.porra || t >= ESP_T.fi) return "off";
  return t < ESP_T.nit && !["nit", "despres"].includes(espFase()) ? "oberta" : "tancada";
}

// ---------- Configuració en directe (Firestore: config/especial) ----------
async function espLoadConfig() {
  for (let i = 0; i < 40 && !window.Online?.getConfig; i++) await new Promise((r) => setTimeout(r, 250));
  const apply = (c) => {
    if (!c) return;
    const key = () => JSON.stringify([espFase(), espResultsMode(), espPorraState(), Esp.cfg.missatge, Esp.cfg.participacio, Esp.cfg.simInici]);
    const before = key();
    const storiesBefore = Esp.cfg.storiesAt;
    Esp.cfg = Object.assign({}, ESP_DEFAULT, c);
    if (storiesBefore !== Esp.cfg.storiesAt && location.hash.startsWith("#noticies") && typeof renderNews === "function") renderNews();
    store.set(ESP_KEY, Esp.cfg);
    if (before !== key()) { Esp.data = null; Esp.prev = null; Esp.feed = []; espRefresh(true); }
    if (espView() === "control") window.renderControl?.(true);
  };
  const applyAvis = (c) => { apply(c); Esp.ready = true; espAvis(); };
  if (window.Online?.watchConfig) Esp.live = !!window.Online.watchConfig("especial", applyAvis);
  if (!Esp.live) applyAvis(await window.Online?.getConfig?.("especial"));
  Esp.ready = true;
  espRefresh(true);
  espAvis();
}

// ---------- Avís de la Lliga de pronòstics (es llança des de la Sala de control) ----------
const ESP_AVIS_KEY = "r29n-avis";
const ESP_AVIS_STEPS = [
  "Entra con tu cuenta y abre la Liga de pronósticos.",
  "Responde al menos 5 de las 8 preguntas sobre el 29N.",
  "Reparte tus 1.000 fichas: pon más donde estés más seguro.",
  "En cada pregunta, las fichas de quienes fallan se reparten a partes iguales entre quienes aciertan.",
  "Juega con tus ligas de amigos. Las fichas que ganes se quedan para las municipales de 2027.",
];
const espAvisOn = () => !!(Esp.cfg.avisOn && Esp.cfg.avisId);
// Diapositiva per al carrusel de la primera visita
function espAvisSlide() {
  const t = Date.now();
  if (!espAvisOn() && !(t >= PRON_OPEN && t < PRON_CLOSE)) return null;
  return { t: "Nuevo: Liga de pronósticos del 29N", d: "Reparte 1.000 fichas (de mentira, sin ningún valor) entre tus pronósticos de las elecciones y compite con tus amigos. Se cierra a las 20:00 del 29N.", art: "majoria", steps: ESP_AVIS_STEPS };
}
const espAvisSeen = () => { if (Esp.cfg.avisId) store.set(ESP_AVIS_KEY, Esp.cfg.avisId); };
function espAvis() {
  if (!espAvisOn() || store.get(ESP_AVIS_KEY, null) === Esp.cfg.avisId) return;
  if (!store.get("r29n-onboard", null)) return; // la primera visita ja ho mostra al carrusel
  const v = espView();
  if (["joc", "control", "pronostics", "legal"].includes(v) || document.querySelector(".onb, .esp-avis")) return;
  espAvisSeen();
  const box = h(`<div class="onb esp-avis" role="dialog" aria-modal="true" aria-label="Liga de pronósticos"><div class="onb-card card">
    <div class="onb-art esp-avis-art"><span>🎟️</span><b>1.000</b><small>fichas</small></div>
    <div class="onb-body"><p class="kicker">Nuevo · hasta las 20:00 del 29N</p><h3>Liga de pronósticos</h3>
      <p>Reparte fichas de mentira (no tienen ningún valor) entre tus pronósticos del 29N y compite con tus amigos. Así se juega:</p>
      <ol class="esp-avis-steps">${ESP_AVIS_STEPS.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <div class="row"><button class="btn ghost" type="button" data-later>Más tarde</button><a class="btn primary" href="#pronostics" data-go>Haz los pronósticos</a></div></div>
  </div></div>`);
  document.body.appendChild(box);
  const close = () => box.remove();
  $("[data-later]", box).addEventListener("click", close);
  $("[data-go]", box).addEventListener("click", close);
  box.addEventListener("click", (ev) => { if (ev.target === box) close(); });
  $("[data-go]", box).focus();
}
window.addEventListener("hashchange", () => setTimeout(espAvis, 300));
function espView() { return location.hash.slice(1).split("/")[0] || "inici"; }
function espRefresh(full = false) {
  const v = espView();
  if (v === "inici") renderHomeEspecial();
  if (v === "nit") full ? renderNit() : espPaint();
  espSchedule();
}

// ---------- Resultats ----------
// Format normalitzat: { escrutat, participacio, actualitzat, provs: [{ code, escrutat, vots: { id: n }, blanc }] }
function espSimulacre(progress) {
  // Simulacre amb dades inventades (punt de partida: el 2023), per provar la nit electoral
  const rnd = (s) => { const x = Math.sin(s * 9301.7) * 49297; return x - Math.floor(x); };
  const REG = { "Cataluña": { erc: 13, junts: 11 }, "País Vasco": { bildu: 24, pnv: 23 }, Navarra: { bildu: 17 }, "Galicia": { bng: 10 }, "Canarias": { cc: 9 } };
  const provs = SIM_PROVS.map((p, i) => {
    const reg = REG[p.ccaa] || {};
    const sh = {};
    const rest = 100 - Object.values(reg).reduce((a, b) => a + b, 0);
    const base = Object.entries(SIM_START_SHARE).filter(([k]) => !["erc", "junts", "bildu", "pnv", "bng", "cc"].includes(k));
    const bt = base.reduce((a, [, v]) => a + v, 0);
    base.forEach(([k, v], j) => { sh[k] = (v / bt) * rest * (0.8 + 0.4 * rnd(i * 31 + j)); });
    Object.assign(sh, reg);
    const votants = p.pop * 0.78 * 0.66;
    const esc = Math.max(0, Math.min(100, (progress * (1.08 + 0.25 * rnd(i + 7)) - 0.04 * rnd(i)) * 100));
    const vots = {};
    // Els primers vots escrutats es desvien una mica del resultat final
    Object.entries(sh).forEach(([k, s], j) => { vots[k] = Math.round((votants * s) / 100 * (esc / 100) * (1 + 0.14 * (rnd(i * 13 + j) - 0.5) * (1 - progress))); });
    return { code: p.code, escrutat: Math.round(esc * 10) / 10, vots, blanc: Math.round(votants * 0.009 * (esc / 100)) };
  });
  const totalPop = SIM_PROVS.reduce((a, p) => a + p.pop, 0);
  const esc = provs.reduce((a, p, i) => a + p.escrutat * SIM_PROVS[i].pop, 0) / totalPop;
  return { escrutat: Math.round(esc * 10) / 10, participacio: 64.1 + 2.1 * progress, actualitzat: Date.now(), provs, simulacre: true };
}
async function espFetchResults() {
  const mode = espResultsMode();
  let raw = null;
  if (mode === "simulacre") {
    const pv = espPreview();
    const start = (pv?.resultats === "simulacre" ? pv.simInici : 0) || Esp.cfg.simInici || Date.now();
    const dur = ((pv?.resultats === "simulacre" ? pv.simDurada : 0) || Esp.cfg.simDurada || 20) * 60000;
    raw = espSimulacre(Math.max(0, Math.min(1, (Date.now() - start) / dur)));
  } else if (mode === "oficial") {
    try {
      const r = await fetch(`${window.PEJ_DATA || "../data/"}resultats.json?t=${Math.floor(Date.now() / 15000)}`, { cache: "no-cache" });
      if (r.ok) raw = await r.json();
    } catch { /* encara no hi ha dades */ }
  }
  Esp.fetchedAt = Date.now();
  const d = raw && raw.provs?.length ? espCompute(raw) : null;
  if (d) { espEvents(Esp.data, d); Esp.prev = Esp.data; }
  Esp.data = d;
  return d;
}
// Escons per circumscripció (Llei d'Hondt amb el llindar del 3 % dels vots vàlids) i totals
function espCompute(raw) {
  const tot = {}, seats = {}, perProv = [];
  let valid = 0;
  raw.provs.forEach((pr) => {
    const p = SIM_PROVS.find((x) => x.code === pr.code);
    if (!p) return;
    const ids = Object.keys(pr.vots);
    const v = ids.map((k) => pr.vots[k] || 0);
    const val = v.reduce((a, b) => a + b, 0) + (pr.blanc || 0);
    valid += val;
    ids.forEach((k, j) => { tot[k] = (tot[k] || 0) + v[j]; });
    const ok = v.map((x) => (val && x / val >= 0.03 ? x : 0));
    const d = val ? dhondt(ok, p.seats) : { won: v.map(() => 0), winners: [], next: null };
    const won = {};
    ids.forEach((k, j) => { if (d.won[j]) { won[k] = d.won[j]; seats[k] = (seats[k] || 0) + d.won[j]; } });
    // Escó a l'aire: l'últim escó i qui el podria prendre
    let air = null;
    const last = d.winners[d.winners.length - 1];
    if (last && val) {
      let best = null;
      ids.forEach((k, j) => {
        if (j === last.pi || !ok[j]) return;
        const need = Math.floor(last.q * (d.won[j] + 1) - ok[j]) + 1;
        if (need > 0 && (!best || need < best.need)) best = { k, need };
      });
      if (best) air = { holder: ids[last.pi], rival: best.k, need: best.need };
    }
    const top = ids.map((k, j) => [k, v[j]]).sort((a, b) => b[1] - a[1])[0];
    perProv.push({ i: p.i, code: p.code, name: p.name, seats: p.seats, escrutat: pr.escrutat, won, vots: pr.vots, valid: val, winner: top && top[1] ? top[0] : null, air });
  });
  const totalSeats = Object.values(seats).reduce((a, b) => a + b, 0);
  const ranking = Object.keys(tot).sort((a, b) => (seats[b] || 0) - (seats[a] || 0) || tot[b] - tot[a]);
  return { escrutat: raw.escrutat, participacio: raw.participacio, actualitzat: raw.actualitzat, simulacre: !!raw.simulacre, tot, valid, seats, totalSeats, provs: perProv, ranking };
}

// ---------- Última hora: què ha canviat respecte a l'actualització anterior ----------
function espEvents(a, b) {
  const add = (kind, text) => Esp.feed.unshift({ kind, text, t: Date.now() });
  const sig = (k) => espParty(k).sig;
  if (!a) {
    if (b.escrutat > 0) add("info", `Escrutinio en marcha: ${espPct(b.escrutat)} escrutado.`);
    return;
  }
  [5, 10, 25, 50, 75, 90, 95, 100].forEach((m) => { if (a.escrutat < m && b.escrutat >= m) add("fita", m === 100 ? "Escrutinio completado al 100 %." : `Ya se ha escrutado el ${m} % de los votos.`); });
  if (a.ranking[0] !== b.ranking[0] && b.seats[b.ranking[0]]) add("lider", `${sig(b.ranking[0])} pasa a ser la primera fuerza, con ${b.seats[b.ranking[0]]} escaños.`);
  const changes = Object.keys({ ...a.seats, ...b.seats }).map((k) => [k, (b.seats[k] || 0) - (a.seats[k] || 0)]).filter(([, d]) => d);
  changes.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3).forEach(([k, d]) => add(d > 0 ? "puja" : "baixa", `${sig(k)} ${d > 0 ? "gana" : "pierde"} ${Math.abs(d)} ${Math.abs(d) === 1 ? "escaño" : "escaños"} y tiene ${b.seats[k] || 0}.`));
  b.provs.forEach((p) => {
    const o = a.provs.find((x) => x.code === p.code);
    if (o && o.winner && p.winner && o.winner !== p.winner && p.escrutat > 20) add("gir", `Giro en ${p.name}: ahora gana ${sig(p.winner)}.`);
  });
  Esp.feed = Esp.feed.slice(0, 30);
}

// ---------- Bucle en directe (sense recarregar) ----------
function espSchedule() {
  clearTimeout(Esp.timer);
  const mode = espResultsMode();
  const v = espView();
  if (mode === "off" || !(v === "inici" || v === "nit" || v === "pronostics")) return;
  const wait = Esp.data && Esp.data.escrutat >= 100 && mode === "oficial" ? 120000 : ESP_POLL[mode] || 25000;
  Esp.timer = setTimeout(async () => {
    if (document.hidden) return espSchedule();
    await espFetchResults();
    const vv = espView();
    if (vv === "inici") renderHomeEspecial();
    if (vv === "nit") espPaint();
    if (vv === "pronostics" && PronState.tab !== "meus") renderPronostics();
    espSchedule();
  }, wait);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !["inici", "nit"].includes(espView())) return;
  espFetchResults().then(() => { if (espView() === "nit") espPaint(); else renderHomeEspecial(); });
});

// ---------- Utilitats ----------
const espParty = (k) => PARTIES.find((p) => p.id === k) || { id: k, sig: k.toUpperCase(), name: k, color: "#9a95a8" };
const espPct = (x, d = 1) => `${(Math.round(x * 10 ** d) / 10 ** d).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
function espCountdown(to) {
  const s = Math.max(0, Math.round((to - espNow()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}
function espAgo(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`;
}
function espHemi(d) {
  const ids = Object.keys(d.seats).filter((k) => d.seats[k]).sort((a, b) => (ESP_ORDER.indexOf(a) + 1 || 50) - (ESP_ORDER.indexOf(b) + 1 || 50));
  const list = ids.map((k) => ({ id: k, seats: d.seats[k], color: espParty(k).color }));
  const rest = 350 - d.totalSeats;
  if (rest > 0) list.push({ id: "pendent", seats: rest, color: "#ddd6c6" });
  return hemicycleSVG(list);
}
function espParticipacioHtml() {
  const rows = (Esp.cfg.participacio || []).filter((x) => x.v !== null && x.v !== "" && x.v !== undefined);
  if (!rows.length) return "";
  return `<div class="esp-part">${rows.map((x) => {
    const diff = x.ref ? Number(x.v) - Number(x.ref) : null;
    return `<div><small>Participación a las ${esc(x.h)}</small><b>${espPct(Number(x.v), 2)}</b>${diff !== null ? `<span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : "−"}${espPct(Math.abs(diff), 2)} respecto a 2023</span>` : ""}</div>`;
  }).join("")}</div>`;
}
const espMsg = () => (Esp.cfg.missatge ? `<p class="esp-msg">${esc(Esp.cfg.missatge)}</p>` : "");
function espPreviewBar() {
  const pv = espPreview();
  return pv ? `<div class="esp-preview">👁 Previsualización: ${esc(pv.label || "Sala de control")} · solo la ves tú <button type="button" data-esp-exit>Vuelve a la Sala de control</button></div>` : "";
}
function espBind(root) {
  $("[data-esp-exit]", root)?.addEventListener("click", () => { sessionStorage.removeItem(ESP_PREVIEW_KEY); Esp.data = null; Esp.prev = null; Esp.feed = []; location.hash = "#control"; });
}
function espRing(pct) {
  const r = 52, c = 2 * Math.PI * r;
  return `<svg class="esp-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" class="bg"/><circle cx="60" cy="60" r="${r}" class="fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - Math.min(100, pct) / 100)).toFixed(1)}"/></svg>`;
}

// ---------- Inici: la targeta de l'especial ----------
function renderHomeEspecial() {
  const el = $("#home-especial");
  if (!el) return;
  const f = espFase();
  const lliga = typeof pronState === "function" && pronState() === "oberta" ? `<a class="btn" href="#pronostics">🎟️ Liga de pronósticos</a>` : "";
  if (f === "off") {
    el.innerHTML = espPreviewBar() + (lliga ? `<section class="esp-home esp-pron">${espMsg()}<p class="esp-k">🎟️ Nuevo · hasta las 20:00 del 29N</p><h2>Liga de pronósticos</h2><p>Reparte 1.000 fichas entre tus pronósticos del 29N y compite con tus amigos. Las fichas que ganes se quedan para las municipales.</p><div class="esp-go"><a class="btn primary" href="#pronostics">Haz los pronósticos</a><a class="btn" href="#ranking">Crea una liga</a></div></section>` : "");
    espBind(el);
    return;
  }
  const porra = (espPorraState() === "oberta" ? `<a class="btn" href="#nit/porra">${espPorra() ? "Revisa tu porra" : "🎯 Haz tu porra"}</a>` : "") + lliga;
  let body = "";
  if (f === "previa") {
    body = `<p class="esp-k"><span class="dot-live"></span>Jornada de reflexión</p>
      <h2>Mañana se vota</h2>
      <p>Los colegios abren a las 9 de la mañana y cierran a las 8 de la tarde. Repasa cómo se vota y qué hay que llevar.</p>
      <div class="esp-go"><a class="btn primary" href="#apren">Cómo se vota</a>${porra}</div>`;
  } else if (f === "dia") {
    const open = espNow() >= ESP_T.obre, onTime = espNow() >= ESP_T.dia && espNow() < ESP_T.nit;
    body = `<p class="esp-k"><span class="dot-live"></span>Jornada electoral · 29 de noviembre</p>
      <h2>Hoy se vota</h2>
      <p>${!onTime ? "Los colegios abren a las 9:00 y cierran a las 20:00. A partir de las 20:00, la noche electoral en directo aquí mismo." : open ? `Los colegios cierran dentro de <b>${espCountdown(ESP_T.nit)}</b>. A partir de las 20:00, la noche electoral en directo aquí mismo.` : `Los colegios abren dentro de <b>${espCountdown(ESP_T.obre)}</b>.`}</p>
      ${espParticipacioHtml()}
      <div class="esp-go"><a class="btn primary" href="#apren">Cómo se vota</a>${porra}</div>`;
  } else {
    const d = espResultsMode() === "off" ? null : Esp.data;
    const live = f === "nit";
    const lead = d?.ranking?.[0] && d.seats[d.ranking[0]] ? espParty(d.ranking[0]) : null;
    body = `<p class="esp-k">${live ? `<span class="dot-live"></span>En directo` : "Elecciones generales del 29N"}${d?.simulacre ? " · SIMULACRO" : ""}</p>
      <h2>${live ? "Noche electoral" : "Los resultados del 29N"}</h2>
      ${d ? `<div class="esp-mini">${espHemi(d)}<div><b>${espPct(d.escrutat)}</b><small>escrutado</small>${lead ? `<p class="esp-mini-l"><i style="background:${lead.color}"></i>${esc(lead.sig)} · ${d.seats[lead.id]} escaños</p>` : ""}${Esp.feed[0] ? `<p class="esp-mini-f">⚡ ${esc(Esp.feed[0].text)}</p>` : ""}</div></div>` : `<p>${live ? "Los primeros resultados llegarán en unos minutos." : "Consulta los resultados y haz tu mayoría."}</p>`}
      <div class="esp-go"><a class="btn primary" href="#nit">${live ? "Síguela en directo" : "Resultados y mayorías"}</a>${live ? `<a class="btn" href="#nit/prediccions">🎲 Juega mientras se escruta</a>` : ""}</div>`;
  }
  el.innerHTML = `${espPreviewBar()}<section class="esp-home esp-${f}">${espMsg()}${body}</section>`;
  espBind(el);
  if (["nit", "despres"].includes(f) && !Esp.data && espResultsMode() !== "off") espFetchResults().then((d) => { if (d && espView() === "inici") renderHomeEspecial(); });
  espSchedule();
}

// ---------- La porra (abans de la votació) ----------
function espPorra() { return store.get(ESP_PORRA_KEY, null); }
const espPorraIds = () => Object.keys(SIM_START_SHARE).sort((a, b) => (SIM_START_SHARE[b] || 0) - (SIM_START_SHARE[a] || 0));
function espPorraHtml(d) {
  const st = espPorraState();
  const mine = espPorra();
  const ids = espPorraIds();
  if (st === "oberta") {
    const s = mine?.s || Object.fromEntries(ids.map((k) => [k, ESP_2023[k]?.[0] || 0]));
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    return `<section class="card esp-porra" id="esp-porra" data-porra>
      <h2 class="section-title sm">🎯 Tu porra</h2>
      <p class="muted">¿Cuántos escaños sacará cada partido? Se cierra a las 20:00 del 29N y por la noche verás en directo cuánto te acercas. Solo se guarda en este dispositivo y no se publica en ningún sitio.</p>
      <div class="esp-porra-list">${ids.map((k) => { const p = espParty(k); return `<div class="esp-pr" style="--c:${p.color}"><i></i><b>${esc(p.sig)}</b><button type="button" data-pm="${k}" aria-label="Menos ${esc(p.sig)}">−</button><input type="text" inputmode="numeric" maxlength="3" data-pv="${k}" value="${s[k] || 0}" aria-label="Escaños de ${esc(p.sig)}"><button type="button" data-pp="${k}" aria-label="Más ${esc(p.sig)}">+</button></div>`; }).join("")}</div>
      <p class="esp-porra-tot">Total: <b data-ptot>${total}</b> de 350 <span data-pmsg></span></p>
      <button class="btn primary" type="button" data-psave>Guarda la porra</button>
    </section>`;
  }
  if (!mine || st === "off") return "";
  const real = d ? d.seats : null;
  const dev = real ? ids.reduce((a, k) => a + Math.abs((mine.s[k] || 0) - (real[k] || 0)), 0) : null;
  const done = d && d.escrutat >= 100;
  return `<section class="card esp-porra" id="esp-porra">
    <h2 class="section-title sm">🎯 Tu porra</h2>
    ${real ? `<p class="esp-porra-res">${done ? "Resultado final" : "Ahora mismo"}: te has desviado <b>${dev}</b> ${dev === 1 ? "escaño" : "escaños"}${done ? ` · ${dev <= 10 ? "¡Brutal! 🏆" : dev <= 25 ? "¡Muy bien! 👏" : dev <= 50 ? "No está mal" : "Hay margen"}` : ""}</p>` : `<p class="muted">Se puntuará con los resultados de la noche electoral.</p>`}
    <div class="esp-porra-cmp">${ids.filter((k) => mine.s[k] || real?.[k]).map((k) => { const p = espParty(k); return `<span style="--c:${p.color}"><i></i>${esc(p.sig)} <b>${mine.s[k] || 0}</b>${real ? ` <small class="${(real[k] || 0) === (mine.s[k] || 0) ? "up" : ""}">(${real[k] || 0})</small>` : ""}</span>`; }).join("")}</div>
  </section>`;
}
function espPorraBind(root) {
  const box = $("[data-porra]", root);
  if (!box) return;
  const s = {};
  $$("[data-pv]", box).forEach((i) => { s[i.dataset.pv] = Number(i.value) || 0; });
  const upd = () => {
    const t = Object.values(s).reduce((a, b) => a + b, 0);
    $("[data-ptot]", box).textContent = t;
    $("[data-pmsg]", box).textContent = t === 350 ? "✔" : t > 350 ? `(sobran ${t - 350})` : `(faltan ${350 - t})`;
    $("[data-psave]", box).disabled = t !== 350;
  };
  const set = (k, v) => { s[k] = Math.max(0, Math.min(350, v)); $(`[data-pv="${k}"]`, box).value = s[k]; upd(); };
  $$("[data-pm]", box).forEach((b) => b.addEventListener("click", () => set(b.dataset.pm, s[b.dataset.pm] - 1)));
  $$("[data-pp]", box).forEach((b) => b.addEventListener("click", () => set(b.dataset.pp, s[b.dataset.pp] + 1)));
  $$("[data-pv]", box).forEach((i) => i.addEventListener("input", () => set(i.dataset.pv, Math.round(Number(i.value.replace(/\D/g, "")) || 0))));
  $("[data-psave]", box).addEventListener("click", () => {
    if (espPorraState() !== "oberta") return toast("La porra ya está cerrada");
    if (espPreview()) return toast("Vista previa: la porra no se guarda");
    store.set(ESP_PORRA_KEY, { s: { ...s }, t: Date.now() });
    Sfx.play("pick");
    toast("Porra guardada");
  });
  upd();
}

// ---------- Prediccions de la nit (es juguen mentre s'escruta i donen XP) ----------
const ESP_PRED_XP = 25;
function espPredState() { return store.get(ESP_PRED_KEY, null); }
function espPredBuild(d) {
  // Es fan amb l'escrutini del moment; les respostes es tanquen quan passa del 60 %
  const top = d.ranking.filter((k) => d.seats[k]);
  const qs = [];
  if (top.length >= 2) qs.push({ id: "primer", q: "¿Quién acabará siendo la primera fuerza?", opts: top.slice(0, 3), kind: "first" });
  if (top[1]) {
    const k = top[1], n = d.seats[k], lo = Math.max(0, Math.floor(n / 10) * 10 - 10);
    qs.push({ id: "escons", q: `¿Cuántos escaños sacará ${espParty(k).sig}?`, party: k, opts: [`menos de ${lo + 10}`, `${lo + 10}–${lo + 19}`, `${lo + 20} o más`], cuts: [lo + 10, lo + 20], kind: "range" });
  }
  const air = d.provs.filter((p) => p.air).sort((a, b) => a.air.need - b.air.need)[0];
  if (air) qs.push({ id: "aire", q: `El último escaño de ${air.name}: ¿quién se lo quedará?`, code: air.code, opts: [air.air.holder, air.air.rival], kind: "air" });
  qs.push({ id: "part", q: "¿La participación final será más alta o más baja que en 2023 (66,6 %)?", opts: ["Más alta", "Más baja"], kind: "turnout" });
  return { at: Date.now(), qs, a: {}, done: false };
}
function espPredResolve(st, d) {
  if (!d || d.escrutat < 100 || st.done) return st;
  let hits = 0;
  st.qs.forEach((q) => {
    let ok = null;
    if (q.kind === "first") ok = d.ranking[0];
    if (q.kind === "range") { const n = d.seats[q.party] || 0; ok = q.opts[n < q.cuts[0] ? 0 : n < q.cuts[1] ? 1 : 2]; }
    if (q.kind === "air") { const p = d.provs.find((x) => x.code === q.code); ok = p?.air && q.opts.includes(p.air.holder) ? p.air.holder : null; }
    if (q.kind === "turnout") ok = (d.participacio || 0) >= 66.6 ? "Más alta" : "Más baja";
    q.ok = ok;
    if (ok && st.a[q.id] === ok) hits++;
  });
  st.done = true;
  st.hits = hits;
  if (hits && !st.sim) {
    Progress.data.xp += hits * ESP_PRED_XP;
    Progress.save();
    renderLevel();
    toast(`Predicciones de la noche: ${hits} aciertos · +${hits * ESP_PRED_XP} XP`, "ach");
  }
  store.set(ESP_PRED_KEY, st);
  return st;
}
function espPredHtml(d) {
  if (!d || espFase() === "off") return "";
  let st = espPredState();
  if (st && st.sim !== !!d.simulacre) st = null; // les d'un simulacre no es barregen amb les de debò
  if (st && st.sim && st.simInici !== (Esp.cfg.simInici || espPreview()?.simInici)) st = null;
  if (!st && d.escrutat < 60) { st = espPredBuild(d); st.sim = !!d.simulacre; st.simInici = Esp.cfg.simInici || espPreview()?.simInici; store.set(ESP_PRED_KEY, st); }
  if (!st) return `<section class="card esp-pred" id="esp-pred"><h2 class="section-title sm">🎲 Predicciones de la noche</h2><p class="muted">Las predicciones se cierran cuando el escrutinio pasa del 60 %.</p></section>`;
  st = espPredResolve(st, d);
  const open = !st.done && d.escrutat < 60;
  const answered = Object.keys(st.a).length;
  const lbl = (q, o) => (q.kind === "first" || q.kind === "air" ? espParty(o).sig : o);
  return `<section class="card esp-pred" id="esp-pred">
    <h2 class="section-title sm">🎲 Predicciones de la noche</h2>
    <p class="muted">${st.done ? `Has acertado <b>${st.hits || 0}</b> de ${st.qs.length}.${st.sim ? " Era un simulacro: no cuenta XP." : ""}` : open ? `Acierta y gana <b>${ESP_PRED_XP} XP</b> por acierto. Se cierran cuando el escrutinio pasa del 60 % (${answered}/${st.qs.length} respuestas).` : "Predicciones cerradas: se resuelven cuando el escrutinio llegue al 100 %."}</p>
    <div class="esp-pred-list">${st.qs.map((q) => `<div class="esp-q"><b>${esc(q.q)}</b><div class="esp-q-o">${q.opts.map((o) => {
      const mine = st.a[q.id] === o, right = st.done && q.ok === o;
      return `<button type="button" class="${mine ? "on" : ""} ${right ? "ok" : ""} ${st.done && mine && !right ? "ko" : ""}" data-pred="${q.id}" data-o="${esc(o)}" ${open ? "" : "disabled"}>${esc(lbl(q, o))}</button>`;
    }).join("")}</div></div>`).join("")}</div>
  </section>`;
}
function espPredBind(root) {
  $$("[data-pred]", root).forEach((b) => b.addEventListener("click", () => {
    const st = espPredState();
    if (!st || st.done) return;
    st.a[b.dataset.pred] = b.dataset.o;
    store.set(ESP_PRED_KEY, st);
    Sfx.play("pick");
    $$(`[data-pred="${b.dataset.pred}"]`, root).forEach((x) => x.classList.toggle("on", x === b));
  }));
}

// ---------- Pàgina de la nit electoral ----------
let espSel = null;
const espCoal = new Set();
const espGames = () => ["diari", "majoria", "contrarellotge", "verificador"].map((id) => GAMES.find((g) => g.id === id)).filter(Boolean);
function renderNit(arg) {
  const root = $("#nit-page");
  if (!root) return;
  const f = espFase();
  root.innerHTML = `${espPreviewBar()}
    <div class="esp-nit">
      <header class="esp-live" data-hero></header>
      <div class="esp-cols">
        <div class="esp-main" data-main></div>
        <aside class="esp-rail">
          <div data-pred-box></div>
          <div data-pron-box></div>
          <div data-porra-box></div>
          <section class="card esp-play">
            <h2 class="section-title sm">🕹️ Mientras se escruta</h2>
            <p class="muted">${f === "nit" ? "Los resultados se actualizan solos. Mientras tanto, juega:" : "Juega mientras esperas:"}</p>
            <div class="esp-play-list">${espGames().map((g) => `<a href="#joc/${g.id}" style="--c:${g.color}"><span class="esp-play-i">${g.icon}</span><span><b>${esc(g.title)}</b><small>${esc(g.tagline || g.kicker || "")}</small></span></a>`).join("")}<a href="#simulador" style="--c:#3554ff"><span class="esp-play-i">🗳️</span><span><b>Simuladores</b><small>Gana unas elecciones o un debate</small></span></a></div>
            <button class="btn ghost" type="button" data-share>Comparte la noche electoral</button>
          </section>
        </aside>
      </div>
      <p class="sim-fiction" data-src></p>
    </div>`;
  espBind(root);
  $("[data-share]", root).addEventListener("click", async () => {
    const text = "Sigue la noche electoral del 29N en directo en Política en Joc 🗳️";
    const url = `${location.origin}${location.pathname}#nit`;
    try { if (navigator.share) await navigator.share({ title: "Noche electoral", text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); toast("Enlace copiado"); } } catch { /* cancel·lat */ }
  });
  Esp.nitArg = arg;
  espPaint(true);
  if (espResultsMode() !== "off" && !Esp.data) espFetchResults().then(() => { if (espView() === "nit") espPaint(); });
  espSchedule();
}
function espPaint(first = false) {
  const root = $("#nit-page");
  if (!root || !$("[data-main]", root)) return;
  const f = espFase(), mode = espResultsMode(), d = mode === "off" ? null : Esp.data;
  const keepScroll = window.scrollY;
  // Capçalera en directe
  const lead = d?.ranking?.[0] && d.seats[d.ranking[0]] ? espParty(d.ranking[0]) : null;
  $("[data-hero]", root).innerHTML = `
    <div class="esp-live-top"><span class="esp-onair">${f === "nit" ? `<span class="dot-live"></span>En directo` : f === "despres" ? "Resultados" : "29N"}</span>${d?.simulacre ? `<span class="esp-simtag">Simulacro · datos inventados</span>` : ""}<span class="esp-upd">${d ? `Actualizado ${espAgo(d.actualitzat || Esp.fetchedAt)}` : ""}</span></div>
    <div class="esp-live-main">
      <div class="esp-live-t"><p class="esp-k">Elecciones generales · 29 de noviembre de 2026</p><h1>${f === "nit" ? "Noche electoral" : f === "despres" ? "Resultados del 29N" : f === "dia" ? "Hoy se vota" : "El 29N, en directo"}</h1>
      ${lead ? `<p class="esp-lead"><i style="background:${lead.color}"></i><b>${esc(lead.sig)}</b> es primera fuerza con <b>${d.seats[lead.id]}</b> escaños${d.escrutat < 100 ? " (provisional)" : ""}</p>` : ""}
      ${espMsg()}</div>
      ${d ? `<div class="esp-live-ring">${espRing(d.escrutat)}<div><b>${espPct(d.escrutat)}</b><small>escrutado</small></div></div>` : ""}
    </div>
    ${d?.participacio ? `<div class="esp-live-strip"><span>Participación <b>${espPct(d.participacio, 2)}</b></span><span>2023: <b>66,60 %</b></span><span>Mayoría absoluta: <b>176</b></span></div>` : ""}`;
  // Contingut principal
  const main = $("[data-main]", root);
  if (!d) {
    main.innerHTML = `<section class="card esp-wait">
      ${["dia", "previa", "off"].includes(f) ? `<h2 class="section-title sm">A las 20:00, aquí mismo</h2><p>Cuando cierren los colegios, en esta página estará el escrutinio en directo: el hemiciclo, la carrera de escaños, el mapa de las 52 circunscripciones, los escaños que se deciden por pocos votos, la última hora y las mayorías posibles. Se actualiza solo, sin recargar.</p>` : `<h2 class="section-title sm">Esperando los primeros datos</h2><p>Todavía no hay datos del escrutinio. Esta página se actualiza sola: no hace falta que recargues.</p><div class="esp-skel"><span></span><span></span><span></span></div>`}
      ${espParticipacioHtml()}
    </section>`;
  } else {
    const rows = d.ranking.filter((k) => d.seats[k] || d.tot[k] / d.valid >= 0.005);
    const max = Math.max(...rows.map((k) => d.seats[k] || 0), 1);
    const prev = Esp.prev;
    const air = d.provs.filter((p) => p.air).sort((a, b) => a.air.need - b.air.need).slice(0, 6);
    const coalIds = rows.filter((k) => d.seats[k]);
    const coalSum = [...espCoal].reduce((a, k) => a + (d.seats[k] || 0), 0);
    const sel = espSel !== null ? d.provs.find((p) => p.i === espSel) : null;
    main.innerHTML = `
      <section class="card esp-race">
        <div class="esp-race-head"><h2 class="section-title sm">🏁 La carrera de escaños</h2><span class="muted">escaños · vs. 2023 · votos</span></div>
        <div class="esp-race-list">${rows.map((k) => {
          const p = espParty(k), s = d.seats[k] || 0, ref = ESP_2023[k], diff = ref ? s - ref[0] : null;
          const moved = prev ? s - (prev.seats[k] || 0) : 0;
          return `<div class="esp-rr ${moved > 0 ? "flash-up" : moved < 0 ? "flash-down" : ""}" style="--c:${p.color}">
            <span class="esp-rr-n"><i></i>${esc(p.sig)}</span>
            <span class="esp-rr-bar"><span style="width:${(s / max) * 100}%"></span></span>
            <b class="esp-rr-s">${s}${moved ? `<small class="${moved > 0 ? "up" : "down"}">${moved > 0 ? "▲" : "▼"}${Math.abs(moved)}</small>` : ""}</b>
            <span class="esp-rr-d ${diff > 0 ? "up" : diff < 0 ? "down" : ""}">${diff === null ? "—" : `${diff > 0 ? "+" : ""}${diff}`}</span>
            <span class="esp-rr-v">${espPct((d.tot[k] / d.valid) * 100)}</span>
          </div>`;
        }).join("")}</div>
        <p class="muted esp-note">Frente Amplio se compara con Sumar en 2023. Hasta el 100 % escrutado, los escaños pueden cambiar.</p>
      </section>
      <div class="esp-grid">
        <section class="card esp-hemi">
          <h2 class="section-title sm">El Congreso</h2>
          ${espHemi(d)}
          <p class="esp-maj"><b>${d.totalSeats}</b> de 350 escaños asignados · mayoría absoluta <b>176</b></p>
        </section>
        <section class="card esp-feed">
          <h2 class="section-title sm">⚡ Última hora</h2>
          <ol>${Esp.feed.length ? Esp.feed.slice(0, 8).map((e) => `<li class="k-${e.kind}"><time>${new Date(e.t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</time><span>${esc(e.text)}</span></li>`).join("") : `<li class="k-info"><span>Aquí saldrán los cambios del escrutinio a medida que lleguen.</span></li>`}</ol>
        </section>
      </div>
      <section class="card esp-mapbox">
        <h2 class="section-title sm">🗺️ Quién gana en cada circunscripción</h2>
        <div class="esp-mapwrap">${simSpainMap("esp-map")}
        <div class="esp-prov">${sel ? `<h3>${esc(sel.name)}</h3><p class="muted">${sel.seats} ${sel.seats === 1 ? "escaño" : "escaños"} · ${espPct(sel.escrutat)} escrutado</p>
          <div class="esp-prov-s">${Object.entries(sel.won).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span style="--c:${espParty(k).color}"><i></i>${esc(espParty(k).sig)} <b>${n}</b></span>`).join("") || "<span>Todavía sin escaños</span>"}</div>
          ${sel.air ? `<p class="esp-prov-air">El último escaño es para <b>${esc(espParty(sel.air.holder).sig)}</b>. ${esc(espParty(sel.air.rival).sig)} se lo quitaría con <b>${fmt(sel.air.need)}</b> votos más.</p>` : ""}` : `<p class="muted">👆 Toca una circunscripción para ver sus escaños y el último escaño en juego.</p>`}</div></div>
      </section>
      <section class="card esp-air">
        <h2 class="section-title sm">🎯 Escaños en el aire</h2>
        <p class="muted">El último escaño de cada circunscripción y cuántos votos faltan para que cambie de manos (ley D'Hondt).</p>
        <div class="esp-air-list">${air.map((p) => { const h = espParty(p.air.holder), r = espParty(p.air.rival); const tight = Math.max(8, Math.min(100, 112 - Math.log10(Math.max(10, p.air.need)) * 24)); return `<div class="esp-ac"><b>${esc(p.name)}</b><span class="esp-ac-vs"><i style="background:${h.color}"></i>${esc(h.sig)} <em>vs</em> <i style="background:${r.color}"></i>${esc(r.sig)}</span><span class="esp-ac-m" title="Qué ajustado está"><span style="width:${tight}%"></span></span><small><b>${fmt(p.air.need)}</b> votos de margen</small></div>`; }).join("")}</div>
      </section>
      <section class="card esp-coal">
        <h2 class="section-title sm">🤝 Haz tu mayoría</h2>
        <p class="muted">Elige partidos y mira si llegan a los 176 escaños.</p>
        <div class="esp-coal-chips">${coalIds.map((k) => `<button type="button" class="${espCoal.has(k) ? "on" : ""}" data-coal="${k}" style="--c:${espParty(k).color}">${esc(espParty(k).sig)} · ${d.seats[k]}</button>`).join("")}</div>
        <div class="esp-coal-bar"><span style="width:${Math.min(100, (coalSum / 350) * 100)}%"></span><i style="left:${(176 / 350) * 100}%"></i></div>
        <p class="esp-coal-res"><b>${coalSum}</b> escaños · ${coalSum >= 176 ? "<span class='up'>Mayoría absoluta ✔</span>" : `faltan <b>${176 - coalSum}</b>`}${espCoal.size ? ` · <button type="button" class="linklike" data-coal-clear>Borra</button>` : ""}</p>
        <a class="btn" href="#joc/majoria">Juega a Haz mayoría</a>
      </section>`;
    const svg = $(".esp-map", main);
    simPaintMap(svg, (i) => {
      const p = d.provs.find((x) => x.i === i);
      const w = p?.winner ? espParty(p.winner) : null;
      return { fill: w ? w.color : "var(--card)", ink: w ? "#fff" : "var(--ink)", sel: i === espSel, label: `${p?.name || ""}: ${w ? `gana ${w.sig}` : "sin datos"}` };
    });
    simMapPick(svg, (i) => { espSel = espSel === i ? null : i; espPaint(); });
    $$("[data-coal]", main).forEach((b) => b.addEventListener("click", () => { const k = b.dataset.coal; espCoal.has(k) ? espCoal.delete(k) : espCoal.add(k); espPaint(); }));
    $("[data-coal-clear]", main)?.addEventListener("click", () => { espCoal.clear(); espPaint(); });
  }
  // Columna de joc (la porra oberta no es repinta, perquè no es perdi el que s'està escrivint)
  $("[data-pred-box]", root).innerHTML = espPredHtml(d);
  if (typeof pronNitCard === "function") $("[data-pron-box]", root).innerHTML = pronNitCard(d);
  espPredBind(root);
  if (first || !$("[data-porra]", root)) {
    $("[data-porra-box]", root).innerHTML = espPorraHtml(d);
    espPorraBind(root);
  }
  $("[data-src]", root).textContent = `Datos: ${d?.simulacre ? "simulacro con cifras inventadas, solo para probar la página." : "escrutinio provisional del Ministerio del Interior. Los resultados oficiales son los que proclama la Junta Electoral."}`;
  if (!first) window.scrollTo({ top: keepScroll });
  if (first && Esp.nitArg) setTimeout(() => $(Esp.nitArg === "porra" ? "#esp-porra" : "#esp-pred", root)?.scrollIntoView({ block: "start", behavior: "smooth" }), 150);
}

espLoadConfig();
// La fase canvia sola: es revisa cada minut (el compte enrere de l'inici també)
setInterval(() => { if (!document.hidden && espView() === "inici") renderHomeEspecial(); }, 60000);
