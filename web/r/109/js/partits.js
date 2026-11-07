// Fotos de Wikimedia Commons (verificades el 20-10-2026). Totes requereixen citar autor i llicència.
const PHOTOS = {
  "Alberto Núñez Feijóo": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/ALBERTO_N%C3%9A%C3%91EZ_FEIJ%C3%93O.jpg/330px-ALBERTO_N%C3%9A%C3%91EZ_FEIJ%C3%93O.jpg",
    "author": "Partido Popular PP",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:ALBERTO_N%C3%9A%C3%91EZ_FEIJ%C3%93O.jpg"
  },
  "Pedro Sánchez": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Pedro_S%C3%A1nchez_in_2026.jpg/330px-Pedro_S%C3%A1nchez_in_2026.jpg",
    "author": "Pool Moncloa/ Carlos Spottorno de las Morenas",
    "license": "Attribution",
    "page": "https://commons.wikimedia.org/wiki/File:Pedro_S%C3%A1nchez_in_2026.jpg"
  },
  "Santiago Abascal": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Santiago_Abascal_%2854349274173%29_%28cropped%29.jpg/330px-Santiago_Abascal_%2854349274173%29_%28cropped%29.jpg",
    "author": "Gage Skidmore from Surprise, AZ, United States of America",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Santiago_Abascal_(54349274173)_(cropped).jpg"
  },
  "Ada Colau": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Ada-Colau-Encuentro-2024.jpg/330px-Ada-Colau-Encuentro-2024.jpg",
    "author": "Robo71",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Ada-Colau-Encuentro-2024.jpg"
  },
  "Irene Montero": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Irene_Montero_Gil%2C_2024_%28cropped%29.jpg/330px-Irene_Montero_Gil%2C_2024_%28cropped%29.jpg",
    "author": "The Left -MEP Irene Montero, Podemos - The Left in the European Parliament",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Irene_Montero_Gil,_2024_(cropped).jpg"
  },
  "Gabriel Rufián": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Gabriel_Rufi%C3%A1n_Portavoz_de_Esquerra_Republicana_en_el_Congreso_de_los_diputados_%28cropped%29.jpg/330px-Gabriel_Rufi%C3%A1n_Portavoz_de_Esquerra_Republicana_en_el_Congreso_de_los_diputados_%28cropped%29.jpg",
    "author": "Marcpuigperez",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Gabriel_Rufi%C3%A1n_Portavoz_de_Esquerra_Republicana_en_el_Congreso_de_los_diputados_(cropped).jpg"
  },
  "Míriam Nogueras": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Candidats_Eleccions_Generals_2015_-_M%C3%ADriam_Nogueras.jpg/330px-Candidats_Eleccions_Generals_2015_-_M%C3%ADriam_Nogueras.jpg",
    "author": "Convergència Democràtica de Catalunya",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Candidats_Eleccions_Generals_2015_-_M%C3%ADriam_Nogueras.jpg"
  },
  "Oskar Matute": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/BC_OSKAR_MATUTE.jpg/330px-BC_OSKAR_MATUTE.jpg",
    "author": "EH Bildu",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:BC_OSKAR_MATUTE.jpg"
  },
  "Maribel Vaquero": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Maribel_Vaquero_2019_%28cropped%29.jpg/330px-Maribel_Vaquero_2019_%28cropped%29.jpg",
    "author": "EAJ-PNV GIpuzkoa",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Maribel_Vaquero_2019_(cropped).jpg"
  },
  "Néstor Rego": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/N%C3%A9stor_Rego_Candamil%2C_XV_Asemblea_Nacional_Bloque_Nacionalista_Galego_21.jpg/330px-N%C3%A9stor_Rego_Candamil%2C_XV_Asemblea_Nacional_Bloque_Nacionalista_Galego_21.jpg",
    "author": "Elisardojm",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:N%C3%A9stor_Rego_Candamil,_XV_Asemblea_Nacional_Bloque_Nacionalista_Galego_21.jpg"
  },
  "Cristina Valido": {
    "src": "https://upload.wikimedia.org/wikipedia/commons/6/66/Cristina_Valido_2023_%28cropped%29.jpg",
    "author": "Canal 10 televisión 📺 (youtube)",
    "license": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Cristina_Valido_2023_(cropped).jpg"
  },
  "Alvise Pérez": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/1720511531544_20240709_PEREZ_FERNANDEZ_Luis_ES_004.jpg/330px-1720511531544_20240709_PEREZ_FERNANDEZ_Luis_ES_004.jpg",
    "author": "European Union 2024 - Source : EP",
    "license": "European Parliament",
    "page": "https://commons.wikimedia.org/wiki/File:1720511531544_20240709_PEREZ_FERNANDEZ_Luis_ES_004.jpg"
  },
  "Ione Belarra": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Ione_Belarra_2023.jpg/330px-Ione_Belarra_2023.jpg",
    "author": "Podemos",
    "license": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Ione_Belarra_2023.jpg"
  },
  "Oriol Junqueras": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Oriol_Junqueras_a_Terrassa_2021_%28cropped%29.jpg/330px-Oriol_Junqueras_a_Terrassa_2021_%28cropped%29.jpg",
    "author": "Marcpuigperez",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Oriol_Junqueras_a_Terrassa_2021_(cropped).jpg"
  },
  "Carles Puigdemont": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Carles_Puigdemont_2024.jpg/330px-Carles_Puigdemont_2024.jpg",
    "author": "Parlament de Catalunya",
    "license": "Attribution",
    "page": "https://commons.wikimedia.org/wiki/File:Carles_Puigdemont_2024.jpg"
  },
  "Arnaldo Otegi": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Arnaldo_Otegi_2016_%28cropped%29.jpg/330px-Arnaldo_Otegi_2016_%28cropped%29.jpg",
    "author": "Sinn Féin",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Arnaldo_Otegi_2016_(cropped).jpg"
  },
  "Aitor Esteban": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Aitor_Esteban_2016_%28cropped%29.jpg/330px-Aitor_Esteban_2016_%28cropped%29.jpg",
    "author": "Carmen Moraga / El diario",
    "license": "CC BY-SA 3.0 es",
    "page": "https://commons.wikimedia.org/wiki/File:Aitor_Esteban_2016_(cropped).jpg"
  },
  "Ana Pontón": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Ana_Pont%C3%B3n_2022_%28cropped%29.jpg/330px-Ana_Pont%C3%B3n_2022_%28cropped%29.jpg",
    "author": "infoLibre (youtube)",
    "license": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Ana_Pont%C3%B3n_2022_(cropped).jpg"
  },
  "Yolanda Díaz": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/A90Q3891.jpg_%28cropped%29.jpg/330px-A90Q3891.jpg_%28cropped%29.jpg",
    "author": "AntonMST29",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:A90Q3891.jpg_(cropped).jpg"
  },
  "Isabel Díaz Ayuso": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Isabel_D%C3%ADaz_Ayuso_-_240422_193809_%28cropped%29.jpg/330px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Isabel_D%C3%ADaz_Ayuso_-_240422_193809_%28cropped%29.jpg",
    "author": "Barcex",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Isabel_D%C3%ADaz_Ayuso_-_240422_193809_(cropped).jpg"
  },
  "Salvador Illa": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Official_portrait_of_Salvador_Illa%2C_2024.jpg/330px-Official_portrait_of_Salvador_Illa%2C_2024.jpg",
    "author": "Generalitat de Catalunya",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Official_portrait_of_Salvador_Illa,_2024.jpg"
  },
  "Àgueda Micó": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/%C3%80gueda_Mic%C3%B3_%28cropped%29.jpg/330px-%C3%80gueda_Mic%C3%B3_%28cropped%29.jpg",
    "author": "Coalició Compromís",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:%C3%80gueda_Mic%C3%B3_(cropped).jpg"
  }
};

