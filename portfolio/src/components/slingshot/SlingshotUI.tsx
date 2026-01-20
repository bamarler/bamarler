'use client'

import { useState } from 'react'
import {
  Settings,
  Target,
  RotateCcw,
  Home,
  RefreshCcw,
  X,
  Lock,
  Check,
} from 'lucide-react'
import Link from 'next/link'

// Game states from C++ enum
export const GameState = {
  Rules: 0,
  Aiming: 1,
  Launched: 2,
  Won: 3,
  Lost: 4,
} as const

interface SlingshotUIProps {
  gameState: number
  attempts: number
  levelId: number
  totalLevels: number
  maxUnlockedLevel: number
  onReset: () => void
  onDismissRules: () => void
  onNextLevel?: () => void
  onSelectLevel: (level: number) => void
}

export default function SlingshotUI({
  gameState,
  attempts,
  levelId,
  totalLevels,
  maxUnlockedLevel,
  onReset,
  onDismissRules,
  onNextLevel,
  onSelectLevel,
}: SlingshotUIProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleSelectLevel = (level: number) => {
    onSelectLevel(level)
    setShowMenu(false)
  }

  return (
    <>
      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] flex items-start justify-between p-6 md:p-8">
        <div className="pointer-events-auto flex gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <span className="mb-0.5 block text-[9px] font-bold text-zinc-500 uppercase">
              Level
            </span>
            <span className="font-mono text-lg text-primary-light">
              {levelId}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <span className="mb-0.5 block text-[9px] font-bold text-zinc-500 uppercase">
              Attempts
            </span>
            <span className="font-mono text-lg text-accent-primary">
              {attempts}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowMenu(true)}
            className="rounded-full border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/20"
            title="Menu"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="pointer-events-none absolute inset-0 z-[200] flex items-center justify-center">
          <div
            className="pointer-events-auto absolute inset-0 bg-black/70"
            onClick={() => setShowMenu(false)}
          />
          <div className="pointer-events-auto relative w-full max-w-sm rounded-3xl border border-white/10 bg-black/95 p-8 backdrop-blur-xl">
            <button
              onClick={() => setShowMenu(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="mb-6 text-xl font-bold">Menu</h2>

            {/* Actions */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => {
                  onReset()
                  setShowMenu(false)
                }}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10"
              >
                <RefreshCcw size={20} />
                <span className="text-xs">Restart</span>
              </button>
              <Link
                href="/"
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10"
              >
                <Home size={20} />
                <span className="text-xs">Exit</span>
              </Link>
            </div>

            {/* Level Selection */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-zinc-400">
                Select Level
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalLevels }, (_, i) => i + 1).map((level) => {
                  const isUnlocked = level <= maxUnlockedLevel
                  const isCurrent = level === levelId
                  return (
                    <button
                      key={level}
                      onClick={() => isUnlocked && handleSelectLevel(level)}
                      disabled={!isUnlocked}
                      className={`relative flex h-12 items-center justify-center rounded-lg border font-mono text-sm transition-all ${
                        isCurrent
                          ? 'border-accent-primary bg-accent-primary/20 text-accent-primary'
                          : isUnlocked
                            ? 'border-white/10 bg-white/5 hover:bg-white/10'
                            : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          {level}
                          {isCurrent && (
                            <Check
                              size={10}
                              className="absolute top-1 right-1"
                            />
                          )}
                        </>
                      ) : (
                        <Lock size={14} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Overlay */}
      {gameState === GameState.Rules && (
        <div className="pointer-events-none absolute inset-0 z-[150] flex items-center justify-center">
          <div className="pointer-events-auto max-w-md rounded-3xl border border-white/10 bg-black/95 p-10 text-center backdrop-blur-xl">
            <h2 className="mb-4 text-2xl font-bold">How to Play</h2>
            <ul className="mb-8 space-y-2 text-left text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-accent-primary">1.</span>
                <span>Click and drag from the launch point</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary">2.</span>
                <span>Release to launch - pull back further for more power</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary">3.</span>
                <span>Use gravity wells to slingshot toward the goal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary">4.</span>
                <span>Avoid crashing into planets!</span>
              </li>
            </ul>
            <button
              onClick={onDismissRules}
              className="w-full rounded-xl bg-accent-primary py-3 font-bold text-black transition-all hover:scale-105"
            >
              Start Playing
            </button>
          </div>
        </div>
      )}

      {/* Win Overlay */}
      {gameState === GameState.Won && (
        <div className="pointer-events-none absolute inset-0 z-[150] flex items-center justify-center">
          <div className="animate-in zoom-in pointer-events-auto rounded-3xl border border-accent-primary/50 bg-black/95 p-12 text-center backdrop-blur-xl duration-300">
            <Target size={64} className="mx-auto mb-6 text-accent-primary" />
            <h2 className="mb-2 text-4xl font-black tracking-tight">
              Level Complete!
            </h2>
            <p className="mb-8 font-mono text-sm text-zinc-500">
              Completed in {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 font-bold transition-all hover:bg-white/10"
              >
                <RotateCcw size={16} className="mr-2 inline" />
                Retry
              </button>
              {onNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="flex-1 rounded-xl bg-accent-primary py-3 font-bold text-black transition-all hover:scale-105"
                >
                  Next Level
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lost Overlay */}
      {gameState === GameState.Lost && (
        <div className="pointer-events-none absolute inset-0 z-[150] flex items-center justify-center">
          <div className="animate-in slide-in-from-bottom-8 pointer-events-auto rounded-3xl border border-red-500/30 bg-black/95 p-12 text-center backdrop-blur-xl duration-200">
            <h2 className="mb-6 text-3xl font-black text-red-500">
              Mission Failed
            </h2>
            <button
              onClick={onReset}
              className="rounded-xl bg-white px-12 py-3 font-bold text-black transition-all hover:bg-zinc-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </>
  )
}
