/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

/**
 * Verifies a Turnstile token with Cloudflare's API.
 * Returns true if the token is valid, false otherwise.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // In development, skip verification if no secret key is set
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not set - skipping verification')
    return true
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    )

    const data: TurnstileResponse = await response.json()

    if (!data.success) {
      console.error('Turnstile verification failed:', data['error-codes'])
    }

    return data.success === true
  } catch (error) {
    console.error('Turnstile API error:', error)
    // Fail open in case of API errors to avoid blocking legitimate users
    // You may want to change this to fail closed in high-security scenarios
    return false
  }
}
