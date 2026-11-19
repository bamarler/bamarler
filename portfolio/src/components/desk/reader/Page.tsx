import { useLayoutEffect, useRef } from 'react'
import SheetBody from './SheetBody'
import type { Page as PageData } from './paginate'
import { SHEET } from './paper'

// One typed page lying flat in the open folder. `turn` puts a small folded corner in its
// outer bottom corner that flips to the next (right page) or previous (left page) spread.
// Paper doesn't scroll, so a page with a lot on it is typed smaller until it all fits.

const MIN_FIT = 0.5

/** shrink `body` (text, photos and all) until it fits inside its box */
function useFit(W: number, H: number) {
  const box = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const fit = () => {
      const b = box.current
      const c = body.current
      if (!b || !c) return
      const fits = (z: number) => {
        c.style.zoom = String(z)
        return b.scrollHeight <= b.clientHeight + 1
      }
      if (fits(1)) return
      let lo = MIN_FIT
      let hi = 1
      for (let k = 0; k < 7; k++) {
        const mid = (lo + hi) / 2
        if (fits(mid)) lo = mid
        else hi = mid
      }
      c.style.zoom = String(lo)
    }
    fit()
    // the typewriter fonts can arrive after the first layout
    document.fonts?.ready.then(fit)
  }, [W, H])
  return { box, body }
}

type Props = {
  page: PageData
  W: number
  H: number
  side: 'left' | 'right'
  turn?: { label: string; onClick: () => void }
}

export default function Page({ page, W, H, side, turn }: Props) {
  const { box, body } = useFit(W, H)
  return (
    <article
      className="@container absolute top-0 overflow-hidden rounded-[2px] font-[family-name:var(--font-type)] text-[#2a2520] shadow-[0_1px_2px_rgba(0,0,0,0.25),0_4px_14px_rgba(0,0,0,0.14)]"
      style={{
        left: side === 'left' ? 0 : undefined,
        right: side === 'right' ? 0 : undefined,
        width: W,
        height: H,
        backgroundImage: `url(${SHEET})`,
        backgroundSize: '100% 100%',
      }}
    >
      <div
        ref={box}
        className="absolute inset-x-0 top-0 bottom-[9cqw] overflow-hidden px-[8cqw] pt-[7cqw] pb-[2cqw] text-[max(12px,2.6cqw)] leading-[1.5] [text-shadow:0_0_0.6px_rgba(42,37,32,0.4)]"
      >
        <div ref={body} className="h-full">
          <SheetBody sheet={page.sheet} />
        </div>
      </div>
      <p aria-hidden className="absolute inset-x-0 bottom-[3.5cqw] text-center text-[max(10px,2cqw)] text-[#2a2520]/50">
        — {page.number} —
      </p>
      {turn && <Corner side={side} {...turn} />}
    </article>
  )
}

/** A dog-eared corner with a small arrow: click it to turn the page. */
function Corner({ side, label, onClick }: { side: 'left' | 'right'; label: string; onClick: () => void }) {
  const right = side === 'right'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`group absolute bottom-0 size-[12cqw] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#a3322a] ${right ? 'right-0' : 'left-0'}`}
    >
      {/* the folded-over corner: its back shows, and the folder shows where it was */}
      <span
        aria-hidden
        className={`absolute bottom-0 size-[7cqw] transition-[width,height] duration-200 group-hover:size-[9cqw] ${right ? 'right-0' : 'left-0'}`}
        style={{
          background: `linear-gradient(${right ? 315 : 45}deg, #d9c48f 50%, #e7dcc3 50%, #f4ecda 100%)`,
          boxShadow: right ? '-1px -1px 3px rgba(0,0,0,0.25)' : '1px -1px 3px rgba(0,0,0,0.25)',
        }}
      />
      {/* arrow, as if pencilled on */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`absolute bottom-[7.5cqw] h-[4cqw] w-[4cqw] text-[#2a2520]/55 transition-colors group-hover:text-[#a3322a] ${right ? 'right-[2cqw]' : 'left-[2cqw] -scale-x-100'}`}
      >
        <path d="M4 15c3-6 9-8 15-6M15 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
