// Sala de premsa (#premsa i #premsa/<id>): les notes de premsa enviades, amb la foto per descarregar. Les publica
// tools/premsa.js a GitHub Pages (premsa/index.json i premsa/<id>.json) quan s'envien des del Centre de control.
// Baixa de la llista de premsa (#baixa/<codi>): l'enllaç del peu de cada correu.

const premsaBase = () => (window.PEJ_DATA || "data/").replace(/data\/$/, "premsa/");
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
  ["", "Sala de premsa", "🏛️"], ["notes", "Notes de premsa", "📰"], ["kit", "Kit de premsa", "🎨"], ["dades", "Dades del 29N", "📊"],
  ["widgets", "Widgets", "🧩"], ["guies", "Guies i explicadors", "📚"], ["faq", "Preguntes freqüents", "❓"],
];
const prNav = (on) => `<nav class="pr-nav" aria-label="Sala de premsa">${PR_SECTIONS.map(([k, t, i]) => `<a href="#premsa${k ? `/${k}` : ""}" class="${k === on ? "on" : ""}"${k === on ? ` aria-current="page"` : ""}><span aria-hidden="true">${i}</span>${t}</a>`).join("")}</nav>`;
const prHead = (on, kicker, title, lede) => `<h1 class="page-title">${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}${prNav(on)}`;
const prContact = () => `<section class="card pr-contact">
  <h2>Contacte de premsa</h2>
  <p>Per a entrevistes, dades a mida, imatges en una altra mida o versions personalitzades dels widgets:</p>
  <div class="pr-contact-row">
    <a class="btn primary" href="mailto:${PR_EMAIL}?subject=Premsa%20%C2%B7%20Pol%C3%ADtica%20en%20Joc">✉️ ${PR_EMAIL}</a>
    <a class="btn" href="https://x.com/emdicbru" target="_blank" rel="noopener">𝕏 @emdicbru</a>
    <button class="btn ghost" type="button" data-pr-copy="${PR_EMAIL}">Copia l'adreça</button>
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
    try { await navigator.clipboard.writeText(t); b.textContent = "Copiat ✓"; window.Stats?.step?.("premsa", "copia"); } catch { b.textContent = "No s'ha pogut copiar"; }
    setTimeout(() => { b.textContent = old; }, 2000);
  }));
}

async function renderPremsa(id) {
  const root = $("#premsa-page");
  if (!root) return;
  const pages = { widgets: renderWidgets, kit: prKit, dades: prDades, guies: prGuies, faq: prFaq };
  if (pages[id]) {
    document.title = `${PR_SECTIONS.find(([k]) => k === id)[1]} · Sala de premsa · Política en Joc`;
    pages[id](root);
    prBindCommon(root);
    window.Stats?.step?.("premsa", id);
    window.scrollTo(0, 0);
    return;
  }
  if (!id || id === "notes") { await prHome(root, id === "notes"); prBindCommon(root); return; }
  root.innerHTML = `<div class="pr"><div class="card"><p class="muted">Carregant…</p></div></div>`;
  if (id) {
    const n = /^[A-Za-z0-9]{10,40}$/.test(id) ? await premsaFetch(`${id}.json`) : null;
    if (!location.hash.startsWith(`#premsa/${id}`)) return;
    if (!n) { root.innerHTML = `<div class="pr"><div class="card"><h1 class="page-title">No trobem aquesta nota</h1><p>Potser l'enllaç no és complet.</p><a class="btn" href="#premsa">Totes les notes de premsa</a></div></div>`; return; }
    document.title = `${n.title} · Política en Joc`;
    root.innerHTML = `<div class="pr"><article class="card pr-note">
      <p class="pr-kicker">Nota de premsa</p>
      <p class="pr-date">${esc(n.place ? `${n.place}, ` : "")}${esc(premsaDate(n.date))}</p>
      <h1>${esc(n.title)}</h1>
      ${n.lead ? `<p class="pr-lead">${esc(n.lead)}</p>` : ""}
      ${n.photo ? `<figure><img src="${esc(n.photo)}" alt="${esc(n.caption || n.title)}"><figcaption>${esc(n.caption || "")} <a href="${esc(n.photo)}" download target="_blank" rel="noopener">Descarrega la foto</a></figcaption></figure>` : ""}
      <div class="pr-body">${premsaRich(n.body, "")}</div>
      ${n.about || n.contact ? `<div class="pr-about">${n.about ? `<p><b>Sobre Política en Joc</b></p>${premsaRich(n.about, "")}` : ""}${n.contact ? `<p><b>Contacte de premsa</b><br>${premsaInline(n.contact)}</p>` : ""}</div>` : ""}
    </article><p><a class="btn ghost" href="#premsa">← Totes les notes de premsa</a></p></div>`;
    return;
  }
}

