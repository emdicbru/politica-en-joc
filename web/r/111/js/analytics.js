// El consentiment de galetes: un sol avís, d'un toc («Accepta» o «Rebutja», igual de visibles), per a l'estadística
// d'ús (stats.js: amb consentiment, l'app desa al dispositiu el dia de la primera i l'última visita per saber si és nou,
// si torna i amb quina freqüència) i, si mai es configura, Google Analytics 4 («measurementId» a js/firebase-config.js).
// Sense resposta o amb «Rebutja», no es desa res al dispositiu per mesurar l'ús.
const CONSENT_KEY = "r29n-consent";
const CONSENT_DAYS = 365; // es torna a preguntar al cap d'un any
const ANALYTICS_AVAILABLE = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId);
const GA_SDK = "https://www.gstatic.com/firebasejs/10.12.2";
let gaMod = null, gaRef = null, gaLoading = null;

function getConsent() {
  const c = store.get(CONSENT_KEY, null);
  if (c && typeof c.ts !== "number" && "t" in c) return { analytics: !!c.a, ts: Date.now() }; // format antic
  if (!c || typeof c.ts !== "number" || Date.now() - c.ts > CONSENT_DAYS * 864e5) return null;
  return c;
}

function clearGaCookies() {
  const host = location.hostname;
  const domains = [host, "." + host, "." + host.split(".").slice(-2).join(".")];
  document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n.startsWith("_ga")).forEach((n) => {
    domains.forEach((d) => { document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`; });
    document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

async function enableAnalytics() {
  if (!ANALYTICS_AVAILABLE) return;
  if (gaRef) {
    gaMod.setAnalyticsCollectionEnabled(gaRef, true);
    gaMod.setConsent?.({ analytics_storage: "granted" });
    return;
  }
  gaLoading = gaLoading || (async () => {
    try {
      const [appMod, anMod] = await Promise.all([import(`${GA_SDK}/firebase-app.js`), import(`${GA_SDK}/firebase-analytics.js`)]);
      const app = appMod.getApps()[0] || appMod.initializeApp(window.FIREBASE_CONFIG);
      gaMod = anMod;
      gaRef = anMod.initializeAnalytics(app, { config: { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false } });
      anMod.setConsent?.({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      Track("page_view", { page_path: location.hash || "#jocs", page_title: document.title });
    } catch (e) {
      console.warn("No s'ha pogut carregar l'analítica:", e);
    }
  })();
  await gaLoading;
}

function disableAnalytics() {
  if (gaRef && gaMod) {
    gaMod.setAnalyticsCollectionEnabled(gaRef, false);
    gaMod.setConsent?.({ analytics_storage: "denied" });
  }
  clearGaCookies();
}

function saveConsent(analytics, quiet = false) {
  const before = getConsent();
  store.set(CONSENT_KEY, { analytics: !!analytics, ts: Date.now() });
  closeConsent();
  if (analytics) enableAnalytics(); else disableAnalytics();
  window.Stats?.consent?.(!!analytics);
  if (!before) window.Stats?.add?.("cons", 1, analytics ? "si" : "no");
  if (!quiet) toast(analytics ? "Gràcies! Ens ajudes a millorar l'app 💛" : "D'acord: no es desa res per mesurar l'ús.");
}

window.Track = (name, params) => {
  if (gaRef && gaMod && getConsent()?.analytics) { try { gaMod.logEvent(gaRef, name, params); } catch { /* sense analítica */ } }
};

function closeConsent() {
  document.getElementById("consent")?.remove();
  document.body.classList.remove("consent-open");
}

function openConsent(settings = false) {
  closeConsent();
  const cur = getConsent();
  const el = document.createElement("div");
  el.id = "consent";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Preferències de galetes");
  el.innerHTML = `
    <div class="cs-body">
      <b>📊 Ens ajudes a millorar l'app?</b>
      <p>Si ho acceptes, comptem de manera anònima com es fa servir: si hi tornes, cada quan i quines parts t'interessen${ANALYTICS_AVAILABLE ? " (també amb Google Analytics)" : ""}. Mai no sabrem qui ets i no hi ha galetes publicitàries. <a href="#legal/cookies">Més informació</a></p>
      <div class="cs-settings" ${settings ? "" : "hidden"}>
        <label class="cs-row"><span><b>Tècniques</b><small>Necessàries perquè l'app funcioni (el progrés, la sessió, les preferències). No es poden desactivar.</small></span><input type="checkbox" checked disabled></label>
        <label class="cs-row"><span><b>Estadística d'ús</b><small>Comptadors anònims i agregats: si el dispositiu és nou o torna i cada quan${ANALYTICS_AVAILABLE ? ", i Google Analytics" : ""}.</small></span><input type="checkbox" id="cs-an" ${cur?.analytics ? "checked" : ""}></label>
      </div>
    </div>
    <div class="cs-actions">
      <button class="btn" data-cs="reject">Rebutja</button>
      <button class="btn ghost" data-cs="settings" ${settings ? "hidden" : ""}>Configura</button>
      <button class="btn ghost" data-cs="save" ${settings ? "" : "hidden"}>Desa la tria</button>
      <button class="btn primary" data-cs="accept">Accepta</button>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("consent-open");
  el.querySelector('[data-cs="reject"]').addEventListener("click", () => saveConsent(false));
  el.querySelector('[data-cs="accept"]').addEventListener("click", () => saveConsent(true));
  el.querySelector('[data-cs="save"]').addEventListener("click", () => saveConsent(el.querySelector("#cs-an").checked));
  el.querySelector('[data-cs="settings"]').addEventListener("click", () => {
    el.querySelector(".cs-settings").hidden = false;
    el.querySelector('[data-cs="settings"]').hidden = true;
    el.querySelector('[data-cs="save"]').hidden = false;
  });
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-consent]")) { e.preventDefault(); openConsent(true); }
});
window.addEventListener("hashchange", () => Track("page_view", { page_path: location.hash || "#jocs", page_title: document.title }));

{
  const c = getConsent();
  // L'avís surt un sol cop, quan no hi ha cap altra finestra al davant (el tutorial, una trucada…)
  const ask = () => {
    if (getConsent() || document.getElementById("consent")) return;
    if (document.querySelector(".onb, .ins-bg, .ring, .xat-sheet-bg, .db-theater")) { setTimeout(ask, 1500); return; }
    openConsent(false);
  };
  if (!c) setTimeout(ask, 1200);
  else if (c.analytics && ANALYTICS_AVAILABLE) enableAnalytics();
  else if (ANALYTICS_AVAILABLE) clearGaCookies();
}
