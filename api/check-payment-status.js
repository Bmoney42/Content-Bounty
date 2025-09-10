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
    // Authentication
    const { user, error: authError } = await verifyAuth(req, res, { requireAuth: true })
    if (authError) {
      return res.status(authError.status).json({ error: authError.message })
    }

    console.log('🔍 Checking payment status for user:', user.uid)

    // Get escrow payments for this user
    const escrowQuery = db.collection('escrow_payments')
      .where('businessId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)

    const escrowSnapshot = await escrowQuery.get()
    const escrowPayments = []

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

    // Get bounties for this user
    const bountiesQuery = db.collection('bounties')
      .where('businessId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)

    const bountiesSnapshot = await bountiesQuery.get()
    const bounties = []

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

    // Check for recent payments (last 24 hours)
    const recentPayments = escrowPayments.filter(payment => {
      const paymentDate = new Date(payment.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return paymentDate > oneDayAgo
    })

    res.status(200).json({
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
    })

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    res.status(500).json({ 
      error: 'Failed to check payment status',
      message: error.message
    })
  }
}
