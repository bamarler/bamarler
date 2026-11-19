'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { Folder, Sheet } from '@/lib/desk/dossier'
import { useInspect } from '../inspect'
import Page from './Page'
import { CARD, FOLDER_LABEL, SCOTCH, SHEET } from './paper'
import Tabs from './Tabs'
import { maxTurned, paginate, turnedFor, type Section } from './paginate'

// The open dossier. Once the folder on the desk has been lifted up to the camera, this
// DOM layer takes over: real text on paper, so it stays sharp, selectable and readable by
// screen readers. Turn pages with the folded corners, the divider tabs, the contents card,
// a swipe, or the arrow keys; click outside the folder (or Esc) to put it back. On a wide
// screen the folder lies open on a two-page spread; on a phone it shows one page.

const ID = 'dossier'
const SWIPE = 50 // px
const MARGIN = 32
const TABS = 44 // room for the divider tabs
const LETTER = 8.5 / 11

const viewport = {
  subscribe(on: () => void) {
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  },
  get: () => `${window.innerWidth}x${window.innerHeight}`,
  server: () => '1280x800',
}

/** sheet size in px, and whether the folder fits open as a two-page spread */
function useLayout() {
  const [w, h] = useSyncExternalStore(viewport.subscribe, viewport.get, viewport.server).split('x').map(Number)
  // phones get a sheet taller than letter size, so more fits before scrolling
  if (w < 640) return { W: w - 2 * MARGIN, H: Math.round(h * 0.8), spread: false }
  const fit = (width: number) => Math.min(h * 0.88 * LETTER, width)
  const single = fit(w - 2 * MARGIN - TABS)
  const open = fit((w - 2 * MARGIN - TABS) / 2)
  const W = Math.round(open >= single * 0.85 ? open : single)
  return { W, H: Math.round(W / LETTER), spread: open >= single * 0.85 }
}

// shown only when the database sent no pages: an error state, not content
const EMPTY: Sheet[] = [
  {
    id: 'empty',
    kind: 'freeform',
    header: '',
    title: 'This file is empty',
    body: "The records office didn't answer. Try again in a minute.",
    photo: null,
  },
]

