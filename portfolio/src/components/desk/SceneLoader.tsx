'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import InspectUI from './InspectUI'
import Reader from './reader/Reader'
import type { Folder, Sheet } from '@/lib/desk/dossier'

// WebGL only runs in the browser. Until the room is ready, a pre-rendered still of it
// is shown, then it fades into the live scene. Regenerate with `bun run desk:poster`.
const Scene = dynamic(() => import('./Scene'), { ssr: false })

export default function SceneLoader({
  poster = false,
  sheets = [],
  framePhotos = [],
  folder,
}: {
  poster?: boolean
  sheets?: Sheet[]
  framePhotos?: string[]
  folder: Folder
}) {
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  return (
    <div className="absolute inset-0" data-ready={ready || undefined}>
      <Scene onReady={onReady} poster={poster} framePhotos={framePhotos} />
      {!poster && <InspectUI />}
      {!poster && <Reader sheets={sheets} folder={folder} />}
      {!poster && (
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
          aria-hidden
        >
          <picture>
            <source media="(orientation: portrait)" srcSet="/desk/poster-portrait.webp" />
            <img src="/desk/poster-landscape.webp" alt="" className="h-full w-full object-cover" />
          </picture>
        </div>
      )}
    </div>
  )
}
