// Repte diari: mecàniques noves (ordena, mapa, endevina el número i llei d'Hondt), la ratxa amb el comodí setmanal i el
// calendari, i la imatge per compartir el resultat. Les proves noves entren al repte a partir de DAILY_V2_FROM, perquè
// el repte d'un dia sigui igual per a tothom des del primer minut.

const DAILY_V2_FROM = "2026-10-28";

// ---------- Utilitats ----------
const dkFmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dkAdd = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dkFmt(new Date(y, m - 1, d + n)); };
// Dilluns de la setmana d'un dia
const dkWeek = (key) => { const [y, m, d] = key.split("-").map(Number); const t = new Date(y, m - 1, d); return dkAdd(key, -((t.getDay() + 6) % 7)); };
const fmtVotes = (n) => n.toLocaleString(typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es-ES" : "ca-ES");

// Resposta de les proves amb interacció pròpia: cada prova pinta la seva interfície dins la targeta i resol amb { correct }
function dailyPlay(ctx, card, body, onReady) {
  return new Promise((resolve) => {
    const box = h(`<div class="dmec">${body}</div>`);
    card.appendChild(box);
    let done = false;
    const finish = (correct) => { if (done || !ctx.alive()) return; done = true; Sfx.play(correct ? "ok" : "ko"); resolve({ correct }); };
    onReady(box, finish, () => done);
  });
}

// ---------- Ordena ----------
// Quatre partits per escons (de més a menys) o quatre fets per data (del més antic al més recent)
function orderItem(rng) {
  let list, prompt, how;
  if (rng() < 0.5) {
    const pool = CONGRESS[2023].parties.filter((p) => p.seats >= 5);
    for (let k = 0; k < 40; k++) { list = sample(pool, 4, rng); if (new Set(list.map((p) => p.seats)).size === 4) break; }
    list = list.map((p) => ({ t: p.name, v: p.seats, c: p.color }));
    list.sort((a, b) => b.v - a.v);
    prompt = "De més a menys escons al Congrés del 23-J";
    how = list.map((x) => `${x.t}: ${x.v}`).join(" · ");
  } else {
    for (let k = 0; k < 60; k++) { list = sample(EVENTS, 4, rng); if (new Set(list.map((e) => e.y)).size === 4) break; }
    list = list.map((e) => ({ t: e.t, v: e.y }));
    list.sort((a, b) => a.v - b.v);
    prompt = "Del més antic al més recent";
    how = list.map((x) => `${x.v}: ${x.t}`).join(" · ");
  }
  const shown = shuffle(list.map((x, rank) => ({ ...x, rank })), rng);
  return {
    label: "Ordena", kind: "order", waitKo: 2600,
    prompt: `<div class="q-text">${esc(prompt)}</div><p class="dmec-hint">Toca'ls per ordre. Si t'equivoques, torna a tocar-ne un per desfer.</p>`,
    explain: how, recapQ: `${prompt}: ${shown.map((x) => x.t).join(", ")}`, recapA: list.map((x) => x.t).join(" → "),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="ord">${shown.map((x, i) => `<button class="ord-i" data-i="${i}" ${x.c ? `style="--pc:${x.c}"` : ""}><em></em><span>${esc(x.t)}</span><small></small></button>`).join("")}</div>`, (box, finish, isDone) => {
        const picks = [];
        const btns = $$(".ord-i", box);
        const paint = () => btns.forEach((b, i) => { const p = picks.indexOf(i); b.classList.toggle("on", p >= 0); $("em", b).textContent = p >= 0 ? p + 1 : ""; });
        const check = () => {
          const ok = picks.every((i, pos) => shown[i].rank === pos);
          btns.forEach((b, i) => {
            b.disabled = true;
            const good = picks.indexOf(i) === shown[i].rank;
            b.classList.add(good ? "ok" : "ko");
            $("small", b).textContent = shown[i].c ? `${shown[i].v} escons` : String(shown[i].v);
            if (!good) $("em", b).textContent = `${picks.indexOf(i) + 1}→${shown[i].rank + 1}`;
          });
          finish(ok);
        };
        const tap = (i) => {
          if (isDone()) return;
          const p = picks.indexOf(i);
          if (p >= 0) picks.splice(p);
          else picks.push(i);
          Sfx.play("pick");
          // Amb tres triats, el quart ja és el que queda
          if (picks.length === 3) picks.push(btns.findIndex((_, k) => !picks.includes(k)));
          paint();
          if (picks.length === 4) ctx.after(220, check);
        };
        btns.forEach((b, i) => b.addEventListener("click", () => tap(i)));
        ctx.onKey((e) => { const k = "1234".indexOf(e.key); if (k >= 0) tap(k); });
      });
    },
  };
}

// ---------- Mapa ----------
// Toca una circumscripció al mapa (sense les dues més grans, que són massa fàcils)
function mapItem(rng) {
  const pool = SIM_PROVS.filter((p) => p.seats < 30);
  const target = pool[Math.floor(rng() * pool.length)];
  return {
    label: "On és?", kind: "map", waitKo: 2200,
    prompt: `<div class="q-text">Toca <b>${esc(target.name)}</b> al mapa</div>`,
    explain: `${target.name} (${target.ccaa}): ${target.seats} ${target.seats === 1 ? "escó" : "escons"}.`,
    recapQ: `On és ${target.name}?`, recapA: target.ccaa,
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="sim-mapbox dmap">${simSpainMap("dmap-svg")}</div>`, (box, finish, isDone) => {
        const svg = $(".sim-map", box);
        simMapPick(svg, (i) => {
          if (isDone()) return;
          const ok = i === target.i;
          simPaintMap(svg, (k) => (k === target.i ? { fill: "#45d483", sel: true } : k === i ? { fill: "#ff6b4a" } : {}));
          if (!ok) floatPoints(box, `${SIM_PROVS[i].name}`, true);
          finish(ok);
        });
      });
    },
  };
}

