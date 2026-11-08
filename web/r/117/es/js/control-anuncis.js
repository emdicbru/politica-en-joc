// Centre de control › Anuncis (administradors): el vídeo recompensat per jugar la 3a partida del repte diari.
// Es configura el compte d'AdSense, si el límit de partides és actiu i si es fan servir anuncis de prova
// (config/anuncis, que llegeix anuncis.js a cada dispositiu). Els passos a fer a AdSense són a la mateixa pestanya.

const ctlAds = { cfg: null, draft: null, stats: null, loading: false };

async function ctlAdsLoad() {
  if (ctlAds.loading) return;
  ctlAds.loading = true;
  const O = window.Online;
  const day = (off) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(Date.now() + off * 864e5));
  const [cfg, docs] = await Promise.all([O.getConfig("anuncis"), O.statsRange(day(-6), day(0))]);
  ctlAds.cfg = cfg || { client: "", repte: "lliure", test: true };
  ctlAds.draft = { client: "", repte: "lliure", test: true, ...ctlAds.cfg };
  const sum = {};
  (docs || []).forEach((d) => Object.entries(d.ad || {}).forEach(([k, v]) => { sum[k] = (sum[k] || 0) + v; }));
  ctlAds.stats = sum;
  ctlAds.loading = false;
  if (sessionStorage.getItem("ctl-tab") === "anuncis") renderControl(true);
}

