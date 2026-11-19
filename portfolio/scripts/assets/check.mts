// Fails if the manifest is invalid, or if any shipped model/texture has no credits entry.
// Usage: node scripts/assets/check.mts
import { existsSync, readdirSync } from 'node:fs'
import { FONTS_DIR, MODELS_DIR, TEXTURES_DIR, readManifest, validate } from './lib.mts'

const entries = readManifest()
const errors = validate(entries)
const ids = new Set(entries.map((e) => e.id))

const shipped = [
  ...(existsSync(MODELS_DIR) ? readdirSync(MODELS_DIR).filter((f) => f.endsWith('.glb')).map((f) => f.replace(/\.glb$/, '')) : []),
  ...(existsSync(TEXTURES_DIR) ? readdirSync(TEXTURES_DIR) : []),
  ...(existsSync(FONTS_DIR) ? readdirSync(FONTS_DIR).map((f) => f.replace(/\.\w+$/, '')) : []),
]
for (const id of shipped) {
  if (!ids.has(id)) errors.push(`[${id}] shipped in public/ but has no entry in assets/credits.json`)
}

if (errors.length) {
  console.error(`asset check failed:\n${errors.join('\n')}`)
  process.exit(1)
}
console.log(`asset check ok: ${entries.length} credited assets, ${shipped.length} shipped`)
