const { admin, db } = require('./lib/firebase')
const { verifyAuth } = require('./middleware/auth')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * Manual Bounty Creation API
 * Creates a bounty and escrow record from a successful Stripe payment
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authentication
    const { user, error: authError } = await verifyAuth(req, res, { requireAuth: true })
    if (authError) {
      return res.status(authError.status).json({ error: authError.message })
    }

    const { paymentIntentId, bountyData } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' })
    }

    console.log('🔍 Creating bounty from payment:', paymentIntentId)

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful', 
        status: paymentIntent.status 
      })
    }

    console.log('✅ Payment verified:', paymentIntent.amount, paymentIntent.currency)

    // Create escrow payment record
    const escrowPaymentData = {
      businessId: user.uid,
      businessEmail: user.email,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: 'stripe',
      metadata: paymentIntent.metadata || {}
    }

    // Add bounty data if provided
    if (bountyData) {
      escrowPaymentData.bountyData = bountyData
    }

    const escrowRef = await db.collection('escrow_payments').add(escrowPaymentData)
    console.log('✅ Escrow payment created:', escrowRef.id)

    // Create bounty record
    const bountyDataToCreate = {
      businessId: user.uid,
      businessEmail: user.email,
      title: bountyData?.title || 'Promote Creator Bounty',
      description: bountyData?.description || 'Fund this bounty to make it live on the marketplace',
      amount: escrowPaymentData.amount,
      currency: escrowPaymentData.currency,
      status: 'active',
      paymentStatus: 'completed',
      escrowPaymentId: escrowRef.id,
      applicationsCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      category: bountyData?.category || 'marketing',
      requirements: bountyData?.requirements || [],
      deadline: bountyData?.deadline || null,
      tags: bountyData?.tags || []
    }

    const bountyRef = await db.collection('bounties').add(bountyDataToCreate)
    console.log('✅ Bounty created:', bountyRef.id)

    // Update escrow payment with bounty ID
    await escrowRef.update({
      bountyId: bountyRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.status(200).json({
      success: true,
      message: 'Bounty created successfully',
      data: {
        escrowPaymentId: escrowRef.id,
        bountyId: bountyRef.id,
        amount: escrowPaymentData.amount,
        currency: escrowPaymentData.currency,
        status: 'active'
      }
    })

  } catch (error) {
    console.error('❌ Error creating bounty:', error)
    res.status(500).json({ 
      error: 'Failed to create bounty',
      message: error.message
    })
  }
}
