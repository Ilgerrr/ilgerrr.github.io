import * as THREE from 'three';
import { Universe } from './scene.js';
import { buildModel } from './model.js';
import { bridge, isNative, demoVault } from './bridge.js';
import { renderMarkdown } from './md.js';
import { escapeHtml, relTime, clamp } from './util.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const body = document.body;

const state = {
  name: 'Ilger',
  model: null,
  view: 'home',
  demo: false,
  playing: false,
  grow: 1.05,
  hover: -1,
  recorder: null
};

const uni = new Universe($('#gl'));

// =============== boot ===============
async function boot() {
  const params = new URLSearchParams(location.search);
  const s = await bridge.state();
  state.name = s.name || 'Ilger';
  if (s.data) start(s.data);
  else if (!isNative && params.has('demo')) start(demoVault(), true);
  else onboarding(s.detected || []);
  if (params.get('view')) setTimeout(() => setView(params.get('view')), 50);
}

function onboarding(detected) {
  body.classList.add('onboarding');
  setModel(buildModel(demoVault()));
  uni.setFilmOffset(0);
  uni.frameUniverse(1.25, 0.01);
  const ul = $('#ob-vaults');
  ul.innerHTML = detected.map((v, i) => `<li data-i="${i}"><b>${escapeHtml(v.name)}</b><span>${escapeHtml(v.path.replace(/^\/Users\/[^/]+/, '~'))}</span></li>`).join('');
  ul.onclick = async e => {
    const li = e.target.closest('li');
    if (!li) return;
    const data = await bridge.chooseVault(detected[+li.dataset.i].path);
    if (data) start(data);
  };
  $('#ob-choose').onclick = async () => { const data = await bridge.chooseVault(); if (data) start(data); };
  $('#ob-demo').onclick = () => start(demoVault(), true);
}

function start(data, demo = !!data.demo) {
  state.demo = demo;
  body.classList.remove('onboarding');
  body.classList.toggle('demo', demo);
  $('#vault-name').textContent = data.name;
  setModel(buildModel(data));
  renderHome();
  setView('home', true);
}

function setModel(model) {
  state.model = model;
  uni.setModel(model);
  buildLabels();
  updateTimelineLabel();
  requestAnimationFrame(() => body.classList.remove('booting'));
}

// live updates from Obsidian
bridge.onVaultChanged(data => {
  if (state.demo || !state.model) return;
  const selPath = uni.selected >= 0 ? state.model.notes[uni.selected].path : null;
  const focusKey = uni.focus >= 0 ? state.model.galaxies[uni.focus]?.key : null;
  setModel(buildModel(data));
  renderHome();
  if (selPath) {
    const n = state.model.notes.find(x => x.path === selPath);
    if (n) selectNote(n.i, { fly: false }); else closePanel();
  }
  if (focusKey != null) {
    const g = state.model.galaxies.find(x => x.key === focusKey);
    uni.setFocus(g ? g.id : -1);
  }
  const live = $('.live');
  live.classList.remove('pulse'); void live.offsetWidth; live.classList.add('pulse');
});

// =============== views ===============
function homeOffset() {
  const aspect = uni.width / uni.height;
  return -0.2 * 35 * Math.min(aspect, 2.2) * 2 * Math.tan(THREE.MathUtils.degToRad(20));
}

function setView(view, instant = false) {
  if (!state.model) return;
  const prev = state.view;
  state.view = view;
  body.dataset.view = view;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === view));
  moveIndicator();

  if (view === 'home') {
    closePanel();
    uni.setFocus(-1);
    uni.setFilmOffset(homeOffset());
    uni.controls.autoRotateSpeed = 0.22;
    uni.frameUniverse(1.08, instant ? 0.01 : 1.8);
    if (state.playing) togglePlay(false);
    setGrow(1.05);
  } else {
    state.view = view = 'universe';
    body.dataset.view = view;
    uni.setFilmOffset(0);
    uni.controls.autoRotateSpeed = 0.16;
    if (prev !== 'universe') uni.frameUniverse(1, 1.6);
  }
  uni.controls.autoRotate = true;
}

