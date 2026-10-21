// Aprèn: guia del 29N en 8 capítols interactius, eines i diccionari.
// Contingut contrastat amb la Constitució, la LOREG, el Reglament del Congrés, el Reial decret 806/2026
// (BOE del 6 d'octubre) i les xifres de població de l'INE (1 d'abril del 2026).

const LI = "#17173d", LC = "#fffaf0", LY = "#ffcf3d", LR = "#ff4b2b", LB = "#3554ff", LG = "#0f9d58", LS = "#e2bf8c", LP = "#7b3fe4", LK = "#e0306f";
const lsvg = (body, vb = "0 0 160 110") => `<svg viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const apIcon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

// ---------- Il·lustracions ----------
const AP_ART = {
  hemi: (() => {
    const dots = [];
    [[26, 9], [38, 12], [50, 15]].forEach(([r, n]) => {
      for (let j = 0; j < n; j++) {
        const a = Math.PI * (1 - j / (n - 1));
        const f = j / (n - 1);
        dots.push(`<circle cx="${(80 + Math.cos(a) * r).toFixed(1)}" cy="${(90 - Math.sin(a) * r).toFixed(1)}" r="4.3" fill="${f < 0.42 ? LR : f < 0.52 ? LY : f < 0.6 ? LG : LB}" stroke="${LI}" stroke-width="1.6"/>`);
      }
    });
    return lsvg(`${dots.join("")}<path d="M20 96h120" stroke="${LI}" stroke-width="4"/>
      <g transform="rotate(-12 132 26)"><circle cx="132" cy="26" r="17" fill="${LC}" stroke="${LR}" stroke-width="3"/><text x="132" y="31" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="12" fill="${LR}">29N</text></g>`);
  })(),
  id: lsvg(`<rect x="20" y="22" width="104" height="66" rx="10" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="31" y="35" width="30" height="38" rx="6" fill="${LC}" stroke="${LI}" stroke-width="4"/>
    <circle cx="46" cy="49" r="6" fill="${LI}"/><path d="M36 68c2-7 18-7 20 0" stroke="${LI}" stroke-width="4"/><path d="M72 42h40M72 54h30M72 66h36" stroke="${LI}" stroke-width="4"/>
    <g transform="rotate(8 128 76)"><rect x="104" y="58" width="44" height="32" rx="4" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M104 61l22 15 22-15" stroke="${LI}" stroke-width="3.5"/></g>`),
  urn: lsvg(`<g transform="rotate(-8 80 30)"><rect x="60" y="4" width="40" height="44" rx="3" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M68 18h24M68 28h18" stroke="${LI}" stroke-width="3.5"/></g>
    <rect x="24" y="46" width="112" height="58" rx="8" fill="${LI}"/><rect x="56" y="40" width="48" height="10" rx="3" fill="${LC}" stroke="${LI}" stroke-width="3"/><path d="M48 76h64" stroke="${LY}" stroke-width="5"/>`),
  blanknul: lsvg(`<rect x="12" y="36" width="64" height="46" rx="5" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M12 40l32 23 32-23" stroke="${LI}" stroke-width="4"/>
    <g transform="rotate(6 116 54)"><rect x="92" y="14" width="50" height="70" rx="5" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M101 30h32M101 41h32M101 52h22" stroke="${LI}" stroke-width="3"/><path d="M98 22l38 54M136 22l-38 54" stroke="${LR}" stroke-width="5.5"/></g>`),
  bars: lsvg(`<path d="M16 96h128" stroke="${LI}" stroke-width="4"/>${[[24, 70, LR], [52, 52, LB], [80, 34, LY], [108, 10, "#c9c2b0"]].map(([x, hgt, f]) => `<rect x="${x}" y="${96 - hgt}" width="22" height="${hgt}" rx="3" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}
    <path d="M12 80h136" stroke="${LR}" stroke-width="3" stroke-dasharray="6 6"/>`),
  divide: lsvg(`${["÷1", "÷2", "÷3"].map((t, i) => `<rect x="${20 + i * 42}" y="14" width="36" height="22" rx="4" fill="${LI}"/><text x="${38 + i * 42}" y="30" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="12" fill="${LC}">${t}</text>`).join("")}
    ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 42}" y="${44 + r * 28}" width="36" height="22" rx="4" fill="${(r === 0 && c < 2) || (r === 1 && c === 0) ? LY : "#fff"}" stroke="${LI}" stroke-width="3"/>`).join("")).join("")}`),
  seats: lsvg(`${[LR, LR, LR, LB, LB, LY, LR].map((f, i) => `<rect x="${18 + (i % 4) * 32}" y="${18 + Math.floor(i / 4) * 40}" width="26" height="30" rx="6" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}`),
  mega: lsvg(`<path d="M34 46h16l50-26v70L50 64H34z" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="22" y="44" width="14" height="22" rx="4" fill="${LR}" stroke="${LI}" stroke-width="3.5"/>
    <path d="M52 66l7 24h13l-6-22" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M112 40c7 8 7 24 0 32M122 30c13 14 13 38 0 52" stroke="${LR}" stroke-width="4"/>`),
  board: lsvg(`<rect x="14" y="18" width="132" height="74" rx="10" fill="${LI}"/><text x="58" y="68" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="30" fill="${LY}">176</text>
    <rect x="104" y="30" width="32" height="20" rx="5" fill="${LG}" stroke="${LC}" stroke-width="2"/><text x="120" y="45" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">SÍ</text>
    <rect x="104" y="58" width="32" height="20" rx="5" fill="${LR}" stroke="${LC}" stroke-width="2"/><text x="120" y="73" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">NO</text>`),
  palace: lsvg(`<path d="M18 44L80 14l62 30z" fill="${LC}" stroke="${LI}" stroke-width="4"/><rect x="22" y="44" width="116" height="8" fill="${LI}"/>
    ${[32, 50, 68, 86, 104, 122].map((x) => `<rect x="${x}" y="54" width="8" height="30" fill="#fff" stroke="${LI}" stroke-width="3"/>`).join("")}
    <rect x="16" y="84" width="128" height="10" rx="2" fill="${LY}" stroke="${LI}" stroke-width="3"/><circle cx="80" cy="33" r="5" fill="${LR}"/>`),
  ballotW: lsvg(`<g transform="rotate(-4 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><rect x="48" y="16" width="64" height="14" rx="3" fill="${LR}"/>
    <path d="M52 44h56M52 56h56M52 68h56M52 80h40M52 92h48" stroke="${LI}" stroke-width="3.5"/></g>`),
  ballotS: lsvg(`<g transform="rotate(3 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="${LS}" stroke="${LI}" stroke-width="4"/>
    ${[24, 42, 60, 78].map((y, i) => `<rect x="50" y="${y}" width="12" height="12" rx="2" fill="#fff" stroke="${LI}" stroke-width="3"/><path d="M70 ${y + 6}h38" stroke="${LI}" stroke-width="3.5"/>${i !== 2 ? `<path d="M52 ${y + 6}l3 4 6-8" stroke="${LR}" stroke-width="3.5"/>` : ""}`).join("")}</g>`),
  pin: lsvg(`<rect x="22" y="30" width="96" height="62" rx="8" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M36 50h40M36 64h56M36 78h30" stroke="${LI}" stroke-width="4"/>
    <path d="M118 12c-12 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-8-20-20-20z" fill="${LR}" stroke="${LI}" stroke-width="4"/><circle cx="118" cy="32" r="7" fill="${LC}" stroke="${LI}" stroke-width="3"/>`),
  booth: lsvg(`<rect x="34" y="12" width="92" height="86" rx="6" fill="${LB}" stroke="${LI}" stroke-width="4"/><path d="M48 12v86M112 12v86" stroke="${LI}" stroke-width="3"/>
    <path d="M48 20c10 10 10 60 0 70M112 20c-10 10-10 60 0 70" stroke="${LC}" stroke-width="3"/><rect x="66" y="40" width="28" height="36" rx="3" fill="#fff" stroke="${LI}" stroke-width="3"/>`),
  envelope: lsvg(`<rect x="30" y="28" width="100" height="62" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M30 32l50 34 50-34" stroke="${LI}" stroke-width="4"/>`),
  door: lsvg(`<rect x="46" y="12" width="68" height="90" rx="4" fill="${LS}" stroke="${LI}" stroke-width="4"/><circle cx="100" cy="60" r="4" fill="${LI}"/>
    <path d="M20 102h120" stroke="${LI}" stroke-width="4"/><path d="M122 30l10-10M126 44h14M122 58l10 10" stroke="${LI}" stroke-width="4"/>`),
  nul: lsvg(`<rect x="44" y="10" width="72" height="92" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M54 30h52M54 44h52M54 58h40" stroke="${LI}" stroke-width="3.5"/>
    <path d="M50 24l60 64M110 24l-60 64" stroke="${LR}" stroke-width="7"/>`),
};

// ---------- Glossari ----------
// Paraules que no surten al joc «Paraula clau» però que la guia necessita.
const GLOSSARY_EXTRA = [
  { w: "CENS ELECTORAL", d: "Llista oficial de les persones amb dret a vot. L'elabora l'Oficina del Cens Electoral, que depèn de l'INE." },
  { w: "MESA ELECTORAL", d: "Tres electors (president i dos vocals) triats per sorteig que s'encarreguen de la votació i del recompte en un col·legi." },
  { w: "TARGETA CENSAL", d: "Carta que t'indica el col·legi i la mesa on votes. No cal portar-la per votar." },
  { w: "VOT PER CORREU", d: "Manera de votar sense anar al col·legi: es demana a Correus i el vot s'envia per correu certificat." },
  { w: "LLEI D'HONDT", d: "Fórmula que reparteix els escons de cada província: els vots de cada partit es divideixen entre 1, 2, 3… i els escons van als quocients més alts." },
  { w: "ESCÓ", d: "Seient que ocupa un diputat o un senador i, per extensió, el seu càrrec." },
  { w: "CANDIDATURA", d: "Llista de candidats que presenta un partit, una coalició o una agrupació d'electors." },
  { w: "MARGE D'ERROR", d: "Interval dins del qual és probable que es trobi el resultat real d'una enquesta. Com més gran és la mostra, més petit és el marge." },
  { w: "CAMPANYA ELECTORAL", d: "Període de 15 dies en què els partits poden demanar el vot. Acaba a les 24 h del divendres abans de la votació." },
  { w: "GOVERN EN FUNCIONS", d: "Govern que continua en el càrrec després de les eleccions fins que pren possessió el nou. Només pot gestionar el dia a dia." },
  { w: "PROJECTE DE LLEI", d: "Proposta de llei que presenta el Govern." },
  { w: "PROPOSICIÓ DE LLEI", d: "Proposta de llei que presenten els grups parlamentaris, el Senat, els parlaments autonòmics o la ciutadania." },
  { w: "ILP", d: "Iniciativa legislativa popular: proposta de llei que la ciutadania pot portar al Congrés amb 500.000 signatures." },
  { w: "LLEI ORGÀNICA", d: "Llei que regula drets fonamentals, estatuts d'autonomia o el règim electoral, entre d'altres. Necessita la majoria absoluta del Congrés." },
  { w: "SESSIÓ CONSTITUTIVA", d: "Primera sessió de les noves Corts, en què els diputats i els senadors elegeixen les Meses de cada cambra." },
  { w: "MESA DEL CONGRÉS", d: "Òrgan que dirigeix la cambra: la presidència, quatre vicepresidències i quatre secretaries." },
  { w: "GRUP PARLAMENTARI", d: "Agrupació de diputats d'un mateix partit o coalició que actua conjuntament a la cambra." },
  { w: "VETO", d: "Rebuig d'una llei pel Senat per majoria absoluta. El Congrés el pot aixecar." },
  { w: "DISSOLUCIÓ", d: "Final anticipat de la legislatura que decreta el president del Govern per convocar eleccions." },
];
const apNorm = (s) => String(s).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9' ]/g, "").trim();
const GLOSSARY = [...WORDS, ...GLOSSARY_EXTRA].sort((a, b) => a.w.localeCompare(b.w, "ca"));
const glossaryFind = (key) => GLOSSARY.find((g) => apNorm(g.w) === apNorm(key));

