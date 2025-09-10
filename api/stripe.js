const { admin, db } = require('./lib/firebase')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { verifyAuth } = require('./middleware/auth')
const { paymentRateLimit } = require('./middleware/rateLimit')

/**
 * Unified Stripe API Handler
 * Handles all Stripe-related operations in a single endpoint
 * Routes based on action parameter in request body
 * Updated: HTTPS redirect URLs fix
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  console.log('🔵 Stripe API called:', {
    method: req.method,
    body: req.body ? JSON.stringify(req.body) : 'No body',
    hasAuth: !!req.headers.authorization
  })

  try {
    // Check Stripe secret key first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY environment variable not set')
      return res.status(500).json({ error: 'Stripe configuration missing' })
    }
    console.log('✅ Stripe secret key found')

    // Rate limiting for all Stripe operations
    const rateLimitResult = paymentRateLimit(req, res)
    if (rateLimitResult) {
      console.log('⚠️ Rate limit hit')
      return
    }

    // Authentication for all operations
    console.log('🔐 Starting authentication...')
    const { user, error: authError } = await verifyAuth(req, res, { requireAuth: true })
    if (authError) {
      console.error('❌ Authentication failed:', authError)
      return res.status(authError.status).json({ error: authError.message })
    }
    console.log('✅ Authentication successful for user:', user.uid)

    // Extract action from body (POST) or query params (GET)
    const action = req.body?.action || req.query?.action
    console.log('🎯 Action requested:', action, 'Method:', req.method, 'Query:', req.query, 'Body:', req.body)
    switch (action) {
      case 'create-checkout-session':
        return await handleCheckoutSession(req, res, user)
      
      case 'create-escrow-payment':
        return await handleEscrowPayment(req, res, user)
      
      case 'create-escrow-payment-upfront':
        return await handleEscrowPaymentUpfront(req, res, user)
      
      case 'payment-history':
        return await handlePaymentHistory(req, res, user)
      
      case 'create-portal-session':
        return await handlePortalSession(req, res, user)
      
      case 'connect-account':
        return await handleConnectAccount(req, res, user)
      
      case 'create-connect-account':
        return await handleCreateConnectAccount(req, res, user)
      
      case 'create-connect-onboarding-link':
        return await handleCreateConnectOnboardingLink(req, res, user)
      
      case 'refund-escrow-payment':
        return await handleRefundEscrow(req, res, user)
      
      case 'release-escrow-payment':
        return await handleReleaseEscrow(req, res, user)
      
      default:
        return res.status(400).json({ error: 'Invalid action. Supported actions: create-checkout-session, create-escrow-payment, create-escrow-payment-upfront, payment-history, create-portal-session, connect-account, create-connect-account, create-connect-onboarding-link, refund-escrow-payment, release-escrow-payment' })
    }
  } catch (error) {
    console.error('❌ Stripe API error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    })
    
    // Return more specific error information
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Checkout Session Handler
async function handleCheckoutSession(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId, successUrl, cancelUrl } = req.body

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields: priceId, successUrl, cancelUrl' })
    }

    console.log('Creating checkout session for user:', user.uid, 'priceId:', priceId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: { userId: user.uid, userType: user.userType }
    })

    console.log('✅ Checkout session created successfully:', session.id)
    res.status(200).json({ sessionId: session.id, url: session.url })
    
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error)
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: `Invalid request: ${error.message}` })
    }
    
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' })
  }
}

// Escrow Payment Handler
async function handleEscrowPayment(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (user.userType !== 'business') {
    return res.status(403).json({ error: 'Only business users can create escrow payments' })
  }

  const { bountyId, amount, currency = 'USD' } = req.body

  if (!bountyId || !amount) {
    return res.status(400).json({ error: 'Missing required fields: bountyId, amount' })
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.uid, userType: user.userType }
    })
    customerId = customer.id
    await db.collection('users').doc(user.uid).update({ stripeCustomerId: customerId })
  }

  // Get bounty details for checkout session
  const bountyDoc = await db.collection('bounties').doc(bountyId).get()
  const bountyData = bountyDoc.data()
  
  if (!bountyData) {
    return res.status(404).json({ error: 'Bounty not found' })
  }

  // Create escrow payment document first
  const escrowRef = await db.collection('escrow_payments').add({
    bountyId,
    businessId: user.uid,
    amount,
    currency,
    status: 'pending',
    stripeCustomerId: customerId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  const escrowPaymentId = escrowRef.id

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Fund Bounty: ${bountyData.title}`,
            description: `Fund this bounty to make it live on the marketplace`,
          },
          unit_amount: amount, // amount is already in cents from frontend
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'https://creatorbounty.xyz'}/bounties?payment=success&escrow=${escrowPaymentId}`,
    cancel_url: `${process.env.FRONTEND_URL || 'https://creatorbounty.xyz'}/bounties?payment=canceled`,
    metadata: { 
      escrowPaymentId: escrowPaymentId,
      bountyId, 
      businessId: user.uid, 
      type: 'escrow_payment' 
    }
  })

  // Update escrow payment with session details
  await db.collection('escrow_payments').doc(escrowPaymentId).update({
    stripeSessionId: session.id
  })

  res.status(200).json({ 
    escrowPaymentId: escrowPaymentId,
    sessionId: session.id,
    checkoutUrl: session.url
  })
}

// Escrow Payment Upfront Handler
async function handleEscrowPaymentUpfront(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (user.userType !== 'business') {
    return res.status(403).json({ error: 'Only business users can create upfront payments' })
  }

  const { bountyData, amount, currency = 'USD' } = req.body

  if (!bountyData || !amount) {
    return res.status(400).json({ error: 'Missing required fields: bountyData, amount' })
  }

  // Store bounty data in escrow payment (bounty will be created after successful payment)
  const escrowData = {
    bountyData: {
      ...bountyData,
      businessId: user.uid,
      businessEmail: user.email,
      applicationsCount: 0,
      paymentStatus: 'pending'
    },
    businessId: user.uid,
    amount,
    currency,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.uid, userType: user.userType }
    })
    customerId = customer.id
    await db.collection('users').doc(user.uid).update({ stripeCustomerId: customerId })
  }

  // Create escrow payment document first to get ID
  const escrowRef = await db.collection('escrow_payments').add(escrowData)
  const escrowPaymentId = escrowRef.id

  // Create Stripe Checkout session instead of Payment Intent
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Bounty: ${bountyData.title}`,
            description: bountyData.description,
          },
          unit_amount: amount, // amount is already in cents from frontend
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'https://creatorbounty.xyz'}/bounties?payment=success&escrow=${escrowPaymentId}`,
    cancel_url: `${process.env.FRONTEND_URL || 'https://creatorbounty.xyz'}/bounties/new?payment=canceled`,
    metadata: { 
      escrowPaymentId: escrowPaymentId,
      businessId: user.uid, 
      type: 'upfront_escrow_payment' 
    }
  })

  // Update escrow payment with Stripe details
  await db.collection('escrow_payments').doc(escrowPaymentId).update({
    stripeSessionId: session.id,
    stripeCustomerId: customerId
  })

  res.status(200).json({ 
    escrowPaymentId: escrowPaymentId,
    sessionId: session.id,
    checkoutUrl: session.url
  })
}

// Payment History Handler
async function handlePaymentHistory(req, res, user) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = user.uid
  const userType = user.userType
  
  let query
  if (userType === 'business') {
    query = db.collection('escrow_payments')
      .where('businessId', '==', userId)
      .orderBy('createdAt', 'desc')
  } else if (userType === 'creator') {
    query = db.collection('escrow_payments')
      .where('creatorId', '==', userId)
      .orderBy('createdAt', 'desc')
  } else {
    return res.status(403).json({ error: 'Invalid user type' })
  }

  const querySnapshot = await query.get()
  const payments = []

  querySnapshot.forEach(doc => {
    const data = doc.data()
    payments.push({
      id: doc.id,
      bountyId: data.bountyId,
      businessId: data.businessId,
      creatorId: data.creatorId,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status,
      creatorEarnings: data.creatorEarnings,
      stripeCustomerId: data.stripeCustomerId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeTransferId: data.stripeTransferId,
      stripeRefundId: data.stripeRefundId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      heldUntil: data.heldUntil?.toDate?.()?.toISOString() || data.heldUntil,
      releasedAt: data.releasedAt?.toDate?.()?.toISOString() || data.releasedAt,
      refundedAt: data.refundedAt?.toDate?.()?.toISOString() || data.refundedAt,
      failureReason: data.failureReason,
    })
  })

  res.status(200).json({
    success: true,
    type: userType,
    payments,
    userId
  })
}

// Portal Session Handler
async function handlePortalSession(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (user.userType !== 'business') {
    return res.status(403).json({ error: 'Only business users can access billing portal' })
  }

  const { returnUrl } = req.body
  if (!returnUrl) {
    return res.status(400).json({ error: 'Missing required field: returnUrl' })
  }

  const businessRef = db.collection('users').doc(user.uid)
  const businessSnap = await businessRef.get()

  if (!businessSnap.exists) {
    return res.status(404).json({ error: 'Business user not found' })
  }

  const businessData = businessSnap.data()
  const customerId = businessData.stripeCustomerId

  if (!customerId) {
    return res.status(400).json({ error: 'No Stripe customer ID found. Please complete a payment first.' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  res.status(200).json({ url: session.url })
}

// Connect Account Handler
async function handleConnectAccount(req, res, user) {
  if (user.userType !== 'creator') {
    return res.status(403).json({ error: 'Only creators can manage Connect accounts' })
  }

  if (req.method === 'POST') {
    return await handleCreateConnectAccount(req, res, user)
  } else if (req.method === 'GET') {
    return await handleCheckConnectStatus(req, res, user)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleCreateConnectAccount(req, res, user) {
  console.log('🏦 Creating Connect account for user:', user.uid)
  console.log('📝 Request data:', { email: req.body.email, country: req.body.country })
  
  try {
    const { email, country = 'US' } = req.body
    const creatorId = user.uid

    if (!email) {
      console.error('❌ Missing email field')
      return res.status(400).json({ error: 'Missing required field: email' })
    }

    console.log('🔍 Checking if creator exists in Firebase...')
    const creatorRef = db.collection('users').doc(creatorId)
    const creatorSnap = await creatorRef.get()

    if (!creatorSnap.exists) {
      console.error('❌ Creator not found in Firebase:', creatorId)
      return res.status(404).json({ error: 'Creator not found' })
    }

    const creatorData = creatorSnap.data()
    console.log('✅ Creator found:', { id: creatorId, hasConnectAccount: !!creatorData.stripeConnectAccountId })
    
    if (creatorData.stripeConnectAccountId) {
      console.log('🔄 Existing Connect account found, retrieving...')
      const existingAccount = await stripe.accounts.retrieve(creatorData.stripeConnectAccountId)
      console.log('✅ Retrieved existing account:', existingAccount.id)
      return res.status(200).json({
        success: true,
        accountId: existingAccount.id,
        accountStatus: existingAccount.details_submitted ? 'complete' : 'incomplete',
        payoutsEnabled: existingAccount.payouts_enabled,
        chargesEnabled: existingAccount.charges_enabled,
        requiresAction: !existingAccount.details_submitted,
      })
    }

    console.log('🏗️ Creating new Stripe Connect account...')
    const account = await stripe.accounts.create({
      type: 'standard',
      country: country,
      email: email,
      metadata: { creatorId, userType: 'creator' },
    })
    console.log('✅ Stripe Connect account created:', account.id)

    console.log('💾 Updating Firebase user document...')
    await creatorRef.update({
      stripeConnectAccountId: account.id,
      connectAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log('✅ Firebase updated successfully')

    console.log('🎉 Connect account creation completed successfully')
    res.status(200).json({
      success: true,
      accountId: account.id,
      accountStatus: 'incomplete',
      payoutsEnabled: false,
      chargesEnabled: false,
      requiresAction: true,
      message: 'Connect account created successfully. Complete onboarding to receive payouts.',
    })
  } catch (error) {
    console.error('❌ Error in handleCreateConnectAccount:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: error.type
    })
    return res.status(500).json({ 
      error: 'Failed to create Connect account',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

async function handleCheckConnectStatus(req, res, user) {
  const creatorId = user.uid
  const creatorRef = db.collection('users').doc(creatorId)
  const creatorSnap = await creatorRef.get()

  if (!creatorSnap.exists) {
    return res.status(404).json({ error: 'Creator not found' })
  }

  const creatorData = creatorSnap.data()

  if (!creatorData.stripeConnectAccountId) {
    return res.status(200).json({
      success: true,
      hasConnectAccount: false,
      accountStatus: 'not_created',
      payoutsEnabled: false,
      chargesEnabled: false,
      requiresAction: true,
      message: 'No Connect account found. Create one to receive payouts.',
      nextStep: 'create_account',
    })
  }

  const account = await stripe.accounts.retrieve(creatorData.stripeConnectAccountId)

  res.status(200).json({
    success: true,
    hasConnectAccount: true,
    accountId: account.id,
    accountStatus: account.details_submitted && account.payouts_enabled ? 'active' : 'incomplete',
    payoutsEnabled: account.payouts_enabled,
    chargesEnabled: account.charges_enabled,
    requiresAction: !account.details_submitted,
    message: account.details_submitted && account.payouts_enabled ? 
      'Account fully verified and ready for payouts' : 
      'Account setup in progress',
  })
}

// Refund Escrow Handler
async function handleRefundEscrow(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (user.userType !== 'business') {
    return res.status(403).json({ error: 'Only business users can refund payments' })
  }

  const { escrowPaymentId, reason } = req.body

  if (!escrowPaymentId) {
    return res.status(400).json({ error: 'Missing required field: escrowPaymentId' })
  }

  const escrowRef = db.collection('escrow_payments').doc(escrowPaymentId)
  const escrowSnap = await escrowRef.get()

  if (!escrowSnap.exists) {
    return res.status(404).json({ error: 'Escrow payment not found' })
  }

  const escrowData = escrowSnap.data()

  if (escrowData.businessId !== user.uid) {
    return res.status(403).json({ error: 'You can only refund your own payments' })
  }

  if (escrowData.status !== 'held_in_escrow') {
    return res.status(400).json({ error: 'Can only refund payments held in escrow' })
  }

  const refund = await stripe.refunds.create({
    payment_intent: escrowData.stripePaymentIntentId,
    reason: reason || 'requested_by_customer'
  })

  await escrowRef.update({
    status: 'refunded',
    stripeRefundId: refund.id,
    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
    refundReason: reason
  })

  res.status(200).json({
    success: true,
    refundId: refund.id,
    status: 'refunded',
    amount: refund.amount / 100
  })
}

// Release Escrow Handler
async function handleReleaseEscrow(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (user.userType !== 'business') {
    return res.status(403).json({ error: 'Only business users can release payments' })
  }

  const { escrowPaymentId } = req.body

  if (!escrowPaymentId) {
    return res.status(400).json({ error: 'Missing required field: escrowPaymentId' })
  }

  const escrowRef = db.collection('escrow_payments').doc(escrowPaymentId)
  const escrowSnap = await escrowRef.get()

  if (!escrowSnap.exists) {
    return res.status(404).json({ error: 'Escrow payment not found' })
  }

  const escrowData = escrowSnap.data()

  if (escrowData.businessId !== user.uid) {
    return res.status(403).json({ error: 'You can only release your own payments' })
  }

  if (escrowData.status !== 'ready_for_release') {
    return res.status(400).json({ error: 'Payment is not ready for release' })
  }

  // Transfer to creator's Connect account
  const transfer = await stripe.transfers.create({
    amount: Math.round(escrowData.creatorEarnings * 100),
    currency: escrowData.currency || 'USD',
    destination: escrowData.creatorConnectAccountId,
    transfer_group: escrowPaymentId
  })

  await escrowRef.update({
    status: 'released',
    stripeTransferId: transfer.id,
    releasedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  res.status(200).json({
    success: true,
    transferId: transfer.id,
    status: 'released',
    amount: escrowData.creatorEarnings
  })
}

// Create Connect onboarding link
async function handleCreateConnectOnboardingLink(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accountId } = req.body

  if (!accountId) {
    return res.status(400).json({ error: 'Missing required field: accountId' })
  }

  try {
    // Use HTTPS URLs for production (required by Stripe live mode)
    // Default to production URL since we're deployed
    const baseUrl = process.env.FRONTEND_URL || 'https://creatorbounty.xyz'
    
    console.log('🔗 Creating onboarding link with URLs:', {
      baseUrl,
      refreshUrl: `${baseUrl}/creator-banking?refresh=true`,
      returnUrl: `${baseUrl}/creator-banking?success=true`,
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    })
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/creator-banking?refresh=true`,
      return_url: `${baseUrl}/creator-banking?success=true`,
      type: 'account_onboarding',
    })
    
    console.log('✅ Onboarding link created successfully:', accountLink.url)

    res.status(200).json({
      success: true,
      url: accountLink.url
    })
  } catch (error) {
    console.error('Error creating Connect onboarding link:', error)
    res.status(500).json({ error: 'Failed to create onboarding link' })
  }
}
