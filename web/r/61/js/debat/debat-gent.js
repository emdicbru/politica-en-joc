// Persones del plató del simulador de debat, fetes amb els actius CC0 de MakeHuman (malla, pells, cabells, vestits).
// tools/build-gent.js genera assets/gent/: aquí es munta cada persona amb una identitat pròpia (edat, complexió i trets
// de la cara a partir d'una llavor), un esquelet senzill per girar el cap i gesticular i expressions per parpellejar,
// parlar i reaccionar. Cap avatar reprodueix una persona real.
import * as THREE from "three";

const DIR = new URL("../../assets/gent/", import.meta.url);
const VER = "1";

// ---------- Dades ----------
let packP = null, PACK = null;
function loadPack() {
  return packP || (packP = fetch(new URL(`gent.bin?v=${VER}`, DIR)).then((r) => { if (!r.ok) throw new Error(`gent.bin ${r.status}`); return r.arrayBuffer(); }).then(async (buf) => {
    // El fitxer va comprimit amb gzip (si el servidor ja l'ha descomprimit, es fa servir tal com arriba)
    const b = new Uint8Array(buf);
    if (b[0] === 0x1f && b[1] === 0x8b) buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    const n = new DataView(buf).getUint32(0, true);
    const h = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n)));
    const start = 4 + n + ((4 - ((4 + n) % 4)) % 4);
    const T = { Float32: Float32Array, Int16: Int16Array, Uint16: Uint16Array, Uint32: Uint32Array, Uint8: Uint8Array };
    const A = {};
    for (const [k, [t, o, l]] of Object.entries(h.arrays)) A[k] = new T[t](buf, start + o, l);
    return { h, A, cache: new Map() };
  }));
}
const texP = new Map();
function texture(name, color = true) {
  if (!texP.has(name)) {
    texP.set(name, new THREE.TextureLoader().loadAsync(new URL(`${name}?v=${VER}`, DIR).href).then((t) => {
      t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      return t;
    }));
  }
  return texP.get(name);
}
const TEX = new Map(); // textures ja carregades

// Suma uns desplaçaments (dispersos o densos) a un vector de posicions
function addDeltas(D, A, name, w, out) {
  if (!w || !name) return;
  const d = A[name + ".d"], idx = A[name + ".i"], k = w * D.h.q;
  if (idx) for (let j = 0; j < idx.length; j++) { const o = idx[j] * 3; out[o] += d[j * 3] * k; out[o + 1] += d[j * 3 + 1] * k; out[o + 2] += d[j * 3 + 2] * k; }
  else for (let j = 0; j < d.length; j++) out[j] += d[j] * k;
}
// Atribut de morf compartit entre persones (mateixa topologia)
function morphAttr(D, name, count) {
  if (!D.cache.has(name)) {
    const arr = new Float32Array(count * 3);
    addDeltas(D, D.A, name, 1, arr);
    D.cache.set(name, new THREE.Float32BufferAttribute(arr, 3));
  }
  return D.cache.get(name);
}
function normals(P, nBase, parts) {
  const n = new Float32Array(nBase * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const [tri, rv] of parts) {
    for (let t = 0; t < tri.length; t += 3) {
      const i = rv[tri[t]], j = rv[tri[t + 1]], k = rv[tri[t + 2]];
      a.fromArray(P, i * 3); b.fromArray(P, j * 3).sub(a); c.fromArray(P, k * 3).sub(a);
      b.cross(c);
      for (const v of [i, j, k]) { n[v * 3] += b.x; n[v * 3 + 1] += b.y; n[v * 3 + 2] += b.z; }
    }
  }
  for (let v = 0; v < nBase; v++) { const l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1; n[v * 3] /= l; n[v * 3 + 1] /= l; n[v * 3 + 2] /= l; }
  return n;
}
// Geometria d'una part: posicions i normals per vèrtex base, repartides als vèrtexs de render
function partGeometry(P, N, rv, uv, tri, { shift, skin } = {}) {
  const n = rv.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { pos[i * 3 + k] = P[rv[i] * 3 + k] - (shift ? shift.getComponent(k) : 0); nor[i * 3 + k] = N[rv[i] * 3 + k]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2, true));
  g.setIndex(new THREE.BufferAttribute(tri, 1));
  if (skin) {
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { si[i * 4 + k] = skin[0][rv[i] * 4 + k]; sw[i * 4 + k] = skin[1][rv[i] * 4 + k] / 255; }
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  }
  return g;
}

