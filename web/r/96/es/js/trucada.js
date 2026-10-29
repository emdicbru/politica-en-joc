// Trucades i videotrucades entre amics (de 2 a 4 persones) mentre juguen: campanya contra amics, debat entre amics i
// la sala de prova del Laboratori. L'àudio i el vídeo van directament entre els navegadors (WebRTC, en malla: cada
// parell de persones té la seva connexió). Per posar-los en contacte es fa servir una bústia (Online.call.transport,
// a Firestore dins de la sala) o, al laboratori, un BroadcastChannel entre pestanyes del mateix navegador.
// Res no es grava ni passa per cap servidor nostre. Pantalla: un botó flotant i, a dins, el panell de la trucada.
//
// Protocol: cadascú publica la seva presència (in_<uid>: sessió, nom, micro, càmera i hora) i la renova cada 30 s.
// De cada parell, qui té l'uid més petit fa l'oferta; els missatges porten la sessió de qui els envia (sid) i la de
// qui els rep (rsid) per descartar els d'una connexió antiga. Cada connexió té sempre un canal d'àudio i un de vídeo:
// encendre o apagar la càmera només canvia la pista (replaceTrack), sense tornar a negociar.

const CALL_ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
const CALL_BEAT = 30000; // cada quan es renova la presència
const CALL_STALE = 95000; // una presència sense renovar fa més de 95 s ja no compta (pestanya tancada de cop)

const Call = {
  room: null, // { key, parent, code, title, lab, names: { uid: nom }, bots: [nom], alive: () => bool }
  tr: null, unsub: null, me: null, sid: null,
  joined: false, local: null, mic: true, video: false, min: false, since: 0,
  peers: new Map(), // uid → { pc, rsid, stream, state, queue }
  others: new Map(), // uid → presència
  mine: new Set(), // ids dels missatges que he enviat (per esborrar-los en penjar)
  timers: [],
};

// ---------- La bústia del laboratori (dues pestanyes del mateix navegador) ----------
function callLabTransport(code) {
  // Un id nou a cada càrrega (una pestanya oberta des d'una altra en copiaria el sessionStorage)
  const uid = Call.labUid || (Call.labUid = `lab-${Math.random().toString(36).slice(2, 8)}`);
  const ch = new BroadcastChannel(`pej-trucada-${code}`);
  const docs = new Map();
  let cb = null;
  const vis = (d) => d.to === "all" || d.to === uid || d.from === uid;
  const apply = (op, id, d) => {
    const had = docs.has(id);
    if (op === "del") { if (!had) return; const old = docs.get(id); docs.delete(id); if (vis(old)) cb?.([{ type: "removed", id, d: old }]); return; }
    docs.set(id, d);
    if (vis(d)) cb?.([{ type: had ? "modified" : "added", id, d }]);
  };
  ch.onmessage = (e) => {
    const m = e.data;
    if (m.op === "sync") { docs.forEach((d, id) => { if (d.from === uid) ch.postMessage({ op: "put", id, d }); }); return; }
    apply(m.op, m.id, m.d);
  };
  return {
    uid, lab: true,
    put(id, d) { apply("put", id, d); ch.postMessage({ op: "put", id, d }); return Promise.resolve(); },
    send(d) { const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; this.put(id, d); return Promise.resolve(id); },
    del(id) { apply("del", id); ch.postMessage({ op: "del", id }); return Promise.resolve(); },
    watch(f) { cb = f; ch.postMessage({ op: "sync" }); return () => { cb = null; ch.close(); }; },
  };
}

// ---------- Connectar-se a una sala (sense entrar a la trucada: només veure qui hi és) ----------
// opts: { parent, code, title, lab, names, bots, alive }
function callAttach(opts) {
  const key = `${opts.parent}/${opts.code}`;
  if (Call.room?.key === key) { Object.assign(Call.room, opts); callPaint(); return; }
  if (Call.joined) return; // ja és en una altra trucada: no la talla
  callDetach();
  if (!opts.lab && !window.Online?.call?.ok()) return;
  Call.room = { ...opts, key };
  Call.tr = opts.lab ? callLabTransport(opts.code) : window.Online.call.transport(opts.parent, opts.code);
  Call.me = Call.tr.uid;
  Call.others.clear();
  Call.unsub = Call.tr.watch(callOnDocs);
  Call.timers.push(setInterval(callSweep, 15000));
  callPaint();
}
function callDetach() {
  if (Call.joined) callHangup();
  Call.unsub?.();
  Call.unsub = null;
  Call.timers.forEach(clearInterval);
  Call.timers = [];
  Call.room = null;
  Call.others.clear();
  $(".call-ui")?.remove();
}
// Si la pantalla del joc ja no hi és i no ets a la trucada, es desconnecta de la sala
setInterval(() => { if (Call.room && !Call.joined && Call.room.alive && !Call.room.alive()) callDetach(); }, 2000);

