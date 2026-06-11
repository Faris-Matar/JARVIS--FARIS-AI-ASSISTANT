# Setup — fresh Mac to fully working in one command

```bash
git clone <this-repo>
cd JARVIS--FARIS-AI-ASSISTANT
./setup.sh
```

`setup.sh` installs and verifies, in order:

1. **Homebrew** (if missing)
2. **Node.js 18+** (if missing)
3. **Ollama** + pulls the local model (`llama3.1` by default) — the
   free-forever brain
4. **Jarvis** — `npm install`, creates `jarvis/.env` from the example
5. **Website builder** — creates `.env`, verifies the CLI (it has zero npm
   dependencies by design)
6. **Memory check** — confirms `jarvis/memory/` is present, so Jarvis knows
   exactly who you are from day one

Then:

```bash
cd jarvis && npm start                      # Jarvis (standby → clap twice)
cd website-builder && node cli.js --help    # builder, fully standalone
```

## Why nothing is lost between machines

- **Jarvis's memory** is plain Markdown in `jarvis/memory/`, committed to the
  repo. Clone = remembered.
- **Prompts, reference library, config** — all in the repo.
- The only per-machine items are secrets, deliberately gitignored:

| Item | File | Restore on a new Mac |
|---|---|---|
| API keys | `jarvis/.env`, `website-builder/.env` | paste keys back in |
| Gmail token | `jarvis/config/token.json` | re-run `node core/skills/gmail-auth.js` |

Keep your keys in a password manager and a new machine is a 2-minute job.

## Optional power-ups

**Frontier intelligence** (heavy creative work, complex reasoning, website
builder pipeline) — add to `jarvis/.env` and/or `website-builder/.env`:

```
ANTHROPIC_API_KEY=sk-ant-…     # or
OPENAI_API_KEY=sk-…
```

Jarvis stays local-first: frontier models are called only when the task
genuinely needs them, frontier replies are labelled in the UI, and
`brain.allowFrontier: false` in `jarvis/config/jarvis.config.json` disables
escalation entirely.

**Gmail** (inbox skill + client-form detection):

1. [Google Cloud Console](https://console.cloud.google.com) → new project →
   enable **Gmail API**
2. OAuth consent screen (External, add yourself as test user) →
   Credentials → **OAuth client ID** → type **Desktop app**
3. Put the client ID/secret in `jarvis/.env`
4. `cd jarvis && node core/skills/gmail-auth.js` → authorise in the browser

## macOS permissions

First launch will request:

- **Microphone** — wake word / clap detection / voice input (System
  Settings → Privacy & Security → Microphone if you need to re-grant)

## Troubleshooting

| Symptom | Fix |
|---|---|
| "local offline" on the dashboard | `ollama serve` then `ollama pull llama3.1` |
| Wake clap not triggering | Lower `wake.clapPattern.threshold` in `jarvis/config/jarvis.config.json` (try 0.3) |
| Wake phrase does nothing | Web Speech API is best-effort in Electron — clap or click; whisper.cpp upgrade path in `jarvis/docs/ARCHITECTURE.md` |
| Builder: "No LLM provider available" | Add a key to `website-builder/.env` or start Ollama |
| Gmail 401s | Re-run `node core/skills/gmail-auth.js` (token expired/revoked) |