function ctlAdsHtml() {
  if (!ctlAds.cfg) { ctlAdsLoad(); return `<div class="card"><p class="muted">Carregant…</p></div>`; }
  const D = ctlAds.draft, C = ctlAds.cfg, S = ctlAds.stats || {};
  const valid = /^ca-pub-\d{10,20}$/.test(D.client || "");
  const pub = valid ? D.client.replace(/^ca-/, "") : "pub-XXXXXXXXXXXXXXXX";
  const dirty = JSON.stringify({ client: D.client || "", repte: D.repte, test: !!D.test }) !== JSON.stringify({ client: C.client || "", repte: C.repte || "lliure", test: !!C.test });
  const live = /^ca-pub-\d{10,20}$/.test(C.client || "") && C.repte === "limit";
  const seg = (k, list) => `<div class="ctl-seg">${list.map(([v, t, s]) => `<button type="button" class="${String(D[k]) === String(v) ? "on" : ""}" data-ads-set="${k}" data-v="${v}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>`;
  return `
    <p class="ctl-intro">Un vídeo d'un anunciant, <b>només si la persona el demana</b>, per jugar una 3a partida del repte diari (amb proves noves). Ningú veu cap anunci si no prem «Mira el vídeo».</p>
    <section class="ctl-status">
      <div class="ctl-st"><small>Ara mateix</small><b>${live ? (C.test ? "Actiu (prova)" : "Actiu") : "Sense anuncis"}</b><span class="ctl-tag ${live && !C.test ? "ok" : ""}">${C.repte === "limit" ? "2 + vídeo" : "partides lliures"}</span></div>
      <div class="ctl-st"><small>Vídeos vistos (7 dies)</small><b>${S.vist || 0}</b><span class="ctl-tag">${S.demanat || 0} demanats</span></div>
      <div class="ctl-st"><small>Partides de pràctica (7 dies)</small><b>${(S.partida2 || 0) + (S.partida3 || 0) + (S.partida4 || 0)}</b><span class="ctl-tag">${S.partida3 || 0} terceres</span></div>
    </section>
    <section class="card">
      <h2 class="section-title sm">🗓️ Repte diari</h2>
      ${seg("repte", [["lliure", "Sense límit", "Es pot repetir sempre, amb proves noves"], ["limit", "2 partides + 3a amb vídeo", "El model amb anunciants"]])}
      ${D.repte === "limit" && !valid ? `<p class="ctl-alert">⚠️ Sense un compte d'AdSense vàlid, la 3a partida no estarà disponible per a ningú.</p>` : ""}
      <p class="muted">La 1a partida és sempre la de tothom i l'única que compta per al rànquing. Les partides es compten en cada dispositiu.</p>
    </section>
    <section class="card ctl-press">
      <h2 class="section-title sm">🔑 Compte d'AdSense</h2>
      <label>Identificador de l'editor <input data-ads-client maxlength="30" value="${esc(D.client || "")}" placeholder="ca-pub-1234567890123456" spellcheck="false" autocomplete="off"></label>
      ${D.client && !valid ? `<p class="ctl-alert">El format ha de ser ca-pub- i els números (el trobaràs a AdSense › Compte › Informació del compte).</p>` : ""}
      ${seg("test", [["true", "Anuncis de prova", "Google mostra vídeos de mostra (no paguen)"], ["false", "Anuncis reals", "Quan AdSense hagi aprovat la web"]])}
      <div class="row">
        <button class="btn primary" type="button" data-ads-save ${dirty ? "" : "disabled"}>Desa</button>
        <button class="btn" type="button" data-ads-try ${valid ? "" : "disabled"}>▶ Prova el vídeo ara (només tu)</button>
      </div>
    </section>
    <section class="card ctl-helpbox">
      <h2 class="section-title sm">✅ Passos a AdSense (una sola vegada)</h2>
      <ol>
        <li>Crea el compte a <a href="https://adsense.google.com" target="_blank" rel="noopener">adsense.google.com</a> amb el web <b>politicaenjoc.cat</b> i escriu aquí l'identificador (ca-pub-…).</li>
        <li>Fitxer <code>ads.txt</code>: ha de ser a politicaenjoc.cat/ads.txt amb aquesta línia (demana a Claude que el publiqui):<br><code>google.com, ${esc(pub)}, DIRECT, f08c47fec0942fa0</code></li>
        <li>Demana l'accés als anuncis per a jocs web: AdSense › Anuncis › <b>H5 Games Ads</b> (Ad Placement API). Pot trigar uns dies.</li>
        <li><b>Privadesa i missatges</b> › crea el missatge de consentiment (RGPD) per a l'Espai Econòmic Europeu i publica'l. És el que demana permís per a les galetes abans del vídeo.</li>
        <li><b>Control de bloqueig</b> › Categories sensibles: bloqueja <b>Política</b>, Religió, Jocs d'atzar i Contingut sexual. Una web electoral no ha de mostrar anuncis de partits.</li>
        <li>Prova-ho amb «Anuncis de prova». Quan AdSense aprovi la web, passa a «Anuncis reals» i activa «2 partides + 3a amb vídeo».</li>
      </ol>
    </section>`;
}

function ctlAdsBind(root) {
  if (!ctlAds.cfg) return;
  const D = ctlAds.draft;
  $$("[data-ads-set]", root).forEach((b) => b.addEventListener("click", () => {
    D[b.dataset.adsSet] = b.dataset.adsSet === "test" ? b.dataset.v === "true" : b.dataset.v;
    renderControl(true);
  }));
  $("[data-ads-client]", root)?.addEventListener("change", (e) => { D.client = e.target.value.trim(); renderControl(true); });
  $("[data-ads-save]", root)?.addEventListener("click", async () => {
    const next = { client: (D.client || "").trim(), repte: D.repte === "limit" ? "limit" : "lliure", test: !!D.test, t: Date.now(), by: window.Online?.user?.email || "" };
    if (next.repte === "limit" && !next.test && !/^ca-pub-\d{10,20}$/.test(next.client)) return toast("Falta l'identificador d'AdSense");
    if (next.repte === "limit" && !confirm(`A partir d'ara, cada persona podrà jugar 2 partides del repte al dia i una 3a mirant un vídeo${next.test ? " (de prova)" : ""}. Continuar?`)) return;
    if (await window.Online.setConfig("anuncis", next)) { ctlAds.cfg = next; window.Ads?.set(next); toast("Desat: ho veurà tothom a la propera visita"); renderControl(true); }
  });
  $("[data-ads-try]", root)?.addEventListener("click", async (e) => {
    const btn = e.currentTarget, prev = window.Ads.cfg();
    btn.disabled = true; btn.textContent = "Carregant el vídeo…";
    window.Ads.set({ ...prev, client: D.client, test: !!D.test });
    const r = await window.Ads.reward("prova-control");
    window.Ads.set(prev);
    btn.disabled = false; btn.textContent = "▶ Prova el vídeo ara (només tu)";
    toast(r.ok ? "Vídeo vist sencer: la recompensa funciona" : `No s'ha vist el vídeo (${r.why}). Si el compte encara no està aprovat, és normal.`);
  });
}