function moveIndicator() {
  const on = $('#tabs button.on');
  const ind = $('#tabs .seg-ind');
  if (!on) return;
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = `translateX(${on.offsetLeft}px)`;
}
window.addEventListener('resize', () => { moveIndicator(); if (state.view === 'home') uni.setFilmOffset(homeOffset()); });

$$('[data-go]').forEach(b => b.addEventListener('click', () => setView(b.dataset.go)));
$('[data-action="search"]').addEventListener('click', openSearch);

// =============== home / dashboard ===============
function greetingWord() {
  const h = new Date().getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function renderHome() {
  const m = state.model;
  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#today').textContent = today;
  $('#greeting').innerHTML = `${greetingWord()}, <span class="name">${escapeHtml(state.name)}</span><span class="dot">.</span>`;
  const s = m.stats;
  $('#stats').innerHTML = `<span><b>${s.notes}</b> notes</span><span><b>${s.links}</b> links</span><span><b>${s.galaxies}</b> stelsels</span><span><b>${s.newThisWeek}</b> nieuw deze week</span>`;
  $('#card-universe').textContent = `${s.galaxies} stelsels`;
  $('#card-notes').textContent = `${s.notes} notes · ⌘K`;
  bridge.dailyName().then(n => { $('#card-daily').textContent = n ? n.split('/').pop().replace(/\.md$/, '') : 'Daily note'; }).catch(() => {});

  const recent = [...m.notes].sort((a, b) => b.modified - a.modified).slice(0, 6);
  $('#recent-count').textContent = `${m.notes.length} totaal`;
  $('#recent').innerHTML = recent.map(n => {
    const g = m.galaxies[n.g];
    return `<li data-i="${n.i}"><i style="background:${g.color};box-shadow:0 0 8px ${g.color}"></i><span class="t">${escapeHtml(n.title)}</span><span class="w">${relTime(n.modified)}</span></li>`;
  }).join('');

  const top = m.galaxies.slice(0, 7);
  const max = Math.max(...top.map(g => g.count), 1);
  $('#gal-count').textContent = `${m.galaxies.length}`;
  $('#gal-list').innerHTML = top.map((g, k) => `<li data-g="${g.id}"><span class="n"><i style="background:${g.color};box-shadow:0 0 8px ${g.color}"></i>${escapeHtml(g.name)}</span><span class="c">${g.count}</span><span class="bar"><span style="width:${(g.count / max) * 100}%;background:${g.color};animation-delay:${k * 70}ms"></span></span></li>`).join('');

  renderHeatmap(m);
  $('#claude-cta').hidden = state.demo || !isNative || m.galaxies.some(g => g.key === 'Claude Chats');
}

function renderHeatmap(m) {
  const weeks = 26;
  const day = 864e5;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = (now.getDay() + 6) % 7; // monday = 0
  const start = now.getTime() - (weeks - 1) * 7 * day - dow * day;
  const counts = new Float32Array(weeks * 7);
  const bump = t => {
    const k = Math.floor((t - start) / day);
    if (k >= 0 && k < counts.length) counts[k]++;
  };
  m.notes.forEach(n => { bump(n.created); if (Math.abs(n.modified - n.created) > day / 2) bump(n.modified); });
  const nz = [...counts].filter(c => c > 0).sort((a, b) => a - b);
  const q = p => nz[Math.floor(p * (nz.length - 1))] || 1;
  const levels = [q(0.25), q(0.5), q(0.8)];
  const total = nz.reduce((a, b) => a + b, 0);
  const todayIdx = Math.floor((now.getTime() - start) / day);
  let html = '';
  for (let i = 0; i < weeks * 7; i++) {
    const c = counts[i];
    const l = i > todayIdx ? -1 : c === 0 ? 0 : c <= levels[0] ? 1 : c <= levels[1] ? 2 : c <= levels[2] ? 3 : 4;
    html += l < 0 ? '<i style="opacity:0"></i>' : `<i data-l="${l}" title="${new Date(start + i * day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · ${c}"></i>`;
  }
  $('#heatmap').innerHTML = html;
  $('#activity-label').textContent = `${total} wijzigingen · 6 maanden`;
}

$('#recent').addEventListener('click', e => { const li = e.target.closest('li'); if (li) selectNote(+li.dataset.i); });
$('#gal-list').addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  setView('universe');
  focusGalaxy(+li.dataset.g);
});
$('#card-daily-btn').addEventListener('click', async () => {
  await bridge.openDaily();
  toast(state.demo ? 'Demo — verbind je vault om je daily note te openen' : 'Daily note geopend in Obsidian');
});

