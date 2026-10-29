// Simulador del 29N · Campanya contra amics: la legislatura. Després de la investidura, els jugadors governen o fan
// oposició durant SIM_LGM_SES períodes de sessions: projectes de llei del Govern, proposicions de llei de l'oposició,
// pressupostos, moció de censura constructiva, qüestió de confiança i dissolució de les Corts.
// Tot viu al camp «leg» de la sala (en línia o la del laboratori) i s'escriu amb camps amb punts (api.neg).
// leg: { ses, ts (inici del període), pres, gov: [hid], sup: [hid], items: { id: iniciativa }, ready: { hid: ses },
//        hist: { s1: { pres, gov } }, end: { reason: "fi" | "conf" | "dis", ts } }
// Iniciativa: { id, kind, by, m (mesura, per a les lleis), org, ses, votes: { hid: "si" | "no" | "abs" }, prom: { hid: "si" },
//               status: "vot" | "ok" | "ko", res: { si, no, abs } }

const SIM_LGM_SES = 6; // períodes de sessions (uns vuit mesos cadascun)
const SIM_LGM_FORCE = 3 * 60 * 1000; // al cap de 3 minuts es pot tancar el període (o la votació) sense qui falta
const SIM_LGM_ORG_TH = [3, 4, 6, 7]; // temes que es regulen per llei orgànica (art. 81 CE): cal majoria absoluta
const SIM_LGM_KIND = {
  pl: { label: "Projecte de llei", icon: "📜" },
  ppl: { label: "Proposició de llei", icon: "📝" },
  pge: { label: "Pressupostos Generals de l'Estat", icon: "💶" },
  cens: { label: "Moció de censura", icon: "⚔️" },
  conf: { label: "Qüestió de confiança", icon: "🤝" },
};
const SIM_LGM_VOTE = { si: "Sí", no: "No", abs: "Abstenció" };

// ---------- Motor ----------
// La legislatura que comença amb la investidura que ha sortit (neg.result)
function simLgmInit(result, now = Date.now()) {
  const roles = Object.entries(result.deal?.roles || {}).filter(([id]) => id !== result.cand);
  return {
    ses: 1, ts: now, pres: result.cand,
    gov: [result.cand, ...roles.filter(([, r]) => r === "coal").map(([id]) => id)],
    sup: roles.filter(([, r]) => r !== "coal").map(([id]) => id),
    items: {}, ready: {}, hist: {}, end: null,
  };
}
const simLgmSeatCache = new WeakMap();
function simLgmSeats(W) {
  if (!simLgmSeatCache.has(W)) {
    const V0 = simMpCongress(W), h0 = W.mp.ids[0];
    simLgmSeatCache.set(W, Object.fromEntries(W.mp.ids.map((h) => [h, V0.res.seats[h === h0 ? "jo" : h] || 0])));
  }
  return simLgmSeatCache.get(W);
}
const simLgmVoters = (W) => W.mp.ids.filter((h) => simLgmSeats(W)[h] > 0);
const simLgmInGov = (leg, h) => leg.gov.includes(h);
const simLgmItems = (leg) => Object.values(leg.items || {}).sort((a, b) => a.ts - b.ts);
const simLgmOpen = (leg) => simLgmItems(leg).filter((i) => i.status === "vot");
const simLgmMotion = (leg) => simLgmOpen(leg).some((i) => i.kind === "cens" || i.kind === "conf");
// Mesures que encara es poden portar al Congrés (ni aprovades ni en votació)
const simLgmFree = (leg) => SIM_MEASURES.filter((m) => !simLgmItems(leg).some((i) => i.m === m.id && i.status !== "ko"));

