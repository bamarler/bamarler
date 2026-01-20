'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import SlingshotUI, { GameState } from '@/components/slingshot/SlingshotUI'
import Leaderboard from '@/components/slingshot/Leaderboard'
import { useSlingshotGame } from '@/components/slingshot/useSlingshotGame'
import { Trophy } from 'lucide-react'

// Dynamic import to avoid SSR issues with WASM
const SlingshotCanvas = dynamic(
  () => import('@/components/slingshot/SlingshotCanvas'),
  { ssr: false },
)

interface SlingshotModule {
  resetGame: () => void
  setLevel: (levelId: number) => void
  getAttempts: () => number
  getCurrentLevel: () => number
  getGameState: () => number
  dismissRules: () => void
}

export default function SlingshotPage() {
  const [gameState, setGameState] = useState(GameState.Rules)
  const [attempts, setAttempts] = useState(0)
  const [levelId, setLevelId] = useState(1)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [pendingWin, setPendingWin] = useState<{
    levelId: number
    attempts: number
  } | null>(null)

  const moduleRef = useRef<SlingshotModule | null>(null)
  const { playerId, playerName, setPlayerName, saveAttempt, isNewPlayer } =
    useSlingshotGame()

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Poll game state from WASM (since we can't get callbacks for all state changes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (moduleRef.current) {
        setAttempts(moduleRef.current.getAttempts())
        setGameState(moduleRef.current.getGameState())
        setLevelId(moduleRef.current.getCurrentLevel())
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleWin = useCallback(
    async (levelId: number, attempts: number) => {
      if (isNewPlayer) {
        // Prompt for name before saving
        setPendingWin({ levelId, attempts })
        setShowNamePrompt(true)
      } else if (playerId) {
        await saveAttempt(levelId, attempts)
      }
    },
    [isNewPlayer, playerId, saveAttempt],
  )

  const handleNameSubmit = useCallback(
    async (name: string) => {
      await setPlayerName(name)
      setShowNamePrompt(false)

      if (pendingWin) {
        // Wait a bit for playerId to update, then save
        setTimeout(async () => {
          await saveAttempt(pendingWin.levelId, pendingWin.attempts)
          setPendingWin(null)
        }, 100)
      }
    },
    [setPlayerName, pendingWin, saveAttempt],
  )

  const handleLose = useCallback(() => {
    // Just update state, no need to save
  }, [])

  const handleReset = useCallback(() => {
    moduleRef.current?.retryLevel()
  }, [])

  const handleDismissRules = useCallback(() => {
    moduleRef.current?.dismissRules()
  }, [])

  const handleLoad = useCallback((module: SlingshotModule) => {
    moduleRef.current = module
  }, [])

  return (
    <div className="selection:bg-primary-light/30 bg-bg-dark fixed inset-0 flex flex-col overflow-hidden text-white">
      <SlingshotCanvas
        onWin={handleWin}
        onLose={handleLose}
        onLoad={handleLoad}
      />

      <SlingshotUI
        gameState={gameState}
        attempts={attempts}
        levelId={levelId}
        onReset={handleReset}
        onDismissRules={handleDismissRules}
      />

      {/* Leaderboard Button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="pointer-events-auto absolute right-6 bottom-6 z-[100] flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs backdrop-blur-md transition-all hover:bg-white/10"
      >
        <Trophy size={16} className="text-accent-primary" />
        Leaderboard
      </button>

      <Leaderboard
        levelId={levelId}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="pointer-events-none fixed inset-0 z-[250] flex items-center justify-center">
          <div className="pointer-events-auto absolute inset-0 bg-black/70" />
          <div className="bg-bg-surface pointer-events-auto relative w-full max-w-sm rounded-3xl border border-white/10 p-8">
            <h2 className="mb-2 text-xl font-bold">Nice work!</h2>
            <p className="mb-6 text-sm text-zinc-400">
              Enter your name to save your score to the leaderboard.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const input = form.elements.namedItem(
                  'name',
                ) as HTMLInputElement
                handleNameSubmit(input.value)
              }}
            >
              <input
                name="name"
                type="text"
                placeholder="Your name"
                maxLength={20}
                autoFocus
                className="focus:border-accent-primary mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNamePrompt(false)
                    setPendingWin(null)
                  }}
                  className="flex-1 rounded-xl border border-white/10 py-3 font-medium transition-all hover:bg-white/5"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="bg-accent-primary flex-1 rounded-xl py-3 font-bold text-black transition-all hover:scale-105"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
