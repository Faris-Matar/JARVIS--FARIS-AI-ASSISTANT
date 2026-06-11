/**
 * PATTERN: Scroll-morphing particle field
 *
 * WHAT: A GPU-friendly points cloud whose particles interpolate between two
 * (or more) target shapes as the user scrolls — e.g. chaos → logo silhouette,
 * scattered dust → product outline. Strong fit for "order from chaos" /
 * transformation narratives (pain state → dream state).
 *
 * WHEN: Hero or mid-page pinned section. Works on dark backgrounds.
 * PERF: One BufferGeometry, one ShaderMaterial, zero per-frame allocations.
 *       Keep count ≤ 15k on mobile (pass `count` down from a device check).
 * GOTCHAS:
 *  - Drive `uProgress` from a GSAP ScrollTrigger scrub, not from React state,
 *    or you'll re-render the canvas every frame.
 *  - Generate target positions ONCE in useMemo; never in the frame loop.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertex = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  attribute vec3 aTarget;
  attribute float aRandom;
  void main() {
    // ease each particle individually so the morph feels organic, not linear
    float p = smoothstep(0.0, 1.0, clamp(uProgress * (1.0 + aRandom) - aRandom * 0.5, 0.0, 1.0));
    vec3 pos = mix(position, aTarget, p);
    pos.y += sin(uTime * 0.6 + aRandom * 6.28) * 0.02 * (1.0 - p); // idle drift fades as it forms
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.0 + aRandom * 2.0) * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.1, d));
  }
`

export function ParticleFieldMorph({ count = 12000, color = '#7dd3fc', targetPositions, progressRef }) {
  const material = useRef()

  const { positions, targets, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // start state: loose sphere of chaos
      const r = 3 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      randoms[i] = Math.random()
    }
    // targetPositions: Float32Array sampled from any mesh surface
    // (use MeshSurfaceSampler) or generated from text/logo geometry.
    return { positions, targets: targetPositions, randoms }
  }, [count, targetPositions])

  useFrame((state) => {
    material.current.uniforms.uTime.value = state.clock.elapsedTime
    // progressRef.current is written by a GSAP ScrollTrigger scrub outside R3F:
    // gsap.to(progressRef, { current: 1, scrollTrigger: { trigger, scrub: 1, pin: true } })
    material.current.uniforms.uProgress.value = progressRef.current
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[targets, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        }}
      />
    </points>
  )
}