$('#capture').addEventListener('submit', async e => {
  e.preventDefault();
  const input = $('#capture-input');
  const text = input.value.trim();
  if (!text) return;
  if (await agentAvailable()) { input.value = ''; openNebula(text); return; }
  try {
    const r = await bridge.capture(text);
    input.value = '';
    const f = $('#capture');
    f.classList.remove('sent'); void f.offsetWidth; f.classList.add('sent');
    toast(r.demo ? 'Demo — in je echte vault komt dit in je daily note' : `Opgeslagen in ${r.rel.split('/').pop()}`);
  } catch (err) {
    toast('Kon niet opslaan: ' + err.message, true);
  }
});

// =============== labels ===============
let labelEls = [];
function buildLabels() {
  const wrap = $('#labels');
  wrap.innerHTML = '';
  labelEls = state.model.galaxies.map(g => {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = `<i style="background:${g.color};box-shadow:0 0 8px ${g.color}"></i><span>${escapeHtml(g.name)}</span><em>${g.count}</em>`;
    el.addEventListener('click', e => { e.stopPropagation(); focusGalaxy(g.id); });
    wrap.appendChild(el);
    return el;
  });
}

const tmpV = new THREE.Vector3();
const upV = new THREE.Vector3();
const scr = {};
uni.onFrame = dt => {
  if (!state.model || !uni.layout) return;
  // labels
  upV.setFromMatrixColumn(uni.camera.matrixWorld, 1);
  state.model.galaxies.forEach((g, k) => {
    const el = labelEls[k];
    if (!el) return;
    const gx = uni.layout.galaxies[k];
    uni.galaxyAnchor(k, tmpV).addScaledVector(upV, gx.radius * 0.95);
    uni.project(tmpV, scr);
    const born = state.model.notes[g.notes[0]] && Math.min(...g.notes.slice(0, 50).map(i => state.model.notes[i].birth)) <= uni.uniforms.uGrow.value;
    el.style.display = scr.visible && born ? '' : 'none';
    el.style.transform = `translate3d(${scr.x.toFixed(1)}px, ${scr.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    el.classList.toggle('dim', uni.focus >= 0 && uni.focus !== k && uni.focusAmt > 0.3);
  });
  // selection marker
  const mk = $('#marker');
  if (uni.selected >= 0) {
    uni.project(uni.starPos(uni.selected, tmpV), scr);
    mk.classList.toggle('on', scr.visible);
    mk.style.transform = `translate3d(${scr.x}px, ${scr.y}px, 0)`;
  } else mk.classList.remove('on');
  // timeline playback
  if (state.playing) {
    setGrow(state.grow + dt / 14);
    if (state.grow >= 1.05) togglePlay(false);
  }
  if (state.recorder) {
    const t = Math.floor((performance.now() - state.recStart) / 1000);
    $('#rec-badge span').textContent = `REC ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }
};

// =============== picking ===============
const canvas = $('#gl');
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; uni.tween = null; hideHint(); });
canvas.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 5 || state.view === 'home') return;
  const i = uni.pick(e.clientX, e.clientY, 18);
  if (i >= 0) selectNote(i, { fly: false });
  else { closePanel(); uni.setFocus(-1); }
});
let hoverRaf = 0;
canvas.addEventListener('pointermove', e => {
  if (down || state.view === 'home') return;
  cancelAnimationFrame(hoverRaf);
  hoverRaf = requestAnimationFrame(() => {
    const i = uni.pick(e.clientX, e.clientY, 14);
    const tt = $('#tooltip');
    if (i >= 0) {
      const n = state.model.notes[i], g = state.model.galaxies[n.g];
      tt.innerHTML = `<b>${escapeHtml(n.title)}</b><span><i style="background:${g.color}"></i>${escapeHtml(g.name)} · ${n.degree} links</span>`;
      tt.style.left = e.clientX + 'px';
      tt.style.top = e.clientY + 'px';
      tt.classList.add('on');
      canvas.style.cursor = 'pointer';
    } else {
      tt.classList.remove('on');
      canvas.style.cursor = '';
    }
  });
});
canvas.addEventListener('pointerleave', () => $('#tooltip').classList.remove('on'));
canvas.addEventListener('wheel', () => { uni.tween = null; hideHint(); }, { passive: true });

