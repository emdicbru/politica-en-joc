// Simulador del 29N · Campanya contra amics al Laboratori del Centre de control: una sala local (no s'escriu res a
// Firestore) amb amics ficticis que juguen sols. Fa servir la mateixa interfície que la sala en línia (Online.camp a
// online.js), així que les pantalles (sim-amics.js, sim-pactes.js) són les mateixes.
// Els amics ficticis: creen el partit, fan campanya cada dia, xategen, responen els pactes i voten la investidura.

const SIM_LAB_KEY = "r29n-lab-amics"; // la sala de prova, en aquesta pestanya (sessionStorage)
const SIM_LAB_BOTS = [
  { name: "Marta (fictícia)", party: { name: "Futur Verd", sig: "FV", color: "#3f8f45", shape: "cercle", motto: "Respira el canvi", eco: 2.5, ter: 5.5, val: 3, prio: [5, 0, 6], attrs: { car: 3, sol: 3, prox: 3 }, leader: "Marta Puig" },
    hi: "Hola a tothom! Som Futur Verd. Que guanyi la millor campanya 🌱", taunt: "Ep, aquest atac no ha estat gaire elegant… ja en parlarem a les urnes 😉" },
  { name: "Jordi (fictici)", party: { name: "Ordre Nou", sig: "ON", color: "#5c6b7a", shape: "quadrat", motto: "Seny i ordre", eco: 7.5, ter: 2.5, val: 7.5, prio: [1, 7, 4], attrs: { car: 3, sol: 4, prox: 2 }, leader: "Jordi Mas" },
    hi: "Bona nit. Ordre Nou surt a guanyar, i no a fer amics 😎", taunt: "Molt bé, ja veig de quin peu calces. Tindràs resposta." },
  { name: "Laia (fictícia)", party: { name: "Veïns Units", sig: "VU", color: "#c39a5f", shape: "hexagon", motto: "La gent primer", eco: 5, ter: 6.5, val: 5, prio: [0, 3, 2], attrs: { car: 2, sol: 3, prox: 4 }, leader: "Laia Font" },
    hi: "Hola! Veïns Units, a peu de carrer. Sort a tothom!", taunt: "Uf, això ha fet mal. Però nosaltres anem a la nostra." },
];
const simLabWait = (a, b) => a + Math.random() * (b - a);

