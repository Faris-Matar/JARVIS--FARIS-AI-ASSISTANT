/**
 * PATTERN: Lenis + GSAP ScrollTrigger foundation
 *
 * WHAT: The canonical smooth-scroll wiring every build uses. One Lenis
 * instance, ScrollTrigger updated from Lenis, GSAP ticker drives Lenis.
 * (This is the kind of small utility pattern InteliSite may be referenced
 * for — it is plumbing, not design.)
 *
 * WHEN: Always. Mount once at app root.
 * GOTCHAS:
 *  - Package is `lenis` (the old `@studio-freight/lenis` is deprecated).
 *  - lagSmoothing(0) or pinned sections drift after tab-switch.
 *  - Respect prefers-reduced-motion: skip Lenis entirely, native scroll.
 *  - Kill everything on unmount or HMR double-mounts in dev.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])
}
