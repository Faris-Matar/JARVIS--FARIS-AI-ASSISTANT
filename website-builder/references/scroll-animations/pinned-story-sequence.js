/**
 * PATTERN: Pinned story sequence (scrub timeline)
 *
 * WHAT: Pin a section for N viewport-heights and scrub a multi-step GSAP
 * timeline through it. The backbone of "story-like" scroll: the user's scroll
 * IS the playhead. Steps can swap headlines, morph visuals, drive 3D uniforms.
 *
 * WHEN: The narrative moments — pain mirror, transformation reveal, process
 * walkthrough. Use 1–3 per page max; pins lose power when everything pins.
 * GOTCHAS:
 *  - end: '+=300%' means the pin lasts 3 viewport heights — size to the number
 *    of beats (roughly 100% per beat).
 *  - Use ease: 'none' on scrubbed tweens; easing inside a scrub feels broken.
 *    Put the feel in `scrub: 0.5–1` smoothing instead.
 *  - Always provide the reduced-motion fallback: no pin, content stacked.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function buildPinnedStory(section) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const beats = section.querySelectorAll('[data-beat]')

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${beats.length * 100}%`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
    },
  })

  beats.forEach((beat, i) => {
    if (i > 0) {
      // previous beat exits up as the next enters — a "slide projector" of story
      tl.to(beats[i - 1], { yPercent: -30, autoAlpha: 0, duration: 0.4 }, i)
    }
    tl.fromTo(beat, { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5 }, i + 0.1)
  })

  return tl
}

/**
 * Markup contract:
 * <section ref={sectionRef} class="relative h-screen overflow-hidden">
 *   <div data-beat>…beat 1 headline/copy…</div>
 *   <div data-beat class="absolute inset-0">…beat 2…</div>
 * </section>
 *
 * Variation worth stealing: drive a 3D uniform alongside the beats —
 * tl.to(progressRef, { current: 1, duration: beats.length }, 0)
 */
