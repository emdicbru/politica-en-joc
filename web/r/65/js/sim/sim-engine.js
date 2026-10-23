// Simulador del 29N · Motor. No toca el DOM: es pot provar amb Node.
// Tot és determinista: mateixa llavor + mateixes decisions = mateix resultat.

// ---------- Atzar amb llavor ----------
function simHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function simMulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Cada sorteig de la partida té una etiqueta i un comptador: així l'ordre de les decisions no altera els altres sortejos
function simRand(state, tag) {
  state.rc = (state.rc || 0) + 1;
  return simMulberry(simHash(`${state.seed}|${tag}|${state.rc}`))();
}
function simGauss(rng) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- Llei d'Hondt: la mateixa funció que el simulador de l'Aprèn ----------
function simDhondt(votes, seats) {
  if (typeof dhondt === "function") return dhondt(votes, seats);
  const qs = [];
  votes.forEach((v, pi) => { for (let d = 1; d <= seats; d++) qs.push({ pi, d, q: v / d }); });
  qs.sort((a, b) => b.q - a.q || votes[b.pi] - votes[a.pi]);
  const winners = qs.slice(0, seats);
  const won = votes.map(() => 0);
  winners.forEach((w) => won[w.pi]++);
  return { won, winners, next: qs[seats] };
}

// ---------- Paràmetres del model ----------
const SIM_K = {
  alpha: 0.95, // pes de la distància ideològica
  beta: 1.3, // pes de la coincidència de temes
  gamma: 0.9, // pes del líder
  temp: 1, // temperatura de la tria (més alta = electorat més volàtil)
  useful: 0.9, // força del vot útil
  census: 0.777, // electors / població (cens del 29N sobre població INE)
  blank: 0.012, null: 0.01,
  threshold: 0.03,
};

// ---------- Partida nova ----------
// party: { name, sig, color, eco, ter, val, prio: [3 índexs de tema], attrs: { car, sol, prox } (1-5, suma 9) }
function simNewGame({ seed, mode = "express", diff = "normal", party }) {
  const D = SIM_DIFF[diff] || SIM_DIFF.normal;
  const iss = SIM_THEMES.map((_, k) => (party.prio.includes(k) ? 1 : 0.3));
  const a = party.attrs;
  const me = {
    id: "jo", name: party.name, sig: party.sig, color: party.color, eco: party.eco, ter: party.ter, val: party.val,
    iss, attrs: { ...a }, lead: Math.min(0.75, 0.3 + (a.car * 0.4 + a.sol * 0.3 + a.prox * 0.3) / 12), prio: [...party.prio],
    shape: party.shape || "cercle", motto: party.motto || "", leader: party.leader || "",
  };
  const state = {
    v: SIM_VERSION, seed: String(seed), mode, diff, rc: 0,
    day: 1, slot: 0, days: 6, // sis dies de campanya i la jornada de reflexió, a tots els modes
    money: D.money, cred: 60, moral: 60, media: 20,
    me, rivals: SIM_RIVALS.map((r) => ({ ...r, iss: [...r.iss] })), // còpia: la partida pot canviar els temes dels rivals
    awG: D.aw, aw: SIM_PROVS.map(() => 0),
    camp: {}, glob: {}, noise: {}, used: { cand: [] }, seg: {}, offers: [], challenges: [],
    log: [], polls: [], phase: "campaign",
  };
  const ids = ["jo", ...SIM_RIVALS.map((r) => r.id)];
  ids.forEach((id) => {
    state.camp[id] = SIM_PROVS.map(() => 0);
    state.glob[id] = 0;
    const rng = simMulberry(simHash(`${state.seed}|noise|${id}`));
    state.noise[id] = SIM_PROVS.map(() => simGauss(rng) * D.noise);
  });
  simDayOffers(state);
  return state;
}

const simParties = (state) => [state.me, ...state.rivals];
// Els partits territorials només es presenten a les seves comunitats
const simStands = (party, prov) => (!party.ccaa || party.ccaa.includes(prov.ccaa)) && (!party.only || prov.ter >= party.only);
const simAware = (state, i) => 1 - (1 - state.awG) * (1 - state.aw[i]);

// Utilitat d'un partit per a un tipus de votant d'una província
function simUtility(state, party, seg, prov, i) {
  const segTer = seg.ter ?? 1.5 + prov.ter * 5;
  const wt = seg.k === "sob" ? 2.5 : 0.6 + prov.ter;
  const d = Math.sqrt((seg.eco - party.eco) ** 2 + wt * (segTer - party.ter) ** 2 + 0.8 * (seg.val - party.val) ** 2);
  let salSum = 0, match = 0;
  seg.sal.forEach((s, k) => { salSum += s; match += s * party.iss[k]; });
  let u = -SIM_K.alpha * d + SIM_K.beta * (match / salSum) + SIM_K.gamma * party.lead + (party.base || 0);
  // Implantació territorial: alguns partits són més forts a les províncies rurals (rural > 0) i d'altres a les urbanes
  if (party.rural) u += party.rural * (0.5 - prov.urb);
  u += state.camp[party.id][i] + state.glob[party.id] + state.noise[party.id][i];
  if (party.id === "jo") {
    u += Math.log(Math.max(0.02, simAware(state, i)));
    // Guanys o pèrdues amb un tipus de votant concret (fòrums sectorials, entrevistes a un públic jove...)
    if (state.seg) u += state.seg[seg.k] || 0;
  }
  return u;
}

// Vots d'una província. «viab»: viabilitat de cada partit (0-1) per aplicar el vot útil.
function simProvVotes(state, prov, i, viab = null) {
  const parties = simParties(state).filter((p) => simStands(p, prov));
  const w = simSegmentWeights(prov);
  const electors = prov.pop * SIM_K.census;
  const votes = Object.fromEntries(parties.map((p) => [p.id, 0]));
  let cast = 0;
  SIM_SEGMENTS.forEach((seg) => {
    const share = w[seg.k];
    if (!share) return;
    const turnout = Math.min(0.95, seg.turn + (state.turnBoost || 0));
    const n = electors * share * turnout;
    cast += n;
    const util = parties.map((p) => {
      let u = simUtility(state, p, seg, prov, i);
      if (viab) u -= SIM_K.useful * (seg.k === "sob" ? 0.5 : 1) * (1 - viab[p.id]);
      return Math.exp(u / SIM_K.temp);
    });
    const tot = util.reduce((a, b) => a + b, 0);
    parties.forEach((p, k) => { votes[p.id] += n * (1 - SIM_K.blank - SIM_K.null) * (util[k] / tot); });
  });
  const blank = cast * SIM_K.blank, nul = cast * SIM_K.null;
  Object.keys(votes).forEach((id) => { votes[id] = Math.round(votes[id]); });
  return { votes, blank: Math.round(blank), null: Math.round(nul), cast: Math.round(cast), electors: Math.round(electors) };
}