// Què pot presentar un jugador en aquest període de sessions
function simLgmCan(W, leg, h) {
  const seats = simLgmSeats(W)[h] || 0, items = simLgmItems(leg);
  const inGov = simLgmInGov(leg, h), pres = leg.pres === h, motion = simLgmMotion(leg);
  const lawDone = items.some((i) => i.by === h && i.ses === leg.ses && (i.kind === "pl" || i.kind === "ppl"));
  return {
    law: !leg.end && seats > 0 && !lawDone ? (inGov ? "pl" : "ppl") : null,
    // Un pressupost cada any (els períodes senars)
    pge: !leg.end && pres && leg.ses % 2 === 1 && !items.some((i) => i.kind === "pge" && i.ses === leg.ses),
    // Una moció de censura per grup i legislatura; no se'n pot presentar cap mentre n'hi ha una altra en tràmit
    cens: !leg.end && !inGov && seats > 0 && !motion && !items.some((i) => i.kind === "cens" && i.by === h),
    conf: !leg.end && pres && !motion && !items.some((i) => i.kind === "conf" && i.by === h),
    // El president no pot dissoldre les Corts mentre es tramita una moció de censura (art. 115 CE)
    dis: !leg.end && pres && !motion,
  };
}
function simLgmItem(leg, h, kind, m = null, now = Date.now()) {
  const M = m ? simMeasure(m) : null;
  return { id: `i${now.toString(36)}${h}`, kind, by: h, m, org: !!M && SIM_LGM_ORG_TH.includes(M.th), ses: leg.ses, votes: { [h]: "si" }, status: "vot", ts: now };
}
const simLgmLeader = (P) => P.leader || P.name;
function simLgmTitle(W, it) {
  if (it.kind === "pge") return `Pressupostos Generals de l'Estat (any ${(it.ses + 1) >> 1})`;
  if (it.kind === "cens") return `Moció de censura amb ${simLgmLeader(simMpRef(W, it.by))} (${simMpRef(W, it.by).sig}) com a candidat alternatiu`;
  if (it.kind === "conf") return "Qüestió de confiança del president del Govern";
  const label = it.org ? (it.kind === "pl" ? "Projecte de llei orgànica" : "Proposició de llei orgànica") : SIM_LGM_KIND[it.kind].label;
  return `${label}: ${simLc(simMeasure(it.m).t)}`;
}
const simLgmNeed = (it) => (it.kind === "cens" || it.org ? "Cal majoria absoluta: 176 sís." : it.kind === "conf" ? "N'hi ha prou amb més sís que nos." : "Majoria simple: més sís que nos.");

