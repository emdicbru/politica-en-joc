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
  { id: "pp", sig: "PP", name: "Partido Popular", color: "#1e88d6", founded: "1989 (refundación de Alianza Popular, 1976)",
    seats: 137, votes: 33.1, euro: "Partido Popular Europeo (PPE)", x: 7.6, y: 1.8,
    ideas: ["Conservadurismo", "Liberalismo económico", "Democracia cristiana", "Centroderecha"],
    territory: "Defiende el Estado autonómico actual y la unidad de España.",
    inv: "no", amn: "no", note: "Concurre en coalición con UPN en Navarra.",
    cand: { name: "Alberto Núñez Feijóo", info: "Presidente del PP desde 2022. Presidió la Xunta de Galicia (2009–2022)." },
    leader: { name: "Alberto Núñez Feijóo", role: "Presidente" } },
  { id: "psoe", sig: "PSOE", name: "Partido Socialista Obrero Español", color: "#e3101f", founded: "1879",
    seats: 121, votes: 31.7, euro: "Socialistas y Demócratas (S&D)", x: 3.6, y: 4.6,
    ideas: ["Socialdemocracia", "Centroizquierda", "Federalismo"],
    territory: "Propone una reforma federal del Estado.",
    inv: "sí", amn: "sí", note: "Concurre con el PSC en Cataluña.",
    cand: { name: "Pedro Sánchez", info: "Presidente del Gobierno desde 2018. Secretario general del PSOE desde 2017." },
    leader: { name: "Pedro Sánchez", role: "Secretario general" } },
  { id: "vox", sig: "Vox", name: "Vox", color: "#5cbf2a", founded: "2013",
    seats: 33, votes: 12.4, euro: "Patriotas por Europa", x: 9.5, y: 0.4,
    ideas: ["Nacionalismo español", "Conservadurismo", "Derecha radical"],
    territory: "Quiere recentralizar el Estado y suprimir las autonomías.",
    inv: "no", amn: "no", note: "",
    cand: { name: "Santiago Abascal", info: "Presidente de Vox desde 2014. Fue diputado en el Parlamento Vasco por el PP." },
    leader: { name: "Santiago Abascal", role: "Presidente" } },
  { id: "fa", sig: "FA", name: "Frente Amplio", color: "#e0306f", founded: "2026 (refundación de Sumar, 2023)",
    seats: 31, votes: 12.3, euro: "Verdes/ALE y La Izquierda", x: 2.6, y: 5.6,
    ideas: ["Izquierda", "Ecologismo", "Feminismo", "Plurinacionalidad"],
    territory: "Defiende un Estado plurinacional.",
    inv: "sí", amn: "sí", note: "Coalición de IU, Movimiento Sumar, Más Madrid y Catalunya en Comú, entre otros. Los datos de 2023 son los de Sumar.",
    cand: { name: "Ada Colau", info: "Alcaldesa de Barcelona de 2015 a 2023. Fue portavoz de la PAH." },
    leader: null },
  { id: "podemos", sig: "Podemos", name: "Podemos", color: "#6c2b7e", founded: "2014",
    seats: 4, votes: null, euro: "La Izquierda", x: 1, y: 6.9,
    ideas: ["Izquierda", "Republicanismo", "Feminismo"],
    territory: "Defiende la plurinacionalidad y un referéndum pactado en Cataluña.",
    inv: "sí", amn: "sí", note: "En 2023 fue dentro de Sumar; sus diputados pasaron al Grupo Mixto.",
    cand: { name: "Irene Montero", info: "Ministra de Igualdad (2020–2023) y eurodiputada desde 2024." },
    leader: { name: "Ione Belarra", role: "Secretaria general" } },
  { id: "erc", sig: "ERC", name: "Esquerra Republicana de Catalunya", color: "#f59f24", founded: "1931",
    seats: 7, votes: 1.9, euro: "Verds/ALE", x: 3.2, y: 9.6,
    ideas: ["Independentismo", "Republicanismo", "Izquierda"],
    territory: "Quiere la independencia de Cataluña.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Gabriel Rufián", info: "Diputado desde 2016 y portavoz de ERC en el Congreso desde 2019." },
    leader: { name: "Oriol Junqueras", role: "Presidente" } },
  { id: "junts", sig: "Junts", name: "Junts per Catalunya", color: "#20b8c8", founded: "2020",
    seats: 7, votes: 1.6, euro: "No inscritos", x: 6.2, y: 9.7,
    ideas: ["Independentismo", "Catalanismo", "Centroderecha"],
    territory: "Quiere la independencia de Cataluña.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Míriam Nogueras", info: "Portavoz de Junts en el Congreso." },
    leader: { name: "Carles Puigdemont", role: "Presidente" } },
  { id: "bildu", sig: "EH Bildu", name: "Euskal Herria Bildu", color: "#0f9a83", founded: "2012",
    seats: 6, votes: 1.4, euro: "La Izquierda", x: 0.9, y: 9.4,
    ideas: ["Independentismo vasco", "Izquierda abertzale", "Socialismo"],
    territory: "Quiere la independencia de Euskal Herria.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Oskar Matute", info: "Diputado en el Congreso desde 2019." },
    leader: { name: "Arnaldo Otegi", role: "Coordinador general" } },
  { id: "pnv", sig: "PNV", name: "Partido Nacionalista Vasco", color: "#3f8f45", founded: "1895",
    seats: 5, votes: 1.1, euro: "Renew Europe", x: 5.4, y: 8,
    ideas: ["Nacionalismo vasco", "Democracia cristiana", "Centroderecha"],
    territory: "Defiende más autogobierno y el concierto económico.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Maribel Vaquero", info: "Diputada del PNV en el Congreso." },
    leader: { name: "Aitor Esteban", role: "Presidente del EBB" } },
  { id: "bng", sig: "BNG", name: "Bloque Nacionalista Galego", color: "#7bb6e0", founded: "1982",
    seats: 1, votes: 0.6, euro: "Verds/ALE", x: 2.2, y: 8.1,
    ideas: ["Nacionalismo gallego", "Izquierda", "Soberanismo"],
    territory: "Defiende el derecho a la autodeterminación de Galicia.",
    inv: "sí", amn: "sí", note: "",
    cand: { name: "Néstor Rego", info: "Diputado en el Congreso desde 2019." },
    leader: { name: "Ana Pontón", role: "Portavoz nacional" } },
  { id: "cc", sig: "CC", name: "Coalición Canaria", color: "#f2d21b", founded: "1993",
    seats: 1, votes: 0.5, euro: "—", x: 5.6, y: 6.4,
    ideas: ["Nacionalismo canario", "Regionalismo", "Centro"],
    territory: "Defiende más autogobierno para Canarias.",
    inv: "sí", amn: "no", note: "Concurre con Primero Canarias.",
    cand: { name: "Cristina Valido", info: "Diputada de CC en el Congreso." },
    leader: null },
  { id: "salf", sig: "SALF", name: "Se Acabó La Fiesta", color: "#5d4037", founded: "2024",
    seats: 0, votes: null, euro: "No inscritos", x: 8.6, y: 1.6,
    ideas: ["Populismo", "Antiestablishment", "Derecha"],
    territory: "",
    inv: "—", amn: "—", note: "Sin diputados en el Congreso. Obtuvo 3 eurodiputados en 2024.",
    cand: { name: "Alvise Pérez", info: "Fundador del partido y eurodiputado desde 2024." },
    leader: { name: "Alvise Pérez", role: "Fundador" } },
];

