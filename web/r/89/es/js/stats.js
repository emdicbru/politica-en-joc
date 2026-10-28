// Radiografia d'ús: comptadors anònims i agregats per dia, per al Centre de control.
// No hi ha cap identificador de persona ni de dispositiu: cada visita només suma 1 a comptadors com «partides de
// l'Endevina l'any» o «visites des d'un iPhone». Al dispositiu només es guarda el dia de la primera visita i el de
// l'última (per saber si és nou o si torna) i els comptadors pendents d'enviar (r29n-stats).
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
  const daysBetween = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
  const st = () => store.get(STATS_KEY, {});
  const save = (s) => store.set(STATS_KEY, s);
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
    // Primer cop del dia en aquest dispositiu
    if (s.last !== day) {
      const first = s.first || day;
      const isNew = !s.first;
      const s2 = { ...st(), first, last: day };
      save(s2);
      add("dev");
      if (isNew) add("nous");
      else {
        add("torna");
        const since = daysBetween(first, day);
        if (since === 1) add("r1");
        if (since === 7) add("r7");
        if (since === 30) add("r30");
      }
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { hiddenAt = Date.now(); clearTimeout(timer); timer = null; flush(); }
    else if (hiddenAt && Date.now() - hiddenAt > 30 * 60e3) session();
  });
  window.addEventListener("hashchange", () => view());
  let lastView = "";
  function view() {
    const v = location.hash.slice(1).split("/")[0] || "inici";
    if (v === lastView || v === "joc") { lastView = v; return; }
    lastView = v;
    add("v", 1, typeof VIEWS !== "undefined" && VIEWS.includes(v) ? v : "inici");
  }

  return {
    add,
    flush,
    day: madridDay,
    start() { if (st().off) return; session(); view(); schedule(8000); },
    off() { return !!st().off; },
    setOff(on) { const s = st(); if (on) { save({ off: 1 }); } else { delete s.off; save(s); } },
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