const callFresh = (p) => p && Date.now() - (p.ts || 0) < CALL_STALE;
const callName = (uid) => Call.room?.names?.[uid] || Call.others.get(uid)?.name || "Jugador";
const callIn = () => [...Call.others.values()].filter(callFresh);

function callOnDocs(changes) {
  changes.forEach(({ type, id, d }) => {
    if (d.from === Call.me) return;
    if (d.kind === "in") {
      const was = callFresh(Call.others.get(d.from));
      if (type === "removed") { Call.others.delete(d.from); callDrop(d.from); }
      else {
        Call.others.set(d.from, d);
        if (!was && callFresh(d) && Call.room) { toast(`📞 ${callName(d.from)} ${Call.joined ? "se ha unido a la llamada" : "está en la llamada"}`); Sfx.play?.("pick"); }
        if (Call.joined) callEnsure(d);
      }
      callPaint();
      return;
    }
    if (type === "removed" || d.to !== Call.me) return;
    Call.tr.del(id); // llegit: s'esborra
    if (Call.joined) callSignal(d);
  });
}
function callSweep() {
  let ch = false;
  Call.others.forEach((p, uid) => { if (!callFresh(p)) { Call.others.delete(uid); callDrop(uid); ch = true; } });
  if (ch) callPaint();
}

// ---------- Entrar i sortir ----------
async function callJoin(video) {
  if (!Call.room || Call.joined) return;
  // Navegadors integrats d'altres apps (Instagram, Facebook…): sovint no deixen fer servir el micro
  const inApp = /FBAN|FBAV|Instagram|Line\/|; wv\)/i.test(navigator.userAgent);
  if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") { toast(inApp ? "El navegador de esta app no permite llamadas. Abre el enlace con Chrome o Safari (menú ⋮ → «Abrir en el navegador»)." : "Este navegador no permite llamadas. Pruébalo con Chrome, Safari o Firefox actualizados."); return; }
  const lock = /android/i.test(navigator.userAgent) ? "Toca el candado 🔒 junto a la dirección → Permisos → Micrófono (y Cámara) → Permitir, y vuelve a intentarlo." : "Toca el candado 🔒 junto a la dirección y permite el micrófono (y la cámara), y vuelve a intentarlo.";
  // Si ja s'havia denegat, el navegador no ho tornarà a preguntar: cal dir on es canvia
  const prev = await navigator.permissions?.query({ name: "microphone" }).catch(() => null);
  if (prev?.state === "denied") { toast(`El micrófono está bloqueado para esta web. ${lock}`); return; }
  try {
    Call.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false });
  } catch (e) {
    console.warn(e);
    toast(e.name === "NotAllowedError" ? (inApp ? "El navegador de esta app no deja usar el micrófono. Abre el enlace con Chrome o Safari." : `Hace falta permiso para el micrófono${video ? " y la cámara" : ""}. ${lock}`)
      : e.name === "NotFoundError" ? "No se ha encontrado ningún micrófono en este dispositivo."
      : e.name === "NotReadableError" ? "Otra app está usando el micrófono o la cámara. Ciérrala y vuelve a intentarlo."
      : "No se ha podido abrir el micrófono.");
    return;
  }
  Call.joined = true;
  Call.mic = true;
  Call.video = !!video;
  Call.min = false;
  Call.since = Date.now();
  Call.sid = Math.random().toString(36).slice(2, 10);
  await callPresence();
  Call.timers.push(setInterval(callPresence, CALL_BEAT));
  callIn().forEach(callEnsure);
  Sfx.play?.("ok");
  callPaint();
}
function callPresence() {
  if (!Call.joined) return;
  return Call.tr.put(`in_${Call.me}`, { from: Call.me, to: "all", kind: "in", sid: Call.sid, name: (Call.room.lab ? `Pestaña ${Call.me.slice(-3)}` : window.Online?.profile?.handle || "Jugador").slice(0, 40), mic: Call.mic, video: Call.video, ts: Date.now() });
}
function callHangup() {
  if (!Call.joined) return;
  Call.joined = false;
  [...Call.peers.keys()].forEach(callDrop);
  Call.local?.getTracks().forEach((t) => t.stop());
  Call.local = null;
  Call.tr.del(`in_${Call.me}`);
  Call.mine.forEach((id) => Call.tr.del(id));
  Call.mine.clear();
  Call.timers.slice(1).forEach(clearInterval); // queda el de neteja de la sala
  Call.timers = Call.timers.slice(0, 1);
  callPaint();
}
window.addEventListener("pagehide", () => { if (Call.joined) Call.tr.del(`in_${Call.me}`); });

