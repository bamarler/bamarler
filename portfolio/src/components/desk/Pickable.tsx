'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { HELD_ORDER, held, motion, useInspect } from './inspect'
import { useDevice } from './useDevice'

// Wrap anything in <Pickable> and it can be picked up, turned over and put back.
// The wrapper rests where it's placed; while held, the object floats in front of the camera
// and its pose is computed in camera space every frame, so it follows the camera exactly.

type Props = {
  id: string
  label: string
  /** whether a double-click / double-tap turns it around (default true) */
  flip?: boolean
  /** opens into a reader once held instead of spinning (see Reader) */
  opens?: boolean
  /** how it's turned when held, relative to the camera (radians, XYZ) */
  face?: [number, number, number]
  /** how much of the screen's shorter side the object should fill when held (0–1) */
  fill?: number
  children: ReactNode
} & Omit<ThreeElements['group'], 'id' | 'children'>

const DURATION = { lift: 0.75, back: 0.6, reduced: 0.2 }
const ARC = 0.06 // how high the object hops on its way (m)
const HOVER_LIFT = 0.006
const TAP_SLOP = 6 // px a pointer may move and still count as a tap

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export default function Pickable({
  id,
  label,
  flip = true,
  opens = false,
  face = [0.45, 0, 0],
  fill = 0.6,
  children,
  ...props
}: Props) {
  const outer = useRef<THREE.Group>(null)
  const holder = useRef<THREE.Group>(null) // animated; its origin is the object's centre
  const content = useRef<THREE.Group>(null) // shifted so that centre sits on holder's origin
  const invalidate = useThree((s) => s.invalidate)
  const { touch, reducedMotion } = useDevice()

  const phase = useInspect((s) => (s.active === id ? s.phase : 'idle'))
  const hovered = useInspect((s) => s.hovered === id)
  const free = useInspect((s) => s.phase === 'idle')
  const register = useInspect((s) => s.register)
  const unregister = useInspect((s) => s.unregister)

  const pose = useRef({
    center: new THREE.Vector3(),
    radius: 0.05,
    progress: 0,
    last: 'idle' as string,
    lift: 0,
    fromPos: new THREE.Vector3(),
    fromQuat: new THREE.Quaternion(),
  })

  useEffect(() => {
    register(id, { label, flip, opens })
    return () => unregister(id)
  }, [id, label, flip, opens, register, unregister])

  // measure the loaded object once and move the pivot to its centre
  useLayoutEffect(() => {
    const o = outer.current!
    o.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(content.current!)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const center = o.worldToLocal(sphere.center.clone())
    pose.current.center.copy(center)
    pose.current.radius = sphere.radius
    holder.current!.position.copy(center)
    content.current!.position.copy(center).negate()
    held.set(id, holder.current!)
    return () => void held.delete(id)
  }, [id])

  // while held, draw after the scrim so it stays bright
  useEffect(() => {
    const order = phase === 'idle' ? 0 : HELD_ORDER
    content.current!.traverse((o) => void (o.renderOrder = order))
    invalidate()
  }, [phase, invalidate])

  useEffect(() => {
    if (!hovered || !free) return
    document.body.style.cursor = 'pointer'
    invalidate()
    return () => {
      document.body.style.cursor = ''
      invalidate()
    }
  }, [hovered, free, invalidate])

  const goal = useRef({
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    tmp: new THREE.Quaternion(),
    euler: new THREE.Euler(),
  })

  useFrame((state, dt) => {
    const h = holder.current!
    const o = outer.current!
    const p = pose.current
    const rest = p.center

    if (phase !== p.last) {
      // a new leg of the trip starts from wherever the object is right now
      p.progress = 0
      p.fromPos.copy(h.position)
      p.fromQuat.copy(h.quaternion)
      p.last = phase
    }

    if (phase === 'idle') {
      p.lift = THREE.MathUtils.damp(p.lift, hovered && free ? HOVER_LIFT : 0, 14, dt)
      h.position.set(rest.x, rest.y + p.lift, rest.z)
      h.quaternion.identity()
      if (Math.abs(p.lift - (hovered && free ? HOVER_LIFT : 0)) > 1e-5) invalidate()
      return
    }

    // the held pose, converted into this wrapper's local space
    const camera = state.camera as THREE.PerspectiveCamera
    const g = goal.current
    const halfAngle = THREE.MathUtils.degToRad(camera.fov / 2)
    const halfMin = Math.min(Math.tan(halfAngle), Math.tan(halfAngle) * camera.aspect)
    const distance = (p.radius / (fill * halfMin)) * motion.zoom
    o.updateWorldMatrix(true, false)
    g.pos.set(0, 0, -distance).applyQuaternion(camera.quaternion).add(camera.position)
    o.worldToLocal(g.pos)
    g.quat
      .copy(o.getWorldQuaternion(g.tmp).invert())
      .multiply(camera.quaternion)
      .multiply(motion.spin)
      .multiply(g.tmp.setFromEuler(g.euler.set(...face)))

    if (phase === 'inspecting') {
      h.position.copy(g.pos)
      h.quaternion.copy(g.quat)
    } else {
      const lifting = phase === 'lifting'
      const duration = reducedMotion ? DURATION.reduced : lifting ? DURATION.lift : DURATION.back
      p.progress = Math.min(1, p.progress + dt / duration)
      const e = ease(p.progress)
      const to = lifting ? g.pos : rest
      h.position.lerpVectors(p.fromPos, to, e)
      if (!reducedMotion) h.position.y += Math.sin(Math.PI * p.progress) * ARC
      h.quaternion.slerpQuaternions(p.fromQuat, lifting ? g.quat : g.tmp.identity(), e)
      if (p.progress >= 1) useInspect.getState().settle(lifting ? 'inspecting' : 'idle')
      invalidate()
    }
    // once held it just follows the camera and the spin; whatever moves those asks for
    // the frame, so holding still costs nothing
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!free || e.delta > TAP_SLOP) return
    e.stopPropagation()
    useInspect.getState().pick(id)
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (touch || e.pointerType !== 'mouse') return
    e.stopPropagation()
    useInspect.getState().setHovered(id)
  }
  const onOut = () => {
    if (useInspect.getState().hovered === id) useInspect.getState().setHovered(null)
  }

  return (
    <group ref={outer} {...props} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <group ref={holder}>
        <group ref={content}>{children}</group>
      </group>
    </group>
  )
}