// Fotos reals per als polítics del Match ideològic
MATCH_ACTORS.forEach((a) => { if (PHOTOS[a.name]) a.photo = PHOTOS[a.name]; });

// ---------- Argumentari dels partits ----------
// Resum a partir dels programes electorals del 2023 i de les posicions públiques de cada partit.
// Redactat en termes neutres («defensa», «proposa»). Els programes del 29N poden introduir canvis.
const ARG_AREAS = [
  { k: "eco", label: "Economía e impuestos", icon: `<path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/>` },
  { k: "treb", label: "Trabajo y pensiones", icon: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/>` },
  { k: "hab", label: "Vivienda", icon: `<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>` },
  { k: "ter", label: "Modelo territorial", icon: `<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>` },
  { k: "soc", label: "Sociedad y derechos", icon: `<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20a6 6 0 0112 0M10 20a6 6 0 0112 0"/>` },
  { k: "imm", label: "Inmigración", icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>` },
  { k: "clima", label: "Energía y clima", icon: `<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>` },
  { k: "ext", label: "Europa y mundo", icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7l1.2 2.6 2.8.3-2.1 1.9.6 2.8L12 13.2l-2.5 1.4.6-2.8L8 9.9l2.8-.3z"/>` },
];

const PARTY_ARGS = {
  pp: {
    core: "Bajar impuestos, defender la unidad de España y ser la alternativa de gobierno al PSOE.",
    about: "Partido de centroderecha que combina conservadurismo y liberalismo económico. Defiende la economía de mercado, la Constitución de 1978 y la monarquía parlamentaria.",
    eco: "Bajar el IRPF a las rentas bajas y medias, reducir el gasto político y simplificar la burocracia.",
    treb: "Crear empleo con menos cargas para empresas y autónomos.",
    hab: "Liberar suelo, impulsar vivienda asequible con colaboración público-privada y desalojar rápidamente las okupaciones ilegales.",
    ter: "Mantener el Estado autonómico. Rechaza la amnistía y cualquier referéndum de autodeterminación.",
    soc: "Apoyo a la natalidad y a las familias, y libertad de elección de centro educativo.",
    imm: "Inmigración legal y ordenada, vinculada al mercado de trabajo, y más control de fronteras.",
    clima: "Alargar la vida de las centrales nucleares y hacer una transición energética gradual.",
    ext: "Europeísmo (Partido Popular Europeo) y compromiso con la OTAN.",
  },
  psoe: {
    core: "Ampliar derechos y el estado del bienestar, y gestionar el conflicto territorial con diálogo.",
    about: "Partido socialdemócrata fundado en 1879, el más antiguo de España. Defiende un estado del bienestar fuerte, la redistribución de la riqueza, el feminismo y una España plural.",
    eco: "Gravámenes a la banca y a las energéticas y más tributación para las grandes fortunas.",
    treb: "Mantiene la reforma laboral de 2021, las subidas del salario mínimo y las pensiones revalorizadas con el IPC.",
    hab: "Ley de vivienda con límites al alquiler en las zonas tensionadas y un gran parque de vivienda pública.",
    ter: "Una España plural con horizonte federal. Ha impulsado la ley de amnistía y el diálogo con Cataluña.",
    soc: "Feminismo, paridad por ley y derechos LGTBI.",
    imm: "Vías legales y ordenadas de inmigración e integración de quienes ya viven aquí.",
    clima: "Transición hacia las renovables y cierre progresivo de las centrales nucleares.",
    ext: "Europeísmo (Socialistas y Demócratas). Su gobierno reconoció el Estado de Palestina en 2024.",
  },
  vox: {
    core: "Defender la unidad y la identidad nacional de España y frenar la inmigración ilegal.",
    about: "Partido de derecha radical y nacionalista español. Defiende un Estado centralizado, la familia tradicional y la soberanía nacional frente a la UE.",
    eco: "Fuertes bajadas de impuestos y recortar el gasto político y las subvenciones a partidos, sindicatos y patronales.",
    treb: "Prioridad para los trabajadores españoles y apoyo al autónomo.",
    hab: "Ayudas para que los jóvenes accedan a la vivienda y mano dura contra la okupación ilegal.",
    ter: "Suprimir el Estado de las autonomías e ilegalizar los partidos separatistas.",
    soc: "Derogar la ley de violencia de género, proteger la vida «desde la concepción» y promover la natalidad.",
    imm: "Deportar a los inmigrantes en situación irregular y aplicar la «prioridad nacional» a las ayudas sociales.",
    clima: "Se opone a la Agenda 2030 y al Pacto Verde europeo.",
    ext: "Una Europa de naciones soberanas (Patriotas por Europa).",
  },
  fa: {
    core: "Repartir mejor la riqueza y el tiempo: más derechos laborales, vivienda y transición ecológica.",
    about: "Coalición de izquierdas y ecologista que hereda Sumar. En ella confluyen Izquierda Unida, Movimiento Sumar, Más Madrid y los Comuns, y defiende un Estado plurinacional.",
    eco: "Más impuestos a las grandes fortunas y a las rentas más altas. Sumar propuso en 2023 una herencia universal para los jóvenes.",
    treb: "Reducir la jornada laboral a 37,5 horas semanales sin rebajar el sueldo.",
    hab: "Limitar el precio del alquiler y ampliar mucho el parque de vivienda pública.",
    ter: "Reconocimiento de la plurinacionalidad y diálogo como vía para resolver los conflictos territoriales.",
    soc: "Feminismo, derechos LGTBI y ampliar la sanidad pública a la salud mental y dental.",
    imm: "Regularización de las personas migrantes que ya viven y trabajan en España.",
    clima: "Transición ecológica justa, con más renovables y protección del territorio.",
    ext: "Política exterior de paz y defensa del pueblo palestino.",
  },
  podemos: {
    core: "Una izquierda sin concesiones: intervenir el mercado, feminismo y república.",
    about: "Partido de izquierdas nacido en 2014 de la ola del 15-M. Critica el bipartidismo y lo que llama «régimen del 78» y defiende una fuerte intervención pública.",
    eco: "Impuestos a las grandes fortunas, la banca y las energéticas, y una empresa pública de energía.",
    treb: "Reducir la jornada laboral y reforzar los derechos de los trabajadores.",
    hab: "Intervenir el mercado del alquiler y limitar la compra de viviendas con fines especulativos.",
    ter: "Plurinacionalidad y un referéndum pactado en Cataluña.",
    soc: "Feminismo y derechos LGTBI: impulsó la ley del «solo sí es sí» y la ley trans.",
    imm: "Regularización extraordinaria de las personas migrantes.",
    clima: "Transición ecológica con control público de la energía.",
    ext: "No al aumento del gasto militar y ruptura de relaciones con Israel.",
  },
  erc: {
    core: "La independencia de Cataluña por la vía de un referéndum, con políticas de izquierdas.",
    about: "Partido republicano, independentista y de izquierdas fundado en 1931. Hace valer su apoyo en el Congreso para conseguir mejoras para Cataluña.",
    eco: "Una financiación singular para que Cataluña recaude y gestione sus impuestos.",
    treb: "Políticas sociales y mejora de las condiciones laborales.",
    hab: "Más vivienda pública y límites al precio del alquiler.",
    ter: "Un referéndum de autodeterminación acordado y, mientras tanto, más competencias, como Rodalies.",
    soc: "Feminismo y defensa de la lengua catalana.",
    imm: "",
    clima: "Transición energética basada en las renovables.",
    ext: "Europeísmo y oficialidad del catalán en la Unión Europea.",
  },
  junts: {
    core: "La independencia de Cataluña y una relación de tú a tú con el Estado.",
    about: "Partido independentista fundado por Carles Puigdemont en 2020, heredero del espacio de Convergència. Combina el soberanismo con posiciones económicas de centroderecha.",
    eco: "Menos presión fiscal para familias, autónomos y empresas, y que Cataluña recaude todos sus impuestos.",
    treb: "Apoyo a los autónomos y a la pequeña y mediana empresa.",
    hab: "Seguridad jurídica para los propietarios y actuación rápida contra la okupación ilegal.",
    ter: "Independencia de Cataluña. Pactó la amnistía a cambio de la investidura de Sánchez.",
    soc: "Defensa de la lengua y la cultura catalanas.",
    imm: "Que la Generalitat tenga competencias en inmigración.",
    clima: "",
    ext: "Oficialidad del catalán en la Unión Europea.",
  },
  bildu: {
    core: "La independencia de Euskal Herria y una agenda de izquierdas.",
    about: "Coalición de la izquierda abertzale creada en 2012. Defiende el derecho a decidir del pueblo vasco y políticas sociales, feministas y ecologistas.",
    eco: "Una fiscalidad más progresiva y la defensa de los servicios públicos.",
    treb: "Un salario mínimo propio para el País Vasco y Navarra y mejoras de las pensiones.",
    hab: "Vivienda pública y límites al precio del alquiler.",
    ter: "Derecho a decidir y un nuevo estatus nacional para Euskal Herria.",
    soc: "Feminismo y promoción del euskera.",
    imm: "",
    clima: "Una transición ecosocial.",
    ext: "",
  },
  pnv: {
    core: "Más autogobierno para Euskadi y estabilidad económica.",
    about: "Partido nacionalista vasco y democristiano fundado en 1895. Ha gobernado Euskadi casi siempre desde 1980 y pacta tanto con el PSOE como con el PP.",
    eco: "Defensa del concierto económico y de una economía productiva e industrial.",
    treb: "Que el Gobierno vasco gestione la Seguridad Social y las políticas de empleo.",
    hab: "",
    ter: "Completar los traspasos del Estatuto de Gernika y un nuevo estatus de autogobierno.",
    soc: "Promoción del euskera.",
    imm: "",
    clima: "Una transición energética que proteja la industria.",
    ext: "Europeísmo (Renew Europe).",
  },
  bng: {
    core: "Galicia como nación: derecho a la autodeterminación y defensa de los intereses gallegos.",
    about: "Frente nacionalista gallego de izquierdas fundado en 1982. Liderado por Ana Pontón, es la segunda fuerza en el Parlamento de Galicia.",
    eco: "Una tarifa eléctrica propia para Galicia, que produce más energía de la que consume.",
    treb: "Defensa del sector primario y de la industria gallega.",
    hab: "",
    ter: "Derecho a la autodeterminación y traspaso de la autopista AP-9.",
    soc: "Defensa y normalización del gallego.",
    imm: "",
    clima: "",
    ext: "",
  },
  cc: {
    core: "La agenda canaria: que las islas tengan voz propia en Madrid.",
    about: "Partido nacionalista canario de centro fundado en 1993. Fernando Clavijo preside el Gobierno de Canarias desde 2023.",
    eco: "Cumplir el Régimen Económico y Fiscal (REF) de Canarias.",
    treb: "",
    hab: "",
    ter: "Desplegar el Estatuto de autonomía y asumir más competencias.",
    soc: "",
    imm: "Que el Estado y la UE compartan la gestión de la inmigración que llega a las islas y la acogida de menores.",
    clima: "",
    ext: "Defensa del estatus de región ultraperiférica de la UE.",
  },
  salf: {
    core: "Acabar con los privilegios políticos y la corrupción: «se acabó la fiesta».",
    about: "Partido creado en 2024 por el activista e influencer Alvise Pérez. Se presenta como antisistema y crítico con todos los partidos.",
    eco: "Bajar impuestos y recortar el gasto político.",
    treb: "",
    hab: "",
    ter: "",
    soc: "Mano dura contra la delincuencia, con grandes cárceles inspiradas en el modelo de El Salvador.",
    imm: "Un control estricto de la inmigración.",
    clima: "",
    ext: "",
  },
};