// ---------- Partits que es presenten al 29N ----------
// Candidatures segons la Viquipèdia (consulta del 20-10-2026), pendents de la proclamació oficial.
// x: eix esquerra (0) – dreta (10); y: centralisme (0) – sobiranisme (10). Posicions orientatives.
// Vots: investidura de Sánchez (16-11-2023) i llei d'amnistia (votació final, 30-5-2024).
const PARTIES = [
  { id: "pp", sig: "PP", name: "Partido Popular", color: "#1e88d6", founded: "1989 (refundació d'Alianza Popular, 1976)",
    seats: 137, votes: 33.1, euro: "Partit Popular Europeu (PPE)", x: 7.6, y: 1.8,
    ideas: ["Conservadorisme", "Liberalisme econòmic", "Democràcia cristiana", "Centredreta"],
    territory: "Defensa l'Estat autonòmic actual i la unitat d'Espanya.",
    inv: "no", amn: "no", note: "Concorre en coalició amb UPN a Navarra.",
    cand: { name: "Alberto Núñez Feijóo", info: "President del PP des del 2022. Va presidir la Xunta de Galícia (2009–2022)." },
    leader: { name: "Alberto Núñez Feijóo", role: "President" } },
  { id: "psoe", sig: "PSOE", name: "Partido Socialista Obrero Español", color: "#e3101f", founded: "1879",
    seats: 121, votes: 31.7, euro: "Socialistes i Demòcrates (S&D)", x: 3.6, y: 4.6,
    ideas: ["Socialdemocràcia", "Centreesquerra", "Federalisme"],
    territory: "Proposa una reforma federal de l'Estat.",
    inv: "sí", amn: "sí", note: "Concorre amb el PSC a Catalunya.",
    cand: { name: "Pedro Sánchez", info: "President del Govern des del 2018. Secretari general del PSOE des del 2017." },
    leader: { name: "Pedro Sánchez", role: "Secretari general" } },
  { id: "vox", sig: "Vox", name: "Vox", color: "#5cbf2a", founded: "2013",
    seats: 33, votes: 12.4, euro: "Patriotes per Europa", x: 9.5, y: 0.4,
    ideas: ["Nacionalisme espanyol", "Conservadorisme", "Dreta radical"],
    territory: "Vol recentralitzar l'Estat i suprimir les autonomies.",
    inv: "no", amn: "no", note: "",
    cand: { name: "Santiago Abascal", info: "President de Vox des del 2014. Va ser diputat al Parlament Basc pel PP." },
    leader: { name: "Santiago Abascal", role: "President" } },
  { id: "fa", sig: "FA", name: "Frente Amplio", color: "#e0306f", founded: "2026 (refundació de Sumar, 2023)",
    seats: 31, votes: 12.3, euro: "Verds/ALE i L'Esquerra", x: 2.6, y: 5.6,
    ideas: ["Esquerra", "Ecologisme", "Feminisme", "Plurinacionalitat"],
    territory: "Defensa un Estat plurinacional.",
    inv: "sí", amn: "sí", note: "Coalició d'IU, Movimiento Sumar, Más Madrid i Catalunya en Comú, entre d'altres. Les dades de 2023 són les de Sumar.",
    cand: { name: "Ada Colau", info: "Alcaldessa de Barcelona del 2015 al 2023. Va ser portaveu de la PAH." },
    leader: null },
  { id: "podemos", sig: "Podemos", name: "Podemos", color: "#6c2b7e", founded: "2014",
    seats: 4, votes: null, euro: "L'Esquerra", x: 1, y: 6.9,
    ideas: ["Esquerra", "Republicanisme", "Feminisme"],
    territory: "Defensa la plurinacionalitat i un referèndum pactat a Catalunya.",
    inv: "sí", amn: "sí", note: "El 2023 va anar dins de Sumar; els seus diputats van passar al Grup Mixt.",
    cand: { name: "Irene Montero", info: "Ministra d'Igualtat (2020–2023) i eurodiputada des del 2024." },
    leader: { name: "Ione Belarra", role: "Secretària general" } },
  { id: "erc", sig: "ERC", name: "Esquerra Republicana de Catalunya", color: "#f59f24", founded: "1931",
    seats: 7, votes: 1.9, euro: "Verds/ALE", x: 3.2, y: 9.6,
    ideas: ["Independentisme", "Republicanisme", "Esquerra"],
    territory: "Vol la independència de Catalunya.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Gabriel Rufián", info: "Diputat des del 2016 i portaveu d'ERC al Congrés des del 2019." },
    leader: { name: "Oriol Junqueras", role: "President" } },
  { id: "junts", sig: "Junts", name: "Junts per Catalunya", color: "#20b8c8", founded: "2020",
    seats: 7, votes: 1.6, euro: "No inscrits", x: 6.2, y: 9.7,
    ideas: ["Independentisme", "Catalanisme", "Centredreta"],
    territory: "Vol la independència de Catalunya.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Míriam Nogueras", info: "Portaveu de Junts al Congrés." },
    leader: { name: "Carles Puigdemont", role: "President" } },
  { id: "bildu", sig: "EH Bildu", name: "Euskal Herria Bildu", color: "#0f9a83", founded: "2012",
    seats: 6, votes: 1.4, euro: "L'Esquerra", x: 0.9, y: 9.4,
    ideas: ["Independentisme basc", "Esquerra abertzale", "Socialisme"],
    territory: "Vol la independència d'Euskal Herria.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Oskar Matute", info: "Diputat al Congrés des del 2019." },
    leader: { name: "Arnaldo Otegi", role: "Coordinador general" } },
  { id: "pnv", sig: "PNV", name: "Partido Nacionalista Vasco", color: "#3f8f45", founded: "1895",
    seats: 5, votes: 1.1, euro: "Renew Europe", x: 5.4, y: 8,
    ideas: ["Nacionalisme basc", "Democràcia cristiana", "Centredreta"],
    territory: "Defensa més autogovern i el concert econòmic.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Maribel Vaquero", info: "Diputada del PNV al Congrés." },
    leader: { name: "Aitor Esteban", role: "President de l'EBB" } },
  { id: "bng", sig: "BNG", name: "Bloque Nacionalista Galego", color: "#7bb6e0", founded: "1982",
    seats: 1, votes: 0.6, euro: "Verds/ALE", x: 2.2, y: 8.1,
    ideas: ["Nacionalisme gallec", "Esquerra", "Sobiranisme"],
    territory: "Defensa el dret a l'autodeterminació de Galícia.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Néstor Rego", info: "Diputat al Congrés des del 2019." },
    leader: { name: "Ana Pontón", role: "Portaveu nacional" } },
  { id: "cc", sig: "CC", name: "Coalición Canaria", color: "#f2d21b", founded: "1993",
    seats: 1, votes: 0.5, euro: "—", x: 5.6, y: 6.4,
    ideas: ["Nacionalisme canari", "Regionalisme", "Centre"],
    territory: "Defensa més autogovern per a Canàries.",
    inv: "sí", amn: "no", note: "Concorre amb Primero Canarias.",
    cand: { name: "Cristina Valido", info: "Diputada de CC al Congrés." },
    leader: null },
  { id: "salf", sig: "SALF", name: "Se Acabó La Fiesta", color: "#5d4037", founded: "2024",
    seats: 0, votes: null, euro: "No inscrits", x: 8.6, y: 1.6,
    ideas: ["Populisme", "Antiestablishment", "Dreta"],
    territory: "",
    inv: "—", amn: "—", note: "Sense diputats al Congrés. Va obtenir 3 eurodiputats el 2024.",
    cand: { name: "Alvise Pérez", info: "Fundador del partit i eurodiputat des del 2024." },
    leader: { name: "Alvise Pérez", role: "Fundador" } },
];

