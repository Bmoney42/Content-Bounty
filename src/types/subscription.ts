export type UserTier = 'free' | 'premium'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  applicationLimit?: number
  bountyLimit?: number
  stripePriceId?: string
}

export interface UserSubscription {
  id: string
  userId: string
  tier: UserTier
  status: SubscriptionStatus
  planId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionUsage {
  userId: string
  month: string // YYYY-MM format
  applicationsUsed: number
  applicationsLimit: number
  bountiesCreated: number
  bountiesLimit: number
  totalEarnings: number
}

export interface UpgradePrompt {
  type: 'application_limit' | 'bounty_limit' | 'feature_upgrade'
  message: string
  currentValue: number
  premiumValue: number
  savings?: number
  cta: string
}

// No commission rates needed - 100% goes to creators

// Application limits
export const APPLICATION_LIMITS = {
  FREE_CREATOR: 3,
  PREMIUM_CREATOR: -1, // unlimited
  FREE_BUSINESS: 2,
  PREMIUM_BUSINESS: -1 // unlimited
} as const

// Subscription plans
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  CREATOR_PREMIUM: {
    id: 'creator_premium',
    name: 'Creator Premium',
    price: 14.99,
    interval: 'month',
    features: [
      'Unlimited applications',
      'Zero platform fees',
      'Priority placement',
      'Enhanced profile',
      'Advanced analytics',
      'Priority support',
      'Brand Discovery Engine',
      'Lead Management CRM',
      'Sponsorship Signal Detection',
      'Email Template Library',
      'Outreach Tracking'
    ],
    applicationLimit: APPLICATION_LIMITS.PREMIUM_CREATOR
  },
  BUSINESS_PREMIUM: {
    id: 'business_premium',
    name: 'Business Premium',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited bounties',
      'Priority placement',
      'Enhanced bounty creation',
      'Advanced analytics',
      'Priority support',
      'Team collaboration'
    ],

    bountyLimit: APPLICATION_LIMITS.PREMIUM_BUSINESS
  }
}
