// Turns the model into GPU buffers: galaxy positions, colours, sizes, births.
import * as THREE from 'three';
import { rng, hash, gauss, clamp } from './util.js';

const MAX_DUST = 110000;

function placeGalaxies(model, R) {
  const G = model.galaxies;
  const K = G.length;
  G.forEach(g => { g.radius = 9 + 2.9 * Math.sqrt(g.count); });
  const W = Array.from({ length: K }, () => new Float32Array(K));
  for (const [a, b] of model.links) {
    const ga = model.notes[a].g, gb = model.notes[b].g;
    if (ga !== gb) { W[ga][gb]++; W[gb][ga]++; }
  }
  let maxW = 1;
  W.forEach(row => row.forEach(v => { if (v > maxW) maxW = v; }));

  const r0 = 26 + K * 10;
  const P = G.map((g, i) => {
    if (K === 1) return new THREE.Vector3();
    const phi = Math.acos(1 - (2 * (i + 0.5)) / K);
    const th = Math.PI * (1 + Math.sqrt(5)) * i;
    return new THREE.Vector3(Math.sin(phi) * Math.cos(th) * r0 * 1.2, Math.cos(phi) * r0 * 0.42, Math.sin(phi) * Math.sin(th) * r0 * 0.6);
  });
  const d = new THREE.Vector3();
  for (let it = 0; it < 420; it++) {
    for (let i = 0; i < K; i++) {
      for (let j = i + 1; j < K; j++) {
        d.subVectors(P[j], P[i]);
        let dist = d.length() || 0.01;
        const min = (G[i].radius + G[j].radius) * 1.6 + 16;
        let f = 0;
        if (dist < min) f = (min - dist) * 0.5;
        else if (W[i][j] > 0) f = -(dist - min) * 0.02 * (W[i][j] / maxW);
        d.multiplyScalar(f / dist);
        P[i].sub(d);
        P[j].add(d);
      }
    }
    for (const p of P) { p.multiplyScalar(0.993); p.y *= 0.99; }
  }
  // centre the whole thing
  const c = new THREE.Vector3();
  P.forEach(p => c.add(p));
  c.divideScalar(Math.max(1, K));
  P.forEach((p, i) => {
    p.sub(c);
    const g = G[i];
    g.center = p;
    const n = new THREE.Vector3((R() - 0.5) * 1.7, 1, (R() - 0.5) * 1.4 + 0.7).normalize();
    const u = new THREE.Vector3().crossVectors(n, Math.abs(n.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)).normalize();
    const v = new THREE.Vector3().crossVectors(n, u);
    g.axis = n; g.u = u; g.v = v;
    g.arms = 2 + (hash(g.name) % 2);
    g.twist = 2.4 + R() * 1.6;
  });
  let bound = 10;
  G.forEach(g => { bound = Math.max(bound, g.center.length() + g.radius * 1.4); });
  return bound;
}

