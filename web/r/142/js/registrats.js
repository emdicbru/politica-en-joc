// Centre de control · 👤 Registrats: quants comptes hi ha, qui són (nom d'usuari) i qui ha jugat cada dia i quant.
// Llegeix users/{uid} (els 300 més actius recentment per pàgina). L'activitat per dia (act: partides i XP) es registra
// des del 29 d'octubre de 2026; dels dies anteriors només se sap qui va fer el repte diari.
const CTR = { list: null, next: null, total: null, loading: false, at: 0, day: null, sort: "g", q: "", lsort: "at" };
const CTR_FROM = "2026-10-29";

async function ctrLoad(more = false) {
  if (CTR.loading) return;
  CTR.loading = true;
  const O = window.Online;
  const [page, total] = await Promise.all([O.registered(more ? CTR.next : null), more ? Promise.resolve(CTR.total) : O.countOf("users")]);
  CTR.loading = false;
  if (!page) { CTR.list = CTR.list || []; CTR.err = true; renderControl(true); return; }
  CTR.err = false;
  CTR.list = more ? [...(CTR.list || []), ...page.list] : page.list;
  CTR.next = page.next;
  CTR.total = total;
  CTR.at = Date.now();
  renderControl(true);
}
const ctrDays = (n) => Array.from({ length: n }, (_, i) => actDay(new Date(Date.now() - (n - 1 - i) * 864e5)));
const ctrName = (u) => (u.handle ? `@${u.handle}` : "Sense nom d'usuari");
// Què va fer un usuari un dia: partides i XP (o, abans del registre d'activitat, si va fer el repte diari)
const ctrOn = (u, d) => u.act[d] || (u.daily.includes(d) ? { g: 0, xp: 0, rep: true } : null);
const ctrDayLbl = (d) => new Date(d + "T12:00:00").toLocaleDateString("ca-ES", { weekday: "short", day: "numeric", month: "short" });

