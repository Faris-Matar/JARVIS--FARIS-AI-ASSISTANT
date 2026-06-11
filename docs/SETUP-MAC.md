# Mac Setup — zero to fully operational Jarvis

Exactly and only what happens on the new Mac. Everything else is already
built and committed: the UI, the skills, the server, the memory (Jarvis
already knows you), the website builder. Budget: under an hour, most of it
model download time.

---

## 0. Clone

```bash
git clone <this-repo>
cd JARVIS--FARIS-AI-ASSISTANT
```

## 1. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"
```

## 2. Node 18+

```bash
brew install node
node -v   # must be ≥ 18
```

## 3. Ollama + the local model (the free-forever brain)

```bash
brew install ollama
brew services start ollama        # runs at login, always available
ollama pull llama3.1              # ~4.7GB one-time download
```

Verify: `curl -s localhost:11434/api/tags | head -c 100` returns JSON.
Prefer Mistral? `ollama pull mistral` and set `JARVIS_LOCAL_MODEL=mistral`
in `jarvis/.env`.

## 4. Jarvis core + UI

```bash
cd jarvis
cp .env.example .env              # add any API keys you have (all optional)
npm install                       # electron shell deps
npm run ui:build                  # installs UI deps + builds the bundle
```

Sanity check before Electron: `npm start` then open
http://localhost:7747 — the full HUD should be live in the browser with the
local brain ONLINE on the boot sequence.

## 5. Electron wrap (one script, zero UI changes)

```bash
npm run mac        # = ui:build + electron .
```

That's the app. The Electron shell starts the same core server and opens a
window onto it. First wake-listen triggers the macOS microphone permission
prompt — allow it.

## 6. Switch the voice to macOS native

In `jarvis/config/jarvis.config.json` set:

```json
"voice": { "tts": { "engine": "say", "voice": "Daniel", "rate": 175 } }
```

Try voices with `say -v '?'` — Daniel (en-GB) is the calm default. The UI
detects the setting and routes speech through the native engine
automatically.

## 7. whisper.cpp — fully local wake phrase + dictation

Browser speech recognition is best-effort; whisper.cpp makes wake and
dictation local and reliable:

```bash
brew install whisper-cpp
# small English model, fast on Apple Silicon:
curl -L -o ~/whisper-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

Wire-in point (already architected): `jarvis/server/server.js` — add a
route that spawns `whisper-cli --model ~/whisper-base.en.bin -f <chunk>` on
mic chunks and watches transcripts for the wake phrase; the UI's
`voice.js` surface (`initVoice` / `listenOnce`) stays identical, it just
calls the server instead of the Web Speech API. The clap wake already works
fully local everywhere and needs nothing.

## 8. Connect Gmail (one-time, 5 minutes)

`jarvis/docs/CONNECTORS.md` §4 — credentials in `.env`, then INBOX screen →
authorise.

## 9. Optional: auto-start at login

```bash
brew services start ollama        # already done above
# Electron app at login: System Settings → General → Login Items → add Jarvis
```

---

## The checklist

- [ ] brew, node, ollama installed; `ollama pull llama3.1` done
- [ ] `jarvis/.env` created; API keys pasted from password manager
- [ ] `npm install && npm run mac` opens the HUD
- [ ] Boot sequence shows LOCAL INTELLIGENCE · OLLAMA → **ONLINE**
- [ ] Mic permission granted; double-clap wakes from standby
- [ ] Voice switched to `say`
- [ ] Gmail authorised; INBOX screen shows real mail
- [ ] `cd website-builder && node cli.js --help` runs
- [ ] Ask Jarvis "who am I" — it answers from memory, day one

Memory note: everything Jarvis knows came with the clone
(`jarvis/memory/`). The only per-machine items are `.env` keys and the
Gmail token.