function hideHint() { $('#hint').classList.add('gone'); }

function focusGalaxy(k) {
  uni.setFocus(k);
  uni.flyToGalaxy(k);
  closePanel();
}

// =============== note panel ===============
async function selectNote(i, { fly = true } = {}) {
  const m = state.model;
  const n = m.notes[i];
  if (!n) return;
  if (state.view === 'home') setView('universe');
  if (n.birth > state.grow) setGrow(1.05);
  if (uni.focus >= 0 && uni.focus !== n.g) uni.setFocus(-1);
  uni.select(i);
  if (fly) setTimeout(() => uni.flyToStar(i), state.view === 'universe' ? 0 : 50);
  const g = m.galaxies[n.g];
  $('#panel .gal-dot').style.cssText = `background:${g.color};color:${g.color}`;
  $('#panel-gal').textContent = g.name + (n.path.includes('/') ? ' · ' + n.path.split('/').slice(1, -1).join(' / ') : '');
  $('#panel-title').textContent = n.title;
  const created = new Date(n.created).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#panel-sub').textContent = `${created} · bewerkt ${relTime(n.modified)} · ${n.words} woorden`;
  $('#panel-tags').innerHTML = (n.tags || []).map(t => `<span>#${escapeHtml(t)}</span>`).join('');
  $('#panel-body').innerHTML = '<p class="muted">Laden…</p>';
  const nb = [...n.nb].sort((a, b) => m.notes[b].degree - m.notes[a].degree).slice(0, 40);
  $('#panel-nb-count').textContent = n.nb.length ? `· ${n.nb.length}` : '';
  $('#panel-nb').innerHTML = nb.length
    ? nb.map(j => { const o = m.notes[j], og = m.galaxies[o.g]; return `<li data-i="${j}"><i style="background:${og.color}"></i>${escapeHtml(o.title)}</li>`; }).join('')
    : '<li class="muted" style="cursor:default">Nog geen links</li>';
  $('#panel').classList.add('open');
  $('#panel').dataset.i = i;
  try {
    const txt = await bridge.readNote(n.path);
    if (+$('#panel').dataset.i === i) $('#panel-body').innerHTML = renderMarkdown(txt);
  } catch {
    $('#panel-body').innerHTML = `<p class="muted">${escapeHtml(n.excerpt || '')}</p>`;
  }
}

function closePanel() {
  $('#panel').classList.remove('open');
  uni.select(-1);
}

$('#panel-close').addEventListener('click', closePanel);
$('#panel-nb').addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) selectNote(+li.dataset.i); });
$('#panel-open').addEventListener('click', () => {
  const i = +$('#panel').dataset.i;
  const n = state.model.notes[i];
  if (!n) return;
  bridge.openNote(n.path);
  if (state.demo) toast('Demo — verbind je vault om notes in Obsidian te openen');
});
$('#panel-body').addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  if (a.dataset.note) {
    const t = a.dataset.note.toLowerCase().split('/').pop();
    const n = state.model.notes.find(x => x.title.toLowerCase() === t);
    if (n) selectNote(n.i); else toast('Notitie “' + a.dataset.note + '” bestaat nog niet');
  } else if (a.dataset.href) window.open(a.dataset.href);
});

