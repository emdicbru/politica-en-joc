// Analítica de trànsit (Google Analytics 4 via Firebase) amb consentiment previ.
// No es carrega res de Google Analytics ni es creen cookies _ga fins que la persona accepta explícitament.
// S'activa només si js/firebase-config.js té «measurementId» (ID de mesura de GA4, tipus G-XXXXXXXXXX).
const CONSENT_KEY = "r29n-consent";
const CONSENT_DAYS = 365; // es torna a preguntar al cap d'un any
const ANALYTICS_AVAILABLE = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId);
const GA_SDK = "https://www.gstatic.com/firebasejs/10.12.2";
let gaMod = null, gaRef = null, gaLoading = null;

function getConsent() {
  const c = store.get(CONSENT_KEY, null);
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

function saveConsent(analytics) {
  store.set(CONSENT_KEY, { analytics: !!analytics, ts: Date.now() });
  closeConsent();
  if (analytics) enableAnalytics(); else disableAnalytics();
  toast("S'han desat les preferències de galetes.");
}

window.Track = (name, params) => {
  if (gaRef && gaMod && getConsent()?.analytics) { try { gaMod.logEvent(gaRef, name, params); } catch { /* sense analítica */ } }
};

function closeConsent() {
  document.getElementById("consent")?.remove();
  document.body.classList.remove("consent-open");
}

function openConsent(settings = false) {
  if (!ANALYTICS_AVAILABLE) return;
  closeConsent();
  const cur = getConsent();
  const el = document.createElement("div");
  el.id = "consent";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Preferències de galetes");
  el.innerHTML = `
    <div class="cs-body">
      <b>Galetes</b>
      <p>Aquest lloc web utilitza emmagatzematge tècnic necessari per al seu funcionament i, amb el consentiment previ de la persona usuària, galetes d'analítica de Google Analytics per elaborar estadístiques d'ús. No s'utilitzen galetes publicitàries. Més informació a la <a href="#legal/cookies">Política de galetes</a>.</p>
      <div class="cs-settings" ${settings ? "" : "hidden"}>
        <label class="cs-row"><span><b>Tècniques</b><small>Necessàries per al funcionament del lloc web. No es poden desactivar.</small></span><input type="checkbox" checked disabled></label>
        <label class="cs-row"><span><b>Analítica</b><small>Estadístiques d'ús agregades (Google Analytics).</small></span><input type="checkbox" id="cs-an" ${cur?.analytics ? "checked" : ""}></label>
      </div>
    </div>
    <div class="cs-actions">
      <button class="btn" data-cs="reject">Rebutjar</button>
      <button class="btn ghost" data-cs="settings" ${settings ? "hidden" : ""}>Configurar</button>
      <button class="btn ghost" data-cs="save" ${settings ? "" : "hidden"}>Desar la selecció</button>
      <button class="btn primary" data-cs="accept">Acceptar</button>
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

if (ANALYTICS_AVAILABLE) {
  const c = getConsent();
  if (!c) setTimeout(() => openConsent(false), 600);
  else if (c.analytics) enableAnalytics();
  else clearGaCookies();
}
