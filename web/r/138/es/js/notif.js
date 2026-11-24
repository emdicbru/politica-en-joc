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
    window.Stats?.step?.("notif", "demana");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { window.Stats?.step?.("notif", "no"); toast("Sin permiso no te podemos enviar avisos"); return renderNotif(); }
    window.Stats?.step?.("notif", "si");
    const id = await window.Online.pushSubscribe(topics);
    store.set(NOTIF_KEY, { ...store.get(NOTIF_KEY, {}), id, topics });
    Sfx.play("unlock");
    window.Stats?.add("notif");
    toast("Notificaciones activadas 🔔");
  } catch (e) {
    console.warn(e);
    toast(e?.message === "no-support" ? "Este navegador no admite notificaciones" : "No se han podido activar las notificaciones");
  }
  renderNotif();
}
async function notifDisable() {
  const st = store.get(NOTIF_KEY, {});
  await window.Online?.pushUnsubscribe?.(st.id);
  store.set(NOTIF_KEY, { no: 1 });
  toast("Notificaciones desactivadas");
  renderNotif();
}
// Targeta de Perfil
function notifCardHtml() {
  const s = notifState(), st = store.get(NOTIF_KEY, {});
  const head = `<span class="notif-i" aria-hidden="true">🔔</span><div><b>Notificaciones</b>`;
  if (s === "unsupported") return "";
  if (s === "ios-install") return `<div class="card notif-card">${head}<p>En el iPhone, los avisos funcionan con la app instalada. Instálala (Compartir → Añadir a pantalla de inicio) y actívalos desde aquí.</p></div></div>`;
  if (s === "noconfig") return `<div class="card notif-card">${head}<p>Muy pronto podrás recibir el reto diario y los avisos importantes.</p></div></div>`;
  if (s === "denied") return `<div class="card notif-card">${head}<p>Las tienes bloqueadas. Para activarlas, permite las notificaciones de esta web en la configuración del navegador o del móvil.</p></div></div>`;
  if (s === "off") return `<div class="card notif-card">${head}<p>Recibe el reto diario cada mañana y los avisos importantes (la Liga de pronósticos, la noche electoral…).</p></div><button class="btn primary" type="button" data-notif-on>Actívalas</button></div>`;
  return `<div class="card notif-card on">${head}<p>Activadas en este dispositivo: recibes el reto diario y los avisos importantes.</p>
    <button class="linklike" type="button" data-notif-off>Desactívalas</button></div></div>`;
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
  return `<div class="notif-note" data-notif-note><span aria-hidden="true">🔔</span><p>¿Quieres que te avisemos cada mañana del reto nuevo y de las novedades?</p><button class="btn primary" type="button" data-notif-on>Sí, avísame</button></div>`;
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
  const box = h(`<div class="onb notif-ask" role="dialog" aria-modal="true" aria-label="Activa las notificaciones"><div class="card notif-ask-card">
    <span class="notif-ask-i" aria-hidden="true">🔔</span>
    <h3>Activa las notificaciones</h3>
    <p>Cada mañana te diremos cuándo hay reto nuevo, y te avisaremos de las novedades importantes: la Liga de pronósticos, la noche electoral…</p>
    <button class="btn primary lg" type="button" data-notif-on>Actívalas</button>
    <button class="linklike" type="button" data-notif-later>Ahora no</button>
  </div></div>`);
  document.body.appendChild(box);
  $("[data-notif-later]", box).addEventListener("click", () => { store.set(NOTIF_KEY, { ...store.get(NOTIF_KEY, {}), later: today }); box.remove(); });
}
setTimeout(notifAsk, 1500);
