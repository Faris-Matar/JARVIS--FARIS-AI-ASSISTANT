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
├── jarvis/                    ← PROJECT 2: JARVIS
│   ├── README.md              ← Jarvis overview, architecture, usage
│   ├── package.json           ← Electron app + dependencies
│   ├── .env.example           ← optional API keys (Claude / OpenAI / Gmail)
│   ├── electron/              ← Electron main process
│   │   ├── main.js            ← app lifecycle, window, IPC, TTS via macOS `say`
│   │   └── preload.js         ← secure bridge between UI and system
│   ├── renderer/              ← Iron Man dashboard UI (holographic blue, dark)
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── app.js             ← dashboard logic, chat, panels
│   │   └── voice.js           ← clap detection + wake word listener
│   ├── core/
│   │   ├── brain/             ← intelligence layer
│   │   │   ├── router.js      ← local-first model routing (Ollama → API only when needed)
│   │   │   └── providers/     ← ollama.js, claude.js, openai.js
│   │   ├── memory/
│   │   │   └── memory.js      ← persistent memory manager
│   │   └── skills/            ← one file per skill
│   │       ├── index.js       ← skill registry + dispatcher
│   │       ├── gmail.js       ├── news.js        ├── business.js
│   │       ├── coding.js      ├── web-builder.js ├── life.js
│   │       ├── jobhunt.js     ├── research.js    ├── files.js
│   │       └── strategy.js
│   ├── memory/                ← Jarvis's persistent memory (COMMITTED — this is how
│   │   ├── profile.md            Jarvis survives machine changes)
│   │   ├── preferences.md
│   │   ├── projects.md
│   │   └── log/               ← rolling memory log entries
│   ├── config/
│   │   └── jarvis.config.json ← wake word, voice, model choices, dashboard panels
│   └── docs/
│       └── ARCHITECTURE.md    ← deep dive on how Jarvis is wired
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

That's it. See [SETUP.md](SETUP.md) for details, API keys, and Gmail setup.

- **Run Jarvis:** `cd jarvis && npm start`
- **Run the website builder:** `cd website-builder && node cli.js --help`

## Operating Principles

1. Every website built is unique — never a clone or rebrand of a template.
2. Faris's creative direction is always in the loop. The system pauses for his
   call on design direction; his taste is non-negotiable.
3. The system automates execution; Faris owns the big creative and strategic calls.
4. Copy always leads with customer pain points, dream states, and outcomes —
   never brand-focused or agency-credential language.
5. The reference library grows over time and makes every build better than the last.
6. Free and local first. API spend only when it genuinely adds value.
