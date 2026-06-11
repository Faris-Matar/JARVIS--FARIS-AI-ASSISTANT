/**
 * PATTERN: Scroll-driven camera rig (the "walkthrough")
 *
 * WHAT: The camera travels along a path through a 3D scene as the user
 * scrolls, turning the page into a guided tour. The strongest pattern for
 * story-like scroll narratives — each copy section corresponds to a camera
 * "station" in the scene.
 *
 * WHEN: A scene worth touring exists (process steps as 3D vignettes, a
 * product exploded view, an abstract brand world). Pin the canvas full-viewport
 * and let HTML copy sections float over it at each station.
 * PERF: Camera math is free. The scene contents are the budget — frustum-cull
 *       naturally by spacing stations apart.
 * GOTCHAS:
 *  - Use one ScrollTrigger with scrub for the WHOLE journey and normalize to
 *    0..1; derive per-station local progress inside the frame loop. Multiple
 *    competing camera tweens = jank and fights.
 *  - damp() the camera, never snap it — scrub jitter becomes visible otherwise.
 */
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function ScrollCameraRig({ progressRef, lookAtTargets }) {
  const { camera } = useThree()
  const smoothed = useRef(0)

  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.2, 8),    // station 0 — hero
        new THREE.Vector3(4, 0.8, 3),    // station 1 — pain section
        new THREE.Vector3(0, 2.5, -2),   // station 2 — process
        new THREE.Vector3(-4, 0.5, -6),  // station 3 — proof
        new THREE.Vector3(0, 1, -11),    // station 4 — CTA
      ]),
    []
  )

  useFrame((_, delta) => {
    // critically-damped chase of the raw scroll value kills scrub jitter
    smoothed.current = THREE.MathUtils.damp(smoothed.current, progressRef.current, 4, delta)
    const t = smoothed.current
    path.getPointAt(THREE.MathUtils.clamp(t, 0, 1), camera.position)

    // look at the nearest station target, blending between them
    const seg = Math.min(Math.floor(t * (lookAtTargets.length - 1)), lookAtTargets.length - 2)
    const local = t * (lookAtTargets.length - 1) - seg
    const target = new THREE.Vector3().lerpVectors(lookAtTargets[seg], lookAtTargets[seg + 1], local)
    camera.lookAt(target)
  })

  return null
}

/**
 * Driving GSAP setup (outside R3F):
 *
 * const progress = useRef(0)
 * useEffect(() => {
 *   const st = gsap.to(progress, {
 *     current: 1,
 *     ease: 'none',
 *     scrollTrigger: { trigger: '#journey', start: 'top top', end: 'bottom bottom', scrub: 0.5 },
 *   })
 *   return () => st.scrollTrigger?.kill()
 * }, [])
 *
 * #journey is a tall div (e.g. height: 500vh) with the Canvas position:sticky
 * inside it, and copy sections absolutely positioned at each station's range.
 */
