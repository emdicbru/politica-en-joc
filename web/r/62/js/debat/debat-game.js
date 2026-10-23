// Simulador de debat electoral: pantalles, plató i control del debat.
// El motor és a debat-engine.js; el plató en 3D, a debat-plato.js (es carrega només en entrar al plató).

const DB_PREFS_KEY = "r29n-debat";
const DB_NET = { cara: "Cadena privada", quatre: "Televisió pública", set: "Televisió pública", petits: "Canal autonòmic" };

ACHIEVEMENTS.push(
  { id: "debat-guanya", name: "Guanyador del debat", desc: "Guanya l'enquesta flash d'un debat electoral." },
  { id: "debat-cara", name: "Cara a cara", desc: "Guanya un cara a cara al simulador de debat." },
  { id: "debat-set", name: "Entre set", desc: "Guanya el debat a set, amb tots els grups del Congrés." },
  { id: "debat-verifica", name: "Verificació en directe", desc: "Enxampa un rival dient una dada falsa durant un debat." },
  { id: "debat-minut", name: "Minut d'or", desc: "Mira a càmera en el moment just durant el minut d'or." },
);

registerGame({
  id: "debat",
  cat: "parlament",
  hidden: true, // s'hi arriba des de la secció Simulador
  backHref: "#simulador",
  backLabel: "Torna als simuladors",
  tagline: "Plantes cara als candidats en un plató de televisió.",
  kicker: "Simulador de debat",
  title: "Debat electoral",
  color: "#3554ff",
  level: 2,
  meta: "10 min",
  icon: icon(`<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M7 9h4M7 12h7"/>`),
  desc: "Ets el cap de llista d'un partit que crees tu. Decideix a quin debat vas, prepara't i plantes cara als candidats reals en un plató en 3D: interrupcions, dades falses, preguntes trampa, nervis i el minut d'or. Al final, una enquesta flash diu qui ha guanyat.",
  rules: ["Crea el teu candidat", "Tria el debat i prepara't", "Plató en 3D", "Enquesta flash al final"],
  start(ctx) { dbSetup({ ctx, me: null }); },
});