// Com votaria un partit (els amics ficticis; als jugadors, com a orientació). Té en compte la posició del partit, si és
// al Govern o li dona suport, les línies vermelles i el que ha promès a la negociació (prom).
function simLgmLean(W, leg, h, it) {
  if (it.by === h) return "si";
  if (it.prom?.[h]) return it.prom[h];
  const P = W.hum[h].me, pres = W.hum[leg.pres].me, inGov = simLgmInGov(leg, h), ally = leg.sup.includes(h);
  if (it.kind === "cens") {
    if (inGov) return "no";
    const gain = simDistP(P, pres) - simDistP(P, W.hum[it.by].me);
    return gain > 0.8 && !ally ? "si" : gain > -0.5 ? "abs" : "no";
  }
  if (it.kind === "conf") {
    if (inGov || ally) return "si";
    const d = simDistP(P, pres);
    return d < 2.5 ? "si" : d < 4.5 ? "abs" : "no";
  }
  if (it.kind === "pge") {
    if (inGov) return "si";
    const s = (ally ? 0.45 : 0) + 0.9 - simDistP(P, pres) / 3.5;
    return s >= 0.3 ? "si" : s <= -0.2 ? "no" : "abs";
  }
  const M = simMeasure(it.m);
  if (simIsRedLine(P, M)) return "no";
  const o = simMeasureView(P, M) * Math.min(1, (P.iss[M.th] ?? 0.5) + 0.3);
  const byGov = simLgmInGov(leg, it.by);
  const s = o + (inGov && byGov ? 0.5 : 0) + (ally && byGov ? 0.25 : 0) + (!inGov && !ally && byGov ? -0.15 : 0) + (inGov && !byGov ? -0.15 : 0);
  return s >= 0.35 ? "si" : s <= -0.2 ? "no" : "abs";
}
const simLgmWaiting = (W, it) => simLgmVoters(W).filter((h) => !it.votes?.[h]);
function simLgmTally(W, it) {
  const seats = simLgmSeats(W);
  let si = 0, no = 0, abs = 0;
  simLgmVoters(W).forEach((h) => {
    const v = it.votes?.[h] || "abs", n = seats[h];
    if (v === "si") si += n; else if (v === "no") no += n; else abs += n;
  });
  const pass = it.kind === "cens" || it.org ? si >= SIM_MAJ : si > no;
  return { si, no, abs, pass };
}
// Final de la legislatura (per esgotament, qüestió de confiança perduda o dissolució)
const simLgmEndPatch = (leg, reason, now, by = null) => ({ [`leg.hist.s${leg.ses}`]: { pres: leg.pres, gov: leg.gov }, "leg.end": { reason, by, ts: now } });
// Tanca una votació quan ja han votat tots els jugadors amb escons (o, amb force, comptant com a abstenció qui falta).
// Torna null o { patch, msg }
function simLgmClose(W, leg, id, force = false, now = Date.now()) {
  const it = leg.items?.[id];
  if (!it || it.status !== "vot") return null;
  // Dos grups poden registrar la mateixa mesura alhora: si ja n'hi ha una d'aprovada, aquesta es retira
  const twin = it.m && simLgmItems(leg).find((x) => x.id !== id && x.m === it.m && x.status === "ok");
  if (twin) return { patch: { [`leg.items.${id}.status`]: "ko", [`leg.items.${id}.res`]: { si: 0, no: 0, abs: 0 }, [`leg.items.${id}.dup`]: true }, msg: `Retirada: ${simLc(simLgmTitle(W, it))}. Ja s'ha aprovat una llei amb el mateix contingut.` };
  if (!force && simLgmWaiting(W, it).length) return null;
  const t = simLgmTally(W, it);
  const patch = { [`leg.items.${id}.status`]: t.pass ? "ok" : "ko", [`leg.items.${id}.res`]: { si: t.si, no: t.no, abs: t.abs } };
  const by = simMpRef(W, it.by), nums = `sí ${t.si}, no ${t.no}, abstenció ${t.abs}`;
  let msg;
  if (it.kind === "cens") {
    msg = t.pass ? `Moció de censura aprovada (${nums}). ${simLgmLeader(by)} (${by.sig}) és el nou president del Govern.` : `La moció de censura de ${by.sig} no prospera (${nums}).`;
    if (t.pass) Object.assign(patch, { "leg.pres": it.by, "leg.gov": [it.by], "leg.sup": simLgmVoters(W).filter((h) => h !== it.by && it.votes?.[h] === "si") });
  } else if (it.kind === "conf") {
    msg = t.pass ? `El president supera la qüestió de confiança (${nums}).` : `El president perd la qüestió de confiança (${nums}). El Govern cau: eleccions anticipades.`;
    if (!t.pass) Object.assign(patch, simLgmEndPatch(leg, "conf", now));
  } else {
    msg = `${t.pass ? "Aprovada" : "Rebutjada"}: ${simLc(simLgmTitle(W, it))} (${nums}).${it.org && !t.pass && t.si > t.no ? " No arriba als 176 sís que demana una llei orgànica." : ""}`;
  }
  return { patch, msg };
}
// Passa al període de sessions següent quan tothom ha acabat i no hi ha cap votació oberta (o, amb force, sense esperar
// qui falta). L'últim període tanca la legislatura.
function simLgmAdvance(W, leg, force = false, now = Date.now()) {
  if (!leg || leg.end || simLgmOpen(leg).length) return null;
  if (!force && W.mp.ids.some((h) => leg.ready?.[h] !== leg.ses)) return null;
  if (leg.ses >= SIM_LGM_SES) return simLgmEndPatch(leg, "fi", now);
  return { [`leg.hist.s${leg.ses}`]: { pres: leg.pres, gov: leg.gov }, "leg.ses": leg.ses + 1, "leg.ts": now };
}

