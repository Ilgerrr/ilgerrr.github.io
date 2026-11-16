import { PALETTE } from './util.js';

const MAX_GALAXIES = 14;

// Vault data -> galaxies (top-level folders), degrees, neighbours and timeline values.
export function buildModel(data) {
  const notes = data.notes.map((n, i) => ({ ...n, i, degree: 0, nb: [] }));
  for (const [a, b] of data.links) {
    notes[a].degree++; notes[b].degree++;
    notes[a].nb.push(b); notes[b].nb.push(a);
  }

  const groups = new Map();
  for (const n of notes) {
    const k = n.folder || '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(n.i);
  }
  let list = [...groups].map(([folder, idx]) => ({ folder, idx })).sort((a, b) => b.idx.length - a.idx.length || a.folder.localeCompare(b.folder));
  if (list.length > MAX_GALAXIES) {
    const keep = list.slice(0, MAX_GALAXIES - 1);
    keep.push({ folder: '\u0000overig', idx: list.slice(MAX_GALAXIES - 1).flatMap(g => g.idx) });
    list = keep;
  }
  const galaxies = list.map((g, gi) => ({
    id: gi,
    key: g.folder,
    name: g.folder === '' ? 'Inbox' : g.folder === '\u0000overig' ? 'Overig' : g.folder,
    color: PALETTE[gi % PALETTE.length],
    notes: g.idx,
    count: g.idx.length
  }));
  galaxies.forEach(g => g.notes.forEach(i => { notes[i].g = g.id; }));

  const times = notes.map(n => n.created).filter(Boolean).sort((a, b) => a - b);
  const tMin = times[0] || Date.now();
  const tMax = Math.max(times[times.length - 1] || Date.now(), tMin + 1);
  notes.forEach(n => { n.birth = Math.min(1, Math.max(0, ((n.created || tMax) - tMin) / (tMax - tMin))) * 0.98; });

  const weekAgo = Date.now() - 7 * 864e5;
  return {
    name: data.name,
    root: data.root,
    notes,
    links: data.links,
    galaxies,
    tMin,
    tMax,
    daily: data.daily,
    stats: {
      notes: notes.length,
      links: data.links.length,
      galaxies: galaxies.length,
      newThisWeek: notes.filter(n => n.created > weekAgo).length,
      words: notes.reduce((s, n) => s + (n.words || 0), 0)
    }
  };
}
