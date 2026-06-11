# JARVIS

Not a chatbot. A Mac-native AI assistant that knows Faris, his work, his life
and his goals — and executes. Iron Man in every sense: dark holographic-blue
HUD, wake by clap or voice, persistent memory, a full skill suite, and a
local-first brain that runs free forever.

## Run it

```bash
cd jarvis
npm install
npm start
```

First launch: macOS will ask for microphone permission (wake word + voice
input). Grant it and you're live. The app opens in **standby** — clap twice,
say "wake up Jarvis", or click. Jarvis greets you by name and boots the
dashboard.

## What works out of the box (zero API spend)

- **Local brain** via Ollama (`llama3.1` by default) — all conversation,
  summaries, daily updates, tracking. Free forever on Mac hardware.
- **Wake by clap pattern** — fully local Web Audio detection.
- **Text-to-speech** — clean calm voice via macOS `say` (configure the voice
  in `config/jarvis.config.json`).
- **Persistent memory** — everything in `memory/` (committed to the repo;
  see below).
- **Dashboard** — systems status, business/website-builder jobs, news
  briefing, tasks.
- **Skills** — all ten, though Gmail needs one-time OAuth setup.

API keys (`.env`) **add** capability — Claude/GPT-4 for heavy creative work,
complex reasoning, and the website builder pipeline. They are never required
for core function, and frontier calls only happen when the task genuinely
needs them (`brain.allowFrontier` in config turns escalation off entirely).

## The skills

| Skill | What it does |
|---|---|
| gmail | Inbox summary, flags what matters, drafts replies in your voice |
| news | World / AI / tech briefing, curated to your interests |
| business | InteliSite status, client pipeline, live website-builder job status |
| coding | Debug, write, explain — any language, any project, file-aware |
| web-builder | Checks Gmail for client forms, briefs you, triggers the pipeline on your go |
| life | Gym & diet tracking, schedule, family reminders |
| jobhunt | Application tracking, follow-ups, prep, cover letters |
| research | Deep dives with structured, decision-ready output |
| files | Full file system ops: create, read, move, organise, open, run |
| strategy | Thinking partner — genuine pushback, options, recommendation |

Anything that doesn't match a skill falls through to open conversation with
full memory context — Jarvis figures it out.

### The integration moment

> "Jarvis, check if there's a new client form submission in my inbox and
> let's start building their website."

Jarvis reads Gmail → finds the submission → briefs you → you discuss
direction → you say go → it triggers the (fully standalone) website builder
pipeline, monitors it via `business status`, and brings you the output. The
pipeline still stops for YOUR design direction call — always.

## Memory

```
memory/profile.md       who you are (long-lived facts)
memory/preferences.md   how you work, decide, what you like
memory/projects.md      current projects & goals
memory/tasks.md         live task list (dashboard panel)
memory/log/YYYY-MM.md   rolling log of learnings & interactions
```

Plain Markdown, **committed to the repo**. Say "Jarvis, remember that …" and
it's written down. New Mac? Clone, run setup, and Jarvis knows exactly who
you are from day one. (If anything in memory is too sensitive for the repo's
host, move it to a private repo or encrypt — your call; the format is just
files.)

## Gmail setup (one-time)

1. Google Cloud Console → enable Gmail API → OAuth credentials ("Desktop app")
2. Put `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` in `jarvis/.env`
3. `node core/skills/gmail-auth.js` → authorise in the browser

Token lands in `config/token.json` (gitignored — re-run this step on a new
machine).

## Honest status notes (v0.1)

- Clap wake: implemented, fully local.
- Wake phrase & push-to-talk STT: wired to the Web Speech API, which is
  best-effort inside Electron. The upgrade path is whisper.cpp for fully
  local recognition — extension point documented in
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Clap wake and typed input
  always work regardless.
- Gmail: functional once OAuth is configured.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full wiring.