// Repartiment d'una província amb el llindar del 3 % sobre els vots vàlids (blancs inclosos)
function simSeatsFor(votes, blank, seats) {
  const ids = Object.keys(votes);
  const valid = ids.reduce((s, id) => s + votes[id], 0) + blank;
  const min = valid * SIM_K.threshold;
  const elig = ids.filter((id) => votes[id] >= min);
  const res = simDhondt(elig.map((id) => votes[id]), seats);
  const won = Object.fromEntries(ids.map((id) => [id, 0]));
  elig.forEach((id, k) => { won[id] = res.won[k]; });
  return { won, valid, min, elig, winners: res.winners.map((w) => ({ id: elig[w.pi], d: w.d, q: w.q })), next: res.next ? { id: elig[res.next.pi], q: res.next.q } : null };
}

// Elecció completa: dues passades (la segona aplica el vot útil a partir de la primera)
function simElection(state) {
  const provs = SIM_PROVS.map((prov, i) => {
    const first = simProvVotes(state, prov, i);
    const s1 = simSeatsFor(first.votes, first.blank, prov.seats);
    const valid = s1.valid, viab = {};
    Object.keys(first.votes).forEach((id) => {
      const share = first.votes[id] / valid;
      // Un partit és viable si té (o freguen) escó; si no, perd part del vot útil
      const need = 1 / (prov.seats + 1);
      viab[id] = s1.won[id] > 0 ? 1 : Math.min(1, share / need);
    });
    const fin = simProvVotes(state, prov, i, viab);
    const seats = simSeatsFor(fin.votes, fin.blank, prov.seats);
    return { i, name: prov.name, seats: prov.seats, ...fin, ...seats, first: first.votes };
  });
  const ids = simParties(state).map((p) => p.id);
  // «useful»: vots que cada partit perd (o guanya, si és negatiu) per l'efecte del vot útil
  const totals = Object.fromEntries(ids.map((id) => [id, { votes: 0, seats: 0, useful: 0 }]));
  let valid = 0, cast = 0, electors = 0;
  provs.forEach((p) => {
    valid += p.valid; cast += p.cast; electors += p.electors;
    Object.keys(p.votes).forEach((id) => { totals[id].votes += p.votes[id]; totals[id].seats += p.won[id]; totals[id].useful += p.first[id] - p.votes[id]; });
  });
  ids.forEach((id) => { totals[id].share = totals[id].votes / valid; });
  return { provs, totals, valid, cast, electors, turnout: cast / electors };
}

// Estimació ràpida (per a l'enquesta del joc): resultat + soroll amb marge d'error.
// També estima cada circumscripció: partit que va primer, posició del jugador i vots que li falten per al pròxim escó.
function simPoll(state, sample = 1200) {
  const r = simElection(state);
  const margin = 1.96 * Math.sqrt(0.25 / sample) * 100;
  const est = {};
  Object.keys(r.totals).forEach((id) => {
    // L'error de cada partit depèn de la seva mida: és més petit com més petit és el partit
    const sh = r.totals[id].share;
    const err = (simRand(state, `poll-${id}`) - 0.5) * 2 * 1.96 * Math.sqrt((sh * (1 - sh)) / sample) * 100 * 0.6;
    est[id] = Math.max(0, sh * 100 + err);
  });
  const provs = r.provs.map((p) => {
    const order = Object.keys(p.votes).sort((a, b) => p.votes[b] - p.votes[a]);
    const gap = simSeatGap(p);
    return { lead: order[0], rank: order.indexOf("jo") + 1, won: p.won.jo || 0, need: gap === null ? null : Math.round((gap / p.valid) * 1000) / 10 };
  });
  return { day: state.day, est, margin, sample, provs };
}

// Vots que li falten al jugador per guanyar un escó més en una circumscripció (null si no s'hi presenta)
function simSeatGap(p) {
  if (p.votes.jo === undefined) return null;
  const v = p.votes.jo, won = p.won.jo || 0;
  const last = p.winners[p.winners.length - 1];
  if (!last) return null;
  if (last.id === "jo") return p.next ? 0 : null;
  return Math.ceil(Math.max(p.elig.includes("jo") ? 0 : p.min - v, last.q * (won + 1) - v)) + 1;
}

// ---------- Campanya: accions del jugador ----------
const SIM_ACTIONS = {
  miting: { label: "Míting", cost: 8, needProv: true, desc: "Efecte fort en una circumscripció i una mica a la resta de la comunitat." },
  xarxes: { label: "Campanya a les xarxes", cost: 3, desc: "Arriba a tot arreu, sobretot al jovent. Pot generar polèmica." },
  entrevista: { label: "Entrevista", cost: 4, desc: "Depèn de la solvència del líder. Pot sortir molt bé o malament." },
  candidat: { label: "Fitxar un candidat local", cost: 15, needProv: true, desc: "Un nom conegut a la circumscripció. Una vegada per província." },
  tema: { label: "Reforçar un tema", cost: 5, needTheme: true, desc: "Fa més creïble una de les teves propostes." },
  coalicio: { label: "Coalició preelectoral", cost: 10, needProv: true, desc: "Aneu junts amb una candidatura local a tota la comunitat: sumeu vots, però compartiu llista." },
  matisar: { label: "Matisar una posició", cost: 2, needAxis: true, desc: "Acostes una posició al centre. Hi ha votants moderats que t'escolten, però perds credibilitat." },
  enquesta: { label: "Encarregar una enquesta", cost: 6, free: true, desc: "Una enquesta del joc nova, amb el detall de cada circumscripció. No gasta cap franja." },
};
const SIM_AXES = { eco: "economia", ter: "model territorial", val: "valors" };

