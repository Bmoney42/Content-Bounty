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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const rawBody = req.body

  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  console.log('Received webhook event:', event.type)

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
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      // Escrow payment events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      
      case 'payment_intent.failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object)
        break
      
      case 'transfer.paid':
        await handleTransferPaid(event.data.object)
        break
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created:', subscription.id)
  
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata?.userId || subscription.metadata?.userId
  
  if (!userId) {
    console.error('No userId found in subscription metadata')
    return
  }

  const subscriptionData = {
    userId: userId,
    tier: 'premium',
    status: subscription.status,
    planId: subscription.metadata?.planId || 'creator_premium',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }

  await firebaseDB.collection('subscriptions').doc(userId).set(subscriptionData)
  console.log('Subscription created in Firestore for user:', userId)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated:', subscription.id)
  
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata?.userId || subscription.metadata?.userId
  
  if (!userId) {
    console.error('No userId found in subscription metadata')
    return
  }

  const subscriptionData = {
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }

  await firebaseDB.collection('subscriptions').doc(userId).update(subscriptionData)
  console.log('Subscription updated in Firestore for user:', userId)
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted:', subscription.id)
  
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata?.userId || subscription.metadata?.userId
  
  if (!userId) {
    console.error('No userId found in subscription metadata')
    return
  }

  const subscriptionData = {
    status: 'canceled',
    cancelAtPeriodEnd: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }

  await firebaseDB.collection('subscriptions').doc(userId).update(subscriptionData)
  console.log('Subscription marked as canceled in Firestore for user:', userId)
}

