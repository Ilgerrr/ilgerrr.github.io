/* ilger. — flowing gradient in the brand colours, with film noise baked in (WebGL) */
(() => {
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float band; uniform float amp; uniform float sv; uniform float sf;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=uv; p.x*=r.x/r.y;
  float sp=abs(sv);
  p.y=p.y*(1.-sp*.55)+sf;
  float tt=t*.045;
  vec2 q=vec2(fbm(p*1.1+vec2(tt,0.)),fbm(p*1.1+vec2(3.1,-tt)));
  vec2 w=p+1.7*q+m*.12;
  float y=uv.y+.30*sin(w.x*1.25+tt*2.6)+.55*(fbm(w*.85+tt)-.5);
  float v=1.-smoothstep(0.,.62+sp*.12,abs(y-band));
  float heat=fbm(w*1.6-tt*1.8)+sp*.18;
  vec3 black=vec3(.031,.031,.027);
  vec3 deep=vec3(.26,.035,.03);
  vec3 red=vec3(.945,.224,.212);
  vec3 ember=vec3(1.,.47,.2);
  vec3 cream=vec3(.98,.87,.68);
  vec3 c=mix(black,deep,smoothstep(.0,.38,v));
  c=mix(c,red,smoothstep(.3,.68,v)*(.55+.45*heat));
  c=mix(c,ember,smoothstep(.62,.88,v)*smoothstep(.35,.75,heat));
  c=mix(c,cream,smoothstep(.86,1.,v)*smoothstep(.55,.85,heat));
  c*=amp;
  float g=h(gl_FragCoord.xy*.73+fract(t*7.)*91.)-.5;
  c+=g*.085;
  gl_FragColor=vec4(c,1.);
}`;

  const PRESETS = {
    statement: { band: 0.18, amp: 0.85 },
    contact: { band: 0.12, amp: 1.0 },
    index: { band: 0.5, amp: 0.9 },
    footer: { band: 0.05, amp: 1.0 },
    ambient: { band: 0.42, amp: 0.34, res: 0.24 }
  };

  function make(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    if (!gl) { canvas.classList.add('flow--fallback'); return null; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.classList.add('flow--fallback'); return null; }
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (k) => gl.getUniformLocation(pr, k);
    const U = { r: u('r'), t: u('t'), m: u('m'), band: u('band'), amp: u('amp'), sv: u('sv'), sf: u('sf') };
    const preset = PRESETS[canvas.dataset.flow] || PRESETS.contact;
    const state = { visible: false, mx: 0, my: 0, tx: 0, ty: 0, seed: Math.random() * 100 };

    function size() {
      // render at reduced resolution: it is a blur anyway, and the noise reads better a bit chunky
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (preset.res || 0.42);
      const w = Math.max(2, Math.round(canvas.clientWidth * scale));
      const h = Math.max(2, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }
    function draw(time) {
      size();
      state.mx += (state.tx - state.mx) * 0.04;
      state.my += (state.ty - state.my) * 0.04;
      gl.uniform2f(U.r, canvas.width, canvas.height);
      gl.uniform1f(U.t, time / 1000 + state.seed);
      gl.uniform2f(U.m, state.mx, state.my);
      gl.uniform1f(U.band, preset.band);
      gl.uniform1f(U.amp, preset.amp);
      gl.uniform1f(U.sv, scroll.v);
      gl.uniform1f(U.sf, scroll.f + state.seed * 0.01);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }, { rootMargin: '10% 0px' }).observe(canvas);
    window.addEventListener('pointermove', (e) => {
      if (!state.visible) return;
      state.tx = e.clientX / window.innerWidth - 0.5;
      state.ty = 0.5 - e.clientY / window.innerHeight;
    }, { passive: true });
    return { state, draw, canvas };
  }

  // shared scroll state: velocity (-1..1, smoothed) and an offset that keeps growing as you scroll
  const scroll = { v: 0, f: 0, y: window.scrollY };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flows = [...document.querySelectorAll('canvas.flow')].map(make).filter(Boolean);
  if (!flows.length) return;
  if (still) { flows.forEach((f) => f.draw(12000)); return; }
  // compile the shaders and set up every canvas while the page is idle, so the first scroll to them doesn't stutter
  (window.requestIdleCallback || ((cb) => setTimeout(cb, 700)))(() => flows.forEach((f) => f.draw(performance.now())), { timeout: 1500 });
  const loop = (time) => {
    const dy = window.scrollY - scroll.y;
    scroll.y = window.scrollY;
    const target = Math.max(-1, Math.min(1, dy / 38));
    scroll.v += (target - scroll.v) * 0.1;
    scroll.f -= dy * 0.0011;
    const moving = Math.abs(dy) > 0.3 || Math.abs(scroll.v) > 0.02;
    const fire = flows.find((f) => f.canvas.dataset.flow === 'statement');
    const fireFull = fire && parseFloat(fire.canvas.style.opacity || '0') > 0.97;
    flows.forEach((f) => {
      if (!f.state.visible || window.ilgerPaused) return; // nothing to draw behind the open player
      // at rest ~30 fps is plenty for a slow glow; while you scroll it follows every frame, so it never lags behind the page
      if (time - (f.last || 0) < (moving ? 15 : 32)) return;
      if (fireFull && f.canvas.dataset.flow === 'ambient') return; // hidden behind the fire anyway
      if (f.canvas.style.opacity !== '' && parseFloat(f.canvas.style.opacity) < 0.01) return; // faded out: skip the work
      f.last = time;
      f.draw(time);
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
