// Imports Claude conversations into the vault as Markdown notes.
//  - claude.ai export: the zip (or conversations.json) from Settings → Privacy → Export data
//  - Claude Code: the local session transcripts in ~/.claude/projects/*/*.jsonl
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const FOLDER = 'Claude Chats';

function safeName(s) {
  return String(s || 'Zonder titel')
    .replace(/[\\/:*?"<>|#^\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Zonder titel';
}
const day = iso => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '0000-00-00' : d.toISOString().slice(0, 10);
};
const time = iso => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toTimeString().slice(0, 5);
};

// Titles of existing notes that are mentioned in the chat become [[links]].
function linkTargets(text, titles, max = 15) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const t of titles) {
    if (t.length < 4 || /^\d{4}-\d{2}-\d{2}/.test(t)) continue;
    const k = lower.indexOf(t.toLowerCase());
    if (k < 0) continue;
    const before = lower[k - 1], after = lower[k + t.length];
    if ((before && /[\p{L}\p{N}]/u.test(before)) || (after && /[\p{L}\p{N}]/u.test(after))) continue;
    hits.push(t);
    if (hits.length >= max) break;
  }
  return hits;
}

function toMarkdown({ title, created, updated, source, id, messages, userName }, titles) {
  const body = messages
    .filter(m => m.text && m.text.trim())
    .map(m => `### ${m.role === 'user' ? userName : 'Claude'}${m.at ? ' · ' + time(m.at) : ''}\n\n${m.text.trim()}`)
    .join('\n\n');
  const links = linkTargets(body, titles);
  return [
    '---',
    `created: ${created}`,
    `updated: ${updated || created}`,
    `source: ${source}`,
    `chat_id: ${id}`,
    'tags: [claude-chat]',
    '---',
    `# ${title}`,
    '',
    body,
    links.length ? '\n---\n## Verbonden\n' + links.map(t => `- [[${t}]]`).join('\n') : '',
    ''
  ].join('\n');
}

async function writeChats(root, sub, chats, titles, userName) {
  const dir = path.join(root, FOLDER, sub);
  await fsp.mkdir(dir, { recursive: true });
  // index existing files by chat id so re-importing updates instead of duplicating
  const existing = new Map();
  for (const f of await fsp.readdir(dir).catch(() => [])) {
    if (!f.endsWith('.md')) continue;
    const head = (await fsp.readFile(path.join(dir, f), 'utf8').catch(() => '')).slice(0, 400);
    const m = head.match(/^chat_id:\s*(.+)$/m);
    if (m) existing.set(m[1].trim(), f);
  }
  let written = 0;
  const used = new Set();
  for (const c of chats) {
    if (!c.messages.some(m => m.text && m.text.trim())) continue;
    let file = existing.get(c.id);
    if (!file) {
      const base = `${day(c.created)} ${safeName(c.title)}`;
      file = base + '.md';
      let n = 2;
      while (used.has(file) || fs.existsSync(path.join(dir, file))) file = `${base} ${n++}.md`;
    }
    used.add(file);
    const md = toMarkdown({ ...c, userName }, titles);
    const target = path.join(dir, file);
    const cur = await fsp.readFile(target, 'utf8').catch(() => null);
    if (cur === md) continue;
    await fsp.writeFile(target, md, 'utf8');
    written++;
  }
  return written;
}

// ---------- claude.ai export ----------
function readZipEntry(zip, entry) {
  return new Promise((resolve, reject) => {
    execFile('unzip', ['-p', zip, entry], { maxBuffer: 1024 * 1024 * 1024 }, (err, out) => (err ? reject(err) : resolve(out)));
  });
}

