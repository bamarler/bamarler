import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/google-calendar'

/**
 * GET /api/bookings/approve?token=<approval_token>
 *
 * Approves a booking and creates a Google Calendar event.
 * Called when the owner clicks the approve link in their notification email.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(
      new URL('/book/error?reason=missing_token', appUrl)
    )
  }

  try {
    // Find booking by approval token
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('approval_token', token)
      .eq('status', 'pending_approval')
      .single()

    if (findError || !booking) {
      console.error('Booking not found:', findError)
      return NextResponse.redirect(
        new URL('/book/error?reason=invalid_token', appUrl)
      )
    }

    // Create Google Calendar event
    let eventId: string | undefined

    try {
      const event = await createCalendarEvent({
        summary: `Meeting with ${booking.guest_name}: ${booking.topic}`,
        startTime: booking.start_time,
        endTime: booking.end_time,
        attendeeEmail: booking.guest_email,
        meetingPreference: booking.meeting_preference,
        customMeetingLink: booking.custom_meeting_link,
        phoneNumber: booking.phone_number,
        notes: booking.notes,
      })

      eventId = event.id || undefined

      // Google Calendar automatically sends invite email to attendee
      // when sendUpdates: 'all' is set in createCalendarEvent
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError)
      // Continue anyway - we can create the event manually later
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'approved',
        google_calendar_event_id: eventId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.redirect(
        new URL('/book/error?reason=update_failed', appUrl)
      )
    }

    return NextResponse.redirect(new URL('/book/approved', appUrl))
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.redirect(new URL('/book/error?reason=unknown', appUrl))
  }
}
