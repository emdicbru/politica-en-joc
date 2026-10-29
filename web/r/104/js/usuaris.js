// Centre de control · 📊 Usuaris: la radiografia d'ús a partir dels comptadors anònims de stats.js.
// Llegeix stats/{dia}_{n} dels darrers 30 dies (com a molt 300 documents per càrrega) i ho suma per dia.
const CTU = { days: null, totals: null, range: 7, loading: false, at: 0 };
const CTU_VIEWS = { inici: "Inici", noticies: "Notícies", jocs: "Minijocs", amics: "Amics · xats", ranking: "Amics · rànquing", duel: "Amics · reptes", simulador: "Simuladors", apren: "Aprèn", calendari: "Calendari", perfil: "Perfil", legal: "Textos legals", nit: "Nit electoral", control: "Centre de control", pronostics: "Lliga de pronòstics", botiga: "Botiga" };
const CTU_SRC = { directe: "Directe o app", chatgpt: "🤖 ChatGPT", perplexity: "🤖 Perplexity", claude: "🤖 Claude", gemini: "🤖 Gemini", copilot: "🤖 Copilot", google: "Google", x: "X (Twitter)", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", telegram: "Telegram", tiktok: "TikTok", bluesky: "Bluesky", notificacio: "Notificació", widget: "🧩 Widgets en altres webs", altres: "Altres webs" };
const CTU_DISP = { ios: "iPhone o iPad", android: "Android", ordinador: "Ordinador" };

function ctuDayList(n) {
  const out = [];
  const today = Stats.day();
  for (let i = n - 1; i >= 0; i--) out.push(Stats.day(new Date(Date.parse(today + "T12:00:00Z") - i * 864e5)));
  return out;
}
async function ctuLoad() {
  if (CTU.loading) return;
  CTU.loading = true;
  const O = window.Online;
  const list = ctuDayList(30);
  const [docs, users, pron, push] = await Promise.all([O.statsRange(list[0], list[list.length - 1]), O.countOf("users"), O.countOf("pron"), O.pushCount()]);
  const days = Object.fromEntries(list.map((d) => [d, {}]));
  (docs || []).forEach((doc) => {
    const d = days[doc.id.split("_")[0]];
    if (!d) return;
    for (const [k, v] of Object.entries(doc)) {
      if (k === "id") continue;
      if (typeof v === "number") d[k] = (d[k] || 0) + v;
      else if (v && typeof v === "object") { const m = (d[k] ||= {}); for (const [kk, vv] of Object.entries(v)) m[kk] = (m[kk] || 0) + (Number(vv) || 0); }
    }
  });
  CTU.days = days;
  CTU.totals = { users, pron, push, ok: !!docs };
  CTU.at = Date.now();
  CTU.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "usuaris") renderControl(true);
}
// Suma els dies del període triat
function ctuSum(keys) {
  const s = {};
  keys.forEach((day) => {
    const d = CTU.days[day] || {};
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "number") s[k] = (s[k] || 0) + v;
      else { const m = (s[k] ||= {}); for (const [kk, vv] of Object.entries(v)) m[kk] = (m[kk] || 0) + vv; }
    }
  });
  return s;
}
const ctuPct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const ctuN = (n) => (n == null ? "—" : fmt(Math.round(n)));
// Barres horitzontals ordenades (una sola sèrie, el número sempre visible)
function ctuBars(map, names = {}, { max = 12, unit = "" } = {}) {
  const rows = Object.entries(map || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, max);
  if (!rows.length) return `<p class="muted">Encara no hi ha dades.</p>`;
  const top = rows[0][1];
  return `<ul class="ctu-hbars">${rows.map(([k, v]) => `<li><span class="ctu-hl">${esc(names[k] || k)}</span><span class="ctu-ht"><i style="width:${Math.max(2, (v / top) * 100)}%"></i></span><b>${fmt(v)}${unit}</b></li>`).join("")}</ul>`;
}

