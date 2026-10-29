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
  if (id === "widgets") { renderWidgets(root); return; }
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
    <a class="card pr-wg-link" href="#premsa/widgets"><b>🧩 Widgets per a la teva web</b><span>Pactòmetre, repartidor d'escons i compte enrere del 29N, per incrustar en un article. Gratuïts.</span></a>
    ${list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Encara no hi ha cap nota de premsa.</p></div>`}
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
  document.title = "Widgets per a la teva web · Política en Joc";
  root.innerHTML = `<div class="pr pr-wg">
    <p class="kicker">Sala de premsa</p><h1 class="page-title">Widgets per a la teva web</h1>
    <p class="lede">Posa el pactòmetre, el repartidor d'escons o el compte enrere del 29N dins d'un article. Copia el codi i enganxa'l on vulguis que surti: s'adapta a l'amplada i a l'alçada de la pàgina.</p>
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
  </div>`;
  $$("[data-wg]", root).forEach((sec) => {
    const w = sec.dataset.wg, pre = $("[data-wg-code]", sec), sel = $("[data-wg-prov]", sec), frame = $("iframe", sec);
    sel?.addEventListener("change", () => {
      pre.textContent = code(w, sel.value);
      frame.src = `/widget/?w=${w}&prov=${sel.value}&id=prev-${w}`;
    });
    $("[data-wg-copy]", sec).addEventListener("click", async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copiat ✓"; }
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
