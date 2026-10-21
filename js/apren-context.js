// Aprèn · Part 1: el context polític (d'on venim, la legislatura 2023-2026, què hi ha en joc i les ideologies).
// Fets contrastats amb la Viquipèdia (XV legislatura i eleccions generals del 2026), el Ministeri de l'Interior i premsa.
// Redacció neutral: es descriuen fets i posicions, sense valorar-les.

const LO = "#2e9d5b";

// ---------- Il·lustracions ----------
Object.assign(AP_ART, {
  history: lsvg(`<path d="M14 80h132" stroke="${LI}" stroke-width="4"/>
    ${[[28, LO, "77"], [62, LR, "82"], [96, LB, "96"], [130, LY, "15"]].map(([x, c, y]) => `<circle cx="${x}" cy="80" r="11" fill="${c}" stroke="${LI}" stroke-width="3.5"/>
      <rect x="${x - 15}" y="36" width="30" height="20" rx="4" fill="${LC}" stroke="${LI}" stroke-width="3"/><text x="${x}" y="51" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="11" fill="${LI}">${y}</text>
      <path d="M${x} 56v13" stroke="${LI}" stroke-width="3"/>`).join("")}`),
  calendar: lsvg(`<rect x="30" y="18" width="100" height="80" rx="8" fill="#fff" stroke="${LI}" stroke-width="4"/><rect x="30" y="18" width="100" height="22" rx="8" fill="${LR}" stroke="${LI}" stroke-width="4"/>
    <path d="M52 10v16M108 10v16" stroke="${LI}" stroke-width="5"/><text x="80" y="80" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="30" fill="${LI}">XV</text>
    <text x="80" y="35" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">2023-2026</text>`),
  scale: lsvg(`<path d="M80 18v74M50 96h60" stroke="${LI}" stroke-width="5"/><path d="M30 34h100" stroke="${LI}" stroke-width="5"/><circle cx="80" cy="18" r="6" fill="${LY}" stroke="${LI}" stroke-width="3"/>
    <path d="M30 34l-14 30h28zM130 34l-14 30h28z" fill="none" stroke="${LI}" stroke-width="3"/><path d="M14 64a16 9 0 0032 0zM114 64a16 9 0 0032 0z" fill="${LY}" stroke="${LI}" stroke-width="3"/>
    <path d="M22 56l8-7 8 7v6H22z" fill="${LR}" stroke="${LI}" stroke-width="2.5"/><text x="130" y="61" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="12" fill="${LI}">€</text>`),
  compass: lsvg(`<path d="M80 12v88M24 56h112" stroke="${LI}" stroke-width="4"/><path d="M80 12l-6 9h12zM80 100l-6-9h12zM24 56l9-6v12zM136 56l-9-6v12z" fill="${LI}"/>
    <circle cx="50" cy="36" r="8" fill="${LR}" stroke="${LI}" stroke-width="3"/><circle cx="112" cy="40" r="8" fill="${LB}" stroke="${LI}" stroke-width="3"/>
    <circle cx="58" cy="78" r="8" fill="${LG}" stroke="${LI}" stroke-width="3"/><circle cx="104" cy="80" r="8" fill="${LY}" stroke="${LI}" stroke-width="3"/>`),
});

// ---------- Glossari: conceptes del context polític ----------
GLOSSARY.push(
  { w: "TRANSICIÓ", d: "Període, entre el 1975 i el 1982, en què Espanya va passar de la dictadura franquista a la democràcia." },
  { w: "AMNISTIA", d: "Mesura que extingeix la responsabilitat penal o administrativa per uns fets determinats. La llei del 2024 s'aplica als fets vinculats al procés independentista català." },
  { w: "PLURINACIONALITAT", d: "Idea que l'Estat està format per diverses nacions, com Catalunya, el País Basc o Galícia, i no per una de sola." },
  { w: "SOBIRANISME", d: "Posició que defensa que un territori pugui decidir el seu futur polític, inclosa la independència." },
  { w: "SOCIALDEMOCRÀCIA", d: "Ideologia que combina l'economia de mercat amb un estat del benestar fort i impostos progressius." },
  { w: "LIBERALISME", d: "Ideologia que prioritza la llibertat individual, l'economia de mercat i un Estat limitat." },
  { w: "CONSERVADORISME", d: "Ideologia que defensa la tradició, l'ordre social i els canvis graduals." },
  { w: "POPULISME", d: "Estil polític que presenta la societat dividida entre «el poble» i «les elits». Pot ser d'esquerres o de dretes." },
  { w: "PRÒRROGA PRESSUPOSTÀRIA", d: "Situació en què, si no s'aproven pressupostos nous, es continuen aplicant els de l'any anterior." },
  { w: "FISCAL GENERAL DE L'ESTAT", d: "Cap del Ministeri Fiscal. El nomena el Rei a proposta del Govern." },
  { w: "15-M", d: "Moviment de protesta iniciat el 15 de maig del 2011 contra la gestió de la crisi econòmica i la corrupció." },
  { w: "PRESUMPCIÓ D'INNOCÈNCIA", d: "Dret de tota persona a ser considerada innocent mentre una sentència ferma no la declari culpable." },
);
GLOSSARY.sort((a, b) => a.w.localeCompare(b.w, "ca"));
AP_TOOLS.find((t) => t.slug === "diccionari").text = `${GLOSSARY.length} conceptes, explicats fàcil.`;

