'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import Model from './Model'
import Pickable from './Pickable'

// The standing frame on the desk. With photos in the `frame/` folder of the `assets`
// bucket (see content.ts) it shows them in turn, one every few seconds; with none, the
// stock print it came with. Only the photo on show and the one loading are in memory.

const ID = 'standing_picture_frame_01'
const ART = 'standing_picture_frame_01_artwork'
// the part of its texture the artwork quad shows (u from 0.165 to 0.835, all of v), and
// the quad's width over its height
const WINDOW = { u: 0.165, width: 0.67, aspect: 0.698 }
const EVERY = 9000 // ms per photo
const SIZE = 640 // px wide; the frame is about 13 cm across, never more than half the screen

/** a photo resized by the Next image optimizer, so a phone-camera original isn't decoded */
const sized = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=${SIZE}&q=75`

/** crop the photo to the frame's window (like object-fit: cover) and map it onto the quad */
function frame(texture: THREE.Texture) {
  const { width, height } = texture.image as HTMLImageElement
  const aspect = width / height
  const ku = Math.min(1, WINDOW.aspect / aspect) // share of the photo's width that shows
  const kv = Math.min(1, aspect / WINDOW.aspect)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false // glTF UVs: v runs down the image
  texture.repeat.set(ku / WINDOW.width, kv)
  texture.offset.set(0.5 - ku / 2 - (ku * WINDOW.u) / WINDOW.width, 0.5 - kv / 2)
  texture.needsUpdate = true
  return texture
}

function usePhotos(urls: string[], still: boolean) {
  const [shown, setShown] = useState<THREE.Texture | null>(null)
  const key = urls.join('\n') // a stable dependency for the list

  useEffect(() => {
    const list = key ? key.split('\n') : []
    if (!list.length) return
    const loader = new THREE.TextureLoader()
    let at = 0
    let cancelled = false
    const load = (i: number) =>
      loader.load(sized(list[i]), (texture) => {
        if (cancelled) texture.dispose()
        else setShown(frame(texture))
      })
    load(0)
    const timer =
      list.length > 1 && !still
        ? setInterval(() => {
            if (document.hidden) return
            at = (at + 1) % list.length
            load(at)
          }, EVERY)
        : undefined
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [key, still])

  // free each photo once the next one is up
  useEffect(() => () => shown?.dispose(), [shown])
  return shown
}

type Props = { photos: string[]; position: [number, number, number]; turn: number; still?: boolean }

export default function PictureFrame({ photos, position, turn, still = false }: Props) {
  const photo = usePhotos(photos, still)
  return (
    <Pickable id={ID} label="picture frame" face={[0.15, 0, 0]} position={position} rotation-y={turn}>
      {/* modelled facing +x; turned so its front is the side a held object shows */}
      <Model id={ID} rotationY={-Math.PI / 2} noGlass matte art={{ material: ART, map: photo }} />
    </Pickable>
  )
}
