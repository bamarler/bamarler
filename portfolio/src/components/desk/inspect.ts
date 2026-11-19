import * as THREE from 'three'
import { create } from 'zustand'

// Pick-up-and-inspect state, shared by the 3D scene and the DOM (keyboard proxies).
//
//   idle → lifting → inspecting → returning → idle
//
// `pick` and `putDown` only request a phase; the active <Pickable> advances lifting →
// inspecting and returning → idle when its animation finishes.

export type Phase = 'idle' | 'lifting' | 'inspecting' | 'returning'

export type PickableInfo = {
  /** short name, used for the keyboard button ("pick up the mug") */
  label: string
  /** whether a double-click / double-tap turns it around */
  flip: boolean
  /** opens into a reader once held, instead of being turned over (the dossier) */
  opens: boolean
}

type InspectStore = {
  phase: Phase
  active: string | null
  hovered: string | null
  items: Record<string, PickableInfo>
  register: (id: string, info: PickableInfo) => void
  unregister: (id: string) => void
  setHovered: (id: string | null) => void
  pick: (id: string) => void
  putDown: () => void
  settle: (phase: 'inspecting' | 'idle') => void
}

export const useInspect = create<InspectStore>((set, get) => ({
  phase: 'idle',
  active: null,
  hovered: null,
  items: {},
  register: (id, info) => set((s) => ({ items: { ...s.items, [id]: info } })),
  unregister: (id) =>
    set((s) => {
      const items = { ...s.items }
      delete items[id]
      return { items }
    }),
  setHovered: (hovered) => set({ hovered }),
  pick: (id) => {
    if (get().phase !== 'idle') return
    resetMotion()
    set({ phase: 'lifting', active: id, hovered: null })
  },
  putDown: () => {
    const { phase } = get()
    if (phase === 'lifting' || phase === 'inspecting') set({ phase: 'returning' })
  },
  settle: (phase) => set(phase === 'idle' ? { phase, active: null } : { phase }),
}))

/**
 * How the held object is turned and how close it is, in camera space. Written by the
 * inspector's input handlers every frame, read by the active <Pickable>. Not React state.
 */
export const motion = {
  /** current spin, eased toward `spinGoal` */
  spin: new THREE.Quaternion(),
  spinGoal: new THREE.Quaternion(),
  /** angular velocity from a drag, radians per second around screen x / y */
  vel: new THREE.Vector2(),
  /** multiplier on the object's inspect distance (zoom) */
  zoom: 1,
  zoomGoal: 1,
}

function resetMotion() {
  motion.spin.identity()
  motion.spinGoal.identity()
  motion.vel.set(0, 0)
  motion.zoom = motion.zoomGoal = 1
}

const AXIS_X = new THREE.Vector3(1, 0, 0)
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const turn = new THREE.Quaternion()

/** Turns the held object around the screen's axes (camera space). */
export function rotateGoal(aroundY: number, aroundX: number) {
  motion.spinGoal.premultiply(turn.setFromAxisAngle(AXIS_Y, aroundY))
  motion.spinGoal.premultiply(turn.setFromAxisAngle(AXIS_X, aroundX))
}

export const ZOOM = { min: 0.65, max: 1.6 }

export function zoomBy(factor: number) {
  motion.zoomGoal = THREE.MathUtils.clamp(motion.zoomGoal * factor, ZOOM.min, ZOOM.max)
}

/** Draw order for the backdrop scrim and the held object drawn over it. */
export const SCRIM_ORDER = 10
export const HELD_ORDER = 11

/** The animated group of every pickable, so the inspector can raycast the held one. */
export const held = new Map<string, THREE.Object3D>()
