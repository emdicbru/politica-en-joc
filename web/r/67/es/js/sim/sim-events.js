// Simulador del 29N · Continguts: dilemes per definir el partit, preguntes de debat i esdeveniments de campanya.
// Tot és ficció genèrica: cap esdeveniment depèn d'un fet o d'una persona reals.

// ---------- Dilemes de programa (defineixen la ideologia) ----------
// Cada opció mou els eixos: eco (0 més Estat · 10 més mercat), ter (0 centralisme · 10 sobiranisme), val (0 progressista · 10 conservador)
const SIM_DILEMMAS = [
  { q: "Impuestos", a: [{ t: "Subirlos a las rentas altas para financiar más servicios públicos", d: { eco: -1.3 } }, { t: "Bajarlos para que la economía crezca y se cree empleo", d: { eco: 1.3 } }] },
  { q: "Vivienda", a: [{ t: "Limitar el precio de los alquileres y construir vivienda pública", d: { eco: -1.1 } }, { t: "Liberar suelo y reducir trámites para que se construya más", d: { eco: 1.1 } }] },
  { q: "Modelo territorial", a: [{ t: "Más autogobierno y reconocimiento de las naciones del Estado", d: { ter: 1.6 } }, { t: "Un Estado más unido, con menos diferencias entre territorios", d: { ter: -1.6 } }] },
  { q: "Derecho a decidir", a: [{ t: "Aceptar un referéndum pactado si un territorio lo reclama", d: { ter: 1.4 } }, { t: "Ninguna votación que ponga en cuestión la unidad del Estado", d: { ter: -1.4 } }] },
  { q: "Inmigración", a: [{ t: "Vías legales de llegada y regularizar a quien ya vive aquí", d: { val: -1.1 } }, { t: "Más control de fronteras y más expulsiones", d: { val: 1.3 } }] },
  { q: "Derechos y valores", a: [{ t: "Ampliar derechos sociales y garantizar la igualdad y la diversidad", d: { val: -1.3 } }, { t: "Proteger la familia tradicional y los valores de siempre", d: { val: 1.3 } }] },
  { q: "Clima y energía", a: [{ t: "Acelerar la transición energética aunque cueste dinero", d: { eco: -0.6, val: -0.5 } }, { t: "Una transición gradual que no encarezca la factura", d: { eco: 0.6, val: 0.4 } }] },
  { q: "Seguridad", a: [{ t: "Prevención, educación y reinserción", d: { val: -0.9 } }, { t: "Penas más duras y más policía en la calle", d: { val: 1.1 } }] },
];

// ---------- Preguntes de debat: tres respostes amb una posició ideològica ----------
const SIM_DEBATE_QS = [
  { q: "¿Cómo bajaréis el precio del alquiler?", th: 0, a: [
    { t: "Con topes al precio y un gran parque público.", p: { eco: 2, ter: 5, val: 3 } },
    { t: "Con colaboración público-privada y ayudas a los jóvenes.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Liberando suelo y bajando impuestos a la construcción.", p: { eco: 8.5, ter: 3, val: 6 } }] },
  { q: "¿Las pensiones son sostenibles?", th: 2, a: [
    { t: "Sí, si los ingresos suben con más cotizaciones de las rentas altas.", p: { eco: 2.5, ter: 4, val: 4 } },
    { t: "Sí, con un pacto entre partidos y reformas graduales.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Solo si complementamos el sistema con planes privados.", p: { eco: 8, ter: 3, val: 6 } }] },
  { q: "¿Qué modelo territorial defendéis?", th: 3, a: [
    { t: "El derecho a decidir de los pueblos que lo pidan.", p: { eco: 4.5, ter: 9, val: 4 } },
    { t: "Un Estado federal con más autogobierno.", p: { eco: 4, ter: 6, val: 4 } },
    { t: "Un Estado fuerte y unido, con menos competencias autonómicas.", p: { eco: 6.5, ter: 1, val: 7 } }] },
  { q: "¿Qué hay que hacer con la inmigración?", th: 4, a: [
    { t: "Regularizar y garantizar derechos a todo el que trabaja aquí.", p: { eco: 3, ter: 5, val: 2 } },
    { t: "Vías legales vinculadas al mercado de trabajo.", p: { eco: 5.5, ter: 4, val: 5 } },
    { t: "Control estricto de fronteras y expulsiones.", p: { eco: 7, ter: 1, val: 9 } }] },
  { q: "¿Cómo afrontaréis el cambio climático?", th: 5, a: [
    { t: "Transición rápida hacia las renovables, con inversión pública.", p: { eco: 3, ter: 5, val: 2.5 } },
    { t: "Transición gradual que no perjudique a la industria.", p: { eco: 6, ter: 4, val: 5 } },
    { t: "Sin imposiciones que encarezcan la vida.", p: { eco: 8, ter: 2.5, val: 7.5 } }] },
  { q: "¿Qué proponéis para la sanidad pública?", th: 6, a: [
    { t: "Más presupuesto y menos conciertos con la privada.", p: { eco: 2, ter: 5, val: 3 } },
    { t: "Reducir listas de espera combinando pública y privada.", p: { eco: 6, ter: 4, val: 5 } },
    { t: "Libertad de elección entre centros públicos y privados.", p: { eco: 8, ter: 3, val: 6.5 } }] },
  { q: "¿Cómo mejoraréis la seguridad?", th: 7, a: [
    { t: "Con prevención y políticas sociales.", p: { eco: 3, ter: 5, val: 2.5 } },
    { t: "Más agentes de proximidad y justicia más ágil.", p: { eco: 5, ter: 4, val: 5.5 } },
    { t: "Penas más duras y tolerancia cero.", p: { eco: 7, ter: 2, val: 8.5 } }] },
  { q: "¿Subiréis o bajaréis los impuestos?", th: 1, a: [
    { t: "Subirlos a las grandes fortunas y a la banca.", p: { eco: 1.5, ter: 5, val: 3 } },
    { t: "Mantenerlos y combatir el fraude.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Bajarlos a familias y empresas.", p: { eco: 8.5, ter: 3, val: 6 } }] },
];

// ---------- Preguntes d'entrevista generals ----------
// v: qualitat de la resposta (0-1). ev: resposta evasiva (la periodista hi insisteix i, en una entrevista dura, costa credibilitat).
// tone: si hi és, la pregunta només surt en entrevistes d'aquest to.
const SIM_INTERVIEW_QS = [
  { q: "¿Por qué debería votaros alguien que todavía no os conoce?", a: [
    { t: "Porque tenemos propuestas concretas y las explicamos con números.", v: 0.75 },
    { t: "Porque los otros partidos ya han fallado.", v: 0.5 },
    { t: "Que venga a nuestros actos y lo descubrirá.", v: 0.35, ev: true }] },
  { q: "¿Con quién pactaríais después de las elecciones?", a: [
    { t: "Con quien comparta nuestras prioridades, y lo diremos antes de votar.", v: 0.72 },
    { t: "No pactaremos con nadie.", v: 0.42 },
    { t: "Eso ya lo veremos cuando haya resultados.", v: 0.3, ev: true }] },
  { q: "¿Cómo pagaréis vuestras propuestas?", a: [
    { t: "Tenemos una memoria económica: aquí tienen las cifras.", v: 0.8 },
    { t: "Con el crecimiento que generarán las mismas propuestas.", v: 0.5 },
    { t: "Ahora no toca hablar de dinero.", v: 0.25, ev: true }] },
  { q: "¿Cuál sería la primera ley que aprobaríais?", a: [
    { t: "Una sobre nuestro tema estrella, y ya la tenemos redactada.", v: 0.75 },
    { t: "Una ley de transparencia y buen gobierno.", v: 0.6 },
    { t: "Dependerá de la mayoría que salga de las urnas.", v: 0.35, ev: true }] },
  { q: "¿Qué hace el candidato en un día de descanso?", tone: "amable", a: [
    { t: "Pasear y desconectar con la familia y los amigos.", v: 0.62 },
    { t: "¡Leer los programas de los otros partidos!", v: 0.66 },
    { t: "En campaña no hay días de descanso.", v: 0.45 }] },
  { q: "Hace un mes defendíais otra cosa. ¿Por qué habéis cambiado?", tone: "dura", a: [
    { t: "No hemos cambiado: hemos concretado la propuesta.", v: 0.58 },
    { t: "Hemos rectificado porque los datos lo aconsejaban.", v: 0.7 },
    { t: "Pasemos a la siguiente pregunta.", v: 0.2, ev: true }] },
  { q: "Las encuestas os dan pocos escaños. ¿No es un voto perdido?", tone: "dura", a: [
    { t: "En las circunscripciones donde tenemos opciones, cada voto cuenta.", v: 0.72 },
    { t: "Las encuestas se han equivocado muchas veces.", v: 0.45 },
    { t: "No hago caso de las encuestas.", v: 0.32, ev: true }] },
  { q: "Un antiguo dirigente de vuestro partido os critica en público. ¿Qué le respondéis?", tone: "dura", a: [
    { t: "Respeto su opinión, pero el partido decidió democráticamente.", v: 0.66 },
    { t: "Ya no representa a nadie.", v: 0.35 },
    { t: "No tengo nada que decir.", v: 0.3, ev: true }] },
];
// Reaccions de la periodista segons la resposta
const SIM_REACTIONS = {
  ev: ["La periodista insiste: «No me ha respondido».", "«Lo tomo como un no», remata la periodista.", "La periodista deja caer un silencio incómodo."],
  good: ["La periodista asiente y pasa a la siguiente pregunta.", "Respuesta clara: la periodista no insiste.", "«Queda dicho», responde la periodista."],
  mid: ["La periodista toma nota y continúa.", "«De acuerdo», dice la periodista, sin mucha convicción."],
};

