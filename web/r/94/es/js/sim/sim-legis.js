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
  pl: { label: "Proyecto de ley", icon: "📜" },
  ppl: { label: "Proposición de ley", icon: "📝" },
  pge: { label: "Presupuestos Generales del Estado", icon: "💶" },
  cens: { label: "Moción de censura", icon: "⚔️" },
  conf: { label: "Cuestión de confianza", icon: "🤝" },
};
const SIM_LGM_VOTE = { si: "Sí", no: "No", abs: "Abstención" };

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
  if (it.kind === "pge") return `Presupuestos Generales del Estado (año ${(it.ses + 1) >> 1})`;
  if (it.kind === "cens") return `Moción de censura con ${simLgmLeader(simMpRef(W, it.by))} (${simMpRef(W, it.by).sig}) como candidato alternativo`;
  if (it.kind === "conf") return "Cuestión de confianza del presidente del Gobierno";
  const label = it.org ? (it.kind === "pl" ? "Proyecto de ley orgánica" : "Proposición de ley orgánica") : SIM_LGM_KIND[it.kind].label;
  return `${label}: ${simLc(simMeasure(it.m).t)}`;
}
const simLgmNeed = (it) => (it.kind === "cens" || it.org ? "Hace falta mayoría absoluta: 176 síes." : it.kind === "conf" ? "Basta con más síes que noes." : "Mayoría simple: más síes que noes.");

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
  if (twin) return { patch: { [`leg.items.${id}.status`]: "ko", [`leg.items.${id}.res`]: { si: 0, no: 0, abs: 0 }, [`leg.items.${id}.dup`]: true }, msg: `Retirada: ${simLc(simLgmTitle(W, it))}. Ya se ha aprobado una ley con el mismo contenido.` };
  if (!force && simLgmWaiting(W, it).length) return null;
  const t = simLgmTally(W, it);
  const patch = { [`leg.items.${id}.status`]: t.pass ? "ok" : "ko", [`leg.items.${id}.res`]: { si: t.si, no: t.no, abs: t.abs } };
  const by = simMpRef(W, it.by), nums = `sí ${t.si}, no ${t.no}, abstención ${t.abs}`;
  let msg;
  if (it.kind === "cens") {
    msg = t.pass ? `Moción de censura aprobada (${nums}). ${simLgmLeader(by)} (${by.sig}) es el nuevo presidente del Gobierno.` : `La moción de censura de ${by.sig} no prospera (${nums}).`;
    if (t.pass) Object.assign(patch, { "leg.pres": it.by, "leg.gov": [it.by], "leg.sup": simLgmVoters(W).filter((h) => h !== it.by && it.votes?.[h] === "si") });
  } else if (it.kind === "conf") {
    msg = t.pass ? `El presidente supera la cuestión de confianza (${nums}).` : `El presidente pierde la cuestión de confianza (${nums}). El Gobierno cae: elecciones anticipadas.`;
    if (!t.pass) Object.assign(patch, simLgmEndPatch(leg, "conf", now));
  } else {
    msg = `${t.pass ? "Aprobada" : "Rechazada"}: ${simLc(simLgmTitle(W, it))} (${nums}).${it.org && !t.pass && t.si > t.no ? " No llega a los 176 síes que exige una ley orgánica." : ""}`;
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
  Object.values(leg.hist || {}).forEach((s) => s.gov.forEach((h) => add(h, h === s.pres ? "Periodos presidiendo el Gobierno" : "Periodos en el Gobierno de coalición", h === s.pres ? 10 : 5)));
  simLgmItems(leg).forEach((it) => {
    if (it.status === "vot" || it.dup) return;
    const ok = it.status === "ok";
    if (it.kind === "pl" || it.kind === "ppl") {
      if (ok) add(it.by, "Leyes propias aprobadas", it.org ? 18 : 12);
      if (ok) {
        const M = simMeasure(it.m);
        W.mp.ids.forEach((h) => {
          const P = W.hum[h].me;
          if (simIsRedLine(P, M)) add(h, "Leyes aprobadas contra vuestras líneas rojas", -6);
          else if (simWants(P).some((x) => x.id === M.id)) add(h, "Promesas del programa cumplidas", 8);
        });
      }
    } else if (it.kind === "pge") add(it.by, ok ? "Presupuestos aprobados" : "Presupuestos rechazados", ok ? 20 : -10);
    // Fer oposició també puntua: cada iniciativa del Govern que tomben els grups que hi han votat en contra
    if (!ok && (it.kind === "pl" || it.kind === "pge")) W.mp.ids.forEach((h) => { if (it.votes?.[h] === "no" && h !== it.by) add(h, "Iniciativas del Gobierno tumbadas", 6); });
    else if (it.kind === "cens") add(it.by, ok ? "Moción de censura ganada" : "Moción de censura perdida", ok ? 25 : -6);
    else if (it.kind === "conf") add(it.by, ok ? "Cuestión de confianza superada" : "Cuestión de confianza perdida", ok ? 8 : -15);
  });
  if (leg.end?.reason === "fi") add(leg.pres, "Agotar la legislatura como presidente", 15);
  return out;
}