function simCanAct(state, type, arg) {
  const a = SIM_ACTIONS[type];
  if (!a || state.phase !== "campaign") return "No és moment de campanya.";
  if (!a.free && state.slot >= 3) return "Ja no et queden franges avui.";
  if (state.money < a.cost) return "No et queden prou diners.";
  if (a.needProv && !(arg >= 0 && arg < SIM_PROVS.length)) return "Cal triar una circumscripció.";
  if (type === "candidat" && state.used.cand.includes(arg)) return "Ja tens un candidat local en aquesta circumscripció.";
  if (type === "coalicio" && (state.used.coal || []).includes(SIM_PROVS[arg].ccaa)) return "Ja tens una coalició en aquesta comunitat.";
  if (type === "coalicio" && (state.used.coal || []).length >= 2) return "Com a màxim, dues coalicions per campanya.";
  if (a.needTheme && !(arg >= 0 && arg < SIM_THEMES.length)) return "Cal triar un tema.";
  if (a.needAxis && !SIM_AXES[arg]) return "Cal triar un eix.";
  if (type === "matisar" && Math.abs(state.me[arg] - 5) < 0.8) return "En aquest eix ja ets a prop del centre.";
  if (type === "enquesta" && state.polls.some((p) => p.day === state.day)) return "Avui ja tens una enquesta.";
  return null;
}

function simAct(state, type, arg = null) {
  const err = simCanAct(state, type, arg);
  if (err) return { ok: false, msg: err };
  const a = SIM_ACTIONS[type];
  const me = state.me, camp = state.camp.jo;
  state.money -= a.cost;
  if (!a.free) state.slot++;
  let msg = "", good = true;
  if (type === "miting") {
    const p = SIM_PROVS[arg];
    // A les circumscripcions petites, un míting arriba a una part més gran de l'electorat
    const boost = (0.18 + 0.03 * me.attrs.prox) * (1 + 0.9 * (1 - Math.min(p.seats, 16) / 16));
    state.aw[arg] += (1 - state.aw[arg]) * 0.35;
    camp[arg] += boost;
    SIM_PROVS.forEach((q, j) => { if (j !== arg && q.ccaa === p.ccaa) { camp[j] += boost * 0.25; state.aw[j] += (1 - state.aw[j]) * 0.1; } });
    state.media += 2;
    msg = `Míting a ${p.name}: més notorietat i suport a la circumscripció.`;
  } else if (type === "xarxes") {
    // Les xarxes es saturen: cada missatge nou arriba a menys gent
    state.used.xarxes = (state.used.xarxes || 0) + 1;
    const sat = 1 / (1 + 0.14 * (state.used.xarxes - 1));
    state.awG += (1 - state.awG) * 0.05 * sat;
    state.glob.jo += 0.03 * sat;
    if (simRand(state, "xarxes") < 0.18) {
      state.cred -= 6; state.glob.jo -= 0.05; good = false;
      msg = "Un missatge a les xarxes genera polèmica: perds credibilitat.";
    } else msg = "La campanya a les xarxes fa créixer la teva notorietat.";
  } else if (type === "entrevista") {
    const p = 0.3 + 0.06 * me.attrs.sol + state.cred / 400;
    if (simRand(state, "entrevista") < p) {
      state.awG += (1 - state.awG) * 0.06; state.cred += 3; state.glob.jo += 0.04;
      msg = "L'entrevista surt bé: guanyes credibilitat i visibilitat.";
    } else {
      state.cred -= 5; state.glob.jo -= 0.03; good = false;
      msg = "L'entrevista es complica: una resposta poc clara et fa perdre credibilitat.";
    }
  } else if (type === "candidat") {
    camp[arg] += 0.32; state.aw[arg] += (1 - state.aw[arg]) * 0.25; state.used.cand.push(arg);
    msg = `Fitxes un candidat conegut a ${SIM_PROVS[arg].name}.`;
  } else if (type === "tema") {
    me.iss[arg] = Math.min(1.3, me.iss[arg] + 0.2);
    state.glob.jo += 0.02;
    msg = `Reforces la proposta de ${SIM_THEMES[arg].label.toLowerCase()}.`;
  } else if (type === "coalicio") {
    // Soci local: una candidatura amb la identitat territorial mitjana de la comunitat. Com més lluny ideològicament, menys suma.
    const p = SIM_PROVS[arg];
    const mates = SIM_PROVS.filter((q) => q.ccaa === p.ccaa);
    const ally = { eco: 5, val: 5, ter: 1 + 8 * (mates.reduce((t, q) => t + q.ter, 0) / mates.length) };
    const d = Math.min(1, Math.hypot(ally.eco - me.eco, ally.ter - me.ter, ally.val - me.val) / 10);
    const boost = 0.26 * (1 - d);
    mates.forEach((q) => { camp[q.i] += boost; state.aw[q.i] += (1 - state.aw[q.i]) * 0.15; });
    state.cred -= Math.round(2 + d * 8);
    (state.used.coal = state.used.coal || []).push(p.ccaa);
    msg = `Coalició amb una candidatura local a ${p.ccaa}: sumeu forces a ${mates.length === 1 ? "la circumscripció" : `les ${mates.length} circumscripcions`}.`;
    good = d < 0.45;
  } else if (type === "matisar") {
    const before = me[arg];
    me[arg] = Math.round((before + (5 - before) * 0.3) * 10) / 10;
    state.cred -= 5;
    msg = `Matises la teva posició en ${SIM_AXES[arg]}: alguns votants moderats t'escolten, però et retreuen el canvi.`;
  } else if (type === "enquesta") {
    state.polls.push(simPoll(state, 1600));
    msg = "Tens una enquesta del joc nova, amb el detall de cada circumscripció.";
  }
  state.cred = Math.max(0, Math.min(100, state.cred));
  state.glob.jo = Math.max(-0.6, Math.min(0.8, state.glob.jo));
  // La credibilitat també pesa: per sota de 40 resta, per sobre de 70 suma
  state.glob.jo += state.cred < 40 ? -0.01 : state.cred > 70 ? 0.01 : 0;
  state.log.push({ day: state.day, type, arg, msg, good, round: state.round || 1 });
  return { ok: true, msg, good };
}

// Els rivals juguen a sim-ai.js (simRivalsTurn).

// Acaba la jornada: torn dels rivals i, cada 3 dies, enquesta del joc
function simEndDay(state) {
  const moves = simRivalsTurn(state);
  let poll = null;
  if (state.day % 3 === 0) { poll = simPoll(state); state.polls.push(poll); }
  state.day++;
  state.slot = 0;
  state.money += 6; // aportacions diàries de la militància
  if (state.day > state.days) state.phase = "reflection";
  else simDayOffers(state);
  return { moves, poll };
}

