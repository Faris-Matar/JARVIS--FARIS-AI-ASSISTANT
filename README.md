# JARVIS — Faris AI Assistant & Website Builder Machine

Two separate but connected projects in one repository.

```
/jarvis             → JARVIS: a fully capable, Mac-native AI assistant (Electron app)
/website-builder    → Website Builder Machine: standalone client-to-deployable-site pipeline
```

**They are independent.** The website builder runs completely on its own via CLI —
no Jarvis required. Jarvis has a skill that can *trigger* the website builder,
but the dependency only flows in that one direction.

---

## Repository Map

```
.
├── README.md                  ← you are here
├── SETUP.md                   ← full setup guide for a fresh Mac
├── setup.sh                   ← one-command install: ./setup.sh
├── .gitignore
│
├── docs/
│   └── SETUP-MAC.md           ← THE Mac document: zero → fully operational Jarvis
│
├── jarvis/                    ← PROJECT 2: JARVIS
│   ├── README.md              ← Jarvis overview, what's live, how to run
│   ├── package.json           ← scripts: start (server) · ui:dev · ui:build · mac
│   ├── .env.example           ← optional API keys (Claude / OpenAI / Gmail)
│   ├── ui/                    ← the Iron Man HUD (React + Vite + Framer Motion)
│   │   └── src/
│   │       ├── App.jsx        ← standby → boot → main state machine
│   │       ├── voice.js       ← clap wake, wake phrase, push-to-talk, TTS
│   │       ├── api.js         ← client for the core server
│   │       └── components/    ← Standby, BootSequence, Reactor, Particles,
│   │           │                TopBar, Dashboard, Conversation, Waveform…
│   │           └── screens/   ← Gmail, News, Builder, Business, Research,
│   │                            Memory, Settings
│   ├── server/
│   │   └── server.js          ← core server (zero deps): REST API, OAuth,
│   │                            builder bridge, serves ui/dist
│   ├── core/
│   │   ├── brain/             ← intelligence routing: local-first, frontier
│   │   │   └── providers/       when earned, session memory, distillation
│   │   ├── memory/            ← persistent memory manager + JSON stores
│   │   ├── greetings.js       ← varied wake greetings
│   │   └── skills/            ← 10 fully implemented skills + dispatcher
│   ├── memory/                ← WHAT JARVIS KNOWS (COMMITTED — survives
│   │   ├── profile.md            machine changes; populated for Faris)
│   │   ├── preferences.md     ├── projects.md    ├── tasks.md
│   │   └── log/               ← rolling learnings + distilled facts
│   ├── config/
│   │   └── jarvis.config.json ← wake, voice, brain routing, panels
│   ├── electron/
│   │   └── main.js            ← thin Mac shell: starts server, opens window
│   └── docs/
│       ├── ARCHITECTURE.md    ← how it's wired
│       └── CONNECTORS.md      ← every connector + exact credentials needed
│
└── website-builder/           ← PROJECT 1: WEBSITE BUILDER MACHINE
    ├── README.md              ← pipeline overview + CLI usage
    ├── package.json
    ├── .env.example
    ├── cli.js                 ← standalone CLI entry point
    ├── src/
    │   ├── pipeline.js        ← stage runner (with human-approval gate at Stage 3)
    │   ├── stages.js          ← stage definitions and artifact wiring
    │   ├── providers/         ← model-agnostic LLM layer
    │   │   ├── index.js       ← provider selection (Claude / GPT / Ollama)
    │   │   ├── claude.js      ├── openai.js      └── ollama.js
    │   └── utils.js           ← file output parser, helpers
    ├── prompts/               ← production-grade prompt per stage
    │   ├── README.md
    │   ├── stage-2-brand-brief.md
    │   ├── stage-3-design-directions.md
    │   ├── stage-4-copywriting.md
    │   ├── stage-5-code-generation.md
    │   └── stage-6-quality-control.md
    ├── intake/                ← Stage 1: client intake package
    │   ├── README.md
    │   ├── client-form-template.md
    │   ├── supplementary-template.md
    │   └── clients/           ← one folder per client job
    ├── references/            ← living reference library (grows over time)
    │   ├── README.md
    │   ├── 3d-components/
    │   ├── scroll-animations/
    │   └── layout-patterns/
    └── output/                ← generated sites land here (gitignored)
```

## Quick Start

```bash
git clone <this-repo>
cd JARVIS--FARIS-AI-ASSISTANT
./setup.sh
```

- **Run Jarvis (browser, today):** `cd jarvis && npm start` → http://localhost:7747
- **Run the website builder:** `cd website-builder && node cli.js --help`
- **On the new Mac:** follow [docs/SETUP-MAC.md](docs/SETUP-MAC.md) —
  Homebrew, Node, Ollama, whisper.cpp, `npm run mac`. Under an hour to
  fully operational.

See [SETUP.md](SETUP.md) for API keys and Gmail setup.

## Operating Principles

1. Every website built is unique — never a clone or rebrand of a template.
2. Faris's creative direction is always in the loop. The system pauses for his
   call on design direction; his taste is non-negotiable.
3. The system automates execution; Faris owns the big creative and strategic calls.
4. Copy always leads with customer pain points, dream states, and outcomes —
   never brand-focused or agency-credential language.
5. The reference library grows over time and makes every build better than the last.
6. Free and local first. API spend only when it genuinely adds value.
