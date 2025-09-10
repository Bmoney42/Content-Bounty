import { getStripe, STRIPE_CONFIG, formatCurrency, calculateEscrowAmounts, validateBountyAmount } from '../config/stripe'
import { UserSubscription, SubscriptionPlan, SUBSCRIPTION_PLANS } from '../types/subscription'
import { EscrowPayment, PaymentStatus, BountySubmission } from '../types/bounty'
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { authenticatedFetch, handleApiResponse } from '../utils/apiUtils'

export class StripeService {
  // Create checkout session for subscription
  static async createCheckoutSession(planId: string, userId: string, userEmail: string) {
    try {
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
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Create escrow payment upfront (before bounty creation)
  static async createEscrowPaymentUpfront(bountyData: any, businessId: string, amount: number, businessEmail: string) {
    try {
      // Validate bounty amount
      const validation = validateBountyAmount(amount)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-escrow-payment-upfront',
          bountyData,
          amount,
        }),
      })

      const { escrowPaymentId, sessionId, checkoutUrl } = await handleApiResponse<{ escrowPaymentId: string, sessionId: string, checkoutUrl: string }>(response)
      
      // Redirect to Stripe Checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL received from server')
      }

      return { escrowPaymentId, sessionId }
    } catch (error) {
      console.error('Error creating upfront escrow payment:', error)
      throw error
    }
  }

  // Create escrow payment for bounty
  static async createEscrowPayment(bountyId: string, businessId: string, amount: number, businessEmail: string) {
    try {
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

      const { escrowPaymentId, sessionId, checkoutUrl } = await handleApiResponse<{ escrowPaymentId: string, sessionId: string, checkoutUrl: string }>(response)
      
      // Redirect to Stripe Checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL received from server')
      }

      return { escrowPaymentId, sessionId }
    } catch (error) {
      console.error('Error creating escrow payment:', error)
      throw error
    }
  }

  // Get escrow payment details
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

  // Release escrow payment to creator
  static async releaseEscrowPayment(escrowPaymentId: string, creatorId: string, creatorEmail: string) {
    try {
      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'release-escrow-payment',
          escrowPaymentId,
        }),
      })

      const { success, transferId, status, amount } = await handleApiResponse<{ success: boolean, transferId: string, status: string, amount: number }>(response)
      
      if (success) {
        // Update escrow payment status in Firestore
        await this.updateEscrowPaymentStatus(escrowPaymentId, 'released', {
          creatorId,
          stripeTransferId: transferId,
          releasedAt: new Date(),
        })
      }

      return { success, transferId }
    } catch (error) {
      console.error('Error releasing escrow payment:', error)
      throw error
    }
  }

  // Refund escrow payment to business
  static async refundEscrowPayment(escrowPaymentId: string, reason: string) {
    try {
      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'refund-escrow-payment',
          escrowPaymentId,
          reason,
        }),
      })

      const { success, refundId, status, amount } = await handleApiResponse<{ success: boolean, refundId: string, status: string, amount: number }>(response)
      
      if (success) {
        // Update escrow payment status in Firestore
        await this.updateEscrowPaymentStatus(escrowPaymentId, 'refunded', {
          refundedAt: new Date(),
          failureReason: reason,
        })
      }

      return { success, refundId }
    } catch (error) {
      console.error('Error refunding escrow payment:', error)
      throw error
    }
  }

  // Update escrow payment status in Firestore
  static async updateEscrowPaymentStatus(escrowPaymentId: string, status: PaymentStatus, updates: Partial<EscrowPayment>) {
    try {
      const paymentRef = doc(db, 'escrow_payments', escrowPaymentId)
      await updateDoc(paymentRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating escrow payment status:', error)
      throw error
    }
  }

  // Calculate escrow amounts for a bounty (100% to creators, Stripe fees to business)
  static async calculateEscrowAmounts(bountyAmount: number, creatorId?: string) {
    // 100% of bounty goes to creators, Stripe fees paid by business
    return calculateEscrowAmounts(bountyAmount)
  }

  // Check if escrow payment can be released
  static async canReleaseEscrowPayment(escrowPaymentId: string): Promise<boolean> {
    try {
      const payment = await this.getEscrowPayment(escrowPaymentId)
      
      if (!payment) {
        return false
      }
      
      // Can only release if payment is held in escrow
      return payment.status === 'held_in_escrow'
    } catch (error) {
      console.error('Error checking escrow payment release status:', error)
      return false
    }
  }

  // Check if escrow payment can be refunded
  static async canRefundEscrowPayment(escrowPaymentId: string): Promise<boolean> {
    try {
      const payment = await this.getEscrowPayment(escrowPaymentId)
      
      if (!payment) {
        return false
      }
      
      // Can refund if payment is held in escrow or pending
      return payment.status === 'held_in_escrow' || payment.status === 'pending'
    } catch (error) {
      console.error('Error checking escrow payment refund status:', error)
      return false
    }
  }

  // Get escrow payments for a business
  static async getBusinessEscrowPayments(businessId: string): Promise<EscrowPayment[]> {
    try {
      const response = await authenticatedFetch(`/api/stripe?action=payment-history`)
      
      const { payments } = await handleApiResponse<{ payments: EscrowPayment[] }>(response)
      return payments
    } catch (error) {
      console.error('Error getting business escrow payments:', error)
      throw error
    }
  }

  // Get escrow payments for a creator
  static async getCreatorEscrowPayments(creatorId: string): Promise<EscrowPayment[]> {
    try {
      const response = await authenticatedFetch(`/api/stripe?action=payment-history`)
      
      const { payments } = await handleApiResponse<{ payments: EscrowPayment[] }>(response)
      return payments
    } catch (error) {
      console.error('Error getting creator escrow payments:', error)
      throw error
    }
  }

  // Create customer portal session for subscription management
  static async createCustomerPortalSession(customerId: string) {
    try {
      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-portal-session',
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      })

      const { url } = await handleApiResponse<{ url: string }>(response)
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  // Get user subscription from Firestore
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId)
      const subscriptionSnap = await getDoc(subscriptionRef)
      
      if (subscriptionSnap.exists()) {
        const data = subscriptionSnap.data()
        return {
          id: subscriptionSnap.id,
          userId: data.userId,
          tier: data.tier,
          status: data.status,
          planId: data.planId,
          currentPeriodStart: data.currentPeriodStart?.toDate(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate(),
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserSubscription
      }
      
      return null
    } catch (error) {
      console.error('Error getting user subscription:', error)
      throw error
    }
  }

  // Create or update user subscription in Firestore
  static async updateUserSubscription(subscription: Partial<UserSubscription>) {
    try {
      const subscriptionRef = doc(db, 'subscriptions', subscription.userId!)
      await setDoc(subscriptionRef, {
        ...subscription,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating user subscription:', error)
      throw error
    }
  }

  // Get subscription usage for current month
  static async getSubscriptionUsage(userId: string, userType: 'creator' | 'business'): Promise<any> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      const usageRef = doc(db, 'subscription_usage', `${userId}_${currentMonth}`)
      const usageSnap = await getDoc(usageRef)
      
      if (usageSnap.exists()) {
        return usageSnap.data()
      }
      
      // Return default usage if not found
      const subscription = await this.getUserSubscription(userId)
      const isPremium = subscription?.tier === 'premium'
      
      return {
        userId,
        month: currentMonth,
        applicationsUsed: 0,
        applicationsLimit: isPremium ? -1 : (userType === 'creator' ? 3 : 2),
        bountiesCreated: 0,
        bountiesLimit: isPremium ? -1 : (userType === 'business' ? 2 : -1),
        totalEarnings: 0,
      }
    } catch (error) {
      console.error('Error getting subscription usage:', error)
      throw error
    }
  }

  // Update subscription usage
  static async updateSubscriptionUsage(userId: string, updates: Partial<any>) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const usageRef = doc(db, 'subscription_usage', `${userId}_${currentMonth}`)
      await setDoc(usageRef, {
        userId,
        month: currentMonth,
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating subscription usage:', error)
      throw error
    }
  }

  // Check if user can apply to more bounties
  static async canApplyToBounty(userId: string): Promise<boolean> {
    try {
      const usage = await this.getSubscriptionUsage(userId, 'creator')
      const subscription = await this.getUserSubscription(userId)
      const isPremium = subscription?.tier === 'premium'
      
      if (isPremium) {
        return true // Unlimited for premium
      }
      
      return usage.applicationsUsed < usage.applicationsLimit
    } catch (error) {
      console.error('Error checking application limit:', error)
      return false
    }
  }

  // Check if user can create more bounties
  static async canCreateBounty(userId: string): Promise<boolean> {
    try {
      const usage = await this.getSubscriptionUsage(userId, 'business')
      const subscription = await this.getUserSubscription(userId)
      const isPremium = subscription?.tier === 'premium'
      
      if (isPremium) {
        return true // Unlimited for premium
      }
      
      return usage.bountiesCreated < usage.bountiesLimit
    } catch (error) {
      console.error('Error checking bounty limit:', error)
      return false
    }
  }



  // Get upgrade prompts based on user activity
  static async getUpgradePrompts(userId: string, userType: 'creator' | 'business'): Promise<any[]> {
    try {
      const usage = await this.getSubscriptionUsage(userId, userType)
      const subscription = await this.getUserSubscription(userId)
      const isPremium = subscription?.tier === 'premium'
      
      if (isPremium) {
        return [] // No prompts for premium users
      }
      
      const prompts = []
      
      // Application limit prompt for creators
      if (userType === 'creator' && usage.applicationsUsed >= usage.applicationsLimit) {
        prompts.push({
          type: 'application_limit',
          message: `You've used all ${usage.applicationsLimit} applications this month`,
          currentValue: usage.applicationsLimit,
          premiumValue: -1,
          cta: 'Upgrade to Unlimited Applications'
        })
      }
      
      // Bounty limit prompt for businesses
      if (userType === 'business' && usage.bountiesCreated >= usage.bountiesLimit) {
        prompts.push({
          type: 'bounty_limit',
          message: `You've created all ${usage.bountiesLimit} bounties this month`,
          currentValue: usage.bountiesLimit,
          premiumValue: -1,
          cta: 'Upgrade to Unlimited Bounties'
        })
      }
      
      // All creators get 100% of bounty amounts
      
      return prompts
    } catch (error) {
      console.error('Error getting upgrade prompts:', error)
      return []
    }
  }

  // Get subscription plan details
  static getSubscriptionPlan(planId: string): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS[planId] || null
  }

  // Get all subscription plans
  static getAllSubscriptionPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS)
  }

  // Map subscription plan ID to Stripe price ID
  static getStripePriceId(planId: string): string | null {
    switch (planId) {
      case 'creator_premium':
        return STRIPE_CONFIG.PRODUCTS.CREATOR_PREMIUM
      case 'business_premium':
        return STRIPE_CONFIG.PRODUCTS.BUSINESS_PREMIUM
      case 'creator_premium_yearly':
        return STRIPE_CONFIG.PRODUCTS.CREATOR_PREMIUM_YEARLY
      case 'business_premium_yearly':
        return STRIPE_CONFIG.PRODUCTS.BUSINESS_PREMIUM_YEARLY
      default:
        // If it's already a Stripe price ID (starts with 'price_'), return it
        if (planId.startsWith('price_')) {
          return planId
        }
        return null
    }
  }

  // Create Stripe Connect account for creator
  static async createConnectAccount(email: string, country: string = 'US') {
    try {
      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-connect-account',
          email,
          country,
        }),
      })

      const result = await handleApiResponse<{
        success: boolean;
        accountId: string;
        accountStatus: string;
        payoutsEnabled: boolean;
        chargesEnabled: boolean;
        requiresAction: boolean;
        message: string;
      }>(response)

      return result
    } catch (error) {
      console.error('Error creating Connect account:', error)
      throw error
    }
  }

  // Check Connect account status
  static async checkConnectStatus() {
    try {
      const response = await authenticatedFetch('/api/stripe?action=connect-account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await handleApiResponse<{
        success: boolean;
        hasConnectAccount: boolean;
        accountId?: string;
        accountStatus: string;
        payoutsEnabled: boolean;
        chargesEnabled: boolean;
        requiresAction: boolean;
        message: string;
        nextStep?: string;
      }>(response)

      return result
    } catch (error) {
      console.error('Error checking Connect status:', error)
      throw error
    }
  }

  // Create Connect account onboarding link
  static async createConnectOnboardingLink(accountId: string) {
    try {
      const response = await authenticatedFetch('/api/stripe', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-connect-onboarding-link',
          accountId,
        }),
      })

      const { url } = await handleApiResponse<{ url: string }>(response)
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No onboarding URL received from server')
      }
    } catch (error) {
      console.error('Error creating Connect onboarding link:', error)
      throw error
    }
  }
}