// ---------- Les connexions ----------
const callSend = async (to, kind, data) => {
  const id = await Call.tr.send({ from: Call.me, to, kind, sid: Call.sid, data: JSON.stringify(data), ts: Date.now() });
  if (id) Call.mine.add(id);
};
function callPc(uid, rsid) {
  const pc = new RTCPeerConnection({ iceServers: CALL_ICE });
  const P = { pc, rsid, stream: new MediaStream(), state: "connectant", queue: [] };
  Call.peers.set(uid, P);
  pc.onicecandidate = (e) => { if (e.candidate) callSend(uid, "ice", { c: e.candidate.toJSON(), rsid }); };
  pc.ontrack = (e) => { if (!P.stream.getTracks().includes(e.track)) P.stream.addTrack(e.track); callPaint(); };
  pc.onconnectionstatechange = () => {
    P.state = { connected: "ok", failed: "error", disconnected: "connectant", closed: "error" }[pc.connectionState] || "connectant";
    callPaint();
  };
  return P;
}
// Les meves pistes als dos canals (àudio i vídeo) de la connexió
function callTracks(P) {
  const a = Call.local?.getAudioTracks()[0] || null, v = Call.video ? Call.local?.getVideoTracks()[0] || null : null;
  P.pc.getTransceivers().forEach((t) => {
    const kind = t.receiver.track?.kind;
    t.direction = "sendrecv";
    t.sender.replaceTrack(kind === "audio" ? a : v).catch(() => {});
    if (kind === "video" && v) t.sender.setStreams?.(Call.local);
  });
}
async function callEnsure(p) {
  const cur = Call.peers.get(p.from);
  if (cur && cur.rsid === p.sid) return;
  if (cur) callDrop(p.from);
  if (!(Call.me < p.from)) return; // de cada parell, ofereix qui té l'uid més petit
  const P = callPc(p.from, p.sid);
  P.pc.addTransceiver("audio", { direction: "sendrecv" });
  P.pc.addTransceiver("video", { direction: "sendrecv" });
  callTracks(P);
  try {
    await P.pc.setLocalDescription(await P.pc.createOffer());
    callSend(p.from, "offer", { sdp: P.pc.localDescription.toJSON(), rsid: p.sid });
  } catch (e) { console.warn(e); P.state = "error"; callPaint(); }
}
async function callSignal(d) {
  let x;
  try { x = JSON.parse(d.data || "{}"); } catch { return; }
  if (x.rsid !== Call.sid) return; // per a una sessió antiga meva
  const from = d.from;
  try {
    if (d.kind === "offer") {
      if (Call.peers.has(from)) callDrop(from);
      const P = callPc(from, d.sid);
      await P.pc.setRemoteDescription(x.sdp);
      callTracks(P);
      await P.pc.setLocalDescription(await P.pc.createAnswer());
      callSend(from, "answer", { sdp: P.pc.localDescription.toJSON(), rsid: d.sid });
      P.queue.splice(0).forEach((c) => P.pc.addIceCandidate(c).catch(() => {}));
    } else {
      const P = Call.peers.get(from);
      if (!P || P.rsid !== d.sid) return;
      if (d.kind === "answer") {
        await P.pc.setRemoteDescription(x.sdp);
        P.queue.splice(0).forEach((c) => P.pc.addIceCandidate(c).catch(() => {}));
      } else if (d.kind === "ice") {
        if (P.pc.remoteDescription) await P.pc.addIceCandidate(x.c).catch(() => {});
        else P.queue.push(x.c);
      }
    }
  } catch (e) { console.warn(e); }
}
// Els candidats de connexió que arriben abans que l'oferta es guarden aquí
function callDrop(uid) {
  const P = Call.peers.get(uid);
  if (!P) return;
  try { P.pc.close(); } catch { /* ja tancada */ }
  Call.peers.delete(uid);
}