// =============== timeline ===============
function setGrow(v) {
  state.grow = clamp(v, 0, 1.05);
  uni.setGrow(state.grow);
  const p = clamp(state.grow / 1.0, 0, 1);
  const tl = $('#tl');
  tl.value = Math.round(p * 1000);
  tl.style.setProperty('--p', p * 100 + '%');
  updateTimelineLabel();
}
function updateTimelineLabel() {
  const m = state.model;
  if (!m) return;
  const t = m.tMin + clamp(state.grow / 0.98, 0, 1) * (m.tMax - m.tMin);
  const d = new Date(state.grow >= 1 ? Date.now() : t).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
  $('#tl-date').textContent = d.charAt(0).toUpperCase() + d.slice(1);
  const n = state.grow >= 1 ? m.notes.length : m.notes.filter(x => x.birth <= state.grow).length;
  $('#tl-count').textContent = `${n} notes`;
}
function togglePlay(force) {
  state.playing = force ?? !state.playing;
  if (state.playing && state.grow >= 1.0) setGrow(0);
  $('#dock').classList.toggle('playing', state.playing);
}
$('#play').addEventListener('click', () => togglePlay());
$('#tl').addEventListener('input', e => { togglePlay(false); setGrow((+e.target.value / 1000) * (+e.target.value >= 1000 ? 1.05 : 1)); });

// =============== recording ===============
$('#rec').addEventListener('click', () => (state.recorder ? stopRecording() : startRecording()));
function startRecording() {
  const stream = canvas.captureStream(60);
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 18e6 });
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = async () => {
    const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
    const file = await bridge.saveRecording(buf);
    toast('Opname bewaard — ' + String(file).split('/').pop());
  };
  rec.start(250);
  state.recorder = rec;
  state.recStart = performance.now();
  body.classList.add('recording');
  $('#rec').classList.add('on');
  $('#rec span').textContent = 'Stop';
  toast('Opname loopt — druk H voor clean view');
}
function stopRecording() {
  state.recorder.stop();
  state.recorder = null;
  body.classList.remove('recording');
  $('#rec').classList.remove('on');
  $('#rec span').textContent = 'Opnemen';
}

// =============== clean view ===============
function toggleClean(force) {
  const on = force ?? !body.classList.contains('clean');
  body.classList.toggle('clean', on);
  if (on) toast('Clean view — H of Esc om terug te gaan');
}
$('#clean').addEventListener('click', () => toggleClean(true));

// =============== search ===============
let results = [], sel = 0;
function openSearch() {
  $('#search').classList.add('open');
  const inp = $('#search-input');
  inp.value = '';
  runSearch('');
  inp.focus();
  setTimeout(() => inp.focus(), 30);
}
function closeSearch() { $('#search').classList.remove('open'); }
function runSearch(q) {
  const m = state.model;
  if (!m) return;
  const s = q.trim().toLowerCase();
  if (!s) results = [...m.notes].sort((a, b) => b.modified - a.modified).slice(0, 12);
  else {
    results = m.notes
      .map(n => { const t = n.title.toLowerCase(); const k = t.indexOf(s); return { n, score: k < 0 ? (n.path.toLowerCase().includes(s) ? 50 : -1) : k === 0 ? 0 : 10 + k }; })
      .filter(x => x.score >= 0)
      .sort((a, b) => a.score - b.score || b.n.degree - a.n.degree)
      .slice(0, 40)
      .map(x => x.n);
  }
  sel = 0;
  const hl = t => {
    if (!s) return escapeHtml(t);
    const k = t.toLowerCase().indexOf(s);
    return k < 0 ? escapeHtml(t) : escapeHtml(t.slice(0, k)) + '<mark>' + escapeHtml(t.slice(k, k + s.length)) + '</mark>' + escapeHtml(t.slice(k + s.length));
  };
  $('#search-results').innerHTML = results.length
    ? results.map((n, k) => { const g = m.galaxies[n.g]; return `<li data-k="${k}" class="${k === 0 ? 'on' : ''}"><i style="background:${g.color};box-shadow:0 0 8px ${g.color}"></i><span class="t">${hl(n.title)}</span><span class="g">${escapeHtml(g.name)}</span></li>`; }).join('')
    : '<li class="empty">Niets gevonden</li>';
}
function moveSel(d) {
  if (!results.length) return;
  sel = (sel + d + results.length) % results.length;
  $$('#search-results li').forEach((li, k) => li.classList.toggle('on', k === sel));
  $$('#search-results li')[sel]?.scrollIntoView({ block: 'nearest' });
}
$('#search-input').addEventListener('input', e => runSearch(e.target.value));
$('#search-input').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
  else if (e.key === 'Enter' && results[sel]) { closeSearch(); selectNote(results[sel].i); }
});
$('#search-results').addEventListener('click', e => { const li = e.target.closest('li[data-k]'); if (li) { closeSearch(); selectNote(results[+li.dataset.k].i); } });
$('#search').addEventListener('click', e => { if (e.target.id === 'search') closeSearch(); });
$('#btn-search').addEventListener('click', openSearch);

