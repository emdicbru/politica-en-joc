// Dades ampliades dels partits per al comparador: història, on governen, propostes estrella,
// aliances habituals i quatre temes més d'argumentari. Redactat en termes neutres a partir de
// programes electorals i fets públics; els programes del 29N poden introduir canvis.

ARG_AREAS.push(
  { k: "pen", label: "Pensiones", icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>` },
  { k: "serv", label: "Sanidad y educación", icon: `<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>` },
  { k: "jus", label: "Justicia y seguridad", icon: `<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/>` },
  { k: "est", label: "Modelo de Estado y lenguas", icon: `<path d="M3 20h18M5 20V10M10 20V10M14 20V10M19 20V10M2 10l10-6 10 6z"/>` },
);

const PARTY_EXTRA = {
  pp: {
    hist: "Refundado en 1989 a partir de Alianza Popular. Ha gobernado España con Aznar (1996–2004) y Rajoy (2011–2018), y desde 2018 está en la oposición en el Congreso.",
    gov: "Gobierna la mayoría de comunidades autónomas: Madrid, Andalucía, Galicia, Castilla y León, Valencia, Murcia, Aragón, Extremadura, Cantabria, Baleares y La Rioja, además de Ceuta y Melilla.",
    strong: "Madrid, Galicia, Andalucía, Castilla y León, Valencia y Murcia.",
    stars: ["Rebaja del IRPF", "Derogar la amnistía y lo que llama «sanchismo»", "Plan de vivienda con más suelo disponible"],
    allies: "Pacta con Vox en varios gobiernos autonómicos y ayuntamientos, y con Coalición Canaria y UPN.",
    vs: "Compite por el voto de centro con el PSOE y por el de derecha con Vox.",
  },
  psoe: {
    hist: "Fundado por Pablo Iglesias en 1879. Ha gobernado con Felipe González (1982–1996), Zapatero (2004–2011) y Sánchez desde 2018.",
    gov: "Lidera el Gobierno de España (en coalición con Sumar) y gobierna en Castilla-La Mancha, Asturias y Navarra; en Cataluña gobierna el PSC con Salvador Illa.",
    strong: "Andalucía, Cataluña (con el PSC), Castilla-La Mancha, Asturias, Navarra y Extremadura.",
    stars: ["Mantener y ampliar los derechos sociales", "Más vivienda pública", "Impuestos a banca y energéticas"],
    allies: "Gobierna en coalición con Sumar y depende de nacionalistas e independentistas (ERC, Junts, PNV, Bildu, BNG) para aprobar leyes.",
    vs: "Compite con el PP por el voto moderado y con Sumar y Podemos por el voto de izquierdas.",
  },
  vox: {
    hist: "Fundado en 2013 por antiguos miembros del PP. Entró en el Parlamento de Andalucía en 2018 y en el Congreso en 2019, donde fue tercera fuerza.",
    gov: "Gobernó en coalición con el PP en varias comunidades entre 2023 y 2024; actualmente da apoyo externo o negocia con el PP gobiernos y presupuestos.",
    strong: "Murcia, Valencia, Andalucía, Madrid, Ceuta y Melilla.",
    stars: ["Inmigración irregular: expulsiones y control de fronteras", "Recentralizar competencias", "Derogar leyes de identidad de género y memoria democrática"],
    allies: "Pacta con el PP cuando hay que sumar mayorías; no pacta con el PSOE ni con los nacionalistas.",
    vs: "Compite con el PP por el voto conservador y con SALF por el voto de protesta.",
  },
  fa: {
    hist: "Nace como refundación de Sumar (2023) con IU, Más Madrid, Catalunya en Comú y otros. Sumar entró en el Gobierno en coalición con el PSOE en 2023.",
    gov: "Fue el socio minoritario del Gobierno de España (2023–); en las comunidades tiene una presencia limitada.",
    strong: "Madrid, Cataluña, Valencia, Baleares y las grandes ciudades.",
    stars: ["Reducción de la jornada laboral a 37,5 h", "Vivienda: tope al alquiler y más vivienda pública", "Transición ecológica y feminismo"],
    allies: "Aliado natural del PSOE; mantiene tensión con Podemos y con el sector más a la izquierda.",
    vs: "Compite con el PSOE y Podemos por el voto de izquierdas y progresista.",
  },
  podemos: {
    hist: "Surgido del 15-M en 2014. Fue tercera fuerza en 2015–2016 y entró en el Gobierno con el PSOE en 2020; hoy es un partido más pequeño y crítico.",
    gov: "No gobierna; dejó el Gobierno de España en 2023 y se ha desmarcado de Sumar.",
    strong: "Sobre todo entre votantes jóvenes y urbanos; presencia limitada en el territorio.",
    stars: ["Nacionalizar sectores estratégicos", "Vivienda: tope a los alquileres", "República y plurinacionalidad"],
    allies: "Da apoyo puntual al PSOE pero se distancia de Sumar y del Gobierno.",
    vs: "Compite con Sumar/FA por el voto de izquierda alternativa.",
  },
  erc: {
    hist: "Fundada en 1931, gobernó la Generalitat con Companys; ha estado en el centro de la política catalana desde 2003 y presidió la Generalitat con Aragonès (2021–2024).",
    gov: "Estuvo en el Govern de la Generalitat hasta 2024 y ahora da apoyo parlamentario al PSC de Salvador Illa; es clave para la gobernabilidad del Congreso.",
    strong: "Cataluña, especialmente el interior y la periferia de Barcelona.",
    stars: ["Financiación singular para Cataluña", "Traspaso de Rodalies y autogobierno", "Ley de amnistía"],
    allies: "Apoya a los gobiernos del PSOE a cambio de concesiones; compite con Junts y el PSC.",
    vs: "Compite con Junts por el voto independentista y con el PSC por el de izquierdas.",
  },
  junts: {
    hist: "Nace en 2020 de la unión de Convergència (PDeCAT) e independientes en torno a Carles Puigdemont, que presidió la Generalitat en 2016–2017.",
    gov: "Estuvo en el Govern de la Generalitat hasta 2022 y ahora está en la oposición; en el Congreso ha sido decisivo para aprobar o bloquear leyes.",
    strong: "Cataluña, sobre todo el interior, Girona y las zonas rurales.",
    stars: ["Amnistía y regreso de Puigdemont", "Competencias de inmigración y financiación propia", "Más catalán en la Administración y en el Estado"],
    allies: "No pacta con Vox ni con el PP; facilitó la investidura de Sánchez en 2023 con el acuerdo de la amnistía.",
    vs: "Compite con ERC por el voto independentista y con Aliança Catalana por la derecha soberanista.",
  },
  bildu: {
    hist: "Coalición fundada en 2012 por la izquierda independentista vasca (Sortu, EA, Alternatiba, Aralar). Gobierna muchos ayuntamientos y es la segunda fuerza en el País Vasco.",
    gov: "No gobierna en el País Vasco, pero sí en muchos ayuntamientos; en el Congreso da apoyo selectivo al Gobierno del PSOE.",
    strong: "País Vasco (Gipuzkoa), Navarra.",
    stars: ["Derecho a decidir de Euskal Herria", "Vivienda y salarios dignos", "Presos y memoria histórica"],
    allies: "Apoya a los gobiernos de izquierdas en el Congreso a cambio de medidas sociales y de memoria.",
    vs: "Compite con el PNV por el voto nacionalista vasco.",
  },
  pnv: {
    hist: "Fundado en 1895 por Sabino Arana. Ha gobernado Euskadi casi siempre desde 1980.",
    gov: "Gobierna el País Vasco (en coalición con el PSE) y tiene un gran peso en ayuntamientos y diputaciones forales.",
    strong: "Bizkaia, Álava y el País Vasco en general.",
    stars: ["Concierto económico y autogobierno", "Competencias y traspasos pendientes", "Estabilidad económica e industrial"],
    allies: "Socio habitual de los gobiernos del PSOE y del PP según la época; hizo caer a Rajoy en 2018.",
    vs: "Compite con EH Bildu por el voto nacionalista vasco.",
  },
  bng: {
    hist: "Fundado en 1982. Gobernó la Xunta con el PSdeG (2005–2009) y es la segunda fuerza en el Parlamento de Galicia con Ana Pontón.",
    gov: "No gobierna la Xunta; sí gobierna ayuntamientos. Tiene un diputado en el Congreso.",
    strong: "Galicia, sobre todo las ciudades y las zonas rurales del interior.",
    stars: ["Una nueva financiación y más competencias para Galicia", "Defensa de la lengua gallega", "Servicios públicos en la España vaciada"],
    allies: "Apoya al PSOE en votaciones clave; colabora con ERC, Bildu y otras fuerzas periféricas.",
    vs: "Compite con el PSdeG por el voto de izquierdas en Galicia.",
  },
  cc: {
    hist: "Fundada en 1993 como federación de partidos insulares. Gobierna Canarias desde hace décadas con algunos paréntesis.",
    gov: "Gobierna Canarias en coalición con el PP.",
    strong: "Islas Canarias.",
    stars: ["Agenda canaria: régimen especial y fondos", "Inmigración y menores no acompañados", "Financiación y conectividad de las islas"],
    allies: "Pacta alternativamente con el PSOE y el PP según los intereses canarios.",
    vs: "Compite con el PSOE y el PP en las islas.",
  },
  salf: {
    hist: "Fundado en 2024 por Alvise Pérez después de una candidatura sorprendente en las europeas, en las que obtuvo 3 eurodiputados.",
    gov: "No gobierna ninguna institución.",
    strong: "Se mueve sobre todo por redes sociales y entre votantes jóvenes.",
    stars: ["Reducir la «casta política»", "Menos impuestos y menos burocracia", "Transparencia y medidas anticorrupción"],
    allies: "No tiene alianzas estables; se presenta como alternativa antisistema.",
    vs: "Compite con Vox y con el PP por el voto de protesta.",
  },
};

const ARGS_EXTRA = {
  pp: {
    pen: "Garantiza las pensiones y las revaloriza con el IPC; quiere potenciar planes complementarios y deducciones para el ahorro privado.",
    serv: "Más colaboración público-privada en la sanidad, reducción de listas de espera y libertad de elección de centro; defiende la educación concertada.",
    jus: "Reforma del Poder Judicial para despolitizarlo, reincidencia más dura, lucha contra la okupación ilegal y más efectivos policiales.",
    est: "Monarquía parlamentaria y Constitución de 1978. Defiende la unidad de España y el bilingüismo: «libertad lingüística» en las escuelas.",
  },
  psoe: {
    pen: "Pensiones revalorizadas con el IPC por ley y un Mecanismo de Equidad Intergeneracional; no al retraso de la edad de jubilación.",
    serv: "Sanidad pública universal, refuerzo de la atención primaria, más becas y educación pública gratuita de 0 a 3 años.",
    jus: "Renovación del CGPJ pactada con el PP, reforma de la ley de seguridad ciudadana y memoria democrática.",
    est: "Monarquía parlamentaria y Estado de las autonomías con horizonte federal. Defiende las lenguas cooficiales, también en la UE.",
  },
  vox: {
    pen: "Pensiones contributivas garantizadas con el IPC; quiere limitar el acceso a ayudas a quien tenga nacionalidad o arraigo.",
    serv: "Libertad educativa, «pin parental» y enseñanza en castellano en todo el territorio; sanidad pública con menos burocracia.",
    jus: "Mano dura con la delincuencia, expulsión de extranjeros condenados, derogación de la ley de violencia de género e ilegalización de partidos que atenten contra la unidad.",
    est: "Monarquía y unidad de España. Propone recentralizar competencias y suprimir las autonomías; el castellano como única lengua vehicular.",
  },
  fa: {
    pen: "Pensiones dignas y actualizadas con el IPC; defiende un sistema público y rechaza alargar la edad de jubilación.",
    serv: "Reforzar la sanidad pública, gratuidad de la educación de 0 a 3 años, salud mental y dental dentro de la cartera pública.",
    jus: "Democratizar la justicia, abolir la «ley mordaza» y garantizar los derechos de las personas migrantes.",
    est: "Estado plurinacional y plurilingüe; abierto al debate sobre el modelo de Estado y con tradición republicana en parte de su espacio.",
  },
  podemos: {
    pen: "Defiende un sistema público de pensiones con actualización por el IPC y pensiones mínimas dignas; rechaza favorecer los planes privados.",
    serv: "Sanidad 100 % pública, educación pública y gratuita hasta la universidad y reversión de las privatizaciones.",
    jus: "Reforma democrática del Poder Judicial, derogación de la ley mordaza y lucha contra la corrupción.",
    est: "República y Estado plurinacional; referéndum pactado en Cataluña. Defiende las lenguas cooficiales.",
  },
  erc: {
    pen: "Gestión propia de las políticas sociales; defiende un sistema de pensiones público y suficiente.",
    serv: "Sanidad y educación en catalán con competencias plenas; inversión en atención primaria y salud mental.",
    jus: "Amnistía plena, desjudicializar el conflicto político y fin de las causas del Estado contra cargos independentistas.",
    est: "República catalana. Defiende un referéndum de autodeterminación pactado y el catalán como lengua propia.",
  },
  junts: {
    pen: "Cotizaciones y pensiones catalanas con más gestión propia; contrario a aumentar la carga fiscal.",
    serv: "Competencias plenas en sanidad, educación y seguridad social; escuela en catalán.",
    jus: "Amnistía, regreso de los exiliados y frenar lo que consideran judicialización política.",
    est: "Independencia de Cataluña y reconocimiento nacional; quiere más competencias en inmigración y justicia.",
  },
  bildu: {
    pen: "Pensiones mínimas dignas y competencias propias en materia de seguridad social.",
    serv: "Sanidad y educación públicas y en euskera; contra la privatización y por ratios más bajas.",
    jus: "Fin de la dispersión de presos, memoria y reparación de víctimas, y derogación de la ley mordaza.",
    est: "Derecho a decidir de Euskal Herria y república; defiende el euskera como lengua propia.",
  },
  pnv: {
    pen: "Gestión propia de la Seguridad Social vasca; mantiene las pensiones con el IPC y la cohesión social.",
    serv: "Modelo vasco de sanidad y educación pública de alto nivel, con gestión de Osakidetza y fomento del euskera.",
    jus: "Competencias propias en justicia y seguridad; colaboración con la Ertzaintza.",
    est: "Más autogobierno, concierto económico y reconocimiento nacional; no es partidario de romper la Constitución.",
  },
  bng: {
    pen: "Pensiones públicas y dignas con competencias gallegas sobre la seguridad social.",
    serv: "Sanidad y educación públicas; más inversión en la España rural; el gallego como lengua propia.",
    jus: "Garantizar derechos y revisar las leyes represivas; justicia accesible en gallego.",
    est: "Derecho a la autodeterminación de Galicia y Estado plurinacional.",
  },
  cc: {
    pen: "Pensiones adaptadas al coste de vida de las islas y complementos por el coste de la insularidad.",
    serv: "Inversión sanitaria y educativa en Canarias, centros de atención y reducción de las listas de espera.",
    jus: "Seguridad marítima y de fronteras en las islas, y recursos para la inmigración.",
    est: "Más autogobierno para Canarias, el Estatuto de insularidad y la ultraperiferia reconocida en la UE.",
  },
  salf: {
    pen: "Defiende mantener las pensiones y revisar el sistema para hacerlo sostenible; poco detallado en el programa.",
    serv: "Menos burocracia y reducción de «chiringuitos»; sanidad y educación sin propuestas detalladas.",
    jus: "Medidas anticorrupción, más transparencia y sanciones a los políticos condenados.",
    est: "Se presenta contrario a la «partitocracia»; defiende menos cargos electos y menos autonomías.",
  },
};

Object.keys(ARGS_EXTRA).forEach((id) => { if (PARTY_ARGS[id]) Object.assign(PARTY_ARGS[id], ARGS_EXTRA[id]); });
