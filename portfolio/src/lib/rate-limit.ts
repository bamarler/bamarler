import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting using Upstash Redis.
 *
 * Free tier includes 500K commands/month - more than enough for a personal site.
 * https://upstash.com/docs/redis/overall/getstarted
 */

// Create Redis client (lazy initialization)
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('Upstash Redis not configured - rate limiting disabled')
    return null
  }

  return new Redis({ url, token })
}

// Singleton instances
let _ipRateLimit: Ratelimit | null = null
let _emailRateLimit: Ratelimit | null = null

/**
 * IP-based rate limit: 10 requests per hour.
 * Applied in middleware before the request reaches the route handler.
 */
export const ipRateLimit = {
  async limit(ip: string): Promise<{ success: boolean; remaining?: number }> {
    const redis = getRedis()
    if (!redis) {
      return { success: true } // Fail open if not configured
    }

    if (!_ipRateLimit) {
      _ipRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'ratelimit:ip:',
        analytics: true,
      })
    }

    const result = await _ipRateLimit.limit(ip)
    return { success: result.success, remaining: result.remaining }
  },
}

/**
 * Email-based rate limit: 3 bookings per 24 hours.
 * Prevents a single email from spamming multiple booking requests.
 */
export const emailRateLimit = {
  async limit(
    email: string
  ): Promise<{ success: boolean; remaining?: number }> {
    const redis = getRedis()
    if (!redis) {
      return { success: true } // Fail open if not configured
    }

    if (!_emailRateLimit) {
      _emailRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '24 h'),
        prefix: 'ratelimit:email:',
        analytics: true,
      })
    }

    // Normalize email to prevent bypasses
    const normalizedEmail = email.toLowerCase().trim()
    const result = await _emailRateLimit.limit(normalizedEmail)
    return { success: result.success, remaining: result.remaining }
  },
}
