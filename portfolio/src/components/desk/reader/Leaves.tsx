'use client'

import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { CARD, SHEET, TAB_COLORS, tabMetrics } from './paper'
import SheetBody from './SheetBody'
import { clamp, corner, css, ease, fold, mul, type Mat, type Side, type Vec } from './fold'
import type { LeafData, Page } from './paginate'

// The leaves of paper in the open folder. Each is a real fold (see fold.ts): its free
// corner rests a little bent, bends further under the pointer, and the leaf turns over
// when the corner is clicked or dragged across. Divider tabs stick out of the leaves that
// start a section and turn with them.
//
// Not used at the moment: the reader shows flat pages (Page.tsx) until the turn works in
// Safari, where the turned-over faces didn't draw. Kept to bring the animation back.
//
// Kept cheap on purpose: animation runs outside React (one rAF loop writing transforms),
// a leaf only becomes a GPU layer while it moves, and leaves away from the open spread
// aren't rendered at all (display: none), so their photos aren't even fetched.

const CURL = { x: 0.05, y: 0.035 } // resting bend of a top corner, as a fraction of the width
const HOVER = { x: 0.2, y: 0.13 }
const TURN_MS = 820
const RIFFLE_MS = 560 // per leaf when a tab turns several at once
const RIFFLE_GAP = 85
const LIFT = 0.16 // how high the corner rises on its way over, as a fraction of the height
const FOLLOW = 26 // how tightly a dragged corner follows the pointer
const SETTLE = 16
const TAP = 6 // px of movement before a press on a corner counts as a drag
const ZONE = 0.17 // corner hit area, as a fraction of the width

type Anim = { start: number; dur: number; from: Vec | null; to: Vec; switches: boolean }
type Leaf = {
  side: Side
  P: Vec
  anim: Anim | null
  hover: boolean
  drag: Vec | null
  drawn: { x: number; y: number; z: number; shown: boolean; moving: boolean; side: Side | null } // last written to the DOM
}

type Parts = {
  root: HTMLElement
  underBox: HTMLElement
  under: HTMLElement
  clip: HTMLElement
  front: HTMLElement
  back: HTMLElement
  frontShade: HTMLElement
  backShade: HTMLElement
  tabs: HTMLElement[]
}

type Props = {
  leaves: LeafData[]
  turned: number
  W: number
  H: number
  spread: boolean
  reducedMotion: boolean
  onTurn: (turned: number) => void
}

