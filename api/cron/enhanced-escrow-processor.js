const admin = require('firebase-admin')
const { TaskQueueUtils } = require('../../src/services/taskQueueInit')

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

const db = admin.firestore()

/**
 * Enhanced Escrow Processor using Task Queue
 * This function finds expired escrow payments and queues them for processing
 * Should be run as a cron job (e.g., every 15 minutes)
 */
module.exports = async (req, res) => {
  // 🔒 SECURITY: Require cron secret ALWAYS - no optional security
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers['x-cron-secret'] !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 🔒 SECURITY: Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Starting enhanced escrow processor...')
    
    const currentTime = new Date()
    const results = {
      found: 0,
      queued: 0,
      errors: []
    }

    // Find escrow payments that are held and past their hold period
    const escrowPaymentsRef = db.collection('escrow_payments')
    const expiredPaymentsQuery = escrowPaymentsRef
      .where('status', '==', 'held_in_escrow')
      .where('heldUntil', '<=', admin.firestore.Timestamp.fromDate(currentTime))

    const expiredPaymentsSnap = await expiredPaymentsQuery.get()

    if (expiredPaymentsSnap.empty) {
      console.log('✅ No expired escrow payments found')
      return res.status(200).json({
        message: 'No expired escrow payments to process',
        results
      })
    }

    results.found = expiredPaymentsSnap.docs.length
    console.log(`📋 Found ${results.found} expired escrow payments`)

    // Queue each expired payment for processing
    for (const doc of expiredPaymentsSnap.docs) {
      const escrowPayment = doc.data()
      const escrowPaymentId = doc.id

      try {
        // Get bounty and submission information
        const bountyRef = db.collection('bounties').doc(escrowPayment.bountyId)
        const bountySnap = await bountyRef.get()
        
        if (!bountySnap.exists) {
          throw new Error(`Bounty not found: ${escrowPayment.bountyId}`)
        }

        const bountyData = bountySnap.data()

        // Safety check: Skip test bounties to prevent accidental payouts
        if (bountyData.title?.toLowerCase().includes('test') || 
            bountyData.description?.toLowerCase().includes('test') ||
            escrowPayment.amount < 100) { // Less than $1.00
          console.log(`⚠️ Skipping test bounty: ${escrowPayment.bountyId} (title: "${bountyData.title}", amount: ${escrowPayment.amount})`)
          continue
        }

        // Check if bounty is completed and has approved submissions
        const submissionsRef = db.collection('submissions')
        const submissionsQuery = submissionsRef
          .where('bountyId', '==', escrowPayment.bountyId)
          .where('status', '==', 'approved')
        
        const submissionsSnap = await submissionsQuery.get()

        if (submissionsSnap.empty) {
          console.log(`⚠️ No approved submissions found for bounty: ${escrowPayment.bountyId}`)
          // Queue for manual review instead of automatic release
          await TaskQueueUtils.queueNotification(
            escrowPayment.businessId,
            'escrow_manual_review',
            'Escrow Payment Requires Manual Review',
            `Escrow payment for bounty "${bountyData.title}" has expired but no approved submissions found. Manual review required.`,
            {
              escrowPaymentId,
              bountyId: escrowPayment.bountyId,
              amount: escrowPayment.creatorEarnings
            },
            'high'
          )
          continue
        }

        // Additional safety check: Ensure bounty is actually completed
        if (bountyData.status !== 'completed') {
          console.log(`⚠️ Bounty ${escrowPayment.bountyId} is not marked as completed, skipping automatic release`)
          await TaskQueueUtils.queueNotification(
            escrowPayment.businessId,
            'escrow_manual_review',
            'Escrow Payment Requires Manual Review',
            `Escrow payment for bounty "${bountyData.title}" has expired but bounty is not marked as completed. Manual review required.`,
            {
              escrowPaymentId,
              bountyId: escrowPayment.bountyId,
              amount: escrowPayment.creatorEarnings
            },
            'high'
          )
          continue
        }

        // Get the approved submission (should be only one)
        const approvedSubmission = submissionsSnap.docs[0].data()
        const creatorId = approvedSubmission.creatorId

        // Get creator information
        const creatorRef = db.collection('users').doc(creatorId)
        const creatorSnap = await creatorRef.get()
        
        if (!creatorSnap.exists) {
          throw new Error(`Creator not found: ${creatorId}`)
        }

        const creatorData = creatorSnap.data()
        
        // Check if creator has Connect account set up
        const hasConnectAccount = creatorData.stripeConnectAccountId
        let connectAccountReady = false
        
        if (hasConnectAccount) {
          // Check Connect account status
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
            const account = await stripe.accounts.retrieve(creatorData.stripeConnectAccountId)
            connectAccountReady = account.charges_enabled && account.payouts_enabled
          } catch (stripeError) {
            console.warn(`⚠️ Failed to check Connect account status: ${stripeError.message}`)
            connectAccountReady = false
          }
        }

        // Queue escrow release task
        const priority = connectAccountReady ? 'normal' : 'high'
        await TaskQueueUtils.queueEscrowRelease(
          escrowPaymentId,
          creatorId,
          creatorData.email || creatorId,
          creatorData.stripeConnectAccountId,
          priority
        )

        results.queued++
        console.log(`✅ Queued escrow release: ${escrowPaymentId} for creator: ${creatorId}`)

        // Queue notification for business
        await TaskQueueUtils.queueNotification(
          escrowPayment.businessId,
          'escrow_queued_for_release',
          'Escrow Payment Queued for Release',
          `Escrow payment for bounty "${bountyData.title}" has been queued for automatic release to the creator.`,
          {
            escrowPaymentId,
            bountyId: escrowPayment.bountyId,
            creatorId,
            amount: escrowPayment.creatorEarnings,
            requiresConnectSetup: !connectAccountReady
          },
          'normal'
        )

        // Queue notification for creator
        await TaskQueueUtils.queueNotification(
          creatorId,
          'payment_queued_for_release',
          'Payment Queued for Release',
          `Your payment for bounty "${bountyData.title}" has been queued for release.`,
          {
            escrowPaymentId,
            bountyId: escrowPayment.bountyId,
            amount: escrowPayment.creatorEarnings,
            requiresConnectSetup: !connectAccountReady
          },
          'normal'
        )

      } catch (error) {
        results.errors.push({
          escrowPaymentId,
          error: error.message
        })
        console.error(`❌ Error processing escrow payment ${escrowPaymentId}:`, error)
      }
    }

    console.log('✅ Enhanced escrow processor completed:', results)

    // Log the batch process results
    await db.collection('escrow_batch_logs').add({
      type: 'enhanced_escrow_processor',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      results,
      processedAt: currentTime
    })

    res.status(200).json({
      message: 'Enhanced escrow processor completed',
      results
    })

  } catch (error) {
    console.error('❌ Error in enhanced escrow processor:', error)
    // 🔒 SECURITY: Don't leak internal error details
    res.status(500).json({ 
      error: 'Process failed',
      timestamp: new Date().toISOString()
    })
  }
}
