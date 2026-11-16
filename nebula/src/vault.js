// Reads an Obsidian vault from disk: notes, [[links]], folders, dates, daily-note settings.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const SKIP_DIRS = new Set(['.obsidian', '.trash', '.git', 'node_modules']);

async function walk(root) {
  const out = [];
  async function rec(dir) {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await rec(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(full);
    }
  }
  await rec(root);
  return out;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const WIKI_RE = /!?\[\[([^\]|#^\n]+)(?:[#^][^\]|\n]*)?(?:\|[^\]\n]*)?\]\]/g;
const MD_LINK_RE = /\]\(([^)\s]+?\.md)(?:#[^)]*)?\)/g;
const TAG_RE = /(^|\s)#([\p{L}\p{N}_\-/]+)/gu;

function parseFrontmatter(text) {
  const m = text.match(FM_RE);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  let lastKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1].toLowerCase();
      fm[lastKey] = kv[2].trim().replace(/^["']|["']$/g, '');
    } else if (lastKey && /^\s*-\s+/.test(line)) {
      const v = line.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, '');
      fm[lastKey] = (fm[lastKey] ? fm[lastKey] + ',' : '') + v;
    }
  }
  return { fm, body: text.slice(m[0].length) };
}

function fmDate(fm) {
  for (const k of ['created', 'date', 'created_at', 'creation date', 'aangemaakt', 'datum']) {
    if (fm[k]) {
      const t = Date.parse(fm[k]);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

async function scanVault(root) {
  const files = await walk(root);
  const notes = [];
  const raw = [];
  for (const full of files) {
    let text, st;
    try {
      [text, st] = await Promise.all([fsp.readFile(full, 'utf8'), fsp.stat(full)]);
    } catch { continue; }
    const rel = path.relative(root, full).split(path.sep).join('/');
    const parts = rel.split('/');
    const { fm, body } = parseFrontmatter(text);
    const tags = new Set();
    if (fm.tags) fm.tags.replace(/[\[\]]/g, '').split(/[,\s]+/).filter(Boolean).forEach(t => tags.add(t.replace(/^#/, '')));
    for (const m of body.matchAll(TAG_RE)) tags.add(m[2]);
    const birth = st.birthtimeMs && st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs;
    const created = fmDate(fm) || Math.min(birth, st.mtimeMs);
    const clean = body.trim();
    notes.push({
      id: rel,
      title: path.basename(rel, path.extname(rel)),
      path: rel,
      folder: parts.length > 1 ? parts[0] : '',
      created,
      modified: st.mtimeMs,
      words: clean ? clean.split(/\s+/).length : 0,
      tags: [...tags].slice(0, 12),
      excerpt: clean.slice(0, 320)
    });
    raw.push(body);
  }

  // resolve links by path or by basename (Obsidian's "shortest path" behaviour)
  const byName = new Map();
  const byPath = new Map();
  notes.forEach((n, i) => {
    const key = n.title.toLowerCase();
    if (!byName.has(key)) byName.set(key, i);
    byPath.set(n.path.replace(/\.md$/i, '').toLowerCase(), i);
  });
  const resolve = target => {
    let t = target.trim().replace(/\\/g, '/');
    try { t = decodeURI(t); } catch {}
    t = t.replace(/^\.?\//, '').replace(/\.md$/i, '').toLowerCase();
    if (byPath.has(t)) return byPath.get(t);
    const base = t.split('/').pop();
    return byName.has(base) ? byName.get(base) : -1;
  };
  const seen = new Set();
  const links = [];
  raw.forEach((body, i) => {
    const add = target => {
      const j = resolve(target);
      if (j < 0 || j === i) return;
      const a = Math.min(i, j), b = Math.max(i, j);
      const key = a * 1e6 + b;
      if (seen.has(key)) return;
      seen.add(key);
      links.push([a, b]);
    };
    for (const m of body.matchAll(WIKI_RE)) add(m[1]);
    for (const m of body.matchAll(MD_LINK_RE)) add(m[1]);
  });

  return {
    name: path.basename(root),
    root,
    notes,
    links,
    daily: await dailyConfig(root),
    scannedAt: Date.now()
  };
}

async function readNote(root, rel) {
  const full = safeJoin(root, rel);
  return fsp.readFile(full, 'utf8');
}

function safeJoin(root, rel) {
  const full = path.resolve(root, rel);
  if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error('Pad buiten vault');
  return full;
}

// ---------- daily notes ----------
async function dailyConfig(root) {
  const cfg = { folder: '', format: 'YYYY-MM-DD', template: '' };
  try {
    const j = JSON.parse(await fsp.readFile(path.join(root, '.obsidian', 'daily-notes.json'), 'utf8'));
    if (j.folder) cfg.folder = j.folder.replace(/^\/+|\/+$/g, '');
    if (j.format) cfg.format = j.format;
    if (j.template) cfg.template = j.template;
  } catch {}
  return cfg;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n, l = 2) => String(n).padStart(l, '0');

function formatMoment(d, fmt) {
  return fmt.replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|dddd|ddd|dd|HH|H|mm|ss/g, (tok, lit) => {
    if (lit !== undefined) return lit;
    switch (tok) {
      case 'YYYY': return d.getFullYear();
      case 'YY': return pad(d.getFullYear() % 100);
      case 'MMMM': return MONTHS[d.getMonth()];
      case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
      case 'MM': return pad(d.getMonth() + 1);
      case 'M': return d.getMonth() + 1;
      case 'Do': { const n = d.getDate(); const t = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'); return n + t; }
      case 'DD': return pad(d.getDate());
      case 'D': return d.getDate();
      case 'dddd': return DAYS[d.getDay()];
      case 'ddd': return DAYS[d.getDay()].slice(0, 3);
      case 'dd': return DAYS[d.getDay()].slice(0, 2);
      case 'HH': return pad(d.getHours());
      case 'H': return d.getHours();
      case 'mm': return pad(d.getMinutes());
      case 'ss': return pad(d.getSeconds());
    }
    return tok;
  });
}

async function dailyNotePath(root, create) {
  const cfg = await dailyConfig(root);
  const now = new Date();
  const rel = (cfg.folder ? cfg.folder + '/' : '') + formatMoment(now, cfg.format) + '.md';
  const full = safeJoin(root, rel);
  if (create && !fs.existsSync(full)) {
    await fsp.mkdir(path.dirname(full), { recursive: true });
    let initial = '';
    if (cfg.template) {
      try {
        initial = await fsp.readFile(safeJoin(root, cfg.template.replace(/\.md$/i, '') + '.md'), 'utf8');
        initial = initial
          .replace(/\{\{date(?::([^}]+))?\}\}/g, (_, f) => formatMoment(now, f || cfg.format))
          .replace(/\{\{time(?::([^}]+))?\}\}/g, (_, f) => formatMoment(now, f || 'HH:mm'))
          .replace(/\{\{title\}\}/g, path.basename(rel, '.md'));
      } catch {}
    }
    await fsp.writeFile(full, initial, 'utf8');
  }
  return { rel, full };
}

async function captureThought(root, text) {
  const { rel, full } = await dailyNotePath(root, true);
  const now = new Date();
  let current = '';
  try { current = await fsp.readFile(full, 'utf8'); } catch {}
  const line = `- ${pad(now.getHours())}:${pad(now.getMinutes())} ${text.trim()}`;
  const sep = current.length === 0 || current.endsWith('\n') ? '' : '\n';
  await fsp.appendFile(full, sep + line + '\n', 'utf8');
  return { rel };
}

// ---------- Obsidian's own vault list ----------
function obsidianConfigPath() {
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json');
  if (process.platform === 'win32') return path.join(process.env.APPDATA || home, 'obsidian', 'obsidian.json');
  return path.join(home, '.config', 'obsidian', 'obsidian.json');
}

async function detectVaults() {
  try {
    const j = JSON.parse(await fsp.readFile(obsidianConfigPath(), 'utf8'));
    return Object.values(j.vaults || {})
      .filter(v => v.path && fs.existsSync(v.path))
      .map(v => ({ path: v.path, name: path.basename(v.path), ts: v.ts || 0, open: !!v.open }))
      .sort((a, b) => (b.open - a.open) || (b.ts - a.ts));
  } catch {
    return [];
  }
}

function watchVault(root, onChange) {
  let timer = null;
  let watcher;
  try {
    watcher = fs.watch(root, { recursive: true }, (_ev, file) => {
      if (file && /(^|[\/\\])\.(obsidian|trash|git)([\/\\]|$)/.test(file)) return;
      if (file && /\.[a-z0-9]+$/i.test(file) && !/\.md$/i.test(file)) return;
      clearTimeout(timer);
      timer = setTimeout(onChange, 700);
    });
  } catch {
    return () => {};
  }
  return () => { clearTimeout(timer); watcher.close(); };
}

module.exports = { scanVault, readNote, captureThought, dailyNotePath, detectVaults, watchVault, formatMoment, safeJoin };
