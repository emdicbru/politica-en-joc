// Anuncis recompensats: un vídeo d'un anunciant, només si la persona el demana, per jugar una partida extra del repte
// diari. Fa servir l'API d'anuncis per a jocs web de Google (Ad Placement API, programa «H5 Games Ads» d'AdSense).
// El codi de Google no es carrega mai abans que algú premi «Mira el vídeo»: fins aleshores no hi ha cap galeta ni cap
// connexió amb Google Ads. En carregar-lo, Google mostra el seu missatge de consentiment (CMP) si cal.
// La configuració (config/anuncis, Centre de control) diu el compte d'AdSense, si el límit del repte és actiu i si es
// fan servir anuncis de prova.

const ADS_KEY = "r29n-ads";
const Ads = (() => {
  let cfg = store.get(ADS_KEY, null) || {};
  let loading = null, fetched = false, sound = null;
  // Durant el vídeo, els sons del joc callen
  const mute = (m) => {
    if (typeof Sfx === "undefined") return;
    if (m && sound === null) { sound = Sfx.on; Sfx.on = false; } else if (!m && sound !== null) { Sfx.on = sound; sound = null; }
  };
  const valid = () => /^ca-pub-\d{10,20}$/.test(cfg.client || "");

  // La configuració es llegeix un cop per sessió (i es recorda per a la propera visita)
  async function refresh() {
    if (fetched) return cfg;
    for (let i = 0; i < 40 && !window.Online?.getConfig; i++) await new Promise((r) => setTimeout(r, 250));
    const c = await window.Online?.getConfig?.("anuncis");
    // Sense connexió (null) es manté la que es recordava
    if (c) { fetched = true; cfg = c; store.set(ADS_KEY, cfg); }
    return cfg;
  }

  function load() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = (o) => { window.adsbygoogle.push(o); };
      const s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.client)}`;
      if (cfg.test) s.dataset.adbreakTest = "on";
      s.dataset.adFrequencyHint = "30s";
      s.onload = () => { window.adConfig({ preloadAdBreaks: "on", sound: "on" }); resolve(); };
      s.onerror = () => { loading = null; reject(new Error("bloquejat")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // Mostra un vídeo recompensat. Resol { ok: true } només si s'ha vist sencer.
  async function reward(name = "repte-extra") {
    if (!valid()) return { ok: false, why: "config" };
    window.Stats?.add("ad", 1, "demanat");
    try { await load(); } catch { window.Stats?.add("ad", 1, "bloquejat"); return { ok: false, why: "blocked" }; }
    return new Promise((resolve) => {
      let viewed = false, done = false;
      const end = (r) => { if (done) return; done = true; window.Stats?.add("ad", 1, r.ok ? "vist" : r.why || "fallat"); resolve(r); };
      // Si en un temps raonable no arriba res (sense connexió, bloquejadors), es dona per fallat
      const timer = setTimeout(() => end({ ok: false, why: "timeout" }), 20000);
      window.adBreak({
        type: "reward",
        name,
        beforeAd: () => { clearTimeout(timer); mute(true); },
        afterAd: () => { mute(false); },
        beforeReward: (showAdFn) => { clearTimeout(timer); showAdFn(); },
        adDismissed: () => {},
        adViewed: () => { viewed = true; },
        adBreakDone: (info) => {
          clearTimeout(timer);
          mute(false);
          end(viewed ? { ok: true } : { ok: false, why: info?.breakStatus === "dismissed" ? "dismissed" : info?.breakStatus || "noad" });
        },
      });
    });
  }

  return {
    refresh, reward,
    // Hi ha anuncis configurats (compte d'AdSense vàlid)
    ready: () => valid(),
    // El repte diari té límit: 2 partides i la 3a amb vídeo
    limit: () => cfg.repte === "limit",
    // La web mostra anuncis (per als textos legals i del peu)
    on: () => valid() && cfg.repte === "limit",
    cfg: () => ({ ...cfg }),
    set(c) { cfg = c || {}; store.set(ADS_KEY, cfg); },
  };
})();
window.Ads = Ads;
