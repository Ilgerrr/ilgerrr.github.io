// Mac actions: open apps, Apple Reminders and Calendar (via osascript; iCloud syncs them to the iPhone).
// All user text is passed to AppleScript as argv, never spliced into the script.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

function run(cmd, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 8 * 1024 * 1024 }, (err, out, errOut) => {
      if (err) reject(new Error(String(errOut || err.message).trim().split('\n').pop()));
      else resolve(String(out).trim());
    });
  });
}
const osa = (script, args, timeout) => run('osascript', ['-e', script, ...args.map(String)], timeout);

function requireMac() {
  if (process.platform !== 'darwin') throw new Error('Dit werkt alleen op macOS.');
}

// "2026-11-23T10:00" (local time) -> [y, m, d, h, min]
function parts(iso, label) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) throw new Error(`${label}: gebruik lokale tijd als "YYYY-MM-DDTHH:mm" (kreeg "${iso}")`);
  return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 9, m[5] ? +m[5] : 0];
}

const MK_DATE = `
on mk(y, mo, d, h, mi)
  set dt to current date
  set day of dt to 1
  set year of dt to (y as integer)
  set month of dt to (mo as integer)
  set day of dt to (d as integer)
  set hours of dt to (h as integer)
  set minutes of dt to (mi as integer)
  set seconds of dt to 0
  return dt
end mk`;

