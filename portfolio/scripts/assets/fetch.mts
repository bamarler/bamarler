// Downloads every asset in assets/credits.json into assets/raw/<id>/.
// Usage: node scripts/assets/fetch.mts [id ...] [--force]
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { RAW_DIR, ROOT, readManifest, validate, writeManifest, type Entry } from './lib.mts'

const UA = { 'User-Agent': 'bamarler-portfolio-asset-fetch' }
const RES = '2k' // source resolution; the build step downsizes for the web

process.loadEnvFile?.(resolve(ROOT, '.env.local'))

async function download(url: string, dest: string, headers: Record<string, string> = UA) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  return dest
}

async function json(url: string, headers: Record<string, string> = UA) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function fetchPolyHaven(e: Entry, dir: string) {
  const files = await json(`https://api.polyhaven.com/files/${e.id}`)
  if (e.kind === 'model') {
    const gltf = files.gltf[RES]?.gltf ?? files.gltf['1k'].gltf
    const main = await download(gltf.url, resolve(dir, 'model.gltf'))
    for (const [rel, f] of Object.entries<{ url: string }>(gltf.include)) {
      await download(f.url, resolve(dir, rel))
    }
    return main
  }
  // texture set: albedo, OpenGL normal, AO/rough/metal packed
  const maps = { diff: files.Diffuse, nor: files.nor_gl, arm: files.arm }
  for (const [name, map] of Object.entries(maps)) {
    const f = map[RES]?.jpg ?? map['1k'].jpg
    await download(f.url, resolve(dir, `${name}.jpg`))
  }
  return resolve(dir, 'diff.jpg')
}

// ambientCG ships each material as a zip of maps; keep the ones we use under our map names
async function fetchAmbientCG(e: Entry, dir: string) {
  const id = new URL(e.source_url).searchParams.get('id')
  if (!id) throw new Error(`can't find an asset id in ${e.source_url}`)
  const zip = await download(`https://ambientcg.com/get?file=${id}_${RES.toUpperCase()}-JPG.zip`, resolve(dir, 'source.zip'))
  const tmp = resolve(dir, 'unzipped')
  execFileSync('unzip', ['-oq', zip, '-d', tmp])
  const names = { diff: 'Color', nor: 'NormalGL' } as const
  for (const map of e.maps ?? ['diff']) {
    if (map === 'arm') throw new Error('ambientCG has no packed arm map')
    const file = readdirSync(tmp).find((f) => f.endsWith(`_${names[map]}.jpg`))
    if (!file) throw new Error(`no ${names[map]} map in ${id}`)
    copyFileSync(resolve(tmp, file), resolve(dir, `${map}.jpg`))
  }
  rmSync(tmp, { recursive: true })
  return zip
}

async function fetchSketchfab(e: Entry, dir: string) {
  const token = process.env.SKETCHFAB_API_TOKEN
  if (!token) throw new Error('SKETCHFAB_API_TOKEN is not set in .env.local')
  const uid = e.source_url.match(/([0-9a-f]{32})\/?$/)?.[1]
  if (!uid) throw new Error(`can't find a model uid in ${e.source_url}`)
  // Re-check the live license before downloading, since Sketchfab licenses can change.
  const info = await json(`https://api.sketchfab.com/v3/models/${uid}`)
  const live = ({ cc0: 'CC0-1.0', by: 'CC-BY-4.0' } as Record<string, string>)[info.license?.slug]
  if (live !== e.license) throw new Error(`live license is "${info.license?.label}", manifest says ${e.license}`)
  const dl = await json(`https://api.sketchfab.com/v3/models/${uid}/download`, { Authorization: `Token ${token}` })
  if (!dl.glb?.url) throw new Error('no glb download offered')
  return download(dl.glb.url, resolve(dir, 'model.glb'), {})
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))

const entries = readManifest()
const errors = validate(entries)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

let failed = 0
for (const e of entries) {
  if (only.length && !only.includes(e.id)) continue
  const dir = resolve(RAW_DIR, e.id)
  if (existsSync(dir) && !force) {
    console.log(`skip  ${e.id} (already in assets/raw)`)
    continue
  }
  try {
    let main: string
    if (e.source === 'polyhaven') main = await fetchPolyHaven(e, dir)
    else if (e.source === 'sketchfab') main = await fetchSketchfab(e, dir)
    else if (e.source === 'ambientcg') main = await fetchAmbientCG(e, dir)
    else if (e.source === 'url' && e.file) main = await download(e.file, resolve(dir, e.file.split('/').pop()!))
    else if (e.source === 'local') {
      console.log(`local ${e.id} (expects files already in assets/raw/${e.id})`)
      continue
    } else throw new Error(`don't know how to fetch source "${e.source}"`)

    const sha = createHash('sha256').update(readFileSync(main)).digest('hex')
    if (e.sha256 && e.sha256 !== sha) console.warn(`warn  ${e.id}: upstream file changed (sha256 differs from manifest)`)
    e.sha256 = sha
    e.downloaded = new Date().toISOString().slice(0, 10)
    console.log(`ok    ${e.id}`)
  } catch (err) {
    failed++
    console.error(`FAIL  ${e.id}: ${(err as Error).message}`)
  }
}

writeManifest(entries)
process.exit(failed ? 1 : 0)
