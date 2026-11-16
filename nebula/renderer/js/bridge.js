// Talks to the Electron main process. Outside Electron (browser preview) it falls back to a demo vault.
import { rng, hash } from './util.js';

const native = typeof window !== 'undefined' && window.nebula;

export const isNative = !!native;

export function demoVault() {
  const r = rng(hash('nebula-demo'));
  const folders = [
    ['Business', 44], ['Ideeën', 30], ['Projecten', 26], ['Klanten', 22], ['Edits', 20], ['Software', 17],
    ['Journal', 24], ['Mensen', 12], ['Ressources', 15], ['Uni', 10], ['Automations', 8], ['', 7]
  ];
  const words = {
    Business: ['Pricing', 'Offerte', 'Strategie Q1', 'Pitch', 'Positionering', 'Funnel', 'Merk', 'Retainers', 'Doelen 2027', 'Cashflow', 'Netwerk', 'Partnerships', 'Social plan'],
    'Ideeën': ['Concept', 'Hook-ideeën', 'Short film', 'App-idee', 'Serie', 'Fotoshoot', 'Moodboard', 'Format', 'Podcast', 'Merch'],
    Projecten: ['Notch – Code', 'Brand video', 'Portfolio site', 'Showreel 2026', 'Docu', 'Launch film', 'Music video'],
    Klanten: ['Intake', 'Briefing', 'Feedback ronde', 'Planning', 'Contract', 'Deliverables'],
    Edits: ['Color grade', 'Sound design', 'Pacing', 'Cuts', 'Transitions', 'LUTs', 'Captions'],
    Software: ['Premiere workflow', 'After Effects', 'DaVinci', 'Shortcuts', 'Plugins', 'Claude x Obsidian'],
    Journal: ['Reflectie', 'Weekreview', 'Dankbaar', 'Gedachten'],
    Mensen: ['Abdullah', 'Sara', 'Mentor', 'Team', 'Studio'],
    Ressources: ['Boeken', 'Cursussen', 'Tools', 'Inspiratie', 'Referenties'],
    Uni: ['College', 'Tentamen', 'Paper', 'Aantekeningen'],
    Automations: ['Zapier flow', 'Upload script', 'Backup', 'Notion sync'],
    '': ['Home', 'Inbox', 'Vandaag', 'Todo', 'Quick notes']
  };
  const now = Date.now();
  const notes = [];
  const used = new Set();
  for (const [folder, count] of folders) {
    const pool = words[folder];
    for (let k = 0; k < count; k++) {
      let title = pool[k % pool.length] + (k >= pool.length ? ' ' + (Math.floor(k / pool.length) + 1) : '');
      while (used.has(title)) title += '·';
      used.add(title);
      const age = Math.pow(r(), 1.7) * 420 * 864e5;
      notes.push({
        id: (folder ? folder + '/' : '') + title + '.md',
        title,
        path: (folder ? folder + '/' : '') + title + '.md',
        folder,
        created: now - age,
        modified: now - age * r() * 0.6,
        words: 80 + Math.floor(r() * 900),
        tags: r() < 0.4 ? ['idee'] : [],
        excerpt: 'Notitie over ' + title.toLowerCase() + '.'
      });
    }
  }
  const links = [];
  const seen = new Set();
  const add = (a, b) => {
    if (a === b) return;
    const k = Math.min(a, b) * 1e6 + Math.max(a, b);
    if (seen.has(k)) return;
    seen.add(k);
    links.push([Math.min(a, b), Math.max(a, b)]);
  };
  const byFolder = {};
  notes.forEach((n, i) => (byFolder[n.folder] ||= []).push(i));
  for (const idx of Object.values(byFolder)) {
    const hub = idx[0];
    idx.forEach((i, k) => {
      if (k > 0) add(hub, i);
      if (r() < 0.6) add(i, idx[Math.floor(r() * idx.length)]);
    });
  }
  for (let k = 0; k < notes.length * 0.45; k++) add(Math.floor(r() * notes.length), Math.floor(r() * notes.length));
  return { name: 'Demo vault', root: '', notes, links, daily: { folder: 'Journal', format: 'YYYY-MM-DD' }, demo: true };
}

const demoBridge = {
  async state() { return { name: 'Ilger', data: null, detected: [] }; },
  async chooseVault() { return demoVault(); },
  async detectedVaults() { return []; },
  async readNote(rel) {
    const t = rel.split('/').pop().replace(/\.md$/, '');
    return `# ${t}\n\nDit is een **demo-notitie**. Verbind je Obsidian-vault om je eigen notes te zien.\n\n- Gelinkt aan [[Home]]\n- Zie ook [[Concept]]\n\n> Je notes, eindelijk als universum.`;
  },
  async openNote() {},
  async openDaily() {},
  async dailyName() { return 'Journal/' + new Date().toISOString().slice(0, 10) + '.md'; },
  async capture() { return { rel: 'Journal/' + new Date().toISOString().slice(0, 10) + '.md', demo: true }; },
  async setName(n) { return n; },
  async saveRecording(buf) {
    const url = URL.createObjectURL(new Blob([buf], { type: 'video/webm' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'nebula.webm' });
    a.click();
    return 'nebula.webm';
  },
  async revealVault() {},
  onVaultChanged() { return () => {}; }
};

export const bridge = native || demoBridge;
