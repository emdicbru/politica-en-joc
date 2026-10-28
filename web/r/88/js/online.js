// Funcions en línia: compte de Google, progrés al núvol, rànquing i duels 1 vs 1 en temps real.
// Fa servir Firebase (Authentication + Firestore). Sense configuració a js/firebase-config.js,
// l'app continua funcionant en mode local i aquestes seccions ho expliquen.

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const cfg = window.FIREBASE_CONFIG;
const configured = !!(cfg && cfg.apiKey);
const USER_CACHE_KEY = "r29n-user";

let A = null, F = null, auth = null, db = null, ready = false, authLoading = configured, fbApp = null;

function cacheUser(u) {
  if (u) {
    store.set(USER_CACHE_KEY, {
      uid: u.uid,
      displayName: u.displayName || "Jugador",
      email: u.email || "",
      photoURL: u.photoURL || "",
    });
  } else {
    try { localStorage.removeItem(USER_CACHE_KEY); } catch { /* sense emmagatzematge */ }
  }
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DUEL_LEN = 10;
let roomUnsub = null;

const Online = {
  user: store.get(USER_CACHE_KEY, null),
  // Per a la píndola de la capçalera: la foto i el nom d'usuari (mai el nom de Google)
  chipUser: () => (Online.user ? { avatar: avatar(me(), 26), name: me().name } : null),
  accountClick() {
    if (this.user) { location.hash = "#perfil"; return; }
    if (authLoading) return toast("Connectant amb el servidor…");
    if (!ready) return toast(configured ? "No s'ha pogut connectar amb el servidor" : "Els comptes s'activaran aviat");
    signIn();
  },
  renderAccountBox,
  renderDuel,
  // Configuració pública (especial del 29N): es llegeix sense sessió; només els admins la poden escriure
  async getConfig(id) {
    if (!ready) return null;
    try { const s = await F.getDoc(F.doc(db, "config", id)); return s.exists() ? s.data() : null; } catch (e) { console.warn(e); return null; }
  },
  // Escolta en directe: cada canvi de la Sala de control arriba a tothom sense recarregar (1 lectura per canvi)
  watchConfig(id, cb) {
    if (!ready) return null;
    try { return F.onSnapshot(F.doc(db, 'config', id), (s) => cb(s.exists() ? s.data() : null), (e) => console.warn(e)); } catch (e) { console.warn(e); return null; }
  },
  // Notificacions push (notif.js): Web Push estàndard amb claus VAPID pròpies. La subscripció del dispositiu
  // (adreça i claus públiques) es desa a push/{sha256(adreça)} amb els temes triats. Els envia GitHub Actions
  // (tools/push.js) amb la clau privada, que només és allà; la web mai no la té.
  pushReady: () => ready && !!cfg?.vapidKey,
  async pushSubscribe(topics) {
    if (!ready || !cfg?.vapidKey) throw new Error("no-config");
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) throw new Error("no-support");
    const raw = atob(cfg.vapidKey.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (cfg.vapidKey.length % 4)) % 4));
    const key = Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
    const j = sub.toJSON();
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(j.endpoint)))].map((x) => x.toString(16).padStart(2, "0")).join("");
    await F.setDoc(F.doc(db, "push", hash), { sub: { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } }, topics, t: Date.now(), ua: /iphone|ipad/i.test(navigator.userAgent) ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "web" });
    return hash;
  },
  async pushUnsubscribe(id) {
    if (!ready) return;
    if (id) { try { await F.deleteDoc(F.doc(db, "push", id)); } catch (e) { console.warn(e); } }
    try { const reg = await navigator.serviceWorker.ready; await (await reg.pushManager.getSubscription())?.unsubscribe(); } catch { /* ja no hi era */ }
  },
  // Centre de control: cua d'enviaments (pushes/), historial i nombre de dispositius
  async pushQueue(msg) {
    try { const r = await F.addDoc(F.collection(db, "pushes"), { ...msg, status: "pending", created: Date.now(), by: Online.user?.email || "" }); return r.id; } catch (e) { console.warn(e); toast("No s'ha pogut posar a la cua (permisos?)"); return null; }
  },
  async pushHistory(n = 12) {
    try { const s = await F.getDocs(F.query(F.collection(db, "pushes"), F.orderBy("created", "desc"), F.limit(n))); return s.docs.map((d) => ({ id: d.id, ...d.data() })); } catch (e) { console.warn(e); return []; }
  },
  async pushCount(topic) {
    try {
      const q = topic ? F.query(F.collection(db, "push"), F.where("topics", "array-contains", topic)) : F.collection(db, "push");
      return (await F.getCountFromServer(q)).data().count;
    } catch (e) { console.warn(e); return null; }
  },
  // Lliga de pronòstics del 29N (pronostics.js): pron/{uid}
  async pronGet() {
    if (!ready || !Online.user) return null;
    try { const s = await F.getDoc(F.doc(db, 'pron', Online.user.uid)); return s.exists() ? s.data() : null; } catch (e) { console.warn(e); return null; }
  },
  async pronSave(bets) {
    if (!ready || !Online.user) return false;
    const m = me();
    try { await F.setDoc(F.doc(db, 'pron', m.uid), { uid: m.uid, name: m.name, photo: m.photo || '', t: F.serverTimestamp(), ...bets }); return true; } catch (e) { console.warn(e); toast("No s'ha pogut desar (potser ja està tancat)"); return false; }
  },
  async pronLeagues() { return ready && Online.user ? myLeagues() : []; },
  async pronMembers(uids) {
    const out = [];
    for (let i = 0; i < uids.length; i += 30) {
      try { const s = await F.getDocs(F.query(F.collection(db, 'pron'), F.where('uid', 'in', uids.slice(i, i + 30)))); out.push(...s.docs.map((d) => d.data())); } catch (e) { console.warn(e); }
    }
    return out;
  },
  async pronAll() {
    try { const s = await F.getDocs(F.collection(db, 'pron')); return s.docs.map((d) => d.data()); } catch (e) { console.warn(e); toast("No s'han pogut llegir els pronòstics"); return null; }
  },
  async pronPayout(uid, data) {
    try { await F.updateDoc(F.doc(db, 'pron', uid), data); return true; } catch (e) { console.warn(e); return false; }
  },
  // Radiografia d'ús (stats.js): suma comptadors anònims a stats/{dia}_{n}
  async statsSend(id, data) {
    if (!ready) return false;
    const inc = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? F.increment(v) : inc(v)]));
    try { await F.setDoc(F.doc(db, "stats", id), inc(data), { merge: true }); return true; } catch (e) { console.warn(e); return false; }
  },
  async statsRange(from, to) {
    if (!ready) return null;
    try {
      const q = F.query(F.collection(db, "stats"), F.where(F.documentId(), ">=", from), F.where(F.documentId(), "<=", to + "_~"));
      return (await F.getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) { console.warn(e); return null; }
  },
  async countOf(col) {
    if (!ready) return null;
    try { return (await F.getCountFromServer(F.collection(db, col))).data().count; } catch (e) { console.warn(e); return null; }
  },
  // Botiga: la foto del perfil i un avatar comprat
  myPhoto: () => (Online.user ? me().photo : ""),
  // Perfil: qui ets i on ets al rànquing d'experiència (2 consultes de recompte)
  meInfo: () => (Online.user ? { ...me(), email: Online.user.email || "", synced: ready } : null),
  async myRank() {
    if (!ready || !Online.user) return null;
    try {
      const xp = Progress.data.xp || 0;
      const [above, total] = await Promise.all([
        F.getCountFromServer(F.query(F.collection(db, "users"), F.where("xp", ">", xp))),
        F.getCountFromServer(F.collection(db, "users")),
      ]);
      return { pos: above.data().count + 1, total: total.data().count };
    } catch (e) { console.warn(e); return null; }
  },
  async setPhoto(photo) {
    if (!ready || !Online.user || !Online.profile) return;
    Online.profile = { ...Online.profile, photo };
    await pushProfile();
    renderAccountBtn();
  },
  // Avisos d'error (report.js): els envia qualsevol persona; l'equip els llegeix al Centre de control
  async reportSend(d) {
    if (!ready) return false;
    try { await F.addDoc(F.collection(db, "reports"), { ...d, uid: Online.user?.uid || null, status: "nou", t: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; }
  },
  async reportList(n = 150) {
    try { return (await F.getDocs(F.query(F.collection(db, "reports"), F.orderBy("t", "desc"), F.limit(n)))).docs.map((d) => ({ id: d.id, ...d.data(), t: d.data().t?.toMillis?.() || 0 })); } catch (e) { console.warn(e); return null; }
  },
  async reportSet(id, status) {
    try { await F.updateDoc(F.doc(db, "reports", id), { status }); return true; } catch (e) { console.warn(e); toast("No s'ha pogut desar (permisos?)"); return false; }
  },
  async reportDel(id) {
    try { await F.deleteDoc(F.doc(db, "reports", id)); return true; } catch (e) { console.warn(e); toast("No s'ha pogut esborrar (permisos?)"); return false; }
  },
  // Premsa (Centre de control, administradors): contactes (press_contacts/{correu}), notes (press_notes), fotos
  // (press_media/{nota}) i configuració (press_cfg/main). Els correus els envia GitHub Actions (tools/premsa.js).
  async pressList(col) {
    try { return (await F.getDocs(F.collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })); } catch (e) { console.warn(e); return null; }
  },
  async pressGet(col, id) {
    try { const s = await F.getDoc(F.doc(db, col, id)); return s.exists() ? { id: s.id, ...s.data() } : null; } catch (e) { console.warn(e); return null; }
  },
  async pressSet(col, id, data) {
    try {
      if (id) { await F.setDoc(F.doc(db, col, id), data, { merge: true }); return id; }
      return (await F.addDoc(F.collection(db, col), data)).id;
    } catch (e) { console.warn(e); toast("No s'ha pogut desar (permisos?)"); return null; }
  },
  async pressDel(col, id) {
    try { await F.deleteDoc(F.doc(db, col, id)); return true; } catch (e) { console.warn(e); toast("No s'ha pogut esborrar (permisos?)"); return false; }
  },
  async pressImport(list) {
    try {
      for (let i = 0; i < list.length; i += 400) {
        const b = F.writeBatch(db);
        list.slice(i, i + 400).forEach(({ id, ...data }) => b.set(F.doc(db, "press_contacts", id), data, { merge: true }));
        await b.commit();
      }
      return true;
    } catch (e) { console.warn(e); toast("No s'ha pogut importar (permisos?)"); return false; }
  },
  async pressSends(id) {
    try { return (await F.getDocs(F.collection(db, "press_notes", id, "sends"))).docs.map((d) => ({ id: d.id, ...d.data() })); } catch (e) { console.warn(e); return null; }
  },
  // Baixa de la llista de premsa: qualsevol persona amb l'enllaç del correu (sense sessió)
  async pressUnsub(tok) {
    if (!ready) return false;
    try { await F.setDoc(F.doc(db, "press_unsub", tok), { t: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; }
  },
  // Equip del Centre de control (staff/{correu}: { role, t, by }). Només el propietari el pot canviar.
  // null: encara no es pot saber (sessió de Google no restaurada o error); "": no és de l'equip
  async staffRole() {
    if (!ready || !Online.user?.email || !auth?.currentUser) return null;
    try { const s = await F.getDoc(F.doc(db, "staff", auth.currentUser.email.toLowerCase())); return s.exists() ? s.data().role || "" : ""; } catch (e) { console.warn(e); return null; }
  },
  async staffList() {
    try { return (await F.getDocs(F.collection(db, "staff"))).docs.map((d) => ({ email: d.id, ...d.data() })); } catch (e) { console.warn(e); return null; }
  },
  async staffSet(email, role) {
    try { await F.setDoc(F.doc(db, "staff", email.toLowerCase()), { role, t: Date.now(), by: Online.user?.email || "" }); return true; } catch (e) { console.warn(e); toast("No s'ha pogut desar (permisos?)"); return false; }
  },
  async staffRemove(email) {
    try { await F.deleteDoc(F.doc(db, "staff", email.toLowerCase())); return true; } catch (e) { console.warn(e); toast("No s'ha pogut treure (permisos?)"); return false; }
  },
  async setConfig(id, data) {
    if (!ready || !Online.user) { toast("Cal entrar amb el compte"); return false; }
    try { await F.setDoc(F.doc(db, "config", id), data); return true; } catch (e) { console.warn(e); toast("No s'ha pogut desar (permisos?)"); return false; }
  },
};
window.Online = Online;

// ---------- Utilitats ----------
// Com et veuen els altres: el nom d'usuari i la foto del perfil (o, si encara no n'hi ha, la de Google).
// El nom del compte de Google (nom i cognoms) no es publica mai: fins que no tria l'usuari, surt com a «Jugador».
const me = () => ({ uid: Online.user.uid, name: Online.profile?.handle || "Jugador", photo: Online.profile ? Online.profile.photo : (Online.user.photoURL || ""), frame: typeof Coins !== "undefined" ? Coins.eq("fr") : null, title: typeof Coins !== "undefined" ? Coins.eq("ti") : null });
const firstName = (n) => (n || "Rival").split(" ")[0];
const fresh = () => ({ i: 0, score: 0, hits: 0, done: false, picks: [], res: [], msgs: [], emote: null });
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const avFr = (p) => (p?.frame && /^fr-[a-z]+$/.test(p.frame) ? ` fr-${p.frame.slice(3)}` : "");
const avatar = (p, size = 40) => p?.photo
  ? `<img class="avatar${avFr(p)}" src="${esc(p.photo)}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer">`
  : `<span class="avatar ph${avFr(p)}" style="width:${size}px;height:${size}px">${esc((p?.name || "?")[0])}</span>`;
const duelLink = (code) => `${location.origin}${location.pathname}#duel/${code}`;
const currentView = () => location.hash.slice(1).split("/")[0] || "jocs";
function refreshView() {
  if (["perfil", "duel", "jocs", "ranking", "inici", "joc", "control", "pronostics"].includes(currentView())) route();
}
async function safe(fn, msg = "Hi ha hagut un problema de connexió") {
  try { return await fn(); } catch (e) { console.warn(e); toast(msg); return null; }
}


// ---------- Perfil propi: nom d'usuari i foto ----------
// users/{uid}: handle (nom d'usuari públic) i photo (la de Google, un avatar o una foto pujada i reduïda a 128 px).
// usernames/{clau}: { uid, handle } reserva el nom d'usuari perquè sigui únic.
Online.profile = null;
const HANDLE_RE = /^[\p{L}\p{N}_.]{3,20}$/u;
const handleKey = (h) => String(h).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_.]/g, "");

// Avatars il·lustrats per a qui no vol posar cap foto
const AVATAR_ART = [
  ["#ff4b2b", `<rect x="24" y="44" width="52" height="34" rx="6" fill="#fffaf0"/><path d="M38 22h24v26H38z" fill="#ffcf3d" stroke="#17173d" stroke-width="4"/><path d="M42 36l6 6 10-12" stroke="#17173d" stroke-width="5" fill="none"/>`],
  ["#3554ff", `<path d="M22 46l40-18v44L22 54z" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><path d="M62 38a10 10 0 010 24" stroke="#fffaf0" stroke-width="5" fill="none"/>`],
  ["#ffcf3d", `<path d="M50 18l9 20 22 2-17 15 5 22-19-11-19 11 5-22-17-15 22-2z" fill="#ff4b2b" stroke="#17173d" stroke-width="4"/>`],
  ["#0f9d58", `<path d="M20 70a30 30 0 0160 0" fill="none" stroke="#fffaf0" stroke-width="9"/><path d="M33 70a17 17 0 0134 0" fill="none" stroke="#ffcf3d" stroke-width="9"/>`],
  ["#7b3fe4", `<path d="M26 26h40a8 8 0 018 8v42H34a8 8 0 01-8-8z" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><path d="M36 42h28M36 54h22" stroke="#17173d" stroke-width="5"/>`],
  ["#17173d", `<circle cx="50" cy="44" r="20" fill="#ffcf3d"/><path d="M38 60l-6 22 18-8 18 8-6-22" fill="#ff4b2b"/>`],
  ["#e0306f", `<path d="M30 32h40v14a20 20 0 01-40 0z" fill="#ffcf3d" stroke="#17173d" stroke-width="4"/><path d="M50 66v12M38 80h24" stroke="#17173d" stroke-width="5"/>`],
  ["#00a37a", `<circle cx="38" cy="44" r="12" fill="#fffaf0"/><circle cx="62" cy="44" r="12" fill="#ffcf3d"/><path d="M20 80a18 18 0 0136 0M44 80a18 18 0 0136 0" fill="none" stroke="#fffaf0" stroke-width="6"/>`],
];
const avatarPreset = (k) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${AVATAR_ART[k][0]}"/>${AVATAR_ART[k][1]}</svg>`)}`;

// Redueix una foto pujada a 128 × 128 px (retall quadrat central) i la torna en JPEG
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("tipus"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 128, side = Math.min(img.width, img.height);
      const cv = document.createElement("canvas");
      cv.width = S; cv.height = S;
      cv.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imatge")); };
    img.src = url;
  });
}