// Balanç de la legislatura per a cada jugador: { hid: { pts, parts: [{ label, pts, n }] } }
function simLgmScore(W, leg) {
  const out = Object.fromEntries(W.mp.ids.map((h) => [h, { pts: 0, parts: [] }]));
  const add = (h, label, pts) => {
    const o = out[h];
    if (!o || !pts) return;
    o.pts += pts;
    const p = o.parts.find((x) => x.label === label);
    if (p) { p.pts += pts; p.n++; } else o.parts.push({ label, pts, n: 1 });
  };
  Object.values(leg.hist || {}).forEach((s) => s.gov.forEach((h) => add(h, h === s.pres ? "Períodes presidint el Govern" : "Períodes al Govern de coalició", h === s.pres ? 10 : 5)));
  simLgmItems(leg).forEach((it) => {
    if (it.status === "vot" || it.dup) return;
    const ok = it.status === "ok";
    if (it.kind === "pl" || it.kind === "ppl") {
      if (ok) add(it.by, "Lleis pròpies aprovades", it.org ? 18 : 12);
      if (ok) {
        const M = simMeasure(it.m);
        W.mp.ids.forEach((h) => {
          const P = W.hum[h].me;
          if (simIsRedLine(P, M)) add(h, "Lleis aprovades contra les vostres línies vermelles", -6);
          else if (simWants(P).some((x) => x.id === M.id)) add(h, "Promeses del programa complertes", 8);
        });
      }
    } else if (it.kind === "pge") add(it.by, ok ? "Pressupostos aprovats" : "Pressupostos rebutjats", ok ? 20 : -10);
    // Fer oposició també puntua: cada iniciativa del Govern que tomben els grups que hi han votat en contra
    if (!ok && (it.kind === "pl" || it.kind === "pge")) W.mp.ids.forEach((h) => { if (it.votes?.[h] === "no" && h !== it.by) add(h, "Iniciatives del Govern tombades", 6); });
    else if (it.kind === "cens") add(it.by, ok ? "Moció de censura guanyada" : "Moció de censura perduda", ok ? 25 : -6);
    else if (it.kind === "conf") add(it.by, ok ? "Qüestió de confiança superada" : "Qüestió de confiança perduda", ok ? 8 : -15);
  });
  if (leg.end?.reason === "fi") add(leg.pres, "Esgotar la legislatura com a president", 15);
  return out;
}

