# Reference Library

A living library of proven patterns the pipeline draws on when generating new
sites. **These are references, not templates** — Stage 5 is instructed to
extract the *technique* (the shader approach, the pin structure, the
performance trick) and rebuild it for each brand's unique concept. Wholesale
copy-paste is explicitly forbidden in the Stage 5 prompt.

```
3d-components/      Three.js / React Three Fiber patterns
scroll-animations/  GSAP + ScrollTrigger + Lenis patterns
layout-patterns/    Page architecture & narrative structure notes
```

## How the pipeline uses this

`cli.js` concatenates relevant files from this directory into the
`{{reference_library}}` variable for the Stage 5 prompt. Keep individual files
focused (one pattern per file) so the excerpts stay useful.

## Growing the library

After every build, harvest the best new pattern back into here:

1. One pattern per file, named for the technique not the client
   (`ribbon-transmission-mesh.jsx`, not `apex-hero.jsx`).
2. Top-of-file comment block: what it does, when to use it, performance notes,
   gotchas.
3. Strip all client copy, colours, and branding — keep the mechanism.
4. Commit with a line on which build it came from and why it earned its place.

The library compounds: every build should make the next one better.

## On InteliSite

The InteliSite repo may be referenced for small utilities only — smooth scroll
setup, minor structural patterns. Never for overall design or layout. If a
useful utility pattern from it stabilises, document it here as its own file
rather than referencing the repo directly.