export default function Reader({ sheets: given, folder }: { sheets: Sheet[]; folder: Folder }) {
  const sheets = given.length ? given : EMPTY
  const open = useInspect((s) => s.active === ID && s.phase === 'inspecting')
  const { W, H, spread } = useLayout()
  const leaves = useMemo(() => paginate(sheets, spread), [sheets, spread])
  // remember which sheet is open rather than a leaf count, so a resize that pairs or
  // unpairs the pages keeps the same sheet in front of you
  const [at, setAt] = useState<string | null>(null)
  const [seen, setSeen] = useState(false) // mount the leaves (and load photos) on first open
  const swipe = useRef<{ x: number; y: number } | null>(null)

  if (open && !seen) setSeen(true)

  const turned = at ? turnedFor(leaves, at) : 0
  const last = maxTurned(leaves)
  const go = (to: number) => {
    const t = Math.max(0, Math.min(last, to))
    setAt(leaves[t]?.front.sheet.id ?? leaves[t - 1].back!.sheet.id)
  }

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      const to = { ArrowRight: turned + 1, PageDown: turned + 1, ArrowLeft: turned - 1, PageUp: turned - 1, Home: 0, End: last }[e.key]
      if (to === undefined) return
      e.preventDefault()
      const t = Math.max(0, Math.min(last, to))
      setAt(leaves[t]?.front.sheet.id ?? leaves[t - 1].back!.sheet.id)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, turned, last, leaves])

  const onDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: ReactPointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > 1.5 * Math.abs(e.clientY - start.y)) go(turned + (dx < 0 ? 1 : -1))
  }

  if (!seen) return null

  const sections = leaves.flatMap((l) => l.tabs)
  // what lies face up: the back of the last turned leaf, and the front of the next
  const leftPage = spread ? (leaves[turned - 1]?.back ?? null) : null
  const rightPage = leaves[turned]?.front ?? null

  return (
    <div
      role="dialog"
      aria-modal={open}
      aria-label="Dossier"
      aria-hidden={!open}
      className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={() => useInspect.getState().putDown()}
    >
      <svg aria-hidden className="absolute h-0 w-0">
        <filter id="ink">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.9" />
        </filter>
      </svg>

      <div
        className={`relative transition-transform duration-500 ease-out ${open ? 'scale-100' : 'scale-[0.97]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <FolderCard W={W} H={H} spread={spread} />

        <div
          className="relative isolate touch-pan-y"
          style={{ width: spread ? 2 * W : W, height: H }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          <Tabs sections={sections} turned={turned} right={spread ? 2 * W : W} left={spread ? 0 : null} H={H} onGo={go} />
          {spread &&
            (leftPage ? (
              <>
                <Edges count={Math.min(3, turned - 1)} left={0} W={W} H={H} toLeft />
                <Page key={leftPage.sheet.id} page={leftPage} W={W} H={H} side="left" turn={{ label: 'Previous page', onClick: () => go(turned - 1) }} />
              </>
            ) : (
              <IndexCard W={W} title={folder.contents} sections={sections} onGo={go} />
            ))}
          {rightPage && (
            <>
              <Edges count={Math.min(3, leaves.length - 1 - turned)} left={spread ? W : 0} W={W} H={H} />
              <Page
                key={rightPage.sheet.id}
                page={rightPage}
                W={W}
                H={H}
                side="right"
                turn={turned < last ? { label: 'Next page', onClick: () => go(turned + 1) } : undefined}
              />
            </>
          )}
          {/* on a phone there's no left page, so the way back sits on the left of this one */}
          {!spread && turned > 0 && (
            <button
              type="button"
              aria-label="Previous page"
              title="Previous page"
              onClick={() => go(turned - 1)}
              className="absolute bottom-0 left-0 z-10 flex size-12 items-end justify-start p-2 text-[#2a2520]/55 hover:text-[#a3322a]"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-5 -scale-x-100">
                <path d="M4 15c3-6 9-8 15-6M15 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** the edges of the leaves underneath, so the stack has some thickness */
function Edges({ count, left, W, H, toLeft = false }: { count: number; left: number; W: number; H: number; toLeft?: boolean }) {
  return Array.from({ length: Math.max(0, count) }, (_, k) => (
    <div
      key={k}
      aria-hidden
      className="absolute rounded-[2px] shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
      style={{
        left: left + (toLeft ? -1 : 1) * (k + 1) * 0.6,
        top: (k + 1) * 1.4,
        width: W,
        height: H,
        zIndex: -1 - k,
        backgroundImage: `url(${SHEET})`,
        backgroundSize: '100% 100%',
        filter: 'brightness(0.94)',
      }}
    />
  ))
}

/** The manila folder, lying open: its back cover (with the name tab) under the leaves on
 *  the right, the inside of its front cover on the left. */
function FolderCard({ W, H, spread }: { W: number; H: number; spread: boolean }) {
  const pad = Math.round(0.035 * W)
  const tab = { width: 0.34 * W, height: Math.max(18, 0.045 * H) }
  const card = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    backgroundColor: '#e9d8aa',
    backgroundImage: `url(${CARD})`,
    backgroundSize: '512px',
    // worn, slightly darker edges, as card gets from handling
    boxShadow: 'inset 0 0 10px rgba(120,80,20,0.28), inset 0 0 2px rgba(90,60,15,0.4), 0 18px 50px rgba(0,0,0,0.5)',
    ...extra,
  })
  const back = spread ? W : 0
  return (
    <div aria-hidden className="absolute inset-0">
      {/* back cover, and its tab */}
      <div style={card({ left: back - (spread ? 0 : pad), top: -pad, width: W + pad * (spread ? 1 : 2), height: H + 2 * pad, borderRadius: spread ? '0 6px 6px 0' : 6 })}>
        {/* score lines by the spine */}
        {spread && (
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: pad * 1.6, background: 'linear-gradient(to right, rgba(80,55,15,0.3), rgba(80,55,15,0) 30%, rgba(80,55,15,0.16) 45%, rgba(255,240,205,0.2) 52%, rgba(80,55,15,0) 70%)' }}
          />
        )}
      </div>
      <div
        className="flex items-center justify-center"
        style={card({
          left: back + W * 0.5,
          top: -pad - tab.height + 2,
          width: tab.width,
          height: tab.height,
          borderRadius: '6px 6px 0 0',
          boxShadow: 'inset 0 2px 6px rgba(120,80,20,0.25), 0 -2px 8px rgba(0,0,0,0.25)',
        })}
      >
        <span
          className="rounded-[2px] bg-[#f6f2e7] px-2 py-[2px] font-[family-name:var(--font-typewriter)] leading-none text-[#2a2520] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.2)]"
          style={{ fontSize: Math.max(10, tab.height * 0.42) }}
        >
          {FOLDER_LABEL}
        </span>
      </div>
      {/* inside of the front cover, cut a little lower since the tab is on the back */}
      {spread && (
        <div style={card({ left: -pad, top: -pad + tab.height * 0.3, width: W + pad, height: H + 2 * pad - tab.height * 0.3, borderRadius: '6px 0 0 6px' })}>
          <div
            className="absolute inset-y-0 right-0"
            style={{ width: pad * 1.6, background: 'linear-gradient(to left, rgba(80,55,15,0.34), rgba(80,55,15,0) 35%, rgba(80,55,15,0.14) 50%, rgba(80,55,15,0) 70%)' }}
          />
        </div>
      )}
    </div>
  )
}

/** A lined index card taped inside the front cover: the file's contents. */
function IndexCard({ W, title, sections, onGo }: { W: number; title: string; sections: Section[]; onGo: (to: number) => void }) {
  const lines = 'repeating-linear-gradient(to bottom, transparent 0, transparent calc(2.4em - 1px), rgba(70,110,170,0.35) calc(2.4em - 1px), rgba(70,110,170,0.35) 2.4em)'
  return (
    <div
      className="absolute font-[family-name:var(--font-type)] text-[#2a2520] shadow-[0_2px_4px_rgba(0,0,0,0.22),0_6px_16px_rgba(0,0,0,0.12)]"
      style={{
        left: W * 0.12,
        top: W * 0.32,
        width: W * 0.76,
        aspectRatio: '5 / 3',
        rotate: '-1.6deg',
        fontSize: Math.max(11, W * 0.026),
        backgroundColor: '#fbf9f1',
        backgroundImage: `linear-gradient(to bottom, transparent 3.4em, rgba(190,60,60,0.5) 3.4em, rgba(190,60,60,0.5) calc(3.4em + 1px), transparent calc(3.4em + 1px)), ${lines}`,
        backgroundPosition: '0 0, 0 3.4em',
        backgroundSize: '100% 100%, 100% 100%',
        padding: '0.9em 1.4em',
      }}
    >
      <span
        aria-hidden
        className="absolute -top-[0.8em] left-1/2 h-[1.7em] w-[6.5em] -translate-x-1/2 rotate-[3deg]"
        style={SCOTCH}
      />
      <p className="min-h-[2.4em] font-[family-name:var(--font-typewriter)] text-[1.15em] leading-[2.4em] tracking-[0.2em] uppercase">{title}</p>
      <ol className="mt-[0.15em]">
        {sections.map((s) => (
          <li key={s.page}>
            <button type="button" onClick={() => onGo(s.turned)} className="flex w-full items-baseline gap-2 text-left leading-[2.4em] hover:text-[#a3322a]">
              <span className="capitalize">{s.label}</span>
              <span aria-hidden className="flex-1 border-b border-dotted border-[#2a2520]/40" />
              <span>{s.page}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