// ---------- Endevina el número ----------
// Escons d'un partit el 23-J o diputats d'una circumscripció; es dona per bo dins d'un marge
function guessItem(rng) {
  let q, v, min, max, tol, unit;
  if (rng() < 0.5) {
    const pool = CONGRESS[2023].parties.filter((p) => p.seats >= 5);
    const p = pool[Math.floor(rng() * pool.length)];
    q = `Quants escons va treure ${p.name} al Congrés el 23-J?`; v = p.seats; min = 0; max = 180; tol = Math.max(1, Math.round(v * 0.08)); unit = "escons";
  } else {
    const p = SIM_PROVS[Math.floor(rng() * SIM_PROVS.length)];
    q = `Quants diputats elegeix ${p.name} el 29N?`; v = p.seats; min = 1; max = 40; tol = 1; unit = "diputats";
  }
  const start = Math.round((min + max) / 2);
  return {
    label: "Endevina el número", kind: "guess", waitKo: 2200,
    prompt: `<div class="q-text">${esc(q)}</div><p class="dmec-hint">Val la resposta exacta o a ${tol === 1 ? "1 de distància" : `${tol} de distància`}.</p>`,
    explain: `${q} ${v}.`, recapQ: q, recapA: String(v),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="gss">
          <output class="gss-n" aria-live="polite">${start}</output>
          <input class="gss-r" type="range" min="${min}" max="${max}" value="${start}" aria-label="La teva resposta">
          <div class="gss-b">${[-10, -1, 1, 10].map((d) => `<button class="btn sm" data-d="${d}">${d > 0 ? "+" : "−"}${Math.abs(d)}</button>`).join("")}</div>
          <button class="btn primary" data-ok>Respon</button>
        </div>`, (box, finish, isDone) => {
        const r = $(".gss-r", box), out = $(".gss-n", box);
        const set = (x) => { r.value = String(Math.max(min, Math.min(max, x))); out.textContent = r.value; };
        r.addEventListener("input", () => set(Number(r.value)));
        $$("[data-d]", box).forEach((b) => b.addEventListener("click", () => set(Number(r.value) + Number(b.dataset.d))));
        const answer = () => {
          if (isDone()) return;
          const g = Number(r.value), ok = Math.abs(g - v) <= tol;
          $$("button, input", box).forEach((x) => { x.disabled = true; });
          box.insertAdjacentHTML("beforeend", `<p class="gss-res ${ok ? "ok" : "ko"}">${ok ? "Correcte" : "Massa lluny"}: són <b>${v}</b> ${unit}${g !== v ? ` (has dit ${g})` : ""}.</p>`);
          finish(ok);
        };
        $("[data-ok]", box).addEventListener("click", answer);
        ctx.onKey((e) => { if (e.key === "Enter") answer(); });
      });
    },
  };
}

// ---------- Llei d'Hondt exprés ----------
function dhondtSplit(votes, seats) {
  const q = [];
  votes.forEach((v, i) => { for (let d = 1; d <= seats; d++) q.push({ i, v: v / d }); });
  q.sort((a, b) => b.v - a.v);
  const won = votes.map(() => 0);
  q.slice(0, seats).forEach((x) => { won[x.i]++; });
  return { won, q, gap: (q[seats - 1].v - q[seats].v) / q[seats - 1].v };
}
// Tres llistes i tres o quatre escons; el repartiment ha de ser clar (sense quocients quasi empatats) i no tot per a una llista
function dhondtItem(rng) {
  const seats = rng() < 0.5 ? 3 : 4;
  let votes, r;
  for (let k = 0; k < 200; k++) {
    votes = [rng() * 40 + 25, rng() * 30 + 12, rng() * 22 + 4].map((x) => Math.round(x * 10) * 100);
    r = dhondtSplit(votes, seats);
    if (r.gap > 0.04 && Math.max(...r.won) < seats && new Set(votes).size === 3) break;
  }
  const names = ["A", "B", "C"], colors = ["#2f6fe4", "#e8401f", "#12a37f"];
  const answer = r.won.map((n, i) => `${names[i]} ${n}`).join(" · ");
  const quot = votes.map((v, i) => `${names[i]}: ${Array.from({ length: seats }, (_, d) => fmtVotes(Math.round(v / (d + 1)))).join(" / ")}`).join(" · ");
  return {
    label: "Llei d'Hondt", kind: "dhondt", waitKo: 3000,
    prompt: `<div class="q-text">Reparteix ${seats} escons entre aquestes tres llistes</div><p class="dmec-hint">Divideix els vots de cada llista entre 1, 2, 3… Els escons van als quocients més alts.</p>`,
    explain: `Quocients: ${quot}.`, recapQ: `Llei d'Hondt: ${seats} escons per a ${votes.map((v, i) => `${names[i]} (${fmtVotes(v)})`).join(", ")}`, recapA: answer,
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="dh">
          ${votes.map((v, i) => `<div class="dh-row" style="--pc:${colors[i]}"><b class="dh-n">${names[i]}</b><span class="dh-v">${fmtVotes(v)} vots</span>
            <button class="btn sm" data-m="${i}" aria-label="Treu un escó a ${names[i]}">−</button><output data-c="${i}">0</output><button class="btn sm" data-p="${i}" aria-label="Dona un escó a ${names[i]}">+</button></div>`).join("")}
          <p class="dh-left" aria-live="polite"></p>
          <button class="btn primary" data-ok disabled>Comprova</button>
        </div>`, (box, finish, isDone) => {
        const got = [0, 0, 0];
        const paint = () => {
          got.forEach((n, i) => { $(`[data-c="${i}"]`, box).textContent = n; });
          const left = seats - got.reduce((a, b) => a + b, 0);
          $(".dh-left", box).textContent = left ? `${left === 1 ? "Queda 1 escó" : `Queden ${left} escons`} per repartir` : "Tots els escons repartits";
          $("[data-ok]", box).disabled = left !== 0;
          $$("[data-p]", box).forEach((b) => { b.disabled = left === 0; });
          $$("[data-m]", box).forEach((b) => { b.disabled = got[b.dataset.m] === 0; });
        };
        $$("[data-p]", box).forEach((b) => b.addEventListener("click", () => { got[b.dataset.p]++; Sfx.play("pick"); paint(); }));
        $$("[data-m]", box).forEach((b) => b.addEventListener("click", () => { got[b.dataset.m]--; paint(); }));
        $("[data-ok]", box).addEventListener("click", () => {
          if (isDone()) return;
          const ok = got.every((n, i) => n === r.won[i]);
          $$("button", box).forEach((x) => { x.disabled = true; });
          r.won.forEach((n, i) => { const o = $(`[data-c="${i}"]`, box); o.classList.add(n === got[i] ? "ok" : "ko"); if (n !== got[i]) o.textContent = `${got[i]}→${n}`; });
          box.insertAdjacentHTML("beforeend", `<p class="gss-res ${ok ? "ok" : "ko"}">${esc(quot)}</p>`);
          finish(ok);
        });
        paint();
      });
    },
  };
}

// ---------- Ratxa i comodí setmanal ----------
// Un dia sense jugar no trenca la ratxa si encara no s'ha fet servir el comodí d'aquella setmana (de dilluns a diumenge).
const dailyFreezeFree = (d, dayKey) => !(d.frozen || []).some((k) => dkWeek(k) === dkWeek(dayKey));
// Ratxa en acabar per primer cop el repte d'un dia
function dailyStreakAfter(d, key) {
  if (d.last === key) return { streak: d.streak };
  if (d.last === dkAdd(key, -1)) return { streak: d.streak + 1 };
  const missed = dkAdd(key, -1);
  if (d.last === dkAdd(key, -2) && d.streak > 0 && dailyFreezeFree(d, missed)) return { streak: d.streak + 1, frozen: missed };
  return { streak: 1 };
}
// Ratxa vigent avui: «risk» vol dir que ahir no es va jugar i que només continua si avui es fa el repte (amb el comodí)
function dailyStreakNow(d = Progress.data.daily, key = todayKey()) {
  if (!d.last || !d.streak) return { streak: 0 };
  if (d.last === key || d.last === dkAdd(key, -1)) return { streak: d.streak, today: d.last === key };
  if (d.last === dkAdd(key, -2) && dailyFreezeFree(d, dkAdd(key, -1))) return { streak: d.streak, risk: true };
  return { streak: 0, lost: d.streak };
}
const DAILY_MILESTONES = [[3, "diari3"], [7, "diari7"], [30, "diari30"]];
function dailyNextMilestone(streak) {
  const m = DAILY_MILESTONES.find(([n]) => n > streak);
  if (!m) return "";
  const a = ACHIEVEMENTS.find((x) => x.id === m[1]);
  const left = m[0] - streak;
  return `${left === 1 ? "Et falta 1 dia" : `Et falten ${left} dies`} per a l'assoliment «${a?.name || ""}».`;
}
function dailyStreakHtml(key = todayKey()) {
  const d = Progress.data.daily, s = dailyStreakNow(d, key);
  const free = dailyFreezeFree(d, key);
  const line = s.risk ? "Ahir no vas jugar: si fas el repte avui, el comodí d'aquesta setmana salva la ratxa."
    : s.lost ? `Has perdut la ratxa de ${s.lost} ${s.lost === 1 ? "dia" : "dies"}. Avui en comença una de nova!`
      : s.streak ? dailyNextMilestone(s.streak) : "Fes el repte cada dia per fer créixer la ratxa.";
  return `<div class="dstreak ${s.risk ? "risk" : ""}">
      <span class="dstreak-f" aria-hidden="true">🔥</span><div><b>${s.streak} ${s.streak === 1 ? "dia" : "dies"} de ratxa</b><small>${line}</small></div>
      <span class="dstreak-ice ${free ? "" : "used"}" title="${free ? "Comodí disponible aquesta setmana" : "Comodí ja fet servir aquesta setmana"}">🧊 ${free ? "Comodí disponible" : "Comodí gastat"}</span>
    </div>`;
}

// ---------- Calendari del mes ----------
const DAILY_WEEKDAYS = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];
const DAILY_VOTE_DAY = "2026-11-29";
function dailyCalendar(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const d = Progress.data.daily, frozen = new Set(d.frozen || []), today = todayKey();
  const title0 = first.toLocaleDateString(typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es-ES" : "ca-ES", { month: "long", year: "numeric" });
  const title = title0.charAt(0).toUpperCase() + title0.slice(1);
  let cells = "";
  for (let k = 0; k < lead; k++) cells += `<i></i>`;
  for (let n = 1; n <= days; n++) {
    const key = dkFmt(new Date(first.getFullYear(), first.getMonth(), n));
    const r = d.scores?.[key] && typeof d.scores[key] === "object" ? d.scores[key] : null;
    const cls = [r ? (r.hits >= 8 ? "on" : "mid") : frozen.has(key) ? "ice" : "", key === today ? "today" : "", key > today ? "fut" : "", key === DAILY_VOTE_DAY ? "vote" : ""].filter(Boolean).join(" ");
    const tip = r ? `${fmtSecs(r.ms)} · ${r.hits}/10` : frozen.has(key) ? "Comodí" : key === DAILY_VOTE_DAY ? "Eleccions" : "";
    cells += `<i class="${cls}" ${tip ? `title="${tip}"` : ""}>${key === DAILY_VOTE_DAY && !r ? "🗳️" : frozen.has(key) && !r ? "🧊" : n}</i>`;
  }
  return `<div class="dcal" data-off="${offset}">
    <div class="dcal-h"><button type="button" data-cal="-1" aria-label="Mes anterior" ${offset <= -12 ? "disabled" : ""}>‹</button><b>${esc(title)}</b><button type="button" data-cal="1" aria-label="Mes següent" ${offset >= 1 ? "disabled" : ""}>›</button></div>
    <div class="dcal-g">${DAILY_WEEKDAYS.map((w) => `<b>${w}</b>`).join("")}${cells}</div>
    <p class="dcal-l"><span class="on"></span>8 o més encerts <span class="mid"></span>menys de 8 <span class="ice"></span>comodí</p>
  </div>`;
}
// Navegació entre mesos (delegada: el calendari es pot tornar a pintar sencer)
document.addEventListener("click", (e) => {
  const b = e.target.closest(".dcal [data-cal]");
  if (!b) return;
  const cal = b.closest(".dcal");
  cal.outerHTML = dailyCalendar(Number(cal.dataset.off) + Number(b.dataset.cal));
});

// ---------- Imatge per compartir ----------
function dailyShareCanvas(key, r, extra = {}) {
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const INK = "#17173d", PAPER = "#f1e9d8", CARD = "#fffaf0", YEL = "#ffcf3d";
  const display = (size, weight = 900) => `${weight} ${size}px Unbounded, "Arial Black", sans-serif`;
  const sans = (size, weight = 600) => `${weight} ${size}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, hh, rr) => { c.beginPath(); c.moveTo(x + rr, y); c.arcTo(x + w, y, x + w, y + hh, rr); c.arcTo(x + w, y + hh, x, y + hh, rr); c.arcTo(x, y + hh, x, y, rr); c.arcTo(x, y, x + w, y, rr); c.closePath(); };
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(23,23,61,.08)";
  for (let x = 6; x < W; x += 18) for (let y = 6; y < H; y += 18) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = INK; c.fillRect(0, 0, W, 150);
  c.fillStyle = YEL; c.font = display(46); c.textAlign = "left"; c.fillText(`REPTE DIARI #${dailyNumber(key)}`, 60, 95);
  const [y, m, dd] = key.split("-").map(Number);
  c.fillStyle = CARD; c.font = sans(30, 700); c.textAlign = "right";
  c.fillText(new Date(y, m - 1, dd).toLocaleDateString(typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es-ES" : "ca-ES", { day: "numeric", month: "long" }), W - 60, 93);
  // Targeta
  c.fillStyle = INK; round(72, 222, W - 132, 900, 40); c.fill();
  c.fillStyle = CARD; round(60, 210, W - 132, 900, 40); c.fill();
  c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
  c.textAlign = "center"; c.fillStyle = "#6e6a82"; c.font = sans(34, 700); c.fillText("Temps", W / 2 - 6, 320);
  c.fillStyle = INK; c.font = display(170); c.fillText(fmtTime(r.ms), W / 2 - 6, 500);
  c.font = sans(40, 700); c.fillStyle = "#3a3a63";
  c.fillText(`${r.hits}/10 encerts · ${r.errors} ${r.errors === 1 ? "error" : "errors"}`, W / 2 - 6, 580);
  // Quadres de la graella
  const cells = (r.grid || "").match(/🟩|🟥/g) || [];
  const sz = 70, gap = 14, x0 = W / 2 - 6 - (cells.length * (sz + gap) - gap) / 2;
  cells.forEach((g, i) => { c.fillStyle = g === "🟩" ? "#45d483" : "#ff6b4a"; round(x0 + i * (sz + gap), 640, sz, sz, 14); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); });
  // Ratxa i percentil
  c.font = display(54); c.fillStyle = INK;
  if (extra.streak) c.fillText(`🔥 ${extra.streak} ${extra.streak === 1 ? "dia" : "dies"} de ratxa`, W / 2 - 6, 850);
  if (extra.pct !== null && extra.pct !== undefined) { c.font = sans(40, 700); c.fillStyle = "#3a3a63"; c.fillText(`Més ràpid que el ${extra.pct} % de la gent`, W / 2 - 6, 930); }
  c.font = sans(34, 600); c.fillStyle = "#6e6a82"; c.fillText("I tu, quant hi tardes?", W / 2 - 6, 1040);
  // Peu
  c.fillStyle = INK; c.font = display(40); c.fillText("Política en Joc", W / 2, 1230);
  c.font = sans(30, 600); c.fillStyle = "#3a3a63"; c.fillText(location.host || "politicaenjoc.cat", W / 2, 1280);
  return cv;
}
async function shareDailyImage(key) {
  const r = dailyResult(key);
  if (!r) return;
  const streak = dailyStreakNow().streak;
  const pct = window.Online?.dailySocial?.[key]?.pct ?? null;
  const cv = dailyShareCanvas(key, r, { streak, pct });
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  const file = blob && new File([blob], `repte-${dailyNumber(key)}.png`, { type: "image/png" });
  const text = dailyShareText(key, r);
  try {
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `repte-${dailyNumber(key)}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Imatge descarregada");
}

// =========================================================
// Repte diari, tercera tanda de proves (a partir de DAILY_V3_FROM): silueta de província, aritmètica del Congrés,
// parelles de sigles, l'intrús i completa la frase. Cada dia en surten cinc d'especials, triades a l'atzar.
// =========================================================
const DAILY_V3_FROM = "2026-10-29";

// ---------- Silueta: quina província és? ----------
function shapeItem(rng) {
  const pool = SIM_PROVS.filter((p) => !["CE", "ML"].includes(p.code));
  const target = pool[Math.floor(rng() * pool.length)];
  const others = sample(pool.filter((p) => p !== target), 3, rng);
  const { options, correctIndex } = prepOptions([target, ...others].map((p) => p.name), rng);
  // Contorn retallat a la seva caixa (els camins del mapa són coordenades absolutes)
  const d = SIM_MAP.provs[target.code].d;
  const nums = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, hh = Math.max(...ys) - y0;
  const pad = Math.max(w, hh) * 0.08;
  return {
    label: "Silueta", columns: 2,
    prompt: `<div class="q-text">Quina província té aquesta forma?</div><div class="dshape"><svg viewBox="${x0 - pad} ${y0 - pad} ${w + pad * 2} ${hh + pad * 2}" role="img" aria-label="Contorn d'una província"><path d="${d}"/></svg></div>`,
    options, correctIndex,
    explain: `És ${target.name} (${target.ccaa}).`, recapQ: `Silueta de ${target.name}`, recapA: target.name,
  };
}

// ---------- Aritmètica del Congrés: fes 176 amb condicions ----------
// Amb els escons del 23-J: cal incloure un partit, no se'n poden fer servir uns altres i no es poden passar d'un
// nombre de partits (el mínim possible, calculat aquí). És aritmètica, no cap pronòstic de pactes.
function coalitionItem(rng) {
  const parties = CONGRESS[2023].parties;
  const by = (id) => parties.find((p) => p.id === id);
  const PLANS = [
    { req: "psoe", no: ["pp", "vox"] }, { req: "psoe", no: ["pp"] }, { req: "pp", no: ["psoe"] }, { req: "pp", no: ["psoe", "vox"] },
    { req: "psoe", no: ["pp", "vox", "junts"] }, { req: "pp", no: ["psoe", "sumar"] }, { req: "sumar", no: ["pp", "psoe"] },
  ];
  const plan = PLANS[Math.floor(rng() * PLANS.length)];
  const pool = parties.filter((p) => !plan.no.includes(p.id) && p.id !== plan.req);
  // Mínim de partits per arribar a 176 (amb el que és obligatori)
  let best = Infinity;
  for (let m = 0; m < 1 << pool.length; m++) {
    let sum = by(plan.req).seats, n = 1;
    pool.forEach((p, i) => { if (m & (1 << i)) { sum += p.seats; n++; } });
    if (sum >= 176 && n < best) best = n;
  }
  if (!Number.isFinite(best)) return coalitionItem(rng);
  const shown = shuffle(parties.map((p) => ({ ...p })), rng);
  const names = (ids) => ids.map((id) => by(id).name).join(" ni ");
  return {
    label: "Aritmètica del Congrés", kind: "coalition", waitKo: 2600,
    prompt: `<div class="q-text">Arriba a 176 escons amb ${by(plan.req).name}, sense ${names(plan.no)} i amb ${best} partits com a màxim</div><p class="dmec-hint">Escons del Congrés del 23-J. Toca els partits per sumar-los.</p>`,
    explain: `Hi ha combinacions de ${best} partits que hi arriben. És només aritmètica: no diu res de quins pactes són possibles.`,
    recapQ: `176 amb ${by(plan.req).name}, sense ${names(plan.no)}, màxim ${best} partits`, recapA: `${best} partits`,
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="coal">
          <div class="coal-chips">${shown.map((p, i) => `<button class="coal-p" data-i="${i}" style="--pc:${p.color}" ${plan.no.includes(p.id) ? "disabled" : ""} aria-pressed="${p.id === plan.req}"><b>${esc(p.name)}</b><small>${p.seats}</small></button>`).join("")}</div>
          <div class="coal-bar"><i></i><u aria-hidden="true"></u></div>
          <p class="coal-sum" aria-live="polite"></p>
          <button class="btn primary" data-ok>Comprova</button>
        </div>`, (box, finish, isDone) => {
        const on = new Set([shown.findIndex((p) => p.id === plan.req)]);
        const paint = () => {
          const sum = [...on].reduce((t, i) => t + shown[i].seats, 0);
          $$(".coal-p", box).forEach((b, i) => { b.classList.toggle("on", on.has(i)); b.setAttribute("aria-pressed", on.has(i)); });
          $(".coal-bar i", box).style.width = `${Math.min(100, (sum / 350) * 100)}%`;
          $(".coal-sum", box).innerHTML = `<b>${sum}</b> escons · ${on.size} ${on.size === 1 ? "partit" : "partits"} de ${best} com a màxim`;
          $(".coal-sum", box).classList.toggle("ok", sum >= 176 && on.size <= best);
        };
        $$(".coal-p", box).forEach((b, i) => b.addEventListener("click", () => {
          if (isDone() || shown[i].id === plan.req) return;
          if (on.has(i)) on.delete(i); else on.add(i);
          Sfx.play("pick"); paint();
        }));
        $("[data-ok]", box).addEventListener("click", () => {
          if (isDone()) return;
          const sum = [...on].reduce((t, i) => t + shown[i].seats, 0);
          const ok = sum >= 176 && on.size <= best;
          $$("button", box).forEach((x) => { x.disabled = true; });
          box.insertAdjacentHTML("beforeend", `<p class="gss-res ${ok ? "ok" : "ko"}">${ok ? "Majoria absoluta" : sum < 176 ? `Et falten ${176 - sum} escons` : `Hi arribes, però amb massa partits (${on.size})`}.</p>`);
          finish(ok);
        });
        paint();
      });
    },
  };
}

