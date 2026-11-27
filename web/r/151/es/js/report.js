// «Avisa d'un error»: un formulari curt perquè qualsevol persona pugui explicar què no funciona. S'hi afegeix sol on
// era (la secció), el dispositiu, la versió de l'app i l'últim error tècnic de la pàgina, si n'hi ha hagut.
// Es desa a Firestore reports/{id} i l'equip ho veu al Centre de control (pestanya Errors).
const RPT_ERRORS = [];
window.addEventListener("error", (e) => { if (!e.filename && /^Script error.?$/.test(e.message || "")) return; RPT_ERRORS.push(`${e.message || "error"} @ ${(e.filename || "").split("/").pop()}:${e.lineno || 0}`.slice(0, 240)); if (RPT_ERRORS.length > 3) RPT_ERRORS.shift(); });
window.addEventListener("unhandledrejection", (e) => { RPT_ERRORS.push(`promesa: ${String(e.reason?.message || e.reason || "").slice(0, 200)}`); if (RPT_ERRORS.length > 3) RPT_ERRORS.shift(); });

function rptContext() {
  const ver = (document.querySelector('script[src*="core.js"]')?.getAttribute("src") || "").match(/v=(\d+)/)?.[1] || "";
  const ua = navigator.userAgent;
  const disp = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "iPhone o iPad" : /android/i.test(ua) ? "Android" : "Ordenador";
  const nav = /edg\//i.test(ua) ? "Edge" : /firefox|fxios/i.test(ua) ? "Firefox" : /crios|chrome/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Otro navegador";
  const app = typeof isStandalone === "function" && isStandalone();
  return {
    where: (location.hash || "#inici").slice(0, 100),
    ver,
    ua: `${disp} · ${nav}${app ? " · app instalada" : ""} · ${ua}`.slice(0, 300),
    scr: `${innerWidth}x${innerHeight}`,
    err: RPT_ERRORS.join(" | ").slice(0, 800),
    label: `${disp} · ${nav}${app ? " (app instalada)" : ""} · versión ${ver || "?"}`,
  };
}

function openReport() {
  if (document.querySelector(".rpt")) return;
  const ctx = rptContext();
  const me = window.Online?.meInfo?.();
  const box = h(`<div class="onb rpt" role="dialog" aria-modal="true" aria-labelledby="rpt-t"><form class="card rpt-card" novalidate>
    <h3 id="rpt-t">Avisa de un error</h3>
    <p class="muted">Explícanos qué ha pasado y lo miraremos. Cuanto más concreto, mejor: qué hacías, qué esperabas y qué ha salido.</p>
    <label class="rpt-f"><span>¿Qué ha pasado?</span><textarea data-rpt-text rows="5" maxlength="2000" required placeholder="Por ejemplo: en el reto diario, al tocar «Siguiente» la pantalla se queda en blanco."></textarea></label>
    <label class="rpt-f"><span>Tu correo, si quieres que te respondamos <small>(opcional)</small></span><input type="email" data-rpt-mail maxlength="120" autocomplete="email" value="${esc(me?.email || "")}" placeholder="nom@exemple.cat"></label>
    <p class="rpt-ctx">También se añade: <b>${esc(ctx.where)}</b> · ${esc(ctx.label)}${ctx.err ? " · el último error técnico de la página" : ""}. No se incluye nada más.</p>
    <p class="rpt-err" data-rpt-err role="alert"></p>
    <div class="row"><button class="btn ghost" type="button" data-rpt-x>Cancela</button><button class="btn primary" type="submit" data-rpt-go>Envía</button></div>
  </form></div>`);
  document.body.appendChild(box);
  const text = $("[data-rpt-text]", box), mail = $("[data-rpt-mail]", box), err = $("[data-rpt-err]", box), go = $("[data-rpt-go]", box);
  text.focus();
  const close = () => box.remove();
  $("[data-rpt-x]", box).addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  $("form", box).addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = text.value.trim(), m = mail.value.trim();
    if (t.length < 10) { err.textContent = "Explícalo un poco más (al menos 10 caracteres)."; return text.focus(); }
    if (m && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { err.textContent = "Este correo no parece válido. Puedes dejarlo en blanco."; return mail.focus(); }
    go.disabled = true; go.textContent = "Enviando…";
    const ok = await window.Online?.reportSend?.({ text: t.slice(0, 2000), email: m.slice(0, 120), where: ctx.where, ver: ctx.ver, ua: ctx.ua, scr: ctx.scr, err: ctx.err });
    if (ok) { close(); Sfx.play("unlock"); toast("¡Gracias! Lo miraremos pronto."); return; }
    go.disabled = false; go.textContent = "Envía";
    err.innerHTML = `No se ha podido enviar. Vuelve a intentarlo dentro de un rato o escríbenos a <a href="mailto:${esc(LEGAL.correu)}?subject=${encodeURIComponent("Error en Política en Joc")}&body=${encodeURIComponent(t + "\n\n" + ctx.label + " · " + ctx.where)}">${esc(LEGAL.correu)}</a>.`;
  });
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-report]")) { e.preventDefault(); openReport(); }
});
