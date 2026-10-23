// Simulador de debat electoral: motor. No toca el DOM (es prova amb Node).
// L'audiència es divideix en tres grups: els teus votants (base), els indecisos i els votants dels rivals.
// Cada resposta mou l'opinió de cada grup sobre tu (0-100); al final, una enquesta flash decideix qui ha guanyat.

const DB_K = 1.7;
const DB_RIVAL_DRIFT = 8; // marge de millora dels rivals a cada bloc (de -2 a +6) // intensitat de les reaccions de l'audiència
const DB_SEG_W = { base: 0.3, indecisos: 0.45, rivals: 0.25 }; // pes de cada grup a l'enquesta «qui ha guanyat?»
const DB_STRAT = {
  centre: { label: "Guanyar els indecisos", d: "Propostes i to moderat. Els indecisos compten el doble.", w: { base: 0.25, indecisos: 0.6, rivals: 0.15 } },
  base: { label: "Mobilitzar els teus", d: "Missatges clars per als teus votants. Que ningú es quedi a casa.", w: { base: 0.6, indecisos: 0.3, rivals: 0.1 } },
  atac: { label: "Desgastar el favorit", d: "Pressió constant sobre el candidat que va primer a les enquestes.", w: { base: 0.4, indecisos: 0.35, rivals: 0.25 }, leader: true },
};

function dbHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
// Aleatori determinista: mateixa llavor i mateixes decisions, mateixa partida
function dbRand(st, tag) {
  let a = dbHash(`${st.seed}|${tag}|${st.rc++}`);
  a = (a + 0x6d2b79f5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const dbPick = (st, tag, arr) => arr[Math.floor(dbRand(st, tag) * arr.length)];
const dbClamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const dbParty = (id) => (typeof PARTIES !== "undefined" ? PARTIES.find((p) => p.id === id) : null);

// Invitacions segons la mida del partit
function dbInvites(size) {
  return Object.keys(DB_FORMATS).filter((k) => DB_FORMATS[k].sizes.includes(size));
}

// El rival principal del cara a cara: el partit gran de l'altre costat
function dbCaraRival(ideo) {
  return ["esq", "cesq"].includes(ideo) ? "pp" : "psoe";
}

function dbNewGame({ seed = Date.now() % 1e9, me, format, prep = { dades: 1, repliques: 1, camera: 1 }, strat = "centre" }) {
  const F = DB_FORMATS[format];
  let ids = format === "cara" ? [dbCaraRival(me.ideo)] : DB_LINEUPS[format].slice();
  // El jugador ocupa el lloc del partit més semblant (perquè hi hagi el nombre de rivals del format)
  if (ids.length > F.rivals) {
    const x = DB_IDEOS.find((i) => i.k === me.ideo).x;
    const drop = [...ids].sort((a, b) => Math.abs(dbParty(a).x - x) - Math.abs(dbParty(b).x - x))[0];
    ids = ids.filter((id) => id !== drop).slice(0, F.rivals);
  }
  const rivals = ids.map((id, i) => {
    const p = dbParty(id);
    return { id, sig: p.sig, name: p.name, color: p.color, cand: p.cand?.name || p.sig, kind: DB_RIVAL_KIND[id] || "esq", seats: p.seats, imp: 50, time: F.secs, slot: i };
  });
  // Els temes del debat: a l'atzar, però l'economia i l'habitatge hi surten gairebé sempre; en l'ordre habitual
  const score = (t) => dbHash(`${seed}|tema|${t}`) / 4294967296 + (t === "economia" || t === "habitatge" ? 0.3 : 0) - (t === "territori" && format === "petits" ? 0.5 : 0);
  const topics = [...DB_TOPICS].sort((a, b) => score(b) - score(a)).slice(0, F.topics || 2);
  const blocks = ["obertura", ...DB_TOPICS.filter((t) => topics.includes(t)), "pactes", "tancament"];
  const st = {
    v: 2, seed, rc: 0, format, me: { ...me }, prep: { ...prep }, strat,
    rivals, blocks, bi: 0,
    time: F.secs, total: F.secs,
    nerves: dbClamp(38 - prep.camera * 9 + (me.style === "combat" ? 6 : 0), 5, 80),
    replies: 1 + prep.repliques,
    seg: { base: 55, indecisos: 45, rivals: 30 },
    curve: [], stats: { cut: 0, factOk: 0, factBad: 0, evasive: 0, attacks: 0, attacked: 0, replies: 0, blank: 0, camera: null, interrupts: 0, intOk: 0, intBad: 0, silence: 0, followups: 0, clashes: 0 },
    moments: [], social: [], last: null, done: false,
  };
  st.curve.push(dbImpression(st));
  return st;
}

// Impressió global de l'audiència sobre el jugador (0-100)
const dbImpression = (st) => Math.round(Object.keys(DB_SEG_W).reduce((t, k) => t + st.seg[k] * DB_SEG_W[k], 0));
// El favorit a les enquestes entre els rivals (el de més escons)
const dbLeader = (st) => [...st.rivals].sort((a, b) => b.seats - a.seats)[0];
const dbBlock = (st) => st.blocks[st.bi];

// Aplica un efecte als tres grups, amb el multiplicador d'estil, nervis i estratègia
function dbApply(st, fx, mult = 1) {
  const nervesK = st.nerves > 55 ? 1 - (st.nerves - 55) / 120 : 1;
  const d = {};
  Object.keys(fx).forEach((k) => {
    const v = fx[k] * mult * (fx[k] > 0 ? nervesK : 1) * DB_K;
    const before = st.seg[k];
    st.seg[k] = dbClamp(st.seg[k] + v);
    d[k] = Math.round((st.seg[k] - before) * 10) / 10;
  });
  st.curve.push(dbImpression(st));
  return d;
}
const dbNerves = (st, v) => { st.nerves = dbClamp(st.nerves + v * (v > 0 && st.me.style === "combat" ? 1.25 : 1), 0, 100); };
function dbMoment(st, kind, text, good) {
  st.moments.push({ block: dbBlock(st), kind, text, good });
  const tags = { viral: "#Debat29N", fact: "#Verificació", gaffe: "#Pífia", cut: "#SenseTemps", camera: "#MinutDOr" };
  st.social.unshift({ tag: tags[kind] || "#Debat29N", text, good });
}

// ---------- Les teves cartes de resposta ----------
const dbIsTopic = (block) => DB_TOPICS.includes(block);
// El tema d'una resposta: el del bloc o, a la presentació i al minut d'or, el primer tema del debat
const dbTema = (st, block) => (dbIsTopic(block) ? block : st.blocks.find(dbIsTopic) || "habitatge");
function dbProp(st, block) {
  const tema = dbTema(st, block);
  return tema === "territori" ? DB_PROPOSALS.territori[st.me.terr] : (DB_PROPOSALS[tema] || DB_PROPOSALS.habitatge)[st.me.ideo];
}
// La pregunta de la moderadora (n'hi ha diverses per a cada bloc)
function dbQuestion(st, block) {
  const B = DB_BLOCKS[block];
  return B.qs ? dbPick(st, `pregunta-${block}`, B.qs) : B.q;
}
function dbFill(st, quote, block) {
  const tema = dbTema(st, block);
  return quote
    .replace("{story}", DB_STORIES[block] || DB_STORIES.obertura)
    .replace("{rival}", dbLeader(st).cand)
    .replace("{tema}", DB_TOPIC_NAMES[tema] || "l'habitatge")
    .replace("{proposal}", dbProp(st, block));
}
function dbCards(st) {
  const block = dbBlock(st);
  if (block === "obertura") {
    return DB_OPENINGS.map((o) => ({ k: o.k, label: o.label, icon: DB_APPROACHES[o.k].icon, secs: 45, quote: dbFill(st, o.quote, block) }));
  }
  if (block === "tancament") {
    return DB_CLOSINGS.map((o) => ({ k: o.k, label: o.label, icon: "⏱", secs: 60, quote: dbFill(st, o.quote, block), closing: true }));
  }
  if (block === "pactes") return null; // pregunta trampa
  const prop = dbProp(st, block);
  const leader = dbLeader(st);
  const all = {
    proposta: `La nostra proposta és clara: ${prop}. I ho farem el primer any de govern.`,
    dades: `Us ho explico amb números: ${prop}. Què costa, d'on surten els diners i el calendari, punt per punt.`,
    emocio: `${DB_STORIES[block]}. Per això proposem ${prop}.`,
    atac: `Mentre ${leader.cand} fa promeses, la gent espera. Ja n'hi ha prou d'excuses: nosaltres proposem ${prop}.`,
  };
  // Sempre hi ha la proposta; les altres dues es trien segons la partida
  const extra = ["dades", "emocio", "atac"].filter((k) => k !== st.last);
  const two = extra.length > 2 ? [extra.splice(Math.floor(dbRand(st, "carta") * extra.length), 1)[0], ...extra].slice(0, 2) : extra;
  return ["proposta", ...two].map((k) => ({ k, label: DB_APPROACHES[k].label, icon: DB_APPROACHES[k].icon, secs: DB_APPROACHES[k].secs, quote: all[k] }));
}

// Respon: efecte segons l'enfocament, l'estil, la preparació, l'estratègia i si repeteixes enfocament
function dbAnswer(st, card) {
  const block = dbBlock(st);
  const style = DB_STYLES.find((s) => s.k === st.me.style);
  const base = card.closing ? DB_CLOSINGS.find((c) => c.k === card.k).fx : DB_APPROACHES[card.k].fx;
  let mult = style.fx[card.k] || 1;
  if (card.k === "dades") mult *= 0.85 + st.prep.dades * 0.15;
  if (st.last === card.k && !card.closing) mult *= 0.7; // repetir-se cansa
  if (card.k === "atac" && st.strat === "atac") mult *= 1.25;
  if (card.cameraHit === true) mult *= 1.35;
  if (card.cameraHit === false) mult *= 0.85;
  const cut = card.secs > st.time;
  if (cut) {
    mult *= 0.5;
    st.stats.cut++;
    dbNerves(st, 10);
    dbMoment(st, "cut", "La moderadora et talla: se t'ha acabat el temps.", false);
  }
  st.time = Math.max(0, st.time - card.secs);
  const d = dbApply(st, base, mult);
  if (card.k === "atac") {
    st.stats.attacks++;
    const L = dbLeader(st);
    L.imp = dbClamp(L.imp - 3 * mult);
  }
  dbNerves(st, d.indecisos > 2 ? -5 : d.indecisos < 0 ? 4 : -1);
  if (!card.closing) st.last = card.k;
  if (d.indecisos >= 5 || d.base >= 6) dbMoment(st, "viral", `«${card.quote.split(/[.:]/)[0]}»`, true);
  return { d, cut };
}

// ---------- Els rivals ----------
// Qui parla a cada bloc: en el cara a cara, el rival; en els debats grans, dos o tres per torn
function dbRivalTurns(st) {
  const block = dbBlock(st);
  const n = st.rivals.length === 1 ? 1 : block === "obertura" || block === "tancament" ? Math.min(3, st.rivals.length) : 2;
  const order = [...st.rivals].sort((a, b) => dbRand(st, `ordre-${b.id}`) - dbRand(st, `ordre-${a.id}`)).slice(0, n);
  // El favorit sempre hi és si l'has atacat
  if (st.last === "atac") { const L = dbLeader(st); if (!order.includes(L)) order[0] = L; }
  return order.map((r) => {
    const line = dbPick(st, `linia-${r.id}-${block}`, dbRivalLines(r, block));
    r.imp = dbClamp(r.imp + (dbRand(st, `imp-${r.id}`) - 0.45) * 6);
    r.time = Math.max(0, r.time - 45);
    // Probabilitat que t'ataqui: més si l'has atacat, si vas bé o si ets un partit gran
    const p = (st.last === "atac" ? 0.5 : 0.18) + (dbImpression(st) > 58 ? 0.15 : 0) + (st.me.size === "gran" ? 0.1 : 0);
    const attack = !["obertura", "tancament"].includes(block) && dbRand(st, `atac-${r.id}`) < p;
    return { id: r.id, line, attack: attack ? dbAttackLine(st, r) : null };
  });
}
// Les frases d'un rival: les del seu partit si n'hi ha; si no, les del seu perfil
function dbRivalLines(r, block) {
  const own = DB_PARTY_LINES[r.id]?.[block];
  return own && own.length ? own : (DB_RIVAL_LINES[block]?.[r.kind] || DB_RIVAL_LINES.economia[r.kind]);
}
// Un atac que encara no hagi fet servir ningú en aquest debat
function dbAttackLine(st, r) {
  const pool = [...(DB_PARTY_ATTACKS[r.id] || []), ...DB_ATTACKS[r.kind]];
  st.usedAttacks = st.usedAttacks || [];
  const left = pool.filter((a) => !st.usedAttacks.includes(a));
  const a = dbPick(st, `atacl-${r.id}`, left.length ? left : pool);
  st.usedAttacks.push(a);
  return a;
}
// Com respons a un atac
const DB_REPLY_OPTS = [
  { k: "dades", label: "Rèplica amb dades", d: "Desmuntes l'atac amb fets. Funciona si t'has preparat les dades.", token: true },
  { k: "dura", label: "Rèplica contundent", d: "Li tornes l'atac, sense contemplacions.", token: true },
  { k: "calma", label: "No entris al joc", d: "Somrius i tornes a les teves propostes.", token: false },
];
function dbReply(st, rivalId, k) {
  const R = st.rivals.find((r) => r.id === rivalId);
  st.stats.attacked++;
  const opt = DB_REPLY_OPTS.find((o) => o.k === k);
  if (opt.token && st.replies <= 0) k = "calma";
  let d;
  if (k === "dades") {
    st.replies--; st.stats.replies++;
    const ok = dbRand(st, "replica") < 0.45 + st.prep.dades * 0.18;
    d = dbApply(st, ok ? { base: 1.5, indecisos: 2.4, rivals: 0.6 } : { base: 0.4, indecisos: -1, rivals: -0.4 });
    R.imp = dbClamp(R.imp + (ok ? -5 : 2));
    dbNerves(st, ok ? -6 : 6);
    if (ok) dbMoment(st, "viral", `Rèplica amb dades a ${R.cand}`, true);
    return { d, ok, msg: ok ? `Les xifres et donen la raó i ${R.cand} no troba resposta.` : "Et fas un embolic amb les xifres i l'atac fa més mal." };
  }
  if (k === "dura") {
    st.replies--; st.stats.replies++;
    const style = DB_STYLES.find((s) => s.k === st.me.style);
    d = dbApply(st, { base: 2.4, indecisos: -0.4, rivals: -1 }, style.fx.atac);
    R.imp = dbClamp(R.imp - 3);
    dbNerves(st, 3);
    return { d, ok: true, msg: "Els teus votants ho celebren; als indecisos els agrada menys tanta tensió." };
  }
  d = dbApply(st, { base: -0.6, indecisos: 1.4, rivals: 0.4 });
  dbNerves(st, -3);
  return { d, ok: true, msg: "No entres a la baralla. Els indecisos valoren la calma; els teus haurien volgut una resposta." };
}

// ---------- Obstacles ----------
const DB_RECALL = [
  { q: "Quants diputats calen per a la majoria absoluta?", a: ["176", "175", "180"] },
  { q: "Quants diputats té el Congrés?", a: ["350", "300", "400"] },
  { q: "Quants diputats elegeix Madrid?", a: ["38", "32", "36"] },
  { q: "Quants senadors elegeix cada província peninsular?", a: ["4", "3", "6"] },
  { q: "Quin percentatge de vots cal per optar a escó en una circumscripció?", a: ["3 %", "5 %", "1 %"] },
];
function dbEvent(st) {
  const block = dbBlock(st);
  if (block === "tancament") return null;
  if (block === "pactes") {
    const id = DB_TRAP[st.me.ideo];
    const p = dbParty(id);
    return { type: "trampa", party: id, title: "Pregunta trampa", text: `${DB_MOD.name}: «Concreti, si us plau. Pactaria amb ${p.name}? Sí o no.»`,
      opts: [
        { k: "no", label: "No, sota cap concepte", d: "Clar i rotund." },
        { k: "si", label: "Sí, si cal per governar", d: "Pragmàtic, però pot molestar els teus." },
        { k: "evasiva", label: "Primer que votin, després ja en parlarem", d: "No et mulles." },
      ] };
  }
  if (st.nerves >= 70 && !st.stats.blank) {
    const r = dbPick(st, "blanc", DB_RECALL);
    return { type: "blanc", title: "Et quedes en blanc", text: `Els nervis et juguen una mala passada. Recordes la dada que havies preparat? ${r.q}`, q: r.q,
      opts: r.a.map((a, i) => ({ k: String(i), label: a })) };
  }
  if (block === "obertura") return dbRand(st, "micro") < 0.35 ? dbMicro() : null;
  const pool = { economia: ["verifica", "interrupcio"], habitatge: ["interrupcio", "personal", "verifica"], sanitat: ["verifica", "interrupcio"], immigracio: ["interrupcio", "personal", "verifica"], clima: ["verifica", "personal"] }[block] || ["verifica", "personal"];
  const type = dbPick(st, `event-${block}`, pool);
  const R = dbPick(st, `qui-${block}`, st.rivals);
  if (type === "verifica") {
    // Primer, una dada del tema del bloc; si ja s'han fet servir totes, una de les regles electorals
    const free = DB_CLAIMS.map((c, i) => i).filter((i) => !(st.usedClaims || []).includes(i));
    const onTopic = free.filter((i) => DB_CLAIMS[i].topic === block);
    const left = onTopic.length ? onTopic : free.filter((i) => !DB_CLAIMS[i].topic);
    const ci = (left.length ? left : free)[Math.floor(dbRand(st, "afirmacio") * (left.length ? left : free).length)];
    (st.usedClaims = st.usedClaims || []).push(ci);
    const c = DB_CLAIMS[ci];
    const memOk = dbRand(st, "memoria") < 0.55 + st.prep.dades * 0.15;
    const hint = memOk === c.ok ? "cert" : "fals";
    return { type, rival: R.id, claim: ci, title: "Verificació en directe", text: `${R.cand}: «${c.t}»`, hint: `Et sembla que és ${hint}${st.prep.dades >= 2 ? " (t'ho has preparat bé)" : st.prep.dades === 0 ? " (però no t'ho has preparat)" : ""}.`,
      opts: [
        { k: "fals", label: "És fals! Corregeix-lo en directe", d: "Si l'encertes, serà el moment de la nit. Si t'equivoques, també." },
        { k: "deixa", label: "Deixa-ho córrer", d: "No t'hi arrisques." },
        { k: "cert", label: "És cert, però no és el que importa", d: "Li dones la raó i tornes al teu tema." },
      ] };
  }
  if (type === "interrupcio") {
    return { type, rival: R.id, title: "T'interrompen", text: `${R.cand} t'interromp a mitja frase: «Això no és veritat!»`,
      opts: [
        { k: "sobre", label: "Continua parlant per sobre", d: "No et deixes trepitjar." },
        { k: "calma", label: "Deixa'l acabar i respon amb calma", d: "Perds uns segons, però guanyes serenitat." },
        { k: "empara", label: "Demana empara a la moderadora", d: "Que es respecti el teu torn." },
      ] };
  }
  return { type: "personal", rival: R.id, title: "Atac personal", text: `${R.cand}: «${dbAttackLine(st, R)}»`,
    opts: [
      { k: "humor", label: "Respon amb humor", d: "Si et surt bé, desactives l'atac. Si no…" },
      { k: "torna", label: "Torna-li l'atac", d: "Ull per ull." },
      { k: "ignora", label: "Ignora-ho i torna a les propostes", d: "No hi entres." },
    ] };
}
const dbMicro = () => ({ type: "micro", title: "Fallada tècnica", text: "Just quan comences a parlar, el teu micròfon deixa de funcionar uns segons.",
  opts: [
    { k: "espera", label: "Espera amb un somriure", d: "Calma i paciència." },
    { k: "broma", label: "Fes una broma quan torni el so", d: "Pot quedar molt bé… o no." },
    { k: "queixa", label: "Queixa't a la realització", d: "Que quedi clar que no és culpa teva." },
  ] });

// ---------- La moderadora repregunta ----------
// Si ataques o expliques una història sense concretar, és probable que et torni a preguntar
function dbFollowUp(st, card) {
  const block = dbBlock(st);
  if (!dbIsTopic(block) || card.closing) return null;
  const p = { atac: 0.6, emocio: 0.35, proposta: 0.06, dades: 0 }[card.k] || 0;
  if (dbRand(st, `repregunta-${block}`) >= p) return null;
  st.stats.followups++;
  return { type: "repregunta", title: "La moderadora t'insisteix", text: dbPick(st, "repregunta", DB_FOLLOWUPS),
    concrete: `Concretament: ${dbProp(st, block)}. Amb calendari i pressupost.`,
    opts: [
      { k: "concreta", label: "Concreta: proposta, xifres i calendari", d: "Gastes uns segons, però respons de veritat." },
      { k: "insisteix", label: "Insisteix en el teu missatge", d: "No et mous del que volies dir." },
      { k: "retreu", label: "Retreu-li que només t'ho pregunta a tu", d: "Arriscat: la moderadora no és el rival." },
    ] };
}

// ---------- Topades entre rivals ----------
// En els debats amb més d'un rival, de tant en tant dos rivals s'enganxen i has de decidir què fas
function dbClash(st) {
  const block = dbBlock(st);
  if (st.rivals.length < 2 || !dbIsTopic(block) || st.stats.clashes >= 2) return null;
  if (dbRand(st, `topada-${block}`) >= 0.5) return null;
  const A = dbPick(st, `topada-a-${block}`, st.rivals);
  const others = st.rivals.filter((r) => r !== A && r.kind !== A.kind);
  const B = dbPick(st, `topada-b-${block}`, others.length ? others : st.rivals.filter((r) => r !== A));
  st.stats.clashes++;
  return { type: "clash", a: A.id, b: B.id, title: "Topada entre rivals",
    lineA: dbPick(st, "topada-l", DB_CLASH[A.kind]).replace("{b}", B.cand), lineB: dbPick(st, "topada-r", DB_CLASH_REPLY[B.kind]),
    text: `${A.cand} i ${B.cand} s'enganxen. Tothom et mira: hi dius la teva?`,
    opts: [
      { k: "pau", label: "Posa-hi seny i torna al tema", d: "«Mentre vostès es barallen, la gent espera solucions.»" },
      { k: "aprofita", label: "Fica-t'hi i carrega contra el favorit", d: "Aprofites la baralla per atacar." },
      { k: "marge", label: "Queda't al marge", d: "Que es desgastin ells." },
    ] };
}

// ---------- Interrompre un rival ----------
const dbCanInterrupt = (st) => st.stats.interrupts < 2;
function dbInterrupt(st, rivalId, wasAttack) {
  const R = st.rivals.find((r) => r.id === rivalId);
  st.stats.interrupts++;
  st.time = Math.max(0, st.time - 8);
  const p = 0.4 + (st.me.style === "combat" ? 0.15 : st.me.style === "rigor" ? -0.05 : 0) + st.prep.repliques * 0.08 + (wasAttack ? 0.15 : 0) - (st.nerves > 60 ? 0.1 : 0);
  const ok = dbRand(st, "interromp") < p;
  const line = dbPick(st, "interromp-l", DB_INTERRUPTS);
  let d;
  if (ok) {
    st.stats.intOk++;
    d = dbApply(st, { base: 1.8, indecisos: wasAttack ? 1.6 : 0.2, rivals: -0.4 });
    R.imp = dbClamp(R.imp - 4);
    dbNerves(st, -4);
    dbMoment(st, "viral", `Talla ${R.cand} en directe`, true);
    return { d, ok, good: true, line, msg: wasAttack ? `Li tornes l'atac abans que acabi: ${R.cand} perd el fil.` : `Talles ${R.cand} i el desmuntes. Els teus ho celebren.` };
  }
  st.stats.intBad++;
  d = dbApply(st, { base: 0.4, indecisos: -2.2, rivals: -1 });
  R.imp = dbClamp(R.imp + 2);
  dbNerves(st, 7);
  dbMoment(st, "gaffe", `La moderadora et renya per interrompre ${R.cand}`, false);
  return { d, ok, good: false, line, msg: `${DB_MOD.name}: «Respecti el torn, si us plau.» Als indecisos no els agrada que interrompis.` };
}

function dbResolve(st, ev, k) {
  const R = ev.rival ? st.rivals.find((r) => r.id === ev.rival) : null;
  let d, msg, good = true, exp = null;
  // S'ha acabat el compte enrere sense triar res
  if (k === "silenci") {
    st.stats.silence++;
    d = dbApply(st, { base: -0.6, indecisos: -1.8 });
    dbNerves(st, 8);
    dbMoment(st, "gaffe", "Es queda en silenci davant les càmeres", false);
    return { d, msg: "Et quedes callat massa estona. Al plató, el silenci es fa etern.", good: false, exp: null };
  }
  if (ev.type === "repregunta") {
    if (k === "concreta") {
      const short = st.time < 20;
      st.time = Math.max(0, st.time - 20);
      d = dbApply(st, { base: 0.4, indecisos: 2.2, rivals: 0.4 }, short ? 0.5 : 1);
      dbNerves(st, -3);
      msg = short ? "Concretes, però vas tan just de temps que gairebé no s'entén." : "Respons de veritat. La moderadora assenteix i els indecisos prenen nota.";
    } else if (k === "insisteix") {
      st.stats.evasive++;
      d = dbApply(st, { base: 0.6, indecisos: -1.8 });
      good = false;
      msg = "Tornes a esquivar la pregunta. Fa la impressió que no tens proposta.";
    } else {
      const ok = dbRand(st, "retreu") < (st.me.style === "combat" ? 0.45 : 0.3);
      d = dbApply(st, ok ? { base: 2, indecisos: 0.4 } : { base: 0.4, indecisos: -2.6 });
      good = ok;
      dbNerves(st, ok ? -2 : 6);
      msg = ok ? "La teva queixa té gràcia i el plató somriu. T'has escapat de la pregunta." : "Carregar contra la moderadora queda molt malament. Ningú no ho entén.";
      if (!ok) dbMoment(st, "gaffe", "Es baralla amb la moderadora", false);
    }
    return { d, msg, good, exp };
  }
  if (ev.type === "clash") {
    const A = st.rivals.find((r) => r.id === ev.a), B = st.rivals.find((r) => r.id === ev.b);
    if (k === "pau") {
      st.time = Math.max(0, st.time - 15);
      d = dbApply(st, { base: 0.3, indecisos: 2.4, rivals: 0.6 });
      A.imp = dbClamp(A.imp - 2); B.imp = dbClamp(B.imp - 2);
      dbMoment(st, "viral", "«Mentre vostès es barallen, la gent espera solucions»", true);
      msg = "Quedes com l'adult de la sala. És la frase que circularà per les xarxes.";
    } else if (k === "aprofita") {
      st.time = Math.max(0, st.time - 20);
      const L = dbLeader(st);
      d = dbApply(st, { base: 2, indecisos: -0.4, rivals: -0.6 }, st.strat === "atac" ? 1.2 : 1);
      L.imp = dbClamp(L.imp - 3);
      st.stats.attacks++;
      msg = `Et fiques a la baralla i carregues contra ${L.cand}. Els teus s'animen; als indecisos, tant soroll els cansa.`;
    } else {
      d = dbApply(st, { indecisos: 0.4 });
      A.imp = dbClamp(A.imp - 3); B.imp = dbClamp(B.imp - 3);
      dbNerves(st, -2);
      msg = "Deixes que es desgastin entre ells. No guanyes gaire, però tampoc no hi perds.";
    }
    return { d, msg, good, exp };
  }
  if (ev.type === "verifica") {
    const c = DB_CLAIMS[ev.claim];
    exp = c.exp;
    if (k === "fals") {
      if (!c.ok) { d = dbApply(st, { base: 2.6, indecisos: 4.2, rivals: 1.2 }); R.imp = dbClamp(R.imp - 9); dbNerves(st, -10); st.stats.factOk++; msg = `L'has enxampat: ${R.cand} s'ha equivocat i ho has corregit en directe.`; dbMoment(st, "fact", `Corregeix ${R.cand} en directe`, true); }
      else { d = dbApply(st, { base: -1, indecisos: -3.6, rivals: -1.6 }); R.imp = dbClamp(R.imp + 5); dbNerves(st, 12); st.stats.factBad++; good = false; msg = `Error: ${R.cand} tenia raó i ara ets tu qui queda malament.`; dbMoment(st, "gaffe", "Corregeix una dada que era certa", false); }
    } else if (k === "deixa") {
      d = dbApply(st, c.ok ? { indecisos: 0.4 } : { base: -0.6, indecisos: -0.8 }); good = c.ok;
      msg = c.ok ? "Prudent: la dada era certa." : "Era fals, i has deixat escapar l'ocasió.";
    } else {
      if (c.ok) { d = dbApply(st, { indecisos: 1.4, rivals: 0.6 }); msg = "Li dones la raó en el que és cert i tornes al teu terreny. Elegant."; }
      else { d = dbApply(st, { base: -1.2, indecisos: -2 }); good = false; msg = "Li has donat la raó en una dada falsa."; dbMoment(st, "gaffe", "Dona per bona una dada falsa", false); }
    }
  } else if (ev.type === "interrupcio") {
    if (k === "sobre") { d = dbApply(st, { base: 1.6, indecisos: -2, rivals: -0.8 }); dbNerves(st, 6); good = false; msg = "Parleu tots dos alhora i no s'entén ningú. Als indecisos no els agrada."; }
    else if (k === "calma") { st.time = Math.max(0, st.time - 12); d = dbApply(st, { base: 0.4, indecisos: 2.4 + st.prep.repliques * 0.5, rivals: 0.6 }); dbNerves(st, -4); msg = "Esperes, respons amb calma i quedes per sobre. Perds uns segons."; }
    else { st.time = Math.max(0, st.time - 5); d = dbApply(st, { base: 0.6, indecisos: 1.2 }); R.imp = dbClamp(R.imp - 3); msg = `${DB_MOD.name} demana a ${R.cand} que respecti el torn.`; }
  } else if (ev.type === "personal") {
    if (k === "humor") {
      const ok = dbRand(st, "humor") < (st.me.style === "proper" ? 0.75 : st.me.style === "rigor" ? 0.45 : 0.55);
      d = dbApply(st, ok ? { base: 2, indecisos: 3, rivals: 1 } : { base: -0.4, indecisos: -1.6 });
      if (ok) { R.imp = dbClamp(R.imp - 5); dbMoment(st, "viral", `La resposta amb humor a ${R.cand}`, true); }
      good = ok; msg = ok ? "La rèplica amb humor triomfa: és el tall que circularà per les xarxes." : "La broma no fa gràcia. Silenci incòmode al plató.";
    } else if (k === "torna") { d = dbApply(st, { base: 2.2, indecisos: -1.2, rivals: -1 }); R.imp = dbClamp(R.imp - 2); dbNerves(st, 4); msg = "Intercanvi dur d'atacs. Els teus ho celebren; els indecisos, no tant."; }
    else { d = dbApply(st, { base: -0.4, indecisos: 2.2, rivals: 0.4 }); dbNerves(st, -3); msg = "No entres a l'atac personal i tornes a les propostes. Bona imatge de serenitat."; }
  } else if (ev.type === "micro") {
    if (k === "espera") { d = dbApply(st, { indecisos: 1.2 }); msg = "Esperes amb calma. Ningú no ho recordarà, i això és bo."; }
    else if (k === "broma") {
      const ok = dbRand(st, "broma") < 0.6;
      d = dbApply(st, ok ? { base: 1.6, indecisos: 2.2 } : { indecisos: -1.4 }); good = ok;
      msg = ok ? "«Sembla que algú no vol que se'ns senti», i tothom riu. Gran moment." : "La broma no s'entén i fa una mica de vergonya.";
      if (ok) dbMoment(st, "viral", "La broma de la fallada del micro", true);
    } else { d = dbApply(st, { base: 0.6, indecisos: -1.2 }); good = false; msg = "Queixar-se en directe queda malhumorat."; }
  } else if (ev.type === "trampa") {
    const far = st.me.ideo === "esq" || st.me.ideo === "dreta";
    if (k === "no") { d = dbApply(st, { base: 2.6, indecisos: far ? 0.6 : 1.2, rivals: 0.2 }); msg = "Resposta clara. Els teus votants ho agraeixen."; }
    else if (k === "si") { d = dbApply(st, { base: -3, indecisos: far ? -1.6 : 0.6, rivals: 1.2 }); good = false; msg = "Ho dius sense embuts, però a molts dels teus votants no els agrada gens."; dbMoment(st, "viral", "Obre la porta a un pacte inesperat", false); }
    else { st.stats.evasive++; d = dbApply(st, { base: -0.6, indecisos: -2.6 }); good = false; msg = `${DB_MOD.name} t'insisteix i tu tornes a esquivar-ho. Queda com una no-resposta.`; }
    st.time = Math.max(0, st.time - 30);
  } else if (ev.type === "blanc") {
    st.stats.blank++;
    const ok = k === "0";
    d = dbApply(st, ok ? { indecisos: 1.6 } : { base: -0.8, indecisos: -1.8 });
    dbNerves(st, ok ? -25 : -10);
    good = ok;
    msg = ok ? "Respires, recordes la dada i tornes a agafar el fil." : "No era aquesta. Et recuperes com pots.";
    exp = `${ev.q} ${ev.opts[0].label}.`;
  }
  return { d, msg, good, exp };
}

// Fi d'un bloc
function dbNextBlock(st) {
  // Els rivals també fan el seu debat: la majoria hi guanya una mica a cada bloc
  st.rivals.forEach((r) => { r.imp = dbClamp(r.imp + dbRand(st, `bloc-${r.id}`) * DB_RIVAL_DRIFT - 2); });
  st.bi++;
  if (st.bi >= st.blocks.length) st.done = true;
  return !st.done;
}

// ---------- Resultat ----------
function dbResult(st) {
  const me = { id: "jo", sig: st.me.sig, name: st.me.party, cand: st.me.name, color: st.me.color, imp: dbImpression(st), seats: DB_SIZES.find((s) => s.k === st.me.size).base };
  const all = [me, ...st.rivals];
  // Qui ha guanyat el debat: impressió i, una mica, la força prèvia de cada partit
  const raw = all.map((c) => Math.exp((c.imp - 50) / 9) * (0.6 + Math.log10(c.seats + 4) / 2.2));
  const sum = raw.reduce((a, b) => a + b, 0);
  const poll = all.map((c, i) => ({ id: c.id, sig: c.sig, cand: c.cand, color: c.color, pct: Math.round((raw[i] / sum) * 1000) / 10 }))
    .sort((a, b) => b.pct - a.pct);
  const rank = poll.findIndex((p) => p.id === "jo") + 1;
  const w = DB_STRAT[st.strat].w;
  const stratScore = Object.keys(w).reduce((t, k) => t + (st.seg[k] - 50) * w[k], 0);
  const vote = Math.round(Math.max(-2, Math.min(3, stratScore / 9 + (rank === 1 ? 0.6 : 0))) * 10) / 10;
  const score = Math.max(0, Math.round(me.imp * 6 + (rank === 1 ? 250 : rank === 2 ? 120 : 0) + st.stats.factOk * 60 - st.stats.factBad * 40 - st.stats.cut * 50 - st.stats.evasive * 30 + Math.max(0, stratScore) * 4));
  const best = st.moments.filter((m) => m.good).slice(-1)[0] || null;
  const worst = st.moments.filter((m) => !m.good)[0] || null;
  return { poll, rank, vote, score, imp: me.imp, seg: { ...st.seg }, best, worst, xp: Math.min(160, Math.round(score / 7)) };
}
// Lliçons a partir de la partida
function dbLessons(st, res) {
  const L = [];
  if (st.stats.cut) L.push("Controla el minutatge: si et quedes sense temps, la moderadora et talla i el missatge es perd.");
  if (st.stats.attacks >= 3) L.push("Atacar mobilitza els teus, però als indecisos els cansa: dosifica-ho.");
  if (st.stats.factOk) L.push("Verificar dades en directe és arriscat, però si l'encertes és el moment que més es recorda.");
  if (st.stats.factBad) L.push("Corregir el rival sense estar-ne segur pot girar-se en contra: abans de dir «és fals», cal saber-ho.");
  if (st.stats.evasive) L.push("Les preguntes sobre pactes s'han de respondre: esquivar-les sembla que amaguis alguna cosa.");
  if (st.stats.intBad) L.push("Interrompre és arriscat: si no tens raó o el moment no és bo, la moderadora et renya i els indecisos ho noten.");
  else if (st.stats.intOk) L.push("Una interrupció a temps pot ser el moment de la nit, però no en facis un costum.");
  if (st.stats.silence) L.push("En un debat, quedar-se callat és la pitjor resposta: millor una resposta curta que cap.");
  if (st.stats.followups && st.stats.evasive) L.push("Quan la moderadora repregunta, és que no has respost: concretar és la manera de sortir-ne bé.");
  if (res.seg.indecisos > 60) L.push("Els debats es guanyen sobretot entre els indecisos: propostes concretes i to serè.");
  L.push("Els debats a la televisió segueixen el criteri de proporcionalitat de la Junta Electoral Central: hi participen els partits segons la representació que tenen.");
  L.push("L'ordre d'intervenció i els temps de cada candidat es pacten abans i sovint se sortegen.");
  return L.slice(0, 5);
}