// Exemple neutre: no parteix mai del nom real de la persona
const suggestHandle = () => `votant${Math.floor(100 + Math.random() * 900)}`;

let profileModal = null;
function openProfileEditor(first = false) {
  if (!Online.user || profileModal) return;
  const cur = Online.profile || {};
  const google = Online.user.photoURL || "";
  let photo = cur.photo ?? google;
  const el = h(`<div class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-title">
    <div class="card pf-card">
      <p class="kicker">${first ? "Ja gairebé hi ets" : "El teu perfil"}</p>
      <h3 id="pf-title">${first ? "Crea el teu usuari" : "Edita el perfil"}</h3>
      <div class="pf-top"><img class="pf-preview" alt="La teva foto de perfil" referrerpolicy="no-referrer"><div class="pf-name">
        <label class="sim-field"><span>Nom d'usuari</span><input data-handle maxlength="20" autocomplete="off" spellcheck="false" value="${esc(cur.handle || "")}" placeholder="p. ex. ${suggestHandle()}"></label>
        <small>De 3 a 20 caràcters: lletres, números, punt i guió baix. És l'únic nom que veuran els altres (rànquings, duels i lligues): el teu nom real no surt enlloc.</small>
      </div></div>
      <p class="pf-label">Foto de perfil</p>
      <div class="pf-photos">
        ${google ? `<button type="button" class="pf-ph" data-ph="google" aria-label="La foto del compte de Google"><img src="${esc(google)}" alt="" referrerpolicy="no-referrer"></button>` : ""}
        ${AVATAR_ART.map((_, k) => `<button type="button" class="pf-ph" data-ph="${k}" aria-label="Avatar ${k + 1}"><img src="${avatarPreset(k)}" alt=""></button>`).join("")}
        ${typeof SHOP !== "undefined" ? SHOP.filter((x) => x.cat === "av" && Coins.owns(x.id)).map((x) => `<button type="button" class="pf-ph" data-ph="s:${x.id}" aria-label="${esc(x.name)}"><img src="${x.art}" alt=""></button>`).join("") : ""}
        ${first ? "" : `<a class="pf-ph pf-shop" href="#botiga" title="Més avatars a la botiga"><span>🪙</span><small>Botiga</small></a>`}
        <label class="pf-ph pf-up" title="Puja una foto"><input type="file" accept="image/*" data-up hidden><span>＋</span><small>Puja-la</small></label>
      </div>
      <p class="pf-err" data-err role="alert"></p>
      <div class="row">${first ? "" : `<button class="btn ghost" data-cancel>Cancel·la</button>`}<button class="btn primary lg" data-save>${first ? "Comença a jugar" : "Desa el perfil"}</button></div>
      <p class="muted pf-note">La foto que pugis es redueix al teu dispositiu abans de desar-la. Pots canviar el nom i la foto quan vulguis des del Perfil.</p>
    </div>
  </div>`);
  document.body.appendChild(el);
  profileModal = el;
  const prev = $(".pf-preview", el), err = $("[data-err]", el), input = $("[data-handle]", el);
  const phUrl = (k) => (k === "google" ? google : k.startsWith("s:") ? shopAvatarUrl(k.slice(2)) : avatarPreset(Number(k)));
  const sync = () => {
    prev.src = photo || avatarPreset(0);
    $$(".pf-ph[data-ph]", el).forEach((b) => b.classList.toggle("on", phUrl(b.dataset.ph) === photo));
    $(".pf-up", el).classList.toggle("on", !!photo && photo.startsWith("data:image/jpeg"));
  };
  sync();
  input.focus();
  $$(".pf-ph[data-ph]", el).forEach((b) => b.addEventListener("click", () => { photo = phUrl(b.dataset.ph); Sfx.play("pick"); sync(); }));
  $(".pf-shop", el)?.addEventListener("click", () => closeProfileEditor());
  $("[data-up]", el).addEventListener("change", async (e) => {
    try { photo = await shrinkPhoto(e.target.files[0]); err.textContent = ""; sync(); }
    catch { err.textContent = "No s'ha pogut llegir la imatge. Prova'n una altra."; }
  });
  input.addEventListener("input", () => { err.textContent = ""; });
  $("[data-cancel]", el)?.addEventListener("click", closeProfileEditor);
  $("[data-save]", el).addEventListener("click", async () => {
    const handle = input.value.trim();
    const key = handleKey(handle);
    if (!HANDLE_RE.test(handle) || key.length < 3) { err.textContent = "El nom ha de tenir de 3 a 20 caràcters: lletres, números, punt i guió baix."; return input.focus(); }
    if (typeof simBadWord === "function" && simBadWord(handle)) { err.textContent = "Tria un nom sense paraules ofensives."; return input.focus(); }
    const btn = $("[data-save]", el);
    btn.disabled = true;
    const ok = await saveProfile(handle, key, photo);
    btn.disabled = false;
    if (ok === "taken") { err.textContent = "Aquest nom d'usuari ja és d'algú altre. Prova'n un altre."; return input.focus(); }
    if (!ok) { err.textContent = "No s'ha pogut desar. Comprova la connexió i torna-ho a provar."; return; }
    closeProfileEditor();
    // El repte d'avui fet abans de tenir usuari es publica ara, ja amb el nom d'usuari
    if (first) { const today = dailyResult(todayKey()); if (today) Online.submitDaily(todayKey(), today); }
    Sfx.play("win");
    toast(first ? `Benvingut/da, ${handle}!` : "Perfil desat");
    renderAccountBtn();
    refreshView();
  });
}
function closeProfileEditor() { profileModal?.remove(); profileModal = null; }

async function saveProfile(handle, key, photo) {
  const uid = Online.user.uid;
  const oldKey = Online.profile?.handle ? handleKey(Online.profile.handle) : null;
  if (key !== oldKey) {
    const ref = F.doc(db, "usernames", key);
    const snap = await safe(() => F.getDoc(ref), "No s'ha pogut comprovar el nom d'usuari");
    if (!snap) return false;
    if (snap.exists() && snap.data().uid !== uid) return "taken";
    const ok = await safe(() => F.setDoc(ref, { uid, handle }), "No s'ha pogut reservar el nom d'usuari");
    if (ok === null) return false;
    if (oldKey) await F.deleteDoc(F.doc(db, "usernames", oldKey)).catch(() => {});
  }
  await cleanUsernames(uid, key);
  Online.profile = { handle, photo: photo || "" };
  await pushProfile();
  return true;
}
Online.editProfile = () => openProfileEditor(false);

// ---------- Convidats: es pot jugar sense usuari, però només al principi ----------
const GUEST_FREE = 3;
const guestPlays = () => Object.values(Progress.data.plays || {}).reduce((a, b) => a + b, 0);
Online.isGuest = () => ready && !authLoading && !Online.user;
Online.guestLeft = () => Math.max(0, GUEST_FREE - guestPlays());
// Abans d'obrir un joc: si ja s'han gastat les partides de prova, cal crear l'usuari
Online.gate = () => Online.isGuest() && guestPlays() >= GUEST_FREE;
Online.signIn = signIn;

