// Simulador del 29N · Campanya contra amics: pantalles (entrada, sala, espera) i sincronització amb la sala en línia.
// El motor de la partida compartida és a sim-multi.js; la sala, a online.js (Online.camp).
// Cada jugador juga la seva vista del món amb les pantalles de sempre. Quan acaba el dia, el puja i espera els altres;
// quan tothom ha acabat, qualsevol dels jugadors tanca el dia (és determinista) i comença el següent per a tothom.

// Quan la veurà tothom. Fins llavors, només es pot provar des del Laboratori del Centre de control, amb una sala local
// i amics ficticis (sim-lab.js), sense escriure res a Firestore.
const SIM_AMICS_FROM = Infinity;
const simAmicsPublic = () => Date.now() >= SIM_AMICS_FROM;
const simAmicsOn = () => simAmicsPublic() || (typeof featPreview === "function" && featPreview("amics"));
const simMpIsLab = () => !simAmicsPublic() && typeof featPreview === "function" && featPreview("amics");
// La sala: la de Firestore (online.js) o, al laboratori, la local
const simMpApi = () => (simMpIsLab() ? SimLab : window.Online.camp);

// El dia en curs ({ code, day, state }), per si es tanca l'app a mitges. Per usuari: dos comptes al mateix dispositiu no es trepitgen.
const simMpLocalKey = () => `r29n-sim-amics-${simMpUid() || "x"}`;
const SIM_MP_WAIT_FORCE = 3 * 60 * 1000; // al cap de 3 minuts d'esperar, es pot tancar el dia sense qui falta

const simMpLink = (code) => `${location.origin}${location.pathname.replace(/index\.html$/, "")}#simulador/amics-${code}`;
const simMpUid = () => (simMpIsLab() ? SimLab.uid() : window.Online?.camp?.uid());
function simMpSaveLocal(G) {
  if (!G.mp) return;
  store.set(simMpLocalKey(), { code: G.mp.code, day: G.mp.day, state: G.state });
  simMpProgress(G);
}
// Els altres veuen per on vas (dia i franges), sense escriure a cada clic
function simMpProgress(G) {
  clearTimeout(G.mpProgT);
  G.mpProgT = setTimeout(() => {
    const s = G.state;
    if (!G.mp || !s) return;
    const prog = { day: G.mp.day, slot: s.slot || 0, stage: s.stage || "campaign" };
    if (JSON.stringify(prog) === JSON.stringify(G.mpLastProg)) return;
    G.mpLastProg = prog;
    simMpApi().setSeat(G.mp.code, { prog });
  }, 1500);
}