// ---------- Parelles: cada sigla amb el seu nom ----------
function pairsItem(rng, key) {
  const pool = ACRONYMS.filter((x) => !x.since || x.since <= key);
  const set = sample(pool, 4, rng);
  const right = shuffle(set.map((x, i) => ({ t: x.a, i })), rng);
  return {
    label: "Parelles", kind: "pairs", waitKo: 2600,
    prompt: `<div class="q-text">Uneix cada sigla amb el seu nom</div><p class="dmec-hint">Toca una sigla i després el nom que li correspon.</p>`,
    explain: set.map((x) => `${x.s}: ${x.a}`).join(" · "), recapQ: `Parelles: ${set.map((x) => x.s).join(", ")}`, recapA: set.map((x) => `${x.s} = ${x.a}`).join(" · "),
    play(ctx, card) {
      const colors = ["#2f6fe4", "#e8401f", "#12a37f", "#8a4fd6"];
      return dailyPlay(ctx, card, `<div class="prs">
          <div class="prs-c">${set.map((x, i) => `<button class="prs-l" data-l="${i}"><b>${esc(x.s)}</b></button>`).join("")}</div>
          <div class="prs-c">${right.map((x, j) => `<button class="prs-r" data-r="${j}">${esc(x.t)}</button>`).join("")}</div>
        </div>`, (box, finish, isDone) => {
        let sel = 0;
        const link = new Map(); // sigla (esquerra) → nom (dreta)
        const paint = () => {
          $$(".prs-l", box).forEach((b, i) => { b.style.setProperty("--pc", link.has(i) || sel === i ? colors[i] : "transparent"); b.classList.toggle("on", sel === i); b.classList.toggle("set", link.has(i)); });
          $$(".prs-r", box).forEach((b, j) => { const l = [...link].find(([, r]) => r === j); b.style.setProperty("--pc", l ? colors[l[0]] : "transparent"); b.classList.toggle("set", !!l); });
        };
        const check = () => {
          const ok = set.every((_, i) => right[link.get(i)].i === i);
          $$("button", box).forEach((x) => { x.disabled = true; });
          $$(".prs-r", box).forEach((b, j) => { const l = [...link].find(([, r]) => r === j); b.classList.add(l && right[j].i === l[0] ? "ok" : "ko"); });
          finish(ok);
        };
        $$(".prs-l", box).forEach((b, i) => b.addEventListener("click", () => { if (isDone()) return; sel = i; Sfx.play("pick"); paint(); }));
        $$(".prs-r", box).forEach((b, j) => b.addEventListener("click", () => {
          if (isDone() || sel === null) return;
          [...link].forEach(([l, r]) => { if (r === j) link.delete(l); });
          link.set(sel, j);
          const next = set.findIndex((_, i) => !link.has(i));
          sel = next < 0 ? null : next;
          Sfx.play("pick"); paint();
          if (link.size === set.length) ctx.after(250, check);
        }));
        paint();
      });
    },
  };
}

