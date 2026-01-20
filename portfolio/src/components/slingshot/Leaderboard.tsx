'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, X } from 'lucide-react'

interface LeaderboardEntry {
  display_name: string
  level_id: number
  attempts: number
  rank: number
}

interface LeaderboardProps {
  levelId: number
  isOpen: boolean
  onClose: () => void
}

export default function Leaderboard({
  levelId,
  isOpen,
  onClose,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const fetchLeaderboard = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('slingshot_leaderboard')
        .select('*')
        .eq('level_id', levelId)
        .order('rank')
        .limit(10)

      if (error) {
        console.error('Failed to fetch leaderboard:', error)
      } else {
        setEntries(data || [])
      }
      setLoading(false)
    }

    fetchLeaderboard()
  }, [levelId, isOpen])

  if (!isOpen) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="pointer-events-auto absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-white/10 bg-bg-surface p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <Trophy className="text-accent-primary" size={24} />
          <h2 className="text-xl font-bold">Level {levelId} Leaderboard</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-mid border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">
            No completions yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  entry.rank === 1
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : entry.rank === 2
                      ? 'bg-zinc-400/10'
                      : entry.rank === 3
                        ? 'bg-amber-700/10'
                        : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-mono text-sm ${
                      entry.rank === 1
                        ? 'text-accent-primary'
                        : 'text-zinc-500'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-medium">{entry.display_name}</span>
                </div>
                <span className="font-mono text-sm text-zinc-400">
                  {entry.attempts} {entry.attempts === 1 ? 'try' : 'tries'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