const SimLab = (() => {
  let room = null;
  try { room = JSON.parse(sessionStorage.getItem(SIM_LAB_KEY) || "null"); } catch { /* sense emmagatzematge */ }
  const subs = new Set();
  const busy = new Set(); // feines pendents dels amics ficticis (per no repetir-les)
  const me = () => "lab-jo";
  const save = () => { try { sessionStorage.setItem(SIM_LAB_KEY, JSON.stringify(room)); } catch { /* massa gran o sense emmagatzematge */ } };
  const emit = () => { save(); const copy = JSON.parse(JSON.stringify(room)); setTimeout(() => subs.forEach((cb) => cb(JSON.parse(JSON.stringify(copy)))), 0); setTimeout(bots, 0); };
  // Escriptures amb camps amb punts, com a Firestore
  const patch = (p) => {
    Object.entries(p).forEach(([k, v]) => {
      const parts = k.split(".");
      let o = room;
      parts.slice(0, -1).forEach((x) => { if (!o[x] || typeof o[x] !== "object") o[x] = {}; o = o[x]; });
      const last = parts[parts.length - 1];
      if (v === undefined) delete o[last]; else o[last] = JSON.parse(JSON.stringify(v));
    });
  };
  const seatName = () => window.Online?.profile?.handle || "Tu";

  const api = {
    lab: true,
    ok: () => true,
    uid: me,
    async create(diff = "normal") {
      const code = `LAB${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      room = { code, status: "lobby", host: me(), diff, seed: `lab-${code}-${Date.now().toString(36)}`, players: [me()], seats: { [me()]: { name: seatName(), photo: "", party: null, ready: false } }, day: 0, world: null, turn: {}, chat: [], neg: null };
      emit();
      return code;
    },
    async join(code) { return room?.code === code ? { ok: true } : { err: "Aquesta sala de prova ja no existeix." }; },
    watch(code, cb) {
      const f = (d) => cb(d && d.code === code ? d : null);
      subs.add(f);
      setTimeout(() => f(room ? JSON.parse(JSON.stringify(room)) : null), 0);
      setTimeout(bots, 0);
      return () => subs.delete(f);
    },
    async setSeat(code, p) { if (!room) return null; patch(Object.fromEntries(Object.entries(p).map(([k, v]) => [`seats.${me()}.${k}`, v]))); emit(); return true; },
    async leave() { room = null; save(); return true; },
    async remove() { room = null; save(); return true; },
    async start(code, world) { patch({ status: "playing", day: 1, world, turn: {} }); emit(); return true; },
    async submit(code, day, world) { patch({ [`turn.${me()}`]: { day, world } }); emit(); return true; },
    async resolve(code, day, world, done = false, extra = {}) {
      if (!room || room.day !== day) return false;
      patch({ day: day + 1, world, ...(done ? { status: "done" } : {}), ...extra });
      emit();
      return true;
    },
    async chat(code, msg) { room.chat = [...(room.chat || []), msg].slice(-150); emit(); return true; },
    async neg(code, p) { patch(p); emit(); return true; },
    async mine() { return room && room.status !== "done" ? [JSON.parse(JSON.stringify(room))] : []; },
    // Només al laboratori: afegeix un amic fictici a la sala
    async addBot() {
      if (!room || room.status !== "lobby" || room.players.length >= 4) return false;
      const used = room.players.map((u) => room.seats[u]?.party?.sig).filter(Boolean);
      const B = SIM_LAB_BOTS.find((b) => !room.players.includes(`bot-${b.party.sig}`));
      if (!B) return false;
      const uid = `bot-${B.party.sig}`;
      const party = { ...B.party, sig: used.includes(B.party.sig) ? `${B.party.sig}2` : B.party.sig };
      room.players.push(uid);
      room.seats[uid] = { name: B.name, photo: "", party, ready: true, bot: true };
      emit();
      return true;
    },
  };

  // ---------- Els amics ficticis ----------
  const botsOf = () => (room ? room.players.filter((u) => u.startsWith("bot-")) : []);
  const hidOf = (u) => `h${room.players.indexOf(u)}`;
  const uidOf = (hid) => room.players[Number(hid.slice(1))];
  const persona = (u) => SIM_LAB_BOTS.find((b) => `bot-${b.party.sig}` === u) || SIM_LAB_BOTS[0];
  const later = (k, ms, fn) => {
    const key = `${room.code}:${k}`;
    if (busy.has(key)) return;
    busy.add(key);
    setTimeout(() => { try { if (room) fn(); } catch (e) { console.warn(e); } }, ms);
  };
  const say = (from, to, t, extra = {}) => { room.chat = [...(room.chat || []), { id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, from, to, t, ts: Date.now(), ...extra }].slice(-150); emit(); };

  function bots() {
    if (!room || room.status === "lobby") return;
    const W = room.world ? JSON.parse(room.world) : null;
    if (!W) return;
    botsOf().forEach((u) => {
      const P = persona(u);
      // Salutació en començar
      later(`hi-${u}`, simLabWait(1500, 5000), () => say(u, "all", P.hi));
      // La campanya: el seu dia, quan encara no l'ha enviat
      if (room.status === "playing" && W.phase === "campaign" && room.turn?.[u]?.day !== room.day) {
        const day = room.day;
        later(`dia-${u}-${day}`, simLabWait(1800, 4500), () => {
          if (room.day !== day) return;
          const Wd = JSON.parse(room.world);
          patch({ [`turn.${u}`]: { day, world: JSON.stringify(simLabBotDay(Wd, hidOf(u))) } });
          emit();
        });
        // Si algú l'ha atacat ahir, li ho diu en privat
        const hit = (W.news || []).find((n) => n.day === day - 1 && n.kind === "atac" && n.target === hidOf(u) && W.hum[n.party] && !uidOf(n.party).startsWith("bot-"));
        if (hit) later(`retret-${u}-${day}`, simLabWait(2500, 6000), () => say(u, uidOf(hit.party), P.taunt));
      }
    });
    if (room.neg) botsNeg(W);
  }

  // Negociació: posició inicial, propostes, respostes als pactes, xat privat i vots
  function botsNeg(W) {
    const neg = room.neg;
    const V0 = simMpCongress(W);
    const seats = (hid) => V0.res.seats[hid === W.mp.ids[0] ? "jo" : hid] || 0;
    const humans = room.players.filter((u) => !u.startsWith("bot-"));
    botsOf().forEach((u) => {
      const hid = hidOf(u), P = W.hum[hid].me;
      const wants = simWants(P);
      later(`pos-${u}`, simLabWait(1500, 4000), () => say(u, "all", `Tenim ${seats(hid)} ${seats(hid) === 1 ? "escó" : "escons"}. Per a nosaltres és clau: ${wants.map((m) => `«${simLc(m.t)}»`).join(" i ")}. Escoltem propostes.`));
      // Proposa un pacte a cada jugador humà amb qui té afinitat
      humans.forEach((h) => {
        const H = W.hum[hidOf(h)].me;
        const d = simDistP(P, H);
        if (d > 4.5) return;
        later(`proposa-${u}-${h}`, simLabWait(6000, 12000), () => {
          if (simMpPacts(room.neg).some((p) => (p.from === hid || p.to === hid) && (p.from === hidOf(h) || p.to === hidOf(h)))) return;
          const cand = seats(hidOf(h)) >= seats(hid) ? hidOf(h) : hid;
          const C = W.hum[cand].me;
          const measures = wants.filter((m) => !simIsRedLine(C, m) && simMeasureView(C, m) > -0.5).slice(0, 2).map((m) => m.id);
          const id = `p${Date.now().toString(36)}`;
          const pact = { id, from: hid, to: hidOf(h), cand, kind: d < 3 ? "coal" : "inv", measures, mins: d < 3 ? 2 : 0, status: "pendent", ts: Date.now() };
          patch({ [`neg.pacts.${id}`]: pact });
          say(u, h, cand === hid ? "Et faig una proposta: dona'ns suport i incloem les teves prioritats al govern." : "Podem donar-te suport, però volem veure les nostres prioritats a l'acord.", { pact: id });
        });
      });
    });
    // Respon els pactes que li han ofert
    simMpPacts(neg).filter((p) => p.status === "pendent" && uidOf(p.to)?.startsWith("bot-")).forEach((p) => {
      const u = uidOf(p.to);
      later(`resp-${p.id}`, simLabWait(2000, 4500), () => {
        const cur = room.neg.pacts[p.id];
        if (!cur || cur.status !== "pendent") return;
        const r = simLabJudge(W, room.neg, cur);
        patch({ [`neg.pacts.${p.id}.status`]: r.ok ? "ok" : "no" });
        say(u, W.hum[p.from] ? uidOf(p.from) : `ai:${p.from}`, r.ok ? `D'acord, signem! ${r.why}` : `No ho podem acceptar: ${simLc(r.why)} Fes-nos una altra proposta.`, { reply: p.id });
        // Ho expliquen al xat general, perquè tothom sàpiga com van els suports
        if (r.ok && !W.hum[p.from]) say(u, "all", `Hem arribat a un acord amb ${simMpRef(W, p.cand).sig}.`);
      });
    });
    // Respon els missatges privats (dels jugadors, no dels partits de la màquina)
    (room.chat || []).filter((m) => m.to?.startsWith?.("bot-") && !m.pact && !m.reply && !String(m.from).startsWith("ai:")).forEach((m) => {
      const u = m.to, P = W.hum[hidOf(u)].me;
      later(`xat-${m.id}`, simLabWait(1500, 3500), () => {
        const want = simWants(P)[0];
        say(u, m.from, neg.result ? "Bona negociació! Ens veiem al Congrés." : `Parlem-ne! Si vols el nostre suport, inclou «${simLc(want.t)}» en un pacte.`);
      });
    });
    // Es presenta a la investidura només si té pactes signats com a candidat (si no, deixa fer la ronda de consultes)
    if (!neg.vote && !neg.result) {
      const tries = (neg.attempts || []).length;
      const tried = (neg.attempts || []).map((a) => a.cand);
      const cands = botsOf().map((u) => hidOf(u)).filter((h) => seats(h) > 0 && !tried.includes(h))
        .map((h) => ({ h, deals: simMpPacts(neg).filter((p) => p.status === "ok" && p.cand === h).length }))
        .sort((a, b) => b.deals - a.deals || seats(b.h) - seats(a.h));
      // Amb majoria absoluta o amb pactes, s'hi presenta aviat; si no hi ha partits de la màquina, el més gran també ho prova al cap d'una estona
      const big = cands.slice().sort((a, b) => seats(b.h) - seats(a.h))[0];
      const c = cands.find((x) => seats(x.h) >= SIM_MAJ) || cands.find((x) => x.deals) || (!W.rivals.length ? big : null);
      if (c) {
        const soon = seats(c.h) >= SIM_MAJ || c.deals;
        later(`candidat-${c.h}-${tries}`, soon ? simLabWait(6000, 9000) : 30000, () => {
          if (room.neg.vote || room.neg.result || (room.neg.attempts || []).length !== tries) return;
          patch({ "neg.vote": { cand: c.h, measures: [], n: tries + 1, votes: {}, ts: Date.now() } });
          say(uidOf(c.h), "all", `Em presento a la investidura (intent ${tries + 1}). Compto amb el vostre suport!`);
        });
      }
    }
    // Si el candidat és un amic fictici, la sala fa el recompte quan tothom ha votat
    if (neg.vote && uidOf(neg.vote.cand)?.startsWith("bot-")) {
      const out = simMpVoteClose(W, neg);
      if (out) later(`recompte-${neg.vote.ts}`, 800, () => { if (!room.neg.vote) return; const o = simMpVoteClose(W, room.neg); if (!o) return; patch(o.patch); say(uidOf(o.patch["neg.attempts"].slice(-1)[0].cand), "all", o.msg); });
    }
    // Vota la investidura
    if (neg.vote) {
      botsOf().forEach((u) => {
        const hid = hidOf(u);
        if (neg.vote.votes?.[hid]) return;
        later(`vot-${u}-${neg.vote.n}-${neg.vote.cand}`, simLabWait(1200, 3000), () => {
          if (!room.neg.vote || room.neg.vote.votes?.[hid]) return;
          const deal = simMpDeal(room.neg, room.neg.vote.cand, room.neg.vote.measures || [], room.neg.vote.roles || {});
          const v = simMpBound(room.neg, hid, room.neg.vote.cand) || simMpPartyVote(W, hid, deal).v;
          patch({ [`neg.vote.votes.${hid}`]: v });
          emit();
        });
      });
    }
  }
  return api;
})();

