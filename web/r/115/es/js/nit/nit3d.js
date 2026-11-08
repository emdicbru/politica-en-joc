// Nit electoral en 3D (pàgina #nit): l'hemicicle del Congrés i el mapa d'Espanya en relleu. Es carrega només en entrar a
// la nit electoral (js/nit.js) i, si el dispositiu no pot (sense WebGL) o la persona ha demanat menys moviment, la nit es
// queda amb les versions planes de sempre.
// · Hemicicle: els 350 escons, cada partit al seu lloc d'esquerra a dreta (ESP_ORDER) i, dins de cada partit, per
//   circumscripcions. Quan un escó canvia de mans, salta i aterra amb el color nou. Es pot girar i tocar un escó.
// · Mapa: cada circumscripció és una peça en relleu (SIM_MAP) amb el color de qui guanya; l'alçada depèn del mode.
// Només es dibuixa quan cal (en moure's, en animar-se o en arrossegar): així no gasta bateria mentre no passa res.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function can3d() {
  if (reduce()) return false;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
const PENDING = "#d9d2c3";
// «de Barcelona», «d'Astúries», «d'Àlaba», «de Huelva» (la h aspirada dels noms castellans no s'apostrofa)
const deDe = (n) => window.PEJ_LANG === "es" ? `de ${n}` : /^Illes /.test(n) ? `de las ${n}` : (/^[aeiouàèéíòóú]/i.test(n) || /^h[aeiou]/i.test(n) && !/^Hu/.test(n) ? `d'${n}` : `de ${n}`);
const easeOut = (t) => 1 - (1 - t) ** 3;

// ---------- Escenari comú: renderitzador, càmera orbital, llums i bucle a demanda ----------
function stage(host, { target = [0, 0, 0], dist = 4, yaw = 0, pitch = 0.75, minPitch = 0.25, maxPitch = 1.35, yawLim = 0.9, minD = 2.2, maxD = 7 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  // Sense «tone mapping»: els colors dels partits han de sortir tal com són
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const cam = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
  const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(2, 5, 3); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xfff6e5, 0x1b1b48, 0.45));
  const o = { yaw, pitch, dist, tYaw: yaw, tPitch: pitch, tDist: dist, t: new THREE.Vector3(...target) };
  const place = () => {
    cam.position.set(o.t.x + o.dist * Math.cos(o.pitch) * Math.sin(o.yaw), o.t.y + o.dist * Math.sin(o.pitch), o.t.z + o.dist * Math.cos(o.pitch) * Math.cos(o.yaw));
    cam.lookAt(o.t);
  };
  const ticks = new Set();
  let raf = 0, visible = true, dirty = true, idleAt = performance.now();
  const loop = (now) => {
    raf = 0;
    let busy = false;
    // La càmera s'acosta suaument al punt de vista demanat
    const k = 0.14;
    for (const [a, b] of [["yaw", "tYaw"], ["pitch", "tPitch"], ["dist", "tDist"]]) { const dv = o[b] - o[a]; if (Math.abs(dv) > 1e-4) { o[a] += dv * k; busy = true; } else o[a] = o[b]; }
    for (const f of ticks) if (f(now)) busy = true;
    if (busy || dirty) { place(); renderer.render(scene, cam); dirty = false; }
    if (busy && visible) raf = requestAnimationFrame(loop);
  };
  const wake = () => { dirty = true; idleAt = performance.now(); if (!raf && visible) raf = requestAnimationFrame(loop); };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); wake();
  };
  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }); io.observe(host);
  // Arrossegar per girar, roda o pessic per apropar
  const el = renderer.domElement, pts = new Map();
  let drag = null, moved = false;
  el.style.touchAction = "pan-y";
  el.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag = { x: e.clientX, y: e.clientY, yaw: o.tYaw, pitch: o.tPitch, d: o.tDist, pinch: null }; moved = false; });
  el.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId) || !drag) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()], dd = Math.hypot(a.x - b.x, a.y - b.y);
      drag.pinch ??= dd;
      o.tDist = Math.max(minD, Math.min(maxD, drag.d * (drag.pinch / dd)));
      moved = true; wake(); return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    if (!moved) el.setPointerCapture(e.pointerId);
    moved = true;
    o.tYaw = Math.max(-yawLim, Math.min(yawLim, drag.yaw - dx * 0.006));
    o.tPitch = Math.max(minPitch, Math.min(maxPitch, drag.pitch + dy * 0.004));
    wake();
  });
  const up = (e) => { pts.delete(e.pointerId); if (!pts.size) drag = null; };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  // La roda sola fa baixar la pàgina; amb Ctrl (o Alt), apropa
  el.addEventListener("wheel", (e) => { if (!(e.ctrlKey || e.metaKey || e.altKey)) return; e.preventDefault(); o.tDist = Math.max(minD, Math.min(maxD, o.tDist * (e.deltaY > 0 ? 1.08 : 1 / 1.08))); wake(); }, { passive: false });
  // Raig des del punt tocat (per triar un escó o una circumscripció)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e, objs) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.intersectObjects(objs, false)[0] || null;
  };
  resize();
  return {
    renderer, scene, cam, o, el, wake, pick, ticks, wasDrag: () => moved, idle: () => performance.now() - idleAt,
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); pm.dispose(); el.remove(); },
  };
}

