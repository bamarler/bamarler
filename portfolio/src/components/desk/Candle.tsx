'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Model from './Model'
import { SCRIM_ORDER, useInspect } from './inspect'
import { useDevice } from './useDevice'

// A lit candle in a wooden candlestick. The model is Poly Haven's; the flame, its halo and
// the warm light it throws are drawn here. The scene only renders on demand, so while the
// flame flickers it asks for frames at a modest rate; with reduced motion it burns still.

// wick tip in the model's own space (it's modelled in metres, so no scaling)
const WICK = new THREE.Vector3(-0.002, 0.2185, 0)
const FLAME = { width: 0.013, height: 0.036 }
const HALO = 0.16
const LIGHT = { color: '#ffa357', intensity: 0.12, distance: 2 }
const FPS = 30

// Drawn after the room but before the inspect scrim, so holding something dims the flame
// like everything else. Additive and opaque-pass, so it never sorts against the scrim.
const FLAME_ORDER = SCRIM_ORDER - 1

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}
/** smooth 1D value noise in 0..1 */
const noise = (t: number) => {
  const i = Math.floor(t)
  const f = t - i
  const u = f * f * (3 - 2 * f)
  return hash(i) * (1 - u) + hash(i + 1) * u
}

const flameVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSway;
  uniform float uStretch;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float h = uv.y * uv.y;
    p.y *= uStretch;
    p.x += h * (uSway + 0.08 * sin(uTime * 9.0 + uv.y * 4.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const flameFragment = /* glsl */ `
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;
    float x = (vUv.x - 0.5) * 2.0;
    // teardrop: round at the bottom, drawn to a point at the top
    float hw = sin(3.14159 * pow(clamp(y, 0.0, 1.0), 0.42));
    float d = abs(x) / max(hw, 1e-3);
    float alpha = smoothstep(1.0, 0.55, d) * smoothstep(0.0, 0.06, y);
    float core = smoothstep(0.8, 0.15, d) * smoothstep(0.9, 0.3, y) * smoothstep(0.08, 0.3, y);
    vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.93, 0.72), core);
    // the faint blue at the root of a real flame
    float blue = smoothstep(0.24, 0.04, y) * smoothstep(0.35, 0.9, d);
    col = mix(col, vec3(0.3, 0.42, 1.0), blue * 0.7);
    alpha *= mix(1.0, 0.45, blue);
    gl_FragColor = vec4(col * uGlow, alpha);
  }
`

const haloFragment = /* glsl */ `
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float a = exp(-r * r * 5.0) * smoothstep(1.0, 0.7, r);
    gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * uGlow, a * 0.22);
  }
`

const passVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function glowMaterial(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    blending: THREE.AdditiveBlending,
    transparent: false,
    depthWrite: false,
    toneMapped: false,
  })
}

type Props = { position: [number, number, number]; rotationY?: number; still?: boolean }

export default function Candle({ position, rotationY = 0, still = false }: Props) {
  const invalidate = useThree((s) => s.invalidate)
  const { reducedMotion } = useDevice()
  const calm = still || reducedMotion
  // nothing to flicker for while an open document covers the room
  const covered = useInspect((s) => s.phase === 'inspecting' && !!s.active && !!s.items[s.active]?.opens)
  const light = useRef<THREE.PointLight>(null)
  const flameMesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)
  const haloMesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)

  const { flame, halo, flameGeometry } = useMemo(() => {
    const flameGeometry = new THREE.PlaneGeometry(1, 1, 1, 12).translate(0, 0.5, 0)
    return {
      flameGeometry,
      flame: glowMaterial(flameVertex, flameFragment, {
        uTime: { value: 0 },
        uSway: { value: 0 },
        uStretch: { value: 1 },
        uGlow: { value: 1 },
      }),
      halo: glowMaterial(passVertex, haloFragment, { uGlow: { value: 1 } }),
    }
  }, [])

  useEffect(
    () => () => {
      flame.dispose()
      halo.dispose()
      flameGeometry.dispose()
    },
    [flame, halo, flameGeometry],
  )

  // ask for frames while the flame is alive; the browser stops these in background tabs
  useEffect(() => {
    if (calm || covered) return
    const id = setInterval(invalidate, 1000 / FPS)
    return () => clearInterval(id)
  }, [calm, covered, invalidate])

  useFrame(({ clock }) => {
    if (!flameMesh.current || !haloMesh.current || !light.current) return
    const f = flameMesh.current.material.uniforms
    const t = calm ? 0 : clock.elapsedTime
    const flicker = calm ? 0.5 : 0.7 * noise(t * 7) + 0.3 * noise(t * 19 + 40)
    // now and then a draught leans the flame over and it gutters
    const draught = calm ? 0 : Math.max(0, noise(t * 0.35 + 11) - 0.72) / 0.28
    f.uTime.value = t
    f.uSway.value = (noise(t * 1.6 + 3) - 0.5) * 0.12 + draught * 0.22
    f.uStretch.value = 0.88 + 0.22 * flicker - draught * 0.15
    f.uGlow.value = 0.9 + 0.2 * flicker
    haloMesh.current.material.uniforms.uGlow.value = 0.8 + 0.35 * flicker - draught * 0.25
    light.current.intensity = LIGHT.intensity * (0.8 + 0.35 * flicker - draught * 0.3)
    light.current.position.x = WICK.x + draught * 0.006
  })

  return (
    <group position={position} rotation-y={rotationY}>
      <Model id="wooden_candlestick" />
      <Billboard position={[WICK.x, WICK.y - 0.004, WICK.z]} lockX lockZ>
        <mesh ref={flameMesh} geometry={flameGeometry} material={flame} scale={[FLAME.width, FLAME.height, 1]} renderOrder={FLAME_ORDER} />
      </Billboard>
      <Billboard position={[WICK.x, WICK.y + FLAME.height * 0.4, WICK.z]}>
        <mesh ref={haloMesh} material={halo} scale={HALO} renderOrder={FLAME_ORDER}>
          <planeGeometry />
        </mesh>
      </Billboard>
      <pointLight
        ref={light}
        position={[WICK.x, WICK.y + 0.015, WICK.z]}
        color={LIGHT.color}
        intensity={LIGHT.intensity}
        distance={LIGHT.distance}
        decay={2}
      />
    </group>
  )
}
