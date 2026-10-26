// Centre de control (#control). Hi entra el propietari i l'equip que ell hi afegeix, cadascú amb un grau de permís
// (vegeu CTL_ROLES). Les regles de Firestore fan complir els mateixos graus: amagar un botó no és l'única protecció.
// Els canvis de l'especial es preparen en un esborrany i es publiquen d'un cop; arriben a tothom en directe.
// La previsualització és local (només aquesta pestanya).

const CTL_OWNER = "brudomingosola@gmail.com";
const CTL_ROLES = {
  observador: { n: 1, name: "Observador", desc: "Ho pot veure tot (resum, usuaris, notícies i previsualització), però no pot canviar res." },
  editor: { n: 2, name: "Editor", desc: "A més, envia notificacions, refà les històries de Notícies i porta l'especial del 29N (fases, nit electoral, porra i avisos)." },
  admin: { n: 3, name: "Administrador", desc: "A més, porta la premsa (contactes i notes de premsa) i els anuncis, liquida la Lliga de pronòstics, configura el repte diari automàtic i pot aturar els comptadors d'ús." },
  propietari: { n: 4, name: "Propietari", desc: "Ho pot tot i és l'únic que dona i treu accessos al Centre de control." },
};
// Què cal per veure cada pestanya
const CTL_TAB_ROLE = { resum: 1, usuaris: 1, noticies: 1, errors: 1, prev: 1, ajuda: 1, notif: 2, fases: 2, nit: 2, jocs: 2, premsa: 3, anuncis: 3, equip: 4 };
let ctlRoleCache = { email: null, role: undefined, loading: false };
function ctlRole() {
  const email = window.Online?.user?.email?.toLowerCase();
  if (!email) return null;
  if (email === CTL_OWNER) return "propietari";
  if (ctlRoleCache.email !== email) ctlRoleCache = { email, role: undefined, loading: false };
  if (ctlRoleCache.role === undefined && !ctlRoleCache.loading && window.Online?.staffRole) {
    ctlRoleCache.loading = true;
    window.Online.staffRole().then((role) => {
      ctlRoleCache = { email, role: role || "", loading: false };
      const v = location.hash.slice(1).split("/")[0];
      if (v === "control") renderControl(true);
      if (v === "perfil" && role && typeof renderProfile === "function") renderProfile();
    });
  }
  return ctlRoleCache.role;
}
const ctlLevel = () => CTL_ROLES[ctlRole()]?.n || 0;
const ctlCan = (n) => ctlLevel() >= n;
// Hi té accés (qualsevol grau): el fa servir el Perfil per ensenyar l'enllaç al Centre de control
const ctlIsAdmin = () => ctlLevel() > 0;

const CTL_FASES = [
  ["auto", "Automàtic", "Segons l'horari oficial"],
  ["off", "Desactivat", "Sense especial"],
  ["previa", "Reflexió", "Demà es vota"],
  ["dia", "Jornada", "Avui es vota"],
  ["nit", "Nit electoral", "Resultats en directe"],
  ["despres", "Després", "Resultats finals"],
];
const CTL_RES = [
  ["auto", "Automàtic", "Oficials a la nit"],
  ["off", "Cap", "Sense resultats"],
  ["oficial", "Oficials", "data/resultats.json"],
  ["simulacre", "Simulacre", "Dades inventades"],
];
const CTL_PORRA = [
  ["auto", "Automàtic", "Del 20N a les 20:00 del 29N"],
  ["oberta", "Oberta", "Es pot fer"],
  ["tancada", "Tancada", "Només es mostra"],
  ["off", "Amagada", "No surt"],
];
const CTL_PRON = [
  ["auto", "Automàtic", "Del 23N a les 20:00 del 29N"],
  ["oberta", "Oberta", "Fins a les 20:00 del 29N"],
  ["tancada", "Tancada", "Ja no s'hi pot jugar"],
  ["off", "Amagada", "No surt"],
];
const CTL_MSGS = ["Resultats provisionals: poden canviar fins al 100 %.", "Les dades d'algunes circumscripcions arriben amb retard.", "L'escrutini oficial està aturat temporalment.", "Gràcies per seguir la nit electoral amb nosaltres!"];
const ctlName = (list, k) => (list.find((x) => x[0] === k) || [k, k])[1];
const ctlDate = (t) => new Date(t).toLocaleString("ca-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const ctlRel = (t) => {
  const s = Math.round((t - Date.now()) / 1000), a = Math.abs(s);
  const txt = a < 90 ? `${a} s` : a < 5400 ? `${Math.round(a / 60)} min` : a < 172800 ? `${Math.round(a / 3600)} h` : `${Math.round(a / 86400)} dies`;
  return s >= 0 ? `d'aquí a ${txt}` : `fa ${txt}`;
};
let ctlDraft = null, ctlFile = null, ctlTick = 0;
const ctlPronRes = {};

// El que veu la gent (sense la previsualització d'aquesta pestanya)
function ctlPublic(fn) {
  const pv = sessionStorage.getItem(ESP_PREVIEW_KEY);
  sessionStorage.removeItem(ESP_PREVIEW_KEY);
  try { return fn(); } finally { if (pv) sessionStorage.setItem(ESP_PREVIEW_KEY, pv); }
}
const ctlDirty = () => ctlDraft && JSON.stringify(ctlStrip(ctlDraft)) !== JSON.stringify(ctlStrip(Esp.cfg));
const ctlStrip = (c) => ({ fase: c.fase, resultats: c.resultats, porra: c.porra, pron: c.pron || "auto", missatge: c.missatge || "", participacio: c.participacio, simDurada: c.simDurada, simInici: c.simInici });
function ctlChanges() {
  const a = Esp.cfg, b = ctlDraft, out = [];
  if (a.fase !== b.fase) out.push(`Fase → ${ctlName(CTL_FASES, b.fase)}`);
  if (a.resultats !== b.resultats) out.push(`Resultats → ${ctlName(CTL_RES, b.resultats)}`);
  if (a.porra !== b.porra) out.push(`Porra → ${ctlName(CTL_PORRA, b.porra)}`);
  if ((a.pron || "auto") !== (b.pron || "auto")) out.push(`Pronòstics → ${ctlName(CTL_PRON, b.pron || "auto")}`);
  if ((a.missatge || "") !== (b.missatge || "")) out.push(b.missatge ? "Missatge nou" : "Missatge eliminat");
  if (JSON.stringify(a.participacio) !== JSON.stringify(b.participacio)) out.push("Participació");
  if (a.simInici !== b.simInici || a.simDurada !== b.simDurada) out.push("Simulacre");
  return out;
}
async function ctlCheckFile() {
  try {
    const r = await fetch(`${window.PEJ_DATA || "../data/"}resultats.json?t=${Date.now()}`, { cache: "no-store" });
    ctlFile = r.ok ? await r.json() : { missing: true };
  } catch { ctlFile = { missing: true }; }
}

