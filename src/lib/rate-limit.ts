import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(private config: RateLimitConfig) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return true
    }

    if (record.count >= this.config.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  getRemainingTime(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record) return 0
    return Math.max(0, record.resetTime - Date.now())
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Create rate limiters for different endpoints
const authRateLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 }) // 5 attempts per 15 minutes
const signupRateLimiter = new RateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 3 }) // 3 signups per hour
const apiRateLimiter = new RateLimiter({ windowMs: 60 * 1000, maxRequests: 100 }) // 100 requests per minute

export function getClientIdentifier(req: NextRequest): string {
  // Use IP address as primary identifier
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  // Add user agent for additional uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  return `${ip}-${userAgent}`
}

export function rateLimitAuth(req: NextRequest): NextResponse | null {
  const identifier = getClientIdentifier(req)
  
  if (!authRateLimiter.isAllowed(identifier)) {
    const remainingTime = authRateLimiter.getRemainingTime(identifier)
    return NextResponse.json(
      { 
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(remainingTime / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(remainingTime / 1000).toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + remainingTime).toISOString()
        }
      }
    )
  }

  return null
}

export function rateLimitSignup(req: NextRequest): NextResponse | null {
  const identifier = getClientIdentifier(req)
  
  if (!signupRateLimiter.isAllowed(identifier)) {
    const remainingTime = signupRateLimiter.getRemainingTime(identifier)
    return NextResponse.json(
      { 
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: Math.ceil(remainingTime / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(remainingTime / 1000).toString(),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + remainingTime).toISOString()
        }
      }
    )
  }

  return null
}

export function rateLimitAPI(req: NextRequest): NextResponse | null {
  const identifier = getClientIdentifier(req)
  
  if (!apiRateLimiter.isAllowed(identifier)) {
    const remainingTime = apiRateLimiter.getRemainingTime(identifier)
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(remainingTime / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(remainingTime / 1000).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + remainingTime).toISOString()
        }
      }
    )
  }

  return null
}

// Cleanup old records periodically
setInterval(() => {
  authRateLimiter.cleanup()
  signupRateLimiter.cleanup()
  apiRateLimiter.cleanup()
}, 60000) // Clean up every minute
