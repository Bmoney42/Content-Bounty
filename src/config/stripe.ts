import { loadStripe } from '@stripe/stripe-js'

// Stripe publishable key - replace with your actual key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here'

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

// Stripe configuration
export const STRIPE_CONFIG = {
  // Product IDs - updated with actual Stripe price IDs
  PRODUCTS: {
    CREATOR_PREMIUM: 'price_1S4MMzHnrJ5Y7G90mqQbYEN7',
    BUSINESS_PREMIUM: 'price_1S4MNKHnrJ5Y7G90kRkTPrfE',
    CREATOR_PREMIUM_YEARLY: 'price_creator_premium_yearly', // TODO: Create yearly plans
    BUSINESS_PREMIUM_YEARLY: 'price_business_premium_yearly' // TODO: Create yearly plans
  },
  
  // Escrow configuration
  ESCROW: {
    // Single platform fee (covers all costs + revenue)
    PLATFORM_FEE_PERCENTAGE: 0.05, // 5% total fee (covers Stripe fees + platform revenue)
    
    // Payment status
    PAYMENT_STATUS: {
      PENDING: 'pending',
      HELD_IN_ESCROW: 'held_in_escrow',
      RELEASED: 'released',
      REFUNDED: 'refunded',
      FAILED: 'failed'
    },
    
    // Escrow hold duration (in days)
    HOLD_DURATION: 7, // 7 days to review content
    
    // Minimum bounty amount (after fees)
    MIN_BOUNTY_AMOUNT: 10, // $10 minimum for creator
    
    // Maximum bounty amount (after fees)
    MAX_BOUNTY_AMOUNT: 10000 // $10,000 maximum for creator
  },
  
  // Success and cancel URLs
  SUCCESS_URL: `${window.location.origin}/dashboard?upgrade=success`,
  CANCEL_URL: `${window.location.origin}/dashboard?upgrade=canceled`,
  
  // Escrow payment URLs
  ESCROW_SUCCESS_URL: `${window.location.origin}/bounties?payment=success`,
  ESCROW_CANCEL_URL: `${window.location.origin}/bounties/new?payment=canceled`,
  
  // Webhook events we handle
  EVENTS: {
    CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
    CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
    // Escrow events
    PAYMENT_INTENT_CREATED: 'payment_intent.created',
    PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_INTENT_FAILED: 'payment_intent.failed',
    TRANSFER_CREATED: 'transfer.created',
    TRANSFER_PAID: 'transfer.paid'
  }
}

// Helper function to get Stripe instance
export const getStripe = async () => {
  return await stripePromise
}

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Helper function to calculate platform fee (single 5% fee)
export const calculatePlatformFee = (bountyAmount: number) => {
  const platformFee = bountyAmount * STRIPE_CONFIG.ESCROW.PLATFORM_FEE_PERCENTAGE
  return Math.round(platformFee * 100) / 100
}

// Helper function to calculate total amount business pays (bounty + 5% fee)
export const calculateBusinessTotal = (bountyAmount: number, creatorCount: number = 1) => {
  const totalBountyAmount = bountyAmount * creatorCount
  const platformFee = calculatePlatformFee(totalBountyAmount)
  return Math.round((totalBountyAmount + platformFee) * 100) / 100
}

// Helper function to calculate creator earnings (full bounty amount, no platform commission)
export const calculateCreatorEarnings = (bountyAmount: number) => {
  return bountyAmount // 100% of bounty amount (fees paid by business)
}

// Helper function to calculate escrow amounts with fee breakdown
export const calculateEscrowAmounts = (bountyAmount: number, creatorCount: number = 1) => {
  const totalBountyAmount = bountyAmount * creatorCount
  const platformFee = calculatePlatformFee(totalBountyAmount)
  const businessTotal = calculateBusinessTotal(bountyAmount, creatorCount)
  
  return {
    // What business pays
    businessTotal: businessTotal,
    bountyAmount: bountyAmount, // Per-creator amount
    totalBountyAmount: totalBountyAmount, // Total bounty amount for all creators
    platformFee: platformFee,
    creatorCount: creatorCount,
    
    // What creator(s) receive
    creatorEarnings: bountyAmount, // 100% of per-creator bounty (platform fee paid by business)
    
    // Platform revenue (5% covers all costs)
    platformCommission: platformFee,
    totalCommission: platformFee
  }
}

// Helper function to validate bounty amount
export const validateBountyAmount = (amount: number): { isValid: boolean; error?: string; businessTotal?: number } => {
  if (amount < STRIPE_CONFIG.ESCROW.MIN_BOUNTY_AMOUNT) {
    return {
      isValid: false,
      error: `Minimum bounty amount is ${formatCurrency(STRIPE_CONFIG.ESCROW.MIN_BOUNTY_AMOUNT)} for creators`
    }
  }
  
  if (amount > STRIPE_CONFIG.ESCROW.MAX_BOUNTY_AMOUNT) {
    return {
      isValid: false,
      error: `Maximum bounty amount is ${formatCurrency(STRIPE_CONFIG.ESCROW.MAX_BOUNTY_AMOUNT)} for creators`
    }
  }
  
  const businessTotal = calculateBusinessTotal(amount)
  
  return { 
    isValid: true, 
    businessTotal 
  }
}

// Helper function to format fee breakdown for display
export const formatFeeBreakdown = (bountyAmount: number, creatorCount: number = 1) => {
  const amounts = calculateEscrowAmounts(bountyAmount, creatorCount)
  
  return {
    bountyAmount: formatCurrency(amounts.bountyAmount),
    platformFee: formatCurrency(amounts.platformFee),
    businessTotal: formatCurrency(amounts.businessTotal),
    creatorEarnings: formatCurrency(amounts.creatorEarnings),
    creatorCount: creatorCount
  }
}
