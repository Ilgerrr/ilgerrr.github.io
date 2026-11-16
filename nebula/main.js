const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const vault = require('./src/vault');
const claude = require('./src/claude-import');
const agent = require('./src/agent');

app.setName('Nebula');

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'config.json');
let config = { vaultPath: null, name: null };
let win = null;
let stopWatch = () => {};

function loadConfig() {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')) }; } catch {}
  if (!config.name) {
    const u = os.userInfo().username || '';
    config.name = /^ilger/i.test(u) || !u ? 'Ilger' : u.charAt(0).toUpperCase() + u.slice(1);
  }
}
function saveConfig() {
  fs.mkdirSync(path.dirname(CONFIG_FILE()), { recursive: true });
  fs.writeFileSync(CONFIG_FILE(), JSON.stringify(config, null, 2));
}

async function openVault(p) {
  const data = await vault.scanVault(p);
  const first = config.vaultPath !== p;
  config.vaultPath = p;
  saveConfig();
  if (first) setTimeout(() => syncClaudeCode(false), 1500);
  stopWatch();
  stopWatch = vault.watchVault(p, async () => {
    try {
      const fresh = await vault.scanVault(p);
      win && win.webContents.send('vault:changed', fresh);
    } catch {}
  });
  return data;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: 'Nebula',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#040406',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|obsidian):/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.on('closed', () => { win = null; });
}

// ---------- IPC ----------
ipcMain.handle('state', async () => {
  const detected = await vault.detectVaults();
  let data = null;
  let p = config.vaultPath;
  if (!p || !fs.existsSync(p)) p = null;
  if (p) {
    try { data = await openVault(p); } catch { data = null; }
  }
  return { name: config.name, data, detected };
});

