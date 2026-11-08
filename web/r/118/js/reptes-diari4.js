// Repte diari, quarta tanda (a partir de DAILY_V4_FROM, content-diari.js). Fora «Aritmètica del Congrés» (obligava a fer
// pactes impossibles). «Parelles» ja no uneix sigles amb el seu nom (amb les inicials ja es veu), sinó coses que cal saber.
// Dinàmiques noves: troba l'error, classifica, quines eleccions són?, la llei d'Hondt i pinta la comunitat al mapa.
// Els bancs del repte creixen sense tocar els antics, perquè els reptes de dies passats es mantinguin iguals.

// Una pregunta de quatre opcions a partir de fragments ja preparats
function dailyChoice(label, prompt, right, wrong, rng, explain, recapQ, columns = 2) {
  const { options, correctIndex } = prepOptions([right, ...wrong], rng);
  return { label, prompt, options, correctIndex, columns, explain, recapQ, recapA: right };
}

// ---------- Parelles, reformulada ----------
function pairs4Item(rng) {
  const pick = (arr, n) => sample(arr, n, rng);
  const SETS = [
    () => ({ q: "Què fa cada organisme?", hint: "Toca una sigla i després la seva funció.", list: pick(DAILY_ORGANS, 4) }),
    () => ({ q: "Quin candidat presenta cada partit el 29N?", hint: "Toca un partit i després el seu candidat.", list: pick(DAILY_CANDIDATES, 4) }),
    () => ({ q: "Quan va governar cada president?", hint: "Toca un president i després els seus anys.", list: pick(DAILY_PRESIDENTS, 4) }),
    () => ({ q: "Quan va presidir la Generalitat?", hint: "Toca un president i després els seus anys.", list: pick(DAILY_GENERALITAT, 4) }),
    () => ({ q: "Quina és la capital de cada comunitat?", hint: "Toca una comunitat i després la seva capital.", list: pick(DAILY_CAPITALS.filter(([a, b]) => a !== b), 4) }),
    () => ({ q: "De què tracta cada article de la Constitució?", hint: "Toca un article i després el seu contingut.", list: pick(ARTICLES.filter((a) => a.t.length <= 70), 4).map((a) => [`Art. ${a.n}`, a.t]) }),
  ];
  const { q, hint, list } = SETS[Math.floor(rng() * SETS.length)]();
  const right = shuffle(list.map(([, t], i) => ({ t, i })), rng);
  return {
    label: "Parelles", kind: "pairs", waitKo: 2800,
    prompt: `<div class="q-text">${esc(q)}</div><p class="dmec-hint">${esc(hint)}</p>`,
    explain: list.map(([a, b]) => `${a}: ${b}`).join(" · "), recapQ: `${q} ${list.map(([a]) => a).join(", ")}`, recapA: list.map(([a, b]) => `${a} = ${b}`).join(" · "),
    play(ctx, card) {
      const colors = ["#2f6fe4", "#e8401f", "#12a37f", "#8a4fd6"];
      return dailyPlay(ctx, card, `<div class="prs">
          <div class="prs-c">${list.map(([a], i) => `<button class="prs-l" data-l="${i}"><b>${esc(a)}</b></button>`).join("")}</div>
          <div class="prs-c">${right.map((x, j) => `<button class="prs-r" data-r="${j}">${esc(x.t)}</button>`).join("")}</div>
        </div>`, (box, finish, isDone) => {
        let sel = 0;
        const link = new Map();
        const paint = () => {
          $$(".prs-l", box).forEach((b, i) => { b.style.setProperty("--pc", link.has(i) || sel === i ? colors[i] : "transparent"); b.classList.toggle("on", sel === i); b.classList.toggle("set", link.has(i)); });
          $$(".prs-r", box).forEach((b, j) => { const l = [...link].find(([, r]) => r === j); b.style.setProperty("--pc", l ? colors[l[0]] : "transparent"); b.classList.toggle("set", !!l); });
        };
        const check = () => {
          const ok = list.every((_, i) => right[link.get(i)].i === i);
          $$("button", box).forEach((x) => { x.disabled = true; });
          $$(".prs-r", box).forEach((b, j) => { const l = [...link].find(([, r]) => r === j); b.classList.add(l && right[j].i === l[0] ? "ok" : "ko"); });
          finish(ok);
        };
        $$(".prs-l", box).forEach((b, i) => b.addEventListener("click", () => { if (isDone()) return; sel = i; Sfx.play("pick"); paint(); }));
        $$(".prs-r", box).forEach((b, j) => b.addEventListener("click", () => {
          if (isDone() || sel === null) return;
          [...link].forEach(([l, r]) => { if (r === j) link.delete(l); });
          link.set(sel, j);
          const next = list.findIndex((_, i) => !link.has(i));
          sel = next < 0 ? null : next;
          Sfx.play("pick"); paint();
          if (link.size === list.length) ctx.after(250, check);
        }));
        paint();
      });
    },
  };
}