// Per què val la pena crear-se l'usuari
const PITCH = [
  ["☁", "El teu progrés, a tot arreu", "Nivell, XP, rècords i assoliments desats per sempre, al mòbil i a l'ordinador."],
  ["🏆", "Rànquing i lligues", "Compara el teu temps del repte diari amb tothom i crea lligues amb la colla."],
  ["⚔", "Duels 1 vs 1", "Repta els teus amics a duels de preguntes o de campanya, amb xat i revenja."],
  ["🪪", "El teu perfil", "Tria un nom d'usuari i una foto: és com et veuran als rànquings i als duels."],
];
Online.pitchHtml = (title = "Crea el teu usuari en 10 segons", sub = "") => `<div class="pitch">
  <p class="kicker">Gratis · amb el teu compte de Google</p>
  <h3>${title}</h3>
  ${sub ? `<p class="pitch-sub">${sub}</p>` : ""}
  <ul class="pitch-list">${PITCH.map(([i, t, d]) => `<li><span aria-hidden="true">${i}</span><div><b>${t}</b><small>${d}</small></div></li>`).join("")}</ul>
  <button class="btn google-btn lg" data-signin-cta>${googleIcon()} Continua amb Google</button>
  <p class="pitch-fine">Només fem servir el compte de Google per identificar-te: no publiquem res en nom teu.</p>
  ${legalNote()}
</div>`;
Online.gateHtml = () => `<div class="card gate">${Online.pitchHtml("Has gastat les partides de prova", `Ja has jugat ${GUEST_FREE} partides sense usuari. Crea't l'usuari amb Google per continuar jugant: només és un clic.`)}
  <a class="btn ghost" href="#inici">Torna a l'inici</a></div>`;
// Recordatori suau després de cada partida, mentre encara en queden de prova
Online.guestNote = () => {
  if (!Online.isGuest()) return "";
  const left = Online.guestLeft();
  return `<div class="guest-note"><div><b>${left ? `Et ${left === 1 ? "queda 1 partida" : `queden ${left} partides`} sense usuari` : "Has gastat les partides de prova"}</b><small>Crea't l'usuari per desar el progrés i sortir al rànquing.</small></div><button class="btn google-btn" data-signin-cta>${googleIcon()} Crea l'usuari</button></div>`;
};
document.addEventListener("click", (e) => {
  if (!e.target.closest?.("[data-signin-cta]")) return;
  e.preventDefault();
  if (!ready) return toast(configured ? "No s'ha pogut connectar amb el servidor" : "Els comptes s'activaran aviat");
  signIn();
});

// ---------- Sessió ----------
async function signIn() {
  const provider = new A.GoogleAuthProvider();
  try {
    await A.signInWithPopup(auth, provider);
  } catch (e) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) {
      return A.signInWithRedirect(auth, provider);
    }
    if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(e.code)) toast("No s'ha pogut iniciar la sessió");
  }
}

async function signOutNow() {
  closeRoom();
  Progress.onSave = null;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
    await pushProfile();
  }
  cacheUser(null);
  synced = false;
  Online.user = null;
  Online.profile = null;
  renderAccountBtn();
  refreshView();
  if (auth && A) await A.signOut(auth).catch(() => {});
  toast("Sessió tancada. El progrés es queda en aquest dispositiu.");
}