// ---------- 1. El teu candidat ----------
function dbSetup(G) {
  const { ctx } = G;
  const saved = store.get(DB_PREFS_KEY, null);
  const me = G.me || saved || { name: DB_NAMES[Math.floor(Math.random() * DB_NAMES.length)], party: "Nova Plaça", sig: "NP", color: DB_COLORS[0], ideo: "cesq", terr: "autonom", size: "gran", style: "rigor" };
  if (!me.look) Object.assign(me, { look: DB_NAME_LOOKS[Math.max(0, DB_NAMES.indexOf(me.name))], skin: DB_SKINS[1], hairC: DB_HAIRS[1] });
  G.me = me;
  const seg = (name, list, cur) => `<div class="db-seg" role="radiogroup" aria-label="${name}">${list.map((x) => `<button type="button" role="radio" data-${name}="${x.k}" aria-checked="${x.k === cur}" class="${x.k === cur ? "on" : ""}">${x.label}</button>`).join("")}</div>`;
  const cards = (name, list, cur) => `<div class="db-choices">${list.map((x) => `<button type="button" class="db-choice ${x.k === cur ? "on" : ""}" data-${name}="${x.k}" aria-pressed="${x.k === cur}"><b>${x.label}</b><small>${x.d}</small></button>`).join("")}</div>`;
  ctx.body.innerHTML = `<div class="db-wrap">
    <div class="card db-card">
      <p class="kicker">Pas 1 de 3 · El teu candidat</p>
      <h2 class="db-h">Qui es presenta al debat?</h2>
      <div class="db-setup">
        <div class="db-form">
          <label>Nom del candidat<span class="db-in"><input data-f="name" maxlength="26" value="${esc(me.name)}" autocomplete="off"><button type="button" class="db-dice" data-dice aria-label="Un altre nom">🎲</button></span></label>
          <label>Nom del partit<input data-f="party" maxlength="30" value="${esc(me.party)}" autocomplete="off"></label>
          <label>Sigles<input data-f="sig" maxlength="6" value="${esc(me.sig)}" autocomplete="off"></label>
          <div class="db-colors" role="radiogroup" aria-label="Color">${DB_COLORS.map((c) => `<button type="button" role="radio" aria-label="Color ${c}" aria-checked="${c === me.color}" class="${c === me.color ? "on" : ""}" data-color="${c}" style="--c:${c}"></button>`).join("")}</div>
        </div>
        <div class="db-preview" aria-hidden="true">
          <div class="db-prev-led">DEBAT 29N</div>
          <div class="db-prev-pod" data-prev><b></b><small></small></div>
        </div>
      </div>
      <h3 class="db-h3">Aspecte</h3>
      <div class="db-looks" role="radiogroup" aria-label="Pentinat">${DB_LOOKS.map((x) => `<button type="button" role="radio" data-look="${x.k}" aria-checked="${x.k === me.look}" class="${x.k === me.look ? "on" : ""}">${x.label}</button>`).join("")}</div>
      <div class="db-tones">
        <span>Pell</span><div class="db-colors sm" role="radiogroup" aria-label="To de pell">${DB_SKINS.map((c) => `<button type="button" role="radio" aria-label="To ${c}" aria-checked="${c === me.skin}" class="${c === me.skin ? "on" : ""}" data-skin="${c}" style="--c:${c}"></button>`).join("")}</div>
        <span>Cabell</span><div class="db-colors sm" role="radiogroup" aria-label="Color de cabell">${DB_HAIRS.map((c) => `<button type="button" role="radio" aria-label="Cabell ${c}" aria-checked="${c === me.hairC}" class="${c === me.hairC ? "on" : ""}" data-hairc="${c}" style="--c:${c}"></button>`).join("")}</div>
      </div>
      <h3 class="db-h3">Ideologia</h3>${seg("ideo", DB_IDEOS, me.ideo)}
      <h3 class="db-h3">Model territorial</h3>${seg("terr", DB_TERRS, me.terr)}
      <h3 class="db-h3">Mida del partit</h3>${cards("size", DB_SIZES, me.size)}
      <h3 class="db-h3">Estil del candidat</h3>${cards("style", DB_STYLES, me.style)}
      <div class="db-actions"><button class="btn primary lg" data-next>Següent: les invitacions →</button></div>
    </div>
  </div>`;
  const el = ctx.body;
  const paint = () => {
    const p = $("[data-prev]", el);
    p.style.setProperty("--c", me.color);
    $("b", p).textContent = me.sig || "?";
    $("small", p).textContent = me.name;
  };
  paint();
  $$("[data-f]", el).forEach((i) => i.addEventListener("input", () => {
    me[i.dataset.f] = i.value.trim();
    if (i.dataset.f === "party" && !el.dataset.sigTouched) {
      me.sig = me.party.split(/\s+/).filter((w) => w.length > 2 || /^\p{Lu}/u.test(w)).map((w) => w[0]).join("").toUpperCase().slice(0, 5) || "P";
      $("[data-f=sig]", el).value = me.sig;
    }
    if (i.dataset.f === "sig") { el.dataset.sigTouched = "1"; me.sig = i.value.trim().toUpperCase(); }
    paint();
  }));
  $("[data-dice]", el).addEventListener("click", () => {
    me.name = DB_NAMES[(DB_NAMES.indexOf(me.name) + 1) % DB_NAMES.length];
    $("[data-f=name]", el).value = me.name;
    // Si encara no ha triat aspecte, el dau també proposa el de cada nom
    if (!me.lookTouched) { me.look = DB_NAME_LOOKS[DB_NAMES.indexOf(me.name)]; $$("[data-look]", el).forEach((x) => { const on = x.dataset.look === me.look; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); }); }
    paint(); Sfx.play("pick");
  });
  const pickOne = (attr, key) => $$(`[data-${attr}]`, el).forEach((b) => b.addEventListener("click", () => {
    me[key] = b.dataset[attr];
    $$(`[data-${attr}]`, el).forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute(x.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", on); });
    paint(); Sfx.play("pick");
  }));
  $$("[data-look]", el).forEach((b) => b.addEventListener("click", () => { me.lookTouched = true; }));
  pickOne("color", "color"); pickOne("look", "look"); pickOne("skin", "skin"); pickOne("hairc", "hairC"); pickOne("ideo", "ideo"); pickOne("terr", "terr"); pickOne("size", "size"); pickOne("style", "style");
  $("[data-next]", el).addEventListener("click", () => {
    if (!me.name) me.name = DB_NAMES[0];
    if (!me.party) me.party = "Nova Plaça";
    if (!me.sig) me.sig = "NP";
    store.set(DB_PREFS_KEY, me);
    Sfx.play("pick");
    dbInvitesScreen(G);
  });
}

