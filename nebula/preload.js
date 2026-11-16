const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nebula', {
  platform: process.platform,
  state: () => ipcRenderer.invoke('state'),
  chooseVault: p => ipcRenderer.invoke('vault:choose', p),
  detectedVaults: () => ipcRenderer.invoke('vault:detected'),
  readNote: rel => ipcRenderer.invoke('note:read', rel),
  openNote: rel => ipcRenderer.invoke('note:open', rel),
  openDaily: () => ipcRenderer.invoke('daily:open'),
  dailyName: () => ipcRenderer.invoke('daily:name'),
  capture: text => ipcRenderer.invoke('capture', text),
  setName: name => ipcRenderer.invoke('name:set', name),
  saveRecording: buf => ipcRenderer.invoke('recording:save', buf),
  revealVault: () => ipcRenderer.invoke('reveal'),
  claudeStatus: () => ipcRenderer.invoke('claude:status'),
  connectClaudeDesktop: () => ipcRenderer.invoke('claude:connect-desktop'),
  importClaudeExport: () => ipcRenderer.invoke('claude:import-export'),
  importClaudeCode: () => ipcRenderer.invoke('claude:import-code'),
  copy: text => navigator.clipboard.writeText(text),
  onClaudeSynced: cb => {
    const fn = (_e, msg) => cb(msg);
    ipcRenderer.on('claude:synced', fn);
    return () => ipcRenderer.removeListener('claude:synced', fn);
  },
  agentAsk: (id, text, sessionId) => ipcRenderer.invoke('agent:ask', { id, text, sessionId }),
  agentCancel: id => ipcRenderer.invoke('agent:cancel', id),
  agentAvailable: () => ipcRenderer.invoke('agent:available'),
  onAgentEvent: cb => {
    const fn = (_e, ev) => cb(ev);
    ipcRenderer.on('agent:event', fn);
    return () => ipcRenderer.removeListener('agent:event', fn);
  },
  onSummon: cb => {
    const fn = () => cb();
    ipcRenderer.on('agent:summon', fn);
    return () => ipcRenderer.removeListener('agent:summon', fn);
  },
  onControl: cb => {
    const fn = (_e, msg) => cb(msg);
    ipcRenderer.on('control', fn);
    return () => ipcRenderer.removeListener('control', fn);
  },
  onVaultChanged: cb => {
    const fn = (_e, data) => cb(data);
    ipcRenderer.on('vault:changed', fn);
    return () => ipcRenderer.removeListener('vault:changed', fn);
  }
});
