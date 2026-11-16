import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildLayout } from './layout.js';
import { easeInOut, clamp } from './util.js';

const MAXG = 16;

const SPIN_GLSL = /* glsl */ `
uniform float uTime;
uniform float uGrow;
uniform float uFocus;
uniform float uFocusAmt;
uniform vec3 uCenters[${MAXG}];
uniform vec3 uAxes[${MAXG}];
attribute vec3 aColor;
attribute float aBirth;
attribute float aSeed;
attribute float aCluster;
varying vec3 vColor;
varying float vAlpha;

vec3 rotAxis(vec3 p, vec3 c, vec3 k, float a) {
  vec3 v = p - c; float s = sin(a); float co = cos(a);
  return c + v * co + cross(k, v) * s + k * dot(k, v) * (1.0 - co);
}
float spinOf(float cl) {
  float dir = mod(cl, 2.0) < 0.5 ? 1.0 : -1.0;
  return uTime * 0.03 * dir * (0.7 + 0.3 * fract(cl * 0.618));
}
vec3 spinPos(vec3 p, float cl) {
  int ci = int(cl + 0.5);
  return rotAxis(p, uCenters[ci], uAxes[ci], spinOf(cl));
}
float focusOf(float cl) {
  if (uFocus < -0.5) return 1.0;
  return mix(1.0, abs(cl - uFocus) < 0.5 ? 1.0 : 0.1, uFocusAmt);
}
`;

const POINT_VERT = /* glsl */ `
${SPIN_GLSL}
uniform float uScale;
attribute float aSize;
attribute float aKind;
varying float vKind;
void main() {
  vec4 mv = modelViewMatrix * vec4(spinPos(position, aCluster), 1.0);
  float born = smoothstep(aBirth, aBirth + 0.012, uGrow);
  float pop = 1.0 + born * (1.0 - born) * 7.0;
  float s = aSize;
  if (aKind > 0.5 && aKind < 1.5) s *= 0.86 + 0.14 * sin(uTime * 2.2 + aSeed * 60.0);
  gl_PointSize = clamp(s * pop * born * uScale / -mv.z, 0.0, 512.0);
  vAlpha = born * focusOf(aCluster);
  vColor = aColor;
  vKind = aKind;
  gl_Position = projectionMatrix * mv;
}`;

const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vKind;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  vec3 col = vColor;
  float a;
  if (vKind < 0.5) {
    a = pow(1.0 - d, 1.8) * 0.5;
  } else if (vKind < 1.5) {
    float core = exp(-d * d * 30.0);
    float halo = pow(1.0 - d, 2.6) * 0.6;
    col = mix(vColor, vec3(1.0), core * 0.9);
    a = core * 1.25 + halo;
  } else {
    a = pow(1.0 - d, 2.4) * 0.065;
  }
  gl_FragColor = vec4(col, a * vAlpha);
}`;

const LINE_VERT = /* glsl */ `
${SPIN_GLSL}
void main() {
  vAlpha = smoothstep(aBirth, aBirth + 0.012, uGrow) * focusOf(aCluster);
  vColor = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(spinPos(position, aCluster), 1.0);
}`;

const LINE_FRAG = /* glsl */ `
uniform float uLineAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() { gl_FragColor = vec4(mix(vColor, vec3(1.0), 0.25), vAlpha * uLineAlpha); }`;

const SKY_VERT = /* glsl */ `
uniform float uTime; uniform float uScale;
attribute float aSize; attribute float aSeed;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vA = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 80.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SKY_FRAG = /* glsl */ `
varying float vA;
void main() { float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; gl_FragColor = vec4(vec3(0.75, 0.82, 1.0), pow(1.0 - d, 2.0) * vA * 0.7); }`;

