'use client'

import { useEffect, useRef, useState } from 'react'

interface SlingshotModule {
  startGame: () => void
  resetGame: () => void
  retryLevel: () => void
  setLevel: (levelId: number) => void
  getAttempts: () => number
  getCurrentLevel: () => number
  getGameState: () => number
  getVersion: () => string
  needsLandscape: () => boolean
  dismissRules: () => void
}

declare global {
  interface Window {
    onSlingshotWin?: (levelId: number, attempts: number) => void
    onSlingshotLose?: () => void
  }
}

interface SlingshotCanvasProps {
  onWin?: (levelId: number, attempts: number) => void
  onLose?: () => void
  onLoad?: (module: SlingshotModule) => void
}

export default function SlingshotCanvas({
  onWin,
  onLose,
  onLoad,
}: SlingshotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const moduleRef = useRef<SlingshotModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up callbacks for C++ to call
  useEffect(() => {
    window.onSlingshotWin = (levelId: number, attempts: number) => {
      onWin?.(levelId, attempts)
    }
    window.onSlingshotLose = () => {
      onLose?.()
    }

    return () => {
      delete window.onSlingshotWin
      delete window.onSlingshotLose
    }
  }, [onWin, onLose])

  useEffect(() => {
    let mounted = true

    const loadModule = async () => {
      try {
        // Dynamic import for ES module
        const { default: SlingshotModule } = await import(
          /* webpackIgnore: true */ '/wasm/slingshot.js'
        )

        if (!mounted) return

        const slingshotModule = await SlingshotModule({
          canvas: canvasRef.current,
          locateFile: (path: string) => `/wasm/${path}`,
        })

        if (!mounted) return

        moduleRef.current = slingshotModule
        slingshotModule.startGame()

        setLoading(false)
        onLoad?.(slingshotModule)
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load slingshot module:', err)
        setError('Failed to load game engine')
        setLoading(false)
      }
    }

    loadModule()

    return () => {
      mounted = false
    }
  }, [onLoad])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="bg-bg-dark absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="border-primary-mid h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-text-muted font-mono text-xs tracking-widest uppercase">
              Loading Engine
            </span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        className="h-full w-full"
        style={{ visibility: loading ? 'hidden' : 'visible' }}
      />
    </div>
  )
}