// [[text]] o [[text|PARAULA]] es converteix en un terme del glossari que es pot tocar
const rich = (s) => String(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label, key) => {
  const g = glossaryFind(key || label);
  return g ? `<button type="button" class="term" data-term="${esc(g.w)}">${label}</button>` : label;
});

// ---------- Dades per als exemples ----------
// Diputats per circumscripció el 29N (Reial decret 806/2026): Madrid en guanya un i Cadis en perd un respecte del 2023.
// Mapa de rajoles: [nom, codi, columna, fila]
const AP_TILES = [
  ["la Corunya", "C", 0, 0], ["Lugo", "LU", 1, 0], ["Astúries", "O", 2, 0], ["Cantàbria", "S", 3, 0], ["Biscaia", "BI", 4, 0], ["Guipúscoa", "SS", 5, 0],
  ["Pontevedra", "PO", 0, 1], ["Ourense", "OR", 1, 1], ["Lleó", "LE", 2, 1], ["Palència", "P", 3, 1], ["Burgos", "BU", 4, 1], ["Àlaba", "VI", 5, 1], ["Navarra", "NA", 6, 1], ["Osca", "HU", 7, 1], ["Lleida", "L", 8, 1], ["Girona", "GI", 9, 1],
  ["Zamora", "ZA", 2, 2], ["Valladolid", "VA", 3, 2], ["Segòvia", "SG", 4, 2], ["Sòria", "SO", 5, 2], ["La Rioja", "LO", 6, 2], ["Saragossa", "Z", 7, 2], ["Tarragona", "T", 8, 2], ["Barcelona", "B", 9, 2],
  ["Salamanca", "SA", 2, 3], ["Àvila", "AV", 3, 3], ["Madrid", "M", 4, 3], ["Guadalajara", "GU", 5, 3], ["Terol", "TE", 7, 3], ["Castelló", "CS", 8, 3],
  ["Càceres", "CC", 2, 4], ["Toledo", "TO", 4, 4], ["Conca", "CU", 5, 4], ["València", "V", 7, 4], ["Illes Balears", "PM", 9, 4],
  ["Badajoz", "BA", 2, 5], ["Ciudad Real", "CR", 4, 5], ["Albacete", "AB", 6, 5], ["Alacant", "A", 7, 5],
  ["Huelva", "H", 1, 6], ["Sevilla", "SE", 2, 6], ["Còrdova", "CO", 3, 6], ["Jaén", "J", 4, 6], ["Múrcia", "MU", 6, 6],
  ["Cadis", "CA", 2, 7], ["Màlaga", "MA", 3, 7], ["Granada", "GR", 4, 7], ["Almeria", "AL", 5, 7],
  ["Santa Cruz de Tenerife", "TF", 0, 8], ["Las Palmas", "GC", 1, 8], ["Ceuta", "CE", 3, 8], ["Melilla", "ML", 5, 8],
];
// Població a 1 d'abril del 2026 (INE) per comparar el pes del vot
const AP_POP = { Madrid: 7201554, Barcelona: 6028373, "València": 2827263, Sevilla: 2004487, Alacant: 2099866, "Sòria": 90559, Terol: 137488, Zamora: 165510, "Segòvia": 161261, "Àvila": 162743, Conca: 201233, "Palència": 160620, Osca: 234361, Ceuta: 84435, Melilla: 86616, Lugo: 328547 };
const AP_POP_TOTAL = 49801559;
const seatsOf = (name) => (PROVINCES.find((p) => p.name === name) || {}).seats || 0;

