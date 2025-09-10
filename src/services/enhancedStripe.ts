import { getStripe, STRIPE_CONFIG, formatCurrency, calculateEscrowAmounts, validateBountyAmount } from '../config/stripe'
import { UserSubscription, SubscriptionPlan, SUBSCRIPTION_PLANS } from '../types/subscription'
import { EscrowPayment, PaymentStatus, BountySubmission } from '../types/bounty'
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { authenticatedFetch, handleApiResponse } from '../utils/apiUtils'
import { AuditLogger } from './auditLogger'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export interface StripeOperationResult<T> {
  success: boolean
  data?: T
  error?: string
  retryable?: boolean
  attemptCount: number
}

export class EnhancedStripeService {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }

  /**
   * Execute a Stripe operation with retry logic
   */
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    userId: string,
    config: RetryConfig = this.DEFAULT_RETRY_CONFIG
  ): Promise<StripeOperationResult<T>> {
    let lastError: Error | null = null
    let attemptCount = 0

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      attemptCount = attempt + 1
      
      try {
        const result = await operation()
        
        // Log successful operation
        await AuditLogger.logEvent(
          userId,
          `stripe_${operationName}_success`,
          'stripe_operation',
          'success',
          undefined,
          { attemptCount, operationName }
        )

        return {
          success: true,
          data: result,
          attemptCount
        }
      } catch (error: any) {
        lastError = error
        
        // Log failed attempt
        await AuditLogger.logEvent(
          userId,
          `stripe_${operationName}_failed`,
          'stripe_operation',
          'failed',
          undefined,
          { 
            attemptCount, 
            operationName, 
            error: error.message,
            retryable: this.isRetryableError(error)
          }
        )

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === config.maxRetries - 1) {
          return {
            success: false,
            error: error.message,
            retryable: this.isRetryableError(error),
            attemptCount
          }
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )

        console.warn(`Stripe operation ${operationName} failed (attempt ${attemptCount}), retrying in ${delay}ms...`, error.message)
        await this.delay(delay)
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Operation failed after maximum retries',
      retryable: false,
      attemptCount
    }
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) return true
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) return true
    
    // Stripe specific retryable errors
    if (error.code === 'rate_limit') return true
    if (error.code === 'api_connection_error') return true
    if (error.code === 'api_error') return true
    if (error.code === 'card_declined') return false // Don't retry card declines
    if (error.code === 'authentication_required') return false // Don't retry auth errors
    if (error.code === 'invalid_request_error') return false // Don't retry invalid requests
    
    // HTTP status codes
    if (error.status >= 500) return true // Server errors
    if (error.status === 429) return true // Rate limiting
    if (error.status === 408) return true // Request timeout
    
    return false
  }

  /**
   * Create checkout session for subscription with retry logic
   */
  static async createCheckoutSession(
    planId: string, 
    userId: string, 
    userEmail: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<void>> {
    return this.executeWithRetry(
      async () => {
        // Map plan ID to actual Stripe price ID
        const stripePriceId = this.getStripePriceId(planId)
        if (!stripePriceId) {
          throw new Error(`Invalid plan ID: ${planId}`)
        }

        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-checkout-session',
            priceId: stripePriceId,
            successUrl: STRIPE_CONFIG.SUCCESS_URL,
            cancelUrl: STRIPE_CONFIG.CANCEL_URL,
          }),
        })

        const { sessionId } = await handleApiResponse<{ sessionId: string }>(response)
        const stripe = await getStripe()
        
        if (!stripe) {
          throw new Error('Stripe not initialized')
        }

        const { error } = await stripe.redirectToCheckout({ sessionId })
        
        if (error) {
          throw error
        }
      },
      'create_checkout_session',
      userId,
      retryConfig
    )
  }

  /**
   * Create escrow payment with retry logic
   */
  static async createEscrowPayment(
    bountyId: string, 
    businessId: string, 
    amount: number, 
    businessEmail: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{ escrowPaymentId: string, sessionId: string }>> {
    return this.executeWithRetry(
      async () => {
        // Validate bounty amount
        const validation = validateBountyAmount(amount)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-escrow-payment',
            bountyId,
            amount,
          }),
        })

        const { escrowPaymentId, sessionId, checkoutUrl } = await handleApiResponse<{ 
          escrowPaymentId: string, 
          sessionId: string, 
          checkoutUrl: string 
        }>(response)
        
        // Redirect to Stripe Checkout
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          throw new Error('No checkout URL received from server')
        }

        return { escrowPaymentId, sessionId }
      },
      'create_escrow_payment',
      businessId,
      retryConfig
    )
  }

  /**
   * Release escrow payment with retry logic
   */
  static async releaseEscrowPayment(
    escrowPaymentId: string, 
    creatorId: string, 
    creatorEmail: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{ transferId: string }>> {
    return this.executeWithRetry(
      async () => {
        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'release-escrow-payment',
            escrowPaymentId,
          }),
        })

        const { success, transferId, status, amount } = await handleApiResponse<{ 
          success: boolean, 
          transferId: string, 
          status: string, 
          amount: number 
        }>(response)
        
        if (!success) {
          throw new Error(`Failed to release escrow payment: ${status}`)
        }

        // Update escrow payment status in Firestore
        await this.updateEscrowPaymentStatus(escrowPaymentId, 'released', {
          creatorId,
          stripeTransferId: transferId,
          releasedAt: new Date(),
        })

        return { transferId }
      },
      'release_escrow_payment',
      creatorId,
      retryConfig
    )
  }

  /**
   * Refund escrow payment with retry logic
   */
  static async refundEscrowPayment(
    escrowPaymentId: string, 
    reason: string,
    userId: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{ refundId: string }>> {
    return this.executeWithRetry(
      async () => {
        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'refund-escrow-payment',
            escrowPaymentId,
            reason,
          }),
        })

        const { success, refundId, status, amount } = await handleApiResponse<{ 
          success: boolean, 
          refundId: string, 
          status: string, 
          amount: number 
        }>(response)
        
        if (!success) {
          throw new Error(`Failed to refund escrow payment: ${status}`)
        }

        // Update escrow payment status in Firestore
        await this.updateEscrowPaymentStatus(escrowPaymentId, 'refunded', {
          refundedAt: new Date(),
          failureReason: reason,
        })

        return { refundId }
      },
      'refund_escrow_payment',
      userId,
      retryConfig
    )
  }

  /**
   * Create Stripe Connect account with retry logic
   */
  static async createConnectAccount(
    email: string, 
    country: string = 'US',
    userId: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{ accountId: string }>> {
    return this.executeWithRetry(
      async () => {
        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-connect-account',
            email,
            country,
          }),
        })

        const { accountId } = await handleApiResponse<{ accountId: string }>(response)
        return { accountId }
      },
      'create_connect_account',
      userId,
      retryConfig
    )
  }

  /**
   * Create Connect onboarding link with retry logic
   */
  static async createConnectOnboardingLink(
    accountId: string,
    userId: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{ url: string }>> {
    return this.executeWithRetry(
      async () => {
        const response = await authenticatedFetch('/api/stripe', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create-connect-onboarding-link',
            accountId,
          }),
        })

        const { url } = await handleApiResponse<{ url: string }>(response)
        
        // Redirect to onboarding
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No onboarding URL received from server')
        }

        return { url }
      },
      'create_connect_onboarding_link',
      userId,
      retryConfig
    )
  }

  /**
   * Check Connect account status with retry logic
   */
  static async checkConnectStatus(
    userId: string,
    retryConfig?: RetryConfig
  ): Promise<StripeOperationResult<{
    hasAccount: boolean
    accountId?: string
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    requirements?: any
  }>> {
    return this.executeWithRetry(
      async () => {
        const response = await authenticatedFetch('/api/stripe?action=connect-account', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await handleApiResponse<{
          hasAccount: boolean
          accountId?: string
          chargesEnabled: boolean
          payoutsEnabled: boolean
          detailsSubmitted: boolean
          requirements?: any
        }>(response)

        return result
      },
      'check_connect_status',
      userId,
      retryConfig
    )
  }

  /**
   * Get escrow payment details (no retry needed for read operations)
   */
  static async getEscrowPayment(escrowPaymentId: string): Promise<EscrowPayment | null> {
    try {
      const paymentRef = doc(db, 'escrow_payments', escrowPaymentId)
      const paymentSnap = await getDoc(paymentRef)
      
      if (paymentSnap.exists()) {
        const data = paymentSnap.data()
        return {
          id: paymentSnap.id,
          bountyId: data.bountyId,
          businessId: data.businessId,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          stripeCustomerId: data.stripeCustomerId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          stripeTransferId: data.stripeTransferId,
          creatorEarnings: data.creatorEarnings,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          heldUntil: data.heldUntil?.toDate?.() || data.heldUntil,
          releasedAt: data.releasedAt?.toDate?.() || data.releasedAt,
          refundedAt: data.refundedAt?.toDate?.() || data.refundedAt,
          failureReason: data.failureReason,
        } as EscrowPayment
      }
      
      return null
    } catch (error) {
      console.error('Error getting escrow payment:', error)
      throw error
    }
  }

  /**
   * Update escrow payment status in Firestore
   */
  private static async updateEscrowPaymentStatus(
    escrowPaymentId: string, 
    status: PaymentStatus, 
    updates: any
  ): Promise<void> {
    try {
      const paymentRef = doc(db, 'escrow_payments', escrowPaymentId)
      await updateDoc(paymentRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating escrow payment status:', error)
      throw error
    }
  }

  /**
   * Get Stripe price ID for plan
   */
  private static getStripePriceId(planId: string): string | null {
    const plan = SUBSCRIPTION_PLANS[planId]
    return plan?.stripePriceId || null
  }

  /**
   * Delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get retry statistics for monitoring
   */
  static async getRetryStatistics(userId: string, timeRange: string = '24h'): Promise<{
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    retryableFailures: number
    averageRetries: number
  }> {
    try {
      // This would query your audit logs to get retry statistics
      // For now, return mock data
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        retryableFailures: 0,
        averageRetries: 0
      }
    } catch (error) {
      console.error('Error getting retry statistics:', error)
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        retryableFailures: 0,
        averageRetries: 0
      }
    }
  }
}