export function buildLayout(model) {
  const R = rng(hash(model.name || 'vault'));
  const G = model.galaxies;
  const notes = model.notes;
  const K = G.length;
  const bound = placeGalaxies(model, R);

  // particle budget
  let dustPer = G.map(g => Math.round(clamp(650 + g.count * 55, 0, 5200)));
  const dustTotal = dustPer.reduce((a, b) => a + b, 0);
  if (dustTotal > MAX_DUST) dustPer = dustPer.map(n => Math.floor((n * MAX_DUST) / dustTotal));
  const puffPer = G.map(g => 5 + Math.floor(Math.sqrt(g.count) * 1.4));
  const N = notes.length + puffPer.reduce((a, b) => a + b, 0) + dustPer.reduce((a, b) => a + b, 0);
  const gal = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const birth = new Float32Array(N);
  const seed = new Float32Array(N);
  const kind = new Float32Array(N);
  const cluster = new Float32Array(N);
  const tmp = new THREE.Color();
  const white = new THREE.Color(1, 1, 1);
  let p = 0;
  const put = (pos, c, s, bi, sd, kd, cl) => {
    gal[p * 3] = pos.x; gal[p * 3 + 1] = pos.y; gal[p * 3 + 2] = pos.z;
    col[p * 3] = c.r; col[p * 3 + 1] = c.g; col[p * 3 + 2] = c.b;
    size[p] = s; birth[p] = bi; seed[p] = sd; kind[p] = kd; cluster[p] = cl;
    p++;
  };
  const pos = new THREE.Vector3();
  const disc = (g, rr, ang, h) => pos.copy(g.center)
    .addScaledVector(g.u, Math.cos(ang) * rr)
    .addScaledVector(g.v, Math.sin(ang) * rr)
    .addScaledVector(g.axis, h);

  const colors = G.map(g => new THREE.Color().setStyle(g.color));
  const hubs = G.map(g => g.notes.reduce((best, i) => (notes[i].degree > notes[best].degree ? i : best), g.notes[0]));
  const firstBirth = G.map(g => Math.min(...g.notes.map(i => notes[i].birth)));

  // stars (index == note index)
  for (const n of notes) {
    const g = G[n.g];
    const hr = rng(hash(n.path));
    const a = hr(), b = hr(), c = hr(), d = hr(), s = hr();
    const isHub = hubs[n.g] === n.i;
    let t = isHub ? 0 : (0.1 + 0.9 * Math.sqrt(a)) * (1 - Math.min(0.45, n.degree * 0.018));
    const arm = Math.floor(b * g.arms);
    const ang = (arm * Math.PI * 2) / g.arms + t * g.twist + (c - 0.5) * 0.9;
    disc(g, t * g.radius, ang, (d - 0.5) * g.radius * 0.16 * (1 - t * 0.6));
    tmp.copy(colors[n.g]).lerp(white, 0.12);
    put(pos, tmp, 1.25 + 0.75 * Math.sqrt(n.degree) + (isHub ? 1.4 : 0), n.birth, s, 1, n.g);
  }
  // nebula puffs
  G.forEach((g, k) => {
    for (let i = 0; i < puffPer[k]; i++) {
      pos.copy(g.center)
        .addScaledVector(g.u, gauss(R) * g.radius * 0.32)
        .addScaledVector(g.v, gauss(R) * g.radius * 0.32)
        .addScaledVector(g.axis, gauss(R) * g.radius * 0.08);
      tmp.copy(colors[k]).multiplyScalar(0.8 + R() * 0.4);
      put(pos, tmp, g.radius * (0.7 + R() * 0.9), firstBirth[k], R(), 2, k);
    }
  });
  // dust
  G.forEach((g, k) => {
    const nIdx = g.notes;
    for (let i = 0; i < dustPer[k]; i++) {
      if (R() < 0.17) {
        const rr = Math.abs(gauss(R)) * g.radius * 0.75;
        const dx = gauss(R), dy = gauss(R), dz = gauss(R);
        const l = Math.hypot(dx, dy, dz) || 1;
        pos.set(g.center.x + (dx / l) * rr, g.center.y + (dy / l) * rr * 0.6, g.center.z + (dz / l) * rr);
      } else {
        const t = Math.pow(R(), 0.8);
        const arm = Math.floor(R() * g.arms);
        const ang = (arm * Math.PI * 2) / g.arms + t * g.twist + gauss(R) * 0.3;
        disc(g, t * g.radius * 1.22 + gauss(R) * 0.8, ang, gauss(R) * g.radius * 0.05 * (1.3 - t));
      }
      const bright = 0.35 + R() * 0.65;
      tmp.copy(colors[k]).lerp(white, R() * R() * 0.45).multiplyScalar(bright);
      const bi = notes[nIdx[Math.floor(R() * nIdx.length)]].birth + R() * 0.015;
      put(pos, tmp, 0.32 + R() * 0.7, bi, R(), 0, k);
    }
  });

  // links
  const L = model.links.length;
  const lGal = new Float32Array(L * 6), lCol = new Float32Array(L * 6);
  const lBirth = new Float32Array(L * 2), lSeed = new Float32Array(L * 2), lCl = new Float32Array(L * 2);
  model.links.forEach(([a, b], li) => {
    const bi = Math.max(birth[a], birth[b]);
    [a, b].forEach((s, e) => {
      const v = li * 2 + e;
      for (let q = 0; q < 3; q++) {
        lGal[v * 3 + q] = gal[s * 3 + q];
        lCol[v * 3 + q] = col[s * 3 + q];
      }
      lBirth[v] = bi; lSeed[v] = seed[s]; lCl[v] = cluster[s];
    });
  });

  return {
    count: N,
    stars: notes.length,
    bound,
    points: { gal, col, size, birth, seed, kind, cluster },
    lines: { gal: lGal, col: lCol, birth: lBirth, seed: lSeed, cluster: lCl },
    galaxies: G.map(g => ({ center: g.center, axis: g.axis, radius: g.radius }))
  };
}
