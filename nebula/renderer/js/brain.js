// Procedural brain made of points: two folded hemispheres, Sylvian fissure, cerebellum and brain stem.
// Front of the brain is -x, top is +y, hemispheres split along z.
import { gauss, fbm, vnoise } from './util.js';

const CY = 8;            // cortex vertical offset
const CENTER = [0, 14];  // sagittal centre used to split the cortex into regions

function unit(r) {
  const x = gauss(r), y = gauss(r), z = gauss(r);
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

function cortexPoint(r) {
  for (let tries = 0; tries < 60; tries++) {
    const h = r() < 0.5 ? -1 : 1;
    const [dx, dy, dz] = unit(r);
    const lateral = dz * h > 0;
    let x = dx * 57;
    let y = dy * (dy > 0 ? 41 : 25);
    let z = dz * (lateral ? 30 : 6);
    if (dy < 0) {
      y -= 15 * Math.exp(-Math.pow((x + 6) / 24, 2)) * (lateral ? 1 : 0.35); // temporal lobe hangs lower
      y += Math.max(0, x - 16) * 0.38;                                         // room for the cerebellum
    } else {
      y *= 1 - Math.max(0, x - 18) / 110;                                       // occipital taper
      y *= 1 - Math.max(0, -x - 30) / 160;
    }
    // Sylvian fissure on the lateral surface
    if (lateral && x > -44 && x < 22) {
      const yf = -3 + 0.32 * (x + 40);
      if (Math.abs(y - yf) < 2.1 && Math.abs(dz) > 0.35) continue;
    }
    z += h * 16;
    // gyri: keep points mostly on ridges of a noise field
    const n = fbm(x * 0.085 + 3.1, y * 0.085, (z - h * 16) * 0.085 + (h > 0 ? 0 : 40));
    const ridge = 1 - Math.abs(n * 2 - 1);
    if (r() > 0.1 + 0.9 * Math.pow(ridge, 3.2)) continue;
    const push = 1 + 0.05 * (ridge - 0.55);
    const cz = h * 16;
    return [x * push, y * push + CY, cz + (z - cz) * push];
  }
  const [dx, dy, dz] = unit(r);
  return [dx * 55, dy * 35 + CY, dz * 40];
}

function cerebellumPoint(r) {
  for (let tries = 0; tries < 40; tries++) {
    const [dx, dy, dz] = unit(r);
    const x = 37 + dx * 17, y = -15 + dy * 12, z = dz * 31;
    if (dy > 0.55 && dx < -0.2) continue;
    const folia = Math.abs(Math.sin((dy * 12 + dx * 3) * 1.6));
    if (r() > 0.2 + 0.8 * Math.pow(folia, 4)) continue;
    return [x, y, z];
  }
  return [37, -15, 0];
}

function stemPoint(r) {
  const s = Math.pow(r(), 0.9);
  const cx = 19 - 5 * s - 4 * Math.sin(s * Math.PI);
  const cy = -4 - 64 * s;
  const rad = (8.5 - 4 * s) * (1 + 0.25 * Math.exp(-s * 14));
  const phi = r() * Math.PI * 2;
  const strand = Math.abs(Math.sin(phi * 9 + s * 4));
  const rr = rad * (0.9 + 0.12 * strand);
  return [cx + Math.cos(phi) * rr, cy, Math.sin(phi) * rr * 1.15];
}

/**
 * weights:   relative region size per galaxy
 * quotas:    number of cortex points needed per galaxy
 * extra:     number of points for cerebellum + stem (shared by all galaxies)
 */
export function makeBrain(weights, quotas, extra, r) {
  const K = weights.length;
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const cum = [0];
  weights.forEach(w => cum.push(cum[cum.length - 1] + w / total));
  const start = Math.atan2(-0.55, -1); // front-bottom, going over the top to the back
  const regionOf = p => {
    let th = Math.atan2(p[1] - CENTER[1], p[0] - CENTER[0]);
    th += 0.45 * (vnoise(p[0] * 0.045 + 9, p[1] * 0.045, p[2] * 0.02) - 0.5);
    let u = (start - th) / (Math.PI * 2);
    u -= Math.floor(u);
    for (let k = 0; k < K; k++) if (u < cum[k + 1]) return k;
    return K - 1;
  };

  const regions = quotas.map(q => new Float32Array(q * 3));
  const filled = new Int32Array(K);
  const sums = Array.from({ length: K }, () => [0, 0, 0, 0, 0]);
  let remaining = quotas.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (remaining > 0 && guard < 6e6) {
    guard++;
    const p = cortexPoint(r);
    const k = regionOf(p);
    const s = sums[k];
    s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    s[4] = Math.max(s[4], Math.hypot(p[0] - CENTER[0], p[1] - CENTER[1]));
    if (filled[k] < quotas[k]) {
      regions[k].set(p, filled[k] * 3);
      filled[k]++;
      remaining--;
    }
  }
  for (let k = 0; k < K; k++) {
    while (filled[k] < quotas[k]) { regions[k].set(cortexPoint(r), filled[k] * 3); filled[k]++; }
  }

  const extras = new Float32Array(extra * 3);
  for (let i = 0; i < extra; i++) extras.set(r() < 0.42 ? cerebellumPoint(r) : stemPoint(r), i * 3);

  // label anchors: region centroid pushed outwards on the visible (+z) side
  const anchors = sums.map(s => {
    const n = Math.max(1, s[3]);
    const dx = s[0] / n - CENTER[0], dy = s[1] / n - CENTER[1];
    const l = Math.hypot(dx, dy) || 1;
    const reach = s[4] * 0.9 + 8;
    return [CENTER[0] + (dx / l) * reach, CENTER[1] + (dy / l) * reach * 0.95, 34];
  });

  return { regions, extras, anchors };
}

export const BRAIN_VIEW = { target: [4, -10, 0], position: [-70, 6, 238] };
