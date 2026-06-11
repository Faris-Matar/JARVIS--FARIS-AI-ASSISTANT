# Connectors

Every external integration Jarvis has, what it does, what credentials it
needs, and where they go. All credentials live in `jarvis/.env` (gitignored).
Status of every connector is visible live on the **SYSTEMS** screen.

---

## 1. Claude API (frontier intelligence)

**Does:** heavy creative work, complex reasoning, research deep dives, cover
letters, website builder pipeline stages. Called only when the task needs it;
every frontier reply is labelled in the UI.

**Needs:**
```
ANTHROPIC_API_KEY=sk-ant-...
JARVIS_CLAUDE_MODEL=claude-fable-5   # optional override
```
Get a key: console.anthropic.com → API Keys.

**Behaviour without it:** local model handles everything; if local is also
down, Jarvis says exactly what it would have done with a brain attached.
**Error handling:** failures fall back to the local model automatically.
Escalation can be disabled entirely on the SYSTEMS screen
(`brain.allowFrontier`).

## 2. OpenAI (alternative frontier)

**Does:** same role as Claude; used when Claude has no key or
`brain.frontierProvider` is set to `"openai"`.

**Needs:**
```
OPENAI_API_KEY=sk-...
JARVIS_OPENAI_MODEL=gpt-4o           # optional override
```

## 3. Ollama (free local brain — Mac step)

**Does:** all conversation, summaries, curation, tracking. Free forever,
fully private, no network.

**Needs:** nothing in `.env` (defaults shown):
```
OLLAMA_HOST=http://localhost:11434
JARVIS_LOCAL_MODEL=llama3.1
```
Install on the Mac: `brew install ollama && ollama pull llama3.1` — see
docs/SETUP-MAC.md.

## 4. Gmail

**Does:** unread summaries, urgency flags, **client form submission
detection**, reply drafting in Faris's voice, sending (only after explicit
approval in the UI).

**Needs (one-time):**
1. console.cloud.google.com → new project → enable **Gmail API**
2. OAuth consent screen: External, add yourself as test user
3. Credentials → OAuth client ID → type **Desktop app**
4. In `jarvis/.env`:
   ```
   GMAIL_CLIENT_ID=...apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=...
   ```
5. Restart the server, open the **INBOX** screen, click **authorise gmail
   access**, approve in the browser. Done.

Token lands in `jarvis/config/token.json` (gitignored). New machine =
re-authorise once (step 5 only). Scopes requested: `gmail.readonly` +
`gmail.send` — Jarvis can read and send, never delete.

**Headless alternative:** `node core/skills/gmail-auth.js`.

## 5. News feeds

**Does:** the intelligence briefing. No credentials, free public feeds:

| Feed | Category |
|---|---|
| BBC World + Business | world |
| TechCrunch AI | ai |
| Ars Technica AI | ai |
| Hacker News front page | tech |
| The Verge | tech |

Curation: with a model, items are filtered against Faris's interests and
summarised one line each with a day assessment; without one, a balanced
mechanical selection still renders. Cache: 15 minutes. Add/remove feeds in
`core/skills/news.js` (`FEEDS`).

## 6. Website builder bridge

**Does:** fires and monitors the standalone pipeline in `/website-builder`:
scaffolds intakes from extracted Gmail forms, starts runs, approves
directions, reads job state for the dashboard.

**Needs:** nothing. It shells out to `node cli.js` in
`config.paths.websiteBuilder` (default `../website-builder`). The builder's
own provider keys live in `website-builder/.env` (same key names — copy them
over if you want pipeline stages on frontier models, which you do).

## 7. File system

**Does:** list, read, create, move, open, run — via the core server's Node
process. Active now against whatever machine the server runs on; `open`
(Finder/app launch) activates on macOS. No delete verb by design; fuzzy
requests return a plan for approval before anything executes.

## 8. macOS voice (`say`) — Mac step

**Does:** Jarvis's spoken voice, native and offline. The server exposes
`POST /api/speak`; the UI switches to it when
`voice.tts.engine` is `"say"` in `config/jarvis.config.json` (SETUP-MAC.md
flips this). Until then: browser speech synthesis, which works today.