// ---------- Esdeveniments de campanya ----------
// cond(state): si pot aparèixer. Cada opció: t (text), fx(state, rand) → missatge del resultat.
const simProvBest = (state) => {
  // Circumscripció on el teu partit és més a prop de guanyar un escó (i encara no en té)
  const r = simElection(state);
  let best = null;
  r.provs.forEach((p) => {
    if (p.won.jo > 0 || !p.next) return;
    const share = p.votes.jo / p.valid;
    if (!best || share > best.share) best = { i: p.i, name: p.name, share };
  });
  return best;
};

const SIM_EVENTS = [
  { id: "escandol", title: "Polémica con un candidato", text: "Salen a la luz unos mensajes antiguos de uno de tus candidatos. Los medios hablan de ello toda la mañana.",
    opts: [
      { t: "Apartarlo de la lista", fx: (s) => { s.cred += 5; s.moral -= 5; return "Ganas credibilidad, pero una parte de la militancia se enfada."; } },
      { t: "Defenderlo: es una campaña contra nosotros", fx: (s) => { s.cred -= 9; s.moral += 4; s.glob.jo -= 0.03; return "La militancia te aplaude, pero pierdes credibilidad ante el electorado."; } },
    ] },
  { id: "aprop", title: "A punto de un escaño", text: (s) => `La encuesta interna dice que estás a punto de sacar un escaño en ${simProvBest(s)?.name || "una circunscripción"}.`,
    cond: (s) => !!simProvBest(s),
    opts: [
      { t: "Hacemos un acto extra (6 de dinero)", fx: (s) => { const b = simProvBest(s); if (!b) return "No hay ninguna circunscripción clara."; s.camp.jo[b.i] += 0.18; s.money -= 6; return `Haces un acto extra en ${b.name}. Ahora tienes más opciones de escaño.`; } },
      { t: "Mantenemos la agenda prevista", fx: () => "Mantienes el plan. Las encuestas internas no siempre aciertan." },
    ] },
  { id: "copia", title: "Te acusan de copiar el programa", text: "Un partido rival dice que tu propuesta estrella es suya.",
    opts: [
      { t: "Responder con datos y fechas", fx: (s, r) => { if (r() < 0.35 + s.me.attrs.sol * 0.1) { s.cred += 4; s.glob.jo += 0.03; return "La respuesta convence: sales reforzado."; } s.cred -= 3; return "La respuesta llega tarde y la polémica continúa."; } },
      { t: "No entrar al trapo", fx: (s) => { s.glob.jo -= 0.02; return "El rival domina el relato durante un día."; } },
    ] },
  { id: "radio", title: "Debate en una radio local", text: "Te invitan a un debate en una radio de una comunidad pequeña.",
    opts: [
      { t: "Aceptar", fx: (s, r) => { const p = SIM_PROVS[Math.floor(r() * SIM_PROVS.length)]; SIM_PROVS.forEach((q) => { if (q.ccaa === p.ccaa) { s.aw[q.i] += (1 - s.aw[q.i]) * 0.15; s.camp.jo[q.i] += 0.05; } }); return `El debate se oye en ${p.ccaa}: ganas notoriedad.`; } },
      { t: "Declinarlo por falta de agenda", fx: () => "Priorizas los grandes actos." },
    ] },
  { id: "donacio", title: "Una donación generosa", text: "Una empresa quiere hacer una donación importante a la campaña.",
    opts: [
      { t: "Aceptarla", fx: (s) => { s.money += 20; s.cred -= 7; return "Tienes más dinero, pero la noticia te resta credibilidad."; } },
      { t: "Rechazarla públicamente", fx: (s) => { s.cred += 4; return "Tu coherencia se valora."; } },
    ] },
  { id: "cartell", title: "Un error en el cartel", text: "Un cartel electoral tiene una falta de ortografía bien visible.",
    opts: [
      { t: "Pedir disculpas y retirarlo (4 de dinero)", fx: (s) => { s.money -= 4; s.cred += 1; return "Retiras los carteles y el tema se olvida pronto."; } },
      { t: "Bromear sobre ello en las redes", fx: (s, r) => { if (r() < 0.55) { s.awG += (1 - s.awG) * 0.05; s.glob.jo += 0.02; return "La broma se hace viral: te conoce más gente."; } s.cred -= 4; return "La broma no gusta y te critican."; } },
    ] },
  { id: "famos", title: "Un apoyo inesperado", text: "Una persona muy conocida de la televisión anuncia que te votará.",
    opts: [
      { t: "Hacer un acto juntos", fx: (s) => { s.awG += (1 - s.awG) * 0.07; s.cred -= 2; return "Mucha visibilidad, aunque hay quien lo ve como un espectáculo."; } },
      { t: "Agradecerlo con discreción", fx: (s) => { s.awG += (1 - s.awG) * 0.03; return "Ganas un poco de visibilidad sin riesgos."; } },
    ] },
  { id: "matis", title: "Una pregunta incómoda", text: "En una entrevista te preguntan por tu posición más polémica.",
    opts: [
      { t: "Matizarla hacia el centro", fx: (s) => { ["eco", "ter", "val"].forEach((k) => { s.me[k] += (5 - s.me[k]) * 0.12; }); s.cred -= 4; return "Te mueves un poco hacia el centro, pero te reprochan incoherencia."; } },
      { t: "Mantenerla con convicción", fx: (s) => { s.cred += 3; s.moral += 4; return "Tus votantes valoran la coherencia."; } },
    ] },
  { id: "voluntaris", title: "Avalancha de voluntarios", text: "Cientos de personas se apuntan para ayudar en la campaña.",
    cond: (s) => s.moral >= 55,
    opts: [
      { t: "Organizar reparto de propaganda", fx: (s) => { s.money += 8; s.glob.jo += 0.02; return "La militancia ahorra dinero y hace campaña puerta a puerta."; } },
      { t: "Ponerlos a llamar a indecisos", fx: (s) => { s.awG += (1 - s.awG) * 0.04; return "Las llamadas te dan a conocer."; } },
    ] },
  { id: "viral", title: "Un vídeo viral", text: "Un fragmento de un mitin tuyo circula por todas las redes.",
    opts: [
      { t: "Invertir para amplificarlo (5 de dinero)", fx: (s) => { s.money -= 5; s.awG += (1 - s.awG) * 0.06; s.glob.jo += 0.03; return "El vídeo llega a millones de personas."; } },
      { t: "Dejar que corra solo", fx: (s) => { s.awG += (1 - s.awG) * 0.03; return "El vídeo te da un poco de visibilidad."; } },
    ] },
  { id: "aliat", title: "Una propuesta de alianza local", text: "Una candidatura local pequeña te propone ir juntos en una circunscripción.",
    opts: [
      { t: "Aceptar la alianza", fx: (s, r) => { const i = Math.floor(r() * SIM_PROVS.length); s.camp.jo[i] += 0.25; s.aw[i] += (1 - s.aw[i]) * 0.2; s.cred -= 2; return `Vais juntos en ${SIM_PROVS[i].name}: sumáis fuerzas.`; } },
      { t: "Ir solos", fx: () => "Prefieres mantener tu marca." },
    ] },
  { id: "dades", title: "Nuevos datos económicos", text: "Salen datos de paro mejores de lo esperado. Todo el mundo intenta capitalizarlos.",
    opts: [
      { t: "Reconocerlos y proponer más", fx: (s) => { s.cred += 3; return "Tu tono constructivo se valora."; } },
      { t: "Decir que no llegan a la gente", fx: (s) => { s.glob.jo += s.me.eco < 5 ? 0.03 : -0.01; return s.me.eco < 5 ? "El mensaje conecta con una parte del electorado." : "El mensaje no encaja con tu programa."; } },
    ] },
];