// ---------- Debat: 3 preguntes; cada resposta té un perfil ideològic ----------
// answers: [{ eco, ter, val }] (posició de la resposta triada). Puntua coherència amb el partit i l'atractiu general.
function simDebate(state, answers) {
  const me = state.me;
  let coh = 0, appeal = 0;
  answers.forEach((a) => {
    coh += 1 - Math.min(1, Math.hypot(a.eco - me.eco, a.ter - me.ter, a.val - me.val) / 8);
    appeal += 1 - Math.min(1, Math.hypot(a.eco - 5, a.ter - 4, a.val - 5) / 8);
  });
  coh /= answers.length; appeal /= answers.length;
  const score = 0.5 * coh + 0.3 * appeal + 0.2 * (me.attrs.car / 5);
  const delta = (score - 0.55) * 0.5;
  state.glob.jo += delta;
  state.awG += (1 - state.awG) * 0.08;
  state.cred += Math.round((coh - 0.6) * 20);
  state.cred = Math.max(0, Math.min(100, state.cred));
  return { score, coh, appeal, delta };
}


// Potencial del partit: escons que tindria si tothom el conegués, sense campanya de ningú.
// Serveix per fixar objectius justos per a qualsevol ideologia.
function simPotential(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.awG = 1;
  s.aw = s.aw.map(() => 1);
  Object.keys(s.camp).forEach((id) => { s.camp[id] = s.camp[id].map(() => 0); s.glob[id] = 0; });
  return simElection(s).totals.jo.seats;
}

// =========================================================
// Del vot al govern: opinions dels partits, línies vermelles i investidura
// =========================================================
const simPartyById = (state, id) => (id === "jo" ? state.me : state.rivals.find((r) => r.id === id));
const simDistP = (a, b) => Math.hypot(a.eco - b.eco, a.ter - b.ter, a.val - b.val);
const simMeasure = (id) => SIM_MEASURES.find((m) => m.id === id);
const SIM_MAJ = 176;
// Primera lletra en minúscula (per inserir el nom d'una mesura dins d'una frase sense tocar les sigles)
const simLc = (t) => t.charAt(0).toLowerCase() + t.slice(1);

// Opinió d'un partit sobre una mesura: 1 la defensa, 0 li és indiferent, -1 la rebutja
function simMeasureView(party, m) {
  return Math.max(-1, Math.min(1, 1 - Math.abs(m.p - party[m.ax]) / 3));
}
// Línia vermella: una mesura molt allunyada en un tema que li importa
function simIsRedLine(party, m) {
  return Math.abs(m.p - party[m.ax]) >= 5 && party.iss[m.th] >= 0.5;
}
const simRedLines = (party) => SIM_MEASURES.filter((m) => simIsRedLine(party, m));
// El que vol: per als dos temes que més li importen, la mesura més propera a la seva posició
function simWants(party) {
  const ths = party.iss.map((v, th) => ({ v, th })).sort((a, b) => b.v - a.v || a.th - b.th).slice(0, 2);
  return ths.map(({ th }) => SIM_MEASURES.filter((m) => m.th === th)
    .sort((a, b) => Math.abs(a.p - party[a.ax]) - Math.abs(b.p - party[b.ax]))[0]);
}

// Escons de cada partit al Congrés que ha sortit de les urnes
function simStoreResult(state, r) {
  state.res = {
    seats: Object.fromEntries(Object.entries(r.totals).map(([id, t]) => [id, t.seats])),
    votes: Object.fromEntries(Object.entries(r.totals).map(([id, t]) => [id, t.votes])),
    share: Object.fromEntries(Object.entries(r.totals).map(([id, t]) => [id, Math.round(t.share * 1000) / 10])),
    turnout: Math.round(r.turnout * 1000) / 10,
  };
  return state.res;
}
const simSeated = (state) => Object.keys(state.res.seats).filter((id) => state.res.seats[id] > 0);

// Vot d'un partit a la investidura d'un candidat amb un acord concret.
// deal: { cand, measures: [ids], roles: { id: "coal" | "leg" | "inv" } }
// Retorna { v: "si" | "abs" | "no", why, score }. Tot es pot explicar: afinitat, mesures, fórmula de suport i incompatibilitats.
function simPartyVote(state, pid, deal) {
  if (pid === deal.cand) return { v: "si", why: "És el partit del candidat.", score: 9 };
  const P = simPartyById(state, pid), C = simPartyById(state, deal.cand);
  const ms = (deal.measures || []).map(simMeasure).filter(Boolean);
  const red = ms.find((m) => simIsRedLine(P, m));
  if (red) return { v: "no", why: `No accepta «${simLc(red.t)}»: és una línia vermella.`, score: -9, red: red.id };
  const aff = 1 - simDistP(P, C) / 6;
  let mScore = 0, best = null, worst = null;
  ms.forEach((m) => {
    const o = simMeasureView(P, m) * Math.min(1, P.iss[m.th]);
    mScore += o;
    if (!best || o > best.o) best = { m, o };
    if (!worst || o < worst.o) worst = { m, o };
  });
  mScore *= 0.3;
  const role = deal.roles?.[pid];
  const rb = role ? SIM_ROLES[role].bonus : 0;
  // Incompatibilitats: no comparteix govern (ni un acord estable) amb partits molt allunyats
  let clash = null;
  Object.entries(deal.roles || {}).forEach(([id, r]) => {
    if (id === pid || clash) return;
    const Q = simPartyById(state, id);
    if ((r === "coal" && simDistP(P, Q) > 5.5) || (r === "leg" && simDistP(P, Q) > 8)) clash = Q;
  });
  // Ambició: un partit gran no investeix fàcilment el líder d'un partit molt més petit (vol ser ell qui governi)
  const sP = state.res?.seats[pid] || 0, sC = state.res?.seats[deal.cand] || 0;
  const ambition = sP >= 40 && sP > sC ? 0.45 * (sP - sC) / sP : 0;
  let score = aff + mScore + rb - (clash ? 0.6 : 0) - ambition - 0.5;
  // Si té 2,5 vegades els escons del candidat o més, no l'investeix: com a molt, s'absté
  if (sP >= 40 && sP >= 2.5 * sC) score = Math.min(score, -0.2);
  const v = score >= 0.1 ? "si" : score >= -0.25 ? "abs" : "no";
  let why;
  if (clash && v !== "si") why = `No vol compartir l'acord amb ${clash.name}.`;
  else if (ambition > 0.15 && v !== "si") why = `Amb ${sP} escons, vol que el president surti del seu partit.`;
  else if (v === "si") why = role === "coal" ? "Entra al Govern i hi veu les seves prioritats." : role ? `Hi dona suport a canvi d'un ${SIM_ROLES[role].label.toLowerCase()}.` : best && best.o > 0.4 ? `Li agrada «${simLc(best.m.t)}».` : "És ideològicament proper al candidat.";
  else if (v === "abs") why = best && best.o > 0.4 ? `Valora «${simLc(best.m.t)}», però no prou per votar-hi a favor.` : "No hi veu prou motius per votar-hi a favor, però tampoc vol bloquejar-ho.";
  else why = worst && worst.o < -0.3 ? `Rebutja «${simLc(worst.m.t)}».` : `Està massa lluny ideològicament de ${C.name}.`;
  return { v, why, score };
}

