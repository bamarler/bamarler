'use client'

import { useSyncExternalStore } from 'react'

// Live media-query state for the desk: touch screens, portrait windows and reduced motion.
const QUERIES = {
  touch: '(pointer: coarse)',
  portrait: '(orientation: portrait)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const

type Device = { [K in keyof typeof QUERIES]: boolean }

const SERVER: Device = { touch: false, portrait: false, reducedMotion: false }
let cached: Device = SERVER

function read(): Device {
  const next = Object.fromEntries(
    Object.entries(QUERIES).map(([k, q]) => [k, window.matchMedia(q).matches]),
  ) as Device
  // keep the same object while nothing changed, as useSyncExternalStore requires
  if (Object.keys(next).some((k) => next[k as keyof Device] !== cached[k as keyof Device])) cached = next
  return cached
}

function subscribe(onChange: () => void) {
  const lists = Object.values(QUERIES).map((q) => window.matchMedia(q))
  lists.forEach((l) => l.addEventListener('change', onChange))
  return () => lists.forEach((l) => l.removeEventListener('change', onChange))
}

export function useDevice(): Device {
  return useSyncExternalStore(subscribe, read, () => SERVER)
}
