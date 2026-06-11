// JARVIS — Electron main process.
// Owns: window lifecycle, IPC, TTS (macOS `say`), brain/skills/memory wiring.
const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const { loadEnv } = require('../core/env')
const config = require('../core/config')
const memory = require('../core/memory/memory')
const brain = require('../core/brain/router')
const skills = require('../core/skills')

loadEnv()

let win = null
let speaking = null

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#04070d',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
  if (process.argv.includes('--dev')) win.webContents.openDevTools({ mode: 'detach' })
}

// ── Text to speech: clean calm voice via macOS `say` (free, local) ────────
function speak(text) {
  if (process.platform !== 'darwin' || !text) return
  if (speaking) speaking.kill()
  const { voice, rate } = config.get().voice.tts
  speaking = spawn('say', ['-v', voice, '-r', String(rate), text])
}

// ── IPC surface (mirrored in preload.js) ──────────────────────────────────
ipcMain.handle('jarvis:config', () => config.get())

ipcMain.handle('jarvis:ask', async (_e, { text, viaVoice }) => {
  try {
    const result = await skills.handle(text, { brain, memory, config: config.get() })
    memory.logInteraction(text, result.reply)
    if (viaVoice) speak(result.spoken || result.reply)
    return result
  } catch (err) {
    return { reply: `Something went wrong: ${err.message}`, skill: 'error' }
  }
})

ipcMain.handle('jarvis:wake', async () => {
  const greeting = config.get().wake.greeting
  speak(greeting)
  return { greeting }
})

ipcMain.handle('jarvis:speak', (_e, text) => speak(text))

ipcMain.handle('jarvis:dashboard', async () => {
  const ctx = { brain, memory, config: config.get() }
  // Each panel degrades gracefully — a missing integration reports its setup
  // path instead of breaking the dashboard.
  const safe = async (fn, fallback) => {
    try { return await fn() } catch (e) { return { error: e.message, ...fallback } }
  }
  return {
    status: await safe(() => brain.status()),
    inbox: await safe(() => skills.run('gmail', 'inbox summary', ctx)),
    news: await safe(() => skills.run('news', 'briefing', ctx)),
    business: await safe(() => skills.run('business', 'status', ctx)),
    tasks: memory.currentTasks(),
  }
})

ipcMain.handle('jarvis:memory:remember', (_e, note) => memory.remember(note))
ipcMain.handle('jarvis:memory:profile', () => memory.contextBlock())

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