// ---------- Micro i càmera ----------
function callToggleMic() {
  Call.mic = !Call.mic;
  Call.local?.getAudioTracks().forEach((t) => { t.enabled = Call.mic; });
  callPresence();
  callPaint();
}
async function callToggleVideo() {
  if (!Call.video) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } });
      Call.local.getVideoTracks().forEach((t) => { t.stop(); Call.local.removeTrack(t); });
      Call.local.addTrack(s.getVideoTracks()[0]);
    } catch (e) { console.warn(e); toast("No se ha podido abrir la cámara. Revisa su permiso en el navegador."); return; }
    Call.video = true;
  } else {
    Call.video = false;
    Call.local.getVideoTracks().forEach((t) => { t.stop(); Call.local.removeTrack(t); });
  }
  Call.peers.forEach(callTracks);
  callPresence();
  callPaint();
}

// ---------- Qui parla (indicador de volum) ----------
const callMeters = new Map(); // stream → { an, buf }
let callAudioCtx = null;
function callLevel(stream) {
  if (!stream?.getAudioTracks().length) return 0;
  try {
    callAudioCtx = callAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    let m = callMeters.get(stream);
    if (!m) {
      const an = callAudioCtx.createAnalyser();
      an.fftSize = 256;
      callAudioCtx.createMediaStreamSource(stream).connect(an);
      m = { an, buf: new Uint8Array(an.fftSize) };
      callMeters.set(stream, m);
    }
    m.an.getByteTimeDomainData(m.buf);
    let s = 0;
    for (const v of m.buf) s += Math.abs(v - 128);
    return s / m.buf.length;
  } catch { return 0; }
}
setInterval(() => {
  if (!Call.joined || Call.min) return;
  $$(".call-tile[data-uid]").forEach((el) => {
    const uid = el.dataset.uid;
    const st = uid === Call.me ? (Call.mic ? Call.local : null) : Call.peers.get(uid)?.stream;
    el.classList.toggle("talk", callLevel(st) > 6);
  });
}, 200);

