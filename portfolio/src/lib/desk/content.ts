import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { scrambleEmail, type Contact, type DossierLink, type Folder, type Sheet } from './dossier'

// Server-side reads for the desk. Results are cached and tagged so the Supabase webhook
// (/api/desk/revalidate) can refresh them as soon as a row changes.
export const DESK_CONTENT_TAG = 'desk-content'

export type Experience = {
  id: string
  company: string
  role: string
  period: string
  description: string
  image_name: string
}

export type Project = {
  id: string
  title: string
  description: string
  tech_stack: string[]
  github_url: string | null
  live_url: string | null
  image_name: string
}

type SkillCategory = { id: string; name: string }
type Skill = { id: string; name: string; category_id: string; proficiency: number | null }

type DossierRow = {
  id: string
  template: 'cover' | 'profile' | 'experiences' | 'projects' | 'skills' | 'contact' | 'freeform'
  tab: string | null
  data: Record<string, unknown>
}

function serverClient() {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!projectId || !key) return null
  return createClient(`https://${projectId}.supabase.co`, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 300, tags: [DESK_CONTENT_TAG] } }),
    },
  })
}

// Photos for the picture frame: every image in this folder of the `assets` bucket, in
// name order (so 01_…, 02_… sets the order).
const FRAME_FOLDER = 'frame'
const PHOTO = /\.(jpe?g|png|webp|avif)$/i

/** Public URL of a file in the `assets` storage bucket. */
function assetUrl(supabase: SupabaseClient, name: unknown): string | null {
  if (typeof name !== 'string' || !name) return null
  return supabase.storage.from('assets').getPublicUrl(name).data.publicUrl
}

/** a full URL as given, or else a file in the `assets` bucket */
const linkOrAsset = (supabase: SupabaseClient, v: unknown) =>
  typeof v === 'string' && /^https?:\/\//.test(v) ? v : assetUrl(supabase, v)

/** a link's site name, for a link the row gives no label for */
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
const NO_FOLDER: Folder = { contents: '' }
const text = (v: unknown) => (typeof v === 'string' ? v : '')
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [])
const links = (v: unknown): DossierLink[] =>
  Array.isArray(v)
    ? v.flatMap((l) => (l && typeof l.label === 'string' && typeof l.url === 'string' ? [{ label: l.label, url: l.url }] : []))
    : []

/** contact details from a row's data. The email goes out scrambled, and a `mailto:` link
 *  in `links` (the older way of giving it) is taken as the email too. */
function contact(supabase: SupabaseClient, d: Record<string, unknown>): Contact {
  const all = links(d.links)
  const mailto = all.find((l) => l.url.startsWith('mailto:'))
  const email = text(d.email) || mailto?.url.slice('mailto:'.length) || ''
  return {
    location: text(d.location),
    email: email ? scrambleEmail(email) : null,
    links: all.filter((l) => l !== mailto),
    resume: linkOrAsset(supabase, d.resume),
    resumeLabel: text(d.resume_label),
  }
}
const hasContact = (c: Contact) => !!(c.location || c.email || c.links.length || c.resume)

