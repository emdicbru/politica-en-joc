// Simulador de debat electoral: contingut. Tot és ficció: les intervencions dels candidats reals són inventades i genèriques,
// inspirades en les posicions públiques dels seus partits, i no reprodueixen declaracions reals.

const DB_DISCLAIMER = "Debat de ficció. Les intervencions dels candidats reals són inventades i genèriques, inspirades en les posicions públiques dels seus partits.";

// ---------- El teu partit ----------
const DB_IDEOS = [
  { k: "esq", label: "Esquerra", x: 1.5 },
  { k: "cesq", label: "Centreesquerra", x: 3.5 },
  { k: "centre", label: "Centre", x: 5 },
  { k: "cdreta", label: "Centredreta", x: 6.8 },
  { k: "dreta", label: "Dreta", x: 8.8 },
];
const DB_TERRS = [
  { k: "central", label: "Centralista", d: "Un model igual per a tot l'Estat." },
  { k: "autonom", label: "Autonomista", d: "Més autogovern i finançament just." },
  { k: "sobir", label: "Sobiranista", d: "Que cada nació decideixi el seu futur." },
];
const DB_SIZES = [
  { k: "gran", label: "Gran", d: "Aspira a governar. Et conviden a tots els debats, també al cara a cara.", base: 30 },
  { k: "mitja", label: "Mitjà", d: "Té grup propi al Congrés. Et conviden al debat a set.", base: 9 },
  { k: "nou", label: "Nou", d: "Sense escons. Només et conviden al debat de les forces sense grup.", base: 2 },
];
const DB_STYLES = [
  { k: "rigor", label: "Rigorós", d: "Dades i calma. Les respostes tècniques et surten millor, però costa emocionar.", fx: { dades: 1.3, emocio: 0.85, atac: 0.9, proposta: 1.1 } },
  { k: "combat", label: "Combatiu", d: "Contundent i ràpid. Els atacs fan més mal, però t'alteres més fàcilment.", fx: { dades: 0.9, emocio: 1, atac: 1.35, proposta: 0.95 }, nerves: 1.25 },
  { k: "proper", label: "Proper", d: "Empàtic i planer. Connectes amb la gent, però les xifres no són el teu fort.", fx: { dades: 0.85, emocio: 1.35, atac: 0.85, proposta: 1.05 } },
];
const DB_COLORS = ["#7b3fe4", "#00a37a", "#f59f24", "#e0306f", "#1e88d6", "#ff4b2b", "#3f8f45", "#17173d"];
const DB_NAMES = ["Laia Prats", "Marc Rovira", "Núria Vidal", "Jordi Casals", "Clara Ribas", "Pau Serra", "Aina Costa", "Oriol Puig"];

// ---------- Formats i convidats ----------
// Els debats es fan segons la representació dels partits (criteri de proporcionalitat de la Junta Electoral Central).
const DB_FORMATS = {
  cara: { title: "Cara a cara", net: "Cadena privada", desc: "Tu i el principal rival, una hora, sense ningú més. És el debat més vist de la campanya.", sizes: ["gran"], rivals: 1, blocks: ["obertura", "economia", "habitatge", "pactes", "tancament"], secs: 300 },
  quatre: { title: "Debat a quatre", net: "Televisió pública", desc: "Els quatre partits més grans. Molt de ritme i poc temps per a cadascú.", sizes: ["gran"], rivals: 3, blocks: ["obertura", "economia", "habitatge", "territori", "pactes", "tancament"], secs: 270 },
  set: { title: "Debat a set", net: "Televisió pública", desc: "Tots els grups del Congrés. Per destacar, cal saber triar els moments.", sizes: ["gran", "mitja"], rivals: 6, blocks: ["obertura", "economia", "habitatge", "territori", "pactes", "tancament"], secs: 240 },
  petits: { title: "Debat de les forces sense grup", net: "Canal autonòmic", desc: "Els partits que no tenen grup propi. Menys audiència, però és la teva oportunitat.", sizes: ["nou"], rivals: 3, blocks: ["obertura", "economia", "habitatge", "pactes", "tancament"], secs: 270 },
};
// Rivals de cada format, per ordre de mida (els partits reals de partits.js)
const DB_LINEUPS = {
  quatre: ["pp", "psoe", "vox", "fa"],
  set: ["pp", "psoe", "vox", "fa", "erc", "junts", "bildu"],
  petits: ["salf", "podemos", "bng", "cc"],
};

