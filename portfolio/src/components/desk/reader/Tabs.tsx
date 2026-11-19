import type { Section } from './paginate'
import { CARD, TAB_COLORS, tabMetrics } from './paper'

// Divider tabs sticking out past the sheets. In the open folder, sections already turned
// past have their tabs on the left edge, like dividers in a real file; on a phone they all
// stay on the right.

type Props = {
  sections: Section[]
  turned: number
  /** x of the right edge of the right-hand sheet, and of the left edge of the left one */
  right: number
  left: number | null
  H: number
  onGo: (turned: number) => void
}

export default function Tabs({ sections, turned, right, left, H, onGo }: Props) {
  const m = tabMetrics(H, sections.length)
  // every section open in front of you (two can share a spread)
  const shown = sections.filter((s) => s.turned <= turned).at(-1)?.turned
  return (
    <nav aria-label="Sections">
      {sections.map((s, k) => {
        // a divider has been turned over once the leaf it sticks out of has
        const passed = left !== null && s.leaf < turned
        const active = s.turned === shown
        return (
          <button
            key={s.page}
            type="button"
            onClick={() => onGo(s.turned)}
            aria-current={active ? 'true' : undefined}
            className="group absolute z-0 rounded-[5px] focus-visible:outline-2 focus-visible:outline-[#a3322a]"
            style={{ left: passed ? left! - m.depth : right, top: m.top(k) }}
          >
            <span
              className={`flex items-center justify-center shadow-[1px_1px_3px_rgba(0,0,0,0.3)] transition-transform ${
                passed ? 'rounded-l-[5px] group-hover:-translate-x-[2px]' : 'rounded-r-[5px] group-hover:translate-x-[2px]'
              }`}
              style={{
                width: m.depth,
                height: m.length,
                backgroundColor: TAB_COLORS[k % TAB_COLORS.length],
                backgroundImage: `url(${CARD})`,
                backgroundSize: '256px',
                backgroundBlendMode: 'luminosity',
              }}
            >
              <span
                className={`flex items-center justify-center rounded-[2px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] ${active ? 'bg-white' : 'bg-[#f6f1e4]'}`}
                style={{ width: m.depth - 8, height: m.length - 10 }}
              >
                <span
                  className="font-[family-name:var(--font-typewriter)] leading-none whitespace-nowrap text-[#2a2520] uppercase [writing-mode:vertical-rl]"
                  style={{ fontSize: m.font, letterSpacing: '0.1em' }}
                >
                  {s.label}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
