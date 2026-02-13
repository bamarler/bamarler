'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  format,
  addMinutes,
  isBefore,
  addBusinessDays,
  addDays,
  isWeekend,
} from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface BusySlot {
  start: string
  end: string
}

export interface DayData {
  date: string
  dayOfWeek: number
  available: boolean
  startTime: string | null
  endTime: string | null
  slotDurationMinutes: number
  busySlots: BusySlot[]
}

export interface WeekData {
  weekStart: string
  days: DayData[]
  ownerTimezone: string
  visitorTimezone: string
  slotDurationMinutes: number
}

interface SelectedSlot {
  date: string
  start: string // ISO
  end: string // ISO
  displayTime: string
}

interface WeeklyCalendarProps {
  weekData: WeekData | null
  loading: boolean
  onSlotSelect: (slot: SelectedSlot) => void
  onWeekChange: (direction: 'prev' | 'next') => void
  weekLabel: string
}

const SLOT_HEIGHT = 28 // px per 30-min slot
const TIME_LABEL_WIDTH = 56 // px
const MIN_BUSINESS_DAYS_LEAD = 2
const MOBILE_SLOT_INCREMENT = 15 // minutes between start times on mobile
const MEETING_DURATION = 30 // minutes

export function WeeklyCalendar({
  weekData,
  loading,
  onSlotSelect,
  onWeekChange,
  weekLabel,
}: WeeklyCalendarProps) {
  const [hoveredSlot, setHoveredSlot] = useState<{
    dayIndex: number
    slotIndex: number
    valid: boolean
  } | null>(null)

  // Mobile: track current day by date string for cross-week navigation
  const [mobileDateStr, setMobileDateStr] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const ownerTz = weekData?.ownerTimezone || 'America/New_York'
  const visitorTz = weekData?.visitorTimezone || 'America/New_York'

  // Compute the time axis (rows) from the earliest start to latest end
  const { timeSlots, startHour } = useMemo(() => {
    if (!weekData?.days.length) {
      return { timeSlots: [] as string[], startHour: 9 }
    }

    let minStart = 24
    let maxEnd = 0
    for (const day of weekData.days) {
      if (day.available && day.startTime && day.endTime) {
        const [sh, sm] = day.startTime.split(':').map(Number)
        const [eh, em] = day.endTime.split(':').map(Number)
        const startDecimal = sh + sm / 60
        const endDecimal = eh + em / 60
        if (startDecimal < minStart) minStart = startDecimal
        if (endDecimal > maxEnd) maxEnd = endDecimal
      }
    }

    if (minStart >= maxEnd) {
      minStart = 9
      maxEnd = 20
    }

    const sHour = Math.floor(minStart)
    const eHour = Math.ceil(maxEnd)
    const slots: string[] = []
    for (let h = sHour; h < eHour; h++) {
      slots.push(`${h}:00`)
      slots.push(`${h}:30`)
    }

    return { timeSlots: slots, startHour: sHour }
  }, [weekData])

  // Find the first available day (2+ business days out)
  const firstAvailableDate = useMemo(() => {
    const earliest = addBusinessDays(new Date(), MIN_BUSINESS_DAYS_LEAD)
    earliest.setHours(0, 0, 0, 0)
    // Skip to next weekday if needed
    let d = earliest
    while (isWeekend(d)) d = addDays(d, 1)
    return format(d, 'yyyy-MM-dd')
  }, [])

  // Current mobile day — default to first available
  const currentMobileDate = mobileDateStr || firstAvailableDate

  // Find the current mobile day data in weekData
  const mobileDayData = useMemo(() => {
    if (!weekData) return null
    return weekData.days.find((d) => d.date === currentMobileDate) || null
  }, [weekData, currentMobileDate])

  // Check if a slot overlaps any busy period
  const isSlotBusy = useCallback(
    (day: DayData, slotStartUtc: Date, slotEndUtc: Date): boolean => {
      return day.busySlots.some((busy) => {
        const busyStart = new Date(busy.start).getTime()
        const busyEnd = new Date(busy.end).getTime()
        return (
          slotStartUtc.getTime() < busyEnd && slotEndUtc.getTime() > busyStart
        )
      })
    },
    [],
  )

  // Check if a slot is too soon (must be at least 2 business days out)
  const isSlotTooSoon = useCallback((slotStartUtc: Date): boolean => {
    const earliestBookable = addBusinessDays(new Date(), MIN_BUSINESS_DAYS_LEAD)
    earliestBookable.setHours(0, 0, 0, 0)
    return isBefore(slotStartUtc, earliestBookable)
  }, [])

  // Convert a time label like "9:00" to a UTC Date for a given day
  const timeToUtc = useCallback(
    (day: DayData, timeStr: string): Date => {
      const [h, m] = timeStr.split(':').map(Number)
      const dateObj = new Date(day.date + 'T00:00:00')
      dateObj.setHours(h, m, 0, 0)
      return fromZonedTime(dateObj, ownerTz)
    },
    [ownerTz],
  )

  // Convert hour:minute to UTC for a day
  const hmToUtc = useCallback(
    (dayDate: string, h: number, m: number): Date => {
      const dateObj = new Date(dayDate + 'T00:00:00')
      dateObj.setHours(h, m, 0, 0)
      return fromZonedTime(dateObj, ownerTz)
    },
    [ownerTz],
  )

  // Desktop: handle slot click on the grid
  const handleSlotClick = useCallback(
    (dayIndex: number, slotIndex: number) => {
      if (!weekData) return
      const day = weekData.days[dayIndex]
      if (!day.available) return

      const timeStr = timeSlots[slotIndex]
      const slotStartUtc = timeToUtc(day, timeStr)
      const slotEndUtc = addMinutes(slotStartUtc, MEETING_DURATION)

      if (
        isSlotTooSoon(slotStartUtc) ||
        isSlotBusy(day, slotStartUtc, slotEndUtc)
      )
        return

      if (!day.startTime || !day.endTime) return
      const workStart = timeToUtc(day, day.startTime)
      const workEnd = timeToUtc(day, day.endTime)
      if (
        slotStartUtc.getTime() < workStart.getTime() ||
        slotEndUtc.getTime() > workEnd.getTime()
      )
        return

      const displayTime = format(toZonedTime(slotStartUtc, visitorTz), 'h:mm a')

      onSlotSelect({
        date: day.date,
        start: slotStartUtc.toISOString(),
        end: slotEndUtc.toISOString(),
        displayTime,
      })
    },
    [weekData, timeSlots, timeToUtc, isSlotTooSoon, isSlotBusy, visitorTz, onSlotSelect],
  )

  // Mobile: handle slot button click
  const handleMobileSlotClick = useCallback(
    (day: DayData, h: number, m: number) => {
      const slotStartUtc = hmToUtc(day.date, h, m)
      const slotEndUtc = addMinutes(slotStartUtc, MEETING_DURATION)

      const displayTime = format(toZonedTime(slotStartUtc, visitorTz), 'h:mm a')

      onSlotSelect({
        date: day.date,
        start: slotStartUtc.toISOString(),
        end: slotEndUtc.toISOString(),
        displayTime,
      })
    },
    [hmToUtc, visitorTz, onSlotSelect],
  )

  const getSlotStatus = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
    ): 'available' | 'busy' | 'past' | 'outside' => {
      if (!weekData) return 'outside'
      const day = weekData.days[dayIndex]
      if (!day.available || !day.startTime || !day.endTime) return 'outside'

      const timeStr = timeSlots[slotIndex]
      const slotStartUtc = timeToUtc(day, timeStr)
      const slotEndUtc = addMinutes(slotStartUtc, MEETING_DURATION)

      const workStart = timeToUtc(day, day.startTime)
      const workEnd = timeToUtc(day, day.endTime)
      if (
        slotStartUtc.getTime() < workStart.getTime() ||
        slotEndUtc.getTime() > workEnd.getTime()
      ) {
        return 'outside'
      }

      if (isSlotTooSoon(slotStartUtc)) return 'past'
      if (isSlotBusy(day, slotStartUtc, slotEndUtc)) return 'busy'
      return 'available'
    },
    [weekData, timeSlots, timeToUtc, isSlotTooSoon, isSlotBusy],
  )

  // Total grid height in px (used for clipping)
  const totalGridHeight = timeSlots.length * SLOT_HEIGHT

  // Compute merged unavailable block positions for desktop overlay rendering.
  // This combines busy slots AND "too soon" time into one unified set,
  // merges overlaps, and clips to the grid boundary.
  const getUnavailableBlockPositions = useCallback(
    (dayIndex: number) => {
      if (!weekData) return []
      const day = weekData.days[dayIndex]
      if (!day.available || !day.startTime || !day.endTime) return []

      const [sh, sm] = day.startTime.split(':').map(Number)
      const [eh, em] = day.endTime.split(':').map(Number)
      const workStartMin = sh * 60 + sm
      const workEndMin = eh * 60 + em
      const gridStartMin = startHour * 60

      // Collect all unavailable intervals as {startMin, endMin} in owner-local time
      const intervals: { startMin: number; endMin: number }[] = []

      // Add "too soon" block: from work start to the earliest bookable time
      const earliestBookable = addBusinessDays(new Date(), MIN_BUSINESS_DAYS_LEAD)
      earliestBookable.setHours(0, 0, 0, 0)
      const dayDate = new Date(day.date + 'T12:00:00')
      if (isBefore(dayDate, earliestBookable)) {
        // Entire day is too soon
        intervals.push({ startMin: workStartMin, endMin: workEndMin })
      }

      // Add busy slots
      for (const busy of day.busySlots) {
        const busyStartLocal = toZonedTime(new Date(busy.start), ownerTz)
        const busyEndLocal = toZonedTime(new Date(busy.end), ownerTz)

        const bStartMin = busyStartLocal.getHours() * 60 + busyStartLocal.getMinutes()
        const bEndMin = busyEndLocal.getHours() * 60 + busyEndLocal.getMinutes()

        // Clamp to working hours
        const clampedStart = Math.max(bStartMin, workStartMin)
        const clampedEnd = Math.min(bEndMin, workEndMin)
        if (clampedStart < clampedEnd) {
          intervals.push({ startMin: clampedStart, endMin: clampedEnd })
        }
      }

      if (intervals.length === 0) return []

      // Sort by start time and merge overlapping intervals
      intervals.sort((a, b) => a.startMin - b.startMin)
      const merged: { startMin: number; endMin: number }[] = [intervals[0]]
      for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1]
        if (intervals[i].startMin <= last.endMin) {
          last.endMin = Math.max(last.endMin, intervals[i].endMin)
        } else {
          merged.push(intervals[i])
        }
      }

      // Convert to pixel positions, clipped to grid
      return merged.map((iv) => {
        const topPx = ((iv.startMin - gridStartMin) / 30) * SLOT_HEIGHT
        const bottomPx = ((iv.endMin - gridStartMin) / 30) * SLOT_HEIGHT
        const clippedTop = Math.max(0, topPx)
        const clippedBottom = Math.min(totalGridHeight, bottomPx)
        return {
          top: clippedTop,
          height: Math.max(0, clippedBottom - clippedTop),
        }
      }).filter((b) => b.height > 0)
    },
    [weekData, ownerTz, startHour, totalGridHeight],
  )

  // Mobile: compute available 15-min start times for a given day
  const mobileAvailableSlots = useMemo(() => {
    if (!mobileDayData || !mobileDayData.available) return []
    const day = mobileDayData
    if (!day.startTime || !day.endTime) return []

    const [sh, sm] = day.startTime.split(':').map(Number)
    const [eh, em] = day.endTime.split(':').map(Number)
    const workStartMin = sh * 60 + sm
    const workEndMin = eh * 60 + em

    const slots: { h: number; m: number; label: string }[] = []

    for (let min = workStartMin; min + MEETING_DURATION <= workEndMin; min += MOBILE_SLOT_INCREMENT) {
      const h = Math.floor(min / 60)
      const m = min % 60

      const slotStartUtc = hmToUtc(day.date, h, m)
      const slotEndUtc = addMinutes(slotStartUtc, MEETING_DURATION)

      if (isSlotTooSoon(slotStartUtc)) continue
      if (isSlotBusy(day, slotStartUtc, slotEndUtc)) continue

      const local = toZonedTime(slotStartUtc, visitorTz)
      slots.push({
        h,
        m,
        label: format(local, 'h:mm a'),
      })
    }

    return slots
  }, [mobileDayData, hmToUtc, isSlotTooSoon, isSlotBusy, visitorTz])

  // Mobile day navigation: skip weekends, jump to next/prev weekday
  const navigateMobileDay = useCallback(
    (direction: 'prev' | 'next') => {
      const current = new Date(currentMobileDate + 'T12:00:00')
      let next = addDays(current, direction === 'next' ? 1 : -1)

      // Skip weekends
      while (isWeekend(next)) {
        next = addDays(next, direction === 'next' ? 1 : -1)
      }

      // Don't go before the first available date
      const earliest = new Date(firstAvailableDate + 'T12:00:00')
      if (next < earliest) return

      // Don't go more than 10 weeks out
      const maxDate = addDays(new Date(), 70)
      if (next > maxDate) return

      const newDateStr = format(next, 'yyyy-MM-dd')
      setMobileDateStr(newDateStr)

      // If the new date is outside the current week data, trigger week change
      if (weekData) {
        const weekStartDate = new Date(weekData.weekStart + 'T12:00:00')
        const weekEndDate = addDays(weekStartDate, 4)
        if (next < weekStartDate || next > weekEndDate) {
          // Need to fetch a different week
          if (direction === 'next') {
            onWeekChange('next')
          } else {
            onWeekChange('prev')
          }
        }
      }
    },
    [currentMobileDate, firstAvailableDate, weekData, onWeekChange],
  )

  if (!weekData && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted">Unable to load availability.</p>
      </div>
    )
  }

  const days = weekData?.days || []

  // ─── DESKTOP GRID ─────────────────────────────────────────────
  const renderDesktopGrid = () => (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onWeekChange('prev')}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onWeekChange('next')}
          disabled={loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="border-primary-mid h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto">
            {/* Day headers */}
            <div className="flex" style={{ paddingLeft: TIME_LABEL_WIDTH }}>
              {days.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 border-b border-white/10 px-1 py-2 text-center"
                >
                  <div className="text-text-muted text-xs font-medium uppercase">
                    {format(new Date(day.date + 'T12:00:00'), 'EEE')}
                  </div>
                  <div className="text-sm font-semibold">
                    {format(new Date(day.date + 'T12:00:00'), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative flex" ref={gridRef}>
              {/* Time labels */}
              <div className="flex-shrink-0" style={{ width: TIME_LABEL_WIDTH }}>
                {timeSlots.map((time) => {
                  const [h, m] = time.split(':').map(Number)
                  if (m !== 0)
                    return <div key={time} style={{ height: SLOT_HEIGHT }} />
                  return (
                    <div
                      key={time}
                      className="text-text-muted pr-2 text-right text-xs leading-none"
                      style={{ height: SLOT_HEIGHT, paddingTop: 2 }}
                    >
                      {h === 0
                        ? '12 AM'
                        : h < 12
                          ? `${h} AM`
                          : h === 12
                            ? '12 PM'
                            : `${h - 12} PM`}
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => {
                const unavailablePositions = getUnavailableBlockPositions(dayIndex)

                return (
                  <div
                    key={day.date}
                    className="relative flex-1 overflow-hidden border-l border-white/5"
                  >
                    {/* Merged unavailable block overlays */}
                    {unavailablePositions.map((pos, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-primary-mid/20 pointer-events-none absolute right-0 left-0"
                        style={{ top: pos.top, height: pos.height }}
                      />
                    ))}

                    {/* Slot cells — only available slots get hover/click */}
                    {timeSlots.map((time, slotIdx) => {
                      const status = getSlotStatus(dayIndex, slotIdx)
                      const isHovered =
                        hoveredSlot?.dayIndex === dayIndex &&
                        hoveredSlot?.slotIndex === slotIdx

                      const isAvailable = status === 'available'

                      let cellClass =
                        'w-full border-b border-white/5 transition-colors duration-100 relative '

                      if (isAvailable) {
                        cellClass += isHovered
                          ? 'bg-accent-primary/25 cursor-pointer'
                          : 'hover:bg-accent-primary/10 cursor-pointer'
                      } else {
                        // All unavailable states (busy, past, outside) share the same look
                        cellClass += 'cursor-default'
                      }

                      return (
                        <div
                          key={time}
                          className={cellClass}
                          style={{ height: SLOT_HEIGHT }}
                          onMouseEnter={() =>
                            setHoveredSlot({
                              dayIndex,
                              slotIndex: slotIdx,
                              valid: isAvailable,
                            })
                          }
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={() => isAvailable && handleSlotClick(dayIndex, slotIdx)}
                        >
                          {isHovered && isAvailable && (
                            <div className="text-accent-primary flex h-full items-center justify-center text-xs font-medium">
                              {(() => {
                                const slotUtc = timeToUtc(day, time)
                                const local = toZonedTime(slotUtc, visitorTz)
                                return format(local, 'h:mm a')
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-text-muted text-center text-xs">
            Hover to preview time slots. Click an available slot to book.
            <br />
            All times are displayed in ET (Eastern Time).
          </p>
        </>
      )}
    </div>
  )

  // ─── MOBILE: Calendly-style day view with time buttons ────────
  const renderMobileView = () => (
    <div className="flex flex-1 flex-col">
      {/* Day navigator */}
      <div className="mb-4 flex flex-shrink-0 items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMobileDay('prev')}
          disabled={loading || currentMobileDate <= firstAvailableDate}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="text-sm font-semibold">
            {format(new Date(currentMobileDate + 'T12:00:00'), 'EEEE')}
          </div>
          <div className="text-text-muted text-xs">
            {format(new Date(currentMobileDate + 'T12:00:00'), 'MMMM d, yyyy')}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMobileDay('next')}
          disabled={loading}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Available time buttons */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="border-primary-mid h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : !mobileDayData ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted text-sm">
            Navigate to a weekday to see available times.
          </p>
        </div>
      ) : mobileAvailableSlots.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <div>
            <p className="text-text-muted text-sm">
              No available times on this day.
            </p>
            <p className="text-text-muted mt-1 text-xs">
              Try the next available day.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 px-1">
            {mobileAvailableSlots.map((slot) => (
              <Button
                key={`${slot.h}:${slot.m}`}
                variant="outline"
                className="h-11 text-sm"
                onClick={() => handleMobileSlotClick(mobileDayData, slot.h, slot.m)}
              >
                {slot.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Footer note — always visible */}
      <p className="text-text-muted mt-3 flex-shrink-0 text-center text-xs">
        30-minute meetings. All times in ET.
      </p>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">{renderDesktopGrid()}</div>

      {/* Mobile */}
      <div className="flex flex-1 flex-col md:hidden">{renderMobileView()}</div>
    </>
  )
}
