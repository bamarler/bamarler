import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth callback route that exchanges the authorization code for tokens.
 * The refresh token will be displayed on the page - copy it to your
 * GOOGLE_REFRESH_TOKEN environment variable.
 *
 * CRITICAL: Switch your Google Cloud OAuth consent screen from "Testing"
 * to "Production" mode, or refresh tokens will expire after 7 days.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    )
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/auth/google/callback`
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)

    // Return HTML page with the refresh token for easy copying
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #0a0414;
              color: #faf8fc;
              padding: 2rem;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { color: #8e4585; }
            .token-box {
              background: #1a1125;
              padding: 1rem;
              border-radius: 8px;
              word-break: break-all;
              margin: 1rem 0;
              border: 1px solid #8e4585;
            }
            .warning {
              background: #f59e0b20;
              border: 1px solid #f59e0b;
              padding: 1rem;
              border-radius: 8px;
              margin: 1rem 0;
            }
            code { background: #1a1125; padding: 0.2rem 0.4rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Google OAuth Success!</h1>

          <div class="warning">
            <strong>IMPORTANT:</strong> Copy the refresh token below and add it to your
            <code>.env.local</code> file as <code>GOOGLE_REFRESH_TOKEN</code>.
            Then redeploy with the new environment variable.
          </div>

          <h2>Refresh Token:</h2>
          <div class="token-box">
            <code>${tokens.refresh_token || 'No refresh token returned - make sure prompt=consent is set'}</code>
          </div>

          <h2>Access Token:</h2>
          <div class="token-box">
            <code>${tokens.access_token}</code>
          </div>

          <p><strong>Token Type:</strong> ${tokens.token_type}</p>
          <p><strong>Scope:</strong> ${tokens.scope}</p>
          <p><strong>Expires:</strong> ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'}</p>

          <div class="warning">
            <strong>Security Note:</strong> Delete the <code>/api/auth/google</code> routes
            after obtaining your refresh token, or protect them with authentication.
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err) {
    console.error('OAuth token exchange failed:', err)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for tokens' },
      { status: 500 }
    )
  }
}