function renderControl(fromLive = false) {
  const root = $("#control-page");
  if (!root) return;
  const O = window.Online;
  if (!O?.user) {
    root.innerHTML = `<div class="card ctl-gate"><span class="ctl-gate-i">🎛️</span><h1 class="page-title">Centre de control</h1><p>Entra amb el teu compte per gestionar Política en Joc.</p><button class="btn primary lg" type="button" data-ctl-login>Entra</button></div>`;
    $("[data-ctl-login]", root).addEventListener("click", () => O?.accountClick?.());
    return;
  }
  if (ctlRole() === undefined) {
    root.innerHTML = `<div class="card ctl-gate"><span class="ctl-gate-i">🎛️</span><h1 class="page-title">Centre de control</h1><p>Comprovant els teus permisos…</p></div>`;
    return;
  }
  if (!ctlIsAdmin()) {
    root.innerHTML = `<div class="card ctl-gate"><span class="ctl-gate-i">🔒</span><h1 class="page-title">Accés restringit</h1><p>Aquesta pàgina és només per a l'equip de Política en Joc.</p><a class="btn" href="#inici">Torna a l'inici</a></div>`;
    return;
  }
  // Si arriba un canvi en directe i hi ha canvis sense publicar, no es perden
  if (!ctlDraft || (fromLive && !ctlDirty())) ctlDraft = JSON.parse(JSON.stringify({ ...ESP_DEFAULT, ...Esp.cfg }));
  if (!ctlFile) ctlCheckFile().then(() => { if (location.hash.startsWith("#control")) renderControl(true); });
  const D = ctlDraft;
  const pubFase = ctlPublic(espFase), pubRes = ctlPublic(espResultsMode), pubPorra = ctlPublic(espPorraState);
  const pv = espPreview();
  const now = Date.now();
  const steps = [["porra", "Porra oberta"], ["previa", "Reflexió"], ["dia", "Jornada"], ["nit", "Nit electoral"], ["endema", "Després"], ["fi", "Fi"]];
  const nextStep = steps.find(([k]) => ESP_T[k] > now);
  const seg = (name, list, cur) => `<div class="ctl-seg" role="radiogroup">${list.map(([k, t, s]) => `<button type="button" role="radio" aria-checked="${k === cur}" class="${k === cur ? "on" : ""}" data-set="${name}" data-v="${k}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>`;
  const simRunning = D.simInici && now - D.simInici < (D.simDurada || 20) * 60000;
  const simPct = D.simInici ? Math.min(100, ((now - D.simInici) / ((D.simDurada || 20) * 60000)) * 100) : 0;
  const fileTxt = !ctlFile ? "Comprovant…" : ctlFile.missing ? "Encara no hi és (normal fins a la nit)" : `${espPct(ctlFile.escrutat || 0)} escrutat · ${ctlFile.actualitzat ? ctlRel(ctlFile.actualitzat) : "sense hora"}`;
  const fileWarn = ctlFile && !ctlFile.missing && ctlFile.actualitzat && now - ctlFile.actualitzat > 600000 && (ctlFile.escrutat || 0) < 100;
  const log = (Esp.cfg.log || []).slice(0, 8);

  // Què toca fer ara, segons el moment
  const part = Esp.cfg.participacio || [];
  const hasPart = (h) => part.some((x) => x.h === h && x.v !== null && x.v !== "" && x.v !== undefined);
  const todo = [];
  if (now < PRON_OPEN) todo.push({ t: "Res urgent. El 23N s'obrirà sola la Lliga de pronòstics.", tab: "jocs" }, { t: "Si vols, prova com es veurà la nit electoral (només tu).", tab: "prev" });
  else if (now < ESP_T.dia) todo.push({ t: "Els pronòstics i la porra són oberts. No cal fer res.", tab: "jocs" }, { t: "Fes un pronòstic de prova amb el teu compte per comprovar que desa bé.", go: "#pronostics" });
  else if (now < ESP_T.nit) {
    todo.push({ t: "Entra la participació de les 14:00 quan la doni el Ministeri.", tab: "nit", done: hasPart("14:00") });
    todo.push({ t: "Entra la participació de les 18:00.", tab: "nit", done: hasPart("18:00") });
    todo.push({ t: "Engega tools/nit-electoral.js abans de les 20:00.", tab: "ajuda" });
  } else {
    todo.push({ t: "Comprova que arriben els resultats oficials (quadre «Fitxer de resultats»).", tab: "nit", done: ctlFile && !ctlFile.missing });
    todo.push({ t: "Publica els pots de la Lliga de pronòstics.", tab: "jocs", done: !!Esp.cfg.pronPotsAt });
    todo.push({ t: "Amb l'escrutini al 100 %, liquida els pronòstics.", tab: "jocs", done: !!Esp.cfg.pronLiquidat });
  }
  for (let i = todo.length - 1; i >= 0; i--) if (todo[i].tab && !ctlCan(CTL_TAB_ROLE[todo[i].tab] || 3)) todo.splice(i, 1);
  const changed = ctlDraft ? ctlChanges() : [];
  const dot = (keys) => (changed.some((x) => keys.some((k) => x.startsWith(k))) ? `<i class="ctl-dot"></i>` : "");
  const TABS = [["resum", "🏠 Resum", ""], ["usuaris", "📊 Usuaris", ""], ["errors", "🐞 Errors", ctlRpt.list && ctlRpt.list.some((r) => r.status === "nou") ? `<i class="ctl-dot"></i>` : ""], ["noticies", "📰 Notícies", ""], ["notif", "🔔 Notificacions", ""], ["premsa", "📣 Premsa", ""], ["anuncis", "💶 Anuncis", ""], ["fases", "29N · 📅 Fases i avisos", dot(["Fase", "Missatge"])], ["nit", "29N · 📺 Nit electoral", dot(["Resultats", "Participació", "Simulacre"])], ["jocs", "29N · 🎯 Porra i pronòstics", dot(["Porra", "Pronòstics"])], ["prev", "👁 Previsualitza", ""], ["ajuda", "❓ Ajuda", ""]];
  TABS.splice(1, 0, ...(ctlCan(4) ? [["equip", "👥 Equip", ""]] : []));
  const allowed = TABS.filter(([k]) => ctlCan(CTL_TAB_ROLE[k] || 3));
  TABS.length = 0; TABS.push(...allowed);
  let tab = sessionStorage.getItem("ctl-tab") || "resum";
  if (!TABS.some(([k]) => k === tab)) tab = "resum";
  const panel = (k, inner) => (k === tab ? `<div class="ctl-panel">${inner}</div>` : "");

  root.innerHTML = `<div class="ctl">
    <header class="ctl-head">
      <div><p class="kicker">Política en Joc · ${esc(O.user.email)} · <b>${CTL_ROLES[ctlRole()].name}</b></p><h1 class="page-title">Centre de control</h1></div>
      <span class="ctl-conn ${Esp.live ? "on" : ""}">${Esp.live ? "● Connectat en directe" : "● Sense connexió en directe"}</span>
    </header>
    ${pv ? `<div class="esp-preview">👁 Tens una previsualització activa en aquesta pestanya (${esc(pv.label)}). <button type="button" data-pv-off>Treu-la</button></div>` : ""}
    <nav class="ctl-tabs" role="tablist">${TABS.map(([k, t, d]) => `<button type="button" role="tab" aria-selected="${k === tab}" class="${k === tab ? "on" : ""}" data-tab="${k}">${t}${d}</button>`).join("")}</nav>

    ${panel("resum", `
      <p class="ctl-intro">Com està l'especial ara mateix i què toca fer.</p>
      <section class="ctl-status">
        <div class="ctl-st"><small>Fase pública</small><b>${ctlName(CTL_FASES, pubFase)}</b><span class="ctl-tag ${Esp.cfg.fase === "auto" ? "" : "warn"}">${Esp.cfg.fase === "auto" ? "automàtica" : "forçada"}</span></div>
        <div class="ctl-st"><small>Resultats</small><b>${ctlName(CTL_RES, pubRes)}</b><span class="ctl-tag ${pubRes === "simulacre" ? "warn" : ""}">${pubRes === "off" ? "no es mostren" : pubRes === "simulacre" ? "públic!" : "en directe"}</span></div>
        <div class="ctl-st"><small>Porra · Pronòstics</small><b>${pubPorra === "oberta" ? "Oberta" : pubPorra === "tancada" ? "Tancada" : "No visible"} · ${ctlPublic(pronState) === "oberta" ? "Oberts" : ctlPublic(pronState) === "aviat" ? "Aviat" : ctlPublic(pronState) === "off" ? "Amagats" : "Tancats"}</b><span class="ctl-tag">${Esp.cfg.porra === "auto" && (Esp.cfg.pron || "auto") === "auto" ? "automàtic" : "manual"}</span></div>
        <div class="ctl-st"><small>Fitxer de resultats</small><b class="${fileWarn ? "bad" : ""}">${fileTxt}</b><button type="button" class="linklike" data-file>Torna a comprovar</button></div>
      </section>
      <section class="card ctl-todo">
        <h2 class="section-title sm">Què toca fer ara</h2>
        <ol>${todo.map((x) => `<li class="${x.done ? "done" : ""}"><span>${x.done ? "✔" : "○"}</span><p>${esc(x.t)}</p>${x.tab ? `<button type="button" class="btn ghost" data-tab="${x.tab}">Ves-hi</button>` : x.go ? `<a class="btn ghost" href="${x.go}">Ves-hi</a>` : ""}</li>`).join("")}</ol>
      </section>
      <section class="card ctl-time">
        <h2 class="section-title sm">Calendari automàtic</h2>
        <ol class="ctl-steps">${steps.map(([k, t]) => `<li class="${ESP_T[k] <= now ? "past" : ""} ${nextStep?.[0] === k ? "next" : ""}"><b>${t}</b><small>${ctlDate(ESP_T[k])}</small></li>`).join("")}</ol>
        <p class="muted">${nextStep ? `Pròxim canvi automàtic: <b>${nextStep[1]}</b>, ${ctlRel(ESP_T[nextStep[0]])}.` : "L'especial ja ha acabat."}</p>
      </section>
      <section class="card ctl-log">
        <h2 class="section-title sm">Darrers canvis publicats</h2>
        ${log.length ? `<ol>${log.map((e) => `<li><time>${ctlDate(e.t)}</time> ${esc(e.what)}</li>`).join("")}</ol>` : `<p class="muted">Encara no s'ha publicat cap canvi.</p>`}
      </section>`)}

    ${panel("fases", `
      <p class="ctl-intro">Què veu la gent a l'inici i a la pàgina de la nit electoral. Normalment, deixa-ho en "Automàtic".</p>
      <section class="card"><h2 class="section-title sm">Fase</h2><p class="muted">Si forces una fase, l'horari queda en pausa fins que tornis a "Automàtic".</p>${seg("fase", CTL_FASES, D.fase)}</section>
      <section class="card ctl-msg">
        <h2 class="section-title sm">Missatge destacat</h2>
        <p class="muted">Una franja groga a dalt de tot, per avisar de qualsevol cosa.</p>
        <textarea data-msg maxlength="160" rows="2" placeholder="Sense missatge">${esc(D.missatge || "")}</textarea>
        <div class="ctl-chips">${CTL_MSGS.map((m) => `<button type="button" data-msgp="${esc(m)}">${esc(m)}</button>`).join("")}${D.missatge ? `<button type="button" class="ko" data-msgp="">Treu el missatge</button>` : ""}</div>
        ${D.missatge ? `<div class="ctl-msgprev"><small>Així es veurà:</small><p class="esp-msg">${esc(D.missatge)}</p></div>` : ""}
      </section>`)}

    ${panel("nit", `
      <p class="ctl-intro">D'on surten els resultats i les xifres de participació del 29N.</p>
      <section class="card"><h2 class="section-title sm">Resultats</h2>${seg("resultats", CTL_RES, D.resultats)}
        ${D.resultats === "simulacre" ? `<p class="ctl-alert">⚠️ Tothom veurà un escrutini inventat (amb l'avís "SIMULACRE"). Fes-lo servir només per a proves.</p>` : ""}
        <p class="ctl-file ${fileWarn ? "bad" : ""}">Fitxer de resultats oficials: <b>${fileTxt}</b> <button type="button" class="linklike" data-file>Torna a comprovar</button></p></section>
      <section class="card ctl-partbox">
        <h2 class="section-title sm">Participació oficial</h2>
        <div class="ctl-parts">${(D.participacio || ESP_DEFAULT.participacio).map((x, i) => {
          const diff = x.v !== null && x.v !== "" && x.ref ? Number(x.v) - Number(x.ref) : null;
          return `<div class="ctl-pc"><b>${esc(x.h)}</b><label>Avui (%)<input data-pt="${i}" inputmode="decimal" value="${x.v ?? ""}" placeholder="—"></label><label>2023 (%)<input data-pr="${i}" inputmode="decimal" value="${x.ref ?? ""}"></label>${diff !== null ? `<span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${diff.toFixed(2)} punts</span>` : `<span class="muted">Encara no publicada</span>`}</div>`;
        }).join("")}</div>
        <p class="muted">Entra la dada quan la doni el Ministeri. Comprova les del 2023 abans d'usar-les.</p>
      </section>
      <section class="card ctl-sim">
        <h2 class="section-title sm">Simulacre públic</h2>
        <p class="muted">Un escrutini inventat que avança de 0 a 100 %. Només es veu si "Resultats" és "Simulacre". Per mirar-lo tu sol, fes servir "Previsualitza".</p>
        <div class="ctl-chips">${[5, 10, 20, 40].map((m) => `<button type="button" class="${Number(D.simDurada) === m ? "on" : ""}" data-simdur="${m}">${m} min</button>`).join("")}</div>
        ${D.simInici ? `<div class="esp-bar"><span style="width:${simPct}%"></span></div><p class="muted">${simRunning ? `En marxa: ${Math.round(simPct)} % (va començar ${ctlRel(D.simInici)})` : `Acabat (${ctlDate(D.simInici)})`}</p>` : ""}
        <div class="row"><button class="btn" type="button" data-simgo>${D.simInici ? "Torna a començar" : "Comença"}</button>${D.simInici ? `<button class="btn ghost" type="button" data-simstop>Reinicia</button>` : ""}</div>
      </section>`)}

    ${panel("jocs", `
      <p class="ctl-intro">Els dos jocs de l'especial: la porra d'escons i la Lliga de pronòstics amb fitxes.</p>
      <section class="card"><h2 class="section-title sm">🎯 Porra d'escons</h2><p class="muted">Cada jugador prediu els escons de cada partit (es guarda al seu dispositiu).</p>${seg("porra", CTL_PORRA, D.porra)}</section>
      <section class="card ctl-avis">
        <h2 class="section-title sm">📣 Avís a tothom</h2>
        <p class="muted">Una finestra que explica la Lliga de pronòstics i com es juga. Surt <b>una sola vegada</b> a cada persona que entri a partir d'ara; qui entra per primer cop la troba dins del carrusel de benvinguda.</p>
        ${Esp.cfg.avisOn ? `<p class="ctl-ok">● Actiu des de ${ctlDate(Esp.cfg.avisId)}</p><div class="row"><button class="btn" type="button" data-avis="on">Torna a llançar-lo (també a qui ja l'ha vist)</button><button class="btn ghost" type="button" data-avis="off">Retira l'avís</button><button class="btn ghost" type="button" data-avis="test">Mira com es veu</button></div>` : `<div class="row"><button class="btn primary" type="button" data-avis="on">Llança l'avís</button><button class="btn ghost" type="button" data-avis="test">Mira com es veu</button></div>`}
      </section>
      <section class="card ctl-pron">
        <h2 class="section-title sm">🎟️ Lliga de pronòstics</h2>
        <p class="muted">Quan s'hi pot jugar:</p>
        ${seg("pron", CTL_PRON, D.pron || "auto")}
        <ol class="ctl-flow">
          <li class="${Esp.cfg.pronPotsAt ? "done" : ""}"><b>1. Publica els pots</b> <small>després de les 20:00 del 29N</small>
            <p class="muted">${Esp.cfg.pronPotsAt ? `Publicats ${ctlDate(Esp.cfg.pronPotsAt)}: ${Esp.cfg.pronPlayers || 0} jugadors.` : "Així cadascú veu en directe què guanyaria amb l'escrutini. Abans no es poden publicar (llei d'enquestes)."}</p>
            <button class="btn" type="button" data-pots>${Esp.cfg.pronPots ? "Actualitza els pots" : "Publica els pots"}</button></li>
          <li class="${Esp.cfg.pronLiquidat ? "done" : ""}"><b>2. Liquida</b> <small>amb l'escrutini al 100 %</small>
            <p class="muted">${Esp.cfg.pronLiquidat ? `Liquidada ${ctlDate(Esp.cfg.pronLiquidat)}. Si canvia algun resultat, pots tornar-la a liquidar.` : "Comprova el resultat de cada pregunta (l'escrutini ja el proposa) i liquida: es reparteixen els pots, es guarden les fitxes de tothom i es publica el rànquing general."}</p>
            <div class="ctl-pres">${PRON_M.map((m) => {
              const sug = Esp.data && espResultsMode() === "oficial" ? m.res(Esp.data) : null;
              const cur = ctlPronRes[m.id] ?? Esp.cfg.pronRes?.[m.id] ?? sug ?? "";
              return `<label><span>${esc(m.q)}</span><select data-pres="${m.id}"><option value="">—</option>${m.opts.map(([o, t]) => `<option value="${o}" ${o === cur ? "selected" : ""}>${esc(t)}${o === sug ? " (escrutini)" : ""}</option>`).join("")}</select></label>`;
            }).join("")}</div>
            <button class="btn primary" type="button" data-liquida>${Esp.cfg.pronLiquidat ? "Torna a liquidar" : "Liquida i publica el rànquing"}</button></li>
        </ol>
      </section>`)}

    ${panel("prev", `
      <p class="ctl-intro">Mira l'app com la veuria la gent en cada moment. Només ho veus tu, en aquesta pestanya.</p>
      <section class="card ctl-prev">
        <div class="ctl-pvs">
          <button type="button" data-pv="previa"><span>🌙</span><b>Jornada de reflexió</b><small>28N</small></button>
          <button type="button" data-pv="dia"><span>🗳️</span><b>Jornada electoral</b><small>29N, migdia</small></button>
          <button type="button" data-pv="nit"><span>📺</span><b>Nit electoral</b><small>Simulacre de 3 minuts</small></button>
          <button type="button" data-pv="despres"><span>📊</span><b>L'endemà</b><small>Simulacre acabat</small></button>
        </div>
      </section>`)}

    ${panel("usuaris", tab === "usuaris" ? ctlStatsHtml() : "")}

    ${panel("noticies", tab === "noticies" ? ctlNewsHtml() : "")}

    ${panel("equip", tab === "equip" ? ctlTeamHtml() : "")}

    ${panel("errors", tab === "errors" ? ctlRptHtml() : "")}

    ${panel("notif", ctlNotifHtml())}

    ${panel("premsa", tab === "premsa" && typeof ctlPressHtml === "function" ? ctlPressHtml() : "")}

    ${panel("anuncis", tab === "anuncis" && typeof ctlAdsHtml === "function" ? ctlAdsHtml() : "")}

    ${panel("ajuda", `
      <p class="ctl-intro">Com funciona tot plegat, en poques línies.</p>
      <section class="card ctl-helpbox">
        <h2 class="section-title sm">Com funciona aquesta sala</h2>
        <ul><li>Els canvis no s'apliquen fins que prems <b>Publica</b> a la barra groga de baix. Arriben a tothom a l'instant.</li>
          <li>"Automàtic" vol dir que l'app canvia sola segons l'horari oficial. És el que convé gairebé sempre.</li>
          <li>"Previsualitza" només ho veus tu: no afecta ningú.</li></ul>
        <h2 class="section-title sm">La nit del 29N</h2>
        <ol><li>Abans de les 20:00, engega <code>node tools/nit-electoral.js --url …</code> al teu ordinador: va publicant <code>data/resultats.json</code>.</li>
          <li>A les 20:00 la web canvia sola a la nit electoral. Comprova a "Nit electoral" que arriba el fitxer.</li>
          <li>A "Porra i pronòstics", publica els pots.</li>
          <li>Quan l'escrutini arribi al 100 %, liquida els pronòstics.</li>
          <li>Si alguna cosa falla: "Resultats: Cap" i un missatge destacat.</li></ol>
      </section>`)}

    ${ctlDirty() ? `<div class="ctl-bar"><div><b>Canvis sense publicar</b><small>${esc(ctlChanges().join(" · "))}</small></div><button class="btn ghost" type="button" data-discard>Descarta</button><button class="btn primary" type="button" data-publish>Publica</button></div>` : ""}
  </div>`;

  if (tab === "notif") ctlNotifBind(root);
  if (tab === "usuaris") ctlStatsBind(root);
  if (tab === "noticies") ctlNewsBind(root);
  if (tab === "equip") ctlTeamBind(root);
  if (tab === "errors") ctlRptBind(root);
  if (tab === "premsa" && typeof ctlPressBind === "function") ctlPressBind(root);
  if (tab === "anuncis" && typeof ctlAdsBind === "function") ctlAdsBind(root);
  ctlLock(root);
  $$("[data-tab]", root).forEach((t) => t.addEventListener("click", () => { sessionStorage.setItem("ctl-tab", t.dataset.tab); renderControl(); window.scrollTo({ top: 0 }); }));
  const redraw = () => renderControl();
  $$("[data-set]", root).forEach((b) => b.addEventListener("click", () => { D[b.dataset.set] = b.dataset.v; Sfx.play("pick"); redraw(); }));
  $("[data-msg]", root)?.addEventListener("change", (e) => { D.missatge = e.target.value.trim().slice(0, 160); redraw(); });
  $$("[data-msgp]", root).forEach((b) => b.addEventListener("click", () => { D.missatge = b.dataset.msgp; redraw(); }));
  $$("[data-pt],[data-pr]", root).forEach((i) => i.addEventListener("change", () => {
    const k = i.dataset.pt !== undefined ? "v" : "ref", idx = Number(i.dataset.pt ?? i.dataset.pr);
    const v = i.value.replace(",", ".").trim();
    D.participacio = (D.participacio || ESP_DEFAULT.participacio).map((x, j) => (j === idx ? { ...x, [k]: v === "" ? null : Number(v) } : x));
    redraw();
  }));
  $$("[data-simdur]", root).forEach((b) => b.addEventListener("click", () => { D.simDurada = Number(b.dataset.simdur); redraw(); }));
  $("[data-simgo]", root)?.addEventListener("click", () => { D.simInici = Date.now(); redraw(); });
  $("[data-simstop]", root)?.addEventListener("click", () => { D.simInici = 0; redraw(); });
  $$("[data-file]", root).forEach((x) => x.addEventListener("click", () => { ctlFile = null; redraw(); }));
  $$("[data-avis]", root).forEach((btn) => btn.addEventListener("click", async () => {
    const k = btn.dataset.avis;
    if (k === "test") { store.set(ESP_AVIS_KEY, null); const prev = Esp.cfg; Esp.cfg = { ...prev, avisOn: true, avisId: prev.avisId || Date.now() }; location.hash = "#inici"; setTimeout(() => { espAvis(); Esp.cfg = prev; store.set(ESP_AVIS_KEY, prev.avisId || null); }, 500); return; }
    if (k === "on" && !confirm("L'avís sortirà a tothom que entri a la web a partir d'ara (un sol cop a cada persona). Continuar?")) return;
    const next = { ...Esp.cfg, avisOn: k === "on", avisId: k === "on" ? Date.now() : Esp.cfg.avisId, log: [{ t: Date.now(), what: k === "on" ? "Avís de la Lliga de pronòstics llançat" : "Avís de la Lliga de pronòstics retirat" }, ...(Esp.cfg.log || [])].slice(0, 15) };
    if (await O.setConfig("especial", next)) { Esp.cfg = Object.assign({}, ESP_DEFAULT, next); if (k === "on") store.set(ESP_AVIS_KEY, next.avisId); toast(k === "on" ? "Avís llançat" : "Avís retirat"); redraw(); }
  }));
  $$("[data-pres]", root).forEach((s) => s.addEventListener("change", () => { ctlPronRes[s.dataset.pres] = s.value; }));
  $("[data-pots]", root)?.addEventListener("click", async () => {
    if (Date.now() < PRON_CLOSE && !confirm("Encara no han tancat els col·legis: publicar els pots ara seria com publicar una enquesta. Només per a proves. Continuar?")) return;
    const all = await O.pronAll();
    if (!all) return;
    const next = { ...Esp.cfg, pronPots: pronPotsFrom(all), pronPotsAt: Date.now(), pronPlayers: all.length, log: [{ t: Date.now(), what: `Pots publicats (${all.length} jugadors)` }, ...(Esp.cfg.log || [])].slice(0, 15) };
    if (await O.setConfig("especial", next)) { Esp.cfg = Object.assign({}, ESP_DEFAULT, next); toast("Pots publicats"); redraw(); }
  });
  $("[data-liquida]", root)?.addEventListener("click", async () => {
    const res = {};
    PRON_M.forEach((m) => { res[m.id] = $(`[data-pres="${m.id}"]`, root).value; });
    if (PRON_M.some((m) => !res[m.id])) return toast("Falta el resultat d'algun mercat");
    if (!confirm("Es calcularan les fitxes de tothom amb aquests resultats i es publicarà el rànquing general. Continuar?")) return;
    const btn = $("[data-liquida]", root);
    btn.disabled = true; btn.textContent = "Llegint pronòstics…";
    const all = await O.pronAll();
    if (!all) { btn.disabled = false; btn.textContent = "Liquida i publica el rànquing"; return; }
    const pots = pronPotsFrom(all);
    const out = all.map((p) => ({ uid: p.uid, name: p.name || "Jugador", photo: /^https:/.test(p.photo || "") ? p.photo : "", fitxes: pronBalance(p, { res }, pots).total }));
    let done = 0, fails = 0;
    for (const p of out) {
      if (!(await O.pronPayout(p.uid, { fitxes: p.fitxes, liquidat: Date.now() }))) fails++;
      if (++done % 20 === 0) btn.textContent = `Liquidant… ${done}/${out.length}`;
    }
    const rank = out.sort((a, b) => b.fitxes - a.fitxes).slice(0, 50);
    const next = { ...Esp.cfg, pronRes: res, pronPots: pots, pronPotsAt: Date.now(), pronPlayers: all.length, pronLiquidat: Date.now(), pronRank: rank, log: [{ t: Date.now(), what: `Pronòstics liquidats (${out.length} jugadors${fails ? `, ${fails} errors` : ""})` }, ...(Esp.cfg.log || [])].slice(0, 15) };
    if (await O.setConfig("especial", next)) { Esp.cfg = Object.assign({}, ESP_DEFAULT, next); toast(`Liquidat: ${out.length} jugadors${fails ? ` (${fails} errors)` : ""}`); }
    redraw();
  });
  $("[data-discard]", root)?.addEventListener("click", () => { ctlDraft = null; redraw(); });
  $("[data-publish]", root)?.addEventListener("click", async () => {
    const risky = (["nit", "despres"].includes(D.fase) && D.fase !== Esp.cfg.fase) || (D.resultats === "simulacre" && Esp.cfg.resultats !== "simulacre");
    if (risky && !confirm(`Això ho veurà tothom ara mateix:\n\n${ctlChanges().join("\n")}\n\nVols publicar-ho?`)) return;
    const what = ctlChanges().join(" · ");
    const next = { ...D, actualitzat: Date.now(), log: [{ t: Date.now(), what }, ...(Esp.cfg.log || [])].slice(0, 15) };
    const btn = $("[data-publish]", root);
    btn.disabled = true; btn.textContent = "Publicant…";
    if (await O.setConfig("especial", next)) {
      Esp.cfg = Object.assign({}, ESP_DEFAULT, next);
      store.set(ESP_KEY, Esp.cfg);
      ctlDraft = null;
      Sfx.play("unlock");
      toast("Publicat: ja ho veu tothom");
      redraw();
    } else { btn.disabled = false; btn.textContent = "Publica"; }
  });
  $$("[data-pv]", root).forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.pv;
    const t = { previa: ESP_T.previa + 10 * 3600e3, dia: ESP_T.obre + 5 * 3600e3, nit: ESP_T.nit + 1800e3, despres: ESP_T.endema + 6 * 3600e3 }[f];
    const res = f === "nit" || f === "despres" ? "simulacre" : "off";
    sessionStorage.setItem(ESP_PREVIEW_KEY, JSON.stringify({ fase: f, resultats: res, t, at: Date.now(), simInici: f === "despres" ? Date.now() - 600000 : Date.now(), simDurada: 3, label: b.querySelector("b").textContent }));
    Esp.data = null; Esp.prev = null; Esp.feed = [];
    location.hash = f === "previa" || f === "dia" ? "#inici" : "#nit";
  }));
  $("[data-pv-off]", root)?.addEventListener("click", () => { sessionStorage.removeItem(ESP_PREVIEW_KEY); Esp.data = null; Esp.feed = []; redraw(); });
  // Rellotge i progrés del simulacre
  clearInterval(ctlTick);
  ctlTick = setInterval(() => { if (!location.hash.startsWith("#control")) return clearInterval(ctlTick); if (!document.hidden && !document.activeElement?.matches?.("input,textarea")) renderControl(true); }, 30000);
}
window.renderControl = renderControl;

