import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/authUtils'
import { StripeService } from '../services/stripe'
import { UserSubscription, SubscriptionPlan } from '../types/subscription'
import { useToast } from '../utils/toastUtils'

export const useSubscription = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgradePrompts, setUpgradePrompts] = useState<any[]>([])

  // Load subscription data
  const loadSubscription = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [subscriptionData, usageData, prompts] = await Promise.all([
        StripeService.getUserSubscription(user.id),
        StripeService.getSubscriptionUsage(user.id, user.userType || 'creator'),
        StripeService.getUpgradePrompts(user.id, user.userType || 'creator')
      ])

      setSubscription(subscriptionData)
      setUsage(usageData)
      setUpgradePrompts(prompts)
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Removed error toast notification
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.userType])

  // Check if user can apply to bounties
  const canApplyToBounty = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false
    return await StripeService.canApplyToBounty(user.id)
  }, [user?.id])

  // Check if user can create bounties
  const canCreateBounty = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false
    return await StripeService.canCreateBounty(user.id)
  }, [user?.id])



  // Upgrade to premium
  const upgradeToPremium = useCallback(async (planId: string) => {
    if (!user?.id || !user?.email) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please log in to upgrade your subscription.'
      })
      return
    }

    try {
      await StripeService.createCheckoutSession(planId, user.id, user.email)
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      addToast({
        type: 'error',
        title: 'Upgrade Failed',
        message: 'Failed to start the upgrade process. Please try again.'
      })
    }
  }, [user?.id, user?.email, addToast])

  // Manage subscription (customer portal)
  const manageSubscription = useCallback(async () => {
    if (!subscription?.stripeCustomerId) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No subscription found to manage.'
      })
      return
    }

    try {
      await StripeService.createCustomerPortalSession(subscription.stripeCustomerId)
    } catch (error) {
      console.error('Error opening customer portal:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to open subscription management. Please try again.'
      })
    }
  }, [subscription?.stripeCustomerId, addToast])

  // Update usage when applying to bounty
  const incrementApplicationCount = useCallback(async () => {
    if (!user?.id || !usage) return

    try {
      const newUsage = {
        ...usage,
        applicationsUsed: usage.applicationsUsed + 1
      }
      await StripeService.updateSubscriptionUsage(user.id, newUsage)
      setUsage(newUsage)
    } catch (error) {
      console.error('Error updating application count:', error)
    }
  }, [user?.id, usage])

  // Update usage when creating bounty
  const incrementBountyCount = useCallback(async () => {
    if (!user?.id || !usage) return

    try {
      const newUsage = {
        ...usage,
        bountiesCreated: usage.bountiesCreated + 1
      }
      await StripeService.updateSubscriptionUsage(user.id, newUsage)
      setUsage(newUsage)
    } catch (error) {
      console.error('Error updating bounty count:', error)
    }
  }, [user?.id, usage])

  // Update earnings (100% goes to creators)
  const updateEarnings = useCallback(async (bountyAmount: number) => {
    if (!user?.id || !usage) return

    try {
      const newUsage = {
        ...usage,
        totalEarnings: usage.totalEarnings + bountyAmount
      }
      await StripeService.updateSubscriptionUsage(user.id, newUsage)
      setUsage(newUsage)
    } catch (error) {
      console.error('Error updating earnings:', error)
    }
  }, [user?.id, usage])

  // Get subscription plan
  const getSubscriptionPlan = useCallback((planId: string): SubscriptionPlan | null => {
    return StripeService.getSubscriptionPlan(planId)
  }, [])

  // Get all subscription plans
  const getAllSubscriptionPlans = useCallback((): SubscriptionPlan[] => {
    return StripeService.getAllSubscriptionPlans()
  }, [])

  // Check if user is premium
  const isPremium = subscription?.tier === 'premium'

  // Check if subscription is active
  const isActive = subscription?.status === 'active'

  // Load subscription data on mount and when user changes
  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  return {
    // State
    subscription,
    usage,
    loading,
    upgradePrompts,
    isPremium,
    isActive,

    // Actions
    loadSubscription,
    canApplyToBounty,
    canCreateBounty,
    upgradeToPremium,
    manageSubscription,
    incrementApplicationCount,
    incrementBountyCount,
    updateEarnings,
    getSubscriptionPlan,
    getAllSubscriptionPlans,

    // Computed values
    applicationsRemaining: usage ? (usage.applicationsLimit === -1 ? -1 : usage.applicationsLimit - usage.applicationsUsed) : 0,
    bountiesRemaining: usage ? (usage.bountiesLimit === -1 ? -1 : usage.bountiesLimit - usage.bountiesCreated) : 0,
    hasReachedApplicationLimit: usage ? usage.applicationsUsed >= usage.applicationsLimit : false,
    hasReachedBountyLimit: usage ? usage.bountiesCreated >= usage.bountiesLimit : false,
  }
}
