// "Hey Nebula": runs a request through the Claude Code CLI (`claude -p`) on the user's own subscription,
// with only the Nebula MCP tools (+ web search) allowed. Streams progress back as events.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');
const memory = require('./memory');

const TOOL_NAMES = [
  'nebula_overview', 'nebula_search', 'nebula_read', 'nebula_write', 'nebula_capture', 'nebula_save_chat', 'nebula_show',
  'nebula_memory', 'nebula_remember', 'nebula_forget', 'nebula_reminder', 'nebula_event', 'nebula_agenda', 'nebula_open_app'
];
const ALLOWED = [...TOOL_NAMES.map(t => 'mcp__nebula__' + t), 'WebSearch', 'WebFetch'];

let shellPath = null;
function loginPath() {
  if (shellPath) return Promise.resolve(shellPath);
  const base = ['/opt/homebrew/bin', '/usr/local/bin', path.join(os.homedir(), '.local/bin'), path.join(os.homedir(), '.claude/local'), '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  return new Promise(resolve => {
    const sh = process.env.SHELL || '/bin/zsh';
    execFile(sh, ['-ilc', 'printf "__P__%s" "$PATH"'], { timeout: 5000 }, (err, out) => {
      const m = !err && String(out).match(/__P__(.*)$/s);
      const fromShell = m ? m[1].trim().split(':') : [];
      shellPath = [...new Set([...fromShell, ...base, ...(process.env.PATH || '').split(':')])].filter(Boolean).join(':');
      resolve(shellPath);
    });
  });
}

let claudeBin = null;
async function findClaude() {
  if (claudeBin && fs.existsSync(claudeBin)) return claudeBin;
  const p = await loginPath();
  const candidates = [
    '/usr/local/bin/claude', '/opt/homebrew/bin/claude',
    path.join(os.homedir(), '.local/bin/claude'), path.join(os.homedir(), '.claude/local/claude'),
    ...p.split(':').map(d => path.join(d, 'claude'))
  ];
  claudeBin = candidates.find(c => { try { fs.accessSync(c, fs.constants.X_OK); return true; } catch { return false; } }) || null;
  return claudeBin;
}

function nowText() {
  const d = new Date();
  const day = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${time}`;
  return `${day}, ${time} (lokale tijd ${iso}, tijdzone ${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
}

async function systemPrompt({ name, vaultPath }) {
  let facts = '(nog niets)';
  try { if (vaultPath) facts = await memory.summary(vaultPath); } catch {}
  return [
    `Je bent Nebula, de persoonlijke assistent ("Jarvis") van ${name} op zijn Mac. Je praat Nederlands (Vlaams mag), kort en direct: 1 tot 3 zinnen, geen koppen of opsommingen tenzij hij erom vraagt.`,
    `Het is nu ${nowText()}.`,
    'Doe dingen echt met je tools in plaats van uit te leggen hoe het moet. Zeg pas dat iets gelukt is als de tool het bevestigt, en noem dan kort wat en wanneer.',
    'Herinneringen: nebula_reminder (Apple Herinneringen, komt via iCloud met melding op zijn iPhone). Afspraken: nebula_event, met alert_minutes_before als hij een melding vooraf wil (1 week = 10080). Reken relatieve tijden zelf uit vanaf nu.',
    'Apps openen: nebula_open_app. Zijn notes: nebula_search en nebula_read. Iets noteren: nebula_capture (daily note) of nebula_write.',
    'Vertelt hij iets persoonlijks dat later nuttig is (plannen, reizen, mensen, gezondheid, voorkeuren, deadlines), sla het dan op met nebula_remember met concrete datums, zonder dat te vragen.',
    `Wat je al over ${name} weet:\n${facts}`
  ].join('\n');
}

const running = new Map();

/**
 * ask({ id, text, sessionId, name, vaultPath, mcpEntry, cwd }, onEvent)
 * events: {type:'status', text} | {type:'tool', name, input} | {type:'text', text} | {type:'done', text, sessionId, error?}
 */
async function ask(opts, onEvent) {
  const bin = await findClaude();
  if (!bin) {
    onEvent({ type: 'done', error: 'nocli', text: 'Ik vind Claude Code niet op deze Mac. Installeer het (claude.com/claude-code) en log één keer in met `claude` in Terminal.' });
    return;
  }
  const mcpConfig = JSON.stringify({ mcpServers: { nebula: opts.mcpEntry } });
  // the request goes in via stdin, so text that starts with "-" can never be read as a flag
  const args = [
    '-p',
    '--output-format', 'stream-json', '--verbose',
    '--mcp-config', mcpConfig, '--strict-mcp-config',
    '--allowedTools', ALLOWED.join(','),
    '--append-system-prompt', await systemPrompt(opts)
  ];
  if (opts.sessionId) args.push('--resume', opts.sessionId);
  fs.mkdirSync(opts.cwd, { recursive: true });

  const env = { ...process.env, PATH: await loginPath() };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(bin, args, { cwd: opts.cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin.on('error', () => {});
  child.stdin.end(opts.text);
  running.set(opts.id, child);
  let buf = '', errBuf = '', sessionId = opts.sessionId || null, finalText = '', finished = false;
  const timer = setTimeout(() => { child.kill('SIGTERM'); }, 180000);
  onEvent({ type: 'status', text: 'Denkt na…' });

  const handleLine = line => {
    let e;
    try { e = JSON.parse(line); } catch { return; }
    if (e.session_id) sessionId = e.session_id;
    if (e.type === 'assistant' && e.message && Array.isArray(e.message.content)) {
      for (const b of e.message.content) {
        if (b.type === 'text' && b.text) { finalText = b.text; onEvent({ type: 'text', text: b.text }); }
        if (b.type === 'tool_use') onEvent({ type: 'tool', name: String(b.name || '').replace(/^mcp__nebula__/, ''), input: b.input || {} });
      }
    } else if (e.type === 'result') {
      finished = true;
      const text = typeof e.result === 'string' && e.result ? e.result : finalText;
      onEvent({ type: 'done', text: text || (e.is_error ? 'Er ging iets mis.' : 'Klaar.'), sessionId, error: e.is_error ? 'result' : undefined });
    }
  };
  child.stdout.on('data', d => {
    buf += d;
    let k;
    while ((k = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1); if (line) handleLine(line); }
  });
  child.stderr.on('data', d => { errBuf = (errBuf + d).slice(-4000); });
  child.on('error', err => { finished = true; onEvent({ type: 'done', error: 'spawn', text: 'Kon Claude Code niet starten: ' + err.message }); });
  child.on('close', code => {
    clearTimeout(timer);
    running.delete(opts.id);
    if (buf.trim()) handleLine(buf.trim());
    if (finished) return;
    let msg = errBuf.trim().split('\n').slice(-3).join(' ') || `Claude Code stopte (code ${code}).`;
    if (/login|auth|api key|not logged/i.test(msg)) msg = 'Claude Code is niet ingelogd. Open Terminal, typ `claude` en log in met je abonnement.';
    onEvent({ type: 'done', error: 'exit', text: msg, sessionId });
  });
}

function cancel(id) {
  const c = running.get(id);
  if (c) c.kill('SIGTERM');
}

module.exports = { ask, cancel, findClaude, ALLOWED };
