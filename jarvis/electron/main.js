// JARVIS — Electron shell (the Mac step).
// Thin by design: it starts the same core server the browser version uses,
// then opens a window onto it. Zero UI changes between browser and Electron.
//
//   npm run electron      (after: cd ui && npm run build)
//
// macOS notes:
//  - TTS automatically upgrades to `say` (server /api/speak, darwin only)
//  - mic permission prompt comes from Chromium on first wake-listen
const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')

const PORT = Number(process.env.JARVIS_PORT || 7747)

// Start the core server in-process. It also serves ui/dist.
require('../server/server.js')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#020409',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Auto-grant mic for wake-word/clap detection (it's our own app).
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(permission === 'media')
  })

  win.loadURL(`http://localhost:${PORT}`)
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  // tiny delay lets the server bind before the window asks for the UI
  setTimeout(createWindow, 250)
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
