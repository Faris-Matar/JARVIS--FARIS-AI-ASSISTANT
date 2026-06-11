/**
 * PATTERN: Horizontal journey inside vertical scroll
 *
 * WHAT: A pinned section where vertical scroll translates a track
 * horizontally — turns a process/timeline/portfolio into a literal journey
 * sideways through the story. Pairs beautifully with parallax layers moving
 * at different rates inside each panel.
 *
 * WHEN: Sequential content with 3–6 panels (process steps, chapters,
 * before/after). One per page maximum.
 * GOTCHAS:
 *  - Width math: end must equal the actual horizontal distance or the scrub
 *    speed feels wrong → use the function-based end below, and
 *    invalidateOnRefresh for resize correctness.
 *  - Inner-panel animations use containerAnimation, NOT their own scroller.
 *  - On touch/small screens consider falling back to native vertical stack.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function buildHorizontalJourney(section, track) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const distance = () => track.scrollWidth - window.innerWidth

  const scrollTween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  })

  // per-panel inner reveals, timed against the horizontal motion
  track.querySelectorAll('[data-panel]').forEach((panel) => {
    gsap.from(panel.querySelectorAll('[data-reveal]'), {
      y: 40,
      autoAlpha: 0,
      stagger: 0.1,
      scrollTrigger: {
        trigger: panel,
        containerAnimation: scrollTween,
        start: 'left 70%',
      },
    })
  })

  return scrollTween
}

/**
 * Markup contract:
 * <section class="overflow-hidden">           ← trigger (pinned)
 *   <div class="flex w-max">                  ← track
 *     <article data-panel class="w-screen h-screen shrink-0">
 *       <h3 data-reveal>…</h3>
 *     </article>
 *     …
 *   </div>
 * </section>
 */
