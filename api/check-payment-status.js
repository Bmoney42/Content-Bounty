const { admin, db } = require('./lib/firebase')
const { verifyAuth } = require('./middleware/auth')

/**
 * Check Payment Status API
 * Helps debug payment issues and bounty creation
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Starting payment status check...')
    
    // Authentication
    const { user, error: authError } = await verifyAuth(req, res, { requireAuth: true })
    if (authError) {
      console.error('❌ Auth error:', authError)
      return res.status(authError.status).json({ error: authError.message })
    }

    console.log('✅ User authenticated:', user.uid, user.email)

    let escrowPayments = []
    let bounties = []
    let recentPayments = []

    try {
      // Get escrow payments for this user
      console.log('🔍 Fetching escrow payments...')
      const escrowQuery = db.collection('escrow_payments')
        .where('businessId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)

      const escrowSnapshot = await escrowQuery.get()
      console.log(`📊 Found ${escrowSnapshot.size} escrow payments`)

      escrowSnapshot.forEach(doc => {
        const data = doc.data()
        escrowPayments.push({
          id: doc.id,
          status: data.status,
          amount: data.amount,
          currency: data.currency || 'USD',
          bountyId: data.bountyId,
          hasBountyData: !!data.bountyData,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          stripeSessionId: data.stripeSessionId,
          stripeCustomerId: data.stripeCustomerId
        })
      })
    } catch (escrowError) {
      console.error('❌ Error fetching escrow payments:', escrowError.message)
      // Continue with empty array
    }

    try {
      // Get bounties for this user
      console.log('🔍 Fetching bounties...')
      const bountiesQuery = db.collection('bounties')
        .where('businessId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)

      const bountiesSnapshot = await bountiesQuery.get()
      console.log(`📊 Found ${bountiesSnapshot.size} bounties`)

      bountiesSnapshot.forEach(doc => {
        const data = doc.data()
        bounties.push({
          id: doc.id,
          title: data.title,
          status: data.status,
          paymentStatus: data.paymentStatus,
          escrowPaymentId: data.escrowPaymentId,
          applicationsCount: data.applicationsCount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString()
        })
      })
    } catch (bountiesError) {
      console.error('❌ Error fetching bounties:', bountiesError.message)
      // Continue with empty array
    }

    // Check for recent payments (last 24 hours)
    recentPayments = escrowPayments.filter(payment => {
      if (!payment.createdAt) return false
      const paymentDate = new Date(payment.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return paymentDate > oneDayAgo
    })

    const response = {
      success: true,
      user: {
        id: user.uid,
        email: user.email,
        userType: user.userType
      },
      summary: {
        totalEscrowPayments: escrowPayments.length,
        totalBounties: bounties.length,
        recentPayments: recentPayments.length,
        activeBounties: bounties.filter(b => b.status === 'active').length,
        pendingBounties: bounties.filter(b => b.status === 'pending').length
      },
      escrowPayments,
      bounties,
      recentPayments,
      environment: {
        frontendUrl: process.env.FRONTEND_URL || 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set',
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      }
    }

    console.log('✅ Payment status check completed successfully')
    res.status(200).json(response)

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    res.status(500).json({ 
      error: 'Failed to check payment status',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
