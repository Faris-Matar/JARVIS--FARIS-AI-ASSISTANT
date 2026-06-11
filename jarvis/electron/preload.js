// Secure bridge: the renderer (dashboard UI) talks to Jarvis only through
// this whitelisted surface.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jarvis', {
  config: () => ipcRenderer.invoke('jarvis:config'),
  ask: (text, viaVoice = false) => ipcRenderer.invoke('jarvis:ask', { text, viaVoice }),
  wake: () => ipcRenderer.invoke('jarvis:wake'),
  speak: (text) => ipcRenderer.invoke('jarvis:speak', text),
  dashboard: () => ipcRenderer.invoke('jarvis:dashboard'),
  remember: (note) => ipcRenderer.invoke('jarvis:memory:remember', note),
  profile: () => ipcRenderer.invoke('jarvis:memory:profile'),
})
