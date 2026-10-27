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
  agenda: 0.75, // el tema del dia pesa un 75 % més per a tothom
  mom: 0.09, // arrossegament: un partit que puja a les enquestes en guanya més (i al revés)
  decay: 0.9, // cada nit, els efectes de campanya es dilueixen: el que es fa els últims dies pesa més
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
  const HQ = SIM_PROVS.findIndex((p) => p.code === "M");
  const state = {
    v: SIM_VERSION, seed: String(seed), mode, diff, rc: 0,
    day: 1, slot: 0, days: 6, // sis dies de campanya i la jornada de reflexió, a tots els modes
    money: D.money, cred: 60, moral: 60, media: 20, energy: SIM_ENERGY.max,
    loc: HQ, route: [HQ], // la caravana surt de la seu, a Madrid
    me, rivals: SIM_RIVALS.map((r) => ({ ...r, iss: [...r.iss] })), // còpia: la partida pot canviar els temes dels rivals
    awG: D.aw, aw: SIM_PROVS.map(() => 0), mob: SIM_PROVS.map(() => 0),
    camp: {}, glob: {}, noise: {}, mom: {}, used: { cand: [] }, seg: {}, offers: [], challenges: [],
    agenda: null, push: SIM_THEMES.map(() => 0), house: simHouseEffects(seed),
    log: [], news: [], polls: [], phase: "campaign",
  };
  const ids = ["jo", ...SIM_RIVALS.map((r) => r.id)];
  ids.forEach((id) => {
    state.camp[id] = SIM_PROVS.map(() => 0);
    state.glob[id] = 0;
    state.mom[id] = 0;
    const rng = simMulberry(simHash(`${state.seed}|noise|${id}`));
    state.noise[id] = SIM_PROVS.map(() => simGauss(rng) * D.noise);
  });
  simDayOffers(state);
  return state;
}

// Efecte de la casa de cada institut d'enquestes: un biaix petit i estable per partit (més gran com més gran és el partit)
function simHouseEffects(seed) {
  const ids = ["jo", ...SIM_RIVALS.map((r) => r.id)];
  return Object.fromEntries(SIM_POLLSTERS.map((p) => {
    const rng = simMulberry(simHash(`${seed}|casa|${p.k}`));
    const b = Object.fromEntries(ids.map((id) => [id, simGauss(rng) * Math.sqrt((SIM_START_SHARE[id] ?? 2) / 100) * 2]));
    const mean = Object.values(b).reduce((t, x) => t + x, 0) / ids.length;
    ids.forEach((id) => { b[id] = Math.round((b[id] - mean) * 100) / 100; });
    return [p.k, b];
  }));
}

// Comença la campanya: enquesta de sortida (abans de començar) i el primer tema del dia
function simKickoff(state) {
  const first = simPoll(state, null, SIM_POLLSTERS[0].k);
  first.day = 0;
  simPushPoll(state, first);
  simNextAgenda(state, true);
  simNews(state, { kind: "start", icon: "🏁", t: state.round === 2 ? simNewsText("start2", state) : simNewsText("start", state) });
  return first;
}

const simParties = (state) => [state.me, ...state.rivals];
// Els partits territorials només es presenten a les seves comunitats
const simStands = (party, prov) => (!party.ccaa || party.ccaa.includes(prov.ccaa)) && (!party.only || prov.ter >= party.only);
const simAware = (state, i) => 1 - (1 - state.awG) * (1 - state.aw[i]);
// Mobilització: quina part dels seus votants potencials va a votar (1 = la normal)
function simEnth(state, id, i) {
  if (id !== "jo") return 1;
  return (0.94 + 0.12 * (state.moral ?? 60) / 100) * (1 + (state.mob?.[i] || 0));
}

