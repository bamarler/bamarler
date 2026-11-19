'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useInspect } from './inspect'
import { DESK, WALL_Z } from './room'
import { useDevice } from './useDevice'

// While something is held the camera holds still: no parallax, no panning.
const busy = () => useInspect.getState().phase !== 'idle'

// One camera for every screen: fit the desk + shelves vertically, and if the window is too
// narrow to show the whole desk, let touch users pan sideways along a rail over the overflow.
// Wider windows keep the reference framing and simply see more of the alcove's side walls.
//
// The reference framing was tuned at 16:10. The bottom edge of the frame stays pinned just
// past the desk's front edge for every aspect ratio, so the floor never shows.

const EYE = new THREE.Vector3(0, 1.75, 0.22)
const REF = { aspect: 1.6, fov: 38, pitch: Math.atan2(1.75 - 1.0, 0.22 + 1.35) } // pitch: radians below horizontal
const PORTRAIT = { aspect: 0.46, fov: 46 } // tall phones see a bit more wall above the shelves
const LOOK_DISTANCE = 1.7
const EDGE_MARGIN = 0.02 // stop panning this far before the side walls (m)

// mouse: cursor at a screen edge moves the camera this far and tilts the look point this far (m)
const PARALLAX = { x: 0.06, y: 0.05, lookX: 0.03, lookY: 0.065 }
const SMOOTHING = 2.5 // damping rate for parallax; lower is softer

// touch: rail pan
const PAN = {
  overscroll: 0.35, // finger travel past the ends is scaled by this (rubber band)
  friction: 5, // inertia decay rate after release
  spring: 12, // how quickly an overscroll snaps back
  yaw: 0.035, // look point leads the pan direction by velocity × this (m per m/s)
  yawMax: 0.05,
  tilt: 0.06, // max vertical look offset while dragging (m), springs back on release
}

const deg = THREE.MathUtils.radToDeg
const rad = THREE.MathUtils.degToRad

function framing(aspect: number) {
  const bottom = REF.pitch + rad(REF.fov) / 2 // angle of the frame's bottom edge below horizontal
  const t = THREE.MathUtils.clamp((REF.aspect - aspect) / (REF.aspect - PORTRAIT.aspect), 0, 1)
  const fov = rad(THREE.MathUtils.lerp(REF.fov, PORTRAIT.fov, t))
  const pitch = bottom - fov / 2
  const hfov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
  const halfWidth = (EYE.z - WALL_Z) * Math.tan(hfov / 2) // widest visible half-width, at the back wall
  const panMax = Math.max(0, DESK.width / 2 - halfWidth - EDGE_MARGIN)
  return { fov: deg(fov), pitch, halfWidth, panMax }
}

export default function CameraRig() {
  const invalidate = useThree((s) => s.invalidate)
  const element = useThree((s) => s.gl.domElement)
  const { reducedMotion } = useDevice()

  const mouse = useRef({ x: 0, y: 0 })
  const pan = useRef({ x: 0, vel: 0, dragging: false, lastX: 0, lastT: 0, startY: 0, tilt: 0, max: 0, mPerPx: 0 })
  const smooth = useRef({ px: 0, py: 0, lx: 0, ly: 0, yaw: 0, tilt: 0 })
  const look = useMemo(() => new THREE.Vector3(), [])

  // mouse parallax (desktop only; touch input pans instead)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || busy()) return
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
      invalidate()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [invalidate])

  // touch rail pan
  useEffect(() => {
    const p = pan.current
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || busy()) return
      element.setPointerCapture(e.pointerId)
      Object.assign(p, { dragging: true, vel: 0, lastX: e.clientX, lastT: e.timeStamp, startY: e.clientY })
    }
    const move = (e: PointerEvent) => {
      if (!p.dragging) return
      let d = -(e.clientX - p.lastX) * p.mPerPx // content follows the finger
      if ((p.x > p.max && d > 0) || (p.x < -p.max && d < 0)) d *= PAN.overscroll
      p.x += d
      const dt = Math.max(1, e.timeStamp - p.lastT) / 1000
      p.vel = THREE.MathUtils.lerp(p.vel, d / dt, 0.4)
      p.tilt = THREE.MathUtils.clamp(((e.clientY - p.startY) / window.innerHeight) * 0.3, -PAN.tilt, PAN.tilt)
      p.lastX = e.clientX
      p.lastT = e.timeStamp
      invalidate()
    }
    const up = (e: PointerEvent) => {
      if (!p.dragging) return
      p.dragging = false
      // a finger resting before release means no fling
      if (e.timeStamp - p.lastT > 80) p.vel = 0
      invalidate()
    }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
    }
  }, [element, invalidate])

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const { width, height } = state.size
    const f = framing(width / height)
    if (Math.abs(camera.fov - f.fov) > 1e-3) {
      camera.fov = f.fov
      camera.updateProjectionMatrix()
    }

    const p = pan.current
    p.max = f.panMax
    p.mPerPx = (2 * f.halfWidth) / width
    if (busy()) p.dragging = false
    if (!p.dragging) {
      if (reducedMotion || busy()) p.vel = 0
      p.x += p.vel * dt
      p.vel *= Math.exp(-PAN.friction * dt)
      const edge = THREE.MathUtils.clamp(p.x, -p.max, p.max)
      if (edge !== p.x) {
        p.x = THREE.MathUtils.damp(p.x, edge, PAN.spring, dt)
        p.vel *= Math.exp(-PAN.spring * dt)
      }
      p.tilt = THREE.MathUtils.damp(p.tilt, 0, 8, dt)
    }

    const s = smooth.current
    const m = reducedMotion ? { x: 0, y: 0 } : mouse.current
    const damp = (from: number, to: number, rate = SMOOTHING) => THREE.MathUtils.damp(from, to, rate, dt)
    const goal = {
      px: m.x * PARALLAX.x,
      py: -m.y * PARALLAX.y,
      lx: m.x * PARALLAX.lookX,
      ly: -m.y * PARALLAX.lookY,
      yaw: reducedMotion ? 0 : THREE.MathUtils.clamp(p.vel * PAN.yaw, -PAN.yawMax, PAN.yawMax),
      tilt: reducedMotion ? 0 : -p.tilt,
    }
    s.px = damp(s.px, goal.px)
    s.py = damp(s.py, goal.py)
    s.lx = damp(s.lx, goal.lx)
    s.ly = damp(s.ly, goal.ly)
    s.yaw = damp(s.yaw, goal.yaw, 6)
    s.tilt = damp(s.tilt, goal.tilt, 10)

    camera.position.set(EYE.x + p.x + s.px, EYE.y + s.py, EYE.z)
    look.set(
      EYE.x + p.x + s.lx + s.yaw,
      EYE.y - Math.sin(f.pitch) * LOOK_DISTANCE + s.ly + s.tilt,
      EYE.z - Math.cos(f.pitch) * LOOK_DISTANCE,
    )
    camera.lookAt(look)

    // frameloop is "demand": keep rendering only while something is still moving
    const settling =
      Math.abs(s.px - goal.px) + Math.abs(s.py - goal.py) + Math.abs(s.lx - goal.lx) +
      Math.abs(s.ly - goal.ly) + Math.abs(s.yaw - goal.yaw) + Math.abs(s.tilt - goal.tilt) +
      Math.abs(p.vel) + Math.abs(p.x - THREE.MathUtils.clamp(p.x, -p.max, p.max)) + Math.abs(p.tilt)
    if (settling > 1e-4) invalidate()
  })

  return null
}
