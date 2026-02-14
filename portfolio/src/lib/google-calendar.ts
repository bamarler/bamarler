import { google } from 'googleapis'

/**
 * Creates an OAuth2 client with the stored refresh token.
 * The refresh token is obtained once via the /api/auth/google setup route
 * and stored in environment variables.
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })
  return oauth2Client
}

/**
 * Returns a configured Google Calendar API client.
 */
export function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getOAuth2Client() })
}

/**
 * Query free/busy information for a date range across all calendars.
 *
 * Set GOOGLE_CALENDAR_IDS env var to a comma-separated list of calendar IDs
 * to control which calendars are queried. If not set, fetches all calendars
 * from the account.
 */
export async function getFreeBusy(timeMin: string, timeMax: string) {
  const calendar = getCalendarClient()
  const ownerTz = process.env.OWNER_TIMEZONE || 'America/New_York'

  // Determine which calendars to query
  let calendarIds: string[]
  const envIds = process.env.GOOGLE_CALENDAR_IDS
  if (envIds) {
    calendarIds = envIds.split(',').map((id) => id.trim()).filter(Boolean)
  } else {
    // Fetch all calendars from the account
    const list = await calendar.calendarList.list({ maxResults: 250 })
    calendarIds = (list.data.items || [])
      .map((c) => c.id)
      .filter((id): id is string => !!id)
  }

  if (calendarIds.length === 0) {
    calendarIds = ['primary']
  }

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: ownerTz,
      items: calendarIds.map((id) => ({ id })),
    },
  })

  // Merge busy slots from all calendars
  const allBusy: Array<{ start?: string | null; end?: string | null }> = []
  const calendars = response.data.calendars
  if (calendars) {
    for (const calId of Object.keys(calendars)) {
      const busy = calendars[calId]?.busy
      if (busy) {
        allBusy.push(...busy)
      }
    }
  }

  return allBusy
}

export interface CreateEventParams {
  summary: string
  startTime: string
  endTime: string
  attendeeEmail: string
  meetingPreference: 'google_meet' | 'custom_link' | 'phone'
  customMeetingLink?: string
  phoneNumber?: string
  notes?: string
}

/**
 * Creates a Google Calendar event with optional Google Meet link.
 * When sendUpdates is 'all', Google automatically sends invite emails.
 */
export async function createCalendarEvent({
  summary,
  startTime,
  endTime,
  attendeeEmail,
  meetingPreference,
  customMeetingLink,
  phoneNumber,
  notes,
}: CreateEventParams) {
  const calendar = getCalendarClient()
  const ownerTz = process.env.OWNER_TIMEZONE || 'America/New_York'

  const targetCalendar = process.env.GOOGLE_CALENDAR_TARGET_ID || 'primary'

  const event = await calendar.events.insert({
    calendarId: targetCalendar,
    conferenceDataVersion: meetingPreference === 'google_meet' ? 1 : 0,
    sendUpdates: 'all', // Google sends invite to attendees automatically
    requestBody: {
      summary,
      start: { dateTime: startTime, timeZone: ownerTz },
      end: { dateTime: endTime, timeZone: ownerTz },
      attendees: [{ email: attendeeEmail }],
      conferenceData:
        meetingPreference === 'google_meet'
          ? {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            }
          : undefined,
      description: buildEventDescription(
        meetingPreference,
        customMeetingLink,
        notes,
        phoneNumber
      ),
    },
  })

  return event.data
}

function buildEventDescription(
  meetingPreference: string,
  customMeetingLink?: string,
  notes?: string,
  phoneNumber?: string
): string | undefined {
  const parts: string[] = []

  if (meetingPreference === 'custom_link' && customMeetingLink) {
    parts.push(`Meeting link: ${customMeetingLink}`)
  } else if (meetingPreference === 'phone' && phoneNumber) {
    parts.push(`Phone call: ${phoneNumber}`)
  } else if (meetingPreference === 'phone') {
    parts.push('This meeting will be conducted via phone.')
  }

  if (notes) {
    parts.push(`\nNotes: ${notes}`)
  }

  return parts.length > 0 ? parts.join('\n') : undefined
}