// Utilitat d'un partit per a un tipus de votant d'una província
function simUtility(state, party, seg, prov, i) {
  const segTer = seg.ter ?? 1.5 + prov.ter * 5;
  const wt = seg.k === "sob" ? 2.5 : 0.6 + prov.ter;
  const d = Math.sqrt((seg.eco - party.eco) ** 2 + wt * (segTer - party.ter) ** 2 + 0.8 * (seg.val - party.val) ** 2);
  // L'agenda del dia: el tema del qual parlen tots els mitjans pesa més per a tothom
  const ag = state.agenda;
  let salSum = 0, match = 0;
  seg.sal.forEach((s, k) => { const w = k === ag ? s * (1 + SIM_K.agenda) : s; salSum += w; match += w * party.iss[k]; });
  let u = -SIM_K.alpha * d + SIM_K.beta * (match / salSum) + SIM_K.gamma * party.lead + (party.base || 0);
  // Implantació territorial: alguns partits són més forts a les províncies rurals (rural > 0) i d'altres a les urbanes
  if (party.rural) u += party.rural * (0.5 - prov.urb);
  u += state.camp[party.id][i] + state.glob[party.id] + state.noise[party.id][i];
  // Arrossegament de les enquestes publicades
  u += SIM_K.mom * (state.mom?.[party.id] || 0);
  if (party.id === "jo") {
    u += Math.log(Math.max(0.02, simAware(state, i)));
    // Guanys o pèrdues amb un tipus de votant concret (fòrums sectorials, anuncis, entrevistes a un públic jove...)
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
  const enth = parties.map((p) => simEnth(state, p.id, i));
  let cast = 0, base = 0;
  SIM_SEGMENTS.forEach((seg) => {
    const share = w[seg.k];
    if (!share) return;
    const turnout = Math.min(0.95, seg.turn + (state.turnBoost || 0));
    const n = electors * share * turnout;
    base += n;
    const util = parties.map((p) => {
      let u = simUtility(state, p, seg, prov, i);
      if (viab) u -= SIM_K.useful * (seg.k === "sob" ? 0.5 : 1) * (1 - viab[p.id]);
      return Math.exp(u / SIM_K.temp);
    });
    const tot = util.reduce((a, b) => a + b, 0);
    // La mobilització suma votants que d'una altra manera s'haurien quedat a casa
    parties.forEach((p, k) => { const v = n * (1 - SIM_K.blank - SIM_K.null) * (util[k] / tot) * enth[k]; votes[p.id] += v; cast += v; });
  });
  const blank = base * SIM_K.blank, nul = base * SIM_K.null;
  cast += blank + nul;
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
  return simTotals(state, provs);
}
// Totals d'una elecció a partir de les circumscripcions
function simTotals(state, provs) {
  const ids = simParties(state).map((p) => p.id);
  // «useful»: vots que cada partit perd (o guanya, si és negatiu) per l'efecte del vot útil
  const totals = Object.fromEntries(ids.map((id) => [id, { votes: 0, seats: 0, useful: 0 }]));
  let valid = 0, cast = 0, electors = 0;
  provs.forEach((p) => {
    valid += p.valid; cast += p.cast; electors += p.electors;
    Object.keys(p.votes).forEach((id) => { totals[id].votes += p.votes[id]; totals[id].seats += p.won[id]; totals[id].useful += (p.first?.[id] ?? p.votes[id]) - p.votes[id]; });
  });
  ids.forEach((id) => { totals[id].share = totals[id].votes / valid; });
  return { provs, totals, valid, cast, electors, turnout: cast / electors };
}

// Projecció d'escons a partir d'uns percentatges estatals (enquestes i enquesta a peu d'urna): a cada circumscripció,
// el vot de cada partit es mou en la mateixa proporció que a tot l'Estat («swing» proporcional).
function simProject(r, est) {
  const provs = r.provs.map((p) => {
    const votes = {};
    Object.keys(p.votes).forEach((id) => {
      const sh = r.totals[id].share;
      votes[id] = sh > 0 ? Math.round(p.votes[id] * Math.max(0, est[id] / 100) / sh) : 0;
    });
    return { i: p.i, name: p.name, seats: p.seats, votes, blank: p.blank, ...simSeatsFor(votes, p.blank, p.seats) };
  });
  const seats = Object.fromEntries(Object.keys(r.totals).map((id) => [id, 0]));
  provs.forEach((p) => Object.keys(p.won).forEach((id) => { seats[id] += p.won[id]; }));
  return { seats, provs };
}
// Forquilla d'escons d'un partit: la projecció amb el seu vot al límit baix i al límit alt del marge d'error
function simSeatRange(r, est, id, err) {
  const shift = (d) => {
    const e = { ...est };
    const others = Object.keys(e).filter((x) => x !== id).reduce((t, x) => t + e[x], 0);
    const nv = Math.max(0, e[id] + d);
    const k = others > 0 ? (others - (nv - e[id])) / others : 1;
    Object.keys(e).forEach((x) => { e[x] = x === id ? nv : e[x] * k; });
    return simProject(r, e).seats[id];
  };
  return [shift(-err), shift(err)];
}

// Enquesta: resultat del model + error de mostra + biaix de l'institut. pollster: clau de SIM_POLLSTERS o null (interna).
// També estima cada circumscripció: partit que va primer, posició del jugador i vots que li falten per al pròxim escó.
function simPoll(state, sample = null, pollster = null) {
  const P = pollster ? SIM_POLLSTERS.find((x) => x.k === pollster) : null;
  const n = sample || P?.sample || 1600;
  const r = simElection(state);
  const margin = 1.96 * Math.sqrt(0.25 / n) * 100;
  const house = P ? state.house?.[P.k] || {} : {};
  const est = {};
  Object.keys(r.totals).forEach((id) => {
    // L'error de cada partit depèn de la seva mida: és més petit com més petit és el partit
    const sh = r.totals[id].share;
    const err = (simRand(state, `poll-${id}`) - 0.5) * 2 * 1.96 * Math.sqrt((sh * (1 - sh)) / n) * 100 * 0.6;
    est[id] = Math.round(Math.max(0.1, sh * 100 + err + (house[id] || 0)) * 10) / 10;
  });
  const proj = simProject(r, est);
  const range = {};
  Object.keys(est).forEach((id) => {
    const e = 1.96 * Math.sqrt((est[id] / 100) * (1 - est[id] / 100) / n) * 100;
    range[id] = proj.seats[id] || est[id] >= 1 ? simSeatRange(r, est, id, e) : [0, 0];
    range[id][0] = Math.min(range[id][0], proj.seats[id]);
    range[id][1] = Math.max(range[id][1], proj.seats[id]);
  });
  const provs = proj.provs.map((p) => {
    const order = Object.keys(p.votes).sort((a, b) => p.votes[b] - p.votes[a]);
    const gap = simSeatGap(p);
    return { lead: order[0], rank: order.indexOf("jo") + 1, won: p.won.jo || 0, need: gap === null ? null : Math.round((gap / p.valid) * 1000) / 10 };
  });
  return { day: state.day, pollster: P ? P.k : null, internal: !P, est, margin, sample: n, seats: proj.seats, range, provs };
}
// Desa una enquesta: només la darrera conserva el detall per circumscripció (la partida desada no creix gaire)
function simPushPoll(state, poll) {
  state.polls.forEach((p) => { delete p.provs; delete p.range; });
  poll.round = state.round || 1;
  state.polls.push(poll);
  return poll;
}
// Mitjana de les enquestes publicades fins avui (les internes no compten: no es publiquen)
function simPollAvg(state, upto = Infinity) {
  const pub = state.polls.filter((p) => !p.internal && p.day <= upto).slice(-3);
  if (!pub.length) return null;
  const ids = Object.keys(pub[pub.length - 1].est);
  return Object.fromEntries(ids.map((id) => [id, Math.round((pub.reduce((t, p) => t + (p.est[id] || 0), 0) / pub.length) * 10) / 10]));
}
const simBanDay = (state) => Math.max(2, state.days - 1); // els dos últims dies, sense enquestes publicades
const simPollsBanned = (state) => state.day >= simBanDay(state);

// Vots que li falten a un partit per guanyar un escó més en una circumscripció (null si no s'hi presenta)
function simSeatGap(p, id = "jo") {
  if (p.votes[id] === undefined) return null;
  const v = p.votes[id], won = p.won[id] || 0;
  const last = p.winners[p.winners.length - 1];
  if (!last) return null;
  if (last.id === id) return p.next ? 0 : null;
  return Math.ceil(Math.max(p.elig.includes(id) ? 0 : p.min - v, last.q * (won + 1) - v)) + 1;
}
// Marge amb què un partit conserva el seu últim escó (vots que pot perdre abans que se l'endugui un altre)
function simSeatHold(p, id) {
  const won = p.won[id] || 0;
  if (!won || !p.next) return null;
  return Math.max(0, Math.floor((p.votes[id] / won - p.next.q) * won));
}

// ---------- Desplaçaments de la caravana ----------
// Distància aproximada entre dues circumscripcions sobre el mapa (1 unitat ≈ 1,5 km). Illes, Ceuta i Melilla: amb avió.
const SIM_FLY = ["PM", "GC", "TF", "CE", "ML"];
function simTravel(from, to) {
  if (from === to || from === null || from === undefined) return { k: "aqui", en: 0, cost: 0 };
  const a = SIM_PROVS[from], b = SIM_PROVS[to];
  const can = (p) => p.code === "GC" || p.code === "TF";
  if (can(a) && can(b)) return { k: "prop", en: 3, cost: 0 };
  if (SIM_FLY.includes(a.code) || SIM_FLY.includes(b.code)) return { k: "vol", en: 10, cost: 3 };
  const ga = typeof SIM_MAP !== "undefined" ? SIM_MAP.provs[a.code] : null, gb = typeof SIM_MAP !== "undefined" ? SIM_MAP.provs[b.code] : null;
  const d = ga && gb ? Math.hypot(ga.x - gb.x, ga.y - gb.y) : 200;
  if (d < 115) return { k: "prop", en: 3, cost: 0 };
  if (d < 270) return { k: "lluny", en: 7, cost: 0 };
  return { k: "vol", en: 10, cost: 3 };
}
const SIM_TRAVEL_LABEL = { aqui: "Ja hi ets", prop: "A prop", lluny: "Unes hores de cotxe o tren", vol: "Cal agafar un avió" };

// Rendiment del candidat segons l'energia que li queda
const simTired = (state) => (state.energy < SIM_ENERGY.exhausted ? 2 : state.energy < SIM_ENERGY.tired ? 1 : 0);
const simEff = (state) => [1, 0.8, 0.6][simTired(state)] * (1 + 0.12 * Math.max(0, state.mom?.jo || 0));

// ---------- Campanya: accions del jugador ----------
// cat: on surt a la interfície (terr: al territori · media: mitjans i missatge · estr: estratègia)
const SIM_ACTIONS = {
  miting: { label: "Míting", cost: 8, en: 18, needProv: true, cat: "terr", icon: "📣", desc: "Efecte fort a la circumscripció i una mica a la resta de la comunitat. Amb el candidat descansat, llueix més." },
  porta: { label: "Porta a porta", cost: 4, en: 12, needProv: true, cat: "terr", icon: "🚪", desc: "La militància truca a les portes: més participació dels teus votants. Com més militància, més efecte." },
  candidat: { label: "Fitxar un candidat local", cost: 15, en: 8, needProv: true, cat: "terr", icon: "⭐", desc: "Un nom conegut a la circumscripció. Una vegada per província." },
  coalicio: { label: "Coalició preelectoral", cost: 10, en: 8, needProv: true, cat: "terr", icon: "🤝", desc: "Aneu junts amb una candidatura local a tota la comunitat: sumeu vots, però compartiu llista." },
  xarxes: { label: "Campanya a les xarxes", cost: 3, en: 4, cat: "media", icon: "📱", desc: "Arriba a tot arreu, sobretot al jovent. Barata, però es pot girar en contra." },
  anuncis: { label: "Publicitat electoral", cost: 12, en: 2, cat: "media", needSeg: true, icon: "📻", desc: "Cartells, ràdio, premsa i internet: arriba a molta gent sense riscos, però és cara. A Espanya, la publicitat electoral a les teles privades està prohibida. Pots triar el públic." },
  agenda: { label: "Marca l'agenda", cost: 5, en: 8, needTheme: true, cat: "media", icon: "🗞️", desc: "Poses un tema al centre del debat. Si demà en parlen tots els mitjans, en treuen profit els partits que el dominen." },
  atac: { label: "Contrast amb un rival", cost: 3, en: 6, needRival: true, cat: "media", icon: "⚔️", desc: "Retrets a un rival que competeix pels teus votants. Si surt bé, en treus vots; si no, et passa factura." },
  matisar: { label: "Matisar una posició", cost: 2, en: 4, needAxis: true, cat: "estr", icon: "🧭", desc: "Acostes una posició al centre. Hi ha votants moderats que t'escolten, però perds credibilitat." },
  enquesta: { label: "Enquesta interna", cost: 6, en: 0, free: true, cat: "estr", icon: "📊", desc: "Una enquesta només per al teu partit, amb el detall de cada circumscripció. No gasta cap franja i no està afectada per la prohibició de publicar enquestes." },
  descans: { label: "Descansa", cost: 0, en: 0, cat: "estr", icon: "🛌", desc: "El candidat recupera energia. Gasta una franja." },
};
const SIM_AXES = { eco: "economia", ter: "model territorial", val: "valors" };
// Públics dels anuncis (tipus de votant) i «tothom»
const SIM_AD_SEGS = ["", "jov", "jub", "mid", "ind", "rur", "urb"];

// Energia que costa una acció (amb el desplaçament, si n'hi ha)
function simActCost(state, type, arg) {
  const a = SIM_ACTIONS[type];
  const tr = a.needProv && arg !== null && arg !== undefined ? simTravel(state.loc, arg) : { en: 0, cost: 0, k: "aqui" };
  return { money: a.cost + tr.cost, en: a.en + tr.en, travel: tr };
}

function simCanAct(state, type, arg) {
  const a = SIM_ACTIONS[type];
  if (!a || state.phase !== "campaign") return "No és moment de campanya.";
  if (!a.free && state.slot >= 3) return "Ja no et queden franges avui.";
  if (a.needProv && !(arg >= 0 && arg < SIM_PROVS.length)) return "Cal triar una circumscripció.";
  const c = simActCost(state, type, arg);
  if (state.money < c.money) return "No et queden prou diners.";
  if (c.en > state.energy) return "El candidat està esgotat: cal descansar.";
  if (type === "candidat" && state.used.cand.includes(arg)) return "Ja tens un candidat local en aquesta circumscripció.";
  if (type === "coalicio" && (state.used.coal || []).includes(SIM_PROVS[arg].ccaa)) return "Ja tens una coalició en aquesta comunitat.";
  if (type === "coalicio" && (state.used.coal || []).length >= 2) return "Com a màxim, dues coalicions per campanya.";
  if (a.needTheme && !(arg >= 0 && arg < SIM_THEMES.length)) return "Cal triar un tema.";
  if (a.needAxis && !SIM_AXES[arg]) return "Cal triar un eix.";
  if (a.needRival && !state.rivals.some((r) => r.id === arg)) return "Cal triar un rival.";
  if (a.needSeg && arg !== null && arg !== "" && !SIM_SEGMENTS.some((g) => g.k === arg)) return "Cal triar un públic.";
  if (type === "atac" && (state.used.atac || []).some((x) => x.day === state.day && x.id === arg)) return "Avui ja has carregat contra aquest rival.";
  if (type === "matisar" && Math.abs(state.me[arg] - 5) < 0.8) return "En aquest eix ja ets a prop del centre.";
  if (type === "enquesta" && state.polls.some((p) => p.day === state.day && p.internal)) return "Avui ja tens una enquesta interna.";
  if (type === "descans" && state.energy >= SIM_ENERGY.max - 4) return "El candidat ja està descansat.";
  return null;
}

// Fa una acció del jugador. Retorna { ok, msg, good, fx } (fx: efectes visibles per a la interfície)
function simAct(state, type, arg = null) {
  const err = simCanAct(state, type, arg);
  if (err) return { ok: false, msg: err };
  const a = SIM_ACTIONS[type];
  const me = state.me, camp = state.camp.jo;
  const c = simActCost(state, type, arg);
  const eff = simEff(state);
  state.money -= c.money;
  state.energy = Math.max(0, state.energy - c.en);
  if (!a.free) state.slot++;
  if (a.needProv) { state.loc = arg; if (state.route[state.route.length - 1] !== arg) state.route.push(arg); }
  const fx = { prov: a.needProv ? arg : null, en: -c.en, money: -c.money, travel: c.travel.k };
  let msg = "", good = true;
  if (type === "miting") {
    const p = SIM_PROVS[arg];
    // A les circumscripcions petites, un míting arriba a una part més gran de l'electorat. Repetir-lo al mateix lloc rendeix menys.
    const times = state.log.filter((l) => l.type === "miting" && l.arg === arg && (l.round || 1) === (state.round || 1)).length;
    const boost = (0.18 + 0.03 * me.attrs.prox) * (1 + 0.9 * (1 - Math.min(p.seats, 16) / 16)) * eff / (1 + 0.45 * times);
    state.aw[arg] += (1 - state.aw[arg]) * 0.35 * eff;
    camp[arg] += boost;
    SIM_PROVS.forEach((q, j) => { if (j !== arg && q.ccaa === p.ccaa) { camp[j] += boost * 0.25; state.aw[j] += (1 - state.aw[j]) * 0.1; } });
    // Els grans actes surten als informatius de tot l'Estat
    if (p.seats >= 10) state.awG += (1 - state.awG) * 0.012 * eff;
    state.moral = Math.min(100, state.moral + 1);
    state.media += 2;
    fx.boost = boost;
    msg = `Míting a ${p.name}: més notorietat i suport a la circumscripció.`;
    simNews(state, { kind: "miting", icon: "📣", party: "jo", prov: arg, t: simNewsText("miting", state, { sig: me.sig, prov: p.name, big: eff >= 0.95 && boost > 0.3 }) });
  } else if (type === "porta") {
    const p = SIM_PROVS[arg];
    const k = 0.085 * (0.6 + state.moral / 100) * eff;
    state.mob[arg] = Math.min(0.2, state.mob[arg] + k);
    state.aw[arg] += (1 - state.aw[arg]) * 0.2 * eff;
    camp[arg] += 0.12 * eff;
    SIM_PROVS.forEach((q, j) => { if (j !== arg && q.ccaa === p.ccaa) state.mob[j] = Math.min(0.2, state.mob[j] + k * 0.3); });
    state.moral = Math.min(100, state.moral + 2);
    fx.mob = k;
    msg = `Porta a porta a ${p.name}: la militància anima els teus votants a anar a votar.`;
    simNews(state, { kind: "porta", icon: "🚪", party: "jo", prov: arg, t: simNewsText("porta", state, { sig: me.sig, prov: p.name }) });
  } else if (type === "xarxes") {
    // Les xarxes es saturen: cada missatge nou arriba a menys gent
    state.used.xarxes = (state.used.xarxes || 0) + 1;
    const sat = 1 / (1 + 0.14 * (state.used.xarxes - 1));
    state.awG += (1 - state.awG) * 0.035 * sat * eff;
    state.glob.jo += 0.02 * sat * eff;
    state.seg.jov = Math.min(0.5, (state.seg.jov || 0) + 0.02 * sat);
    if (simRand(state, "xarxes") < 0.18 + (simTired(state) ? 0.08 : 0)) {
      state.cred -= 6; state.glob.jo -= 0.05; good = false;
      msg = "Un missatge a les xarxes genera polèmica: perds credibilitat.";
      simNews(state, { kind: "polemica", icon: "📱", party: "jo", tone: "bad", t: simNewsText("xarxesKo", state, { sig: me.sig }) });
    } else {
      msg = "La campanya a les xarxes fa créixer la teva notorietat.";
      simNews(state, { kind: "xarxes", icon: "📱", party: "jo", t: simNewsText("xarxes", state, { sig: me.sig }) });
    }
  } else if (type === "anuncis") {
    state.used.anuncis = (state.used.anuncis || 0) + 1;
    const sat = 1 / (1 + 0.35 * (state.used.anuncis - 1));
    state.awG += (1 - state.awG) * 0.05 * sat;
    state.glob.jo += 0.01 * sat;
    if (arg) state.seg[arg] = Math.min(0.5, (state.seg[arg] || 0) + 0.06 * sat);
    fx.seg = arg || null;
    const label = arg ? SIM_SEGMENTS.find((g) => g.k === arg).label.toLowerCase() : null;
    msg = label ? `Publicitat pensada per al públic «${label}»: et coneix més gent i connectes amb aquests votants.` : "Cartells, falques de ràdio i anuncis a internet: et coneix molta més gent arreu.";
    simNews(state, { kind: "anuncis", icon: "📺", party: "jo", t: simNewsText("anuncis", state, { sig: me.sig }) });
  } else if (type === "candidat") {
    camp[arg] += 0.32 * eff; state.aw[arg] += (1 - state.aw[arg]) * 0.25; state.used.cand.push(arg);
    msg = `Fitxes un candidat conegut a ${SIM_PROVS[arg].name}.`;
    simNews(state, { kind: "candidat", icon: "⭐", party: "jo", prov: arg, t: simNewsText("candidat", state, { sig: me.sig, prov: SIM_PROVS[arg].name }) });
  } else if (type === "agenda") {
    state.push[arg] += 1.4 * eff;
    me.iss[arg] = Math.min(1.3, me.iss[arg] + 0.12);
    state.glob.jo += 0.01;
    // Si avui ja és el tema del dia, aprofites l'ona
    if (state.agenda === arg) { state.glob.jo += 0.03 * eff; fx.wave = true; }
    msg = state.agenda === arg ? `Aprofites que tothom parla de ${SIM_THEMES[arg].label.toLowerCase()} per explicar les teves propostes.` : `Poses ${SIM_THEMES[arg].label.toLowerCase()} al centre del debat: potser demà en parlen tots els mitjans.`;
    simNews(state, { kind: "agenda", icon: SIM_THEMES[arg].icon, party: "jo", theme: arg, t: simNewsText("agenda", state, { sig: me.sig, theme: SIM_THEMES[arg].label.toLowerCase() }) });
  } else if (type === "atac") {
    const R = simPartyById(state, arg);
    const d = simDistP(R, me);
    const overlap = Math.max(0, 1 - d / 6);
    (state.used.atac = state.used.atac || []).push({ day: state.day, id: arg });
    // Surt bé més sovint amb solvència i credibilitat, i quan el rival competeix de veritat pels teus votants
    const p = 0.42 + 0.05 * me.attrs.sol + state.cred / 400 + overlap * 0.15 - (simTired(state) ? 0.1 : 0);
    if (simRand(state, `atac-${arg}`) < p) {
      state.glob[arg] -= (0.02 + 0.06 * overlap) * eff;
      state.glob.jo += (0.015 + 0.04 * overlap) * eff;
      state.awG += (1 - state.awG) * 0.03;
      fx.hit = arg;
      msg = simGram(overlap > 0.25 ? `El contrast amb ${simThe(R)} funciona: et disputes els seus votants i en surts reforçat.` : `El contrast amb ${simThe(R)} té ressò, però els seus votants queden lluny dels teus.`);
      simNews(state, { kind: "atac", icon: "⚔️", party: "jo", target: arg, t: simNewsText("atac", state, { sig: me.sig, target: R.sig }) });
    } else {
      state.cred -= 5; state.glob.jo -= 0.025; good = false;
      state.glob[arg] += 0.01;
      fx.backfire = arg;
      msg = simGram(`El retret a ${simThe(R)} es gira en contra: se't veu més pendent dels altres que de les teves propostes.`);
      simNews(state, { kind: "atac", icon: "⚔️", party: "jo", target: arg, tone: "bad", t: simNewsText("atacKo", state, { sig: me.sig, target: R.sig }) });
    }
    // El rival no s'ho quedarà: demà pot respondre
    (state.grudge = state.grudge || {})[arg] = state.day;
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
    msg = simGram(`Coalició amb una candidatura local a ${p.ccaa}: sumeu forces a ${mates.length === 1 ? "la circumscripció" : `les ${mates.length} circumscripcions`}.`);
    good = d < 0.45;
    simNews(state, { kind: "coalicio", icon: "🤝", party: "jo", prov: arg, t: simNewsText("coalicio", state, { sig: me.sig, ccaa: p.ccaa }) });
  } else if (type === "matisar") {
    const before = me[arg];
    me[arg] = Math.round((before + (5 - before) * 0.3) * 10) / 10;
    state.cred -= 5;
    msg = `Matises la teva posició en ${SIM_AXES[arg]}: alguns votants moderats t'escolten, però et retreuen el canvi.`;
    simNews(state, { kind: "matisar", icon: "🧭", party: "jo", t: simNewsText("matisar", state, { sig: me.sig, axis: SIM_AXES[arg] }) });
  } else if (type === "enquesta") {
    simPushPoll(state, simPoll(state, 2000, null));
    msg = "Tens una enquesta interna nova, amb el detall de cada circumscripció.";
  } else if (type === "descans") {
    state.energy = Math.min(SIM_ENERGY.max, state.energy + SIM_ENERGY.rest);
    fx.en = SIM_ENERGY.rest;
    msg = "El candidat descansa unes hores i recupera energia.";
  }
  // El cansament té un preu: una relliscada en directe
  if (type !== "descans" && type !== "enquesta" && simTired(state) && simRand(state, `relliscada-${state.day}-${state.slot}`) < (simTired(state) === 2 ? 0.24 : 0.1)) {
    state.cred -= 4; state.glob.jo -= 0.03; good = false;
    fx.gaffe = true;
    msg += " El cansament passa factura: una relliscada del candidat corre per les xarxes.";
    simNews(state, { kind: "relliscada", icon: "😬", party: "jo", tone: "bad", t: simNewsText("relliscada", state, { who: simLeaderName(state) }) });
  }
  state.cred = Math.max(0, Math.min(100, state.cred));
  state.glob.jo = Math.max(-0.6, Math.min(0.8, state.glob.jo));
  // La credibilitat també pesa: per sota de 40 resta, per sobre de 70 suma
  state.glob.jo += state.cred < 40 ? -0.01 : state.cred > 70 ? 0.01 : 0;
  state.log.push({ day: state.day, type, arg, msg, good, round: state.round || 1 });
  return { ok: true, msg, good, fx };
}
const simLeaderName = (state) => state.me.leader || `el candidat de ${state.me.sig}`;

// ---------- L'agenda: de què parlen els mitjans cada dia ----------
// Pesa el que han empès els partits (Marca l'agenda, propostes) i l'actualitat, que de vegades imposa un tema.
function simNextAgenda(state, first = false) {
  const rnd = () => simRand(state, `agenda-${state.day}`);
  const prev = state.agenda;
  const shock = !first && rnd() < 0.22 ? Math.floor(rnd() * SIM_THEMES.length) : null;
  const w = SIM_THEMES.map((_, k) => (1 + state.push[k] * 2.4 + (k === shock ? 5 : 0)) * (k === prev ? 0.35 : 1));
  let x = rnd() * w.reduce((t, v) => t + v, 0);
  let pick = w.findIndex((v) => (x -= v) < 0);
  if (pick < 0) pick = 0;
  // Qui ha empès el tema que ha guanyat
  const pushedByMe = state.push[pick] > 0 && (state.pushBy?.[pick] || []).includes("jo");
  state.agenda = pick;
  state.push = state.push.map((v) => v * 0.35);
  state.pushBy = {};
  const th = SIM_THEMES[pick];
  simNews(state, { kind: "tema", icon: th.icon, theme: pick, t: simNewsText(shock === pick ? "temaXoc" : pushedByMe ? "temaMeu" : "tema", state, { theme: th.label.toLowerCase(), sig: state.me.sig }) });
  return pick;
}

// ---------- Les notícies del dia (teletip i informatiu) ----------
function simNews(state, n) {
  state.news = state.news || [];
  state.news.push({ day: state.day, slot: state.slot, round: state.round || 1, ...n });
  if (state.news.length > 90) state.news.splice(0, state.news.length - 90);
  // Qui empeny cada tema (per saber si el tema del dia l'ha posat el jugador)
  if (n.kind === "agenda" && n.theme !== undefined) ((state.pushBy = state.pushBy || {})[n.theme] = state.pushBy[n.theme] || []).push(n.party);
}

// Els rivals juguen a sim-ai.js (simRivalsTurn).

// Acaba la jornada: torn dels rivals, la nit (energia i desgast dels efectes), el tema de demà i l'enquesta del matí
function simEndDay(state) {
  const moves = simRivalsTurn(state);
  // Desgast: els efectes de campanya es dilueixen; la notorietat es queda
  Object.keys(state.camp).forEach((id) => { state.camp[id] = state.camp[id].map((v) => v * SIM_K.decay); state.glob[id] *= SIM_K.decay; });
  Object.keys(state.seg).forEach((k) => { state.seg[k] *= 0.94; });
  state.mob = state.mob.map((v) => v * 0.88);
  state.energy = Math.min(SIM_ENERGY.max, state.energy + SIM_ENERGY.night);
  state.day++;
  state.slot = 0;
  state.route = [state.loc];
  state.money += 6 + (state.moral >= 70 ? 2 : 0); // aportacions diàries de la militància
  let poll = null;
  if (state.day > state.days) {
    state.phase = "reflection";
    simNews(state, { kind: "reflexio", icon: "🤫", t: simNewsText("reflexio", state) });
  } else {
    simNextAgenda(state);
    if (!simPollsBanned(state)) poll = simPublishPoll(state);
    else {
      Object.keys(state.mom).forEach((id) => { state.mom[id] *= 0.7; });
      if (state.day === simBanDay(state)) simNews(state, { kind: "veda", icon: "🚫", t: simNewsText("veda", state) });
    }
    simDayOffers(state);
  }
  return { moves, poll };
}

// Enquesta publicada al matí per un institut (rotatiu): actualitza l'arrossegament de cada partit
function simPublishPoll(state) {
  const pub = state.polls.filter((p) => !p.internal);
  const P = SIM_POLLSTERS[(pub.length) % SIM_POLLSTERS.length];
  const poll = simPoll(state, null, P.k);
  const prev = simPollAvg(state);
  Object.keys(poll.est).forEach((id) => {
    const trend = prev ? poll.est[id] - (prev[id] ?? poll.est[id]) : 0;
    state.mom[id] = Math.max(-1, Math.min(1, 0.5 * (state.mom[id] || 0) + trend / 3));
  });
  simPushPoll(state, poll);
  const order = Object.keys(poll.est).sort((a, b) => poll.est[b] - poll.est[a]);
  const lead = simPartyById(state, order[0]);
  const trend = prev ? poll.est.jo - (prev.jo ?? poll.est.jo) : 0;
  simNews(state, { kind: "enquesta", icon: "📊", party: order[0], t: simNewsText("enquesta", state, { pollster: P.name, lead: lead.sig, x: simFmt1(poll.est[order[0]]), me: state.me.sig, y: simFmt1(poll.est.jo), trend }) });
  // Les grans pujades i baixades són notícia
  Object.keys(state.mom).forEach((id) => {
    if (Math.abs(state.mom[id]) < 0.35) return;
    simNews(state, { kind: "impuls", icon: state.mom[id] > 0 ? "📈" : "📉", party: id, t: simNewsText(state.mom[id] > 0 ? "puja" : "baixa", state, { sig: simPartyById(state, id).sig }) });
  });
  return poll;
}
const simFmt1 = (x) => (Math.round(x * 10) / 10).toLocaleString("ca-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---------- Debat: 3 preguntes; cada resposta té un perfil ideològic ----------
// answers: [{ eco, ter, val }] (posició de la resposta triada). Puntua coherència amb el partit i l'atractiu general.
// El cansament resta: un candidat esgotat no llueix igual.
// Com sona una resposta del debat (0-1): coherència amb el programa i atractiu per a l'electorat del mig
function simDebateAnswer(state, a) {
  const me = state.me;
  return {
    coh: 1 - Math.min(1, Math.hypot(a.eco - me.eco, a.ter - me.ter, a.val - me.val) / 8),
    appeal: 1 - Math.min(1, Math.hypot(a.eco - 5, a.ter - 4, a.val - 5) / 8),
  };
}
// Nota del debat (0-1): sobretot la coherència, també l'atractiu i el carisma; el cansament hi resta
function simDebateScore(state, answers) {
  let coh = 0, appeal = 0;
  answers.forEach((a) => { const r = simDebateAnswer(state, a); coh += r.coh; appeal += r.appeal; });
  coh /= answers.length; appeal /= answers.length;
  return { coh, appeal, score: 0.5 * coh + 0.3 * appeal + 0.2 * (state.me.attrs.car / 5) - 0.05 * simTired(state) };
}
// Els rivals solen treure una nota d'entre aquests dos valors (vegeu simDebate)
const SIM_DEBATE_RIVALS = [0.41, 0.59];
function simDebate(state, answers) {
  const me = state.me;
  const { coh, appeal, score } = simDebateScore(state, answers);
  const delta = (score - 0.55) * 0.5;
  state.glob.jo += delta;
  state.awG += (1 - state.awG) * 0.08;
  state.cred += Math.round((coh - 0.6) * 20);
  state.cred = Math.max(0, Math.min(100, state.cred));
  state.energy = Math.max(0, state.energy - 10);
  // Qui guanya el debat segons els analistes (el jugador o el rival que hi ha sortit més ben parat)
  const rivals = state.rivals.filter((r) => !r.ccaa).map((r) => ({ id: r.id, s: 0.5 + (r.lead - 0.55) * 0.5 + (simRand(state, `debat-${r.id}`) - 0.5) * 0.18 }));
  const best = rivals.sort((a, b) => b.s - a.s)[0];
  const won = score >= best.s;
  if (!won) state.glob[best.id] += 0.02;
  simNews(state, { kind: "debat", icon: "🎙️", party: won ? "jo" : best.id, t: simNewsText(won ? "debatMeu" : "debatRival", state, { sig: won ? me.sig : simPartyById(state, best.id).sig }) });
  return { score, coh, appeal, delta, won, best: best.id };
}

// Potencial del partit: escons que tindria si tothom el conegués, sense campanya de ningú.
// Serveix per fixar objectius justos per a qualsevol ideologia.
function simPotential(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.awG = 1;
  s.aw = s.aw.map(() => 1);
  s.agenda = null;
  Object.keys(s.camp).forEach((id) => { s.camp[id] = s.camp[id].map(() => 0); s.glob[id] = 0; s.mom[id] = 0; });
  return simElection(s).totals.jo.seats;
}

// ---------- Nit electoral: enquesta a peu d'urna i escrutini ----------
// Implantació rural de cada partit: quant més vota a les circumscripcions rurals que a les urbanes (-0,6 a 0,6).
// A la nit electoral, els vots de les meses rurals arriben abans i fan que, al principi, aquests partits vagin més amunt.
function simRuralLean(r) {
  const lean = {};
  Object.keys(r.totals).forEach((id) => {
    let rv = 0, rt = 0, uv = 0, ut = 0;
    r.provs.forEach((p) => {
      if (p.votes[id] === undefined) return;
      const rur = 1 - SIM_PROVS[p.i].urb;
      rv += p.votes[id] * rur; rt += p.valid * rur;
      uv += p.votes[id] * (1 - rur); ut += p.valid * (1 - rur);
    });
    const a = rt ? rv / rt : 0, b = ut ? uv / ut : 0;
    lean[id] = a + b > 0 ? Math.max(-0.6, Math.min(0.6, (a - b) / ((a + b) / 2))) : 0;
  });
  return lean;
}
// Ritme de l'escrutini de cada circumscripció: comença uns minuts després de les 20.00 h i les grans triguen més
function simCountPace(i) {
  const p = SIM_PROVS[i];
  return { start: 14 + 22 * p.urb, dur: 105 + 115 * Math.min(1, p.seats / 24) };
}
// Escrutini a una hora concreta (minuts des de les 20.00 h). Torna vots i escons provisionals de cada partit.
function simCountAt(r, t, lean = simRuralLean(r)) {
  let counted = 0;
  const totals = Object.fromEntries(Object.keys(r.totals).map((id) => [id, { votes: 0, seats: 0 }]));
  const provs = r.provs.map((p) => {
    const { start, dur } = simCountPace(p.i);
    const x = Math.max(0, Math.min(1, (t - start) / dur));
    const f = x * x * (3 - 2 * x);
    if (f <= 0) return { i: p.i, f: 0, won: null, votes: null };
    if (f >= 1) {
      counted += p.valid;
      Object.keys(p.votes).forEach((id) => { totals[id].votes += p.votes[id]; totals[id].seats += p.won[id]; });
      return { i: p.i, f: 1, won: p.won, votes: p.votes, valid: p.valid, winners: p.winners, next: p.next, elig: p.elig, min: p.min };
    }
    // Les meses rurals es compten abans: al principi pesen més els partits amb implantació rural
    const raw = {};
    let rawSum = 0, finSum = 0;
    Object.keys(p.votes).forEach((id) => { raw[id] = p.votes[id] * Math.max(0.5, 1 + 0.3 * (1 - f) * (lean[id] || 0)); rawSum += raw[id]; finSum += p.votes[id]; });
    const votes = {};
    Object.keys(raw).forEach((id) => { votes[id] = Math.round((raw[id] / rawSum) * finSum * f); });
    const blank = Math.round(p.blank * f);
    const s = simSeatsFor(votes, blank, p.seats);
    counted += s.valid;
    Object.keys(votes).forEach((id) => { totals[id].votes += votes[id]; totals[id].seats += s.won[id]; });
    return { i: p.i, f, votes, valid: s.valid, ...s };
  });
  const pct = counted / r.valid;
  const seated = provs.filter((p) => p.f > 0).reduce((t, p) => t + SIM_PROVS[p.i].seats, 0);
  return { t, pct, totals, provs, seated, valid: counted };
}
// Escons en joc: circumscripcions on l'últim escó es decideix per pocs vots (en % dels vots escrutats)
function simBattles(c, n = 3) {
  const out = [];
  c.provs.forEach((p) => {
    if (!p.f || !p.next || !p.winners?.length) return;
    const last = p.winners[p.winners.length - 1];
    if (last.id === p.next.id) return;
    const gap = simSeatGap(p, p.next.id);
    if (gap === null) return;
    const pct = (gap / p.valid) * 100;
    if (pct < 1.2) out.push({ i: p.i, holder: last.id, chaser: p.next.id, gap, pct, f: p.f });
  });
  return out.sort((a, b) => a.pct - b.pct).slice(0, n);
}
// Enquesta a peu d'urna (20.00 h): el resultat real amb un error petit, i la projecció d'escons amb forquilla
function simExitPoll(state, r) {
  const rng = simMulberry(simHash(`${state.seed}|peu-urna|${state.round || 1}`));
  const est = {};
  Object.keys(r.totals).forEach((id) => {
    const sh = r.totals[id].share * 100;
    est[id] = Math.round(Math.max(0.1, sh + simGauss(rng) * Math.min(1.2, 0.05 + 0.13 * sh ** 0.8)) * 10) / 10;
  });
  const proj = simProject(r, est);
  const range = {};
  Object.keys(est).forEach((id) => {
    const e = Math.min(2, 0.1 + 0.15 * est[id] ** 0.8);
    range[id] = proj.seats[id] || est[id] >= 1 ? simSeatRange(r, est, id, e) : [0, 0];
    range[id][0] = Math.min(range[id][0], proj.seats[id]);
    range[id][1] = Math.max(range[id][1], proj.seats[id]);
  });
  return { est, seats: proj.seats, range };
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
const SIM_MEDIA_TYPES = { entrevista: "Entrevista", forum: "Fòrum", cara: "Cara a cara", replica: "Rèplica" };
// Energia que gasta cada proposta de l'agenda
const SIM_OFFER_EN = { entrevista: 10, forum: 10, cara: 14, replica: 4 };

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
  // Els reptes a cara a cara van primer a l'agenda i, abans encara, les rèpliques als rivals que t'han atacat
  (state.challenges || []).splice(0).reverse().forEach((id, k) => out.unshift({ id: `${day}-c${k}`, type: "cara", rival: id, status: "nova" }));
  (state.replies || []).splice(0).reverse().forEach((id, k) => out.unshift({ id: `${day}-r${k}`, type: "replica", rival: id, status: "nova" }));
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
  let quality = answers.reduce((t, a) => t + simAnswerQuality(state, a), 0) / answers.length + (state.me.attrs.sol - 3) * 0.03 - 0.05 * simTired(state);
  const stakes = offer.tone === "dura" ? 1.5 : 1;
  const delta = (quality - 0.55) * stakes;
  state.slot++;
  state.energy = Math.max(0, state.energy - SIM_OFFER_EN.entrevista);
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
  simNews(state, { kind: "entrevista", icon: "🎙️", party: "jo", tone: good ? null : "bad", prov: o.reach === "estatal" ? null : offer.prov, t: simNewsText(good ? "entrevista" : "entrevistaKo", state, { who: simLeaderName(state), outlet: o.short.toLowerCase() }) });
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
  state.energy = Math.max(0, state.energy - SIM_OFFER_EN.forum);
  state.seg[f.seg] = Math.max(-0.3, Math.min(0.5, (state.seg[f.seg] || 0) + segD));
  state.cred = Math.max(0, Math.min(100, state.cred + cred));
  state.awG += (1 - state.awG) * 0.015;
  offer.status = "feta";
  const label = SIM_SEGMENTS.find((g) => g.k === f.seg).label.toLowerCase();
  const msg = k === 0 ? (cred < 0 ? `${f.name}: el discurs agrada al públic (${label}), però et retreuen que dius el contrari del teu programa.` : `${f.name}: connectes amb el públic (${label}).`)
    : k === 1 ? (segD > 0 ? `${f.name}: defenses el teu programa i el públic (${label}) t'aplaudeix.` : `${f.name}: defenses el teu programa davant d'un públic (${label}) que no hi està d'acord. Guanyes credibilitat.`)
      : `${f.name}: un discurs correcte, sense gaire impacte (${label}).`;
  state.log.push({ day: state.day, type: "forum", arg: offer.id, msg, good: segD >= 0 && cred >= 0, round: state.round || 1 });
  simNews(state, { kind: "forum", icon: "🏛️", party: "jo", t: simNewsText("forum", state, { sig: me.sig, forum: f.name.charAt(0).toLowerCase() + f.name.slice(1) }) });
  return { segD, cred, msg, seg: f.seg, label, view };
}

// Cara a cara contra un rival (gasta una franja): el teu resultat contra el seu
function simDoCara(state, offerId, picks) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova" || state.slot >= 3) return null;
  const R = state.rivals.find((r) => r.id === offer.rival);
  const qs = simMediaQuestions(state, offer);
  const mine = qs.reduce((t, q, k) => t + simAnswerQuality(state, q.a[picks[k]] || q.a[0]), 0) / qs.length + (state.me.attrs.car - 3) * 0.04 - 0.05 * simTired(state);
  const theirs = 0.55 + (R.lead - 0.55) * 0.5 + (simRand(state, `cara-${offer.id}`) - 0.5) * 0.12;
  const won = mine >= theirs;
  state.slot++;
  state.energy = Math.max(0, state.energy - SIM_OFFER_EN.cara);
  state.awG += (1 - state.awG) * 0.05;
  state.glob.jo += won ? 0.05 : -0.02;
  state.glob[R.id] += won ? -0.02 : 0.02;
  state.cred = Math.max(0, Math.min(100, state.cred + (won ? 3 : -2)));
  offer.status = "feta";
  const msg = simGram(won ? `Cara a cara amb el candidat de ${simThe(R)}: els analistes et donen com a guanyador.` : `Cara a cara amb el candidat de ${simThe(R)}: el teu rival en surt més ben parat.`);
  state.log.push({ day: state.day, type: "cara", arg: offer.id, msg, good: won, round: state.round || 1 });
  simNews(state, { kind: "cara", icon: "⚔️", party: won ? "jo" : R.id, target: won ? R.id : "jo", t: simNewsText(won ? "caraMeu" : "caraRival", state, { sig: state.me.sig, rival: R.sig }) });
  return { won, mine, theirs, msg, rival: R };
}

// Declinar una proposta. Defugir un cara a cara té un petit cost.
function simDecline(state, offerId) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova") return null;
  if (offer.type === "replica") return simDoReplica(state, offerId, 2);
  offer.status = "rebutjada";
  if (offer.type === "cara") {
    const R = state.rivals.find((r) => r.id === offer.rival);
    state.cred = Math.max(0, state.cred - 2);
    state.glob[R.id] += 0.01;
    const msg = simGram(`Declines el cara a cara amb el candidat de ${simThe(R)}: se't retreu que defugis el debat.`);
    state.log.push({ day: state.day, type: "cara", arg: offer.id, msg, good: false, round: state.round || 1 });
    return { msg };
  }
  return { msg: "Declines la proposta." };
}