// ---------- Notificacions push ----------
// Els enviaments queden a la cua (pushes/) i els fa GitHub Actions (tools/push.js, cada 5 minuts).
// Si en aquest dispositiu hi ha un token de GitHub, l'enviament s'engega a l'instant.
const CTL_GH_KEY = "r29n-gh";
const CTL_GH_REPO = "emdicbru/politica-en-joc";
const CTL_LINKS = [["./#inici", "Inici"], ["./#joc/diari", "Repte diari"], ["./#noticies", "Notícies"], ["./#pronostics", "Lliga de pronòstics"], ["./#nit", "Nit electoral"], ["./#simulador", "Simuladors"], ["./#apren", "Aprèn"]];
const CTL_AUD = [["avisos", "Qui vol avisos importants"], ["diari", "Qui vol el repte diari"], ["tots", "Tothom que té les notificacions activades"]];
const ctlPush = { cfg: null, hist: null, counts: null, loading: false, draft: { title: "", body: "", url: "./#inici", topic: "tots" } };
async function ctlPushLoad() {
  if (ctlPush.loading) return;
  ctlPush.loading = true;
  const O = window.Online;
  const [cfg, hist, all] = await Promise.all([O.getConfig("push"), O.pushHistory(), O.pushCount()]);
  ctlPush.cfg = cfg || { diariOn: true, diariHora: 9 };
  ctlPush.hist = hist;
  ctlPush.counts = { all };
  ctlPush.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "notif") renderControl(true);
}
function ctlNotifHtml() {
  if (!ctlPush.cfg) { ctlPushLoad(); return `<div class="card"><p class="muted">Carregant…</p></div>`; }
  const P = ctlPush, d = P.draft, n = P.counts || {};
  const gh = localStorage.getItem(CTL_GH_KEY);
  const ready = window.Online?.pushReady?.();
  const st = (s) => ({ pending: "⏳ A la cua", sending: "📤 Enviant", sent: "✔ Enviat", error: "⚠️ Error" }[s] || s);
  return `
    <p class="ctl-intro">Avisos al mòbil de tothom que té les notificacions activades (reben el repte diari i tots els avisos).</p>
    ${ready ? "" : `<p class="ctl-alert">⚠️ Falta la clau pública de les notificacions (<code>vapidKey</code> a js/firebase-config.js). Fins aleshores ningú les pot activar.</p>`}
    <section class="ctl-status">
      <div class="ctl-st"><small>Dispositius</small><b>${n.all ?? "—"}</b><span class="ctl-tag">amb notificacions</span></div>

      <div class="ctl-st"><small>Enviament</small><b>${gh ? "Immediat" : "En 5–15 min"}</b><span class="ctl-tag">${gh ? "amb token" : "cua automàtica"}</span></div>
    </section>
    <section class="card">
      <h2 class="section-title sm">📅 Repte diari automàtic</h2>
      <p class="muted">Cada matí s'envia "Ja tens el repte d'avui" a tothom que té les notificacions activades.</p>
      <div class="ctl-seg">${[["on", "Activat", "Cada dia"], ["off", "Aturat", "No s'envia"]].map(([k, t, s]) => `<button type="button" class="${(P.cfg.diariOn !== false) === (k === "on") ? "on" : ""}" data-pdiari="${k}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>
      <label class="ctl-inline">Hora <select data-phora>${[7, 8, 9, 10, 11, 12].map((hh) => `<option value="${hh}" ${Number(P.cfg.diariHora ?? 9) === hh ? "selected" : ""}>${hh}:00</option>`).join("")}</select></label>
      <p class="muted">GitHub pot endarrerir-lo uns minuts.${P.cfg.diariLast ? ` Darrer enviament: ${P.cfg.diariLast}.` : ""}</p>
    </section>
    <section class="card ctl-push">
      <h2 class="section-title sm">✉️ Nou avís</h2>
      <label>Títol <input data-ptitle maxlength="60" value="${esc(d.title)}" placeholder="P. ex.: S'ha obert la Lliga de pronòstics!"></label>
      <label>Text <textarea data-pbody maxlength="140" rows="2" placeholder="Una o dues frases">${esc(d.body)}</textarea></label>
      <div class="ctl-push-row">
        <label>En tocar-lo, obre <select data-plink>${CTL_LINKS.map(([u, t]) => `<option value="${u}" ${d.url === u ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <input type="hidden" data-paud value="tots">
      </div>
      <div class="push-prev"><span aria-hidden="true"><img src="../img/icon-192.png" alt=""></span><div><b>${esc(d.title || "Títol de l'avís")}</b><p>${esc(d.body || "El text de l'avís")}</p></div><small>ara</small></div>
      <div class="row"><button class="btn primary" type="button" data-psend ${d.title.trim() ? "" : "disabled"}>Envia l'avís</button></div>
    </section>
    <section class="card">
      <h2 class="section-title sm">🕑 Darrers avisos</h2>
      ${P.hist?.length ? `<ol class="push-hist">${P.hist.map((x) => `<li><span>${st(x.status)}</span><div><b>${esc(x.title || "")}</b><small>${ctlDate(x.created)} · ${x.kind === "diari" ? "repte diari" : CTL_AUD.find(([k]) => k === x.topic)?.[1] || x.topic}${x.sent !== undefined ? ` · ${x.sent} enviats${x.failed ? `, ${x.failed} fallits` : ""}` : ""}</small></div></li>`).join("")}</ol>` : `<p class="muted">Encara no s'ha enviat cap avís.</p>`}
      <button class="linklike" type="button" data-prefresh>Actualitza</button>
    </section>
    <section class="card">
      <h2 class="section-title sm">⚡ Enviament immediat (opcional)</h2>
      <p class="muted">Sense res més, els avisos surten en 5–15 minuts. Si aquí hi poses un token de GitHub, el procés s'engega a l'instant. El token només es guarda en aquest navegador.</p>
      ${gh ? `<p class="ctl-ok">● Token desat en aquest dispositiu</p><button class="btn ghost" type="button" data-ghoff>Esborra el token</button>` : `<details><summary>Com aconseguir-lo</summary><ol class="ctl-help"><li>GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.</li><li>Repository access: només <code>${CTL_GH_REPO}</code>.</li><li>Permissions → Actions: <b>Read and write</b>. Res més.</li><li>Copia'l i enganxa'l aquí.</li></ol></details>
      <div class="ctl-push-row"><input data-ghtoken type="password" placeholder="github_pat_…" autocomplete="off"><button class="btn" type="button" data-ghsave>Desa</button></div>`}
    </section>`;
}
async function ctlDispatch(workflow = "push.yml") {
  const gh = localStorage.getItem(CTL_GH_KEY);
  if (!gh) return false;
  try {
    const r = await fetch(`https://api.github.com/repos/${CTL_GH_REPO}/actions/workflows/${workflow}/dispatches`, { method: "POST", headers: { Authorization: `Bearer ${gh}`, Accept: "application/vnd.github+json" }, body: JSON.stringify({ ref: "main" }) });
    return r.status === 204;
  } catch { return false; }
}
function ctlNotifBind(root) {
  const O = window.Online, P = ctlPush;
  if (!P.cfg) return;
  const save = async (patch) => { const next = { ...P.cfg, ...patch }; if (await O.setConfig("push", next)) { P.cfg = next; toast("Desat"); renderControl(); } };
  $$("[data-pdiari]", root).forEach((b) => b.addEventListener("click", () => save({ diariOn: b.dataset.pdiari === "on" })));
  $("[data-phora]", root)?.addEventListener("change", (e) => save({ diariHora: Number(e.target.value) }));
  const sync = () => { P.draft = { title: $("[data-ptitle]", root).value, body: $("[data-pbody]", root).value, url: $("[data-plink]", root).value, topic: $("[data-paud]", root).value }; };
  ["[data-ptitle]", "[data-pbody]"].forEach((s) => $(s, root)?.addEventListener("change", () => { sync(); renderControl(); }));
  ["[data-plink]", "[data-paud]"].forEach((s) => $(s, root)?.addEventListener("change", sync));
  $("[data-ptitle]", root)?.addEventListener("input", (e) => { const b = $("[data-psend]", root); if (b) b.disabled = !e.target.value.trim(); });
  $("[data-psend]", root)?.addEventListener("click", async () => {
    sync();
    const d = P.draft;
    const aud = CTL_AUD.find(([k]) => k === d.topic)?.[1];
    const count = d.topic === "tots" ? P.counts?.all : P.counts?.[d.topic];
    if (!confirm(`S'enviarà «${d.title}» a: ${aud}${count != null ? ` (${count} dispositius)` : ""}. Continuar?`)) return;
    const id = await O.pushQueue({ title: d.title.trim().slice(0, 60), body: d.body.trim().slice(0, 140), url: d.url, topic: d.topic, kind: "manual" });
    if (!id) return;
    const now = await ctlDispatch();
    toast(now ? "Enviant ara mateix" : "A la cua: sortirà en 5–15 minuts");
    P.draft = { title: "", body: "", url: "./#inici", topic: "tots" };
    P.cfg = null; renderControl();
  });
  $("[data-prefresh]", root)?.addEventListener("click", () => { P.cfg = null; renderControl(); });
  $("[data-ghsave]", root)?.addEventListener("click", () => { const v = $("[data-ghtoken]", root).value.trim(); if (!v) return; localStorage.setItem(CTL_GH_KEY, v); toast("Token desat"); renderControl(); });
  $("[data-ghoff]", root)?.addEventListener("click", () => { localStorage.removeItem(CTL_GH_KEY); renderControl(); });
}

// ---------- Notícies: l'edició de les històries («El dia en 1 minut») ----------
function ctlNewsHtml() {
  if (typeof nxEdition !== "function") return `<div class="card"><p class="muted">Les notícies no estan disponibles.</p></div>`;
  const ed = nxEdition();
  const ready = typeof newsData !== "undefined" && newsData;
  const slides = ready ? nxStorySlides() : [];
  const stories = slides.filter((s) => s.kind === "story");
  const ago = (t) => { const h = (ed.at - t) / 36e5; return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : `${Math.round(h)} h`; };
  return `
    <p class="ctl-intro">Les històries de «El dia en 1 minut» es fan cada dia a les 6:30 amb els titulars d'aquell moment i no canvien fins l'endemà. Si passa alguna cosa important, en pots fer una edició nova ara.</p>
    <section class="ctl-status">
      <div class="ctl-st"><small>Edició actual</small><b>${nxEditionTime(ed.at)}</b><span class="ctl-tag ${ed.forced ? "warn" : ""}">${ed.forced ? "feta a mà" : "automàtica"}</span></div>
      <div class="ctl-st"><small>Propera automàtica</small><b>${nxEditionTime(ed.next)}</b><span class="ctl-tag">${nxMadridDay(ed.next) === nxMadridDay(Date.now()) ? "avui" : "demà"}</span></div>
      <div class="ctl-st"><small>Històries</small><b>${stories.length}</b><span class="ctl-tag">a l'edició</span></div>
      <div class="ctl-st"><small>Titulars</small><b>${ready ? fmt(nxItems().length) : "—"}</b><span class="ctl-tag">${ready ? `actualitzats ${timeAgo(newsData.updated)}` : "carregant"}</span></div>
    </section>
    <section class="card">
      <h2 class="section-title sm">🔄 Refés les històries</h2>
      <p class="muted">Es tornen a fer amb els titulars d'ara mateix i tothom les veu a l'instant. Demà a les 6:30 es farà l'edició automàtica com sempre.</p>
      <div class="row"><button class="btn primary" type="button" data-news-redo>Refés les històries ara</button></div>
    </section>
    <section class="card">
      <h2 class="section-title sm">Què hi ha a l'edició de les ${nxEditionTime(ed.at)}</h2>
      ${stories.length ? `<ol class="ctl-news">${stories.map((s) => `<li><b>${esc(s.items[0].t)}</b><small>${s.n} mitjans · el titular més recent era de fa ${ago(s.d)} · ${esc(nwTopic(s.topic).label)}</small></li>`).join("")}</ol>` : `<p class="muted">${ready ? "Amb els titulars d'aquell moment no hi havia notícies explicades per més d'un mitjà." : "Carregant els titulars…"}</p>`}
      <p class="muted">Per veure-les com la gent: <a href="#noticies">obre Notícies</a> i toca «El dia en 1 minut».</p>
    </section>`;
}
function ctlNewsBind(root) {
  $("[data-news-redo]", root)?.addEventListener("click", async () => {
    if (!confirm("Es tornaran a fer les històries amb els titulars d'ara mateix i tothom les veurà a l'instant. Continuar?")) return;
    const next = { ...Esp.cfg, storiesAt: Date.now(), log: [{ t: Date.now(), what: "Històries refetes a mà" }, ...(Esp.cfg.log || [])].slice(0, 15) };
    if (await window.Online.setConfig("especial", next)) { Esp.cfg = Object.assign({}, ESP_DEFAULT, next); toast("Històries refetes"); renderControl(true); }
  });
}

// ---------- Permisos dins de cada pestanya ----------
// El que demana més grau que el teu queda desactivat (les regles de Firestore tampoc ho deixarien fer)
const CTL_LOCKS = [
  ["[data-pots], [data-liquida], [data-pres]", 3],
  ["[data-pdiari], [data-phora]", 3],
  ["[data-custats]", 3],
  ["[data-news-redo]", 2],
  ["[data-rpt-set], [data-rpt-del]", 2],
];
function ctlLock(root) {
  CTL_LOCKS.forEach(([sel, n]) => {
    if (ctlCan(n)) return;
    $$(sel, root).forEach((el) => {
      el.disabled = true;
      el.title = `Cal ser ${Object.values(CTL_ROLES).find((r) => r.n === n).name.toLowerCase()}`;
      el.classList.add("ctl-locked");
    });
  });
}

// ---------- Equip: qui pot entrar al Centre de control (només el propietari) ----------
const ctlTeam = { list: null, loading: false };
async function ctlTeamLoad() {
  if (ctlTeam.loading) return;
  ctlTeam.loading = true;
  ctlTeam.list = await window.Online.staffList();
  ctlTeam.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "equip") renderControl(true);
}
function ctlTeamHtml() {
  if (!ctlTeam.list) { ctlTeamLoad(); return `<div class="card"><p class="muted">Carregant l'equip…</p></div>`; }
  const roles = ["observador", "editor", "admin"];
  const opts = (cur) => roles.map((k) => `<option value="${k}" ${k === cur ? "selected" : ""}>${CTL_ROLES[k].name}</option>`).join("");
  const list = [...ctlTeam.list].sort((a, b) => (CTL_ROLES[b.role]?.n || 0) - (CTL_ROLES[a.role]?.n || 0) || a.email.localeCompare(b.email));
  return `
    <p class="ctl-intro">Qui pot entrar al Centre de control i què hi pot fer. Cal que la persona entri a l'app amb aquest compte de Google.</p>
    <section class="card">
      <h2 class="section-title sm">➕ Dona accés</h2>
      <div class="ctl-team-add">
        <label>Correu del compte de Google <input type="email" data-team-email placeholder="nom@gmail.com" autocomplete="off" spellcheck="false"></label>
        <label>Grau <select data-team-role>${opts("observador")}</select></label>
        <button class="btn primary" type="button" data-team-add>Dona accés</button>
      </div>
    </section>
    <section class="card">
      <h2 class="section-title sm">👥 L'equip</h2>
      <ul class="ctl-team">
        <li class="owner"><div><b>${esc(CTL_OWNER)}</b><small>Tu · Propietari</small></div></li>
        ${list.map((p) => `<li><div><b>${esc(p.email)}</b><small>${p.t ? `Des de ${ctlDate(p.t)}` : ""}</small></div>
          <select data-team-set="${esc(p.email)}" aria-label="Grau de ${esc(p.email)}">${opts(p.role)}</select>
          <button class="btn ghost danger" type="button" data-team-del="${esc(p.email)}">Treu l'accés</button></li>`).join("")}
      </ul>
      ${list.length ? "" : `<p class="muted">Encara no hi has afegit ningú.</p>`}
    </section>
    <section class="card">
      <h2 class="section-title sm">Què pot fer cada grau</h2>
      <dl class="ctl-roles">${["observador", "editor", "admin", "propietari"].map((k) => `<dt>${CTL_ROLES[k].name}</dt><dd>${CTL_ROLES[k].desc}</dd>`).join("")}</dl>
    </section>`;
}
function ctlTeamBind(root) {
  const O = window.Online;
  $("[data-team-add]", root)?.addEventListener("click", async () => {
    const email = $("[data-team-email]", root).value.trim().toLowerCase();
    const role = $("[data-team-role]", root).value;
    if (!/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(email)) return toast("Escriu un correu vàlid");
    if (email === CTL_OWNER) return toast("Aquest compte ja és el propietari");
    if (!confirm(`${email} podrà entrar al Centre de control com a ${CTL_ROLES[role].name.toLowerCase()}. Continuar?`)) return;
    if (await O.staffSet(email, role)) { toast("Accés concedit"); ctlTeam.list = null; renderControl(true); }
  });
  $$("[data-team-set]", root).forEach((s) => s.addEventListener("change", async () => {
    if (await O.staffSet(s.dataset.teamSet, s.value)) { toast(`Ara és ${CTL_ROLES[s.value].name.toLowerCase()}`); ctlTeam.list = null; renderControl(true); }
  }));
  $$("[data-team-del]", root).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm(`${b.dataset.teamDel} ja no podrà entrar al Centre de control. Continuar?`)) return;
    if (await O.staffRemove(b.dataset.teamDel)) { toast("Accés retirat"); ctlTeam.list = null; renderControl(true); }
  }));
}

// ---------- Errors: els avisos que envia la gent («Avisa d'un error», report.js) ----------
const ctlRpt = { list: null, loading: false, filter: "nou" };
async function ctlRptLoad() {
  if (ctlRpt.loading) return;
  ctlRpt.loading = true;
  ctlRpt.list = await window.Online.reportList();
  ctlRpt.loading = false;
  if (location.hash.startsWith("#control")) renderControl(true);
}
function ctlRptHtml() {
  if (!ctlRpt.list) { ctlRptLoad(); return `<div class="card"><p class="muted">Carregant els avisos…</p></div>`; }
  const L = ctlRpt.list;
  const n = (s) => L.filter((r) => r.status === s).length;
  const shown = ctlRpt.filter === "tots" ? L : L.filter((r) => r.status === ctlRpt.filter);
  const lbl = { nou: "Nou", revisat: "Revisat", resolt: "Resolt" };
  return `
    <p class="ctl-intro">Els errors que la gent avisa des de l'app («Avisa d'un error», al peu de pàgina i a Perfil › Ajustos).</p>
    <div class="ctu-top">
      <div class="ctl-seg ctu-range">${[["nou", `Nous (${n("nou")})`], ["revisat", `Revisats (${n("revisat")})`], ["resolt", `Resolts (${n("resolt")})`], ["tots", `Tots (${L.length})`]].map(([k, t]) => `<button type="button" class="${ctlRpt.filter === k ? "on" : ""}" data-rpt-f="${k}"><b>${t}</b></button>`).join("")}</div>
      <button class="linklike" type="button" data-rpt-reload>↻ Actualitza</button>
    </div>
    ${shown.length ? `<div class="ctl-rpts">${shown.map((r) => `<article class="card ctl-rpt ${r.status}">
      <header><span class="ctl-tag ${r.status === "nou" ? "warn" : ""}">${lbl[r.status] || r.status}</span><small>${r.t ? ctlDate(r.t) : ""} · <code>${esc(r.where || "")}</code> · versió ${esc(r.ver || "?")}</small></header>
      <p class="ctl-rpt-t">${esc(r.text || "")}</p>
      <p class="muted ctl-rpt-d">${esc((r.ua || "").split(" · Mozilla")[0])} · pantalla ${esc(r.scr || "?")}${r.uid ? " · amb sessió" : " · sense sessió"}</p>
      ${r.err ? `<details><summary>Error tècnic</summary><pre>${esc(r.err)}</pre></details>` : ""}
      <div class="row">${r.email ? `<a class="btn" href="mailto:${esc(r.email)}?subject=${encodeURIComponent("Sobre l'error que ens vas avisar a Política en Joc")}">Respon a ${esc(r.email)}</a>` : ""}
        ${r.status !== "revisat" ? `<button class="btn ghost" type="button" data-rpt-set="${r.id}" data-v="revisat">Marca com a revisat</button>` : ""}
        ${r.status !== "resolt" ? `<button class="btn primary" type="button" data-rpt-set="${r.id}" data-v="resolt">Resolt</button>` : ""}
        <button class="btn ghost danger" type="button" data-rpt-del="${r.id}">Esborra</button></div>
    </article>`).join("")}</div>` : `<div class="card"><p class="muted">${ctlRpt.filter === "nou" ? "Cap avís nou. 🎉" : "No n'hi ha cap."}</p></div>`}`;
}
function ctlRptBind(root) {
  $$("[data-rpt-f]", root).forEach((b) => b.addEventListener("click", () => { ctlRpt.filter = b.dataset.rptF; renderControl(true); }));
  $("[data-rpt-reload]", root)?.addEventListener("click", () => { ctlRpt.list = null; renderControl(true); });
  $$("[data-rpt-set]", root).forEach((b) => b.addEventListener("click", async () => {
    if (await window.Online.reportSet(b.dataset.rptSet, b.dataset.v)) { const r = ctlRpt.list.find((x) => x.id === b.dataset.rptSet); if (r) r.status = b.dataset.v; renderControl(true); }
  }));
  $$("[data-rpt-del]", root).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Esborrar aquest avís?")) return;
    if (await window.Online.reportDel(b.dataset.rptDel)) { ctlRpt.list = ctlRpt.list.filter((x) => x.id !== b.dataset.rptDel); renderControl(true); }
  }));
}
