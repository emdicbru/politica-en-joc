// Centre de control › Premsa (administradors): la llista de mitjans i periodistes, la redacció de les notes de premsa
// amb foto i previsualització del correu, i l'enviament. Els correus els envia GitHub Actions (tools/premsa.js) amb el
// servei Brevo: aquí només es deixa la nota a la cua. La plantilla del correu és a premsa-mail.js.

const PRESS_CFG_DEFAULT = {
  fromName: "Política en Joc", from: "hola@politicaenjoc.cat", replyTo: "brudomingosola@gmail.com", testTo: "brudomingosola@gmail.com",
  place: "Barcelona", attach: true,
  contact: "Bruno Domingo\nbrudomingosola@gmail.com\nhttps://politicaenjoc.cat",
  about: "Política en Joc és una aplicació web gratuïta per entendre la política i les eleccions jugant: un repte diari, simuladors de campanya i de debat, notícies explicades i l'especial de les eleccions generals del 29N.",
};
const PRESS_ST = { esborrany: ["Esborrany", ""], prova: ["Prova a la cua", "warn"], envia: ["A la cua", "warn"], enviant: ["Enviant", "warn"], enviat: ["Enviada", "ok"], error: ["Error", "ko"] };
const ctlPress = { view: "notes", contacts: null, notes: null, cfg: null, edit: null, loading: false, q: "", tag: "", sends: {} };