// ---------- apps ----------
function listApps() {
  const roots = ['/Applications', '/Applications/Utilities', '/System/Applications', '/System/Applications/Utilities', path.join(os.homedir(), 'Applications')];
  const apps = [];
  for (const r of roots) {
    let entries = [];
    try { entries = fs.readdirSync(r, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(r, e.name);
      if (e.name.endsWith('.app')) apps.push(full);
      else if (e.isDirectory() && !e.name.startsWith('.')) {
        // e.g. /Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app
        try { for (const f of fs.readdirSync(full)) if (f.endsWith('.app')) apps.push(path.join(full, f)); } catch {}
      }
    }
  }
  return apps;
}

const norm = s => s.toLowerCase().replace(/\.app$/, '').replace(/\badobe\b|\bmicrosoft\b|\b(19|20)\d\d\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const ALIASES = {
  notities: 'notes', agenda: 'calendar', kalender: 'calendar', herinneringen: 'reminders', 'foto s': 'photos', fotos: 'photos',
  muziek: 'music', kaarten: 'maps', rekenmachine: 'calculator', berichten: 'messages', systeeminstellingen: 'system settings',
  instellingen: 'system settings', contacten: 'contacts', 'zoek mijn': 'find my', premiere: 'premiere pro', ae: 'after effects', ps: 'photoshop'
};

function findApp(name, apps = listApps()) {
  let q = norm(name);
  if (ALIASES[q]) q = ALIASES[q];
  if (!q) return null;
  let best = null, bestScore = 0;
  for (const a of apps) {
    const n = norm(path.basename(a));
    let s = 0;
    if (n === q) s = 100;
    else if (n.startsWith(q)) s = 80;
    else if (n.includes(q)) s = 60;
    else if (q.split(' ').every(w => n.includes(w))) s = 50;
    if (!s) continue;
    // prefer newer versions ("2025" over "2024") and shorter names
    const year = (path.basename(a).match(/(19|20)\d\d/) || [0])[0];
    s += +year / 10000 - n.length / 1000;
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}

async function openApp(name) {
  requireMac();
  const app = findApp(name);
  if (!app) throw new Error(`Geen app gevonden die lijkt op "${name}".`);
  await run('open', ['-a', app]);
  return path.basename(app, '.app');
}

// ---------- reminders ----------
async function addReminder({ title, when, notes = '', list = '' }) {
  requireMac();
  if (!title) throw new Error('title ontbreekt');
  const d = when ? parts(when, 'when') : [0, 0, 0, 0, 0];
  const script = `
on run argv
  set t to item 1 of argv
  set nb to item 2 of argv
  set hasDate to item 3 of argv
  set listName to item 9 of argv
  tell application "Reminders"
    set L to default list
    if listName is not "" then
      try
        set L to list listName
      end try
    end if
    if hasDate is "1" then
      set dt to my mk(item 4 of argv, item 5 of argv, item 6 of argv, item 7 of argv, item 8 of argv)
      tell L to make new reminder with properties {name:t, body:nb, due date:dt, remind me date:dt}
    else
      tell L to make new reminder with properties {name:t, body:nb}
    end if
    return name of L
  end tell
end run
${MK_DATE}`;
  const listName = await osa(script, [title, notes, when ? '1' : '0', ...d, list]);
  return `Herinnering "${title}"${when ? ` op ${fmt(d)}` : ''} in lijst "${listName}"`;
}

// ---------- calendar ----------
const PREFERRED_CALENDARS = ['Thuis', 'Home', 'Persoonlijk', 'Personal', 'Agenda', 'Calendar', 'Werk', 'Work'];

async function addEvent({ title, start, end, alertMinutesBefore = -1, location = '', notes = '', calendar = '' }) {
  requireMac();
  if (!title) throw new Error('title ontbreekt');
  const s = parts(start, 'start');
  let e;
  if (end) e = parts(end, 'end');
  else {
    const dt = new Date(s[0], s[1] - 1, s[2], s[3], s[4] + 60);
    e = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes()];
  }
  const script = `
on run argv
  set t to item 1 of argv
  set sd to my mk(item 2 of argv, item 3 of argv, item 4 of argv, item 5 of argv, item 6 of argv)
  set ed to my mk(item 7 of argv, item 8 of argv, item 9 of argv, item 10 of argv, item 11 of argv)
  set alertMin to (item 12 of argv) as integer
  set loc to item 13 of argv
  set nt to item 14 of argv
  set wanted to item 15 of argv
  set prefs to paragraphs of (item 16 of argv)
  tell application "Calendar"
    set C to missing value
    if wanted is not "" then
      try
        set C to calendar wanted
      end try
    end if
    if C is missing value then
      repeat with nm in prefs
        try
          set c2 to calendar (nm as text)
          if writable of c2 then
            set C to c2
            exit repeat
          end if
        end try
      end repeat
    end if
    if C is missing value then
      repeat with c2 in calendars
        if writable of c2 then
          set C to c2
          exit repeat
        end if
      end repeat
    end if
    if C is missing value then error "Geen agenda gevonden waarin ik mag schrijven."
    tell C
      set ev to make new event at end with properties {summary:t, start date:sd, end date:ed, location:loc, description:nt}
    end tell
    if alertMin ≥ 0 then
      tell ev to make new display alarm at end with properties {trigger interval:(0 - alertMin)}
    end if
    return name of C
  end tell
end run
${MK_DATE}`;
  const cal = await osa(script, [title, ...s, ...e, Math.round(alertMinutesBefore), location, notes, calendar, PREFERRED_CALENDARS.join('\n')], 45000);
  const alert = alertMinutesBefore >= 0 ? `, melding ${humanMinutes(alertMinutesBefore)} vooraf` : '';
  return `Afspraak "${title}" op ${fmt(s)} in agenda "${cal}"${alert}`;
}

// ---------- what's coming up ----------
async function agenda(days = 7) {
  requireMac();
  const script = `
on run argv
  set n to (item 1 of argv) as integer
  set d1 to current date
  set time of d1 to 0
  set d2 to d1 + n * days
  set out to {}
  tell application "Calendar"
    repeat with c in calendars
      try
        set evs to (every event of c whose start date ≥ d1 and start date < d2)
        repeat with ev in evs
          set end of out to "EVENT|" & ((start date of ev) as «class isot» as string) & "|" & (summary of ev) & "|" & (name of c)
        end repeat
      end try
    end repeat
  end tell
  tell application "Reminders"
    try
      set rs to (every reminder whose completed is false)
      repeat with r in rs
        set dd to ""
        try
          set dd to ((due date of r) as «class isot» as string)
        end try
        set end of out to "TODO|" & dd & "|" & (name of r) & "|"
      end repeat
    end try
  end tell
  set AppleScript's text item delimiters to linefeed
  return out as text
end run`;
  const raw = await osa(script, [days], 60000);
  const rows = raw ? raw.split('\n').map(l => l.split('|')) : [];
  const events = rows.filter(r => r[0] === 'EVENT').sort((a, b) => a[1].localeCompare(b[1]));
  const todos = rows.filter(r => r[0] === 'TODO').sort((a, b) => (a[1] || '9').localeCompare(b[1] || '9'));
  const line = r => `- ${r[1] ? r[1].slice(0, 16).replace('T', ' ') + ' · ' : ''}${r[2]}${r[3] ? ' (' + r[3] + ')' : ''}`;
  return [
    `Agenda komende ${days} dagen (herhalende afspraken kunnen ontbreken):`,
    events.length ? events.map(line).join('\n') : '- niets gepland',
    '', 'Open herinneringen:',
    todos.length ? todos.slice(0, 40).map(line).join('\n') : '- geen'
  ].join('\n');
}

const pad = n => String(n).padStart(2, '0');
function fmt(d) { return `${d[0]}-${pad(d[1])}-${pad(d[2])} ${pad(d[3])}:${pad(d[4])}`; }
function humanMinutes(m) {
  if (m % 10080 === 0 && m) return `${m / 10080} ${m === 10080 ? 'week' : 'weken'}`;
  if (m % 1440 === 0 && m) return `${m / 1440} ${m === 1440 ? 'dag' : 'dagen'}`;
  if (m % 60 === 0 && m) return `${m / 60} uur`;
  return `${m} min`;
}

module.exports = { openApp, findApp, listApps, addReminder, addEvent, agenda, parts };
