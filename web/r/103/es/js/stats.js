// Radiografia d'ús: comptadors anònims i agregats per dia, per al Centre de control.
// No hi ha cap identificador de persona ni de dispositiu: cada visita només suma 1 a comptadors com «partides de
// l'Endevina l'any» o «visites des d'un iPhone». Al dispositiu no es guarda res per mesurar
// l'ús: només, si la persona ho demana, la tria de no comptar les seves visites (r29n-stats).
// Es desen a Firestore stats/{dia}_{n}: el dia es reparteix en 10 documents perquè molta gent alhora no col·lapsi
// un sol document. Només l'equip els pot llegir. Es poden aturar per a tothom des del Centre de control (statsOff).
const STATS_KEY = "r29n-stats";
const STATS_SHARDS = 10;
// Les IA van primer (gemini.google.com no ha de comptar com a Google)
const STATS_AI = [["chatgpt", /(^|\.)(chatgpt\.com|openai\.com)$/], ["perplexity", /perplexity\./], ["claude", /(^|\.)claude\.ai$/], ["gemini", /gemini\.google\./], ["copilot", /copilot\.(microsoft|cloud)/]];
const STATS_REF = [...STATS_AI, ["google", /google\./], ["x", /(^|\.)(t\.co|x\.com|twitter\.com)$/], ["whatsapp", /whatsapp/], ["instagram", /instagram/], ["facebook", /facebook|fb\.com/], ["telegram", /telegram|t\.me/], ["tiktok", /tiktok/], ["bluesky", /bsky/]];