// Rèplica a l'atac d'un rival: és una declaració, no gasta franja, però s'ha de fer el mateix dia.
// k: 0 respondre amb dades · 1 contraatacar · 2 no respondre
function simDoReplica(state, offerId, k) {
  const offer = simOffer(state, offerId);
  if (!offer || offer.status !== "nova" || offer.type !== "replica") return null;
  const R = simPartyById(state, offer.rival), me = state.me;
  const rnd = simRand(state, `replica-${offer.id}`);
  let good = false, msg;
  if (k === 0) {
    good = rnd < 0.5 + 0.08 * me.attrs.sol + state.cred / 500 - 0.08 * simTired(state);
    if (good) { state.glob.jo += 0.03; state.cred += 3; msg = simGram(`Desmuntes els retrets de ${simThe(R)} amb dades: la rèplica et dona credibilitat.`); }
    else { state.cred -= 2; msg = simGram(`La rèplica a ${simThe(R)} arriba tard i amb poca força.`); }
  } else if (k === 1) {
    good = rnd < 0.4 + 0.08 * me.attrs.car - 0.1 * simTired(state);
    if (good) { state.glob.jo += 0.04; state.glob[R.id] -= 0.03; state.awG += (1 - state.awG) * 0.02; msg = simGram(`Contraataques i l'estirada amb ${simThe(R)} es fa viral: et veuen com una alternativa.`); }
    else { state.glob.jo -= 0.02; state.cred -= 4; msg = simGram(`El contraatac a ${simThe(R)} encén la polèmica i en surts escaldat.`); }
  } else {
    state.glob.jo -= 0.015;
    msg = simGram(`No respons a ${simThe(R)}: el seu missatge cala entre alguns dels teus votants.`);
  }
  if (k < 2) state.energy = Math.max(0, state.energy - SIM_OFFER_EN.replica);
  state.cred = Math.max(0, Math.min(100, state.cred));
  offer.status = k < 2 ? "feta" : "rebutjada";
  state.log.push({ day: state.day, type: "replica", arg: offer.id, msg, good, round: state.round || 1 });
  if (k < 2) simNews(state, { kind: "replica", icon: "💬", party: "jo", target: R.id, tone: good ? null : "bad", t: simNewsText(good ? "replica" : "replicaKo", state, { sig: me.sig, rival: R.sig }) });
  return { good, msg, k, rival: R };
}