// ---------- Més imprevistos de campanya ----------
// Utilitats per als imprevistos
const simEvProv = (s, r, f = () => true) => { const ps = SIM_PROVS.filter(f); return ps[Math.floor(r() * ps.length)] || SIM_PROVS[0]; };
const simLastPoll = (s) => s.polls[s.polls.length - 1];
const simMyPoll = (s) => simLastPoll(s)?.est.jo ?? 0;
const simRivalNear = (s) => [...s.rivals].sort((a, b) => simDistP(a, s.me) - simDistP(b, s.me))[0];
const simRivalBig = (s) => { const p = simLastPoll(s); return [...s.rivals].sort((a, b) => (p?.est[b.id] || 0) - (p?.est[a.id] || 0))[0]; };
const simAw = (s, k) => { s.awG += (1 - s.awG) * k; };

SIM_EVENTS.push(
  // Enquestes i vot útil
  { id: "llindar", title: "A punto del 3 %", text: (s) => `La encuesta del juego te da un ${simMyPoll(s).toFixed(1)} % en todo el Estado. En las circunscripciones grandes, por debajo del 3 % no entras en el reparto.`,
    cond: (s) => simMyPoll(s) > 1.5 && simMyPoll(s) < 4.5,
    opts: [
      { t: "Concentrarse en Madrid y Barcelona", fx: (s) => { s.camp.jo[0] += 0.15; s.camp.jo[1] += 0.15; s.money -= 6; return "Dedicas dinero a los dos grandes distritos, donde el 3 % pesa más. (6 de dinero)"; } },
      { t: "Mantener una campaña en todo el Estado", fx: (s) => { simAw(s, 0.03); return "Sigues en todas partes: más gente te conoce, pero no aseguras ningún escaño."; } },
    ] },
  { id: "votutil", title: "La llamada al voto útil", text: "Llega la llamada al voto útil: se pide a los votantes que no «tiren» el voto en un partido sin opciones de escaño.",
    cond: (s) => simMyPoll(s) < 9,
    opts: [
      { t: "Responder con las circunscripciones donde tienes opciones", fx: (s, r) => { if (r() < 0.55 + s.me.attrs.sol * 0.05) { s.glob.jo += 0.04; return "Explicas dónde tu voto sí cuenta y frenas la fuga."; } s.glob.jo -= 0.02; return "La respuesta no convence: algunos votantes dudan."; } },
      { t: "Ignorarlo", fx: (s) => { s.glob.jo -= 0.03; s.glob[simRivalNear(s).id] += 0.02; return "El mensaje del rival cala entre los indecisos."; } },
    ] },
  { id: "sorpasso", title: "Posible sorpasso", text: (s) => `La encuesta del juego te sitúa cerca de ${simRivalNear(s).name}. Los medios hablan de sorpasso.`,
    cond: (s) => { const p = simLastPoll(s); const n = simRivalNear(s); return p && Math.abs((p.est.jo || 0) - (p.est[n.id] || 0)) < 2.5; },
    opts: [
      { t: "Alimentar el relato", fx: (s) => { simAw(s, 0.05); s.moral += 6; s.glob[simRivalNear(s).id] += 0.02; return "La militancia se entusiasma y el rival se moviliza."; } },
      { t: "Rebajar expectativas", fx: (s) => { s.cred += 3; return "Prudencia: ganas credibilidad."; } },
    ] },
  { id: "enquestafalsa", title: "Una encuesta inventada", text: "Circula por redes una encuesta falsa que os deja muy mal.",
    opts: [
      { t: "Desmentirla con datos", fx: (s, r) => { if (r() < 0.6) { s.cred += 3; simAw(s, 0.02); return "El desmentido funciona y la noticia se gira a tu favor."; } return "El desmentido llega tarde, pero no hace daño."; } },
      { t: "Denunciarlo ante la Junta Electoral", fx: (s) => { s.money -= 3; s.cred += 2; return "La Junta Electoral vela por el proceso: te hacen caso, pero cuesta tiempo y dinero. (3 de dinero)"; } },
    ] },
  // Mitjans i debats
  { id: "gafe", title: "Un resbalón en directo", text: "En una entrevista confundes un dato de tu propio programa.",
    opts: [
      { t: "Rectificar enseguida", fx: (s) => { s.cred -= 2; return "Rectificación rápida: el tema dura poco."; } },
      { t: "Hacer como si no hubiera pasado", fx: (s, r) => { if (r() < 0.5) { s.cred -= 8; s.glob.jo -= 0.03; return "El corte se hace viral y te persigue todo el día."; } return "Por suerte, casi nadie se da cuenta."; } },
    ] },
  { id: "tertulia", title: "Tertulia de máxima audiencia", text: "Una tertulia de televisión te invita a defender el programa.",
    opts: [
      { t: "Ir tú", fx: (s, r) => { if (r() < 0.3 + s.me.attrs.car * 0.1) { simAw(s, 0.07); s.glob.jo += 0.03; return "Brillas en el plató: todo el mundo habla de ello."; } s.cred -= 4; return "El debate se enciende y no sales bien parado."; } },
      { t: "Enviar a una portavoz", fx: (s) => { simAw(s, 0.03); return "Una aparición correcta, sin riesgos."; } },
    ] },
  { id: "entrevistallarga", title: "Una entrevista de fondo", text: "Un diario de referencia te propone una entrevista larga sobre el programa.",
    opts: [
      { t: "Aceptarla", fx: (s) => { s.cred += 2 + s.me.attrs.sol; return "La entrevista muestra un programa sólido: ganas credibilidad."; } },
      { t: "Priorizar los actos en la calle", fx: (s) => { s.moral += 3; return "La militancia agradece tenerte cerca."; } },
    ] },
  { id: "podcast", title: "Un pódcast con millones de oyentes", text: "Un pódcast muy popular entre los jóvenes te quiere entrevistar.",
    opts: [
      { t: "Ir con un tono informal", fx: (s, r) => { if (r() < 0.6) { simAw(s, 0.05); s.me.iss[0] = Math.min(1.3, s.me.iss[0] + 0.1); return "Conectas con los jóvenes hablando de vivienda."; } s.cred -= 3; return "Una broma malinterpretada te cuesta críticas."; } },
      { t: "No vas", fx: () => "Pierdes la oportunidad, pero no te arriesgas." },
    ] },
  { id: "factcheck", title: "Verificación de datos", text: "Una agencia de verificación dice que una cifra de tu mitin es exagerada.",
    opts: [
      { t: "Reconocer el error", fx: (s) => { s.cred += 1; return "Reconocerlo te da credibilidad a medio plazo."; } },
      { t: "Mantener la cifra", fx: (s) => { s.cred -= 6; s.moral += 2; return "La militancia te aplaude; la prensa no."; } },
    ] },
  { id: "debatcara", title: "Un cara a cara improvisado", text: (s) => `Una cadena te propone un cara a cara con el candidato de ${simRivalBig(s).sig}, el partido que va primero en la encuesta del juego.`,
    opts: [
      { t: "Aceptar el reto", fx: (s, r) => { if (r() < 0.35 + s.me.attrs.car * 0.08) { s.glob.jo += 0.05; simAw(s, 0.06); return "Aguantas el cara a cara: te ven como una alternativa."; } s.glob.jo -= 0.02; simAw(s, 0.04); return "El rival tiene más oficio, pero mucha gente te descubre."; } },
      { t: "Declinarlo", fx: (s) => { s.cred -= 2; return "Te reprochan huir del debate."; } },
    ] },
  { id: "manipulat", title: "Un vídeo manipulado", text: "Circula un vídeo recortado en el que parece que dices algo que no dijiste.",
    opts: [
      { t: "Publicar el vídeo entero", fx: (s, r) => { if (r() < 0.65) { s.cred += 3; return "El vídeo completo desmonta la manipulación."; } s.cred -= 2; return "El desmentido llega a menos gente que el vídeo falso."; } },
      { t: "No hacer caso", fx: (s) => { s.cred -= 4; return "El vídeo sigue circulando."; } },
    ] },
  // Partit i militància
  { id: "dimissio", title: "Dimisión en la lista", text: "Una candidata de una circunscripción pequeña deja la lista por discrepancias.",
    opts: [
      { t: "Buscar un sustituto conocido", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.seats <= 5); s.camp.jo[p.i] += 0.08; s.money -= 4; return `Encuentras un sustituto en ${p.name}. (4 de dinero)`; } },
      { t: "Restarle importancia", fx: (s) => { s.moral -= 5; return "La militancia se desanima un poco."; } },
    ] },
  { id: "primaries", title: "Ruido interno", text: "Un sector del partido critica públicamente a la dirección de campaña.",
    cond: (s) => s.moral < 70,
    opts: [
      { t: "Integrarlos en la campaña", fx: (s) => { s.moral += 6; s.cred -= 2; return "Paz interna, a cambio de algunas concesiones."; } },
      { t: "Imponer disciplina", fx: (s) => { s.moral -= 6; s.cred += 2; return "Imagen de autoridad, pero con tensiones."; } },
    ] },
  { id: "acte", title: "Un acto medio vacío", text: "La foto de un mitin con muchas sillas vacías corre por redes.",
    opts: [
      { t: "Hacer autocrítica con humor", fx: (s, r) => { if (r() < 0.5) { simAw(s, 0.03); return "El humor desactiva la polémica."; } s.moral -= 3; return "No a todo el mundo le hace gracia."; } },
      { t: "Movilizar a la militancia para el próximo", fx: (s) => { s.moral += 4; s.money -= 3; return "El próximo acto se llena. (3 de dinero)"; } },
    ] },
  { id: "jovent", title: "Las juventudes del partido", text: "Las juventudes del partido proponen una campaña en las universidades.",
    opts: [
      { t: "Darles presupuesto", fx: (s) => { s.money -= 5; simAw(s, 0.04); s.moral += 4; return "La campaña universitaria os da visibilidad. (5 de dinero)"; } },
      { t: "Ahora no toca", fx: (s) => { s.moral -= 3; return "Las juventudes se sienten poco escuchadas."; } },
    ] },
  { id: "micromecenatge", title: "Una campaña de micromecenazgo", text: "La militancia propone pedir pequeñas aportaciones a la ciudadanía.",
    opts: [
      { t: "Adelante", fx: (s, r) => { const k = 6 + Math.floor(r() * 10); s.money += k; s.moral += 2; return `Recaudáis ${k} unidades en pequeñas donaciones.`; } },
      { t: "No", fx: () => "Prefieres no pedir dinero ahora." },
    ] },
  { id: "deute", title: "Facturas pendientes", text: "La empresa que monta los escenarios reclama un pago atrasado.",
    cond: (s) => s.money > 20,
    opts: [
      { t: "Pagarlo ahora", fx: (s) => { s.money -= 10; return "Pagas y todo sigue igual. (10 de dinero)"; } },
      { t: "Negociar un aplazamiento", fx: (s, r) => { if (r() < 0.5) return "La empresa acepta esperar."; s.cred -= 5; return "La noticia llega a la prensa."; } },
    ] },
  { id: "auditoria", title: "Cuentas de campaña", text: "Un medio pregunta por el detalle de los gastos de la campaña.",
    opts: [
      { t: "Publicarlos todos", fx: (s) => { s.cred += 5; return "La transparencia se valora."; } },
      { t: "Remitirse al Tribunal de Cuentas", fx: (s) => { s.cred -= 2; return "Correcto, pero suena a evasiva."; } },
    ] },
  // Rivals
  { id: "atac", title: "Un ataque directo", text: "En una tertulia se dice que tu programa es imposible de pagar.",
    opts: [
      { t: "Responder con contundencia", fx: (s, r) => { const n = simRivalNear(s); if (r() < 0.5) { s.glob[n.id] -= 0.03; s.moral += 3; return "La respuesta contundente se hace viral."; } s.cred -= 4; return "El enfrentamiento no te favorece."; } },
      { t: "Explicar cómo se financia", fx: (s) => { s.cred += 2 + Math.floor(s.me.attrs.sol / 2); return "Explicas los números y ganas credibilidad."; } },
    ] },
  { id: "fitxatgerival", title: "Una cara nueva en la campaña", text: "Los medios solo hablan de las caras nuevas de las listas. La tuya parece demasiado conocida.",
    opts: [
      { t: "Presentar también una cara nueva", fx: (s) => { s.money -= 6; simAw(s, 0.04); return "Equilibras el impacto mediático. (6 de dinero)"; } },
      { t: "Centrarse en el programa", fx: (s) => { s.glob[simRivalNear(s).id] += 0.03; s.cred += 1; return "Las otras listas ganan visibilidad ese día."; } },
    ] },
  { id: "pacterival", title: "Rumores de pacto", text: (s) => `Se dice que pactarás con ${simRivalBig(s).name} después de las elecciones.`,
    opts: [
      { t: "Negarlo rotundamente", fx: (s) => { s.moral += 3; if (simDistP(simRivalBig(s), s.me) < 3.5) s.glob.jo -= 0.02; return "Clarificas tu espacio, pero cierras puertas."; } },
      { t: "No descartar nada", fx: (s) => { s.cred -= 2; if (simDistP(simRivalBig(s), s.me) < 3.5) s.glob.jo += 0.02; return "Suenas a partido de gobierno, pero algunos votantes dudan."; } },
    ] },
  { id: "propostacopiada", title: "Una propuesta muy compartida", text: "Tu propuesta estrella se parece a la de otros partidos y cuesta diferenciarla.",
    opts: [
      { t: "Explicar qué la hace diferente", fx: (s) => { s.cred += 2; return "Explicas por qué tu propuesta es diferente."; } },
      { t: "Celebrar que la idea se extienda", fx: (s) => { s.glob[simRivalBig(s).id] += 0.02; s.cred += 3; return "Quedas bien, pero el partido más grande también sale beneficiado."; } },
    ] },
  { id: "rivalescandol", title: "Debate sobre transparencia", text: "Un informe sobre la transparencia de los partidos abre un debate sobre la corrupción.",
    opts: [
      { t: "Proponer una auditoría pública de las cuentas de todos los partidos", fx: (s) => { s.cred += 4; s.money -= 3; return "La propuesta se valora, y das ejemplo publicando tus cuentas. (3 de dinero)"; } },
      { t: "Convertirlo en el centro de la campaña", fx: (s, r) => { if (r() < 0.5) { s.glob.jo += 0.03; return "El mensaje conecta con el malestar."; } s.cred -= 2; return "Se te reprocha usar el tema de manera oportunista."; } },
    ] },
  { id: "cartellsrival", title: "Carteles arrancados", text: "Aparecen carteles tuyos arrancados en varias ciudades.",
    opts: [
      { t: "Denunciarlo públicamente", fx: (s) => { s.moral += 4; simAw(s, 0.02); return "La noticia te da visibilidad."; } },
      { t: "Reponerlos sin ruido", fx: (s) => { s.money -= 3; return "Vuelves a colgar los carteles. (3 de dinero)"; } },
    ] },
  // Temes i crisis genèrics
  { id: "lloguers", title: "Los alquileres, en primera página", text: "Un informe dice que los alquileres han subido mucho en un año.",
    opts: [
      { t: "Hacer de la vivienda el tema del día", fx: (s) => { s.me.iss[0] = Math.min(1.3, s.me.iss[0] + 0.15); return "Sitúas la vivienda en el centro de tu mensaje."; } },
      { t: "Mantener el guion", fx: () => "Sigues con el plan previsto." },
    ] },
  { id: "fabrica", title: "Cierra una fábrica", text: (s) => "Una gran empresa anuncia el cierre de una fábrica y cientos de despidos.",
    opts: [
      { t: "Ir a la puerta de la fábrica", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.inc < 0.6); s.camp.jo[p.i] += 0.12; s.aw[p.i] += (1 - s.aw[p.i]) * 0.2; return `Haces un acto con los trabajadores en ${p.name}.`; } },
      { t: "Proponer un plan de reindustrialización", fx: (s) => { s.me.iss[1] = Math.min(1.3, s.me.iss[1] + 0.12); s.cred += 1; return "La propuesta refuerza tu discurso económico."; } },
    ] },
  { id: "onada", title: "Ola de calor", text: "Una ola de calor récord marca la semana.",
    opts: [
      { t: "Hablar de cambio climático", fx: (s) => { s.me.iss[5] = Math.min(1.3, s.me.iss[5] + 0.15); return s.me.val < 5 ? "El mensaje conecta con tu electorado." : "Sorprendes a parte de tu electorado, pero llegas a votantes nuevos."; } },
      { t: "Hablar de la factura de la luz", fx: (s) => { s.me.iss[1] = Math.min(1.3, s.me.iss[1] + 0.1); return "Pones el foco en el coste de la vida."; } },
    ] },
  { id: "llistes", title: "Listas de espera", text: "Un informe alerta de listas de espera larguísimas en la sanidad.",
    opts: [
      { t: "Presentar un plan de choque", fx: (s) => { s.me.iss[6] = Math.min(1.3, s.me.iss[6] + 0.15); s.cred += 1; return "El plan de choque te da protagonismo en sanidad."; } },
      { t: "Criticar la gestión actual", fx: (s) => { s.glob.jo += 0.02; return "La crítica conecta con el malestar."; } },
    ] },
  { id: "pensio", title: "Las pensiones, a debate", text: "Un estudio sobre la sostenibilidad de las pensiones abre todos los informativos.",
    opts: [
      { t: "Garantizarlas por escrito", fx: (s) => { s.me.iss[2] = Math.min(1.3, s.me.iss[2] + 0.15); s.cred -= s.me.eco > 6 ? 3 : 0; return "Las personas mayores te escuchan más."; } },
      { t: "Defender una reforma", fx: (s) => { s.cred += 2; s.me.iss[2] = Math.min(1.3, s.me.iss[2] + 0.05); return "Se te ve riguroso, pero no a todo el mundo le gusta."; } },
    ] },
  { id: "seguretat", title: "Un debate sobre seguridad", text: "Unos datos de delitos abren un debate sobre seguridad.",
    opts: [
      { t: "Proponer más policía de proximidad", fx: (s) => { s.me.iss[7] = Math.min(1.3, s.me.iss[7] + 0.12); return "Entras en el debate con una propuesta concreta."; } },
      { t: "Pedir que no se alarme", fx: (s) => { s.cred += 1; return s.me.val < 5 ? "Tu electorado te apoya." : "Parte de tu electorado lo encuentra blando."; } },
    ] },
  { id: "pastera", title: "Llegada de pateras", text: "La llegada de varias pateras abre un debate sobre inmigración.",
    opts: [
      { t: "Defender vías legales y acogida", fx: (s) => { s.me.iss[4] = Math.min(1.3, s.me.iss[4] + 0.1); return s.me.val < 5 ? "Coherente con tu programa." : "Sorprendes a tu electorado más conservador."; } },
      { t: "Pedir más control", fx: (s) => { s.me.iss[4] = Math.min(1.3, s.me.iss[4] + 0.1); return s.me.val > 5 ? "Coherente con tu programa." : "Sorprendes a tu electorado más progresista."; } },
    ] },
  { id: "financament", title: "La financiación de los territorios", text: "Varios gobiernos autonómicos reclaman un nuevo modelo de financiación.",
    opts: [
      { t: "Apoyarlos", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter > 0.5) s.camp.jo[p.i] += 0.05; else s.camp.jo[p.i] -= 0.02; }); return "Ganas apoyo donde hay más identidad territorial y pierdes un poco en el resto."; } },
      { t: "Defender la igualdad entre territorios", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter < 0.3) s.camp.jo[p.i] += 0.04; else s.camp.jo[p.i] -= 0.03; }); return "Conectas donde la identidad territorial es baja."; } },
    ] },
  { id: "vaga", title: "Una huelga general", text: "Los sindicatos convocan una huelga general en mitad de la campaña.",
    opts: [
      { t: "Apoyarla", fx: (s) => { s.glob.jo += s.me.eco < 4.5 ? 0.04 : -0.03; return s.me.eco < 4.5 ? "Tu electorado lo valora." : "No encaja con tu programa económico."; } },
      { t: "Pedir diálogo social", fx: (s) => { s.cred += 2; return "Un mensaje moderado, sin mucho impacto."; } },
    ] },
  { id: "pagesia", title: "El campo, en la calle", text: "Cientos de tractores cortan carreteras para reclamar precios justos.",
    opts: [
      { t: "Ir a hablar con los agricultores", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.urb < 0.5); s.camp.jo[p.i] += 0.12; s.aw[p.i] += (1 - s.aw[p.i]) * 0.2; return `Visitas la protesta en ${p.name}: te ganas el respeto del mundo rural.`; } },
      { t: "Defender las normas ambientales", fx: (s) => { s.me.iss[5] = Math.min(1.3, s.me.iss[5] + 0.1); return "Coherencia climática, pero pierdes simpatías en el campo."; } },
    ] },
  { id: "nevada", title: "Una gran nevada", text: "Una nevada corta carreteras y deja pueblos aislados.",
    opts: [
      { t: "Suspender los actos y ayudar", fx: (s) => { s.cred += 4; s.slot = Math.min(3, s.slot + 1); return "Suspendes un acto de hoy: la decisión se valora. Pierdes una franja."; } },
      { t: "Seguir con la campaña", fx: (s) => { s.cred -= 4; return "Te reprochan falta de sensibilidad."; } },
    ] },
  { id: "europa", title: "Una decisión de Bruselas", text: "La Comisión Europea alerta sobre el déficit público de España.",
    opts: [
      { t: "Defender la disciplina fiscal", fx: (s) => { s.glob.jo += s.me.eco > 5.5 ? 0.03 : -0.02; return "Mensaje de rigor económico."; } },
      { t: "Defender más inversión pública", fx: (s) => { s.glob.jo += s.me.eco < 4.5 ? 0.03 : -0.02; return "Mensaje de estímulo económico."; } },
    ] },
  { id: "tren", title: "Avería en los trenes", text: "Una avería deja a miles de viajeros tirados durante horas.",
    opts: [
      { t: "Proponer un plan de inversión", fx: (s) => { s.cred += 2; s.camp.jo[1] += 0.05; return "Hablas de infraestructuras y de servicio público."; } },
      { t: "Criticar la gestión", fx: (s) => { s.glob.jo += 0.02; return "La crítica conecta con la gente afectada."; } },
    ] },
  { id: "cibera", title: "Ciberataque a la web", text: "La web del partido queda inoperativa por un ataque informático.",
    opts: [
      { t: "Contratar una empresa de seguridad", fx: (s) => { s.money -= 6; return "La web vuelve a funcionar rápidamente. (6 de dinero)"; } },
      { t: "Esperar a que se resuelva", fx: (s) => { simAw(s, -0.02); s.moral -= 2; return "Un día sin web y sin formularios de voluntariado."; } },
    ] },
  // Territori i circumscripcions
  { id: "visitaprov", title: "Una provincia olvidada", text: (s) => "Una plataforma ciudadana de una provincia pequeña se queja de que nadie hace campaña allí.",
    opts: [
      { t: "Ir mañana", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.seats <= 3); s.camp.jo[p.i] += 0.22; s.aw[p.i] += (1 - s.aw[p.i]) * 0.3; s.money -= 4; return `Vas a ${p.name}: eres el primer partido en ir. (4 de dinero)`; } },
      { t: "No hay tiempo", fx: () => "Las circunscripciones pequeñas reparten pocos escaños: cuesta mucho entrar." },
    ] },
  { id: "catala", title: "La lengua, a debate", text: "Un debate sobre el uso de las lenguas oficiales en la administración llega a la campaña.",
    opts: [
      { t: "Defender el plurilingüismo", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter > 0.3) s.camp.jo[p.i] += 0.05; }); return "Ganas simpatías en los territorios con lengua propia."; } },
      { t: "Evitar el tema", fx: () => "Prefieres no entrar." },
    ] },
  { id: "illa", title: "Conexiones con las islas", text: "Baleares y Canarias reclaman más ayudas al transporte.",
    opts: [
      { t: "Comprometerte", fx: (s) => { [8, 11, 15].forEach((i) => { s.camp.jo[i] += 0.08; }); return "La propuesta se valora en las islas."; } },
      { t: "Priorizar la península", fx: () => "Las islas reparten 23 escaños: también cuentan." },
    ] },
  { id: "despoblament", title: "La España vaciada", text: "Un informe alerta de la despoblación de muchas provincias del interior.",
    opts: [
      { t: "Presentar un plan contra la despoblación", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.urb < 0.45) s.camp.jo[p.i] += 0.05; }); return "Ganas apoyo en las provincias rurales, donde un escaño cuesta menos votos."; } },
      { t: "Centrarse en las ciudades", fx: (s) => { s.camp.jo[0] += 0.05; s.camp.jo[1] += 0.05; return "Priorizas donde hay más electorado."; } },
    ] },
  // Diners i recursos
  { id: "publicitat", title: "Una oferta de publicidad", text: "Una cadena de radio ofrece espacios publicitarios con descuento.",
    cond: (s) => s.money >= 12,
    opts: [
      { t: "Comprarlos", fx: (s) => { s.money -= 12; simAw(s, 0.07); return "Tu cuña suena a todas horas. (12 de dinero)"; } },
      { t: "Ahorrar", fx: () => "Guardas el dinero para los últimos días." },
    ] },
  { id: "bustiada", title: "Propaganda electoral por correo", text: "Puedes enviar propaganda a todos los hogares de una comunidad.",
    cond: (s) => s.money >= 10,
    opts: [
      { t: "Enviarla donde tienes más opciones", fx: (s, r) => { const p = simLastPoll(s); let best = SIM_PROVS[1]; if (p?.provs) { const c = p.provs.map((x, i) => ({ x, i })).filter((o) => o.x.need !== null && o.x.need > 0).sort((a, b) => a.x.need - b.x.need)[0]; if (c) best = SIM_PROVS[c.i]; } SIM_PROVS.forEach((q) => { if (q.ccaa === best.ccaa) s.camp.jo[q.i] += 0.08; }); s.money -= 10; return `Buzoneo en ${best.ccaa}. (10 de dinero)`; } },
      { t: "No hace falta", fx: () => "Ahorras dinero." },
    ] },
  { id: "subvencio", title: "Las subvenciones electorales", text: "Recuerdas que el Estado paga una parte de la campaña según los escaños y los votos obtenidos.",
    opts: [
      { t: "Pedir un crédito a cuenta", fx: (s) => { s.money += 15; s.cred -= 2; return "Tienes más margen, pero te endeudas. Si no sacas escaños, costará devolverlo."; } },
      { t: "No arriesgar", fx: (s) => { s.cred += 1; return "Gestión prudente."; } },
    ] },
  // Lideratge
  { id: "malaltia", title: "Afonía", text: "El candidato se queda afónico después de tantos mítines.",
    opts: [
      { t: "Descansar un día", fx: (s) => { s.slot = Math.min(3, s.slot + 1); return "Pierdes una franja de hoy, pero recuperas la voz."; } },
      { t: "Seguir igualmente", fx: (s, r) => { if (r() < 0.5) { s.cred -= 3; return "Un mitin con la voz rota no luce mucho."; } return "Lo aguantas."; } },
    ] },
  { id: "biografia", title: "Un libro sobre el candidato", text: "Una editorial quiere publicar una biografía del candidato.",
    opts: [
      { t: "Colaborar", fx: (s) => { simAw(s, 0.03); s.me.lead = Math.min(0.8, s.me.lead + 0.03); return "El libro humaniza al candidato."; } },
      { t: "No es el momento", fx: () => "Prefieres hablar de propuestas." },
    ] },
  { id: "frase", title: "Una frase desafortunada", text: "Una frase del candidato sobre un colectivo genera indignación.",
    opts: [
      { t: "Pedir disculpas", fx: (s) => { s.cred -= 2; s.moral -= 2; return "Disculpas rápidas: el tema se enfría."; } },
      { t: "Decir que la han sacado de contexto", fx: (s, r) => { if (r() < 0.4) return "Medio convence."; s.cred -= 7; return "La polémica crece."; } },
    ] },
  { id: "carta", title: "Una carta abierta", text: "Personalidades de la cultura publican una carta pidiendo debate sobre propuestas, no insultos.",
    opts: [
      { t: "Firmarla y proponer un debate", fx: (s) => { s.cred += 3; simAw(s, 0.02); return "Tu imagen de diálogo mejora."; } },
      { t: "No responder", fx: () => "Pasa desapercibido." },
    ] },
  // Final de campanya
  { id: "tancament", title: "El acto de cierre", text: "¿Dónde haces el gran acto de final de campaña?",
    cond: (s) => s.day >= s.days - 1,
    opts: [
      { t: "En Madrid, el distrito más grande", fx: (s) => { s.camp.jo[0] += 0.12; s.moral += 4; s.money -= 6; return "Un gran acto en Madrid. (6 de dinero)"; } },
      { t: "Donde estás a punto de escaño", fx: (s) => { const b = simProvBest(s); if (!b) { s.moral += 2; return "No hay ninguna circunscripción clara: haces un acto en casa."; } s.camp.jo[b.i] += 0.2; s.money -= 6; return `Cierras la campaña en ${b.name}, donde te falta poco para un escaño. (6 de dinero)`; } },
      { t: "En tu circunscripción más fuerte", fx: (s) => { s.moral += 8; return "La militancia sale eufórica."; } },
    ] },
  { id: "indecisos", title: "Un 30 % de indecisos", text: "La encuesta del juego dice que casi un tercio del electorado todavía no sabe qué votará.",
    cond: (s) => s.day >= 4,
    opts: [
      { t: "Mensaje en positivo", fx: (s) => { s.glob.jo += 0.03; return "Un cierre optimista para atraer a los indecisos."; } },
      { t: "Mensaje de movilización", fx: (s) => { s.moral += 5; s.turnBoost = Math.min(0.03, (s.turnBoost || 0) + 0.01); return "Llamas a ir a votar: la participación sube un poco."; } },
    ] },
  { id: "votcorreu", title: "Récord de voto por correo", text: "El voto por correo bate récords y mucha gente ya ha votado.",
    cond: (s) => s.day >= 3,
    opts: [
      { t: "Recordar cómo se vota por correo", fx: (s) => { s.cred += 2; return "Un servicio público: la gente lo agradece."; } },
      { t: "Centrarse en el día de la votación", fx: (s) => { s.moral += 2; return "Preparas la movilización del domingo."; } },
    ] },
  { id: "observadors", title: "Interventores y apoderados", text: "Hay que organizar a los interventores que representarán al partido en las mesas.",
    cond: (s) => s.day >= 4,
    opts: [
      { t: "Formar a la militancia", fx: (s) => { s.moral += 4; s.money -= 3; return "Tendréis interventores en muchas mesas. (3 de dinero)"; } },
      { t: "Cubrir solo las grandes ciudades", fx: () => "Ahorras esfuerzo." },
    ] },
);

