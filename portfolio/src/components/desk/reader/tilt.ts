import { useSyncExternalStore } from 'react'

// Each photo is stuck down at its own angle, up to MAX_TILT either way. The angle is picked
// the first time a photo is seen and kept for the browser session, so turning back to a
// page finds its photos just as they were.

export const MAX_TILT = 8 // degrees
// versioned so angles picked under an older, larger MAX_TILT aren't reused
const KEY = 'desk-tilt-8:'
const picked = new Map<string, number>()

/** a fixed angle from the photo's name, for when session storage isn't available */
function fallback(src: string) {
  let h = 0
  for (const ch of src) h = (h * 31 + ch.charCodeAt(0)) | 0
  return ((Math.abs(h) % 2001) / 1000 - 1) * MAX_TILT
}

function tiltFor(src: string) {
  let t = picked.get(src)
  if (t !== undefined) return t
  try {
    const saved = sessionStorage.getItem(KEY + src)
    t = saved === null ? Math.round((Math.random() * 2 - 1) * MAX_TILT * 10) / 10 : Number(saved)
    if (saved === null) sessionStorage.setItem(KEY + src, String(t))
  } catch {
    t = fallback(src)
  }
  picked.set(src, t)
  return t
}

const subscribe = () => () => {}

/** this photo's angle in degrees (0 while server rendering) */
export function useTilt(src: string) {
  return useSyncExternalStore(
    subscribe,
    () => tiltFor(src),
    () => 0,
  )
}
