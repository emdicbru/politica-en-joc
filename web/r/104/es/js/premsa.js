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
  if (id === "widgets") { renderWidgets(root); return; }
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
    <a class="card pr-wg-link" href="#premsa/widgets"><b>🧩 Widgets para tu web</b><span>Pactómetro, repartidor de escaños y cuenta atrás del 29N, para insertar en un artículo. Gratuitos.</span></a>
    ${list?.length ? `<div class="pr-list">${list.map((n) => `<a class="card pr-item" href="#premsa/${esc(n.id)}">
      ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
      <div${n.photo ? "" : ` style="grid-column:1/-1"`}><small>${esc(premsaDate(n.date))}</small><h2>${esc(n.title)}</h2>${n.lead ? `<p>${esc(n.lead)}</p>` : ""}</div>
    </a>`).join("")}</div>` : `<div class="card"><p class="muted">Todavía no hay ninguna nota de prensa.</p></div>`}
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
  document.title = "Widgets para tu web · Política en Joc";
  root.innerHTML = `<div class="pr pr-wg">
    <p class="kicker">Sala de prensa</p><h1 class="page-title">Widgets para tu web</h1>
    <p class="lede">Pon el pactómetro, el repartidor de escaños o la cuenta atrás del 29N dentro de un artículo. Copia el código y pégalo donde quieras que salga: se adapta al ancho y al alto de la página. Por ahora, los widgets están en catalán.</p>
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
  </div>`;
  $$("[data-wg]", root).forEach((sec) => {
    const w = sec.dataset.wg, pre = $("[data-wg-code]", sec), sel = $("[data-wg-prov]", sec), frame = $("iframe", sec);
    sel?.addEventListener("change", () => {
      pre.textContent = code(w, sel.value);
      frame.src = `/widget/?w=${w}&prov=${sel.value}&id=prev-${w}`;
    });
    $("[data-wg-copy]", sec).addEventListener("click", async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copiado ✓"; }
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
