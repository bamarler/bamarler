import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ipRateLimit } from '@/lib/rate-limit'

/**
 * Middleware for rate limiting and other request processing.
 *
 * Applied to booking-related API routes to prevent abuse.
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Apply rate limiting to booking endpoint (skip in dev)
  if (pathname === '/api/book' && req.method === 'POST' && process.env.NODE_ENV === 'production') {
    const ip = getClientIp(req)

    const { success, remaining } = await ipRateLimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: '1 hour',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next()
    if (remaining !== undefined) {
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
    }
    return response
  }

  return NextResponse.next()
}

/**
 * Extract client IP from request headers.
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
function getClientIp(req: NextRequest): string {
  // Vercel and most proxies use x-forwarded-for
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare uses cf-connecting-ip
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }

  // Fallback
  return req.headers.get('x-real-ip') || 'anonymous'
}

export const config = {
  matcher: ['/api/book'],
}
