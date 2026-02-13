import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { bookingSchema } from '@/lib/validation'
import { parseBookingTime } from '@/lib/availability'
import { verifyTurnstile } from '@/lib/turnstile'
import { emailRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'
import { addMinutes, addHours } from 'date-fns'

/**
 * POST /api/book
 *
 * Creates a new booking request. The booking starts in 'pending_verification'
 * status and advances to 'pending_approval' after email verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate input with Zod
    const parseResult = bookingSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // 2. Check honeypot (silent rejection for bots)
    if (data.website && data.website.length > 0) {
      // Return success to fool the bot, but don't create booking
      return NextResponse.json({ success: true, message: 'Booking submitted' })
    }

    // 3. Verify Turnstile CAPTCHA (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const turnstileValid = await verifyTurnstile(data.turnstileToken)
      if (!turnstileValid) {
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // 4. Check email-based rate limit (3 bookings per day per email)
    const { success: withinRateLimit } = await emailRateLimit.limit(data.email)
    if (!withinRateLimit) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // 5. Parse booking times
    const startTime = parseBookingTime(data.date, data.startTime, data.timezone)
    const slotDuration = 30 // TODO: Get from availability settings
    const endTime = addMinutes(new Date(startTime), slotDuration).toISOString()

    // 6. Generate tokens
    const verificationToken = crypto.randomUUID()
    const approvalToken = crypto.randomUUID()
    const verificationExpiresAt = addHours(new Date(), 24).toISOString()

    // 7. Create booking in database
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        guest_name: data.name,
        guest_email: data.email,
        start_time: startTime,
        end_time: endTime,
        booker_timezone: data.timezone,
        topic: data.topic,
        notes: data.notes || null,
        meeting_preference: data.meetingPreference,
        custom_meeting_link: data.customMeetingLink || null,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt,
        approval_token: approvalToken,
        status: 'pending_verification',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create booking:', insertError)
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      )
    }

    // 8. Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/verify?token=${verificationToken}`

    try {
      await sendVerificationEmail(data.email, data.name, verificationUrl)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the request - the booking is created, they can request resend
    }

    return NextResponse.json({
      success: true,
      message: 'Please check your email to verify your booking request.',
      bookingId: booking.id,
    })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