const ctuMin = (secs) => (secs < 60 ? `${Math.round(secs)} s` : secs < 3600 ? `${Math.round(secs / 60)} min` : `${fmt(Math.round(secs / 360) / 10)} h`);
// Els recorreguts (Stats.step): l'ordre dels passos i com es diuen
const CTU_FUNNELS = [
  ["onb", "👋 Tutorial de la primera visita", [["1", "Comença"], ["4", "Pantalla 4"], ["instal", "Pantalla d'instal·lar"], ["ultima", "Última pantalla"], ["fi", "L'acaba"]]],
  ["ins", "📲 Instal·lar l'app", [["finestra_prompt", "Finestra (Android/ordinador)"], ["finestra_ios", "Finestra (iPhone)"], ["finestra_android", "Finestra (Android, menú)"], ["finestra_inapp", "Finestra (dins d'una app)"], ["toc", "Toca «Instal·la»"], ["instal", "La instal·len"], ["arano", "«Ara no»"]]],
  ["compte", "👤 Crear el compte", [["inici", "Toquen «Continua amb Google»"], ["fet", "Entren"]]],
  ["notif", "🔔 Notificacions", [["demana", "Se'ls demana permís"], ["si", "Accepten"], ["no", "Rebutgen"]]],
  ["amics", "🤝 Amics", [["peticio", "Envien sol·licituds"], ["accepta", "N'accepten"], ["inv_duel", "Repten a un duel"], ["inv_camp", "Conviden a una campanya"], ["inv_call", "Truquen"], ["inv_video", "Fan videotrucades"]]],
  ["xat", "💬 Xat", [["missatge", "Missatges"], ["resposta", "Respostes citant"], ["reaccio", "Reaccions"]]],
  ["trucada", "📞 Trucades", [["entra_veu", "Entren amb veu"], ["entra_video", "Entren amb vídeo"], ["connectada", "Connecten"], ["falla", "No connecten"]]],
];
function ctuFunnels(fn) {
  return CTU_FUNNELS.map(([id, title, steps]) => {
    const rows = steps.map(([k, t]) => [t, fn[`${id}_${k}`] || 0]);
    const base = rows.find(([, n]) => n)?.[1] || 0;
    if (!base) return "";
    return `<div class="ctu-fn"><b>${title}</b><ul>${rows.filter(([, n]) => n).map(([t, n]) => `<li><span>${esc(t)}</span><i style="width:${Math.max(3, (n / base) * 100)}%"></i><em>${fmt(n)} · ${ctuPct(n, base)}</em></li>`).join("")}</ul></div>`;
  }).join("") || `<p class="muted">Encara no hi ha dades.</p>`;
}