ipcMain.handle('vault:choose', async (_e, p) => {
  if (!p) {
    const r = await dialog.showOpenDialog(win, {
      title: 'Kies je Obsidian-vault',
      buttonLabel: 'Verbind',
      properties: ['openDirectory']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    p = r.filePaths[0];
  }
  return openVault(p);
});

ipcMain.handle('vault:detected', () => vault.detectVaults());

ipcMain.handle('note:read', (_e, rel) => vault.readNote(config.vaultPath, rel));

ipcMain.handle('note:open', (_e, rel) => {
  const full = vault.safeJoin(config.vaultPath, rel);
  return shell.openExternal('obsidian://open?path=' + encodeURIComponent(full));
});

ipcMain.handle('daily:open', async () => {
  const { full } = await vault.dailyNotePath(config.vaultPath, true);
  return shell.openExternal('obsidian://open?path=' + encodeURIComponent(full));
});

ipcMain.handle('daily:name', async () => (await vault.dailyNotePath(config.vaultPath, false)).rel);

ipcMain.handle('capture', (_e, text) => vault.captureThought(config.vaultPath, String(text || '')));

ipcMain.handle('name:set', (_e, name) => {
  config.name = String(name || '').trim().slice(0, 40) || config.name;
  saveConfig();
  return config.name;
});

ipcMain.handle('recording:save', async (_e, buf) => {
  const dir = app.getPath('videos');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const file = path.join(dir, `Nebula ${stamp}.webm`);
  await fs.promises.writeFile(file, Buffer.from(buf));
  shell.showItemInFolder(file);
  return file;
});

ipcMain.handle('reveal', () => config.vaultPath && shell.openPath(config.vaultPath));

// ---------- Claude ----------
function mcpServerPath() {
  return path.join(__dirname, 'mcp', 'server.js').replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
}
function mcpEntry() {
  return { command: process.execPath, args: [mcpServerPath()], env: { ELECTRON_RUN_AS_NODE: '1' } };
}
function claudeDesktopConfigPath() {
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  if (process.platform === 'win32') return path.join(process.env.APPDATA || home, 'Claude', 'claude_desktop_config.json');
  return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
}
async function titles() {
  return (await vault.scanVault(config.vaultPath)).notes.map(n => n.title);
}

ipcMain.handle('claude:status', () => {
  let desktop = false;
  try { desktop = !!JSON.parse(fs.readFileSync(claudeDesktopConfigPath(), 'utf8')).mcpServers?.nebula; } catch {}
  const e = mcpEntry();
  const q = s => `'${s.replace(/'/g, `'\\''`)}'`;
  return {
    desktop,
    codeCommand: `claude mcp add nebula -s user -e ELECTRON_RUN_AS_NODE=1 -- ${q(e.command)} ${q(e.args[0])}`,
    hasCodeSessions: fs.existsSync(path.join(os.homedir(), '.claude', 'projects'))
  };
});

ipcMain.handle('claude:connect-desktop', async () => {
  const file = claudeDesktopConfigPath();
  let cfg = {};
  if (fs.existsSync(file)) {
    const raw = await fs.promises.readFile(file, 'utf8');
    try { cfg = JSON.parse(raw); } catch { throw new Error('claude_desktop_config.json is geen geldige JSON — niets aangepast.'); }
    await fs.promises.writeFile(file + '.backup', raw);
  }
  cfg.mcpServers = { ...(cfg.mcpServers || {}), nebula: mcpEntry() };
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, JSON.stringify(cfg, null, 2));
  return file;
});

ipcMain.handle('claude:import-export', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Kies je Claude-export (zip of conversations.json)',
    buttonLabel: 'Importeer',
    properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'Claude-export', extensions: ['zip', 'json'] }]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return claude.importClaudeExport(config.vaultPath, r.filePaths[0], await titles(), config.name);
});

ipcMain.handle('claude:import-code', async () => claude.importClaudeCode(config.vaultPath, await titles(), config.name));

// Local control endpoint used by the MCP server (nebula_show). Only listens on 127.0.0.1 and needs a token.
function startControlServer() {
  const token = crypto.randomBytes(24).toString('hex');
  const srv = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/control' || req.headers.authorization !== 'Bearer ' + token) {
      res.writeHead(403); return res.end('forbidden');
    }
    let body = '';
    req.on('data', d => { body += d; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      let msg;
      try { msg = JSON.parse(body || '{}'); } catch { res.writeHead(400); return res.end('bad json'); }
      if (!win) createWindow();
      win.show(); win.focus();
      win.webContents.send('control', { path: msg.path ? String(msg.path) : null, view: msg.view ? String(msg.view) : null });
      res.writeHead(200); res.end('ok');
    });
  });
  srv.listen(0, '127.0.0.1', () => {
    const file = path.join(app.getPath('userData'), 'control.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ port: srv.address().port, token }), { mode: 0o600 });
  });
  app.on('will-quit', () => { try { fs.unlinkSync(path.join(app.getPath('userData'), 'control.json')); } catch {} });
}

// ---------- automatic Claude sync ----------
function notify(msg) { win && win.webContents.send('claude:synced', msg); }

async function autoConnectClaudeDesktop() {
  if (config.claudeAutoConnected) return;
  const dir = path.dirname(claudeDesktopConfigPath());
  if (!fs.existsSync(dir)) return; // Claude Desktop not installed
  try {
    const file = claudeDesktopConfigPath();
    let cfg = {};
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      cfg = JSON.parse(raw);
      fs.writeFileSync(file + '.backup', raw);
    }
    cfg.mcpServers = { ...(cfg.mcpServers || {}), nebula: mcpEntry() };
    fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
    config.claudeAutoConnected = true;
    saveConfig();
    setTimeout(() => notify({ text: 'Claude Desktop is verbonden met Nebula — herstart Claude één keer' }), 4000);
  } catch {}
}

let syncing = false;
async function syncClaudeCode(silent) {
  if (!config.vaultPath || syncing) return;
  syncing = true;
  try {
    const r = await claude.importClaudeCode(config.vaultPath, await titles(), config.name);
    if (r.imported && !silent) notify({ text: `${r.imported} Claude Code-${r.imported === 1 ? 'chat' : 'chats'} bijgewerkt in je universum` });
  } catch {} finally { syncing = false; }
}

const seenZips = new Set();
async function checkDownload(file) {
  if (!config.vaultPath || seenZips.has(file) || !/\.zip$/i.test(file) || !fs.existsSync(file)) return;
  seenZips.add(file);
  if (!(await claude.isClaudeExport(file))) return;
  try {
    const r = await claude.importClaudeExport(config.vaultPath, file, await titles(), config.name);
    config.lastExport = file; saveConfig();
    notify({ text: `${r.imported} claude.ai-chats toegevoegd aan je universum` });
  } catch (e) { notify({ text: 'Claude-export importeren mislukt: ' + e.message, error: true }); }
}

function startClaudeWatchers() {
  const projects = path.join(os.homedir(), '.claude', 'projects');
  let t1;
  const watchProjects = () => {
    try {
      fs.watch(projects, { recursive: true }, (_e, f) => {
        if (f && !/\.jsonl$/.test(f)) return;
        clearTimeout(t1); t1 = setTimeout(() => syncClaudeCode(false), 8000);
      });
    } catch { setTimeout(watchProjects, 60000); }
  };
  watchProjects();
  setInterval(() => syncClaudeCode(true), 10 * 60 * 1000);

  const downloads = app.getPath('downloads');
  try {
    fs.watch(downloads, (_e, f) => { if (f && /\.zip$/i.test(f)) setTimeout(() => checkDownload(path.join(downloads, f)), 3000); });
  } catch {}
  // exports that arrived while Nebula was closed (last 14 days)
  fs.promises.readdir(downloads).then(list => list.forEach(f => {
    const full = path.join(downloads, f);
    try {
      if (/\.zip$/i.test(f) && full !== config.lastExport && Date.now() - fs.statSync(full).mtimeMs < 14 * 864e5) checkDownload(full);
    } catch {}
  })).catch(() => {});
}

ipcMain.handle('claude:sync-now', () => syncClaudeCode(false));

// ---------- Hey Nebula ----------
ipcMain.handle('agent:ask', (e, { id, text, sessionId }) => {
  if (!config.vaultPath) return { error: 'novault' };
  agent.ask({
    id, text: String(text || '').slice(0, 8000), sessionId,
    name: config.name, vaultPath: config.vaultPath,
    mcpEntry: mcpEntry(), cwd: path.join(app.getPath('userData'), 'agent')
  }, ev => { if (!e.sender.isDestroyed()) e.sender.send('agent:event', { id, ...ev }); });
  return { ok: true };
});
ipcMain.handle('agent:cancel', (_e, id) => agent.cancel(id));
ipcMain.handle('agent:available', async () => !!(await agent.findClaude()));

function summonNebula() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  app.focus({ steal: true });
  win.webContents.send('agent:summon');
}

app.whenReady().then(() => {
  loadConfig();
  startControlServer();
  createWindow();
  autoConnectClaudeDesktop();
  // ⌥Space; if another app (e.g. Claude Desktop's quick entry) already owns it, fall back to ⌥⇧Space
  for (const key of ['Alt+Space', 'Alt+Shift+Space']) {
    try { if (globalShortcut.register(key, summonNebula)) { config.shortcut = key; break; } } catch {}
  }
  setTimeout(() => { syncClaudeCode(true); startClaudeWatchers(); }, 2500);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => {
  stopWatch();
  if (process.platform !== 'darwin') app.quit();
});
