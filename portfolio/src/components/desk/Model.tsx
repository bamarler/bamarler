'use client'

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { modelUrl } from '@/lib/desk/assets'

type ModelProps = {
  id: string
  position?: [number, number, number]
  rotationY?: number
  /**
   * Target bounding-box size in metres. One axis scales uniformly;
   * several axes stretch the model to match each one.
   */
  fit?: { x?: number; y?: number; z?: number }
  /** multiplies the model's colours, like a wood stain */
  tint?: string
  /** leave out glass panes, which render as solid black here rather than see-through */
  noGlass?: boolean
  /** rotate the model itself (radians, x/y/z) before it's sized and set down, e.g. to stand
   *  up a book that was modelled lying flat */
  tip?: [number, number, number]
  /** drop the triangles that reach past `above` on `axis` (the model's own units, before
   *  `tip`), e.g. a bookmark ribbon hanging out of the bottom of a book */
  cut?: { axis: 'x' | 'y' | 'z'; above: number }
  /** draw it solid: no blending, and only pixels whose alpha is under this are cut out
   *  (0: none). For models exported see-through, or whose cutout edges came through
   *  texture compression full of holes. */
  alphaTest?: number
  /** no shine: fully rough, not metal, and nothing from the room reflected in it */
  matte?: boolean
  /** show `map` on the material named `material` instead of its own picture (null: its own) */
  art?: { material: string; map: THREE.Texture | null }
}

const AXES = { x: 0, y: 1, z: 2 } as const

/** a copy of the mesh's geometry without the triangles that reach past `above` */
function trimmed(mesh: THREE.Mesh, axis: number, above: number) {
  const geometry = mesh.geometry.clone()
  const pos = geometry.attributes.position
  const index = geometry.index ? Array.from(geometry.index.array) : Array.from({ length: pos.count }, (_, i) => i)
  const v = new THREE.Vector3()
  const past = (i: number) => v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).getComponent(axis) > above
  const keep: number[] = []
  for (let t = 0; t < index.length; t += 3) {
    const tri = index.slice(t, t + 3)
    if (!tri.some(past)) keep.push(...tri)
  }
  geometry.setIndex(keep)
  // unindexed, so the dropped triangles' vertices go too and don't count toward its bounds
  return geometry.toNonIndexed()
}

/** give each mesh its own copies of its materials, changed by `change` */
function restyle(object: THREE.Object3D, change: (m: THREE.Material) => void) {
  object.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    o.material = (Array.isArray(o.material) ? o.material : [o.material]).map((m: THREE.Material) => {
      const c = m.clone()
      change(c)
      return c
    })
    if (o.material.length === 1) o.material = o.material[0]
  })
}

/** Loads a built GLB and rests the bottom of its bounding box on y = 0 at `position`. */
export default function Model({ id, position = [0, 0, 0], rotationY = 0, fit, tint, noGlass = false, tip, cut, alphaTest, matte = false, art }: ModelProps) {
  const { scene } = useGLTF(modelUrl(id))
  const { x: fx, y: fy, z: fz } = fit ?? {}
  const tipKey = tip?.join(',') // a stable dependency for an inline array
  const cutKey = cut && `${cut.axis}:${cut.above}`
  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true)
    if (noGlass) {
      object.traverse((o) => {
        if (o instanceof THREE.Mesh && /glass/i.test((o.material as THREE.Material).name)) o.visible = false
      })
    }
    if (tint) {
      // clones share materials with the cached GLB, so stain copies of them
      const stain = new THREE.Color(tint)
      restyle(object, (m) => {
        if ('color' in m && m.color instanceof THREE.Color) m.color.multiply(stain)
      })
    }
    if (matte) {
      restyle(object, (m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return
        m.roughness = 1
        m.roughnessMap = null
        m.metalness = 0
        m.metalnessMap = null
        m.envMapIntensity = 0
      })
    }
    if (alphaTest !== undefined) {
      restyle(object, (m) => {
        m.transparent = false
        m.depthWrite = true
        m.alphaTest = alphaTest
      })
    }
    if (cutKey) {
      const [axis, above] = cutKey.split(':')
      object.updateMatrixWorld(true)
      object.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry = trimmed(o, AXES[axis as keyof typeof AXES], Number(above))
      })
    }
    if (tipKey) {
      const [rx, ry, rz] = tipKey.split(',').map(Number)
      object.rotation.set(rx, ry, rz)
      object.updateMatrixWorld(true)
    }
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const ratios = [fx && fx / size.x, fy && fy / size.y, fz && fz / size.z]
    const given = ratios.filter((r) => r !== undefined)
    const uniform = given.length === 1 ? given[0] : 1
    const scale = new THREE.Vector3(...ratios.map((r) => r ?? uniform))
    const center = box.getCenter(new THREE.Vector3())
    const offset: [number, number, number] = [-center.x * scale.x, -box.min.y * scale.y, -center.z * scale.z]
    return { object, scale, offset }
  }, [scene, fx, fy, fz, tint, noGlass, tipKey, cutKey, alphaTest, matte])

  const invalidate = useThree((s) => s.invalidate)
  const artMaterial = art?.material
  const artMap = art?.map
  useEffect(() => {
    if (!artMaterial || !artMap) return
    const swapped: [THREE.Mesh, THREE.Material, THREE.MeshStandardMaterial][] = []
    object.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || !(o.material instanceof THREE.MeshStandardMaterial)) return
      if (o.material.name !== artMaterial) return
      const own = o.material
      const shown = own.clone()
      shown.map = artMap
      o.material = shown
      swapped.push([o, own, shown])
    })
    invalidate()
    return () => {
      for (const [mesh, own, shown] of swapped) {
        mesh.material = own
        shown.dispose()
      }
      invalidate()
    }
  }, [object, artMaterial, artMap, invalidate])

  return (
    <group position={position} rotation-y={rotationY}>
      <primitive object={object} scale={scale} position={offset} />
    </group>
  )
}