// Votació d'investidura (art. 99 de la Constitució): 1a votació, majoria absoluta (176 sís);
// 2a votació, 48 hores després, majoria simple (més sís que nos).
function simInvestiture(state, deal, playerVote = null) {
  const votes = {};
  let si = 0, no = 0, abs = 0;
  simSeated(state).forEach((id) => {
    const n = state.res.seats[id];
    const r = id === "jo" && deal.cand !== "jo" && playerVote ? { v: playerVote, why: "És el teu vot.", score: 0 } : simPartyVote(state, id, deal);
    votes[id] = r;
    if (r.v === "si") si += n; else if (r.v === "no") no += n; else abs += n;
  });
  const first = si >= SIM_MAJ, second = si > no;
  return { votes, si, no, abs, first, second, pass: first || second };
}

// Una mesura que el candidat no pot proposar (és una línia vermella seva o va contra el seu programa)
const simCandRejects = (state, cand, m) => { const C = simPartyById(state, cand); return simIsRedLine(C, m) || simMeasureView(C, m) < -0.5; };

// =========================================================
// La legislatura: 8 trimestres de govern (o d'oposició)
// =========================================================
const SIM_IND = { eco: "Economia", ben: "Benestar", coh: "Cohesió territorial", pop: "Popularitat", est: "Estabilitat" };
// Calendari de votacions importants: cada trimestre, una
const SIM_LEG_PLAN = ["decret", "pressupostos", "llei", "organica", "soci", "pressupostos", "decret", "llei"];

// Comença la legislatura a partir de l'acord d'investidura que ha triomfat
function simLegStart(state, gov) {
  const sup = {};
  simSeated(state).forEach((id) => {
    if (gov.parties.includes(id)) sup[id] = 0.8;
    else if (gov.support[id] === "leg") sup[id] = 0.55;
    else sup[id] = { si: 0.3, abs: 0, no: -0.5 }[gov.votes?.[id]?.v || "no"];
  });
  state.leg = {
    q: 0, gov, sup,
    ind: { eco: 50, ben: 50, coh: 50, pop: state.me.id === gov.pm ? 58 : 50, est: 0 },
    log: [], passed: 0, failed: 0, decrees: 0, budgets: 0, censure: null, confidence: false, over: null, cards: [],
  };
  simLegStability(state);
  return state.leg;
}
const simLegRole = (state) => {
  const g = state.leg.gov;
  if (g.pm === "jo") return "pm";
  if (g.parties.includes("jo")) return "coal";
  return g.support.jo || "opp";
};
// Estabilitat: escons dels partits que avui donen suport al Govern, sobre 176
function simLegStability(state) {
  const L = state.leg;
  let seats = 0;
  Object.entries(L.sup).forEach(([id, v]) => { if (v >= 0.15) seats += state.res.seats[id] || 0; });
  L.ind.est = Math.max(0, Math.min(100, Math.round((seats / SIM_MAJ) * 70)));
  L.supSeats = seats;
  return L.ind.est;
}
const simClampInd = (L) => Object.keys(L.ind).forEach((k) => { L.ind[k] = Math.max(0, Math.min(100, Math.round(L.ind[k]))); });

// Efecte d'una decisió amb posició ideològica { ax, p, th } sobre la relació de cada partit amb el Govern
function simLegReact(state, pos, k = 0.18) {
  const L = state.leg;
  const out = [];
  Object.keys(L.sup).forEach((id) => {
    const P = simPartyById(state, id);
    const o = simMeasureView(P, pos) * Math.min(1, P.iss[pos.th] ?? 0.5);
    const before = L.sup[id];
    L.sup[id] = Math.max(-1, Math.min(1, before + o * k));
    if (Math.abs(o * k) >= 0.08) out.push({ id, d: o * k });
  });
  return out;
}

// Votació al Congrés d'una iniciativa amb posició { ax, p, th }. Tipus: "llei", "organica", "pressupostos", "decret" (convalidació).
// playerVote: el vot del jugador si no és ell qui governa.
function simLegVote(state, bill, playerVote = null) {
  const L = state.leg, gov = L.gov;
  const votes = {};
  let si = 0, no = 0, abs = 0;
  Object.keys(L.sup).forEach((id) => {
    const n = state.res.seats[id] || 0;
    let v;
    if (id === "jo" && playerVote) v = playerVote;
    else {
      const P = simPartyById(state, id);
      const inGov = gov.parties.includes(id);
      const o = simMeasureView(P, bill) * Math.min(1, P.iss[bill.th] ?? 0.5);
      const s = (inGov ? 0.6 : 0) + L.sup[id] * 0.7 + o * 0.6 + (bill.kind === "pressupostos" ? -0.05 : 0);
      v = s >= 0.3 ? "si" : s <= -0.1 ? "no" : "abs";
      if (simIsRedLine(P, bill)) v = "no";
    }
    votes[id] = v;
    if (v === "si") si += n; else if (v === "no") no += n; else abs += n;
  });
  // Les lleis orgàniques necessiten majoria absoluta en una votació final sobre el conjunt (art. 81 CE)
  const pass = bill.kind === "organica" ? si >= SIM_MAJ : si > no;
  return { votes, si, no, abs, pass };
}

// Moció de censura constructiva (art. 113 CE): cal un candidat alternatiu i 176 sís
function simCensureVote(state, cand) {
  const L = state.leg, gov = L.gov;
  const C = simPartyById(state, cand);
  const votes = {};
  let si = 0, no = 0, abs = 0;
  Object.keys(L.sup).forEach((id) => {
    const n = state.res.seats[id] || 0;
    let v;
    if (id === cand) v = "si";
    else if (gov.parties.includes(id) && L.sup[id] > -0.3) v = "no";
    else {
      const P = simPartyById(state, id);
      const pm = simPartyById(state, gov.pm);
      const prefer = simDistP(P, C) + 0.5 < simDistP(P, pm);
      v = L.sup[id] < -0.15 && prefer ? "si" : L.sup[id] >= 0.15 ? "no" : prefer ? "abs" : "no";
    }
    votes[id] = v;
    if (v === "si") si += n; else if (v === "no") no += n; else abs += n;
  });
  return { votes, si, no, abs, pass: si >= SIM_MAJ };
}