// Fotos reals per als polítics del Match ideològic
MATCH_ACTORS.forEach((a) => { if (PHOTOS[a.name]) a.photo = PHOTOS[a.name]; });

// ---------- Argumentari dels partits ----------
// Resum a partir dels programes electorals del 2023 i de les posicions públiques de cada partit.
// Redactat en termes neutres («defensa», «proposa»). Els programes del 29N poden introduir canvis.
const ARG_AREAS = [
  { k: "eco", label: "Economia i impostos", icon: `<path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/>` },
  { k: "treb", label: "Treball i pensions", icon: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/>` },
  { k: "hab", label: "Habitatge", icon: `<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>` },
  { k: "ter", label: "Model territorial", icon: `<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>` },
  { k: "soc", label: "Societat i drets", icon: `<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20a6 6 0 0112 0M10 20a6 6 0 0112 0"/>` },
  { k: "imm", label: "Immigració", icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>` },
  { k: "clima", label: "Energia i clima", icon: `<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>` },
  { k: "ext", label: "Europa i món", icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7l1.2 2.6 2.8.3-2.1 1.9.6 2.8L12 13.2l-2.5 1.4.6-2.8L8 9.9l2.8-.3z"/>` },
];

const PARTY_ARGS = {
  pp: {
    core: "Rebaixar impostos, defensar la unitat d'Espanya i ser l'alternativa de govern al PSOE.",
    about: "Partit de centredreta que combina conservadorisme i liberalisme econòmic. Defensa l'economia de mercat, la Constitució del 1978 i la monarquia parlamentària.",
    eco: "Rebaixar l'IRPF a les rendes baixes i mitjanes, reduir la despesa política i simplificar la burocràcia.",
    treb: "Crear ocupació amb menys càrregues per a empreses i autònoms.",
    hab: "Alliberar sòl, impulsar habitatge assequible amb col·laboració publicoprivada i desallotjar ràpidament les ocupacions il·legals.",
    ter: "Mantenir l'Estat autonòmic. Rebutja l'amnistia i qualsevol referèndum d'autodeterminació.",
    soc: "Suport a la natalitat i a les famílies, i llibertat d'elecció de centre educatiu.",
    imm: "Immigració legal i ordenada, vinculada al mercat de treball, i més control de fronteres.",
    clima: "Allargar la vida de les centrals nuclears i fer una transició energètica gradual.",
    ext: "Europeisme (Partit Popular Europeu) i compromís amb l'OTAN.",
  },
  psoe: {
    core: "Ampliar drets i l'estat del benestar, i gestionar el conflicte territorial amb diàleg.",
    about: "Partit socialdemòcrata fundat el 1879, el més antic d'Espanya. Defensa un estat del benestar fort, la redistribució de la riquesa, el feminisme i una Espanya plural.",
    eco: "Gravàmens a la banca i a les energètiques i més tributació per a les grans fortunes.",
    treb: "Manté la reforma laboral del 2021, les pujades del salari mínim i les pensions revaloritzades amb l'IPC.",
    hab: "Llei d'habitatge amb límits al lloguer a les zones tensionades i un gran parc d'habitatge públic.",
    ter: "Una Espanya plural amb horitzó federal. Ha impulsat la llei d'amnistia i el diàleg amb Catalunya.",
    soc: "Feminisme, paritat per llei i drets LGTBI.",
    imm: "Vies legals i ordenades d'immigració i integració dels qui ja hi viuen.",
    clima: "Transició cap a les renovables i tancament progressiu de les centrals nuclears.",
    ext: "Europeisme (Socialistes i Demòcrates). El seu govern va reconèixer l'Estat de Palestina el 2024.",
  },
  vox: {
    core: "Defensar la unitat i la identitat nacional d'Espanya i frenar la immigració il·legal.",
    about: "Partit de dreta radical i nacionalista espanyol. Defensa un Estat centralitzat, la família tradicional i la sobirania nacional davant la UE.",
    eco: "Rebaixes fortes d'impostos i retallar la despesa política i les subvencions a partits, sindicats i patronals.",
    treb: "Prioritat per als treballadors espanyols i suport a l'autònom.",
    hab: "Ajudes perquè els joves accedeixin a l'habitatge i mà dura contra l'ocupació il·legal.",
    ter: "Suprimir l'Estat de les autonomies i il·legalitzar els partits separatistes.",
    soc: "Derogar la llei de violència de gènere, protegir la vida «des de la concepció» i promoure la natalitat.",
    imm: "Deportar els immigrants en situació irregular i aplicar la «prioritat nacional» a les ajudes socials.",
    clima: "S'oposa a l'Agenda 2030 i al Pacte Verd europeu.",
    ext: "Una Europa de nacions sobiranes (Patriotes per Europa).",
  },
  fa: {
    core: "Repartir millor la riquesa i el temps: més drets laborals, habitatge i transició ecològica.",
    about: "Coalició d'esquerres i ecologista que hereta Sumar. Hi conflueixen Izquierda Unida, Movimiento Sumar, Más Madrid i els Comuns, i defensa un Estat plurinacional.",
    eco: "Més impostos a les grans fortunes i a les rendes més altes. Sumar va proposar el 2023 una herència universal per als joves.",
    treb: "Reduir la jornada laboral a 37,5 hores setmanals sense rebaixar el sou.",
    hab: "Limitar el preu del lloguer i ampliar molt el parc d'habitatge públic.",
    ter: "Reconeixement de la plurinacionalitat i diàleg com a via per resoldre els conflictes territorials.",
    soc: "Feminisme, drets LGTBI i ampliar la sanitat pública a la salut mental i dental.",
    imm: "Regularització de les persones migrants que ja viuen i treballen a Espanya.",
    clima: "Transició ecològica justa, amb més renovables i protecció del territori.",
    ext: "Política exterior de pau i defensa del poble palestí.",
  },
  podemos: {
    core: "Una esquerra sense concessions: intervenir el mercat, feminisme i república.",
    about: "Partit d'esquerres nascut el 2014 de l'onada del 15-M. Critica el bipartidisme i el que anomena «règim del 78» i defensa una forta intervenció pública.",
    eco: "Impostos a les grans fortunes, la banca i les energètiques, i una empresa pública d'energia.",
    treb: "Reduir la jornada laboral i reforçar els drets dels treballadors.",
    hab: "Intervenir el mercat del lloguer i limitar la compra d'habitatges amb finalitat especulativa.",
    ter: "Plurinacionalitat i un referèndum pactat a Catalunya.",
    soc: "Feminisme i drets LGTBI: va impulsar la llei del «només sí és sí» i la llei trans.",
    imm: "Regularització extraordinària de les persones migrants.",
    clima: "Transició ecològica amb control públic de l'energia.",
    ext: "No a l'augment de la despesa militar i ruptura de relacions amb Israel.",
  },
  erc: {
    core: "La independència de Catalunya per la via d'un referèndum, amb polítiques d'esquerres.",
    about: "Partit republicà, independentista i d'esquerres fundat el 1931. Fa valer el seu suport al Congrés per aconseguir millores per a Catalunya.",
    eco: "Un finançament singular perquè Catalunya recapti i gestioni els seus impostos.",
    treb: "Polítiques socials i millora de les condicions laborals.",
    hab: "Més habitatge públic i límits al preu del lloguer.",
    ter: "Un referèndum d'autodeterminació acordat i, mentrestant, més competències, com Rodalies.",
    soc: "Feminisme i defensa de la llengua catalana.",
    imm: "",
    clima: "Transició energètica basada en les renovables.",
    ext: "Europeisme i oficialitat del català a la Unió Europea.",
  },
  junts: {
    core: "La independència de Catalunya i una relació de tu a tu amb l'Estat.",
    about: "Partit independentista fundat per Carles Puigdemont el 2020, hereu de l'espai de Convergència. Combina el sobiranisme amb posicions econòmiques de centredreta.",
    eco: "Menys pressió fiscal per a famílies, autònoms i empreses, i que Catalunya recapti tots els seus impostos.",
    treb: "Suport als autònoms i a la petita i mitjana empresa.",
    hab: "Seguretat jurídica per als propietaris i actuació ràpida contra l'ocupació il·legal.",
    ter: "Independència de Catalunya. Va pactar l'amnistia a canvi de la investidura de Sánchez.",
    soc: "Defensa de la llengua i la cultura catalanes.",
    imm: "Que la Generalitat tingui competències en immigració.",
    clima: "",
    ext: "Oficialitat del català a la Unió Europea.",
  },
  bildu: {
    core: "La independència d'Euskal Herria i una agenda d'esquerres.",
    about: "Coalició de l'esquerra abertzale creada el 2012. Defensa el dret a decidir del poble basc i polítiques socials, feministes i ecologistes.",
    eco: "Una fiscalitat més progressiva i la defensa dels serveis públics.",
    treb: "Un salari mínim propi per al País Basc i Navarra i millores de les pensions.",
    hab: "Habitatge públic i límits al preu del lloguer.",
    ter: "Dret a decidir i un nou estatus nacional per a Euskal Herria.",
    soc: "Feminisme i promoció de l'euskera.",
    imm: "",
    clima: "Una transició ecosocial.",
    ext: "",
  },
  pnv: {
    core: "Més autogovern per a Euskadi i estabilitat econòmica.",
    about: "Partit nacionalista basc i democristià fundat el 1895. Ha governat Euskadi gairebé sempre des del 1980 i pacta tant amb el PSOE com amb el PP.",
    eco: "Defensa del concert econòmic i d'una economia productiva i industrial.",
    treb: "Que el Govern basc gestioni la Seguretat Social i les polítiques d'ocupació.",
    hab: "",
    ter: "Completar els traspassos de l'Estatut de Gernika i un nou estatus d'autogovern.",
    soc: "Promoció de l'euskera.",
    imm: "",
    clima: "Una transició energètica que protegeixi la indústria.",
    ext: "Europeisme (Renew Europe).",
  },
  bng: {
    core: "Galícia com a nació: dret a l'autodeterminació i defensa dels interessos gallecs.",
    about: "Front nacionalista gallec d'esquerres fundat el 1982. Liderat per Ana Pontón, és la segona força al Parlament de Galícia.",
    eco: "Una tarifa elèctrica pròpia per a Galícia, que produeix més energia de la que consumeix.",
    treb: "Defensa del sector primari i de la indústria gallega.",
    hab: "",
    ter: "Dret a l'autodeterminació i traspàs de l'autopista AP-9.",
    soc: "Defensa i normalització del gallec.",
    imm: "",
    clima: "",
    ext: "",
  },
  cc: {
    core: "L'agenda canària: que les illes tinguin veu pròpia a Madrid.",
    about: "Partit nacionalista canari de centre fundat el 1993. Fernando Clavijo presideix el Govern de Canàries des del 2023.",
    eco: "Complir el Règim Econòmic i Fiscal (REF) de Canàries.",
    treb: "",
    hab: "",
    ter: "Desplegar l'Estatut d'autonomia i assumir més competències.",
    soc: "",
    imm: "Que l'Estat i la UE comparteixin la gestió de la immigració que arriba a les illes i l'acollida de menors.",
    clima: "",
    ext: "Defensa de l'estatus de regió ultraperifèrica de la UE.",
  },
  salf: {
    core: "Acabar amb els privilegis polítics i la corrupció: «s'ha acabat la festa».",
    about: "Partit creat el 2024 per l'activista i influenciador Alvise Pérez. Es presenta com a antisistema i crític amb tots els partits.",
    eco: "Abaixar impostos i retallar la despesa política.",
    treb: "",
    hab: "",
    ter: "",
    soc: "Mà dura contra la delinqüència, amb grans presons inspirades en el model d'El Salvador.",
    imm: "Un control estricte de la immigració.",
    clima: "",
    ext: "",
  },
};
