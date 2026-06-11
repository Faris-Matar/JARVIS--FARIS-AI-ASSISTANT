# Stage 1 — Client Intake

The intake package is the only human-input stage at the start of the pipeline.
It has two parts:

1. **Client form** — the preferences form Faris sends the client.
   Template: [`client-form-template.md`](client-form-template.md)
2. **Supplementary info** — supplied by Faris: old website URL, competitor
   sites, brand assets, extra context.
   Template: [`supplementary-template.md`](supplementary-template.md)

## Starting a new job

```bash
node ../cli.js new <client-slug>
```

This creates `clients/<client-slug>/` with both templates copied in. Fill them
out, then run the pipeline:

```bash
node ../cli.js run <client-slug>
```

## Folder layout per client

```
clients/<client-slug>/
├── form.md            ← completed client form
├── supplementary.md   ← Faris's supplementary info
└── assets/            ← logos, brand files, photos (referenced by filename)
```

Everything in `form.md` + `supplementary.md` is concatenated into
`{{intake_package}}` for the prompts. Be generous with context — Stage 2 can
only work with what's here, and it is forbidden from inventing facts.
