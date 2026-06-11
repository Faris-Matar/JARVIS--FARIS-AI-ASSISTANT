# JARVIS

Not a chatbot. Faris's AI assistant in the Iron Man sense: a holographic
HUD, wake by clap or voice, persistent memory that knows him from first
boot, ten fully implemented skills, and a local-first brain that escalates
to frontier models only when the work deserves it.

Runs **in the browser today**, wraps into **Electron on the Mac with zero
UI changes** (the shell just opens a window onto the same core server).

## Architecture

```
jarvis/
├── ui/            React + Vite + Framer Motion — every screen of the HUD
│   └── src/       standby · boot sequence · dashboard · conversation ·
│                  7 skill screens · memory browser · settings
├── server/        core server (zero npm deps) — hosts everything below
│   └── server.js  REST API + serves ui/dist + Gmail OAuth + builder bridge
├── core/
│   ├── brain/     intelligence routing: local-first, frontier when earned,
│   │              session memory, automatic fact distillation
│   ├── skills/    10 skills, fully implemented (see below)
│   ├── memory/    persistent memory manager + structured stores
│   └── greetings.js  varied wake greetings, time-of-day aware
├── memory/        WHAT JARVIS KNOWS — markdown + json, committed to the repo
├── config/        jarvis.config.json (wake, voice, brain, panels)
├── electron/      thin Mac shell (starts server, opens window)
└── docs/          ARCHITECTURE.md · CONNECTORS.md
```

## Run it now (no Mac required)

```bash
# terminal 1 — the core
cd jarvis && npm start                # → http://localhost:7747

# terminal 2 — the UI in dev mode
cd jarvis/ui && npm install && npm run dev   # → http://localhost:5173
```

Or production-style in one process: `npm run ui:build && npm start` and
open http://localhost:7747.

Grant the mic when asked. You land on **standby**: double-clap, say "wake
up Jarvis", or click. Boot sequence runs with real system state, Jarvis
greets you (greeting varies, time-aware), dashboard assembles.

## What's live right now

| Layer | State |
|---|---|
| Full HUD: standby, boot, dashboard, 7 skill screens, memory, settings | ✔ built, animated, Framer Motion throughout |
| Clap wake (Web Audio amplitude analysis) | ✔ fully local, works in browser |
| Wake phrase + push-to-talk | ✔ Web Speech (best effort) — whisper.cpp slots in on the Mac |
| Voice output | ✔ browser synthesis — flips to macOS `say` via config |
| Intelligence routing: multi-skill intent, local→frontier, graceful no-key mode | ✔ |
| Conversation memory: session history + auto-distillation to memory log | ✔ |
| All 10 skills | ✔ fully implemented (Gmail needs its one-time OAuth) |
| Memory: populated profile, preferences, projects, trackers | ✔ knows Faris day one |
| Website builder bridge: form → intake → pipeline → direction approval → monitor | ✔ |
| Local Ollama brain | Mac step (docs/SETUP-MAC.md) |

## The skills

| Skill | Fully implemented behaviour |
|---|---|
| **gmail** | unread triage, urgency flags, client-form detection, drafts in Faris's voice, sends only on approval |
| **news** | live feeds (BBC, TechCrunch AI, Ars, HN, Verge) → curated structured briefing with one-line summaries |
| **business** | live builder job state, decisions waiting on Faris, revenue ledger ("log revenue 1500 deposit…") |
| **web-builder** | inbox scan → data extraction → intake brief → "create the intake" → "start the pipeline" → "approve direction 2, notes: …" |
| **coding** | file-aware debugging/writing/explaining, frontier escalation for heavy problems |
| **life** | "log chest session today" structured gym log, diet log, reminders → task board |
| **jobhunt** | application tracking with follow-up dates, stage updates, frontier cover letters |
| **research** | structured deep dives: exec summary → landscape → what it means for Faris → takeaways → recommendation |
| **files** | list/read/create/move/open/run through the core server; plan-first for fuzzy asks |
| **strategy** | thinking partner: reasons out loud, strongest counter-case, recommendation, ends with a question back |

Multi-skill routing is real: *"what did I miss in my inbox and is there
anything from a new client"* runs gmail + web-builder together and merges
the answer.

## Memory

`memory/` is committed. Profile, preferences, projects are fully populated;
ledger.json and applications.json grow as Faris feeds them;
`log/YYYY-MM.md` accumulates learnings, including automatic distillation of
durable facts from conversations every few turns. "Remember that…" writes
instantly. New Mac = clone = Jarvis knows you.

## Keys & connectors

All optional, all in `.env` (copy `.env.example`). Status lives on the
SYSTEMS screen; full guide in [docs/CONNECTORS.md](docs/CONNECTORS.md).
With zero keys and no Ollama, Jarvis still runs: UI, trackers, builder
control, memory, mechanical inbox/news summaries, and an honest "here's
what I'd do with a brain attached" for everything else.

## The Mac step

Everything that needs macOS is one document:
[../docs/SETUP-MAC.md](../docs/SETUP-MAC.md) — Homebrew, Node, Ollama,
whisper.cpp, `npm run mac` (Electron wrap, single script), voice flip to
`say`. Under an hour.
