import { NextRequest, NextResponse } from 'next/server'
import { getFreeBusy } from '@/lib/google-calendar'
import { supabase } from '@/lib/supabase'
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  format,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

interface DayAvailability {
  date: string
  dayOfWeek: number
  available: boolean
  startTime: string | null
  endTime: string | null
  slotDurationMinutes: number
  busySlots: { start: string; end: string }[]
}

/**
 * GET /api/availability/week?start=YYYY-MM-DD&timezone=America/New_York
 *
 * Returns availability settings + busy blocks for Mon-Fri of the week
 * containing the `start` date. The client uses this to render a weekly
 * calendar grid and compute valid hover slots locally.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startStr = searchParams.get('start')
    const visitorTz = searchParams.get('timezone') || 'America/New_York'
    const ownerTz = process.env.OWNER_TIMEZONE || 'America/New_York'

    if (!startStr || !/^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
      return NextResponse.json(
        { error: 'Valid start parameter required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Compute Monday-Friday of the week containing `start`
    const inputDate = new Date(startStr + 'T12:00:00') // noon to avoid TZ edge
    const weekStart = startOfWeek(inputDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(inputDate, { weekStartsOn: 1 }) // Sunday

    // Don't allow fetching more than ~10 weeks in advance
    const maxDate = addWeeks(new Date(), 10)
    if (weekStart > maxDate) {
      return NextResponse.json(
        { error: 'Cannot view availability that far in advance' },
        { status: 400 }
      )
    }

    // 1. Get all availability settings (Mon-Fri = days 1-5)
    const { data: allSettings, error: settingsError } = await supabase
      .from('availability_settings')
      .select('*')
      .in('day_of_week', [1, 2, 3, 4, 5])
      .eq('is_active', true)

    if (settingsError) {
      console.error('availability_settings query failed:', settingsError)
    }

    // Default availability for Mon-Fri if no DB rows exist
    const DEFAULT_SETTINGS = {
      start_time: '09:00',
      end_time: '20:00',
      slot_duration_minutes: 30,
      is_active: true,
    }

    const settingsMap = new Map<number, { start_time: string; end_time: string; slot_duration_minutes: number; is_active: boolean }>(
      (allSettings || []).map((s: { day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number; is_active: boolean }) => [s.day_of_week, s])
    )

    // 2. Get busy times from Google Calendar for the full week
    const weekStartUtc = fromZonedTime(startOfDay(weekStart), ownerTz)
    const weekEndUtc = fromZonedTime(endOfDay(addDays(weekStart, 4)), ownerTz) // Through Friday

    let busySlots: { start: string; end: string }[] = []
    try {
      const rawBusy = await getFreeBusy(
        weekStartUtc.toISOString(),
        weekEndUtc.toISOString()
      )
      busySlots = rawBusy
        .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
        .map((b) => ({ start: b.start, end: b.end }))
    } catch (calendarError) {
      console.error('Google Calendar API error:', calendarError)
    }

    // 3. Get existing bookings for the week
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .gte('start_time', weekStartUtc.toISOString())
      .lte('start_time', weekEndUtc.toISOString())
      .in('status', ['pending_verification', 'pending_approval', 'approved'])

    if (existingBookings) {
      busySlots = [
        ...busySlots,
        ...existingBookings.map((b: { start_time: string; end_time: string }) => ({
          start: b.start_time,
          end: b.end_time,
        })),
      ]
    }

    // 4. Build day-by-day response for Mon-Fri
    const days: DayAvailability[] = []
    for (let i = 0; i < 5; i++) {
      const dayDate = addDays(weekStart, i)
      const dayOfWeek = dayDate.getDay() // 1=Mon through 5=Fri
      const dateStr = format(dayDate, 'yyyy-MM-dd')

      // Use DB settings if available, otherwise fall back to defaults for weekdays
      const settings = settingsMap.get(dayOfWeek) || DEFAULT_SETTINGS

      // Filter busy slots that fall on this day
      const dayStartUtc = fromZonedTime(startOfDay(dayDate), ownerTz)
      const dayEndUtc = fromZonedTime(endOfDay(dayDate), ownerTz)

      const dayBusySlots = busySlots.filter((slot) => {
        const slotStart = new Date(slot.start).getTime()
        const slotEnd = new Date(slot.end).getTime()
        const dStart = dayStartUtc.getTime()
        const dEnd = dayEndUtc.getTime()
        return slotStart < dEnd && slotEnd > dStart
      })

      days.push({
        date: dateStr,
        dayOfWeek,
        available: true,
        startTime: settings.start_time,
        endTime: settings.end_time,
        slotDurationMinutes: settings.slot_duration_minutes ?? 30,
        busySlots: dayBusySlots,
      })
    }

    return NextResponse.json({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      days,
      ownerTimezone: ownerTz,
      visitorTimezone: visitorTz,
      slotDurationMinutes: 30,
    })
  } catch (error) {
    console.error('Weekly availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly availability' },
      { status: 500 }
    )
  }
}
