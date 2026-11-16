// Nebula's memory: facts about the user, kept as a plain note in the vault (Nebula/Geheugen.md).
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const REL = 'Nebula/Geheugen.md';
const HEADER = `---
tags: [nebula]
---
# Geheugen

Wat Nebula over je weet. Je mag dit zelf aanpassen of regels weghalen.

`;

const today = () => new Date().toISOString().slice(0, 10);
const file = root => path.join(root, REL);

async function readLines(root) {
  try { return (await fsp.readFile(file(root), 'utf8')).split('\n'); } catch { return null; }
}

// "- 2026-11-16 · Gaat volgende week skiën · tot 2026-11-30"
function parse(line) {
  const m = line.match(/^- (\d{4}-\d{2}-\d{2}) · (.+?)(?: · tot (\d{4}-\d{2}-\d{2}))?\s*$/);
  return m ? { added: m[1], fact: m[2], until: m[3] || null } : null;
}

async function facts(root, { includeExpired = false } = {}) {
  const lines = (await readLines(root)) || [];
  const t = today();
  return lines.map(parse).filter(f => f && (includeExpired || !f.until || f.until >= t));
}

async function remember(root, fact, until) {
  fact = String(fact || '').replace(/\s+/g, ' ').replace(/ · /g, ' - ').trim();
  if (!fact) throw new Error('fact is leeg');
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error('until moet YYYY-MM-DD zijn');
  const existing = await facts(root, { includeExpired: true });
  if (existing.some(f => f.fact.toLowerCase() === fact.toLowerCase())) return `Wist ik al: ${fact}`;
  const lines = await readLines(root);
  const line = `- ${today()} · ${fact}${until ? ` · tot ${until}` : ''}`;
  await fsp.mkdir(path.dirname(file(root)), { recursive: true });
  if (!lines) await fsp.writeFile(file(root), HEADER + line + '\n', 'utf8');
  else {
    const cur = lines.join('\n');
    await fsp.writeFile(file(root), cur + (cur.endsWith('\n') ? '' : '\n') + line + '\n', 'utf8');
  }
  return `Onthouden: ${fact}${until ? ` (tot ${until})` : ''}`;
}

async function forget(root, text) {
  const q = String(text || '').toLowerCase().trim();
  if (!q) throw new Error('geef aan wat ik moet vergeten');
  const lines = await readLines(root);
  if (!lines) return 'Geheugen is leeg.';
  const removed = [];
  const keep = lines.filter(l => {
    const f = parse(l);
    if (f && f.fact.toLowerCase().includes(q)) { removed.push(f.fact); return false; }
    return true;
  });
  if (!removed.length) return `Niets gevonden met "${text}".`;
  await fsp.writeFile(file(root), keep.join('\n'), 'utf8');
  return 'Vergeten: ' + removed.join('; ');
}

async function summary(root) {
  const list = await facts(root);
  return list.length ? list.map(f => `- ${f.fact}${f.until ? ` (tot ${f.until})` : ''} [${f.added}]`).join('\n') : '(nog niets)';
}

module.exports = { remember, forget, facts, summary, REL };