// Capçalera: amb sessió, el compte és la píndola de nivell (renderLevel, core.js) i «Entra» desapareix
function renderAccountBtn() {
  const b = $("#account-btn");
  if (!b) return;
  b.hidden = !!Online.user;
  if (!Online.user) {
    b.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg><span>Entra</span>`;
    b.title = "Inicia sessió amb Google";
  }
  if (typeof renderLevel === "function") renderLevel();
}

// ---------- Progrés al núvol ----------
function mergeProgress(local, cloud) {
  const maxMap = (a = {}, b = {}) => {
    const o = { ...a };
    for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] ?? -Infinity, v);
    return o;
  };
  const ld = local.daily || {}, cd = cloud.daily || {};
  const last = (cd.last || "") >= (ld.last || "") ? (cd.last || null) : (ld.last || null);
  const streak = (cd.last || "") === (ld.last || "")
    ? Math.max(ld.streak || 0, cd.streak || 0)
    : ((cd.last || "") > (ld.last || "") ? (cd.streak || 0) : (ld.streak || 0));
  return {
    xp: Math.max(local.xp || 0, cloud.xp || 0),
    best: maxMap(local.best, cloud.best),
    plays: maxMap(local.plays, cloud.plays),
    ach: { ...(cloud.ach || {}), ...(local.ach || {}) },
    learn: maxMap(local.learn, cloud.learn),
    daily: { last, streak, scores: { ...(ld.scores || {}), ...(cd.scores || {}) }, frozen: [...new Set([...(ld.frozen || []), ...(cd.frozen || [])])].sort().slice(-60) },
    shop: mergeShop(local.shop, cloud.shop),
  };
}

// El que s'ha comprat es suma; el que es porta posat i les monedes de la Lliga, el més recent
function mergeShop(a = {}, b = {}) {
  a ||= {}; b ||= {};
  const inv = { ...(b.inv || {}) };
  for (const [k, v] of Object.entries(a.inv || {})) inv[k] = Math.min(inv[k] ?? Infinity, v);
  const eqSrc = (a.eqT || 0) >= (b.eqT || 0) ? a : b;
  const betSrc = (a.betT || 0) >= (b.betT || 0) ? a : b;
  return { inv, eq: { ...(eqSrc.eq || {}) }, eqT: eqSrc.eqT || 0, bet: betSrc.bet || 0, betT: betSrc.betT || 0 };
}

let pushTimer = null;
function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; pushProfile(); }, 1500);
}
function flushPush() {
  if (!pushTimer) return;
  clearTimeout(pushTimer);
  pushTimer = null;
  pushProfile();
}
window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPush(); });
window.addEventListener("pagehide", flushPush);

// Fins que no s'ha llegit el perfil del núvol no s'hi escriu res: si la lectura falla (sense connexió en obrir l'app),
// desar-hi el progrés local esborraria el nom d'usuari i el progrés del compte.
let synced = false;
async function pushProfile() {
  if (!ready || !Online.user || !synced) return;
  const d = Progress.data;
  await safe(() => F.setDoc(F.doc(db, "users", Online.user.uid), {
    name: me().name, photo: me().photo, handle: Online.profile?.handle || null,
    xp: d.xp, level: Progress.levelIndex() + 1,
    frame: me().frame || null, title: me().title || null, shop: d.shop || {},
    best: d.best, plays: d.plays, ach: d.ach, learn: d.learn || {}, daily: d.daily,
    updatedAt: F.serverTimestamp(),
  }), "No s'ha pogut desar el progrés al núvol");
}

// Allibera les reserves de nom d'usuari del compte que no són la de debò (duplicats d'abans)
async function cleanUsernames(uid, keep) {
  const olds = await safe(() => F.getDocs(F.query(F.collection(db, "usernames"), F.where("uid", "==", uid), F.limit(20))));
  for (const d of olds?.docs || []) if (d.id !== keep) await F.deleteDoc(d.ref).catch(() => {});
}
// Llegeix el perfil del núvol (amb reintents). Torna true si s'ha pogut llegir, existeixi o no.
async function syncDown() {
  const uid = Online.user.uid;
  let snap = null;
  for (let i = 0; i < 4 && !snap; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1500 * i));
    try { snap = await F.getDoc(F.doc(db, "users", uid)); } catch (e) { console.warn(e); }
  }
  if (!snap) { toast("No s'ha pogut carregar el teu perfil. Es tornarà a provar quan hi hagi connexió."); return false; }
  const u = snap.exists() ? snap.data() : null;
  if (u?.handle) Online.profile = { handle: u.handle, photo: u.photo || "" };
  // Sense nom al perfil: si ja n'havia reservat un (una sessió anterior que va fallar), es recupera
  if (!Online.profile) {
    const mine = await safe(() => F.getDocs(F.query(F.collection(db, "usernames"), F.where("uid", "==", uid), F.limit(5))));
    const first = mine?.docs?.[0]?.data();
    if (first?.handle) Online.profile = { handle: first.handle, photo: u?.photo ?? Online.user.photoURL ?? "" };
  }
  if (u) {
    Progress.data = mergeProgress(Progress.data, u);
    store.set("r29n", Progress.data);
    renderLevel();
  }
  synced = true;
  if (Online.profile?.handle) cleanUsernames(uid, handleKey(Online.profile.handle));
  await pushProfile();
  return true;
}


// Si en entrar no s'ha pogut llegir el perfil, es torna a provar quan torni la connexió o la pestanya
function retrySync() {
  const again = async () => {
    if (synced || !Online.user || !navigator.onLine) return;
    if (await syncDown()) {
      window.removeEventListener("online", again); document.removeEventListener("visibilitychange", again);
      renderAccountBtn(); refreshView();
      if (!Online.profile) openProfileEditor(true);
    }
  };
  window.addEventListener("online", again);
  document.addEventListener("visibilitychange", again);
  setTimeout(again, 8000);
}

// ---------- Perfil: compte i rànquing ----------
function renderAccountBox() {
  const box = $("#account-box");
  if (!box) return;
  const u = Online.user;
  if (u) {
    box.innerHTML = `<div class="card account-card in">
      ${avatar(me(), 56)}
      <div class="ac-body"><b>${esc(me().name)}</b>${typeof shopTitle === "function" && shopTitle(me().title) ? `<span class="shop-ti sm">${esc(shopTitle(me().title))}</span>` : ""}<p>${esc(u.email || "")}${u.email ? " · " : ""}<span class="synced">${ready ? "Progrés sincronitzat" : authLoading ? "Connectant…" : "Mode sense connexió"}</span></p></div>
      <div class="ac-btns">${ready ? `<button class="btn" data-editprof>Edita el perfil</button>` : ""}<button class="btn ghost" data-signout>Tanca la sessió</button></div>
    </div>`;
    $("[data-signout]", box).addEventListener("click", signOutNow);
    $("[data-editprof]", box)?.addEventListener("click", () => openProfileEditor(false));
    if (ready) {
      box.insertAdjacentHTML("beforeend", `<div class="account-tools">
        <p class="muted">Dades personals: es pot descarregar una còpia de les dades del compte o suprimir-lo. Més informació a la <a href="#legal/privacitat">Política de privadesa</a>.</p>
        <button class="btn ghost" data-export>Descarregar les meves dades</button>
        <button class="btn ghost danger" data-delete>Suprimir el compte</button>
      </div>`);
      $("[data-export]", box).addEventListener("click", exportMyData);
      $("[data-delete]", box).addEventListener("click", deleteMyAccount);
    }
    return;
  }
  if (authLoading) {
    box.innerHTML = `<div class="card account-card"><div class="ac-body"><p class="muted">Comprovant la sessió…</p></div></div>`;
    return;
  }
  if (!ready) {
    box.innerHTML = `<div class="card account-card off">
      <div class="ac-ico">☁</div>
      <div class="ac-body"><b>Mode local</b><p>El teu progrés es desa en aquest navegador. ${configured ? "Ara mateix no podem connectar amb el servidor." : "Aviat podràs iniciar sessió amb Google per desar-lo al núvol i jugar duels."}</p></div>
    </div>`;
    return;
  }
  box.innerHTML = `<div class="card account-card pitch-card">${Online.pitchHtml("Crea el teu usuari", Online.guestLeft() ? `Pots jugar ${Online.guestLeft() === 1 ? "1 partida més" : `${Online.guestLeft()} partides més`} sense usuari.` : "Ja has gastat les partides de prova.")}</div>`;
}

// ---------- Drets RGPD: portabilitat i supressió ----------
function dailyKeysSinceStart() {
  const keys = [];
  for (let off = 0; off <= 90; off++) {
    const k = dateKeyOffset(-off);
    keys.push(k);
    if (dailyNumber(k) <= 1) break;
  }
  return keys;
}

async function exportMyData() {
  const uid = Online.user.uid;
  const out = { exportat: new Date().toISOString(), compte: { uid, nom: Online.user.displayName, correu: Online.user.email }, progresLocal: Progress.data, simulador: { partidaDesada: store.get("r29n-sim-save", null), preferencies: store.get("r29n-sim-prefs", {}) } };
  const prof = await safe(() => F.getDoc(F.doc(db, "users", uid)));
  out.perfil = prof?.exists() ? prof.data() : null;
  out.repteDiari = [];
  for (const k of dailyKeysSinceStart()) {
    const s = await safe(() => F.getDoc(F.doc(db, "dailies", k, "entries", uid)));
    if (s?.exists()) out.repteDiari.push({ dia: k, ...s.data() });
  }
  const duels = await safe(() => F.getDocs(F.query(F.collection(db, "duels"), F.where("players", "array-contains", uid), F.limit(200))));
  out.duels = duels ? duels.docs.map((d) => d.data()) : [];
  const leagues = await safe(() => F.getDocs(F.query(F.collection(db, "leagues"), F.where("members", "array-contains", uid), F.limit(100))));
  out.lligues = leagues ? leagues.docs.map((d) => d.data()) : [];
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "politica-en-joc-les-meves-dades.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("S'ha descarregat la còpia de les dades.");
}

async function deleteMyAccount() {
  if (!confirm("Se suprimiran el compte i les dades associades: perfil, resultats del repte diari, duels i pertinença a lligues. Aquesta acció no es pot desfer. El progrés desat en aquest dispositiu no es veurà afectat.\n\nVoleu continuar?")) return;
  const uid = Online.user.uid;
  closeRoom();
  Progress.onSave = null;
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  toast("S'està suprimint el compte…");
  try {
    for (const k of dailyKeysSinceStart()) {
      await F.deleteDoc(F.doc(db, "dailies", k, "entries", uid)).catch(() => {});
    }
    const duels = await F.getDocs(F.query(F.collection(db, "duels"), F.where("players", "array-contains", uid), F.limit(500)));
    for (const d of duels.docs) await F.deleteDoc(d.ref).catch(() => {});
    const leagues = await F.getDocs(F.query(F.collection(db, "leagues"), F.where("members", "array-contains", uid), F.limit(100)));
    for (const l of leagues.docs) await F.updateDoc(l.ref, { members: F.arrayRemove(uid) }).catch(() => {});
    if (Online.profile?.handle) await F.deleteDoc(F.doc(db, "usernames", handleKey(Online.profile.handle))).catch(() => {});
    await F.deleteDoc(F.doc(db, "pron", uid)).catch(() => {});
    await F.deleteDoc(F.doc(db, "users", uid));
    try {
      await A.deleteUser(auth.currentUser);
    } catch (e) {
      if (e.code !== "auth/requires-recent-login") throw e;
      await A.reauthenticateWithPopup(auth.currentUser, new A.GoogleAuthProvider());
      await A.deleteUser(auth.currentUser);
    }
  } catch (e) {
    console.warn(e);
    toast("No s'ha pogut completar la supressió. Torneu-ho a provar o escriviu a l'adreça de contacte.");
    return;
  }
  cacheUser(null);
  synced = false;
  Online.user = null;
  Online.profile = null;
  renderAccountBtn();
  refreshView();
  toast("El compte s'ha suprimit.");
}

async function renderLeaderboard(box = $("#leaderboard-box"), inTab = false) {
  if (!box || !ready || !Online.user) return;
  box.innerHTML = `${inTab ? `<p class="muted">Qui ha acumulat més experiència jugant a tots els jocs.</p>` : `<h2 class="section-title sm">Rànquing</h2>`}<div class="lb"><p class="muted">Carregant…</p></div>`;
  const snap = await safe(() => F.getDocs(F.query(F.collection(db, "users"), F.orderBy("xp", "desc"), F.limit(20))));
  if (!snap) return;
  const rows = snap.docs.map((d, i) => {
    const u = d.data();
    const lvl = LEVELS[Math.min(LEVELS.length - 1, (u.level || 1) - 1)].name;
    return `<div class="lb-row ${d.id === Online.user.uid ? "me" : ""}">
      <b class="lb-pos">${i + 1}</b>${avatar(u, 36)}
      <span class="lb-name">${esc(u.name || "Jugador")}<small>${lvl}${typeof shopTitle === "function" && shopTitle(u.title) ? ` · ${esc(shopTitle(u.title))}` : ""}</small></span>
      <strong>${fmt(u.xp || 0)} XP</strong>
    </div>`;
  }).join("");
  $(".lb", box).innerHTML = rows || `<p class="muted">Encara no hi ha ningú al rànquing.</p>`;
}

const googleIcon = () => `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

// ---------- Duels ----------
function closeRoom() {
  roomUnsub?.();
  roomUnsub = null;
}
window.addEventListener("hashchange", () => {
  if (currentView() !== "duel") closeRoom();
});

function renderDuel(code) {
  closeRoom();
  const root = $("#duel-root");
  if (authLoading) {
    root.innerHTML = `<div class="card"><p class="muted">Carregant…</p></div>`;
    return;
  }
  if (!ready) {
    root.innerHTML = `<div class="card online-off">
      <div class="gc-icon" style="--c:var(--blue)">${duelIcon()}</div>
      <h3>Els duels arriben aviat</h3>
      <p>${configured ? "Ara mateix no podem connectar amb el servidor. Torna-ho a provar més tard." : "Podràs reptar els teus amics a un duel de 10 preguntes en temps real, amb les mateixes preguntes per a tots dos."}</p>
    </div>`;
    return;
  }
  if (!Online.user) {
    if (code) sessionStorage.setItem("pendingDuel", code.toUpperCase());
    root.innerHTML = `<div class="card online-off">
      <div class="gc-icon" style="--c:var(--blue)">${duelIcon()}</div>
      <h3>${code ? "T'han reptat a un duel!" : "Repta els teus amics"}</h3>
      <p>Inicia sessió amb Google per jugar duels 1 vs 1: 10 preguntes, les mateixes per a tots dos, i veureu la puntuació de l'altre en directe.</p>
      <button class="btn google-btn lg" data-signin>${googleIcon()} Continua amb Google</button>${legalNote()}
    </div>`;
    $("[data-signin]", root).addEventListener("click", signIn);
    return;
  }
  if (code) return renderRoom(code.toUpperCase());
  renderLobby();
}

function duelIcon() {
  return icon(`<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5L18 3h3v3l-3.5 8.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>`);
}

function renderLobby() {
  const root = $("#duel-root");
  root.innerHTML = `
    <div class="duel-steps">
      <div><b>1</b><span>Crea un duel i envia l'enllaç o el codi a un amic.</span></div>
      <div><b>2</b><span>Trieu 5 parelles de preguntes: una te la quedes per a tu i l'altra l'envies al rival!</span></div>
      <div><b>3</b><span>Xateja, envia icones i segueix el marcador en directe. Guanya qui en faci més!</span></div>
    </div>
    <div class="duel-grid">
      <div class="card duel-card">
        <p class="kicker">Nou repte</p>
        <h3>Crea un duel</h3>
        <p class="muted">5 preguntes triades per tu + 5 enviades pel rival · Xat i icones en viu.</p>
        <button class="btn primary lg" data-create>Crea el duel</button>
      </div>
      <div class="card duel-card sim-duelcard">
        <p class="kicker">Simulador del 29N</p>
        <h3>Duel de campanya</h3>
        <p class="muted">El mateix partit i el mateix país per als dos. Cadascú fa la seva campanya i guanya qui tregui més escons.</p>
        <button class="btn primary lg" data-create-sim>Crea el duel de campanya</button>
      </div>
      <div class="card duel-card">
        <p class="kicker">T'han passat un codi?</p>
        <h3>Uneix-te</h3>
        <form class="join-form" data-join>
          <input type="text" maxlength="6" placeholder="CODI" autocomplete="off" spellcheck="false" aria-label="Codi del duel">
          <button class="btn lg" type="submit">Entra</button>
        </form>
      </div>
    </div>
    <h2 class="section-title sm">Els teus duels</h2>
    <div class="duel-list"><p class="muted">Carregant…</p></div>`;
  $("[data-create]", root).addEventListener("click", () => createDuel());
  $("[data-create-sim]", root).addEventListener("click", () => createDuel(null, null, "sim"));
  $("[data-join]", root).addEventListener("submit", (e) => {
    e.preventDefault();
    const c = $("input", e.target).value.trim().toUpperCase();
    if (c.length === 6) joinDuel(c);
    else toast("El codi té 6 caràcters");
  });
  loadMyDuels();
}

async function loadMyDuels() {
  const list = $(".duel-list");
  const snap = await safe(() => F.getDocs(F.query(F.collection(db, "duels"), F.where("players", "array-contains", Online.user.uid), F.limit(30))));
  if (!snap || !list) return;
  const uid = Online.user.uid;
  const duels = snap.docs.map((d) => d.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 12);
  if (!duels.length) { list.innerHTML = `<p class="muted">Encara no has jugat cap duel. Crea'n un i repta algú!</p>`; return; }
  list.innerHTML = duels.map((d) => {
    const rival = d.host?.uid === uid ? d.guest : d.host;
    const mine = d[`p_${uid}`] || fresh(), theirs = rival ? d[`p_${rival.uid}`] || fresh() : null;
    let label = "Esperant rival", cls = "wait";
    if (d.status !== "waiting") {
      if (mine.done && theirs?.done) {
        label = mine.score > theirs.score ? "Victòria" : mine.score < theirs.score ? "Derrota" : "Empat";
        cls = mine.score > theirs.score ? "win" : mine.score < theirs.score ? "lose" : "tie";
      } else { label = "En joc"; cls = "live"; }
    }
    return `<a class="duel-row" href="#duel/${d.code}">
      ${avatar(rival || { name: "?" }, 36)}
      <span class="dr-name">${rival ? esc(rival.name) : "Sense rival"}<small>Codi ${d.code}</small></span>
      ${theirs ? `<span class="dr-score">${fmt(mine.score)} – ${fmt(theirs.score)}</span>` : ""}
      <span class="dr-tag ${cls}">${label}</span>
    </a>`;
  }).join("");
}

async function createDuel(fromCode = null, prevData = null, kind = prevData?.kind || "quiz") {
  const uid = Online.user.uid;
  const code = genCode();
  const ok = await safe(() => F.setDoc(F.doc(db, "duels", code), {
    code, kind, createdAt: F.serverTimestamp(), status: "waiting",
    seed: Math.floor(Math.random() * 2 ** 31),
    players: [uid], host: me(), guest: null,
    [`p_${uid}`]: fresh(),
  }), "No s'ha pogut crear el duel");
  if (ok !== null) {
    if (fromCode && prevData) {
      patchMyDuel(F.doc(db, "duels", fromCode), uid, prevData, { rematch: code }).catch(() => {});
    }
    location.hash = `#duel/${code}`;
  }
}

async function requestRematch(code) {
  const uid = Online.user.uid;
  const snap = await safe(() => F.getDoc(F.doc(db, "duels", code)));
  const d = snap?.data();
  if (!d) return;
  const rival = d.host.uid === uid ? d.guest : d.host;
  const theirs = rival && d[`p_${rival.uid}`];
  if (theirs?.rematch) return joinDuel(theirs.rematch);
  const mine = d[`p_${uid}`]?.rematch;
  if (mine) { location.hash = `#duel/${mine}`; return; }
  createDuel(code, d);
}

async function joinDuel(code) {
  const uid = Online.user.uid;
  const ref = F.doc(db, "duels", code);
  const snap = await safe(() => F.getDoc(ref));
  if (!snap) return;
  if (!snap.exists()) return toast("No existeix cap duel amb aquest codi");
  const d = snap.data();
  if (d.players.includes(uid)) { location.hash = `#duel/${code}`; return; }
  if (d.guest) return toast("Aquest duel ja està complet");
  const ok = await safe(() => F.updateDoc(ref, { guest: me(), players: F.arrayUnion(uid), status: "playing", [`p_${uid}`]: fresh() }), "No t'has pogut unir al duel");
  if (ok !== null) {
    if (location.hash === `#duel/${code}`) renderRoom(code);
    else location.hash = `#duel/${code}`;
  }
}

// Estat propi autoritari en local: els instantànies del servidor poden arribar endarrerides
// i no han de desfer escriptures anteriors (p. ex. una tria de pregunta).
const localProg = {};
function patchMyDuel(ref, uid, dataObj, patch) {
  const field = `p_${uid}`;
  const key = ref.id + field;
  const cur = localProg[key] || (dataObj && dataObj[field]) || fresh();
  const next = { ...fresh(), ...cur, ...patch };
  localProg[key] = next;
  if (dataObj) dataObj[field] = next;
  return F.updateDoc(ref, { [field]: next });
}

// ---------- Xat i icones en viu per als duels ----------
const DUEL_EMOTES = ["😂", "🔥", "😱", "👏", "💀", "🏛️", "🤔", "⚡"];
const DUEL_QUICK_MSGS = ["Bona sort!", "Quina pregunta!", "Uf, difícil!", "Bona!", "Revenja?"];

function popEmoteBubble(player, emoji) {
  let layer = $("#duel-emote-layer");
  if (!layer) {
    layer = h(`<div id="duel-emote-layer" class="duel-emote-layer" aria-live="polite"></div>`);
    document.body.appendChild(layer);
  }
  const el = h(`<div class="duel-emote-pop">
    ${avatar(player, 34)}
    <span class="dep-name">${esc(firstName(player?.name))}</span>
    <span class="dep-ico">${esc(emoji)}</span>
  </div>`);
  layer.appendChild(el);
  const big = h(`<div class="duel-emote-big" aria-hidden="true">${esc(emoji)}</div>`);
  document.body.appendChild(big);
  setTimeout(() => big.remove(), 1900);
  Sfx.play("pick");
  setTimeout(() => el.remove(), 2600);
}

function mountDuelSocial(container, ref, uid) {
  const wrap = h(`<div class="card duel-social">
    <div class="ds-head">
      <span class="kicker">En directe amb el rival</span>
      <div class="ds-emotes" role="group" aria-label="Envia una icona">
        ${DUEL_EMOTES.map((e) => `<button type="button" class="ds-emote-btn" data-emote="${e}" title="Envia ${e}">${e}</button>`).join("")}
      </div>
    </div>
    <div class="ds-quick">
      ${DUEL_QUICK_MSGS.map((m) => `<button type="button" class="ds-chip" data-qmsg="${esc(m)}">${esc(m)}</button>`).join("")}
    </div>
    <div class="ds-msgs" aria-live="polite"><p class="muted">Envia una icona o escriu al teu rival…</p></div>
    <form class="ds-form" autocomplete="off">
      <input type="text" maxlength="120" placeholder="Escriu un missatge al rival…" aria-label="Missatge">
      <button class="btn primary" type="submit">Envia</button>
    </form>
  </div>`);
  container.appendChild(wrap);

  let latestData = null;
  const seenEmotes = {};
  let lastRivalMsgT = 0;
  let initialized = false;

  const myField = `p_${uid}`;

  async function sendEmote(emoji) {
    const t = Date.now();
    seenEmotes[uid] = t;
    popEmoteBubble(me(), emoji);
    if (!latestData) return;
    patchMyDuel(ref, uid, latestData, { emote: { e: emoji, t } }).catch(() => {});
  }

  async function sendMsg(text) {
    const clean = text.trim().slice(0, 120);
    if (!clean || !latestData) return;
    const prev = ((localProg[ref.id + myField] || latestData[myField])?.msgs || []).slice(-24);
    const nextMsgs = [...prev, { m: clean, t: Date.now() }];
    patchMyDuel(ref, uid, latestData, { msgs: nextMsgs }).catch(() => {});
  }

  $$("[data-emote]", wrap).forEach((b) => b.addEventListener("click", () => sendEmote(b.dataset.emote)));
  $$("[data-qmsg]", wrap).forEach((b) => b.addEventListener("click", () => sendMsg(b.dataset.qmsg)));
  $(".ds-form", wrap).addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("input", e.target);
    if (!inp.value.trim()) return;
    sendMsg(inp.value);
    inp.value = "";
  });

  function update(d) {
    latestData = d;
    const players = [d.host, d.guest].filter(Boolean);
    const now = Date.now();

    players.forEach((p) => {
      const em = d[`p_${p.uid}`]?.emote;
      if (!em || !em.t) return;
      if (!initialized) {
        seenEmotes[p.uid] = em.t;
      } else if (em.t > (seenEmotes[p.uid] || 0) && now - em.t < 15000) {
        seenEmotes[p.uid] = em.t;
        popEmoteBubble(p, em.e);
      }
    });

    const allMsgs = [];
    players.forEach((p) => {
      const list = d[`p_${p.uid}`]?.msgs || [];
      list.forEach((item) => {
        if (item && item.m) allMsgs.push({ ...item, user: p, isMe: p.uid === uid });
      });
    });
    allMsgs.sort((a, b) => a.t - b.t);

    const rivalMsgs = allMsgs.filter((x) => !x.isMe);
    const newestRival = rivalMsgs[rivalMsgs.length - 1];
    if (!initialized) {
      if (newestRival) lastRivalMsgT = newestRival.t;
    } else if (newestRival && newestRival.t > lastRivalMsgT) {
      lastRivalMsgT = newestRival.t;
      Sfx.play("pick");
      if (currentView() === "joc") {
        toast(`💬 ${firstName(newestRival.user.name)}: ${newestRival.m}`);
      }
    }
    initialized = true;

    const msgBox = $(".ds-msgs", wrap);
    if (!allMsgs.length) {
      msgBox.innerHTML = `<p class="muted">Envia una icona o escriu al teu rival…</p>`;
    } else {
      msgBox.innerHTML = allMsgs.slice(-30).map((x) => `
        <div class="ds-msg ${x.isMe ? "me" : "them"}">
          ${avatar(x.user, 24)}
          <div class="ds-bubble"><b>${esc(firstName(x.user.name))}</b><span>${esc(x.m)}</span></div>
        </div>`).join("");
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  }

  return { update, wrap };
}

function dotsRow(res = [], total = DUEL_LEN) {
  return `<div class="duel-mini-dots">${Array.from({ length: total }, (_, i) => {
    const v = res[i];
    return `<i class="${v === true ? "ok" : v === false ? "ko" : ""}"></i>`;
  }).join("")}</div>`;
}

function liveBarHtml(d, uid) {
  const meP = d.host.uid === uid ? d.host : d.guest || me();
  const rival = d.host.uid === uid ? d.guest : d.host;
  const side = (p, cls) => {
    const pr = (p && d[`p_${p.uid}`]) || fresh();
    const pk = (pr.picks || []).length;
    const sub = !p ? "Esperant que entri…" : pr.done ? `Acabat · ${pr.hits}/${DUEL_LEN}` : pr.i > 0 ? `Pregunta ${Math.min(pr.i + 1, DUEL_LEN)}/${DUEL_LEN}` : pk >= 5 ? "Tria feta" : `Triant (${pk}/5)`;
    return `<div class="dlb-side ${cls}">
      ${avatar(p || { name: "?" }, 38)}
      <div class="dlb-info">
        <b><span>${p ? esc(cls === "me" ? "Tu" : firstName(p.name)) : "Rival"}</span><span class="dlb-pts">${fmt(pr.score)}</span></b>
        ${dotsRow(pr.res, DUEL_LEN)}
        <small class="dlb-sub">${sub}</small>
      </div>
    </div>`;
  };
  return `${side(meP, "me")}<span class="dlb-vs">VS</span>${side(rival, "them")}`;
}

// Les 10 preguntes d'un jugador amb el resultat de cadascuna (per al resum final)
function duelRecap(d, uid) {
  const isHost = d.host.uid === uid;
  const rival = isHost ? d.guest : d.host;
  const mine = d[`p_${uid}`] || fresh(), theirs = (rival && d[`p_${rival.uid}`]) || fresh();
  if ((mine.picks || []).length < 5) return [];
  return buildPlayerRounds(d.seed, isHost, mine.picks, theirs.picks, firstName(rival?.name)).map((r, i) => ({
    ok: mine.res?.[i], q: r.recapQ, a: r.recapA, origin: r.origin,
  }));
}

function recapListHtml(items, rivalName) {
  if (!items.length) return "";
  return `<div class="duel-qlist">
    <p class="kicker">Les teves 10 preguntes</p>
    ${items.map((x, i) => `<div class="dq ${x.ok === true ? "ok" : x.ok === false ? "ko" : ""}">
      <span class="dq-n">${i + 1}</span>
      <div><b>${esc(x.q)}</b><small>${x.origin === "mine" ? "🎯 Triada per tu" : `💣 Enviada per ${esc(rivalName)}`} · Resposta: ${esc(x.a)}</small></div>
      <span class="dq-r">${x.ok === true ? "✓" : x.ok === false ? "✗" : "–"}</span>
    </div>`).join("")}
  </div>`;
}

function buildPlayerRounds(seed, isHost, myPicks, rivalPicks, rivalName) {
  const allPairs = duelPairs(seed);
  const myPairs = isHost ? allPairs.slice(0, 5) : allPairs.slice(5, 10);
  const rivalPairs = isHost ? allPairs.slice(5, 10) : allPairs.slice(0, 5);
  const rounds = [];
  for (let k = 0; k < 5; k++) {
    const mPick = myPicks?.[k] ?? 0;
    const rPick = rivalPicks?.[k] ?? 0;
    const kept = myPairs[k][mPick];
    const sent = rivalPairs[k][1 - rPick]; // La que el rival ha descartat i t'ha enviat a tu!
    rounds.push({
      ...kept,
      origin: "mine",
      label: `${kept.label} · <span class="q-origin mine">🎯 Triada per tu</span>`,
    });
    rounds.push({
      ...sent,
      origin: "rival",
      label: `${sent.label} · <span class="q-origin rival">💣 Enviada per ${esc(rivalName)}</span>`,
    });
  }
  return rounds;
}

function renderRoom(code) {
  const root = $("#duel-root");
  root.innerHTML = `<div id="duel-room-main"><div class="card"><p class="muted">Carregant el duel…</p></div></div><div id="duel-room-social"></div>`;
  const mainBox = $("#duel-room-main", root);
  const socialBox = $("#duel-room-social", root);
  const uid = Online.user.uid;
  const ref = F.doc(db, "duels", code);
  let social = null;

  roomUnsub = F.onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      mainBox.innerHTML = `<div class="card online-off"><h3>Aquest duel no existeix</h3><p>Revisa el codi o crea'n un de nou.</p><a class="btn primary" href="#duel">Torna</a></div>`;
      socialBox.innerHTML = "";
      return;
    }
    const d = snap.data();
    const isPlayer = d.players.includes(uid);
    const rival = d.host.uid === uid ? d.guest : d.host;

    // Algú ha obert l'enllaç i encara hi ha lloc
    if (!isPlayer && !d.guest) {
      mainBox.innerHTML = `<div class="card online-off invite">
        ${avatar(d.host, 72)}
        <h3>${esc(d.host.name)} et repta!</h3>
        <p>${d.kind === "sim" ? "Duel de campanya: el mateix partit i el mateix país per als dos. Guanya qui tregui més escons." : "Duel 1 vs 1 d'elecció: cadascú tria 5 preguntes per a si mateix i n'envia 5 al rival!"}</p>
        <button class="btn primary lg" data-accept>Accepta el repte</button>
      </div>`;
      $("[data-accept]", mainBox).addEventListener("click", () => joinDuel(code));
      return;
    }

    if (isPlayer && !social) {
      social = mountDuelSocial(socialBox, ref, uid);
    }
    social?.update(d);

    const prog = (p) => d[`p_${p.uid}`] || fresh();
    const myProg = isPlayer ? prog({ uid }) : null;
    const myPicksCount = (myProg?.picks || []).length;

    if (d.status === "waiting") {
      mainBox.innerHTML = `<div class="duel-live-bar card">${liveBarHtml(d, uid)}</div><div class="card waiting-room">
        <p class="kicker">Duel creat</p>
        <h3>Envia aquest codi al teu rival</h3>
        <div class="code-tiles">${[...code].map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="row center">
          <button class="btn primary" data-copy>Copia l'enllaç</button>
          ${navigator.share ? `<button class="btn" data-share>Comparteix</button>` : ""}
          ${isPlayer && myPicksCount < 5 && d.kind !== "sim" ? `<button class="btn" data-predraft>Ves triant les 5 preguntes (${myPicksCount}/5)</button>` : ""}
        </div>
        ${d.kind === "sim" ? `<p class="waiting-dots">Esperant el rival<span>.</span><span>.</span><span>.</span></p><p class="muted">Pots començar la campanya ara mateix: el duel no cal jugar-lo alhora.</p>${isPlayer ? `<div class="row center"><button class="btn primary" data-simplay>Comença la campanya</button></div>` : ""}` : myPicksCount >= 5 ? `<p class="synced">Ja has triat les teves 5 preguntes! Esperant que entri el rival…</p>` : `<p class="waiting-dots">Esperant el rival<span>.</span><span>.</span><span>.</span></p>`}
      </div>`;
      $("[data-copy]", mainBox).addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(duelLink(code)); toast("Enllaç copiat"); } catch { toast(duelLink(code)); }
      });
      $("[data-share]", mainBox)?.addEventListener("click", () => navigator.share({ title: "Política en Joc", text: "Et repto a un duel de política! Codi: " + code, url: duelLink(code) }).catch(() => {}));
      $("[data-predraft]", mainBox)?.addEventListener("click", () => startDuelGame(code, d));
      $("[data-simplay]", mainBox)?.addEventListener("click", () => simStartDuel(code, d, null));
      return;
    }

    // Marcador (en joc o acabat)
    const players = [d.host, d.guest].filter(Boolean);
    const allDone = players.length === 2 && players.every((p) => prog(p).done);
    const rivalProg = rival ? prog(rival) : null;
    let banner = "";
    if (allDone) {
      const [a, b] = players.map(prog);
      const winner = a.score === b.score ? null : a.score > b.score ? players[0] : players[1];
      banner = winner
        ? `<div class="duel-banner ${isPlayer ? (winner.uid === uid ? "win" : "lose") : ""}">${isPlayer ? (winner.uid === uid ? "Has guanyat!" : `Guanya ${esc(firstName(winner.name))}`) : `Guanya ${esc(firstName(winner.name))}`}</div>`
        : `<div class="duel-banner tie">Empat!</div>`;
    }
    const rematchCode = rivalProg?.rematch || myProg?.rematch;
    mainBox.innerHTML = `<div class="card scoreboard">
      ${banner}
      <div class="sb-players">${players.map((p, k) => {
        const pr = prog(p);
        const pk = (pr.picks || []).length;
        const statusTxt = d.kind === "sim"
          ? (pr.done ? `Acabat · ${pr.hits} ${pr.hits === 1 ? "escó" : "escons"}` : pr.i > 0 ? `Fent campanya · dia ${pr.i} de 6` : "Encara no ha començat")
          : pr.done
          ? `Acabat · ${pr.hits}/${DUEL_LEN} encerts`
          : pr.i > 0
            ? `Pregunta ${pr.i}/${DUEL_LEN} · ${pr.hits} encerts`
            : pk >= 5
              ? "5/5 preguntes triades · A punt!"
              : `Triant preguntes (${pk}/5)…`;
        return `${k === 1 ? `<span class="sb-vs">VS</span>` : ""}
        <div class="sb-player ${p.uid === uid ? "me" : ""}">
          ${avatar(p, 64)}
          <b>${esc(firstName(p.name))}${p.uid === uid ? " (tu)" : ""}</b>
          <strong>${fmt(pr.score)}</strong>
          <div class="sb-bar"><div style="width:${(pr.i / (d.kind === "sim" ? 6 : DUEL_LEN)) * 100}%"></div></div>
          ${d.kind === "sim" ? "" : dotsRow(pr.res, DUEL_LEN)}
          <small>${statusTxt}</small>
        </div>`;
      }).join("")}</div>
      ${rivalProg?.rematch ? `<div class="rematch-alert"><b>🔥 ${esc(firstName(rival.name))} et demana la revenja!</b><button class="btn primary" data-go-rematch="${esc(rivalProg.rematch)}">Accepta la revenja →</button></div>` : ""}
      <div class="row center">
        ${isPlayer && !myProg.done && d.kind === "sim" ? `<button class="btn primary lg" data-simplay>${myProg.i ? "Continua la campanya" : "Comença la campanya"}</button>` : ""}
        ${isPlayer && !myProg.done && d.kind !== "sim" ? `<button class="btn primary lg" data-play>${myPicksCount < 5 ? (myPicksCount ? `Continua l'elecció (${myPicksCount}/5)` : "Tria les preguntes i juga") : (myProg.i ? "Continua la partida" : "Juga ara")}</button>` : ""}
        ${allDone && isPlayer && !rematchCode ? `<button class="btn primary lg" data-rematch>Demana revenja</button>` : ""}
        ${myProg?.rematch && !rivalProg?.rematch ? `<a class="btn primary lg" href="#duel/${esc(myProg.rematch)}">Ves a la sala de revenja →</a>` : ""}
        <a class="btn lg" href="#duel">Tots els duels</a>
      </div>
      ${isPlayer && myProg.done && d.kind !== "sim" ? recapListHtml(duelRecap(d, uid), firstName(rival?.name)) : ""}
      ${isPlayer && myProg.done && !allDone ? `<p class="waiting-dots">Esperant que ${esc(firstName(rival?.name))} acabi<span>.</span><span>.</span><span>.</span></p>` : ""}
    </div>`;
    $("[data-play]", mainBox)?.addEventListener("click", () => startDuelGame(code, d));
    $("[data-simplay]", mainBox)?.addEventListener("click", () => simStartDuel(code, d, rival?.name));
    $("[data-rematch]", mainBox)?.addEventListener("click", () => requestRematch(code));
    $("[data-go-rematch]", mainBox)?.addEventListener("click", (e) => joinDuel(e.currentTarget.dataset.goRematch));
  }, () => {
    mainBox.innerHTML = `<div class="card online-off"><h3>No es pot obrir el duel</h3><p>Comprova la connexió i torna-ho a provar.</p></div>`;
  });
}