async function ctlPressLoad() {
  if (ctlPress.loading) return;
  ctlPress.loading = true;
  const O = window.Online;
  const [contacts, notes, cfg] = await Promise.all([O.pressList("press_contacts"), O.pressList("press_notes"), O.pressGet("press_cfg", "main")]);
  ctlPress.contacts = contacts || [];
  ctlPress.notes = (notes || []).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  ctlPress.cfg = { ...PRESS_CFG_DEFAULT, ...(cfg || {}) };
  ctlPress.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "premsa") renderControl(true);
}
const pressTags = () => [...new Set((ctlPress.contacts || []).flatMap((c) => c.tags || []))].sort((a, b) => a.localeCompare(b, "ca"));
const pressMatch = (c, tags) => !c.unsub && (!tags?.length || (c.tags || []).some((t) => tags.includes(t)));
const pressTok = () => { const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", b = crypto.getRandomValues(new Uint8Array(24)); return [...b].map((x) => A[x % A.length]).join(""); };
const pressSplitTags = (s) => [...new Set(String(s || "").toLowerCase().split(/[,|/]+|\s{2,}/).map((t) => t.trim().replace(/\s+/g, "-")).filter(Boolean))].slice(0, 12);

function ctlPressHtml() {
  if (!ctlPress.cfg) { ctlPressLoad(); return `<div class="card"><p class="muted">Carregant…</p></div>`; }
  const P = ctlPress;
  const active = P.contacts.filter((c) => !c.unsub).length;
  const run = P.cfg.run;
  const gh = localStorage.getItem(CTL_GH_KEY);
  const sub = [["notes", `📝 Notes (${P.notes.length})`], ["contactes", `📇 Contactes (${active})`], ["config", "⚙️ Configuració"]];
  return `
    <p class="ctl-intro">Notes de premsa amb foto, enviades des de <b>${esc(P.cfg.from)}</b> a la teva llista de mitjans. Cada periodista rep el seu correu (no veu els altres) amb un enllaç per donar-se de baixa.</p>
    <section class="ctl-status">
      <div class="ctl-st"><small>Contactes actius</small><b>${active}</b><span class="ctl-tag">${P.contacts.length - active ? `${P.contacts.length - active} de baixa` : "cap baixa"}</span></div>
      <div class="ctl-st"><small>Servei d'enviament</small><b class="${run && !run.ok ? "bad" : ""}">${run ? (run.ok ? "A punt" : "Sense configurar") : "Encara no comprovat"}</b><span class="ctl-tag ${run && !run.ok ? "warn" : ""}">${run ? `fa ${ctlRel(run.t).replace(/^fa /, "")}` : "en 5–15 min"}</span></div>
      <div class="ctl-st"><small>Enviament</small><b>${gh ? "Immediat" : "En 5–15 min"}</b><span class="ctl-tag">${gh ? "amb token" : "cua automàtica"}</span></div>
    </section>
    ${run && !run.ok ? `<p class="ctl-alert">⚠️ ${esc(run.msg)}. Els passos són a CONFIGURACIO.md (apartat «Premsa»).</p>` : ""}
    <div class="ctl-seg ctu-range">${sub.map(([k, t]) => `<button type="button" class="${P.view === k ? "on" : ""}" data-pv-view="${k}"><b>${t}</b></button>`).join("")}</div>
    ${P.view === "contactes" ? ctlPressContactsHtml() : P.view === "config" ? ctlPressCfgHtml() : P.edit ? ctlPressEditHtml() : ctlPressNotesHtml()}`;
}

// ---------- Notes ----------
function ctlPressNotesHtml() {
  const P = ctlPress;
  return `
    <section class="card">
      <div class="row"><button class="btn primary" type="button" data-pn-new>➕ Nova nota de premsa</button><button class="linklike" type="button" data-pr-reload>↻ Actualitza</button></div>
    </section>
    ${P.notes.length ? `<div class="ctl-rpts">${P.notes.map((n) => {
      const [lbl, cls] = PRESS_ST[n.status] || [n.status, ""];
      const prog = n.status === "enviant" || n.status === "enviat" ? ` · ${n.sent || 0}/${n.total ?? "?"} enviats${n.failed ? `, ${n.failed} errors` : ""}` : "";
      const sends = P.sends[n.id];
      return `<article class="card ctl-rpt">
        <header><span class="ctl-tag ${cls}">${lbl}</span><small>${n.updated ? ctlDate(n.updated) : ""}${prog}${n.tags?.length ? ` · per a: ${esc(n.tags.join(", "))}` : " · a tots els contactes"}</small></header>
        <p class="ctl-rpt-t"><b>${esc(n.title || "(sense títol)")}</b></p>
        ${n.lead ? `<p class="muted">${esc(n.lead)}</p>` : ""}
        ${n.paused ? `<p class="ctl-alert">⏸ ${esc(n.paused)}</p>` : ""}
        ${n.error ? `<p class="ctl-alert">⚠️ ${esc(n.error)}</p>` : ""}
        ${n.testError ? `<p class="ctl-alert">⚠️ La prova no s'ha pogut enviar: ${esc(n.testError)}</p>` : n.testAt && n.status === "esborrany" ? `<p class="ctl-ok">● Prova enviada a ${esc(n.testTo || "")} ${ctlRel(n.testAt)}</p>` : ""}
        ${n.webUrl && n.status === "enviat" ? `<p class="muted">A la Sala de premsa: <a href="${esc(n.webUrl)}" target="_blank" rel="noopener">${esc(n.webUrl)}</a></p>` : ""}
        ${sends ? `<details open><summary>Enviaments (${sends.length})</summary><ul class="ctl-sends">${sends.map((s) => `<li class="${s.ok ? "" : "ko"}">${s.ok ? "✔" : "✖"} ${esc(s.email)}${s.err ? ` <small>${esc(s.err)}</small>` : ""}</li>`).join("")}</ul></details>` : ""}
        <div class="row">
          ${["esborrany", "error"].includes(n.status) ? `<button class="btn" type="button" data-pn-edit="${n.id}">Edita</button>` : ""}
          <button class="btn ghost" type="button" data-pn-dup="${n.id}">Duplica</button>
          ${["enviant", "enviat", "error"].includes(n.status) ? `<button class="btn ghost" type="button" data-pn-sends="${n.id}">Qui l'ha rebuda</button>` : ""}
          ${n.status === "error" && n.sent ? `<button class="btn ghost" type="button" data-pn-resume="${n.id}">Reprèn l'enviament</button>` : ""}
          ${["esborrany", "error", "enviat"].includes(n.status) ? `<button class="btn ghost danger" type="button" data-pn-del="${n.id}">Esborra</button>` : ""}
        </div>
      </article>`;
    }).join("")}</div>` : `<div class="card"><p class="muted">Encara no hi ha cap nota. Crea la primera!</p></div>`}`;
}

function ctlPressEditHtml() {
  const P = ctlPress, E = P.edit, tags = pressTags();
  const n = P.contacts.filter((c) => pressMatch(c, E.tags)).length;
  return `
    <section class="card ctl-press">
      <div class="row"><button class="linklike" type="button" data-pn-back>← Totes les notes</button></div>
      <h2 class="section-title sm">${E.id ? "Edita la nota" : "Nova nota de premsa"}</h2>
      <label>Assumpte del correu <input data-pe="subject" maxlength="120" value="${esc(E.subject)}" placeholder="Si el deixes buit, s'hi posa el títol"></label>
      <label>Títol <input data-pe="title" maxlength="140" value="${esc(E.title)}" placeholder="P. ex.: Neix Política en Joc, l'app per entendre les eleccions jugant"></label>
      <label>Entradeta <textarea data-pe="lead" maxlength="400" rows="2" placeholder="Una o dues frases amb el més important">${esc(E.lead)}</textarea></label>
      <label>Cos de la nota <textarea data-pe="body" rows="12" placeholder="Deixa una línia en blanc entre paràgrafs. **Així** surt en negreta. Els enllaços (https://…) es fan sols.">${esc(E.body)}</textarea></label>
      <div class="ctl-push-row">
        <label>Lloc <input data-pe="place" maxlength="40" value="${esc(E.place)}"></label>
        <label class="ctl-check"><input type="checkbox" data-pe-greet ${E.greet ? "checked" : ""}> Salutació amb el nom («Hola, Marta:»)</label>
      </div>
      <div class="ctl-press-photo">
        ${E.photo ? `<img src="${E.photo}" alt="Foto de la nota">` : `<span class="muted">Sense foto</span>`}
        <div>
          <label class="btn">${E.photo ? "Canvia la foto" : "Afegeix una foto"}<input type="file" accept="image/*" data-pe-photo hidden></label>
          ${E.photo ? `<button class="btn ghost" type="button" data-pe-nophoto>Treu-la</button>` : ""}
          <label>Peu de foto <input data-pe="caption" maxlength="200" value="${esc(E.caption)}" placeholder="Què s'hi veu (i l'autoria, si cal)"></label>
          <p class="muted">Es redueix a 1.600 px. Al correu surt dins el text, s'hi adjunta i es pot descarregar.</p>
        </div>
      </div>
      <h3 class="section-title sm">Destinataris</h3>
      <div class="ctl-chips">
        <button type="button" class="${E.tags.length ? "" : "on"}" data-pe-tag="">Tots</button>
        ${tags.map((t) => `<button type="button" class="${E.tags.includes(t) ? "on" : ""}" data-pe-tag="${esc(t)}">${esc(t)}</button>`).join("")}
      </div>
      <p class="muted" data-pe-count>La rebran <b>${n}</b> contactes${E.tags.length ? ` amb l'etiqueta ${esc(E.tags.join(" o "))}` : ""}.</p>
      <div class="row">
        <button class="btn" type="button" data-pe-save>Desa l'esborrany</button>
        <button class="btn" type="button" data-pe-test>✉️ Envia'm una prova</button>
        <button class="btn primary" type="button" data-pe-send ${n ? "" : "disabled"}>📣 Envia-la a ${n} contactes</button>
      </div>
      <p class="muted">La prova arriba a ${esc(P.cfg.testTo || "—")} (es canvia a Configuració).</p>
    </section>
    <section class="card">
      <h2 class="section-title sm">Així arribarà</h2>
      <div class="ctl-mailprev" data-pe-prev>${ctlPressPrev()}</div>
    </section>`;
}
function ctlPressPrev() {
  const E = ctlPress.edit;
  return premsaMail(E, { name: "Marta Puig", cfg: ctlPress.cfg, photoUrl: E.photo || null, webUrl: "https://politicaenjoc.cat/#premsa", unsubUrl: "https://politicaenjoc.cat/#baixa" }).inner;
}
const ctlPressBlank = () => ({ id: null, subject: "", title: "", lead: "", body: "", caption: "", place: ctlPress.cfg.place || "", greet: true, tags: [], photo: null, photoChanged: false, photoV: 0 });

// Redueix la foto a 1.600 px (JPEG) perquè càpiga a la base de dades i el correu no pesi massa
function ctlPressShrink(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith("image/")) return reject(new Error("tipus"));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      for (const [max, q] of [[1600, 0.84], [1600, 0.72], [1280, 0.72], [1024, 0.7]]) {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        const d = cv.toDataURL("image/jpeg", q);
        if (d.length < 900000) return resolve(d);
      }
      reject(new Error("massa gran"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imatge")); };
    img.src = url;
  });
}

async function ctlPressSave(status) {
  const O = window.Online, P = ctlPress, E = P.edit;
  if (!E.title.trim()) { toast("Falta el títol"); return null; }
  const data = { subject: E.subject.trim(), title: E.title.trim(), lead: E.lead.trim(), body: E.body.trim(), caption: E.caption.trim(), place: E.place.trim(), greet: !!E.greet, tags: E.tags, hasPhoto: !!E.photo, photoV: E.photoV || 0, updated: Date.now(), by: O.user?.email || "" };
  if (status) data.status = status;
  if (!E.id) data.status = status || "esborrany";
  if (E.photoChanged && E.photo) data.photoV = Date.now();
  const id = await O.pressSet("press_notes", E.id, data);
  if (!id) return null;
  if (E.photoChanged) {
    if (E.photo && !(await O.pressSet("press_media", id, { data: E.photo }))) return null;
    if (!E.photo) await O.pressDel("press_media", id);
  }
  E.id = id; E.photoChanged = false; E.photoV = data.photoV;
  return id;
}

// ---------- Contactes ----------
function ctlPressContactsHtml() {
  const P = ctlPress, tags = pressTags();
  const q = P.q.trim().toLowerCase();
  const shown = P.contacts.filter((c) => (!P.tag || (c.tags || []).includes(P.tag)) && (!q || `${c.name} ${c.outlet} ${c.email}`.toLowerCase().includes(q)))
    .sort((a, b) => (a.outlet || "").localeCompare(b.outlet || "", "ca") || (a.name || "").localeCompare(b.name || "", "ca"));
  return `
    <section class="card">
      <h2 class="section-title sm">➕ Afegeix un contacte</h2>
      <div class="ctl-press-add">
        <label>Nom <input data-pc="name" maxlength="80" placeholder="Marta Puig"></label>
        <label>Mitjà <input data-pc="outlet" maxlength="80" placeholder="Diari X"></label>
        <label>Correu <input data-pc="email" type="email" maxlength="120" placeholder="marta@diarix.cat"></label>
        <label>Etiquetes <input data-pc="tags" maxlength="120" placeholder="política, ràdio"></label>
        <button class="btn primary" type="button" data-pc-add>Afegeix</button>
      </div>
    </section>
    <section class="card">
      <details><summary><b>📋 Importa molts contactes d'un full de càlcul</b></summary>
        <p class="muted">Copia les files de l'Excel o el Google Sheets i enganxa-les aquí. Columnes: <b>nom · mitjà · correu · etiquetes</b> (l'ordre del correu no importa: es troba sol). Si un correu ja hi és, s'actualitza.</p>
        <textarea data-pc-paste rows="6" placeholder="Marta Puig	Diari X	marta@diarix.cat	política, digital"></textarea>
        <div class="row"><button class="btn" type="button" data-pc-import>Importa</button><span class="muted" data-pc-importinfo></span></div>
      </details>
    </section>
    <section class="card">
      <div class="ctl-press-filter">
        <input type="search" data-pc-q placeholder="Cerca per nom, mitjà o correu" value="${esc(P.q)}">
        <select data-pc-tag><option value="">Totes les etiquetes</option>${tags.map((t) => `<option ${P.tag === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
        <button class="btn ghost" type="button" data-pc-export>Descarrega (CSV)</button>
      </div>
      ${shown.length ? `<ul class="ctl-press-list">${shown.map((c) => `<li class="${c.unsub ? "off" : ""}">
        <div><b>${esc(c.name || "—")}</b> <small>${esc(c.outlet || "")}</small><br><code>${esc(c.email)}</code>${c.unsub ? ` <span class="ctl-tag ko">de baixa${c.unsubAt ? ` des de ${ctlDate(c.unsubAt)}` : ""}</span>` : ""}</div>
        <input data-pc-tags="${esc(c.id)}" value="${esc((c.tags || []).join(", "))}" aria-label="Etiquetes de ${esc(c.email)}" placeholder="etiquetes">
        <button class="btn ghost danger" type="button" data-pc-del="${esc(c.id)}" title="Esborra el contacte">✕</button>
      </li>`).join("")}</ul>` : `<p class="muted">${P.contacts.length ? "Cap contacte coincideix amb la cerca." : "Encara no hi ha cap contacte."}</p>`}
      <p class="muted">Les dades dels contactes només les veuen els administradors. Qui es dona de baixa ja no rep res més (no es pot tornar a activar des d'aquí: cal que ho demani).</p>
    </section>`;
}
// Files enganxades d'un full de càlcul (tabuladors), CSV (; o ,): el camp amb @ és el correu
function ctlPressParse(txt) {
  const out = [], bad = [];
  for (const line of String(txt).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const sep = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const f = line.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    const ei = f.findIndex((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
    if (ei < 0) { if (!/correu|e-?mail/i.test(line)) bad.push(line); continue; }
    const rest = f.filter((_, i) => i !== ei);
    out.push({ email: f[ei].toLowerCase(), name: rest[0] || "", outlet: rest[1] || "", tags: pressSplitTags(rest.slice(2).join(",")) });
  }
  return { out, bad };
}

// ---------- Configuració ----------
function ctlPressCfgHtml() {
  const C = ctlPress.cfg;
  return `
    <section class="card ctl-press">
      <h2 class="section-title sm">✉️ Remitent</h2>
      <div class="ctl-push-row">
        <label>Nom <input data-pk="fromName" maxlength="60" value="${esc(C.fromName)}"></label>
        <label>Adreça <input data-pk="from" type="email" maxlength="120" value="${esc(C.from)}"></label>
      </div>
      <label>Les respostes van a <input data-pk="replyTo" type="email" maxlength="120" value="${esc(C.replyTo)}"></label>
      <p class="muted">Mentre ${esc(C.from)} no tingui bústia, les respostes dels periodistes han d'anar a una adreça que llegeixis.</p>
      <label>Adreça per a les proves <input data-pk="testTo" type="email" maxlength="120" value="${esc(C.testTo)}"></label>
      <label class="ctl-check"><input type="checkbox" data-pk-attach ${C.attach !== false ? "checked" : ""}> Adjunta la foto al correu (a més de mostrar-la)</label>
    </section>
    <section class="card ctl-press">
      <h2 class="section-title sm">🧾 Textos fixos de cada nota</h2>
      <label>Lloc per defecte <input data-pk="place" maxlength="40" value="${esc(C.place)}"></label>
      <label>Contacte de premsa <textarea data-pk="contact" rows="3">${esc(C.contact)}</textarea></label>
      <label>Sobre Política en Joc <textarea data-pk="about" rows="4">${esc(C.about)}</textarea></label>
      <div class="row"><button class="btn primary" type="button" data-pk-save>Desa la configuració</button></div>
    </section>`;
}

function ctlPressBind(root) {
  const O = window.Online, P = ctlPress;
  if (!P.cfg) return;
  const redraw = () => renderControl(true);
  $$("[data-pv-view]", root).forEach((b) => b.addEventListener("click", () => { P.view = b.dataset.pvView; redraw(); }));
  $("[data-pr-reload]", root)?.addEventListener("click", () => { P.cfg = null; P.sends = {}; redraw(); });

  // Notes
  $("[data-pn-new]", root)?.addEventListener("click", () => { P.edit = ctlPressBlank(); redraw(); });
  $("[data-pn-back]", root)?.addEventListener("click", () => { P.edit = null; P.cfg = null; redraw(); });
  const open = async (id, dup) => {
    const n = P.notes.find((x) => x.id === id);
    if (!n) return;
    const media = n.hasPhoto ? await O.pressGet("press_media", id) : null;
    P.edit = { ...ctlPressBlank(), id: dup ? null : id, subject: n.subject || "", title: dup ? `${n.title} (còpia)` : n.title || "", lead: n.lead || "", body: n.body || "", caption: n.caption || "", place: n.place || "", greet: !!n.greet, tags: n.tags || [], photo: media?.data || null, photoChanged: dup && !!media, photoV: dup ? 0 : n.photoV || 0 };
    redraw();
  };
  $$("[data-pn-edit]", root).forEach((b) => b.addEventListener("click", () => open(b.dataset.pnEdit, false)));
  $$("[data-pn-dup]", root).forEach((b) => b.addEventListener("click", () => open(b.dataset.pnDup, true)));
  $$("[data-pn-del]", root).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Esborrar aquesta nota? (Si ja s'ha enviat, els periodistes la conserven al seu correu.)")) return;
    const id = b.dataset.pnDel;
    if (await O.pressDel("press_notes", id)) { await O.pressDel("press_media", id); P.notes = P.notes.filter((x) => x.id !== id); redraw(); }
  }));
  $$("[data-pn-sends]", root).forEach((b) => b.addEventListener("click", async () => { P.sends[b.dataset.pnSends] = (await O.pressSends(b.dataset.pnSends)) || []; redraw(); }));
  $$("[data-pn-resume]", root).forEach((b) => b.addEventListener("click", async () => {
    if (await O.pressSet("press_notes", b.dataset.pnResume, { status: "envia", error: "" })) { await ctlDispatch("premsa.yml"); toast("Es reprèn l'enviament"); P.cfg = null; redraw(); }
  }));

  // Editor: cada canvi es guarda a l'estat (així l'actualització automàtica de la pàgina no el perd) i a la previsualització
  const E = P.edit;
  if (E) {
    const prev = () => { const el = $("[data-pe-prev]", root); if (el) el.innerHTML = ctlPressPrev(); };
    $$("[data-pe]", root).forEach((i) => i.addEventListener("input", () => { E[i.dataset.pe] = i.value; prev(); }));
    $("[data-pe-greet]", root)?.addEventListener("change", (e) => { E.greet = e.target.checked; prev(); });
    $("[data-pe-photo]", root)?.addEventListener("change", async (e) => {
      try { E.photo = await ctlPressShrink(e.target.files[0]); E.photoChanged = true; redraw(); }
      catch { toast("No s'ha pogut llegir la imatge"); }
    });
    $("[data-pe-nophoto]", root)?.addEventListener("click", () => { E.photo = null; E.photoChanged = true; redraw(); });
    $$("[data-pe-tag]", root).forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.peTag;
      E.tags = !t ? [] : E.tags.includes(t) ? E.tags.filter((x) => x !== t) : [...E.tags, t];
      redraw();
    }));
    $("[data-pe-save]", root)?.addEventListener("click", async () => { if (await ctlPressSave()) { toast("Esborrany desat"); P.cfg = null; P.edit = { ...E }; redraw(); } });
    $("[data-pe-test]", root)?.addEventListener("click", async () => {
      if (!(await ctlPressSave("prova"))) return;
      const now = await ctlDispatch("premsa.yml");
      toast(now ? `Enviant la prova a ${P.cfg.testTo}` : `Prova a la cua: arribarà a ${P.cfg.testTo} en 5–15 minuts`);
      P.edit = null; P.cfg = null; redraw();
    });
    $("[data-pe-send]", root)?.addEventListener("click", async () => {
      const n = P.contacts.filter((c) => pressMatch(c, E.tags)).length;
      if (!E.title.trim()) return toast("Falta el títol");
      if (!confirm(`S'enviarà «${E.title.trim()}» a ${n} contactes, un correu per persona, des de ${P.cfg.from}.\n\nUn cop enviada no es pot desfer. Has enviat i revisat la prova?`)) return;
      if (!(await ctlPressSave("envia"))) return;
      await O.pressSet("press_notes", E.id, { queuedAt: Date.now(), sent: 0, failed: 0, total: n });
      const now = await ctlDispatch("premsa.yml");
      toast(now ? "Enviant la nota ara mateix" : "A la cua: sortirà en 5–15 minuts");
      P.edit = null; P.cfg = null; redraw();
    });
  }

  // Contactes
  $("[data-pc-add]", root)?.addEventListener("click", async () => {
    const v = (k) => $(`[data-pc="${k}"]`, root).value.trim();
    const email = v("email").toLowerCase();
    if (!/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(email)) return toast("Escriu un correu vàlid");
    const old = P.contacts.find((c) => c.id === email);
    if (old?.unsub && !confirm(`${email} es va donar de baixa. Només l'hauries de tornar a afegir si t'ho ha demanat. Continuar?`)) return;
    const data = { email, name: v("name"), outlet: v("outlet"), tags: pressSplitTags(v("tags")), t: Date.now(), ...(old ? { unsub: false } : { tok: pressTok() }) };
    if (await O.pressSet("press_contacts", email, data)) { toast(old ? "Contacte actualitzat" : "Contacte afegit"); P.cfg = null; redraw(); }
  });
  $("[data-pc-import]", root)?.addEventListener("click", async () => {
    const { out, bad } = ctlPressParse($("[data-pc-paste]", root).value);
    if (!out.length) return toast("No hi he trobat cap correu");
    const known = new Map(P.contacts.map((c) => [c.id, c]));
    const fresh = out.filter((c) => !known.has(c.email)).length;
    if (!confirm(`${out.length} contactes: ${fresh} de nous i ${out.length - fresh} per actualitzar.${bad.length ? `\n${bad.length} files sense correu no s'importaran.` : ""}\n\nContinuar?`)) return;
    const list = out.map((c) => ({ id: c.email, email: c.email, name: c.name, outlet: c.outlet, tags: c.tags, t: Date.now(), ...(known.has(c.email) ? {} : { tok: pressTok() }) }));
    if (await O.pressImport(list)) { toast(`Importats ${out.length} contactes`); P.cfg = null; redraw(); }
  });
  $("[data-pc-q]", root)?.addEventListener("input", (e) => { P.q = e.target.value; clearTimeout(P.qt); P.qt = setTimeout(() => { redraw(); const i = $("[data-pc-q]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); });
  $("[data-pc-tag]", root)?.addEventListener("change", (e) => { P.tag = e.target.value; redraw(); });
  $$("[data-pc-tags]", root).forEach((i) => i.addEventListener("change", async () => {
    const tags = pressSplitTags(i.value);
    if (await O.pressSet("press_contacts", i.dataset.pcTags, { tags })) { const c = P.contacts.find((x) => x.id === i.dataset.pcTags); if (c) c.tags = tags; toast("Etiquetes desades"); }
  }));
  $$("[data-pc-del]", root).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm(`Esborrar ${b.dataset.pcDel} de la llista?`)) return;
    if (await O.pressDel("press_contacts", b.dataset.pcDel)) { P.contacts = P.contacts.filter((c) => c.id !== b.dataset.pcDel); redraw(); }
  }));
  $("[data-pc-export]", root)?.addEventListener("click", () => {
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = ["nom;mitjà;correu;etiquetes;estat", ...P.contacts.map((c) => [c.name, c.outlet, c.email, (c.tags || []).join(", "), c.unsub ? "baixa" : "actiu"].map(q).join(";"))].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = "premsa-contactes.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  // Configuració
  $("[data-pk-save]", root)?.addEventListener("click", async () => {
    const next = { ...P.cfg };
    $$("[data-pk]", root).forEach((i) => { next[i.dataset.pk] = i.value.trim(); });
    next.attach = $("[data-pk-attach]", root).checked;
    for (const k of ["from", "replyTo", "testTo"]) if (next[k] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next[k])) return toast("Hi ha una adreça de correu que no és vàlida");
    const { run, id, ...save } = next;
    if (await O.pressSet("press_cfg", "main", save)) { P.cfg = next; toast("Configuració desada"); redraw(); }
  });
}
