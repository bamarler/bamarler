'use client'

import { useState, useEffect, useCallback } from 'react'
import { WeeklyCalendar, type WeekData } from './WeeklyCalendar'
import { BookingForm } from './BookingForm'
import { addWeeks, addBusinessDays, startOfWeek, format } from 'date-fns'

type BookingStep = 'calendar' | 'details'

interface SelectedSlot {
  date: string
  start: string
  end: string
  displayTime: string
}

export function BookingWidget() {
  const [step, setStep] = useState<BookingStep>('calendar')
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>()
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timezone, setTimezone] = useState('America/New_York')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const earliestAvailable = addBusinessDays(new Date(), 2)
    return startOfWeek(earliestAvailable, { weekStartsOn: 1 })
  })

  // Detect visitor's timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(tz)
  }, [])

  // Fetch weekly availability
  const fetchWeek = useCallback(
    async (weekStart: Date) => {
      setLoading(true)
      try {
        const dateStr = format(weekStart, 'yyyy-MM-dd')
        const res = await fetch(
          `/api/availability/week?start=${dateStr}&timezone=${timezone}`,
        )
        const data = await res.json()
        if (res.ok) {
          setWeekData(data)
        } else {
          console.error('Failed to fetch week:', data.error)
          setWeekData(null)
        }
      } catch (err) {
        console.error('Failed to fetch weekly availability:', err)
        setWeekData(null)
      } finally {
        setLoading(false)
      }
    },
    [timezone],
  )

  useEffect(() => {
    fetchWeek(currentWeekStart)
  }, [currentWeekStart, fetchWeek])

  const handleWeekChange = useCallback(
    (direction: 'prev' | 'next') => {
      const offset = direction === 'next' ? 1 : -1
      const newWeek = addWeeks(currentWeekStart, offset)

      // Don't allow navigating to past weeks
      const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
      if (newWeek < thisWeek) return

      setCurrentWeekStart(newWeek)
    },
    [currentWeekStart],
  )

  const handleSlotSelect = useCallback((slot: SelectedSlot) => {
    setSelectedSlot(slot)
    setStep('details')
  }, [])

  const weekLabel = weekData
    ? `${format(new Date(weekData.weekStart + 'T12:00:00'), 'MMM d')} – ${format(
        new Date(
          new Date(weekData.weekStart + 'T12:00:00').getTime() +
            4 * 24 * 60 * 60 * 1000,
        ),
        'MMM d, yyyy',
      )}`
    : format(currentWeekStart, 'MMM d, yyyy')

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col md:flex-none">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm md:flex-none md:p-6">
        {/* Header — only shown on calendar step */}
        {step === 'calendar' && (
          <div className="mb-4 flex-shrink-0 text-center md:mb-6">
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-4xl">
              Book a{' '}
              <span className="text-gradient italic">Meeting</span>
            </h1>
            <p className="text-text-muted mx-auto mt-1 max-w-md text-xs md:mt-2 md:text-sm">
              Select a time that works for you and I&apos;ll get back to you
              soon.
            </p>
          </div>
        )}

        {step === 'calendar' && (
          <WeeklyCalendar
            weekData={weekData}
            loading={loading}
            onSlotSelect={handleSlotSelect}
            onWeekChange={handleWeekChange}
            weekLabel={weekLabel}
          />
        )}

        {step === 'details' && selectedSlot && (
          <div className="min-h-0 flex-1 overflow-y-auto md:flex-none">
            <BookingForm
              date={new Date(selectedSlot.date + 'T12:00:00')}
              slot={{
                start: selectedSlot.start,
                end: selectedSlot.end,
                displayTime: selectedSlot.displayTime,
              }}
              timezone={timezone}
              onBack={() => setStep('calendar')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