// ---------- L'intrús ----------
function oddItem(rng) {
  if (rng() < 0.6) {
    // Tres circumscripcions d'una comunitat i una d'una altra
    const by = {};
    SIM_PROVS.forEach((p) => { (by[p.ccaa] = by[p.ccaa] || []).push(p); });
    const big = Object.keys(by).filter((k) => by[k].length >= 3);
    const cc = big[Math.floor(rng() * big.length)];
    const ins = sample(by[cc], 3, rng);
    const out = sample(SIM_PROVS.filter((p) => p.ccaa !== cc && !["CE", "ML"].includes(p.code)), 1, rng)[0];
    const { options, correctIndex } = prepOptions([out.name, ...ins.map((p) => p.name)], rng);
    return { label: "L'intrús", columns: 2, prompt: `<div class="q-text">Quina d'aquestes províncies NO és de ${esc(cc)}?</div>`,
      options, correctIndex, explain: `${out.name} és de ${out.ccaa}.`, recapQ: `L'intrús (${cc}): ${[out, ...ins].map((p) => p.name).join(", ")}`, recapA: out.name };
  }
  // Els partits que van votar sí a la investidura de Pedro Sánchez del novembre del 2023
  const yes = ["PSOE", "Sumar", "ERC", "Junts", "EH Bildu", "PNV", "BNG", "CC"], no = ["PP", "Vox", "UPN"];
  const ins = sample(yes, 3, rng), out = no[Math.floor(rng() * no.length)];
  const { options, correctIndex } = prepOptions([out, ...ins], rng);
  return { label: "L'intrús", columns: 2, prompt: `<div class="q-text">Quin d'aquests partits NO va votar sí a la investidura de Pedro Sánchez del novembre del 2023?</div>`,
    options, correctIndex, explain: "Van votar sí PSOE, Sumar, ERC, Junts, EH Bildu, PNV, BNG i CC (179 vots). PP, Vox i UPN hi van votar en contra.",
    recapQ: `Investidura del 2023: ${[out, ...ins].join(", ")}`, recapA: out };
}