// ---------- Entrada ----------
function simMpEnter(G) {
  const { ctx } = G;
  ctx.hud([]);
  if (!simAmicsOn()) { SimOpts.amics = null; return simCreate(G); }
  if (!simMpIsLab() && !window.Online?.camp?.ok()) return simMpSignIn(G);
  const code = SimOpts.amics?.code;
  if (code) return simMpOpen(G, code, true);
  simMpHome(G);
}
function simMpSignIn(G) {
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card">
    <p class="sim-kick">Campanya contra amics</p>
    <h3 class="sim-h">Entra amb el teu compte</h3>
    <p class="sim-lead">Per jugar contra amics cal un usuari: és com et veuran els altres jugadors. Només és un clic amb Google.</p>
    <div class="sim-actions-row"><button class="btn primary lg" data-in>Entra amb Google</button></div>
  </div></div>`);
  $("[data-in]", el).addEventListener("click", () => window.Online?.signIn?.());
  // Quan la sessió estigui a punt, continua sol
  const stop = G.ctx.every(800, () => { if (window.Online?.camp?.ok()) { stop(); simMpEnter(G); } });
}

async function simMpHome(G) {
  const lab = simMpIsLab();
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card">
    ${lab ? `<p class="simmp-lab">🧪 Laboratori: aquesta campanya és de prova. Hi jugues amb amics ficticis, en aquesta pestanya, i no es desa res al núvol.</p>` : ""}
    <p class="sim-kick">Campanya contra amics · de 2 a 4 jugadors</p>
    <h3 class="sim-h">Competiu per les mateixes eleccions</h3>
    <p class="sim-lead">Cadascú funda el seu partit i tots feu campanya al mateix país, contra els partits reals i entre vosaltres: els vostres mítings, anuncis i atacs es disputen els mateixos votants. Cada dia, tothom fa les seves tres franges; quan tots heu acabat, passa la nit, surt l'enquesta i comença el dia següent.</p>
    <div class="simmp-two">
      <section>
        <h4>Crea una sala</h4>
        <div class="sim-diffs" role="radiogroup" aria-label="Dificultat"><span>Dificultat</span>${Object.entries(SIM_DIFF).map(([k, d]) => `<label><input type="radio" name="simmp-diff" value="${k}" ${k === "normal" ? "checked" : ""}><span>${d.label}</span></label>`).join("")}</div>
        <button class="btn primary lg" data-new>Crea la sala</button>
        <small>${lab ? "A la sala hi podràs afegir fins a tres amics ficticis." : "Rebràs un codi i un enllaç per convidar els teus amics."}</small>
      </section>
      <section ${lab ? "hidden" : ""}>
        <h4>Tens un codi?</h4>
        <form class="simmp-join" data-join><input data-code maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="ABC123" aria-label="Codi de la sala"><button class="btn" type="submit">Entra-hi</button></form>
        <p class="simmp-err" data-err role="alert"></p>
      </section>
    </div>
    <div data-mine></div>
  </div></div>`);
  $("[data-new]", el).addEventListener("click", async (e) => {
    e.target.disabled = true;
    const diff = $("input[name=simmp-diff]:checked", el)?.value || "normal";
    const code = await simMpApi().create(diff);
    if (!code) { e.target.disabled = false; return; }
    Sfx.play("pick");
    simMpOpen(G, code, false);
  });
  $("[data-join]", el).addEventListener("submit", (e) => {
    e.preventDefault();
    const code = $("[data-code]", el).value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) { $("[data-err]", el).textContent = "El codi té sis lletres o xifres."; return; }
    simMpOpen(G, code, true);
  });
  // Les meves campanyes en curs
  const mine = await simMpApi().mine();
  if (!G.ctx.alive() || !mine.length) return;
  const box = $("[data-mine]", el);
  if (!box) return;
  box.innerHTML = `<h4 class="sim-h4">Les teves campanyes</h4><ul class="simmp-mine">${mine.map((d) => {
    const n = d.players.length;
    const what = d.status === "lobby" ? `A la sala · ${n} ${n === 1 ? "jugador" : "jugadors"}` : `Dia ${Math.min(d.day, 6)} de 6`;
    return `<li><button class="sim-choice" data-open="${esc(d.code)}"><b>${esc(d.code)}</b><small>${what} · ${d.players.map((u) => esc(d.seats?.[u]?.name || "?")).join(", ")}</small></button></li>`;
  }).join("")}</ul>`;
  $$("[data-open]", box).forEach((b) => b.addEventListener("click", () => simMpOpen(G, b.dataset.open, false)));
}

// Entra a una sala (unint-s'hi si cal) i n'escolta els canvis
async function simMpOpen(G, code, join) {
  if (join) {
    const r = await simMpApi().join(code);
    if (r.err) {
      if (r.err !== "connexio") toast(r.err);
      SimOpts.amics = {};
      return simMpHome(G);
    }
  }
  SimOpts.amics = { code };
  G.mpCode = code;
  G.mpUnsub?.();
  G.mpUnsub = simMpApi().watch(code, (d) => simMpOnDoc(G, d));
  G.ctx.onCleanup(() => { G.mpUnsub?.(); $(".simmp-strip")?.remove(); $(".simchat")?.remove(); G.chatOpen = false; clearTimeout(G.mpProgT); });
}