// ---------- Pantalla ----------
function simMpLeg(G) {
  const s = G.state, d = G.mpDoc, leg = d?.leg;
  G.ctx.hud([]);
  if (!leg) { simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card"><p class="sim-lead">Comença la legislatura…</p></div></div>`); return; }
  if (leg.end) return simMpLegOver(G);
  const W = G.mp.W, me = G.mp.hid, seats = simLgmSeats(W);
  const P = (h) => W.hum[h].me;
  const can = simLgmCan(W, leg, me);
  const role = leg.pres === me ? "Presideixes el Govern" : simLgmInGov(leg, me) ? "Ets al Govern de coalició" : leg.sup.includes(me) ? "Dones suport al Govern des del Congrés" : "Ets a l'oposició";
  const govSeats = leg.gov.reduce((t, h) => t + seats[h], 0);
  const open = simLgmOpen(leg), done = simLgmItems(leg).filter((i) => i.status !== "vot").reverse();
  const score = simLgmScore(W, leg);
  const ready = leg.ready?.[me] === leg.ses;
  const notReady = W.mp.ids.filter((h) => leg.ready?.[h] !== leg.ses);
  const late = Date.now() - leg.ts > SIM_LGM_FORCE;
  const free = simLgmFree(leg);
  const sel = G.lgmM && free.some((m) => m.id === G.lgmM) ? G.lgmM : null;
  const kindOf = (m) => (SIM_LGM_ORG_TH.includes(simMeasure(m).th) ? " (orgànica)" : "");
  const viewOf = (m) => { const M = simMeasure(m); return simIsRedLine(P(me), M) ? "✗ " : simMeasureView(P(me), M) >= 0.5 ? "★ " : ""; };
  // Previsió: com votarien ara els altres (els jugadors poden canviar d'opinió)
  const prev = (it) => { const t = simLgmTally(W, { ...it, votes: Object.fromEntries(simLgmVoters(W).map((h) => [h, simLgmLean(W, leg, h, it)])) }); return `Previsió: sí ${t.si} · no ${t.no} · abstenció ${t.abs} — ${t.pass ? "sortiria" : "no sortiria"}`; };
  const draft = sel && can.law ? simLgmItem(leg, me, can.law, sel) : null;
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card simlgm">
    <p class="sim-kick">Legislatura · període de sessions ${leg.ses} de ${SIM_LGM_SES}</p>
    <h3 class="sim-h">${esc(role)}</h3>
    <p class="sim-lead">President: <b>${esc(simLgmLeader(P(leg.pres)))} (${esc(P(leg.pres).sig)})</b>. El Govern ${leg.gov.length > 1 ? `de coalició (${leg.gov.map((h) => esc(P(h).sig)).join(" + ")})` : "en solitari"} té ${govSeats} escons${govSeats >= SIM_MAJ ? ", majoria absoluta" : `: li'n falten ${SIM_MAJ - govSeats} per a la majoria absoluta`}.</p>
    <ul class="simlgm-score">${W.mp.ids.slice().sort((a, b) => score[b].pts - score[a].pts || a.localeCompare(b)).map((h) => `<li class="${h === me ? "me" : ""}" style="--pc:${P(h).color}"><i></i><b>${esc(P(h).sig)}</b><small>${seats[h]} escons · ${leg.pres === h ? "president" : simLgmInGov(leg, h) ? "govern" : leg.sup.includes(h) ? "suport" : "oposició"}</small><strong>${score[h].pts}</strong></li>`).join("")}</ul>
    <h4 class="sim-h4">En votació</h4>
    ${open.length ? `<div class="simlgm-items">${open.map((it) => simLgmItemHtml(G, it)).join("")}</div>` : `<p class="simmp-note">Ara mateix no hi ha cap iniciativa en votació.</p>`}
    <h4 class="sim-h4">Les teves iniciatives</h4>
    <div class="simlgm-new">
      ${can.law ? `<label class="simlgm-lab">${SIM_LGM_KIND[can.law].icon} ${can.law === "pl" ? "Projecte de llei del Govern" : "Proposició de llei de l'oposició"}
        <select data-lgm-m><option value="">Tria una mesura…</option>${free.map((m) => `<option value="${m.id}" ${m.id === sel ? "selected" : ""}>${viewOf(m.id)}${esc(m.t)}${kindOf(m.id)}</option>`).join("")}</select></label>
        <p class="simmp-note">★ la defenseu · ✗ és una línia vermella vostra. Les lleis orgàniques (estatuts, immigració, educació i sanitat, seguretat) necessiten 176 sís.</p>
        ${draft ? `<p class="simlgm-prev">${prev(draft)}</p>` : ""}
        <button type="button" class="btn primary" data-lgm-law ${sel ? "" : "disabled"}>Registra-la al Congrés</button>`
        : `<p class="simmp-note">${seats[me] ? "Ja has registrat la teva llei d'aquest període de sessions." : "Sense escons no pots registrar iniciatives, però pots negociar al xat."}</p>`}
      <div class="simlgm-acts">
        ${can.pge ? `<button type="button" class="btn" data-lgm-pge>💶 Presenta els pressupostos</button>` : ""}
        ${can.cens ? `<button type="button" class="btn" data-lgm-cens>⚔️ Moció de censura</button>` : ""}
        ${can.conf ? `<button type="button" class="btn" data-lgm-conf>🤝 Qüestió de confiança</button>` : ""}
        ${can.dis ? `<button type="button" class="btn ghost" data-lgm-dis>Dissol les Corts</button>` : ""}
      </div>
    </div>
    <div class="simlgm-ready">
      ${ready ? `<p class="simmp-note">Has acabat aquest període. ${notReady.length ? `Esperant: ${notReady.map((h) => esc(P(h).sig)).join(", ")}.` : open.length ? "Falten votacions per tancar." : ""}</p>`
        : `<button type="button" class="btn primary lg" data-lgm-ready>${leg.ses >= SIM_LGM_SES ? "Acaba la legislatura" : "He acabat aquest període de sessions"}</button>`}
      ${ready && late && (notReady.length || open.length) ? `<button type="button" class="btn sm" data-lgm-force>Tanca sense esperar qui falta</button>` : ""}
    </div>
    ${done.length ? `<h4 class="sim-h4">Votacions de la legislatura</h4><div class="simlgm-items done">${done.map((it) => simLgmItemHtml(G, it)).join("")}</div>` : ""}
  </div></div>`);

  $("[data-lgm-m]", el)?.addEventListener("change", (e) => { G.lgmM = e.target.value || null; simMpLeg(G); });
  const put = async (it, say) => {
    await simMpApi().neg(G.mp.code, { [`leg.items.${it.id}`]: it });
    await simChatSend(G, "all", say);
  };
  $("[data-lgm-law]", el)?.addEventListener("click", () => {
    if (!sel) return;
    const it = simLgmItem(leg, me, can.law, sel);
    G.lgmM = null;
    put(it, `Registrem ${simLc(simLgmTitle(W, it))}. Demanem el vostre suport.`);
  });
  $("[data-lgm-pge]", el)?.addEventListener("click", () => put(simLgmItem(leg, me, "pge"), "El Govern presenta els Pressupostos Generals d'aquest any. Sense pressupostos no es pot governar: parlem-ne."));
  $("[data-lgm-cens]", el)?.addEventListener("click", () => {
    if (!confirm(`Presentaràs una moció de censura amb tu com a candidat alternatiu. Cal 176 sís; si no prospera, ja no en podràs presentar cap altra en aquesta legislatura. Endavant?`)) return;
    put(simLgmItem(leg, me, "cens"), `Presentem una moció de censura contra el Govern de ${P(leg.pres).sig}. Necessitem 176 escons: qui s'hi suma?`);
  });
  $("[data-lgm-conf]", el)?.addEventListener("click", () => {
    if (!confirm("Sotmetràs el Govern a una qüestió de confiança. Si la perds, el Govern cau i hi ha eleccions anticipades. Endavant?")) return;
    put(simLgmItem(leg, me, "conf"), "Plantejo una qüestió de confiança: vull saber si aquest Govern té el suport del Congrés.");
  });
  $("[data-lgm-dis]", el)?.addEventListener("click", async () => {
    if (!confirm("Dissoldràs les Corts i convocaràs eleccions anticipades. S'acaba la legislatura per a tothom. Endavant?")) return;
    await simMpApi().neg(G.mp.code, simLgmEndPatch(leg, "dis", Date.now(), me));
    await simChatSend(G, "all", "He dissolt les Corts: convoco eleccions anticipades.");
  });
  $("[data-lgm-ready]", el)?.addEventListener("click", () => simMpApi().neg(G.mp.code, { [`leg.ready.${me}`]: leg.ses }));
  $("[data-lgm-force]", el)?.addEventListener("click", async () => {
    for (const it of simLgmOpen(leg)) { const out = simLgmClose(W, leg, it.id, true); if (out) await simMpApi().neg(G.mp.code, out.patch); }
    const adv = simLgmAdvance(W, { ...leg, items: {} }, true);
    if (adv) await simMpApi().neg(G.mp.code, adv);
  });
  $$("[data-lgm-v]", el).forEach((b) => b.addEventListener("click", () => {
    const [id, v] = b.dataset.lgmV.split(":");
    simMpApi().neg(G.mp.code, { [`leg.items.${id}.votes.${me}`]: v });
    Sfx.play("pick");
  }));
  $$("[data-lgm-ask]", el).forEach((b) => b.addEventListener("click", async () => {
    const it = leg.items[b.dataset.lgmAsk];
    const to = simMpUidOf(G, b.dataset.to);
    await simChatSend(G, to, `Ens doneu suport a «${simLgmTitle(W, it)}»? Us ho tindrem en compte.`, { ask: it.id });
    toast("Petició enviada pel xat privat");
  }));
  simMpLegDrive(G);
}
// Una iniciativa: qui la porta, què cal per aprovar-la, qui ha votat i (si et toca) els botons
function simLgmItemHtml(G, it) {
  const W = G.mp.W, me = G.mp.hid, leg = G.mpDoc.leg, seats = simLgmSeats(W);
  const by = simMpRef(W, it.by), K = SIM_LGM_KIND[it.kind];
  const voting = it.status === "vot";
  const rows = simLgmVoters(W).map((h) => {
    const v = it.votes?.[h];
    const shown = voting ? (h === me && v ? SIM_LGM_VOTE[v] : v ? "Ja ha votat" : "Pensant-s'hi…") : SIM_LGM_VOTE[v || "abs"];
    const ask = voting && it.by === me && h !== me && !v ? `<button type="button" class="btn sm" data-lgm-ask="${it.id}" data-to="${h}">Demana-li el vot</button>` : "";
    return `<li class="${h === me ? "me" : ""} ${voting ? "" : `v-${v || "abs"}`}" style="--pc:${W.hum[h].me.color}"><i></i><b>${esc(W.hum[h].me.sig)}</b><small>${seats[h]} · ${shown}</small>${ask}</li>`;
  }).join("");
  const mine = voting && !it.votes?.[me] && seats[me] > 0;
  return `<div class="simlgm-item k-${it.kind} ${voting ? "" : it.status}">
    <p class="simlgm-k">${K.icon} ${esc(K.label)} · ${esc(by.sig)} · període ${it.ses}</p>
    <h5>${esc(simLgmTitle(W, it))}</h5>
    <p class="simmp-note">${simLgmNeed(it)}${voting && it.by === me ? " Pots demanar el vot a cada grup: ho rebrà pel xat privat." : ""}</p>
    <ul class="simlgm-votes">${rows}</ul>
    ${it.dup ? `<p class="simlgm-res">↩️ Retirada: ja se n'havia aprovat una d'igual</p>` : it.res ? `<p class="simlgm-res">${it.status === "ok" ? "✅ Aprovada" : "❌ Rebutjada"} · sí ${it.res.si} · no ${it.res.no} · abstenció ${it.res.abs}</p>` : ""}
    ${mine ? `<div class="simpact-btns"><button type="button" class="btn primary" data-lgm-v="${it.id}:si">Sí</button><button type="button" class="btn" data-lgm-v="${it.id}:abs">Abstenció</button><button type="button" class="btn" data-lgm-v="${it.id}:no">No</button></div>` : ""}
  </div>`;
}
// Tanca les votacions acabades i passa de període. Ho pot fer qualsevol client (el resultat és el mateix per a tothom);
// el missatge al xat el publica qui ha portat la iniciativa (o, si és un amic fictici, el primer jugador de debò).
async function simMpLegDrive(G) {
  const leg = G.mpDoc?.leg, W = G.mp.W, api = simMpApi(), code = G.mp.code;
  if (!leg || leg.end) return;
  G.lgmClosing = G.lgmClosing || {};
  const real = G.mpDoc.players.find((u) => !u.startsWith("bot-"));
  for (const it of simLgmOpen(leg)) {
    if (G.lgmClosing[it.id]) continue;
    const out = simLgmClose(W, leg, it.id);
    if (!out) continue;
    G.lgmClosing[it.id] = 1;
    await api.neg(code, out.patch);
    const by = simMpUidOf(G, it.by);
    if (by === simMpUid() || (by.startsWith("bot-") && real === simMpUid())) await api.chat(code, { id: `m${Date.now().toString(36)}${it.id}`, from: "sys", to: "all", t: out.msg, ts: Date.now() });
  }
  const adv = simLgmAdvance(W, leg);
  if (adv && G.lgmAdv !== leg.ses) { G.lgmAdv = leg.ses; await api.neg(code, adv); }
}
// S'ha acabat la legislatura: el balanç i la pantalla final
function simMpLegOver(G) {
  const s = G.state, leg = G.mpDoc.leg;
  const sc = simLgmScore(G.mp.W, leg)[G.mp.hid];
  s.legMp = { pts: sc.pts > 0 ? sc.pts * 3 : sc.pts, raw: sc.pts, reason: leg.end.reason };
  simSave(G);
  Sfx.play(sc.pts > 0 ? "win" : "ko");
  simFinishGame(G);
}
const SIM_LGM_END = {
  fi: "La legislatura s'ha esgotat: quatre anys complets.",
  conf: "El president ha perdut la qüestió de confiança: eleccions anticipades.",
  dis: "El president ha dissolt les Corts: eleccions anticipades.",
};
// Resum de la legislatura per a la pantalla final: classificació i lleis aprovades
function simMpLegHtml(G) {
  const leg = G.mpDoc?.leg, W = G.mp.W, me = G.mp.hid;
  if (!leg?.end) return "";
  const sc = simLgmScore(W, leg);
  const rows = W.mp.ids.slice().sort((a, b) => sc[b].pts - sc[a].pts);
  const laws = simLgmItems(leg).filter((i) => i.status === "ok" && i.m);
  return `<div class="simlgm-final">
    <h4>Balanç de la legislatura</h4>
    <p class="simmp-note">${SIM_LGM_END[leg.end.reason]} ${leg.ses} ${leg.ses === 1 ? "període" : "períodes"} de sessions, ${laws.length} ${laws.length === 1 ? "llei aprovada" : "lleis aprovades"}.</p>
    <ol>${rows.map((h, i) => `<li class="${h === me ? "me" : ""}"><b class="simmp-pos">${i + 1}</b>${simLogoSvg(W.hum[h].me, 30)}<span><b>${esc(W.hum[h].me.name)}</b><small>${sc[h].parts.map((p) => `${esc(p.label)}${p.n > 1 ? ` ×${p.n}` : ""}: ${p.pts > 0 ? "+" : ""}${p.pts}`).join(" · ") || "Sense iniciatives"}</small></span><strong>${sc[h].pts}</strong></li>`).join("")}</ol>
    ${laws.length ? `<details><summary>Lleis aprovades</summary><ul>${laws.map((i) => `<li>${esc(simLgmTitle(W, i))} (${esc(simMpRef(W, i.by).sig)})</li>`).join("")}</ul></details>` : ""}
  </div>`;
}
