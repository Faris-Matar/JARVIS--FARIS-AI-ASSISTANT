# Website Builder Machine

An automated pipeline that takes a client from form submission to a
deployable, review-ready website. **Fully standalone** — runs via CLI with no
Jarvis dependency. (Jarvis has a skill that can trigger it; the dependency
flows only that way.)

## The Pipeline

```
1. Client Intake        form + Faris's supplementary info        (human)
2. Brand Intelligence   deep brief: audience, pains, dream state (LLM)
3. Design Direction     3 distinct options ──► FARIS DECIDES     (LLM + human gate)
4. Copywriting          every word, pain-led & outcome-focused   (LLM)
5. Code Generation      React 18 / Vite / Tailwind / GSAP /      (LLM)
                        Lenis / Three.js + R3F — unique build
6. Quality Control      copy fidelity, facts, SEO, a11y,         (LLM)
                        integrity, marketing-language audit
7. Output               deployable repo + REVIEW.md for Faris    (assembly)
```

The pipeline **always halts after Stage 3** until Faris approves a direction.
His taste and creative call are built into the process, not optional.

## Usage

```bash
# 1. Start a job
node cli.js new acme-renovations
#    → fill in intake/clients/acme-renovations/{form.md,supplementary.md}

# 2. Run (stops after design directions are generated)
node cli.js run acme-renovations

# 3. Read output/acme-renovations/02-design-directions.md, pick one
node cli.js run acme-renovations --direction 2 --notes "love it, but warmer palette"

# 4. Pipeline finishes: copy → code → QC → REVIEW.md
node cli.js status acme-renovations
```

Interactive mode: run from a terminal and the CLI shows the directions and
asks for your pick inline.

Re-run a stage after editing a prompt or intake:

```bash
node cli.js redo acme-renovations 4   # clears stages 4–7
node cli.js run acme-renovations
```

## Output layout (per job)

```
output/<client>/
├── job.json                  pipeline state (resume / gate tracking)
├── 01-brand-brief.md         Stage 2
├── 02-design-directions.md   Stage 3 — the 3 options
├── 03-copy.md                Stage 4 — full copy deck
├── site/                     Stage 5/6 — the deployable repo
├── 04-qc-report.md           Stage 6 — findings, fixes, verdict
└── REVIEW.md                 Stage 7 — Faris's high-level checklist
```

## Model agnostic

Works with **Claude API, OpenAI, or local Ollama** — whichever is available.
Auto-detect order: `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` → local Ollama.
Override with `WB_PROVIDER` in `.env` or `--provider` per run. Copy
`.env.example` to `.env` to configure. With nothing configured, it runs free
on local Ollama.

> Honest note: Stage 5 (full-site code generation) benefits enormously from a
> frontier model. Local models will run the pipeline but expect to lean harder
> on Stage 6 and your review.

## Prompts are the product

Every stage's behaviour lives in `prompts/stage-*.md`, written to the full
structured standard (Role, Context, Task, Constraints, What Not To Do, Output
Format, Examples). When output is weak, fix the prompt. See `prompts/README.md`.

## Reference library

`references/` holds proven 3D components, scroll-animation patterns, and
layout patterns. Stage 5 receives them as **inspiration and pattern guidance —
never copy-paste**. Harvest the best of every build back into the library; it
compounds. See `references/README.md`.

## Hard principles

- Every site unique. Never a clone or rebrand of a template.
- Copy speaks to customer pain points, dream states, outcomes. Never
  brand-credential language.
- Genuine 3D (Three.js/R3F) and story-like GSAP scroll narratives in every build.
- Only verified facts ship. Unverified claims get flagged, never published.
- No lorem ipsum, no placeholders, no broken links — Stage 6 blocks them.
