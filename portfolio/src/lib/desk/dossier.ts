// The dossier's sheets, built on the server from Supabase (see content.ts) and rendered
// by the reader. Plain data, so it can cross from the server page to the client.

export type DossierLink = { label: string; url: string }

/** How to reach Ben. `email` is scrambled on the server (see content.ts) so the address
 *  never appears as plain text in the page's HTML or data; `revealEmail` unscrambles it. */
export type Contact = {
  location: string
  email: string | null
  links: DossierLink[]
  resume: string | null
  resumeLabel: string
}

/** text for the inside of the folder that isn't on a sheet: the contents card's title.
 *  (The outside of the folder is fixed; see FOLDER_LABEL in reader/paper.ts.) */
export type Folder = { contents: string }

export const scrambleEmail = (address: string) => btoa([...address].reverse().join(''))
export const revealEmail = (scrambled: string) => [...atob(scrambled)].reverse().join('')

type Base = {
  id: string
  /** label of the divider tab that starts here */
  tab?: string
  /** small heading across the top of the sheet ('' for none) */
  header: string
}

export type Sheet = Base &
  (
    | { kind: 'cover'; name: string; tagline: string; photo: string | null; contact: Contact | null }
    | { kind: 'profile'; title: string; body: string; interestsLabel: string; interests: string[]; photo: string | null }
    | { kind: 'freeform'; title: string; body: string; photo: string | null }
    | { kind: 'contact'; title: string; body: string; contact: Contact }
    | {
        kind: 'experience'
        company: string
        role: string
        period: string
        body: string
        photo: string | null
        index: number
        total: number
      }
    | {
        kind: 'project'
        title: string
        body: string
        toolsLabel: string
        tools: string[]
        links: DossierLink[]
        photo: string | null
        index: number
        total: number
      }
    | {
        kind: 'skills'
        categories: { name: string; skills: { name: string; proficiency: number | null }[] }[]
      }
  )
