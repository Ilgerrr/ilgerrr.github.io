/* ilger. — liquid glass.
   Same idea as a liquid-glass shader: inside a rounded box the background is blurred, near the rim it bends
   (displacement pulls content from further inside, like a lens), and a rim light sits along the edge.
   Done with an SVG displacement filter in backdrop-filter, so it refracts the real page underneath.
   Chrome/Edge only; other browsers keep the frosted glass from the CSS. */
(() => {
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const chromium = brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  if (!chromium || weak || matchMedia('(prefers-reduced-transparency: reduce)').matches) return;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  document.body.appendChild(svg);
  let count = 0;

  // displacement map for a rounded box: neutral grey inside, pushed along the edge normal near the rim
  function makeMap(w, h, r, edge) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const hw = w / 2, hh = h / 2;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const px = i + 0.5 - hw, py = j + 0.5 - hh;
        const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r; // < 0 inside
        let gx, gy;
        if (qx > 0 && qy > 0) { const l = Math.hypot(ox, oy) || 1; gx = (ox / l) * Math.sign(px); gy = (oy / l) * Math.sign(py); }
        else if (qx > qy) { gx = Math.sign(px); gy = 0; }
        else { gx = 0; gy = Math.sign(py); }
        let t = 1 + sd / edge; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const e = t * t * (3 - 2 * t);
        const k = (j * w + i) * 4;
        d[k] = 128 - gx * e * 127;
        d[k + 1] = 128 - gy * e * 127;
        d[k + 2] = 128;
        d[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function liquefy(el) {
    if (el.dataset.liquid) return;
    el.dataset.liquid = '1';
    const id = 'lg' + count++;
    const f = document.createElementNS(NS, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', '100%'); f.setAttribute('height', '100%');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    const map = document.createElementNS(NS, 'feImage');
    map.setAttribute('result', 'map');
    map.setAttribute('preserveAspectRatio', 'none');
    const dm = document.createElementNS(NS, 'feDisplacementMap');
    dm.setAttribute('in', 'SourceGraphic');
    dm.setAttribute('in2', 'map');
    dm.setAttribute('xChannelSelector', 'R');
    dm.setAttribute('yChannelSelector', 'G');
    f.append(map, dm);
    svg.appendChild(f);
    let last = '';
    const update = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const key = w + 'x' + h;
      if (key === last) return;
      last = key;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      map.setAttribute('width', w); map.setAttribute('height', h);
      map.setAttribute('href', makeMap(w, h, r, Math.min(h * 0.5, 26)));
      dm.setAttribute('scale', String(Math.round(Math.min(h, 64) * 0.85)));
      el.style.setProperty('--glass', `url(#${id})`);
      el.classList.add('is-liquid');
    };
    new ResizeObserver(update).observe(el);
    update();
  }

  const scan = () => document.querySelectorAll('[data-glass]').forEach(liquefy);
  scan();

  // rim light follows the pointer
  let raf = 0, mx = -999, my = -999;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      document.querySelectorAll('.glass').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const dx = Math.max(r.left - mx, 0, mx - r.right), dy = Math.max(r.top - my, 0, my - r.bottom);
        if (dx > 260 || dy > 260) return; // far away: leave it, no repaint
        el.style.setProperty('--lx', `${mx - r.left}px`);
        el.style.setProperty('--ly', `${my - r.top}px`);
      });
    });
  }, { passive: true });
})();
