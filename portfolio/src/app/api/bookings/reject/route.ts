import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendRejectionEmail } from '@/lib/email'

/**
 * GET /api/bookings/reject?token=<approval_token>
 *
 * Rejects a booking request and notifies the booker.
 * Called when the owner clicks the reject link in their notification email.
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

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.redirect(
        new URL('/book/error?reason=update_failed', appUrl)
      )
    }

    // Send rejection email to booker
    try {
      await sendRejectionEmail(
        booking.guest_email,
        booking.guest_name,
        booking.topic
      )
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError)
      // Don't fail - the booking is rejected, email is a courtesy
    }

    return NextResponse.redirect(new URL('/book/rejected', appUrl))
  } catch (error) {
    console.error('Rejection error:', error)
    return NextResponse.redirect(new URL('/book/error?reason=unknown', appUrl))
  }
}