// ---------- Completa la frase ----------
function fillItem(rng) {
  const words = (t) => t.match(/[\p{L}·'’-]{5,}/gu) || [];
  let q, w;
  for (let k = 0; k < 40 && !w; k++) {
    q = QUOTES[Math.floor(rng() * QUOTES.length)];
    const ws = words(q.q).filter((x, i, a) => a.indexOf(x) === i);
    if (q.q.length <= 140 && ws.length >= 2) w = ws[1 + Math.floor(rng() * (ws.length - 1))];
  }
  const pool = [...new Set(QUOTES.filter((x) => x !== q).flatMap((x) => words(x.q)))].filter((x) => x.toLowerCase() !== w.toLowerCase() && Math.abs(x.length - w.length) <= 3);
  const cap = w[0] === w[0].toUpperCase();
  const dis = sample(pool, 3, rng).map((x) => (cap ? x.charAt(0).toUpperCase() + x.slice(1) : x.toLowerCase()));
  const { options, correctIndex } = prepOptions([w, ...dis], rng);
  const blank = q.q.replace(w, "_____");
  return { label: "Completa la frase", columns: 2,
    prompt: `<blockquote class="q-quote">${esc(blank)}</blockquote><p class="dmec-hint">${esc(q.a)}${q.y ? `, ${q.y}` : ""}</p>`,
    options, correctIndex, explain: `${q.a}: «${q.q}»`, recapQ: blank, recapA: w };
}

// Proves especials del dia: cinc de les nou, triades amb la data (les mateixes a les tres partides i per a tothom)
function dailySpecials(key) {
  const all = [orderItem, mapItem, guessItem, dhondtItem, shapeItem, coalitionItem, (rng) => pairsItem(rng, key), oddItem, fillItem];
  return sample(all, 5, seededRng(hashString(`daily-mix-${key}`)));
}