// Qüestió de confiança (art. 112 CE): el Govern la guanya per majoria simple
function simConfidenceVote(state) {
  const L = state.leg;
  const votes = {};
  let si = 0, no = 0, abs = 0;
  Object.keys(L.sup).forEach((id) => {
    const n = state.res.seats[id] || 0;
    const v = L.gov.parties.includes(id) ? "si" : L.sup[id] >= 0.1 ? "si" : L.sup[id] <= -0.25 ? "no" : "abs";
    votes[id] = v;
    if (v === "si") si += n; else if (v === "no") no += n; else abs += n;
  });
  return { votes, si, no, abs, pass: si > no };
}

// Final del trimestre: l'economia es mou una mica sola, el desgast i la popularitat
function simLegQuarterEnd(state) {
  const L = state.leg;
  const role = simLegRole(state);
  const drift = (simRand(state, "leg-eco") - 0.5) * 8;
  L.ind.eco += drift;
  L.ind.ben += (L.ind.eco - 50) * 0.04;
  if (role === "pm" || role === "coal") L.ind.pop += (L.ind.eco - 50) * 0.05 + (L.ind.ben - 50) * 0.04 - 1.5;
  else L.ind.pop += (50 - L.ind.eco) * 0.03 + 0.5;
  simClampInd(L);
  simLegStability(state);
  L.q++;
  return { drift: Math.round(drift) };
}

// =========================================================
// Puntuació i lliçons de la partida
// =========================================================
const SIM_OUTCOME = {
  pm: { label: "Presidència del Govern", pts: 300 },
  coal: { label: "Govern de coalició", pts: 180 },
  leg: { label: "Acord de legislatura", pts: 110 },
  inv: { label: "Suport puntual a la investidura", pts: 50 },
  opp: { label: "Oposició", pts: 30 },
  rep: { label: "Repetició electoral", pts: 20 },
};

function simScore(state) {
  const parts = [];
  const seats = state.res ? state.res.seats.jo : 0;
  parts.push({ label: `${seats} ${seats === 1 ? "escó" : "escons"}`, pts: seats * 8 });
  if (seats >= state.goal) parts.push({ label: "Objectiu de la direcció", pts: 80 });
  const g = state.gov;
  if (g?.outcome) {
    const o = SIM_OUTCOME[g.outcome];
    parts.push({ label: o.label, pts: o.pts });
    if (g.outcome === "pm" && g.final?.first) parts.push({ label: "Investidura a la primera votació", pts: 60 });
    const got = (g.final?.deal?.measures || []).filter((id) => g.mine?.includes(id)).length;
    if (got && g.outcome !== "opp") parts.push({ label: `${got} ${got === 1 ? "mesura pròpia" : "mesures pròpies"} a l'acord`, pts: got * 25 });
  }
  const L = state.leg;
  if (L && L.q > 0) {
    parts.push({ label: `${L.q} ${L.q === 1 ? "trimestre" : "trimestres"} de legislatura`, pts: L.q * 15 });
    const avg = (L.ind.eco + L.ind.ben + L.ind.coh + L.ind.pop) / 4;
    parts.push({ label: `Indicadors finals (mitjana ${Math.round(avg)})`, pts: Math.round(avg * 2) });
    if (L.passed) parts.push({ label: `${L.passed} ${L.passed === 1 ? "votació guanyada" : "votacions guanyades"}`, pts: L.passed * 12 });
    if (state.res2) {
      const d = state.res2.seats.jo - seats;
      parts.push({ label: `Reelecció: ${state.res2.seats.jo} escons (${d >= 0 ? "+" : ""}${d})`, pts: Math.max(0, state.res2.seats.jo * 5 + d * 4) });
    }
  }
  const D = { facil: 0.9, normal: 1, dificil: 1.2 }[state.diff] || 1;
  const pts = Math.max(0, Math.round(parts.reduce((t, p) => t + p.pts, 0) * D));
  return { pts, parts, mult: D };
}

// XP: proporcional als punts, amb un topall per mode perquè no trenqui els nivells
function simXp(state, pts) {
  const cap = { express: 120, duel: 120, govern: 170, legislatura: 220 }[state.mode] || 120;
  return Math.max(10, Math.min(cap, Math.round(20 + pts / 4)));
}

// Lliçons de la partida: 3-5 frases sobre el sistema electoral basades en el que ha passat
function simLessons(state, r) {
  const L = [];
  const me = r.totals.jo;
  const small = r.provs.filter((p) => p.seats <= 5 && p.votes.jo !== undefined && !p.won.jo && p.votes.jo / p.valid > 0.08);
  if (small.length) L.push({ k: "petites", t: `A ${small.length} ${small.length === 1 ? "circumscripció petita" : "circumscripcions petites"} (5 escons o menys) has tret més del 8 % dels vots i cap escó: allà només entren els partits que queden primers.`, link: "vots-escons" });
  const perSeat = me.seats ? me.votes / me.seats : null;
  const big = Object.entries(r.totals).sort((a, b) => b[1].seats - a[1].seats)[0];
  if (perSeat && big[0] !== "jo") L.push({ k: "preu", t: `Cada escó teu ha costat ${fmtN(perSeat)} vots; cada escó de ${simPartyById(state, big[0]).sig}, ${fmtN(big[1].votes / big[1].seats)}. La Llei d'Hondt i les circumscripcions petites afavoreixen els partits grans.`, link: "vots-escons" });
  else if (!me.seats) L.push({ k: "preu", t: `Has tret ${fmtN(me.votes)} vots i cap escó: repartits per tot l'Estat, no arriben a ser primers enlloc.`, link: "vots-escons" });
  if (me.useful > 2000) L.push({ k: "util", t: `El vot útil t'ha fet perdre uns ${fmtN(me.useful)} vots: on no tenies opcions d'escó, part dels teus votants han triat un partit amb més possibilitats.`, link: "vots-escons" });
  const below = r.provs.filter((p) => p.votes.jo !== undefined && p.votes.jo < p.min && p.seats >= 10);
  if (below.length) L.push({ k: "llindar", t: `A ${below.map((p) => p.name).slice(0, 3).join(", ")} no has arribat al 3 % dels vots vàlids (blancs inclosos): sense aquest mínim, no entres al repartiment.`, link: "vots-escons" });
  let close = null;
  r.provs.forEach((p) => { const g = simSeatGap(p); if (g && (!close || g < close.g)) close = { p, g }; });
  if (close) L.push({ k: "hondt", t: `A ${close.p.name} t'han faltat ${fmtN(close.g)} vots per a un escó més. A cada circumscripció, l'últim escó es decideix per pocs vots.`, link: "vots-escons" });
  if (state.res && !Object.values(state.res.seats).some((n) => n >= SIM_MAJ)) L.push({ k: "pactes", t: "Cap partit ha arribat als 176 escons de la majoria absoluta: per formar govern, calia pactar.", link: "nou-govern" });
  return L.slice(0, 5);
}
const fmtN = (n) => Math.round(n).toLocaleString("ca-ES");