export async function getDeskContent(): Promise<{
  experiences: Experience[]
  projects: Project[]
  sheets: Sheet[]
  /** photos for the picture frame on the desk */
  framePhotos: string[]
  /** text inside the folder that isn't on a sheet, from the cover row */
  folder: Folder
  /** the name on the cover, for the page title */
  name: string
  error: string | null
}> {
  const supabase = serverClient()
  if (!supabase) {
    return { experiences: [], projects: [], sheets: [], framePhotos: [], folder: NO_FOLDER, name: '', error: 'Supabase env vars are not set' }
  }

  const [exp, proj, cats, skills, pages, frame] = await Promise.all([
    supabase.from('experiences').select('*').order('display_order', { ascending: true }),
    supabase.from('projects').select('*').order('display_order', { ascending: true }),
    supabase.from('skill_categories').select('id, name').order('display_order', { ascending: true }),
    supabase.from('skills').select('id, name, category_id, proficiency').order('display_order', { ascending: true }),
    supabase.from('dossier_pages').select('id, template, tab, data').eq('published', true).order('display_order', { ascending: true }),
    supabase.storage.from('assets').list(FRAME_FOLDER, { limit: 50, sortBy: { column: 'name', order: 'asc' } }),
  ])

  const experiences: Experience[] = exp.data ?? []
  const projects: Project[] = proj.data ?? []
  // every word on the dossier comes from these rows; none are written into the code
  const rows: DossierRow[] = pages.data ?? []
  const cover = rows.find((r) => r.template === 'cover')?.data ?? {}
  const folder: Folder = { contents: text(cover.contents) }

  // listing needs supabase/migrations/004_frame_photos.sql; until then, no photos
  const framePhotos = (frame.data ?? [])
    .filter((f) => PHOTO.test(f.name))
    .flatMap((f) => assetUrl(supabase, `${FRAME_FOLDER}/${f.name}`) ?? [])

  const sheets: Sheet[] = []
  for (const row of rows) {
    const d = row.data ?? {}
    const tab = row.tab ?? undefined
    const header = text(d.header)
    switch (row.template) {
      case 'cover': {
        const c = contact(supabase, d)
        sheets.push({
          id: row.id, kind: 'cover', tab, header, name: text(d.name), tagline: text(d.tagline),
          photo: assetUrl(supabase, d.photo), contact: hasContact(c) ? c : null,
        })
        break
      }
      case 'profile':
        sheets.push({
          id: row.id, kind: 'profile', tab, header, title: text(d.title), body: text(d.body),
          interestsLabel: text(d.interests_label), interests: strings(d.interests), photo: assetUrl(supabase, d.photo),
        })
        break
      case 'freeform':
        sheets.push({ id: row.id, kind: 'freeform', tab, header, title: text(d.title), body: text(d.body), photo: assetUrl(supabase, d.photo) })
        break
      case 'contact':
        sheets.push({ id: row.id, kind: 'contact', tab, header, title: text(d.title), body: text(d.body), contact: contact(supabase, d) })
        break
      case 'experiences':
        experiences.forEach((e, i) =>
          sheets.push({
            id: `experience-${e.id}`, kind: 'experience', tab: i === 0 ? tab : undefined, header,
            company: e.company, role: e.role, period: e.period, body: e.description ?? '',
            photo: assetUrl(supabase, e.image_name), index: i + 1, total: experiences.length,
          }),
        )
        break
      case 'projects':
        projects.forEach((p, i) =>
          sheets.push({
            id: `project-${p.id}`, kind: 'project', tab: i === 0 ? tab : undefined, header,
            title: p.title, body: p.description ?? '', toolsLabel: text(d.tools_label), tools: p.tech_stack ?? [],
            links: [
              ...(p.live_url ? [{ label: text(d.live_label) || host(p.live_url), url: p.live_url }] : []),
              ...(p.github_url ? [{ label: text(d.source_label) || host(p.github_url), url: p.github_url }] : []),
            ],
            photo: assetUrl(supabase, p.image_name), index: i + 1, total: projects.length,
          }),
        )
        break
      case 'skills': {
        const all: Skill[] = skills.data ?? []
        const categories = (cats.data ?? ([] as SkillCategory[]))
          .map((c: SkillCategory) => ({
            name: c.name,
            skills: all.filter((s) => s.category_id === c.id).map((s) => ({ name: s.name, proficiency: s.proficiency })),
          }))
          .filter((c) => c.skills.length)
        if (categories.length) sheets.push({ id: row.id, kind: 'skills', tab, header, categories })
        break
      }
    }
  }

  return {
    experiences,
    projects,
    sheets,
    framePhotos,
    folder,
    name: text(cover.name),
    error: pages.error ? `dossier_pages: ${pages.error.message}` : exp.error?.message ?? proj.error?.message ?? null,
  }
}