// ---------- La moderadora ----------
const DB_MOD = { name: "Marta Soler", role: "Moderadora" };
// Aspecte dels avatars del plató (models genèrics de MakeHuman): no reprodueixen la cara de ningú,
// només s'ajusten al gènere, l'edat aproximada i el to de cabell de cada candidat.
const DB_LOOKS = [
  { k: "dona1", label: "Cabell llarg" }, { k: "dona2", label: "Melena" }, { k: "dona3", label: "Cua" }, { k: "dona4", label: "Bob" },
  { k: "home1", label: "Pentinat enrere" }, { k: "home2", label: "Cabell curt" }, { k: "home4", label: "Serrell" }, { k: "home3", label: "Calb" },
];
// Aspecte inicial de cada nom proposat (el jugador el pot canviar)
const DB_NAME_LOOKS = ["dona1", "home2", "dona2", "home1", "dona3", "home4", "dona4", "home3"];
const DB_SKINS = ["#f6d9c5", "#f1cbb0", "#e2b293", "#c99372", "#a86f4c", "#7d4e33"];
const DB_HAIRS = ["#1b1714", "#2a1d16", "#46301f", "#6b4a2c", "#9d7a52", "#c9b9a3", "#a9a39b"];
const DB_CAST = {
  pp: { look: "home1", age: 64, hair: "#a9a39b", skin: "#f1cbb0" },
  psoe: { look: "home2", age: 54, hair: "#2a1d16", skin: "#e2b293" },
  vox: { look: "home1", age: 50, hair: "#1b1714", skin: "#e2b293" },
  fa: { look: "dona2", age: 52, hair: "#2a1d16", skin: "#f1cbb0" },
  podemos: { look: "dona3", age: 38, hair: "#1b1714", skin: "#e2b293" },
  erc: { look: "home2", age: 44, hair: "#1b1714", skin: "#e2b293" },
  junts: { look: "dona1", age: 45, hair: "#46301f", skin: "#f1cbb0" },
  bildu: { look: "home4", age: 58, hair: "#6b4a2c", skin: "#f1cbb0" },
  pnv: { look: "dona2", age: 56, hair: "#6b4a2c", skin: "#f6d9c5" },
  bng: { look: "home3", age: 62, hair: "#a9a39b", skin: "#f1cbb0" },
  cc: { look: "dona1", age: 53, hair: "#2a1d16", skin: "#c99372" },
  salf: { look: "home2", age: 36, hair: "#2a1d16", skin: "#e2b293" },
};
const DB_BLOCKS = {
  obertura: { title: "Presentació", q: "Bona nit i benvinguts al debat. Comencem amb la presentació: per què us haurien de votar el 29 de novembre?", cam: "Un minut per presentar-te" },
  economia: { title: "Economia i impostos", q: "Parlem d'economia. Els preus han pujat més que els sous. Què faran per a les famílies que no arriben a final de mes?" },
  habitatge: { title: "Habitatge", q: "L'habitatge és la principal preocupació dels joves. Quina és la seva proposta concreta?" },
  territori: { title: "Model territorial", q: "Model territorial: finançament autonòmic, autogovern, Catalunya. On se situen?" },
  pactes: { title: "Pactes i governabilitat", q: "Cap partit tindrà majoria absoluta. Amb qui pactaran per governar?" },
  tancament: { title: "Minut d'or", q: "Arribem al final. Cada candidat té un minut per demanar el vot. És el seu minut d'or." },
};

