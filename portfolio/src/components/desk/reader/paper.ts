import type { CSSProperties } from 'react'
import { imageUrl } from '@/lib/desk/assets'

// The dossier's baked paper (scripts/desk-paper.mjs) and divider-tab sizing.

export const SHEET = imageUrl('paper_001').replace('diff.webp', 'sheet.webp')
export const CARD = imageUrl('paper_006').replace('diff.webp', 'folder.webp')
/** the name typed on the folder's tab and cover. The outside of the folder is fixed; every
 *  word inside it comes from the database. */
export const FOLDER_LABEL = 'MARLER, B.'

/** torn ends for a strip of tape, as a clip-path */
export const TAPE =
  'polygon(0 8%, 4% 0, 9% 10%, 14% 0, 86% 0, 91% 9%, 96% 0, 100% 10%, 100% 92%, 96% 100%, 91% 90%, 86% 100%, 14% 100%, 9% 91%, 4% 100%, 0 90%)'
/** a strip of Scotch tape: clear with a slight amber-grey tint, a sheen across it, and its
 *  long edges catching the light, so it reads on cream paper */
export const SCOTCH: CSSProperties = {
  clipPath: TAPE,
  backgroundColor: 'rgba(184,176,148,0.45)',
  backgroundImage: [
    'linear-gradient(to bottom, rgba(110,100,75,0.45) 0 1px, transparent 1px calc(100% - 1px), rgba(110,100,75,0.45) calc(100% - 1px))',
    'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.25))',
    'linear-gradient(100deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 65%)',
  ].join(', '),
}
export const TAB_COLORS = ['#e9d9a6', '#cddcc0', '#c9d7e2', '#ecc9bf', '#ddd0e6', '#e6e1b0']

/** where each divider tab sits down the edge, and how big it is */
export function tabMetrics(H: number, count: number) {
  const gap = H * 0.012
  const length = Math.min(H * 0.14, (H * 0.86) / Math.max(1, count) - gap)
  const font = Math.max(9, Math.min(13, length * 0.085))
  return { length, gap, font, depth: Math.round(font * 2.3 + 6), top: (k: number) => H * 0.05 + k * (length + gap) }
}
