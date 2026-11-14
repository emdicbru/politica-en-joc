// Centre de control · eines de campanya (14-11-2026): tauler «Avui» i alertes (Resum), embut i comparticions,
// calendari d'avisos, xarxes (carrusel del dia), informe setmanal, test d'actualitat del dia (correccions) i assaig de la
// nit electoral. Fa servir les dades que ja hi ha: comptadors anònims (stats.js, stats/{dia}_{n} i _w), avisos (pushes),
// titulars (data/news.json), test (data/test.json) i enquestes (data/enquestes.json).

// ---------- Dades compartides ----------
const CTP = { today: null, loadingToday: false, files: null, alerts: null, notified: false };
const ctpDay = (k = 0) => Stats.day(new Date(Date.now() - k * 864e5));
const ctpData = (f) => `${window.PEJ_DATA || "data/"}${f}?t=${Math.floor(Date.now() / 300000)}`;
const ctpSumDocs = (docs, day) => {
  const d = {};
  (docs || []).filter((x) => x.id.startsWith(day)).forEach((doc) => {
    for (const [k, v] of Object.entries(doc)) {
      if (k === "id") continue;
      if (typeof v === "number") d[k] = (d[k] || 0) + v;
      else if (v && typeof v === "object") { const m = (d[k] ||= {}); for (const [kk, vv] of Object.entries(v)) m[kk] = (m[kk] || 0) + (Number(vv) || 0); }
    }
  });
  return d;
};
const ctpHoursUpTo = (d, h) => Object.entries(d.h || {}).filter(([k]) => Number(k) <= h).reduce((a, [, v]) => a + v, 0);
const ctpMadridHour = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24;
const ctpClicks = (d) => Object.entries(d.pc || {}).filter(([k]) => /^t/.test(k)).reduce((a, [, v]) => a + v, 0);

