#!/usr/bin/env node
// Nebula MCP server (stdio). Lets Claude search, read and write the Obsidian vault Nebula is connected to,
// and steer the Nebula app (fly to a note, switch to the brain view).
// Runs with plain Node or with the Nebula app binary (ELECTRON_RUN_AS_NODE=1).
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const http = require('http');
const vault = require('../src/vault');
const claude = require('../src/claude-import');

const VERSION = '1.0.0';

function userDataDir() {
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'Nebula');
  if (process.platform === 'win32') return path.join(process.env.APPDATA || home, 'Nebula');
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'Nebula');
}
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }
function vaultRoot() {
  const p = process.env.NEBULA_VAULT || readJson(path.join(userDataDir(), 'config.json')).vaultPath;
  if (!p || !fs.existsSync(p)) throw new Error('Geen vault verbonden. Open Nebula en kies je Obsidian-vault.');
  return p;
}

let cache = null;
async function scan() {
  const root = vaultRoot();
  if (!cache || cache.root !== root || Date.now() - cache.at > 5000) cache = { root, at: Date.now(), data: await vault.scanVault(root) };
  return cache.data;
}
function findNote(data, ref) {
  const r = String(ref || '').replace(/\.md$/i, '').toLowerCase().trim();
  const byPath = data.notes.findIndex(n => n.path.replace(/\.md$/i, '').toLowerCase() === r);
  return byPath >= 0 ? byPath : data.notes.findIndex(n => n.title.toLowerCase() === r.split('/').pop());
}
function neighbours(data, i) {
  const out = [];
  for (const [a, b] of data.links) { if (a === i) out.push(b); else if (b === i) out.push(a); }
  return out.map(j => data.notes[j].path);
}

function control(body) {
  const c = readJson(path.join(userDataDir(), 'control.json'));
  if (!c.port || !c.token) return Promise.resolve('Nebula draait niet — open de app om dit te tonen.');
  return new Promise(resolve => {
    const req = http.request({ host: '127.0.0.1', port: c.port, path: '/control', method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.token }, timeout: 3000 }, res => {
      let s = ''; res.on('data', d => (s += d)); res.on('end', () => resolve(res.statusCode === 200 ? 'Getoond in Nebula.' : 'Nebula gaf fout ' + res.statusCode + ': ' + s));
    });
    req.on('error', () => resolve('Nebula draait niet — open de app om dit te tonen.'));
    req.on('timeout', () => { req.destroy(); resolve('Nebula reageerde niet.'); });
    req.end(JSON.stringify(body));
  });
}

const TOOLS = [
  {
    name: 'nebula_overview',
    description: 'Overzicht van de Obsidian-vault van de gebruiker: aantal notes en links, de mappen (sterrenstelsels) met aantallen, en de recent bewerkte notes. Begin hiermee om de vault te leren kennen.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nebula_search',
    description: 'Zoek notes in de vault op titel, pad, tag of tekst. Geeft paden terug die je met nebula_read kunt lezen.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number', description: 'max resultaten (standaard 20)' } }, required: ['query'] }
  },
  {
    name: 'nebula_read',
    description: 'Lees de volledige inhoud van een note, plus de notes waarnaar hij linkt en die naar hem linken.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'pad (bv. "Projecten/Showreel.md") of titel' } }, required: ['path'] }
  },
  {
    name: 'nebula_write',
    description: 'Maak of wijzig een note in de vault. mode "create" faalt als de note al bestaat, "append" voegt toe aan het eind, "overwrite" vervangt de inhoud. Gebruik [[Titel]] om naar andere notes te linken.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'pad relatief aan de vault, eindigend op .md' }, content: { type: 'string' }, mode: { type: 'string', enum: ['create', 'append', 'overwrite'] } }, required: ['path', 'content'] }
  },
  {
    name: 'nebula_capture',
    description: 'Zet een korte gedachte met tijdstip in de daily note van vandaag (volgens de Daily notes-instellingen van Obsidian).',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }
  },
  {
    name: 'nebula_save_chat',
    description: 'Bewaar (een samenvatting van) dit gesprek als note in de map "Claude Chats/Opgeslagen". Notes die in de tekst genoemd worden, worden automatisch gelinkt.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, markdown: { type: 'string', description: 'de inhoud van het gesprek of de samenvatting in Markdown' } }, required: ['title', 'markdown'] }
  },
  {
    name: 'nebula_show',
    description: 'Stuur de Nebula-app aan: vlieg naar een note in het universum, of wissel van weergave (home, universe, brain).',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'note om te tonen (optioneel)' }, view: { type: 'string', enum: ['home', 'universe', 'brain'] } } }
  }
];