// Accepta un pacte un amic fictici? Com un partit de la màquina: amb el pacte, votaria sí (o s'abstindria)?
function simLabJudge(W, neg, p) {
  const tmp = JSON.parse(JSON.stringify(neg));
  tmp.pacts[p.id] = { ...p, status: "ok" };
  const deal = simMpDeal(tmp, p.cand);
  const bot = p.to; // l'amic fictici és qui rep la proposta
  if (bot === p.cand) {
    // L'amic fictici seria el candidat: accepta si cap mesura no és una línia vermella seva
    const C = W.hum[p.cand].me;
    const red = (p.measures || []).map(simMeasure).find((m) => simIsRedLine(C, m));
    return red ? { ok: false, why: `«${simLc(red.t)}» és una línia vermella per a nosaltres.` } : { ok: true, why: "Serà un bon govern." };
  }
  const r = simMpPartyVote(W, bot, deal);
  const ok = SIM_MP_PACT[p.kind].vote === "abs" ? r.v !== "no" : r.v === "si";
  const yes = { coal: "Entrem al govern: hi veiem les nostres prioritats.", inv: "Votarem sí a la investidura.", abs: "Ens abstindrem a la investidura." }[p.kind];
  return { ok, why: ok ? yes : r.why };
}

// El dia de campanya d'un amic fictici: mítings on es juga escons, xarxes, alguna estirada amb un rival i descans
function simLabBotDay(W, hid) {
  const V = simMpView(W, hid);
  const poll = [...V.polls].reverse().find((p) => p.provs);
  const mine = SIM_PROVS.filter((p) => simStands(V.me, p));
  const bestProv = () => {
    if (poll) {
      const c = poll.provs.map((x, i) => ({ x, i })).filter((o) => o.x.need !== null && o.x.need > 0).sort((a, b) => a.x.need - b.x.need).slice(0, 5);
      if (c.length) return c[Math.floor(Math.random() * c.length)].i;
    }
    const big = [...mine].sort((a, b) => b.seats - a.seats).slice(0, 8);
    return big[Math.floor(Math.random() * big.length)].i;
  };
  const humans = V.rivals.filter((r) => V.hum?.[r.id]);
  for (let k = 0; k < 8 && V.slot < 3; k++) {
    let type, arg = null;
    const r = Math.random();
    if (V.energy < 25) type = "descans";
    else if (r < 0.5) { type = "miting"; arg = bestProv(); }
    else if (r < 0.65 && (V.used.xarxes || 0) < 4) type = "xarxes";
    else if (r < 0.8) {
      type = "atac";
      const pool = humans.length && Math.random() < 0.6 ? humans : [...V.rivals].sort((a, b) => simDistP(a, V.me) - simDistP(b, V.me)).slice(0, 3);
      arg = pool[Math.floor(Math.random() * pool.length)].id;
    } else if (r < 0.9) { type = "porta"; arg = bestProv(); }
    else { type = "anuncis"; arg = ""; }
    if (!simAct(V, type, arg).ok) simAct(V, "descans");
  }
  return simMpUnview(V, hid);
}
