import {
  addMinutes,
  format,
  parse,
  isAfter,
  isBefore,
  startOfDay,
  setHours,
  setMinutes,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export interface TimeSlot {
  start: string // ISO string
  end: string // ISO string
  displayTime: string // e.g., "9:00 AM"
}

export interface BusySlot {
  start: string
  end: string
}

export interface AvailabilitySetting {
  start_time: string // "09:00"
  end_time: string // "17:00"
  slot_duration_minutes: number
  is_active: boolean
}

/**
 * Generates all possible time slots for a given date based on availability settings.
 * Then filters out slots that overlap with busy times from Google Calendar.
 */
export function generateAvailableSlots(
  date: Date,
  settings: AvailabilitySetting,
  busySlots: BusySlot[],
  ownerTimezone: string,
  visitorTimezone: string
): TimeSlot[] {
  if (!settings.is_active) {
    return []
  }

  const slots: TimeSlot[] = []
  const slotDuration = settings.slot_duration_minutes || 30

  // Parse start and end times in owner's timezone
  const dayStart = startOfDay(toZonedTime(date, ownerTimezone))

  const [startHour, startMin] = settings.start_time.split(':').map(Number)
  const [endHour, endMin] = settings.end_time.split(':').map(Number)

  let currentSlotStart = setMinutes(setHours(dayStart, startHour), startMin)
  const dayEnd = setMinutes(setHours(dayStart, endHour), endMin)

  // Don't show slots in the past (with 1 hour buffer)
  const now = new Date()
  const minBookingTime = addMinutes(now, 60)

  while (isBefore(addMinutes(currentSlotStart, slotDuration), dayEnd)) {
    const slotEnd = addMinutes(currentSlotStart, slotDuration)

    // Convert to UTC for comparison
    const slotStartUtc = fromZonedTime(currentSlotStart, ownerTimezone)
    const slotEndUtc = fromZonedTime(slotEnd, ownerTimezone)

    // Skip if slot is in the past
    if (isAfter(slotStartUtc, minBookingTime)) {
      // Check if slot overlaps with any busy period
      const isAvailable = !busySlots.some((busy) =>
        slotsOverlap(
          slotStartUtc.toISOString(),
          slotEndUtc.toISOString(),
          busy.start,
          busy.end
        )
      )

      if (isAvailable) {
        // Convert to visitor's timezone for display
        const displayTime = toZonedTime(slotStartUtc, visitorTimezone)

        slots.push({
          start: slotStartUtc.toISOString(),
          end: slotEndUtc.toISOString(),
          displayTime: format(displayTime, 'h:mm a'),
        })
      }
    }

    currentSlotStart = addMinutes(currentSlotStart, slotDuration)
  }

  return slots
}

/**
 * Checks if two time ranges overlap.
 */
function slotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()

  // Slots overlap if one starts before the other ends
  return s1 < e2 && s2 < e1
}

/**
 * Parses a date string and time string into a UTC ISO string.
 */
export function parseBookingTime(
  dateStr: string,
  timeStr: string,
  timezone: string
): string {
  // Parse as local time in the specified timezone
  const localDateTime = parse(
    `${dateStr} ${timeStr}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  )

  // Convert from visitor's timezone to UTC
  const utcDateTime = fromZonedTime(localDateTime, timezone)

  return utcDateTime.toISOString()
}

/**
 * Formats a UTC time for display in a specific timezone.
 */
export function formatTimeForDisplay(
  utcIsoString: string,
  timezone: string
): string {
  const zonedTime = toZonedTime(new Date(utcIsoString), timezone)
  return format(zonedTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')
}