// ---------- Troba l'error ----------
// {tros} es pot tocar i és cert; {fals=>cert} és el que s'ha de trobar
function errorItem(rng) {
  const errs = noSeats(DAILY_ERRORS);
  const raw = errs[Math.floor(rng() * errs.length)];
  const wrong = raw.match(/\{([^{}]*)=>([^{}]*)\}/);
  const parts = raw.split(/(\{[^{}]*\})/).filter(Boolean);
  const fixed = raw.replace(/\{([^{}=]*)=>([^{}]*)\}/g, "$2").replace(/[{}]/g, "");
  const shown = raw.replace(/\{([^{}=]*)=>[^{}]*\}/g, "$1").replace(/[{}]/g, "");
  return {
    label: "Troba l'error", kind: "error", waitKo: 2600,
    prompt: `<div class="q-text small">Toca el tros de la frase que és fals</div>`,
    explain: fixed, recapQ: shown, recapA: `${wrong[1]} → ${wrong[2]}`,
    play(ctx, card) {
      const html = parts.map((p) => {
        const m = p.match(/^\{([^{}]*)\}$/);
        if (!m) return esc(p);
        const [txt, fix] = m[1].split("=>");
        return `<button class="ferr-t" type="button" ${fix ? `data-bad="1"` : ""}>${esc(txt)}</button>`;
      }).join("");
      return dailyPlay(ctx, card, `<p class="ferr">${html}</p>`, (box, finish, isDone) => {
        const bs = $$(".ferr-t", box);
        bs.forEach((b) => b.addEventListener("click", () => {
          if (isDone()) return;
          const ok = !!b.dataset.bad;
          bs.forEach((x) => { x.disabled = true; if (x.dataset.bad) x.classList.add("bad"); });
          if (!ok) b.classList.add("ko");
          box.insertAdjacentHTML("beforeend", `<p class="gss-res ${ok ? "ok" : "ko"}">El correcte és <b>${esc(wrong[2])}</b>, no «${esc(wrong[1])}».</p>`);
          finish(ok);
        }));
      });
    },
  };
}

