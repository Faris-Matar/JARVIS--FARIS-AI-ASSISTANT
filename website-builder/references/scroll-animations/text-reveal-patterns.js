/**
 * PATTERN: Text reveal kit (line mask / char stagger / scramble-settle)
 *
 * WHAT: Three reusable text entrance mechanics. Used to give headlines a
 * physical, crafted entrance instead of a fade. Pick ONE language per site
 * and use it consistently — mixing all three reads as noise.
 *
 * WHEN: Headlines and key copy lines at narrative beats.
 * GOTCHAS:
 *  - Splitting must preserve accessibility: keep the original text in
 *    aria-label on the wrapper and aria-hidden on the split spans.
 *  - Split AFTER fonts load (document.fonts.ready) or line breaks shift.
 *  - Reduced motion: skip splitting entirely; text just appears.
 */
import gsap from 'gsap'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Split a heading into per-line masked wrappers, return inner line elements. */
export function splitLines(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)
  const words = text.split(' ')
  el.innerHTML = ''
  // naive line split: wrap words, measure offsetTop groups
  const spans = words.map((w) => {
    const s = document.createElement('span')
    s.textContent = w + ' '
    s.style.display = 'inline-block'
    el.appendChild(s)
    return s
  })
  const lines = []
  let top = null
  spans.forEach((s) => {
    if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop }
    lines.at(-1).push(s)
  })
  el.innerHTML = ''
  return lines.map((lineSpans) => {
    const mask = document.createElement('span')
    mask.style.cssText = 'display:block;overflow:hidden'
    mask.setAttribute('aria-hidden', 'true')
    const inner = document.createElement('span')
    inner.style.display = 'block'
    inner.textContent = lineSpans.map((s) => s.textContent).join('')
    mask.appendChild(inner)
    el.appendChild(mask)
    return inner
  })
}

/** 1. Line mask rise — editorial, calm, premium. */
export function lineMaskReveal(el, trigger) {
  if (reduced()) return
  const lines = splitLines(el)
  gsap.from(lines, {
    yPercent: 110,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: trigger ?? el, start: 'top 80%' },
  })
}

/** 2. Char stagger — energetic, playful. Cap chars (~40) for perf. */
export function charStagger(el, trigger) {
  if (reduced()) return
  const text = el.textContent
  el.setAttribute('aria-label', text)
  el.innerHTML = [...text]
    .map((c) => `<span aria-hidden="true" style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`)
    .join('')
  gsap.from(el.children, {
    yPercent: 60,
    autoAlpha: 0,
    rotateX: -40,
    duration: 0.6,
    ease: 'back.out(1.6)',
    stagger: 0.015,
    scrollTrigger: { trigger: trigger ?? el, start: 'top 80%' },
  })
}

/** 3. Scramble-settle — technical, futuristic brands. */
export function scrambleSettle(el, trigger) {
  if (reduced()) return
  const final = el.textContent
  const glyphs = '!<>-_\\/[]{}—=+*^?#'
  const proxy = { p: 0 }
  gsap.to(proxy, {
    p: 1,
    duration: 1.1,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: trigger ?? el, start: 'top 80%' },
    onUpdate() {
      const settled = Math.floor(final.length * proxy.p)
      el.textContent =
        final.slice(0, settled) +
        [...final.slice(settled)].map((c) => (c === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0])).join('')
    },
  })
}