// ---------- Capítols de la part 1 ----------
const AP_CONTEXT_CHAPTERS = [
  {
    slug: "don-venim", part: 1, title: "D'on venim", short: "Cinquanta anys de democràcia, del bipartidisme a la fragmentació.", mins: 4, tone: LO, art: AP_ART.history,
    lead: "La democràcia actual va néixer fa gairebé cinquanta anys. Conèixer-ne les etapes ajuda a entendre què es vota avui i per què costa tant formar govern.",
    blocks: [
      { t: "h", h: "De la dictadura a la democràcia" },
      { t: "p", h: "Després de la mort de Franco, el 1975, la [[Transició]] va portar les primeres eleccions lliures (15 de juny del 1977) i la Constitució del 1978, aprovada en referèndum. El 1979 es van aprovar els primers estatuts d'autonomia, i el 1981 va fracassar el cop d'estat del 23-F." },
      { t: "h", h: "Els presidents del Govern" },
      { t: "widget", w: "presidents" },
      { t: "h", h: "Trenta anys de bipartidisme" },
      { t: "p", h: "Des del 1982, el PSOE i el PP (Alianza Popular fins al 1989) es van alternar al Govern. Quan no tenien majoria absoluta, pactaven amb partits nacionalistes com CiU, el PNV o Coalición Canaria. Entre tots dos arribaven a sumar més de tres de cada quatre vots." },
      { t: "widget", w: "bipartisan" },
      { t: "callout", tone: "info", title: "Només quatre majories absolutes", h: "Un sol partit ha tingut majoria absoluta al Congrés només quatre vegades: el PSOE el 1982 i el 1986, i el PP el 2000 i el 2011." },
      { t: "h", h: "La crisi que ho va canviar tot" },
      { t: "p", h: "La crisi econòmica del 2008, les retallades i els casos de corrupció van fer créixer el descontentament. El 2011 va esclatar el moviment del [[15-M]] i, entre el 2014 i el 2015, Podemos i Ciutadans van trencar el [[bipartidisme]]: a les eleccions del desembre del 2015, quatre partits van superar el 13 % dels vots." },
      { t: "steps", items: [
        { title: "2016 · Primera repetició electoral", text: "Cap candidat no aconsegueix la investidura i, per primera vegada, s'han de repetir les eleccions." },
        { title: "2017 · El procés català", text: "Referèndum de l'1 d'octubre, declaració d'independència al Parlament i aplicació de l'article 155 de la Constitució." },
        { title: "2018 · Primera moció de censura reeixida", text: "Pedro Sánchez substitueix Mariano Rajoy després d'una sentència del cas Gürtel." },
        { title: "2019 · Dues eleccions generals el mateix any", text: "Vox entra al Congrés i el sistema de partits es fragmenta encara més." },
        { title: "2020 · El primer govern de coalició", text: "PSOE i Unides Podem formen el primer govern de coalició des de la Segona República. Poc després arriba la pandèmia de la covid-19." },
        { title: "2023 · Eleccions del 23-J", text: "El PP guanya les eleccions, però Pedro Sánchez és investit amb el suport de Sumar i de partits nacionalistes i independentistes." },
      ] },
    ],
    quiz: [
      { q: "En quin any es van fer les primeres eleccions democràtiques després del franquisme?", opts: ["El 1977", "El 1975", "El 1978", "El 1982"], exp: "Es van celebrar el 15 de juny del 1977. La Constitució es va aprovar l'any següent." },
      { q: "Quin president va arribar al Govern amb la primera moció de censura que va prosperar?", opts: ["Pedro Sánchez", "Felipe González", "Mariano Rajoy", "José María Aznar"], exp: "Va ser el juny del 2018: Pedro Sánchez va substituir Mariano Rajoy." },
      { q: "Quins dos partits es van alternar al Govern entre el 1982 i el 2018?", opts: ["El PSOE i el PP", "El PSOE i la UCD", "El PP i Ciutadans", "El PSOE i Podemos"], exp: "És el que s'anomena bipartidisme. El PP es deia Alianza Popular fins al 1989." },
    ],
    practice: { href: "#joc/cronologia", label: "Juga a Cronologia", text: "Ordena els grans fets de la història d'Espanya." },
  },
  {
    slug: "legislatura", part: 1, title: "La legislatura 2023-2026", short: "Amnistia, govern en minoria, crisis i casos judicials.", mins: 5, tone: LR, art: AP_ART.calendar,
    lead: "Tres anys d'una legislatura molt ajustada: un govern de coalició en minoria, la llei d'amnistia, eleccions autonòmiques, crisis i casos judicials, fins a l'avançament electoral.",
    blocks: [
      { t: "h", h: "Com va començar" },
      { t: "p", h: "Les eleccions del 23 de juliol del 2023 van deixar un Congrés sense majories clares. El PP va guanyar amb 137 escons, però Alberto Núñez Feijóo no va superar la [[investidura]]. Pedro Sánchez va ser investit el 16 de novembre amb 179 vots, després de pactar una llei d'[[amnistia]] amb ERC i Junts, i va formar un govern de coalició amb Sumar." },
      { t: "h", h: "Els fets clau, any per any" },
      { t: "widget", w: "legislature" },
      { t: "h", h: "Les claus de la legislatura" },
      { t: "cards", items: [
        { title: "Un govern en minoria", text: "PSOE i Sumar sumaven 152 diputats, lluny dels 176. Cada votació depenia de set o vuit grups, i el Govern va perdre votacions importants." },
        { title: "Sense pressupostos nous", text: "No es va aprovar cap pressupost nou: els del 2023 es van [[prorrogar|PRÒRROGA PRESSUPOSTÀRIA]] durant tota la legislatura." },
        { title: "L'amnistia", text: "Va ser el debat central. El Govern la defensava com una mesura per a la convivència a Catalunya, i l'oposició la considerava el preu de la investidura. El Tribunal Constitucional la va avalar el 2025." },
        { title: "Investigacions judicials", text: "Diversos casos van afectar l'entorn del Govern i del PSOE, com el cas Koldo. Les persones investigades tenen dret a la [[presumpció d'innocència]] fins que hi hagi sentència ferma." },
      ] },
      { t: "callout", tone: "info", title: "L'economia, en dues dades", h: "L'atur va baixar del 10 % a finals del 2025, per primera vegada des del 2008. El preu de l'habitatge, en canvi, va continuar pujant i es va convertir en una de les principals preocupacions." },
    ],
    quiz: [
      { q: "Amb quants vots va ser investit Pedro Sánchez el novembre del 2023?", opts: ["179", "176", "172", "350"], exp: "Va obtenir 179 vots a favor: PSOE, Sumar, ERC, Junts, EH Bildu, PNV, BNG i Coalición Canaria." },
      { q: "Per què s'han avançat les eleccions al 29 de novembre?", opts: ["El Congrés va tombar dos decrets llei d'habitatge i el president va dissoldre les Corts", "Va prosperar una moció de censura", "El Govern va perdre una qüestió de confiança", "S'havia acabat la legislatura de quatre anys"], exp: "Després del rebuig dels decrets d'habitatge, el 2 d'octubre, Sánchez va dissoldre les Corts. La legislatura havia de durar fins al 2027." },
      { q: "Quin partit va trencar amb el PSOE l'octubre del 2025 i va anunciar que bloquejaria les lleis del Govern?", opts: ["Junts", "El PNV", "ERC", "Sumar"], exp: "Junts ho va anunciar el 27 d'octubre del 2025, al·legant incompliments dels acords del 2023." },
    ],
    practice: { href: "#joc/verificador", label: "Juga al Verificador", text: "Distingeix els fets reals dels falsos." },
  },
  {
    slug: "en-joc", part: 1, title: "Què hi ha en joc el 29N", short: "Els grans debats i les majories possibles.", mins: 4, tone: "#f59f24", art: AP_ART.scale,
    lead: "Habitatge, model territorial, economia, immigració… Aquests són els grans debats de la campanya i les majories que podrien sortir de les urnes.",
    blocks: [
      { t: "h", h: "Els grans debats" },
      { t: "p", h: "Tria un tema per veure per què és important i què proposa cada partit. Els resums parteixen dels programes electorals del 2023 i de les posicions públiques de cada formació." },
      { t: "widget", w: "issues" },
      { t: "h", h: "Quines majories poden sortir" },
      { t: "cards", items: [
        { title: "Un govern del PP", text: "Necessitaria 176 sís, o més sís que nos a la segona votació. Els socis possibles són Vox, UPN i Coalición Canaria. El PP i Vox han pactat en diverses comunitats autònomes." },
        { title: "Un govern del PSOE", text: "Hauria de reeditar la majoria del 2023, amb Sumar i partits nacionalistes i independentistes. La ruptura de Junts amb el PSOE la fa més difícil." },
        { title: "Una gran coalició", text: "PP i PSOE sumarien de sobres, però mai no han governat junts a l'Estat i tots dos ho descarten." },
        { title: "Bloqueig i repetició", text: "Si en dos mesos ningú no és investit, es tornen a convocar eleccions, com va passar el 2016 i el 2019." },
      ] },
      { t: "callout", tone: "tip", title: "Fes els teus càlculs", h: "Al <a href=\"#apren/pactometre\">pactòmetre</a> pots provar quines combinacions arriben a la majoria, a partir de les enquestes o del teu propi escenari." },
      { t: "h", h: "Abans de decidir el vot" },
      { t: "list", items: [
        "Compara les propostes de cada partit tema a tema al <a href=\"#apren/partits\">comparador</a>.",
        "Desconfia dels missatges que arriben sense font, sobretot si busquen indignar.",
        "Comprova les dades en fonts oficials (BOE, INE, Junta Electoral Central) i en més d'un mitjà.",
        "Les enquestes són una fotografia del moment, no un pronòstic.",
        "Votar és un dret, no una obligació. El vot en blanc també és una opció vàlida.",
      ] },
    ],
    quiz: [
      { q: "Quin tema va precipitar l'avançament electoral?", opts: ["L'habitatge", "Les pensions", "La immigració", "La despesa en defensa"], exp: "El Congrés va rebutjar dos decrets llei d'habitatge el 2 d'octubre del 2026." },
      { q: "Què passa si cap candidat no és investit en dos mesos?", opts: ["Es tornen a convocar eleccions", "Governa el partit més votat", "Decideix el Senat", "El Rei nomena un president"], exp: "Ho estableix l'article 99 de la Constitució. Va passar el 2016 i el 2019." },
      { q: "Han governat mai junts el PP i el PSOE al Govern d'Espanya?", opts: ["No, mai", "Sí, el 2016", "Sí, el 1996", "Sí, durant la pandèmia"], exp: "Mai no hi ha hagut una gran coalició entre el PP i el PSOE al Govern de l'Estat." },
    ],
    practice: { href: "#apren/partits", label: "Obre el comparador de partits", text: "Compara les propostes de dos partits, tema a tema." },
  },
  {
    slug: "ideologies", part: 1, title: "Les ideologies, explicades", short: "Esquerra, dreta, liberals, conservadors i sobiranistes.", mins: 4, tone: LP, art: AP_ART.compass,
    lead: "Esquerra, dreta, liberal, conservador, sobiranista… Què vol dir cada etiqueta i com se situen els partits que es presenten el 29N.",
    blocks: [
      { t: "h", h: "D'on surten «esquerra» i «dreta»" },
      { t: "p", h: "Els termes neixen a l'Assemblea Nacional francesa del 1789: a la dreta del president s'asseien els partidaris del rei i de l'ordre establert, i a l'esquerra, els qui volien canvis més profunds. Avui l'esquerra posa l'accent en la igualtat i el paper de l'Estat, i la dreta, en la llibertat econòmica, l'ordre i la tradició, tot i que dins de cada bloc hi ha molts matisos." },
      { t: "h", h: "Tres eixos per entendre la política espanyola" },
      { t: "widget", w: "axes" },
      { t: "h", h: "Les grans famílies ideològiques" },
      { t: "widget", w: "families" },
      { t: "callout", tone: "info", title: "Etiquetes orientatives", h: "Molts partits combinen idees de diverses famílies i es defineixen a si mateixos de maneres diferents. Les posicions que es mostren són aproximades." },
      { t: "h", h: "Esquerra o dreta? Posa't a prova" },
      { t: "p", h: "Aquestes idees s'associen tradicionalment a un bloc o a l'altre. Endevina a quin." },
      { t: "widget", w: "lrquiz" },
    ],
    quiz: [
      { q: "D'on prové la distinció entre esquerra i dreta?", opts: ["De l'Assemblea Nacional francesa del 1789", "De les Corts de Cadis", "Del Parlament britànic", "De la Segona República"], exp: "Es refereix a on s'asseien els diputats respecte del president de l'Assemblea." },
      { q: "Quina família ideològica defensa una economia de mercat amb un estat del benestar fort?", opts: ["La socialdemocràcia", "El liberalisme", "La dreta radical", "L'anarquisme"], exp: "La [[socialdemocràcia]] combina mercat, serveis públics forts i impostos progressius." },
      { q: "Què mesura l'eix territorial?", opts: ["Si es vol més autogovern o més centralisme", "Si es volen més o menys impostos", "L'edat dels votants", "La mida dels partits"], exp: "Va del centralisme a la independència, passant pel federalisme i el sobiranisme." },
    ],
    practice: { href: "#joc/match", label: "Juga al Match ideològic", text: "Descobreix amb quins actors polítics coincideixes." },
  },
];

