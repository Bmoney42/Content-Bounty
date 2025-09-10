const { admin, db } = require('./lib/firebase')
const { verifyAuth } = require('./middleware/auth')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * Link Existing Bounty with Payment API
 * Links an existing pending bounty with a successful Stripe payment
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

    const { paymentIntentId, bountyId } = req.body

    if (!paymentIntentId || !bountyId) {
      return res.status(400).json({ error: 'Both Payment Intent ID and Bounty ID are required' })
    }

    console.log('🔗 Linking bounty with payment:', { bountyId, paymentIntentId })

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful', 
        status: paymentIntent.status 
      })
    }

    console.log('✅ Payment verified:', paymentIntent.amount, paymentIntent.currency)

    // Get the existing bounty
    const bountyDoc = await db.collection('bounties').doc(bountyId).get()
    if (!bountyDoc.exists) {
      return res.status(404).json({ error: 'Bounty not found' })
    }

    const bountyData = bountyDoc.data()
    
    // Verify the bounty belongs to the user
    if (bountyData.businessId !== user.uid) {
      return res.status(403).json({ error: 'Bounty does not belong to this user' })
    }

    // Check if bounty is already linked to a payment
    if (bountyData.escrowPaymentId) {
      return res.status(400).json({ 
        error: 'Bounty is already linked to a payment',
        existingEscrowPaymentId: bountyData.escrowPaymentId
      })
    }

    // Create escrow payment record
    const escrowPaymentData = {
      businessId: user.uid,
      businessEmail: user.email,
      bountyId: bountyId,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: 'held_in_escrow',
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: 'stripe',
      metadata: paymentIntent.metadata || {}
    }

    const escrowRef = await db.collection('escrow_payments').add(escrowPaymentData)
    console.log('✅ Escrow payment created:', escrowRef.id)

    // Update the bounty to link it with the escrow payment and activate it
    await db.collection('bounties').doc(bountyId).update({
      escrowPaymentId: escrowRef.id,
      status: 'active', // Change from 'pending' to 'active'
      paymentStatus: 'held_in_escrow',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log('✅ Bounty linked and activated:', bountyId)

    res.status(200).json({
      success: true,
      message: 'Bounty successfully linked with payment and activated',
      data: {
        bountyId: bountyId,
        escrowPaymentId: escrowRef.id,
        bountyTitle: bountyData.title,
        amount: escrowPaymentData.amount,
        currency: escrowPaymentData.currency,
        status: 'active'
      }
    })

  } catch (error) {
    console.error('❌ Error linking bounty with payment:', error)
    res.status(500).json({ 
      error: 'Failed to link bounty with payment',
      message: error.message
    })
  }
}
