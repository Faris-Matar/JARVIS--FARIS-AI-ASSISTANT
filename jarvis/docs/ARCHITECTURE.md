# JARVIS Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  ui/  (React + Vite + Framer Motion — browser now, Electron later)  │
│                                                                     │
│  Standby ──wake──▶ BootSequence ──▶ TopBar + Conversation + Screens │
│  voice.js: clap detection · wake phrase · push-to-talk · TTS        │
│                          │  fetch /api/*                            │
└──────────────────────────┼──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  server/server.js  (node:http, zero deps, port 7747)                │
│  /status /config /wake /ask /dashboard /memory /news                │
│  /builder/* /gmail/* (incl. OAuth callback) /skill/:name /speak     │
│  also serves ui/dist  ←  Electron just opens a window on this       │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌──────────────┐   ┌───────────────────┐   ┌────────────────────────┐
│ skills/      │──▶│ brain/router      │──▶│ providers              │
│ 10 modules + │   │ multi-skill intent│   │ ollama (local, free)   │
│ dispatcher   │   │ local→frontier    │   │ claude / openai (keys) │
└──────┬───────┘   │ session memory    │   │ none → honest fallback │
       │           │ auto-distillation │   └────────────────────────┘
       ▼           └───────────────────┘
┌──────────────┐        ┌──────────────────────────────────────┐
│ memory/      │        │ ../website-builder (STANDALONE)      │
│ md + json,   │        │ web-builder skill + /builder routes  │
│ committed    │        │ shell out to its CLI. One-way dep.   │
└──────────────┘        └──────────────────────────────────────┘
```

## Request flow

1. Input (typed, or voice transcript) → `POST /api/ask`.
2. `core/skills/index.js`: "remember…" shortcut, then **multi-skill intent
   detection** — every skill whose triggers match runs (capped at 3), in
   parallel, answers merged under per-skill headings. One match runs clean;
   zero matches falls through to open conversation.
3. Every brain call carries: the JARVIS persona (concise, direct, no em
   dashes, no sycophancy, pushback expected) + the full memory context +
   the session history block.
4. Reply returns with `skills`, `tier` (local/frontier/offline) and
   optional `spoken` (short line for TTS); the UI animates it in, speaks it
   if the input was voice, and refreshes affected panels.

## Intelligence routing

`core/brain/router.js`:

- **Local first.** Ollama for everything by default.
- **Frontier when earned:** a skill forces it (`forceFrontier` — research,
  cover letters, heavy code) or the input hits a `frontierTriggers` phrase,
  AND `allowFrontier` is on (SYSTEMS screen toggle). Frontier replies are
  labelled in the conversation.
- **Fallback chain:** frontier failure → local; nothing reachable → an
  honest reply stating exactly what Jarvis would do with a model and how to
  attach one. Skills with mechanical layers (gmail triage counts, news
  selection, all trackers, builder control) keep working with no model.
- **Session memory:** last 60 turns held in RAM, last 14 injected into
  every prompt. Every ~8 turns the brain distils durable facts into the
  permanent log (`(distilled)` entries) using whatever model is available.

## Memory model

Three layers in `jarvis/memory/`, all committed:

1. **Core files** — profile.md / preferences.md / projects.md. Fully
   populated: InteliSite, Kiran's lanes vs Faris's, taste rules, stack,
   goals, communication rules.
2. **Structured stores** — ledger.json (revenue), applications.json (job
   hunt), tasks.md (dashboard board).
3. **Log** — log/YYYY-MM.md, append-only: explicit "remember" notes,
   tagged tracker entries `(life/gym)` `(jobhunt)` `(business)`, and
   distilled conversation facts.

`contextBlock()` = core files + last 50 log lines, injected everywhere.

## Voice

- **Clap wake:** Web Audio amplitude transients, N peaks in a window,
  threshold tunable on the SYSTEMS screen. Fully local, works today.
- **Wake phrase / push-to-talk:** Web Speech API where available.
  **whisper.cpp upgrade (Mac):** server-side streaming transcription behind
  the same `voice.js` surface — see docs/SETUP-MAC.md §7.
- **TTS:** browser synthesis now; `voice.tts.engine: "say"` routes through
  `POST /api/speak` to macOS `say` (server already implements it).
- **Greetings** (`core/greetings.js`): pooled by time of day, never the
  same line twice running, appends one live fact (builds waiting, client
  forms) when there is one.

## Electron (the Mac step)

`electron/main.js` ≈ 40 lines: require the server, open a BrowserWindow on
`localhost:7747`, auto-grant mic. `npm run mac` = build UI + launch. The
UI cannot tell the difference, by construction.

## Security posture

- Server binds locally; secrets in `.env` + `config/token.json`, gitignored.
- Gmail scopes: readonly + send. Sending requires a click on a draft Faris
  has seen. No delete scope.
- Files skill: explicit paths only, no delete verb, plan-first for fuzzy
  requests. Builder artifact route is path-traversal guarded.

## Adding a skill

1. `core/skills/<name>.js` exporting
   `{ name, description, triggers: [RegExp], async execute(input, ctx) }`
   where `ctx = { brain, memory, config }`.
2. Register in `core/skills/index.js` (import + `SKILLS` + label).
3. Return `{ reply, spoken?, data?, tier? }`. `data` keys feed dashboards.
4. Optional: a screen in `ui/src/components/screens/` + a TopBar nav entry.