function startDuelGame(code, data) {
  const uid = Online.user.uid;
  const isHost = data.host.uid === uid;
  const id = `duel-${code}`;
  const game = {
    id, kicker: `Duel 1 vs 1`, title: "Duel d'Elecció", color: "#3554ff",
    autostart: true, noReplay: true, backHref: `#duel/${code}`, backLabel: "Torna al duel",
    start(ctx) {
      const ref = F.doc(db, "duels", code);
      const field = `p_${uid}`;
      let liveData = data;
      let rival = isHost ? liveData.guest : liveData.host;
      let myPicks = [...(liveData[field]?.picks || [])];
      let lastHits = 0, finished = null, questionsStarted = false, waitingForRival = false;

      // Estructura fixa: marcador 1 vs 1 en viu a dalt + escenari al mig + xat i icones a sota
      ctx.body.innerHTML = `
        <div class="duel-live-bar card" id="duel-live-bar"></div>
        <div id="duel-stage-inner"></div>
        <div id="duel-game-social"></div>`;
      const liveBar = $("#duel-live-bar", ctx.body);
      const stageInner = $("#duel-stage-inner", ctx.body);
      const socialContainer = $("#duel-game-social", ctx.body);
      const social = mountDuelSocial(socialContainer, ref, uid);

      function renderLiveBar() {
        liveBar.innerHTML = liveBarHtml(liveData, uid);
      }

      renderLiveBar();
      social.update(liveData);

      ctx.onCleanup(F.onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const prevRival = rival ? (liveData[`p_${rival.uid}`] || fresh()) : null;
        liveData = snap.data();
        rival = isHost ? liveData.guest : liveData.host;
        const o = rival ? (liveData[`p_${rival.uid}`] || fresh()) : null;

        // Avisos en viu quan el rival avança o respon
        if (prevRival && o && o.i > (prevRival.i || 0)) {
          const lastOk = o.res?.[o.i - 1];
          const rName = firstName(rival?.name);
          if (lastOk === true) toast(`⚡ ${rName} ha encertat la pregunta ${o.i}! (${fmt(o.score)} pts)`);
          else if (lastOk === false) toast(`💥 ${rName} ha fallat la pregunta ${o.i}!`);
        }

        renderLiveBar();
        social.update(liveData);

        if (waitingForRival && !questionsStarted && o && (o.picks || []).length >= 5) {
          waitingForRival = false;
          beginQuestions();
        } else if (waitingForRival && !questionsStarted) {
          renderWaitingForRivalPicks();
        }
        if (finished && o?.done) settle(liveData, o);
      }));

      // Fase 1: Escollir les 5 parelles (1 per a tu, 1 per al rival)
      const allPairs = duelPairs(liveData.seed);
      const myPairs = isHost ? allPairs.slice(0, 5) : allPairs.slice(5, 10);

      if (myPicks.length < 5) {
        renderDraftStep();
      } else {
        afterMyDraft();
      }

      function renderDraftStep() {
        const k = myPicks.length;
        if (k >= 5) return afterMyDraft();
        const [cardA, cardB] = myPairs[k];
        const rName = rival ? firstName(rival.name) : "el teu rival";
        ctx.hud([["d", "Elecció", `${k + 1}/5`]]);
        stageInner.innerHTML = "";
        const el = h(`<div class="card draft-stage">
          <div class="draft-head">
            <span class="draft-step-badge">Parella ${k + 1} de 5</span>
            <h3>Quina pregunta et quedes per a tu?</h3>
            <p class="muted">Toca la que vulguis respondre tu. <b>L'altra s'enviarà directament a ${esc(rName)}!</b></p>
          </div>
          <div class="draft-pair">
            <button type="button" class="draft-card" data-pick="0">
              <span class="dc-cat">${esc(cardA.catBadge)}</span>
              <p class="dc-preview">${esc(cardA.preview)}</p>
              <span class="dc-cta">✓ Me la quedo per a mi</span>
              <small class="dc-sub">L'altra va per a ${esc(rName)}</small>
            </button>
            <div class="draft-or">O</div>
            <button type="button" class="draft-card" data-pick="1">
              <span class="dc-cat">${esc(cardB.catBadge)}</span>
              <p class="dc-preview">${esc(cardB.preview)}</p>
              <span class="dc-cta">✓ Me la quedo per a mi</span>
              <small class="dc-sub">L'altra va per a ${esc(rName)}</small>
            </button>
          </div>
        </div>`);
        stageInner.appendChild(el);

        let picked = false;
        const draftTimer = questionTimer(ctx, $(".draft-head", el), 10, () => {
          toast("Temps esgotat: s'ha triat a l'atzar");
          choose(Math.random() < 0.5 ? 0 : 1);
        });
        $$("[data-pick]", el).forEach((btn) => btn.addEventListener("click", () => choose(Number(btn.dataset.pick))));
        function choose(choice) {
          if (picked) return;
          picked = true;
          draftTimer.stop();
          const btn = $(`[data-pick="${choice}"]`, el);
          const otherBtn = $(`[data-pick="${1 - choice}"]`, el);
          btn.classList.add("chosen-mine");
          $(".dc-cta", btn).textContent = "✓ PER A TU";
          otherBtn.classList.add("chosen-rival");
          $(".dc-cta", otherBtn).textContent = `↗ ENVIADA A ${rName.toUpperCase()}`;
          Sfx.play("pick");

          myPicks.push(choice);
          patchMyDuel(ref, uid, liveData, { picks: [...myPicks] }).catch(() => {});
          ctx.after(650, renderDraftStep);
        }
      }

      function afterMyDraft() {
        const o = rival ? (liveData[`p_${rival.uid}`] || fresh()) : null;
        if (o && (o.picks || []).length >= 5) {
          beginQuestions();
        } else {
          waitingForRival = true;
          renderWaitingForRivalPicks();
        }
      }

      function renderWaitingForRivalPicks() {
        const o = rival ? (liveData[`p_${rival.uid}`] || fresh()) : null;
        const rName = rival ? firstName(rival.name) : null;
        const rPicks = (o?.picks || []).length;
        ctx.hud([["d", "Elecció", "5/5"]]);
        stageInner.innerHTML = `<div class="card waiting-room">
          <p class="kicker">Tria completada (5/5)</p>
          <h3>Ja has triat les 5 preguntes teves i les 5 per al rival!</h3>
          ${rName
            ? `<p class="waiting-dots">Esperant que <b>${esc(rName)}</b> acabi d'escollir les seves (${rPicks}/5)<span>.</span><span>.</span><span>.</span></p>
               <p class="muted">Tan bon punt acabi de triar començarà sol, o pots començar ja les teves preguntes.</p>
               <div class="row center">
                 <button class="btn primary lg" data-start-now>Comença ja les preguntes →</button>
                 <a class="btn lg" href="#duel/${code}">Torna a la sala</a>
               </div>`
            : `<p class="waiting-dots">Esperant que el teu rival s'uneixi al duel<span>.</span><span>.</span><span>.</span></p>
               <a class="btn lg" href="#duel/${code}">Torna a la sala del duel</a>`}
        </div>`;
        $("[data-start-now]", stageInner)?.addEventListener("click", () => {
          waitingForRival = false;
          beginQuestions();
        });
      }

      function beginQuestions() {
        if (questionsStarted) return;
        questionsStarted = true;
        const o = rival ? (liveData[`p_${rival.uid}`] || fresh()) : fresh();
        const rName = firstName(rival?.name);
        const rounds = buildPlayerRounds(liveData.seed, isHost, myPicks, o.picks, rName);
        const subCtx = { ...ctx, body: stageInner };
        const myRes = [];

        subCtx.countIn(() => {
          runChoiceRounds(subCtx, rounds, {
            timer: 15, lifelines: false,
            points: (left, timer) => 100 + Math.round((60 * left) / timer),
            onAnswer: ({ index, correct, score, hits }) => {
              lastHits = hits;
              myRes[index] = correct;
              patchMyDuel(ref, uid, liveData, {
                i: index + 1,
                score,
                hits,
                res: [...myRes],
                done: false,
              }).catch(() => {});
              renderLiveBar();
            },
            onFinish: async (res) => {
              finished = res;
              await safe(() => patchMyDuel(ref, uid, liveData, {
                i: DUEL_LEN,
                score: res.score,
                hits: lastHits,
                res: [...myRes],
                done: true,
              }));
              stageInner.innerHTML = `<div class="card waiting-room">
                <p class="kicker">Has acabat</p>
                <div class="result-score">${fmt(res.score)}</div>
                <p class="waiting-dots">Esperant que ${esc(firstName(rival?.name))} acabi<span>.</span><span>.</span><span>.</span></p>
                <a class="btn" href="#duel/${code}">Torna al duel</a>
              </div>`;
              const snap = await safe(() => F.getDoc(ref));
              const d = snap?.data();
              const latestO = d && rival ? d[`p_${rival.uid}`] : null;
              if (latestO?.done) settle(d, latestO);
            },
          });
        });
      }

      let settled = false;
      function settle(d, o) {
        if (settled || !ctx.alive()) return;
        settled = true;
        if (d.status !== "done") F.updateDoc(ref, { status: "done" }).catch(() => {});
        const mine = finished.score, theirs = o.score;
        const outcome = mine > theirs ? "win" : mine < theirs ? "lose" : "tie";
        const xp = finished.xp + (outcome === "win" ? 60 : outcome === "tie" ? 25 : 10);
        Progress.record("duel", mine, xp);
        if (outcome === "win") Progress.unlock("duelista");
        const name = firstName(rival?.name);
        ctx.finish({
          ...finished, xp, noRecord: true,
          verdict: outcome === "win" ? `Has guanyat a ${name}: ${fmt(mine)} a ${fmt(theirs)}!`
            : outcome === "lose" ? `${name} t'ha guanyat: ${fmt(theirs)} a ${fmt(mine)}.`
            : `Empat a ${fmt(mine)} punts amb ${name}.`,
          recap: [],
          extraHtml: `<div class="duel-live-bar card">${liveBarHtml(d, uid)}</div>
            <div class="rematch-slot"></div>
            <div class="row center"><button class="btn primary lg" data-rematch>Tornar a jugar (Revenja)</button></div>
            ${recapListHtml(duelRecap(d, uid), name)}`,
          onShown(body) {
            $("[data-rematch]", body)?.addEventListener("click", () => requestRematch(code));
            // Continua escoltant: si el rival demana la revenja, avisa en directe
            closeRoom();
            let alerted = false;
            roomUnsub = F.onSnapshot(ref, (s2) => {
              const dd = s2.data();
              const r = dd && rival && dd[`p_${rival.uid}`];
              if (!r?.rematch || alerted || !document.body.contains(body)) return;
              alerted = true;
              Sfx.play("pick");
              toast(`🔥 ${name} et demana la revenja!`);
              const slot = $(".rematch-slot", body);
              if (slot) {
                slot.innerHTML = `<div class="rematch-alert"><b>🔥 ${esc(name)} et demana la revenja!</b><button class="btn primary" data-go>Accepta la revenja →</button></div>`;
                $("[data-go]", slot).addEventListener("click", () => joinDuel(r.rematch));
              }
            }, () => {});
          },
        });
      }
    },
  };
  DYNAMIC_GAMES.set(id, game);
  endSession();
  if (location.hash === `#joc/${id}`) route();
  else location.hash = `#joc/${id}`;
}

