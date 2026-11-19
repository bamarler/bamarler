'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SCRIM_ORDER, held, motion, rotateGoal, useInspect, zoomBy } from './inspect'
import { useDevice } from './useDevice'

// Everything that happens while an object is held: turning it with a drag (with inertia),
// zooming with the wheel or a pinch, flipping with a double-click / double-tap, putting it
// back (tap away, swipe down, Esc), and the dimmed backdrop.

const SPIN = 2.4 // radians for a drag across the screen's shorter side
const INERTIA = 4 // spin decay rate after release
const SPIN_EASE = 16
const TAP_SLOP = 6 // px
const DOUBLE_TAP = 320 // ms
const SWIPE_DOWN = { distance: 0.12, time: 450 } // fraction of screen height, ms
const SCRIM = { opacity: 0.6, distance: 0.1 }

export default function Inspector() {
  const element = useThree((s) => s.gl.domElement)
  const invalidate = useThree((s) => s.invalidate)
  const get = useThree((s) => s.get)
  const phase = useInspect((s) => s.phase)
  const { reducedMotion } = useDevice()

  const scrim = useRef<THREE.Mesh>(null)
  const fade = useRef({ scrim: 0 })

  useEffect(() => {
    // objects that open hand their input to the reader instead
    const inspecting = () => {
      const { phase, active, items } = useInspect.getState()
      return phase === 'inspecting' && !(active && items[active]?.opens)
    }
    const pointers = new Map<number, { x: number; y: number }>()
    const drag = { onObject: false, startX: 0, startY: 0, startT: 0, lastT: 0, moved: 0, pinch: 0 }
    let lastTap = 0

    const hitsHeld = (e: PointerEvent) => {
      const { active } = useInspect.getState()
      const object = active ? held.get(active) : undefined
      if (!object) return false
      const { camera, raycaster } = get()
      const r = element.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      return raycaster.intersectObject(object, true).length > 0
    }
    const spread = () => {
      const [a, b] = [...pointers.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    const down = (e: PointerEvent) => {
      if (!inspecting()) return
      element.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) {
        Object.assign(drag, { onObject: hitsHeld(e), startX: e.clientX, startY: e.clientY, startT: e.timeStamp, lastT: e.timeStamp, moved: 0 })
        motion.vel.set(0, 0)
      } else if (pointers.size === 2) {
        drag.pinch = spread()
        drag.moved = Infinity // a pinch never ends in a tap
      }
    }

    const move = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId)
      if (!last) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size >= 2) {
        const d = spread()
        if (d > 0 && drag.pinch > 0) zoomBy(drag.pinch / d)
        drag.pinch = d
      } else {
        drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY))
        const k = SPIN / Math.min(window.innerWidth, window.innerHeight)
        rotateGoal(dx * k, dy * k)
        const dt = Math.max(1, e.timeStamp - drag.lastT) / 1000
        motion.vel.lerp(new THREE.Vector2((dx * k) / dt, (dy * k) / dt), 0.4)
        drag.lastT = e.timeStamp
      }
      invalidate()
    }

    const up = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      if (pointers.size > 0 || e.type === 'pointercancel') return
      // a finger resting before release means no fling
      if (e.timeStamp - drag.lastT > 80 || reducedMotion) motion.vel.set(0, 0)
      const { putDown, active, items } = useInspect.getState()
      if (drag.moved <= TAP_SLOP) {
        motion.vel.set(0, 0)
        if (!drag.onObject) putDown()
        else if (e.timeStamp - lastTap < DOUBLE_TAP && active && items[active]?.flip) {
          rotateGoal(Math.PI, 0)
          lastTap = 0
        } else lastTap = e.timeStamp
      } else {
        const dy = e.clientY - drag.startY
        const dx = e.clientX - drag.startX
        const swipedDown =
          !drag.onObject &&
          dy > SWIPE_DOWN.distance * window.innerHeight &&
          dy > 2 * Math.abs(dx) &&
          e.timeStamp - drag.startT < SWIPE_DOWN.time
        if (swipedDown) putDown()
      }
      invalidate()
    }

    const wheel = (e: WheelEvent) => {
      if (!inspecting()) return
      e.preventDefault()
      zoomBy(Math.exp(e.deltaY * 0.0015))
      invalidate()
    }

    const key = (e: KeyboardEvent) => {
      const { phase, active, items, putDown } = useInspect.getState()
      if (phase === 'idle') return
      if (e.key === 'Escape') putDown()
      if (phase !== 'inspecting' || (active && items[active]?.opens)) return
      const step = 0.4
      const turns: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      if (turns[e.key]) rotateGoal(...turns[e.key])
      else if (e.key === '+' || e.key === '=') zoomBy(0.85)
      else if (e.key === '-' || e.key === '_') zoomBy(1 / 0.85)
      else if (e.key.toLowerCase() === 'f' && active && items[active]?.flip) rotateGoal(Math.PI, 0)
      else return
      e.preventDefault()
      invalidate()
    }

    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      element.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', key)
    }
  }, [element, get, invalidate, reducedMotion])

  useEffect(() => void invalidate(), [phase, invalidate])

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const holding = phase === 'lifting' || phase === 'inspecting'

    // spin: inertia after a fling, then ease the visible spin toward its goal
    if (motion.vel.lengthSq() > 1e-6) {
      rotateGoal(motion.vel.x * dt, motion.vel.y * dt)
      motion.vel.multiplyScalar(Math.exp(-INERTIA * dt))
    }
    motion.spin.slerp(motion.spinGoal, 1 - Math.exp(-SPIN_EASE * dt))
    motion.zoom = THREE.MathUtils.damp(motion.zoom, motion.zoomGoal, 10, dt)

    // backdrop: a dark sheet just in front of the camera, drawn over the room
    const f = fade.current
    f.scrim = THREE.MathUtils.damp(f.scrim, holding ? SCRIM.opacity : 0, holding ? 5 : 8, dt)
    const s = scrim.current!
    s.visible = f.scrim > 0.002
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    if (s.visible) {
      ;(s.material as THREE.MeshBasicMaterial).opacity = f.scrim
      s.position.set(0, 0, -SCRIM.distance).applyQuaternion(camera.quaternion).add(camera.position)
      s.quaternion.copy(camera.quaternion)
      s.scale.set(2.2 * halfH * camera.aspect * SCRIM.distance, 2.2 * halfH * SCRIM.distance, 1)
    }

    const settling =
      motion.vel.lengthSq() + motion.spin.angleTo(motion.spinGoal) + Math.abs(motion.zoom - motion.zoomGoal) +
      Math.abs(f.scrim - (holding ? SCRIM.opacity : 0))
    if (settling > 1e-4) invalidate()
  })

  return (
    <>
      <mesh ref={scrim} renderOrder={SCRIM_ORDER} visible={false}>
        <planeGeometry />
        {/* custom blending keeps it in the opaque pass, so the held object can draw after it */}
        <meshBasicMaterial
          color="#0d0c0a"
          blending={THREE.CustomBlending}
          depthTest={false}
          depthWrite={false}
          opacity={0}
        />
      </mesh>
    </>
  )
}
