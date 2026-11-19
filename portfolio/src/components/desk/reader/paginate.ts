import type { Sheet } from '@/lib/desk/dossier'

// How sheets of content become physical leaves of paper. In the open folder each leaf is
// typed on both sides, like a book, so neither side of the spread sits empty. On a phone,
// one sheet per leaf, backs left blank. A section's divider tab sticks out of the leaf its
// first page is on.

export type Page = { sheet: Sheet; number: number }
/** `turned`: how many leaves to turn to bring the section's first page face up */
export type Section = { label: string; turned: number; page: number; leaf: number }
export type LeafData = { id: string; front: Page; back: Page | null; tabs: Section[] }

export function paginate(sheets: Sheet[], doubleSided: boolean): LeafData[] {
  const leaves: LeafData[] = []
  sheets.forEach((sheet, i) => {
    const page = { sheet, number: i + 1 }
    const last = leaves.at(-1)
    const onBack = doubleSided && !!last && !last.back
    if (onBack) last.back = page
    else leaves.push({ id: sheet.id, front: page, back: null, tabs: [] })
    if (sheet.tab) {
      const at = leaves.length - 1
      leaves[at].tabs.push({ label: sheet.tab, turned: onBack ? at + 1 : at, page: page.number, leaf: at })
    }
  })
  return leaves
}

/** how many leaves can be turned: the last back only counts if something is typed on it */
export const maxTurned = (leaves: LeafData[]) => (leaves.at(-1)?.back ? leaves.length : leaves.length - 1)

/** leaves to turn so the given sheet is face up */
export function turnedFor(leaves: LeafData[], sheetId: string) {
  const i = leaves.findIndex((l) => l.front.sheet.id === sheetId || l.back?.sheet.id === sheetId)
  if (i < 0) return 0
  return leaves[i].front.sheet.id === sheetId ? i : i + 1
}
