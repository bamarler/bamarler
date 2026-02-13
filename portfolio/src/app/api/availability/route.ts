import { NextRequest, NextResponse } from 'next/server'
import { getFreeBusy } from '@/lib/google-calendar'
import { supabase } from '@/lib/supabase'
import { generateAvailableSlots } from '@/lib/availability'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

/**
 * GET /api/availability?date=YYYY-MM-DD&timezone=America/New_York
 *
 * Returns available time slots for a given date, taking into account:
 * 1. Owner's availability settings (working hours)
 * 2. Busy times from Google Calendar
 * 3. Existing pending/approved bookings
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date')
    const visitorTz = searchParams.get('timezone') || 'America/New_York'

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'Valid date parameter required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const ownerTz = process.env.OWNER_TIMEZONE || 'America/New_York'
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()

    // Don't allow booking more than 60 days in advance
    const maxDate = addDays(new Date(), 60)
    if (date > maxDate) {
      return NextResponse.json({
        slots: [],
        message: 'Cannot book more than 60 days in advance',
      })
    }

    // Don't allow booking in the past
    if (date < startOfDay(new Date())) {
      return NextResponse.json({
        slots: [],
        message: 'Cannot book dates in the past',
      })
    }

    // 1. Get owner's availability settings for this day of week
    const DEFAULT_SETTINGS = {
      start_time: '09:00',
      end_time: '20:00',
      slot_duration_minutes: 30,
      is_active: true,
    }

    const { data: dbSettings, error: settingsError } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single()

    if (settingsError) {
      console.error('availability_settings query failed:', {
        dayOfWeek,
        error: settingsError?.message ?? settingsError,
        hint: settingsError?.hint,
        details: settingsError?.details,
        hasData: !!dbSettings,
      })
    }

    // Fall back to defaults if no DB row exists (weekdays only)
    if (!dbSettings && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return NextResponse.json({
        slots: [],
        message: 'Not available on this day',
      })
    }

    const settings = dbSettings || DEFAULT_SETTINGS

    // 2. Query Google Calendar for busy times
    const dayStartUtc = fromZonedTime(startOfDay(date), ownerTz)
    const dayEndUtc = fromZonedTime(endOfDay(date), ownerTz)

    let busySlots: { start: string; end: string }[] = []

    try {
      const rawBusy = await getFreeBusy(
        dayStartUtc.toISOString(),
        dayEndUtc.toISOString()
      )
      busySlots = rawBusy
        .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
        .map((b) => ({ start: b.start, end: b.end }))
    } catch (calendarError) {
      console.error('Google Calendar API error:', calendarError)
      // Continue without calendar data - availability will be based on settings only
    }

    // 3. Get existing pending/approved bookings for this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .gte('start_time', dayStartUtc.toISOString())
      .lte('start_time', dayEndUtc.toISOString())
      .in('status', ['pending_verification', 'pending_approval', 'approved'])

    // Merge existing bookings into busy slots
    if (existingBookings) {
      busySlots = [
        ...busySlots,
        ...existingBookings.map((b) => ({
          start: b.start_time,
          end: b.end_time,
        })),
      ]
    }

    // 4. Generate available slots
    const slots = generateAvailableSlots(
      date,
      settings,
      busySlots,
      ownerTz,
      visitorTz
    )

    return NextResponse.json({
      slots,
      date: dateStr,
      timezone: visitorTz,
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