// ---------- Classifica: sis targetes, una a una, a una de les dues columnes ----------
function sortItem(rng) {
  const s = DAILY_SORTS[Math.floor(rng() * DAILY_SORTS.length)];
  const n = 3;
  const cards = shuffle([...sample(s.A, Math.min(n, s.A.length), rng).map((t) => ({ t, side: 0 })), ...sample(s.B, Math.min(n, s.B.length), rng).map((t) => ({ t, side: 1 }))], rng);
  const names = [s.a, s.b];
  return {
    label: "Classifica", kind: "sort", waitKo: 2800,
    prompt: `<div class="q-text">${esc(s.q)}</div><p class="dmec-hint">Porta cada targeta a la seva columna. Cal encertar-les totes.</p>`,
    explain: s.exp, recapQ: `${s.q} ${cards.map((c) => c.t).join(", ")}`, recapA: names.map((nm, i) => `${nm}: ${cards.filter((c) => c.side === i).map((c) => c.t).join(", ")}`).join(" · "),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="srt">
          <div class="srt-card" aria-live="polite"></div>
          <div class="srt-b"><button class="btn" data-s="0">← ${esc(names[0])}</button><button class="btn" data-s="1">${esc(names[1])} →</button></div>
          <div class="srt-cols"><div class="srt-col"><b>${esc(names[0])}</b><ul data-col="0"></ul></div><div class="srt-col"><b>${esc(names[1])}</b><ul data-col="1"></ul></div></div>
        </div>`, (box, finish, isDone) => {
        let k = 0, fails = 0;
        const show = () => { $(".srt-card", box).textContent = cards[k].t; };
        const put = (side) => {
          if (isDone() || k >= cards.length) return;
          const c = cards[k], good = c.side === side;
          if (!good) fails++;
          Sfx.play(good ? "pick" : "ko");
          $(`[data-col="${c.side}"]`, box).insertAdjacentHTML("beforeend", `<li class="${good ? "ok" : "ko"}">${esc(c.t)}</li>`);
          k++;
          if (k < cards.length) return show();
          $$("button", box).forEach((b) => { b.disabled = true; });
          $(".srt-card", box).textContent = fails ? `${cards.length - fails} de ${cards.length}` : "Totes bé!";
          finish(!fails);
        };
        $$("[data-s]", box).forEach((b) => b.addEventListener("click", () => put(Number(b.dataset.s))));
        ctx.onKey((e) => { if (e.key === "ArrowLeft") put(0); if (e.key === "ArrowRight") put(1); });
        show();
      });
    },
  };
}

// ---------- Quines eleccions són? ----------
function resultItem(rng) {
  const i = Math.floor(rng() * DAILY_RESULTS.length);
  const [y, rows] = DAILY_RESULTS[i];
  // Les altres opcions, de les eleccions més properes en el temps: així no n'hi ha prou amb saber qui guanyava
  const near = DAILY_RESULTS.map((r, k) => ({ y: r[0], d: Math.abs(k - i) })).filter((r) => r.d > 0).sort((a, b) => a.d - b.d).slice(0, 5);
  const wrong = sample(near, 3, rng).map((r) => r.y);
  const max = rows[0][1];
  const chart = `<div class="relx">${rows.map(([p, n, c]) => `<div class="relx-r"><span>${esc(p)}</span><i style="--w:${(n / max) * 100}%;--c:${c}"></i><b>${n}</b></div>`).join("")}</div>`;
  return dailyChoice("Quines eleccions són?", `<div class="q-text">Quines eleccions generals van donar aquest resultat?</div>${chart}`, y, wrong, rng,
    `Són les eleccions del ${y}: ${rows.map(([p, n]) => `${p} ${n}`).join(", ")}.`, `Resultat: ${rows.map(([p, n]) => `${p} ${n}`).join(", ")}`);
}

// ---------- La llei d'Hondt ----------
function dhondtSeats(votes, seats) {
  const got = votes.map(() => 0);
  for (let s = 0; s < seats; s++) {
    let best = 0, bq = -1;
    votes.forEach((v, i) => { const q = v / (got[i] + 1); if (q > bq) { bq = q; best = i; } });
    got[best]++;
  }
  return got;
}
function dhondtItem(rng) {
  let votes, seats, res;
  // Repartiments sense empats: els quocients són tots diferents
  for (let k = 0; k < 40; k++) {
    seats = 3 + Math.floor(rng() * 4);
    votes = [40 + Math.floor(rng() * 50), 20 + Math.floor(rng() * 35), 8 + Math.floor(rng() * 25)].map((v) => v * 1000);
    const qs = votes.flatMap((v) => [...Array(seats)].map((_, d) => v / (d + 1)));
    if (new Set(qs.map((q) => Math.round(q))).size === qs.length) { res = dhondtSeats(votes, seats); break; }
  }
  res = res || dhondtSeats(votes, seats);
  const names = ["A", "B", "C"], ask = Math.floor(rng() * 2); // S'hi pregunta pel primer o pel segon partit
  const right = res[ask];
  const wrong = [...new Set([right - 1, right + 1, right + 2, right - 2].filter((n) => n >= 0 && n <= seats))].slice(0, 3);
  const { options, correctIndex } = prepOptions([right, ...wrong].map((n) => `${n} ${n === 1 ? "escó" : "escons"}`), rng);
  return {
    label: "La llei d'Hondt", columns: 2, options, correctIndex,
    prompt: `<div class="q-text">Es reparteixen ${seats} escons. Quants en treu el partit ${names[ask]}?</div><div class="dh">${votes.map((v, i) => `<div class="${i === ask ? "on" : ""}"><b>${names[i]}</b><span>${fmtVotes(v)} vots</span></div>`).join("")}</div><p class="dmec-hint">Es divideixen els vots de cada partit per 1, 2, 3… i els escons van als quocients més alts.</p>`,
    explain: `Resultat: ${names.map((n, i) => `${n} ${res[i]}`).join(", ")}. El sistema afavoreix els partits grans.`,
    recapQ: `Hondt, ${seats} escons: ${votes.map((v, i) => `${names[i]} ${fmtVotes(v)}`).join(", ")}`, recapA: `${names[ask]}: ${right}`,
  };
}

// ---------- Pinta la comunitat al mapa: toca totes les seves províncies ----------
function ccaaMapItem(rng) {
  const by = {};
  SIM_PROVS.forEach((p) => { (by[p.ccaa] = by[p.ccaa] || []).push(p); });
  const list = Object.keys(by).filter((k) => by[k].length >= 2 && by[k].length <= 9 && k !== "Canàries");
  const cc = list[Math.floor(rng() * list.length)], goal = by[cc];
  return {
    label: "Pinta la comunitat", kind: "ccaamap", waitKo: 2200,
    prompt: `<div class="q-text">Toca al mapa les ${goal.length} províncies de <b>${esc(cc)}</b></div><p class="dmec-hint">Un error i s'acaba la prova.</p>`,
    explain: `${cc}: ${goal.map((p) => p.name).join(", ")}.`, recapQ: `Províncies de ${cc}`, recapA: goal.map((p) => p.name).join(", "),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="sim-mapbox dmap">${simSpainMap("dmap-svg")}</div>`, (box, finish, isDone) => {
        const svg = $(".sim-map", box), done = new Set();
        const paint = (bad) => simPaintMap(svg, (k) => (done.has(k) ? { fill: "#45d483", sel: true } : k === bad ? { fill: "#ff6b4a" } : {}));
        simMapPick(svg, (i) => {
          if (isDone()) return;
          if (done.has(i)) return;
          if (goal.some((p) => p.i === i)) {
            done.add(i); Sfx.play("pick"); paint();
            if (done.size === goal.length) finish(true);
            return;
          }
          goal.forEach((p) => done.add(p.i)); paint(i);
          floatPoints(box, SIM_PROVS[i].name, true);
          finish(false);
        });
      });
    },
  };
}

// ---------- Les proves d'abans, amb els bancs nous ----------
function order4Item(rng) {
  let roll = rng();
  // Des de DAILY_NOSEATS_FROM, sense ordenar partits per escons ni províncies per diputats
  if (dailyNoSeats && roll < 0.5) roll += 0.5;
  if (roll < 0.25) return orderItem(rng);
  const rank = (a, b) => a.v - b.v;
  let list, prompt, how;
  if (roll < 0.5) {
    const pool = PROVINCES.filter((p) => p.seats >= 3);
    for (let k = 0; k < 40; k++) { list = sample(pool, 4, rng); if (new Set(list.map((p) => p.seats)).size === 4) break; }
    list = list.map((p) => ({ t: p.name, v: p.seats })).sort((a, b) => b.v - a.v);
    prompt = "De més a menys diputats el 29N"; how = list.map((x) => `${x.t}: ${x.v}`).join(" · ");
  } else if (roll < 0.7) {
    list = sample(DAILY_PRESIDENTS, 4, rng).map(([t, y], i) => ({ t, v: DAILY_PRESIDENTS.findIndex((p) => p[0] === t) + i * 0, y })).sort(rank);
    prompt = "Del primer al més recent president del Govern"; how = list.map((x) => `${x.t}: ${x.y}`).join(" · ");
  } else if (roll < 0.85) {
    list = sample(DAILY_GENERALITAT, 4, rng).map(([t, y]) => ({ t, v: DAILY_GENERALITAT.findIndex((p) => p[0] === t), y })).sort(rank);
    prompt = "Del primer al més recent president de la Generalitat"; how = list.map((x) => `${x.t}: ${x.y}`).join(" · ");
  } else {
    const ev = EVENTS.filter((e) => !e.since || e.since <= DAILY_V4_FROM);
    for (let k = 0; k < 60; k++) { list = sample(ev, 4, rng); if (new Set(list.map((e) => e.y)).size === 4) break; }
    list = list.map((e) => ({ t: e.t, v: e.y })).sort(rank);
    prompt = "Del més antic al més recent"; how = list.map((x) => `${x.v}: ${x.t}`).join(" · ");
  }
  const shown = shuffle(list.map((x, r) => ({ ...x, rank: r })), rng);
  return {
    label: "Ordena", kind: "order", waitKo: 2600,
    prompt: `<div class="q-text">${esc(prompt)}</div><p class="dmec-hint">Toca'ls per ordre. Si t'equivoques, torna a tocar-ne un per desfer.</p>`,
    explain: how, recapQ: `${prompt}: ${shown.map((x) => x.t).join(", ")}`, recapA: list.map((x) => x.t).join(" → "),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="ord">${shown.map((x, i) => `<button class="ord-i" data-i="${i}"><em></em><span>${esc(x.t)}</span><small></small></button>`).join("")}</div>`, (box, finish, isDone) => {
        const picks = [], btns = $$(".ord-i", box);
        const paint = () => btns.forEach((b, i) => { const p = picks.indexOf(i); b.classList.toggle("on", p >= 0); $("em", b).textContent = p >= 0 ? p + 1 : ""; });
        const check = () => {
          const ok = picks.every((i, pos) => shown[i].rank === pos);
          btns.forEach((b, i) => {
            b.disabled = true;
            const good = picks.indexOf(i) === shown[i].rank;
            b.classList.add(good ? "ok" : "ko");
            $("small", b).textContent = shown[i].y || String(shown[i].v);
            if (!good) $("em", b).textContent = `${picks.indexOf(i) + 1}→${shown[i].rank + 1}`;
          });
          finish(ok);
        };
        const tap = (i) => {
          if (isDone()) return;
          const p = picks.indexOf(i);
          if (p >= 0) picks.splice(p); else picks.push(i);
          Sfx.play("pick");
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
function guess4Item(rng) {
  if (!dailyNoSeats && rng() < 0.3) return guessItem(rng);
  const nums = noSeats(DAILY_NUMBERS, (n) => n.q);
  const x = nums[Math.floor(rng() * nums.length)];
  const start = Math.round((x.min + x.max) / 2);
  const tolTxt = x.tol ? `Val la resposta exacta o a ${x.tol} de distància.` : "Ha de ser la xifra exacta.";
  return {
    label: "Endevina el número", kind: "guess", waitKo: 2200,
    prompt: `<div class="q-text">${esc(x.q)}</div><p class="dmec-hint">${esc(tolTxt)}</p>`,
    explain: `${x.q} ${x.v}. ${x.d}`, recapQ: x.q, recapA: String(x.v),
    play(ctx, card) {
      return dailyPlay(ctx, card, `<div class="gss">
          <output class="gss-n" aria-live="polite">${start}</output>
          <input class="gss-r" type="range" min="${x.min}" max="${x.max}" value="${start}" aria-label="La teva resposta">
          <div class="gss-b">${[-10, -1, 1, 10].map((d) => `<button class="btn sm" data-d="${d}">${d > 0 ? "+" : "−"}${Math.abs(d)}</button>`).join("")}</div>
          <button class="btn primary" data-ok>Respon</button>
        </div>`, (box, finish, isDone) => {
        const r = $(".gss-r", box), out = $(".gss-n", box);
        const set = (n) => { r.value = String(Math.max(x.min, Math.min(x.max, n))); out.textContent = r.value; };
        r.addEventListener("input", () => set(Number(r.value)));
        $$("[data-d]", box).forEach((b) => b.addEventListener("click", () => set(Number(r.value) + Number(b.dataset.d))));
        const answer = () => {
          if (isDone()) return;
          const g = Number(r.value), ok = Math.abs(g - x.v) <= x.tol;
          $$("button, input", box).forEach((b) => { b.disabled = true; });
          box.insertAdjacentHTML("beforeend", `<p class="gss-res ${ok ? "ok" : "ko"}">${ok ? "Correcte" : "Massa lluny"}: és <b>${x.v}</b>${x.u ? ` ${esc(x.u)}` : ""}${g !== x.v ? ` (has dit ${g})` : ""}.</p>`);
          finish(ok);
        };
        $("[data-ok]", box).addEventListener("click", answer);
        ctx.onKey((e) => { if (e.key === "Enter") answer(); });
      });
    },
  };
}
function odd4Item(rng) {
  if (rng() < 0.3) return oddItem(rng);
  const x = DAILY_ODDS[Math.floor(rng() * DAILY_ODDS.length)];
  const ins = [...x.in, ...(x.more || [])].slice(0, 3);
  return dailyChoice("L'intrús", `<div class="q-text">${esc(x.q)}</div>`, x.out, ins, rng, x.exp, `${x.q} ${[x.out, ...ins].join(", ")}`);
}
// «Completa la frase» d'abans de DAILY_FILLS_FROM (paraula a l'atzar), perquè el repte dels dies ja jugats no canviï
function fill4ItemAntic(rng) {
  for (let k = 0; k < 20; k++) {
    const it = fillItem(rng);
    if (new Set(it.options.map((o) => String(o).toLowerCase())).size === it.options.length) return it;
  }
  return fillItem(rng);
}
// «Completa la frase»: les alternatives són fetes a mà (DAILY_FILLS), perquè totes tinguin sentit a la frase
function fill4Item(rng) {
  const [t, w, ...dis] = DAILY_FILLS[Math.floor(rng() * DAILY_FILLS.length)];
  const q = QUOTES.find((x) => x.q === t), { options, correctIndex } = prepOptions([w, ...dis], rng), blank = t.replace(w, "_____");
  return { label: "Completa la frase", columns: 2,
    prompt: `<blockquote class="q-quote">${esc(blank)}</blockquote><p class="dmec-hint">${esc(q.a)}${q.y ? `, ${q.y}` : ""}</p>`,
    options, correctIndex, explain: `${q.a}: «${q.q}»`, recapQ: blank, recapA: w };
}
function draw4Item(rng) {
  const all = [...DRAW_TARGETS, ...DRAW_TARGETS_MES], t = all[Math.floor(rng() * all.length)];
  const it = drawItem(() => DRAW_TARGETS.indexOf(t) >= 0 ? (DRAW_TARGETS.indexOf(t) + 0.5) / DRAW_TARGETS.length : 0);
  if (DRAW_TARGETS.indexOf(t) >= 0) return it;
  return {
    ...it,
    prompt: `<div class="q-text">Dibuixa <b>${esc(t.name)}</b> al mapa</div><p class="dmec-hint">Resegueix el territori amb el dit o el ratolí. Per aprovar, cal una precisió de més del 85 %.</p>`,
    explain: t.explain, recapQ: `Dibuixa ${t.name}`, recapA: t.explain,
    play(ctx, card) {
      return dailyPlay(ctx, card, drawBoardHtml(t), (box, finish, isDone) => drawBind(ctx, box, t, isDone, (score) => {
        const good = score > DRAW_PASS;
        box.insertAdjacentHTML("beforeend", `<p class="gss-res ${good ? "ok" : "ko"}">Precisió: <b>${drawPct(score).toLocaleString("ca")} %</b>${good ? "" : " (calia més d'un 85 %)"}. En verd, ${esc(t.name)}.</p>`);
        finish(good);
      }));
    },
  };
}

// Proves especials del dia, des de DAILY_V4_FROM: cinc de les tretze
function dailySpecials4(key) {
  let all = [order4Item, mapItem, guess4Item, draw4Item, shapeItem, odd4Item, key >= DAILY_FILLS_FROM ? fill4Item : fill4ItemAntic, pairs4Item, errorItem, sortItem, resultItem, dhondtItem, ccaaMapItem];
  // Des de DAILY_NOSEATS_FROM, sense la llei d'Hondt ni «Quines eleccions són?» (es reconeixen pels escons)
  if (key >= DAILY_NOSEATS_FROM) all = all.filter((f) => f !== dhondtItem && f !== resultItem);
  return sample(all, 5, seededRng(hashString(`daily-mix-${key}`)));
}
