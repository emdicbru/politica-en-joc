// Notícies: dades dels titulars de política dels mitjans (la pàgina és a js/noticies.js). Només es mostren el titular i l'enllaç a la publicació original;
// la part visual (tema, partits esmentats, il·lustracions i recomptes) és elaboració pròpia a partir del titular.

// Si es defineix una adreça (el data/news.json que actualitza GitHub Actions), es llegeix d'allà;
// si no, del fitxer del propi web. A més, els mitjans amb CORS obert es consulten directament des del navegador.
const NEWS_REMOTE = "https://raw.githubusercontent.com/emdicbru/politica-en-joc/main/data/news.json";
const NEWS_REFRESH_MS = 3 * 60 * 1000;
const NEWS_POLITICS = /elecci|electoral|29-?n|congreso|congr[eé]s|senado|senat|gobierno|govern|sánchez|sanchez|feijóo|feijoo|abascal|\bpp\b|psoe|vox|sumar|podemos|erc\b|junts|bildu|pnv|bng|amnist|investidura|moci[oó]n|presupuestos|pressupostos|partido|partit|ministr|diputad|encuesta|enquesta|puigdemont|illa|mazón|ayuso|colau|rufián|rufian|campaña|campanya|urnas|urnes|votaci|legislat/i;
const NEWS_LIVE = [
  { s: "El País", u: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada", filter: true },
  { s: "VilaWeb", u: "https://www.vilaweb.cat/feed/", filter: true },
];
let newsStatic = [], newsLocal = null, newsLive = [], newsUpdated = 0, newsTimer = null, newsData = null;
const newsUI = { tab: "portada", topic: null, ttopic: null, party: null, outlet: null, q: "", onlyNew: false, shown: 20 };

// ---------- Il·lustracions dels temes ----------
const NW_ART = {
  enquestes: lsvg(`<path d="M18 96h124" stroke="${LI}" stroke-width="4"/>${[[26, 40, LR], [50, 62, LB], [74, 30, LY]].map(([x, hh, c]) => `<rect x="${x}" y="${96 - hh}" width="20" height="${hh}" rx="3" fill="${c}" stroke="${LI}" stroke-width="3"/>`).join("")}
    <circle cx="116" cy="44" r="18" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M128 57l16 16" stroke="${LI}" stroke-width="6"/><path d="M108 46l6 5 10-12" stroke="${LR}" stroke-width="3.5"/>`),
  habitatge: lsvg(`<path d="M28 58L80 20l52 38" stroke="${LI}" stroke-width="5"/><path d="M40 52v42h80V52" fill="${LC}" stroke="${LI}" stroke-width="4"/>
    <rect x="70" y="66" width="20" height="28" rx="2" fill="${LY}" stroke="${LI}" stroke-width="3.5"/><rect x="48" y="62" width="14" height="14" fill="#fff" stroke="${LI}" stroke-width="3"/><rect x="98" y="62" width="14" height="14" fill="#fff" stroke="${LI}" stroke-width="3"/>
    <g transform="rotate(14 130 30)"><path d="M114 20h26l8 11-8 11h-26z" fill="${LR}" stroke="${LI}" stroke-width="3"/><text x="129" y="36" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="12" fill="#fff">€</text></g>`),
  immigracio: lsvg(`<path d="M36 64h88l-12 18H48z" fill="${LR}" stroke="${LI}" stroke-width="4"/><path d="M80 22v42" stroke="${LI}" stroke-width="3.5"/><path d="M82 26l26 32H82z" fill="${LC}" stroke="${LI}" stroke-width="3"/>
    <path d="M14 94c10-7 20-7 30 0s20 7 30 0 20-7 30 0 20 7 30 0" stroke="${LB}" stroke-width="4"/>`),
  justicia: lsvg(`<g transform="rotate(-35 82 50)"><rect x="54" y="22" width="56" height="24" rx="5" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="76" y="46" width="12" height="46" rx="4" fill="${LC}" stroke="${LI}" stroke-width="4"/></g>
    <rect x="26" y="86" width="70" height="12" rx="3" fill="${LI}"/><path d="M118 34l10-8M124 48h14M118 62l10 8" stroke="${LI}" stroke-width="4"/>`),
  economia: lsvg(`${[84, 72, 60].map((y) => `<path d="M30 ${y}v8a26 8 0 0052 0v-8" fill="${LY}" stroke="${LI}" stroke-width="3.5"/><ellipse cx="56" cy="${y}" rx="26" ry="8" fill="${LY}" stroke="${LI}" stroke-width="3.5"/>`).join("")}
    <circle cx="114" cy="48" r="26" fill="${LC}" stroke="${LI}" stroke-width="4"/><text x="114" y="58" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="26" fill="${LI}">€</text>`),
  energia: lsvg(`<path d="M86 10L48 62h28l-8 38 40-54H80z" fill="${LY}" stroke="${LI}" stroke-width="4"/><circle cx="34" cy="32" r="12" fill="${LR}" stroke="${LI}" stroke-width="3.5"/>
    <path d="M34 12v6M34 46v6M14 32h6M48 32h6" stroke="${LI}" stroke-width="3"/><path d="M118 80c0-14 10-24 24-26-2 14-10 24-24 26zM118 80v14" stroke="${LI}" stroke-width="3.5" fill="#3f8f45"/>`),
  territori: lsvg(`<path d="M22 30l38-10 40 10 38-10v62l-38 10-40-10-38 10z" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M60 20v62M100 30v62" stroke="${LI}" stroke-width="3"/>
    <path d="M80 30c-9 0-15 7-15 15 0 11 15 25 15 25s15-14 15-25c0-8-6-15-15-15z" fill="${LR}" stroke="${LI}" stroke-width="3.5"/><circle cx="80" cy="45" r="5" fill="${LC}" stroke="${LI}" stroke-width="2.5"/>
    <circle cx="40" cy="64" r="6" fill="${LB}" stroke="${LI}" stroke-width="3"/><circle cx="120" cy="56" r="6" fill="${LY}" stroke="${LI}" stroke-width="3"/>`),
  internacional: lsvg(`<circle cx="80" cy="56" r="38" fill="#e5eaff" stroke="${LI}" stroke-width="4"/><ellipse cx="80" cy="56" rx="16" ry="38" stroke="${LI}" stroke-width="3"/>
    <path d="M42 56h76M48 36h64M48 76h64" stroke="${LI}" stroke-width="3"/><path d="M124 22l8 8M132 22l-8 8" stroke="${LR}" stroke-width="3"/>`),
  campanya: AP_ART.mega,
  parlament: AP_ART.palace,
  politica: lsvg(`<path d="M22 22h70a8 8 0 018 8v28a8 8 0 01-8 8H52l-14 12V66H22a8 8 0 01-8-8V30a8 8 0 018-8z" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M28 36h52M28 48h36" stroke="${LI}" stroke-width="3.5"/>
    <path d="M86 46h52a8 8 0 018 8v22a8 8 0 01-8 8h-8v12l-14-12H86a8 8 0 01-8-8V54a8 8 0 018-8z" fill="${LY}" stroke="${LI}" stroke-width="4"/><path d="M92 60h40M92 70h26" stroke="${LI}" stroke-width="3.5"/>`),
};

// Temes, en ordre de prioritat: un titular es classifica amb el primer que coincideix
const NW_TOPICS = [
  { k: "enquestes", label: "Enquestes", c: "#3554ff", icon: `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`, re: /encuest|enquest|sondeo|sondeig|\bCIS\b|intención de voto|intenció de vot|barómetro|baròmetre/i },
  { k: "habitatge", label: "Habitatge", c: "#f59f24", icon: `<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>`, re: /vivienda|habitatge|alquiler|lloguer|hipotec|desahuci|desnonament|okupa|ocupes|inquilin|llogater/i },
  { k: "immigracio", label: "Immigració", c: "#0f9a83", icon: `<path d="M3 17l2-6h14l2 6"/><path d="M12 11V4l5 5"/><path d="M2 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>`, re: /inmigra|immigra|migrant|frontera|patera|pastera|cayuco|caiuc|regulariza|regularitza|menores no acompañados|menors no acompanyats|\basilo\b|extranjer/i },
  { k: "justicia", label: "Justícia", c: "#7b3fe4", icon: `<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/>`, re: /\bjuez|\bjueza|\bjutge|tribunal|supremo|\bsuprem|fiscal\b|fiscalía|fiscalia|juicio|judici|condenad|condemnat|imputad|investigad|corrupci|\bUCO\b|querella|Koldo|Ábalos|Abalos|Cerdán|Cerdan|prisión|presó|sentencia|sentència|Constitucional|Audiencia|Audiència|\bTSJ/i },
  { k: "energia", label: "Energia i clima", c: "#3f8f45", icon: `<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`, re: /energ|apagón|apagada|nuclear|renovabl|clima|emisiones|emissions|\bdana\b|incendi|sequ[ií]a|sequera/i },
  { k: "economia", label: "Economia", c: "#00a37a", icon: `<circle cx="12" cy="12" r="9"/><path d="M15 8.5a4 4 0 100 7M7 11h6M7 13.5h6"/>`, re: /econom|impuest|impost|pensi|salari|\bsous?\b|\bparo\b|\batur\b|empleo|\bPIB\b|inflaci|deuda|\bdeute|presupuest|pressupost|empresa|\bbanc|IRPF|\bIVA\b|autónom|autònom|ayudas|\bajuts|precios|preus/i },
  { k: "territori", label: "Territori", c: "#20b8c8", icon: `<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>`, re: /catalu|puigdemont|amnist|independen|procés|generalitat|junqueras|euskadi|país vasco|país basc|galicia|galícia|autonom|financiación|finançament|\bjunts\b|\bERC\b|bildu|\bPNV\b|\bBNG\b|exili/i },
  { k: "internacional", label: "Internacional", c: "#1e88d6", icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>`, re: /milei|trump|netanyahu|israel|gaza|palestin|ucrania|ucraïna|rusia|rússia|putin|\bOTAN\b|\bNATO\b|bruselas|brussel·les|unión europea|unió europea|\bUE\b|argentin|estados unidos|estats units|EEUU|\bEUA\b|china|xina|\biran|irán|marruecos|marroc|europeus|europeos|ciberata/i },
  { k: "campanya", label: "Campanya", c: "#ff4b2b", icon: `<path d="M4 10h3l9-5v14l-9-5H4z"/><path d="M7 14l1 5h3"/><path d="M19 9a4 4 0 010 6"/>`, re: /campaña|campanya|mitin|míting|\bpresenta(?:r|rà|ran|n)?\b|presentar-se|presentarse|candidatura|\bacto\b|\bacte\b|\blistas?\b|\bllistes?\b|cabeza de lista|cap de llista|candidat|29-?N|elecciones|eleccions|debate|debat\b|votantes|votants|urnas|urnes|electoral/i },
  { k: "parlament", label: "Parlament", c: "#c39a5f", icon: `<path d="M3 20h18M5 20V10M10 20V10M14 20V10M19 20V10M2 10l10-6 10 6z"/>`, re: /congreso|congrés|senado|\bsenat\b|\bley\b|\bllei\b|decreto|decret|enmienda|esmena|\bpleno\b|\bple\b|diputad|escaño|\bescó|\bBOE\b/i },
  { k: "politica", label: "Política", c: "#6e6a82", icon: `<path d="M4 5h13a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 4v-4H4a2 2 0 01-2-2V7a2 2 0 012-2z"/>`, re: /./ },
];
const nwTopic = (k) => NW_TOPICS.find((t) => t.k === k) || NW_TOPICS[NW_TOPICS.length - 1];

// Partits esmentats al titular (sigles, líders i portaveus principals)
const NW_PARTY_RE = {
  pp: /\bPP\b|Feijóo|Feijoo|Partido Popular|Partit Popular|populares|Ayuso|Tellado|Gamarra|Moreno Bonilla|Juanma Moreno|Mañueco|Guardiola|Pérez Llorca/,
  psoe: /PSOE|\bPSC\b|Pedro Sánchez|\bSánchez\b|socialistas|socialistes|Salvador Illa|\bIlla\b|Bolaños|Ferraz|Moncloa/,
  vox: /\bVox\b|Abascal|Garriga|Buxadé|Gavira/,
  fa: /\bSumar\b|Yolanda Díaz|Frente Amplio|Front Ampli|Ada Colau|Comuns|Urtasun|Más Madrid|Compromís|Izquierda Unida|\bIU\b/,
  podemos: /Podemos|Belarra|Irene Montero/,
  erc: /\bERC\b|Junqueras|Rufián|Rufian|Esquerra Republicana/,
  junts: /\bJunts\b|Puigdemont|Nogueras|Turull/,
  bildu: /Bildu|Otegi/,
  pnv: /\bPNV\b|\bEAJ\b|Aitor Esteban|Pradales/,
  bng: /\bBNG\b|Pontón|Néstor Rego/,
  cc: /Coalición Canaria|Coalició Canària|Clavijo/,
  salf: /Alvise|Se Acabó La Fiesta|\bSALF\b/,
};
const NW_OUTLET_COLORS = ["#ff4b2b", "#3554ff", "#00a37a", "#7b3fe4", "#f59f24", "#e0306f", "#1e88d6", "#0f9a83", "#c39a5f", "#3f8f45", "#5d4037", "#6c2b7e", "#17173d"];
const nwOutletColor = (s) => NW_OUTLET_COLORS[hashString(s) % NW_OUTLET_COLORS.length];

function nwClassify(x) {
  if (x._t) return x;
  x._t = NW_TOPICS.find((t) => t.re.test(x.t)).k;
  x._p = Object.keys(NW_PARTY_RE).filter((id) => NW_PARTY_RE[id].test(x.t));
  return x;
}

// ---------- Dades ----------
const nwLooksLikeHeadline = (t) => t && !/[^.]\.$/.test(t.trim()); // els peus de foto acaben amb punt; els titulars, no

async function fetchLiveFeed(f) {
  try {
    const r = await fetch(f.u, { cache: "no-store" });
    if (!r.ok) return [];
    const doc = new DOMParser().parseFromString(await r.text(), "text/xml");
    const now = Date.now();
    return [...doc.querySelectorAll("item")].map((it) => {
      const txt = (n) => it.querySelector(n)?.textContent?.trim() || "";
      return { t: txt("title"), u: txt("link"), s: f.s, d: new Date(txt("pubDate")).getTime() };
    }).filter((x) => x.t && /^https?:\/\//.test(x.u) && Number.isFinite(x.d) && x.d <= now + 3600e3 && (!f.filter || NEWS_POLITICS.test(x.t))).slice(0, 8);
  } catch {
    return [];
  }
}

function mergeNews() {
  const seen = new Set();
  const items = [...newsLive, ...newsStatic, ...(newsLocal || [])].filter((x) => nwLooksLikeHeadline(x.t)).sort((a, b) => b.d - a.d).filter((x) => {
    const k = x.u.split("?")[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).filter((x) => Date.now() - x.d < 14 * 864e5).slice(0, 900).map(nwClassify);
  newsData = { updated: newsUpdated || Date.now(), items };
}

async function refreshNews() {
  const getJson = (u) => fetch(u, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  // El fitxer del propi web (publicat amb l'app) es llegeix un sol cop: aporta l'històric de dies anteriors
  const results = await Promise.all([
    NEWS_REMOTE ? getJson(NEWS_REMOTE) : Promise.resolve(null),
    newsLocal ? Promise.resolve(null) : getJson(`${window.PEJ_DATA || "data/"}news.json?t=${Math.floor(Date.now() / 120000)}`),
    ...NEWS_LIVE.map(fetchLiveFeed),
  ]);
  const [snap, local, ...live] = results;
  if (local?.items) { newsLocal = local.items; newsUpdated = Math.max(newsUpdated, local.updated || 0); }
  if (snap?.items) { newsStatic = snap.items; newsUpdated = Math.max(newsUpdated, snap.updated || 0); }
  if (live.some((l) => l.length)) { newsLive = live.flat(); newsUpdated = Math.max(newsUpdated, Date.now()); }
  mergeNews();
  renderNews();
  renderNewsTicker();
  fillPartyNews();
  document.dispatchEvent(new Event("news:update"));
}

async function loadNews() {
  renderNews();
  await refreshNews();
  clearInterval(newsTimer);
  newsTimer = setInterval(() => { if (!document.hidden) refreshNews(); }, NEWS_REFRESH_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - newsUpdated > NEWS_REFRESH_MS) refreshNews(); });
}

// Titulars per a altres seccions (comparador, capítols): per partit o per tema
function newsFor({ party, topic, days = 7, n = 3 } = {}) {
  if (!newsData) return [];
  const since = Date.now() - days * 864e5;
  return newsData.items.filter((x) => x.d >= since && (!party || x._p.includes(party)) && (!topic || x._t === topic)).slice(0, n);
}

// ---------- Peces visuals ----------
const timeAgo = (ms) => {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (m < 60) return `fa ${m} min`;
  const hh = Math.round(m / 60);
  if (hh < 24) return `fa ${hh} h`;
  const d = Math.round(hh / 24);
  return `fa ${d} ${d === 1 ? "dia" : "dies"}`;
};
const nwIcon = (t) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t.icon}</svg>`;
const nwOutlet = (s) => `<span class="nw-out" style="--oc:${nwOutletColor(s)}">${esc(s)}</span>`;
const nwParties = (x, max = 4) => x._p.slice(0, max).map((id) => { const p = PARTIES.find((q) => q.id === id); return p ? `<i class="nw-pc" style="--pc:${p.color}">${p.sig}</i>` : ""; }).join("");
const nwWhen = (x) => (Date.now() - x.d < 3600e3 ? `<span class="nw-now">${timeAgo(x.d)}</span>` : `<span class="nw-time">${timeAgo(x.d)}</span>`);

function nwCard(x, cls = "") {
  const t = nwTopic(x._t);
  return `<a class="nw-card ${cls}" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer" style="--tc:${t.c}">
    <span class="nw-art">${NW_ART[t.k]}<span class="nw-tag">${nwIcon(t)}${t.label}</span></span>
    <span class="nw-body">
      <span class="nw-meta">${nwOutlet(x.s)}${nwWhen(x)}</span>
      <span class="nw-h">${esc(x.t)}</span>
      <span class="nw-foot"><span class="nw-ps">${nwParties(x)}</span><span class="nw-go">Llegeix-ho ↗</span></span>
    </span>
  </a>`;
}

function nwStats(items) {
  const since = Date.now() - 48 * 3600e3;
  const recent = items.filter((x) => x.d >= since);
  const base = recent.length >= 10 ? recent : items;
  const parties = Object.keys(NW_PARTY_RE).map((id) => ({ id, n: base.filter((x) => x._p.includes(id)).length })).filter((p) => p.n).sort((a, b) => b.n - a.n);
  const topics = NW_TOPICS.map((t) => ({ t, n: base.filter((x) => x._t === t.k).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  return { base, parties, topics, recent: base === recent };
}

// ---------- Comparador de partits: últims titulars de cada partit ----------
function fillPartyNews() {
  $$(".cmp-news[data-party]").forEach((box) => {
    const id = box.dataset.party;
    const items = newsFor({ party: id, days: 7, n: 3 });
    box.innerHTML = newsData ? `<h5>Als titulars</h5>${items.length ? items.map((x) => `
      <a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer"><span>${esc(x.t)}</span><small>${esc(x.s)} · ${timeAgo(x.d)}</small></a>`).join("") : `<p class="muted">Sense titulars recents.</p>`}
      <button type="button" class="linklike" data-allnews="${id}">Tots els titulars d'aquest partit →</button>` : "";
    $("[data-allnews]", box)?.addEventListener("click", () => {
      Object.assign(newsUI, { party: id, topic: null, outlet: null, q: "", onlyNew: false, shown: 20 });
      location.hash = "#noticies/cerca";
    });
  });
}