// ---------- 2. Invitacions ----------
function dbInvitesScreen(G) {
  const { ctx, me } = G;
  const inv = dbInvites(me.size);
  const lineup = (k) => (k === "cara" ? [dbCaraRival(me.ideo)] : DB_LINEUPS[k].slice(0, DB_FORMATS[k].rivals));
  ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card">
    <p class="kicker">Pas 2 de 3 · Les invitacions</p>
    <h2 class="db-h">A quin debat vas?</h2>
    <p class="db-lead">Les televisions conviden els partits segons la representació que tenen. És el criteri de proporcionalitat de la Junta Electoral Central. Com que el teu partit és <b>${DB_SIZES.find((s) => s.k === me.size).label.toLowerCase()}</b>, aquestes són les invitacions:</p>
    <div class="db-invites">${Object.keys(DB_FORMATS).map((k) => {
      const F = DB_FORMATS[k], ok = inv.includes(k);
      return `<button type="button" class="db-invite ${ok ? "" : "off"}" data-fmt="${k}" ${ok ? "" : "disabled"}>
        <span class="db-inv-net">${ok ? "📩 Invitació" : "🔒 Sense invitació"} · ${DB_NET[k]}</span>
        <b>${F.title}</b>
        <small>${F.desc}</small>
        <span class="db-inv-faces">${lineup(k).map((id) => { const p = PARTIES.find((x) => x.id === id); return `<i style="--pc:${p.color}" title="${esc(p.cand?.name || p.sig)}">${p.sig}</i>`; }).join("")}<i class="me" style="--pc:${me.color}">${esc(me.sig)}</i></span>
        ${ok ? "" : `<em>${k === "cara" ? "Només per als dos partits que poden guanyar" : k === "quatre" ? "Només per als quatre partits més grans" : k === "set" ? "Només per als grups del Congrés" : "Només per als partits sense grup"}</em>`}
      </button>`;
    }).join("")}</div>
    ${inv.length > 1 ? `<p class="db-note">Declinar un debat també és una decisió: si no hi vas, els rivals hi parlaran sense tu i et retrauran el faristol buit.</p>` : ""}
    <div class="db-actions"><button class="btn ghost" data-back>← Enrere</button></div>
  </div></div>`;
  $("[data-back]", ctx.body).addEventListener("click", () => dbSetup(G));
  $$("[data-fmt]:not([disabled])", ctx.body).forEach((b) => b.addEventListener("click", () => { G.format = b.dataset.fmt; Sfx.play("pick"); dbPrepScreen(G); }));
}

// ---------- 3. Preparació ----------
function dbPrepScreen(G) {
  const { ctx } = G;
  const prep = G.prep || { dades: 1, repliques: 1, camera: 1 };
  G.prep = prep;
  G.strat = G.strat || "centre";
  const left = () => 3 - prep.dades - prep.repliques - prep.camera;
  const items = [
    ["dades", "Dades i xifres", "Recordaràs millor les dades i detectaràs les falses."],
    ["repliques", "Rèpliques", "Més rèpliques disponibles i més calma davant les interrupcions."],
    ["camera", "Davant de la càmera", "Menys nervis i més encert al minut d'or."],
  ];
  const draw = () => {
    ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card">
      <p class="kicker">Pas 3 de 3 · La preparació</p>
      <h2 class="db-h">${DB_FORMATS[G.format].title} · ${DB_NET[G.format]}</h2>
      <h3 class="db-h3">Tres hores d'assaig amb l'equip</h3>
      <p class="db-lead">Reparteix-les. Queden <b data-left>${left()}</b> ${left() === 1 ? "hora" : "hores"}.</p>
      <div class="db-prep">${items.map(([k, t, d]) => `<div class="db-prep-row">
        <div><b>${t}</b><small>${d}</small></div>
        <div class="db-step"><button type="button" data-minus="${k}" aria-label="Menys ${t}" ${prep[k] ? "" : "disabled"}>−</button><span>${"●".repeat(prep[k])}${"○".repeat(3 - prep[k])}</span><button type="button" data-plus="${k}" aria-label="Més ${t}" ${left() ? "" : "disabled"}>+</button></div>
      </div>`).join("")}</div>
      <h3 class="db-h3">Estratègia</h3>
      <div class="db-choices">${Object.entries(DB_STRAT).map(([k, s]) => `<button type="button" class="db-choice ${G.strat === k ? "on" : ""}" data-strat="${k}" aria-pressed="${G.strat === k}"><b>${s.label}</b><small>${s.d}</small></button>`).join("")}</div>
      <div class="db-actions"><button class="btn ghost" data-back>← Enrere</button><button class="btn primary lg" data-go>Entra al plató 🎬</button></div>
      <p class="db-fiction">${DB_DISCLAIMER}</p>
    </div></div>`;
    $$("[data-plus]", ctx.body).forEach((b) => b.addEventListener("click", () => { if (left() > 0) { prep[b.dataset.plus]++; Sfx.play("pick"); draw(); } }));
    $$("[data-minus]", ctx.body).forEach((b) => b.addEventListener("click", () => { if (prep[b.dataset.minus] > 0) { prep[b.dataset.minus]--; Sfx.play("pick"); draw(); } }));
    $$("[data-strat]", ctx.body).forEach((b) => b.addEventListener("click", () => { G.strat = b.dataset.strat; Sfx.play("pick"); draw(); }));
    $("[data-back]", ctx.body).addEventListener("click", () => dbInvitesScreen(G));
    $("[data-go]", ctx.body).addEventListener("click", () => { Sfx.play("pick"); dbStudio(G); });
  };
  draw();
}

