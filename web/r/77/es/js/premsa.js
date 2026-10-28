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

async function renderPremsa(id) {
  const root = $("#premsa-page");
  if (!root) return;
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
  const list = await premsaFetch("index.json");
  if (!location.hash.startsWith("#premsa")) return;
  root.innerHTML = `<div class="pr">
    <p class="kicker">Política en Joc</p><h1 class="page-title">Sala de prensa</h1>
    ${list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Todavía no hay ninguna nota de prensa.</p></div>`}
  </div>`;
}

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
