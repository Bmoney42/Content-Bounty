// In-memory rate limiting (resets on server restart)
const requestCounts = new Map()
const WINDOW_MS = 15 * 60 * 1000

function createRateLimit(options = {}) {
  const { windowMs = WINDOW_MS, maxRequests = 100, message = 'Too many requests, please try again later' } = options

  return (req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    if (!requestCounts.has(clientIP)) requestCounts.set(clientIP, [])
    const requests = requestCounts.get(clientIP)
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    requestCounts.set(clientIP, validRequests)

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) })
    }

    validRequests.push(now)
    requestCounts.set(clientIP, validRequests)

    // Set headers individually for Vercel compatibility
    res.setHeader('X-RateLimit-Limit', maxRequests)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - validRequests.length))
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString())

    if (next) next()
  }
}

// Pre-configured rate limits
const authRateLimit = createRateLimit({ maxRequests: 10, message: 'Too many authentication attempts, please try again later' })
const apiRateLimit = createRateLimit({ maxRequests: 100, message: 'Too many API requests, please try again later' })
const paymentRateLimit = createRateLimit({ maxRequests: 20, message: 'Too many payment requests, please try again later' })

module.exports = { createRateLimit, authRateLimit, apiRateLimit, paymentRateLimit }