function simMpOnDoc(G, d) {
  if (!G.ctx.alive()) return;
  if (!d) { toast("Aquesta campanya ja no existeix"); G.mpUnsub?.(); G.mp = null; SimOpts.amics = {}; return simMpHome(G); }
  G.mpDoc = d;
  const uid = simMpUid();
  if (!d.players.includes(uid)) { G.mpUnsub?.(); G.mp = null; SimOpts.amics = {}; return simMpHome(G); }
  if (d.status === "lobby") { if (!G.mpCreating) simMpLobby(G, d); return; }
  simMpPlaying(G, d);
}

// ---------- La sala ----------
function simMpLobby(G, d) {
  const uid = simMpUid();
  const host = d.host === uid;
  const seats = d.players.map((u) => ({ uid: u, ...d.seats[u] }));
  const mine = d.seats[uid];
  const sigs = seats.filter((x) => x.party).map((x) => simNorm(x.party.sig));
  const dup = sigs.length !== new Set(sigs).size;
  const canStart = host && seats.length >= 2 && seats.every((x) => x.party) && !dup;
  const why = seats.length < 2 ? "Cal almenys un amic a la sala." : !seats.every((x) => x.party) ? "Tothom ha de tenir el partit creat." : dup ? "Dos partits tenen les mateixes sigles: un dels dos les ha de canviar." : "";
  const lab = simMpIsLab();
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card">
    ${lab ? `<p class="simmp-lab">🧪 Laboratori: sala de prova amb amics ficticis. No es desa res al núvol.</p>` : ""}
    <p class="sim-kick">Campanya contra amics · sala</p>
    ${lab ? `<div class="simmp-code"><div><small>Amics ficticis</small><b class="sm">Fins a 3</b></div><button class="btn primary" data-bot ${seats.length >= 4 ? "disabled" : ""}>+ Afegeix un amic fictici</button></div>` : `<div class="simmp-code"><div><small>Codi de la sala</small><b>${esc(d.code)}</b></div><button class="btn" data-copy>Copia l'enllaç</button>${navigator.share ? `<button class="btn" data-share>Comparteix</button>` : ""}</div>`}
    <ul class="simmp-seats">${seats.map((x) => `<li class="${x.uid === uid ? "me" : ""}">
      ${x.party ? simLogoSvg({ ...x.party, id: x.uid }, 40) : `<span class="simmp-nologo" aria-hidden="true">?</span>`}
      <span><b>${x.party ? esc(x.party.name) : "Encara sense partit"}</b><small>${esc(x.name || "Jugador")}${x.uid === d.host ? " · amfitrió" : ""}${x.uid === uid ? " · tu" : ""}</small></span>
      <em>${x.party ? "✓ A punt" : "Creant…"}</em>
    </li>`).join("")}${Array.from({ length: 4 - seats.length }, () => `<li class="free"><span class="simmp-nologo" aria-hidden="true">+</span><span><b>Lloc lliure</b><small>Comparteix el codi</small></span></li>`).join("")}</ul>
    <div class="sim-actions-row">
      <button class="btn ${mine.party ? "" : "primary lg"}" data-party>${mine.party ? "Canvia el teu partit" : "Crea el teu partit"}</button>
      ${host ? `<button class="btn primary lg" data-start ${canStart ? "" : "disabled"}>Comença la campanya</button>` : ""}
    </div>
    ${host && why ? `<p class="simmp-note">${why}</p>` : ""}
    ${!host ? `<p class="simmp-note">${mine.party ? `Esperant que ${esc(d.seats[d.host]?.name || "l'amfitrió")} comenci la campanya.` : "Crea el teu partit mentre arriben els altres."}</p>` : ""}
    <p class="simmp-note">Dificultat: <b>${SIM_DIFF[d.diff]?.label || ""}</b>. Sis dies de campanya, la jornada de reflexió i la nit electoral. Guanya qui tregui més escons.</p>
    <div class="sim-actions-row"><button class="btn ghost" data-leave>${host && seats.length === 1 ? "Esborra la sala" : "Surt de la sala"}</button></div>
  </div></div>`);
  $("[data-bot]", el)?.addEventListener("click", () => { Sfx.play("pick"); SimLab.addBot(); });
  $("[data-copy]", el)?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(simMpLink(d.code)); toast("Enllaç copiat"); } catch { toast(simMpLink(d.code)); }
  });
  $("[data-share]", el)?.addEventListener("click", () => navigator.share({ title: "Campanya contra amics · Política en Joc", text: `Funda el teu partit i competim per les eleccions! Codi: ${d.code}`, url: simMpLink(d.code) }).catch(() => {}));
  $("[data-party]", el).addEventListener("click", () => {
    G.mpCreating = true;
    G.mpCreate = async (P) => {
      G.mpCreating = false;
      const taken = d.players.filter((u) => u !== uid && G.mpDoc.seats[u]?.party).map((u) => simNorm(G.mpDoc.seats[u].party.sig));
      if (taken.includes(simNorm(P.sig))) toast("Un altre jugador ja fa servir aquestes sigles: canvia-les perquè es pugui començar");
      await simMpApi().setSeat(d.code, { party: P, ready: true });
      simMpLobby(G, G.mpDoc);
    };
    simCreate(G);
  });
  $("[data-start]", el)?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    const W = simMpNew({ seed: d.seed, diff: d.diff, players: d.players.map((u) => ({ party: d.seats[u].party, name: d.seats[u].name })) });
    const ok = await simMpApi().start(d.code, JSON.stringify(W));
    if (ok === null) e.target.disabled = false;
    else Sfx.play("win");
  });
  $("[data-leave]", el).addEventListener("click", async () => {
    if (!confirm(host && seats.length === 1 ? "S'esborrarà la sala. Continuar?" : "Vols sortir de la sala?")) return;
    G.mpUnsub?.();
    if (lab || (host && seats.length === 1)) await simMpApi().remove(d.code);
    else await simMpApi().leave(d.code);
    SimOpts.amics = {};
    simMpHome(G);
  });
}

// ---------- La partida ----------
function simMpPlaying(G, d) {
  const uid = simMpUid();
  const hid = `h${d.players.indexOf(uid)}`;
  simMpStrip(G, d);
  if (!G.mp || G.mp.code !== d.code) {
    // Primera vegada: el dia en curs, amb el que ja hagis fet si l'havies començat en aquest dispositiu
    const W = JSON.parse(d.world);
    G.mp = { code: d.code, hid, day: d.day, W };
    const local = store.get(simMpLocalKey(), null);
    const sent = d.turn?.[uid]?.day === d.day;
    if (local?.code === d.code && local.day === d.day && local.state) G.state = local.state;
    else if (!sent && W.phase === "campaign") return simMpNewDay(G, W, d.day > 1);
    else G.state = simMpView(W, hid);
    if (sent && W.phase === "campaign") G.state.stage = "waiting";
    simGo(G);
  } else if (d.day > G.mp.day) {
    // Ha començat un dia nou (o s'ha acabat la campanya)
    const W = JSON.parse(d.world);
    if (G.state?.stage !== "waiting" && G.state?.phase === "campaign") toast("Els altres han tancat el dia sense tu: el que no havies enviat no compta");
    return simMpNewDay(G, W, true);
  }
  if (G.state?.stage === "waiting") simMpWaitingPaint(G, d);
  // Després de les eleccions: la negociació es torna a pintar amb cada canvi (pactes, votacions)
  if (G.state?.stage === "mp-neg") simMpNeg(G);
  simChatPaint(G);
  simMpMaybeResolve(G, d);
}

// Un dia nou per a tu: la teva vista del món, l'imprevist (si toca) i l'informatiu de la nit
function simMpNewDay(G, W, news) {
  const d = G.mpDoc;
  G.mp.W = W;
  G.mp.day = d.day;
  G.mp.sentAt = 0;
  const s = (G.state = simMpView(W, G.mp.hid));
  if (s.phase !== "campaign") s.stage = "reflection";
  else if (SIM_EVENT_DAYS.includes(s.day) && news) {
    const ev = simPickEvent(s);
    if (ev) { s.stage = "event"; s.pendingEvent = ev.id; } else s.stage = "campaign";
  } else s.stage = "campaign";
  simSave(G);
  simHud(G, "dia");
  if (!news) return simGo(G);
  const pubs = s.polls.filter((p) => !p.internal);
  const poll = pubs[pubs.length - 1]?.day === s.day ? pubs[pubs.length - 1] : null;
  simNewscast(G, s.day - 1, { moves: simMpMoves(W, G.mp.hid), poll });
}

// Has acabat el dia: s'envia i s'espera els altres
function simMpEndMyDay(G, debate) {
  const send = async () => {
    const s = G.state;
    s.stage = "waiting";
    simSave(G);
    simMpWaiting(G);
    const ok = await simMpApi().submit(G.mp.code, G.mp.day, JSON.stringify(simMpUnview(s, G.mp.hid)));
    if (ok === null) {
      s.stage = "campaign";
      simSave(G);
      return simCampaign(G);
    }
    G.mp.sentAt = Date.now();
    simMpWaitingPaint(G, G.mpDoc);
  };
  if (debate) simDebateResult(G, debate, send);
  else send();
}

function simMpWaiting(G) {
  simHud(G);
  const s = G.state;
  simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card simmp-wait">
    <p class="sim-kick">Dia ${s.day} de ${s.days} · fet</p>
    <h3 class="sim-h">Esperant els altres candidats</h3>
    <p class="sim-lead">Quan tothom hagi acabat el dia, passarà la nit: els rivals mouran fitxa, sortirà l'enquesta del matí i començarà el dia següent.</p>
    <ul class="simmp-seats" data-who></ul>
    <div data-force></div>
  </div></div>`);
  G.mp.sentAt = G.mp.sentAt || Date.now();
  if (G.mpDoc) simMpWaitingPaint(G, G.mpDoc);
  // Per tornar a pintar el botó de tancar el dia quan passi l'estona d'espera
  clearInterval(G.mpWaitT);
  G.mpWaitT = setInterval(() => { if (!G.ctx.alive() || G.state?.stage !== "waiting") return clearInterval(G.mpWaitT); simMpWaitingPaint(G, G.mpDoc); }, 15000);
}
function simMpWaitingPaint(G, d) {
  const box = $("[data-who]");
  if (!box || !d) return;
  const W = G.mp.W;
  box.innerHTML = d.players.map((u, k) => {
    const P = W.hum[`h${k}`]?.me;
    const done = d.turn?.[u]?.day === d.day;
    const prog = d.seats[u]?.prog;
    const how = done ? "✓ Ha acabat el dia" : prog?.day === d.day ? `Fent campanya · ${prog.slot || 0} de 3 franges` : "Encara no ha començat el dia";
    return `<li class="${u === simMpUid() ? "me" : ""} ${done ? "ok" : ""}">${P ? simLogoSvg(P, 34) : ""}<span><b>${esc(P?.name || "")}</b><small>${esc(d.seats[u]?.name || "")}</small></span><em>${how}</em></li>`;
  }).join("");
  const force = $("[data-force]");
  const waited = G.mp.sentAt && Date.now() - G.mp.sentAt > SIM_MP_WAIT_FORCE;
  const missing = d.players.filter((u) => d.turn?.[u]?.day !== d.day).length;
  if (force) force.innerHTML = waited && missing ? `<p class="simmp-note">Si algú no pot continuar ara, podeu tancar el dia sense ell: aquell dia no farà campanya.</p><button class="btn" data-go>Tanca el dia sense els que falten</button>` : "";
  $("[data-go]", force || document)?.addEventListener("click", () => {
    if (!confirm("Es tancarà el dia i qui no hagi acabat es quedarà sense campanya avui. Continuar?")) return;
    G.mp.force = d.day;
    simMpMaybeResolve(G, G.mpDoc);
  });
}

