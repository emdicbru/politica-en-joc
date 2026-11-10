// =========================================================
// A QUI T'ASSEMBLES? Test d'afinitat amb els partits del 29N
// =========================================================
// Vint afirmacions sobre temes de la campanya. Per a cada partit hi ha la seva posició (de -2, molt en contra, a +2,
// molt a favor) segons el programa, el que ha votat al Congrés i les seves posicions públiques (vegeu PARTY_ARGS a
// partits.js). On la posició no és clara o no se'n coneix cap, no hi ha valor (null) i aquella afirmació no compta
// per a aquell partit. És orientatiu: no és cap recomanació de vot.
// CC i SALF no hi surten: tenen massa poques posicions públiques sobre aquests temes per comparar-les amb justícia.
const ASSEMBLA_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng"];
//                     pp   psoe  vox   fa   pod   erc  junts bildu pnv   bng
const ASSEMBLA_ITEMS = [
  { t: "Habitatge", q: "Cal limitar per llei el preu del lloguer a les zones on és més car.", p: [-2, 2, -2, 2, 2, 2, -1, 2, null, 2] },
  { t: "Impostos", q: "S'han d'abaixar els impostos, encara que hi hagi menys diners per als serveis públics.", p: [2, -2, 2, -2, -2, -1, 1, -2, null, -1] },
  { t: "Impostos", q: "Les grans fortunes, la banca i les energètiques han de pagar més impostos.", p: [-2, 2, -1, 2, 2, 1, -1, 2, -1, 2] },
  { t: "Treball", q: "Cal reduir la jornada laboral a 37,5 hores setmanals sense rebaixar el sou.", p: [-2, 2, -2, 2, 2, 2, -2, 2, null, 2] },
  { t: "Model territorial", q: "Catalunya hauria de poder votar en un referèndum d'independència.", p: [-2, -2, -2, 1, 2, 2, 2, 2, 1, 2] },
  { t: "Model territorial", q: "S'ha de mantenir la llei d'amnistia.", p: [-2, 2, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Model territorial", q: "Caldria suprimir les comunitats autònomes i tornar a un Estat centralitzat.", p: [-2, -2, 2, -2, -2, -2, -2, -2, -2, -2] },
  { t: "Model territorial", q: "Catalunya hauria de recaptar tots els seus impostos, com fa el País Basc.", p: [-2, 0, -2, null, null, 2, 2, null, null, null] },
  { t: "Model territorial", q: "Espanya s'ha de reconèixer com un Estat plurinacional.", p: [-2, 0, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Energia", q: "S'ha d'allargar la vida de les centrals nuclears.", p: [2, -1, 2, -2, -2, null, 1, -2, null, null] },
  { t: "Immigració", q: "Cal regularitzar els immigrants que ja viuen i treballen a Espanya.", p: [-1, 1, -2, 2, 2, 1, null, 2, 1, 1] },
  { t: "Immigració", q: "Les ajudes socials han de donar prioritat a les persones de nacionalitat espanyola.", p: [null, -2, 2, -2, -2, -2, null, -2, -2, -2] },
  { t: "Drets", q: "L'avortament ha de ser un dret garantit a la sanitat pública.", p: [0, 2, -2, 2, 2, 2, 1, 2, 1, 2] },
  { t: "Drets", q: "Cal derogar la llei de violència de gènere.", p: [-2, -2, 2, -2, -2, -2, -2, -2, -2, -2] },
  { t: "Sanitat", q: "La sanitat pública ha de cobrir el dentista i la salut mental.", p: [null, 1, null, 2, 2, 2, null, 2, null, null] },
  { t: "Seguretat", q: "Els pisos ocupats il·legalment s'han de poder desallotjar en pocs dies.", p: [2, null, 2, -1, -2, null, 2, null, null, null] },
  { t: "Llengües", q: "El català, el basc i el gallec han de ser llengües oficials a la Unió Europea.", p: [-1, 2, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Europa i món", q: "La Unió Europea ha de tenir més poder, encara que els estats en perdin.", p: [1, 1, -2, null, null, 1, null, null, 1, null] },
  { t: "Europa i món", q: "Espanya ha d'augmentar la despesa en defensa.", p: [1, 0, 1, -2, -2, null, null, -2, null, -2] },
  { t: "Institucions", q: "Espanya hauria de ser una república.", p: [-2, -1, -2, 1, 2, 2, null, 2, null, 2] },
];
const ASSEMBLA_ANS = [[2, "Molt d'acord"], [1, "D'acord"], [0, "Neutral"], [-1, "En desacord"], [-2, "Molt en desacord"]];
const ASSEMBLA_KEY = "r29n-assembla";
const ASSEMBLA_MIN = 6; // afirmacions en comú perquè un partit surti al resultat

function assemblaScores(ans) {
  return ASSEMBLA_PARTIES.map((id, j) => {
    let num = 0, den = 0, n = 0;
    ASSEMBLA_ITEMS.forEach((it, i) => {
      const a = ans[i], p = it.p[j];
      if (!a || a.v === null || p === null) return;
      const w = a.imp ? 2 : 1;
      num += w * (4 - Math.abs(a.v - p)) / 4; den += w; n++;
    });
    const party = PARTIES.find((x) => x.id === id);
    return { id, sig: party.sig, name: party.name, color: party.color, n, pct: den ? Math.round((num / den) * 100) : 0 };
  }).filter((r) => r.n >= ASSEMBLA_MIN).sort((a, b) => b.pct - a.pct || a.sig.localeCompare(b.sig));
}

function assemblaCanvas(rows) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d";
  const display = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#ffcf3d"; c.fillRect(0, 0, W, 18);
  c.textAlign = "center"; c.fillStyle = INK;
  c.font = sans(40, 700); c.fillText("Eleccions del 29N", W / 2, 120);
  c.font = display(76); c.fillText("A qui m'assemblo?", W / 2, 220);
  const top = rows[0];
  c.font = sans(44, 700); c.fillStyle = "#3a3a63"; c.fillText("Coincideixo més amb", W / 2, 330);
  c.font = display(110); c.fillStyle = top.color; c.fillText(top.sig, W / 2, 470);
  c.font = display(64); c.fillStyle = INK; c.fillText(`${top.pct} %`, W / 2, 560);
  // Els cinc primers, en barres
  const list = rows.slice(0, 5), x0 = 120, bw = W - 240;
  list.forEach((r, i) => {
    const y = 650 + i * 104;
    c.textAlign = "left"; c.font = display(36); c.fillStyle = INK; c.fillText(r.sig, x0, y + 34);
    c.textAlign = "right"; c.font = display(36); c.fillText(`${r.pct} %`, x0 + bw, y + 34);
    round(x0, y + 52, bw, 30, 15); c.fillStyle = "#ece4d2"; c.fill();
    round(x0, y + 52, Math.max(30, (bw * r.pct) / 100), 30, 15); c.fillStyle = r.color; c.fill();
  });
  c.textAlign = "center"; c.font = sans(36, 600); c.fillStyle = "#6e6a82"; c.fillText("I tu, a qui t'assembles?", W / 2, 1200);
  c.fillStyle = INK; c.font = display(40); c.fillText("Política en Joc", W / 2, 1265);
  c.font = sans(30, 600); c.fillStyle = "#3a3a63"; c.fillText((location.host || "politicaenjoc.cat") + "/#joc/assembla", W / 2, 1310);
  return cv;
}

async function assemblaShare(rows) {
  const top = rows[0];
  const text = `🗳️ Al test «A qui t'assembles?» de Política en Joc coincideixo un ${top.pct} % amb ${top.sig}. I tu?`;
  const url = `${location.origin}${location.pathname}#joc/assembla`;
  const cv = assemblaCanvas(rows);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  const file = blob && new File([blob], "a-qui-m-assemblo.png", { type: "image/png" });
  try {
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}` }); return; }
    if (navigator.share) { await navigator.share({ text, url }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  if (blob) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "a-qui-m-assemblo.png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Imatge descarregada i text copiat"); } catch { toast("Imatge descarregada"); }
}

const assemblaLabel = (v) => v === null ? "—" : (ASSEMBLA_ANS.find((a) => a[0] === v) || [0, ""])[1];

function assemblaResult(ctx, ans) {
  const rows = assemblaScores(ans);
  try { store.set(ASSEMBLA_KEY, { at: Date.now(), top: rows.slice(0, 3).map((r) => [r.id, r.pct]) }); } catch { /* sense memòria */ }
  if (!rows.length) {
    return ctx.finish({ score: 0, display: "—", noRecord: true, xp: 10, verdict: "Has saltat massa afirmacions per comparar-te amb els partits.", extraHtml: `<p class="muted">Torna-hi i respon-ne almenys ${ASSEMBLA_MIN}.</p>` });
  }
  const answered = ASSEMBLA_ITEMS.map((it, i) => ({ it, a: ans[i] })).filter((x) => x.a && x.a.v !== null);
  const detail = (r) => {
    const j = ASSEMBLA_PARTIES.indexOf(r.id);
    const rowsH = answered.filter((x) => x.it.p[j] !== null).map((x) => {
      const d = Math.abs(x.a.v - x.it.p[j]), cls = d <= 1 ? "ok" : d >= 3 ? "ko" : "mid";
      return `<li class="asb-d ${cls}"><b>${esc(x.it.q)}</b><span>Tu: ${esc(assemblaLabel(x.a.v))} · ${esc(r.sig)}: ${esc(assemblaLabel(x.it.p[j]))}</span></li>`;
    }).join("");
    return `<ul class="asb-dl">${rowsH}</ul>`;
  };
  const extraHtml = `<div class="asb-res">
      <div class="asb-bars">${rows.map((r) => `<details class="asb-row" style="--pc:${r.color}"><summary><b>${esc(r.sig)}</b><span class="asb-bar"><i style="width:${r.pct}%"></i></span><em>${r.pct} %</em></summary>${detail(r)}</details>`).join("")}</div>
      <p class="muted asb-note">Toca un partit per veure en què hi coincideixes i en què no. Les posicions surten dels programes, del que han votat al Congrés i de les seves declaracions públiques; on no són clares, aquella afirmació no compta. És orientatiu: no és cap recomanació de vot. CC i SALF no hi surten perquè tenen poques posicions públiques sobre aquests temes.</p>
      <div class="asb-acts"><button class="btn primary" type="button" data-asb-share>Comparteix el resultat</button><a class="btn ghost" href="#apren/partits">Compara els partits</a></div>
    </div>`;
  ctx.finish({
    score: rows[0].pct, display: `${rows[0].pct} %`, noRecord: true, xp: 40,
    verdict: `T'assembles més a ${rows[0].sig}${rows[1] ? `, i després a ${rows[1].sig}` : ""}.`,
    extraHtml,
    onShown(body) { $("[data-asb-share]", body)?.addEventListener("click", () => assemblaShare(rows)); },
  });
}

registerGame({
  id: "assembla",
  cat: "parlament",
  tagline: "20 temes de la campanya: amb quin partit coincideixes més?",
  kicker: "Especial 29N",
  title: "A qui t'assembles?",
  level: 1,
  meta: "20 afirmacions",
  icon: icon(`<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20a5 5 0 0110 0M11 20a5 5 0 0110 0"/>`),
  desc: "Digues si hi estàs d'acord o no en 20 temes de la campanya (habitatge, impostos, model territorial, immigració…) i descobreix amb quins partits coincideixes més. Sense temps i sense respostes correctes.",
  rules: ["20 afirmacions · sense temps", "Marca les que t'importen més", "Pots saltar-ne", "Resultat per compartir"],
  start(ctx) {
    const ans = new Array(ASSEMBLA_ITEMS.length).fill(null);
    let i = 0;
    const draw = () => {
      const it = ASSEMBLA_ITEMS[i], cur = ans[i] || { v: undefined, imp: false };
      ctx.hud([["n", "Afirmació", `${i + 1}/${ASSEMBLA_ITEMS.length}`]]);
      ctx.body.innerHTML = `<div class="asb">
          <div class="asb-prog"><i style="width:${(i / ASSEMBLA_ITEMS.length) * 100}%"></i></div>
          <span class="asb-t">${esc(it.t)}</span>
          <p class="asb-q">${esc(it.q)}</p>
          <div class="asb-opts">${ASSEMBLA_ANS.map(([v, l]) => `<button class="asb-o${cur.v === v ? " on" : ""}" data-v="${v}" type="button">${esc(l)}</button>`).join("")}</div>
          <label class="asb-imp"><input type="checkbox" data-imp${cur.imp ? " checked" : ""}> ⭐ Aquest tema m'importa molt</label>
          <div class="asb-nav"><button class="btn ghost sm" data-prev type="button"${i ? "" : " disabled"}>← Anterior</button><button class="btn ghost sm" data-skip type="button">Salta</button></div>
        </div>`;
      const imp = () => !!$("[data-imp]", ctx.body)?.checked;
      ctx.body.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => { ans[i] = { v: Number(b.dataset.v), imp: imp() }; next(); }));
      $("[data-imp]", ctx.body).addEventListener("change", () => { if (ans[i]) ans[i].imp = imp(); });
      $("[data-skip]", ctx.body).addEventListener("click", () => { ans[i] = { v: null, imp: false }; next(); });
      $("[data-prev]", ctx.body).addEventListener("click", () => { if (i) { i--; draw(); } });
    };
    const next = () => { if (i < ASSEMBLA_ITEMS.length - 1) { i++; draw(); } else assemblaResult(ctx, ans); };
    ctx.onKey((e) => { const k = Number(e.key); if (k >= 1 && k <= 5) { const b = ctx.body.querySelectorAll("[data-v]")[k - 1]; b?.click(); } });
    draw();
  },
});
