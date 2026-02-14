import { NextResponse } from 'next/server'
import { getFreeBusy, getCalendarClient } from '@/lib/google-calendar'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

/**
 * GET /api/debug/calendar
 *
 * Debug endpoint to test Google Calendar connectivity.
 * Returns environment variable status, all calendars, and busy slots for the next 7 days.
 *
 * !! Remove or protect this endpoint before going to production !!
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const ownerTz = process.env.OWNER_TIMEZONE || 'America/New_York'

  const envCheck = {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_CALENDAR_IDS: process.env.GOOGLE_CALENDAR_IDS || '(not set — querying all calendars)',
    OWNER_TIMEZONE: ownerTz,
  }

  const missingEnvVars = Object.entries(envCheck)
    .filter(([key, val]) => key !== 'OWNER_TIMEZONE' && key !== 'GOOGLE_CALENDAR_IDS' && val === false)
    .map(([key]) => key)

  if (missingEnvVars.length > 0) {
    return NextResponse.json({
      status: 'error',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
      envCheck,
    })
  }

  // List all calendars (to help user pick which IDs to include)
  let calendarList: { summary: string; id: string }[] = []
  let calendarListError: string | null = null
  try {
    const calendar = getCalendarClient()
    const list = await calendar.calendarList.list({ maxResults: 250 })
    calendarList = (list.data.items || []).map((c) => ({
      summary: c.summary || '(unnamed)',
      id: c.id || '',
    }))
  } catch (err) {
    calendarListError = err instanceof Error ? err.message : String(err)
  }

  // Free/busy for the next 7 days (uses all calendars or GOOGLE_CALENDAR_IDS)
  const now = new Date()
  const timeMin = fromZonedTime(startOfDay(now), ownerTz).toISOString()
  const timeMax = fromZonedTime(endOfDay(addDays(now, 7)), ownerTz).toISOString()

  let freeBusyResult: unknown = null
  let freeBusyError: string | null = null
  try {
    const busy = await getFreeBusy(timeMin, timeMax)
    freeBusyResult = {
      count: busy.length,
      slots: busy.slice(0, 30),
      queryRange: { timeMin, timeMax },
    }
  } catch (err) {
    freeBusyError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({
    status: calendarListError || freeBusyError ? 'error' : 'ok',
    envCheck,
    calendarList,
    calendarListError,
    freeBusy: freeBusyResult,
    freeBusyError,
    hint: 'To control which calendars are queried, set GOOGLE_CALENDAR_IDS=id1,id2,id3 in your .env file. Copy IDs from the calendarList above.',
  })
}