function ctlStatsHtml() {
  if (!CTU.days) { ctuLoad(); return `<div class="card"><p class="muted">Carregant les dades…</p></div>`; }
  const all = ctuDayList(30);
  const keys = all.slice(-CTU.range);
  const S = ctuSum(keys);
  const today = CTU.days[all[all.length - 1]] || {};
  const prev = all.slice(-CTU.range * 2, -CTU.range);
  const games = Object.fromEntries((typeof GAMES !== "undefined" ? GAMES : []).map((g) => [g.id, g.title]));
  games.duel = "Duels 1 vs 1";
  // Retenció: dels nous d'un dia, quants tornen l'endemà (r1 de l'endemà / nous del dia)
  const retPairs = keys.map((d, i) => [CTU.days[all[all.indexOf(d) - 1]]?.nous || 0, CTU.days[d]?.r1 || 0]).filter(([n]) => n > 0);
  const ret1 = retPairs.reduce((a, [, r]) => a + r, 0), retBase = retPairs.reduce((a, [n]) => a + n, 0);
  const avgDev = (S.dev || 0) / keys.length;
  const prevDev = prev.reduce((a, d) => a + (CTU.days[d]?.dev || 0), 0) / (prev.length || 1);
  const trend = prev.length && prevDev ? Math.round(((avgDev - prevDev) / prevDev) * 100) : null;
  const daily = all.slice(-Math.max(14, CTU.range)).map((d) => ({ d, n: CTU.days[d]?.nous || 0, t: CTU.days[d]?.torna || 0 }));
  const dmax = Math.max(1, ...daily.map((x) => x.n + x.t));
  const hours = Array.from({ length: 24 }, (_, i) => S.h?.[String(i).padStart(2, "0")] || 0);
  const hmax = Math.max(1, ...hours);
  const gRows = Object.keys({ ...(S.g || {}), ...(S.f || {}) }).map((k) => ({ k, s: S.g?.[k] || 0, f: S.f?.[k] || 0 })).sort((a, b) => b.s - a.s);
  const devSum = Object.values(S.disp || {}).reduce((a, b) => a + b, 0);
  const modeSum = Object.values(S.mode || {}).reduce((a, b) => a + b, 0);
  const dayLbl = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("ca-ES", { day: "numeric", month: "short" });
  const statsOff = !!Esp.cfg.statsOff;
  return `
    <p class="ctl-intro">Què fa la gent a l'app. Són comptadors anònims: no se sap qui és ningú, només quants.</p>
    ${statsOff ? `<p class="ctl-alert">⏸ Els comptadors estan aturats per a tothom. No s'està recollint res.</p>` : ""}
    ${CTU.totals.ok ? "" : `<p class="ctl-alert">⚠️ No s'han pogut llegir les dades (permisos o connexió).</p>`}
    <div class="ctu-top">
      <div class="ctl-seg ctu-range">${[[1, "Avui"], [7, "7 dies"], [30, "30 dies"]].map(([n, t]) => `<button type="button" class="${CTU.range === n ? "on" : ""}" data-curange="${n}"><b>${t}</b></button>`).join("")}</div>
      <button class="linklike" type="button" data-curefresh>↻ Actualitza (dades de ${Date.now() - CTU.at < 90e3 ? "fa un moment" : ctlRel(CTU.at).replace("d'aquí a", "fa")})</button>
    </div>
    <section class="ctl-status ctu-kpis">
      <div class="ctl-st"><small>Actius avui</small><b>${ctuN(today.dev)}</b><span class="ctl-tag">dispositius</span></div>
      <div class="ctl-st"><small>${CTU.range === 1 ? "Visites avui" : "Actius per dia"}</small><b>${CTU.range === 1 ? ctuN(S.ses) : ctuN(avgDev)}</b><span class="ctl-tag ${trend !== null && trend < 0 ? "warn" : ""}">${CTU.range === 1 ? "sessions" : trend === null ? "mitjana" : `${trend >= 0 ? "+" : ""}${trend} % vs. abans`}</span></div>
      <div class="ctl-st"><small>Nous</small><b>${ctuN(S.nous)}</b><span class="ctl-tag">${CTU.range === 1 ? "avui" : `en ${CTU.range} dies`}</span></div>
      <div class="ctl-st"><small>Tornen l'endemà</small><b>${ctuPct(ret1, retBase)}</b><span class="ctl-tag">dels nous</span></div>
      <div class="ctl-st"><small>Partides acabades</small><b>${ctuN(Object.values(S.f || {}).reduce((a, b) => a + b, 0))}</b><span class="ctl-tag">${ctuN(Object.values(S.g || {}).reduce((a, b) => a + b, 0))} començades</span></div>
      <div class="ctl-st"><small>Comptes creats</small><b>${ctuN(CTU.totals.users)}</b><span class="ctl-tag">en total</span></div>
      <div class="ctl-st"><small>Notificacions</small><b>${ctuN(CTU.totals.push)}</b><span class="ctl-tag">dispositius en total</span></div>
      <div class="ctl-st"><small>Lliga de pronòstics</small><b>${ctuN(CTU.totals.pron)}</b><span class="ctl-tag">jugadors</span></div>
    </section>

    <section class="card ctu-card">
      <h2 class="section-title sm">📈 Activitat diària</h2>
      <p class="muted">Dispositius diferents que obren l'app cada dia. Es compta cada mòbil o ordinador un sol cop al dia.</p>
      <div class="ctu-legend"><span><i class="ctu-sw torna"></i>Tornen</span><span><i class="ctu-sw nous"></i>Nous</span></div>
      <div class="ctu-cols" style="--n:${daily.length}">${daily.map((x) => `<div class="ctu-col" title="${dayLbl(x.d)}: ${fmt(x.t + x.n)} actius (${fmt(x.n)} nous, ${fmt(x.t)} tornen)">
        <span class="ctu-cv">${x.n + x.t ? fmt(x.n + x.t) : ""}</span>
        <div class="ctu-stack" style="height:${((x.n + x.t) / dmax) * 100}%"><i class="nous" style="flex:${x.n}"></i><i class="torna" style="flex:${x.t}"></i></div>
        <small>${dayLbl(x.d).replace(" ", "<br>")}</small></div>`).join("")}</div>
    </section>

    <div class="ctu-grid">
      <section class="card ctu-card">
        <h2 class="section-title sm">🎮 A què juguen</h2>
        ${gRows.length ? `<table class="ctu-table"><thead><tr><th>Joc</th><th>Començades</th><th>Acabades</th><th>Acaben</th></tr></thead><tbody>${gRows.map((r) => `<tr><td>${esc(games[r.k] || r.k)}</td><td>${fmt(r.s)}</td><td>${fmt(r.f)}</td><td>${ctuPct(Math.min(r.f, r.s), r.s)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Encara no hi ha partides.</p>`}
        <p class="muted">Repte diari: <b>${ctuN(S.diari)}</b> fets${S.diari ? `, ${fmt(Math.round((S.diariPts || 0) / S.diari))} encerts de mitjana` : ""}.</p>
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🧭 On entren</h2>
        <p class="muted">Seccions visitades.</p>
        ${ctuBars(S.v, CTU_VIEWS)}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🕘 A quina hora</h2>
        <p class="muted">Visites per hora (hora peninsular).</p>
        <div class="ctu-hours">${hours.map((v, i) => `<div title="${i}:00 · ${fmt(v)} visites"><i style="height:${(v / hmax) * 100}%"></i><small>${i % 3 === 0 ? i : ""}</small></div>`).join("")}</div>
        ${S.ses ? `<p class="muted">L'hora punta és a les <b>${hours.indexOf(hmax)}:00</b>.</p>` : ""}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🔗 D'on venen</h2>
        ${ctuBars(S.src, CTU_SRC)}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">📱 Amb què</h2>
        ${ctuBars(S.disp, CTU_DISP)}
        <p class="muted">Amb l'app instal·lada: <b>${ctuPct(S.mode?.app || 0, modeSum)}</b> · Amb sessió iniciada: <b>${ctuPct(S.acc || 0, S.dev || 0)}</b> · Amb notificacions: <b>${ctuPct(S.notifDev || 0, S.dev || 0)}</b></p>
        ${devSum ? "" : ""}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🏅 Quin nivell tenen</h2>
        ${ctuBars(S.lv, Object.fromEntries(LEVELS.map((l, i) => [String(i + 1), `${i + 1}. ${l.name}`])), { max: 8 })}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🪙 Monedes i botiga</h2>
        <ul class="ctu-kv"><li><span>Monedes guanyades</span><b>${ctuN(S.mon)}</b></li><li><span>Gastades a la botiga</span><b>${ctuN(S.monGast)}</b></li><li><span>Afegides a la Lliga</span><b>${ctuN(S.aposta)}</b></li><li><span>Compres</span><b>${ctuN(Object.values(S.b || {}).reduce((a, b) => a + b, 0))}</b></li></ul>
        <p class="muted">Articles més comprats:</p>
        ${ctuBars(S.b, Object.fromEntries((typeof SHOP !== "undefined" ? SHOP : []).map((x) => [x.id, x.name])), { max: 8 })}
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">🔁 Fidelitat</h2>
        <ul class="ctu-kv">
          <li><span>Tornen l'endemà de la primera visita</span><b>${ctuPct(ret1, retBase)}</b></li>
          <li><span>Tornen 7 dies després</span><b>${ctuN(S.r7)}</b></li>
          <li><span>Tornen 30 dies després</span><b>${ctuN(S.r30)}</b></li>
          <li><span>Han instal·lat l'app</span><b>${ctuN(S.inst)}</b></li>
          <li><span>Han activat notificacions</span><b>${ctuN(S.notif)}</b></li>
        </ul>
        <p class="muted">Dies diferents que hi ha entrat cada dispositiu:</p>
        ${ctuBars(S.dact, { 1: "1 dia", "2-3": "2 o 3 dies", "4-7": "De 4 a 7 dies", "8-14": "De 8 a 14 dies", "15+": "15 dies o més" })}
        <p class="muted">Nous, tornen i fidelitat només inclouen els dispositius que han acceptat l'estadística (${ctuPct(S.cons?.si || 0, (S.cons?.si || 0) + (S.cons?.no || 0))} dels que han respost).</p>
      </section>
      <section class="card ctu-card">
        <h2 class="section-title sm">⏱ Quant temps hi passen</h2>
        <ul class="ctu-kv"><li><span>Temps actiu per visita</span><b>${ctuMin(S.ses ? (S.tt || 0) / S.ses : 0)}</b></li><li><span>Temps actiu total</span><b>${ctuMin(S.tt || 0)}</b></li><li><span>Errors de la pàgina</span><b>${ctuN(S.err)}</b></li></ul>
        <p class="muted">Temps actiu per secció (total):</p>
        ${ctuBars(Object.fromEntries(Object.entries(S.vt || {}).map(([k, v]) => [k, Math.round(v / 60)])), { ...CTU_VIEWS, joc: "Jugant" }, { unit: " min" })}
      </section>
    </div>

    <section class="card ctu-card">
      <h2 class="section-title sm">🪜 Fins on arriben</h2>
      <p class="muted">Cada recorregut, pas a pas: quanta gent arriba a cada pas i quina part respecte del primer.</p>
      <div class="ctu-funnels">${ctuFunnels(S.fn || {})}</div>
    </section>

    <section class="card ctu-card">
      <h2 class="section-title sm">⚙️ Comptadors</h2>
      <p class="muted">Cada visita fa 1 o 2 escriptures a la base de dades. El pla gratuït de Firebase en permet 20.000 al dia: si un dia hi ha moltíssim trànsit (la nit electoral), els pots aturar perquè no es mengin la quota.</p>
      <div class="ctl-seg">${[["on", "Actius", "Es compta tot"], ["off", "Aturats", "No es recull res"]].map(([k, t, s]) => `<button type="button" class="${statsOff === (k === "off") ? "on" : ""}" data-custats="${k}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>
    </section>`;
}
function ctlStatsBind(root) {
  $$("[data-curange]", root).forEach((b) => b.addEventListener("click", () => { CTU.range = Number(b.dataset.curange); renderControl(true); }));
  $("[data-curefresh]", root)?.addEventListener("click", () => { CTU.days = null; renderControl(true); });
  $$("[data-custats]", root).forEach((b) => b.addEventListener("click", async () => {
    const off = b.dataset.custats === "off";
    if (off === !!Esp.cfg.statsOff) return;
    const next = { ...Esp.cfg, statsOff: off, log: [{ t: Date.now(), what: off ? "Comptadors d'ús aturats" : "Comptadors d'ús activats" }, ...(Esp.cfg.log || [])].slice(0, 15) };
    if (await window.Online.setConfig("especial", next)) { Esp.cfg = Object.assign({}, ESP_DEFAULT, next); toast(off ? "Comptadors aturats" : "Comptadors activats"); renderControl(true); }
  }));
}
