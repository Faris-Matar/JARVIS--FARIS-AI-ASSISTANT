# Pipeline Prompts

One production-grade prompt file per pipeline stage. Every prompt follows the
full structured prompt engineering standard:

1. **Role** — who the model is for this stage
2. **Context** — what it knows, what it receives, where this sits in the pipeline
3. **Task** — exactly what to produce
4. **Constraints** — hard rules that must hold
5. **What Not To Do** — explicit anti-patterns
6. **Output Format** — the exact structure of the response
7. **Examples** — concrete good (and bad) examples

## Stage map

| Stage | File | Input | Output artifact |
|---|---|---|---|
| 1. Client Intake | (no prompt — human-driven, see `../intake/`) | Client form + Faris's supplementary info | `intake/clients/<client>/` |
| 2. Brand Intelligence Brief | `stage-2-brand-brief.md` | Full intake package | `01-brand-brief.md` |
| 3. Design Direction | `stage-3-design-directions.md` | Brand brief + intake | `02-design-directions.md` → **Faris picks one** |
| 4. Copywriting | `stage-4-copywriting.md` | Brand brief + chosen direction | `03-copy.md` |
| 5. Code Generation | `stage-5-code-generation.md` | Brief + direction + copy + reference library | `site/` (full repo) |
| 6. Quality Control | `stage-6-quality-control.md` | Everything above | `04-qc-report.md` (+ fixes) |
| 7. Output | (no prompt — assembly step) | QC-passed site | `REVIEW.md` + deployable repo |

## Template variables

Prompts contain `{{variable}}` placeholders that the pipeline fills in at runtime:

- `{{intake_package}}` — full text of the client form + supplementary info
- `{{brand_brief}}` — Stage 2 output
- `{{chosen_direction}}` — the design direction Faris approved (full text)
- `{{copy}}` — Stage 4 output
- `{{reference_library}}` — relevant excerpts from `../references/`
- `{{site_files}}` — generated site source (Stage 6 only)

## Editing prompts

These files are the product. When a build comes out weak, fix the prompt, not
the output. Commit prompt changes with a note on what build exposed the weakness.
