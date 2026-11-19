// Bakes the dossier's paper into single images, so the page needs no blend modes or stacked
// background layers at runtime:
//   public/textures/paper_001/sheet.webp  a typing sheet: warm stock, grain, faint creases, aged edges
//   public/textures/paper_006/folder.webp manila card, tileable
//   public/desk/grain.webp                photo film grain, tileable
// Needs `bun run assets:fetch paper_001 paper_003 paper_006` first (reads assets/raw).
// Usage: node scripts/desk-paper.mjs
import { resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const raw = (id) => resolve(root, 'assets/raw', id, 'diff.jpg')
const out = (...p) => resolve(root, 'public', ...p)

/** a greyscale detail layer centred on mid-grey, for overlay blending */
async function detail(id, width, height, strength) {
  const img = sharp(raw(id)).greyscale().resize(width, height, { fit: 'cover' })
  const { channels } = await img.clone().stats()
  const mean = channels[0].mean
  return img.linear(strength, 128 - strength * mean).png().toBuffer()
}

function solid(width, height, background) {
  return { create: { width, height, channels: 3, background } }
}

// typing sheet, letter proportions
{
  const [w, h] = [1100, 1424]
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <radialGradient id="v" cx="50%" cy="50%" r="72%">
        <stop offset="76%" stop-color="#fff"/><stop offset="100%" stop-color="#eadcb9"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#v)"/>
  </svg>`)
  const light = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs><rect width="100%" height="100%" fill="url(#l)"/></svg>`)
  await sharp(solid(w, h, '#f1e8d3'))
    .composite([
      { input: await detail('paper_001', w, h, 5), blend: 'overlay' },
      { input: await detail('paper_003', w, h, 1.4), blend: 'overlay' },
      { input: svg, blend: 'multiply' },
      { input: light, blend: 'over' },
    ])
    .webp({ quality: 88 })
    .toFile(out('textures/paper_001/sheet.webp'))
  console.log('ok    public/textures/paper_001/sheet.webp')
}

// manila folder card, tileable (overlay is per pixel, so the source's tiling survives)
{
  const s = 1024
  await sharp(solid(s, s, "#e9d8aa"))
    .composite([{ input: await detail("paper_006", s, s, 2.2), blend: 'overlay' }])
    .webp({ quality: 85 })
    .toFile(out('textures/paper_006/folder.webp'))
  console.log('ok    public/textures/paper_006/folder.webp')
}

// film grain for photos: seeded noise so rebuilds match
{
  const s = 256
  const px = Buffer.alloc(s * s)
  let seed = 7
  for (let i = 0; i < px.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    px[i] = 128 + ((seed >> 8) % 90) - 45
  }
  await sharp(px, { raw: { width: s, height: s, channels: 1 } })
    .webp({ quality: 70 })
    .toFile(out('desk/grain.webp'))
  console.log('ok    public/desk/grain.webp')
}