AP_CHAPTERS.forEach((c) => { c.part = c.part || 2; });
AP_CHAPTERS.unshift(...AP_CONTEXT_CHAPTERS);
AP_CHAPTERS.forEach((c, i) => { c.n = i + 1; });

// ---------- Exemples interactius de la part 1 ----------
const AP_PRESIDENTS = [
  ["Adolfo Suárez", "UCD", 1976.5, 1981.15, LO, "1976-1981"],
  ["Leopoldo Calvo-Sotelo", "UCD", 1981.15, 1982.92, LO, "1981-1982"],
  ["Felipe González", "PSOE", 1982.92, 1996.35, "#e3101f", "1982-1996"],
  ["José María Aznar", "PP", 1996.35, 2004.3, "#1e88d6", "1996-2004"],
  ["José Luis Rodríguez Zapatero", "PSOE", 2004.3, 2011.97, "#e3101f", "2004-2011"],
  ["Mariano Rajoy", "PP", 2011.97, 2018.43, "#1e88d6", "2011-2018"],
  ["Pedro Sánchez", "PSOE", 2018.43, 2026.82, "#e3101f", "2018-"],
];
// Percentatge de vot del PSOE i d'AP/PP a cada elecció general (Ministeri de l'Interior)
const AP_BIPARTISAN = [
  ["1982", 48.1, 26.4], ["1986", 44.1, 26.0], ["1989", 39.6, 25.8], ["1993", 38.8, 34.8], ["1996", 37.6, 38.8],
  ["2000", 34.2, 44.5], ["2004", 42.6, 37.7], ["2008", 43.9, 39.9], ["2011", 28.8, 44.6], ["2015", 22.0, 28.7],
  ["2016", 22.6, 33.0], ["abr. 2019", 28.7, 16.7], ["nov. 2019", 28.0, 20.8], ["2023", 31.7, 33.1],
];
const AP_LEG_CATS = { parl: ["Govern i Parlament", LB], elec: ["Eleccions", LO], just: ["Justícia", LP], soc: ["Societat", LR] };
const AP_LEGISLATURE = [
  [2023, "23 jul", "elec", "Eleccions generals: el PP guanya amb 137 escons, però cap bloc no arriba a la majoria absoluta."],
  [2023, "29 set", "parl", "Alberto Núñez Feijóo no supera la investidura: 172 vots a favor i 177 en contra."],
  [2023, "16 nov", "parl", "Pedro Sánchez és investit amb 179 vots (PSOE, Sumar, ERC, Junts, EH Bildu, PNV, BNG i CC), després de pactar una llei d'amnistia amb ERC i Junts."],
  [2023, "5 des", "parl", "Podemos abandona el grup de Sumar i passa al Grup Mixt."],
  [2024, "18 feb", "elec", "Eleccions a Galícia: el PP revalida la majoria absoluta."],
  [2024, "29 abr", "parl", "Sánchez anuncia que continua al càrrec després de cinc dies de reflexió, arran de la investigació judicial a la seva dona."],
  [2024, "12 maig", "elec", "Eleccions a Catalunya: guanya el PSC i els partits independentistes perden la majoria al Parlament. Salvador Illa és investit president a l'agost."],
  [2024, "28 maig", "parl", "Espanya reconeix l'Estat de Palestina."],
  [2024, "30 maig", "parl", "El Congrés aprova definitivament la llei d'amnistia, que entra en vigor l'11 de juny."],
  [2024, "9 juny", "elec", "Eleccions europees: guanya el PP i Se Acabó La Fiesta obté 3 escons."],
  [2024, "25 juny", "parl", "PP i PSOE pacten renovar el Consell General del Poder Judicial, que tenia el mandat caducat des del 2018."],
  [2024, "29 oct", "soc", "Una dana arrasa la província de València i causa 229 morts."],
  [2025, "28 abr", "soc", "Una apagada elèctrica deixa sense llum tota la península Ibèrica durant hores."],
  [2025, "26 juny", "just", "El Tribunal Constitucional avala la llei d'amnistia per 6 vots a 4."],
  [2025, "30 juny", "just", "Santos Cerdán, que havia dimitit com a secretari d'organització del PSOE, ingressa a presó provisional en el marc del cas Koldo."],
  [2025, "10 set", "parl", "El Congrés tomba la reducció de la jornada laboral a 37,5 hores amb els vots de PP, Vox i Junts."],
  [2025, "27 oct", "parl", "Junts trenca amb el PSOE i anuncia que bloquejarà les lleis del Govern."],
  [2025, "3 nov", "parl", "Carlos Mazón anuncia la dimissió com a president de la Generalitat Valenciana per la gestió de la dana. El substitueix Juanfran Pérez Llorca, amb els vots del PP i de Vox."],
  [2025, "20 nov", "just", "El Tribunal Suprem condemna el fiscal general de l'Estat, Álvaro García Ortiz, a dos anys d'inhabilitació per revelació de dades reservades."],
  [2025, "27 nov", "just", "L'exministre José Luis Ábalos i el seu exassessor Koldo García ingressen a presó provisional, a l'espera de judici."],
  [2025, "21 des", "elec", "Eleccions a Extremadura: guanya el PP, que necessita Vox per governar, i el PSOE obté el pitjor resultat de la seva història a la comunitat."],
  [2026, "gener", "soc", "L'atur baixa del 10 % per primera vegada des del 2008, segons l'Enquesta de Població Activa del final del 2025."],
  [2026, "8 feb", "elec", "Eleccions a l'Aragó: guanya el PP i Vox duplica els escons."],
  [2026, "15 març", "elec", "Eleccions a Castella i Lleó: guanya el PP, que torna a dependre de Vox."],
  [2026, "17 maig", "elec", "Eleccions a Andalusia: el PP guanya, però perd la majoria absoluta."],
  [2026, "2 oct", "parl", "El Congrés tomba dos decrets llei d'habitatge amb els vots en contra de PP, Vox, Junts i UPN, entre d'altres."],
  [2026, "6 oct", "parl", "El BOE publica la dissolució de les Corts i la convocatòria d'eleccions per al 29 de novembre."],
];
const AP_ISSUES = [
  { k: "hab", label: "Habitatge", why: "El preu de l'habitatge ha crescut molt més que els sous, sobretot el lloguer a les grans ciutats. El rebuig de dos decrets d'habitatge al Congrés va precipitar l'avançament electoral." },
  { k: "ter", label: "Model territorial", why: "L'amnistia, el finançament de Catalunya i el reconeixement de la plurinacionalitat han marcat la legislatura. És el debat que més separa els blocs." },
  { k: "eco", label: "Economia i impostos", why: "L'economia ha crescut per sobre de la mitjana europea i l'atur ha baixat del 10 %, però el deute públic continua prop del 100 % del PIB. Els partits discrepen sobre qui ha de pagar més impostos." },
  { k: "treb", label: "Treball i pensions", why: "Salari mínim, jornada laboral i sostenibilitat de les pensions. La reducció de la jornada a 37,5 hores no va superar el Congrés el setembre del 2025." },
  { k: "imm", label: "Immigració", why: "La immigració ha guanyat pes en el debat: les arribades a Canàries, la distribució de menors no acompanyats i la regularització de persones en situació irregular." },
  { k: "clima", label: "Energia i clima", why: "L'apagada del 28 d'abril del 2025 va reobrir el debat sobre el model energètic: renovables, centrals nuclears i interconnexions." },
  { k: "ext", label: "Europa i món", why: "La guerra d'Ucraïna, Gaza, la despesa en defensa que reclama l'OTAN i la relació amb els Estats Units marquen la política exterior." },
];
const AP_FAMILIES = [
  { t: "Socialdemocràcia", c: "#e3101f", d: "Economia de mercat amb un estat del benestar fort: sanitat, educació i pensions públiques, finançades amb impostos progressius.", p: ["psoe"] },
  { t: "Esquerra alternativa", c: "#e0306f", d: "Més pes de l'Estat i dels serveis públics, i defensa de l'ecologisme, el feminisme i els drets socials. Inclou tradicions comunistes i ecosocialistes.", p: ["fa", "podemos"] },
  { t: "Liberalisme", c: "#f2b600", d: "Llibertat individual, economia de mercat i un Estat limitat. A Espanya no hi ha cap gran partit purament liberal: és una tradició present en part del centredreta.", p: ["pp", "junts"] },
  { t: "Conservadorisme i democràcia cristiana", c: "#1e88d6", d: "Defensa de la tradició, la família, l'ordre i l'economia de mercat, sovint amb arrels cristianes.", p: ["pp", "pnv"] },
  { t: "Dreta radical i nacionalpopulisme", c: "#5cbf2a", d: "Nacionalisme fort, control estricte de la immigració, rebuig del que anomena «ideologia de gènere» i desconfiança envers la UE. La majoria de la ciència política hi situa Vox, que es defineix com a patriòtic i conservador.", p: ["vox"] },
  { t: "Nacionalismes i sobiranismes", c: "#20b8c8", d: "Defensen Catalunya, el País Basc, Galícia o Canàries com a nacions o pobles amb dret a decidir. N'hi ha d'esquerres i de centredreta.", p: ["erc", "junts", "bildu", "pnv", "bng", "cc"] },
  { t: "Ecologisme", c: "#00a37a", d: "Situa la crisi climàtica i la protecció del medi ambient al centre de la política. A Espanya, és present sobretot dins de les coalicions d'esquerres.", p: ["fa"] },
  { t: "Populisme", c: "#5d4037", d: "Més que una ideologia, és un estil: presenta la política com un xoc entre «el poble» i «les elits». Pot ser d'esquerres o de dretes, i es combina amb altres ideologies.", p: ["salf"] },
];
const AP_LR = [
  ["Cal pujar els impostos a les rendes més altes per finançar més serveis públics.", "esq"],
  ["Cal abaixar impostos perquè les empreses creïn més ocupació.", "dre"],
  ["L'Estat ha de limitar el preu dels lloguers.", "esq"],
  ["Cal endurir les penes i reforçar la policia per garantir l'ordre.", "dre"],
  ["Cal facilitar vies legals d'immigració i regularitzar les persones que ja viuen aquí.", "esq"],
  ["La família tradicional i la religió són la base de la societat.", "dre"],
];

