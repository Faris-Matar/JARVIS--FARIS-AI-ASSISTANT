# Projects & Goals — current state

> Living document. Jarvis updates this as things move; Faris edits freely.

## Right now (priority order)

1. **Launch cold email outreach for InteliSite** — land the first clients.
   Kiran leads outreach strategy and copy; Faris supports with anything
   technical (domain setup, deliverability, landing pages)
2. **Land first InteliSite clients** and run them through the Website
   Builder Machine
3. **Transition to Mac** — on arrival: run docs/SETUP-MAC.md, Jarvis goes
   fully operational (Ollama, whisper.cpp, Electron, `say`)
4. **Complete the grad role job hunt** — applications tracked by Jarvis,
   follow-ups surfaced, interview prep on demand
5. **Build Jarvis into a fully operational system** — this is the meta
   project; v1.0 UI and skills are live, Mac steps remain

## InteliSite

- Premium web design agency, UK luxury home improvement niche: bespoke
  kitchens, luxury bathrooms, loft conversions
- Positioning: unique 3D scroll-driven sites that make luxury renovators
  look as premium as their work; never templates
- Pipeline automation: Website Builder Machine (/website-builder in this
  repo) takes a client from form to deployable review-ready site with
  Faris's design call gating the build
- Status: pre-first-client, outreach launching

## Website Builder Machine

- v1: pipeline + production prompts + reference library live
- Run standalone: `cd website-builder && node cli.js --help`
- Next: first real client through it; harvest the best patterns back into
  references/ after every build

## Jarvis

- v1: full HUD UI (browser, Electron-ready), 10 skills, intelligence
  routing, memory, connectors built
- Waiting on Mac: Ollama local brain, whisper.cpp wake/STT, Electron wrap,
  macOS say voice
- Gmail connector waiting on OAuth credentials

## Trackers Jarvis maintains

- Job applications: memory/applications.json (jobhunt skill)
- Revenue ledger: memory/ledger.json (business skill)
- Gym, diet, personal: memory/log/*.md tagged (life)