// =============== settings ===============
async function openSettings() {
  $('#settings').classList.add('open');
  $('#set-name').value = state.name;
  $('#set-vault').textContent = state.demo ? 'Demo vault' : state.model?.root || '—';
  refreshClaude();
  const detected = await bridge.detectedVaults();
  $('#set-vaults').innerHTML = detected.map((v, i) => `<li data-i="${i}" class="${v.path === state.model?.root ? 'on' : ''}"><b>${escapeHtml(v.name)}</b><span>${escapeHtml(v.path.replace(/^\/Users\/[^/]+/, '~'))}</span></li>`).join('');
  $('#set-vaults').onclick = async e => {
    const li = e.target.closest('li');
    if (!li) return;
    const data = await bridge.chooseVault(detected[+li.dataset.i].path);
    if (data) { closeSettings(); start(data, false); }
  };
}
async function refreshClaude() {
  if (!bridge.claudeStatus) return;
  const st = await bridge.claudeStatus();
  state.claude = st;
  const s = $('#cl-desktop-status');
  s.textContent = st.desktop ? 'Verbonden — herstart Claude Desktop als je dit net deed' : 'Laat Claude je vault lezen, schrijven en Nebula besturen';
  s.classList.toggle('ok', st.desktop);
  $('#cl-desktop').textContent = st.desktop ? 'Opnieuw' : 'Verbind';
  $('#cl-sessions').disabled = !st.hasCodeSessions;
}
async function busy(btn, fn) {
  btn.classList.add('busy');
  try { await fn(); } catch (e) { toast(e.message || String(e), true); } finally { btn.classList.remove('busy'); }
}
function needsVault() {
  if (state.demo || !isNative) { toast('Verbind eerst je eigen vault (in de Mac-app)', true); return true; }
  return false;
}
$('#cl-desktop').addEventListener('click', e => busy(e.currentTarget, async () => {
  if (!isNative) return toast('Werkt in de Mac-app', true);
  await bridge.connectClaudeDesktop();
  await refreshClaude();
  toast('Claude Desktop verbonden — herstart Claude Desktop');
}));
$('#cl-code').addEventListener('click', e => busy(e.currentTarget, async () => {
  if (!state.claude) return toast('Werkt in de Mac-app', true);
  await navigator.clipboard.writeText(state.claude.codeCommand);
  toast('Gekopieerd — plak het in Terminal');
}));
$('#cl-export').addEventListener('click', e => busy(e.currentTarget, async () => {
  if (needsVault()) return;
  const r = await bridge.importClaudeExport();
  if (r) toast(`${r.imported} chats geïmporteerd in ${r.folder}`);
}));
$('#cl-sessions').addEventListener('click', e => busy(e.currentTarget, async () => {
  if (needsVault()) return;
  const r = await bridge.importClaudeCode();
  toast(r.imported ? `${r.imported} Claude Code-sessies geïmporteerd` : 'Geen Claude Code-sessies gevonden');
}));
$('#claude-cta').addEventListener('click', openSettings);

bridge.onClaudeSynced?.(msg => toast(msg.text, !!msg.error));

