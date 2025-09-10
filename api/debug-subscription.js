const { admin, db } = require('./lib/firebase')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * Debug Subscription Issues
 * Helps diagnose why subscriptions aren't being created/updated properly
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { userId, email, action } = req.body || req.query

    if (!action) {
      return res.status(400).json({ 
        error: 'Missing action parameter. Use: check-user, check-stripe, check-webhook, fix-subscription' 
      })
    }

    console.log(`🔍 Debug action: ${action} for user: ${userId || email}`)

    switch (action) {
      case 'check-user':
        return await checkUserSubscription(userId, email, res)
      
      case 'check-stripe':
        return await checkStripeCustomer(userId, email, res)
      
      case 'check-webhook':
        return await checkWebhookEvents(userId, email, res)
      
      case 'fix-subscription':
        return await fixSubscription(userId, email, res)
      
      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: check-user, check-stripe, check-webhook, fix-subscription' 
        })
    }
  } catch (error) {
    console.error('❌ Debug subscription error:', error)
    return res.status(500).json({ 
      error: 'Debug failed', 
      message: error.message,
      stack: error.stack 
    })
  }
}

// Check user's subscription in Firestore
async function checkUserSubscription(userId, email, res) {
  try {
    let userDoc = null
    let subscriptionDoc = null

    // Find user by ID or email
    if (userId) {
      userDoc = await db.collection('users').doc(userId).get()
    } else if (email) {
      const usersQuery = await db.collection('users').where('email', '==', email).limit(1).get()
      if (!usersQuery.empty) {
        userDoc = usersQuery.docs[0]
        userId = userDoc.id
      }
    }

    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        searched: { userId, email }
      })
    }

    const userData = userDoc.data()
    console.log('👤 User found:', { id: userId, email: userData.email, userType: userData.userType })

    // Check subscription
    subscriptionDoc = await db.collection('subscriptions').doc(userId).get()
    const subscriptionData = subscriptionDoc.exists ? subscriptionDoc.data() : null

    return res.status(200).json({
      user: {
        id: userId,
        email: userData.email,
        userType: userData.userType,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt
      },
      subscription: subscriptionData ? {
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        planId: subscriptionData.planId,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        currentPeriodStart: subscriptionData.currentPeriodStart?.toDate?.() || subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd?.toDate?.() || subscriptionData.currentPeriodEnd,
        createdAt: subscriptionData.createdAt?.toDate?.() || subscriptionData.createdAt
      } : null,
      message: subscriptionData ? 'Subscription found' : 'No subscription found'
    })
  } catch (error) {
    console.error('Error checking user subscription:', error)
    return res.status(500).json({ error: 'Failed to check user subscription', message: error.message })
  }
}

// Check Stripe customer and subscriptions
async function checkStripeCustomer(userId, email, res) {
  try {
    let customer = null
    let subscriptions = []

    // Find customer by email
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        customer = customers.data[0]
      }
    }

    if (!customer) {
      return res.status(404).json({ 
        error: 'Stripe customer not found',
        searched: { email }
      })
    }

    console.log('💳 Stripe customer found:', { id: customer.id, email: customer.email })

    // Get subscriptions
    const subs = await stripe.subscriptions.list({ customer: customer.id })
    subscriptions = subs.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000),
      current_period_end: new Date(sub.current_period_end * 1000),
      plan: sub.items.data[0]?.price?.id,
      metadata: sub.metadata
    }))

    return res.status(200).json({
      customer: {
        id: customer.id,
        email: customer.email,
        created: new Date(customer.created * 1000),
        metadata: customer.metadata
      },
      subscriptions: subscriptions,
      message: `Found ${subscriptions.length} subscription(s)`
    })
  } catch (error) {
    console.error('Error checking Stripe customer:', error)
    return res.status(500).json({ error: 'Failed to check Stripe customer', message: error.message })
  }
}

// Check recent webhook events
async function checkWebhookEvents(userId, email, res) {
  try {
    // Get recent events (last 24 hours)
    const events = await stripe.events.list({ 
      limit: 50,
      created: {
        gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
      }
    })

    const relevantEvents = events.data.filter(event => {
      // Filter for subscription-related events
      return event.type.includes('subscription') || 
             event.type.includes('invoice') ||
             (event.data.object && 
              (event.data.object.customer_email === email || 
               event.data.object.metadata?.userId === userId))
    })

    const eventDetails = relevantEvents.map(event => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000),
      data: {
        object_id: event.data.object?.id,
        customer_email: event.data.object?.customer_email,
        metadata: event.data.object?.metadata,
        status: event.data.object?.status
      }
    }))

    return res.status(200).json({
      events: eventDetails,
      total: relevantEvents.length,
      message: `Found ${relevantEvents.length} relevant webhook events in last 24 hours`
    })
  } catch (error) {
    console.error('Error checking webhook events:', error)
    return res.status(500).json({ error: 'Failed to check webhook events', message: error.message })
  }
}

// Fix subscription by manually creating it
async function fixSubscription(userId, email, res) {
  try {
    // First check if user exists
    let userDoc = null
    if (userId) {
      userDoc = await db.collection('users').doc(userId).get()
    } else if (email) {
      const usersQuery = await db.collection('users').where('email', '==', email).limit(1).get()
      if (!usersQuery.empty) {
        userDoc = usersQuery.docs[0]
        userId = userDoc.id
      }
    }

    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if subscription already exists
    const existingSub = await db.collection('subscriptions').doc(userId).get()
    if (existingSub.exists) {
      return res.status(400).json({ 
        error: 'Subscription already exists',
        subscription: existingSub.data()
      })
    }

    // Find Stripe customer
    let customer = null
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        customer = customers.data[0]
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'Stripe customer not found' })
    }

    // Get active subscription
    const subs = await stripe.subscriptions.list({ 
      customer: customer.id, 
      status: 'active',
      limit: 1 
    })

    if (subs.data.length === 0) {
      return res.status(404).json({ error: 'No active Stripe subscription found' })
    }

    const subscription = subs.data[0]

    // Create subscription in Firestore
    const subscriptionData = {
      userId: userId,
      tier: 'premium',
      status: subscription.status,
      planId: subscription.metadata?.planId || 'creator_premium',
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }

    await db.collection('subscriptions').doc(userId).set(subscriptionData)

    console.log('✅ Subscription fixed for user:', userId)

    return res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: subscriptionData
    })
  } catch (error) {
    console.error('Error fixing subscription:', error)
    return res.status(500).json({ error: 'Failed to fix subscription', message: error.message })
  }
}
