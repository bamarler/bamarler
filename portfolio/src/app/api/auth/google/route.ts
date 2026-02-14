import { google } from 'googleapis'
import { NextResponse } from 'next/server'

/**
 * One-time setup route to initiate Google OAuth flow.
 * Visit /api/auth/google to start the authorization process.
 *
 * IMPORTANT: After obtaining your refresh token, you can delete this route
 * or protect it from public access.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      {
        error: 'Missing environment variables',
        required: [
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET',
          'NEXT_PUBLIC_APP_URL',
        ],
      },
      { status: 500 }
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/auth/google/callback`
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Forces refresh token to be returned
    prompt: 'consent', // Ensures refresh token is always returned
    scope: ['https://www.googleapis.com/auth/calendar'],
  })

  return NextResponse.redirect(authUrl)
}
