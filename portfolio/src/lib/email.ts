import { Resend } from 'resend'

/**
 * Email sending via Resend.
 *
 * Free tier: 3,000 emails/month, 100/day
 * https://resend.com/docs/introduction
 */

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set - email sending disabled')
    return null
  }

  return new Resend(apiKey)
}

// Email "from" address - must be verified in Resend
// For development, use onboarding@resend.dev
const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Benjamin Marler <onboarding@resend.dev>'

/**
 * Sends a verification email to the booker.
 * They must click the link to advance their booking to pending_approval.
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
): Promise<void> {
  const resend = getResend()

  if (!resend) {
    console.log('Would send verification email to:', to)
    console.log('Verification URL:', verificationUrl)
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your booking request - Benjamin Marler',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; padding: 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h1 style="color: #8e4585; margin: 0 0 24px 0; font-size: 24px;">
              Verify Your Booking
            </h1>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${name},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for your booking request. Please click the button below to verify your email address and submit your request for approval.
            </p>

            <a href="${verificationUrl}" style="display: inline-block; background: #8e4585; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Booking Request
            </a>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
              This link will expire in 24 hours. If you didn't request this booking, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Benjamin Marler &bull; Software Engineer
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

export interface BookingDetails {
  id: string
  guest_name: string
  guest_email: string
  start_time: string
  end_time: string
  topic: string
  notes?: string
  meeting_preference: string
  approval_token: string
}

/**
 * Sends a notification email to the owner when a booking is verified.
 * Includes approve/reject links for quick action.
 */
export async function sendOwnerNotification(
  booking: BookingDetails
): Promise<void> {
  const resend = getResend()
  const ownerEmail = process.env.OWNER_EMAIL

  if (!resend || !ownerEmail) {
    console.log('Would send owner notification for booking:', booking.id)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const approveUrl = `${appUrl}/api/bookings/approve?token=${booking.approval_token}`
  const rejectUrl = `${appUrl}/api/bookings/reject?token=${booking.approval_token}`

  const startDate = new Date(booking.start_time)
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `New booking request from ${booking.guest_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; padding: 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h1 style="color: #8e4585; margin: 0 0 24px 0; font-size: 24px;">
              New Booking Request
            </h1>

            <div style="background: #faf8fc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; color: #374151;">
                <strong>From:</strong> ${booking.guest_name}<br>
                <span style="color: #6b7280;">${booking.guest_email}</span>
              </p>
              <p style="margin: 0 0 12px 0; color: #374151;">
                <strong>When:</strong> ${formattedDate} at ${formattedTime}
              </p>
              <p style="margin: 0 0 12px 0; color: #374151;">
                <strong>Topic:</strong> ${booking.topic}
              </p>
              ${booking.notes ? `<p style="margin: 0; color: #374151;"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
              <p style="margin: 12px 0 0 0; color: #374151;">
                <strong>Meeting:</strong> ${booking.meeting_preference === 'google_meet' ? 'Google Meet (auto-generated)' : booking.meeting_preference}
              </p>
            </div>

            <div style="display: flex; gap: 12px;">
              <a href="${approveUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                ✓ Approve
              </a>
              <a href="${rejectUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                ✕ Reject
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Booking ID: ${booking.id}
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

/**
 * Sends a rejection notification to the booker.
 */
export async function sendRejectionEmail(
  to: string,
  name: string,
  topic: string
): Promise<void> {
  const resend = getResend()

  if (!resend) {
    console.log('Would send rejection email to:', to)
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Booking request update - Benjamin Marler',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; padding: 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h1 style="color: #374151; margin: 0 0 24px 0; font-size: 24px;">
              Booking Request Update
            </h1>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${name},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Unfortunately, I'm unable to accommodate your booking request for "${topic}" at this time.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Please feel free to request a different time slot, or reach out directly if you have any questions.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Benjamin Marler &bull; Software Engineer
            </p>
          </div>
        </body>
      </html>
    `,
  })
}
