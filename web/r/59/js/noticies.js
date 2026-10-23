// Notícies: la secció d'actualitat. Portada tipus diari, «El dia en 1 minut» (històries), la mateixa notícia
// en diversos mitjans, termòmetre de campanya, «Per a tu», cercador i quiz setmanal amb titulars reals.
// Només es mostren el titular i l'enllaç a la web del mitjà. Tot el que s'hi afegeix (temes, partits, agrupacions,
// recomptes i il·lustracions) és elaboració pròpia i automàtica a partir del text del titular.

const NX_KEY = "r29n-news";
const nxPrefs = Object.assign({ f: { p: [], t: [] }, last: 0, seen: "" }, store.get(NX_KEY, {}));
const nxSave = () => store.set(NX_KEY, nxPrefs);
let nxPrevVisit = 0; // darrera visita anterior a l'actual (per marcar el que és nou)

const NX_DAYS = ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"];
const NX_DAYS_SHORT = ["dg", "dl", "dt", "dc", "dj", "dv", "ds"];
const NX_MONTHS = ["de gener", "de febrer", "de març", "d'abril", "de maig", "de juny", "de juliol", "d'agost", "de setembre", "d'octubre", "de novembre", "de desembre"];
const nxDate = (d = new Date()) => `${NX_DAYS[d.getDay()]}, ${d.getDate()} ${NX_MONTHS[d.getMonth()]}`;
const nxDayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// Mateix compte que la resta de l'app (dies sencers que falten per obrir les urnes)
const nxDaysLeft = () => Math.max(0, Math.floor((ELECTION_DATE - Date.now()) / 864e5));
const nxNorm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/l·l/g, "ll");
const nxParty = (id) => PARTIES.find((p) => p.id === id);

// Durant la prohibició de publicar enquestes (art. 69.7 LOREG) no es mostren els titulars d'enquestes
function nxItems() {
  if (!newsData) return [];
  const blocked = typeof pollsBlocked === "function" && pollsBlocked();
  return blocked ? newsData.items.filter((x) => x._t !== "enquestes") : newsData.items;
}
const nxSince = (items, hours) => items.filter((x) => x.d >= Date.now() - hours * 3600e3);
// Els titulars del dia: les últimes 24 hores o, si n'hi ha pocs, les últimes 48
const nxToday = (items) => { const a = nxSince(items, 24); return a.length >= 15 ? a : nxSince(items, 48); };