export default function Leaves({ leaves: data, turned, W, H, spread, reducedMotion, onTurn }: Props) {
  const N = data.length
  const S = 3 * Math.max(W, H) // clip box size; anything bigger than the open folder
  const sections = data.flatMap((l) => l.tabs).map((s, k) => ({ ...s, k }))
  const tabs = tabMetrics(H, sections.length)
  const last = data.at(-1)?.back ? N : N - 1

  const leaves = useRef<Leaf[]>([])
  const parts = useRef<(Parts | null)[]>([])
  const strip = useRef<(HTMLElement | null)[]>([])
  const live = useRef({ turned, W, H, S, spread, N, depth: tabs.depth, sections })
  const raf = useRef(0)
  const lastT = useRef(0)
  const press = useRef<{ x: number; y: number; leaf: number; dragging: boolean } | null>(null)
  const swallowClick = useRef(false)
  const layer = useRef<HTMLDivElement>(null)

  /** where a leaf's corner wants to be when nothing is moving it */
  const restOf = (i: number, L: Leaf): Vec => {
    const { turned, W, H, spread } = live.current
    const C = corner(L.side, W, H)
    const top = L.side === 'right' ? i === turned : spread && i === turned - 1
    if (!top) return C
    const off = L.hover ? HOVER : CURL
    return { x: C.x + (L.side === 'right' ? -off.x : off.x) * W, y: C.y - off.y * W }
  }

  const draw = (i: number, L: Leaf, force = false) => {
    const el = parts.current[i]
    if (!el) return
    const { turned, W, H, S, spread, N, depth, sections } = live.current
    const moving = !!L.anim || !!L.drag
    const z = moving ? (L.P.x > 0 ? 2 * N + (N - i) : 3 * N + i) : L.side === 'right' ? N - i : i + 1
    const near = L.side === 'right' ? i - turned >= 0 && i - turned <= 1 : spread && turned - 1 - i >= 0 && turned - 1 - i <= 1
    const shown = moving || near
    const d = L.drawn
    if (!force && d.x === L.P.x && d.y === L.P.y && d.z === z && d.shown === shown && d.moving === moving && d.side === L.side) return

    if (shown !== d.shown || force) el.root.style.display = shown ? '' : 'none'
    if (moving !== d.moving || force) {
      // a GPU layer only while it moves; a resting leaf is painted once like any element
      for (const e of [el.clip, el.front, el.back, el.under, el.frontShade, el.backShade]) e.style.willChange = moving ? 'transform' : ''
      // while it moves, the leaf carries its own tab; at rest the one in the strip shows
      for (const t of el.tabs) t.style.visibility = moving ? 'visible' : 'hidden'
    }
    if (z !== d.z || force) el.root.style.zIndex = String(z)
    const mine = spread ? sections.filter((s) => s.leaf === i).map((s) => strip.current[s.k]) : []
    if (L.side !== d.side || force) {
      el.underBox.style.left = `${L.side === 'right' ? 0 : -W}px`
      el.front.style.zIndex = L.side === 'right' ? '1' : '2'
      el.back.style.zIndex = L.side === 'right' ? '2' : '1'
      for (const tab of mine) {
        if (!tab) continue
        const left = L.side === 'left'
        tab.style.left = `${left ? -W - depth : W}px`
        tab.style.setProperty('--flip', left ? '-1' : '1')
      }
    }
    if (moving !== d.moving || force) for (const tab of mine) if (tab) tab.style.visibility = moving ? 'hidden' : 'visible'
    if (shown) {
      const f = fold(L.side, clamp(L.P, W, H), W, H, S)
      const underX: Mat = [1, 0, 0, 1, L.side === 'right' ? 0 : W, 0]
      el.clip.style.transform = css(f.clip)
      el.front.style.transform = css(L.side === 'right' ? f.base : f.flap)
      el.back.style.transform = css(L.side === 'right' ? f.flap : f.base)
      el.under.style.transform = css(mul(underX, f.under))
      const shade = css(f.flapShade)
      el.frontShade.style.transform = shade
      el.backShade.style.transform = shade
      el.frontShade.style.visibility = L.side === 'left' && !f.flat ? 'visible' : 'hidden'
      el.backShade.style.visibility = L.side === 'right' && !f.flat ? 'visible' : 'hidden'
      // the face folded under is hidden while flat, so its shadow can't show past the edge
      ;(L.side === 'right' ? el.back : el.front).style.visibility = f.flat ? 'hidden' : 'visible'
      ;(L.side === 'right' ? el.front : el.back).style.visibility = 'visible'
    }
    L.drawn = { x: L.P.x, y: L.P.y, z, shown, moving, side: L.side }
  }

  const step = (now: number) => {
    const dt = Math.min(0.05, (now - lastT.current) / 1000)
    lastT.current = now
    const { W, H } = live.current
    let busy = false
    leaves.current.forEach((L, i) => {
      if (L.anim) {
        const a = L.anim
        busy = true
        if (now >= a.start) {
          a.from ??= { ...L.P }
          const k = a.dur ? Math.min(1, (now - a.start) / a.dur) : 1
          const e = ease(k)
          const span = Math.abs(a.to.x - a.from.x) / (2 * W)
          L.P = {
            x: a.from.x + (a.to.x - a.from.x) * e,
            y: a.from.y + (a.to.y - a.from.y) * e - Math.sin(Math.PI * e) * LIFT * H * span,
          }
          if (k >= 1) {
            if (a.switches) L.side = L.side === 'right' ? 'left' : 'right'
            L.P = a.switches ? corner(L.side, W, H) : a.to
            L.anim = null
          }
        }
      } else {
        const goal = L.drag ? clamp(L.drag, W, H) : restOf(i, L)
        const blend = 1 - Math.exp(-(L.drag ? FOLLOW : SETTLE) * dt)
        const dx = goal.x - L.P.x
        const dy = goal.y - L.P.y
        if (Math.abs(dx) + Math.abs(dy) < 0.1) L.P = goal
        else {
          L.P = { x: L.P.x + dx * blend, y: L.P.y + dy * blend }
          busy = true
        }
        if (L.drag) busy = true
      }
      draw(i, L)
    })
    if (busy) raf.current = requestAnimationFrame(step)
    else {
      raf.current = 0
      // settled: write everything once more, so nothing can be left half-drawn
      leaves.current.forEach((L, i) => draw(i, L, true))
    }
  }

  const kick = () => {
    if (raf.current) return
    lastT.current = performance.now()
    raf.current = requestAnimationFrame(step)
  }

  // (re)build the leaves when the content or the layout changes
  useLayoutEffect(() => {
    live.current = { turned, W, H, S, spread, N, depth: tabs.depth, sections }
    leaves.current = data.map((_, i) => {
      const side: Side = i < turned ? 'left' : 'right'
      const L: Leaf = {
        side,
        P: corner(side, W, H),
        anim: null,
        hover: false,
        drag: null,
        drawn: { x: NaN, y: NaN, z: -1, shown: false, moving: false, side: null },
      }
      L.P = restOf(i, L)
      return L
    })
    leaves.current.forEach((L, i) => draw(i, L, true))
    // turns are handled below; this only runs for new content or a new size
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, W, H, spread])

  // turn whatever leaves lie on the wrong side
  useEffect(() => {
    live.current = { ...live.current, turned }
    const now = performance.now()
    const forward: number[] = []
    const backward: number[] = []
    leaves.current.forEach((L, i) => {
      const want: Side = i < turned ? 'left' : 'right'
      const heading = L.anim?.switches ? (L.side === 'right' ? 'left' : 'right') : L.side
      if (heading === want) return
      if (L.anim?.switches) {
        // sent back mid-flight: fall back to where it came from
        L.anim = { start: now, dur: TURN_MS * 0.6, from: null, to: corner(L.side, W, H), switches: false }
      } else (want === 'left' ? forward : backward).push(i)
    })
    backward.reverse()
    for (const list of [forward, backward]) {
      const many = list.length > 1
      list.forEach((i, k) => {
        const L = leaves.current[i]
        L.drag = null
        L.hover = false
        L.anim = {
          start: now + (reducedMotion ? 0 : k * RIFFLE_GAP),
          dur: reducedMotion ? 0 : many ? RIFFLE_MS : TURN_MS,
          from: null,
          to: corner(L.side === 'right' ? 'left' : 'right', W, H),
          switches: true,
        }
      })
    }
    kick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turned])

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    },
    [],
  )

  // corners: hover bends one, a click turns it, a drag carries it across
  const toWorld = (e: { clientX: number; clientY: number }): Vec => {
    const r = layer.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const bend = (leaf: number, on: boolean) => {
    const L = leaves.current[leaf]
    if (!L) return
    L.hover = on
    kick()
  }
  const down = (leaf: number) => (e: ReactPointerEvent) => {
    e.stopPropagation() // not a swipe
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current = { x: e.clientX, y: e.clientY, leaf, dragging: false }
  }
  const move = (e: ReactPointerEvent) => {
    const p = press.current
    if (!p) return
    if (!p.dragging && Math.hypot(e.clientX - p.x, e.clientY - p.y) < TAP) return
    p.dragging = true
    const L = leaves.current[p.leaf]
    if (L.anim) return
    L.drag = toWorld(e)
    kick()
  }
  const up = (e: ReactPointerEvent) => {
    e.stopPropagation()
    const p = press.current
    press.current = null
    if (!p?.dragging) return
    swallowClick.current = true
    const L = leaves.current[p.leaf]
    const at = L.drag
    L.drag = null
    // let go past the middle of the sheet and it carries on over
    if (at && (L.side === 'right' ? at.x < W * 0.5 : at.x > -W * 0.5)) onTurn(L.side === 'right' ? p.leaf + 1 : p.leaf)
    kick()
  }
  const click = (to: number) => () => {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    onTurn(to)
  }
  const cornerButton = (leaf: number, to: number, x: number, label: string) => (
    <button
      type="button"
      aria-label={label}
      className="absolute touch-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3322a]"
      style={{ left: x, top: H - ZONE * W, width: ZONE * W, height: ZONE * W, zIndex: 5 * N }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && bend(leaf, true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && bend(leaf, false)}
      onFocus={() => bend(leaf, true)}
      onBlur={() => bend(leaf, false)}
      onPointerDown={down(leaf)}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (press.current = null)}
      onClick={click(to)}
    />
  )

  // the section open in front of you
  const current = sections.filter((s) => s.turned <= turned).at(-1)

  return (
    <div
      ref={layer}
      className="absolute top-0"
      style={{
        left: spread ? W : 0,
        width: 0,
        height: H,
        // alone on a phone, a leaf disappears past the spine as it turns
        clipPath: spread ? undefined : `inset(-${H}px -${H}px -${H}px 0)`,
      }}
    >
      {/* the divider tabs; under the leaves, so a turning leaf passes over them */}
      <nav aria-label="Sections">
        {sections.map((s) => (
          <button
            key={s.k}
            ref={(el) => {
              strip.current[s.k] = el
            }}
            type="button"
            onClick={() => onTurn(s.turned)}
            aria-current={current?.k === s.k ? 'true' : undefined}
            className="group absolute rounded-[5px] focus-visible:outline-2 focus-visible:outline-[#a3322a]"
            style={{ left: W, top: tabs.top(s.k) }}
          >
            <Tab label={s.label} k={s.k} metrics={tabs} active={current?.k === s.k} />
          </button>
        ))}
      </nav>

      {data.map((leaf, i) => {
        const tab = (mirror: boolean) =>
          spread &&
          sections
            .filter((s) => s.leaf === i)
            .map((s) => (
              <div key={s.k} data-tab aria-hidden className="absolute" style={{ left: W, top: tabs.top(s.k), visibility: 'hidden' }}>
                <Tab label={s.label} k={s.k} metrics={tabs} mirror={mirror} />
              </div>
            ))
        return (
          <div
            key={leaf.id}
            ref={(root) => {
              parts.current[i] = root && {
                root,
                underBox: root.querySelector('[data-part=under-box]')!,
                under: root.querySelector('[data-part=under]')!,
                clip: root.querySelector('[data-part=clip]')!,
                front: root.querySelector('[data-part=front]')!,
                back: root.querySelector('[data-part=back]')!,
                frontShade: root.querySelector('[data-part=front-shade]')!,
                backShade: root.querySelector('[data-part=back-shade]')!,
                tabs: [...root.querySelectorAll<HTMLElement>('[data-tab]')],
              }
            }}
            className="absolute top-0 left-0"
            style={{ display: 'none' }}
          >
            {/* the shadow a lifted leaf throws on the one beneath */}
            <div data-part="under-box" className="pointer-events-none absolute top-0 overflow-hidden" style={{ width: W, height: H }}>
              <div
                data-part="under"
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  width: 0.28 * W,
                  height: 2 * Math.hypot(W, H),
                  background: 'linear-gradient(to right, rgba(30,20,5,0.32), rgba(30,20,5,0.1) 35%, rgba(30,20,5,0))',
                }}
              />
            </div>

            <div data-part="clip" className="pointer-events-none absolute top-0 left-0 origin-top-left overflow-hidden" style={{ width: S, height: 2 * S }}>
              <Face part="front" page={leaf.front} active={i === turned} W={W} H={H}>
                {tab(false)}
              </Face>
              <Face part="back" page={leaf.back} active={spread && i === turned - 1} W={W} H={H} back>
                {tab(true)}
              </Face>
            </div>
          </div>
        )
      })}

      {turned < last && cornerButton(turned, turned + 1, W - ZONE * W, 'Next page')}
      {turned > 0 && cornerButton(turned - 1, turned - 1, spread ? -W : 0, 'Previous page')}
    </div>
  )
}