// ---------- Repte diari: rànquing mundial i lligues d'amics ----------
// dailies/{data}/entries/{uid}: { uid, name, photo, ms, hits, errors, createdAt } (només el primer intent)
// leagues/{codi}: { code, name, owner, members: [uid], createdAt }
const LEAGUE_LEN = 5;
let rankTab = "world";

// Al rànquing del dia hi va el millor temps de les 3 primeres partides (n = número de partida): el primer es crea i,
// si una partida posterior el millora, s'actualitza (les regles només deixen baixar el temps i fins a la 3a partida).
Online.submitDaily = async (key, { ms, hits, errors, n = 1, f = null, f1 = null }) => {
  // Sense nom d'usuari no es publica res (es fa en desar-lo)
  if (!ready || !Online.user || !Online.profile?.handle || n > 3) return;
  const ref = F.doc(db, "dailies", key, "entries", Online.user.uid);
  const snap = await safe(() => F.getDoc(ref), "No s'ha pogut publicar el temps");
  if (!snap) return;
  ms = Math.max(3000, Math.round(ms));
  if (!snap.exists()) {
    const base = { ...me(), ms, hits, errors, n, createdAt: F.serverTimestamp() };
    const fails = f || f1;
    if (Array.isArray(fails)) {
      try { await F.setDoc(ref, { ...base, f: fails.slice(0, 10), fd: true }); return; } catch { /* regles sense el camp f: es desa sense el detall */ }
    }
    return safe(() => F.setDoc(ref, base), "No s'ha pogut publicar el temps");
  }
  const cur = snap.data();
  if (ms >= cur.ms || n <= (cur.n || 1)) return;
  await safe(() => F.updateDoc(ref, { ms, hits, errors, n, t: F.serverTimestamp() }), "No s'ha pogut publicar el temps");
};