// ---------- Capítols ----------
const AP_CHAPTERS = [
  {
    slug: "que-votem", title: "Què votem el 29N", short: "Congrés, Senat i per què hi ha eleccions ara.", mins: 3, tone: LR, art: AP_ART.hemi,
    lead: "El 29 de novembre s'elegeixen les Corts Generals, és a dir, el Congrés i el Senat. Del nou Congrés en sortirà, també, el pròxim president del Govern.",
    blocks: [
      { t: "h", h: "Per què votem ara?" },
      { t: "p", h: "La legislatura que va començar després de les eleccions del 23 de juliol del 2023 havia de durar fins al 2027. El 2 d'octubre, però, el Congrés va tombar dos [[decrets llei|DECRET LLEI]] d'habitatge amb els vots de PP, Vox i Junts, i el president Pedro Sánchez va decidir avançar les eleccions. El Reial decret 806/2026, publicat al BOE el 6 d'octubre, dissol les Corts i convoca les eleccions per al 29 de novembre." },
      { t: "callout", tone: "info", title: "Eleccions anticipades", h: "La Constitució permet al president del Govern decretar la [[dissolució]] de les Corts abans d'hora (article 115). Les eleccions se celebren sempre 54 dies després de la convocatòria." },
      { t: "facts", items: [
        { n: 350, label: "diputats al Congrés", c: LR },
        { n: 209, label: "senadors elegits a les urnes", c: "#c39a5f" },
        { n: 176, label: "escons per a la majoria absoluta", c: LB },
        { n: 52, label: "circumscripcions: 50 províncies, Ceuta i Melilla", c: "#f2b600" },
        { n: 3, suffix: " %", label: "dels vots vàlids per entrar al repartiment", c: "#00a37a" },
        { n: 38.7, dec: 1, suffix: " M", label: "persones cridades a votar", c: LP },
      ] },
      { t: "h", h: "Dues cambres, dues paperetes" },
      { t: "compare",
        a: { title: "Congrés dels Diputats", tag: "Papereta blanca", tone: "#fff", art: AP_ART.ballotW, items: [
          "<b>350 diputats</b>, elegits per províncies.",
          "Llistes tancades: votes un partit, no persones.",
          "Elegeix el president del Govern a la [[investidura]].",
          "Aprova les lleis i els [[pressupostos]], i té l'última paraula.",
          "Pot fer caure el Govern amb una [[moció de censura]].",
        ] },
        b: { title: "Senat", tag: "Papereta sèpia", tone: LS, art: AP_ART.ballotS, items: [
          "<b>267 senadors</b>: 209 elegits el 29N i 58 designats pels parlaments autonòmics.",
          "Llista oberta: votes persones, de partits diferents si vols.",
          "És la cambra de representació territorial.",
          "Pot esmenar o vetar les lleis, però el Congrés les pot aprovar igualment.",
          "Ha d'autoritzar l'aplicació de l'article 155.",
        ] } },
      { t: "h", h: "El Congrés que es renova" },
      { t: "p", h: "Així va quedar el Congrés el 23 de juliol del 2023. Cap partit no tenia la [[majoria absoluta]], per això calia pactar. El 29N es tornen a repartir els 350 escons i comença la legislatura XVI." },
      { t: "widget", w: "hemicycle" },
    ],
    quiz: [
      { q: "Quants escons cal tenir per a la majoria absoluta al Congrés?", opts: ["176", "175", "200", "150"], exp: "La meitat de 350 és 175. La majoria absoluta és la meitat més un: 176." },
      { q: "Quina cambra elegeix el president del Govern?", opts: ["El Congrés", "El Senat", "Totes dues juntes", "Ningú: el nomena el Rei directament"], exp: "El president surt d'una votació d'investidura al Congrés. Després el Rei el nomena formalment." },
      { q: "Quants senadors s'elegeixen a les urnes el 29N?", opts: ["209", "350", "267", "150"], exp: "Se n'elegeixen 209. Amb els 58 que designen els parlaments autonòmics, el Senat tindrà 267 membres." },
    ],
    practice: { href: "#joc/majoria", label: "Juga a Fes majoria", text: "Arriba als 176 escons pactant amb els partits del Congrés." },
  },
  {
    slug: "qui-vota", title: "Qui pot votar i com", short: "Requisits, document, vot per correu i des de l'estranger.", mins: 3, tone: LB, art: AP_ART.id,
    lead: "Si tens la nacionalitat espanyola i 18 anys el dia de la votació, estàs cridat a votar. Ho pots fer al teu col·legi o per correu.",
    blocks: [
      { t: "h", h: "Qui pot votar" },
      { t: "list", items: [
        "Les persones amb <b>nacionalitat espanyola</b>. Les estrangeres no poden votar a les generals, encara que visquin aquí.",
        "Les que tinguin <b>18 anys complerts</b> el 29 de novembre.",
        "Les que estiguin inscrites al [[cens electoral]]. Es podia consultar i reclamar del 12 al 19 d'octubre.",
      ] },
      { t: "callout", tone: "info", title: "I la gent de la Unió Europea?", h: "Els ciutadans d'altres països de la UE que viuen a Espanya poden votar a les municipals i a les europees, però no a les generals." },
      { t: "h", h: "On em toca i què he de portar" },
      { t: "cards", items: [
        { title: "Mira on et toca", text: "La [[targeta censal]] t'arriba a casa a partir del 2 de novembre i t'indica el col·legi i la mesa. Si no la reps, pots votar igualment. També ho pots consultar al web de l'INE.", art: AP_ART.pin },
        { title: "Porta un document", text: "L'original del DNI, el passaport o el carnet de conduir, amb fotografia. Les fotocòpies no serveixen.", art: AP_ART.id },
      ] },
      { t: "h", h: "Vot per correu, pas a pas" },
      { t: "steps", items: [
        { title: "Demana'l fins al 19 de novembre", text: "A qualsevol oficina de Correus amb el DNI, o per internet amb certificat digital o DNI electrònic." },
        { title: "Rebràs la documentació a casa", text: "Les paperetes, els sobres i el certificat d'inscripció al cens." },
        { title: "Envia'l fins al 25 de novembre", text: "Posa la papereta al sobre de votació i, amb el certificat, dins del sobre gran. L'envies per correu certificat, gratuïtament." },
      ] },
      { t: "callout", tone: "warn", title: "Compte", h: "Si demanes el [[vot per correu]], ja no podràs votar en persona el dia 29." },
      { t: "h", h: "Altres situacions" },
      { t: "cards", items: [
        { title: "Si vius a l'estranger", text: "Pots enviar el vot per correu fins al 24 de novembre o dipositar-lo al consolat del 21 al 26 de novembre. Si només hi eres temporalment, calia demanar-ho fins al 31 d'octubre." },
        { title: "Vot accessible", text: "Les persones cegues o amb discapacitat visual podien demanar fins al 2 de novembre un kit en braille per votar de manera autònoma. Des del 2018, totes les persones amb discapacitat tenen dret a vot." },
        { title: "Si treballes el 29N", text: "Si el teu horari coincideix amb el de votació, pots tenir dret a un permís retribuït, de fins a quatre hores, per anar a votar." },
      ] },
    ],
    quiz: [
      { q: "Fins quan es pot demanar el vot per correu per al 29N?", opts: ["Fins al 19 de novembre", "Fins al 25 de novembre", "Fins al 28 de novembre", "El mateix dia 29"], exp: "Es pot demanar fins al 19 de novembre. El 25 és l'últim dia per enviar-lo." },
      { q: "Pots votar si no t'ha arribat la targeta censal?", opts: ["Sí, amb el DNI, el passaport o el carnet de conduir", "No, és obligatòria", "Només si ho autoritza la mesa", "Només per correu"], exp: "La targeta censal només informa. El que cal és un document original que t'identifiqui." },
      { q: "Una persona estrangera que viu a Barcelona des de fa 10 anys pot votar el 29N?", opts: ["No, a les generals cal la nacionalitat espanyola", "Sí, si està empadronada", "Sí, si és de la Unió Europea", "Només al Senat"], exp: "A les generals només hi vota qui té la nacionalitat espanyola. La gent de la UE pot votar a les municipals i a les europees." },
    ],
    practice: { href: "#joc/verificador", label: "Juga al Verificador", text: "Separa els fets reals dels falsos tan ràpid com puguis." },
  },
  {
    slug: "dia-d", title: "El dia D: a la mesa", short: "Paperetes, sobres i què passa dins del col·legi.", mins: 4, tone: "#f2b600", art: AP_ART.urn,
    lead: "Diumenge 29 de novembre, de 9 a 20 h. Què passa dins del col·legi electoral i com són les dues paperetes.",
    blocks: [
      { t: "steps", wide: true, items: [
        { title: "Busca la teva mesa", text: "A l'entrada hi ha llistes amb els noms. Cada mesa té dues urnes: la del Congrés i la del Senat.", art: AP_ART.pin },
        { title: "Agafa les paperetes", text: "Les trobaràs a les taules i a la cabina. També pots portar les que t'han enviat els partits a casa.", art: AP_ART.ballotW },
        { title: "Tria en privat", text: "Pots entrar a la cabina per posar les paperetes als sobres sense que ningú et vegi.", art: AP_ART.booth },
        { title: "Identifica't", text: "Ensenya el document a la mesa, que comprova que ets al cens.", art: AP_ART.id },
        { title: "Lliura els sobres", text: "Els dones al president de la mesa, que els posa a l'urna: el blanc a la del Congrés i el sèpia a la del Senat.", art: AP_ART.urn },
      ] },
      { t: "h", h: "Dues paperetes molt diferents" },
      { t: "compare",
        a: { title: "Congrés", tag: "Papereta i sobre blancs", tone: "#fff", art: AP_ART.ballotW, items: [
          "Cada partit té la seva papereta, amb una llista <b>tancada i bloquejada</b>.",
          "Votes la llista sencera, en l'ordre que ha decidit el partit.",
          "Si ratlles, afegeixes o canvies noms, el vot és nul.",
        ] },
        b: { title: "Senat", tag: "Papereta i sobre sèpia", tone: LS, art: AP_ART.ballotS, items: [
          "Una sola papereta amb tots els candidats de la circumscripció.",
          "Marques amb una creu les persones que vols, de qualsevol partit.",
          "A les províncies que n'elegeixen 4 pots marcar-ne fins a 3. Si en marques més, el vot és nul.",
        ] } },
      { t: "h", h: "Prova-ho: omple una papereta del Senat" },
      { t: "widget", w: "senate" },
      { t: "p", h: "No a tot arreu es poden fer tres creus: a Gran Canària, Mallorca i Tenerife (3 senadors) en pots fer 2; a Ceuta i Melilla (2 senadors), 1; i a les illes que n'elegeixen un, també 1." },
      { t: "h", h: "Qui hi ha a la mesa" },
      { t: "cards", items: [
        { title: "President i dos vocals", text: "Són electors del barri triats per sorteig entre el 31 d'octubre i el 4 de novembre. Formar part de la [[mesa electoral]] és obligatori i es cobra una dieta." },
        { title: "Interventors i apoderats", text: "Persones designades pels partits per vigilar la votació i el recompte. Els [[interventors|INTERVENTOR]] poden fer constar reclamacions a l'acta." },
      ] },
      { t: "h", h: "A les 20 h, el recompte" },
      { t: "p", h: "A les 20 h el president anuncia el tancament. Voten les persones que encara eren dins del local, s'afegeixen els vots arribats per correu i, finalment, voten els membres de la mesa i els interventors. El recompte és públic: qualsevol persona hi pot assistir. Els resultats provisionals arriben la mateixa nit, i l'[[escrutini]] oficial el fan les juntes electorals del 4 al 7 de desembre." },
    ],
    quiz: [
      { q: "De quin color és la papereta del Senat?", opts: ["Sèpia", "Blanca", "Blava", "Verda"], exp: "La del Congrés és blanca i la del Senat, sèpia. Els sobres segueixen els mateixos colors." },
      { q: "Què passa si ratlles un nom de la llista del Congrés?", opts: ["El vot és nul", "Aquell candidat queda eliminat", "Compta com a vot en blanc", "No passa res"], exp: "Al Congrés les llistes són tancades i bloquejades: qualsevol modificació fa que el vot sigui nul." },
      { q: "En una província que elegeix 4 senadors, quantes creus pots fer com a màxim?", opts: ["3", "4", "1", "2"], exp: "Fins a 3. És un sistema de vot limitat: així la segona força també pot obtenir senadors." },
    ],
    practice: { href: "#joc/contrarellotge", label: "Juga al Contrarellotge", text: "Respon tantes preguntes com puguis abans que s'acabi el temps." },
  },
  {
    slug: "blanc-nul", title: "Blanc, nul o abstenció", short: "Tres opcions que no són per a cap partit, però no són iguals.", mins: 3, tone: LP, art: AP_ART.blanknul,
    lead: "No és el mateix no anar a votar que votar en blanc o anul·lar el vot. Cada opció té efectes diferents sobre el resultat.",
    blocks: [
      { t: "types" },
      { t: "h", h: "Vàlid, blanc o nul? Posa't a prova" },
      { t: "widget", w: "sorter" },
      { t: "h", h: "L'efecte (petit) del vot en blanc" },
      { t: "p", h: "El vot en blanc és un vot vàlid. Per això fa una mica més difícil arribar al 3 % que cal per entrar al repartiment d'escons. Mou la barra i mira què li passa al partit E." },
      { t: "widget", w: "blank" },
      { t: "callout", tone: "info", title: "A la pràctica", h: "El [[llindar electoral]] del 3 % només pesa a les províncies que elegeixen molts diputats, com Madrid o Barcelona. A les petites, per treure un escó cal molt més del 3 % dels vots." },
      { t: "p", h: "L'[[abstenció]] no es compta enlloc: els escons es reparteixen igual entre els vots vàlids, tant si vota molta gent com si en vota poca." },
    ],
    quiz: [
      { q: "Un sobre buit, sense cap papereta, és…", opts: ["Un vot en blanc", "Un vot nul", "Abstenció", "Un vot per al partit més votat"], exp: "Un sobre sense papereta compta com a vot en blanc, que és un vot vàlid." },
      { q: "Quin d'aquests compta per calcular el llindar del 3 %?", opts: ["El vot en blanc", "El vot nul", "L'abstenció", "Cap dels tres"], exp: "El 3 % es calcula sobre els vots vàlids, que inclouen els vots en blanc." },
      { q: "Hi ha dues paperetes del mateix partit dins del sobre. Què passa?", opts: ["Compta com un sol vot vàlid", "És un vot nul", "Compta doble", "És un vot en blanc"], exp: "Si les paperetes són de la mateixa candidatura, compta com un sol vot. Si són de partits diferents, és nul." },
    ],
    practice: { href: "#joc/verificador", label: "Juga al Verificador", text: "Posa a prova el teu ull per als detalls." },
  },
  {
    slug: "vots-escons", title: "De vots a escons", short: "Províncies, la Llei d'Hondt i per què no tots els vots pesen igual.", mins: 4, tone: "#00a37a", art: AP_ART.seats,
    lead: "El 29N no hi ha una sola elecció, sinó 52: una per circumscripció. Cada província reparteix els seus diputats amb la Llei d'Hondt.",
    blocks: [
      { t: "h", h: "Quants diputats elegeix cada província" },
      { t: "p", h: "Cada província en té 2 com a mínim; Ceuta i Melilla, 1 cadascuna; i els 248 restants es reparteixen segons la població. Per al 29N, Madrid en guanya un (38) i Cadis en perd un (8). Toca una província per veure-ho." },
      { t: "widget", w: "provinces" },
      { t: "h", h: "No tots els vots pesen igual" },
      { t: "p", h: "Com que totes les províncies parteixen de 2 diputats, les menys poblades n'obtenen més dels que els tocarien per població. Un diputat de Sòria representa uns 45.000 habitants; un de Madrid, gairebé 190.000." },
      { t: "widget", w: "weight" },
      { t: "h", h: "Com funciona la Llei d'Hondt" },
      { t: "hondt" },
      { t: "p", h: "Prova-ho amb una província imaginària. Mou les barres i mira com canvien els escons i quin quocient guanya cada escó." },
      { t: "widget", w: "dhondt" },
      { t: "callout", tone: "tip", title: "Vols fer-ho amb dades reals?", h: "Al <a href=\"#apren/simulador\">simulador d'escons</a> pots escriure els vots de cada candidatura, el nombre d'escons i el vot en blanc." },
    ],
    quiz: [
      { q: "Quants diputats elegeix Madrid el 29N?", opts: ["38", "37", "32", "40"], exp: "En són 38, un més que el 2023, per l'augment de població. Cadis passa de 9 a 8." },
      { q: "Quin és el mínim de diputats de cada província (sense comptar Ceuta i Melilla)?", opts: ["2", "1", "3", "4"], exp: "Cada província en té 2 d'entrada. Ceuta i Melilla n'elegeixen 1 cadascuna." },
      { q: "Amb la Llei d'Hondt, els vots de cada partit es divideixen entre…", opts: ["1, 2, 3… fins al nombre d'escons", "El nombre d'electors de la província", "100", "El nombre de partits"], exp: "Es fan les divisions entre 1, 2, 3… i els escons van als quocients més alts." },
    ],
    practice: { href: "#apren/simulador", label: "Obre el simulador d'escons", text: "Fes el repartiment d'una província amb les teves dades." },
  },
  {
    slug: "campanya", title: "Campanya i enquestes", short: "Les regles abans de votar i com llegir una enquesta.", mins: 3, tone: LK, art: AP_ART.mega,
    lead: "Quinze dies de campanya, un de reflexió i cinc sense enquestes. Aquestes són les regles del joc abans d'anar a votar.",
    blocks: [
      { t: "widget", w: "campaign" },
      { t: "cards", items: [
        { title: "La campanya", text: "Del 13 al 27 de novembre els partits poden demanar el vot: mítings, cartells, anuncis i debats. Els espais gratuïts a les televisions i ràdios públiques es reparteixen segons els vots de les eleccions anteriors." },
        { title: "Jornada de reflexió", text: "El dissabte 28 no es pot fer campanya ni demanar el vot. La [[jornada de reflexió]] serveix perquè cadascú decideixi amb calma." },
        { title: "Cinc dies sense enquestes", text: "Del 24 al 28 de novembre no es poden publicar ni difondre enquestes electorals (article 69.7 de la LOREG). Per això el pactòmetre les amaga aquells dies." },
      ] },
      { t: "h", h: "Com s'ha de llegir una enquesta" },
      { t: "p", h: "Un [[sondeig]] pregunta a una mostra de persones (per exemple, 1.000) i n'extrapola el resultat. Sempre té un [[marge d'error]]: com més gran és la mostra, més petit és. Mou la barra i mira quan una diferència entre dos partits és real i quan és un empat tècnic." },
      { t: "widget", w: "margin" },
      { t: "list", items: [
        "Mira la <b>mida de la mostra</b> i les <b>dates</b> en què es va fer.",
        "Si la diferència entre dos partits és més petita que el marge d'error, és un <b>empat tècnic</b>.",
        "La <b>«cuina»</b> és com cada empresa ajusta les respostes. Per això enquestes fetes els mateixos dies donen resultats diferents.",
        "Fes més cas de la <b>mitjana de diverses enquestes</b> que d'una de sola.",
        "Els escons són una estimació: amb 52 repartiments provincials, petits canvis de vot poden moure escons.",
      ] },
    ],
    quiz: [
      { q: "Quan comença la campanya electoral del 29N?", opts: ["El 13 de novembre", "El 6 d'octubre", "El 24 de novembre", "El 28 de novembre"], exp: "Comença a les 0 h del 13 de novembre i acaba a les 24 h del 27: quinze dies." },
      { q: "Què no es pot fer durant la jornada de reflexió?", opts: ["Fer campanya i demanar el vot", "Anar a votar per correu", "Publicar notícies", "Sortir de casa"], exp: "El dia abans de la votació està prohibida la propaganda electoral." },
      { q: "Una enquesta dona el partit A al 30 % i el B al 28 %, amb un marge d'error de ±3 punts. Què en podem dir?", opts: ["Que és un empat tècnic", "Que A guanyarà segur", "Que B guanyarà segur", "Que l'enquesta és falsa"], exp: "Una diferència de 2 punts és més petita que el marge d'error: tots dos resultats podrien ser iguals." },
    ],
    practice: { href: "#apren/pactometre", label: "Obre el pactòmetre", text: "Mira què diuen les enquestes i qui podria sumar 176." },
  },
  {
    slug: "nou-govern", title: "Del recompte al nou Govern", short: "Escrutini, constitució de les Corts i investidura.", mins: 3, tone: "#1e88d6", art: AP_ART.board,
    lead: "Votar és només el primer pas. Després vénen l'escrutini, la constitució de les Corts i la investidura del president del Govern.",
    blocks: [
      { t: "widget", w: "after" },
      { t: "h", h: "Com funciona la investidura" },
      { t: "p", h: "Després de les consultes, el Rei proposa un candidat. Aquest presenta el seu programa al Congrés i demana la confiança de la cambra. A la primera votació necessita la majoria absoluta (176 sís). Si no hi arriba, 48 hores després n'hi ha prou amb tenir més sís que nos. Prova-ho:" },
      { t: "widget", w: "investiture" },
      { t: "callout", tone: "warn", title: "El rellotge dels dos mesos", h: "Si passen dos mesos des de la primera votació i cap candidat no ha estat investit, el Rei dissol les Corts i es tornen a convocar eleccions (article 99 de la Constitució)." },
      { t: "h", h: "Mentrestant, un Govern en funcions" },
      { t: "p", h: "Fins que no pren possessió el nou Govern, l'anterior continua [[en funcions|GOVERN EN FUNCIONS]]: gestiona el dia a dia però no pot, per exemple, presentar els pressupostos ni projectes de llei. Quan el president és investit, el Rei el nomena i ell tria els ministres." },
    ],
    quiz: [
      { q: "Què cal per ser investit a la segona votació?", opts: ["Més sís que nos", "176 sís", "Que ningú voti en contra", "Dos terços de la cambra"], exp: "A la segona votació, 48 hores després, n'hi ha prou amb la majoria simple: més sís que nos." },
      { q: "Quant de temps hi ha per investir un president abans de repetir les eleccions?", opts: ["Dos mesos des de la primera votació", "Un any", "Quinze dies", "No hi ha límit"], exp: "L'article 99 de la Constitució fixa dos mesos des de la primera votació d'investidura." },
      { q: "Quin dia es constitueixen les noves Corts?", opts: ["El 23 de desembre", "L'endemà de les eleccions", "L'1 de gener", "El 6 de desembre"], exp: "Ho fixa el decret de convocatòria: el 23 de desembre a les 10 h." },
    ],
    practice: { href: "#apren/pactometre", label: "Obre el pactòmetre", text: "Construeix majories i comprova si arriben a la investidura." },
  },
  {
    slug: "congres", title: "El Congrés per dins", short: "Com es fa una llei i com es controla el Govern.", mins: 4, tone: LI, art: AP_ART.palace,
    lead: "Què fan els diputats durant la legislatura? Sobretot tres coses: fer lleis, aprovar els pressupostos i controlar el Govern.",
    blocks: [
      { t: "h", h: "Com es fa una llei" },
      { t: "widget", w: "law" },
      { t: "callout", tone: "info", title: "Lleis orgàniques", h: "Les [[lleis orgàniques|LLEI ORGÀNICA]] (drets fonamentals, estatuts d'autonomia, sistema electoral…) necessiten, a més, la majoria absoluta del Congrés en una votació final." },
      { t: "h", h: "Grups parlamentaris" },
      { t: "p", h: "Per tenir [[grup propi|GRUP PARLAMENTARI]] calen 15 diputats, o bé 5 diputats i el 15 % dels vots a les circumscripcions on es presenta el partit (o el 5 % a tot l'Estat). Qui no ho aconsegueix va al [[Grup Mixt]]. Tenir grup vol dir més temps per parlar, més recursos i més presència a les comissions." },
      { t: "h", h: "Controlar el Govern" },
      { t: "cards", items: [
        { title: "Sessió de control", text: "Els dimecres de ple, els diputats pregunten al president i als ministres, que han de respondre." },
        { title: "Moció de censura", text: "Per fer caure el Govern cal proposar un candidat alternatiu i aconseguir 176 vots. Si prospera, aquell candidat és el nou president, com va passar el 2018." },
        { title: "Qüestió de confiança", text: "La planteja el president per comprovar que encara té suport. N'hi ha prou amb la majoria simple." },
        { title: "Decrets llei", text: "El Govern els aprova en casos d'urgència, però el Congrés els ha de convalidar en 30 dies. Si no, decauen, com va passar amb els d'habitatge el 2 d'octubre." },
      ] },
    ],
    quiz: [
      { q: "Quants vots necessita una moció de censura per prosperar?", opts: ["176", "175", "Més sís que nos", "210"], exp: "Cal la majoria absoluta del Congrés: 176 diputats." },
      { q: "En quant de temps ha de convalidar el Congrés un decret llei?", opts: ["30 dies", "6 mesos", "1 any", "No cal convalidar-lo"], exp: "L'article 86 de la Constitució dona 30 dies al Congrés per convalidar-lo o derogar-lo." },
      { q: "Si el Senat veta una llei, qui té l'última paraula?", opts: ["El Congrés", "El Senat", "El Tribunal Constitucional", "El Rei"], exp: "El Congrés pot aixecar el veto per majoria absoluta, o per majoria simple passats dos mesos." },
    ],
    practice: { href: "#joc/paraula", label: "Juga a Paraula clau", text: "Endevina els conceptes del vocabulari parlamentari." },
  },
];
AP_CHAPTERS.forEach((c, i) => { c.n = i + 1; });