// ---------- Pantalla ----------
function simMpLeg(G) {
  const s = G.state, d = G.mpDoc, leg = d?.leg;
  G.ctx.hud([]);
  if (!leg) { simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card"><p class="sim-lead">Empieza la legislatura…</p></div></div>`); return; }
  if (leg.end) return simMpLegOver(G);
  const W = G.mp.W, me = G.mp.hid, seats = simLgmSeats(W);
  const P = (h) => W.hum[h].me;
  const can = simLgmCan(W, leg, me);
  const role = leg.pres === me ? "Presides el Gobierno" : simLgmInGov(leg, me) ? "Estás en el Gobierno de coalición" : leg.sup.includes(me) ? "Apoyas al Gobierno desde el Congreso" : "Estás en la oposición";
  const govSeats = leg.gov.reduce((t, h) => t + seats[h], 0);
  const open = simLgmOpen(leg), done = simLgmItems(leg).filter((i) => i.status !== "vot").reverse();
  const score = simLgmScore(W, leg);
  const ready = leg.ready?.[me] === leg.ses;
  const notReady = W.mp.ids.filter((h) => leg.ready?.[h] !== leg.ses);
  const late = Date.now() - leg.ts > SIM_LGM_FORCE;
  const free = simLgmFree(leg);
  const sel = G.lgmM && free.some((m) => m.id === G.lgmM) ? G.lgmM : null;
  const kindOf = (m) => (SIM_LGM_ORG_TH.includes(simMeasure(m).th) ? " (orgánica)" : "");
  const viewOf = (m) => { const M = simMeasure(m); return simIsRedLine(P(me), M) ? "✗ " : simMeasureView(P(me), M) >= 0.5 ? "★ " : ""; };
  // Previsió: com votarien ara els altres (els jugadors poden canviar d'opinió)
  const prev = (it) => { const t = simLgmTally(W, { ...it, votes: Object.fromEntries(simLgmVoters(W).map((h) => [h, simLgmLean(W, leg, h, it)])) }); return `Previsión: sí ${t.si} · no ${t.no} · abstención ${t.abs} — ${t.pass ? "saldría" : "no saldría"}`; };
  const draft = sel && can.law ? simLgmItem(leg, me, can.law, sel) : null;
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card simlgm">
    <p class="sim-kick">Legislatura · periodo de sesiones ${leg.ses} de ${SIM_LGM_SES}</p>
    <h3 class="sim-h">${esc(role)}</h3>
    <p class="sim-lead">Presidente: <b>${esc(simLgmLeader(P(leg.pres)))} (${esc(P(leg.pres).sig)})</b>. El Gobierno ${leg.gov.length > 1 ? `de coalición (${leg.gov.map((h) => esc(P(h).sig)).join(" + ")})` : "en solitario"} tiene ${govSeats} escaños${govSeats >= SIM_MAJ ? ", mayoría absoluta" : `: le faltan ${SIM_MAJ - govSeats} para la mayoría absoluta`}.</p>
    <ul class="simlgm-score">${W.mp.ids.slice().sort((a, b) => score[b].pts - score[a].pts || a.localeCompare(b)).map((h) => `<li class="${h === me ? "me" : ""}" style="--pc:${P(h).color}"><i></i><b>${esc(P(h).sig)}</b><small>${seats[h]} escaños · ${leg.pres === h ? "president" : simLgmInGov(leg, h) ? "govern" : leg.sup.includes(h) ? "apoyo" : "oposición"}</small><strong>${score[h].pts}</strong></li>`).join("")}</ul>
    <h4 class="sim-h4">En votación</h4>
    ${open.length ? `<div class="simlgm-items">${open.map((it) => simLgmItemHtml(G, it)).join("")}</div>` : `<p class="simmp-note">Ahora mismo no hay ninguna iniciativa en votación.</p>`}
    <h4 class="sim-h4">Tus iniciativas</h4>
    <div class="simlgm-new">
      ${can.law ? `<label class="simlgm-lab">${SIM_LGM_KIND[can.law].icon} ${can.law === "pl" ? "Proyecto de ley del Gobierno" : "Proposición de ley de la oposición"}
        <select data-lgm-m><option value="">Elige una medida…</option>${free.map((m) => `<option value="${m.id}" ${m.id === sel ? "selected" : ""}>${viewOf(m.id)}${esc(m.t)}${kindOf(m.id)}</option>`).join("")}</select></label>
        <p class="simmp-note">★ la defendéis · ✗ es una línea roja vuestra. Las leyes orgánicas (estatutos, inmigración, educación y sanidad, seguridad) necesitan 176 síes.</p>
        ${draft ? `<p class="simlgm-prev">${prev(draft)}</p>` : ""}
        <button type="button" class="btn primary" data-lgm-law ${sel ? "" : "disabled"}>Regístrala en el Congreso</button>`
        : `<p class="simmp-note">${seats[me] ? "Ya has registrado tu ley de este periodo de sesiones." : "Sin escaños no puedes registrar iniciativas, pero puedes negociar en el chat."}</p>`}
      <div class="simlgm-acts">
        ${can.pge ? `<button type="button" class="btn" data-lgm-pge>💶 Presenta los presupuestos</button>` : ""}
        ${can.cens ? `<button type="button" class="btn" data-lgm-cens>⚔️ Moción de censura</button>` : ""}
        ${can.conf ? `<button type="button" class="btn" data-lgm-conf>🤝 Cuestión de confianza</button>` : ""}
        ${can.dis ? `<button type="button" class="btn ghost" data-lgm-dis>Disuelve las Cortes</button>` : ""}
      </div>
    </div>
    <div class="simlgm-ready">
      ${ready ? `<p class="simmp-note">Has terminado este periodo. ${notReady.length ? `Esperando: ${notReady.map((h) => esc(P(h).sig)).join(", ")}.` : open.length ? "Faltan votaciones por cerrar." : ""}</p>`
        : `<button type="button" class="btn primary lg" data-lgm-ready>${leg.ses >= SIM_LGM_SES ? "Termina la legislatura" : "He terminado este periodo de sesiones"}</button>`}
      ${ready && late && (notReady.length || open.length) ? `<button type="button" class="btn sm" data-lgm-force>Cierra sin esperar a quien falta</button>` : ""}
    </div>
    ${done.length ? `<h4 class="sim-h4">Votaciones de la legislatura</h4><div class="simlgm-items done">${done.map((it) => simLgmItemHtml(G, it)).join("")}</div>` : ""}
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
    put(it, `Registramos ${simLc(simLgmTitle(W, it))}. Pedimos vuestro apoyo.`);
  });
  $("[data-lgm-pge]", el)?.addEventListener("click", () => put(simLgmItem(leg, me, "pge"), "El Gobierno presenta los Presupuestos Generales de este año. Sin presupuestos no se puede gobernar: hablemos."));
  $("[data-lgm-cens]", el)?.addEventListener("click", () => {
    if (!confirm(`Presentarás una moción de censura contigo como candidato alternativo. Hacen falta 176 síes; si no prospera, ya no podrás presentar otra en esta legislatura. ¿Adelante?`)) return;
    put(simLgmItem(leg, me, "cens"), `Presentamos una moción de censura contra el Gobierno de ${P(leg.pres).sig}. Necesitamos 176 escaños: ¿quién se suma?`);
  });
  $("[data-lgm-conf]", el)?.addEventListener("click", () => {
    if (!confirm("Someterás al Gobierno a una cuestión de confianza. Si la pierdes, el Gobierno cae y hay elecciones anticipadas. ¿Adelante?")) return;
    put(simLgmItem(leg, me, "conf"), "Planteo una cuestión de confianza: quiero saber si este Gobierno tiene el apoyo del Congreso.");
  });
  $("[data-lgm-dis]", el)?.addEventListener("click", async () => {
    if (!confirm("Disolverás las Cortes y convocarás elecciones anticipadas. Se acaba la legislatura para todos. ¿Adelante?")) return;
    await simMpApi().neg(G.mp.code, simLgmEndPatch(leg, "dis", Date.now(), me));
    await simChatSend(G, "all", "He disuelto las Cortes: convoco elecciones anticipadas.");
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
    await simChatSend(G, to, `¿Nos apoyáis en «${simLgmTitle(W, it)}»? Os lo tendremos en cuenta.`, { ask: it.id });
    toast("Petición enviada por el chat privado");
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
    const shown = voting ? (h === me && v ? SIM_LGM_VOTE[v] : v ? "Ya ha votado" : "Pensándoselo…") : SIM_LGM_VOTE[v || "abs"];
    const ask = voting && it.by === me && h !== me && !v ? `<button type="button" class="btn sm" data-lgm-ask="${it.id}" data-to="${h}">Pídele el voto</button>` : "";
    return `<li class="${h === me ? "me" : ""} ${voting ? "" : `v-${v || "abs"}`}" style="--pc:${W.hum[h].me.color}"><i></i><b>${esc(W.hum[h].me.sig)}</b><small>${seats[h]} · ${shown}</small>${ask}</li>`;
  }).join("");
  const mine = voting && !it.votes?.[me] && seats[me] > 0;
  return `<div class="simlgm-item k-${it.kind} ${voting ? "" : it.status}">
    <p class="simlgm-k">${K.icon} ${esc(K.label)} · ${esc(by.sig)} · periodo ${it.ses}</p>
    <h5>${esc(simLgmTitle(W, it))}</h5>
    <p class="simmp-note">${simLgmNeed(it)}${voting && it.by === me ? " Puedes pedir el voto a cada grupo: lo recibirá por el chat privado." : ""}</p>
    <ul class="simlgm-votes">${rows}</ul>
    ${it.dup ? `<p class="simlgm-res">↩️ Retirada: ya se había aprobado una igual</p>` : it.res ? `<p class="simlgm-res">${it.status === "ok" ? "✅ Aprobada" : "❌ Rechazada"} · sí ${it.res.si} · no ${it.res.no} · abstención ${it.res.abs}</p>` : ""}
    ${mine ? `<div class="simpact-btns"><button type="button" class="btn primary" data-lgm-v="${it.id}:si">Sí</button><button type="button" class="btn" data-lgm-v="${it.id}:abs">Abstención</button><button type="button" class="btn" data-lgm-v="${it.id}:no">No</button></div>` : ""}
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
  fi: "La legislatura se ha agotado: cuatro años completos.",
  conf: "El presidente ha perdido la cuestión de confianza: elecciones anticipadas.",
  dis: "El presidente ha disuelto las Cortes: elecciones anticipadas.",
};
// Resum de la legislatura per a la pantalla final: classificació i lleis aprovades
function simMpLegHtml(G) {
  const leg = G.mpDoc?.leg, W = G.mp.W, me = G.mp.hid;
  if (!leg?.end) return "";
  const sc = simLgmScore(W, leg);
  const rows = W.mp.ids.slice().sort((a, b) => sc[b].pts - sc[a].pts);
  const laws = simLgmItems(leg).filter((i) => i.status === "ok" && i.m);
  return `<div class="simlgm-final">
    <h4>Balance de la legislatura</h4>
    <p class="simmp-note">${SIM_LGM_END[leg.end.reason]} ${leg.ses} ${leg.ses === 1 ? "periodo" : "periodos"} de sesiones, ${laws.length} ${laws.length === 1 ? "ley aprobada" : "leyes aprobadas"}.</p>
    <ol>${rows.map((h, i) => `<li class="${h === me ? "me" : ""}"><b class="simmp-pos">${i + 1}</b>${simLogoSvg(W.hum[h].me, 30)}<span><b>${esc(W.hum[h].me.name)}</b><small>${sc[h].parts.map((p) => `${esc(p.label)}${p.n > 1 ? ` ×${p.n}` : ""}: ${p.pts > 0 ? "+" : ""}${p.pts}`).join(" · ") || "Sin iniciativas"}</small></span><strong>${sc[h].pts}</strong></li>`).join("")}</ol>
    ${laws.length ? `<details><summary>Leyes aprobadas</summary><ul>${laws.map((i) => `<li>${esc(simLgmTitle(W, i))} (${esc(simMpRef(W, i.by).sig)})</li>`).join("")}</ul></details>` : ""}
  </div>`;
}