// ---------- Les teves respostes ----------
// Propostes segons la ideologia (economia i habitatge) o el model territorial
const DB_PROPOSALS = {
  economia: {
    esq: "que paguin més els que més tenen, amb un impost a les grans fortunes, i pujar el salari mínim",
    cesq: "pujar els salaris més baixos i reforçar els serveis públics sense ofegar la classe mitjana",
    centre: "menys burocràcia per a autònoms i petites empreses, i uns comptes públics equilibrats",
    cdreta: "abaixar l'IRPF a les rendes mitjanes i atraure inversió que creï feina",
    dreta: "una rebaixa d'impostos general i retallar la despesa política supèrflua",
  },
  habitatge: {
    esq: "posar un topall als lloguers i construir un gran parc públic de lloguer social",
    cesq: "construir habitatge públic a preu assequible i ajudar els joves a pagar el lloguer",
    centre: "incentius fiscals perquè els propietaris lloguin a preu assequible, pactats amb el sector",
    cdreta: "alliberar sòl per construir més i donar seguretat jurídica als propietaris",
    dreta: "desallotjar ràpidament les ocupacions i abaixar els impostos de la compra d'habitatge",
  },
  territori: {
    central: "un sol model per a tot l'Estat, perquè cap territori tingui més privilegis que un altre",
    autonom: "un finançament just i més autogovern, sempre dins de la Constitució",
    sobir: "que la ciutadania pugui decidir el seu futur votant, com en qualsevol democràcia madura",
  },
};
const DB_STORIES = {
  obertura: "Vaig créixer en un barri on la gent s'aixeca a les sis per anar a treballar, i és per ells que em presento",
  economia: "Aquesta setmana una infermera em deia que, amb dues feines, no arriba a final de mes",
  habitatge: "Fa uns dies vaig conèixer una parella de trenta anys que encara viu a casa dels pares perquè el lloguer és impossible",
  territori: "A cada poble on vaig em diuen el mateix: volen que les decisions es prenguin a prop seu",
};
// Les cartes de resposta: cada enfocament té un cost de temps i un efecte diferent en cada grup de votants
const DB_APPROACHES = {
  proposta: { label: "Proposta concreta", icon: "📌", secs: 55, fx: { base: 1, indecisos: 2.2, rivals: 0.4 } },
  dades: { label: "Dades i calendari", icon: "📊", secs: 75, fx: { base: 0.6, indecisos: 2.6, rivals: 0.8 } },
  emocio: { label: "Una història", icon: "💬", secs: 50, fx: { base: 2, indecisos: 1.6, rivals: 0.2 } },
  atac: { label: "Ataca el rival", icon: "⚡", secs: 40, fx: { base: 2.4, indecisos: -0.6, rivals: -1.2 } },
};

// Obertura i minut d'or
const DB_OPENINGS = [
  { k: "emocio", label: "Per què em presento", quote: "{story}. Vull un país on treballar dur torni a valdre la pena." },
  { k: "dades", label: "Diagnòstic del país", quote: "Tres xifres: el preu del lloguer, el sou mitjà dels joves i les llistes d'espera. Totes tres han empitjorat, i jo porto un pla per a cadascuna." },
  { k: "atac", label: "Directe al favorit", quote: "{rival} ha tingut la seva oportunitat i no l'ha aprofitat. Avui els explicaré per què ha arribat l'hora de canviar." },
  { k: "proposta", label: "La promesa estrella", quote: "Si governo, la primera llei serà sobre {tema}: {proposal}." },
];
const DB_CLOSINGS = [
  { k: "esperanca", label: "Esperança", fx: { base: 1.5, indecisos: 2.4, rivals: 0.6 }, quote: "El 29 de novembre no votem contra ningú: votem a favor d'un país que funcioni per a tothom. Us demano la confiança." },
  { k: "por", label: "Advertència", fx: { base: 2.6, indecisos: 0.6, rivals: -0.8 }, quote: "Si no anem a votar, altres decidiran per nosaltres. Aquesta vegada ens hi juguem massa." },
  { k: "proposta", label: "La proposta estrella", fx: { base: 1.2, indecisos: 2.6, rivals: 0.4 }, quote: "Recordeu una sola cosa d'aquest debat: {proposal}. Això és el que farem." },
  { k: "mobilitza", label: "Crida a la mobilització", fx: { base: 3, indecisos: 1, rivals: -0.2 }, quote: "Cada vot compta. Parleu-ne a casa, a la feina, amb els amics. El 29 de novembre, guanyem-ho junts." },
];

