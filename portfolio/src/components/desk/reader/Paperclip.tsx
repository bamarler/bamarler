import { useId } from 'react'

/** A steel gem clip, drawn as one bent wire. Give it a height and a width (20:56); Safari
 *  won't size an SVG from its aspect ratio alone. */
export default function Paperclip({ className = '' }: { className?: string }) {
  const id = useId()
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 56"
      className={`pointer-events-none overflow-visible drop-shadow-[0.6px_1.2px_0.8px_rgba(0,0,0,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0" stopColor="#f4f5f6" />
          <stop offset="0.45" stopColor="#9a9da2" />
          <stop offset="0.7" stopColor="#e6e7e9" />
          <stop offset="1" stopColor="#85888d" />
        </linearGradient>
      </defs>
      <path
        d="M7 18 L7 44 A3 3 0 0 0 13 44 L13 8 A4.5 4.5 0 0 0 4 8 L4 48 A6 6 0 0 0 16 48 L16 16"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