const Stats = (() => {
  const madridDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);
  const madridHour = () => String(Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24).padStart(2, "0");
  // Sense consentiment (analytics.js), al dispositiu només es desa la tria de no comptar les visites (r29n-stats:
  // { off: 1 }), que la demana la persona: per mesurar l'ús no s'hi desa res (art. 22.2 LSSI-CE i directiva ePrivacy).
  // Amb consentiment, també el dia de la primera i de l'última visita i quants dies diferents hi ha entrat (first, last,
  // days): així se sap si el dispositiu és nou, si torna i cada quan. Els comptadors pendents d'enviar viuen a la memòria.
  let mem = { q: {}, shard: Math.floor(Math.random() * STATS_SHARDS) };
  const st = () => ({ ...mem, ...(store.get(STATS_KEY, {}).off ? { off: 1 } : {}) });
  const save = (s) => { mem = { ...mem, q: s.q || {}, shard: s.shard ?? mem.shard }; };
  const consented = () => typeof getConsent === "function" && !!getConsent()?.analytics;
  const devMem = () => store.get(STATS_KEY, {});
  const forget = () => { try { const o = devMem(); if (Object.keys(o).some((k) => k !== "off")) store.set(STATS_KEY, o.off ? { off: 1 } : {}); } catch { /* sense emmagatzematge */ } };
  if (!consented()) forget();
  const key = (k) => String(k).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "altre";

  // Comptadors pendents d'enviar: { dia: { camp: n, mapa: { clau: n } } }
  function add(field, n = 1, sub) {
    if (!n) return;
    const s = st();
    if (s.off) return;
    const day = madridDay();
    const q = (s.q ||= {});
    const d = (q[day] ||= {});
    if (sub !== undefined) { const m = (d[field] ||= {}); m[key(sub)] = (m[key(sub)] || 0) + n; }
    else d[field] = (d[field] || 0) + n;
    // Només es guarden els últims 3 dies pendents (si fa dies que no hi ha connexió, la resta es descarta)
    Object.keys(q).sort().slice(0, -3).forEach((k) => delete q[k]);
    save(s);
    schedule();
  }

  let timer = null, lastFlush = 0, flushing = false;
  function schedule(ms) {
    if (timer) return;
    const wait = ms ?? Math.max(8000, 120000 - (Date.now() - lastFlush));
    timer = setTimeout(() => { timer = null; flush(); }, wait);
  }
  async function flush() {
    const O = window.Online;
    if (flushing || !O?.statsSend) return;
    if (typeof Esp !== "undefined" && Esp.cfg?.statsOff) return;
    const s = st();
    const q = s.q || {};
    const days = Object.keys(q).filter((d) => Object.keys(q[d]).length);
    if (!days.length) return;
    flushing = true;
    lastFlush = Date.now();
    s.shard ??= Math.floor(Math.random() * STATS_SHARDS);
    save(s);
    for (const day of days) {
      const data = q[day];
      // Es treuen de la cua abans d'enviar; si falla, es tornen a sumar
      const cur = st(); delete cur.q[day]; save(cur);
      const ok = await O.statsSend(`${day}_${s.shard}`, data);
      if (!ok) {
        const back = st(); const d = ((back.q ||= {})[day] ||= {});
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === "number") d[k] = (d[k] || 0) + v;
          else { const m = (d[k] ||= {}); for (const [kk, vv] of Object.entries(v)) m[kk] = (m[kk] || 0) + vv; }
        }
        save(back);
        break;
      }
    }
    flushing = false;
  }

  // Una «sessió» és cada cop que s'obre l'app, o quan s'hi torna després de 30 minuts fora
  let hiddenAt = 0;
  function session() {
    const s = st();
    if (s.off) return;
    const day = madridDay();
    add("ses");
    add("h", 1, madridHour());
    devDay();
    // Un cop per sessió
    if (!mem.started) {
      mem.started = day;
      const ua = navigator.userAgent;
      add("disp", 1, /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /android/i.test(ua) ? "android" : "ordinador");
      add("mode", 1, typeof isStandalone === "function" && isStandalone() ? "app" : "web");
      add("lv", 1, String(Progress.levelIndex() + 1));
      if (window.Online?.user) add("acc");
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && store.get("r29n-push", {}).id) add("notifDev");
    }
    // D'on ve (només la categoria del web d'origen, mai l'adreça)
    let src = "directe";
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      if (host && host !== location.hostname) src = STATS_REF.find(([, re]) => re.test(host))?.[0] || "altres";
    } catch { /* sense origen */ }
    if (/[?&]utm_source=push\b/.test(location.search)) src = "notificacio";
    // Els assistents d'IA sovint no envien l'origen, però afegeixen utm_source a l'enllaç (p. ex. utm_source=chatgpt.com)
    const utm = decodeURIComponent((location.search.match(/[?&]utm_source=([^&]+)/) || [])[1] || "");
    const ai = utm && STATS_AI.find(([k, re]) => re.test(utm) || utm.toLowerCase().includes(k));
    if (ai) src = ai[0];
    add("src", 1, src);
  }

  // Amb consentiment: el primer cop de cada dia en aquest dispositiu (nou o torna, al cap de quants dies, quants dies hi ha
  // entrat). Sense consentiment no es pot saber i no es compta.
  function devDay() {
    if (!consented()) return;
    const day = madridDay(), D = devMem();
    if (D.last === day) return;
    const first = D.first || day, days = (D.days || 0) + 1;
    store.set(STATS_KEY, { ...(D.off ? { off: 1 } : {}), first, last: day, days });
    add("dev");
    if (!D.first) add("nous");
    else {
      add("torna");
      const since = Math.round((Date.parse(day + "T12:00:00Z") - Date.parse(first + "T12:00:00Z")) / 864e5);
      if (since === 1) add("r1");
      if (since === 7) add("r7");
      if (since === 30) add("r30");
    }
    add("dact", 1, days >= 15 ? "15+" : days >= 8 ? "8-14" : days >= 4 ? "4-7" : days >= 2 ? "2-3" : "1");
  }

  // Temps: el temps actiu (amb la pantalla a la vista) per dia i per secció. Es mesura a la memòria de la pàgina.
  let viewKey = null, viewSince = Date.now();
  const viewOf = () => { const v = location.hash.slice(1).split("/")[0] || "inici"; return typeof VIEWS !== "undefined" && VIEWS.includes(v) ? v : "inici"; };
  function timeTick() {
    if (!viewKey) return;
    const secs = Math.round((Date.now() - viewSince) / 1000);
    viewSince = Date.now();
    if (secs < 1 || secs > 4 * 3600) return;
    add("tt", secs);
    add("vt", secs, viewKey);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { timeTick(); viewKey = null; hiddenAt = Date.now(); clearTimeout(timer); timer = null; flush(); }
    else {
      viewKey = viewOf(); viewSince = Date.now();
      if (hiddenAt && Date.now() - hiddenAt > 30 * 60e3) session();
    }
  });
  window.addEventListener("hashchange", () => view());
  let lastView = "";
  function view() {
    const v = location.hash.slice(1).split("/")[0] || "inici";
    if (document.visibilityState !== "hidden") { timeTick(); viewKey = viewOf(); viewSince = Date.now(); }
    if (v === lastView || v === "joc") { lastView = v; return; }
    lastView = v;
    add("v", 1, typeof VIEWS !== "undefined" && VIEWS.includes(v) ? v : "inici");
  }
  // Errors de la pàgina (només quants: per saber si una versió falla més)
  window.addEventListener("error", () => add("err"));

  return {
    add,
    flush,
    day: madridDay,
    // Embuts: fins on arriba la gent en un recorregut (tutorial, instal·lar, compte, notificacions, amics…)
    step(funnel, s) { add("fn", 1, `${funnel}_${s}`); },
    // Canvi de consentiment (analytics.js): sense, s'esborra el que se sabia del dispositiu
    consent(on) { if (on) devDay(); else forget(); },
    start() { if (st().off) return; session(); view(); schedule(8000); },
    off() { return !!st().off; },
    setOff(on) { store.set(STATS_KEY, on ? { off: 1 } : {}); if (on) mem.q = {}; },
  };
})();
window.Stats = Stats;
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-stats-toggle]");
  if (!b) return;
  const off = !Stats.off();
  Stats.setOff(off);
  b.textContent = off ? "Vuelve a contar mis visitas" : "No cuentes mis visitas";
  toast(off ? "Tus visitas ya no se cuentan" : "Tus visitas vuelven a contar");
});
// Arrenca quan ja hi ha la resta de l'app
setTimeout(() => Stats.start(), 1200);
