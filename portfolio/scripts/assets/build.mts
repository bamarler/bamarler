// Turns assets/raw/<id>/ into web-ready files:
//   models   → public/models/<id>.glb   (deduped, welded, optionally simplified, WebP textures, meshopt-compressed, credit embedded)
//   textures → public/textures/<id>/{diff,nor,arm}.webp
//   fonts    → public/fonts/desk/<id>.ttf
// Usage: node scripts/assets/build.mts [id ...]
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { FONTS_DIR, MODELS_DIR, RAW_DIR, TEXTURES_DIR, creditLine, readManifest, validate } from './lib.mts'

await MeshoptEncoder.ready
await MeshoptDecoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const kb = (p: string) => `${Math.round(statSync(p).size / 1024)} KB`

const only = process.argv.slice(2)
const entries = readManifest()
const errors = validate(entries)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

mkdirSync(MODELS_DIR, { recursive: true })
mkdirSync(TEXTURES_DIR, { recursive: true })
mkdirSync(FONTS_DIR, { recursive: true })

for (const e of entries) {
  if (only.length && !only.includes(e.id)) continue
  const dir = resolve(RAW_DIR, e.id)
  if (!existsSync(dir)) {
    console.warn(`skip  ${e.id} (not fetched; run assets:fetch)`)
    continue
  }
  const max = e.max_texture ?? 1024

  if (e.kind === 'model') {
    const src = readdirSync(dir).find((f) => /\.(glb|gltf)$/.test(f))
    if (!src) throw new Error(`${e.id}: no .glb/.gltf in ${dir}`)
    const doc = await io.read(resolve(dir, src))
    doc.getRoot().getAsset().copyright = creditLine(e)
    await doc.transform(
      dedup(),
      prune(),
      weld(),
      ...(e.simplify ? [simplify({ simplifier: MeshoptSimplifier, ratio: e.simplify, error: 0.001 })] : []),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max] }),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    )
    const out = resolve(MODELS_DIR, `${e.id}.glb`)
    await io.write(out, doc)
    console.log(`ok    ${e.id} → public/models/${e.id}.glb (${kb(out)})`)
  } else if (e.kind === 'font') {
    const src = readdirSync(dir).find((f) => /\.(ttf|otf|woff)$/.test(f))
    if (!src) throw new Error(`${e.id}: no font file in ${dir}`)
    const out = resolve(FONTS_DIR, `${e.id}.ttf`)
    copyFileSync(resolve(dir, src), out)
    console.log(`ok    ${e.id} → public/fonts/desk/${e.id}.ttf (${kb(out)})`)
  } else {
    const outDir = resolve(TEXTURES_DIR, e.id)
    mkdirSync(outDir, { recursive: true })
    for (const map of e.maps ?? ['diff', 'nor', 'arm']) {
      const out = resolve(outDir, `${map}.webp`)
      await sharp(resolve(dir, `${map}.jpg`))
        .resize(max, max, { fit: 'inside' })
        .webp({ quality: map === 'diff' ? 82 : 90 })
        .toFile(out)
    }
    console.log(`ok    ${e.id} → public/textures/${e.id}/ (${kb(resolve(outDir, 'diff.webp'))} albedo)`)
  }
}
