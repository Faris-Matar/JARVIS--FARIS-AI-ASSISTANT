# JARVIS Architecture

```
┌────────────────────────────  Electron  ────────────────────────────┐
│                                                                    │
│  renderer/ (HUD)                    electron/main.js               │
│  ┌──────────────────┐   IPC via     ┌────────────────────────────┐ │
│  │ index.html       │   preload.js  │ window / lifecycle         │ │
│  │ styles.css  HUD  │ ◄──────────►  │ TTS (macOS `say`)          │ │
│  │ app.js  dashboard│  whitelisted  │ jarvis:ask / :wake /       │ │
│  │ voice.js wake+STT│  surface only │ :dashboard / :memory       │ │
│  └──────────────────┘               └─────────────┬──────────────┘ │
│                                                   │                │
│                          core/                    ▼                │
│  ┌───────────────┐   ┌──────────────┐   ┌──────────────────┐      │
│  │ skills/       │──►│ brain/router │──►│ providers        │      │
│  │ 10 skills +   │   │ local-first, │   │ ollama (default) │      │
│  │ dispatcher    │   │ frontier only│   │ claude / openai  │      │
│  └──────┬────────┘   │ when needed  │   │ (optional keys)  │      │
│         │            └──────────────┘   └──────────────────┘      │
│         ▼                                                          │
│  ┌───────────────┐        ┌─────────────────────────────────┐     │
│  │ memory/       │        │ ../website-builder (STANDALONE) │     │
│  │ markdown,     │        │ web-builder skill shells out to │     │
│  │ committed     │        │ its CLI — one-way dependency    │     │
│  └───────────────┘        └─────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
```

## Request flow

1. Input arrives (typed, or voice → transcript) → `jarvis:ask` IPC.
2. `core/skills/index.js` checks the "remember …" shortcut, then trigger
   regexes; first matching skill executes with `ctx = { brain, memory, config }`.
3. No match → open conversation: `brain.think()` with the JARVIS persona +
   `memory.contextBlock()` (profile, preferences, projects, recent log).
4. Reply returns to the renderer; if input was voice, main process speaks it
   (`say -v <voice>`); the interaction is traced into the memory log.

## Brain routing (free-first, spend-when-it-matters)

`core/brain/router.js`:

- Default: **Ollama** local model. Everything casual, summaries, tracking.
- Escalation to Claude/GPT-4 happens only when: `allowFrontier` is true in
  config AND (the skill forces it for a genuinely heavy task — e.g. cover
  letters, deep dives, gnarly code — or the input matches a
  `frontierTriggers` phrase).
- Frontier failure falls back to local. Jarvis never goes silent.
- Frontier replies are labelled in the UI (`· frontier model`) so spend is
  always visible.

## Memory model

Plain Markdown in `jarvis/memory/`, committed. Three layers:

1. **Core files** (profile / preferences / projects) — curated, long-lived.
2. **Tasks** — `tasks.md`, checkbox list, dashboard-visible.
3. **Log** — `log/YYYY-MM.md`, append-only: explicit "remember" notes,
   `(life)` / `(jobhunt)` tracking entries, interaction traces. The context
   block injects core files + the last ~60 log lines.

Growing smarter over time = the log accumulating + periodically promoting
stable facts from the log into the core files (do it by hand or ask Jarvis to
draft the promotion).

## Voice

- **Clap wake** (`renderer/voice.js`): Web Audio analyser, amplitude-spike
  detection — N sharp peaks within `windowMs` (config:
  `wake.clapPattern`). Fully local, always works.
- **Wake phrase + push-to-talk STT**: Web Speech API, best-effort in
  Electron (Chromium's recognizer is network-backed and not guaranteed).
- **Upgrade path — whisper.cpp** (recommended endgame for fully local STT):
  run `whisper.cpp` in streaming mode as a child process from main.js, pipe
  mic audio via `sox`/`ffmpeg`, watch the transcript stream for the wake
  phrase, and expose results over the same IPC events. Slot it in behind
  `JarvisVoice.listenOnce()` and the wake watcher; the rest of the app
  doesn't change. (`config.voice.sttEngine: "whisper"` is reserved for this.)
- **TTS**: macOS `say` with a configurable voice (default "Daniel") — clean,
  calm, free, offline. Swap to a neural TTS later by replacing `speak()` in
  `electron/main.js`.

## Security posture

- Renderer is sandboxed: `contextIsolation` on, `nodeIntegration` off; all
  system access flows through the whitelisted preload surface.
- Secrets live in `.env` / `config/token.json`, both gitignored.
- The files skill executes only explicitly-pathed operations; fuzzy requests
  get a proposed plan first, never blind execution.

## Adding a skill

1. Create `core/skills/<name>.js` exporting
   `{ name, description, triggers: [RegExp], async execute(input, ctx) }`.
2. Register it in `core/skills/index.js` (import + add to `SKILLS`).
3. Return `{ reply, spoken?, data? }` — `spoken` is the short TTS line when
   the full reply is too long to read aloud.

That's the whole contract.
