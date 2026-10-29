// Monedes i botiga (#botiga). Les monedes són una moneda de joc inventada: no es poden comprar ni bescanviar.
// No es guarden com a saldo: surten del que ja has fet, de manera que no es poden desquadrar entre dispositius.
//   guanyades = 1 per cada 2 XP + 50 per assoliment
//   saldo     = guanyades − preu del que has comprat − les que has afegit a la Lliga de pronòstics
// El que tens i el que portes posat es desa a Progress.data.shop ({ inv: {id: data}, eq: {cat: id}, eqT, bet, betT })
// i se sincronitza amb el compte com la resta del progrés.
const COIN_XP = 2;
const COIN_ACH = 50;

const shopSvg = (bg, inner) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>${inner}</svg>`)}`;
const shopHemi = () => {
  const cols = ["#ff4b2b", "#ffcf3d", "#0f9d58", "#3554ff", "#fffaf0"];
  let s = "", i = 0;
  [[18, 7], [29, 11], [40, 15]].forEach(([r, n]) => { for (let k = 0; k < n; k++) { const a = Math.PI - (k / (n - 1)) * Math.PI; s += `<circle cx="${(50 + r * Math.cos(a)).toFixed(1)}" cy="${(74 - r * Math.sin(a)).toFixed(1)}" r="4" fill="${cols[i++ % cols.length]}"/>`; } });
  return s;
};
const SHOP_CATS = [
  ["av", "Avatares", "Para tu foto de perfil. Los ve todo el mundo en los rankings y en los duelos."],
  ["fr", "Marcos", "Un marco alrededor de tu foto, en la app y en los rankings."],
  ["ti", "Títulos", "Salen al lado de tu nombre en el Perfil y en los rankings."],
  ["cf", "Celebraciones", "El confeti que sale cuando haces una buena partida."],
];
const SHOP = [
  { id: "av-papereta", cat: "av", name: "Papeleta", price: 200, art: shopSvg("#ffcf3d", `<path d="M30 18h40v64H30z" fill="#fffaf0" stroke="#17173d" stroke-width="4" transform="rotate(-6 50 50)"/><path d="M38 34h24M38 46h24M38 58h14" stroke="#17173d" stroke-width="4" transform="rotate(-6 50 50)"/><path d="M52 60l6 6 12-14" stroke="#ff4b2b" stroke-width="6" fill="none"/>`) },
  { id: "av-urna", cat: "av", name: "Urna", price: 300, art: shopSvg("#3554ff", `<path d="M40 16h22v30H40z" fill="#ffcf3d" stroke="#17173d" stroke-width="4" transform="rotate(-8 51 31)"/><rect x="22" y="44" width="56" height="38" rx="5" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><rect x="36" y="41" width="28" height="7" rx="3" fill="#17173d"/><path d="M34 64h32" stroke="#ff4b2b" stroke-width="5"/>`) },
  { id: "av-micro", cat: "av", name: "Micrófono", price: 300, art: shopSvg("#e0306f", `<rect x="38" y="14" width="24" height="42" rx="12" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><path d="M28 46a22 22 0 0044 0" fill="none" stroke="#17173d" stroke-width="5"/><path d="M50 68v12M38 84h24" stroke="#17173d" stroke-width="5"/>`) },
  { id: "av-dau", cat: "av", name: "Dado", price: 350, art: shopSvg("#ff4b2b", `<g transform="rotate(10 50 50)"><rect x="24" y="24" width="52" height="52" rx="10" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><g fill="#17173d"><circle cx="37" cy="37" r="5"/><circle cx="50" cy="50" r="5"/><circle cx="63" cy="63" r="5"/><circle cx="63" cy="37" r="5"/><circle cx="37" cy="63" r="5"/></g></g>`) },
  { id: "av-ulleres", cat: "av", name: "Spin doctor", price: 450, art: shopSvg("#17173d", `<path d="M16 44h68" stroke="#fffaf0" stroke-width="5"/><rect x="20" y="40" width="26" height="18" rx="8" fill="#ffcf3d" stroke="#fffaf0" stroke-width="3"/><rect x="54" y="40" width="26" height="18" rx="8" fill="#ffcf3d" stroke="#fffaf0" stroke-width="3"/><path d="M38 72q12 8 24 0" stroke="#fffaf0" stroke-width="5" fill="none"/>`) },
  { id: "av-esco", cat: "av", name: "Escaño", price: 600, art: shopSvg("#0f9d58", `<path d="M30 26h40v34H30z" fill="#ff4b2b" stroke="#17173d" stroke-width="4"/><path d="M22 58h56v12H22z" fill="#ff4b2b" stroke="#17173d" stroke-width="4"/><path d="M30 70v14M70 70v14" stroke="#17173d" stroke-width="5"/>`) },
  { id: "av-hemi", cat: "av", name: "Hemiciclo", price: 800, art: shopSvg("#17173d", shopHemi()) },
  { id: "av-campaneta", cat: "av", name: "Campanilla de la presidencia", price: 1200, art: shopSvg("#ffcf3d", `<path d="M50 12v8" stroke="#17173d" stroke-width="5"/><path d="M50 20c-14 0-20 12-20 26v14l-6 8h52l-6-8V46c0-14-6-26-20-26z" fill="#fffaf0" stroke="#17173d" stroke-width="4"/><circle cx="50" cy="77" r="6" fill="#17173d"/><path d="M20 30l-6-4M80 30l6-4M16 46H9M84 46h7" stroke="#ff4b2b" stroke-width="4"/>`) },

  { id: "fr-campanya", cat: "fr", name: "Cartel de campaña", price: 300 },
  { id: "fr-neo", cat: "fr", name: "Neón de plató", price: 500 },
  { id: "fr-or", cat: "fr", name: "Oro", price: 900 },
  { id: "fr-hemi", cat: "fr", name: "Hemiciclo", price: 1500 },

  { id: "ti-sofa", cat: "ti", name: "Analista de sofá", price: 150 },
  { id: "ti-tertulia", cat: "ti", name: "Tertuliano de sobremesa", price: 150 },
  { id: "ti-factcheck", cat: "ti", name: "Fact-checker", price: 250 },
  { id: "ti-enquesta", cat: "ti", name: "Cocina de encuestas", price: 350 },
  { id: "ti-spin", cat: "ti", name: "Spin doctor", price: 500 },
  { id: "ti-gabinet", cat: "ti", name: "Jefe de gabinete", price: 700 },
  { id: "ti-animal", cat: "ti", name: "Animal político", price: 1200 },
  { id: "ti-llegenda", cat: "ti", name: "Leyenda del 29N", price: 2500 },

  { id: "cf-colors", cat: "cf", name: "Mil colores", price: 200, colors: ["#ff4b2b", "#ffcf3d", "#0f9d58", "#3554ff", "#7b3fe4", "#e0306f", "#00b8d9"] },
  { id: "cf-estrelles", cat: "cf", name: "Lluvia de estrellas", price: 350, colors: ["#ffcf3d", "#fff3b0", "#ffb000"], shape: "star" },
  { id: "cf-paperetes", cat: "cf", name: "Lluvia de papeletas", price: 500, colors: ["#fffaf0", "#ffffff", "#f1e9d8"], shape: "ballot" },
  { id: "cf-or", cat: "cf", name: "Lluvia de oro", price: 800, colors: ["#f9d976", "#d4a017", "#fff3b0", "#b8860b"] },
];
const shopItem = (id) => SHOP.find((x) => x.id === id);
const shopTitle = (id) => (id && shopItem(id)?.cat === "ti" ? shopItem(id).name : "");
const shopAvatarUrl = (id) => shopItem(id)?.art || "";