// ---------- Pantalla ----------
const callAv = (name) => `<span class="call-av">${esc((name || "?").trim().charAt(0).toUpperCase())}</span>`;
const callClock = () => { const s = Math.floor((Date.now() - Call.since) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function callPaint() {
  if (!Call.room) { $(".call-ui")?.remove(); return; }
  let el = $(".call-ui");
  if (!el) { el = h(`<div class="call-ui" role="region" aria-label="Llamada"></div>`); document.body.appendChild(el); callBind(el); }
  const inCall = callIn();
  if (!Call.joined) {
    el.className = "call-ui pill";
    el.dataset.sig = "";
    el.innerHTML = `<button type="button" class="call-pill ${inCall.length ? "live" : ""}" data-call-open aria-label="Llamada con los amigos${inCall.length ? `: ${inCall.length} ${inCall.length === 1 ? "persona" : "personas"} en la llamada` : ""}">📞<span>${inCall.length ? `${inCall.length} en la llamada · Entra` : "Llama"}</span></button>
      ${el.dataset.ask ? `<div class="call-ask card">
        <p><b>Llamada con los amigos</b>${inCall.length ? ` · ${inCall.length === 1 ? "está" : "están"} ${inCall.map((p) => esc(callName(p.from))).join(", ")}` : ""}</p>
        <p class="muted">La voz y la imagen van directamente entre vuestros dispositivos: no se graban ni pasan por ningún servidor nuestro.${Call.room.lab ? " Laboratorio: abre esta misma pantalla en otra pestaña para hablar." : ""}</p>
        <div class="call-ask-btns"><button type="button" class="btn primary" data-call-join="0">🎙️ Entra con voz</button><button type="button" class="btn" data-call-join="1">📹 Con vídeo</button><button type="button" class="btn ghost" data-call-x>Ahora no</button></div>
      </div>` : ""}`;
    return;
  }
  if (Call.min) {
    el.className = "call-ui pill";
    el.dataset.sig = "";
    el.innerHTML = `<div class="call-pill on"><button type="button" data-call-max aria-label="Abre la llamada">📞<span>${callClock()} · ${inCall.length + 1}</span></button><button type="button" class="call-ic ${Call.mic ? "" : "off"}" data-call-mic aria-label="${Call.mic ? "Silencia el micro" : "Activa el micro"}">${Call.mic ? "🎙️" : "🔇"}</button><button type="button" class="call-ic end" data-call-end aria-label="Cuelga">✕</button></div>`;
    return;
  }
  el.className = "call-ui dock";
  const tiles = [
    { uid: Call.me, name: Call.room.lab ? `Pestaña ${Call.me.slice(-3)} (tú)` : `${window.Online?.profile?.handle || "Tú"} (tú)`, me: true, video: Call.video, mic: Call.mic, state: "ok" },
    ...inCall.map((p) => ({ uid: p.from, name: callName(p.from), video: p.video, mic: p.mic, state: Call.peers.get(p.from)?.state || "connectant" })),
    ...(Call.room.bots || []).map((n) => ({ name: n, bot: true })),
  ];
  const n = tiles.length;
  // Només es refà el panell si ha canviat alguna cosa que es veu (la presència es renova sola cada 30 s)
  const sig = JSON.stringify(tiles.map((t) => [t.uid, t.name, t.video, t.mic, t.state]));
  if (el.dataset.sig !== sig || !$(".call-grid", el)) { el.dataset.sig = sig;
  el.innerHTML = `<div class="call-head"><b>📞 ${esc(Call.room.title || "Llamada")}</b><span>${callClock()}</span><button type="button" class="call-ic" data-call-min aria-label="Minimiza la llamada">▁</button></div>
    <div class="call-grid n${Math.min(n, 4)}">${tiles.map((t) => `<div class="call-tile ${t.bot ? "bot" : ""} ${t.state === "error" ? "err" : ""}" ${t.bot ? "" : `data-uid="${esc(t.uid)}"`}>
      ${t.video && !t.bot ? `<video autoplay playsinline ${t.me ? "muted" : ""}></video>` : callAv(t.name)}
      ${!t.me && !t.bot && !t.video ? `<audio autoplay></audio>` : ""}
      <small>${t.mic === false ? "🔇 " : ""}${esc(t.name)}${t.bot ? " · ficticio, no habla" : t.state === "connectant" ? " · conectando…" : t.state === "error" ? " · no se puede conectar" : ""}</small>
    </div>`).join("")}</div>
    ${tiles.some((t) => t.state === "error") ? `<p class="call-note">Alguna conexión no sale: pasa con algunas redes (sobre todo datos móviles o redes de empresa). Probad con wifi.</p>` : ""}
    ${n === 1 ? `<p class="call-note">Todavía no hay nadie más. Cuando alguien de la sala entre en la llamada, lo oirás aquí.</p>` : ""}
    <div class="call-ctrl"><button type="button" class="call-ic ${Call.mic ? "" : "off"}" data-call-mic aria-label="${Call.mic ? "Silencia el micro" : "Activa el micro"}">${Call.mic ? "🎙️" : "🔇"}</button><button type="button" class="call-ic ${Call.video ? "" : "off"}" data-call-cam aria-label="${Call.video ? "Apaga la cámara" : "Enciende la cámara"}">${Call.video ? "📹" : "📷"}</button><button type="button" class="call-ic end" data-call-end aria-label="Cuelga">Cuelga</button></div>`;
  }
  // Les imatges i el so
  $$(".call-tile[data-uid]", el).forEach((t) => {
    const uid = t.dataset.uid;
    const st = uid === Call.me ? Call.local : Call.peers.get(uid)?.stream;
    $$("video, audio", t).forEach((m) => { if (st && m.srcObject !== st) { m.srcObject = st; m.play?.().catch(() => {}); } });
  });
}
// Rellotge del panell
setInterval(() => { if (Call.joined) { const c = Call.min ? $(".call-pill [data-call-max] span") : $(".call-head span"); if (c) c.textContent = Call.min ? `${callClock()} · ${callIn().length + 1}` : callClock(); } }, 1000);
function callBind(el) {
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.matches("[data-call-open]")) { el.dataset.ask = el.dataset.ask ? "" : "1"; callPaint(); }
    else if (b.matches("[data-call-x]")) { el.dataset.ask = ""; callPaint(); }
    else if (b.matches("[data-call-join]")) { el.dataset.ask = ""; callJoin(b.dataset.callJoin === "1"); }
    else if (b.matches("[data-call-mic]")) callToggleMic();
    else if (b.matches("[data-call-cam]")) callToggleVideo();
    else if (b.matches("[data-call-end]")) callHangup();
    else if (b.matches("[data-call-min]")) { Call.min = true; callPaint(); }
    else if (b.matches("[data-call-max]")) { Call.min = false; callPaint(); }
  });
}
window.Call = { attach: callAttach, detach: callDetach, state: Call };
