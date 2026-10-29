// Simulador de debat electoral · Debat entre amics: entrada, sala, el plató en directe i el resultat.
// El motor és a debat-multi.js. La sala és la de Firestore (Online.debat, online.js) o, al Laboratori del Centre de
// control, una de local amb candidats ficticis (DbLab). L'amfitrió fa avançar el debat; tothom veu el mateix.

// Quan el veurà tothom. Fins llavors, només des del Laboratori, amb candidats ficticis.
const DBM_FROM = Date.UTC(2026, 9, 29, 16, 0); // públic des del 29-10-2026 (v96)
const dbmPublic = () => Date.now() >= DBM_FROM;
const dbmOn = () => dbmPublic() || (typeof featPreview === "function" && featPreview("debatamics"));
const dbmIsLab = () => !dbmPublic() && typeof featPreview === "function" && featPreview("debatamics");
const DbOpts = { amics: null };
const dbmApi = () => (dbmIsLab() ? DbLab : window.Online.debat);
const dbmUid = () => dbmApi()?.uid();
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#joc/debat")) DbOpts.amics = null; });

// ---------- La sala de prova (laboratori) i els candidats ficticis ----------
const DBM_BOTS = [
  { name: "Marta Puig", party: "Futur Verd", sig: "FV", color: "#3f8f45", ideo: "esq", terr: "autonom", size: "gran", style: "proper", look: "dona2", skin: "#f1cbb0", hairC: "#46301f" },
  { name: "Jordi Mas", party: "Ordre Nou", sig: "ON", color: "#5c6b7a", ideo: "dreta", terr: "central", size: "gran", style: "combat", look: "home1", skin: "#e2b293", hairC: "#1b1714" },
  { name: "Laia Font", party: "Veïns Units", sig: "VU", color: "#c39a5f", ideo: "centre", terr: "autonom", size: "gran", style: "rigor", look: "dona3", skin: "#f6d9c5", hairC: "#6b4a2c" },
];
const DbLab = (() => {
  let room = null;
  const subs = new Set(), busy = new Set();
  const me = () => "lab-jo";
  const emit = () => { const c = JSON.stringify(room); setTimeout(() => subs.forEach((cb) => cb(room ? JSON.parse(c) : null)), 0); setTimeout(bots, 0); };
  const later = (k, ms, fn) => { const key = `${room.code}:${k}`; if (busy.has(key)) return; busy.add(key); setTimeout(() => { if (room) fn(); }, ms); };
  const api = {
    lab: true, ok: () => true, uid: me,
    async create(cand) { room = { code: `LAB${Math.random().toString(36).slice(2, 5).toUpperCase()}`, status: "lobby", host: me(), players: [me()], seats: { [me()]: { name: window.Online?.profile?.handle || "Tu", cand } }, st: null, ch: {}, rd: {} }; emit(); return room.code; },
    async join(code) { return room?.code === code ? { ok: true } : { err: "Aquesta sala de prova ja no existeix." }; },
    watch(code, cb) { const f = (d) => cb(d && d.code === code ? d : null); subs.add(f); setTimeout(() => f(room ? JSON.parse(JSON.stringify(room)) : null), 0); return () => subs.delete(f); },
    async setCand(code, cand) { room.seats[me()].cand = cand; emit(); return true; },
    async host(code, patch) { Object.assign(room, JSON.parse(JSON.stringify(patch))); emit(); return true; },
    async choose(code, k, v) { room.ch[me()] = { k, v }; emit(); return true; },
    async ready(code, k) { room.rd[me()] = k; emit(); return true; },
    async leave() { room = null; return true; },
    async remove() { room = null; return true; },
    async addBot() {
      if (!room || room.status !== "lobby" || room.players.length >= 4) return;
      const B = DBM_BOTS.find((b) => !room.players.includes(`bot-${b.sig}`));
      if (!B) return;
      room.players.push(`bot-${B.sig}`);
      room.seats[`bot-${B.sig}`] = { name: `${B.name.split(" ")[0]} (fictici)`, cand: { ...B }, bot: true };
      emit();
    },
  };
  // Els candidats ficticis trien resposta, repliquen i «miren» les intervencions al moment
  function bots() {
    if (!room || room.status !== "playing" || !room.st) return;
    const S = JSON.parse(room.st);
    room.players.filter((u) => u.startsWith("bot-")).forEach((u) => {
      const key = `${S.bi}:${S.phase}`;
      if (S.phase === "tria" && room.ch[u]?.k !== key) later(`t-${u}-${key}`, 3000 + Math.random() * 6000, () => {
        const cards = dbmCards(S, u);
        const atk = cards.map((c, i) => [c, i]).filter(([c]) => c.k === "atac");
        const calm = cards.map((c, i) => [c, i]).filter(([c]) => c.k !== "atac");
        const pick = atk.length && Math.random() < (S.cand[u].style === "combat" ? 0.45 : 0.2) ? atk[Math.floor(Math.random() * atk.length)] : calm[Math.floor(Math.random() * calm.length)];
        room.ch[u] = { k: key, v: pick[1] }; emit();
      });
      if (S.phase === "replica" && dbmReplyers(S).includes(u) && room.ch[u]?.k !== key) later(`r-${u}-${key}`, 2500 + Math.random() * 3000, () => { room.ch[u] = { k: key, v: ["dades", "dura", "calma"][Math.floor(Math.random() * 3)] }; emit(); });
      if ((S.phase === "show" || S.phase === "show2") && room.rd[u] !== key) { room.rd[u] = key; emit(); }
    });
  }
  return api;
})();