function ctlRegHtml() {
  if (!CTR.list) { ctrLoad(); return `<div class="card"><p class="muted">Carregant els usuaris…</p></div>`; }
  const L = CTR.list;
  const days = ctrDays(14), today = days[days.length - 1];
  CTR.day = CTR.day && days.includes(CTR.day) ? CTR.day : today;
  const playedOn = (d) => L.filter((u) => ctrOn(u, d));
  const todayRows = playedOn(today).map((u) => u.act[today] || { g: 0, xp: 0 });
  const week = new Set(ctrDays(7).flatMap((d) => playedOn(d).map((u) => u.uid))).size;
  const cols = days.map((d) => { const p = playedOn(d); return { d, n: p.length, g: p.reduce((t, u) => t + (u.act[d]?.g || 0), 0) }; });
  const cmax = Math.max(1, ...cols.map((c) => c.n));
  // Qui ha jugat el dia triat
  const dayRows = playedOn(CTR.day).map((u) => ({ u, a: ctrOn(u, CTR.day) })).sort((a, b) => (CTR.sort === "xp" ? b.a.xp - a.a.xp : b.a.g - a.a.g || b.a.xp - a.a.xp));
  // Tots els registrats
  const q = CTR.q.trim().toLowerCase();
  const d30 = ctrDays(30);
  const all = L.filter((u) => !q || ctrName(u).toLowerCase().includes(q)).map((u) => ({ ...u, days30: d30.filter((d) => ctrOn(u, d)).length }))
    .sort((a, b) => (CTR.lsort === "xp" ? b.xp - a.xp : CTR.lsort === "g" ? b.plays - a.plays : CTR.lsort === "dies" ? b.days30 - a.days30 : (b.at || 0) - (a.at || 0)));
  return `
    <p class="ctl-intro">Els comptes registrats amb Google. Només se'n mostra el nom d'usuari públic (mai el nom real ni l'adreça electrònica). L'activitat per dia (partides i XP) es compta des del ${ctrDayLbl(CTR_FROM)}; abans, només se sap qui va fer el repte diari.</p>
    ${CTR.err ? `<p class="ctl-alert">⚠️ No s'han pogut llegir els usuaris (permisos o connexió).</p>` : ""}
    <div class="ctu-top"><span></span><button class="linklike" type="button" data-crefresh>↻ Actualitza (dades de ${Date.now() - CTR.at < 90e3 ? "fa un moment" : ctlRel(CTR.at).replace("d'aquí a", "fa")})</button></div>
    <section class="ctl-status ctu-kpis">
      <div class="ctl-st"><small>Registrats</small><b>${ctuN(CTR.total)}</b><span class="ctl-tag">comptes en total</span></div>
      <div class="ctl-st"><small>Han jugat avui</small><b>${ctuN(todayRows.length)}</b><span class="ctl-tag">registrats</span></div>
      <div class="ctl-st"><small>Partides avui</small><b>${ctuN(todayRows.reduce((t, a) => t + a.g, 0))}</b><span class="ctl-tag">${ctuN(todayRows.reduce((t, a) => t + a.xp, 0))} XP</span></div>
      <div class="ctl-st"><small>Actius en 7 dies</small><b>${ctuN(week)}</b><span class="ctl-tag">registrats diferents</span></div>
    </section>

    <section class="card ctu-card">
      <h2 class="section-title sm">📅 Registrats que han jugat cada dia</h2>
      <p class="muted">Toca un dia per veure qui hi va jugar i quant.</p>
      <div class="ctu-cols ctr-cols" style="--n:${cols.length}">${cols.map((c) => `<button type="button" class="ctu-col ${c.d === CTR.day ? "on" : ""}" data-cday="${c.d}" title="${ctrDayLbl(c.d)}: ${c.n} registrats, ${c.g} partides">
        <span class="ctu-cv">${c.n || ""}</span>
        <div class="ctu-stack" style="height:${(c.n / cmax) * 100}%"><i class="torna" style="flex:1"></i></div>
        <small>${ctrDayLbl(c.d).replace(/^\S+ /, "").replace(" ", "<br>")}</small></button>`).join("")}</div>
      <div class="ctr-dayhead"><h3>${ctrDayLbl(CTR.day)} · ${dayRows.length} ${dayRows.length === 1 ? "registrat" : "registrats"}</h3>
        <div class="ctl-seg sm">${[["g", "Per partides"], ["xp", "Per XP"]].map(([k, t]) => `<button type="button" class="${CTR.sort === k ? "on" : ""}" data-csort="${k}"><b>${t}</b></button>`).join("")}</div></div>
      ${dayRows.length ? `<table class="ctr-table"><thead><tr><th>Usuari</th><th>Partides</th><th>XP del dia</th><th>Nivell</th></tr></thead><tbody>${dayRows.map(({ u, a }) => `<tr><td>${esc(ctrName(u))}</td><td>${a.rep ? "Repte diari" : fmt(a.g)}</td><td>${a.rep ? "—" : fmt(a.xp)}</td><td>${u.level}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Cap registrat no hi va jugar.</p>`}
    </section>

    <section class="card ctu-card">
      <h2 class="section-title sm">👤 Tots els registrats</h2>
      <div class="ctr-tools"><input type="search" placeholder="Cerca un nom d'usuari" value="${esc(CTR.q)}" data-cq aria-label="Cerca un nom d'usuari">
        <div class="ctl-seg sm">${[["at", "Darrera activitat"], ["xp", "XP"], ["g", "Partides"], ["dies", "Dies actius"]].map(([k, t]) => `<button type="button" class="${CTR.lsort === k ? "on" : ""}" data-clsort="${k}"><b>${t}</b></button>`).join("")}</div></div>
      <table class="ctr-table"><thead><tr><th>Usuari</th><th>Nivell</th><th>XP</th><th>Partides</th><th>Dies actius (30 d)</th><th>Darrera activitat</th></tr></thead><tbody>${all.map((u) => `<tr><td>${esc(ctrName(u))}</td><td>${u.level}</td><td>${fmt(u.xp)}</td><td>${fmt(u.plays)}</td><td>${u.days30}</td><td>${u.at ? ctlRel(u.at).replace("d'aquí a", "fa") : "—"}</td></tr>`).join("")}</tbody></table>
      <p class="muted">${fmt(L.length)} de ${ctuN(CTR.total)} carregats, dels més actius als menys.${CTR.next ? ` <button type="button" class="linklike" data-cmore>Carrega'n més</button>` : ""}</p>
    </section>`;
}
function ctlRegBind(root) {
  $("[data-crefresh]", root)?.addEventListener("click", () => { CTR.list = null; renderControl(true); });
  $$("[data-cday]", root).forEach((b) => b.addEventListener("click", () => { CTR.day = b.dataset.cday; renderControl(true); }));
  $$("[data-csort]", root).forEach((b) => b.addEventListener("click", () => { CTR.sort = b.dataset.csort; renderControl(true); }));
  $$("[data-clsort]", root).forEach((b) => b.addEventListener("click", () => { CTR.lsort = b.dataset.clsort; renderControl(true); }));
  $("[data-cmore]", root)?.addEventListener("click", () => ctrLoad(true));
  const q = $("[data-cq]", root);
  q?.addEventListener("input", () => {
    CTR.q = q.value;
    clearTimeout(CTR.qt);
    CTR.qt = setTimeout(() => { renderControl(true); const i = $("[data-cq]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
  });
}