// ---------- Hemicicle ----------
export function hemi(host, { order = [], color = () => "#999", sig = (k) => k, provName = (c) => c } = {}) {
  host.classList.add("n3");
  const S = stage(host, { target: [0, 0.05, -0.72], dist: 4.15, pitch: 0.95, yawLim: 0.75, minD: 2, maxD: 5.5 });
  const tip = document.createElement("div"); tip.className = "n3-tip"; tip.hidden = true; host.appendChild(tip);
  const R = 1.55, seats = hemicycleSeats(350, 12, 0.36); // de escons.js, la mateixa geometria que l'hemicicle pla
  const geo = new RoundedBoxGeometry(0.07, 0.055, 0.07, 2, 0.016);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.08 });
  const mesh = new THREE.InstancedMesh(geo, mat, 350);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  S.scene.add(mesh);
  // Graderia i línia del centre (on hi ha l'escó 175-176)
  const base = new THREE.Mesh(new THREE.RingGeometry(0.36 * R - 0.12, R + 0.14, 96, 1, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x22224f, roughness: 0.9, side: THREE.DoubleSide }));
  base.rotation.x = -Math.PI / 2; base.position.y = -0.04; S.scene.add(base);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, R * 0.7), new THREE.MeshBasicMaterial({ color: 0xffcf3d, transparent: true, opacity: 0.8 }));
  mid.position.set(0, 0.36, -(0.36 * R + R) / 2); S.scene.add(mid);
  const pos = seats.map((s) => new THREE.Vector3(s.x * R, (s.r - 0.36) * 0.62, s.y * R));
  const yawOf = seats.map((s) => Math.PI / 2 - s.a);
  const owners = new Array(350).fill(null), cols = new Array(350).fill(null).map(() => new THREE.Color(PENDING)), anim = new Map();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), p3 = new THREE.Vector3();
  const setSeat = (i, lift = 0, spin = 0) => {
    p3.copy(pos[i]); p3.y += lift;
    e3.set(spin, yawOf[i], 0); q.setFromEuler(e3);
    m4.compose(p3, q, sc); mesh.setMatrixAt(i, m4);
  };
  for (let i = 0; i < 350; i++) { setSeat(i); mesh.setColorAt(i, cols[i]); }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  // Animació dels escons que canvien de mans: salten, giren i aterren amb el color nou
  S.ticks.add((now) => {
    if (!anim.size) return false;
    for (const [i, a] of anim) {
      const t = Math.min(1, Math.max(0, (now - a.t0) / 900));
      if (t <= 0) continue;
      setSeat(i, Math.sin(Math.PI * t) * 0.32, Math.PI * 2 * easeOut(t));
      if (t >= 0.5 && !a.swapped) { cols[i].set(a.to); mesh.setColorAt(i, cols[i]); a.swapped = true; mesh.instanceColor.needsUpdate = true; }
      if (t >= 1) { setSeat(i); anim.delete(i); }
    }
    mesh.instanceMatrix.needsUpdate = true;
    return true;
  });
  // Un lleuger balanceig mentre ningú no el toca, perquè es vegi que és en 3D
  S.ticks.add((now) => {
    if (S.idle() < 6000 || reduce()) return false;
    S.o.tYaw = Math.sin(now / 5200) * 0.22;
    return false;
  });
  // Tocar un escó: de qui és i de quina circumscripció
  S.el.addEventListener("pointerup", (e) => {
    if (S.wasDrag()) return;
    const hit = S.pick(e, [mesh]);
    if (!hit) { tip.hidden = true; return; }
    const o = owners[hit.instanceId], r = host.getBoundingClientRect();
    tip.innerHTML = o ? `<b style="--c:${color(o.k)}"><i></i>${sig(o.k)}</b><span>${o.prov ? `Escaño ${deDe(provName(o.prov))}` : ""}</span>` : `<b><i></i>Pendiente</b><span>Aún por escrutar</span>`;
    tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top}px`; tip.hidden = false;
    clearTimeout(tip._t); tip._t = setTimeout(() => (tip.hidden = true), 3500);
  });
  let first = true;
  return {
    // d: resultat del motor (seats per partit i provs amb won); els escons sense repartir queden grisos
    update(d) {
      const ids = Object.keys(d.seats).filter((k) => d.seats[k] > 0).sort((a, b) => (order.indexOf(a) + 1 || 50) - (order.indexOf(b) + 1 || 50));
      const next = [];
      ids.forEach((k) => {
        const provs = (d.provs || []).filter((p) => p.won[k]).sort((a, b) => a.i - b.i).flatMap((p) => Array(p.won[k]).fill(p.code));
        for (let j = 0; j < d.seats[k]; j++) next.push({ k, prov: provs[j] || null });
      });
      while (next.length < 350) next.push(null);
      let n = 0; const now = performance.now();
      for (let i = 0; i < 350; i++) {
        const a = owners[i], b = next[i];
        if ((a?.k || null) === (b?.k || null)) { owners[i] = b; continue; }
        owners[i] = b;
        const to = b ? color(b.k) : PENDING;
        if (first || reduce()) { cols[i].set(to); mesh.setColorAt(i, cols[i]); continue; }
        anim.set(i, { t0: now + Math.min(1400, n++ * 14), to, swapped: false });
      }
      first = false;
      mesh.instanceColor.needsUpdate = true;
      S.wake();
    },
    dispose: () => S.dispose(),
  };
}

// ---------- Mapa en relleu ----------
// SIM_MAP: { w, h, provs: { codi: { d: "M x y L x y … Z", x, y } } }. Cada subcamí és un polígon (illes incloses).
function shapesOf(d, k, cx, cy) {
  return d.split("M").filter(Boolean).map((part) => {
    const nums = part.replace(/[LZ]/g, " ").trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push(new THREE.Vector2((nums[i] - cx) * k, -(nums[i + 1] - cy) * k));
    return pts.length >= 3 ? new THREE.Shape(pts) : null;
  }).filter(Boolean);
}
export function map(host, { provs = [], onPick = () => {}, label = () => "" } = {}) {
  host.classList.add("n3", "n3-map");
  const M = SIM_MAP, k = 6 / M.w, cx = M.w / 2, cy = M.h / 2;
  const S = stage(host, { target: [0, 0, 0.2], dist: 9.6, pitch: 1.0, yawLim: 0.7, minPitch: 0.45, maxPitch: 1.45, minD: 4, maxD: 14 });
  const tip = document.createElement("div"); tip.className = "n3-tip"; tip.hidden = true; host.appendChild(tip);
  const group = new THREE.Group(); group.rotation.x = -Math.PI / 2; S.scene.add(group);
  const pieces = new Map();
  provs.forEach((p) => {
    const g = M.provs[p.code]; if (!g) return;
    const geo = new THREE.ExtrudeGeometry(shapesOf(g.d, k, cx, cy), { depth: 1, bevelEnabled: false });
    const mat = new THREE.MeshStandardMaterial({ color: PENDING, roughness: 0.55, metalness: 0.05, emissive: 0x000000 });
    const m = new THREE.Mesh(geo, mat);
    m.scale.z = 0.05; m.userData = { i: p.i, code: p.code, h: 0.05, col: new THREE.Color(PENDING), pulse: false };
    // Vores fosques perquè es distingeixin les circumscripcions veïnes del mateix color
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0x17173d, transparent: true, opacity: 0.35 }));
    m.add(edges);
    group.add(m); pieces.set(p.i, m);
  });
  const meshes = [...pieces.values()];
  let sel = null;
  // Les alçades i els colors s'hi acosten a poc a poc; les que «ballen» bateguen
  S.ticks.add((now) => {
    let busy = false;
    for (const m of meshes) {
      const u = m.userData, target = u.h * (u.pulse ? 1 + 0.12 * Math.sin(now / 260) : 1);
      const dz = target - m.scale.z;
      if (Math.abs(dz) > 1e-4) { m.scale.z += dz * 0.12; busy = true; }
      if (!m.material.color.equals(u.col)) { m.material.color.lerp(u.col, 0.15); if (Math.abs(m.material.color.r - u.col.r) + Math.abs(m.material.color.g - u.col.g) + Math.abs(m.material.color.b - u.col.b) < 0.01) m.material.color.copy(u.col); busy = true; }
      if (u.pulse) busy = true;
    }
    return busy;
  });
  S.el.addEventListener("pointerup", (e) => {
    if (S.wasDrag()) return;
    const hit = S.pick(e, meshes);
    if (!hit) return;
    const i = hit.object.userData.i, r = host.getBoundingClientRect();
    tip.innerHTML = label(i); tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top}px`; tip.hidden = false;
    clearTimeout(tip._t); tip._t = setTimeout(() => (tip.hidden = true), 3000);
    onPick(i);
  });
  return {
    // look(i) → { color, h (0-1), pulse }; sel: la circumscripció triada
    update(look, selected = null) {
      sel = selected;
      for (const m of meshes) {
        const l = look(m.userData.i) || {};
        m.userData.h = 0.03 + Math.max(0, Math.min(1, l.h ?? 0)) * 0.6;
        m.userData.col.set(l.color || PENDING);
        m.userData.pulse = !!l.pulse && !reduce();
        m.material.emissive.set(m.userData.i === sel ? 0x554400 : 0x000000);
      }
      S.wake();
    },
    dispose: () => S.dispose(),
  };
}