// ---------- Què vol dir? Conceptes del diccionari que surten als titulars ----------
const NX_TERMS = [
  [/moci[oó]n? de censura/i, "MOCIÓ DE CENSURA"], [/cuesti[oó]n de confianza|q[üu]esti[oó] de confian[cç]a/i, "QÜESTIÓ DE CONFIANÇA"],
  [/investidura/i, "INVESTIDURA"], [/suplicatori/i, "SUPLICATORI"], [/aforad|aforament|aforamiento|aforat/i, "AFORAMENT"],
  [/decreto[ -]ley|decret[ -]llei/i, "DECRET LLEI"], [/ley org[aá]nica|llei org[aà]nica/i, "LLEI ORGÀNICA"],
  [/proyecto de ley|projecte de llei/i, "PROJECTE DE LLEI"], [/proposici[oó]n? de ley|proposici[oó] de llei/i, "PROPOSICIÓ DE LLEI"],
  [/\bILP\b|iniciativa legislativa popular/i, "ILP"], [/enmienda|esmena/i, "ESMENA"], [/\bveto\b/i, "VETO"],
  [/diputaci[oó]n? permanent/i, "DIPUTACIÓ PERMANENT"], [/grupo mixto|grup mixt/i, "GRUP MIXT"],
  [/grupo parlamentario|grup parlamentari/i, "GRUP PARLAMENTARI"], [/mesa del congr/i, "MESA DEL CONGRÉS"],
  [/en funciones|en funcions/i, "GOVERN EN FUNCIONS"], [/disoluci[oó]n|dissoluci[oó]/i, "DISSOLUCIÓ"],
  [/sesi[oó]n constitutiva|sessi[oó] constitutiva/i, "SESSIÓ CONSTITUTIVA"], [/mayor[ií]a absoluta|majoria absoluta/i, "MAJORIA ABSOLUTA"],
  [/acuerdo de legislatura|acord de legislatura/i, "ACORD DE LEGISLATURA"], [/coalici[oó]n?\b/i, "COALICIÓ"],
  [/tr[aá]nsfug/i, "TRANSFUGUISME"], [/bipartidism/i, "BIPARTIDISME"], [/refer[eé]ndum/i, "REFERÈNDUM"], [/soberan[ií]a|sobirania/i, "SOBIRANIA"],
  [/d'?hondt/i, "LLEI D'HONDT"], [/voto [uú]til|vot [uú]til/i, "VOT ÚTIL"], [/voto por correo|vot per correu/i, "VOT PER CORREU"],
  [/mesas? electoral|meses electorals/i, "MESA ELECTORAL"], [/censo electoral|cens electoral|\bCERA\b/i, "CENS ELECTORAL"],
  [/tarjeta censal|targeta censal/i, "TARGETA CENSAL"], [/jornada de reflexi/i, "JORNADA DE REFLEXIÓ"], [/escrutini/i, "ESCRUTINI"],
  [/circunscripci|circumscripci/i, "CIRCUMSCRIPCIÓ"], [/abstenci/i, "ABSTENCIÓ"], [/hemiciclo|hemicicle/i, "HEMICICLE"],
  [/papeleta|papereta/i, "PAPERETA"], [/interventor/i, "INTERVENTOR"], [/presupuestos|pressupostos/i, "PRESSUPOSTOS"],
  [/legislatura/i, "LEGISLATURA"], [/esca[ñn]o|\besc[oó]s?\b|\bescons\b/i, "ESCÓ"], [/sondeo|sondeig|encuesta|enquesta/i, "SONDEIG"],
  [/portavoz|portaveu/i, "PORTAVEU"], [/candidatura|cabeza de lista|cap de llista|\blistas?\b|\bllistes?\b/i, "CANDIDATURA"],
];
function nxTerm(x) {
  if (x._g === undefined) {
    const hit = NX_TERMS.find(([re]) => re.test(x.t));
    x._g = hit && typeof glossaryFind === "function" && glossaryFind(hit[1]) ? hit[1] : null;
  }
  return x._g;
}
const nxTermBtn = (key, long = false) => key ? `<button type="button" class="term nx-term" data-term="${esc(key)}"><i aria-hidden="true">?</i>${long ? `Què vol dir «${esc(apTermName(key).toLowerCase())}»?` : esc(apTermName(key))}</button>` : "";

// ---------- La mateixa notícia en diversos mitjans ----------
const NX_STOP = new Set(("para por con sin sobre tras entre desde hasta ante contra como cuando donde quien quienes porque pero mas muy este esta estos estas ese esa eso aquel una uno unos unas los las del al lo le les se su sus que y o el la en de a es son ser ha han hay fue va van dice dicen tiene tienen hace hacen hoy ayer nuevo nueva todo toda todos todas otro otra ya no si tambien aunque mientras durante segun sido esta estan sera puede pueden sea "
  + "per amb sense despres des fins com quan on qui perque pero mes molt aquest aquesta aquests aquestes aquell els dels als i es diu diuen te tenen fa fan avui ahir nou nova tot tota tots totes altre altra tambe mentre segons estan pot poden sigui seu seva seus seves").split(" "));
const NX_SHORT = /^(pp|psoe|vox|erc|iu|cha|bng|pnv|cis|ue|uco|ia|ine|cup|psc)$/;
const NX_GENERIC = /^(pp|psoe|vox|erc|bng|pnv|psc|sumar|podemo|junts|bildu|gobier|govern|campan|eleccio|electo|29n|lista|listas|llista|llistes|congre|partid|partit|candid|espana|madrid)$/;
const nxTokens = (t) => [...new Set(nxNorm(t).replace(/[^a-z0-9ñç ]/g, " ").split(/\s+/)
  .filter((w) => (w.length >= 4 && !NX_STOP.has(w)) || NX_SHORT.test(w)).map((w) => (w.length > 6 ? w.slice(0, 6) : w)))];
const NX_CAP_STOP = new Set(["El", "La", "Los", "Las", "Els", "Les", "Un", "Una", "Y", "I", "De", "Del", "En", "A", "Al", "Lo", "Ja", "Ya", "Así", "Això", "Qué", "Què", "Quién", "Qui", "Por", "Per", "Con", "Amb", "Tras", "Després", "Sin", "Sense", "No", "Sí", "Si", "Este", "Esta", "Aquest", "Aquesta", "Cómo", "Com", "VÍDEO", "DIRECTE", "DIRECTO", "Congreso", "Congrés", "Gobierno", "Govern", "España", "Espanya", "Madrid", "Elecciones", "Eleccions"]);

let nxClusterMemo = { key: null, list: [] };
function nxClusters() {
  const items = nxSince(nxItems(), 72);
  const key = `${newsData?.updated}|${items.length}`;
  if (nxClusterMemo.key === key) return nxClusterMemo.list;
  const toks = items.map((x) => nxTokens(x.t));
  const df = {};
  toks.forEach((k) => k.forEach((w) => { df[w] = (df[w] || 0) + 1; }));
  // Les sigles dels partits i les paraules de campanya surten a tot arreu: gairebé no compten per agrupar
  const N = items.length, idf = (w) => Math.log(N / df[w]) * (NX_GENERIC.test(w) ? 0.25 : 1);
  const weight = toks.map((k) => k.reduce((t, w) => t + idf(w), 0));
  const adj = items.map(() => []);
  for (let i = 0; i < N; i++) {
    const A = new Set(toks[i]);
    for (let k = i + 1; k < N; k++) {
      if (Math.abs(items[i].d - items[k].d) > 48 * 3600e3) continue;
      const sh = toks[k].filter((w) => A.has(w));
      if (sh.length < 2) continue;
      const raw = sh.reduce((t, w) => t + idf(w), 0);
      if (raw >= 5.5 && raw / Math.min(weight[i], weight[k]) >= 0.28) { adj[i].push(k); adj[k].push(i); }
    }
  }
  // Agrupació en estrella: el titular amb més coincidències fa de centre i s'hi afegeixen els que s'hi assemblen
  // directament. Així dues notícies diferents no queden unides per un titular pont.
  const used = new Set();
  const groups = [];
  items.map((_, i) => i).sort((a, b) => adj[b].length - adj[a].length).forEach((i) => {
    if (used.has(i) || !adj[i].length) return;
    const g = [i, ...adj[i].filter((k) => !used.has(k))];
    g.forEach((k) => used.add(k));
    groups.push(g);
  });
  const list = groups.map(([seed, ...rest]) => {
    // Un titular per mitjà (el més recent); el centre del grup va primer
    const perOutlet = new Map([[items[seed].s, seed]]);
    rest.sort((a, b) => items[b].d - items[a].d).forEach((i) => { if (!perOutlet.has(items[i].s)) perOutlet.set(items[i].s, i); });
    const chosen = [...perOutlet.values()];
    if (chosen.length < 2) return null;
    const its = chosen.map((i) => items[i]).sort((a, b) => b.d - a.d);
    const tcount = {};
    its.forEach((x) => { tcount[x._t] = (tcount[x._t] || 0) + 1; });
    const topic = Object.keys(tcount).sort((a, b) => tcount[b] - tcount[a] || (a === "politica") - (b === "politica"))[0];
    const parties = {};
    its.forEach((x) => x._p.forEach((p) => { parties[p] = (parties[p] || 0) + 1; }));
    return { items: its, n: its.length, topic, label: nxClusterLabel(its), d: Math.max(...its.map((x) => x.d)), parties: Object.keys(parties).sort((a, b) => parties[b] - parties[a]) };
  }).filter(Boolean).sort((a, b) => b.n - a.n || b.d - a.d);
  nxClusterMemo = { key, list };
  return list;
}
// Nom curt d'una agrupació: els noms propis (d'una o més paraules) que surten a més titulars
const NX_JOIN = /^(de|del)$/;
function nxPhrases(t) {
  const words = t.replace(/[«»"“”‘’():,.;!?¿¡[\]]/g, " ").replace(/(^|\s)'|'(\s|$)/g, " ").split(/\s+/).filter(Boolean);
  const isCap = (w) => /^\p{Lu}/u.test(w);
  const out = [];
  let cur = [], start = 0;
  const flush = () => {
    while (cur.length && (NX_CAP_STOP.has(cur[0]) || NX_JOIN.test(cur[0]))) { cur.shift(); start++; }
    // La primera paraula del titular sempre va en majúscula: sola, només compta si és una sigla
    if (cur.length && !(start === 0 && cur.length === 1 && !/^\p{Lu}{2,}$/u.test(cur[0])) && !(cur.length === 1 && NX_CAP_STOP.has(cur[0]))) out.push(cur.join(" "));
    cur = [];
  };
  words.forEach((w, i) => {
    if (isCap(w)) { if (!cur.length) start = i; cur.push(w); }
    else if (cur.length && NX_JOIN.test(w) && isCap(words[i + 1] || "")) cur.push(w);
    else flush();
  });
  flush();
  return out;
}
function nxClusterLabel(its) {
  const texts = its.map((x) => ` ${nxNorm(x.t).replace(/[^a-z0-9ñç ]/g, " ")} `);
  const cands = new Map();
  // Una paraula sola ha de tenir tres lletres o ser una sigla (evita «Ha», «Es»… a l'inici d'una cita)
  its.forEach((x) => nxPhrases(x.t).forEach((p) => { const k = nxNorm(p); if ((k.length > 2 || /^\p{Lu}{2,}$/u.test(p)) && !cands.has(k)) cands.set(k, p); }));
  const min = Math.max(2, Math.ceil(its.length * 0.34));
  const scored = [...cands].map(([k, p]) => ({ k, p, n: texts.filter((t) => t.includes(` ${k} `)).length })).filter((c) => c.n >= min)
    .sort((a, b) => b.n - a.n || b.k.length - a.k.length);
  const pick = [];
  scored.forEach((c) => { if (pick.length < 2 && !pick.some((p) => p.k.includes(c.k) || c.k.includes(p.k))) pick.push(c); });
  return pick.length ? pick.map((c) => c.p).join(" i ") : nwTopic(nxMajorTopic(its)).label;
}
const nxMajorTopic = (its) => { const c = {}; its.forEach((x) => { c[x._t] = (c[x._t] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0]; };

// ---------- Peces ----------
const nxIsNew = (x) => nxPrevVisit && x.d > nxPrevVisit;
const nxLink = (x) => `href="${esc(x.u)}" target="_blank" rel="noopener noreferrer"`;
const nxRow = (x) => `<li><a ${nxLink(x)} style="--tc:${nwTopic(x._t).c}">
  <span class="nx-row-t">${new Date(x.d).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}</span>
  <span class="nx-row-b">${nwOutlet(x.s)}<b>${esc(x.t)}</b></span></a></li>`;
const nxHead = (title, sub, extra = "") => `<header class="nx-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${extra}</header>`;

// Capítol d'Aprèn que ajuda a entendre cada tema
const NX_TOPIC_CHAPTER = { enquestes: "campanya", campanya: "campanya", parlament: "congres", justicia: "legislatura", territori: "en-joc", habitatge: "en-joc", immigracio: "en-joc", economia: "en-joc", energia: "en-joc" };
const nxChapter = (topic) => (typeof AP_CHAPTERS !== "undefined" && NX_TOPIC_CHAPTER[topic] ? AP_CHAPTERS.find((c) => c.slug === NX_TOPIC_CHAPTER[topic]) : null);

// Fila compacta: la peça de totes les llistes. Sense il·lustració, perquè la pàgina no aclapari
function nxItem(x) {
  const t = nwTopic(x._t), g = nxTerm(x);
  return `<li class="nx-item" style="--tc:${t.c}">
    <span class="nx-item-meta"><span class="nx-item-t">${nwIcon(t)}${t.label}</span>${nwOutlet(x.s)}${nwWhen(x)}${nxIsNew(x) ? `<span class="nx-newtag">Nou</span>` : ""}</span>
    <a class="nx-item-h" ${nxLink(x)}>${esc(x.t)}</a>
    ${x._p.length || g ? `<span class="nx-item-foot"><span class="nw-ps">${nwParties(x, 3)}</span>${g ? nxTermBtn(g) : ""}</span>` : ""}
  </li>`;
}
const nxList = (items) => `<ul class="nx-items">${items.map(nxItem).join("")}</ul>`;

// Per entendre-ho: el concepte del diccionari que surt a la notícia i el capítol d'Aprèn del tema
function nxWhy(items, topic) {
  const key = items.map(nxTerm).find(Boolean);
  const g = key ? glossaryFind(key) : null, ch = nxChapter(topic);
  if (!g && !ch) return "";
  return `<aside class="nx-why"><b>Per entendre-ho</b>${g ? `<p><strong>${esc(apTermName(g.w))}.</strong> ${esc(g.d)}</p>` : ""}${ch ? `<a href="#apren/${ch.slug}">Capítol ${ch.n} d'Aprèn: ${esc(ch.title)} →</a>` : ""}</aside>`;
}
const nxOthers = (c, max, open = false) => (c.n > 1 ? `<details class="nx-other" ${open ? "open" : ""}><summary>Com ho expliquen ${c.n - 1 === 1 ? "en un altre mitjà" : `en ${Math.min(max, c.n - 1)} mitjans més`}</summary><ul>${c.items.slice(1, max + 1).map((y) => `<li><a ${nxLink(y)}>${nwOutlet(y.s)}<span>${esc(y.t)}</span></a></li>`).join("")}</ul></details>` : "");
const nxSolo = (x) => ({ items: [x], n: 1, topic: x._t, label: nwTopic(x._t).label, d: x.d, parties: x._p });

// Les notícies del dia. Cada mitjà que en parla suma un punt, però el punt perd la meitat del valor cada 6 hores que
// passen des del seu titular: així guanya la notícia de què parlen molts mitjans ara, i no la més grossa d'ahir.
// La de dalt de tot ha de ser del moment: algun mitjà n'ha d'haver parlat en les últimes 12 hores.
const NX_HALF_LIFE = 6 * 3600e3, NX_LEAD_FRESH = 12 * 3600e3;
const nxScore = (c, now = Date.now()) => c.items.reduce((t, x) => t + Math.pow(0.5, Math.max(0, now - x.d) / NX_HALF_LIFE), 0);
function nxTopStories(n = 5, now = Date.now()) {
  // Per a una edició passada només compten els titulars publicats fins aleshores
  const past = now < Date.now() - 60e3;
  const list = nxClusters().map((c) => {
    if (!past) return c;
    const items = c.items.filter((x) => x.d <= now);
    return items.length >= 2 ? { ...c, items, n: items.length, d: Math.max(...items.map((x) => x.d)) } : null;
  }).filter((c) => c && c.d >= now - 36 * 3600e3 && c.n >= 2)
    .map((c) => [c, nxScore(c, now)]).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const i = list.findIndex((c) => c.d >= now - NX_LEAD_FRESH);
  if (i > 0) list.unshift(...list.splice(i, 1));
  return list.slice(0, n);
}

// ---------- Pàgina ----------
const NX_TABS = [["portada", "Portada"], ["peratu", "Per a tu"], ["temes", "Temes"], ["termometre", "Termòmetre"], ["cerca", "Cerca"]];
function renderNews() {
  const root = $("#nx-root");
  if (!root) return;
  if (!newsData) { root.innerHTML = `${nxMasthead(null)}<div class="nw-loading"><span class="dot-live"></span> Carregant els titulars…</div>`; return; }
  const all = nxItems();
  if (!all.length) { root.innerHTML = `${nxMasthead(all)}<p class="muted">Ara mateix no es poden mostrar titulars. Torneu-ho a provar més tard.</p>`; return; }
  if (!NX_TABS.some(([k]) => k === newsUI.tab)) newsUI.tab = "portada";
  root.innerHTML = `
    ${nxMasthead(all)}
    ${nxStoriesRow()}
    <nav class="nx-tabs" role="tablist" aria-label="Apartats de Notícies">${NX_TABS.map(([k, t]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${newsUI.tab === k}" class="${newsUI.tab === k ? "on" : ""}">${t}</button>`).join("")}</nav>
    <div id="nx-tab" role="tabpanel"></div>
    <p class="src-note">Només es mostren el titular i l'enllaç a la publicació original; els continguts pertanyen als mitjans respectius. El tema, els partits esmentats, les agrupacions de notícies i els recomptes s'obtenen automàticament a partir dels titulars i poden contenir errors.</p>`;
  $$("[data-tab]", root).forEach((b) => b.addEventListener("click", () => nxSetTab(b.dataset.tab)));
  $$("[data-story]", root).forEach((b) => b.addEventListener("click", () => nxOpenStories(Number(b.dataset.story))));
  renderTab();
  nxTick();
}
// Canvia d'apartat sense recarregar la secció ni moure la pàgina
function nxSetTab(tab, opts = {}) {
  newsUI.tab = tab;
  Object.assign(newsUI, opts);
  try { history.replaceState(null, "", `#noticies/${tab}`); } catch { /* sense historial */ }
  $$(".nx-tabs [data-tab]").forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  renderTab();
  const tabs = $(".nx-tabs");
  if (tabs && tabs.getBoundingClientRect().top < 60) tabs.scrollIntoView({ behavior: "smooth", block: "start" });
  Sfx.play("pick");
}
function renderTab() {
  const el = $("#nx-tab");
  if (!el) return;
  ({ portada: nxTabPortada, peratu: nxTabForYou, temes: nxTabTopics, termometre: nxTabPulse, cerca: nxTabSearch })[newsUI.tab](el);
  $$("[data-go]", el).forEach((b) => b.addEventListener("click", () => nxSetTab(b.dataset.go, JSON.parse(b.dataset.opts || "{}"))));
}

// Capçalera: data, titulars del dia, compte enrere i pròxima fita
function nxMasthead(all) {
  const left = nxDaysLeft();
  const tk = todayKey();
  const next = CALENDAR.find((e) => e.date > tk);
  const nextIn = next ? Math.round((new Date(next.date) - new Date(tk)) / 864e5) : 0;
  return `<header class="nx-mast">
    <div class="nx-mast-l">
      <p class="kicker"><span class="dot-live"></span><span>${all ? `Actualitzat ${timeAgo(newsData.updated)}` : "En directe"}</span></p>
      <h1 class="nx-title">Notícies</h1>
      <p class="nx-date">${nxDate()}${all ? ` · <b>${nxToday(all).length}</b> titulars de <b>${new Set(all.map((x) => x.s)).size}</b> mitjans` : ""}</p>
    </div>
    <div class="nx-mast-r">
      <div class="nx-count"><b>${left}</b><span>${left === 1 ? "dia" : "dies"}<br>per al 29N</span></div>
      ${next ? `<p class="nx-next"><b>${nextIn === 1 ? "Demà" : `D'aquí a ${nextIn} dies`}</b>${esc(next.text)}</p>` : ""}
    </div>
  </header>`;
}

// ---------- Portada ----------
function nxTabPortada(el) {
  const all = nxItems();
  const top = nxTopStories(5);
  const lead = top[0] && top[0].d >= Date.now() - NX_LEAD_FRESH ? top[0] : nxSolo(all[0]);
  const fresh = nxPrevVisit ? all.filter((x) => x.d > nxPrevVisit) : [];
  el.innerHTML = `
    ${fresh.length ? `<button type="button" class="nx-fresh" data-go="cerca" data-opts='{"onlyNew":true,"topic":null,"party":null,"outlet":null,"q":"","shown":20}'><span class="dot-live"></span><b>${fresh.length === 1 ? "1 titular nou" : `${fresh.length} titulars nous`}</b> des de la teva última visita <span aria-hidden="true">→</span></button>` : ""}
    <section class="nx-front">
      ${nxLead(lead)}
      <aside class="nx-latest card">
        <h3><span class="dot-live"></span>Última hora</h3>
        <ol class="nx-rows">${all.slice(0, 6).map(nxRow).join("")}</ol>
        <button type="button" class="linklike" data-go="cerca" data-opts='{"onlyNew":false,"topic":null,"party":null,"outlet":null,"q":""}'>Tots els titulars →</button>
      </aside>
    </section>
    ${top.length > 1 ? `<section class="nx-sec">
      ${nxHead("També avui", "Les altres notícies que expliquen més mitjans.")}
      <div class="nx-stories-grid">${top.slice(1).map((c, i) => nxStoryCard(c, i + 2)).join("")}</div>
    </section>` : ""}
    ${nxQuizBanner()}`;
}

// Notícia principal: la que expliquen més mitjans
function nxLead(c) {
  const x = c.items[0], t = nwTopic(c.topic);
  return `<article class="nx-lead card" style="--tc:${t.c}">
    <div class="nx-lead-art">${NW_ART[t.k]}<span class="nw-tag">${nwIcon(t)}${t.label}</span></div>
    <div class="nx-lead-body">
      <p class="nx-lead-k">${c.n > 1 ? `La notícia del dia · <b>${c.n} mitjans</b> en parlen` : "L'última notícia"}</p>
      <a class="nx-lead-h" ${nxLink(x)}>${esc(x.t)}</a>
      <p class="nx-lead-src">${nwOutlet(x.s)} ${nwWhen(x)} <span class="nw-ps">${nwParties(x)}</span></p>
      ${nxOthers(c, 4, true)}
      ${nxWhy(c.items, c.topic)}
    </div>
  </article>`;
}

function nxStoryCard(c, n) {
  const x = c.items[0], t = nwTopic(c.topic);
  return `<article class="nx-story card" style="--tc:${t.c}">
    <header><span class="nx-story-n">${n}</span><span class="nx-item-t">${nwIcon(t)}${t.label}</span><span class="nx-cov">${c.n} mitjans</span></header>
    <h3>${esc(c.label)}</h3>
    <a class="nx-story-h" ${nxLink(x)}>${esc(x.t)}</a>
    <p class="nx-story-src">${nwOutlet(x.s)} ${nwWhen(x)} <span class="nw-ps">${nwParties(x, 3)}</span></p>
    ${nxOthers(c, 5)}
  </article>`;
}

function nxQuizBanner() {
  const rec = typeof Progress !== "undefined" ? Progress.data?.best?.["noticies-quiz"] : null;
  return `<a class="nx-quiz" href="#joc/noticies-quiz">
    <span class="nx-quiz-art" aria-hidden="true">${typeof ART !== "undefined" && ART.verificador ? ART.verificador() : ""}</span>
    <span class="nx-quiz-b"><small>Quiz de la setmana</small><b>Has seguit l'actualitat?</b><span>8 preguntes sobre el que ha passat aquesta setmana. Dona XP.${rec ? ` El teu rècord: ${fmt(rec)} punts.` : ""}</span></span>
    <span class="btn primary">Juga</span>
  </a>`;
}

// ---------- Per a tu ----------
let nxEditFollow = false;
function nxTabForYou(el) {
  const f = nxPrefs.f;
  const has = f.p.length || f.t.length;
  const mine = has ? nxSince(nxItems(), 72).filter((x) => x._p.some((p) => f.p.includes(p)) || f.t.includes(x._t)) : [];
  const chips = `<div class="nx-follow">
      <p>Partits</p><div>${PARTIES.map((p) => `<button type="button" class="nx-fchip ${f.p.includes(p.id) ? "on" : ""}" data-fp="${p.id}" style="--pc:${p.color}" aria-pressed="${f.p.includes(p.id)}">${p.sig}</button>`).join("")}</div>
      <p>Temes</p><div>${NW_TOPICS.filter((t) => t.k !== "politica").map((t) => `<button type="button" class="nx-fchip topic ${f.t.includes(t.k) ? "on" : ""}" data-ft="${t.k}" style="--pc:${t.c}" aria-pressed="${f.t.includes(t.k)}">${nwIcon(t)}${t.label}</button>`).join("")}</div>
    </div>`;
  el.innerHTML = has && !nxEditFollow
    ? `${nxHead("Per a tu", `${mine.length ? `${mine.length} titulars` : "Cap titular"} dels últims tres dies sobre ${[...f.p.map((p) => nxParty(p)?.sig), ...f.t.map((t) => nwTopic(t).label.toLowerCase())].join(", ")}.`, `<button type="button" class="btn ghost sm" data-fedit>Edita</button>`)}
       ${mine.length ? nxList(mine.slice(0, 30)) : `<p class="muted">Ara mateix no hi ha titulars sobre el que segueixes. Prova d'afegir-hi algun partit o tema.</p>`}`
    : `<div class="card nx-follow-card">
        ${nxHead(has ? "Què vols seguir?" : "Fes-te la teva portada", "Tria partits i temes: aquí en veuràs només els titulars. Es desa només en aquest dispositiu.", has ? `<button type="button" class="btn primary sm" data-fdone>Fet</button>` : "")}
        ${chips}
      </div>`;
  $$("[data-fp], [data-ft]", el).forEach((b) => b.addEventListener("click", () => {
    const [list, v] = b.dataset.fp ? [f.p, b.dataset.fp] : [f.t, b.dataset.ft];
    const i = list.indexOf(v);
    i >= 0 ? list.splice(i, 1) : list.push(v);
    nxSave();
    Sfx.play("pick");
    b.classList.toggle("on", i < 0);
    b.setAttribute("aria-pressed", String(i < 0));
    if (!has && (f.p.length || f.t.length)) { nxEditFollow = true; nxTabForYou(el); }
  }));
  $("[data-fedit]", el)?.addEventListener("click", () => { nxEditFollow = true; nxTabForYou(el); });
  $("[data-fdone]", el)?.addEventListener("click", () => { nxEditFollow = false; nxTabForYou(el); });
}

// ---------- Temes ----------
function nxTabTopics(el) {
  const base = nxSince(nxItems(), 72);
  const topics = NW_TOPICS.map((t) => ({ t, list: base.filter((x) => x._t === t.k) })).filter((x) => x.list.length).sort((a, b) => (a.t.k === "politica") - (b.t.k === "politica") || b.list.length - a.list.length);
  if (!topics.length) { el.innerHTML = `<p class="muted">Encara no hi ha prou titulars.</p>`; return; }
  if (!topics.some((x) => x.t.k === newsUI.ttopic)) newsUI.ttopic = topics[0].t.k;
  const cur = topics.find((x) => x.t.k === newsUI.ttopic);
  const story = nxClusters().find((c) => c.topic === cur.t.k);
  const rest = cur.list.filter((x) => !story || !story.items.includes(x));
  el.innerHTML = `
    <div class="nx-topicbar" role="group" aria-label="Temes">${topics.map(({ t, list }) => `<button type="button" class="nx-tpill ${t.k === cur.t.k ? "on" : ""}" data-tsel="${t.k}" style="--tc:${t.c}" aria-pressed="${t.k === cur.t.k}">${nwIcon(t)}${t.label}<b>${list.length}</b></button>`).join("")}</div>
    <div class="nx-topic" style="--tc:${cur.t.c}">
      <header class="nx-topic-head"><span class="nx-topic-art">${NW_ART[cur.t.k]}</span><div><h2>${cur.t.label}</h2><p>${cur.list.length} titulars en els últims tres dies</p></div></header>
      ${nxWhy(cur.list, cur.t.k)}
      ${story ? nxStoryCard(story, 1) : ""}
      ${nxList(rest.slice(0, 20))}
    </div>`;
  $$("[data-tsel]", el).forEach((b) => b.addEventListener("click", () => { newsUI.ttopic = b.dataset.tsel; Sfx.play("pick"); nxTabTopics(el); }));
}

// ---------- Termòmetre ----------
function nxTabPulse(el) {
  el.innerHTML = `<div class="nx-pulse-grid"><div class="card nx-thermo" id="nx-thermo"></div><div class="card nx-rising" id="nx-rising"></div></div>`;
  renderThermo();
  renderRising();
}

// ---------- Cerca: tots els titulars ----------
function nxTabSearch(el) {
  const all = nxItems();
  const outlets = [...new Set(all.map((x) => x.s))].sort((a, b) => a.localeCompare(b, "ca"));
  const pc = Object.keys(NW_PARTY_RE).map((id) => ({ id, n: all.filter((x) => x._p.includes(id)).length })).filter((p) => p.n).sort((a, b) => b.n - a.n);
  const filter = () => {
    const q = nxNorm(newsUI.q.trim());
    return all.filter((x) => (!newsUI.topic || x._t === newsUI.topic) && (!newsUI.party || x._p.includes(newsUI.party)) && (!newsUI.outlet || x.s === newsUI.outlet)
      && (!newsUI.onlyNew || x.d > nxPrevVisit) && (!q || nxNorm(`${x.t} ${x.s}`).includes(q)));
  };
  const active = [
    newsUI.onlyNew && `<button type="button" data-clear="onlyNew">Només els nous ✕</button>`,
    newsUI.topic && `<button type="button" data-clear="topic">${nwTopic(newsUI.topic).label} ✕</button>`,
    newsUI.party && `<button type="button" data-clear="party">${nxParty(newsUI.party)?.sig} ✕</button>`,
    newsUI.outlet && `<button type="button" data-clear="outlet">${esc(newsUI.outlet)} ✕</button>`,
  ].filter(Boolean).join("");
  const results = (list) => (list.length
    ? `${nxList(list.slice(0, newsUI.shown))}${list.length > newsUI.shown ? `<div class="row center"><button class="btn ghost" data-more>Més titulars (${list.length - newsUI.shown})</button></div>` : ""}`
    : `<p class="muted nw-empty">No hi ha titulars amb aquests filtres.</p>`);
  const list = filter();
  el.innerHTML = `
    <div class="nx-filters card" id="nx-explore">
      <label class="nx-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Cerca un nom, un tema, un mitjà…" aria-label="Cerca als titulars" value="${esc(newsUI.q)}"></label>
      <div class="nx-fparties">${pc.map(({ id, n }) => { const p = nxParty(id); return `<button type="button" class="nx-tchip ${newsUI.party === id ? "on" : ""}" data-fparty="${id}" style="--pc:${p.color}" aria-pressed="${newsUI.party === id}"><i></i>${p.sig} <small>${n}</small></button>`; }).join("")}</div>
      <div class="nx-frow">
        <label class="nw-select"><span>Tema</span><select data-ftopic aria-label="Filtra per tema"><option value="">Tots</option>${NW_TOPICS.map((t) => `<option value="${t.k}" ${newsUI.topic === t.k ? "selected" : ""}>${t.label}</option>`).join("")}</select></label>
        <label class="nw-select"><span>Mitjà</span><select data-foutlet aria-label="Filtra per mitjà"><option value="">Tots</option>${outlets.map((s) => `<option value="${esc(s)}" ${newsUI.outlet === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
        ${active ? `<div class="nw-active">${active}</div>` : ""}
        <span class="nw-n" data-count>${list.length} ${list.length === 1 ? "titular" : "titulars"}</span>
      </div>
    </div>
    <div data-results>${results(list)}</div>`;
  const bindMore = () => $("[data-more]", el)?.addEventListener("click", () => { newsUI.shown += 20; nxTabSearch(el); });
  const input = $("input", el);
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      newsUI.q = input.value; newsUI.shown = 20;
      const l2 = filter();
      $("[data-results]", el).innerHTML = results(l2);
      $("[data-count]", el).textContent = `${l2.length} ${l2.length === 1 ? "titular" : "titulars"}`;
      bindMore();
    }, 160);
  });
  $$("[data-fparty]", el).forEach((b) => b.addEventListener("click", () => { newsUI.party = newsUI.party === b.dataset.fparty ? null : b.dataset.fparty; newsUI.shown = 20; Sfx.play("pick"); nxTabSearch(el); }));
  $("[data-ftopic]", el).addEventListener("change", (e) => { newsUI.topic = e.target.value || null; newsUI.shown = 20; nxTabSearch(el); });
  $("[data-foutlet]", el).addEventListener("change", (e) => { newsUI.outlet = e.target.value || null; newsUI.shown = 20; nxTabSearch(el); });
  $$("[data-clear]", el).forEach((b) => b.addEventListener("click", () => { newsUI[b.dataset.clear] = b.dataset.clear === "onlyNew" ? false : null; nxTabSearch(el); }));
  bindMore();
}

// ---------- Termòmetre ----------
let nxThermoSel = null;
function nxThermoData() {
  const all = nxItems();
  const byDay = {};
  all.forEach((x) => { (byDay[nxDayKey(x.d)] = byDay[nxDayKey(x.d)] || []).push(x); });
  const days = Object.keys(byDay).filter((k) => byDay[k].length >= 8).sort().slice(-14);
  const totals = Object.keys(NW_PARTY_RE).map((id) => ({ id, n: all.filter((x) => x._p.includes(id)).length })).filter((p) => p.n).sort((a, b) => b.n - a.n);
  const series = totals.map(({ id }) => ({ id, v: days.map((k) => (byDay[k].filter((x) => x._p.includes(id)).length / byDay[k].length) * 100) }));
  return { days, byDay, totals, series };
}
function renderThermo() {
  const el = $("#nx-thermo");
  if (!el) return;
  const D = nxThermoData();
  if (!D.totals.length) { el.innerHTML = `<p class="muted">Encara no hi ha prou titulars.</p>`; return; }
  if (!nxThermoSel) nxThermoSel = D.totals.slice(0, 4).map((p) => p.id);
  nxThermoSel = nxThermoSel.filter((id) => D.totals.some((p) => p.id === id));
  const chips = `<div class="nx-tchips" role="group" aria-label="Partits que es mostren">${D.totals.slice(0, 8).map(({ id }) => { const p = nxParty(id); const on = nxThermoSel.includes(id); return `<button type="button" class="nx-tchip ${on ? "on" : ""}" data-th="${id}" style="--pc:${p.color}" aria-pressed="${on}"><i></i>${p.sig}</button>`; }).join("")}</div>`;

  if (D.days.length < 3) {
    // Poc històric: percentatge de titulars de les últimes 48 hores que esmenten cada partit
    const base = nxSince(nxItems(), 48);
    const rows = D.totals.slice(0, 6).map(({ id }) => ({ id, v: (base.filter((x) => x._p.includes(id)).length / Math.max(1, base.length)) * 100 }));
    const max = Math.max(...rows.map((r) => r.v), 1);
    el.innerHTML = `<h3>De qui es parla</h3><p class="nx-sub">Percentatge de titulars de les últimes 48 hores que esmenten cada partit. L'evolució dia a dia apareixerà quan hi hagi més dies de titulars.</p>
      <div class="nw-who">${rows.map(({ id, v }) => { const p = nxParty(id); return `<div class="nw-whorow" style="--pc:${p.color}"><span class="sig">${p.sig}</span><span class="track"><i style="width:${(v / max) * 100}%"></i></span><b>${Math.round(v)} %</b></div>`; }).join("")}</div>`;
    return;
  }
  // En pantalles petites el gràfic es redueix: més marge per a unes etiquetes més grans (vegeu el CSS)
  const small = innerWidth < 640;
  const W = 640, H = small ? 300 : 250, L = small ? 60 : 38, R = small ? 86 : 64, T = 14, B = small ? 40 : 30, GAP = small ? 24 : 14;
  const vis = D.series.filter((s) => nxThermoSel.includes(s.id));
  const maxV = Math.max(10, ...vis.flatMap((s) => s.v));
  const yMax = Math.ceil(maxV / 10) * 10;
  const x = (i) => L + (D.days.length === 1 ? 0 : (i * (W - L - R)) / (D.days.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / yMax);
  const grid = [0, yMax / 2, yMax].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="nx-grid"/><text x="${L - 6}" y="${y(v) + (small ? 7 : 4)}" class="nx-ax" text-anchor="end">${v} %</text>`).join("");
  const step = Math.ceil(D.days.length / 7);
  const xl = D.days.map((k, i) => { if (i % step && i !== D.days.length - 1) return ""; const d = new Date(`${k}T12:00`); return `<text x="${x(i)}" y="${H - 8}" class="nx-ax" text-anchor="middle">${NX_DAYS_SHORT[d.getDay()]} ${d.getDate()}</text>`; }).join("");
  // Etiquetes directes al final de cada línia, separades perquè no se sobreposin
  const ends = vis.map((s) => ({ s, yy: y(s.v[s.v.length - 1]) })).sort((a, b) => a.yy - b.yy);
  ends.forEach((e, i) => { if (i && e.yy - ends[i - 1].yy < GAP) e.yy = ends[i - 1].yy + GAP; });
  const lines = vis.map((s) => { const p = nxParty(s.id); return `<path d="${s.v.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("")}" class="nx-line" style="stroke:${p.color}"/>${s.v.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" class="nx-dot" style="fill:${p.color}"/>`).join("")}`; }).join("");
  const labels = ends.map(({ s, yy }) => `<text x="${W - R + 10}" y="${yy + (small ? 7 : 4)}" class="nx-lab">${nxParty(s.id).sig}</text>`).join("");
  el.innerHTML = `<h3>De qui parlen els titulars</h3><p class="nx-sub">Percentatge dels titulars de cada dia que esmenten el partit o el seu líder. Toca un partit per afegir-lo o treure'l.</p>
    ${chips}
    <div class="nx-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolució de les mencions dels partits als titulars">${grid}${xl}<line class="nx-cross" x1="0" x2="0" y1="${T}" y2="${H - B}" hidden/>${lines}${labels}<rect class="nx-hit" x="${L - 10}" y="${T}" width="${W - L - R + 20}" height="${H - T - B}"/></svg>
      <div class="nx-tip" hidden></div>
    </div>
    <details class="nx-table"><summary>Mostra les dades</summary><table><thead><tr><th>Dia</th>${vis.map((s) => `<th>${nxParty(s.id).sig}</th>`).join("")}<th>Titulars</th></tr></thead><tbody>${D.days.map((k, i) => `<tr><td>${k.slice(8)}/${k.slice(5, 7)}</td>${vis.map((s) => `<td>${Math.round(s.v[i])} %</td>`).join("")}<td>${D.byDay[k].length}</td></tr>`).join("")}</tbody></table></details>`;
  $$("[data-th]", el).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.th, i = nxThermoSel.indexOf(id);
    if (i >= 0) { if (nxThermoSel.length > 1) nxThermoSel.splice(i, 1); } else nxThermoSel.push(id);
    if (nxThermoSel.length > 6) nxThermoSel.shift();
    Sfx.play("pick");
    renderThermo();
  }));
  // Capa de lectura: línia vertical i valors del dia més proper
  const svg = $("svg", el), tip = $(".nx-tip", el), cross = $(".nx-cross", el);
  const show = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(D.days.length - 1, Math.round(((px - L) / (W - L - R)) * (D.days.length - 1))));
    cross.hidden = false; cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
    const d = new Date(`${D.days[i]}T12:00`);
    tip.hidden = false;
    tip.innerHTML = `<b>${NX_DAYS[d.getDay()]} ${d.getDate()}</b>${[...vis].sort((a, b) => b.v[i] - a.v[i]).map((s) => `<span><i style="background:${nxParty(s.id).color}"></i>${nxParty(s.id).sig}<em>${Math.round(s.v[i])} %</em></span>`).join("")}<small>${D.byDay[D.days[i]].length} titulars</small>`;
    const left = (x(i) / W) * r.width;
    tip.style.left = `${Math.min(r.width - tip.offsetWidth - 4, Math.max(4, left + 12 > r.width / 2 ? left - tip.offsetWidth - 12 : left + 12))}px`;
  };
  const hide = () => { tip.hidden = true; cross.hidden = true; };
  svg.addEventListener("pointermove", show);
  svg.addEventListener("pointerdown", show);
  svg.addEventListener("pointerleave", hide);
}

// Tema que puja: el que té més pes avui que els dies anteriors
function renderRising() {
  const el = $("#nx-rising");
  if (!el) return;
  const all = nxItems();
  const now = nxSince(all, 24), before = all.filter((x) => x.d < Date.now() - 24 * 3600e3);
  const share = (list, k) => (list.filter((x) => x._t === k).length / Math.max(1, list.length)) * 100;
  const rows = NW_TOPICS.filter((t) => t.k !== "politica").map((t) => ({ t, a: share(now, t.k), b: share(before, t.k), n: now.filter((x) => x._t === t.k).length })).filter((r) => r.n >= 2);
  const enough = before.length >= 15 && now.length >= 10;
  const up = enough ? [...rows].sort((p, q) => (q.a - q.b) - (p.a - p.b))[0] : null;
  const top = [...rows].sort((p, q) => q.a - p.a).slice(0, 5);
  el.innerHTML = `<h3>Els temes d'avui</h3>
    ${up && up.a - up.b >= 2 ? `<div class="nx-up" style="--tc:${up.t.c}"><span class="nx-up-i">${nwIcon(up.t)}</span><div><small>El tema que puja</small><b>${up.t.label}</b><span>${Math.round(up.a)} % dels titulars de les últimes 24 hores <em>(abans, un ${Math.round(up.b)} %)</em></span></div><span class="nx-up-arrow" aria-hidden="true">↑</span></div>` : ""}
    <ul class="nx-tlist">${top.map((r) => `<li style="--tc:${r.t.c}"><button type="button" data-more-topic="${r.t.k}"><span class="nx-tl-i">${nwIcon(r.t)}</span><span>${r.t.label}</span><span class="nx-tl-bar"><i style="width:${Math.min(100, r.a * 2.5)}%"></i></span><b>${r.n}</b></button></li>`).join("")}</ul>
    <p class="nx-sub">Titulars de les últimes 24 hores per tema. Toca'n un per veure'ls a Temes.</p>`;
  $$("[data-more-topic]", el).forEach((b) => b.addEventListener("click", () => {
    nxSetTab("temes", { ttopic: b.dataset.moreTopic });
  }));
}

// ---------- El dia en 1 minut (històries) ----------
// Les històries són una edició diària: es fan cada dia a les 6:30 (hora de Madrid) amb els titulars publicats fins
// aleshores i no canvien fins a l'endemà. Des del Centre de control se'n pot fer una de nova a l'instant
// (config/especial → storiesAt): tothom la veu en directe.
const NX_EDITION = [6, 30];
const nxPad = (n) => String(n).padStart(2, "0");
const nxMadridDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(t));
// Instant (ms) d'una hora de Madrid en un dia donat (AAAA-MM-DD), amb l'horari d'estiu o d'hivern que toqui
function nxMadridMs(day, h, m) {
  const guess = Date.parse(`${day}T${nxPad(h)}:${nxPad(m)}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const local = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return guess - (local - guess);
}
function nxEdition(now = Date.now()) {
  const today = nxMadridDay(now);
  const dayShift = (d, k) => nxMadridDay(Date.parse(`${d}T12:00:00Z`) + k * 864e5);
  let auto = nxMadridMs(today, ...NX_EDITION);
  const next = auto > now ? auto : nxMadridMs(dayShift(today, 1), ...NX_EDITION);
  if (auto > now) auto = nxMadridMs(dayShift(today, -1), ...NX_EDITION);
  const forced = typeof Esp !== "undefined" ? Number(Esp.cfg?.storiesAt) || 0 : 0;
  const isForced = forced > auto && forced <= now;
  return { at: isForced ? forced : auto, forced: isForced, next };
}
const nxEditionTime = (t) => new Date(t).toLocaleTimeString("ca-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
// Una història per a cada notícia important del dia, una pregunta per posar-se a prova i un resum de qui n'ha protagonitzat la conversa.
const nxStoryKey = (s) => s.items?.[0]?.u || s.t?.k || "";
function nxSeenStories() {
  const ed = String(nxEdition().at);
  if (nxPrefs.seenDay !== ed) { nxPrefs.seenDay = ed; nxPrefs.seenS = []; }
  return nxPrefs.seenS || (nxPrefs.seenS = []);
}
function nxStorySlides() {
  const ed = nxEdition();
  const all = nxItems().filter((x) => x.d <= ed.at);
  const day = all.filter((x) => x.d >= ed.at - 24 * 3600e3);
  const today = day.length >= 15 ? day : all.filter((x) => x.d >= ed.at - 48 * 3600e3);
  let stories = nxTopStories(5, ed.at).map((c) => ({ kind: "story", ...c }));
  // Dies amb poques notícies compartides: es completa amb el titular més recent dels temes principals
  if (stories.length < 3) {
    const used = new Set(stories.flatMap((s) => s.items.map((x) => x.u)));
    NW_TOPICS.map((t) => today.filter((x) => x._t === t.k && !used.has(x.u))).filter((l) => l.length && l[0]._t !== "politica")
      .sort((a, b) => b.length - a.length).slice(0, 5 - stories.length).forEach((l) => stories.push({ kind: "story", ...nxSolo(l[0]) }));
  }
  const slides = [{ kind: "cover", today, stories, ed }];
  stories.forEach((s, i) => slides.push({ ...s, i: i + 1, total: stories.length }));
  const q = nxStoryQuestion(stories);
  if (q) slides.splice(Math.min(3, slides.length), 0, { kind: "quiz", q });
  const st = nwStats(today);
  if (st.parties.length >= 3) slides.push({ kind: "who", parties: st.parties.slice(0, 5), total: today.length });
  slides.push({ kind: "end" });
  return slides;
}
// La pregunta de les històries: millor si és d'una de les notícies del dia
function nxStoryQuestion(stories) {
  const qs = nxQuizValid();
  if (!qs.length) return null;
  const urls = new Set(stories.flatMap((s) => s.items.map((x) => x.u)));
  const q = qs.find((x) => urls.has(x.u)) || qs.find((x) => stories.some((s) => s.topic === x.t)) || qs[0];
  const order = shuffle(q.a.map((_, i) => i), seededRng(hashString(q.q)));
  return { ...q, order };
}
const nxSlideSecs = (s) => (s.kind === "story" ? Math.min(14, 7 + (s.items[0].t.length + (s.items[1]?.t.length || 0)) / 45) : s.kind === "cover" ? 6 : s.kind === "who" ? 7 : s.kind === "quiz" ? 7 : 9);

function nxStoriesRow() {
  const slides = nxStorySlides();
  const seen = nxSeenStories();
  const stories = slides.map((s, i) => [s, i]).filter(([s]) => s.kind === "story");
  const allSeen = stories.length && stories.every(([s]) => seen.includes(nxStoryKey(s)));
  return `<section class="nx-stories" aria-label="El dia en 1 minut">
    <button type="button" class="nx-bub main ${allSeen ? "seen" : ""}" data-story="0"><span class="nx-bub-c"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg></span><b>El dia en<br>1 minut</b></button>
    ${stories.map(([s, i]) => { const t = nwTopic(s.topic); return `<button type="button" class="nx-bub ${seen.includes(nxStoryKey(s)) ? "seen" : ""}" data-story="${i}" style="--tc:${t.c}"><span class="nx-bub-c">${NW_ART[t.k]}</span><b>${esc(s.label)}</b></button>`; }).join("")}
  </section>`;
}

function nxSlideHtml(s) {
  if (s.kind === "cover") {
    const left = nxDaysLeft();
    return `<div class="nxs-slide nxs-cover">
      <p class="nxs-k">${nxDate()} · falten ${left} ${left === 1 ? "dia" : "dies"} per al 29N</p>
      <h2>El dia<br>en 1 minut</h2>
      <p class="nxs-big">Les <b>${s.stories.length}</b> notícies que més mitjans expliquen avui</p>
      <p class="nxs-ed">Edició de les ${nxEditionTime(s.ed.at)}</p>
      <ol class="nxs-index">${s.stories.map((x) => { const t = nwTopic(x.topic); return `<li style="--tc:${t.c}"><span>${nwIcon(t)}</span><b>${esc(x.label)}</b>${x.n > 1 ? `<small>${x.n} mitjans</small>` : ""}</li>`; }).join("")}</ol>
      <p class="nxs-hint"><span class="nxs-hint-touch">Toca a la dreta o llisca per avançar</span><span class="nxs-hint-keys">Fes servir les fletxes per avançar</span></p>
    </div>`;
  }
  if (s.kind === "story") {
    const x = s.items[0], t = nwTopic(s.topic);
    const key = s.items.map(nxTerm).find(Boolean), g = key ? glossaryFind(key) : null, ch = nxChapter(s.topic);
    return `<div class="nxs-slide nxs-story">
      <div class="nxs-top-row"><span class="nxs-tag">${nwIcon(t)}${t.label}</span><span class="nxs-count">${s.i} / ${s.total}</span></div>
      <div class="nxs-art">${NW_ART[t.k]}</div>
      <p class="nxs-label">${esc(s.label)}</p>
      <a class="nxs-h" ${nxLink(x)}>${esc(x.t)}</a>
      <p class="nxs-src">${nwOutlet(x.s)}${s.n > 1 ? `<span>i ${s.n - 1} ${s.n - 1 === 1 ? "mitjà més" : "mitjans més"}</span>` : `<span>${timeAgo(x.d)}</span>`}</p>
      ${s.items[1] ? `<blockquote class="nxs-alt"><span>Com ho titula ${esc(s.items[1].s)}</span><a ${nxLink(s.items[1])}>«${esc(s.items[1].t)}»</a></blockquote>` : ""}
      ${g ? `<div class="nxs-why"><b>Per entendre-ho · ${esc(apTermName(g.w))}</b><p>${esc(g.d)}</p></div>` : ch ? `<a class="nxs-why link" href="#apren/${ch.slug}" data-close><b>Per entendre-ho</b><p>Capítol ${ch.n} d'Aprèn: ${esc(ch.title)} →</p></a>` : ""}
      <div class="nxs-foot">${(s.parties || []).length ? `<span class="nw-ps">${s.parties.slice(0, 4).map((id) => { const p = nxParty(id); return p ? `<i class="nw-pc big" style="--pc:${p.color}">${p.sig}</i>` : ""; }).join("")}</span>` : "<span></span>"}<a class="nxs-read" ${nxLink(x)}>Llegeix-la ↗</a></div>
    </div>`;
  }
  if (s.kind === "quiz") {
    const q = s.q;
    return `<div class="nxs-slide nxs-quiz">
      <p class="nxs-k">Pregunta ràpida · ho saps?</p>
      <h2 class="nxs-q">${esc(q.q)}</h2>
      <div class="nxs-opts">${q.order.map((i) => `<button type="button" data-qo="${i}">${esc(q.a[i])}</button>`).join("")}</div>
      <div class="nxs-qres" hidden></div>
    </div>`;
  }
  if (s.kind === "who") {
    const max = s.parties[0].n;
    return `<div class="nxs-slide nxs-who-s">
      <p class="nxs-k">Qui ha centrat la conversa</p>
      <h2>De qui s'ha parlat</h2>
      <ul class="nxs-who">${s.parties.map(({ id, n }, k) => { const p = nxParty(id); return `<li style="--pc:${p.color};--i:${k}"><span>${p.sig}</span><span class="nxs-track"><i style="width:${(n / max) * 100}%"></i></span><b>${n}</b></li>`; }).join("")}</ul>
      <p class="nxs-note">Titulars que esmenten el partit o el seu líder, d'un total de ${s.total}.</p>
    </div>`;
  }
  return `<div class="nxs-slide nxs-end">
    <div class="nxs-art">${NW_ART.politica}</div>
    <h2>Ja estàs al dia!</h2>
    <p>Demà hi haurà un resum nou. Mentrestant, posa't a prova o mira tots els titulars.</p>
    <div class="nxs-cta"><a class="btn primary lg" href="#joc/noticies-quiz" data-close>Fes el quiz de la setmana</a><button type="button" class="btn ghost lg" data-close data-goall>Tots els titulars</button></div>
  </div>`;
}

function nxOpenStories(start = 0) {
  const slides = nxStorySlides();
  if (slides.length < 3) return;
  let k = -1, paused = false;
  const ov = h(`<div class="nxs" role="dialog" aria-modal="true" aria-label="El dia en 1 minut">
    <button type="button" class="nxs-arrow prev" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
    <div class="nxs-frame">
      <div class="nxs-bars">${slides.map(() => `<i><b></b></i>`).join("")}</div>
      <div class="nxs-top"><span class="nxs-brand"><span class="dot-live"></span>El dia en 1 minut</span>
        <button type="button" class="nxs-btn" data-pause aria-label="Atura"><svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg></button>
        <button type="button" class="nxs-btn" data-x aria-label="Tanca"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="nxs-stage" aria-live="polite"></div>
      <button type="button" class="nxs-nav prev" aria-label="Anterior"></button>
      <button type="button" class="nxs-nav next" aria-label="Següent"></button>
    </div>
    <button type="button" class="nxs-arrow next" aria-label="Següent"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
  </div>`);
  document.body.appendChild(ov);
  document.body.classList.add("nx-lock");
  const bars = $$(".nxs-bars b", ov);
  const stage = $(".nxs-stage", ov);
  const markSeen = (s) => {
    if (s?.kind !== "story") return;
    const seen = nxSeenStories(), key = nxStoryKey(s);
    if (!seen.includes(key)) { seen.push(key); nxSave(); }
  };
  const close = () => {
    ov.remove();
    document.body.classList.remove("nx-lock");
    document.removeEventListener("keydown", onKey);
    if (typeof closeTerm === "function") closeTerm();
    nxPrefs.seen = todayKey(); nxSave();
    const row = $(".nx-stories");
    if (row) row.outerHTML = nxStoriesRow();
    $$("[data-story]").forEach((b) => b.addEventListener("click", () => nxOpenStories(Number(b.dataset.story))));
  };
  const go = (n) => {
    if (n < 0) n = 0;
    if (n >= slides.length) return close();
    const dir = n < k ? "back" : "fwd";
    k = n;
    const s = slides[k];
    markSeen(s);
    if (typeof closeTerm === "function") closeTerm();
    bars.forEach((b, i) => { b.parentElement.className = i < k ? "done" : i === k ? "cur" : ""; });
    stage.innerHTML = nxSlideHtml(s);
    stage.scrollTop = 0;
    $(".nxs-slide", stage).classList.add(dir);
    ov.style.setProperty("--tc", s.kind === "story" ? nwTopic(s.topic).c : s.kind === "quiz" ? "#3554ff" : "var(--red)");
    ov.dataset.kind = s.kind;
    // La barra dura més o menys segons el text; la pregunta espera que es respongui
    const cur = bars[k];
    cur.style.animation = "none"; void cur.offsetWidth; cur.style.animation = "";
    cur.style.animationDuration = `${nxSlideSecs(s)}s`;
    ov.classList.toggle("waiting", s.kind === "quiz");
    if (s.kind === "quiz") bindQuiz(s.q);
    if (k === slides.length - 1) { nxPrefs.seen = todayKey(); nxSave(); }
  };
  const bindQuiz = (q) => {
    $$("[data-qo]", stage).forEach((b) => b.addEventListener("click", () => {
      const ok = Number(b.dataset.qo) === 0;
      $$("[data-qo]", stage).forEach((x) => { x.disabled = true; x.classList.toggle("ok", Number(x.dataset.qo) === 0); });
      if (!ok) b.classList.add("ko");
      Sfx.play(ok ? "ok" : "ko");
      const res = $(".nxs-qres", stage);
      res.hidden = false;
      res.innerHTML = `<b>${ok ? "Correcte!" : "No ben bé."}</b> ${esc(q.exp)}${q.u ? ` <a href="${esc(q.u)}" target="_blank" rel="noopener noreferrer">Notícia ↗</a>` : ""}`;
      ov.classList.remove("waiting");
      const cur = bars[k];
      cur.style.animation = "none"; void cur.offsetWidth; cur.style.animation = "";
      cur.style.animationDuration = "9s";
    }));
  };
  const setPause = (p) => {
    paused = p;
    ov.classList.toggle("paused", p);
    $("[data-pause]", ov).setAttribute("aria-label", p ? "Continua" : "Atura");
    $("[data-pause]", ov).innerHTML = p ? `<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>` : `<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>`;
  };
  bars.forEach((b, i) => b.addEventListener("animationend", () => { if (i === k && i < slides.length - 1) go(k + 1); }));
  $$(".prev", ov).forEach((b) => b.addEventListener("click", () => go(k - 1)));
  $$(".next", ov).forEach((b) => b.addEventListener("click", () => go(k + 1)));
  $("[data-x]", ov).addEventListener("click", close);
  $("[data-pause]", ov).addEventListener("click", () => setPause(!paused));
  ov.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]");
    if (c) {
      if (c.dataset.goall !== undefined) { close(); nxSetTab("cerca", { onlyNew: false, topic: null, party: null, outlet: null, q: "" }); return; }
      close(); return;
    }
    if (e.target === ov) close();
  });
  // Mantenir premut atura; lliscar a l'esquerra o a la dreta canvia d'història; cap avall, tanca
  const frame = $(".nxs-frame", ov);
  let x0 = null, y0 = null, held = null, swiped = false;
  frame.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; swiped = false; held = setTimeout(() => ov.classList.add("paused"), 220); });
  const up = (e) => {
    clearTimeout(held);
    if (!paused) ov.classList.remove("paused");
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) { swiped = true; close(); }
    else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? k + 1 : k - 1); }
  };
  frame.addEventListener("pointerup", up);
  frame.addEventListener("pointercancel", () => { clearTimeout(held); x0 = null; if (!paused) ov.classList.remove("paused"); });
  // Un lliscament no ha de comptar també com a toc
  frame.addEventListener("click", (e) => { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);
  const onKey = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(k + 1);
    else if (e.key === "ArrowLeft") go(k - 1);
    else if (e.key === " " && !e.target.closest("a, button")) { e.preventDefault(); setPause(!paused); }
  };
  document.addEventListener("keydown", onKey);
  go(Math.min(start, slides.length - 1));
  $("[data-x]", ov).focus();
  Sfx.play("pick");
}

// ---------- Ticker de la portada ----------
function renderNewsTicker() {
  const el = $("#home-ticker");
  if (!el) return;
  const items = nxItems().slice(0, 14);
  if (!items.length) { el.hidden = true; return; }
  el.hidden = false;
  const row = (hide) => items.map((x) => `<span class="ht-item" ${hide ? 'aria-hidden="true"' : ""}><b style="--oc:${nwOutletColor(x.s)}">${esc(x.s)}</b>${esc(x.t)}</span>`).join("");
  el.innerHTML = `<a class="home-ticker" href="#noticies" aria-label="Notícies: últims titulars">
    <span class="ht-label"><span class="dot-live"></span>Notícies</span>
    <span class="ht-track"><span class="ht-in">${row(false)}${row(true)}</span></span>
    <span class="ht-go" aria-hidden="true">→</span>
  </a>`;
  nxTick();
}

// Punt vermell a la pestanya quan hi ha titulars nous des de l'última visita
function nxTick() {
  const items = nxItems();
  const onPage = location.hash.startsWith("#noticies");
  const fresh = !onPage && nxPrefs.last && items.some((x) => x.d > nxPrefs.last);
  $$('[data-nav="noticies"]').forEach((a) => a.classList.toggle("has-new", !!fresh));
}

// En entrar a la secció: es recorda la visita anterior per marcar què és nou
function renderNoticies(arg) {
  if (!nxPrevVisit || Date.now() - nxPrefs.last > 30 * 60e3) nxPrevVisit = nxPrefs.last || 0;
  nxPrefs.last = Date.now();
  nxSave();
  if (NX_TABS.some(([k]) => k === arg)) newsUI.tab = arg;
  else { newsUI.tab = "portada"; newsUI.onlyNew = false; }
  renderNews();
  nxLoadQuiz().then(() => { if (location.hash.startsWith("#noticies") && !$(".nxs")) { const row = $(".nx-stories"); if (row) { row.outerHTML = nxStoriesRow(); $$("[data-story]").forEach((b) => b.addEventListener("click", () => nxOpenStories(Number(b.dataset.story)))); } } });
}

// ---------- Quiz de l'actualitat ----------
// Les preguntes són sobre els fets, no sobre els mitjans. Cada dia les genera tools/update-quiz.js (GitHub Models, gratuït, amb verificació) a data/quiz.json, i també se n'hi poden escriure a mà (cada una val 10 dies);
// si aquella setmana n'hi ha poques, es completen amb preguntes automàtiques sobre les notícies que expliquen més mitjans.
let nxQuizData = null;
async function nxLoadQuiz() {
  if (nxQuizData) return nxQuizData;
  try {
    const r = await fetch(`${window.PEJ_DATA || "data/"}quiz.json?t=${Math.floor(Date.now() / 600000)}`, { cache: "no-cache" });
    nxQuizData = r.ok ? await r.json() : { questions: [] };
  } catch {
    nxQuizData = { questions: [] };
  }
  return nxQuizData;
}
function nxQuizValid() {
  const blocked = typeof pollsBlocked === "function" && pollsBlocked();
  return (nxQuizData?.questions || []).filter((q) => {
    const t = new Date(`${q.d}T12:00:00`).getTime();
    return Array.isArray(q.a) && q.a.length >= 3 && Date.now() - t < 10 * 864e5 && t - Date.now() < 864e5 && !(blocked && q.t === "enquestes");
  }).sort((a, b) => b.d.localeCompare(a.d));
}

const NX_QUIZ_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng"];
function nxQuizRounds(rng = Math.random) {
  const rounds = shuffle(nxQuizValid(), rng).slice(0, 8).map((q) => {
    const { options, correctIndex } = prepOptions(q.a, rng);
    const t = nwTopic(q.t || "politica");
    const ch = q.ap && typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.find((c) => c.slug === q.ap) : null;
    return {
      label: `Actualitat · ${t.label}`,
      prompt: `<div class="q-text nxq-h">${esc(q.q)}</div>`,
      options, correctIndex, columns: 1,
      explain: `${q.exp}${ch ? ` Per entendre-ho, mira el capítol «${ch.title}» d'Aprèn.` : ""}`,
      recapQ: q.q, recapA: q.a[0], link: q.u,
    };
  });
  // Preguntes automàtiques: quin partit protagonitza una de les notícies destacades de la setmana
  const used = new Set();
  const leads = nxClusters().filter((c) => c.n >= 3).map((c) => c.items.find((x) => x._p.length === 1 && NX_QUIZ_PARTIES.includes(x._p[0]) && x.t.length < 170)).filter(Boolean);
  for (const x of shuffle(leads, rng)) {
    if (rounds.length >= 8) break;
    const id = x._p[0];
    if (used.has(id)) continue;
    const masked = esc(x.t).replace(new RegExp(NW_PARTY_RE[id].source, "g"), "<span class=\"nxq-mask\">?????</span>");
    if (!masked.includes("nxq-mask")) continue;
    used.add(id);
    const { options, correctIndex } = prepOptions([id, ...sample(NX_QUIZ_PARTIES.filter((p) => p !== id), 3, rng)].map((p) => nxParty(p).name), rng);
    rounds.push({ label: "Completa la notícia", prompt: `<div class="q-text nxq-h">${masked}</div><p class="nxq-src">Una de les notícies que més mitjans han explicat aquesta setmana. Quin partit hi falta?</p>`, options, correctIndex, explain: `«${x.t}»`, recapQ: x.t, recapA: nxParty(id).name, link: x.u });
  }
  return rounds.length >= 5 ? shuffle(rounds, rng) : null;
}

registerGame({
  id: "noticies-quiz",
  cat: "rapid",
  hidden: true, // s'hi arriba des de Notícies
  backHref: "#noticies",
  tagline: "Has seguit l'actualitat aquesta setmana?",
  kicker: "Notícies de la setmana",
  title: "Quiz de l'actualitat",
  color: "#ff4b2b",
  level: 1,
  meta: "8 preguntes",
  icon: icon(`<path d="M4 5h13v14H6a2 2 0 01-2-2z"/><path d="M17 9h3v8a2 2 0 01-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>`),
  desc: "Preguntes sobre el que ha passat aquesta setmana: qui encapçala les llistes, què han decidit els tribunals, què ha passat a la campanya… Cada resposta s'explica i enllaça a la notícia.",
  rules: ["8 preguntes · 20 s", "Sobre els fets de la setmana", "Comodins: 50:50 i enquesta", "Amb explicació i font"],
  async start(ctx) {
    ctx.body.innerHTML = `<div class="nw-loading"><span class="dot-live"></span> Preparant les preguntes…</div>`;
    await nxLoadQuiz();
    if (!ctx.alive()) return;
    const rounds = nxQuizRounds();
    if (!rounds) {
      ctx.body.innerHTML = `<div class="card qcard"><p class="q-label">Encara no hi ha prou preguntes</p><p>Torna d'aquí a una estona: el quiz es fa amb les notícies de la setmana.</p><a class="btn primary" href="#noticies">Torna a Notícies</a></div>`;
      return;
    }
    runChoiceRounds(ctx, rounds, { timer: 20 });
  },
});

nxLoadQuiz();