async function worldTop(key, n = 50) {
  const snap = await safe(() => F.getDocs(F.query(F.collection(db, "dailies", key, "entries"), F.orderBy("ms", "asc"), F.limit(n))));
  return snap ? snap.docs.map((d) => d.data()) : null;
}
async function myPosition(key) {
  const mine = await safe(() => F.getDoc(F.doc(db, "dailies", key, "entries", Online.user.uid)));
  if (!mine?.exists()) return null;
  const ms = mine.data().ms;
  const c = await safe(() => F.getCountFromServer(F.query(F.collection(db, "dailies", key, "entries"), F.where("ms", "<", ms))));
  return c ? c.data().count + 1 : null;
}

Online.fillDailyRank = async (key) => {
  if (!$("#dh-rank") || !ready || !Online.user || !dailyResult(key)) return;
  const pos = await myPosition(key);
  if (pos && $("#dh-rank")) $("#dh-rank").textContent = `#${fmt(pos)}`;
};

Online.renderDailyMini = async (box, key) => {
  if (!box || !ready) return;
  if (!Online.user) {
    box.innerHTML = `<div class="card account-card"><div class="ac-ico">🏆</div><div class="ac-body"><b>Entra al rànquing mundial</b><p>Inicia sessió per publicar el teu temps i comparar-te amb tothom.</p></div><button class="btn google-btn" data-signin>${googleIcon()} Continua amb Google</button>${legalNote()}</div>`;
    $("[data-signin]", box).addEventListener("click", signIn);
    return;
  }
  // Donem un moment perquè s'hagi desat el temps
  await new Promise((r) => setTimeout(r, 900));
  const top = await worldTop(key, 5);
  const pos = await myPosition(key);
  if (!top) return;
  box.innerHTML = `<div class="dsoc" data-soc></div><h4 class="section-title sm" style="margin-top:0">Rànquing mundial d'avui${pos ? ` · ets el #${fmt(pos)}` : ""}</h4>${rankRows(top)}`;
  const soc = $("[data-soc]", box), lines = [];
  const paint = () => { soc.innerHTML = lines.join(""); };
  // Percentil: quanta gent ha fet un temps pitjor
  const total = await safe(() => F.getCountFromServer(F.collection(db, "dailies", key, "entries")));
  const n = total?.data().count || 0;
  const pct = pos && n >= 5 ? Math.round((100 * (n - pos)) / (n - 1)) : null;
  (Online.dailySocial ||= {})[key] = { pct, n };
  if (pct !== null) lines.push(`<p class="dsoc-pct"><b>${pct} %</b><span>Has estat més ràpid que el ${pct} % de les ${fmt(n)} persones que han fet el repte avui.</span></p>`);
  paint();
  // La prova que més gent ha fallat a la partida de tothom
  const hard = await dailyHardest(key);
  if (hard) {
    const it = dailyItems(key, 1)[hard.k];
    const mine = dailyResult(key)?.f1;
    const you = Array.isArray(mine) ? (mine.includes(hard.k) ? "Tu també l'has fallada." : "Tu l'has encertada!") : "";
    lines.push(`<div class="dsoc-hard"><small>La prova més difícil d'avui</small><b>«${esc(String(it?.recapQ || "").slice(0, 120))}»</b><span>Només l'ha encertada el ${hard.pct} % de la gent. ${you}</span></div>`);
    paint();
  }
  // Posició a les lligues d'amics
  const leagues = (await myLeagues()).slice(0, 3);
  for (const lg of leagues) {
    const entries = await leagueEntries(lg, key);
    const i = entries.findIndex((e) => e.uid === Online.user.uid);
    if (i < 0) continue;
    lines.push(`<a class="dsoc-lg" href="#ranking"><span>🏆 ${esc(lg.name)}</span><b>#${i + 1}</b><small>de ${entries.length} ${entries.length === 1 ? "membre" : "membres"} que l'han fet avui</small></a>`);
    paint();
  }
};

// Prova més fallada del dia (comptadors al servidor, guardats 10 minuts en aquesta sessió). Cal un mínim de 10 partides.
async function dailyHardest(key) {
  const ck = `r29n-dhard-${key}`;
  try { const c = JSON.parse(sessionStorage.getItem(ck) || "null"); if (c && Date.now() - c.t < 6e5) return c.v; } catch { /* sense memòria */ }
  const col = F.collection(db, "dailies", key, "entries");
  const base = await safe(() => F.getCountFromServer(F.query(col, F.where("fd", "==", true))));
  const n = base?.data().count || 0;
  let v = null;
  if (n >= 10) {
    const counts = [];
    for (let k = 0; k < 10; k++) {
      const c = await safe(() => F.getCountFromServer(F.query(col, F.where("f", "array-contains", k))));
      counts.push(c?.data().count || 0);
    }
    const k = counts.indexOf(Math.max(...counts));
    if (counts[k] > 0) v = { k, pct: Math.round(100 * (1 - counts[k] / n)), n };
  }
  try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), v })); } catch { /* sense memòria */ }
  return v;
}

// ---------- Duel de campanya: el simulador informa del progrés i del resultat ----------
// Al duel, «i» és el dia de campanya i «score» i «hits» són els escons. Les regles de Firestore ja permeten que cada jugador actualitzi el seu camp p_<uid>.
Online.reportSimDuel = async (code, patch) => {
  if (!ready || !Online.user) return;
  const ref = F.doc(db, "duels", code);
  const snap = await safe(() => F.getDoc(ref));
  const d = snap?.data();
  if (!d || !d.players.includes(Online.user.uid)) return;
  await safe(() => patchMyDuel(ref, Online.user.uid, d, patch), "No s'ha pogut desar el resultat del duel");
};