// =========================================================
// Agenda de campanya: entrevistes, fòrums sectorials i cara a cara
// =========================================================
// Mitjans genèrics (cap mitjà real). reach: estatal, ccaa (tota la comunitat) o prov (una circumscripció).
const SIM_OUTLETS = [
  { k: "tv", name: "Una televisió d'àmbit estatal", short: "Televisió estatal", reach: "estatal", aud: 1, tough: 0.55 },
  { k: "radio", name: "Una ràdio d'àmbit estatal", short: "Ràdio estatal", reach: "estatal", aud: 0.7, tough: 0.45 },
  { k: "diari", name: "Un diari d'àmbit estatal", short: "Diari estatal", reach: "estatal", aud: 0.6, tough: 0.5 },
  { k: "eco", name: "Un diari econòmic", short: "Diari econòmic", reach: "estatal", aud: 0.45, tough: 0.7, th: 1, seg: "mid" },
  { k: "pod", name: "Un pòdcast de política amb molt de públic jove", short: "Pòdcast", reach: "estatal", aud: 0.6, tough: 0.3, seg: "jov" },
  { k: "auto", name: "La televisió autonòmica", short: "Televisió autonòmica", reach: "ccaa", aud: 0.9, tough: 0.4 },
  { k: "local", name: "Una ràdio local", short: "Ràdio local", reach: "prov", aud: 0.8, tough: 0.2 },
];
// Fòrums: cada un parla a un tipus de votant (SIM_SEGMENTS)
const SIM_FORUMS = [
  { k: "patronal", name: "Un fòrum d'empresaris", seg: "mid", th: 1, pos: { ax: "eco", p: 7.5 } },
  { k: "sindicats", name: "Un congrés sindical", seg: "ind", th: 1, pos: { ax: "eco", p: 2.5 } },
  { k: "gentgran", name: "Una associació de gent gran", seg: "jub", th: 2, pos: { ax: "eco", p: 4 } },
  { k: "univ", name: "Un debat a la universitat", seg: "jov", th: 0, pos: { ax: "val", p: 2.5 } },
  { k: "pagesia", name: "Una trobada d'organitzacions agràries", seg: "rur", th: 5, pos: { ax: "val", p: 7 } },
  { k: "veinal", name: "Una federació d'associacions veïnals", seg: "urb", th: 0, pos: { ax: "eco", p: 3 } },
];
const SIM_MEDIA_TYPES = { entrevista: "Entrevista", forum: "Fòrum", cara: "Cara a cara" };

// Ofertes del dia: dues propostes de mitjans o d'entitats i, si un rival t'ha reptat, un cara a cara
function simDayOffers(state) {
  const day = state.day, out = [];
  const r = () => simRand(state, `oferta-${day}`);
  const n = 2;
  for (let k = 0; k < n; k++) {
    if (r() < 0.68) {
      const o = SIM_OUTLETS[Math.floor(r() * SIM_OUTLETS.length)];
      // Les ràdios locals i les teles autonòmiques busquen on ja es parla de tu
      let prov = null;
      if (o.reach !== "estatal") {
        const cand = SIM_PROVS.filter((p) => simAware(state, p.i) > state.awG + 0.04);
        prov = (cand.length ? cand : SIM_PROVS)[Math.floor(r() * (cand.length || SIM_PROVS.length))].i;
      }
      out.push({ id: `${day}-${k}`, type: "entrevista", outlet: o.k, prov, tone: r() < o.tough ? "dura" : "amable", th: o.th ?? Math.floor(r() * SIM_THEMES.length), status: "nova" });
    } else {
      const f = SIM_FORUMS[Math.floor(r() * SIM_FORUMS.length)];
      out.push({ id: `${day}-${k}`, type: "forum", forum: f.k, status: "nova" });
    }
  }
  // Els reptes a cara a cara van primer a l'agenda
  (state.challenges || []).splice(0).reverse().forEach((id, k) => out.unshift({ id: `${day}-c${k}`, type: "cara", rival: id, status: "nova" }));
  // No es repeteix el mateix mitjà o fòrum el mateix dia
  const seen = new Set();
  state.offers = out.filter((o) => { const key = o.outlet || o.forum || o.rival; if (seen.has(key)) return false; seen.add(key); return true; });
  return state.offers;
}
const simOffer = (state, id) => (state.offers || []).find((o) => o.id === id);

// Preguntes d'una entrevista o d'un cara a cara: sempre les mateixes per a la mateixa oferta
function simMediaQuestions(state, offer) {
  const rng = simMulberry(simHash(`${state.seed}|mitja|${offer.id}`));
  const pick = (arr, n) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  if (offer.type === "cara") return pick(SIM_DEBATE_QS, 2);
  const theme = SIM_DEBATE_QS.filter((q) => q.th === offer.th);
  const first = theme.length ? theme[Math.floor(rng() * theme.length)] : pick(SIM_DEBATE_QS, 1)[0];
  return [first, ...pick(SIM_INTERVIEW_QS.filter((q) => !q.tone || q.tone === offer.tone), 2)];
}

// Qualitat d'una resposta (0-1): coherència amb el programa i capacitat d'arribar al centre, o el valor fix d'una resposta general
function simAnswerQuality(state, a) {
  if (a.p) {
    const me = state.me;
    const coh = 1 - Math.min(1, Math.hypot(a.p.eco - me.eco, a.p.ter - me.ter, a.p.val - me.val) / 8);
    const appeal = 1 - Math.min(1, Math.hypot(a.p.eco - 5, a.p.ter - 4, a.p.val - 5) / 8);
    return 0.65 * coh + 0.35 * appeal;
  }
  return a.v ?? 0.5;
}

