// Sala de premsa (#premsa i #premsa/<id>): les notes de premsa enviades, amb la foto per descarregar. Les publica
// tools/premsa.js a GitHub Pages (premsa/index.json i premsa/<id>.json) quan s'envien des del Centre de control.
// Baixa de la llista de premsa (#baixa/<codi>): l'enllaç del peu de cada correu.

const premsaBase = () => (window.PEJ_DATA || "../data/").replace(/data\/$/, "premsa/");
async function premsaFetch(file) {
  try {
    const r = await fetch(`${premsaBase()}${file}?t=${Math.floor(Date.now() / 60000)}`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ---------- Sala de premsa: navegació i peces comunes ----------
// #premsa (portada), #premsa/notes, #premsa/kit, #premsa/dades, #premsa/widgets, #premsa/guies, #premsa/faq i #premsa/<id> (una nota)
const PR_EMAIL = "brudomingosola@gmail.com";
const PR_SECTIONS = [
  ["", "Sala de prensa", "🏛️"], ["notes", "Notas de prensa", "📰"], ["kit", "Kit de prensa", "🎨"], ["dades", "Datos del 29N", "📊"],
  ["widgets", "Widgets", "🧩"], ["guies", "Guías y explicadores", "📚"], ["faq", "Preguntas frecuentes", "❓"],
];
const prNav = (on) => `<nav class="pr-nav" aria-label="Sala de prensa">${PR_SECTIONS.map(([k, t, i]) => `<a href="#premsa${k ? `/${k}` : ""}" class="${k === on ? "on" : ""}"${k === on ? ` aria-current="page"` : ""}><span aria-hidden="true">${i}</span>${t}</a>`).join("")}</nav>`;
const prHead = (on, kicker, title, lede) => `<h1 class="page-title">${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}${prNav(on)}`;
const prContact = () => `<section class="card pr-contact">
  <h2>Contacto de prensa</h2>
  <p>Para entrevistas, datos a medida, imágenes en otro tamaño o versiones personalizadas de los widgets:</p>
  <div class="pr-contact-row">
    <a class="btn primary" href="mailto:${PR_EMAIL}?subject=Premsa%20%C2%B7%20Pol%C3%ADtica%20en%20Joc">✉️ ${PR_EMAIL}</a>
    <a class="btn" href="https://x.com/emdicbru" target="_blank" rel="noopener">𝕏 @emdicbru</a>
    <button class="btn ghost" type="button" data-pr-copy="${PR_EMAIL}">Copiar la dirección</button>
  </div>
</section>`;
const prLang = () => (typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es" : "ca");
const prPlain = (s) => String(s || "").replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").replace(/\*\*/g, "");
// Descàrregues fetes al moment amb les dades de l'app (sempre al dia)
function prDownload(name, text, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([type.startsWith("text/csv") ? "﻿" + text : text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.Stats?.step?.("premsa", "descarrega");
}
const prCsv = (rows) => rows.map((r) => r.map((c) => { const s = String(c ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");
function prBindCommon(root) {
  $$("[data-pr-copy]", root).forEach((b) => b.addEventListener("click", async () => {
    const t = b.dataset.prCopy || $(b.dataset.prCopyFrom, root)?.innerText || "";
    const old = b.textContent;
    try { await navigator.clipboard.writeText(t); b.textContent = "Copiado ✓"; window.Stats?.step?.("premsa", "copia"); } catch { b.textContent = "No se ha podido copiar"; }
    setTimeout(() => { b.textContent = old; }, 2000);
  }));
}

async function renderPremsa(id) {
  const root = $("#premsa-page");
  if (!root) return;
  const pages = { widgets: renderWidgets, kit: prKit, dades: prDades, guies: prGuies, faq: prFaq };
  if (pages[id]) {
    document.title = `${PR_SECTIONS.find(([k]) => k === id)[1]} · Sala de prensa · Política en Joc`;
    pages[id](root);
    prBindCommon(root);
    window.Stats?.step?.("premsa", id);
    window.scrollTo(0, 0);
    return;
  }
  if (!id || id === "notes") { await prHome(root, id === "notes"); prBindCommon(root); return; }
  root.innerHTML = `<div class="pr"><div class="card"><p class="muted">Cargando…</p></div></div>`;
  if (id) {
    const n = /^[A-Za-z0-9]{10,40}$/.test(id) ? await premsaFetch(`${id}.json`) : null;
    if (!location.hash.startsWith(`#premsa/${id}`)) return;
    if (!n) { root.innerHTML = `<div class="pr"><div class="card"><h1 class="page-title">No encontramos esta nota</h1><p>Quizá el enlace no está completo.</p><a class="btn" href="#premsa">Todas las notas de prensa</a></div></div>`; return; }
    document.title = `${n.title} · Política en Joc`;
    root.innerHTML = `<div class="pr"><article class="card pr-note">
      <p class="pr-kicker">Nota de prensa</p>
      <p class="pr-date">${esc(n.place ? `${n.place}, ` : "")}${esc(premsaDate(n.date))}</p>
      <h1>${esc(n.title)}</h1>
      ${n.lead ? `<p class="pr-lead">${esc(n.lead)}</p>` : ""}
      ${n.photo ? `<figure><img src="${esc(n.photo)}" alt="${esc(n.caption || n.title)}"><figcaption>${esc(n.caption || "")} <a href="${esc(n.photo)}" download target="_blank" rel="noopener">Descarga la foto</a></figcaption></figure>` : ""}
      <div class="pr-body">${premsaRich(n.body, "")}</div>
      ${n.about || n.contact ? `<div class="pr-about">${n.about ? `<p><b>Sobre Política en Joc</b></p>${premsaRich(n.about, "")}` : ""}${n.contact ? `<p><b>Contacto de prensa</b><br>${premsaInline(n.contact)}</p>` : ""}</div>` : ""}
    </article><p><a class="btn ghost" href="#premsa">← Todas las notas de prensa</a></p></div>`;
    return;
  }
}

const prNotesList = (list) => (list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Todavía no hay ninguna nota de prensa.</p></div>`);

// ---------- Portada de la sala (#premsa) i totes les notes (#premsa/notes) ----------
async function prHome(root, onlyNotes) {
  document.title = `${onlyNotes ? "Notas de prensa" : "Sala de prensa"} · Política en Joc`;
  root.innerHTML = `<div class="pr pr-hub"><div class="card"><p class="muted">Cargando…</p></div></div>`;
  const list = await premsaFetch("index.json");
  if (!location.hash.startsWith("#premsa")) return;
  if (onlyNotes) {
    root.innerHTML = `<div class="pr pr-hub">${prHead("notes", "Sala de prensa", "Notas de prensa", "Todas las notas de prensa de Política en Joc, de la más reciente a la más antigua, con las fotos para descargar.")}${prNotesList(list)}${prContact()}</div>`;
    return;
  }
  const quiz = typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.reduce((a, c) => a + (c.quiz?.length || 0), 0) : 0;
  const figures = [
    [typeof GAMES !== "undefined" ? GAMES.length : 0, "minijocs"], [typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.length : 0, "capítulos de la guía para votar"],
    [typeof GLOSSARY !== "undefined" ? GLOSSARY.length : 0, "términos en el diccionario"], [quiz, "preguntas para repasar"],
    [typeof SIM_PROVS !== "undefined" ? SIM_PROVS.length : 52, "circunscripciones con datos"], ["0 €", "gratuita para todo el mundo"],
  ].filter(([n]) => n);
  const cards = [
    ["kit", "🎨", "Kit de prensa", "Logotipos, colores, tipografías, capturas de la app y textos para describirla, listos para descargar."],
    ["dades", "📊", "Datos del 29N", "Escaños por circunscripción, resultados de 2023, escaños a vigilar, encuestas y calendario, en CSV, JSON y calendario."],
    ["widgets", "🧩", "Widgets para tu web", "El pactómetro, el repartidor de escaños y la cuenta atrás, para insertar en un artículo con dos líneas de código."],
    ["guies", "📚", "Guías y explicadores", "Cómo se vota, cómo se reparten los escaños, qué pasa después: capítulos cortos para enlazar o citar."],
    ["faq", "❓", "Preguntas frecuentes", "Quién hay detrás, de dónde salen los datos, cómo se tratan las encuestas y cómo se puede usar el material."],
    ["notes", "📰", "Notas de prensa", "Todas las notas enviadas, con las fotos."],
  ];
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("", "Política en Joc", "Sala de prensa", "Todo lo que necesitas para explicar las elecciones del 29N: datos descargables, imágenes, widgets para tu web y guías. Gratuito para medios, docentes y entidades.")}
    <div class="pr-figs">${figures.map(([n, t]) => `<div class="pr-fig"><b>${typeof n === "number" ? fmt(n) : n}</b><span>${t}</span></div>`).join("")}</div>
    <div class="pr-cards">${cards.map(([k, i, t, d]) => `<a class="card pr-card" href="#premsa/${k}"><span class="pr-card-i" aria-hidden="true">${i}</span><b>${t}</b><span>${d}</span></a>`).join("")}</div>
    <h2 class="section-title sm">Últimas notas de prensa</h2>
    ${prNotesList((list || []).slice(0, 3))}
    ${list?.length > 3 ? `<p><a class="btn ghost" href="#premsa/notes">Todas las notas (${list.length}) →</a></p>` : ""}
    ${prContact()}
  </div>`;
}

// ---------- Kit de premsa (#premsa/kit) ----------
const PR_COLORS = [["Tinta", "#17173d", "Textos, contornos y fondos oscuros"], ["Papel", "#f1e9d8", "Fondo de la app, con trama de puntos"], ["Amarillo rotulador", "#ffcf3d", "Símbolo y resaltados"], ["Rojo sello", "#ff4b2b", "Acento: «Joc», botones principales"], ["Azul", "#3554ff", "Enlaces y elementos activos"], ["Tarjeta", "#fffaf0", "Fondo de las tarjetas"]];
const PR_SHOTS = [["inici", "Portada"], ["repte-diari", "Reto diario"], ["minijocs", "Minijuegos"], ["simulador", "Simuladores"], ["apren", "Aprende: guía para votar"], ["pactometre", "Pactómetro"], ["noticies", "Noticias"], ["nit-electoral", "Noche electoral"]];
function prKit(root) {
  const n = typeof GAMES !== "undefined" ? GAMES.length : 16, ch = typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.length : 12;
  const short = "Política en Joc es una web y app gratuita para entender las elecciones generales del 29N jugando.";
  const long = `Política en Joc (politicaenjoc.cat) es una web y app gratuita, en catalán y en castellano, para entender las elecciones generales del 29 de noviembre de 2026 jugando. Tiene un reto diario, ${n} minijuegos, una guía para votar de ${ch} capítulos, un diccionario de política, un simulador electoral y uno de debate, el pactómetro y la noche electoral en directo. También se puede jugar con amigos, con chat y llamadas. Es un proyecto independiente, sin ningún vínculo con partidos, instituciones ni medios, creado por Bruno Domingo Sola.`;
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("kit", "Sala de prensa", "Kit de prensa", "Logotipos, colores, capturas y textos de Política en Joc. Úsalos libremente para informar de la app o de las elecciones.")}
    <section class="card pr-sec">
      <h2>Cómo describir Política en Joc</h2>
      <div class="pr-text"><small>En una frase</small><p id="pr-short">${short}</p><button class="btn ghost sm" type="button" data-pr-copy-from="#pr-short">Copiar</button></div>
      <div class="pr-text"><small>En un párrafo</small><p id="pr-long">${long}</p><button class="btn ghost sm" type="button" data-pr-copy-from="#pr-long">Copiar</button></div>
      <p class="muted">El nombre se escribe «Política en Joc», con mayúscula en la P y en la J. La dirección es <b>politicaenjoc.cat</b> (en castellano, politicaenjoc.cat/es).</p>
    </section>
    <section class="card pr-sec">
      <h2>Logotipos</h2>
      <div class="pr-logos">
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/premsa/logo-horitzontal.png" alt="Logotipo horizontal de Política en Joc"></div><figcaption>Horizontal, para fondos claros<span><a href="/img/premsa/logo-horitzontal.png" download>PNG</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev dark"><img src="/img/premsa/logo-horitzontal-negatiu.png" alt="Logotipo horizontal en negativo"></div><figcaption>Horizontal, para fondos oscuros<span><a href="/img/premsa/logo-horitzontal-negatiu.png" download>PNG</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/premsa/logo-simbol.svg" alt="Símbolo de Política en Joc"></div><figcaption>Símbolo<span><a href="/img/premsa/logo-simbol.svg" download>SVG</a> · <a href="/img/icon-512.png" download>PNG 512</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/og.png" alt="Imagen para compartir de Política en Joc"></div><figcaption>Imagen para compartir<span><a href="/img/og.png" download>PNG</a></span></figcaption></figure>
      </div>
      <p class="muted">Deja espacio alrededor del logotipo y no cambies sus colores ni sus proporciones.</p>
    </section>
    <section class="card pr-sec">
      <h2>Colores y tipografías</h2>
      <div class="pr-colors">${PR_COLORS.map(([t, hex, d]) => `<button type="button" class="pr-color" data-pr-copy="${hex}" style="--c:${hex}"><i></i><b>${t}</b><code>${hex}</code><span>${d}</span></button>`).join("")}</div>
      <div class="pr-fonts">
        <div><b class="pr-font-d">Unbounded</b><span>Títulos, en mayúsculas y muy gruesa. Licencia abierta (SIL OFL).</span></div>
        <div><b class="pr-font-s">DM Sans</b><span>Textos. Licencia abierta (SIL OFL).</span></div>
      </div>
    </section>
    <section class="card pr-sec">
      <h2>Capturas de la app</h2>
      <p class="muted">En el ordenador (1.440 × 900) y en el móvil (1.170 × 2.532). Toca una imagen para verla en grande.</p>
      <div class="pr-shots">${PR_SHOTS.map(([k, t]) => `<figure class="pr-shot">
        <a href="/img/premsa/${k}-escriptori.jpg" target="_blank" rel="noopener"><img src="/img/premsa/${k}-escriptori.jpg" alt="${t}, en el ordenador" loading="lazy"></a>
        <figcaption><b>${t}</b><span><a href="/img/premsa/${k}-escriptori.jpg" download>Ordenador</a> · <a href="/img/premsa/${k}-mobil.jpg" download>Móvil</a></span></figcaption>
      </figure>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>Condiciones de uso</h2>
      <ul class="pr-ul">
        <li>Puedes usar el logotipo, las capturas, los textos y los datos para informar de Política en Joc o de las elecciones, citando la fuente: «Política en Joc».</li>
        <li>No los modifiques de manera que cambie su sentido, ni los uses de forma que parezca que Política en Joc tiene algún vínculo con un partido, una candidatura o una institución.</li>
        <li>Para usos comerciales o publicitarios, escríbenos antes.</li>
      </ul>
    </section>
    ${prContact()}
  </div>`;
}

// ---------- Dades del 29N (#premsa/dades): taules i descàrregues fetes amb les dades de l'app ----------
function prSig(k) {
  if (typeof nitParty === "function") return nitParty(k).sig;
  return (typeof PACTE_INFO !== "undefined" && PACTE_INFO[k]?.sig) || k.toUpperCase();
}
function prDadesRows() {
  const provs = SIM_PROVS.filter((p) => NIT_2023[p.code]);
  return provs.map((p) => {
    const d = NIT_2023[p.code], s23 = Object.values(d.s).reduce((a, b) => a + b, 0);
    const an = nitProv(d.v, d.b, s23);
    const top = Object.entries(d.s).sort((a, b) => b[1] - a[1] || (d.v[b[0]] || 0) - (d.v[a[0]] || 0))[0];
    const valid = Object.values(d.v).reduce((a, b) => a + b, 0) + d.b;
    return { p, d, s23, s26: p.seats, an, top: top?.[0], valid };
  });
}
function prDades(root) {
  const rows = prDadesRows();
  const watch = rows.filter((r) => r.an.challenger && r.an.need).sort((a, b) => a.an.margin - b.an.margin).slice(0, 15);
  const changed = rows.filter((r) => r.s26 !== r.s23);
  const blocked = typeof pollsBlocked === "function" && pollsBlocked();
  const avg = !blocked && typeof averageSeats === "function" ? averageSeats() : null;
  const pct = !blocked && typeof averagePct === "function" ? averagePct() : [];
  const tot23 = {};
  rows.forEach((r) => Object.entries(r.d.s).forEach(([k, n]) => { tot23[k] = (tot23[k] || 0) + n; }));
  const pctFmt = (x, d = 2) => (x * 100).toFixed(d).replace(".", ",");
  const cal = typeof CALENDAR !== "undefined" ? CALENDAR : [];
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("dades", "Sala de prensa", "Datos del 29N", "Los datos que usa la app, en tablas y para descargar. Se generan al momento, de modo que siempre son los de la versión actual.")}
    <div class="pr-figs">
      <div class="pr-fig"><b>350</b><span>diputados en el Congreso</span></div>
      <div class="pr-fig"><b>176</b><span>mayoría absoluta</span></div>
      <div class="pr-fig"><b>${rows.length}</b><span>circunscripciones</span></div>
      <div class="pr-fig"><b>3 %</b><span>umbral por circunscripción, con el voto en blanco</span></div>
      <div class="pr-fig"><b>${watch.filter((r) => r.an.lvl).length}</b><span>escaños a vigilar según 2023</span></div>
    </div>

    <section class="card pr-sec">
      <h2>Escaños a vigilar</h2>
      <p>Los últimos escaños que el 23-J de 2023 se decidieron por menos votos: donde un cambio pequeño puede mover un diputado. «Le faltan» son los votos que habría necesitado el segundo para quitárselo.</p>
      <div class="table-wrap"><table class="pr-table">
        <thead><tr><th>Circunscripción</th><th>Escaños</th><th>Último escaño</th><th>Se lo habría quitado</th><th>Le faltan</th><th>% de los válidos</th></tr></thead>
        <tbody>${watch.map((r) => `<tr><td><b>${esc(r.p.name)}</b></td><td>${r.s23}</td><td>${esc(prSig(r.an.victim))}</td><td>${esc(prSig(r.an.challenger))}</td><td>${fmt(r.an.need)}</td><td>${pctFmt(r.an.margin)} %</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="vigilar">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Escaños por circunscripción</h2>
      <p>Diputados que elige cada circunscripción el 29N (Real Decreto 806/2026) y en 2023.${changed.length ? ` Cambian ${changed.map((r) => `${esc(r.p.name)} (${r.s26 > r.s23 ? "+" : "−"}${Math.abs(r.s26 - r.s23)})`).join(" i ")}.` : ""}</p>
      <div class="table-wrap pr-scroll"><table class="pr-table">
        <thead><tr><th>Circunscripción</th><th>Comunidad</th><th>Escaños 29N</th><th>Escaños 2023</th><th>Primera fuerza 2023</th></tr></thead>
        <tbody>${rows.slice().sort((a, b) => b.s26 - a.s26 || a.p.name.localeCompare(b.p.name, "es")).map((r) => `<tr><td><b>${esc(r.p.name)}</b></td><td>${esc(r.p.ccaa)}</td><td>${r.s26}${r.s26 !== r.s23 ? ` <small class="${r.s26 > r.s23 ? "up" : "down"}">${r.s26 > r.s23 ? "+" : "−"}${Math.abs(r.s26 - r.s23)}</small>` : ""}</td><td>${r.s23}</td><td>${esc(prSig(r.top))}</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="escons">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Resultados del 23-J de 2023</h2>
      <p>Votos y escaños de cada candidatura en cada circunscripción, y el voto en blanco. Fuente: Ministerio del Interior. Sumar se agrupa con el nombre actual (Frente Amplio); «otros» reúne las candidaturas de menos del 0,4 %.</p>
      <div class="pr-seats23">${Object.entries(tot23).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span><b>${n}</b>${esc(prSig(k))}</span>`).join("")}</div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="r2023">⬇ CSV</button><button class="btn ghost" type="button" data-dl="r2023json">⬇ JSON</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Encuestas</h2>
      ${blocked ? `<p><b>Durante los cinco días anteriores a la votación la ley no permite publicar ni difundir encuestas</b> (artículo 69.7 de la LOREG). Volverán a estar aquí cuando cierren los colegios, el 29 de noviembre a las 20.00 h.</p>`
        : `<p>Media aritmética de ${typeof POLL_SEATS !== "undefined" ? POLL_SEATS.length : ""} encuestas de escaños, ajustada a 350, y de la intención de voto de las ${typeof POLL_PCT !== "undefined" ? POLL_PCT.length : ""} más recientes. Recopilación de Wikipedia (${typeof POLL_UPDATED !== "undefined" ? POLL_UPDATED : ""}). Las encuestas no son un pronóstico.</p>
      <div class="table-wrap"><table class="pr-table"><thead><tr><th>Partido</th><th>Escaños (media)</th><th>Voto (media)</th><th>Intervalo</th></tr></thead>
        <tbody>${PACTE_ORDER.filter((id) => avg[id] > 0 && id !== "altres").sort((a, b) => avg[b] - avg[a]).map((id) => { const p = pct.find((x) => x.id === id); return `<tr><td><b>${esc(PACTE_INFO[id].sig)}</b></td><td>${avg[id]}</td><td>${p ? `${p.avg.toFixed(1).replace(".", ",")} %` : "—"}</td><td>${p ? `${p.min.toFixed(1).replace(".", ",")}–${p.max.toFixed(1).replace(".", ",")} %` : "—"}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="enquestes">⬇ CSV</button> <a class="btn ghost" href="${typeof POLL_SOURCE !== "undefined" ? POLL_SOURCE : "#"}" target="_blank" rel="noopener">Fuente ↗</a></div>`}
    </section>

    <section class="card pr-sec">
      <h2>Calendario electoral</h2>
      <ol class="pr-cal">${cal.map((e) => `<li class="${e.key ? "key" : ""}"><b>${esc(e.label)}</b><span>${esc(e.text)}</span></li>`).join("")}</ol>
      <div class="pr-dl"><button class="btn" type="button" data-dl="ics">📅 Afegeix-lo al teu calendari (.ics)</button><button class="btn ghost" type="button" data-dl="calcsv">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Fuentes y metodología</h2>
      <ul class="pr-ul">
        <li><b>Resultados de 2023:</b> Ministerio del Interior, a través de las páginas de cada circunscripción. Comprobado: la ley D'Hondt con estos votos reproduce los 350 escaños.</li>
        <li><b>Escaños del 29N:</b> Real Decreto 806/2026, de convocatoria (BOE del 6 de octubre).</li>
        <li><b>Escaños a vigilar:</b> cálculo propio con la ley D'Hondt y el umbral del 3 %, con enteros y el criterio de empate del artículo 163.1 de la LOREG.</li>
        <li><b>Encuestas:</b> recopilación de Wikipedia. Cuando una empresa da una horquilla, se toma el valor central. No se publican del 24 al 29 de noviembre (art. 69.7 de la LOREG).</li>
        <li><b>Calendario:</b> el decreto de convocatoria y la LOREG.</li>
      </ul>
      <p class="muted">Si citas estos datos, indica «Fuente: Política en Joc, a partir de datos del Ministerio del Interior». Si encuentras un error, escríbenos.</p>
    </section>
    ${prContact()}
  </div>`;
  const ics = () => {
    const d8 = (iso) => iso.replace(/-/g, "");
    const next = (iso) => { const t = new Date(`${iso}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10).replace(/-/g, ""); };
    const fold = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Politica en Joc//Calendario 29N//ES", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Elecciones generales del 29N",
      ...cal.flatMap((e, i) => ["BEGIN:VEVENT", `UID:29n-${i}-${e.date}@politicaenjoc.cat`, `DTSTAMP:${d8(new Date().toISOString().slice(0, 10))}T000000Z`, `DTSTART;VALUE=DATE:${d8(e.date)}`, `DTEND;VALUE=DATE:${next(e.date)}`, `SUMMARY:${fold(e.text)}`, `DESCRIPTION:${fold(`${e.label}. Calendario electoral del 29N · politicaenjoc.cat/es`)}`, "END:VEVENT"]),
      "END:VCALENDAR"].join("\r\n");
  };
  const DL = {
    vigilar: () => prDownload("escons-a-vigilar-2023.csv", prCsv([["circumscripcio", "escons", "ultim_esco", "l_hauria_pres", "vots_que_falten", "percentatge_valids"], ...watch.map((r) => [r.p.name, r.s23, prSig(r.an.victim), prSig(r.an.challenger), r.an.need, pctFmt(r.an.margin, 3)])])),
    escons: () => prDownload("escons-per-circumscripcio-29n.csv", prCsv([["circumscripcio", "comunitat", "escons_29n", "escons_2023", "primera_forca_2023"], ...rows.map((r) => [r.p.name, r.p.ccaa, r.s26, r.s23, prSig(r.top)])])),
    r2023: () => prDownload("resultats-congres-2023.csv", prCsv([["circumscripcio", "candidatura", "vots", "escons"], ...rows.flatMap((r) => [...Object.entries(r.d.v).sort((a, b) => b[1] - a[1]).map(([k, v]) => [r.p.name, k === "altres" ? "Otros" : prSig(k), v, r.d.s[k] || 0]), [r.p.name, "En blanco", r.d.b, 0]])])),
    r2023json: () => prDownload("resultats-congres-2023.json", JSON.stringify(Object.fromEntries(rows.map((r) => [r.p.name, { codi: r.p.code, escons: r.s23, en_blanc: r.d.b, vots: Object.fromEntries(Object.entries(r.d.v).map(([k, v]) => [k === "altres" ? "Otros" : prSig(k), v])), escons_per_candidatura: Object.fromEntries(Object.entries(r.d.s).map(([k, v]) => [prSig(k), v])) }])), null, 1), "application/json"),
    enquestes: () => avg && prDownload("enquestes-mitjana.csv", prCsv([["partit", "escons_mitjana", "vot_mitjana", "vot_minim", "vot_maxim"], ...PACTE_ORDER.filter((id) => avg[id] > 0).map((id) => { const p = pct.find((x) => x.id === id); return [PACTE_INFO[id].sig, avg[id], p ? p.avg.toFixed(1) : "", p ? p.min : "", p ? p.max : ""]; })])),
    ics: () => prDownload("calendari-29n.ics", ics(), "text/calendar;charset=utf-8"),
    calcsv: () => prDownload("calendari-29n.csv", prCsv([["data", "quan", "que"], ...cal.map((e) => [e.date, e.label, e.text])])),
  };
  $$("[data-dl]", root).forEach((b) => b.addEventListener("click", () => DL[b.dataset.dl]?.()));
}

// ---------- Guies i explicadors (#premsa/guies) ----------
function prGuies(root) {
  const L = prLang(), base = L === "es" ? "/es/aprende/" : "/apren/";
  const st = L === "es"
    ? [["/es/elecciones-29n/", "Elecciones del 29N: todo lo que hay que saber"], ["/es/escanos-por-provincia/", "Escaños por provincia"], ["/es/diccionario/", "Diccionario de política"], ["/es/preguntas-frecuentes/", "Preguntas frecuentes"]]
    : [["/eleccions-29n/", "Eleccions del 29N: tot el que cal saber"], ["/escons-per-provincia/", "Escaños por provincia"], ["/diccionari/", "Diccionario de política"], ["/preguntes-frequents/", "Preguntas frecuentes"]];
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("guies", "Sala de prensa", "Guías y explicadores", "Explicaciones cortas y rigurosas de cómo funcionan las elecciones, para enlazar desde un artículo o usar en clase. Todas tienen una página propia, sin tener que abrir la app.")}
    <section class="card pr-sec">
      <h2>Páginas de referencia</h2>
      <div class="pr-links">${st.map(([u, t]) => `<a class="pr-linkc" href="${u}" target="_blank" rel="noopener"><b>${t}</b><span>politicaenjoc.cat${u}</span></a>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>La guía para votar, capítulo a capítulo</h2>
      <div class="pr-chs">${(typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS : []).map((c) => `<article class="pr-ch">
        <small>Capítulo ${c.n}, ${c.mins} min</small>
        <h3>${esc(c.title)}</h3>
        <p>${esc(prPlain(c.lead))}</p>
        <span class="pr-ch-l"><a href="${base}${c.slug}/" target="_blank" rel="noopener">Página para enlazar ↗</a><a href="#apren/${c.slug}">En la app, paso a paso</a></span>
      </article>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>Herramientas para explicarlo</h2>
      <div class="pr-links">${(typeof AP_TOOLS !== "undefined" ? AP_TOOLS : []).map((t) => `<a class="pr-linkc" href="${t.href || `#apren/${t.slug}`}"><b>${esc(t.title)}</b><span>${esc(t.text)}</span></a>`).join("")}
        <a class="pr-linkc" href="#premsa/widgets"><b>Widgets para tu web</b><span>Pactómetro, repartidor de escaños y cuenta atrás.</span></a></div>
    </section>
    ${prContact()}
  </div>`;
}

// ---------- Preguntes freqüents per a periodistes (#premsa/faq) ----------
const PR_FAQ = [
  ["¿Qué es Política en Joc?", "Una web y app gratuita, en catalán y en castellano, para entender las elecciones generales del 29 de noviembre de 2026 jugando: reto diario, minijuegos, una guía para votar, un diccionario, simuladores, el pactómetro y la noche electoral en directo."],
  ["¿Quién hay detrás?", "Es un proyecto independiente creado por Bruno Domingo Sola. No tiene ningún vínculo con partidos, candidaturas, instituciones ni medios de comunicación, y no es una web oficial."],
  ["¿Es neutral?", "Explica cómo funciona el sistema electoral con datos públicos y no recomienda el voto. Los partidos reales se presentan con datos y propuestas verificables. El simulador electoral usa partidos ficticios. En el pactómetro, las mayorías que se proponen descartan las alianzas que hoy no son plausibles (por ejemplo, Vox con independentistas); es un criterio editorial que se explica en la misma herramienta."],
  ["¿De dónde salen los datos?", "Los resultados de 2023 son del Ministerio del Interior; los escaños del 29N, del decreto de convocatoria; las encuestas, de la recopilación de Wikipedia; y el calendario, del decreto y de la LOREG. Las fuentes aparecen en cada herramienta y en el apartado Datos de esta sala."],
  ["¿Cómo se tratan las encuestas?", "Se muestra su media, ajustada a 350 escaños, con la fuente y la fecha. Del 24 al 29 de noviembre, mientras la ley no permite publicarlas (art. 69.7 de la LOREG), la app y los widgets dejan de mostrarlas y pasan a los resultados de 2023."],
  ["¿Cómo se financia?", "Es gratuita para todo el mundo y no recibe dinero de partidos ni de instituciones. La única publicidad es opcional: un vídeo que alguien puede decidir ver para jugar una partida extra del reto diario."],
  ["¿Qué datos recoge de quien la usa?", "Para jugar no hace falta cuenta. Si creas una, se guarda el progreso y el nombre de usuario. La estadística de uso es anónima y solo con consentimiento. Los chats y las llamadas entre amigos no se leen ni se graban. Todo se explica en la política de privacidad."],
  ["¿Puedo usar las capturas, el logotipo y los datos?", "Sí, para informar de Política en Joc o de las elecciones, citando «Política en Joc». Están en el kit de prensa y en el apartado Datos. Para usos comerciales, escríbenos antes."],
  ["¿Puedo poner el pactómetro o el repartidor de escaños en mi medio?", "Sí: en el apartado Widgets está el código para copiar. Son gratuitos, se adaptan a la página y no usan cookies."],
  ["¿Se puede usar en clase?", "Sí. La guía para votar tiene capítulos cortos con preguntas para repasar y un examen final, y el simulador y el debate se pueden jugar en grupo. Si eres docente y quieres hacerlo con un grupo, escríbenos."],
  ["¿Puedo entrevistar a su creador?", "Sí: escribe a la dirección de contacto de esta página y te responderemos lo antes posible."],
];
function prFaq(root) {
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("faq", "Sala de prensa", "Preguntas frecuentes", "Las respuestas a las preguntas que nos hacen más a menudo periodistas y docentes.")}
    <div class="pr-faq">${PR_FAQ.map(([q, a]) => `<details class="card pr-q"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
    ${prContact()}
  </div>`;
}

// ---------- Widgets per a altres webs (#premsa/widgets): vista prèvia i codi per copiar (widget/) ----------
const PR_WIDGETS = [
  { w: "pactometre", t: "Pactómetro", d: "¿Quién puede sumar 176 escaños? Los lectores tocan los partidos y ven si hay investidura, con la media de las encuestas. Durante los cinco días en que la ley no permite publicar encuestas, pasa solo a los escaños de 2023." },
  { w: "escons", t: "Repartidor de escaños", d: "Cómo se reparten los escaños de una circunscripción con la ley D'Hondt. Parte de los votos de 2023 y, al mover los porcentajes, dice de quién es el último escaño y cuántos votos faltan para quitárselo.", prov: true },
  { w: "compte", t: "Cuenta atrás del 29N", d: "Los días que faltan para votar, con el reto del día. El día de las elecciones pasa a la jornada y al escrutinio en directo." },
];
function renderWidgets(root) {
  const origin = /^https?:\/\/(localhost|127\.)/.test(location.origin) ? location.origin : "https://politicaenjoc.cat";
  const provs = typeof SIM_PROVS !== "undefined" ? SIM_PROVS.filter((p) => p.seats).sort((a, b) => a.name.localeCompare(b.name, "es")) : [];
  const code = (w, prov) => `<div class="pej-widget" data-w="${w}"${prov ? ` data-prov="${prov}"` : ""}></div>\n<script async src="${origin}/widget/embed.js"></script>`;
  root.innerHTML = `<div class="pr pr-wg">
    <h1 class="page-title">Widgets para tu web</h1>
    <p class="lede">Pon el pactómetro, el repartidor de escaños o la cuenta atrás del 29N dentro de un artículo. Copia el código y pégalo donde quieras que salga: se adapta al ancho y al alto de la página. Por ahora, los widgets están en catalán.</p>
    ${prNav("widgets")}
    <div class="card pr-wg-terms">
      <p><b>Gratuitos</b> para medios, blogs, entidades y centros educativos. Las únicas condiciones son que la marca de Política en Joc se vea y que no se modifique su contenido.</p>
      <p>Los widgets no guardan nada en el dispositivo de los lectores, no usan cookies y no cargan ningún servicio de terceros: no hace falta añadirlos al aviso de cookies de tu web.</p>
      <p>Si quieres una versión con tus colores o tu logotipo, o un widget de resultados para la noche electoral, escríbenos a <a href="mailto:brudomingosola@gmail.com?subject=Widgets%20de%20Pol%C3%ADtica%20en%20Joc">brudomingosola@gmail.com</a>.</p>
    </div>
    ${PR_WIDGETS.map((x) => `<section class="card pr-wg-item" data-wg="${x.w}">
      <h2>${x.t}</h2>
      <p>${x.d}</p>
      ${x.prov && provs.length ? `<label class="pr-wg-prov">Circunscripción <select data-wg-prov>${provs.map((p) => `<option value="${p.code}" ${p.code === "B" ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>` : ""}
      <div class="pr-wg-prev"><iframe src="/widget/?w=${x.w}${x.prov ? "&prov=B" : ""}&id=prev-${x.w}" title="${x.t}" loading="lazy" style="height:${x.w === "compte" ? 300 : 620}px"></iframe></div>
      <div class="pr-wg-code"><pre><code data-wg-code>${esc(code(x.w, x.prov ? "B" : ""))}</code></pre><button class="btn" type="button" data-wg-copy>Copia el código</button></div>
    </section>`).join("")}
    ${prContact()}
  </div>`;
  $$("[data-wg]", root).forEach((sec) => {
    const w = sec.dataset.wg, pre = $("[data-wg-code]", sec), sel = $("[data-wg-prov]", sec), frame = $("iframe", sec);
    sel?.addEventListener("change", () => {
      pre.textContent = code(w, sel.value);
      frame.src = `/widget/?w=${w}&prov=${sel.value}&id=prev-${w}`;
    });
    $("[data-wg-copy]", sec).addEventListener("click", async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copiado ✓"; window.Stats?.step?.("premsa", "copia"); }
      catch { getSelection().selectAllChildren(pre); b.textContent = "Selecciónalo y cópialo"; }
      setTimeout(() => { b.textContent = "Copia el código"; }, 2500);
    });
  });
}
// L'alçada de les vistes prèvies, com fa embed.js a les altres webs
window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.data?.pej !== "widget" || !/^prev-/.test(e.data.id || "")) return;
  const f = document.querySelector(`[data-wg="${e.data.id.slice(5)}"] iframe`);
  if (f && e.data.h > 0) f.style.height = `${Math.min(e.data.h, 3000)}px`;
});

function renderBaixa(tok) {
  const root = $("#baixa-page");
  if (!root) return;
  const valid = /^[A-Za-z0-9]{24}$/.test(tok || "");
  const box = (inner) => `<div class="pr"><div class="card pr-unsub">${inner}</div></div>`;
  if (!valid) {
    root.innerHTML = box(`<h1 class="page-title">Baja de la lista de prensa</h1><p>${tok === "prova" ? "Este es el enlace de un correo de prueba: no hace nada." : "El enlace no está completo. Cópialo entero del correo, o escríbenos y te daremos de baja."}</p>`);
    return;
  }
  // Cal un clic: alguns filtres de correu obren els enllaços sols i no han de donar de baixa ningú
  root.innerHTML = box(`<h1 class="page-title">¿Quieres dejar de recibir las notas de prensa?</h1>
    <p>No te volveremos a enviar notas de prensa de Política en Joc a esta dirección.</p>
    <div class="row" style="justify-content:center"><button class="btn primary lg" type="button" data-unsub>Sí, dame de baja</button></div>`);
  $("[data-unsub]", root).addEventListener("click", async (e) => {
    e.target.disabled = true;
    const ok = await window.Online?.pressUnsub?.(tok);
    root.innerHTML = box(ok
      ? `<h1 class="page-title">Hecho</h1><p>Te hemos dado de baja de la lista de prensa. Sentimos las molestias.</p><a class="btn" href="#inici">Ve a Política en Joc</a>`
      : `<h1 class="page-title">No se ha podido hacer</h1><p>Vuelve a intentarlo en un momento. Si sigue sin funcionar, responde al correo y te daremos de baja a mano.</p><button class="btn" type="button" data-unsub-retry>Vuelve a intentarlo</button>`);
    $("[data-unsub-retry]", root)?.addEventListener("click", () => renderBaixa(tok));
  });
}