Object.assign(AP_WIDGETS, {
  presidents: {
    mount(el) {
      const t0 = 1976.5, t1 = 2026.82;
      el.innerHTML = `<div class="ap-pres card">
        <div class="ap-pres-bar">${AP_PRESIDENTS.map(([n, p, a, b, c]) => `<i style="flex:${(b - a).toFixed(2)};background:${c}" title="${n} (${p})"></i>`).join("")}</div>
        <div class="ap-pres-years"><span>1976</span><span>1986</span><span>1996</span><span>2006</span><span>2016</span><span>2026</span></div>
        <ol class="ap-pres-list">${AP_PRESIDENTS.map(([n, p, , , c, y]) => `<li style="--pc:${c}"><b>${n}</b><span><i>${p}</i>${y}</span></li>`).join("")}</ol>
      </div>`;
      void t0; void t1;
    },
  },
  bipartisan: {
    mount(el) {
      el.innerHTML = `<div class="ap-bip card">
        <p class="kicker">Vot conjunt del PSOE i del PP (AP fins al 1989)</p>
        <div class="ap-bip-chart">${AP_BIPARTISAN.map(([y, a, b]) => `
          <div class="ap-bip-col ${y === "2015" ? "mark" : ""}" title="${y}: PSOE ${String(a).replace(".", ",")} % · PP ${String(b).replace(".", ",")} %">
            <b>${Math.round(a + b)}</b>
            <div class="ap-bip-stack"><i class="pp" style="height:${b}%"></i><i class="ps" style="height:${a}%"></i></div>
            <small>${y.replace("abr. ", "A").replace("nov. ", "N")}</small>
          </div>`).join("")}</div>
        <div class="ap-bip-leg"><span><i class="ps"></i>PSOE</span><span><i class="pp"></i>AP / PP</span><span class="muted">Percentatge sobre els vots vàlids. Font: Ministeri de l'Interior.</span></div>
      </div>`;
    },
  },
  legislature: {
    mount(el) {
      let filter = "tots";
      el.innerHTML = `<div class="ap-leg">
        <div class="ap-leg-filter">${[["tots", "Tot", LI], ...Object.entries(AP_LEG_CATS).map(([k, [l, c]]) => [k, l, c])].map(([k, l, c]) => `<button type="button" data-f="${k}" style="--pc:${c}" class="${k === filter ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="ap-leg-list"></div>
      </div>`;
      const draw = () => {
        const items = AP_LEGISLATURE.filter((e) => filter === "tots" || e[2] === filter);
        let cur = 0;
        $(".ap-leg-list", el).innerHTML = items.map(([y, d, c, t]) => {
          const head = y !== cur ? `<h4 class="ap-leg-y">${y}</h4>` : "";
          cur = y;
          return `${head}<div class="ap-leg-item" style="--pc:${AP_LEG_CATS[c][1]}"><span class="d">${d}</span><p>${t}</p><span class="cat">${AP_LEG_CATS[c][0]}</span></div>`;
        }).join("");
      };
      $$("[data-f]", el).forEach((b) => b.addEventListener("click", () => {
        filter = b.dataset.f;
        $$("[data-f]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },
  issues: {
    mount(el) {
      let cur = AP_ISSUES[0].k;
      el.innerHTML = `<div class="ap-iss">
        <div class="ap-iss-tabs" role="tablist">${AP_ISSUES.map((i) => `<button type="button" role="tab" data-k="${i.k}" class="${i.k === cur ? "on" : ""}">${i.label}</button>`).join("")}</div>
        <div class="ap-iss-body card"></div>
      </div>`;
      const draw = () => {
        const i = AP_ISSUES.find((x) => x.k === cur);
        const rows = PARTIES.filter((p) => PARTY_ARGS[p.id]?.[cur]).map((p) => `
          <div class="ap-iss-row" style="--pc:${p.color}"><b>${p.sig}</b><p>${esc(PARTY_ARGS[p.id][cur])}</p></div>`).join("");
        $(".ap-iss-body", el).innerHTML = `<p class="ap-iss-why"><b>Per què importa.</b> ${esc(i.why)}</p><div class="ap-iss-rows">${rows}</div>
          <p class="ap-note">Resum dels programes electorals del 2023 i de posicions públiques. Els programes del 29N poden introduir canvis.</p>`;
      };
      $$("[data-k]", el).forEach((b) => b.addEventListener("click", () => {
        cur = b.dataset.k;
        $$("[data-k]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },
  axes: {
    mount(el) {
      // Col·loca les etiquetes en files perquè no se solapin
      const lane = (items) => {
        const rows = [];
        return items.sort((a, b) => a.v - b.v).map((it) => {
          let r = 0;
          while (rows[r] !== undefined && it.v - rows[r] < 0.9) r++;
          rows[r] = it.v;
          return { ...it, r };
        });
      };
      const axis = (title, lo, hi, desc, items) => {
        const placed = items ? lane(items) : [];
        const rowsN = Math.max(1, ...placed.map((x) => x.r + 1));
        return `<div class="ap-axis">
          <div class="ap-axis-head"><b>${title}</b><span>${desc}</span></div>
          ${items ? `<div class="ap-axis-track" style="--rows:${rowsN}">${placed.map((x) => `<span class="ap-axis-dot" style="left:${x.v * 10}%;--pc:${x.c};--r:${x.r}">${x.s}</span>`).join("")}</div>` : `<div class="ap-axis-track empty"></div>`}
          <div class="ap-axis-ends"><span>${lo}</span><span>${hi}</span></div>
        </div>`;
      };
      const pts = (f) => PARTIES.map((p) => ({ s: p.sig, c: p.color, v: f(p) }));
      el.innerHTML = `<div class="ap-axes card">
        ${axis("Eix econòmic", "Més Estat", "Més mercat", "Impostos, serveis públics i regulació de l'economia.", pts((p) => p.x))}
        ${axis("Eix territorial", "Centralisme", "Sobiranisme", "Més unitat o més autogovern, fins a la independència.", pts((p) => p.y))}
        ${axis("Eix de valors", "Progressista", "Conservador", "Nous drets, laïcitat i canvi social, o tradició, família i religió. Cada partit hi té posicions diverses segons el tema.", null)}
        <p class="ap-note">Posicions aproximades, basades en els programes i en les votacions al Congrés. Les mateixes que es fan servir al mapa del comparador.</p>
      </div>`;
    },
  },
  families: {
    mount(el) {
      el.innerHTML = `<div class="ap-fam">${AP_FAMILIES.map((f) => `
        <article class="ap-fam-card" style="--fc:${f.c}">
          <b>${f.t}</b>
          <p>${esc(f.d)}</p>
          <div class="ap-fam-parties">${f.p.map((id) => { const p = PARTIES.find((x) => x.id === id); return p ? `<button type="button" data-party="${p.id}" style="--pc:${p.color}" title="Obre el comparador">${p.sig}</button>` : ""; }).join("")}</div>
        </article>`).join("")}</div>
        <p class="ap-note">Toca un partit per obrir-ne la fitxa al comparador.</p>`;
      $$("[data-party]", el).forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.party;
        if (cmpSel.b === id) cmpSel.b = cmpSel.a;
        cmpSel.a = id;
        cmpSel.next = "b";
        renderParties();
        location.hash = "#apren/partits";
      }));
    },
  },
  lrquiz: {
    mount(el) {
      let hits = 0, answered = 0;
      el.innerHTML = `<div class="ap-sorter">
        <div class="ap-sorter-score"><b>0</b>/${AP_LR.length} encerts</div>
        ${AP_LR.map(([t], i) => `<div class="ap-sort" data-i="${i}">
          <p>«${esc(t)}»</p>
          <div class="ap-sort-opts"><button type="button" data-a="esq">Més d'esquerres</button><button type="button" data-a="dre">Més de dretes</button></div>
          <small class="ap-sort-exp" hidden></small>
        </div>`).join("")}
      </div>`;
      $$(".ap-sort", el).forEach((row) => {
        const [, a] = AP_LR[Number(row.dataset.i)];
        $$("button", row).forEach((b) => b.addEventListener("click", () => {
          if (row.classList.contains("done")) return;
          row.classList.add("done");
          const ok = b.dataset.a === a;
          if (ok) hits++;
          answered++;
          Sfx.play(ok ? "ok" : "ko");
          $$("button", row).forEach((x) => {
            x.disabled = true;
            if (x.dataset.a === a) x.classList.add("right");
            else if (x === b) x.classList.add("wrong");
          });
          row.classList.add(ok ? "ok" : "ko");
          const exp = $(".ap-sort-exp", row);
          exp.hidden = false;
          exp.textContent = `${ok ? "✓" : "✕"} Tradicionalment s'associa a la ${a === "esq" ? "esquerra" : "dreta"}, tot i que alguns partits combinen idees dels dos blocs.`;
          $(".ap-sorter-score b", el).textContent = hits;
          if (answered === AP_LR.length) $(".ap-sorter-score", el).insertAdjacentHTML("beforeend", ` · ${hits === AP_LR.length ? "Perfecte!" : "Molt bé!"}`);
        }));
      });
    },
  },
});