// ---------- 4. El plató ----------
async function dbStudio(G) {
  const { ctx } = G;
  const st = dbNewGame({ seed: Math.floor(Math.random() * 1e9), me: G.me, format: G.format, prep: G.prep, strat: G.strat });
  G.st = st;
  const F = DB_FORMATS[G.format];
  const net = DB_NET[G.format];
  // Aspecte de cada avatar (el jugador el tria; els rivals, segons DB_CAST)
  const num = (c) => parseInt(String(c).replace("#", ""), 16);
  const cast = (o) => (o ? { look: o.look, age: o.age, skin: num(o.skin), hair: num(o.hair) } : {});
  const meSeed = [...st.me.name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 1000;
  const cands = [{ id: "jo", name: st.me.name, sig: st.me.sig, color: st.me.color, me: true, seed: meSeed, ...cast({ look: G.me.look, age: 44, skin: G.me.skin, hair: G.me.hairC }) },
    ...st.rivals.map((r, i) => ({ id: r.id, name: r.cand, sig: r.sig, color: r.color, seed: 11 + i * 7, ...cast(DB_CAST[r.id]) }))];
  // El jugador ocupa una posició al mig (sorteig)
  const order = [...cands.slice(1)];
  order.splice(Math.floor(order.length / 2), 0, cands[0]);
  const T = h(`<div class="db-theater" role="dialog" aria-modal="true" aria-label="Debat electoral">
    <div class="db-stage"><div class="db-flash"></div><div class="db-loading"><span class="dot-live"></span> Preparant el plató…</div><div class="db-lower" data-lower hidden><span class="db-who" data-who></span><p class="db-say" data-say></p></div></div>
    <div class="db-top">
      <span class="db-live"><i></i>EN DIRECTE</span>
      <span class="db-net">${esc(net)} · ${esc(F.title)}</span>
      <span class="db-blockname" data-blockname></span>
      <button type="button" class="db-x" data-exit aria-label="Surt del debat">✕</button>
    </div>
    <aside class="db-meters" aria-label="Com va el debat">
      <div class="db-curve"><span class="db-m-h">Corba de reacció</span><svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path data-curve/></svg><b data-imp>—</b></div>
      <div class="db-segs" data-segs></div>
      <div class="db-time"><span class="db-m-h">El teu temps</span><span class="db-bar"><i data-timebar></i></span><b data-time></b></div>
      <div class="db-time"><span class="db-m-h">Nervis</span><span class="db-bar nerves"><i data-nerves></i></span><b data-nervesv></b></div>
      <div class="db-reps"><span class="db-m-h">Rèpliques</span><span data-reps></span></div>
    </aside>
    <div class="db-panel" data-panel></div>
    <div class="db-ticker" aria-label="Xarxes socials"><span class="db-tick-h">Xarxes</span><span class="db-tick" data-tick>Comença el debat. #Debat29N</span></div>
  </div>`);
  document.body.appendChild(T);
  document.body.classList.add("db-lock");
  const stage = $(".db-stage", T);
  let plato = null;
  try {
    const mod = await import(new URL("js/debat/debat-plato.js?v=37", window.PEJ_CDN || document.baseURI).href);
    plato = await mod.createPlato(stage, { cands: order, title: "DEBAT 29N", net: `${net.toUpperCase()} · ${F.title.toUpperCase()}` });
  } catch (e) {
    console.warn("Plató 3D no disponible: " + (e && (e.stack || e.message || e)));
    plato = dbFlatStudio(stage, order);
  }
  $(".db-loading", stage)?.remove();
  const done = () => { plato?.dispose(); T.remove(); document.body.classList.remove("db-lock"); };
  ctx.onCleanup(done);
  G.T = T; G.plato = plato; G.cands = cands;
  $("[data-exit]", T).addEventListener("click", () => {
    if (confirm("Vols sortir del debat? No es desarà.")) { done(); location.hash = "#simulador"; }
  });
  dbMeters(G);
  try {
    await dbRun(G);
  } catch (e) {
    if (e !== "fi") throw e;
  }
}

// Plató pla, si el dispositiu no pot mostrar 3D
function dbFlatStudio(stage, cands) {
  stage.classList.add("flat");
  stage.insertAdjacentHTML("beforeend", `<div class="db-flat"><div class="db-flat-led">DEBAT 29N</div><div class="db-flat-row">${cands.map((c) => `<span class="db-flat-pod" data-fp="${c.id}" style="--c:${c.color}"><i></i><b>${esc(c.sig)}</b></span>`).join("")}</div></div>`);
  let cur = null;
  return {
    shot() {}, react() {}, resize() {}, dispose() {},
    screen(t) { const l = $(".db-flat-led", stage); if (l) l.textContent = t; },
    speak(id) { if (cur) cur.classList.remove("on"); cur = $(`[data-fp="${id}"]`, stage); if (cur) cur.classList.add("on"); },
  };
}

// Indicadors: corba, grups de votants, temps, nervis, rèpliques
function dbMeters(G, d) {
  const { st, T } = G;
  const pts = st.curve.slice(-24);
  const path = pts.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, pts.length - 1)) * 120} ${40 - (v / 100) * 40}`).join("");
  $("[data-curve]", T).setAttribute("d", path);
  $("[data-imp]", T).textContent = dbImpression(st);
  const lab = { base: "Els teus", indecisos: "Indecisos", rivals: "Dels rivals" };
  $("[data-segs]", T).innerHTML = Object.keys(lab).map((k) => {
    const dv = d?.[k];
    return `<span class="db-segc ${dv > 0.4 ? "up" : dv < -0.4 ? "down" : ""}"><small>${lab[k]}</small><b>${Math.round(st.seg[k])}</b>${dv ? `<em>${dv > 0 ? "+" : ""}${fmtDb(dv)}</em>` : ""}</span>`;
  }).join("");
  $("[data-timebar]", T).style.width = `${(st.time / st.total) * 100}%`;
  $("[data-timebar]", T).parentElement.classList.toggle("low", st.time < 60);
  $("[data-time]", T).textContent = dbClock(st.time);
  $("[data-nerves]", T).style.width = `${st.nerves}%`;
  $("[data-nervesv]", T).textContent = st.nerves >= 70 ? "Alts" : st.nerves >= 45 ? "Mitjans" : "Baixos";
  $("[data-reps]", T).textContent = "●".repeat(st.replies) + "○".repeat(Math.max(0, 1 + st.prep.repliques - st.replies));
  if (st.social[0]) $("[data-tick]", T).innerHTML = st.social.slice(0, 4).map((s) => `<span class="${s.good ? "good" : "bad"}"><b>${s.tag}</b> ${esc(s.text)}</span>`).join("");
}
const fmtDb = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
const dbClock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// ---------- Control del debat ----------
// Segons per decidir quan hi ha pressa (interrupcions, atacs, repreguntes): més si t'has preparat les rèpliques
const dbDecideSecs = (st) => 9 + st.prep.repliques * 2;

async function dbRun(G) {
  const { st, ctx, plato, T } = G;
  const panel = $("[data-panel]", T);
  const alive = () => { if (!ctx.alive() || !T.isConnected) throw "fi"; };
  const who = (id) => (id === "mod" ? { name: DB_MOD.name, sub: DB_MOD.role, color: "#ffcf3d" } : id === "jo" ? { name: st.me.name, sub: st.me.party, color: st.me.color } : (() => { const r = st.rivals.find((x) => x.id === id); return { name: r.cand, sub: r.name, color: r.color }; })());
  const isRival = (id) => st.rivals.some((r) => r.id === id);
  // Algú parla: pla de càmera, rètol i text a màquina d'escriure.
  // interrupt: mentre parla un rival, hi ha el botó «Interromp» (torna "int" si el prems).
  // cutaway: mentre parles tu, la càmera ensenya un moment la reacció d'un rival.
  const say = async (id, text, { shot = id, cont = true, interrupt = false, cutaway = null } = {}) => {
    alive();
    plato.shot(shot === "jo" || isRival(shot) || ["mod", "wide", "two"].includes(shot) ? shot : "wide");
    plato.speak(id);
    const w = who(id);
    const lower = $("[data-lower]", T);
    lower.hidden = false;
    lower.style.setProperty("--c", w.color);
    $("[data-who]", T).innerHTML = `<i></i><b>${esc(w.name)}</b><small>${esc(w.sub)}</small>`;
    const sayEl = $("[data-say]", T);
    sayEl.textContent = "";
    let skip = false, cut = false, cutDone = false;
    const canInt = interrupt && isRival(id) && dbCanInterrupt(st);
    if (!cont) panel.innerHTML = ""; // mentre parles, sense les opcions que ja has triat
    if (cont) panel.innerHTML = `<div class="db-cont-row">${canInt ? `<button type="button" class="btn db-int" data-int>✋ Interromp <small>(${2 - st.stats.interrupts})</small></button>` : ""}<button type="button" class="btn primary db-cont" data-cont>Continua ▸</button></div>`;
    $("[data-cont]", panel)?.addEventListener("click", () => { skip = true; }, { once: true });
    $("[data-int]", panel)?.addEventListener("click", () => { cut = true; skip = true; }, { once: true });
    // Els rivals parlen una mica més a poc a poc quan els pots interrompre
    const speed = canInt ? 30 : 18;
    for (let i = 0; i <= text.length; i += 2) {
      if (skip) break;
      sayEl.textContent = text.slice(0, i);
      if (cutaway && !cutDone && i >= text.length * 0.45 && text.length > 60) {
        cutDone = true;
        plato.shot(cutaway); plato.react(cutaway, dbRand(st, "reaccio") < 0.5 ? "shake" : "nod");
        ctx.after(1100, () => { if (T.isConnected) plato.shot(shot === "jo" ? "jo" : shot); });
      }
      await dbWait(ctx, speed);
      alive();
    }
    if (cut) { sayEl.textContent = `${sayEl.textContent.trim()}…`; return "int"; }
    sayEl.textContent = text;
    if (cont) {
      if (canInt) {
        // Encara el pots tallar abans de continuar
        const r = await new Promise((res) => {
          const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); off(); res("cont"); } });
          $("[data-cont]", panel)?.addEventListener("click", () => { off(); res("cont"); }, { once: true });
          $("[data-int]", panel)?.addEventListener("click", () => { off(); res("int"); }, { once: true });
        });
        if (r === "int") return "int";
      } else await dbClick(ctx, panel, "[data-cont]", !skip);
    }
    return "ok";
  };
  // Tria entre opcions al panell. secs: compte enrere; si s'acaba, torna -1 (et quedes callat)
  const choose = (title, sub, opts, secs = 0) => new Promise((res) => {
    let done = false;
    const pick = (i) => { if (done) return; done = true; res(i); };
    panel.innerHTML = `<div class="db-ask">${secs ? `<div class="db-timer" style="--s:${secs}s" aria-hidden="true"><i></i></div>` : ""}<p class="db-ask-t">${title}${secs ? ` <span class="db-ask-clock" data-clock>${secs}</span>` : ""}</p>${sub ? `<p class="db-ask-s">${sub}</p>` : ""}<div class="db-opts">${opts.map((o, i) => `<button type="button" class="db-opt ${o.cls || ""}" data-o="${i}" ${o.disabled ? "disabled" : ""}>${o.icon ? `<span class="db-opt-i">${o.icon}</span>` : ""}<span class="db-opt-b"><b>${esc(o.label)}</b>${o.d ? `<small>${esc(o.d)}</small>` : ""}${o.quote ? `<q>${esc(o.quote)}</q>` : ""}</span>${o.secs ? `<span class="db-opt-s ${o.secs > st.time ? "over" : ""}">${o.secs} s</span>` : ""}</button>`).join("")}</div></div>`;
    $$("[data-o]", panel).forEach((b) => b.addEventListener("click", () => { Sfx.play("pick"); pick(Number(b.dataset.o)); }, { once: true }));
    panel.scrollTop = 0;
    if (secs) {
      let left = secs;
      const tick = () => {
        if (done) return;
        left--;
        const c = $("[data-clock]", panel);
        if (c) { c.textContent = left; c.classList.toggle("hot", left <= 3); }
        if (left <= 0) { Sfx.play("ko"); return pick(-1); }
        ctx.after(1000, tick);
      };
      ctx.after(1000, tick);
    }
  });
  // Mostra l'efecte d'una decisió
  const feedback = async (r, extra = "") => {
    dbMeters(G, r.d);
    Sfx.play(r.good === false || (r.d && r.d.indecisos < -0.5) ? "ko" : "ok");
    const chips = r.d ? Object.entries(r.d).filter(([, v]) => Math.abs(v) >= 0.1).map(([k, v]) => `<span class="${v > 0 ? "up" : "down"}">${{ base: "Els teus", indecisos: "Indecisos", rivals: "Dels rivals" }[k]} ${v > 0 ? "+" : ""}${fmtDb(v)}</span>`).join("") : "";
    panel.innerHTML = `<div class="db-fb ${r.good === false ? "bad" : "good"}">${r.msg ? `<p>${esc(r.msg)}</p>` : ""}${extra}${chips ? `<div class="db-fb-chips">${chips}</div>` : ""}<button type="button" class="btn primary db-cont" data-cont>Continua ▸</button></div>`;
    if (r.good !== false && r.d && (r.d.indecisos >= 3 || r.d.base >= 4)) { plato.react("jo", "nod"); $(".db-flash", T).classList.remove("go"); void T.offsetWidth; $(".db-flash", T).classList.add("go"); }
    await dbClick(ctx, panel, "[data-cont]");
  };
  // Interromps un rival
  const interrupt = async (rivalId, wasAttack) => {
    const rr = dbInterrupt(st, rivalId, wasAttack);
    plato.react(rivalId, "shake");
    await say("jo", rr.line, { shot: st.rivals.length === 1 ? "two" : "jo", cont: false });
    await dbWait(ctx, 400);
    if (!rr.ok) await say("mod", "Si us plau, respecti el torn de paraula.", { shot: "mod", cont: false });
    await feedback(rr);
  };
  // Decisió amb compte enrere: si s'acaba, et quedes callat
  const decide = async (title, sub, ev) => {
    const j = await choose(title, sub, ev.opts.map((o) => ({ ...o, quote: null })), dbDecideSecs(st));
    return j < 0 ? "silenci" : ev.opts[j].k;
  };

  plato.screen("DEBAT 29N", `${DB_NET[st.format].toUpperCase()} · ${DB_FORMATS[st.format].title.toUpperCase()}`);
  plato.shot("wide");
  await dbWait(ctx, 900);
  await say("mod", `Bona nit i benvinguts al ${DB_FORMATS[st.format].title.toLowerCase()}. Avui ens acompanyen ${G.cands.map((c) => c.name).join(", ")}. Els temps estan pactats i jo els faré complir.`, { shot: "wide" });
  // La primera vegada, com funciona el plató
  if (!store.get(DB_PREFS_KEY, {})?.tuto) {
    await dbTutorial(ctx, panel);
    store.set(DB_PREFS_KEY, { ...store.get(DB_PREFS_KEY, {}), tuto: 1 });
  }

  while (!st.done) {
    alive();
    const block = dbBlock(st);
    const B = DB_BLOCKS[block];
    $("[data-blockname]", T).textContent = `${st.bi + 1}/${st.blocks.length} · ${B.title}`;
    plato.screen(B.title.toUpperCase(), `BLOC ${st.bi + 1} DE ${st.blocks.length}`);
    plato.shot("wide");
    await dbWait(ctx, 600);
    await say("mod", dbQuestion(st, block), { shot: "mod" });

    if (block === "pactes") {
      const ev = dbEvent(st);
      await say("mod", ev.text.replace(`${DB_MOD.name}: `, "").replace(/^«|»$/g, ""), { shot: "mod" });
      plato.shot("jo"); plato.speak("jo");
      const i = await choose("Pregunta trampa", "Tothom espera la teva resposta.", ev.opts);
      const r = dbResolve(st, ev, ev.opts[i].k);
      await say("jo", ev.opts[i].label + ".", { cont: false });
      await feedback(r);
    } else {
      const cards = dbCards(st);
      const titles = { obertura: "Com et presentes?", tancament: "El teu minut d'or" };
      plato.shot("jo"); plato.speak(null);
      const i = await choose(titles[block] || "Com respons?", block === "tancament" ? "L'últim que veuran abans de votar." : `Et queden ${dbClock(st.time)}. Les respostes llargues poden fer que et tallin.`, cards.map((c) => ({ ...c, d: null })));
      const card = cards[i];
      if (card.closing) card.cameraHit = await dbCameraQTE(G, panel);
      const r = dbAnswer(st, card);
      if (card.cameraHit) ctx.achieve("debat-minut");
      const watcher = card.k === "atac" ? dbLeader(st).id : dbPick(st, "pla", st.rivals).id;
      await say("jo", card.quote, { shot: "jo", cont: false, cutaway: card.closing ? null : watcher });
      await dbWait(ctx, 300);
      await feedback({ d: r.d, msg: r.cut ? `${DB_MOD.name}: «Se li ha acabat el temps, ho sento.»` : dbReactionMsg(r.d), good: !r.cut && r.d.indecisos >= 0 });
      // La moderadora repregunta si no has concretat
      const fu = dbFollowUp(st, card);
      if (fu) {
        await say("mod", fu.text, { shot: "mod" });
        plato.shot("jo");
        const k = await decide(fu.title, "Ràpid: la càmera t'enfoca.", fu);
        const rr = dbResolve(st, fu, k);
        if (k === "concreta") await say("jo", fu.concrete, { shot: "jo", cont: false });
        await feedback(rr);
      }
      // Obstacle
      const ev = dbEvent(st);
      if (ev) {
        if (ev.rival) {
          const R = st.rivals.find((x) => x.id === ev.rival);
          if (ev.type === "interrupcio") plato.react(R.id, "shake");
          await say(R.id, ev.text.replace(`${R.cand}: `, "").replace(/^«|»$/g, ""), { shot: ev.type === "interrupcio" && st.rivals.length === 1 ? "two" : R.id });
        } else if (ev.type === "micro") {
          $("[data-say]", T).textContent = "…";
          dbMute(T, true);
        }
        plato.shot("jo");
        const sub = ev.type === "verifica" ? `${ev.hint}` : ev.type === "blanc" ? ev.q : ev.type === "micro" ? ev.text : "";
        // Les interrupcions i els atacs personals demanen resposta ràpida
        const k = ["interrupcio", "personal"].includes(ev.type) ? await decide(ev.title, sub, ev) : ev.opts[await choose(ev.title, sub, ev.opts.map((o) => ({ ...o, quote: null })))].k;
        dbMute(T, false);
        const rr = dbResolve(st, ev, k);
        if (ev.type === "verifica" && rr.good && k === "fals") { ctx.achieve("debat-verifica"); plato.react(ev.rival, "shake"); }
        await feedback(rr, rr.exp ? `<p class="db-fb-exp"><b>${ev.type === "blanc" ? "La dada" : "Verificació"}:</b> ${esc(rr.exp)}</p>` : "");
      }
      // Dos rivals s'enganxen entre ells
      const cl = dbClash(st);
      if (cl) {
        plato.react(cl.b, "shake");
        await say(cl.a, cl.lineA, { shot: cl.a });
        plato.react(cl.a, "shake");
        await say(cl.b, cl.lineB, { shot: cl.b });
        plato.shot("wide");
        const k = await decide(cl.title, cl.text, cl);
        if (k === "pau") { plato.shot("jo"); await say("jo", "Mentre vostès es barallen, la gent espera solucions. Tornem al que importa.", { shot: "jo", cont: false }); }
        await feedback(dbResolve(st, cl, k));
      }
    }

    // Torn dels rivals: mentre parlen, els pots interrompre
    const turns = dbRivalTurns(st);
    for (const t of turns) {
      alive();
      if ((await say(t.id, t.line, { interrupt: true })) === "int") { await interrupt(t.id, false); continue; }
      if (t.attack) {
        plato.react("jo", "shake");
        if ((await say(t.id, t.attack, { shot: st.rivals.length === 1 ? "two" : t.id, interrupt: true })) === "int") { await interrupt(t.id, true); continue; }
        plato.shot("jo");
        const opts = DB_REPLY_OPTS.map((o) => ({ ...o, disabled: o.token && st.replies <= 0, d: o.token && st.replies <= 0 ? "No et queden rèpliques." : o.d }));
        const k = await choose(`T'ataca ${st.rivals.find((r) => r.id === t.id).cand}`, (st.replies === 1 ? "Et queda 1 rèplica." : st.replies ? `Et queden ${st.replies} rèpliques.` : "No et queden rèpliques."), opts, dbDecideSecs(st));
        const rr = k < 0 ? dbResolve(st, {}, "silenci") : dbReply(st, t.id, opts[k].k);
        await feedback({ ...rr, good: rr.ok ?? rr.good });
      }
    }
    dbMeters(G);
    dbNextBlock(st);
  }
  await say("mod", "I fins aquí el debat. Gràcies als candidats i a vostès per seguir-nos. Ara, la decisió és seva.", { shot: "wide" });
  dbFinish(G);
}

