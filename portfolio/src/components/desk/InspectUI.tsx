'use client'

import { useEffect, useRef } from 'react'
import { useInspect } from './inspect'

// The DOM side of picking things up: one hidden button per pickable for keyboards and
// screen readers (it shows as a little label only while focused), a "put it back" button
// while something is held.

const FOCUS_LABEL =
  'sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 ' +
  'focus-visible:-rotate-2 focus-visible:bg-[#f6e27a] focus-visible:px-3 focus-visible:py-2 ' +
  'focus-visible:text-[#1d1b18] focus-visible:shadow-lg focus-visible:outline-none ' +
  'font-[family-name:var(--font-marker)]'

export default function InspectUI() {
  const items = useInspect((s) => s.items)
  const phase = useInspect((s) => s.phase)
  const active = useInspect((s) => s.active)
  const { pick, putDown, setHovered } = useInspect.getState()

  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const putBack = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<string | null>(null)
  const holding = phase === 'lifting' || phase === 'inspecting'
  const info = active ? items[active] : undefined

  // keyboard users follow the object: into the "put back" button, then back to where they were
  useEffect(() => {
    if (holding && active && document.activeElement === buttons.current.get(active)) {
      returnTo.current = active
      putBack.current?.focus()
    }
    if (phase === 'idle' && returnTo.current) {
      buttons.current.get(returnTo.current)?.focus()
      returnTo.current = null
    }
  }, [holding, phase, active])

  return (
    <>
      {Object.entries(items).map(([id, item]) => (
        <button
          key={id}
          type="button"
          ref={(el) => {
            if (el) buttons.current.set(id, el)
            else buttons.current.delete(id)
          }}
          className={FOCUS_LABEL}
          tabIndex={phase === 'idle' ? 0 : -1}
          onFocus={() => setHovered(id)}
          onBlur={() => useInspect.getState().hovered === id && setHovered(null)}
          onClick={() => pick(id)}
        >
          pick up the {item.label}
        </button>
      ))}

      {holding && info && (
        <button ref={putBack} type="button" className={FOCUS_LABEL} onClick={putDown}>
          put the {info.label} back (esc) · arrows turn it
        </button>
      )}

    </>
  )
}