function rankRows(list) {
  if (!list.length) return `<p class="muted">Encara no hi ha cap temps. Sigues el primer!</p>`;
  return `<div class="lb">${list.map((e, i) => `
    <div class="lb-row ${e.uid === Online.user?.uid ? "me" : ""}">
      <b class="lb-pos">${i + 1}</b>${avatar(e, 34)}
      <span class="lb-name">${esc(e.name || "Jugador")}<small>${e.hits}/10 · ${e.errors} ${e.errors === 1 ? "error" : "errors"}</small></span>
      <strong>${fmtSecs(e.ms)}</strong>
    </div>`).join("")}</div>`;
}

Online.renderRanking = (root, arg) => {
  const key = todayKey();
  if (arg) sessionStorage.setItem("pendingLeague", arg.toUpperCase());
  if (authLoading) {
    root.innerHTML = `<div class="card"><p class="muted">Carregant…</p></div>`;
    return;
  }
  if (!ready) {
    root.innerHTML = `<div class="card rank-off"><h3>El rànquing s'activarà aviat</h3><p>${configured ? "Ara mateix no podem connectar amb el servidor." : "Quan l'app estigui publicada podràs comparar el teu temps amb tothom i crear lligues amb els teus amics."}</p></div>`;
    return;
  }
  if (!Online.user) {
    root.innerHTML = `<div class="card rank-off">
      <h3>${arg ? "T'han convidat a una lliga!" : "Competeix cada dia"}</h3>
      <p>Inicia sessió per publicar el temps del repte diari, veure el rànquing mundial i crear lligues amb els teus amics.</p>
      <button class="btn google-btn lg" data-signin>${googleIcon()} Continua amb Google</button>${legalNote()}
    </div>`;
    $("[data-signin]", root).addEventListener("click", signIn);
    return;
  }
  const pending = sessionStorage.getItem("pendingLeague");
  if (pending) { sessionStorage.removeItem("pendingLeague"); joinLeaguePrompt(root, pending); return; }
  root.innerHTML = `
    <div class="rank-tabs">
      <button class="rank-tab ${rankTab === "world" ? "active" : ""}" data-tab="world">Mundial</button>
      <button class="rank-tab ${rankTab === "friends" ? "active" : ""}" data-tab="friends">Amics</button>
      <button class="rank-tab ${rankTab === "xp" ? "active" : ""}" data-tab="xp">Experiència</button>
    </div>
    <div id="rank-body"><p class="muted">Carregant…</p></div>`;
  $$("[data-tab]", root).forEach((b) => b.addEventListener("click", () => { rankTab = b.dataset.tab; Online.renderRanking(root); }));
  if (rankTab === "world") renderWorld($("#rank-body"), key);
  else if (rankTab === "xp") renderLeaderboard($("#rank-body"), true);
  else renderLeagues($("#rank-body"), key);
};

async function renderWorld(box, key) {
  const top = await worldTop(key, 50);
  if (!top) return;
  const done = dailyResult(key);
  const pos = done ? await myPosition(key) : null;
  box.innerHTML = `
    <p class="muted" style="margin-bottom:12px">Repte #${dailyNumber(key)} · ${pos ? `Ets el <b>#${fmt(pos)}</b> del món.` : done ? "" : `Encara no l'has fet. <a href="#joc/diari">Juga ara</a>.`}</p>
    ${rankRows(top)}`;
}

// Temps d'avui dels membres d'una lliga (de 30 en 30, el límit de Firestore per a «in»)
async function leagueEntries(lg, key) {
  const entries = [];
  for (let i = 0; i < lg.members.length; i += 30) {
    const chunk = lg.members.slice(i, i + 30);
    const snap = await safe(() => F.getDocs(F.query(F.collection(db, "dailies", key, "entries"), F.where("uid", "in", chunk))));
    if (snap) entries.push(...snap.docs.map((d) => d.data()));
  }
  return entries.sort((a, b) => a.ms - b.ms);
}

async function myLeagues() {
  const snap = await safe(() => F.getDocs(F.query(F.collection(db, "leagues"), F.where("members", "array-contains", Online.user.uid), F.limit(20))));
  return snap ? snap.docs.map((d) => d.data()) : [];
}

async function renderLeagues(box, key) {
  const leagues = await myLeagues();
  box.innerHTML = `
    <div class="duel-grid">
      <div class="card duel-card">
        <p class="kicker">Nova lliga</p>
        <h3>Crea una lliga</h3>
        <form class="join-form" data-create-league>
          <input type="text" class="name-input" maxlength="30" placeholder="Nom de la lliga" aria-label="Nom de la lliga">
          <button class="btn primary" type="submit">Crea</button>
        </form>
      </div>
      <div class="card duel-card">
        <p class="kicker">T'han passat un codi?</p>
        <h3>Uneix-te</h3>
        <form class="join-form" data-join-league>
          <input type="text" maxlength="${LEAGUE_LEN}" placeholder="CODI" autocomplete="off" aria-label="Codi de la lliga">
          <button class="btn" type="submit">Entra</button>
        </form>
      </div>
    </div>
    <div id="league-list"></div>`;
  $("[data-create-league]", box).addEventListener("submit", (e) => { e.preventDefault(); createLeague($("input", e.target).value.trim()); });
  $("[data-join-league]", box).addEventListener("submit", (e) => {
    e.preventDefault();
    const c = $("input", e.target).value.trim().toUpperCase();
    if (c.length === LEAGUE_LEN) joinLeague(c);
    else toast(`El codi té ${LEAGUE_LEN} caràcters`);
  });
  const list = $("#league-list", box);
  if (!leagues.length) {
    list.innerHTML = `<p class="muted" style="margin-top:18px">Encara no estàs a cap lliga. Crea'n una i convida els teus amics!</p>`;
    return;
  }
  for (const lg of leagues) {
    const sec = h(`<section class="league">
      <div class="group-head"><span class="group-dot" style="--c:var(--yellow)"></span><h3>${esc(lg.name)}</h3>
        <p>${lg.members.length} ${lg.members.length === 1 ? "membre" : "membres"} · codi ${lg.code}</p>
        <button class="btn ghost" data-invite style="margin-left:auto">Convida</button></div>
      <div class="league-body"><p class="muted">Carregant…</p></div>
    </section>`);
    list.appendChild(sec);
    $("[data-invite]", sec).addEventListener("click", () => inviteLeague(lg));
    const entries = await leagueEntries(lg, key);
    const missing = lg.members.length - entries.length;
    $(".league-body", sec).innerHTML = rankRows(entries) +
      (missing > 0 ? `<p class="muted" style="margin-top:8px">${missing} ${missing === 1 ? "membre encara no ha" : "membres encara no han"} fet el repte d'avui.</p>` : "");
  }
}

const leagueLink = (code) => `${location.origin}${location.pathname}#ranking/${code}`;
async function inviteLeague(lg) {
  const text = `Uneix-te a la meva lliga «${lg.name}» a Política en Joc i competim cada dia al repte diari! Codi: ${lg.code}`;
  try {
    if (navigator.share) await navigator.share({ title: "Política en Joc", text, url: leagueLink(lg.code) });
    else { await navigator.clipboard.writeText(`${text}\n${leagueLink(lg.code)}`); toast("Invitació copiada"); }
  } catch { /* cancel·lat */ }
}

async function createLeague(name) {
  if (!name) return toast("Posa un nom a la lliga");
  const code = Array.from({ length: LEAGUE_LEN }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  const ok = await safe(() => F.setDoc(F.doc(db, "leagues", code), {
    code, name: name.slice(0, 30), owner: Online.user.uid, members: [Online.user.uid], createdAt: F.serverTimestamp(),
  }), "No s'ha pogut crear la lliga");
  if (ok === null) return;
  rankTab = "friends";
  toast("Lliga creada! Convida els teus amics.");
  Online.renderRanking($("#ranking-root"));
}

async function joinLeague(code) {
  const ref = F.doc(db, "leagues", code);
  const snap = await safe(() => F.getDoc(ref));
  if (!snap) return;
  if (!snap.exists()) return toast("No existeix cap lliga amb aquest codi");
  if (!snap.data().members.includes(Online.user.uid)) {
    const ok = await safe(() => F.updateDoc(ref, { members: F.arrayUnion(Online.user.uid) }), "No t'has pogut unir a la lliga");
    if (ok === null) return;
    toast(`T'has unit a «${snap.data().name}»`);
  }
  rankTab = "friends";
  if (location.hash !== "#ranking") location.hash = "#ranking";
  else Online.renderRanking($("#ranking-root"));
}

async function joinLeaguePrompt(root, code) {
  const snap = await safe(() => F.getDoc(F.doc(db, "leagues", code)));
  if (!snap?.exists()) { toast("Aquesta lliga no existeix"); location.hash = "#ranking"; return; }
  const lg = snap.data();
  root.innerHTML = `<div class="card online-off invite">
    <h3>Et conviden a «${esc(lg.name)}»</h3>
    <p>${lg.members.length} ${lg.members.length === 1 ? "persona ja hi juga" : "persones ja hi juguen"}. Compareu els vostres temps del repte diari cada dia.</p>
    <button class="btn primary lg" data-accept>Uneix-m'hi</button>
  </div>`;
  $("[data-accept]", root).addEventListener("click", () => joinLeague(code));
}

// ---------- Arrencada (al final, quan ja hi ha totes les funcions definides) ----------
renderAccountBtn();
refreshView();

if (configured) {
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    const app = appMod.initializeApp(cfg);
    fbApp = app;
    A = authMod;
    F = fsMod;
    try {
      auth = A.initializeAuth(app, {
        persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
        popupRedirectResolver: A.browserPopupRedirectResolver,
      });
    } catch {
      auth = A.getAuth(app);
      await A.setPersistence(auth, A.browserLocalPersistence).catch(() => {});
    }
    db = F.getFirestore(app);
    ready = !!db;
  } catch (e) {
    console.warn("No s'ha pogut carregar Firebase:", e);
  }
  authLoading = false;
}

if (ready) {
  // Demana al navegador que no esborri les dades de la sessió quan va just d'espai
  try { navigator.storage?.persist?.(); } catch { /* no disponible */ }
  // El resultat d'una redirecció no ha de bloquejar mai l'escolta de la sessió
  A.getRedirectResult(auth).catch(() => {});
  let firstAuthEvent = true;
  A.onAuthStateChanged(auth, async (user) => {
    // Si el navegador encara no ha restaurat la sessió i hi ha un usuari desat, no el donem per sortit
    // abans d'hora: reintentem un cop després d'una breu espera.
    if (!user && firstAuthEvent && store.get(USER_CACHE_KEY, null)) {
      firstAuthEvent = false;
      await new Promise((r) => setTimeout(r, 1500));
      if (auth.currentUser) user = auth.currentUser;
    }
    firstAuthEvent = false;
    Online.user = user;
    cacheUser(user);
    renderAccountBtn();
    // El grau al Centre de control es torna a mirar ara que la sessió és vàlida
    window.ctlRoleReset?.();
    if (user) {
      synced = false;
      const okSync = await syncDown();
      Progress.onSave = schedulePush;
      // Si ha fet el repte d'avui sense sessió, el publiquem ara (només compta si encara no hi és).
      // Sense usuari triat encara, es publica quan el desi.
      const today = dailyResult(todayKey());
      if (okSync && !Online.profile) openProfileEditor(true);
      else if (!okSync) retrySync();
      else if (today) Online.submitDaily(todayKey(), today);
      const pending = sessionStorage.getItem("pendingDuel");
      if (pending) {
        sessionStorage.removeItem("pendingDuel");
        // Si ja som a l'enllaç del duel no hi ha hashchange: cal tornar a pintar
        if (location.hash === `#duel/${pending}`) route();
        else location.hash = `#duel/${pending}`;
        return;
      }
    } else {
      Progress.onSave = null;
    }
    refreshView();
  });
} else {
  renderAccountBtn();
  refreshView();
}
