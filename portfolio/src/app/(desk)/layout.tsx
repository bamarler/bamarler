import type { Metadata } from 'next'
import localFont from 'next/font/local'

// the post-it handwriting, also used by the few DOM labels in the room
const marker = localFont({
  src: '../../../public/fonts/desk/permanent_marker.ttf',
  variable: '--font-marker',
  display: 'swap',
})

// the dossier: Courier Prime for the typed body text, Special Elite for headings and stamps
const type = localFont({
  src: [
    { path: '../../../public/fonts/desk/courier_prime.ttf', weight: '400' },
    { path: '../../../public/fonts/desk/courier_prime_bold.ttf', weight: '700' },
  ],
  variable: '--font-type',
  display: 'swap',
})
const typewriter = localFont({
  src: '../../../public/fonts/desk/special_elite.ttf',
  variable: '--font-typewriter',
  display: 'swap',
})

export const metadata: Metadata = {
}

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${marker.variable} ${type.variable} ${typewriter.variable} fixed inset-0 overflow-hidden bg-[#1a1a18] text-[#f2efe6]`}>{children}</div>
}