const Coins = {
  shop() {
    const d = Progress.data;
    if (!d.shop || typeof d.shop !== "object") d.shop = {};
    d.shop.inv ||= {}; d.shop.eq ||= {};
    return d.shop;
  },
  earned(d = Progress.data) { return Math.floor((d.xp || 0) / COIN_XP) + COIN_ACH * Object.keys(d.ach || {}).length; },
  spent() { return Object.keys(this.shop().inv).reduce((a, id) => a + (shopItem(id)?.price || 0), 0); },
  bet() { return this.shop().bet || 0; },
  balance() { return Math.max(0, this.earned() - this.spent() - this.bet()); },
  owns(id) { return !!this.shop().inv[id]; },
  eq(cat) { const id = this.shop().eq[cat]; return id && this.owns(id) ? id : null; },
  // Monedes afegides a la Lliga de pronòstics (el que hi ha desat al servidor)
  setBet(n) {
    const s = this.shop();
    if ((s.bet || 0) === n) return;
    s.bet = n; s.betT = Date.now();
    Progress.save(); renderCoins();
  },
  buy(id) {
    const it = shopItem(id);
    if (!it || this.owns(id)) return false;
    if (this.balance() < it.price) { toast(`Te faltan ${fmt(it.price - this.balance())} monedas`); return false; }
    const s = this.shop();
    s.inv[id] = Date.now();
    Progress.save();
    window.Stats?.add("b", 1, id);
    window.Stats?.add("monGast", it.price);
    this.equip(id, true);
    Sfx.play("unlock");
    toast(`Ya es tuyo: ${it.name}`);
    return true;
  },
  equip(id, quiet = false) {
    const it = shopItem(id);
    if (!it || !this.owns(id)) return;
    const s = this.shop();
    s.eq[it.cat] = s.eq[it.cat] === id && !quiet ? null : id;
    s.eqT = Date.now();
    Progress.save();
    if (it.cat === "av" && s.eq.av) window.Online?.setPhoto?.(it.art);
    if (it.cat === "cf" && s.eq.cf) confetti(120);
    renderCoins();
  },
};

