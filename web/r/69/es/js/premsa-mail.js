// Correu de les notes de premsa: el mateix codi fa la previsualització del Centre de control (control.js) i el correu
// que s'envia (tools/premsa.js, a GitHub Actions), perquè el que es veu sigui exactament el que arriba.
// HTML de correu: taules i estils en línia (els programes de correu no entenen fulls d'estil ni maquetació moderna).

const PREMSA_SITE = "https://politicaenjoc.cat/";
const PREMSA_C = { paper: "#f1e9d8", card: "#fffaf0", ink: "#17173d", ink2: "#3a3a63", muted: "#6e6a82", red: "#ff4b2b", yellow: "#ffcf3d", line: "#e6d9bf" };

function premsaEsc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
// Text amb format mínim: paràgrafs (línia en blanc), salts de línia, **negreta**, enllaços i correus
function premsaInline(txt) {
  return premsaEsc(String(txt || "").trim()).replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, `<a href="$1" style="color:${PREMSA_C.red};text-decoration:underline">$1</a>`)
    .replace(/(^|[\s>(])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, `$1<a href="mailto:$2" style="color:${PREMSA_C.red};text-decoration:underline">$2</a>`);
}
function premsaRich(txt, style) {
  return String(txt || "").trim().split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p style="${style}">${premsaInline(p)}</p>`).join("");
}
const premsaPlain = (txt) => String(txt || "").trim().replace(/\*\*(.+?)\*\*/g, "$1");
function premsaDate(t) {
  try { return new Intl.DateTimeFormat("ca-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(new Date(t)); }
  catch { return new Date(t).toISOString().slice(0, 10); }
}

// note: { subject, title, lead, body, caption, place, greet } · o: { name, cfg, photoUrl, webUrl, unsubUrl, date }
function premsaMail(note, o = {}) {
  const C = PREMSA_C, cfg = o.cfg || {};
  const contact = cfg.contact || "";
  const date = premsaDate(o.date || Date.now());
  const dateLine = `${note.place ? premsaEsc(note.place) + ", " : ""}${premsaEsc(date)}`;
  const greet = note.greet && o.name ? `<p style="margin:0 0 18px;font:16px/1.6 Arial,Helvetica,sans-serif;color:${C.ink}">Hola, ${premsaEsc(String(o.name).split(" ")[0])}:</p>` : "";
  const pStyle = `margin:0 0 16px;font:16px/1.65 Arial,Helvetica,sans-serif;color:${C.ink}`;
  const photo = o.photoUrl ? `<tr><td style="padding:0 32px 8px"><img src="${premsaEsc(o.photoUrl)}" alt="${premsaEsc(note.caption || note.title || "")}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:10px"></td></tr>
    ${note.caption ? `<tr><td style="padding:0 32px 20px;font:13px/1.5 Arial,Helvetica,sans-serif;color:${C.muted}">${premsaEsc(note.caption)}</td></tr>` : ""}` : "";
  const about = cfg.about ? `<tr><td style="padding:8px 32px 0"><div style="border-top:2px solid ${C.line};padding-top:18px">
      <p style="margin:0 0 6px;font:bold 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">Sobre Política en Joc</p>
      ${premsaRich(cfg.about, `margin:0 0 12px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.ink2}`)}</div></td></tr>` : "";
  const contactRow = contact ? `<tr><td style="padding:4px 32px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper};border-radius:10px"><tr><td style="padding:14px 18px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.ink}">
        <b>Contacte de premsa</b><br>${premsaInline(contact)}
      </td></tr></table></td></tr>` : "";
  const links = [o.webUrl ? `<a href="${premsaEsc(o.webUrl)}" style="color:${C.ink};text-decoration:underline">Llegeix-la al web</a>` : "", o.photoUrl ? `<a href="${premsaEsc(o.photoUrl)}" style="color:${C.ink};text-decoration:underline">Descarrega la foto</a>` : ""].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const inner = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:${C.card};border:2px solid ${C.ink};border-radius:16px;overflow:hidden">
      <tr><td style="background:${C.ink};padding:18px 32px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:12px"><img src="${PREMSA_SITE}img/icon-192.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px"></td>
          <td style="font:900 20px/1 Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:-.01em">Política en <span style="color:${C.yellow}">Joc</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="height:5px;background:${C.yellow};font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:28px 32px 6px">
        <p style="margin:0 0 6px;font:bold 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${C.red}">Nota de premsa</p>
        <p style="margin:0 0 16px;font:13px/1.4 Arial,Helvetica,sans-serif;color:${C.muted}">${dateLine}</p>
        <h1 style="margin:0 0 14px;font:bold 26px/1.25 Arial,Helvetica,sans-serif;color:${C.ink}">${premsaEsc(note.title || "Títol de la nota")}</h1>
        ${note.lead ? `<p style="margin:0 0 22px;font:bold 17px/1.5 Arial,Helvetica,sans-serif;color:${C.ink2}">${premsaEsc(note.lead)}</p>` : ""}
      </td></tr>
      ${photo}
      <tr><td style="padding:6px 32px 8px">${greet}${premsaRich(note.body || "", pStyle) || `<p style="${pStyle};color:${C.muted}">El cos de la nota…</p>`}</td></tr>
      ${about}
      ${contactRow}
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px">
      <tr><td style="padding:16px 32px 4px;font:13px/1.6 Arial,Helvetica,sans-serif;color:${C.ink};text-align:center">${links}</td></tr>
      <tr><td style="padding:4px 32px 8px;font:12px/1.6 Arial,Helvetica,sans-serif;color:${C.muted};text-align:center">
        Reps aquest correu perquè formes part de la llista de mitjans de <a href="${PREMSA_SITE}" style="color:${C.muted}">Política en Joc</a>.
        ${o.unsubUrl ? `<br><a href="${premsaEsc(o.unsubUrl)}" style="color:${C.muted};text-decoration:underline">No vull rebre més notes de premsa</a>` : ""}
      </td></tr>
    </table>
  </td></tr></table>`;

  const html = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${premsaEsc(note.subject || note.title || "")}</title></head><body style="margin:0;padding:0;background:${C.paper}">${inner}</body></html>`;
  // Versió de text pla (per als programes que no mostren HTML): blocs separats per una línia en blanc
  const text = [
    `NOTA DE PREMSA · Política en Joc\n${note.place ? note.place + ", " : ""}${date}`,
    (note.title || "").toUpperCase(),
    note.lead,
    note.greet && o.name ? `Hola, ${String(o.name).split(" ")[0]}:` : "",
    premsaPlain(note.body),
    o.photoUrl ? `Foto${note.caption ? ` (${note.caption})` : ""}: ${o.photoUrl}` : "",
    cfg.about ? `---\nSobre Política en Joc\n${premsaPlain(cfg.about)}` : "",
    contact ? `Contacte de premsa\n${premsaPlain(contact)}` : "",
    o.webUrl ? `Versió web: ${o.webUrl}` : "",
    o.unsubUrl ? `Per no rebre més notes de premsa: ${o.unsubUrl}` : "",
  ].filter((x) => x && String(x).trim()).join("\n\n");
  return { subject: note.subject || note.title || "Nota de premsa", html, inner, text };
}

if (typeof module !== "undefined") module.exports = { premsaMail, premsaRich, premsaEsc, premsaDate };
