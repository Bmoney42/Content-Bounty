import { useState, useCallback } from 'react'
import { rateLimiter, getClientFingerprint } from '../utils/rateLimiting'

interface AuthRateLimitState {
  isBlocked: boolean
  remainingAttempts: number
  timeUntilUnblocked: number
  timeUntilUnblockedFormatted: string
}

export function useAuthRateLimit() {
  const [loginState, setLoginState] = useState<AuthRateLimitState>(() => {
    const fingerprint = getClientFingerprint()
    return rateLimiter.getBlockInfo('login', fingerprint)
  })

  const [registerState, setRegisterState] = useState<AuthRateLimitState>(() => {
    const fingerprint = getClientFingerprint()
    return rateLimiter.getBlockInfo('register', fingerprint)
  })

  const updateLoginState = useCallback(() => {
    const fingerprint = getClientFingerprint()
    setLoginState(rateLimiter.getBlockInfo('login', fingerprint))
  }, [])

  const updateRegisterState = useCallback(() => {
    const fingerprint = getClientFingerprint()
    setRegisterState(rateLimiter.getBlockInfo('register', fingerprint))
  }, [])

  const checkLoginRateLimit = useCallback((email?: string): { canProceed: boolean; message?: string } => {
    const fingerprint = getClientFingerprint()
    const ipInfo = rateLimiter.getBlockInfo('login', fingerprint)
    
    let emailInfo = { isBlocked: false, remainingAttempts: 5, timeUntilUnblocked: 0, timeUntilUnblockedFormatted: '' }
    if (email) {
      emailInfo = rateLimiter.getBlockInfo('login', email)
    }

    updateLoginState()

    // Block if either IP or email is blocked
    if (ipInfo.isBlocked || emailInfo.isBlocked) {
      const blockedBy = ipInfo.isBlocked ? ipInfo : emailInfo
      return {
        canProceed: false,
        message: `Too many failed login attempts. Please try again in ${blockedBy.timeUntilUnblockedFormatted}.`
      }
    }

    // Warn if approaching limit
    const minRemaining = Math.min(ipInfo.remainingAttempts, emailInfo.remainingAttempts)
    if (minRemaining <= 2) {
      return {
        canProceed: true,
        message: `Warning: ${minRemaining} login attempts remaining before temporary lockout.`
      }
    }

    return { canProceed: true }
  }, [updateLoginState])

  const checkRegisterRateLimit = useCallback((email?: string): { canProceed: boolean; message?: string } => {
    const fingerprint = getClientFingerprint()
    const ipInfo = rateLimiter.getBlockInfo('register', fingerprint)
    
    let emailInfo = { isBlocked: false, remainingAttempts: 3, timeUntilUnblocked: 0, timeUntilUnblockedFormatted: '' }
    if (email) {
      emailInfo = rateLimiter.getBlockInfo('register', email)
    }

    updateRegisterState()

    // Block if either IP or email is blocked
    if (ipInfo.isBlocked || emailInfo.isBlocked) {
      const blockedBy = ipInfo.isBlocked ? ipInfo : emailInfo
      return {
        canProceed: false,
        message: `Too many registration attempts. Please try again in ${blockedBy.timeUntilUnblockedFormatted}.`
      }
    }

    // Warn if approaching limit
    const minRemaining = Math.min(ipInfo.remainingAttempts, emailInfo.remainingAttempts)
    if (minRemaining <= 1) {
      return {
        canProceed: true,
        message: `Warning: ${minRemaining} registration attempts remaining before temporary lockout.`
      }
    }

    return { canProceed: true }
  }, [updateRegisterState])

  const recordLoginAttempt = useCallback((email: string, success: boolean) => {
    const fingerprint = getClientFingerprint()
    
    // Record attempt for both IP and email
    rateLimiter.recordAttempt('login', fingerprint, success)
    rateLimiter.recordAttempt('login', email, success)
    
    updateLoginState()
  }, [updateLoginState])

  const recordRegisterAttempt = useCallback((email: string, success: boolean) => {
    const fingerprint = getClientFingerprint()
    
    // Record attempt for both IP and email
    rateLimiter.recordAttempt('register', fingerprint, success)
    rateLimiter.recordAttempt('register', email, success)
    
    updateRegisterState()
  }, [updateRegisterState])

  return {
    loginState,
    registerState,
    checkLoginRateLimit,
    checkRegisterRateLimit,
    recordLoginAttempt,
    recordRegisterAttempt,
    updateLoginState,
    updateRegisterState
  }
}