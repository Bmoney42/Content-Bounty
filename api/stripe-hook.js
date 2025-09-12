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
  console.log('🔔 Stripe Hook received:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
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
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      
      case 'payment_intent.failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
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
      
      console.log('✅ Escrow payment held for bounty:', bountyId)
    }
  }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Processing payment intent failed:', paymentIntent.id)
  
  const metadata = paymentIntent.metadata || {}
  
  if (metadata.type === 'escrow_payment') {
    const escrowPaymentId = metadata.escrowPaymentId
    const bountyId = metadata.bountyId
    
    if (escrowPaymentId) {
      // Update escrow payment status to failed
      await firebaseDB.collection('escrow_payments').doc(escrowPaymentId).update({
        status: 'failed',
        stripePaymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      
      // Update bounty status if bountyId is provided
      if (bountyId) {
        await firebaseDB.collection('bounties').doc(bountyId).update({
          status: 'pending',
          paymentStatus: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }
      
      console.log('❌ Escrow payment failed for bounty:', bountyId)
    }
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id)
  
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
        
        console.log('✅ Checkout completed for bounty:', bountyId)
      }
    }
  }
}
