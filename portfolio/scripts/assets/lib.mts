// Shared helpers for the desk asset pipeline. Run with plain `node` (Node 22.6+ strips TS types).
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const ROOT = resolve(import.meta.dirname, '../..')
export const MANIFEST = resolve(ROOT, 'assets/credits.json')
export const RAW_DIR = resolve(ROOT, 'assets/raw')
export const MODELS_DIR = resolve(ROOT, 'public/models')
export const TEXTURES_DIR = resolve(ROOT, 'public/textures')
export const FONTS_DIR = resolve(ROOT, 'public/fonts/desk')

// Licenses that allow a public repo + browser-downloadable files. NC/ND/store licenses are excluded.
export const ALLOWED_LICENSES = ['CC0-1.0', 'PDDL-1.0', 'public-domain', 'CC-BY-3.0', 'CC-BY-4.0', 'OFL-1.1', 'Apache-2.0'] as const
// open font licenses are only valid for fonts
const FONT_ONLY_LICENSES = ['OFL-1.1', 'Apache-2.0']
export const ALLOWED_ORIGINS = ['library', 'scan', 'handmade'] as const

export type Entry = {
  id: string
  kind: 'model' | 'texture' | 'font'
  title: string
  authors: string[]
  source: 'polyhaven' | 'sketchfab' | 'ambientcg' | 'url' | 'local'
  source_url: string
  /** direct download for source "url", or a path under assets/raw for "local" (scans, handmade) */
  file?: string
  license: (typeof ALLOWED_LICENSES)[number]
  origin: (typeof ALLOWED_ORIGINS)[number]
  ai_check: string
  modifications: string[]
  /** texture maps to ship (default all three); flat images for the DOM only need diff */
  maps?: ('diff' | 'nor' | 'arm')[]
  /** max texture edge in px for the web build (default 1024) */
  max_texture?: number
  /** keep this fraction of a model's triangles (meshopt simplify), for over-detailed scans */
  simplify?: number
  downloaded?: string
  sha256?: string
}

export function readManifest(): Entry[] {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'))
}

export function writeManifest(entries: Entry[]) {
  writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n')
}

export function validate(entries: Entry[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const e of entries) {
    const at = `[${e.id ?? '?'}]`
    if (!e.id || !/^[a-z0-9_]+$/.test(e.id)) errors.push(`${at} id must be snake_case`)
    if (seen.has(e.id)) errors.push(`${at} duplicate id`)
    seen.add(e.id)
    for (const key of ['title', 'source_url', 'ai_check'] as const) {
      if (!e[key]) errors.push(`${at} missing ${key}`)
    }
    if (!e.authors?.length) errors.push(`${at} missing authors`)
    if (!ALLOWED_LICENSES.includes(e.license)) errors.push(`${at} license "${e.license}" is not allowed`)
    if (FONT_ONLY_LICENSES.includes(e.license) && e.kind !== 'font') errors.push(`${at} ${e.license} is only allowed for fonts`)
    if (!ALLOWED_ORIGINS.includes(e.origin)) errors.push(`${at} origin "${e.origin}" is not allowed (no AI-generated art)`)
    if (!Array.isArray(e.modifications)) errors.push(`${at} modifications must be an array`)
  }
  return errors
}

export function creditLine(e: Entry) {
  return `"${e.title}" by ${e.authors.join(', ')} (${e.source_url}), ${e.license}`
}
