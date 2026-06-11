# Setup

```bash
git clone <this-repo>
cd JARVIS--FARIS-AI-ASSISTANT
./setup.sh
```

`setup.sh` installs Node if needed, builds the Jarvis HUD, prepares both
projects, and (on macOS) installs Ollama + pulls the local model.

Then:

```bash
cd jarvis && npm start                      # → http://localhost:7747 (full HUD)
cd website-builder && node cli.js --help    # standalone pipeline
```

**Getting the new Mac?** The complete zero-to-operational list is
[docs/SETUP-MAC.md](docs/SETUP-MAC.md): Homebrew → Node → Ollama →
`npm run mac` (Electron wrap, one script) → whisper.cpp → native voice →
Gmail. Under an hour, mostly model download.

## Why nothing is lost between machines

- **Jarvis's memory** is plain Markdown + JSON in `jarvis/memory/`,
  committed and fully populated. Clone = remembered.
- **Prompts, reference library, config, UI** — all in the repo.
- The only per-machine items are secrets, deliberately gitignored:

| Item | File | Restore on a new machine |
|---|---|---|
| API keys | `jarvis/.env`, `website-builder/.env` | paste from password manager |
| Gmail token | `jarvis/config/token.json` | INBOX screen → authorise (one click) |

## Keys (all optional)

Add to `jarvis/.env` (and `website-builder/.env` for pipeline runs):

```
ANTHROPIC_API_KEY=sk-ant-…     # frontier intelligence (preferred)
OPENAI_API_KEY=sk-…            # alternative
GMAIL_CLIENT_ID=…              # inbox skill
GMAIL_CLIENT_SECRET=…
```

Full connector guide with exact Google Cloud steps:
[jarvis/docs/CONNECTORS.md](jarvis/docs/CONNECTORS.md).

With zero keys Jarvis still runs: full UI, trackers, builder control,
memory, mechanical inbox/news summaries, and an honest statement of what it
would do with a brain attached. Frontier escalation is always under your
control (SYSTEMS screen).

## Troubleshooting

| Symptom | Fix |
|---|---|
| UI says core server offline | `cd jarvis && npm start` |
| "LOCAL OFFLINE" in the top bar | Mac step: `brew services start ollama && ollama pull llama3.1` |
| Clap wake not triggering | SYSTEMS screen → clap sensitivity → sensitive |
| Wake phrase does nothing | Web Speech is best-effort in some runtimes; clap or click. whisper.cpp on the Mac fixes it properly |
| Gmail 401 / token errors | INBOX screen → authorise again |
| Builder: "No LLM provider available" | key in `website-builder/.env`, or Ollama running |