// Handle successful payments
async function handlePaymentSucceeded(invoice) {
  console.log('Processing payment succeeded:', invoice.id)
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata?.userId || subscription.metadata?.userId
    
    if (userId) {
      // Check if subscription already exists
      const existingSub = await firebaseDB.collection('subscriptions').doc(userId).get()
      
      if (existingSub.exists) {
        // Update existing subscription
        const subscriptionData = {
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
        
        await firebaseDB.collection('subscriptions').doc(userId).update(subscriptionData)
        console.log('Payment succeeded - subscription updated for user:', userId)
      } else {
        // Create new subscription (this is what was missing!)
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
        
        await firebaseDB.collection('subscriptions').doc(userId).set(subscriptionData)
        console.log('Payment succeeded - subscription created for user:', userId)
      }
    } else {
      console.error('No userId found in customer or subscription metadata for invoice:', invoice.id)
    }
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice) {
  console.log('Processing payment failed:', invoice.id)
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata?.userId || subscription.metadata?.userId
    
    if (userId) {
      const subscriptionData = {
        status: 'past_due',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
      
      await firebaseDB.collection('subscriptions').doc(userId).update(subscriptionData)
      console.log('Payment failed - subscription marked as past due for user:', userId)
    }
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id)
  
  // Only handle escrow payments
  if (!session.metadata?.type || 
      (session.metadata.type !== 'escrow_payment' && 
       session.metadata.type !== 'upfront_escrow_payment')) {
    return
  }
  
  const escrowPaymentId = session.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in session metadata')
    return
  }
  
  // Handle upfront payments - create bounty after successful payment
  if (session.metadata.type === 'upfront_escrow_payment') {
    console.log('Processing upfront escrow payment success:', escrowPaymentId)
    
    // Get the escrow payment document to retrieve bounty data
    const escrowDoc = await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).get()
    const escrowData = escrowDoc.data()
    
    if (!escrowData || !escrowData.bountyData) {
      console.error('No bounty data found in escrow payment:', escrowPaymentId)
      return
    }
    
    // Create the bounty with active status
    const bountyData = {
      ...escrowData.bountyData,
      status: 'active',
      createdBy: escrowData.businessId,
      businessId: escrowData.businessId,
      applicationsCount: 0,
      paymentStatus: 'held_in_escrow',
      escrowPaymentId: escrowPaymentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    // Create bounty in Firestore
    const bountyRef = await firebaseDB.collection('bounties').add(bountyData)
    const bountyId = bountyRef.id
    
    console.log('Bounty created after upfront payment:', bountyId)
    
    // Update escrow payment with bounty ID and status
    await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
      bountyId: bountyId,
      status: 'held_in_escrow',
      bountyData: null, // Clear temporary bounty data
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    console.log('Upfront escrow payment processed successfully:', escrowPaymentId)
    return
  }
  
  // Handle legacy escrow payments (existing bounty)
  if (session.metadata.type === 'escrow_payment') {
    // Update escrow payment status to held in escrow
    await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
      status: 'held_in_escrow',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Update bounty status and payment status
    const bountyId = session.metadata.bountyId
    if (bountyId) {
      await firebaseDB.collection('bounties').doc(bountyId).update({
        status: 'active', // Change from 'pending' to 'active'
        paymentStatus: 'held_in_escrow',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      console.log('Bounty activated after successful payment:', bountyId)
    }
    
    console.log('Legacy escrow payment held in escrow for:', escrowPaymentId)
  }
}

// Handle escrow payment intent creation
async function handlePaymentIntentCreated(paymentIntent) {
  console.log('Processing payment intent created:', paymentIntent.id)
  
  // Only handle escrow payments
  if (paymentIntent.metadata?.type !== 'escrow_payment') {
    return
  }
  
  const escrowPaymentId = paymentIntent.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in payment intent metadata')
    return
  }
  
  // Update escrow payment status to pending
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Escrow payment intent created for:', escrowPaymentId)
}

// Handle escrow payment intent success
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Processing payment intent succeeded:', paymentIntent.id)
  
  // Handle both legacy and upfront escrow payments
  if (!paymentIntent.metadata?.type || 
      (paymentIntent.metadata.type !== 'escrow_payment' && 
       paymentIntent.metadata.type !== 'upfront_escrow_payment')) {
    return
  }
  
  const escrowPaymentId = paymentIntent.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in payment intent metadata')
    return
  }
  
  // Handle upfront payments - create bounty after successful payment
  if (paymentIntent.metadata.type === 'upfront_escrow_payment') {
    console.log('Processing upfront escrow payment success:', escrowPaymentId)
    
    // Get the escrow payment document to retrieve bounty data
    const escrowDoc = await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).get()
    const escrowData = escrowDoc.data()
    
    if (!escrowData || !escrowData.bountyData) {
      console.error('No bounty data found in escrow payment:', escrowPaymentId)
      return
    }
    
    // Create the bounty with active status
    const bountyData = {
      ...escrowData.bountyData,
      status: 'active',
      createdBy: escrowData.businessId,
      businessId: escrowData.businessId,
      applicationsCount: 0,
      paymentStatus: 'held_in_escrow',
      escrowPaymentId: escrowPaymentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    // Create bounty in Firestore
    const bountyRef = await firebaseDB.collection('bounties').add(bountyData)
    const bountyId = bountyRef.id
    
    console.log('Bounty created after upfront payment:', bountyId)
    
    // Update escrow payment with bounty ID and status
    await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
      bountyId: bountyId,
      status: 'held_in_escrow',
      bountyData: null, // Clear temporary bounty data
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    console.log('Upfront escrow payment processed successfully:', escrowPaymentId)
    return
  }
  
  // Handle legacy escrow payments (existing bounty)
  if (paymentIntent.metadata.type === 'escrow_payment') {
    // Update escrow payment status to held in escrow
    await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
      status: 'held_in_escrow',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Update bounty status and payment status
    const bountyId = paymentIntent.metadata.bountyId
    if (bountyId) {
      await firebaseDB.collection('bounties').doc(bountyId).update({
        status: 'active', // Change from 'pending' to 'active'
        paymentStatus: 'held_in_escrow',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      console.log('Bounty activated after successful payment:', bountyId)
    }
    
    console.log('Legacy escrow payment held in escrow for:', escrowPaymentId)
  }
}

// Handle escrow payment intent failure
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Processing payment intent failed:', paymentIntent.id)
  
  // Only handle escrow payments
  if (paymentIntent.metadata?.type !== 'escrow_payment') {
    return
  }
  
  const escrowPaymentId = paymentIntent.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in payment intent metadata')
    return
  }
  
  // Update escrow payment status to failed
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: 'failed',
    failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update bounty payment status
  const bountyId = paymentIntent.metadata.bountyId
  if (bountyId) {
    await firebaseDB.collection('bounties').doc(bountyId).update({
      paymentStatus: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
  
  console.log('Escrow payment failed for:', escrowPaymentId)
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
  console.log('Processing transfer created:', transfer.id)
  
  // Only handle creator payments
  if (transfer.metadata?.type !== 'creator_payment') {
    return
  }
  
  const escrowPaymentId = transfer.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in transfer metadata')
    return
  }
  
  // Update escrow payment with transfer ID
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    stripeTransferId: transfer.id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  console.log('Transfer created for escrow payment:', escrowPaymentId)
}

// Handle transfer paid
async function handleTransferPaid(transfer) {
  console.log('Processing transfer paid:', transfer.id)
  
  // Only handle creator payments
  if (transfer.metadata?.type !== 'creator_payment') {
    return
  }
  
  const escrowPaymentId = transfer.metadata.escrowPaymentId
  if (!escrowPaymentId) {
    console.error('No escrowPaymentId found in transfer metadata')
    return
  }
  
  // Update escrow payment status to released
  await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
    status: 'released',
    releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  
  // Update bounty payment status
  const bountyId = transfer.metadata.bountyId
  if (bountyId) {
    await firebaseDB.collection('bounties').doc(bountyId).update({
      paymentStatus: 'released',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
  
  console.log('Transfer paid for escrow payment:', escrowPaymentId)
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
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
  
  console.log('Charge refunded for escrow payment:', escrowPaymentId)
}