// Si tothom ha acabat (o s'ha decidit tancar sense els que falten), es tanca el dia
async function simMpMaybeResolve(G, d) {
  if (d.status !== "playing" || G.mp.resolving === d.day) return;
  const turns = d.players.map((u) => d.turn?.[u]);
  const all = turns.every((t) => t?.day === d.day);
  if (!all && G.mp.force !== d.day) return;
  // Només tanca qui ja ha enviat el seu dia
  if (d.turn?.[simMpUid()]?.day !== d.day) return;
  G.mp.resolving = d.day;
  const base = JSON.parse(d.world);
  const worlds = turns.map((t) => (t?.day === d.day ? JSON.parse(t.world) : base));
  const W2 = simMpEndDay(base, worlds);
  // L'últim dia de campanya, la sala ja queda preparada per a la negociació (pactes i investidura)
  const last = W2.phase !== "campaign";
  await simMpApi().resolve(d.code, d.day, JSON.stringify(W2), last, last ? { neg: simMpNegInit() } : {});
}

// Franja amb els altres jugadors, sempre visible durant la partida
function simMpStrip(G, d) {
  let el = $(".simmp-strip");
  if (!el) { el = h(`<aside class="simmp-strip" aria-label="Els altres jugadors"></aside>`); document.body.appendChild(el); }
  const W = G.mp?.W || (d.world ? JSON.parse(d.world) : null);
  if (!W) return;
  el.innerHTML = `${simChatButton(G)}<span class="simmp-strip-h">👥</span>${d.players.map((u, k) => {
    if (u === simMpUid()) return "";
    const P = W.hum[`h${k}`]?.me;
    const done = d.turn?.[u]?.day === d.day && d.status === "playing";
    const prog = d.seats[u]?.prog;
    return `<span class="simmp-chip ${done ? "ok" : ""}" style="--pc:${P?.color || "#888"}" title="${esc(d.seats[u]?.name || "")}"><i></i>${esc(P?.sig || "?")}${d.status === "playing" ? `<small>${done ? "✓" : prog?.day === d.day ? `${prog.slot || 0}/3` : "…"}</small>` : ""}</span>`;
  }).join("")}`;
  $("[data-chat-open]", el)?.addEventListener("click", () => simChatToggle(G));
}

// ---------- Final: classificació entre els jugadors ----------
function simMpFinalHtml(G, r) {
  const W = G.mp.W, me = G.mp.hid;
  const rows = W.mp.ids.map((id, k) => {
    const t = r.totals[id === me ? "jo" : id];
    return { id, name: W.mp.names[k], P: W.hum[id].me, seats: t?.seats || 0, votes: t?.votes || 0, share: t?.share || 0 };
  }).sort((a, b) => b.seats - a.seats || b.votes - a.votes);
  const pos = rows.findIndex((x) => x.id === me) + 1;
  const head = pos === 1 ? "Has guanyat la campanya contra els teus amics!" : `Quedes ${pos === 2 ? "segon" : pos === 3 ? "tercer" : "quart"} entre els amics.`;
  store.set(simMpLocalKey(), null);
  SimOpts.amics = {}; // «Torna-hi» porta a l'entrada de les campanyes contra amics
  return `<div class="simmp-final">
    <h4>${head}</h4>
    <ol>${rows.map((x, i) => `<li class="${x.id === me ? "me" : ""}"><b class="simmp-pos">${i + 1}</b>${simLogoSvg(x.P, 34)}<span><b>${esc(x.P.name)}</b><small>${esc(x.name)}${x.id === me ? " · tu" : ""}</small></span><strong>${x.seats} ${x.seats === 1 ? "escó" : "escons"}</strong><em>${simNum(x.share * 100)} %</em></li>`).join("")}</ol>
    ${simMpGovHtml(G)}
    <p class="simmp-note">Tots heu jugat les mateixes eleccions: el resultat és el mateix per a tothom.</p>
  </div>`;
}