// La primera vegada: com funciona el plató
function dbTutorial(ctx, panel) {
  panel.innerHTML = `<div class="db-tuto">
    <p class="db-ask-t">Com funciona el plató</p>
    <ul>
      <li><b>Corba de reacció:</b> com et valora l'audiència, de 0 a 100.</li>
      <li><b>Els teus · Indecisos · Dels rivals:</b> els tres grups de votants que et miren. Els indecisos són els que decideixen qui guanya.</li>
      <li><b>El teu temps:</b> cada resposta en gasta. Si se t'acaba, la moderadora et talla.</li>
      <li><b>Nervis:</b> si pugen massa, les bones respostes fan menys efecte i et pots quedar en blanc.</li>
      <li><b>Rèpliques:</b> per respondre amb força quan t'ataquen.</li>
      <li><b>✋ Interromp:</b> mentre parla un rival, el pots tallar (dues vegades per debat). Arriscat, però pot ser el moment de la nit.</li>
      <li><b>Compte enrere:</b> algunes decisions s'han de prendre ràpid. Si no tries res, et quedes callat.</li>
    </ul>
    <button type="button" class="btn primary db-cont" data-cont>Entesos, comencem ▸</button>
  </div>`;
  return dbClick(ctx, panel, "[data-cont]");
}