async function ctpLoadToday() {
  if (CTP.loadingToday) return;
  CTP.loadingToday = true;
  const O = window.Online;
  const [docs, news, test, polls] = await Promise.all([
    O.statsRange(ctpDay(1), ctpDay(0)),
    fetch(ctpData("news.json"), { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(ctpData("test.json"), { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(ctpData("enquestes.json"), { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  CTP.today = { t: ctpSumDocs(docs, ctpDay(0)), y: ctpSumDocs(docs, ctpDay(1)), ok: !!docs, at: Date.now() };
  CTP.files = { news, test, polls };
  if (!ctlPush.cfg && !ctlPush.loading) ctlPushLoad();
  CTP.alerts = ctpAlerts();
  CTP.loadingToday = false;
  ctpNotifyAlerts();
  if ((sessionStorage.getItem("ctl-tab") || "resum") === "resum") renderControl(true);
}

// ---------- 1. Tauler «Avui» ----------
function ctpTodayHtml() {
  if (!CTP.today) { ctpLoadToday(); return `<section class="ctp-today"><p class="muted">Carregant el dia…</p></section>`; }
  const { t, y } = CTP.today, h = ctpMadridHour();
  const newErr = ctlRpt.list ? ctlRpt.list.filter((r) => r.status === "nou").length : null;
  // Comparació justa: avui fins ara contra ahir fins a la mateixa hora (quan es pot); si no, contra tot ahir
  const rows = [
    ["Persones", t.u, y.u, "usuaris", "úniques (Cloudflare)"],
    ["Sessions", t.ses, ctpHoursUpTo(y, h) || y.ses, "usuaris", "a aquesta hora, ahir"],
    ["Repte diari", t.diari, y.diari, "usuaris", "partides"],
    ["Test d'actualitat", t.f?.actualitat, y.f?.actualitat, "usuaris", "acabats"],
    ["Test d'afinitat", t.f?.assembla, y.f?.assembla, "afinitat", "acabats"],
    ["Clics a avisos", ctpClicks(t), ctpClicks(y), "notif", "notificacions tocades"],
    ["Comparticions", Object.values(t.sh || {}).reduce((a, b) => a + b, 0), Object.values(y.sh || {}).reduce((a, b) => a + b, 0), "embut", "resultats compartits"],
  ];
  const delta = (a, b) => {
    if (a == null || !b) return "";
    const p = Math.round(((a - b) / b) * 100);
    return `<em class="${p >= 0 ? "up" : "down"}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)} %</em>`;
  };
  return `<section class="ctp-today">
    ${rows.map(([lab, a, b, tab, sub]) => `<button type="button" class="ctp-k" data-tab="${tab}"><small>${lab}</small><b>${a == null ? "—" : fmt(a)}</b><span>${delta(a || 0, b)} <i>ahir ${b == null ? "—" : fmt(b)}</i></span><u>${sub}</u></button>`).join("")}
    <button type="button" class="ctp-k ${newErr ? "hot" : ""}" data-tab="errors"><small>Errors nous</small><b>${newErr ?? "…"}</b><span><i>${ctlRpt.list ? `de ${ctlRpt.list.length} avisos` : "carregant"}</i></span><u>per revisar</u></button>
  </section>
  <p class="ctp-at muted">Actualitzat ${ctlRel(CTP.today.at)} · <button type="button" class="linklike" data-ctp-refresh>Actualitza</button></p>`;
}

// ---------- 2. Alertes ----------
function ctpAlerts() {
  const out = [], now = Date.now(), h = ctpMadridHour();
  const F = CTP.files || {}, t = CTP.today?.t || {}, y = CTP.today?.y || {};
  const today = typeof todayKey === "function" ? todayKey() : ctpDay(0);
  if (h >= 7 && F.test && !F.test.days?.[today]) out.push({ lvl: "alta", t: "El test d'actualitat d'avui no s'ha publicat", d: "La rutina de les 6:00 no l'ha deixat a data/test.json. Revisa la rutina o fes-lo a mà.", tab: "testdia" });
  if (F.news?.updated && now - F.news.updated > 8 * 3600e3) out.push({ lvl: "mitja", t: "El fitxer de titulars fa hores que no s'actualitza", d: `L'última còpia (data/news.json) és de ${ctlRel(F.news.updated)}. GitHub sol endarrerir el flux «news» unes hores; si passa de 12 h, mira-ho a GitHub Actions. Els titulars en directe de l'app no en depenen.`, tab: "noticies" });
  if (F.polls?.updated && now - Date.parse(F.polls.updated + "T12:00:00Z") > 3 * 864e5) out.push({ lvl: "baixa", t: "Les enquestes fa dies que no canvien", d: `Darrera actualització: ${F.polls.updated}. Mira el flux «enquestes».`, tab: "resum" });
  const newErr = ctlRpt.list ? ctlRpt.list.filter((r) => r.status === "nou").length : 0;
  if (newErr) out.push({ lvl: newErr >= 5 ? "alta" : "mitja", t: `${newErr} ${newErr === 1 ? "error nou" : "errors nous"} per revisar`, d: "Avisos de la gent des de la web.", tab: "errors" });
  const tNow = ctpHoursUpTo(t, h), yNow = ctpHoursUpTo(y, h);
  if (h >= 10 && yNow >= 40 && tNow < yNow * 0.5) out.push({ lvl: "alta", t: "Les visites han caigut a la meitat", d: `Avui fins ara ${fmt(tNow)} sessions; ahir a la mateixa hora, ${fmt(yNow)}. Comprova que la web carrega bé.`, go: "#inici" });
  const P = ctlPush.cfg;
  if (P && P.diariOn !== false) {
    const [hh, mm] = String(P.diariHora || "09:00").split(":").map(Number);
    if (h * 60 > hh * 60 + (mm || 0) + 45 && P.diariLast !== ctpDay(0)) out.push({ lvl: "mitja", t: "L'avís del repte diari d'avui no ha sortit", d: `Havia de sortir a les ${P.diariHora || "09:00"}. Mira el flux «push» de GitHub Actions.`, tab: "notif" });
  }
  return out;
}
const CTP_AL = { cfg: null, loading: false };
async function ctpAlLoad() {
  if (CTP_AL.loading) return;
  CTP_AL.loading = true;
  CTP_AL.cfg = (await window.Online.getPrivat("alertes")) || {};
  CTP_AL.loading = false;
  if ((sessionStorage.getItem("ctl-tab") || "resum") === "resum") renderControl(true);
}
function ctpAlSubHtml() {
  if (!CTP_AL.cfg) { ctpAlLoad(); return ""; }
  const uid = window.Online?.user?.uid, on = (CTP_AL.cfg.uids || []).includes(uid);
  const dev = !!store.get("r29n-push", {}).id && typeof Notification !== "undefined" && Notification.permission === "granted";
  return `<section class="ctp-alsub ${on ? "on" : ""}"><div><b>📲 ${on ? "Reps les alertes al mòbil" : "Rep les alertes al mòbil, encara que el control estigui tancat"}</b>
    <small>${on ? "Les envia el servei d'avisos cada 10 minuts si cal (test sense publicar, avís del repte que no surt, errors nous, titulars aturats). Arriben als dispositius on tens les notificacions activades amb aquest compte." : dev ? "Activa-ho i el servei d'avisos t'avisarà als dispositius on tens les notificacions activades amb aquest compte." : "Primer activa les notificacions en aquest dispositiu (Perfil → Notificacions) amb la sessió iniciada."}</small></div>
    ${ctlCan(3) ? `<button type="button" class="btn ${on ? "ghost" : "primary"} sm" data-alsub="${on ? "off" : "on"}">${on ? "Deixa de rebre-les" : "Activa-les"}</button>` : ""}</section>`;
}
function ctpAlertsHtml() {
  const A = CTP.alerts;
  if (!A) return ctpAlSubHtml();
  if (!A.length) return `<section class="ctp-alerts ok"><p>✅ Tot en ordre: test del dia, titulars, enquestes, avisos i visites.</p></section>${ctpAlSubHtml()}`;
  return `<section class="ctp-alerts">${A.map((a) => `<div class="ctp-al ${a.lvl}"><b>${a.lvl === "alta" ? "🔴" : a.lvl === "mitja" ? "🟠" : "🟡"} ${esc(a.t)}</b><p>${esc(a.d)}</p>${a.tab ? `<button type="button" class="btn ghost sm" data-tab="${a.tab}">Ves-hi</button>` : a.go ? `<a class="btn ghost sm" href="${a.go}">Obre-la</a>` : ""}</div>`).join("")}
    </section>${ctpAlSubHtml()}`;
}
// Amb el control obert: avís del navegador (un sol cop per alerta i dia)
function ctpNotifyAlerts() {
  const A = CTP.alerts || [];
  if (!A.length || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const seenKey = "ctl-alerts-seen", seen = JSON.parse(sessionStorage.getItem(seenKey) || "[]");
  A.filter((a) => a.lvl !== "baixa" && !seen.includes(a.t)).forEach((a) => {
    try { new Notification("Centre de control · " + a.t, { body: a.d, icon: "img/icon-192.png", tag: "ctl-" + a.t }); } catch { /* sense notificacions */ }
    seen.push(a.t);
  });
  sessionStorage.setItem(seenKey, JSON.stringify(seen));
}
// Es tornen a comprovar cada 10 minuts mentre el control és obert
setInterval(() => { if (location.hash.startsWith("#control") && typeof ctlIsAdmin === "function" && ctlIsAdmin()) { CTP.today = null; ctpLoadToday(); } }, 600000);

// ---------- 3 i 4. Calendari d'avisos i plantilles ----------
const CTP_TPL = {
  afinitat: CTL_QUICK.afinitat,
  actualitat: { label: "📰 Test d'actualitat", title: "📰 El test d'avui ja és aquí", body: "10 preguntes sobre el que ha passat a la campanya. Quantes n'encertes?", url: "./#joc/actualitat" },
  debat: { label: "🎙️ Cara a cara", title: "🎙️ Avui, cara a cara Sánchez–Feijóo", body: "Segueix el debat i posa't a prova: quant en saps de les propostes de cada partit?", url: "./#apren/partits" },
  pronostics: { label: "🎯 Lliga de pronòstics", title: "🎯 S'obre la Lliga de pronòstics", body: "Encerta els escons del 29N i guanya punts. Tens fins diumenge a les 20:00.", url: "./#pronostics" },
  reflexio: { label: "🤫 Jornada de reflexió", title: "🤫 Avui, jornada de reflexió", body: "Demà es vota. Repassa com votar, on et toca i què es decideix el 29N.", url: "./#apren" },
  vota: { label: "🗳️ Recordatori de vot", title: "🗳️ Avui es vota!", body: "Els col·legis són oberts de 9:00 a 20:00. A les 20:00, la nit electoral en directe.", url: "./#apren" },
  nit: { label: "📺 Nit electoral", title: "📺 Comença la nit electoral", body: "Resultats en directe, escó a escó, i la Lliga de pronòstics.", url: "./#nit" },
};
Object.assign(CTL_QUICK, Object.fromEntries(Object.entries(CTP_TPL).filter(([k]) => !CTL_QUICK[k])));
// Dates clau de la campanya amb l'avís suggerit (hora de Madrid)
const CTP_KEYDATES = [
  ["2026-11-19", "21:00", "debat", "Cara a cara Sánchez–Feijóo (Acadèmia de la Televisió)"],
  ["2026-11-23", "10:00", "pronostics", "S'obre la Lliga de pronòstics"],
  ["2026-11-28", "11:00", "reflexio", "Jornada de reflexió"],
  ["2026-11-29", "09:30", "vota", "Jornada electoral"],
  ["2026-11-29", "20:00", "nit", "Nit electoral"],
];
// % de clics dels enviaments anteriors d'una plantilla (mateix títol), a partir de l'historial
function ctpTplCtr(tpl) {
  const hist = (ctlPush.hist || []).filter((x) => x.title === tpl.title && (x.sent || x.last?.sent));
  if (!hist.length || !ctlPush.clicks) return null;
  let c = 0, s = 0;
  hist.forEach((x) => { const t0 = x.sentAt || x.lastSent || x.created; for (let k = 0; k <= 3; k++) c += ctlPush.clicks[Stats.day(new Date(t0 + k * 864e5))]?.[ctlPushKey(x.title)] || 0; s += x.sent || x.last?.sent || 0; });
  return s ? Math.round((c / s) * 1000) / 10 : null;
}
const ctpMadridMs = (day, hm) => { // dia i hora de Madrid → ms (novembre: UTC+1)
  const [H, M] = hm.split(":").map(Number);
  return Date.parse(`${day}T${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}:00+01:00`);
};
function ctpCalendarHtml() {
  if (!ctlPush.cfg) { ctlPushLoad(); return `<div class="card"><p class="muted">Carregant…</p></div>`; }
  const P = ctlPush, days = [];
  for (let i = 0; i < 17; i++) days.push(ctpDay(-i));
  const sched = P.sched || [];
  const byDay = (d) => sched.filter((x) => Stats.day(new Date(x.at)) === d);
  const tplRow = (k) => { const ctr = ctpTplCtr(CTP_TPL[k]); return ctr != null ? ` · ${ctr} % de clics les altres vegades` : ""; };
  return `<p class="ctl-intro">Els avisos que sortiran fins al 29N. Les dates clau tenen un avís suggerit: es programa d'un toc i el pots cancel·lar quan vulguis.</p>
    <section class="card"><h2 class="section-title sm">⚡ Plantilles</h2><div class="ctl-quick-b">${Object.keys(CTP_TPL).map((k) => `<button type="button" class="btn" data-quick="${k}">${esc(CTP_TPL[k].label)}<small>${esc(CTP_TPL[k].title)}${tplRow(k)}</small></button>`).join("")}</div>
      <p class="muted">Cada botó l'envia ara a tothom (amb una confirmació).</p></section>
    <ol class="ctp-cal">${days.map((d) => {
      const key = CTP_KEYDATES.filter(([kd]) => kd === d);
      const items = byDay(d);
      const dt = new Date(d + "T12:00:00Z");
      return `<li class="${key.length ? "key" : ""}"><div class="ctp-cd"><b>${dt.getUTCDate()}</b><small>${["dg", "dl", "dt", "dc", "dj", "dv", "ds"][dt.getUTCDay()]}</small></div><div class="ctp-ci">
        ${P.cfg.diariOn !== false ? `<p class="auto">🗳️ ${esc(ctlHm(P.cfg.diariHora ?? 9))} · Repte diari (automàtic)</p>` : ""}
        ${P.cfg.ratxaOn ? `<p class="auto">🔥 ${esc(ctlHm(P.cfg.ratxaHora ?? "20:30"))} · Recordatori de ratxa (automàtic)</p>` : ""}
        ${items.map((x) => `<p class="sch">⏰ ${new Date(x.at).toLocaleTimeString("ca", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })} · <b>${esc(x.title || "")}</b>${x.rep && x.rep !== "cap" ? " · es repeteix" : ""} <button type="button" class="linklike" data-pcancel="${esc(x.id)}">Cancel·la</button></p>`).join("")}
        ${key.map(([kd, hm, tk, what]) => { const already = items.some((x) => x.title === CTP_TPL[tk].title); return `<p class="sug">📌 <b>${esc(what)}</b>${already ? " · avís ja programat" : ` · <button type="button" class="btn ghost sm" data-ctp-prog="${kd}|${hm}|${tk}">Programa «${esc(CTP_TPL[tk].title)}» a les ${hm}</button>`}</p>`; }).join("")}
      </div></li>`;
    }).join("")}</ol>`;
}
async function ctpProgram(day, hm, tk) {
  const t = CTP_TPL[tk], at = ctpMadridMs(day, hm);
  if (!(at > Date.now())) return toast("Aquesta hora ja ha passat");
  if (!confirm(`Es programarà «${t.title}» per al ${day.split("-").reverse().join("-")} a les ${hm}, per a tothom. Continuar?`)) return;
  const id = await window.Online.pushQueue({ title: t.title, body: t.body, url: t.url, aud: "tots", kind: "manual", status: "scheduled", at, rep: "cap", days: [], time: hm, first: day, until: null, runs: 0 });
  if (id) { toast("Avís programat"); ctlPush.cfg = null; renderControl(true); }
}

// ---------- 6. Afinitat per territori i contrast amb les enquestes ----------
// (es pinta dins la pestanya del test d'afinitat; vegeu ctaTerrHtml a afinitat-ctl.js)

// ---------- 7 i 8. Embut i comparticions ----------
const CTP_SHARE = { app: "Compartit des del mòbil", text: "Només el text", descarrega: "Imatge descarregada" };
function ctpFunnelHtml() {
  if (!CTU.days) { ctuLoad(); return `<div class="card"><p class="muted">Carregant les dades…</p></div>`; }
  const all = ctuDayList(30), keys = all.slice(-CTU.range), S = ctuSum(keys);
  const games = Object.fromEntries((typeof GAMES !== "undefined" ? GAMES : []).map((g) => [g.id, g.title]));
  const starts = Object.values(S.g || {}).reduce((a, b) => a + b, 0), ends = Object.values(S.f || {}).reduce((a, b) => a + b, 0);
  const shares = Object.values(S.sh || {}).reduce((a, b) => a + b, 0);
  const steps = [["Sessions", S.ses || 0], ["Comencen un joc", starts], ["L'acaben", ends], ["Comparteixen el resultat", shares], ["Tornen l'endemà", S.r1 || 0]];
  const top = Math.max(1, steps[0][1]);
  const byGame = {}, byCanal = {};
  for (const [k, v] of Object.entries(S.sh || {})) { const [g, c] = k.split("_"); byGame[g] = (byGame[g] || 0) + v; byCanal[c] = (byCanal[c] || 0) + v; }
  const perGame = Object.keys(S.f || {}).map((g) => [g, S.g?.[g] || 0, S.f[g] || 0, byGame[g] || 0]).filter(([, a, b]) => a || b).sort((a, b) => b[2] - a[2]).slice(0, 12);
  return `<div class="ctl-head-row"><div class="ctl-seg" role="radiogroup">${[[1, "Avui"], [7, "7 dies"], [30, "30 dies"]].map(([k, t]) => `<button type="button" role="radio" aria-checked="${CTU.range === k}" class="${CTU.range === k ? "on" : ""}" data-curange="${k}">${t}</button>`).join("")}</div></div>
    <section class="card"><h2 class="section-title sm">De l'entrada a la tornada</h2>
      <ol class="ctp-fun">${steps.map(([t, n], i) => `<li><span>${t}</span><div><i style="width:${Math.max(2, (n / top) * 100)}%"></i></div><b>${fmt(n)}</b><em>${i ? ctuPct(n, steps[i - 1][1]) : ""}</em></li>`).join("")}</ol>
      <p class="muted">Cada percentatge és sobre el pas anterior. «Tornen l'endemà» només compta qui ha acceptat l'estadística a l'avís de galetes. Les comparticions es compten des del 14-11-2026.</p></section>
    <div class="cta-grid">
      <section class="card"><h2 class="section-title sm">Comparticions per canal</h2>${ctuBars(byCanal, CTP_SHARE)}</section>
      <section class="card"><h2 class="section-title sm">Comparticions per joc</h2>${ctuBars(byGame, { ...games, diari: "Repte diari", actualitat: "Test d'actualitat", assembla: "Test d'afinitat", posicio: "Posició als eixos" })}</section>
    </div>
    <section class="card"><h2 class="section-title sm">Joc a joc</h2>
      <table class="ctp-tab"><thead><tr><th>Joc</th><th>Comencen</th><th>Acaben</th><th>% acaben</th><th>Comparteixen</th></tr></thead><tbody>
      ${perGame.map(([g, a, b, s]) => `<tr><td>${esc(games[g] || g)}</td><td>${fmt(a)}</td><td>${fmt(b)}</td><td>${ctuPct(b, a)}</td><td>${fmt(s)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Encara no hi ha dades.</td></tr>`}</tbody></table></section>`;
}

// ---------- 5. Test d'actualitat d'avui: revisar i corregir ----------
// Les correccions es desen a config/testfix ({ day, json }) i l'app les aplica per sobre de data/test.json
const CTP_TF = { day: null, data: null, fix: null, loading: false };
async function ctpTfLoad() {
  if (CTP_TF.loading) return;
  CTP_TF.loading = true;
  const day = typeof todayKey === "function" ? todayKey() : ctpDay(0);
  const [test, fix] = await Promise.all([fetch(ctpData("test.json"), { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null), window.Online.getConfig("testfix")]);
  CTP_TF.day = day;
  CTP_TF.data = test?.days?.[day] || null;
  let f = {};
  try { f = fix && fix.day === day ? JSON.parse(fix.json || "{}") : {}; } catch { f = {}; }
  CTP_TF.fix = f;
  CTP_TF.ok = fix?.ok || "";
  CTP_TF.gate = fix?.gate || "08:00";
  CTP_TF.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "testdia") renderControl(true);
}
function ctpTestHtml() {
  if (!CTP_TF.day) { ctpTfLoad(); return `<div class="card"><p class="muted">Carregant el test d'avui…</p></div>`; }
  const D = CTP_TF.data, F = CTP_TF.fix || {};
  if (!D) return `<section class="card"><h2 class="section-title sm">No hi ha test d'avui</h2><p>La rutina de les 6:00 encara no ha publicat el test del ${CTP_TF.day.split("-").reverse().join("-")} a data/test.json.</p><button type="button" class="btn" data-tf-reload>Torna a comprovar</button></section>`;
  const nFix = Object.keys(F).length;
  const mm = (() => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).split(":").map(Number); return p[0] * 60 + p[1]; })();
  const [gh, gm] = String(CTP_TF.gate).split(":").map(Number), out = CTP_TF.ok === CTP_TF.day || mm >= gh * 60 + gm;
  return `<section class="card ctp-gate ${out ? "on" : ""}">
      <div><b>${out ? "✅ Publicat: la gent ja el veu" : `⏳ Pendent de revisió: surt sol a les ${esc(CTP_TF.gate)}`}</b>
      <small>La rutina el prepara a les 6:00. Fins a l'hora de publicació només el veu l'equip: revisa'l i, si està bé, publica'l abans.</small></div>
      <div class="row">${out ? "" : `<button type="button" class="btn primary" data-tf-ok>Aprova i publica ara</button>`}
        <label class="ctl-inline">Hora de publicació <input type="time" step="900" data-tf-gate value="${esc(CTP_TF.gate)}"></label></div>
    </section>
    <p class="ctl-intro">Si una pregunta té un error, corregeix-la o amaga-la: el canvi surt de seguida a tothom que encara no l'hagi començat.</p>
    ${nFix ? `<p class="ctl-ok">● ${nFix} ${nFix === 1 ? "pregunta corregida" : "preguntes corregides"} avui</p>` : ""}
    <ol class="ctp-tq">${D.questions.map((q, i) => { const f = F[i] || {}; const cur = { ...q, ...f }; return `<li class="${f.hide ? "off" : ""}">
      <label>Pregunta <textarea data-tf="${i}" data-k="q" rows="2">${esc(cur.q)}</textarea></label>
      <div class="ctp-ta">${cur.a.map((a, j) => `<label>${j === 0 ? "✔ Correcta" : `Opció ${j + 1}`}<input data-tf="${i}" data-k="a${j}" value="${esc(a)}"></label>`).join("")}</div>
      <label>Explicació <textarea data-tf="${i}" data-k="exp" rows="3">${esc(cur.exp || "")}</textarea></label>
      <div class="row"><button type="button" class="btn sm" data-tf-save="${i}">Desa la correcció</button><button type="button" class="btn ghost sm" data-tf-hide="${i}">${f.hide ? "Torna-la a mostrar" : "Amaga-la"}</button>${Object.keys(f).length ? `<button type="button" class="linklike" data-tf-undo="${i}">Desfés els canvis</button>` : ""}${q.u ? `<a class="linklike" href="${esc(q.u)}" target="_blank" rel="noopener">Notícia ↗</a>` : ""}</div>
    </li>`; }).join("")}</ol>`;
}
async function ctpTfSave(next, extra = {}, msg = "Desat: la gent ja veu la correcció") {
  const doc = { day: CTP_TF.day, json: JSON.stringify(next), ok: CTP_TF.ok || "", gate: CTP_TF.gate || "08:00", at: Date.now(), by: window.Online.user?.email || "", ...extra };
  const ok = await window.Online.setConfig("testfix", doc);
  if (ok) { CTP_TF.fix = next; CTP_TF.ok = doc.ok; CTP_TF.gate = doc.gate; toast(msg); renderControl(true); }
}

// ---------- 9. Xarxes: carrusel del dia ----------
// Tries fins a 6 titulars; per a cadascun pots reescriure el text (per exemple, traduir-lo) i, si esmenta un partit, hi surt
// la foto del seu cap de llista (Wikimedia Commons, amb el crèdit a la mateixa imatge).
const CTP_X = { picks: null, text: {}, foto: {} };
const ctpXItems = () => ((typeof newsData !== "undefined" && newsData?.items) || []);
const ctpPartyOf = (x) => (x._p || []).map((id) => PARTIES.find((p) => p.id === id)).filter((p) => p && typeof PHOTOS !== "undefined" && PHOTOS[p.cand?.name]);
function ctpXarxesHtml() {
  const day0 = Date.parse(ctpDay(0) + "T00:00:00+01:00");
  const today = ctpXItems().filter((x) => x.d >= day0).slice(0, 40);
  if (!CTP_X.picks) CTP_X.picks = today.filter((x) => /vilaweb|ara|naci|vanguardia|el periódico|324|catalunya/i.test(x.s)).concat(today).map((x) => x.u).filter((u, i, l) => l.indexOf(u) === i).slice(0, 5);
  const picked = today.filter((x) => CTP_X.picks.includes(x.u));
  return `<p class="ctl-intro">Tria fins a 6 titulars d'avui. Per a cadascun pots reescriure el text (si és en castellà, tradueix-lo) i triar la foto. Surten: portada, un titular per imatge, les enquestes i la crida final, en 1080 × 1350.</p>
    <section class="card"><h2 class="section-title sm">1. Titulars d'avui</h2>
      ${today.length ? `<ol class="ctp-xl">${today.map((x) => `<li><label><input type="checkbox" data-xpick="${esc(x.u)}" ${CTP_X.picks.includes(x.u) ? "checked" : ""}><span><b>${esc(x.t)}</b><small>${esc(x.s)} · ${new Date(x.d).toLocaleTimeString("ca", { hour: "2-digit", minute: "2-digit" })}</small></span></label></li>`).join("")}</ol>` : `<p class="muted">Encara no hi ha titulars d'avui (o no s'han carregat: obre un moment Notícies).</p>`}
    </section>
    ${picked.length ? `<section class="card"><h2 class="section-title sm">2. Text i foto de cada imatge</h2>
      <ol class="ctp-xe">${picked.map((x) => { const ps = ctpPartyOf(x), f = CTP_X.foto[x.u] ?? (ps[0]?.id || ""); return `<li>
        <label>Text <textarea rows="3" data-xtext="${esc(x.u)}">${esc(CTP_X.text[x.u] ?? x.t)}</textarea></label>
        <label class="ctl-inline">Foto <select data-xfoto="${esc(x.u)}"><option value="">Sense foto</option>${PARTIES.filter((p) => typeof PHOTOS !== "undefined" && PHOTOS[p.cand?.name]).map((p) => `<option value="${p.id}" ${f === p.id ? "selected" : ""}>${esc(p.cand.name)} (${esc(p.sig)})${ps.some((q) => q.id === p.id) ? " · esmentat" : ""}</option>`).join("")}</select></label>
        <small class="muted">${esc(x.s)}</small></li>`; }).join("")}</ol>
      <div class="row"><button type="button" class="btn primary" data-xgen>Genera el carrusel</button></div></section>` : ""}
    <div class="ctp-xout" id="ctp-xout"></div>`;
}
function ctpWrap(c, text, x, y, maxW, lh, maxLines = 8) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i) => c.fillText(i === maxLines - 1 && lines.length > maxLines ? l + "…" : l, x, y + i * lh));
  return Math.min(lines.length, maxLines);
}
const ctpImg = (src) => new Promise((res) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
const ctpBig = (src) => String(src).replace(/\/\d+px-/, "/960px-");
function ctpSlide(kind, data, i) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d", RED = "#d2331a", YEL = "#ffcf3d";
  const disp = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  const dark = kind === "crida" || kind === "portada" || !!data.img || !(i % 2);
  c.fillStyle = kind === "crida" ? RED : dark ? INK : "#f4f1ea"; c.fillRect(0, 0, W, H);
  const fg = dark ? "#fff" : INK, sub = dark ? "#c9c6e0" : "#5e5a74";
  c.textBaseline = "alphabetic";
  if (kind === "titular" && data.img) {
    // Foto a la meitat de dalt, retallada per omplir, amb degradat cap al fons
    const im = data.img, ih = 760, sc = Math.max(W / im.width, ih / im.height), dw = im.width * sc, dh = im.height * sc;
    c.drawImage(im, (W - dw) / 2, Math.min(0, (ih - dh) * 0.15), dw, dh);
    const g = c.createLinearGradient(0, ih - 380, 0, ih); g.addColorStop(0, "rgba(23,23,61,0)"); g.addColorStop(1, INK);
    c.fillStyle = g; c.fillRect(0, ih - 380, W, 380); c.fillStyle = INK; c.fillRect(0, ih, W, H - ih);
    c.save(); c.translate(W - 26, 30); c.rotate(Math.PI / 2); c.font = sans(17, 600); c.fillStyle = "rgba(255,255,255,.85)"; c.fillText(data.credit, 0, 0); c.restore();
    c.font = sans(32, 800); c.fillStyle = YEL; c.fillText(`${data.s.toUpperCase()} · ${data.h}`, 72, 800);
    c.font = disp(data.t.length > 110 ? 50 : 60); c.fillStyle = "#fff"; ctpWrap(c, data.t, 72, 880, 936, data.t.length > 110 ? 64 : 74, 5);
  } else if (kind === "portada") {
    c.font = sans(40, 800); c.fillStyle = YEL; c.fillText(data.date.toUpperCase(), 72, 260);
    c.font = disp(118); c.fillStyle = "#fff"; ctpWrap(c, "El dia de la campanya", 72, 420, 936, 128, 4);
    c.font = sans(44, 600); c.fillStyle = sub; ctpWrap(c, `${data.n} ${data.n === 1 ? "notícia" : "notícies"} del dia, en ${data.n + 3} imatges.`, 72, 1000, 900, 58, 3);
  } else if (kind === "titular") {
    c.font = sans(34, 800); c.fillStyle = dark ? YEL : RED; c.fillText(`${data.s.toUpperCase()} · ${data.h}`, 72, 200);
    c.font = disp(data.t.length > 110 ? 64 : 76); c.fillStyle = fg; ctpWrap(c, data.t, 72, 330, 936, data.t.length > 110 ? 80 : 94, 9);
  } else if (kind === "enquestes") {
    c.font = disp(84); c.fillStyle = fg; c.fillText("LES ENQUESTES", 72, 230);
    c.font = sans(34, 600); c.fillStyle = sub; c.fillText(`Mitjana de ${data.n} enquestes · escons`, 72, 300);
    const max = Math.max(...data.rows.map((r) => r[1]));
    data.rows.forEach(([sig, v, col], k) => {
      const y = 400 + k * 92;
      c.font = disp(34); c.fillStyle = fg; c.fillText(sig, 72, y + 40);
      c.fillStyle = dark ? "rgba(255,255,255,.14)" : "#e3dfd5"; c.fillRect(300, y + 8, 560, 44);
      c.fillStyle = col; c.fillRect(300, y + 8, Math.max(8, (v / max) * 560), 44);
      c.font = disp(38); c.fillStyle = fg; c.textAlign = "right"; c.fillText(String(Math.round(v)), 1008, y + 44); c.textAlign = "left";
    });
  } else {
    c.font = disp(110); c.fillStyle = "#fff"; ctpWrap(c, "I tu, en saps prou?", 72, 520, 936, 120, 3);
    c.font = sans(46, 600); ctpWrap(c, "Fes el test d'actualitat d'avui i el test d'afinitat política a politicaenjoc.cat", 72, 900, 920, 60, 4);
  }
  c.textAlign = "left"; c.font = disp(34); c.fillStyle = dark ? "#fff" : INK; c.fillText("POLÍTICA EN JOC", 72, H - 70);
  c.font = sans(28, 700); c.textAlign = "right"; c.fillText("politicaenjoc.cat", W - 72, H - 72); c.textAlign = "left";
  return cv;
}
async function ctpGenCarousel(root) {
  const items = ctpXItems().filter((x) => CTP_X.picks.includes(x.u)).slice(0, 6);
  if (!items.length) return toast("Tria almenys un titular");
  $$("[data-xtext]", root).forEach((el) => { CTP_X.text[el.dataset.xtext] = el.value.trim(); });
  $$("[data-xfoto]", root).forEach((el) => { CTP_X.foto[el.dataset.xfoto] = el.value; });
  const out = $("#ctp-xout", root);
  out.innerHTML = `<section class="card"><p class="muted">Preparant les imatges…</p></section>`;
  await document.fonts?.ready;
  const date = new Date().toLocaleDateString("ca", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  const P = (typeof POLL_SEATS !== "undefined" ? POLL_SEATS : []).slice(0, 8);
  const ks = ["pp", "psoe", "vox", "fa", "erc", "junts", "bildu", "pnv"];
  const rows = ks.map((k) => [PARTIES.find((p) => p.id === k)?.sig || k, P.reduce((a, p) => a + (p.s?.[k] || 0), 0) / (P.length || 1), PARTIES.find((p) => p.id === k)?.color || "#888"]);
  const credits = [];
  const heads = [];
  for (const [k, x] of items.entries()) {
    const pid = CTP_X.foto[x.u] ?? ctpPartyOf(x)[0]?.id ?? "";
    const p = PARTIES.find((q) => q.id === pid), ph = p && typeof PHOTOS !== "undefined" ? PHOTOS[p.cand?.name] : null;
    const img = ph ? await ctpImg(ctpBig(ph.src)) : null;
    const credit = ph ? `Foto: ${ph.author} · ${ph.license} · Wikimedia Commons` : "";
    if (img) credits.push(`${p.cand.name}: ${ph.author} (${ph.license}), ${ph.page}`);
    heads.push(ctpSlide("titular", { t: CTP_X.text[x.u] || x.t, s: x.s, h: new Date(x.d).toLocaleTimeString("ca", { hour: "2-digit", minute: "2-digit" }), img, credit }, k + 1));
  }
  const slides = [ctpSlide("portada", { date, n: items.length }, 0), ...heads, ...(P.length ? [ctpSlide("enquestes", { n: P.length, rows }, items.length + 1)] : []), ctpSlide("crida", {}, 0)];
  const peu = `El dia de la campanya, ${date}.\n\nFonts: ${[...new Set(items.map((x) => x.s))].join(", ")}. Enquestes: recull de la Viquipèdia.${credits.length ? `\nFotos (Wikimedia Commons):\n${credits.join("\n")}` : ""}\n\n#29N #EleccionsGenerals #PolíticaEnJoc`;
  out.innerHTML = `<section class="card"><h2 class="section-title sm">3. Carrusel (${slides.length} imatges)</h2><div class="ctp-xs"></div>
    <div class="row"><button type="button" class="btn primary" data-xdl>Descarrega-les totes</button><button type="button" class="btn" data-xpeu>Copia el text de la publicació</button></div>
    <textarea class="ctp-rep" rows="7" readonly>${esc(peu)}</textarea></section>`;
  const box = $(".ctp-xs", out);
  slides.forEach((cv) => { cv.className = "ctp-x"; box.appendChild(cv); });
  $("[data-xpeu]", out).addEventListener("click", async () => { try { await navigator.clipboard.writeText(peu); toast("Copiat"); } catch { toast("No s'ha pogut copiar"); } });
  $("[data-xdl]", out).addEventListener("click", async () => {
    for (let k = 0; k < slides.length; k++) {
      const blob = await new Promise((r) => slides[k].toBlob(r, "image/png"));
      if (!blob) { toast("Una foto no deixa exportar la imatge: treu-la i torna-ho a provar"); return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `carrusel-${ctpDay(0)}-${String(k + 1).padStart(2, "0")}.png`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      await new Promise((r) => setTimeout(r, 350));
    }
  });
}

// ---------- 10. Informe setmanal ----------
function ctpReportText() {
  const all = ctuDayList(30), wk = all.slice(-7), prev = all.slice(-14, -7);
  const S = ctuSum(wk), Pv = ctuSum(prev);
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const pct = (a, b) => (b ? ` (${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} % respecte a la setmana anterior)` : "");
  const uWk = wk.reduce((a, d) => a + (CTU.days[d]?.u || 0), 0), uPv = prev.reduce((a, d) => a + (CTU.days[d]?.u || 0), 0);
  const games = Object.fromEntries((typeof GAMES !== "undefined" ? GAMES : []).map((g) => [g.id, g.title]));
  const topG = Object.entries(S.f || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, n]) => `${games[g] || g} (${fmt(n)})`).join(", ");
  const from = wk[0].split("-").reverse().join("/"), to = wk[wk.length - 1].split("-").reverse().join("/");
  return `Política en Joc · Informe setmanal (${from} – ${to})

• Visites: ${fmt(uWk)} persones úniques (suma de cada dia)${pct(uWk, uPv)}; ${fmt(S.ses || 0)} sessions${pct(S.ses || 0, Pv.ses || 0)}.
• Partides acabades: ${fmt(sum(S.f))}${pct(sum(S.f), sum(Pv.f))}. Les més jugades: ${topG || "—"}.
• Repte diari: ${fmt(S.diari || 0)} partides. Test d'actualitat: ${fmt(S.f?.actualitat || 0)}. Test d'afinitat: ${fmt(S.f?.assembla || 0)}.
• Comparticions de resultats: ${fmt(sum(S.sh))}.
• Notificacions: ${fmt(ctpClicks(S))} clics als avisos.
• D'on arriba la gent: ${Object.entries(S.src || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${fmt(n)})`).join(", ") || "—"}.

Dades anònimes i agregades del Centre de control de Política en Joc (politicaenjoc.cat).`;
}
const CTP_REP = { cfg: null, loading: false };
async function ctpRepLoad() {
  if (CTP_REP.loading) return;
  CTP_REP.loading = true;
  CTP_REP.cfg = (await window.Online.getPrivat("informe")) || {};
  CTP_REP.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "informe") renderControl(true);
}
function ctpReportHtml() {
  if (!CTU.days) { ctuLoad(); return `<div class="card"><p class="muted">Carregant les dades…</p></div>`; }
  if (!CTP_REP.cfg) ctpRepLoad();
  const R = CTP_REP.cfg || {}, txt = ctpReportText();
  return `<section class="card"><h2 class="section-title sm">📬 Enviament automàtic</h2>
      <p>Cada dilluns a les 9:00 s'envia per correu l'informe de la setmana anterior (amb Brevo, el mateix servei de les notes de premsa).</p>
      <label class="ctl-inline">Destinataris (separats per comes) <input type="text" data-rep-dest value="${esc((R.dest || []).join(", "))}" placeholder="nom@exemple.cat, …" ${ctlCan(3) ? "" : "disabled"}></label>
      ${ctlCan(3) ? `<div class="row"><button type="button" class="btn sm" data-rep-save>Desa</button></div>` : ""}
      <p class="muted">${R.last?.at ? `Últim enviament: ${new Date(R.last.at).toLocaleString("ca")} · ${esc(R.last.status || "")}` : "Encara no se n'ha enviat cap."} Les adreces només les veu l'equip.</p></section>
    <p class="ctl-intro">Resum dels darrers 7 dies amb les dades del moment, per si el vols enviar tu.</p>
    <section class="card"><textarea class="ctp-rep" rows="16" readonly>${esc(txt)}</textarea>
      <div class="row"><button type="button" class="btn primary" data-rep-copy>Copia el text</button><button type="button" class="btn" data-rep-dl>Descarrega (.txt)</button></div></section>`;
}

// ---------- 11. Assaig de la nit electoral ----------
const CTP_NIT = { checks: null, running: false };
async function ctpNitRun() {
  CTP_NIT.running = true; renderControl(true);
  const O = window.Online, out = [];
  const add = (ok, t, d) => out.push({ ok, t, d });
  add(!!window.FIREBASE_CONFIG?.avisosUrl, "Servei d'avisos configurat", "avisosUrl a js/firebase-config.js");
  try { const r = await fetch(`${window.PEJ_DATA || "data/"}resultats.json?t=${Date.now()}`, { cache: "no-store" }); add(r.ok || r.status === 404, "Fitxer de resultats accessible", r.ok ? "Hi ha dades (assaig o reals)" : "Encara no existeix: normal fins a la nit"); } catch { add(false, "Fitxer de resultats accessible", "No s'ha pogut consultar"); }
  const push = await O.getConfig("push");
  add(!!push, "Configuració d'avisos llegible", push ? `Repte diari ${push.diariOn === false ? "aturat" : "actiu"}` : "No s'ha pogut llegir");
  add(typeof Esp !== "undefined" && !!Esp.live, "Connexió en directe del Centre de control", Esp?.live ? "En directe" : "Sense directe: comprova la connexió");
  add(!!(CTP_TPL.nit && CTP_TPL.vota), "Avisos de la jornada preparats", "Plantilles «Avui es vota» i «Comença la nit electoral»");
  const sched = await O.pushScheduled();
  const has = (t) => sched.some((x) => x.title === t);
  add(has(CTP_TPL.vota.title) && has(CTP_TPL.nit.title), "Avisos del 29N programats", has(CTP_TPL.vota.title) && has(CTP_TPL.nit.title) ? "Tots dos" : "Programa'ls al Calendari d'avisos");
  CTP_NIT.checks = out; CTP_NIT.running = false;
  renderControl(true);
}
function ctpNitHtml() {
  const C = CTP_NIT.checks;
  return `<p class="ctl-intro">Abans del 29N, fes l'assaig complet: 1) comprovacions automàtiques, 2) el simulacre de la nit amb les dades del 23J (pestanya Nit electoral, només per a l'equip), 3) un avís de prova a tu mateix des del teu mòbil (Perfil → Notificacions → «Prova»).</p>
    <section class="card"><h2 class="section-title sm">1. Comprovacions</h2>
      ${C ? `<ul class="ctp-chk">${C.map((x) => `<li class="${x.ok ? "ok" : "ko"}"><span>${x.ok ? "✔" : "✖"}</span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></li>`).join("")}</ul>` : `<p class="muted">Encara no s'ha fet.</p>`}
      <button type="button" class="btn primary" data-nit-run ${CTP_NIT.running ? "disabled" : ""}>${CTP_NIT.running ? "Comprovant…" : C ? "Torna-ho a comprovar" : "Fes les comprovacions"}</button></section>
    <section class="card"><h2 class="section-title sm">2. Simulacre de la nit</h2><p>Reprodueix la nit del 23J en 20 minuts, només per a l'equip, per veure la portada, el directe i la Lliga de pronòstics.</p><button type="button" class="btn" data-tab="nit">Ves a Nit electoral</button></section>
    <section class="card"><h2 class="section-title sm">3. Avisos del 29N</h2><p>Programa «Avui es vota» (9:30) i «Comença la nit electoral» (20:00).</p><button type="button" class="btn" data-tab="calendari">Ves al calendari</button></section>`;
}

// ---------- Enllaços (cridat des de control.js) ----------
function ctpBind(tab, root) {
  if (tab === "resum") {
    $("[data-ctp-refresh]", root)?.addEventListener("click", () => { CTP.today = null; renderControl(true); });
    $("[data-alsub]", root)?.addEventListener("click", async (e) => {
      const uid = window.Online?.user?.uid; if (!uid) return;
      const on = e.target.dataset.alsub === "on", cur = new Set(CTP_AL.cfg?.uids || []);
      on ? cur.add(uid) : cur.delete(uid);
      if (await window.Online.setPrivat("alertes", { uids: [...cur] })) { CTP_AL.cfg = { ...CTP_AL.cfg, uids: [...cur] }; toast(on ? "Rebràs les alertes al mòbil" : "Ja no rebràs les alertes"); renderControl(true); }
    });
  }
  if (tab === "calendari") {
    ctlQuickBind(root);
    $$("[data-ctp-prog]", root).forEach((b) => b.addEventListener("click", () => ctpProgram(...b.dataset.ctpProg.split("|"))));
    $$("[data-pcancel]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm("Es cancel·larà aquest avís programat. Continuar?")) return; if (await window.Online.pushUpdate(b.dataset.pcancel, { status: "cancelled" })) { ctlPush.cfg = null; renderControl(true); } }));
  }
  if (tab === "embut") $$("[data-curange]", root).forEach((b) => b.addEventListener("click", () => { CTU.range = Number(b.dataset.curange); renderControl(true); }));
  if (tab === "testdia") {
    $("[data-tf-reload]", root)?.addEventListener("click", () => { CTP_TF.day = null; renderControl(true); });
    $("[data-tf-ok]", root)?.addEventListener("click", () => { if (confirm("El test d'avui sortirà ara mateix per a tothom. Continuar?")) ctpTfSave(CTP_TF.fix || {}, { ok: CTP_TF.day }, "Publicat"); });
    $("[data-tf-gate]", root)?.addEventListener("change", (e) => { if (/^\d{2}:\d{2}$/.test(e.target.value)) ctpTfSave(CTP_TF.fix || {}, { gate: e.target.value }, `Hora de publicació: ${e.target.value}`); });
    const read = (i) => { const o = {}; $$(`[data-tf="${i}"]`, root).forEach((el) => { o[el.dataset.k] = el.value.trim(); }); return o; };
    $$("[data-tf-save]", root).forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.tfSave), q = CTP_TF.data.questions[i], v = read(i);
      const a = q.a.map((x, j) => v["a" + j] || x);
      if (a.some((x) => !x)) return toast("Cap opció pot quedar buida");
      const f = { ...(CTP_TF.fix[i] || {}) };
      if (v.q !== q.q) f.q = v.q; else delete f.q;
      if (a.join("|") !== q.a.join("|")) f.a = a; else delete f.a;
      if (v.exp !== (q.exp || "")) f.exp = v.exp; else delete f.exp;
      const next = { ...CTP_TF.fix }; if (Object.keys(f).length) next[i] = f; else delete next[i];
      ctpTfSave(next);
    }));
    $$("[data-tf-hide]", root).forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.tfHide), f = { ...(CTP_TF.fix[i] || {}) };
      if (f.hide) delete f.hide; else { if (!confirm("La pregunta deixarà de sortir al test d'avui. Continuar?")) return; f.hide = true; }
      const next = { ...CTP_TF.fix }; if (Object.keys(f).length) next[i] = f; else delete next[i];
      ctpTfSave(next);
    }));
    $$("[data-tf-undo]", root).forEach((b) => b.addEventListener("click", () => { const next = { ...CTP_TF.fix }; delete next[Number(b.dataset.tfUndo)]; ctpTfSave(next); }));
  }
  if (tab === "xarxes") {
    $$("[data-xpick]", root).forEach((el) => el.addEventListener("change", () => {
      const u = el.dataset.xpick;
      $$("[data-xtext]", root).forEach((t) => { CTP_X.text[t.dataset.xtext] = t.value.trim(); });
      $$("[data-xfoto]", root).forEach((t) => { CTP_X.foto[t.dataset.xfoto] = t.value; });
      CTP_X.picks = el.checked ? [...CTP_X.picks, u].slice(-6) : CTP_X.picks.filter((x) => x !== u);
      renderControl(true);
    }));
    $("[data-xgen]", root)?.addEventListener("click", () => ctpGenCarousel(root));
  }
  if (tab === "informe") {
    $("[data-rep-copy]", root)?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(ctpReportText()); toast("Copiat"); } catch { toast("No s'ha pogut copiar"); } });
    $("[data-rep-save]", root)?.addEventListener("click", async () => {
      const dest = $("[data-rep-dest]", root).value.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(x)).slice(0, 20);
      if (await window.Online.setPrivat("informe", { dest })) { CTP_REP.cfg = { ...CTP_REP.cfg, dest }; toast(`Desat: ${dest.length} destinataris`); renderControl(true); }
    });
    $("[data-rep-dl]", root)?.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ctpReportText()], { type: "text/plain" })); a.download = `informe-${ctpDay(0)}.txt`; document.body.appendChild(a); a.click(); a.remove(); });
  }
  if (tab === "assaig") $("[data-nit-run]", root)?.addEventListener("click", ctpNitRun);
}