/** One side of a leaf. A back is typed mirror-wise in its own frame, so it reads the right
 *  way round once the leaf lies turned over on the left. */
function Face({
  part,
  page,
  active,
  W,
  H,
  back = false,
  children,
}: {
  part: 'front' | 'back'
  page: Page | null
  active: boolean
  W: number
  H: number
  back?: boolean
  children?: ReactNode
}) {
  return (
    <article
      data-part={part}
      aria-hidden={!active}
      inert={!active}
      className="pointer-events-auto absolute top-0 left-0 origin-top-left"
      style={{ width: W, height: H }}
    >
      {children}
      <div
        className="@container absolute inset-0 overflow-hidden rounded-[2px] font-[family-name:var(--font-type)] text-[#2a2520] shadow-[0_1px_2px_rgba(0,0,0,0.25),0_4px_14px_rgba(0,0,0,0.14)]"
        style={{ backgroundImage: `url(${SHEET})`, backgroundSize: '100% 100%', transform: back ? 'scaleX(-1)' : undefined }}
      >
        {page && (
          <>
            <div className="absolute inset-x-0 top-0 bottom-[9cqw] touch-pan-y overflow-y-auto overscroll-contain px-[8cqw] pt-[7cqw] pb-[3cqw] text-[max(13px,2.75cqw)] leading-[1.55] [scrollbar-width:none] [text-shadow:0_0_0.6px_rgba(42,37,32,0.4)]">
              <SheetBody sheet={page.sheet} />
            </div>
            <p aria-hidden className="absolute inset-x-0 bottom-[3.5cqw] text-center text-[max(10px,2cqw)] text-[#2a2520]/50">
              — {page.number} —
            </p>
          </>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2px]">
        <Shade part={`${part}-shade`} W={W} H={H} />
      </div>
    </article>
  )
}

/** A divider tab: coloured card with a typed paper label. `--flip` turns it to face left. */
function Tab({
  label,
  k,
  metrics,
  active = false,
  mirror = false,
}: {
  label: string
  k: number
  metrics: ReturnType<typeof tabMetrics>
  active?: boolean
  mirror?: boolean
}) {
  const { length, depth, font } = metrics
  return (
    <span
      className="flex items-center justify-center rounded-r-[5px] shadow-[1px_1px_3px_rgba(0,0,0,0.3)] [transform:scaleX(var(--flip,1))]"
      style={{
        width: depth,
        height: length,
        backgroundColor: TAB_COLORS[k % TAB_COLORS.length],
        backgroundImage: `url(${CARD})`,
        backgroundSize: '256px',
        backgroundBlendMode: 'luminosity',
      }}
    >
      <span
        className={`flex items-center justify-center rounded-[2px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] ${active ? 'bg-white' : 'bg-[#f6f1e4]'}`}
        style={{ width: depth - 8, height: length - 10 }}
      >
        <span
          className="font-[family-name:var(--font-typewriter)] leading-none whitespace-nowrap text-[#2a2520] uppercase [writing-mode:vertical-rl] [transform:scaleX(var(--flip,1))]"
          style={{ fontSize: font, letterSpacing: '0.1em', ...(mirror ? { ['--flip' as string]: '-1' } : {}) }}
        >
          {label}
        </span>
      </span>
    </span>
  )
}

/** light across the folded-over part: dark in the crease, a sheen where it rolls over */
function Shade({ part, W, H }: { part: string; W: number; H: number }) {
  return (
    <div
      data-part={part}
      aria-hidden
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: 0.5 * W,
        height: 2 * Math.hypot(W, H),
        visibility: 'hidden',
        background:
          'linear-gradient(to right, rgba(40,25,5,0.22), rgba(255,250,235,0.14) 14%, rgba(255,250,235,0) 40%, rgba(40,25,5,0.05) 100%)',
      }}
    />
  )
}