const dbReactionMsg = (d) => (d.indecisos >= 4 ? "Molt bona resposta: la corba dels indecisos s'enfila." : d.indecisos >= 1.5 ? "Bona resposta. Els indecisos t'escolten." : d.base >= 3 ? "Els teus ho celebren, però els indecisos no s'immuten." : d.indecisos < 0 ? "Als indecisos no els agrada aquest to." : "Resposta correcta, sense gaire impacte.");
const dbMute = (T, on) => T.classList.toggle("db-mute", on);
const dbWait = (ctx, ms) => new Promise((res) => ctx.after(ms, res));
// Espera un clic (o la tecla d'espai o Enter)
function dbClick(ctx, panel, sel, focus = true) {
  return new Promise((res) => {
    const b = $(sel, panel);
    if (!b) return res();
    if (focus) b.focus({ preventScroll: true });
    const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); off(); res(); } });
    b.addEventListener("click", () => { off(); res(); }, { once: true });
  });
}
// Minut d'or: mirar a càmera quan s'encén el pilot vermell
function dbCameraQTE(G, panel) {
  const { ctx, st } = G;
  return new Promise((res) => {
    panel.innerHTML = `<div class="db-qte"><p class="db-ask-t">Mira a càmera</p><p class="db-ask-s">Toca el botó just quan s'encengui el pilot vermell de la càmera.</p><button type="button" class="db-tally" data-tally aria-label="Mira a càmera"><i></i></button><p class="db-qte-r" data-r></p></div>`;
    const btn = $("[data-tally]", panel);
    const win = 650 + st.prep.camera * 180;
    let lit = 0, done = false;
    const finish = (hit, msg) => { if (done) return; done = true; $("[data-r]", panel).textContent = msg; Sfx.play(hit ? "ok" : "ko"); btn.disabled = true; ctx.after(900, () => res(hit)); };
    ctx.after(1100 + Math.random() * 1600, () => {
      if (done) return;
      lit = performance.now(); btn.classList.add("on");
      ctx.after(win, () => { btn.classList.remove("on"); finish(false, "Massa tard: has mirat a la càmera equivocada."); });
    });
    btn.addEventListener("click", () => {
      if (!lit) return finish(false, "Massa d'hora: encara no era la teva càmera.");
      finish(performance.now() - lit <= win, "Perfecte: mires a càmera, directe a casa de cada votant.");
    });
  });
}