// ---------- Entrada i sala ----------
function dbmHome(G) {
  const { ctx } = G;
  const lab = dbmIsLab();
  if (!lab && !window.Online?.debat?.ok()) {
    ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card"><p class="kicker">Debat entre amics</p><h2 class="db-h">Entra amb el teu compte</h2><p class="db-lead">Per debatre amb els teus amics cal un usuari.</p><div class="db-actions"><button class="btn primary lg" data-in>Entra amb Google</button></div></div></div>`;
    $("[data-in]", ctx.body).addEventListener("click", () => window.Online?.signIn?.());
    const stop = ctx.every(800, () => { if (window.Online?.debat?.ok()) { stop(); dbmHome(G); } });
    return;
  }
  ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card">
    ${lab ? `<p class="simmp-lab">🧪 Laboratori: debat de prova amb candidats ficticis. No es desa res al núvol.</p>` : ""}
    <p class="kicker">Debat entre amics · de 2 a 4 candidats</p>
    <h2 class="db-h">Plantes cara als teus amics</h2>
    <p class="db-lead">Cada candidat respon des del seu dispositiu: tothom tria la resposta alhora, el plató reprodueix les intervencions per l'ordre sortejat i, si t'ataquen, tens torn de rèplica. Al final, l'enquesta flash diu qui ha guanyat.</p>
    <div class="simmp-two">
      <section><h4>Crea una sala</h4><button class="btn primary lg" data-new>Crea la sala</button><small>${lab ? "Hi podràs afegir fins a tres candidats ficticis." : "Rebràs un codi per convidar els teus amics."}</small></section>
      <section ${lab ? "hidden" : ""}><h4>Tens un codi?</h4><form class="simmp-join" data-join><input data-code maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="ABC123" aria-label="Codi de la sala"><button class="btn" type="submit">Entra-hi</button></form></section>
    </div>
    <div class="db-actions"><button class="btn ghost" data-back>← Canvia el candidat</button></div>
  </div></div>`;
  $("[data-back]", ctx.body).addEventListener("click", () => dbSetup(G));
  $("[data-new]", ctx.body).addEventListener("click", async (e) => { e.target.disabled = true; const code = await dbmApi().create(G.me); if (code) dbmOpen(G, code); else e.target.disabled = false; });
  $("[data-join]", ctx.body)?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = $("[data-code]", ctx.body).value.trim().toUpperCase();
    const r = await dbmApi().join(code, G.me);
    if (r.err) { if (r.err !== "connexio") toast(r.err); return; }
    dbmOpen(G, code);
  });
}
function dbmOpen(G, code) {
  G.dbm = { code, seen: null, busy: false };
  G.dbmUnsub?.();
  G.dbmUnsub = dbmApi().watch(code, (d) => dbmOnDoc(G, d));
  G.ctx.onCleanup(() => { G.dbmUnsub?.(); clearTimeout(G.dbmT); G.dbmPlato?.dispose?.(); $(".db-theater")?.remove(); document.body.classList.remove("db-lock"); });
}
function dbmOnDoc(G, d) {
  if (!G.ctx.alive()) return;
  if (!d) { toast("Aquest debat ja no existeix"); return dbmHome(G); }
  G.dbmDoc = d;
  // Trucada amb els altres candidats (trucada.js)
  if (d.players.includes(dbmUid())) window.Call?.attach({ parent: "debats", code: d.code, title: "Debat entre amics", lab: dbmIsLab(), alive: () => G.ctx.alive(),
    names: Object.fromEntries(d.players.filter((u) => !u.startsWith("bot-")).map((u) => [u, d.seats[u]?.name || "Jugador"])),
    bots: d.players.filter((u) => u.startsWith("bot-")).map((u) => d.seats[u]?.cand?.name || d.seats[u]?.name || "Candidat fictici") });
  if (d.status === "lobby") return dbmLobby(G, d);
  dbmPlay(G, d);
  dbmHostTick(G, d);
}
function dbmLobby(G, d) {
  const { ctx } = G, me = dbmUid(), host = d.host === me, lab = dbmIsLab();
  const seats = d.players.map((u) => ({ uid: u, ...d.seats[u] }));
  ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card simmp-card">
    ${lab ? `<p class="simmp-lab">🧪 Laboratori: sala de prova. No es desa res al núvol.</p>` : ""}
    <p class="kicker">Debat entre amics · sala</p>
    ${lab ? `<div class="simmp-code"><div><small>Candidats ficticis</small><b class="sm">Fins a 3</b></div><button class="btn primary" data-bot ${seats.length >= 4 ? "disabled" : ""}>+ Afegeix un candidat fictici</button></div>`
      : `<div class="simmp-code"><div><small>Codi de la sala</small><b>${esc(d.code)}</b></div><button class="btn" data-copy>Copia el codi</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Debatim al plató de Política en Joc? Entra al Simulador de debat → Debat entre amics i posa el codi ${d.code}`)}">WhatsApp</a></div>`}
    <ul class="simmp-seats">${seats.map((x) => `<li class="${x.uid === me ? "me" : ""}"><span class="db-flat-pod" style="--c:${x.cand?.color || "#888"}"><i></i><b>${esc(x.cand?.sig || "?")}</b></span><span><b>${esc(x.cand?.name || "")} · ${esc(x.cand?.party || "")}</b><small>${esc(x.name || "")}${x.uid === d.host ? " · amfitrió" : ""}${x.uid === me ? " · tu" : ""}</small></span><em>✓ A punt</em></li>`).join("")}${Array.from({ length: 4 - seats.length }, () => `<li class="free"><span class="simmp-nologo">+</span><span><b>Lloc lliure</b></span></li>`).join("")}</ul>
    <div class="db-actions">${host ? `<button class="btn primary lg" data-start ${seats.length >= 2 ? "" : "disabled"}>Comença el debat 🎬</button>` : `<p class="simmp-note">Esperant que ${esc(d.seats[d.host]?.name || "l'amfitrió")} comenci el debat.</p>`}</div>
    ${host && seats.length < 2 ? `<p class="simmp-note">Cal almenys un altre candidat.</p>` : ""}
    <p class="db-fiction">Debat de ficció entre els candidats dels jugadors. Tot és inventat.</p>
  </div></div>`;
  $("[data-bot]", ctx.body)?.addEventListener("click", () => { Sfx.play("pick"); DbLab.addBot(); });
  $("[data-copy]", ctx.body)?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(d.code); toast("Codi copiat"); } catch { toast(d.code); } });
  $("[data-start]", ctx.body)?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    const S = dbmNew({ seed: `${d.code}-${Date.now().toString(36)}`, players: d.players.map((u) => ({ uid: u, cand: d.seats[u].cand })) });
    S.dl = Date.now() + DBM_TRIA + 15000;
    await dbmApi().host(d.code, { status: "playing", st: JSON.stringify(S) });
  });
}

// ---------- L'amfitrió fa avançar el debat ----------
async function dbmHostTick(G, d) {
  if (d.host !== dbmUid() || d.status !== "playing" || !d.st || G.dbmHosting) return;
  const S = JSON.parse(d.st), key = `${S.bi}:${S.phase}`, now = Date.now();
  const late = now >= (S.dl || 0);
  const save = async (status) => { G.dbmHosting = true; try { await dbmApi().host(d.code, { st: JSON.stringify(S), ...(status ? { status } : {}) }); } finally { G.dbmHosting = false; } };
  clearTimeout(G.dbmT);
  G.dbmT = setTimeout(() => G.ctx.alive() && G.dbmDoc && dbmHostTick(G, G.dbmDoc), Math.max(500, (S.dl || now) - now + 300));
  if (S.phase === "tria") {
    if (!late && !S.order.every((u) => d.ch?.[u]?.k === key)) return;
    dbmRound(S, Object.fromEntries(S.order.map((u) => [u, d.ch?.[u]?.k === key ? d.ch[u].v : null])));
    S.dl = now + DBM_SHOW;
    return save();
  }
  if (S.phase === "show" || S.phase === "show2") {
    if (!late && !S.order.every((u) => d.rd?.[u] === key)) return;
    if (S.phase === "show" && dbmReplyers(S).length) { S.phase = "replica"; S.dl = now + DBM_REPLICA; return save(); }
    dbmNext(S);
    S.dl = now + DBM_TRIA;
    return save(S.phase === "fi" ? "done" : null);
  }
  if (S.phase === "replica") {
    const who = dbmReplyers(S);
    if (!late && !who.every((u) => d.ch?.[u]?.k === key)) return;
    dbmReply(S, Object.fromEntries(who.map((u) => [u, d.ch?.[u]?.k === key ? d.ch[u].v : null])));
    S.dl = now + DBM_SHOW;
    return save();
  }
}

// ---------- El plató ----------
async function dbmPlay(G, d) {
  const S = JSON.parse(d.st), me = dbmUid();
  G.dbmS = S;
  if (!G.dbmT0) {
    G.dbmT0 = true;
    await dbmTheater(G, S);
  }
  if (!G.dbmTheaterReady) return;
  dbmClocks(G, S);
  const key = `${S.bi}:${S.phase}`;
  if (G.dbm.busy) return; // ja s'està reproduint alguna cosa: en acabar, es mira l'últim estat
  if (G.dbm.seen === key) { dbmWaitPaint(G, d, S); return; }
  G.dbm.seen = key;
  G.dbm.busy = true;
  try {
    if (S.phase === "fi" || d.status === "done") return dbmFinish(G, S);
    const block = S.blocks[S.bi], B = DB_BLOCKS[block];
    if (S.phase === "tria") {
      $("[data-blockname]", G.T).textContent = `${S.bi + 1}/${S.blocks.length} · ${B.title}`;
      G.dbmPlato.screen(B.title.toUpperCase(), `BLOC ${S.bi + 1} DE ${S.blocks.length}`);
      if (S.bi === 0) { G.dbmPlato.shot("wide"); await dbmSay(G, "mod", `Bona nit i benvinguts al debat. Avui ens acompanyen ${S.order.map((u) => S.cand[u].name).join(", ")}. L'ordre d'intervenció s'ha sortejat: ${S.order.map((u) => dbmSurname(S, u)).join(", ")}.`); }
      await dbmSay(G, "mod", S.q[S.bi]);
      dbmChoose(G, S, d);
    } else if (S.phase === "show") {
      const R = S.rounds[S.bi];
      for (const sp of R.speeches) {
        await dbmSay(G, "mod", sp.k === "silenci" ? `${dbmTract(S, sp.uid, "voc")}, és el seu torn… ${dbmTract(S, sp.uid, "cap")} es queda en silenci.` : `Té la paraula ${dbmTract(S, sp.uid)}.`, { fast: true });
        if (sp.target) G.dbmPlato.react(sp.target, "shake");
        if (sp.k !== "silenci") await dbmSay(G, sp.uid, sp.quote, { cutaway: sp.target });
        dbmMeters(G, S, sp.uid, sp.d);
        if (sp.cut) await dbmSay(G, "mod", `${dbmTract(S, sp.uid, "voc")}, se li ha acabat el temps.`, { fast: true });
      }
      await dbmApi().ready(d.code, key);
    } else if (S.phase === "replica") {
      const who = dbmReplyers(S);
      if (who.includes(me)) dbmReplyAsk(G, S, d);
      else dbmPanel(G, `<p class="db-ask-t">Torn de rèplica</p><p class="db-ask-s">${who.map((u) => esc(S.cand[u].name)).join(" i ")} ${who.length > 1 ? "preparen" : "prepara"} la rèplica…</p>`);
    } else if (S.phase === "show2") {
      for (const rp of S.rounds[S.bi].replies) {
        await dbmSay(G, "mod", `Per al·lusions, ${dbmTract(S, rp.uid)}.`, { fast: true });
        if (rp.k) await dbmSay(G, rp.uid, rp.line, { cutaway: rp.to });
        dbmMeters(G, S, rp.uid, rp.d);
      }
      await dbmApi().ready(d.code, key);
    }
  } catch (e) { if (e !== "fi") console.warn(e); } finally {
    G.dbm.busy = false;
    // Si mentrestant ha canviat l'estat, es mira el darrer
    if (G.ctx.alive() && G.dbmDoc && G.dbmDoc.st !== d.st) dbmPlay(G, G.dbmDoc);
    else if (G.dbmDoc) dbmWaitPaint(G, G.dbmDoc, S);
  }
}
async function dbmTheater(G, S) {
  const me = dbmUid();
  const num = (c) => parseInt(String(c || "#f1cbb0").replace("#", ""), 16);
  const cands = S.order.map((u, i) => { const c = S.cand[u]; return { id: u, name: c.name, sig: c.sig, color: c.color, me: u === me, seed: 11 + i * 7, look: c.look, age: 44, skin: num(c.skin), hair: num(c.hairC) }; });
  const T = h(`<div class="db-theater" role="dialog" aria-modal="true" aria-label="Debat entre amics">
    <div class="db-stage"><div class="db-flash"></div><div class="db-loading"><span class="dot-live"></span> Preparant el plató…</div><div class="db-lower" data-lower hidden><span class="db-who" data-who></span><p class="db-say" data-say></p></div></div>
    <div class="db-top"><span class="db-live"><i></i>EN DIRECTE</span><span class="db-net">Debat entre amics</span><span class="db-blockname" data-blockname></span><button type="button" class="db-x" data-exit aria-label="Surt del debat">✕</button></div>
    <div class="db-clocks" data-clocks></div>
    <aside class="db-meters dbm-meters" aria-label="Com va el debat"><span class="db-m-h">Medidor en directe</span><ul data-imps></ul></aside>
    <div class="db-panel" data-panel></div>
    <div class="db-ticker"><span class="db-tick-h">Debat</span><span class="db-tick" data-tick>${S.order.map((u) => esc(S.cand[u].sig)).join(" · ")} · #DebatEntreAmics</span></div>
  </div>`);
  document.body.appendChild(T);
  document.body.classList.add("db-lock");
  G.T = T;
  const stage = $(".db-stage", T);
  try {
    const mod = await import(new URL("js/debat/debat-plato.js?v=40", window.PEJ_CDN || document.baseURI).href);
    G.dbmPlato = await mod.createPlato(stage, { cands, title: "DEBAT 29N", net: "DEBAT ENTRE AMICS" });
  } catch (e) {
    console.warn("Plató 3D no disponible: " + (e?.message || e));
    G.dbmPlato = dbFlatStudio(stage, cands);
  }
  $(".db-loading", stage)?.remove();
  $("[data-exit]", T).addEventListener("click", () => { if (confirm("Vols sortir del debat?")) { G.dbmPlato?.dispose?.(); T.remove(); document.body.classList.remove("db-lock"); location.hash = "#simulador"; } });
  G.dbmTheaterReady = true;
  dbmMeters(G, S);
}
// Algú parla: pla, rètol i text a màquina d'escriure
async function dbmSay(G, id, text, { cutaway = null, fast = false } = {}) {
  const { ctx, T, dbmPlato: plato } = G, S = G.dbmS;
  if (!ctx.alive() || !T.isConnected) throw "fi";
  plato.shot(id === "mod" ? "mod" : id);
  plato.speak(id);
  const w = id === "mod" ? { name: DB_MOD.name, sub: DB_MOD.role, color: "#ffcf3d" } : { name: S.cand[id].name, sub: S.cand[id].party, color: S.cand[id].color };
  const lower = $("[data-lower]", T);
  lower.hidden = false;
  lower.style.setProperty("--c", w.color);
  $("[data-who]", T).innerHTML = `<i></i><b>${esc(w.name)}</b><small>${esc(w.sub)}</small>`;
  const el = $("[data-say]", T);
  G.dbmTalking = id;
  dbmClocks(G, S);
  let cutDone = false;
  for (let i = 0; i <= text.length; i += 2) {
    el.textContent = text.slice(0, i);
    if (cutaway && !cutDone && i > text.length * 0.5 && text.length > 50) { cutDone = true; plato.shot(cutaway); plato.react(cutaway, "shake"); ctx.after(1000, () => T.isConnected && plato.shot(id)); }
    await dbWait(ctx, fast ? 10 : 22);
    if (!ctx.alive() || !T.isConnected) throw "fi";
  }
  el.textContent = text;
  G.dbmTalking = null;
  dbmClocks(G, S);
  await dbWait(ctx, fast ? 500 : 1300);
}
// Medidor: la impressió de cada candidat, amb la seva corba
function dbmMeters(G, S, upto = null, d = null) {
  const box = $("[data-imps]", G.T);
  if (!box) return;
  box.innerHTML = S.order.map((u) => {
    const P = S.P[u], c = S.cand[u];
    const pts = P.curve.slice(-14);
    const path = pts.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, pts.length - 1)) * 60} ${20 - ((Math.max(20, Math.min(80, v)) - 20) / 60) * 20}`).join("");
    const dv = u === upto && d ? (d.indecisos || 0) : 0;
    return `<li class="${u === dbmUid() ? "me" : ""}" style="--pc:${c.color}"><i></i><b>${esc(c.sig)}</b><svg viewBox="0 0 60 20" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg><strong>${dbmImp(P.seg)}</strong>${dv ? `<em class="${dv > 0 ? "up" : "down"}">${dv > 0 ? "+" : ""}${fmtDb(dv)}</em>` : ""}</li>`;
  }).join("");
}
function dbmClocks(G, S) {
  const box = $("[data-clocks]", G.T);
  if (!box) return;
  box.innerHTML = S.order.map((u) => { const t = S.P[u].time, c = S.cand[u]; return `<span class="db-clk ${u === dbmUid() ? "me" : ""} ${G.dbmTalking === u ? "on" : ""} ${t < 30 ? "low" : ""} ${t <= 0 ? "out" : ""}" style="--c:${c.color}"><i></i><b>${esc(c.sig)}</b><em>${dbClock(Math.max(0, t))}</em></span>`; }).join("");
}
function dbmPanel(G, html) { const p = $("[data-panel]", G.T); if (p) p.innerHTML = html; return p; }
// Tria la resposta del bloc (amb compte enrere fins al límit de l'amfitrió)
function dbmChoose(G, S, d) {
  const me = dbmUid(), key = `${S.bi}:tria`;
  if (d.ch?.[me]?.k === key) return dbmWaitPaint(G, d, S);
  const cards = dbmCards(S, me);
  const block = S.blocks[S.bi];
  const left = () => Math.max(0, Math.round(((S.dl || Date.now()) - Date.now()) / 1000));
  const p = dbmPanel(G, `<div class="db-ask"><p class="db-ask-t">${block === "obertura" ? "Com et presentes?" : block === "tancament" ? "El teu minut d'or" : "Com respons?"} <span class="db-ask-clock" data-clock>${left()}</span></p><p class="db-ask-s">Tria abans que s'acabi el temps o et quedaràs en silenci. Et queden ${dbClock(S.P[me].time)}.</p>
    <div class="db-opts">${cards.map((c, i) => `<button type="button" class="db-opt" data-o="${i}"><span class="db-opt-i">${c.icon}</span><span class="db-opt-b"><b>${esc(c.label)}</b><q>${esc(c.quote)}</q></span><span class="db-opt-s ${c.secs > S.P[me].time ? "over" : ""}">${c.secs} s</span></button>`).join("")}</div></div>`);
  const tick = G.ctx.every(1000, () => { const c = $("[data-clock]", p); if (!c) return tick(); c.textContent = left(); c.classList.toggle("hot", left() <= 5); });
  $$("[data-o]", p).forEach((b) => b.addEventListener("click", async () => {
    tick();
    Sfx.play("pick");
    $$("[data-o]", p).forEach((x) => { x.disabled = true; x.classList.toggle("picked", x === b); });
    await dbmApi().choose(d.code, key, Number(b.dataset.o));
  }, { once: true }));
}
function dbmReplyAsk(G, S, d) {
  const me = dbmUid(), key = `${S.bi}:replica`;
  const from = S.rounds[S.bi].attacks.filter((a) => a.to === me).map((a) => S.cand[a.from].name);
  const p = dbmPanel(G, `<div class="db-ask"><p class="db-ask-t">T'ataca ${esc(from.join(" i "))}</p><p class="db-ask-s">Tens uns segons per replicar.</p>
    <div class="db-opts">${DBM_REPLY.map((o) => `<button type="button" class="db-opt" data-r="${o.k}"><span class="db-opt-b"><b>${esc(o.label)}</b><small>${esc(o.d)}</small></span></button>`).join("")}</div></div>`);
  $$("[data-r]", p).forEach((b) => b.addEventListener("click", async () => { Sfx.play("pick"); $$("[data-r]", p).forEach((x) => { x.disabled = true; }); await dbmApi().choose(d.code, key, b.dataset.r); }, { once: true }));
}
// Mentre s'espera els altres
function dbmWaitPaint(G, d, S) {
  const key = `${S.bi}:${S.phase}`;
  if (S.phase === "tria" && d.ch?.[dbmUid()]?.k !== key) return;
  if (S.phase === "replica" && dbmReplyers(S).includes(dbmUid()) && d.ch?.[dbmUid()]?.k !== key) return;
  const done = (u) => (S.phase === "tria" || S.phase === "replica" ? d.ch?.[u]?.k === key : d.rd?.[u] === key);
  const who = S.phase === "replica" ? dbmReplyers(S) : S.order;
  dbmPanel(G, `<div class="db-ask"><p class="db-ask-t">${S.phase === "tria" ? "Resposta enviada" : S.phase === "replica" ? "Rèplica enviada" : "Esperant els altres"}</p><p class="db-ask-s">${who.map((u) => `${done(u) ? "✓" : "…"} ${esc(S.cand[u].name)}`).join(" · ")}</p></div>`);
}

// ---------- Resultat ----------
function dbmFinish(G, S) {
  const { ctx } = G, me = dbmUid();
  if (G.dbmFinished) return;
  G.dbmFinished = true;
  G.dbmUnsub?.();
  clearTimeout(G.dbmT);
  const res = dbmResult(S);
  G.dbmPlato?.dispose?.();
  G.T?.remove();
  document.body.classList.remove("db-lock");
  const rank = res.poll.findIndex((p) => p.uid === me) + 1;
  const mine = res.poll.find((p) => p.uid === me);
  if (rank === 1) ctx.achieve("debat-guanya");
  const segL = { base: "Els seus votants", indecisos: "Indecisos", rivals: "Votants dels altres" };
  const max = res.poll[0].pct;
  const extraHtml = `<div class="db-result">
    <h3 class="db-h3">Enquesta flash: qui ha guanyat el debat?</h3>
    <ul class="db-poll">${res.poll.map((p) => `<li class="${p.uid === me ? "me" : ""}" style="--pc:${p.color}"><span>${esc(p.name)}<small>${esc(p.sig)}</small></span><span class="db-poll-t"><i style="width:${(p.pct / max) * 100}%"></i></span><b>${fmtDb(p.pct)} %</b></li>`).join("")}</ul>
    <p class="db-ficha">Enquesta telefònica a 1.000 espectadors del debat, feta en acabar. Marge d'error: ±3,1 punts. Ficció.</p>
    <div class="db-after"><div class="db-byseg" style="grid-column:1/-1"><small>Qui guanya a cada grup</small>${res.bySeg.map((g) => `<span><em>${segL[g.k]}</em><b>${g.uid === me ? "Tu" : esc(dbSurname(S.cand[g.uid].name))}</b><i>${fmtDb(g.pct)} %</i></span>`).join("")}</div></div>
    <h3 class="db-h3">Les portades de demà</h3>
    <div class="db-papers">${res.papers.map((p) => `<article class="db-paper"><small>${esc(p.paper)}</small><b>${esc(p.h)}</b></article>`).join("")}</div>
    <p class="db-fiction">Debat de ficció entre els candidats dels jugadors.</p>
  </div>`;
  DbOpts.amics = {};
  ctx.finish({
    score: Math.round((mine?.pct || 0) * 10), xp: rank === 1 ? 60 : 30, extraHtml,
    unit: "punts · debat entre amics", ratio: rank === 1 ? 0.8 : 0.4,
    verdict: rank === 1 ? "Has guanyat el debat contra els teus amics!" : `Quedes ${rank === 2 ? "segon" : rank === 3 ? "tercer" : "quart"} a l'enquesta flash.`,
  });
}