// Claude (via MCP) steering the app
bridge.onControl?.(msg => {
  if (!state.model) return;
  if (msg.path) {
    const ref = msg.path.replace(/\.md$/i, '').toLowerCase();
    const n = state.model.notes.find(x => x.path.replace(/\.md$/i, '').toLowerCase() === ref) || state.model.notes.find(x => x.title.toLowerCase() === ref.split('/').pop());
    if (n) selectNote(n.i); else toast('Claude zocht “' + msg.path + '” maar die bestaat niet', true);
  } else if (msg.view) setView(msg.view);
});

function closeSettings() { $('#settings').classList.remove('open'); }
let nameTimer;
$('#set-name').addEventListener('input', e => {
  clearTimeout(nameTimer);
  nameTimer = setTimeout(async () => {
    const v = e.target.value.trim();
    if (!v) return;
    state.name = await bridge.setName(v);
    renderHome();
  }, 300);
});
$('#set-choose').addEventListener('click', async () => { const data = await bridge.chooseVault(); if (data) { closeSettings(); start(data, false); } });
$('#set-reveal').addEventListener('click', () => bridge.revealVault());
$('#set-done').addEventListener('click', closeSettings);
$('#settings').addEventListener('click', e => { if (e.target.id === 'settings') closeSettings(); });
$('#btn-settings').addEventListener('click', openSettings);
$('#vault-chip').addEventListener('click', openSettings);

// =============== Hey Nebula ===============
const TOOL_LABEL = {
  nebula_overview: ['vault', () => 'Bekijkt je vault'],
  nebula_search: ['vault', a => `Zoekt “${a.query || ''}”`],
  nebula_read: ['vault', a => `Leest ${String(a.path || '').split('/').pop()}`],
  nebula_write: ['vault', a => `Schrijft ${String(a.path || '').split('/').pop()}`],
  nebula_capture: ['vault', () => 'Noteert in je daily note'],
  nebula_save_chat: ['vault', () => 'Bewaart dit gesprek'],
  nebula_show: ['vault', () => 'Toont het in Nebula'],
  nebula_memory: ['memory', () => 'Leest je geheugen'],
  nebula_remember: ['memory', a => `Onthoudt: ${a.fact || ''}`],
  nebula_forget: ['memory', a => `Vergeet: ${a.text || ''}`],
  nebula_reminder: ['reminder', a => `Herinnering: ${a.title || ''}${a.when ? ' · ' + String(a.when).replace('T', ' ') : ''}`],
  nebula_event: ['event', a => `Afspraak: ${a.title || ''} · ${String(a.start || '').replace('T', ' ')}`],
  nebula_agenda: ['event', () => 'Bekijkt je agenda'],
  nebula_open_app: ['app', a => `Opent ${a.name || ''}`],
  WebSearch: ['app', a => `Zoekt op het web${a.query ? ': ' + a.query : ''}`],
  WebFetch: ['app', () => 'Leest een webpagina']
};
const neb = { open: false, busy: null, sessionId: null, lastAt: 0, available: null };

async function agentAvailable() {
  if (!bridge.agentAsk) return false;
  if (neb.available === null) neb.available = await bridge.agentAvailable().catch(() => false);
  return neb.available;
}

function openNebula(prefill) {
  if (!state.model) return;
  neb.open = true;
  $('#hey').classList.add('open');
  const inp = $('#nb-input');
  if (Date.now() - neb.lastAt > 30 * 60 * 1000) newConversation();
  inp.focus();
  setTimeout(() => inp.focus(), 40);
  if (prefill) askNebula(prefill);
}
function closeNebula() { neb.open = false; $('#hey').classList.remove('open'); }
function newConversation() {
  if (neb.busy) bridge.agentCancel?.(neb.busy);
  neb.busy = null; neb.sessionId = null;
  body.classList.remove('thinking');
  $('#nb-thread').innerHTML = '';
}

