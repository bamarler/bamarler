import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendOwnerNotification } from '@/lib/email'

/**
 * GET /api/bookings/verify?token=<verification_token>
 *
 * Verifies a booking request after the user clicks the email link.
 * Advances the booking from pending_verification to pending_approval.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  if (!token) {
    return NextResponse.redirect(
      new URL('/book/error?reason=missing_token', appUrl)
    )
  }

  try {
    // Find booking by verification token
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('verification_token', token)
      .eq('status', 'pending_verification')
      .single()

    if (findError || !booking) {
      console.error('Booking not found:', findError)
      return NextResponse.redirect(
        new URL('/book/error?reason=invalid_token', appUrl)
      )
    }

    // Check if verification link has expired
    if (
      booking.verification_expires_at &&
      new Date(booking.verification_expires_at) < new Date()
    ) {
      return NextResponse.redirect(
        new URL('/book/error?reason=expired', appUrl)
      )
    }

    // Update booking status to pending_approval
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'pending_approval',
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
        verification_expires_at: null,
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.redirect(
        new URL('/book/error?reason=update_failed', appUrl)
      )
    }

    // Send notification to owner
    try {
      await sendOwnerNotification({
        id: booking.id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        start_time: booking.start_time,
        end_time: booking.end_time,
        topic: booking.topic,
        notes: booking.notes,
        meeting_preference: booking.meeting_preference,
        approval_token: booking.approval_token,
      })
    } catch (emailError) {
      console.error('Failed to send owner notification:', emailError)
      // Don't fail - the booking is verified, owner can check dashboard
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/book/verified', appUrl))
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/book/error?reason=unknown', appUrl))
  }
}