export class Universe {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.5, 4000);
    this.camera.position.set(0, 120, 420);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 1400;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.18;

    this.uniforms = {
      uTime: { value: 0 },
      uGrow: { value: 1.05 },
      uFocus: { value: -1 },
      uFocusAmt: { value: 0 },
      uScale: { value: 1 },
      uLineAlpha: { value: 0.16 },
      uCenters: { value: Array.from({ length: MAXG }, () => new THREE.Vector3()) },
      uAxes: { value: Array.from({ length: MAXG }, () => new THREE.Vector3(0, 1, 0)) }
    };

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.78, 0.42, 0.14);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.addSky();
    this.highlight = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.highlight.frustumCulled = false;
    this.scene.add(this.highlight);

    this.focus = -1; this.focusAmt = 0; this.focusTarget = 0;
    this.selected = -1;
    this.tween = null;
    this.filmOffset = 0; this.filmTarget = 0;
    this.clock = new THREE.Timer();
    this.listeners = {};
    this.onFrame = null;
    this._v = new THREE.Vector3();
    this._w = new THREE.Vector3();
    this._axis = new THREE.Vector3();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  addSky() {
    const n = 5000;
    const pos = new Float32Array(n * 3), size = new Float32Array(n), sd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 900 + Math.random() * 900;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * r, u * r, Math.sin(th) * s * r], i * 3);
      size[i] = 1.2 + Math.pow(Math.random(), 6) * 6;
      sd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    this.sky = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uTime: this.uniforms.uTime, uScale: this.uniforms.uScale },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  setModel(model) {
    this.model = model;
    const L = buildLayout(model);
    this.layout = L;
    if (this.points) { this.scene.remove(this.points); this.points.geometry.dispose(); }
    if (this.lines) { this.scene.remove(this.lines); this.lines.geometry.dispose(); }

    const P = L.points;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P.gal, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(P.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(P.size, 1));
    g.setAttribute('aBirth', new THREE.BufferAttribute(P.birth, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(P.seed, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(P.kind, 1));
    g.setAttribute('aCluster', new THREE.BufferAttribute(P.cluster, 1));
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: POINT_VERT, fragmentShader: POINT_FRAG,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
    }));
    this.points.frustumCulled = false;

    const Ln = L.lines;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(Ln.gal, 3));
    lg.setAttribute('aColor', new THREE.BufferAttribute(Ln.col, 3));
    lg.setAttribute('aBirth', new THREE.BufferAttribute(Ln.birth, 1));
    lg.setAttribute('aSeed', new THREE.BufferAttribute(Ln.seed, 1));
    lg.setAttribute('aCluster', new THREE.BufferAttribute(Ln.cluster, 1));
    this.lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
    }));
    this.lines.frustumCulled = false;
    this.scene.add(this.lines);
    this.scene.add(this.points);

    L.galaxies.forEach((gx, k) => {
      if (k >= MAXG) return;
      this.uniforms.uCenters.value[k].copy(gx.center);
      this.uniforms.uAxes.value[k].copy(gx.axis);
    });
    if (this.selected >= model.notes.length) this.select(-1);
    else this.select(this.selected);
  }

  // ---------- positions (mirror of the shader, for picking/labels) ----------
  spinOf(cl) {
    const dir = cl % 2 === 0 ? 1 : -1;
    const f = cl * 0.618 - Math.floor(cl * 0.618);
    return this.uniforms.uTime.value * 0.03 * dir * (0.7 + 0.3 * f);
  }
  starPos(i, out = new THREE.Vector3()) {
    const P = this.layout.points;
    const cl = P.cluster[i];
    const gx = this.layout.galaxies[cl];
    out.set(P.gal[i * 3], P.gal[i * 3 + 1], P.gal[i * 3 + 2]);
    const a = this.spinOf(cl);
    if (gx) {
      const v = this._v.subVectors(out, gx.center);
      const k = gx.axis;
      const s = Math.sin(a), c = Math.cos(a);
      const cr = this._w.crossVectors(k, v);
      const dot = k.dot(v);
      out.copy(gx.center).addScaledVector(v, c).addScaledVector(cr, s).addScaledVector(k, dot * (1 - c));
    }
    return out;
  }
  galaxyAnchor(k, out = new THREE.Vector3()) {
    return out.copy(this.layout.galaxies[k].center);
  }
  project(v, out = { x: 0, y: 0, visible: false }) {
    const p = this._v.copy(v).project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * this.width;
    out.y = (-p.y * 0.5 + 0.5) * this.height;
    out.visible = p.z < 1 && p.z > -1;
    return out;
  }

  pick(x, y, radius = 16) {
    if (!this.layout) return -1;
    let best = -1, bestD = radius * radius;
    const v = new THREE.Vector3(), s = {};
    const grow = this.uniforms.uGrow.value;
    const P = this.layout.points;
    for (let i = 0; i < this.layout.stars; i++) {
      if (P.birth[i] > grow) continue;
      if (this.focus >= 0 && this.focusAmt > 0.5 && P.cluster[i] !== this.focus) continue;
      this.project(this.starPos(i, v), s);
      if (!s.visible) continue;
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // ---------- state ----------
  setFocus(k) {
    if (k >= 0) { this.focus = k; this.focusTarget = 1; this.uniforms.uFocus.value = k; }
    else this.focusTarget = 0;
  }
  setGrow(t) { this.uniforms.uGrow.value = t; }
  setFilmOffset(v) { this.filmTarget = v; }

  select(i) {
    this.selected = i;
    const geo = this.highlight.geometry;
    if (i < 0 || !this.model) { geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3)); return; }
    const nb = this.model.notes[i].nb;
    this.highlightNb = nb;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nb.length * 6), 3));
  }

  flyTo(target, position, duration = 1.6) {
    this.tween = {
      t: 0, duration,
      fromT: this.controls.target.clone(), toT: target.clone(),
      fromP: this.camera.position.clone(), toP: position.clone()
    };
  }
  frameUniverse(scale = 1, duration = 1.8) {
    const b = this.layout ? this.layout.bound : 120;
    const dist = (b / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 0.82 * scale;
    const dir = new THREE.Vector3(0.12, 0.42, 1).normalize();
    this.flyTo(new THREE.Vector3(0, 0, 0), dir.multiplyScalar(dist), duration);
  }
  flyToStar(i) {
    const p = this.starPos(i, new THREE.Vector3());
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.flyTo(p, p.clone().addScaledVector(dir, 70), 1.4);
  }
  flyToGalaxy(k) {
    const p = this.galaxyAnchor(k, new THREE.Vector3());
    const gx = this.layout.galaxies[k];
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.flyTo(p, p.clone().addScaledVector(dir, gx.radius * 4.2 + 30), 1.5);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.uniforms.uScale.value = (h * pr * 0.5) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
  }

  loop() {
    requestAnimationFrame(this.loop);
    this.clock.update();
    const dt = Math.min(0.1, this.clock.getDelta());
    this.uniforms.uTime.value += dt;

    const fd = this.focusTarget - this.focusAmt;
    this.focusAmt += fd * Math.min(1, dt * 4);
    if (this.focusTarget === 0 && this.focusAmt < 0.01) { this.focus = -1; this.uniforms.uFocus.value = -1; }
    this.uniforms.uFocusAmt.value = this.focusAmt;

    this.filmOffset += (this.filmTarget - this.filmOffset) * Math.min(1, dt * 3);
    if (Math.abs(this.camera.filmOffset - this.filmOffset) > 1e-4) {
      this.camera.filmOffset = this.filmOffset;
      this.camera.updateProjectionMatrix();
    }

    if (this.tween) {
      const tw = this.tween;
      tw.t += dt / tw.duration;
      const e = easeInOut(clamp(tw.t, 0, 1));
      this.controls.target.lerpVectors(tw.fromT, tw.toT, e);
      this.camera.position.lerpVectors(tw.fromP, tw.toP, e);
      if (tw.t >= 1) this.tween = null;
    }
    this.controls.update();

    if (this.selected >= 0 && this.highlightNb && this.layout) {
      const attr = this.highlight.geometry.getAttribute('position');
      const a = this.starPos(this.selected, new THREE.Vector3());
      const b = new THREE.Vector3();
      this.highlightNb.forEach((j, k) => {
        this.starPos(j, b);
        attr.array.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      });
      attr.needsUpdate = true;
      this.highlight.material.opacity = 0.55 * (this.uniforms.uGrow.value >= 1 ? 1 : 0.4);
    }

    if (this.onFrame) this.onFrame(dt);
    this.composer.render();
  }
}