// Moneder a la barra de dalt
function renderCoins() {
  const n = $("#coin-n");
  const b = Coins.balance();
  if (n) n.textContent = fmt(b);
  const chip = $("#level-chip");
  if (chip) chip.dataset.coins = b >= 10000 ? `${Math.floor(b / 1000)}k` : fmt(b);
}

// Confeti segons la celebració que portis posada (core.js el fa servir)
function shopConfetti() {
  const id = Coins.eq("cf");
  return id ? shopItem(id) : null;
}

// Targeta del Perfil
function walletCardHtml() {
  return `<a class="card wallet-card" href="#botiga"><span class="wallet-i" aria-hidden="true">🪙</span><div><b>${fmt(Coins.balance())} monedas</b><p>Gánalas jugando y gástalas en la tienda: avatares, marcos, títulos y celebraciones.</p></div><span class="btn primary">Tienda</span></a>`;
}

// Previsualitza un article
function shopPreview(it) {
  const photo = window.Online?.myPhoto?.() || shopAvatarUrl("av-papereta");
  if (it.cat === "av") return `<img class="shop-av" src="${it.art}" alt="">`;
  if (it.cat === "fr") return `<img class="shop-av avatar fr-${it.id.slice(3)}" src="${esc(photo)}" alt="" referrerpolicy="no-referrer">`;
  if (it.cat === "ti") return `<span class="shop-ti-pv"><b>${esc(window.Online?.user ? (window.Online.profile?.handle || "Tú") : "Tú")}</b><span class="shop-ti">${esc(it.name)}</span></span>`;
  return `<span class="shop-cf">${it.colors.slice(0, 5).map((c) => `<i class="${it.shape || ""}" style="--c:${c}"></i>`).join("")}</span>`;
}

function renderBotiga() {
  const root = $("#botiga-page");
  if (!root) return;
  const bal = Coins.balance();
  const s = Coins.shop();
  const owned = Object.keys(s.inv).length;
  root.innerHTML = `
    <header class="card shop-hero">
      <div><h1 class="page-title">Tienda</h1>
        <p>Cada partida te da monedas. Gástalas en avatares, marcos, títulos y celebraciones, o añádelas a la Liga de pronósticos.</p></div>
      <div class="shop-wallet"><small>Tienes</small><b>${fmt(bal)}</b><span>monedas</span></div>
    </header>
    <section class="shop-how">
      <div><span aria-hidden="true">🎮</span><p><b>Juega</b> 1 moneda por cada 2 XP que ganas</p></div>
      <div><span aria-hidden="true">⭐</span><p><b>Logros</b> ${COIN_ACH} monedas cada uno</p></div>
      <div><span aria-hidden="true">🎟️</span><p><b>Liga de pronósticos</b> Puedes añadir monedas, además de las 1.000 fichas</p></div>
    </section>
    ${SHOP_CATS.map(([cat, title, desc]) => `
      <section class="shop-sec">
        <h2 class="section-title sm">${title}</h2><p class="muted">${desc}</p>
        <div class="shop-grid">${SHOP.filter((x) => x.cat === cat).map((it) => {
          const own = Coins.owns(it.id), on = Coins.eq(cat) === it.id, can = bal >= it.price;
          return `<div class="card shop-item ${own ? "own" : ""} ${on ? "on" : ""}">
            <div class="shop-pv">${shopPreview(it)}</div>
            <b>${esc(it.name)}</b>
            ${own ? `<button class="btn ${on ? "" : "primary"}" type="button" data-sequip="${it.id}">${on ? "✔ Puesto · quítatelo" : "Póntelo"}</button>`
              : `<button class="btn ${can ? "primary" : ""}" type="button" data-sbuy="${it.id}" ${can ? "" : "disabled"}>🪙 ${fmt(it.price)}</button>`}
            ${cat === "cf" ? `<button class="linklike" type="button" data-stry="${it.id}">Pruébalo</button>` : ""}
          </div>`;
        }).join("")}</div>
      </section>`).join("")}
    <p class="sim-fiction">Las monedas son de juego: no se pueden comprar con dinero, no tienen ningún valor y no se pueden canjear por nada. ${owned ? `Tienes ${owned} ${owned === 1 ? "artículo" : "artículos"}.` : ""}</p>`;
  $$("[data-sbuy]", root).forEach((b) => b.addEventListener("click", () => {
    const it = shopItem(b.dataset.sbuy);
    if (!confirm(`¿Quieres comprar «${it.name}» por ${fmt(it.price)} monedas?`)) return;
    if (Coins.buy(it.id)) renderBotiga();
  }));
  $$("[data-sequip]", root).forEach((b) => b.addEventListener("click", () => { Coins.equip(b.dataset.sequip); Sfx.play("pick"); renderBotiga(); }));
  $$("[data-stry]", root).forEach((b) => b.addEventListener("click", () => confetti(140, shopItem(b.dataset.stry))));
}
setTimeout(renderCoins, 0);
