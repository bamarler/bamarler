'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const PLAYER_ID_KEY = 'slingshot_player_id'
const PLAYER_NAME_KEY = 'slingshot_player_name'

interface UseSlingshotGameReturn {
  playerId: string | null
  playerName: string | null
  setPlayerName: (name: string) => Promise<boolean>
  saveAttempt: (levelId: number, attempts: number) => Promise<void>
  needsName: boolean
  isReady: boolean
}

export function useSlingshotGame(): UseSlingshotGameReturn {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerNameState] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const initRef = useRef(false)

  // Initialize player on mount
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initPlayer = async () => {
      const storedId = localStorage.getItem(PLAYER_ID_KEY)
      const storedName = localStorage.getItem(PLAYER_NAME_KEY)

      if (storedId) {
        // Existing player
        setPlayerId(storedId)
        setPlayerNameState(storedName)
        setIsReady(true)
      } else {
        // Create anonymous player immediately
        const { data, error } = await supabase
          .from('slingshot_players')
          .insert({})
          .select('id')
          .single()

        if (error) {
          console.error('Failed to create player:', error)
          setIsReady(true)
          return
        }

        localStorage.setItem(PLAYER_ID_KEY, data.id)
        setPlayerId(data.id)
        setIsReady(true)
      }
    }

    initPlayer()
  }, [])

  const setPlayerName = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmedName = name.trim().slice(0, 20)
      if (!trimmedName || !playerId) return false

      const { error } = await supabase.rpc('set_player_name', {
        p_player_id: playerId,
        p_name: trimmedName,
      })

      if (error) {
        console.error('Failed to set player name:', error)
        return false
      }

      localStorage.setItem(PLAYER_NAME_KEY, trimmedName)
      setPlayerNameState(trimmedName)
      return true
    },
    [playerId],
  )

  const saveAttempt = useCallback(
    async (levelId: number, attempts: number) => {
      if (!playerId) return

      const { error } = await supabase.rpc('upsert_level_attempt', {
        p_player_id: playerId,
        p_level_id: levelId,
        p_attempts: attempts,
      })

      if (error) {
        console.error('Failed to save attempt:', error)
      }
    },
    [playerId],
  )

  return {
    playerId,
    playerName,
    setPlayerName,
    saveAttempt,
    needsName: isReady && !playerName,
    isReady,
  }
}