// ---------- Rivals: intervencions genèriques segons el perfil del partit ----------
// esq: esquerra; dreta: dreta; sob: sobiranista o nacionalista; nova: partits nous de protesta
const DB_RIVAL_KIND = { pp: "dreta", psoe: "esq", vox: "dreta", fa: "esq", podemos: "esq", erc: "sob", junts: "sob", bildu: "sob", pnv: "sob", bng: "sob", cc: "sob", salf: "nova" };
const DB_RIVAL_LINES = {
  obertura: {
    esq: ["Vinc a defensar el que hem aconseguit i el molt que encara queda per fer per a la majoria social.", "Aquest país avança quan es reparteix millor la riquesa, i això és el que proposem."],
    dreta: ["Vinc a proposar un canvi: menys impostos, més ordre i un Govern que compleixi la paraula.", "Espanya necessita estabilitat i un rumb clar, i nosaltres l'oferim."],
    sob: ["Vinc a defensar els interessos del meu país, que massa sovint s'obliden a Madrid.", "Que ningú no dubti que el nostre vot serà decisiu i que el farem valdre."],
    nova: ["Sóc aquí perquè la gent està farta dels de sempre, i nosaltres no devem res a ningú.", "Els partits tradicionals han fallat. Nosaltres som l'alternativa."],
  },
  economia: {
    esq: ["Hem pujat el salari mínim i això ha anat bé. Cal continuar repartint millor.", "Els beneficis de les grans empreses han de contribuir més."],
    dreta: ["El problema són els impostos: la gent paga massa i rep massa poc.", "Amb menys burocràcia i impostos més baixos, l'economia creixerà més."],
    sob: ["El dèficit fiscal ens llasta: els nostres diners han de servir per als nostres serveis.", "Volem decidir la nostra política econòmica, sense dependre de ningú."],
    nova: ["Mentre els polítics cobren sous de luxe, la gent no arriba a final de mes.", "Primer, retallar els privilegis dels polítics; després, parlem d'impostos."],
  },
  habitatge: {
    esq: ["L'habitatge és un dret, no un negoci: cal regular els lloguers.", "Necessitem molt més habitatge públic, i el volem fer."],
    dreta: ["L'ocupació il·legal i la inseguretat jurídica fan fugir els propietaris del lloguer.", "La solució és construir més, no posar topalls que redueixen l'oferta."],
    sob: ["Les competències d'habitatge són nostres i les volem exercir sense interferències.", "Calen recursos per fer el parc públic que necessitem."],
    nova: ["Els joves no es poden independitzar, i ningú dels que han governat ho ha arreglat.", "Primer cal acabar amb el malbaratament, i després hi haurà diners per a habitatge."],
  },
  territori: {
    esq: ["Defensem un model federal que reconegui la diversitat de l'Estat.", "El diàleg és l'únic camí per resoldre els conflictes territorials."],
    dreta: ["La igualtat de tots els espanyols no es negocia.", "No hi haurà privilegis per a uns quants a canvi de vots."],
    sob: ["El nostre poble té dret a decidir, i no renunciarem a aquest objectiu.", "Volem un finançament que no ens castigui any rere any."],
    nova: ["Les autonomies són una màquina de despesa política que cal aprimar.", "Menys estructures polítiques i més serveis per a la gent."],
  },
  pactes: {
    esq: ["Pactarem amb les forces progressistes. Amb l'extrema dreta, mai.", "La majoria progressista ja ha demostrat que funciona."],
    dreta: ["Volem governar en solitari, i si cal parlar, serà amb qui defensi la unitat d'Espanya.", "No pactarem amb els qui volen trencar el país."],
    sob: ["Els nostres vots tindran un preu, i el preu serà el que necessita el nostre país.", "Pactarem amb qui respecti la nostra voluntat."],
    nova: ["No pactarem amb la casta. Que ens votin i ja en parlarem.", "Nosaltres som el vot de càstig, i no ens vendrem."],
  },
  tancament: {
    esq: ["El 29 de novembre ens juguem si continuem avançant o tornem enrere. Us demano el vot.", "Votar és la millor manera de defensar el que hem aconseguit."],
    dreta: ["El 29 de novembre podem canviar de rumb. Confieu en nosaltres.", "És l'hora del canvi. Us demano el vot per a un Govern fort."],
    sob: ["Com més forts siguem a Madrid, més respectats serem a casa. Voteu-nos.", "El nostre vot és decisiu: feu-lo servir."],
    nova: ["Si esteu farts, ara teniu una alternativa. No us quedeu a casa.", "Sacsegem el sistema. El 29 de novembre, voteu-nos."],
  },
};
// Atacs dels rivals al jugador
const DB_ATTACKS = {
  esq: ["El seu programa beneficia els de sempre. Que ho expliqui a les famílies treballadores.", "Molt de discurs, però on són els números de les seves propostes?"],
  dreta: ["Vostè promet coses que no es poden pagar. Qui les pagarà?", "El seu partit no té ni experiència ni equip per governar."],
  sob: ["Vostè parla de tot l'Estat però no entén res del que passa a casa nostra.", "Les seves promeses sempre s'obliden l'endemà de les eleccions."],
  nova: ["Vostè és un més dels de sempre, encara que vulgui semblar nou.", "Quant cobra vostè? La gent vol saber-ho."],
};

