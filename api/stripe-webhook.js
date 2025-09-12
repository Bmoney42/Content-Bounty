const Stripe = require('stripe')
const admin = require('firebase-admin')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const firebaseDB = admin.firestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  console.error('❌ STRIPE_WEBHOOK_SECRET environment variable not set')
  throw new Error('Stripe webhook secret not configured')
}

module.exports = async function handler(req, res) {
  console.log('🔔 Stripe Webhook received:', {
    method: req.method,
    url: req.url,
    headers: {
      'stripe-signature': req.headers['stripe-signature'] ? 'present' : 'missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  })

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const rawBody = req.body

  if (!sig) {
    console.error('❌ Missing Stripe signature header')
    return res.status(400).json({ error: 'Missing Stripe signature' })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    console.log('✅ Webhook signature verified for event:', event.type, event.id)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  console.log('📨 Processing webhook event:', event.type, 'ID:', event.id)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object)
        break
      
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object)
        break
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully:', event.type, event.id)
    res.status(200).json({ received: true, eventId: event.id, eventType: event.type })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    console.error('Event details:', { type: event.type, id: event.id })
    res.status(500).json({ error: 'Webhook processing failed', eventId: event.id })
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created:', subscription.id)
  
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  
  // Find user by Stripe customer ID
  const usersSnapshot = await firebaseDB.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()
  
  if (usersSnapshot.empty) {
    console.error('No user found with customer ID:', customerId)
    return
  }
  
  const userDoc = usersSnapshot.docs[0]
  const userId = userDoc.id
  
  // Update user subscription status
  await userDoc.ref.update({
    subscriptionStatus: 'active',
    subscriptionId: subscriptionId,
    subscriptionTier: 'premium',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Create subscription document
  await firebaseDB.collection('subscriptions').doc(userId).set({
    userId: userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status: 'active',
    tier: 'premium',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Subscription created for user:', userId)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated:', subscription.id)
  
  const subscriptionId = subscription.id
  const status = subscription.status
  
  // Find subscription document
  const subscriptionsSnapshot = await firebaseDB.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get()
  
  if (subscriptionsSnapshot.empty) {
    console.error('No subscription found with ID:', subscriptionId)
    return
  }
  
  const subscriptionDoc = subscriptionsSnapshot.docs[0]
  const userId = subscriptionDoc.data().userId
  
  // Update subscription document
  await subscriptionDoc.ref.update({
    status: status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update user document
  await firebaseDB.collection('users').doc(userId).update({
    subscriptionStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Subscription updated for user:', userId, 'Status:', status)
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted:', subscription.id)
  
  const subscriptionId = subscription.id
  
  // Find subscription document
  const subscriptionsSnapshot = await firebaseDB.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get()
  
  if (subscriptionsSnapshot.empty) {
    console.error('No subscription found with ID:', subscriptionId)
    return
  }
  
  const subscriptionDoc = subscriptionsSnapshot.docs[0]
  const userId = subscriptionDoc.data().userId
  
  // Update subscription document
  await subscriptionDoc.ref.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update user document
  await firebaseDB.collection('users').doc(userId).update({
    subscriptionStatus: 'cancelled',
    subscriptionTier: 'free',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Subscription cancelled for user:', userId)
}

// Handle invoice payment succeeded
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription
  if (!subscriptionId) {
    console.log('No subscription ID in invoice, skipping')
    return
  }
  
  // Find subscription document
  const subscriptionsSnapshot = await firebaseDB.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get()
  
  if (subscriptionsSnapshot.empty) {
    console.error('No subscription found with ID:', subscriptionId)
    return
  }
  
  const subscriptionDoc = subscriptionsSnapshot.docs[0]
  const userId = subscriptionDoc.data().userId
  
  // Update subscription document
  await subscriptionDoc.ref.update({
    lastPaymentDate: new Date(invoice.status_transitions.paid_at * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update user document
  await firebaseDB.collection('users').doc(userId).update({
    subscriptionStatus: 'active',
    lastPaymentDate: new Date(invoice.status_transitions.paid_at * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Invoice payment processed for user:', userId)
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing invoice payment failed:', invoice.id)
  
  const subscriptionId = invoice.subscription
  if (!subscriptionId) {
    console.log('No subscription ID in invoice, skipping')
    return
  }
  
  // Find subscription document
  const subscriptionsSnapshot = await firebaseDB.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get()
  
  if (subscriptionsSnapshot.empty) {
    console.error('No subscription found with ID:', subscriptionId)
    return
  }
  
  const subscriptionDoc = subscriptionsSnapshot.docs[0]
  const userId = subscriptionDoc.data().userId
  
  // Update subscription document
  await subscriptionDoc.ref.update({
    status: 'past_due',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update user document
  await firebaseDB.collection('users').doc(userId).update({
    subscriptionStatus: 'past_due',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Invoice payment failed for user:', userId)
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id)
  
  // Handle subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    console.log('Subscription checkout completed:', session.subscription)
    // The subscription.created webhook will handle the actual subscription creation
    return
  }
  
  // Handle escrow payment checkout
  if (session.mode === 'payment' && session.payment_intent) {
    const paymentIntent = session.payment_intent
    const metadata = paymentIntent.metadata || {}
    
    if (metadata.type === 'escrow_payment') {
      const escrowPaymentId = metadata.escrowPaymentId
      const bountyId = metadata.bountyId
      
      if (escrowPaymentId) {
        // Update escrow payment status
        await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
          status: 'held_in_escrow',
          stripePaymentIntentId: paymentIntent.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        
        // Update bounty status if bountyId is provided
        if (bountyId) {
          await firebaseDB.collection('bounties').doc(bountyId).update({
            status: 'active',
            paymentStatus: 'held_in_escrow',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
        }
        
        console.log('Escrow payment held for bounty:', bountyId)
      }
    }
  }
}

// Handle payment intent created
async function handlePaymentIntentCreated(paymentIntent) {
  console.log('Processing payment intent created:', paymentIntent.id)
  
  const metadata = paymentIntent.metadata || {}
  
  if (metadata.type === 'escrow_payment') {
    const escrowPaymentId = metadata.escrowPaymentId
    
    if (escrowPaymentId) {
      // Update escrow payment with payment intent ID
      await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      
      console.log('Payment intent created for escrow payment:', escrowPaymentId)
    }
  }
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Processing payment intent succeeded:', paymentIntent.id)
  
  const metadata = paymentIntent.metadata || {}
  
  if (metadata.type === 'escrow_payment') {
    const escrowPaymentId = metadata.escrowPaymentId
    const bountyId = metadata.bountyId
    
    if (escrowPaymentId) {
      // Update escrow payment status
      await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
        status: 'held_in_escrow',
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      
      // Update bounty status if bountyId is provided
      if (bountyId) {
        await firebaseDB.collection('bounties').doc(bountyId).update({
          status: 'active',
          paymentStatus: 'held_in_escrow',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }
      
      console.log('Escrow payment held for bounty:', bountyId)
    }
  }
}

// Handle transfer created
async function handleTransferCreated(transfer) {
  console.log('Processing transfer created:', transfer.id)
  
  // Only handle escrow transfers
  if (transfer.metadata?.type !== 'escrow_payout') {
    return
  }
  
  const escrowPaymentId = transfer.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in transfer metadata')
    return
  }
  
  // Update escrow payment status
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: 'paid_out',
    transferId: transfer.id,
    paidOutAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Transfer created for escrow payment:', escrowPaymentId)
}

// Handle transfer updated
async function handleTransferUpdated(transfer) {
  console.log('Processing transfer updated:', transfer.id)
  
  // Only handle escrow transfers
  if (transfer.metadata?.type !== 'escrow_payout') {
    return
  }
  
  const escrowPaymentId = transfer.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in transfer metadata')
    return
  }
  
  // Update escrow payment status based on transfer status
  let status = 'paid_out'
  if (transfer.status === 'paid') {
    status = 'completed'
  } else if (transfer.status === 'failed') {
    status = 'transfer_failed'
  }
  
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: status,
    transferStatus: transfer.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Transfer updated for escrow payment:', escrowPaymentId, 'Status:', status)
}

// Handle charge refunded
async function handleChargeRefunded(charge) {
  console.log('Processing charge refunded:', charge.id)
  
  // Only handle escrow refunds
  if (charge.metadata?.type !== 'escrow_refund') {
    return
  }
  
  const escrowPaymentId = charge.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in charge metadata')
    return
  }
  
  // Update escrow payment status to refunded
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: 'refunded',
    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update bounty payment status
  const bountyId = charge.metadata.bountyId
  if (bountyId) {
    await firebaseDB.collection('bounties').doc(bountyId).update({
      paymentStatus: 'refunded',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
  
  console.log('Charge refunded for escrow payment:', escrowPaymentId)
}
