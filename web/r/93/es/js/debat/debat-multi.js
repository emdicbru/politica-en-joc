// Simulador de debat electoral · Debat entre amics (de 2 a 4 candidats): motor. No toca el DOM (es prova amb Node).
// Tots els candidats són jugadors. Cada bloc: la moderadora pregunta, tothom tria la resposta alhora (fase «tria»),
// el plató reprodueix les intervencions («show»), qui ha rebut un atac pot replicar («replica») i es veuen les rèpliques
// («show2»). L'amfitrió calcula cada pas amb aquestes funcions i l'escriu a la sala: tothom veu el mateix.

const DBM_SECS = 240; // temps de cada candidat
const DBM_TRIA = 35000, DBM_REPLICA = 18000, DBM_SHOW = 75000; // temps màxim de cada fase (ms)
const DBM_TOPICS = 2;

function dbmRand(S, tag) {
  let a = dbHash(`${S.seed}|${tag}|${S.rc++}`);
  a = (a + 0x6d2b79f5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const dbmImp = (seg) => Math.round(Object.keys(DB_SEG_W).reduce((t, k) => t + seg[k] * DB_SEG_W[k], 0));
const dbmOthers = (S, uid) => S.order.filter((u) => u !== uid);
const dbmName = (S, uid) => S.cand[uid]?.name || "Candidato";
const dbmSurname = (S, uid) => dbSurname(dbmName(S, uid));
// «el senyor Prats», «la senyora Ribas»
function dbmTract(S, uid, how = "") {
  const fem = dbFem(S.cand[uid]?.look);
  const s = `${fem ? "señora" : "señor"} ${dbmSurname(S, uid)}`;
  if (how === "voc") return s[0].toUpperCase() + s.slice(1);
  const t = `${fem ? "la" : "el"} ${s}`;
  return how === "cap" ? t[0].toUpperCase() + t.slice(1) : t;
}

// players: [{ uid, cand: { name, party, sig, color, ideo, terr, style, look, skin, hairC } }]
function dbmNew({ seed, players }) {
  const S = { v: 1, seed: String(seed), rc: 0, cand: {}, P: {}, bi: 0, phase: "tria", rounds: [], social: [] };
  players.forEach(({ uid, cand }) => {
    S.cand[uid] = { ...cand };
    S.P[uid] = { seg: { base: 55, indecisos: 45, rivals: 30 }, time: DBM_SECS, last: null, curve: [], stats: { attacks: 0, attacked: 0, cut: 0, silence: 0, repOk: 0 }, moments: [] };
    S.P[uid].curve.push(dbmImp(S.P[uid].seg));
  });
  S.order = players.map((p) => p.uid).map((u) => [u, dbHash(`${seed}|ordre|${u}`)]).sort((a, b) => a[1] - b[1]).map(([u]) => u);
  const score = (t) => dbHash(`${seed}|tema|${t}`) / 4294967296 + (t === "economia" || t === "habitatge" ? 0.3 : 0);
  const topics = [...DB_TOPICS].sort((a, b) => score(b) - score(a)).slice(0, DBM_TOPICS);
  S.blocks = ["obertura", ...DB_TOPICS.filter((t) => topics.includes(t)), "tancament"];
  S.q = S.blocks.map((b) => { const B = DB_BLOCKS[b]; return B.qs ? B.qs[dbHash(`${seed}|q|${b}`) % B.qs.length] : B.q; });
  return S;
}
const dbmBlock = (S) => S.blocks[S.bi];
const dbmTema = (S, block) => (DB_TOPICS.includes(block) ? block : S.blocks.find((b) => DB_TOPICS.includes(b)) || "habitatge");
function dbmProp(S, uid, block) {
  const c = S.cand[uid], tema = dbmTema(S, block);
  return tema === "territori" ? DB_PROPOSALS.territori[c.terr] : (DB_PROPOSALS[tema] || DB_PROPOSALS.habitatge)[c.ideo];
}
// L'ordre de paraula d'un bloc: el sortejat, rodant a cada bloc
const dbmTurns = (S, bi = S.bi) => S.order.map((_, i) => S.order[(i + bi) % S.order.length]);

// Les cartes de resposta d'un candidat en el bloc actual. Els atacs (un per rival) diuen a qui van.
function dbmCards(S, uid) {
  const block = dbmBlock(S);
  const fill = (q, target) => q.replace("{story}", DB_STORIES[block] || DB_STORIES.obertura).replace("{rival}", dbmTract(S, target, "cap"))
    .replace("{tema}", DB_TOPIC_NAMES[dbmTema(S, block)] || "la vivienda").replace("{proposal}", dbmProp(S, uid, block));
  const big = dbmOthers(S, uid).sort((a, b) => dbmImp(S.P[b].seg) - dbmImp(S.P[a].seg))[0];
  if (block === "obertura") return DB_OPENINGS.map((o) => ({ k: o.k, label: o.label, icon: DB_APPROACHES[o.k].icon, secs: 45, target: o.k === "atac" ? big : null, quote: fill(o.quote, big) }));
  if (block === "tancament") return DB_CLOSINGS.map((o) => ({ k: o.k, label: o.label, icon: "⏱", secs: 60, closing: true, quote: fill(o.quote, big) }));
  const prop = dbmProp(S, uid, block);
  const cards = [
    { k: "proposta", label: DB_APPROACHES.proposta.label, icon: DB_APPROACHES.proposta.icon, secs: DB_APPROACHES.proposta.secs, quote: `Nuestra propuesta es clara: ${prop}. Y lo haremos el primer año de gobierno.` },
    { k: "dades", label: DB_APPROACHES.dades.label, icon: DB_APPROACHES.dades.icon, secs: DB_APPROACHES.dades.secs, quote: `Se lo explico con números: ${prop}. Lo que cuesta, de dónde sale el dinero y el calendario, punto por punto.` },
    { k: "emocio", label: DB_APPROACHES.emocio.label, icon: DB_APPROACHES.emocio.icon, secs: DB_APPROACHES.emocio.secs, quote: `${DB_STORIES[block]}. Por eso proponemos ${prop}.` },
  ];
  dbmOthers(S, uid).forEach((t) => cards.push({ k: "atac", label: `Ataca a ${S.cand[t].sig}`, icon: DB_APPROACHES.atac.icon, secs: DB_APPROACHES.atac.secs, target: t,
    quote: `Mientras ${dbmTract(S, t)} hace promesas, la gente espera. Ya basta de excusas: nosotros proponemos ${prop}.` }));
  return cards;
}

function dbmApply(S, uid, fx, mult = 1) {
  const P = S.P[uid], d = {};
  Object.keys(fx).forEach((k) => {
    const before = P.seg[k];
    P.seg[k] = dbClamp(P.seg[k] + fx[k] * mult * DB_K);
    d[k] = Math.round((P.seg[k] - before) * 10) / 10;
  });
  P.curve.push(dbmImp(P.seg));
  return d;
}
// Les intervencions del bloc. choices: { uid: índex de carta | null (no ha triat: silenci) }
function dbmRound(S, choices) {
  const block = dbmBlock(S), bi = S.bi;
  const speeches = [], attacks = [];
  dbmTurns(S).forEach((uid) => {
    const P = S.P[uid], c = S.cand[uid];
    const cards = dbmCards(S, uid);
    const card = choices[uid] === null || choices[uid] === undefined ? null : cards[choices[uid]];
    if (!card) {
      P.stats.silence++;
      const d = dbmApply(S, uid, { base: -0.6, indecisos: -1.8 });
      P.moments.push({ bi, good: false, t: "Se queda en silencio cuando le toca hablar" });
      speeches.push({ uid, k: "silenci", quote: "…", d, cut: false });
      return;
    }
    const style = DB_STYLES.find((s) => s.k === c.style) || DB_STYLES[0];
    const fx = card.closing ? DB_CLOSINGS.find((x) => x.k === card.k).fx : DB_APPROACHES[card.k].fx;
    let mult = (style.fx[card.k] || 1) * (0.9 + dbmRand(S, `soroll-${uid}`) * 0.2);
    if (P.last === card.k && !card.closing) mult *= 0.7; // repetir-se cansa
    const cut = card.secs > P.time;
    if (cut) { mult *= 0.5; P.stats.cut++; P.moments.push({ bi, good: false, t: "Se queda sin tiempo y la moderadora lo corta" }); }
    P.time = Math.max(0, P.time - card.secs);
    const d = dbmApply(S, uid, fx, mult);
    if (!card.closing) P.last = card.k;
    if (d.indecisos >= 4 || d.base >= 5) P.moments.push({ bi, good: true, t: `«${card.quote.split(/[.:]/)[0]}»` });
    if (card.target) {
      P.stats.attacks++;
      S.P[card.target].stats.attacked++;
      const hurt = dbmApply(S, card.target, { base: -0.3, indecisos: -1.1, rivals: -0.2 }, mult);
      attacks.push({ from: uid, to: card.target, hurt });
    }
    speeches.push({ uid, k: card.k, label: card.label, quote: card.quote, d, cut, target: card.target || null });
  });
  S.rounds[bi] = { bi, block, speeches, attacks, replies: [] };
  S.phase = "show";
  return S.rounds[bi];
}
// Qui pot replicar en aquest bloc (ha rebut algun atac) i a qui
const dbmReplyers = (S) => [...new Set((S.rounds[S.bi]?.attacks || []).map((a) => a.to))];
const DBM_REPLY = [
  { k: "dades", label: "Réplica con datos", d: "Desmontas el ataque con hechos." },
  { k: "dura", label: "Réplica contundente", d: "Le devuelves el ataque, sin contemplaciones." },
  { k: "calma", label: "No entres al trapo", d: "Sonríes y vuelves a tus propuestas." },
];
// Les rèpliques. replies: { uid: k | null }
function dbmReply(S, replies) {
  const R = S.rounds[S.bi];
  dbmReplyers(S).forEach((uid) => {
    const P = S.P[uid], c = S.cand[uid];
    const att = R.attacks.filter((a) => a.to === uid).map((a) => a.from);
    const k = replies[uid] || null;
    let d, ok = true, line;
    if (!k) { d = dbmApply(S, uid, { base: -0.4, indecisos: -1.2 }); ok = false; line = "…"; P.stats.silence++; }
    else if (k === "dades") {
      ok = dbmRand(S, `rep-${uid}`) < 0.5 + (c.style === "rigor" ? 0.15 : 0);
      d = dbmApply(S, uid, ok ? { base: 1.5, indecisos: 2.4, rivals: 0.6 } : { base: 0.4, indecisos: -1, rivals: -0.4 });
      if (ok) { P.stats.repOk++; att.forEach((a) => dbmApply(S, a, { indecisos: -1.2 })); P.moments.push({ bi: S.bi, good: true, t: `Réplica con datos a ${dbmName(S, att[0])}` }); }
      line = ok ? `Los datos le desmienten, ${dbmTract(S, att[0], "voc").toLowerCase()}: no es lo que dice, y lo sabe.` : "Bueno… las cifras… ahora no las tengo aquí, pero le aseguro que no es así.";
    } else if (k === "dura") {
      const style = DB_STYLES.find((s) => s.k === c.style) || DB_STYLES[0];
      d = dbmApply(S, uid, { base: 2.4, indecisos: -0.4, rivals: -1 }, style.fx.atac);
      att.forEach((a) => dbmApply(S, a, { base: -0.3, indecisos: -0.6 }));
      line = `Lecciones, de usted, ni una, ${dbmTract(S, att[0], "voc").toLowerCase()}. La gente sabe perfectamente quién es quién.`;
    } else {
      d = dbmApply(S, uid, { base: -0.6, indecisos: 1.4, rivals: 0.4 });
      line = "No entraré en ese juego. Prefiero hablar de lo que importa a la gente.";
    }
    R.replies.push({ uid, k, ok, d, line, to: att[0] });
  });
  S.phase = "show2";
}
// Passa al bloc següent (o s'acaba el debat)
function dbmNext(S) {
  S.bi++;
  S.phase = S.bi >= S.blocks.length ? "fi" : "tria";
}

// ---------- Resultat: enquesta flash, grups de votants i portades ----------
function dbmResult(S) {
  const ids = S.order;
  const raw = ids.map((u) => Math.exp((dbmImp(S.P[u].seg) - 50) / 9));
  const sum = raw.reduce((a, b) => a + b, 0);
  const poll = ids.map((u, i) => ({ uid: u, name: dbmName(S, u), sig: S.cand[u].sig, color: S.cand[u].color, pct: Math.round((raw[i] / sum) * 1000) / 10, imp: dbmImp(S.P[u].seg) }))
    .sort((a, b) => b.pct - a.pct);
  const bySeg = Object.keys(DB_SEG_W).map((k) => {
    const r = ids.map((u) => Math.exp((S.P[u].seg[k] - 50) / 14));
    const t = r.reduce((a, b) => a + b, 0);
    const best = ids.map((u, i) => ({ uid: u, pct: Math.round((r[i] / t) * 1000) / 10 })).sort((a, b) => b.pct - a.pct)[0];
    return { k, uid: best.uid, pct: best.pct };
  });
  const win = poll[0], second = poll[1];
  const tense = ids.reduce((t, u) => t + S.P[u].stats.attacks, 0) >= ids.length;
  const best = (u) => S.P[u].moments.filter((m) => m.good).slice(-1)[0];
  const heads = [
    win.pct - second.pct < 4 ? `Empate técnico: ${dbSurname(win.name)} y ${dbSurname(second.name)} se separan por menos de cuatro puntos` : `${dbSurname(win.name)} gana el debate, según la encuesta flash`,
    best(win.uid) ? `La frase de la noche: ${best(win.uid).t}` : `${dbSurname(second.name)} aguanta el tipo`,
    tense ? "Un debate bronco, con ataques y réplicas" : "Un debate de propuestas, con pocos choques",
  ];
  return { poll, bySeg, papers: heads.map((h, i) => ({ paper: DB_PAPERS[i], h })), n: 1000, moe: 3.1 };
}
