interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  lastAttempt: number
  blockedUntil?: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map()
  private configs: Map<string, RateLimitConfig> = new Map()

  constructor() {
    // Default configurations for different actions
    this.configs.set('login', {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000 // 30 minutes block
    })

    this.configs.set('register', {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours block
    })

    this.configs.set('password-reset', {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000 // 1 hour block
    })

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000) // Every 5 minutes
  }

  private getKey(action: string, identifier: string): string {
    return `${action}:${identifier.toLowerCase()}`
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      // Remove entries older than 24 hours
      if (now - entry.lastAttempt > 24 * 60 * 60 * 1000) {
        this.storage.delete(key)
      }
    }
  }

  isBlocked(action: string, identifier: string): boolean {
    const key = this.getKey(action, identifier)
    const entry = this.storage.get(key)
    const config = this.configs.get(action)

    if (!entry || !config) return false

    const now = Date.now()

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true
    }

    // Check if we're still within the rate limit window
    if (now - entry.firstAttempt < config.windowMs && entry.attempts >= config.maxAttempts) {
      // Block the user
      entry.blockedUntil = now + config.blockDurationMs
      this.storage.set(key, entry)
      return true
    }

    // Reset if window has passed
    if (now - entry.firstAttempt >= config.windowMs) {
      this.storage.delete(key)
      return false
    }

    return false
  }

  recordAttempt(action: string, identifier: string, success: boolean = false): void {
    const key = this.getKey(action, identifier)
    const config = this.configs.get(action)
    
    if (!config) return

    const now = Date.now()
    let entry = this.storage.get(key)

    if (!entry) {
      // First attempt
      entry = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
    } else {
      // Check if we should reset the window
      if (now - entry.firstAttempt >= config.windowMs) {
        entry = {
          attempts: 1,
          firstAttempt: now,
          lastAttempt: now
        }
      } else {
        entry.attempts += 1
        entry.lastAttempt = now
      }
    }

    // If successful, reset the counter
    if (success) {
      this.storage.delete(key)
      return
    }

    this.storage.set(key, entry)
  }

  getTimeUntilUnblocked(action: string, identifier: string): number {
    const key = this.getKey(action, identifier)
    const entry = this.storage.get(key)

    if (!entry || !entry.blockedUntil) return 0

    const timeLeft = entry.blockedUntil - Date.now()
    return Math.max(0, timeLeft)
  }

  getRemainingAttempts(action: string, identifier: string): number {
    const key = this.getKey(action, identifier)
    const entry = this.storage.get(key)
    const config = this.configs.get(action)

    if (!entry || !config) return config?.maxAttempts || 0

    const now = Date.now()

    // Reset if window has passed
    if (now - entry.firstAttempt >= config.windowMs) {
      return config.maxAttempts
    }

    return Math.max(0, config.maxAttempts - entry.attempts)
  }

  getBlockInfo(action: string, identifier: string) {
    const isBlocked = this.isBlocked(action, identifier)
    const timeUntilUnblocked = this.getTimeUntilUnblocked(action, identifier)
    const remainingAttempts = this.getRemainingAttempts(action, identifier)

    return {
      isBlocked,
      timeUntilUnblocked,
      remainingAttempts,
      timeUntilUnblockedFormatted: this.formatTime(timeUntilUnblocked)
    }
  }

  private formatTime(ms: number): string {
    if (ms <= 0) return '0 seconds'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds % 60} second${(seconds % 60) !== 1 ? 's' : ''}`
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`
    }
  }

  // Method to configure custom rate limits
  setConfig(action: string, config: RateLimitConfig): void {
    this.configs.set(action, config)
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Helper function to get client IP (for more robust rate limiting)
export function getClientFingerprint(): string {
  // In a real application, you'd want to use server-side IP detection
  // For client-side, we can use a combination of factors
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0
  ].join('|')

  // Simple hash function to create a shorter identifier
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}

// React hook for rate limiting
export function useRateLimit(action: string, identifier: string) {
  const checkRateLimit = () => rateLimiter.getBlockInfo(action, identifier)
  
  const recordAttempt = (success: boolean = false) => {
    rateLimiter.recordAttempt(action, identifier, success)
  }

  return {
    checkRateLimit,
    recordAttempt
  }
}