async function loadExport(p) {
  const st = await fsp.stat(p);
  let raw;
  if (st.isDirectory()) raw = await fsp.readFile(path.join(p, 'conversations.json'), 'utf8');
  else if (/\.zip$/i.test(p)) raw = await readZipEntry(p, 'conversations.json');
  else raw = await fsp.readFile(p, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Dit lijkt geen Claude-export (conversations.json) te zijn.');
  return data.map(c => ({
    id: c.uuid,
    title: c.name || (c.chat_messages?.[0]?.text || '').slice(0, 60) || 'Chat',
    created: c.created_at,
    updated: c.updated_at,
    source: 'claude.ai',
    messages: (c.chat_messages || []).map(m => ({
      role: m.sender === 'human' ? 'user' : 'assistant',
      at: m.created_at,
      text: m.text || (m.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n\n')
    }))
  }));
}

async function importClaudeExport(root, exportPath, titles, userName) {
  const chats = await loadExport(exportPath);
  const n = await writeChats(root, 'claude.ai', chats, titles, userName);
  return { imported: n, total: chats.length, folder: `${FOLDER}/claude.ai` };
}

// ---------- Claude Code sessions ----------
function blockText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter(b => b && b.type === 'text' && b.text).map(b => b.text).join('\n\n');
}

async function loadCodeSessions() {
  const base = path.join(os.homedir(), '.claude', 'projects');
  const projects = await fsp.readdir(base, { withFileTypes: true }).catch(() => []);
  const chats = [];
  for (const p of projects) {
    if (!p.isDirectory()) continue;
    const dir = path.join(base, p.name);
    for (const f of await fsp.readdir(dir).catch(() => [])) {
      if (!f.endsWith('.jsonl')) continue;
      const lines = (await fsp.readFile(path.join(dir, f), 'utf8').catch(() => '')).split('\n');
      const messages = [];
      let summary = '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let e;
        try { e = JSON.parse(line); } catch { continue; }
        if (e.type === 'summary' && e.summary) summary = e.summary;
        if ((e.type !== 'user' && e.type !== 'assistant') || !e.message || e.isMeta) continue;
        const text = blockText(e.message.content);
        if (!text || /^<(command|local-command|system-reminder)/.test(text.trim())) continue;
        messages.push({ role: e.type, at: e.timestamp, text });
      }
      if (!messages.length) continue;
      const project = p.name.replace(/^-/, '').split('-').filter(Boolean).pop() || p.name;
      const first = messages.find(m => m.role === 'user');
      chats.push({
        id: f.replace(/\.jsonl$/, ''),
        title: summary || `${project} — ${(first ? first.text : 'sessie').replace(/\s+/g, ' ').slice(0, 50)}`,
        created: messages[0].at,
        updated: messages[messages.length - 1].at,
        source: `claude-code (${project})`,
        messages
      });
    }
  }
  return chats;
}

async function importClaudeCode(root, titles, userName) {
  const chats = await loadCodeSessions();
  const n = await writeChats(root, 'Claude Code', chats, titles, userName);
  return { imported: n, total: chats.length, folder: `${FOLDER}/Claude Code` };
}

// ---------- a single chat saved by Claude through MCP ----------
async function saveChat(root, { title, markdown, id }, titles) {
  const dir = path.join(root, FOLDER, 'Opgeslagen');
  await fsp.mkdir(dir, { recursive: true });
  const now = new Date().toISOString();
  const file = `${day(now)} ${safeName(title)}.md`;
  const links = linkTargets(markdown, titles);
  const content = [
    '---', `created: ${now}`, 'source: claude (mcp)', `chat_id: ${id || 'mcp-' + Date.now()}`, 'tags: [claude-chat]', '---',
    `# ${title}`, '', markdown.trim(),
    links.length ? '\n---\n## Verbonden\n' + links.map(t => `- [[${t}]]`).join('\n') : '', ''
  ].join('\n');
  await fsp.writeFile(path.join(dir, file), content, 'utf8');
  return `${FOLDER}/Opgeslagen/${file}`;
}

async function isClaudeExport(zip) {
  return new Promise(resolve => {
    execFile('unzip', ['-l', zip], { maxBuffer: 16 * 1024 * 1024 }, (err, out) => resolve(!err && /\bconversations\.json\b/.test(String(out))));
  });
}

module.exports = { isClaudeExport, importClaudeExport, importClaudeCode, saveChat, FOLDER };