// ---------- Identitat ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Aspectes: pentinat (proxy de MakeHuman; "mitja" és la melena llarga escurçada a l'espatlla) i celles
export const LOOKS = {
  dona1: { g: "f", hair: "long01", brow: "celles-10" },
  dona2: { g: "f", hair: "long01", cut: true, brow: "celles-10" },
  dona3: { g: "f", hair: "ponytail01", brow: "celles-10" },
  dona4: { g: "f", hair: "bob02", brow: "celles-10" },
  home1: { g: "m", hair: "short04", brow: "celles-1" },
  home2: { g: "m", hair: "short01", brow: "celles-9" },
  home3: { g: "m", hair: null, brow: "celles-1" },
  home4: { g: "m", hair: "short02", brow: "celles-9" },
};
export const SKINS = [0xf1cbb0, 0xe2b293, 0xc99372, 0xa86f4c, 0x7d4e33, 0xf6d9c5];
export const HAIRS = [0x2a1d16, 0x46301f, 0x6b4a2c, 0x9d7a52, 0x1b1714, 0xa9a39b, 0xc9b9a3];
const EYES = ["brown", "brown", "brownlight", "green", "lightblue", "grey"];
// Color mitjà de la cara de cada pell (sRGB), per ajustar-la al to triat
const SKIN_REF = { m: 0xcd9b7a, f: 0xcda083, "m-jove": 0xe5ac88, "f-jove": 0xdaad90, "m-gran": 0xd6a07b, "f-gran": 0xc9a087, "m-fosc": 0x523323, "f-fosc": 0x553021 };
// Ajust de color de la pell: la lluminositat es porta cap al to triat (sense aclarir la textura) i el matís, només en part
function skinTint(hex, refHex) {
  const t = new THREE.Color(hex), r = new THREE.Color(refHex);
  const lt = 0.2126 * t.r + 0.7152 * t.g + 0.0722 * t.b, lr = 0.2126 * r.r + 0.7152 * r.g + 0.0722 * r.b;
  const k = Math.min(1, Math.max(0.45, lt / lr));
  const hue = (c) => Math.pow((t[c] / lt) / (r[c] / lr), 0.45);
  return new THREE.Color(k * hue("r"), k * hue("g"), k * hue("b"));
}
// Lluminositat lineal d'un color (0x7d4e33 ≈ 0,09; 0xa86f4c ≈ 0,19; 0xe2b293 ≈ 0,49)
const linLum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };

function identity(o, D) {
  const r = rng((o.seed ?? 1) * 7919 + 13);
  const L = { ...(LOOKS[o.look] || LOOKS.home1) }, g = L.g;
  if (o.hairStyle !== undefined) L.hair = o.hairStyle;
  if (o.brow) L.brow = o.brow;
  const age = o.age ?? Math.round(36 + r() * 28);
  const lum = linLum(o.skin ?? SKINS[0]);
  const dark = lum < 0.13;
  const skinKey = g + (dark ? "-fosc" : age < 42 ? "-jove" : age > 58 ? "-gran" : "");
  const axes = { edat: Math.max(-0.5, (age - 45) / 25), pes: r() < 0.55 ? r() * 0.7 : 0, prim: r() < 0.35 ? r() * 0.5 : 0, musc: r() * (g === "m" ? 0.5 : 0.15), africa: dark ? 0.8 : lum < 0.25 ? 0.15 : 0 };
  const det = {};
  for (const d of D.h.details) det[d.name] = (r() - 0.5) * 1.2;
  const shapes = ["cap-oval", "cap-rodo", "cap-quadrat", "cap-rectangle", "cap-triangle", "cap-diamant"];
  shapes.forEach((s) => { det[s] = 0; });
  det[shapes[Math.floor(r() * shapes.length)]] = 0.2 + r() * 0.45;
  det["cap-ample"] *= 0.4; det["cap-llarg"] *= 0.4; det["cap-gras"] *= 0.6;
  if (g === "f") { det.mandibula = -Math.abs(det.mandibula) * 0.6; det.papada = Math.min(0, det.papada); det["llavi-inf"] = Math.abs(det["llavi-inf"]); }
  if (age > 55) det.bosses = Math.abs(det.bosses) + 0.3;
  return { g, L, age, axes, det, skinKey, eye: EYES[Math.floor(r() * EYES.length)], shirt: r() < 0.65 ? 0xd9d9d4 : 0xc6d2e2, r };
}
// Prepara (carrega) tot el que necessiten aquestes persones
export async function prepareGent(list) {
  const D = await loadPack();
  const names = new Set(["pestanyes.webp", "dents.webp", "llengua.webp", "vestit-m.webp", "vestit-m-zona.png", "vestit-f.webp"]);
  for (const o of list) {
    const id = identity(o, D);
    names.add(`pell-${id.skinKey}-cap.webp`); names.add(`pell-${id.skinKey}.webp`);
    names.add(`ull-${id.eye}.webp`); names.add(`${id.L.brow}.webp`);
    if (id.L.hair) names.add(`cabell-${id.L.hair}.webp`);
  }
  await Promise.all([...names].map(async (n) => { TEX.set(n, await texture(n, !/^(cabell|vestit)/.test(n))); }));
  PACK = D;
  return D;
}