const AP_TOOLS = [
  { slug: "partits", title: "Comparador de partits", text: "Ideari, propostes i líders, cara a cara.", tone: LR, icon: `<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/>` },
  { slug: "pactometre", title: "Pactòmetre", text: "Enquestes i majories possibles.", tone: LB, icon: `<path d="M3 18a9 9 0 0118 0"/><path d="M7.5 18a4.5 4.5 0 019 0"/><path d="M12 3v3"/>` },
  { slug: "simulador", title: "Simulador d'escons", text: "Fes la Llei d'Hondt amb les teves dades.", tone: "#00a37a", icon: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 16v-3M11 16V9M15 16v-5M19 16v-1"/>` },
  { href: "#calendari", title: "Calendari electoral", text: "Totes les dates fins al 29N.", tone: "#f2b600", icon: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>` },
  { slug: "actualitat", title: "Actualitat", text: "Els titulars dels mitjans, al minut.", tone: LK, icon: `<path d="M4 5h13v14H6a2 2 0 01-2-2z"/><path d="M17 9h3v8a2 2 0 01-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>` },
  { slug: "diccionari", title: "Diccionari", text: `${GLOSSARY.length} conceptes, explicats fàcil.`, tone: LP, icon: `<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>` },
];
const AP_TOOL_PAGES = ["partits", "pactometre", "simulador", "actualitat", "diccionari"];

// ---------- Progrés ----------
const learnData = () => Progress.data.learn || (Progress.data.learn = {});
const chapterDone = (c) => learnData()[c.slug] !== undefined;
const chapterPassed = (c) => (learnData()[c.slug] ?? -1) >= 2;

function awardLearnXp(xp) {
  const prev = Progress.levelIndex();
  Progress.data.xp += xp;
  Progress.save();
  renderLevel();
  const now = Progress.levelIndex();
  if (now > prev) toast(`Nou nivell: ${LEVELS[now].name}`, "ach");
  if (now >= 4) Progress.unlock("diputat");
  if (now >= 7) Progress.unlock("president");
}

// ---------- Encaminament dins de l'Aprèn ----------
function renderApren(arg) {
  const ch = AP_CHAPTERS.find((c) => c.slug === arg);
  const tool = AP_TOOL_PAGES.includes(arg) ? arg : null;
  $$("#view-apren > .ap-page").forEach((p) => { p.hidden = true; });
  closeTerm();
  if (ch) {
    $("#ap-chapter").hidden = false;
    renderChapter(ch);
  } else if (tool) {
    $(`#ap-tool-${tool}`).hidden = false;
    if (tool === "diccionari") renderDictionary();
  } else {
    $("#ap-hub").hidden = false;
    renderAprenHub();
  }
  updateReadBar();
}

// ---------- Portada de l'Aprèn ----------
function renderAprenHub() {
  const done = AP_CHAPTERS.filter(chapterDone).length;
  const passed = AP_CHAPTERS.filter(chapterPassed).length;
  const next = AP_CHAPTERS.find((c) => !chapterPassed(c));
  const R = 34, C = 2 * Math.PI * R;
  const word = GLOSSARY[hashString(todayKey()) % GLOSSARY.length];
  $("#ap-hub").innerHTML = `
    <header class="ap-hero">
      <div class="ap-hero-copy">
        <p class="kicker">Guia del 29N</p>
        <h1 class="page-title">Aprèn</h1>
        <p class="lede">Tot el que cal saber per votar amb criteri: 8 capítols curts, amb exemples per tocar i un petit test al final de cadascun.</p>
        <p class="ap-count"><span class="dot-live"></span> Falten <b id="cd-d">--</b> dies <b id="cd-h">--</b> h <b id="cd-m">--</b> min <b id="cd-s">--</b> s<span class="ap-count-tail"> per obrir les urnes</span></p>
      </div>
      <aside class="ap-prog card">
        <svg class="ap-ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${R}" class="bg"/><circle cx="40" cy="40" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - passed / AP_CHAPTERS.length)}"/></svg>
        <div class="ap-prog-n"><b>${passed}</b><span>/${AP_CHAPTERS.length}</span></div>
        <div class="ap-prog-txt">
          <b>${passed === AP_CHAPTERS.length ? "Guia completada!" : passed ? "Vas per bon camí" : "Comença la guia"}</b>
          <span>${passed === AP_CHAPTERS.length ? "Ja ets un votant informat. Pots repassar qualsevol capítol." : `${passed} capítols superats${done > passed ? ` · ${done - passed} per repetir` : ""}`}</span>
          ${next ? `<a class="btn primary" href="#apren/${next.slug}">${passed || done ? "Continua" : "Comença"}: ${next.n}. ${esc(next.title)} →</a>` : ""}
        </div>
      </aside>
    </header>

    <h2 class="ap-h2"><span>La guia</span> en 8 capítols</h2>
    <div class="ap-chapters">${AP_CHAPTERS.map((c) => {
      const score = learnData()[c.slug];
      const status = score === undefined ? `<span class="ap-st new">${c.mins} min</span>` : score >= 2 ? `<span class="ap-st ok">✓ ${score}/3</span>` : `<span class="ap-st retry">${score}/3 · repeteix</span>`;
      return `<a class="ap-ch ${score !== undefined && score >= 2 ? "is-done" : ""}" href="#apren/${c.slug}" style="--tone:${c.tone};--i:${c.n}">
        <span class="ap-ch-art">${c.art}</span>
        <span class="ap-ch-n">${String(c.n).padStart(2, "0")}</span>
        <span class="ap-ch-body"><b>${esc(c.title)}</b><small>${esc(c.short)}</small></span>
        ${status}
      </a>`;
    }).join("")}</div>

    <h2 class="ap-h2"><span>Eines</span> per entendre el 29N</h2>
    <div class="ap-tools">${AP_TOOLS.map((t) => `
      <a class="ap-tool" href="${t.href || `#apren/${t.slug}`}" style="--tone:${t.tone}">
        <span class="ap-tool-ico">${apIcon(t.icon)}</span>
        <span><b>${esc(t.title)}</b><small>${esc(t.text)}</small></span>
        <span class="ap-go" aria-hidden="true">→</span>
      </a>`).join("")}</div>

    <a class="ap-word" href="#apren/diccionari">
      <span class="kicker">Paraula del dia</span>
      <b>${esc(word.w.charAt(0) + word.w.slice(1).toLowerCase())}</b>
      <span>${esc(word.d)}</span>
    </a>`;
  tickCountdownOnce();
}

// El compte enrere global només actualitza si hi ha els elements; aquí l'omplim de seguida
function tickCountdownOnce() {
  const diff = ELECTION_DATE - Date.now();
  if (diff <= 0 || !$("#cd-d")) return;
  const s = Math.floor(diff / 1000);
  $("#cd-d").textContent = Math.floor(s / 86400);
  $("#cd-h").textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  $("#cd-m").textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  $("#cd-s").textContent = String(s % 60).padStart(2, "0");
}

// ---------- Capítol ----------
function renderChapter(ch) {
  const i = ch.n - 1;
  const prev = AP_CHAPTERS[i - 1], next = AP_CHAPTERS[i + 1];
  const root = $("#ap-chapter");
  root.style.setProperty("--tone", ch.tone);
  root.innerHTML = `
    <nav class="ap-crumb"><a href="#apren">← Aprèn</a><span>Capítol ${ch.n} de ${AP_CHAPTERS.length}</span></nav>
    <header class="ap-ch-head">
      <div class="ap-ch-headart">${ch.art}</div>
      <div>
        <p class="kicker">Capítol ${ch.n} · ${ch.mins} min de lectura</p>
        <h1 class="ap-title">${esc(ch.title)}</h1>
        <p class="ap-lead">${rich(ch.lead)}</p>
      </div>
    </header>
    <div class="ap-body">${ch.blocks.map((b, k) => renderBlock(b, k)).join("")}</div>
    <section class="ap-quiz card" id="ap-quiz" aria-label="Comprova-ho"></section>
    ${ch.practice ? `<a class="ap-practice" href="${ch.practice.href}"><span class="kicker">Posa-ho en pràctica</span><b>${esc(ch.practice.label)} →</b><small>${esc(ch.practice.text)}</small></a>` : ""}
    <nav class="ap-pager">
      ${prev ? `<a href="#apren/${prev.slug}" class="prev"><small>← Anterior</small><b>${prev.n}. ${esc(prev.title)}</b></a>` : `<a href="#apren" class="prev"><small>←</small><b>Tornar a l'Aprèn</b></a>`}
      ${next ? `<a href="#apren/${next.slug}" class="next"><small>Següent →</small><b>${next.n}. ${esc(next.title)}</b></a>` : `<a href="#apren" class="next"><small>Fi de la guia →</small><b>Tornar a l'Aprèn</b></a>`}
    </nav>`;
  // Exemples interactius i animacions
  $$(".ap-w", root).forEach((el) => AP_WIDGETS[el.dataset.w]?.mount(el));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    if (en.target.id === "hero-hemi") en.target.classList.add("play");
    else countUp(en.target);
  }), { threshold: 0.3 });
  $$("[data-count]", root).forEach((el) => io.observe(el));
  if ($("#hero-hemi", root)) io.observe($("#hero-hemi", root));
  renderQuiz(ch);
}

function renderBlock(b, k) {
  switch (b.t) {
    case "h": return `<h2 class="ap-h">${esc(b.h)}</h2>`;
    case "p": return `<p class="ap-p">${rich(b.h)}</p>`;
    case "callout": return `<aside class="ap-call ${b.tone || "info"}"><b>${esc(b.title)}</b><p>${rich(b.h)}</p></aside>`;
    case "list": return `<ul class="ap-list">${b.items.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>`;
    case "facts": return `<div class="num-grid ap-facts">${b.items.map((x, i) => `
      <div class="num-tile" style="--nc:${x.c};--i:${i}">
        <strong data-count="${x.n}" data-dec="${x.dec || 0}" data-suffix="${x.suffix || ""}">0${x.suffix || ""}</strong>
        <span>${esc(x.label)}</span>
      </div>`).join("")}</div>`;
    case "cards": return `<div class="ap-cards ${b.items.length === 4 ? "four" : ""}">${b.items.map((c) => `
      <article class="ap-card">${c.art ? `<div class="ap-card-art">${c.art}</div>` : ""}<b>${esc(c.title)}</b><p>${rich(c.text)}</p></article>`).join("")}</div>`;
    case "steps": return `<ol class="ap-steps ${b.wide ? "wide" : ""}">${b.items.map((s, i) => `
      <li class="ap-step" style="--i:${i}">${s.art ? `<div class="ap-step-art">${s.art}</div>` : ""}<span class="ap-step-n">${i + 1}</span><b>${esc(s.title)}</b><p>${rich(s.text)}</p></li>`).join("")}</ol>`;
    case "compare": return `<div class="ap-compare">${[b.a, b.b].map((s) => `
      <article class="ap-cmp" style="--st:${s.tone}">
        <header><div class="ap-cmp-art">${s.art}</div><div><b>${esc(s.title)}</b><small>${esc(s.tag)}</small></div></header>
        <ul>${s.items.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>
      </article>`).join("")}</div>`;
    case "types": return `<div class="vote-types">${AP_VOTE_TYPES.map((v) => `
      <article class="vtype" style="--vc:${v.c}">
        <div class="vt-art">${v.art}</div>
        <h3>${v.t}</h3><p>${v.d}</p>
        <ul>${v.facts.map(([ok, f]) => `<li class="${ok ? "yes" : "no"}"><i>${ok ? "✓" : "✕"}</i>${f}</li>`).join("")}</ul>
      </article>`).join("")}</div>`;
    case "hondt": return `<div class="hondt-steps">${AP_HONDT_STEPS.map((s) => `
      <div class="hstep"><div class="hs-art">${s.art}</div><h3>${s.t}</h3><p>${s.d}</p></div>`).join("")}</div>`;
    case "widget": return `<div class="ap-w" data-w="${b.w}" data-k="${k}"></div>`;
    default: return "";
  }
}

const AP_VOTE_TYPES = [
  { t: "Vot en blanc", d: "Un sobre buit, o una papereta del Senat sense cap creu.", c: "#fff", art: AP_ART.envelope,
    facts: [[true, "És un vot vàlid"], [true, "Compta per calcular el 3 %"], [false, "No dona escons a ningú"]] },
  { t: "Vot nul", d: "Papereta modificada, de més d'un partit, amb objectes o que no és l'oficial.", c: "#ffd5cb", art: AP_ART.nul,
    facts: [[false, "No és un vot vàlid"], [false, "No compta per al 3 %"], [false, "No dona escons a ningú"]] },
  { t: "Abstenció", d: "No anar a votar.", c: "#e6d9bf", art: AP_ART.door,
    facts: [[false, "No es compta enlloc"], [false, "No afecta el càlcul del 3 %"], [false, "Els escons es reparteixen igualment"]] },
];
const AP_HONDT_STEPS = [
  { t: "1 · Llindar", d: "Queden fora les candidatures que no arriben al 3 % dels vots vàlids de la província.", art: AP_ART.bars },
  { t: "2 · Divideix", d: "Els vots de cada partit es divideixen entre 1, 2, 3… fins al nombre d'escons.", art: AP_ART.divide },
  { t: "3 · Reparteix", d: "Els escons van als quocients més alts. Afavoreix els partits grans a les províncies petites.", art: AP_ART.seats },
];

// ---------- Test de cada capítol ----------
function renderQuiz(ch) {
  const box = $("#ap-quiz");
  let i = 0, hits = 0;
  const qs = ch.quiz.map((q) => {
    const order = shuffle(q.opts.map((_, k) => k));
    return { ...q, order };
  });
  const prevScore = learnData()[ch.slug];
  function intro() {
    box.innerHTML = `
      <div class="ap-quiz-head"><span class="ap-quiz-ico">✓</span><div><p class="kicker">Comprova-ho</p><h2>Tres preguntes per fixar-ho</h2>
      <p class="muted">${prevScore === undefined ? `Supera'l amb 2 encerts o més i guanya fins a ${10 + 5 * 3} XP.` : `El teu millor resultat: ${prevScore}/3.`}</p></div></div>
      <button class="btn primary lg" data-start>${prevScore === undefined ? "Comença el test" : "Torna-hi"}</button>`;
    $("[data-start]", box).addEventListener("click", () => { i = 0; hits = 0; question(); });
  }
  function question() {
    const q = qs[i];
    box.innerHTML = `
      <div class="ap-quiz-top"><span class="kicker">Pregunta ${i + 1} de ${qs.length}</span><span class="ap-dots">${qs.map((_, k) => `<i class="${k < i ? "done" : k === i ? "on" : ""}"></i>`).join("")}</span></div>
      <h3 class="ap-q">${esc(q.q)}</h3>
      <div class="choices">${q.order.map((k, n) => `<button class="choice" data-k="${k}"><span class="key">${"ABCD"[n]}</span><span class="ctext">${esc(q.opts[k])}</span></button>`).join("")}</div>`;
    $$(".choice", box).forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.k))));
  }
  function answer(k) {
    const q = qs[i];
    const ok = k === 0;
    if (ok) hits++;
    Sfx.play(ok ? "ok" : "ko");
    $$(".choice", box).forEach((b) => {
      b.disabled = true;
      const bk = Number(b.dataset.k);
      if (bk === 0) b.classList.add("correct");
      else if (bk === k) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    box.insertAdjacentHTML("beforeend", `<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong>${ok ? "Correcte!" : "No ben bé"}</strong><span>${rich(q.exp)}</span></div>
      <div class="next-row"><button class="btn primary" data-next>${i + 1 < qs.length ? "Següent" : "Veure el resultat"}</button></div>`);
    $("[data-next]", box).addEventListener("click", () => { i++; i < qs.length ? question() : finish(); });
  }
  function finish() {
    const ld = learnData();
    const first = ld[ch.slug] === undefined;
    const prevBest = ld[ch.slug] ?? -1;
    ld[ch.slug] = Math.max(prevBest, hits);
    const xp = first ? 10 + 5 * hits : 0;
    if (xp) awardLearnXp(xp); else Progress.save();
    window.Track?.("chapter_complete", { chapter: ch.slug, score: hits });
    if (AP_CHAPTERS.every(chapterPassed)) Progress.unlock("informat");
    const passed = hits >= 2;
    if (passed) confetti?.();
    const next = AP_CHAPTERS[ch.n];
    box.innerHTML = `
      <div class="ap-result ${passed ? "ok" : "ko"}">
        <div class="ap-result-score"><b>${hits}</b><span>/${qs.length}</span></div>
        <div>
          <h3>${passed ? "Capítol superat!" : "Gairebé!"}</h3>
          <p>${passed ? (hits === 3 ? "Ple: ho has entès tot." : "Bona feina. Pots repetir-lo per fer el ple.") : "Rellegeix el capítol i torna-ho a provar: necessites 2 encerts."}${xp ? ` <b>+${xp} XP</b>` : ""}</p>
        </div>
      </div>
      <div class="row">
        <button class="btn ghost" data-again>Torna-hi</button>
        ${next ? `<a class="btn primary" href="#apren/${next.slug}">Capítol ${next.n}: ${esc(next.title)} →</a>` : `<a class="btn primary" href="#apren">Tornar a l'Aprèn</a>`}
      </div>`;
    $("[data-again]", box).addEventListener("click", () => { i = 0; hits = 0; question(); });
  }
  intro();
}

// ---------- Exemples interactius ----------
const AP_WIDGETS = {
  hemicycle: {
    mount(el) {
      el.innerHTML = `<div class="ap-hemi">
        <div class="hero-art"><div class="hero-hemi" id="hero-hemi" role="img" aria-label="Composició del Congrés sorgit de les eleccions del 23 de juliol del 2023"></div></div>
        <div class="ap-hemi-side"><div class="maj-box"><strong>176</strong><span>escons per a la majoria absoluta. Cap partit en tenia prou sol.</span></div><div class="hemi-legend" id="hemi-legend"></div></div>
      </div>`;
      renderHeroHemicycle();
    },
  },

  senate: {
    mount(el) {
      const parties = [
        { p: "Partit Blau", c: LB, names: ["Anna Puig", "Jordi Mas", "Laia Roca"] },
        { p: "Partit Verd", c: LG, names: ["Pere Vila", "Marta Sala", "Joan Coll"] },
        { p: "Partit Taronja", c: "#f59f24", names: ["Núria Ferrer", "Xavier Bosch"] },
      ];
      el.innerHTML = `<div class="ap-senate">
        <div class="ap-senate-paper">
          <p class="ap-senate-top">ELECCIONS AL SENAT · PROVÍNCIA IMAGINÀRIA<br><small>4 senadors · marca fins a 3 noms</small></p>
          ${parties.map((g) => `<div class="ap-senate-party"><b style="--pc:${g.c}">${g.p}</b>${g.names.map((n) => `
            <label class="ap-senate-row"><input type="checkbox"><span class="box"></span><span>${n}</span></label>`).join("")}</div>`).join("")}
        </div>
        <div class="ap-senate-out" aria-live="polite"></div>
      </div>`;
      const out = $(".ap-senate-out", el);
      const update = () => {
        const n = $$("input:checked", el).length;
        const st = n === 0 ? ["blank", "Vot en blanc", "Una papereta del Senat sense cap creu compta com a vot en blanc: és vàlid, però no ajuda cap candidat."]
          : n <= 3 ? ["ok", `Vot vàlid · ${n} ${n === 1 ? "creu" : "creus"}`, `Cada persona marcada suma un vot. ${n < 3 ? `Encara en pots marcar ${3 - n} més.` : "Ja n'has marcat el màxim."}`]
          : ["ko", "Vot nul", `Has marcat ${n} noms i el màxim és 3. Amb més creus de les permeses, el vot no compta per a ningú.`];
        out.className = `ap-senate-out ${st[0]}`;
        out.innerHTML = `<b>${st[1]}</b><p>${st[2]}</p>`;
      };
      $$("input", el).forEach((x) => x.addEventListener("change", () => { Sfx.play("pick"); update(); }));
      update();
    },
  },

  sorter: {
    mount(el) {
      const OPTS = [["valid", "Vàlid"], ["blanc", "En blanc"], ["nul", "Nul"]];
      const cases = [
        { t: "Un sobre del Congrés buit, sense papereta", a: "blanc", e: "Un sobre sense papereta és vot en blanc." },
        { t: "Papereta del Congrés d'un partit, sense cap marca", a: "valid", e: "És la manera normal de votar al Congrés." },
        { t: "Papereta del Congrés amb el nom d'un candidat ratllat", a: "nul", e: "La llista és tancada i bloquejada: si la modifiques, el vot és nul." },
        { t: "Dues paperetes iguals, del mateix partit, dins del sobre", a: "valid", e: "Compta com un sol vot vàlid per a aquell partit." },
        { t: "Paperetes de dos partits diferents dins del sobre", a: "nul", e: "No se sap a qui volies votar: és nul." },
        { t: "Papereta del Senat sense cap creu", a: "blanc", e: "Al Senat, una papereta sense cap nom marcat és vot en blanc." },
        { t: "Papereta del Senat amb 4 creus en una província de 4 senadors", a: "nul", e: "El màxim és 3. Si en marques més, el vot és nul." },
        { t: "Papereta amb un missatge escrit a mà", a: "nul", e: "Qualsevol alteració voluntària de la papereta la fa nul·la." },
      ];
      let hits = 0, answered = 0;
      el.innerHTML = `<div class="ap-sorter">
        <div class="ap-sorter-score"><b>0</b>/${cases.length} encerts</div>
        ${cases.map((c, i) => `<div class="ap-sort" data-i="${i}">
          <p>${esc(c.t)}</p>
          <div class="ap-sort-opts">${OPTS.map(([k, l]) => `<button type="button" data-a="${k}">${l}</button>`).join("")}</div>
          <small class="ap-sort-exp" hidden></small>
        </div>`).join("")}
      </div>`;
      $$(".ap-sort", el).forEach((row) => {
        const c = cases[Number(row.dataset.i)];
        $$("button", row).forEach((b) => b.addEventListener("click", () => {
          if (row.classList.contains("done")) return;
          row.classList.add("done");
          const ok = b.dataset.a === c.a;
          if (ok) hits++;
          answered++;
          Sfx.play(ok ? "ok" : "ko");
          $$("button", row).forEach((x) => {
            x.disabled = true;
            if (x.dataset.a === c.a) x.classList.add("right");
            else if (x === b) x.classList.add("wrong");
          });
          row.classList.add(ok ? "ok" : "ko");
          const exp = $(".ap-sort-exp", row);
          exp.hidden = false;
          exp.textContent = `${ok ? "✓" : "✕"} ${c.e}`;
          $(".ap-sorter-score b", el).textContent = hits;
          if (answered === cases.length) $(".ap-sorter-score", el).insertAdjacentHTML("beforeend", ` · ${hits === cases.length ? "Perfecte!" : hits >= 6 ? "Molt bé!" : "Repassa els que has fallat"}`);
        }));
      });
    },
  },

  blank: {
    mount(el) {
      const base = [["A", 120000, LR], ["B", 95000, LB], ["C", 40000, "#f2b600"], ["D", 22000, LG], ["E", 8800, LP]];
      el.innerHTML = `<div class="ap-blank card">
        <label class="ap-range"><span>Vots en blanc: <b class="v">0</b></span><input type="range" min="0" max="20000" step="500" value="0"></label>
        <div class="ap-blank-bars"></div>
        <p class="ap-blank-out" aria-live="polite"></p>
      </div>`;
      const inp = $("input", el);
      const draw = () => {
        const blank = Number(inp.value);
        const valid = base.reduce((s, p) => s + p[1], 0) + blank;
        const min = valid * 0.03;
        $(".v", el).textContent = fmt(blank);
        const max = base[0][1];
        $(".ap-blank-bars", el).innerHTML = base.map(([n, v, c]) => `
          <div class="ap-bb ${v < min ? "out" : ""}"><span>Partit ${n}</span><div class="track"><i style="width:${(v / max) * 100}%;background:${c}"></i><em style="left:${(min / max) * 100}%"></em></div><b>${((v / valid) * 100).toFixed(2).replace(".", ",")} %</b></div>`).join("");
        const e = base[4][1];
        $(".ap-blank-out", el).innerHTML = e >= min
          ? `El llindar és de <b>${fmt(Math.ceil(min))} vots</b> (3 % de ${fmt(valid)} vots vàlids). El partit E, amb ${fmt(e)}, <b>entra</b> al repartiment.`
          : `Ara el llindar puja a <b>${fmt(Math.ceil(min))} vots</b>. El partit E, amb ${fmt(e)}, <b>es queda fora</b> del repartiment per culpa dels vots en blanc.`;
      };
      inp.addEventListener("input", draw);
      draw();
    },
  },

  provinces: {
    mount(el) {
      const max = Math.max(...PROVINCES.map((p) => p.seats));
      const tone = (s) => (s >= 30 ? 5 : s >= 10 ? 4 : s >= 6 ? 3 : s >= 4 ? 2 : 1);
      el.innerHTML = `<div class="ap-map card">
        <div class="ap-tiles" role="list">${AP_TILES.map(([name, code, x, y]) => {
          const s = seatsOf(name);
          return `<button type="button" role="listitem" class="ap-tile t${tone(s)}" style="--x:${x};--y:${y}" data-name="${esc(name)}" aria-label="${esc(name)}: ${s} diputats"><small>${code}</small><b>${s}</b></button>`;
        }).join("")}
          <span class="ap-canary" aria-hidden="true">Canàries</span>
        </div>
        <div class="ap-map-side">
          <div class="ap-map-info" aria-live="polite"></div>
          <div class="ap-map-legend">${[[1, "1-3"], [2, "4-5"], [3, "6-8"], [4, "9-16"], [5, "30+"]].map(([t, l]) => `<span><i class="t${t}"></i>${l}</span>`).join("")}</div>
        </div>
      </div>`;
      const info = $(".ap-map-info", el);
      const show = (name) => {
        const s = seatsOf(name), pop = AP_POP[name];
        $$(".ap-tile", el).forEach((t) => t.classList.toggle("sel", t.dataset.name === name));
        info.innerHTML = `<b>${esc(name)}</b><span class="big">${s}</span><span>${s === 1 ? "diputat" : "diputats"}</span>${pop ? `<small>${fmt(Math.round(pop / s / 100) * 100)} habitants per diputat</small>` : ""}${name === "Madrid" ? `<small>Un diputat més que el 2023</small>` : name === "Cadis" ? `<small>Un diputat menys que el 2023</small>` : ""}`;
      };
      $$(".ap-tile", el).forEach((t) => t.addEventListener("click", () => { Sfx.play("pick"); show(t.dataset.name); }));
      show("Madrid");
      void max;
    },
  },

  weight: {
    mount(el) {
      const rows = ["Madrid", "Barcelona", "València", "Sevilla", null, "Lugo", "Zamora", "Terol", "Sòria"].map((n) => n
        ? { n, v: AP_POP[n] / seatsOf(n) }
        : { n: "Mitjana d'Espanya", v: AP_POP_TOTAL / 350, avg: true });
      const max = Math.max(...rows.map((r) => r.v));
      el.innerHTML = `<div class="ap-weight card">
        <p class="kicker">Habitants per diputat</p>
        ${rows.map((r) => `<div class="ap-wrow ${r.avg ? "avg" : ""}"><span>${esc(r.n)}</span><div class="track"><i style="width:${(r.v / max) * 100}%"></i></div><b>${fmt(Math.round(r.v / 100) * 100)}</b></div>`).join("")}
        <p class="ap-note">Un vot a Sòria pesa unes <b>${(rows[0].v / rows[rows.length - 1].v).toFixed(1).replace(".", ",")} vegades</b> més que un a Madrid. Població a 1 d'abril del 2026 (INE).</p>
      </div>`;
    },
  },

  dhondt: {
    mount(el) {
      const P = [["Blau", LB, 42], ["Vermell", LR, 30], ["Groc", "#f2b600", 17], ["Verd", LG, 8]];
      let seats = 5;
      el.innerHTML = `<div class="ap-dh card">
        <div class="ap-dh-controls">
          ${P.map(([n, c, v], i) => `<label class="ap-range" style="--pc:${c}"><span><i></i>${n}: <b data-v="${i}">${v}.000</b> vots</span><input type="range" min="0" max="80" step="1" value="${v}" data-i="${i}"></label>`).join("")}
          <div class="ap-dh-seats"><span>Escons de la província:</span>${[3, 5, 7].map((s) => `<button type="button" data-s="${s}" class="${s === seats ? "on" : ""}">${s}</button>`).join("")}</div>
        </div>
        <div class="ap-dh-out">
          <div class="ap-dh-chips" aria-live="polite"></div>
          <div class="ap-dh-table"></div>
          <p class="ap-note"></p>
        </div>
      </div>`;
      const draw = () => {
        const votes = P.map((_, i) => Number($(`input[data-i="${i}"]`, el).value) * 1000);
        P.forEach((_, i) => { $(`[data-v="${i}"]`, el).textContent = fmt(votes[i]); });
        const valid = votes.reduce((a, b) => a + b, 0) || 1;
        const elig = votes.map((v) => v >= valid * 0.03 && v > 0);
        const { won, winners } = dhondt(votes.map((v, i) => (elig[i] ? v : 0)), seats);
        const rank = new Map(winners.map((w, k) => [`${w.pi}-${w.d}`, k + 1]));
        $(".ap-dh-chips", el).innerHTML = `${winners.map((w, k) => `<span class="ap-seat" style="--pc:${P[w.pi][1]};--k:${k}" title="Escó ${k + 1}: ${P[w.pi][0]}">${k + 1}</span>`).join("")}
          <span class="ap-dh-sum">${P.map(([n, c], i) => `<em style="--pc:${c}">${n} ${won[i]}</em>`).join("")}</span>`;
        $(".ap-dh-table", el).innerHTML = `<table class="q-table"><tr><th></th>${Array.from({ length: seats }, (_, d) => `<th>÷${d + 1}</th>`).join("")}</tr>
          ${P.map(([n, c], i) => `<tr><td><i class="sw" style="background:${c}"></i>${n}</td>${Array.from({ length: seats }, (_, d) => {
            const r = rank.get(`${i}-${d + 1}`);
            return `<td class="${r ? "win" : ""}">${elig[i] ? fmt(Math.round(votes[i] / (d + 1))) : "—"}${r ? `<span class="rank">#${r}</span>` : ""}</td>`;
          }).join("")}</tr>`).join("")}</table>`;
        const out = P.filter((_, i) => !elig[i] && votes[i] > 0).map(([n]) => n);
        const last = winners[winners.length - 1];
        $(".ap-note", el).innerHTML = `${last ? `L'últim escó l'obté el partit <b>${P[last.pi][0]}</b> amb un quocient de ${fmt(Math.round(last.q))}. ` : ""}${out.length ? `Queden fora per no arribar al 3 %: ${out.join(", ")}.` : ""}`;
      };
      $$("input", el).forEach((x) => x.addEventListener("input", draw));
      $$("[data-s]", el).forEach((b) => b.addEventListener("click", () => {
        seats = Number(b.dataset.s);
        $$("[data-s]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },

  campaign: {
    mount(el) {
      const items = [
        ["2026-11-13", "13 nov", "Comença la campanya"],
        ["2026-11-19", "19 nov", "Últim dia per demanar el vot per correu"],
        ["2026-11-24", "24 nov", "Comencen els dies sense enquestes"],
        ["2026-11-25", "25 nov", "Últim dia per enviar el vot per correu"],
        ["2026-11-27", "27 nov", "Acaba la campanya (24 h)"],
        ["2026-11-28", "28 nov", "Jornada de reflexió"],
        ["2026-11-29", "29 nov", "Votació, de 9 a 20 h"],
      ];
      const today = todayKey();
      let marked = false;
      el.innerHTML = `<ol class="ap-camp">${items.map(([d, l, t]) => {
        let cls = d < today ? "done" : "";
        if (!marked && d >= today) { cls = d === today ? "today" : "next"; marked = true; }
        return `<li class="${cls}${d === "2026-11-29" ? " key" : ""}"><span class="d">${l}</span><span class="t">${t}</span></li>`;
      }).join("")}</ol>`;
    },
  },

  margin: {
    mount(el) {
      const A = 32, B = 27;
      el.innerHTML = `<div class="ap-margin card">
        <label class="ap-range"><span>Mida de la mostra: <b class="v"></b> persones</span><input type="range" min="400" max="4000" step="100" value="1000"></label>
        <div class="ap-mg-axis">
          ${[["A", A, LB], ["B", B, LR]].map(([n, v, c]) => `<div class="ap-mg-row" data-n="${n}" style="--pc:${c}"><span>Partit ${n} · ${v} %</span><div class="ap-mg-track"><i class="band"></i><i class="pt"></i></div></div>`).join("")}
          <div class="ap-mg-scale"><span>20 %</span><span>25 %</span><span>30 %</span><span>35 %</span><span>40 %</span></div>
        </div>
        <p class="ap-mg-out" aria-live="polite"></p>
      </div>`;
      const inp = $("input", el);
      const pos = (v) => ((v - 20) / 20) * 100;
      const draw = () => {
        const n = Number(inp.value);
        const m = 1.96 * Math.sqrt(0.25 / n) * 100;
        $(".v", el).textContent = fmt(n);
        [["A", A], ["B", B]].forEach(([k, v]) => {
          const row = $(`[data-n="${k}"]`, el);
          $(".band", row).style.left = `${pos(v - m)}%`;
          $(".band", row).style.width = `${pos(v + m) - pos(v - m)}%`;
          $(".pt", row).style.left = `${pos(v)}%`;
        });
        const overlap = A - m <= B + m;
        $(".ap-mg-out", el).innerHTML = `Marge d'error: <b>±${m.toFixed(1).replace(".", ",")} punts</b>. ${overlap
          ? "Els intervals se superposen: la diferència de 5 punts encara podria ser soroll. És un <b>empat tècnic</b>."
          : "Els intervals ja no se superposen: amb aquesta mostra, A va <b>clarament per davant</b>."}`;
      };
      inp.addEventListener("input", draw);
      draw();
    },
  },

  after: {
    mount(el) {
      const steps = [
        ["29 nov", "Votació i recompte", "La mateixa nit hi ha resultats provisionals."],
        ["4-7 des", "Escrutini oficial", "Les juntes electorals provincials proclamen els electes."],
        ["23 des", "Es constitueixen les Corts", "A les 10 h, Congrés i Senat elegeixen les seves Meses i presidències."],
        ["Consultes", "El Rei parla amb els grups", "I proposa un candidat a la presidència del Govern."],
        ["Investidura", "176 sís, o més sís que nos", "1a votació: majoria absoluta. 2a, 48 hores després: majoria simple."],
        ["2 mesos", "O noves eleccions", "Si en dos mesos ningú no és investit, es dissolen les Corts.", true],
      ];
      el.innerHTML = `<ol class="ap-after">${steps.map(([k, t, d, w], i) => `<li class="${w ? "warn" : ""}" style="--i:${i}"><span class="k">${k}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol>`;
    },
  },

  investiture: {
    mount(el) {
      const presets = [["Majoria clara", 180, 0], ["Amb abstencions", 171, 169], ["Empat", 170, 170], ["Sense prou suports", 160, 175]];
      el.innerHTML = `<div class="ap-inv card">
        <div class="ap-inv-presets">${presets.map(([l], i) => `<button type="button" data-p="${i}">${l}</button>`).join("")}</div>
        <label class="ap-range" style="--pc:${LG}"><span><i></i>Sí: <b class="si"></b></span><input type="range" min="0" max="350" value="171" data-k="si"></label>
        <label class="ap-range" style="--pc:${LR}"><span><i></i>No: <b class="no"></b></span><input type="range" min="0" max="350" value="169" data-k="no"></label>
        <p class="ap-inv-abs">Abstencions: <b></b></p>
        <div class="ap-inv-res">
          <div class="r1"><small>1a votació · cal 176 sís</small><b></b></div>
          <div class="r2"><small>2a votació · més sís que nos</small><b></b></div>
        </div>
      </div>`;
      const si = $('[data-k="si"]', el), no = $('[data-k="no"]', el);
      const draw = (moved) => {
        let s = Number(si.value), n = Number(no.value);
        if (s + n > 350) { if (moved === "si") n = 350 - s; else s = 350 - n; si.value = s; no.value = n; }
        $(".si", el).textContent = s;
        $(".no", el).textContent = n;
        $(".ap-inv-abs b", el).textContent = 350 - s - n;
        const r1 = s >= 176, r2 = s > n;
        $(".r1", el).className = `r1 ${r1 ? "ok" : "ko"}`;
        $(".r1 b", el).textContent = r1 ? "Investit!" : `No (${s} de 176)`;
        $(".r2", el).className = `r2 ${r1 ? "na" : r2 ? "ok" : "ko"}`;
        $(".r2 b", el).textContent = r1 ? "No cal" : r2 ? "Investit!" : s === n ? "No: empat" : "No";
      };
      si.addEventListener("input", () => draw("si"));
      no.addEventListener("input", () => draw("no"));
      $$("[data-p]", el).forEach((b) => b.addEventListener("click", () => {
        const [, s, n] = presets[Number(b.dataset.p)];
        si.value = s; no.value = n;
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },

  law: {
    mount(el) {
      const steps = [
        ["Iniciativa", "El Govern presenta un [[projecte de llei]], o bé els grups, el Senat, un parlament autonòmic o 500.000 signatures ([[ILP]]) presenten una [[proposició de llei]]."],
        ["Esmenes", "Els grups poden presentar [[esmenes|ESMENA]]. Una esmena a la totalitat, si prospera, tomba el text."],
        ["Ponència i comissió", "Un grup reduït de diputats ([[ponència]]) i després la comissió negocien i reescriuen el text."],
        ["Ple del Congrés", "Tots els diputats voten el text."],
        ["Senat", "Té dos mesos per aprovar-lo, esmenar-lo o posar-hi un [[veto]] per majoria absoluta."],
        ["Torna al Congrés", "Accepta o rebutja les esmenes del Senat. Pot aixecar el veto per majoria absoluta, o per majoria simple passats dos mesos."],
        ["Sanció i BOE", "El Rei sanciona la llei i es publica al BOE. A partir d'aquí, és d'obligat compliment."],
      ];
      el.innerHTML = `<ol class="ap-law">${steps.map(([t, d], i) => `<li style="--i:${i}"><span class="n">${i + 1}</span><div><b>${t}</b><p>${rich(d)}</p></div></li>`).join("")}</ol>`;
    },
  },
};

// ---------- Glossari emergent ----------
let termPop = null;
function closeTerm() {
  termPop?.remove();
  termPop = null;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (!t) {
    if (termPop && !e.target.closest(".term-pop")) closeTerm();
    return;
  }
  e.preventDefault();
  const g = glossaryFind(t.dataset.term);
  if (!g) return;
  closeTerm();
  termPop = h(`<div class="term-pop" role="dialog" aria-label="${esc(g.w)}">
    <b>${esc(g.w.charAt(0) + g.w.slice(1).toLowerCase())}</b><p>${esc(g.d)}</p>
    <a href="#apren/diccionari">Obre el diccionari →</a>
  </div>`);
  document.body.appendChild(termPop);
  const r = t.getBoundingClientRect();
  const w = Math.min(300, innerWidth - 24);
  termPop.style.width = `${w}px`;
  termPop.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + scrollX}px`;
  const below = r.bottom + 10 + termPop.offsetHeight < innerHeight - 90;
  termPop.style.top = `${(below ? r.bottom + 10 : r.top - termPop.offsetHeight - 10) + scrollY}px`;
  termPop.classList.add(below ? "below" : "above");
  Sfx.play("pick");
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTerm(); });
window.addEventListener("hashchange", closeTerm);

// ---------- Diccionari ----------
let dictQuery = "";
function renderDictionary() {
  const root = $("#dict-root");
  if (!root) return;
  if (!root.dataset.ready) {
    root.dataset.ready = "1";
    root.innerHTML = `
      <label class="dict-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Cerca un concepte…" aria-label="Cerca al diccionari" autocomplete="off"></label>
      <div class="dict-letters"></div>
      <div class="dict-list"></div>`;
    $("input", root).addEventListener("input", (e) => { dictQuery = e.target.value; drawDict(); });
  }
  drawDict();
}
function drawDict() {
  const root = $("#dict-root");
  const q = apNorm(dictQuery);
  const list = GLOSSARY.filter((g) => !q || apNorm(g.w).includes(q) || apNorm(g.d).includes(q));
  const letters = [...new Set(GLOSSARY.map((g) => apNorm(g.w)[0]))];
  $(".dict-letters", root).innerHTML = letters.map((l) => `<button type="button" data-l="${l}" ${list.some((g) => apNorm(g.w)[0] === l) ? "" : "disabled"}>${l}</button>`).join("");
  $$(".dict-letters button", root).forEach((b) => b.addEventListener("click", () => {
    document.getElementById(`dict-${b.dataset.l}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  let cur = "";
  $(".dict-list", root).innerHTML = list.length ? list.map((g) => {
    const l = apNorm(g.w)[0];
    const head = l !== cur ? `<h3 class="dict-l" id="dict-${l}">${l}</h3>` : "";
    cur = l;
    return `${head}<details class="dict-item"><summary>${esc(g.w.charAt(0) + g.w.slice(1).toLowerCase())}</summary><p>${esc(g.d)}</p></details>`;
  }).join("") : `<p class="muted">No hi ha cap concepte que coincideixi amb «${esc(dictQuery)}».</p>`;
  if (q) $$(".dict-item", root).forEach((d) => { d.open = true; });
}

// ---------- Barra de lectura ----------
function updateReadBar() {
  let bar = $("#ap-read");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "ap-read";
    $(".topbar")?.appendChild(bar);
  }
  const ch = $("#ap-chapter");
  const on = ch && !ch.hidden && !$("#view-apren").hidden;
  if (!on) { bar.style.width = "0"; return; }
  const r = ch.getBoundingClientRect();
  const total = r.height - innerHeight + 140;
  const k = Math.min(1, Math.max(0, (-r.top + 100) / Math.max(1, total)));
  bar.style.width = `${k * 100}%`;
}
window.addEventListener("scroll", updateReadBar, { passive: true });
window.addEventListener("hashchange", () => setTimeout(updateReadBar, 0));

// ---------- Capçalera de cada eina ----------
const AP_TOOL_LEAD = {
  partits: "Tria dos partits i compara'n l'ideari, les propostes tema a tema, els líders i com han votat.",
  pactometre: "Qui pot governar? Parteix de la mitjana de les últimes enquestes, d'una enquesta concreta o del teu propi escenari.",
  simulador: "Reparteix els escons d'una província amb la Llei d'Hondt: tria quants n'hi ha, escriu els vots de cada candidatura i mira el resultat.",
  actualitat: "Els titulars de política dels principals mitjans. Cada enllaç t'hi porta a la seva web.",
  diccionari: "Tots els conceptes de la guia, explicats amb paraules senzilles.",
};
$$(".ap-tool-head[data-tool]").forEach((el) => {
  const t = AP_TOOLS.find((x) => x.slug === el.dataset.tool);
  if (!t) return;
  el.style.setProperty("--tone", t.tone);
  el.innerHTML = `<nav class="ap-crumb"><a href="#apren">← Aprèn</a><span>Eines</span></nav>
    <div class="ap-tool-hero"><span class="ap-tool-ico">${apIcon(t.icon)}</span><div><h1 class="ap-title">${esc(t.title)}</h1><p class="ap-lead">${esc(AP_TOOL_LEAD[t.slug] || t.text)}</p></div></div>`;
});