// Accepta i resol una entrevista (gasta una franja). picks: índexs de les respostes triades.
function simDoInterview(state, offerId, picks) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova" || state.slot >= 3) return null;
  const o = SIM_OUTLETS.find((x) => x.k === offer.outlet);
  const qs = simMediaQuestions(state, offer);
  const answers = qs.map((q, k) => q.a[picks[k]] || q.a[0]);
  const evasive = answers.filter((a) => a.ev).length;
  let quality = answers.reduce((t, a) => t + simAnswerQuality(state, a), 0) / answers.length + (state.me.attrs.sol - 3) * 0.03;
  const stakes = offer.tone === "dura" ? 1.5 : 1;
  const delta = (quality - 0.55) * stakes;
  state.slot++;
  // Notorietat segons l'abast del mitjà
  if (o.reach === "estatal") state.awG += (1 - state.awG) * 0.05 * o.aud;
  else {
    const p = SIM_PROVS[offer.prov];
    SIM_PROVS.forEach((q) => { if (o.reach === "ccaa" ? q.ccaa === p.ccaa : q.i === p.i) { state.aw[q.i] += (1 - state.aw[q.i]) * 0.22 * o.aud; state.camp.jo[q.i] += delta * 0.35; } });
  }
  if (o.reach === "estatal") state.glob.jo += delta * 0.14;
  if (o.seg) state.seg[o.seg] = Math.max(-0.3, Math.min(0.5, (state.seg[o.seg] || 0) + Math.max(0, delta) * 0.5 + 0.03));
  state.cred = Math.max(0, Math.min(100, state.cred + Math.round(delta * 18) - evasive * (offer.tone === "dura" ? 3 : 1)));
  offer.status = "feta";
  offer.result = { quality: Math.round(quality * 100) / 100, delta: Math.round(delta * 100) / 100 };
  const good = delta >= 0;
  const where = o.reach === "estatal" ? "a tot l'Estat" : o.reach === "ccaa" ? `a ${SIM_PROVS[offer.prov].ccaa}` : `a ${SIM_PROVS[offer.prov].name}`;
  const msg = `Entrevista a ${o.short.toLowerCase()}: ${good ? "surt bé" : "no surt gaire bé"} i et coneixen més ${where}.`;
  state.log.push({ day: state.day, type: "media", arg: offer.id, msg, good, round: state.round || 1 });
  return { quality, delta, evasive, msg, good, outlet: o, where };
}

// Fòrum sectorial: un discurs per a un públic concret (gasta una franja)
// k: 0 discurs a mida del públic · 1 defensar el programa encara que no agradi · 2 discurs general
function simDoForum(state, offerId, k) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova" || state.slot >= 3) return null;
  const f = SIM_FORUMS.find((x) => x.k === offer.forum);
  const me = state.me;
  const view = Math.max(-1, Math.min(1, 1 - Math.abs(f.pos.p - me[f.pos.ax]) / 3)); // el públic t'és afí (1) o contrari (-1)
  let segD = 0, cred = 0;
  if (k === 0) { segD = 0.16; cred = view < 0 ? -6 : 0; }
  else if (k === 1) { segD = view > 0 ? 0.12 : -0.03; cred = 3; }
  else { segD = 0.06; }
  state.slot++;
  state.seg[f.seg] = Math.max(-0.3, Math.min(0.5, (state.seg[f.seg] || 0) + segD));
  state.cred = Math.max(0, Math.min(100, state.cred + cred));
  state.awG += (1 - state.awG) * 0.015;
  offer.status = "feta";
  const label = SIM_SEGMENTS.find((g) => g.k === f.seg).label.toLowerCase();
  const msg = k === 0 ? (cred < 0 ? `${f.name}: el discurs agrada al públic (${label}), però et retreuen que dius el contrari del teu programa.` : `${f.name}: connectes amb el públic (${label}).`)
    : k === 1 ? (segD > 0 ? `${f.name}: defenses el teu programa i el públic (${label}) t'aplaudeix.` : `${f.name}: defenses el teu programa davant d'un públic (${label}) que no hi està d'acord. Guanyes credibilitat.`)
      : `${f.name}: un discurs correcte, sense gaire impacte (${label}).`;
  state.log.push({ day: state.day, type: "forum", arg: offer.id, msg, good: segD >= 0 && cred >= 0, round: state.round || 1 });
  return { segD, cred, msg, seg: f.seg, label, view };
}

// Cara a cara contra un rival (gasta una franja): el teu resultat contra el seu
function simDoCara(state, offerId, picks) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova" || state.slot >= 3) return null;
  const R = state.rivals.find((r) => r.id === offer.rival);
  const qs = simMediaQuestions(state, offer);
  const mine = qs.reduce((t, q, k) => t + simAnswerQuality(state, q.a[picks[k]] || q.a[0]), 0) / qs.length + (state.me.attrs.car - 3) * 0.04;
  const theirs = 0.55 + (R.lead - 0.55) * 0.5 + (simRand(state, `cara-${offer.id}`) - 0.5) * 0.12;
  const won = mine >= theirs;
  state.slot++;
  state.awG += (1 - state.awG) * 0.05;
  state.glob.jo += won ? 0.05 : -0.02;
  state.glob[R.id] += won ? -0.02 : 0.02;
  state.cred = Math.max(0, Math.min(100, state.cred + (won ? 3 : -2)));
  offer.status = "feta";
  const msg = won ? `Cara a cara amb el candidat de ${R.sig}: els analistes et donen com a guanyador.` : `Cara a cara amb el candidat de ${R.sig}: el teu rival en surt més ben parat.`;
  state.log.push({ day: state.day, type: "cara", arg: offer.id, msg, good: won, round: state.round || 1 });
  return { won, mine, theirs, msg, rival: R };
}

// Declinar una proposta. Defugir un cara a cara té un petit cost.
function simDecline(state, offerId) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova") return null;
  offer.status = "rebutjada";
  if (offer.type === "cara") {
    const R = state.rivals.find((r) => r.id === offer.rival);
    state.cred = Math.max(0, state.cred - 2);
    state.glob[R.id] += 0.01;
    const msg = `Declines el cara a cara amb el candidat de ${R.sig}: se't retreu que defugis el debat.`;
    state.log.push({ day: state.day, type: "cara", arg: offer.id, msg, good: false, round: state.round || 1 });
    return { msg };
  }
  return { msg: "Declines la proposta." };
}
