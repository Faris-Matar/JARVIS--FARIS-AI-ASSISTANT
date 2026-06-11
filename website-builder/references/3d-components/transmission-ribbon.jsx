/**
 * PATTERN: Glass transmission ribbon along a curve
 *
 * WHAT: A single tube extruded along a CatmullRom curve with
 * MeshTransmissionMaterial — reads as a ribbon of liquid glass. Use it as a
 * connective visual thread that runs through a page ("one continuous
 * journey/relationship" metaphors), or as a hero centrepiece.
 *
 * WHEN: Brands with a continuity/flow/craft story. Needs an Environment for
 * the refraction to read.
 * PERF: ONE mesh — cheap geometry, expensive material. Keep transmission
 *       samples low (4–6), resolution ≤ 512, clamp DPR at 1.5.
 * GOTCHAS:
 *  - MeshTransmissionMaterial needs <Environment> (drei) or it renders flat.
 *  - Animate the curve points, then rebuild geometry ONLY if needed; prefer
 *    animating rotation/position/material props which are free.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

export function TransmissionRibbon({ color = '#bae6fd', scrollRef }) {
  const mesh = useRef()

  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(-4, -1, 0),
      new THREE.Vector3(-1.5, 1.2, -1),
      new THREE.Vector3(1, -0.8, 0.5),
      new THREE.Vector3(3.5, 1, -0.5),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 120, 0.35, 24, false)
  }, [])

  useFrame((state) => {
    // slow idle rotation + scroll-driven unfurl (scrollRef written by GSAP scrub)
    mesh.current.rotation.y = state.clock.elapsedTime * 0.08 + (scrollRef?.current ?? 0) * Math.PI
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1
  })

  return (
    <>
      <mesh ref={mesh} geometry={geometry}>
        <MeshTransmissionMaterial
          color={color}
          thickness={0.6}
          roughness={0.15}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.04}
          samples={5}
          resolution={512}
        />
      </mesh>
      <Environment preset="city" />
    </>
  )
}

/**
 * Canvas wrapper showing the standard perf setup used with any 3D centrepiece:
 *
 * <Canvas dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
 *   <Suspense fallback={null}>
 *     <TransmissionRibbon scrollRef={scrollProgress} />
 *   </Suspense>
 * </Canvas>
 *
 * Lazy-load the whole canvas: const Scene = lazy(() => import('./Scene'))
 */
