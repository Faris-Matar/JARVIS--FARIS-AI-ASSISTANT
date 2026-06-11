# Layout Pattern: Hero Architectures (non-template)

**What:** Five structurally different ways to open a site, so heroes never
default to "centered headline over 3D background". Choose based on the
direction's concept, not rotation.

## 1. The Stage
Full-viewport 3D scene IS the hero; the headline sits inside the scene's
composition (offset to a third, never dead-centre). Scroll hint is diegetic —
something in the scene points down. Fits: immersive brand-world concepts.

## 2. The Split Assertion
Hard asymmetric split (60/40 or 70/30). Massive multi-line headline one side
(line-mask reveal), 3D object or media filling the other, bleeding off-edge.
Copy column carries the CTA high. Fits: confident, editorial, B2B-with-taste.

## 3. The Cold Open
No hero in the classic sense — the page opens mid-story with a pinned
statement sequence (2–3 full-screen lines that swap as you scroll) and the 3D
world assembles DURING the opening pin. The "hero image" is the third beat.
Fits: brands whose pain point is visceral and worth dramatising.

## 4. The Specimen
Product/object-led: the 3D subject floats in a vast empty field, tiny caption
text orbiting it (name, one outcome line, CTA). Everything else waits below.
Fits: single-product brands, craft objects, portfolios with one flagship.

## 5. The Ticker Frame
Viewport framed by live edges — a marquee strip top or bottom (verified
proof items ticking past), headline block anchored low-left, 3D element
breaking the frame from behind. Fits: high-energy, volume-of-work brands.

**Rules across all five:**
- Headline visible without interaction; LCP element is text or a sized image,
  never the canvas.
- One primary CTA in the opening viewport.
- The 3D element must mean something (see direction's concept); if it's
  wallpaper, redesign.
- Reserve layout space for the canvas (no CLS when it lazy-loads in).
