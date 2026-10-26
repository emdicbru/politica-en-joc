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

async function renderPremsa(id) {
  const root = $("#premsa-page");
  if (!root) return;
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
  const list = await premsaFetch("index.json");
  if (!location.hash.startsWith("#premsa")) return;
  root.innerHTML = `<div class="pr">
    <p class="kicker">Política en Joc</p><h1 class="page-title">Sala de premsa</h1>
    ${list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Encara no hi ha cap nota de premsa.</p></div>`}
  </div>`;
}

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