function addMsg(cls, html) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.innerHTML = html;
  const th = $('#nb-thread');
  th.appendChild(el);
  th.scrollTop = th.scrollHeight;
  return el;
}
const fmtAnswer = t => escapeHtml(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

async function askNebula(text) {
  text = text.trim();
  if (!text || neb.busy) return;
  $('#nb-input').value = '';
  addMsg('you', escapeHtml(text));
  const turn = addMsg('neb turn', '<div class="chips"></div><div class="typing"><b></b><b></b><b></b><span>Denkt na…</span></div>');
  neb.lastAt = Date.now();

  if (!(await agentAvailable())) {
    turn.querySelector('.typing').remove();
    if (!isNative) turn.insertAdjacentHTML('beforeend', 'Demo — in de Mac-app voert Claude dit echt uit: herinneringen, agenda, apps en je vault.');
    else turn.insertAdjacentHTML('beforeend', 'Ik vind Claude Code niet op deze Mac. Installeer het en log één keer in met <code>claude</code> in Terminal.');
    turn.classList.add('err');
    return;
  }
  const id = 'q' + Date.now();
  neb.busy = id;
  body.classList.add('thinking');
  const r = await bridge.agentAsk(id, text, neb.sessionId);
  if (r && r.error === 'novault') { onAgentEvent({ id, type: 'done', error: 'novault', text: 'Kies eerst je vault in Instellingen.' }); }
}

function onAgentEvent(ev) {
  if (ev.id !== neb.busy) return;
  const turn = [...$$('#nb-thread .turn')].pop();
  if (!turn) return;
  const typing = turn.querySelector('.typing');
  if (ev.type === 'tool' && ev.name === 'ToolSearch') return;
  if (ev.type === 'tool') {
    const [kind, label] = TOOL_LABEL[ev.name] || ['app', () => ev.name];
    turn.querySelector('.chips').insertAdjacentHTML('beforeend', `<span class="chip2 k-${kind}"><i></i><span>${escapeHtml(label(ev.input || {}))}</span></span>`);
    if (typing) typing.querySelector('span').textContent = 'Bezig…';
  } else if (ev.type === 'done') {
    if (typing) typing.remove();
    turn.insertAdjacentHTML('beforeend', `<div>${fmtAnswer(ev.text || '')}</div>`);
    if (ev.error) turn.classList.add('err');
    if (ev.sessionId) neb.sessionId = ev.sessionId;
    neb.busy = null;
    neb.lastAt = Date.now();
    body.classList.remove('thinking');
    if (!neb.open) toast(String(ev.text || '').slice(0, 120));
  }
  const th = $('#nb-thread');
  th.scrollTop = th.scrollHeight;
}
bridge.onAgentEvent?.(onAgentEvent);
bridge.onSummon?.(() => openNebula());

$('#nb-form').addEventListener('submit', e => { e.preventDefault(); askNebula($('#nb-input').value); });
$('#nb-new').addEventListener('click', () => { newConversation(); $('#nb-input').focus(); });
$('#hey').addEventListener('click', e => { if (e.target.id === 'hey') closeNebula(); });

// =============== keyboard ===============
window.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); openNebula(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && neb.open) { e.preventDefault(); newConversation(); return; }
  if (e.key === 'Escape') {
    if (neb.open) return closeNebula();
    if ($('#search').classList.contains('open')) return closeSearch();
    if ($('#settings').classList.contains('open')) return closeSettings();
    if (body.classList.contains('clean')) return toggleClean(false);
    if ($('#panel').classList.contains('open')) return closePanel();
    if (uni.focus >= 0) { uni.setFocus(-1); return; }
    if (typing) document.activeElement.blur();
    return;
  }
  if (typing || body.classList.contains('onboarding') || e.metaKey || e.ctrlKey) return;
  if (e.key === '/') { e.preventDefault(); openNebula(); return; }
  if (e.key === '1') setView('home');
  else if (e.key === '2') setView('universe');
  else if (e.key === ' ' && state.view !== 'home') { e.preventDefault(); togglePlay(); }
  else if (e.key.toLowerCase() === 'h' && state.view !== 'home') toggleClean();
});

// =============== toast ===============
let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  t.innerHTML = `<i style="${err ? 'background:#f13936;box-shadow:0 0 8px #f13936' : ''}"></i>${escapeHtml(msg)}`;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2800);
}

// refresh the greeting/relative times every minute
setInterval(() => { if (state.model) renderHome(); }, 60000);

boot();
