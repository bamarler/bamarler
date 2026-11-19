'use client'

import { useTexture } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { textureSet } from '@/lib/desk/assets'

/** A flat plane with a tiled PBR texture set from public/textures. `color` tints it, like paint. */
export default function Surface({
  texture,
  size,
  repeat,
  color = '#ffffff',
  roughness = 1,
  ...props
}: {
  texture: string
  size: [number, number]
  repeat: [number, number]
  color?: string
  roughness?: number
} & ThreeElements['mesh']) {
  const set = textureSet(texture)
  // Configure textures in the loader callback; values returned from hooks are treated as immutable.
  const [map, normalMap, arm] = useTexture([set.map, set.normalMap, set.aoMap], (loaded) => {
    loaded[0].colorSpace = THREE.SRGBColorSpace
    for (const t of loaded) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(...repeat)
      t.anisotropy = 8
    }
  })
  return (
    <mesh {...props}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} map={map} normalMap={normalMap} aoMap={arm} roughnessMap={arm} metalnessMap={arm} />
    </mesh>
  )
}