const prNotesList = (list) => (list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Encara no hi ha cap nota de premsa.</p></div>`);

// ---------- Portada de la sala (#premsa) i totes les notes (#premsa/notes) ----------
async function prHome(root, onlyNotes) {
  document.title = `${onlyNotes ? "Notes de premsa" : "Sala de premsa"} · Política en Joc`;
  root.innerHTML = `<div class="pr pr-hub"><div class="card"><p class="muted">Carregant…</p></div></div>`;
  const list = await premsaFetch("index.json");
  if (!location.hash.startsWith("#premsa")) return;
  if (onlyNotes) {
    root.innerHTML = `<div class="pr pr-hub">${prHead("notes", "Sala de premsa", "Notes de premsa", "Totes les notes de premsa de Política en Joc, de la més recent a la més antiga, amb les fotos per descarregar.")}${prNotesList(list)}${prContact()}</div>`;
    return;
  }
  const quiz = typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.reduce((a, c) => a + (c.quiz?.length || 0), 0) : 0;
  const figures = [
    [typeof GAMES !== "undefined" ? GAMES.length : 0, "minijocs"], [typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.length : 0, "capítols de la guia per votar"],
    [typeof GLOSSARY !== "undefined" ? GLOSSARY.length : 0, "termes al diccionari"], [quiz, "preguntes per repassar"],
    [typeof SIM_PROVS !== "undefined" ? SIM_PROVS.length : 52, "circumscripcions amb dades"], ["0 €", "gratuïta per a tothom"],
  ].filter(([n]) => n);
  const cards = [
    ["kit", "🎨", "Kit de premsa", "Logotips, colors, tipografies, captures de l'app i textos per descriure-la, a punt per descarregar."],
    ["dades", "📊", "Dades del 29N", "Escons per circumscripció, resultats del 2023, escons a vigilar, enquestes i calendari, en CSV, JSON i calendari."],
    ["widgets", "🧩", "Widgets per a la teva web", "El pactòmetre, el repartidor d'escons i el compte enrere, per incrustar en un article amb dues línies de codi."],
    ["guies", "📚", "Guies i explicadors", "Com es vota, com es reparteixen els escons, què passa després: capítols curts per enllaçar o citar."],
    ["faq", "❓", "Preguntes freqüents", "Qui hi ha darrere, d'on surten les dades, com es tracten les enquestes i com es pot fer servir el material."],
    ["notes", "📰", "Notes de premsa", "Totes les notes enviades, amb les fotos."],
  ];
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("", "Política en Joc", "Sala de premsa", "Tot el que necessites per explicar les eleccions del 29N: dades descarregables, imatges, widgets per a la teva web i guies. Gratuït per a mitjans, docents i entitats.")}
    <div class="pr-figs">${figures.map(([n, t]) => `<div class="pr-fig"><b>${typeof n === "number" ? fmt(n) : n}</b><span>${t}</span></div>`).join("")}</div>
    <div class="pr-cards">${cards.map(([k, i, t, d]) => `<a class="card pr-card" href="#premsa/${k}"><span class="pr-card-i" aria-hidden="true">${i}</span><b>${t}</b><span>${d}</span></a>`).join("")}</div>
    <h2 class="section-title sm">Últimes notes de premsa</h2>
    ${prNotesList((list || []).slice(0, 3))}
    ${list?.length > 3 ? `<p><a class="btn ghost" href="#premsa/notes">Totes les notes (${list.length}) →</a></p>` : ""}
    ${prContact()}
  </div>`;
}

