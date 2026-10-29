// Notificacions push: qui les activa rep el repte diari de cada matí i els avisos importants.
// En obrir l'app instal·lada per primer cop surt una finestra per activar-les (el sistema només deixa demanar el
// permís quan es toca un botó). A l'iPhone només funcionen amb l'app instal·lada (iOS 16.4+).
// El token del dispositiu es desa a Firestore (push/) i els enviaments els fa GitHub Actions (tools/push.js).

const NOTIF_KEY = "r29n-push"; // { id, topics, no }
const NOTIF_ALL = ["diari", "avisos"];

function notifSupported() { return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window; }
function notifState() {
  const st = store.get(NOTIF_KEY, {});
  if (typeof isIOS === "function" && isIOS() && !isStandalone()) return "ios-install";
  if (!notifSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (!window.Online?.pushReady?.()) return "noconfig";
  return st.id && Notification.permission === "granted" ? "on" : "off";
}

async function notifEnable(topics = NOTIF_ALL) {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { toast("Sense permís no et podem enviar avisos"); return renderNotif(); }
    const id = await window.Online.pushSubscribe(topics);
    store.set(NOTIF_KEY, { ...store.get(NOTIF_KEY, {}), id, topics });
    Sfx.play("unlock");
    window.Stats?.add("notif");
    toast("Notificacions activades 🔔");
  } catch (e) {
    console.warn(e);
    toast(e?.message === "no-support" ? "Aquest navegador no admet notificacions" : "No s'han pogut activar les notificacions");
  }
  renderNotif();
}
async function notifDisable() {
  const st = store.get(NOTIF_KEY, {});
  await window.Online?.pushUnsubscribe?.(st.id);
  store.set(NOTIF_KEY, { no: 1 });
  toast("Notificacions desactivades");
  renderNotif();
}
// Targeta de Perfil
function notifCardHtml() {
  const s = notifState(), st = store.get(NOTIF_KEY, {});
  const head = `<span class="notif-i" aria-hidden="true">🔔</span><div><b>Notificacions</b>`;
  if (s === "unsupported") return "";
  if (s === "ios-install") return `<div class="card notif-card">${head}<p>A l'iPhone, els avisos funcionen amb l'app instal·lada. Instal·la-la (Comparteix → Afegeix a la pantalla d'inici) i activa'ls des d'aquí.</p></div></div>`;
  if (s === "noconfig") return `<div class="card notif-card">${head}<p>Molt aviat podràs rebre el repte diari i els avisos importants.</p></div></div>`;
  if (s === "denied") return `<div class="card notif-card">${head}<p>Les tens bloquejades. Per activar-les, permet les notificacions d'aquesta web a la configuració del navegador o del mòbil.</p></div></div>`;
  if (s === "off") return `<div class="card notif-card">${head}<p>Rep el repte diari cada matí i els avisos importants (la Lliga de pronòstics, la nit electoral…).</p></div><button class="btn primary" type="button" data-notif-on>Activa-les</button></div>`;
  return `<div class="card notif-card on">${head}<p>Activades en aquest dispositiu: reps el repte diari i els avisos importants.</p>
    <button class="linklike" type="button" data-notif-off>Desactiva-les</button></div></div>`;
}
function renderNotif() {
  const box = $("#notif-card");
  if (box) box.innerHTML = notifCardHtml();
  $$("[data-notif-note]").forEach((n) => { if (notifState() !== "off") n.remove(); });
}
// Proposta discreta al resultat del repte diari (un sol cop, si encara no les té)
function notifResultNote(game) {
  if (game?.id !== "diari" || notifState() !== "off" || store.get(NOTIF_KEY, {}).no || store.get(NOTIF_KEY, {}).asked) return "";
  store.set(NOTIF_KEY, { ...store.get(NOTIF_KEY, {}), asked: 1 });
  return `<div class="notif-note" data-notif-note><span aria-hidden="true">🔔</span><p>Vols que t'avisem cada matí del repte nou i de les novetats?</p><button class="btn primary" type="button" data-notif-on>Sí, avisa'm</button></div>`;
}
document.addEventListener("click", (e) => {
  const on = e.target.closest("[data-notif-on]");
  if (on) { e.target.closest(".notif-ask")?.remove(); return notifEnable(); }
  if (e.target.closest("[data-notif-off]")) return notifDisable();
});

// Finestra per activar-les a tothom que les pot rebre: l'app instal·lada i els navegadors amb notificacions (Chrome,
// Edge, Firefox, Safari del Mac). A l'iPhone només es poden rebre amb l'app instal·lada (notifState: "ios-install").
// Surt fins que les activi (si diu «Ara no», torna a sortir l'endemà), mai a mitja partida ni damunt d'una altra finestra.
async function notifAsk() {
  if (!notifSupported() || document.querySelector(".notif-ask")) return;
  for (let i = 0; i < 40 && !window.Online?.pushReady?.(); i++) await new Promise((r) => setTimeout(r, 250));
  // Qui ja les tenia amb només un tema, passa a rebre-ho tot (sense tornar a demanar permís)
  const st = store.get(NOTIF_KEY, {});
  if (notifState() === "on" && (st.topics || []).length < NOTIF_ALL.length) {
    try { const id = await window.Online.pushSubscribe(NOTIF_ALL); store.set(NOTIF_KEY, { ...st, id, topics: NOTIF_ALL }); } catch { /* ja ho farà un altre dia */ }
  }
  if (notifState() !== "off") return;
  const today = new Date().toDateString();
  if (st.later === today) return;
  // No es posa damunt del carrusel de benvinguda ni d'una altra finestra
  for (let i = 0; i < 120 && document.querySelector(".onb"); i++) await new Promise((r) => setTimeout(r, 500));
  if (document.querySelector(".onb")) return;
  // A mitja partida no: surt quan en surti
  const playing = () => location.hash.split("/")[0] === "#joc";
  if (playing()) {
    const again = () => { if (playing()) return; window.removeEventListener("hashchange", again); notifAsk(); };
    window.addEventListener("hashchange", again);
    return;
  }
  const box = h(`<div class="onb notif-ask" role="dialog" aria-modal="true" aria-label="Activa les notificacions"><div class="card notif-ask-card">
    <span class="notif-ask-i" aria-hidden="true">🔔</span>
    <h3>Activa les notificacions</h3>
    <p>Cada matí et direm quan hi hagi repte nou, i t'avisarem de les novetats importants: la Lliga de pronòstics, la nit electoral…</p>
    <button class="btn primary lg" type="button" data-notif-on>Activa-les</button>
    <button class="linklike" type="button" data-notif-later>Ara no</button>
  </div></div>`);
  document.body.appendChild(box);
  $("[data-notif-later]", box).addEventListener("click", () => { store.set(NOTIF_KEY, { ...store.get(NOTIF_KEY, {}), later: today }); box.remove(); });
}
setTimeout(notifAsk, 1500);