// ---------- Obstacles ----------
// Afirmacions dels rivals que es poden verificar en directe (sobre les regles electorals)
const DB_CLAIMS = [
  { t: "Madrid és la circumscripció que elegeix més diputats: 38.", ok: true, exp: "És cert: Madrid elegeix 38 diputats, i Barcelona 32." },
  { t: "Al Senat, cada província peninsular elegeix sis senadors.", ok: false, exp: "És fals: cada província peninsular n'elegeix quatre." },
  { t: "Per tenir majoria absoluta al Congrés calen 176 diputats.", ok: true, exp: "És cert: la meitat més un dels 350 diputats." },
  { t: "El vot en blanc no compta per a res.", ok: false, exp: "És fals: és un vot vàlid i compta per calcular el 3 % que cal per optar a escó." },
  { t: "La campanya electoral dura quinze dies.", ok: true, exp: "És cert: del 13 al 27 de novembre." },
  { t: "El president del Govern l'escullen directament els ciutadans a les urnes.", ok: false, exp: "És fals: votem diputats, i és el Congrés qui elegeix el president en una investidura." },
  { t: "Els joves de setze anys poden votar en aquestes eleccions.", ok: false, exp: "És fals: a les eleccions generals cal tenir divuit anys." },
  { t: "Una moció de censura ha de proposar un candidat alternatiu a president.", ok: true, exp: "És cert: a Espanya la moció de censura és constructiva." },
  { t: "Cada província té com a mínim dos diputats.", ok: true, exp: "És cert: la llei electoral en garanteix dos a cada província, i un a Ceuta i un a Melilla." },
  { t: "Les enquestes es poden publicar fins al dia abans de votar.", ok: false, exp: "És fals: no se'n poden publicar durant els cinc dies anteriors a la votació." },
  { t: "El Senat pot vetar una llei, però el Congrés pot aixecar el veto.", ok: true, exp: "És cert: per majoria absoluta, o per majoria simple passats dos mesos." },
  { t: "A la jornada de reflexió encara es poden fer mítings fins a mitjanit.", ok: false, exp: "És fals: la campanya s'acaba el divendres a mitjanit i el dissabte no es pot fer campanya." },
];
// Partits amb qui et pregunten si pactaries (per contrast ideològic)
const DB_TRAP = {
  esq: "vox", cesq: "vox", centre: "bildu", cdreta: "bildu", dreta: "bildu",
};