// ---------- Persona ----------
export function createPerson(o = {}) {
  const D = PACK;
  if (!D) throw new Error("Cal cridar prepareGent() abans de createPerson()");
  const { h, A } = D;
  const { hair = HAIRS[0], suit = 0x1f2240, accent = 0xff4b2b, seated = false, quality = 2 } = o;
  const skinHex = o.skin ?? SKINS[0];
  const id = identity(o, D);
  const fem = id.g === "f";

  // Posicions de tots els vèrtexs (m), amb els peus a terra
  const P = new Float32Array(A.forma);
  if (fem) addDeltas(D, A, h.dona, 1, P);
  for (const [k, w] of Object.entries(id.axes)) addDeltas(D, A, h.eixos[`${id.g}.${k}`], w, P);
  for (const d of h.details) { const w = id.det[d.name] || 0; if (w > 0) addDeltas(D, A, d.mes, w, P); else if (w < 0) addDeltas(D, A, d.menys || d.mes, d.menys ? -w : w, P); }
  const gy = P[h.ground * 3 + 1];
  for (let i = 1; i < P.length; i += 3) P[i] -= gy;
  const joint = (name) => new THREE.Vector3().fromArray(P, (h.virt0 + h.virt.indexOf(name)) * 3);

  const root = new THREE.Group();
  const body = new THREE.Group();
  if (seated) body.position.y = -0.42;
  root.add(body);

  // Esquelet (repòs = postura de MakeHuman, totes les rotacions a zero)
  const bones = h.bones.map((name) => { const b = new THREE.Bone(); b.name = name; return b; });
  const B = Object.fromEntries(h.bones.map((n, i) => [n, bones[i]]));
  h.bones.forEach((name, i) => {
    const p = h.parents[i];
    bones[i].position.copy(joint(name));
    if (p < 0) body.add(bones[i]);
    else { bones[i].position.sub(joint(h.bones[p])); bones[p].add(bones[i]); }
  });
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const headJ = joint("head");

  // Materials
  const tint = skinTint(skinHex, SKIN_REF[id.skinKey]);
  const skinMat = (map) => quality >= 2
    ? new THREE.MeshPhysicalMaterial({ map, color: tint, roughness: 0.52, sheen: 0.3, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffb4a2), clearcoat: 0.05, clearcoatRoughness: 0.55 })
    : new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.55 });
  const headMat = skinMat(TEX.get(`pell-${id.skinKey}-cap.webp`));
  const scalp = { uCuir: { value: new THREE.Color(hair).multiplyScalar(0.55) }, uCuirAmt: { value: id.L.hair ? 0.88 : 0 } };
  headMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, scalp);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float cuir;\nvarying float vCuir;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCuir = cuir;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vCuir;\nuniform vec3 uCuir;\nuniform float uCuirAmt;")
      .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb = mix( diffuseColor.rgb, uCuir, vCuir * uCuirAmt );");
  };
  headMat.customProgramCacheKey = () => "gent-cap" + quality;
  const bodyMat = skinMat(TEX.get(`pell-${id.skinKey}.webp`));

  // Cos: cap, boca i tors (pell compartida amb el vestit que li correspon)
  const parts = { cap: h.cos.cap, boca: h.cos.boca, tors: h.cos[fem ? "torsf" : "torsm"] };
  const N = normals(P, h.ns, Object.values(parts).map((c) => [A[c.tri], A[c.rv]]));
  const meshes = [];
  const skinned = (geo, mat) => { const m = new THREE.SkinnedMesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; body.add(m); m.bind(skeleton); meshes.push(m); return m; };
  for (const [key, c] of Object.entries(parts)) {
    const geo = partGeometry(P, N, A[c.rv], A[c.uv], A[c.tri], { skin: [A[h.os], A[h.pes]] });
    if (key === "cap") geo.setAttribute("cuir", new THREE.BufferAttribute(id.L.hair ? A[h.cuir[id.L.hair]] : new Uint8Array(A[c.rv].length), 1, true));
    if (c.morph) setMorphs(geo, c.morph, A[c.rv].length);
    const m = skinned(geo, key === "cap" ? headMat : bodyMat);
    if (c.morph) m.updateMorphTargets();
  }
  function setMorphs(geo, morph, count) {
    geo.morphAttributes.position = Object.entries(morph).map(([name, arr]) => { const a = morphAttr(D, arr, count); a.name = name; return a; });
    geo.morphTargetsRelative = true;
  }

  // Proxies: posicions a partir dels lligams sobre el cos
  function proxy(name) {
    const H = h.proxies[name], nv = H.nv;
    const ref = A[H.ref], w = A[H.w], of = A[H.o];
    const sc = H.scale.map(([a, b, den], k) => Math.abs(P[a * 3 + k] - P[b * 3 + k]) / (den * 0.1));
    const pos = new Float32Array(nv * 3);
    // Coordenades baricèntriques: p = p3 + w1 (p1 - p3) + w2 (p2 - p3) + desplaçament escalat
    for (let i = 0; i < nv; i++) {
      const w1 = w[i * 2] / 4096, w2 = w[i * 2 + 1] / 4096, a = ref[i * 3] * 3, b = ref[i * 3 + 1] * 3, c = ref[i * 3 + 2] * 3;
      for (let k = 0; k < 3; k++) pos[i * 3 + k] = P[c + k] + w1 * (P[a + k] - P[c + k]) + w2 * (P[b + k] - P[c + k]) + of[i * 3 + k] * h.q * sc[k];
    }
    const rv = A[H.rv], tri = A[H.tri];
    return { H, pos, nor: normals(pos, nv, [[tri, rv]]), rv, tri, uv: A[H.uv] };
  }
  const headAttach = (name, mat, opts = {}) => {
    const p = proxy(name);
    const geo = partGeometry(p.pos, p.nor, p.rv, p.uv, p.tri, { shift: headJ });
    if (Object.keys(p.H.morph).length) setMorphs(geo, p.H.morph, p.rv.length);
    const m = new THREE.Mesh(geo, mat);
    if (Object.keys(p.H.morph).length) m.updateMorphTargets();
    m.castShadow = opts.shadow ?? false; m.receiveShadow = true; m.frustumCulled = false;
    if (opts.order) m.renderOrder = opts.order;
    B.head.add(m); meshes.push(m);
    return { m, p };
  };

  // Vestit
  {
    const p = proxy(fem ? "vestitF" : "vestitM");
    const geo = partGeometry(p.pos, p.nor, p.rv, p.uv, p.tri, { skin: [A[p.H.os], A[p.H.pes]] });
    const suitC = new THREE.Color(suit);
    let mat;
    if (fem) mat = new THREE.MeshStandardMaterial({ map: TEX.get("vestit-f.webp"), color: suitC.clone().multiplyScalar(1 / 0.59), roughness: 0.78 });
    else {
      mat = new THREE.MeshStandardMaterial({ map: TEX.get("vestit-m.webp"), roughness: 0.74, alphaTest: 0.5 });
      const u = { zona: { value: TEX.get("vestit-m-zona.png") }, cSuit: { value: suitC }, cShirt: { value: new THREE.Color(id.shirt) }, cTie: { value: new THREE.Color(accent).multiplyScalar(0.8) } };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <map_pars_fragment>", "#include <map_pars_fragment>\nuniform sampler2D zona; uniform vec3 cSuit; uniform vec3 cShirt; uniform vec3 cTie;")
          .replace("#include <map_fragment>", "vec4 texel = texture2D( map, vMapUv ); vec2 zz = texture2D( zona, vMapUv ).rg; diffuseColor.rgb *= mix( mix( cSuit * ( texel.r / 0.59 ), cShirt * ( texel.r / 0.88 ), zz.r ), cTie * ( texel.r / 0.63 ), zz.g );");
      };
      mat.customProgramCacheKey = () => "gent-vestit";
    }
    skinned(geo, mat);
  }

  // Ulls (cada un gira sobre el seu centre), parpelles i pestanyes
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: TEX.get(`ull-${id.eye}.webp`), color: 0xd8d4d0, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04 });
  const corneaMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false });
  const eyes = [];
  {
    const p = proxy("ulls"), side = A[p.H.side], cornea = A[p.H.cornia];
    for (const s of [1, 0]) {
      const c = joint(s ? "eye.L" : "eye.R");
      const ball = [], front = [];
      for (let t = 0; t < p.tri.length; t += 3) if (side[p.tri[t]] === s) (cornea[p.tri[t]] && cornea[p.tri[t + 1]] && cornea[p.tri[t + 2]] ? front : ball).push(p.tri[t], p.tri[t + 1], p.tri[t + 2]);
      const g = new THREE.Group();
      g.position.copy(c).sub(headJ);
      for (const [list, mat] of [[ball, eyeMat], [front, corneaMat]]) {
        const m = new THREE.Mesh(partGeometry(p.pos, p.nor, p.rv, p.uv, Uint16Array.from(list), { shift: c }), mat);
        m.frustumCulled = false;
        if (mat === corneaMat) m.renderOrder = 3;
        g.add(m);
      }
      B.head.add(g); eyes.push(g);
    }
  }
  const hairC = new THREE.Color(hair);
  const lashMat = new THREE.MeshStandardMaterial({ map: TEX.get("pestanyes.webp"), color: 0x16100c, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide, roughness: 0.8 });
  headAttach("pestanyes", lashMat, { order: 2 });
  const browMat = new THREE.MeshStandardMaterial({ map: TEX.get(`${id.L.brow}.webp`), color: hairC.clone().multiplyScalar(id.L.hair ? 0.75 : 0.55), transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
  headAttach(id.L.brow, browMat, { order: 2 });
  headAttach("dents", new THREE.MeshStandardMaterial({ map: TEX.get("dents.webp"), roughness: 0.35 }));
  headAttach("llengua", new THREE.MeshStandardMaterial({ map: TEX.get("llengua.webp"), roughness: 0.5 }));

  // Cabell: una passada opaca (amb profunditat) i una de transparent per a les puntes
  if (id.L.hair) {
    const map = TEX.get(`cabell-${id.L.hair}.webp`);
    const hc = hairC.clone().multiplyScalar(1 / 0.62);
    const hp = proxy(id.L.hair);
    // Melena mitjana: tall recte una mica per sota de la barbeta
    if (id.L.cut) {
      const y0 = joint("head").y - 0.07, keep = [];
      for (let t = 0; t < hp.tri.length; t += 3) {
        const v = [hp.rv[hp.tri[t]], hp.rv[hp.tri[t + 1]], hp.rv[hp.tri[t + 2]]];
        if (v.some((i) => hp.pos[i * 3 + 1] >= y0)) keep.push(hp.tri[t], hp.tri[t + 1], hp.tri[t + 2]);
      }
      for (let i = 1; i < hp.pos.length; i += 3) if (hp.pos[i] < y0) hp.pos[i] = y0;
      hp.tri = Uint16Array.from(keep);
    }
    const center = joint("eye.L").add(joint("eye.R")).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.03, -0.06));
    // Normals suaus: barreja de la normal de la carta i la direcció radial des del centre del cap
    for (let i = 0; i < hp.H.nv; i++) {
      const rx = hp.pos[i * 3] - center.x, ry = hp.pos[i * 3 + 1] - center.y, rz = hp.pos[i * 3 + 2] - center.z, rl = Math.hypot(rx, ry, rz) || 1;
      let nx = hp.nor[i * 3], ny = hp.nor[i * 3 + 1], nz = hp.nor[i * 3 + 2];
      if (nx * rx + ny * ry + nz * rz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const x = nx * 0.35 + (rx / rl) * 0.65, y = ny * 0.35 + (ry / rl) * 0.65, z = nz * 0.35 + (rz / rl) * 0.65, l = Math.hypot(x, y, z) || 1;
      hp.nor[i * 3] = x / l; hp.nor[i * 3 + 1] = y / l; hp.nor[i * 3 + 2] = z / l;
    }
    const geo = partGeometry(hp.pos, hp.nor, hp.rv, hp.uv, hp.tri, { shift: headJ });
    const solid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, color: hc, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 }));
    solid.castShadow = true; solid.frustumCulled = false;
    B.head.add(solid);
    if (quality >= 1) {
      const soft = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, color: hc, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.55 }));
      soft.renderOrder = 1; soft.frustumCulled = false;
      B.head.add(soft);
    }
  }

  // Punt de referència per a les càmeres: el centre de la cara
  const faceRef = new THREE.Object3D();
  faceRef.position.copy(joint("eye.L").add(joint("eye.R")).multiplyScalar(0.5)).sub(headJ).add(new THREE.Vector3(0, -0.015, -0.035));
  B.head.add(faceRef);

  // ---------- Animació ----------
  const morphMeshes = meshes.filter((m) => m.morphTargetDictionary);
  const M = {};
  const setM = (name, v) => { M[name] = v; };
  function applyMorphs() {
    for (const m of morphMeshes) {
      const dict = m.morphTargetDictionary, inf = m.morphTargetInfluences;
      for (const k in dict) inf[dict[k]] = M[k] || 0;
    }
  }
  const hands = { y: (o.hands?.y ?? 1.12), z: (o.hands?.z ?? 0.27), x: (o.hands?.x ?? 0.2) };
  const st = { blinkAt: 1 + id.r() * 3, blinkT: -9, talk: false, talkAmt: 0, gaze: new THREE.Vector3(0, 1.6, 6), react: null, phase: id.r() * 10, gesture: 0 };
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const tL = new THREE.Vector3(), tR = new THREE.Vector3();
  // Braç: IK de dos ossos fins a un punt (coordenades de la persona) amb el colze cap a fora i enrere
  function arm(side, target, poleLocal) {
    const ua = B["upperarm" + side], fa = B["forearm" + side], ha = B["hand" + side];
    ua.quaternion.identity(); fa.quaternion.identity();
    ua.updateWorldMatrix(true, true);
    const S = ua.getWorldPosition(v1), E = fa.getWorldPosition(v2), Wr = ha.getWorldPosition(v3);
    const L1 = S.distanceTo(E), L2 = E.distanceTo(Wr);
    const T = root.localToWorld(v4.copy(target));
    const toT = T.clone().sub(S), d = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, toT.length()));
    const dir = toT.normalize();
    const pole = root.localToWorld(poleLocal.clone()).sub(root.getWorldPosition(new THREE.Vector3()));
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const E2 = S.clone().addScaledVector(dir, a).addScaledVector(pole, hh);
    const T2 = S.clone().addScaledVector(dir, d);
    // Rotacions en espai món convertides a locals (repòs = identitat)
    q1.setFromUnitVectors(E.clone().sub(S).normalize(), E2.clone().sub(S).normalize());
    ua.parent.getWorldQuaternion(q2);
    ua.quaternion.copy(q2).invert().multiply(q1).multiply(q2);
    ua.updateWorldMatrix(false, true);
    const Wc = ha.getWorldPosition(new THREE.Vector3());
    q1.setFromUnitVectors(Wc.sub(E2).normalize(), T2.clone().sub(E2).normalize());
    fa.parent.getWorldQuaternion(q2);
    fa.quaternion.copy(q2).invert().multiply(q1).multiply(q2);
    fa.updateWorldMatrix(false, true);
  }
  const poleL = new THREE.Vector3(0.7, -0.35, -0.6), poleR = new THREE.Vector3(-0.7, -0.35, -0.6);
  function update(t, dt) {
    const s = t + st.phase;
    st.talkAmt += ((st.talk ? 1 : 0) - st.talkAmt) * (1 - Math.exp(-dt * 8));
    // Respiració i balanceig
    B.spine.rotation.set(Math.sin(s * 1.6) * 0.012, Math.sin(s * 0.3) * 0.02, 0);
    // Mirada: coll i cap es reparteixen el gir
    root.updateMatrixWorld();
    const hw = B.head.getWorldPosition(v1);
    const tl = v2.copy(st.gaze).sub(hw);
    body.getWorldQuaternion(q1);
    tl.applyQuaternion(q1.invert());
    const yaw = Math.max(-0.75, Math.min(0.75, Math.atan2(tl.x, tl.z)));
    const pitch = Math.max(-0.3, Math.min(0.3, -Math.atan2(tl.y - 0.05, Math.hypot(tl.x, tl.z))));
    const talkNod = st.talkAmt * (Math.sin(s * 4.2) * 0.025 + Math.sin(s * 1.7) * 0.02);
    let ry = yaw * 0.85 + Math.sin(s * 0.5) * 0.025, rx = pitch * 0.7 + talkNod + Math.sin(s * 0.7) * 0.01, rz = Math.sin(s * 0.4) * 0.018;
    let laugh = 0, frown = 0, surprise = 0;
    if (st.react) {
      const k = (t - st.react.t) / 1.3;
      if (k > 1) st.react = null;
      else {
        const env = Math.sin(Math.min(1, k * 1.2) * Math.PI);
        if (st.react.kind === "nod") rx += Math.sin(k * Math.PI * 4) * 0.12 * (1 - k);
        else if (st.react.kind === "shake") ry += Math.sin(k * Math.PI * 5) * 0.2 * (1 - k);
        else if (st.react.kind === "laugh") { laugh = env; rz += Math.sin(k * Math.PI * 6) * 0.03 * env; rx -= 0.05 * env; }
        else if (st.react.kind === "frown") frown = env;
        else if (st.react.kind === "surprise") surprise = env;
      }
    }
    const damp = 1 - Math.exp(-dt * 6);
    const nx = rx * 0.35, ny = ry * 0.4;
    B.neck.rotation.x += (nx - B.neck.rotation.x) * damp;
    B.neck.rotation.y += (ny - B.neck.rotation.y) * damp;
    B.head.rotation.x += (rx - nx - B.head.rotation.x) * damp;
    B.head.rotation.y += (ry - ny - B.head.rotation.y) * damp;
    B.head.rotation.z += (rz - B.head.rotation.z) * damp;
    // Ulls cap al punt de mirada
    B.head.updateWorldMatrix(true, false);
    for (const e of eyes) {
      e.parent.worldToLocal(v3.copy(st.gaze)).sub(e.position);
      e.rotation.set(Math.max(-0.35, Math.min(0.3, -Math.atan2(v3.y, Math.hypot(v3.x, v3.z)))), Math.max(-0.45, Math.min(0.45, Math.atan2(v3.x, v3.z))) + Math.sin(s * 2.3) * 0.01, 0);
    }
    // Parpelleig (en temps real: uns 150 ms, sigui quina sigui la velocitat de fotogrames)
    if (t > st.blinkAt) { st.blinkT = t; st.blinkAt = t + 2 + id.r() * 4; }
    const bk = (t - st.blinkT) / 0.15;
    const close = bk >= 0 && bk < 1 ? Math.sin(bk * Math.PI) : 0;
    setM("parpellaE", close); setM("parpellaD", close);
    // Boca: síl·labes (obrir, arrodonir, estirar) quan parla; mig somriure en repòs
    const ta = st.talkAmt;
    const syl = Math.max(0, Math.sin(s * 10.5) * 0.55 + Math.sin(s * 6.9 + 1) * 0.35 + 0.15);
    setM("boca", ta * syl * 0.55 + laugh * 0.3 + surprise * 0.25);
    setM("llavisO", ta * Math.max(0, Math.sin(s * 3.1)) * 0.35);
    setM("llavisE", ta * Math.max(0, Math.sin(s * 3.1 + 2)) * 0.3);
    setM("somriure", 0.18 * (1 - ta) + 0.08 * ta + laugh * 0.8);
    setM("cellesAmunt", ta * Math.max(0, Math.sin(s * 1.3)) * 0.5 + surprise * 0.9);
    setM("cellesAvall", frown * 0.7);
    setM("llavisPrem", frown * 0.4);
    applyMorphs();
    // Mans al faristol; la dreta gesticula quan parla
    st.gesture += ((st.talk ? 1 : 0) - st.gesture) * (1 - Math.exp(-dt * 2.5));
    const gst = st.gesture * (0.55 + 0.45 * Math.sin(s * 1.9));
    const beat = st.gesture * Math.max(0, Math.sin(s * 5.3)) * 0.02;
    arm(".L", tL.set(hands.x, hands.y + st.gesture * 0.02 * Math.max(0, Math.sin(s * 1.1 + 1)), hands.z), poleL);
    arm(".R", tR.set(-hands.x + gst * 0.05, hands.y + gst * 0.1 + beat, hands.z + gst * 0.05), poleR);
  }

  return {
    root,
    head: B.head,
    headPivot: B.neck,
    update,
    setTalk(v) { st.talk = v; },
    setGaze(v) { st.gaze.copy(v); },
    react(kind, t) { st.react = { kind, t }; },
    headWorld(out = new THREE.Vector3()) { return faceRef.getWorldPosition(out); },
  };
}