async function callTool(name, a = {}) {
  if (name === 'nebula_overview') {
    const d = await scan();
    const folders = {};
    d.notes.forEach(n => { const k = n.folder || '(root)'; folders[k] = (folders[k] || 0) + 1; });
    const recent = [...d.notes].sort((x, y) => y.modified - x.modified).slice(0, 15).map(n => `- ${n.path} (${new Date(n.modified).toISOString().slice(0, 16).replace('T', ' ')})`);
    return [
      `Vault: ${d.name} (${d.root})`,
      `${d.notes.length} notes, ${d.links.length} links`,
      '', 'Mappen / sterrenstelsels:',
      ...Object.entries(folders).sort((x, y) => y[1] - x[1]).map(([k, v]) => `- ${k}: ${v}`),
      '', 'Recent bewerkt:', ...recent
    ].join('\n');
  }
  if (name === 'nebula_search') {
    const d = await scan();
    const q = String(a.query || '').toLowerCase();
    const limit = Math.min(100, a.limit || 20);
    const scored = [];
    for (const n of d.notes) {
      let s = -1;
      const t = n.title.toLowerCase();
      if (t === q) s = 100; else if (t.startsWith(q)) s = 80; else if (t.includes(q)) s = 60;
      else if (n.path.toLowerCase().includes(q)) s = 40;
      else if (n.tags.some(x => x.toLowerCase().includes(q))) s = 35;
      if (s < 0) {
        const txt = (await vault.readNote(d.root, n.path).catch(() => '')).toLowerCase();
        const k = txt.indexOf(q);
        if (k >= 0) s = 20;
      }
      if (s >= 0) scored.push({ n, s });
    }
    scored.sort((x, y) => y.s - x.s || y.n.modified - x.n.modified);
    if (!scored.length) return `Niets gevonden voor "${a.query}".`;
    return scored.slice(0, limit).map(({ n }) => `- ${n.path}${n.excerpt ? ' — ' + n.excerpt.replace(/\s+/g, ' ').slice(0, 110) : ''}`).join('\n');
  }
  if (name === 'nebula_read') {
    const d = await scan();
    const i = findNote(d, a.path);
    if (i < 0) throw new Error(`Note "${a.path}" niet gevonden. Gebruik nebula_search.`);
    const n = d.notes[i];
    const text = await vault.readNote(d.root, n.path);
    const nb = neighbours(d, i);
    return `# ${n.path}\n(aangemaakt ${new Date(n.created).toISOString().slice(0, 10)}, bewerkt ${new Date(n.modified).toISOString().slice(0, 16).replace('T', ' ')})\n\n${text}\n\n---\nVerbonden notes (${nb.length}): ${nb.join(', ') || 'geen'}`;
  }
  if (name === 'nebula_write') {
    const root = vaultRoot();
    let rel = String(a.path || '').replace(/^\/+/, '');
    if (!/\.md$/i.test(rel)) rel += '.md';
    const full = vault.safeJoin(root, rel);
    const mode = a.mode || 'create';
    const exists = fs.existsSync(full);
    if (mode === 'create' && exists) throw new Error(`"${rel}" bestaat al. Gebruik mode "append" of "overwrite".`);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    if (mode === 'append' && exists) {
      const cur = await fsp.readFile(full, 'utf8');
      await fsp.appendFile(full, (cur.endsWith('\n') ? '' : '\n') + a.content + '\n', 'utf8');
    } else await fsp.writeFile(full, a.content, 'utf8');
    cache = null;
    return `${mode === 'append' ? 'Toegevoegd aan' : exists ? 'Overschreven' : 'Aangemaakt'}: ${rel}`;
  }
  if (name === 'nebula_capture') {
    const r = await vault.captureThought(vaultRoot(), a.text);
    cache = null;
    return `Opgeslagen in ${r.rel}`;
  }
  if (name === 'nebula_save_chat') {
    const d = await scan();
    const rel = await claude.saveChat(d.root, a, d.notes.map(n => n.title));
    cache = null;
    return `Gesprek bewaard als ${rel}`;
  }
  if (name === 'nebula_show') {
    return control({ path: a.path, view: a.view });
  }
  throw new Error('Onbekende tool: ' + name);
}

// ---------- JSON-RPC over stdio ----------
const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
async function handle(msg) {
  const { id, method, params } = msg;
  if (id === undefined || id === null) return; // notification
  try {
    let result;
    if (method === 'initialize') {
      result = { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'nebula', version: VERSION }, instructions: 'Nebula is de Obsidian-vault (het tweede brein) van de gebruiker. Gebruik nebula_overview om te beginnen en nebula_search/nebula_read om context uit zijn notes te halen. Bewaar aan het eind van elk betekenisvol gesprek automatisch een korte samenvatting met nebula_save_chat, zodat het gesprek in zijn universum komt.' };
    } else if (method === 'ping') result = {};
    else if (method === 'tools/list') result = { tools: TOOLS };
    else if (method === 'tools/call') {
      try {
        const text = await callTool(params.name, params.arguments || {});
        result = { content: [{ type: 'text', text: String(text) }] };
      } catch (e) {
        result = { content: [{ type: 'text', text: 'Fout: ' + e.message }], isError: true };
      }
    } else if (method === 'resources/list') result = { resources: [] };
    else if (method === 'prompts/list') result = { prompts: [] };
    else return send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } });
    send({ jsonrpc: '2.0', id, result });
  } catch (e) {
    send({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } });
  }
}

let buf = '';
let queue = Promise.resolve();
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let k;
  while ((k = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, k).trim();
    buf = buf.slice(k + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    queue = queue.then(() => handle(msg));
  }
});
process.stdin.on('end', () => queue.then(() => process.exit(0)));