// ---------- 5. Resultat ----------
function dbFinish(G) {
  const { st, ctx, T } = G;
  const res = dbResult(st);
  const lessons = dbLessons(st, res);
  G.plato?.dispose();
  T.remove();
  document.body.classList.remove("db-lock");
  if (res.rank === 1) {
    ctx.achieve("debat-guanya");
    if (st.format === "cara") ctx.achieve("debat-cara");
    if (st.format === "set") ctx.achieve("debat-set");
  }
  const segL = { base: "Els teus votants", indecisos: "Indecisos", rivals: "Votants dels rivals" };
  const max = res.poll[0].pct;
  const extraHtml = `<div class="db-result">
    <h3 class="db-h3">Enquesta flash: qui ha guanyat el debat?</h3>
    <ul class="db-poll">${res.poll.map((p) => `<li class="${p.id === "jo" ? "me" : ""}" style="--pc:${p.color}"><span>${esc(p.cand)}<small>${esc(p.sig)}</small></span><span class="db-poll-t"><i style="width:${(p.pct / max) * 100}%"></i></span><b>${String(p.pct).replace(".", ",")} %</b></li>`).join("")}</ul>
    <div class="db-res-grid">
      <div><small>Efecte en el vot</small><b class="${res.vote >= 0 ? "up" : "down"}">${res.vote >= 0 ? "+" : ""}${String(res.vote).replace(".", ",")} punts</b></div>
      ${Object.keys(segL).map((k) => `<div><small>${segL[k]}</small><b>${Math.round(res.seg[k])}/100</b></div>`).join("")}
    </div>
    ${res.best ? `<p class="db-moment good"><b>El teu millor moment</b>${esc(res.best.text)}</p>` : ""}
    ${res.worst ? `<p class="db-moment bad"><b>El moment que voldries esborrar</b>${esc(res.worst.text)}</p>` : ""}
    <h3 class="db-h3">Què n'aprens</h3>
    <ul class="db-lessons">${lessons.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
    <p class="db-fiction">${DB_DISCLAIMER}</p>
  </div>`;
  ctx.finish({
    score: res.score, xp: res.xp, extraHtml,
    unit: `punts · ${DB_FORMATS[st.format].title.toLowerCase()}`,
    ratio: res.rank === 1 ? 0.8 : res.rank === 2 ? 0.55 : 0.3,
    verdict: res.rank === 1 ? "Has guanyat el debat! L'enquesta flash et dona com a vencedor." : res.rank === 2 ? "Segon a l'enquesta flash: has competit de tu a tu." : `Quedes ${res.rank}r a l'enquesta flash. Hi ha marge per millorar.`,
  });
}