function simPickEvent(state) {
  const seen = state.used.events || (state.used.events = []);
  const pool = SIM_EVENTS.filter((e) => !seen.includes(e.id) && (!e.cond || e.cond(state)));
  if (!pool.length) return null;
  const e = pool[Math.floor(simRand(state, "event") * pool.length)];
  seen.push(e.id);
  return e;
}

function simApplyEvent(state, ev, k) {
  const rng = () => simRand(state, `ev-${ev.id}`);
  const msg = ev.opts[k].fx(state, rng);
  state.cred = Math.max(0, Math.min(100, state.cred));
  state.moral = Math.max(0, Math.min(100, state.moral));
  state.money = Math.max(0, state.money);
  state.log.push({ day: state.day, type: "event", msg, good: true });
  return msg;
}

function simDebateQuestions(state) {
  const n = state.used.debates = (state.used.debates || 0) + 1;
  const rng = simMulberry(simHash(`${state.seed}|debat|${n}`));
  const qs = [...SIM_DEBATE_QS];
  for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
  return qs.slice(0, 3);
}

// ---------- Legislatura: decisions de govern de cada trimestre ----------
// Cada opció té una posició ideològica (pos: eix, posició i tema), uns efectes sobre els indicadors (fx)
// i una explicació breu de causa i efecte (why). Cap opció és la correcta: només té conseqüències diferents.
const SIM_LEG_CARDS = [
  { id: "energia", title: "El precio de la luz se dispara", text: "La factura eléctrica se ha doblado en tres meses.",
    opts: [
      { t: "Un tope al precio del gas", pos: { ax: "eco", p: 2, th: 1 }, fx: { eco: -2, ben: 5, pop: 2 }, why: "La factura baja y las familias respiran, pero el Estado asume parte del coste." },
      { t: "Bajar los impuestos de la luz", pos: { ax: "eco", p: 7, th: 1 }, fx: { eco: 1, ben: 3, pop: 2 }, why: "Baja el precio para todos, también para quien no lo necesita, y se recauda menos." },
      { t: "Ayudas directas a los hogares vulnerables", pos: { ax: "eco", p: 4, th: 1 }, fx: { eco: -1, ben: 4 }, why: "Ayuda a quien más lo necesita, pero la mayoría no nota ningún cambio." },
    ] },
  { id: "habitatge", title: "La vivienda, problema número uno", text: "Las encuestas dicen que la vivienda es la principal preocupación de la ciudadanía.",
    opts: [
      { t: "Tope a los alquileres en las zonas tensionadas", pos: { ax: "eco", p: 2, th: 0 }, fx: { ben: 4, eco: -2 }, why: "Los alquileres se estabilizan, pero algunos propietarios retiran pisos del mercado." },
      { t: "Un gran plan de vivienda pública", pos: { ax: "eco", p: 3.5, th: 0 }, fx: { ben: 3, eco: -1 }, why: "Más vivienda asequible a medio plazo, con mucho gasto público." },
      { t: "Incentivos fiscales para construir", pos: { ax: "eco", p: 8, th: 0 }, fx: { eco: 4, ben: 1 }, why: "Se construye más, pero los precios tardan en bajar." },
    ] },
  { id: "atur", title: "El paro repunta", text: "El paro ha subido dos puntos en un trimestre.",
    opts: [
      { t: "Un plan de empleo público", pos: { ax: "eco", p: 2.5, th: 1 }, fx: { ben: 3, eco: 1 }, why: "Crea puestos de trabajo rápidamente, con cargo al presupuesto." },
      { t: "Rebajar las cotizaciones de las empresas", pos: { ax: "eco", p: 7.5, th: 1 }, fx: { eco: 4, ben: -1 }, why: "Las empresas contratan más, pero la Seguridad Social ingresa menos." },
      { t: "Una reforma laboral pactada con sindicatos y patronal", pos: { ax: "eco", p: 5, th: 1 }, fx: { eco: 2, ben: 2, pop: 1 }, why: "El pacto social da estabilidad, con cambios moderados." },
    ] },
  { id: "referendum", title: "Un parlamento autonómico pide un referéndum", text: "Un parlamento autonómico aprueba pedir un referéndum de autodeterminación.",
    opts: [
      { t: "Abrir una mesa de diálogo", pos: { ax: "ter", p: 7, th: 3 }, fx: { coh: 6, pop: -1 }, why: "La tensión baja en los territorios, pero parte del electorado lo ve como una cesión." },
      { t: "Aplicar la Constitución con firmeza", pos: { ax: "ter", p: 1, th: 3 }, fx: { coh: -6, pop: 1 }, why: "Mensaje claro de unidad, pero el conflicto se enquista." },
      { t: "Proponer una reforma federal", pos: { ax: "ter", p: 5.5, th: 3 }, fx: { coh: 3 }, why: "Una vía intermedia que no satisface del todo a nadie." },
    ] },
  { id: "migracio", title: "Llegadas masivas a las costas", text: "La llegada de miles de personas desborda los centros de acogida.",
    opts: [
      { t: "Reparto entre comunidades y acogida", pos: { ax: "val", p: 2.5, th: 4 }, fx: { ben: 2, coh: 1 }, why: "Se deshace el cuello de botella, pero algunas comunidades se oponen." },
      { t: "Acuerdos con los países de origen", pos: { ax: "val", p: 5, th: 4 }, fx: { coh: 1 }, why: "Menos llegadas a medio plazo, con resultados lentos." },
      { t: "Más control y retornos", pos: { ax: "val", p: 8.5, th: 4 }, fx: { ben: -1, pop: 1 }, why: "Menos llegadas a corto plazo y críticas de las ONG." },
    ] },
  { id: "sanitat", title: "Huelga en la sanidad", text: "Médicas y enfermeros hacen huelga por las plantillas y los sueldos.",
    opts: [
      { t: "Subir sueldos y ampliar plantillas", pos: { ax: "eco", p: 2, th: 6 }, fx: { ben: 6, eco: -3 }, why: "Se desconvoca la huelga y mejora la atención, con un coste alto." },
      { t: "Concertar operaciones con la privada", pos: { ax: "eco", p: 7.5, th: 6 }, fx: { ben: 2, eco: 1 }, why: "Las listas de espera bajan rápido, pero la huelga continúa." },
      { t: "Una mediación", pos: { ax: "eco", p: 5, th: 6 }, fx: { ben: 2, eco: -1 }, why: "Un acuerdo a medias que compra tiempo." },
    ] },
  { id: "sequera", title: "Sequía extrema", text: "Los embalses están en mínimos históricos.",
    opts: [
      { t: "Restricciones y desalinizadoras", pos: { ax: "val", p: 3, th: 5 }, fx: { eco: -2, ben: 2 }, why: "Se asegura el agua de boca, con pérdidas para la agricultura." },
      { t: "Trasvases entre cuencas", pos: { ax: "val", p: 6.5, th: 5 }, fx: { eco: 2, coh: -4 }, why: "Llega agua donde falta, pero enfrenta a territorios." },
      { t: "Ayudas a los agricultores", pos: { ax: "val", p: 5, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Alivia al campo sin resolver la falta de agua." },
    ] },
  { id: "inflacio", title: "La cesta de la compra", text: "Los precios de los alimentos suben mucho más que los sueldos.",
    opts: [
      { t: "Rebajar el IVA de los alimentos", pos: { ax: "eco", p: 6, th: 1 }, fx: { ben: 3, eco: -1, pop: 2 }, why: "Los precios bajan un poco y se recauda menos." },
      { t: "Un impuesto a los beneficios extraordinarios", pos: { ax: "eco", p: 2, th: 1 }, fx: { ben: 3, eco: -2 }, why: "Financia ayudas, pero las empresas afectadas amenazan con recurrir." },
      { t: "No intervenir", pos: { ax: "eco", p: 8.5, th: 1 }, fx: { eco: 2, ben: -3, pop: -2 }, why: "El mercado se ajusta solo, pero el malestar crece." },
    ] },
  { id: "pensions", title: "Las pensiones del año que viene", text: "Hay que decidir cuánto suben las pensiones.",
    opts: [
      { t: "Subirlas con la inflación", pos: { ax: "eco", p: 3, th: 2 }, fx: { ben: 4, eco: -2, pop: 2 }, why: "Los pensionistas no pierden poder adquisitivo; el gasto sube." },
      { t: "Alargar la edad de jubilación", pos: { ax: "eco", p: 7.5, th: 2 }, fx: { eco: 3, pop: -3 }, why: "El sistema es más sostenible, pero es una medida impopular." },
      { t: "Llevarlo al Pacto de Toledo", pos: { ax: "eco", p: 5, th: 2 }, fx: { eco: 1, ben: 1 }, why: "Consenso amplio, decisiones más lentas." },
    ] },
  { id: "corrupcio", title: "Un caso de corrupción", text: "La policía investiga a un alto cargo de un ministerio.",
    opts: [
      { t: "Cesarlo y crear una comisión de investigación", fx: { pop: 2, est: -3 }, why: "Transmite ejemplaridad, pero la comisión da munición a la oposición." },
      { t: "Esperar a que actúe la justicia", fx: { pop: -4 }, why: "Respetas la presunción de inocencia, pero parece que lo proteges." },
    ] },
  { id: "incendis", title: "Un verano de incendios", text: "Los incendios forestales queman miles de hectáreas.",
    opts: [
      { t: "Más brigadas públicas todo el año", pos: { ax: "eco", p: 3, th: 5 }, fx: { ben: 3, eco: -1 }, why: "Más prevención, más gasto estructural." },
      { t: "Ley de gestión forestal con los propietarios", pos: { ax: "eco", p: 7, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Implica al sector privado; los resultados llegan a largo plazo." },
    ] },
  { id: "seguretat", title: "Debate sobre la seguridad", text: "Unos cuantos delitos mediáticos sitúan la seguridad en la agenda.",
    opts: [
      { t: "Plan de prevención en los barrios", pos: { ax: "val", p: 2.5, th: 7 }, fx: { ben: 2 }, why: "Ataca las causas, con efectos lentos." },
      { t: "Más agentes de proximidad", pos: { ax: "val", p: 5.5, th: 7 }, fx: { ben: 1, eco: -1, pop: 1 }, why: "Más sensación de seguridad, con un coste moderado." },
      { t: "Reforma del Código Penal", pos: { ax: "val", p: 9, th: 7 }, fx: { pop: 1, coh: -1 }, why: "Penas más duras; los expertos dudan de su eficacia." },
    ] },
  { id: "educacio", title: "La primera infancia", text: "Faltan plazas en las escuelas infantiles.",
    opts: [
      { t: "Gratuidad de 0 a 3 años", pos: { ax: "eco", p: 2, th: 6 }, fx: { ben: 5, eco: -2 }, why: "Ayuda a conciliar y a reducir desigualdades, con una gran inversión." },
      { t: "Un cheque para elegir centro", pos: { ax: "eco", p: 8.5, th: 6 }, fx: { ben: 2, eco: 1 }, why: "Más libertad de elección; los centros públicos temen perder recursos." },
      { t: "Un plan contra el abandono escolar", pos: { ax: "eco", p: 4.5, th: 6 }, fx: { ben: 3, eco: -1 }, why: "Ataca un problema grave, pero no resuelve las plazas de 0 a 3." },
    ] },
  { id: "financament", title: "La financiación autonómica", text: "Las comunidades reclaman un nuevo sistema de financiación.",
    opts: [
      { t: "Un modelo singular para cada territorio", pos: { ax: "ter", p: 7.5, th: 3 }, fx: { coh: 5, pop: -1 }, why: "Satisface a los territorios con más identidad, y molesta a otros." },
      { t: "Un modelo común para todos", pos: { ax: "ter", p: 2.5, th: 3 }, fx: { coh: -3, pop: 1 }, why: "Igualdad formal, pero los que aportan más se sienten maltratados." },
      { t: "Un fondo de compensación", pos: { ax: "ter", p: 5, th: 3 }, fx: { coh: 2, eco: -1 }, why: "Una solución intermedia, con un coste para el Estado." },
    ] },
  { id: "industria", title: "Una gran inversión industrial", text: "Una multinacional quiere instalar una fábrica de baterías en España.",
    opts: [
      { t: "Entrar con dinero público", pos: { ax: "eco", p: 3, th: 1 }, fx: { eco: 3, ben: 1 }, why: "Asegura la fábrica, con riesgo para las arcas públicas." },
      { t: "Rebajar el impuesto de sociedades", pos: { ax: "eco", p: 8, th: 1 }, fx: { eco: 4, ben: -1 }, why: "Atrae la inversión, pero reduce la recaudación." },
    ] },
  { id: "turisme", title: "El turismo masivo", text: "Varias ciudades protestan por el turismo masivo.",
    opts: [
      { t: "Tasa turística y límite a los pisos turísticos", pos: { ax: "eco", p: 2.5, th: 0 }, fx: { ben: 3, eco: -1 }, why: "Alivia los barrios, pero el sector turístico protesta." },
      { t: "Ordenar sin limitar", pos: { ax: "eco", p: 6, th: 0 }, fx: { eco: 1 }, why: "Nada cambia mucho: ni la protesta ni los ingresos." },
      { t: "Promover más turismo", pos: { ax: "eco", p: 8, th: 0 }, fx: { eco: 3, ben: -2 }, why: "Más ingresos, más tensión en los barrios." },
    ] },
  { id: "llengues", title: "Las lenguas cooficiales", text: "Se debate si el catalán, el vasco y el gallego deben poder usarse en todas las instituciones del Estado.",
    opts: [
      { t: "Permitirlo en las Cortes y en la UE", pos: { ax: "ter", p: 7.5, th: 3 }, fx: { coh: 4 }, why: "Reconocimiento para los territorios con lengua propia, con un coste de traducción." },
      { t: "Mantener el castellano como lengua de trabajo", pos: { ax: "ter", p: 1.5, th: 3 }, fx: { coh: -4, pop: 1 }, why: "Más simple, pero se percibe como un desprecio." },
    ] },
  { id: "salari", title: "El salario mínimo", text: "Hay que fijar el salario mínimo del año que viene.",
    opts: [
      { t: "Subirlo un 8 %", pos: { ax: "eco", p: 2.5, th: 1 }, fx: { ben: 4, eco: -1, pop: 1 }, why: "Más poder adquisitivo para los sueldos bajos; algunos pequeños negocios lo notan." },
      { t: "Subirlo con la inflación", pos: { ax: "eco", p: 5, th: 1 }, fx: { ben: 1, eco: 1 }, why: "Se mantiene el poder adquisitivo, sin sorpresas." },
      { t: "Congelarlo", pos: { ax: "eco", p: 8, th: 1 }, fx: { eco: 2, ben: -3, pop: -2 }, why: "Alivia a las empresas y perjudica a los sueldos más bajos." },
    ] },
  { id: "clima", title: "Las emisiones no bajan", text: "España no cumple los objetivos europeos de reducción de emisiones.",
    opts: [
      { t: "Prohibir los vuelos cortos con alternativa en tren", pos: { ax: "val", p: 2.5, th: 5 }, fx: { ben: 1, eco: -1, coh: -1 }, why: "Menos emisiones; las zonas sin buen tren se sienten excluidas." },
      { t: "Ayudas a la renovación de vehículos y calefacciones", pos: { ax: "val", p: 5, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Cambio gradual con dinero público." },
      { t: "No poner nuevas restricciones", pos: { ax: "val", p: 8, th: 5 }, fx: { eco: 1, pop: 1 }, why: "Sin costes inmediatos; Europa puede imponer sanciones." },
    ] },
  { id: "defensa", title: "El gasto en defensa", text: "Los aliados internacionales piden más gasto militar.",
    opts: [
      { t: "Aumentarlo", pos: { ax: "val", p: 7, th: 7 }, fx: { eco: -1, ben: -1 }, why: "Cumples los compromisos, pero hay menos dinero para otras cosas." },
      { t: "Priorizar el gasto social", pos: { ax: "val", p: 3, th: 7 }, fx: { ben: 2, pop: 1 }, why: "Mantienes los servicios, pero los aliados te presionan." },
    ] },
];

// Tria la decisió del trimestre: una de nova cada vegada, sempre la mateixa per a la mateixa llavor
function simLegPickCard(state) {
  const L = state.leg;
  const pool = SIM_LEG_CARDS.filter((c) => !L.cards.includes(c.id) && (!c.cond || c.cond(state)));
  const c = pool[Math.floor(simRand(state, "leg-card") * pool.length)] || SIM_LEG_CARDS[0];
  L.cards.push(c.id);
  return c;
}

// Aplica una opció d'una decisió de govern. Retorna l'explicació i els canvis.
function simLegApplyCard(state, card, k) {
  const L = state.leg, o = card.opts[k];
  const before = { ...L.ind };
  Object.entries(o.fx || {}).forEach(([key, v]) => { if (key !== "est") L.ind[key] += v * 1.5; });
  // La popularitat del jugador depèn de si la decisió encaixa amb el seu programa
  if (o.pos && (simLegRole(state) === "pm" || simLegRole(state) === "coal")) L.ind.pop += simMeasureView(state.me, o.pos) * 4;
  const reacts = o.pos ? simLegReact(state, o.pos) : [];
  if (o.fx?.est) Object.keys(L.sup).forEach((id) => { if (!L.gov.parties.includes(id)) L.sup[id] -= 0.05; });
  simClampInd(L);
  simLegStability(state);
  L.log.push({ q: L.q + 1, type: "card", id: card.id, k });
  const delta = Object.fromEntries(Object.keys(L.ind).map((key) => [key, L.ind[key] - before[key]]));
  return { why: o.why, delta, reacts };
}