// ---------- Kit de premsa (#premsa/kit) ----------
const PR_COLORS = [["Tinta", "#17173d", "Textos, contorns i fons foscos"], ["Paper", "#f1e9d8", "Fons de l'app, amb trama de punts"], ["Groc retolador", "#ffcf3d", "Símbol i ressaltats"], ["Vermell segell", "#ff4b2b", "Accent: «Joc», botons principals"], ["Blau", "#3554ff", "Enllaços i elements actius"], ["Targeta", "#fffaf0", "Fons de les targetes"]];
const PR_SHOTS = [["inici", "Portada"], ["repte-diari", "Repte diari"], ["minijocs", "Minijocs"], ["simulador", "Simuladors"], ["apren", "Aprèn: guia per votar"], ["pactometre", "Pactòmetre"], ["noticies", "Notícies"], ["nit-electoral", "Nit electoral"]];
function prKit(root) {
  const n = typeof GAMES !== "undefined" ? GAMES.length : 16, ch = typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS.length : 12;
  const short = "Política en Joc és una web i app gratuïta per entendre les eleccions generals del 29N jugant.";
  const long = `Política en Joc (politicaenjoc.cat) és una web i app gratuïta, en català i en castellà, per entendre les eleccions generals del 29 de novembre de 2026 jugant. Té un repte diari, ${n} minijocs, una guia per votar de ${ch} capítols, un diccionari de política, un simulador electoral i un de debat, el pactòmetre i la nit electoral en directe. També s'hi pot jugar amb amics, amb xat i trucades. És un projecte independent, sense cap vincle amb partits, institucions ni mitjans, creat per Bruno Domingo Sola.`;
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("kit", "Sala de premsa", "Kit de premsa", "Logotips, colors, captures i textos de Política en Joc. Fes-los servir lliurement per informar de l'app o de les eleccions.")}
    <section class="card pr-sec">
      <h2>Com descriure Política en Joc</h2>
      <div class="pr-text"><small>En una frase</small><p id="pr-short">${short}</p><button class="btn ghost sm" type="button" data-pr-copy-from="#pr-short">Copia</button></div>
      <div class="pr-text"><small>En un paràgraf</small><p id="pr-long">${long}</p><button class="btn ghost sm" type="button" data-pr-copy-from="#pr-long">Copia</button></div>
      <p class="muted">El nom s'escriu «Política en Joc», amb majúscula a la P i a la J. L'adreça és <b>politicaenjoc.cat</b> (en castellà, politicaenjoc.cat/es).</p>
    </section>
    <section class="card pr-sec">
      <h2>Logotips</h2>
      <div class="pr-logos">
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/premsa/logo-horitzontal.png" alt="Logotip horitzontal de Política en Joc"></div><figcaption>Horitzontal, per a fons clars<span><a href="/img/premsa/logo-horitzontal.png" download>PNG</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev dark"><img src="/img/premsa/logo-horitzontal-negatiu.png" alt="Logotip horitzontal en negatiu"></div><figcaption>Horitzontal, per a fons foscos<span><a href="/img/premsa/logo-horitzontal-negatiu.png" download>PNG</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/premsa/logo-simbol.svg" alt="Símbol de Política en Joc"></div><figcaption>Símbol<span><a href="/img/premsa/logo-simbol.svg" download>SVG</a> · <a href="/img/icon-512.png" download>PNG 512</a></span></figcaption></figure>
        <figure class="pr-logo"><div class="pr-logo-prev"><img src="/img/og.png" alt="Imatge per compartir de Política en Joc"></div><figcaption>Imatge per compartir<span><a href="/img/og.png" download>PNG</a></span></figcaption></figure>
      </div>
      <p class="muted">Deixa espai al voltant del logotip i no en canviïs els colors ni les proporcions.</p>
    </section>
    <section class="card pr-sec">
      <h2>Colors i tipografies</h2>
      <div class="pr-colors">${PR_COLORS.map(([t, hex, d]) => `<button type="button" class="pr-color" data-pr-copy="${hex}" style="--c:${hex}"><i></i><b>${t}</b><code>${hex}</code><span>${d}</span></button>`).join("")}</div>
      <div class="pr-fonts">
        <div><b class="pr-font-d">Unbounded</b><span>Títols, en majúscules i molt gruixuda. Llicència oberta (SIL OFL).</span></div>
        <div><b class="pr-font-s">DM Sans</b><span>Textos. Llicència oberta (SIL OFL).</span></div>
      </div>
    </section>
    <section class="card pr-sec">
      <h2>Captures de l'app</h2>
      <p class="muted">A l'ordinador (1.440 × 900) i al mòbil (1.170 × 2.532). Toca una imatge per veure-la gran.</p>
      <div class="pr-shots">${PR_SHOTS.map(([k, t]) => `<figure class="pr-shot">
        <a href="/img/premsa/${k}-escriptori.jpg" target="_blank" rel="noopener"><img src="/img/premsa/${k}-escriptori.jpg" alt="${t}, a l'ordinador" loading="lazy"></a>
        <figcaption><b>${t}</b><span><a href="/img/premsa/${k}-escriptori.jpg" download>Ordinador</a> · <a href="/img/premsa/${k}-mobil.jpg" download>Mòbil</a></span></figcaption>
      </figure>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>Condicions d'ús</h2>
      <ul class="pr-ul">
        <li>Pots fer servir el logotip, les captures, els textos i les dades per informar de Política en Joc o de les eleccions, citant-ne la font: «Política en Joc».</li>
        <li>No els modifiquis de manera que en canviï el sentit, ni els facis servir de manera que sembli que Política en Joc té cap vincle amb un partit, una candidatura o una institució.</li>
        <li>Per a usos comercials o publicitaris, escriu-nos abans.</li>
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
    ${prHead("dades", "Sala de premsa", "Dades del 29N", "Les dades que fa servir l'app, en taules i per descarregar. Es generen al moment, de manera que sempre són les de la versió actual.")}
    <div class="pr-figs">
      <div class="pr-fig"><b>350</b><span>diputats al Congrés</span></div>
      <div class="pr-fig"><b>176</b><span>majoria absoluta</span></div>
      <div class="pr-fig"><b>${rows.length}</b><span>circumscripcions</span></div>
      <div class="pr-fig"><b>3 %</b><span>llindar per circumscripció, amb el vot en blanc</span></div>
      <div class="pr-fig"><b>${watch.filter((r) => r.an.lvl).length}</b><span>escons a vigilar segons el 2023</span></div>
    </div>

    <section class="card pr-sec">
      <h2>Escons a vigilar</h2>
      <p>Els últims escons que el 23-J del 2023 es van decidir per menys vots: on un canvi petit pot moure un diputat. «Li falten» són els vots que hauria necessitat el segon per prendre'l.</p>
      <div class="table-wrap"><table class="pr-table">
        <thead><tr><th>Circumscripció</th><th>Escons</th><th>Últim escó</th><th>L'hauria pres</th><th>Li falten</th><th>% dels vàlids</th></tr></thead>
        <tbody>${watch.map((r) => `<tr><td><b>${esc(r.p.name)}</b></td><td>${r.s23}</td><td>${esc(prSig(r.an.victim))}</td><td>${esc(prSig(r.an.challenger))}</td><td>${fmt(r.an.need)}</td><td>${pctFmt(r.an.margin)} %</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="vigilar">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Escons per circumscripció</h2>
      <p>Diputats que elegeix cada circumscripció el 29N (Reial decret 806/2026) i el 2023.${changed.length ? ` Canvien ${changed.map((r) => `${esc(r.p.name)} (${r.s26 > r.s23 ? "+" : "−"}${Math.abs(r.s26 - r.s23)})`).join(" i ")}.` : ""}</p>
      <div class="table-wrap pr-scroll"><table class="pr-table">
        <thead><tr><th>Circumscripció</th><th>Comunitat</th><th>Escons 29N</th><th>Escons 2023</th><th>Primera força 2023</th></tr></thead>
        <tbody>${rows.slice().sort((a, b) => b.s26 - a.s26 || a.p.name.localeCompare(b.p.name, "ca")).map((r) => `<tr><td><b>${esc(r.p.name)}</b></td><td>${esc(r.p.ccaa)}</td><td>${r.s26}${r.s26 !== r.s23 ? ` <small class="${r.s26 > r.s23 ? "up" : "down"}">${r.s26 > r.s23 ? "+" : "−"}${Math.abs(r.s26 - r.s23)}</small>` : ""}</td><td>${r.s23}</td><td>${esc(prSig(r.top))}</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="escons">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Resultats del 23-J del 2023</h2>
      <p>Vots i escons de cada candidatura a cada circumscripció, i el vot en blanc. Font: Ministeri de l'Interior. Sumar s'agrupa amb el nom actual (Frente Amplio); «altres» aplega les candidatures de menys del 0,4 %.</p>
      <div class="pr-seats23">${Object.entries(tot23).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span><b>${n}</b>${esc(prSig(k))}</span>`).join("")}</div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="r2023">⬇ CSV</button><button class="btn ghost" type="button" data-dl="r2023json">⬇ JSON</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Enquestes</h2>
      ${blocked ? `<p><b>Durant els cinc dies anteriors a la votació la llei no permet publicar ni difondre enquestes</b> (article 69.7 de la LOREG). Tornaran a ser aquí quan tanquin els col·legis, el 29 de novembre a les 20.00 h.</p>`
        : `<p>Mitjana aritmètica de ${typeof POLL_SEATS !== "undefined" ? POLL_SEATS.length : ""} enquestes d'escons, ajustada a 350, i de la intenció de vot de les ${typeof POLL_PCT !== "undefined" ? POLL_PCT.length : ""} més recents. Recull de la Viquipèdia (${typeof POLL_UPDATED !== "undefined" ? POLL_UPDATED : ""}). Les enquestes no són un pronòstic.</p>
      <div class="table-wrap"><table class="pr-table"><thead><tr><th>Partit</th><th>Escons (mitjana)</th><th>Vot (mitjana)</th><th>Interval</th></tr></thead>
        <tbody>${PACTE_ORDER.filter((id) => avg[id] > 0 && id !== "altres").sort((a, b) => avg[b] - avg[a]).map((id) => { const p = pct.find((x) => x.id === id); return `<tr><td><b>${esc(PACTE_INFO[id].sig)}</b></td><td>${avg[id]}</td><td>${p ? `${p.avg.toFixed(1).replace(".", ",")} %` : "—"}</td><td>${p ? `${p.min.toFixed(1).replace(".", ",")}–${p.max.toFixed(1).replace(".", ",")} %` : "—"}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="pr-dl"><button class="btn" type="button" data-dl="enquestes">⬇ CSV</button> <a class="btn ghost" href="${typeof POLL_SOURCE !== "undefined" ? POLL_SOURCE : "#"}" target="_blank" rel="noopener">Font ↗</a></div>`}
    </section>

    <section class="card pr-sec">
      <h2>Calendari electoral</h2>
      <ol class="pr-cal">${cal.map((e) => `<li class="${e.key ? "key" : ""}"><b>${esc(e.label)}</b><span>${esc(e.text)}</span></li>`).join("")}</ol>
      <div class="pr-dl"><button class="btn" type="button" data-dl="ics">📅 Afegeix-lo al teu calendari (.ics)</button><button class="btn ghost" type="button" data-dl="calcsv">⬇ CSV</button></div>
    </section>

    <section class="card pr-sec">
      <h2>Fonts i metodologia</h2>
      <ul class="pr-ul">
        <li><b>Resultats del 2023:</b> Ministeri de l'Interior, a través de les pàgines de cada circumscripció. Comprovat: la Llei d'Hondt amb aquests vots reprodueix els 350 escons.</li>
        <li><b>Escons del 29N:</b> Reial decret 806/2026, de convocatòria (BOE del 6 d'octubre).</li>
        <li><b>Escons a vigilar:</b> càlcul propi amb la Llei d'Hondt i el llindar del 3 %, amb enters i el criteri d'empat de l'article 163.1 de la LOREG.</li>
        <li><b>Enquestes:</b> recull de la Viquipèdia. Quan una empresa dona una forquilla, es pren el valor central. No es publiquen del 24 al 29 de novembre (art. 69.7 de la LOREG).</li>
        <li><b>Calendari:</b> el decret de convocatòria i la LOREG.</li>
      </ul>
      <p class="muted">Si cites aquestes dades, indica «Font: Política en Joc, a partir de dades del Ministeri de l'Interior». Si hi trobes un error, escriu-nos.</p>
    </section>
    ${prContact()}
  </div>`;
  const ics = () => {
    const d8 = (iso) => iso.replace(/-/g, "");
    const next = (iso) => { const t = new Date(`${iso}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10).replace(/-/g, ""); };
    const fold = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Politica en Joc//Calendari 29N//CA", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Eleccions generals del 29N",
      ...cal.flatMap((e, i) => ["BEGIN:VEVENT", `UID:29n-${i}-${e.date}@politicaenjoc.cat`, `DTSTAMP:${d8(new Date().toISOString().slice(0, 10))}T000000Z`, `DTSTART;VALUE=DATE:${d8(e.date)}`, `DTEND;VALUE=DATE:${next(e.date)}`, `SUMMARY:${fold(e.text)}`, `DESCRIPTION:${fold(`${e.label}. Calendari electoral del 29N · politicaenjoc.cat`)}`, "END:VEVENT"]),
      "END:VCALENDAR"].join("\r\n");
  };
  const DL = {
    vigilar: () => prDownload("escons-a-vigilar-2023.csv", prCsv([["circumscripcio", "escons", "ultim_esco", "l_hauria_pres", "vots_que_falten", "percentatge_valids"], ...watch.map((r) => [r.p.name, r.s23, prSig(r.an.victim), prSig(r.an.challenger), r.an.need, pctFmt(r.an.margin, 3)])])),
    escons: () => prDownload("escons-per-circumscripcio-29n.csv", prCsv([["circumscripcio", "comunitat", "escons_29n", "escons_2023", "primera_forca_2023"], ...rows.map((r) => [r.p.name, r.p.ccaa, r.s26, r.s23, prSig(r.top)])])),
    r2023: () => prDownload("resultats-congres-2023.csv", prCsv([["circumscripcio", "candidatura", "vots", "escons"], ...rows.flatMap((r) => [...Object.entries(r.d.v).sort((a, b) => b[1] - a[1]).map(([k, v]) => [r.p.name, k === "altres" ? "Altres" : prSig(k), v, r.d.s[k] || 0]), [r.p.name, "En blanc", r.d.b, 0]])])),
    r2023json: () => prDownload("resultats-congres-2023.json", JSON.stringify(Object.fromEntries(rows.map((r) => [r.p.name, { codi: r.p.code, escons: r.s23, en_blanc: r.d.b, vots: Object.fromEntries(Object.entries(r.d.v).map(([k, v]) => [k === "altres" ? "Altres" : prSig(k), v])), escons_per_candidatura: Object.fromEntries(Object.entries(r.d.s).map(([k, v]) => [prSig(k), v])) }])), null, 1), "application/json"),
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
    : [["/eleccions-29n/", "Eleccions del 29N: tot el que cal saber"], ["/escons-per-provincia/", "Escons per província"], ["/diccionari/", "Diccionari de política"], ["/preguntes-frequents/", "Preguntes freqüents"]];
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("guies", "Sala de premsa", "Guies i explicadors", "Explicacions curtes i rigoroses de com funcionen les eleccions, per enllaçar des d'un article o fer servir a classe. Totes tenen una pàgina pròpia, sense haver d'obrir l'app.")}
    <section class="card pr-sec">
      <h2>Pàgines de referència</h2>
      <div class="pr-links">${st.map(([u, t]) => `<a class="pr-linkc" href="${u}" target="_blank" rel="noopener"><b>${t}</b><span>politicaenjoc.cat${u}</span></a>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>La guia per votar, capítol a capítol</h2>
      <div class="pr-chs">${(typeof AP_CHAPTERS !== "undefined" ? AP_CHAPTERS : []).map((c) => `<article class="pr-ch">
        <small>Capítol ${c.n}, ${c.mins} min</small>
        <h3>${esc(c.title)}</h3>
        <p>${esc(prPlain(c.lead))}</p>
        <span class="pr-ch-l"><a href="${base}${c.slug}/" target="_blank" rel="noopener">Pàgina per enllaçar ↗</a><a href="#apren/${c.slug}">A l'app, pas a pas</a></span>
      </article>`).join("")}</div>
    </section>
    <section class="card pr-sec">
      <h2>Eines per explicar-ho</h2>
      <div class="pr-links">${(typeof AP_TOOLS !== "undefined" ? AP_TOOLS : []).map((t) => `<a class="pr-linkc" href="${t.href || `#apren/${t.slug}`}"><b>${esc(t.title)}</b><span>${esc(t.text)}</span></a>`).join("")}
        <a class="pr-linkc" href="#premsa/widgets"><b>Widgets per a la teva web</b><span>Pactòmetre, repartidor d'escons i compte enrere.</span></a></div>
    </section>
    ${prContact()}
  </div>`;
}

// ---------- Preguntes freqüents per a periodistes (#premsa/faq) ----------
const PR_FAQ = [
  ["Què és Política en Joc?", "Una web i app gratuïta, en català i en castellà, per entendre les eleccions generals del 29 de novembre de 2026 jugant: repte diari, minijocs, una guia per votar, un diccionari, simuladors, el pactòmetre i la nit electoral en directe."],
  ["Qui hi ha darrere?", "És un projecte independent creat per Bruno Domingo Sola. No té cap vincle amb partits, candidatures, institucions ni mitjans de comunicació, i no és una web oficial."],
  ["És neutral?", "Explica com funciona el sistema electoral amb dades públiques i no recomana el vot. Els partits reals es presenten amb dades i propostes verificables. El simulador electoral fa servir partits ficticis. Al pactòmetre, les majories que es proposen descarten les aliances que avui no són plausibles (per exemple, Vox amb independentistes); és un criteri editorial que s'explica a la mateixa eina."],
  ["D'on surten les dades?", "Els resultats del 2023 són del Ministeri de l'Interior; els escons del 29N, del decret de convocatòria; les enquestes, del recull de la Viquipèdia; i el calendari, del decret i de la LOREG. Les fonts surten a cada eina i a l'apartat Dades d'aquesta sala."],
  ["Com es tracten les enquestes?", "Se'n mostra la mitjana, ajustada a 350 escons, amb la font i la data. Del 24 al 29 de novembre, mentre la llei no permet publicar-ne (art. 69.7 de la LOREG), l'app i els widgets deixen de mostrar-les i passen als resultats del 2023."],
  ["Com es finança?", "És gratuïta per a tothom i no rep diners de partits ni d'institucions. L'única publicitat és opcional: un vídeo que algú pot decidir mirar per jugar una partida extra del repte diari."],
  ["Quines dades recull de qui la fa servir?", "Per jugar no cal compte. Si en crees un, es desa el progrés i el nom d'usuari. L'estadística d'ús és anònima i només amb consentiment. Els xats i les trucades entre amics no es llegeixen ni es graven. Tot s'explica a la política de privadesa."],
  ["Puc fer servir les captures, el logotip i les dades?", "Sí, per informar de Política en Joc o de les eleccions, citant «Política en Joc». Són al kit de premsa i a l'apartat Dades. Per a usos comercials, escriu-nos abans."],
  ["Puc posar el pactòmetre o el repartidor d'escons al meu mitjà?", "Sí: a l'apartat Widgets hi ha el codi per copiar. Són gratuïts, s'adapten a la pàgina i no fan servir galetes."],
  ["Es pot fer servir a classe?", "Sí. La guia per votar té capítols curts amb preguntes per repassar i un examen final, i el simulador i el debat es poden jugar en grup. Si ets docent i vols fer-ho amb un grup, escriu-nos."],
  ["Puc entrevistar-ne el creador?", "Sí: escriu a l'adreça de contacte d'aquesta pàgina i et respondrem al més aviat possible."],
];
function prFaq(root) {
  root.innerHTML = `<div class="pr pr-hub">
    ${prHead("faq", "Sala de premsa", "Preguntes freqüents", "Les respostes a les preguntes que ens fan més sovint periodistes i docents.")}
    <div class="pr-faq">${PR_FAQ.map(([q, a]) => `<details class="card pr-q"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
    ${prContact()}
  </div>`;
}

// ---------- Widgets per a altres webs (#premsa/widgets): vista prèvia i codi per copiar (widget/) ----------
const PR_WIDGETS = [
  { w: "pactometre", t: "Pactòmetre", d: "Qui pot sumar 176 escons? Els lectors toquen els partits i veuen si hi ha investidura, amb la mitjana de les enquestes. Durant els cinc dies en què la llei no permet publicar enquestes, passa sol als escons del 2023." },
  { w: "escons", t: "Repartidor d'escons", d: "Com es reparteixen els escons d'una circumscripció amb la Llei d'Hondt. Parteix dels vots del 2023, i en moure els percentatges diu de qui és l'últim escó i quants vots falten per prendre'l.", prov: true },
  { w: "compte", t: "Compte enrere del 29N", d: "Els dies que falten per votar, amb el repte del dia. El dia de les eleccions passa a la jornada i a l'escrutini en directe." },
];
function renderWidgets(root) {
  const origin = /^https?:\/\/(localhost|127\.)/.test(location.origin) ? location.origin : "https://politicaenjoc.cat";
  const provs = typeof SIM_PROVS !== "undefined" ? SIM_PROVS.filter((p) => p.seats).sort((a, b) => a.name.localeCompare(b.name, "ca")) : [];
  const code = (w, prov) => `<div class="pej-widget" data-w="${w}"${prov ? ` data-prov="${prov}"` : ""}></div>\n<script async src="${origin}/widget/embed.js"></script>`;
  root.innerHTML = `<div class="pr pr-wg">
    <h1 class="page-title">Widgets per a la teva web</h1>
    <p class="lede">Posa el pactòmetre, el repartidor d'escons o el compte enrere del 29N dins d'un article. Copia el codi i enganxa'l on vulguis que surti: s'adapta a l'amplada i a l'alçada de la pàgina.</p>
    ${prNav("widgets")}
    <div class="card pr-wg-terms">
      <p><b>Gratuïts</b> per a mitjans, blogs, entitats i centres educatius. Les úniques condicions són que la marca de Política en Joc es vegi i que no se'n modifiqui el contingut.</p>
      <p>Els widgets no desen res al dispositiu dels lectors, no fan servir galetes i no carreguen cap servei de tercers: no cal afegir-los a l'avís de galetes de la teva web.</p>
      <p>Si vols una versió amb els teus colors o el teu logotip, o un widget de resultats per a la nit electoral, escriu-nos a <a href="mailto:brudomingosola@gmail.com?subject=Widgets%20de%20Pol%C3%ADtica%20en%20Joc">brudomingosola@gmail.com</a>.</p>
    </div>
    ${PR_WIDGETS.map((x) => `<section class="card pr-wg-item" data-wg="${x.w}">
      <h2>${x.t}</h2>
      <p>${x.d}</p>
      ${x.prov && provs.length ? `<label class="pr-wg-prov">Circumscripció <select data-wg-prov>${provs.map((p) => `<option value="${p.code}" ${p.code === "B" ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>` : ""}
      <div class="pr-wg-prev"><iframe src="/widget/?w=${x.w}${x.prov ? "&prov=B" : ""}&id=prev-${x.w}" title="${x.t}" loading="lazy" style="height:${x.w === "compte" ? 300 : 620}px"></iframe></div>
      <div class="pr-wg-code"><pre><code data-wg-code>${esc(code(x.w, x.prov ? "B" : ""))}</code></pre><button class="btn" type="button" data-wg-copy>Copia el codi</button></div>
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
      try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copiat ✓"; window.Stats?.step?.("premsa", "copia"); }
      catch { getSelection().selectAllChildren(pre); b.textContent = "Selecciona'l i copia'l"; }
      setTimeout(() => { b.textContent = "Copia el codi"; }, 2500);
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
    root.innerHTML = box(`<h1 class="page-title">Baixa de la llista de premsa</h1><p>${tok === "prova" ? "Aquest és l'enllaç d'un correu de prova: no fa res." : "L'enllaç no és complet. Copia'l sencer del correu, o escriu-nos i et donarem de baixa."}</p>`);
    return;
  }
  // Cal un clic: alguns filtres de correu obren els enllaços sols i no han de donar de baixa ningú
  root.innerHTML = box(`<h1 class="page-title">Vols deixar de rebre les notes de premsa?</h1>
    <p>No et tornarem a enviar notes de premsa de Política en Joc a aquesta adreça.</p>
    <div class="row" style="justify-content:center"><button class="btn primary lg" type="button" data-unsub>Sí, dona'm de baixa</button></div>`);
  $("[data-unsub]", root).addEventListener("click", async (e) => {
    e.target.disabled = true;
    const ok = await window.Online?.pressUnsub?.(tok);
    root.innerHTML = box(ok
      ? `<h1 class="page-title">Fet</h1><p>T'hem donat de baixa de la llista de premsa. Sentim les molèsties.</p><a class="btn" href="#inici">Ves a Política en Joc</a>`
      : `<h1 class="page-title">No s'ha pogut fer</h1><p>Torna-ho a provar d'aquí a un moment. Si continua sense funcionar, respon el correu i et donarem de baixa a mà.</p><button class="btn" type="button" data-unsub-retry>Torna-ho a provar</button>`);
    $("[data-unsub-retry]", root)?.addEventListener("click", () => renderBaixa(tok));
  });
}
