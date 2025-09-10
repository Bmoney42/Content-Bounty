const { admin, db } = require('./lib/firebase')
const { verifyAuth } = require('./middleware/auth')

/**
 * Manual Bounty Activation API
 * Allows manual activation of bounties if payment went through but bounty wasn't created
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

    if (user.userType !== 'business') {
      return res.status(403).json({ error: 'Only business users can activate bounties' })
    }

    const { escrowPaymentId } = req.body

    if (!escrowPaymentId) {
      return res.status(400).json({ error: 'Missing required field: escrowPaymentId' })
    }

    console.log(`🔍 Manually activating bounty for escrow payment: ${escrowPaymentId}`)

    // Get the escrow payment
    const escrowDoc = await db.collection('escrow_payments').doc(escrowPaymentId).get()

    if (!escrowDoc.exists) {
      return res.status(404).json({ error: 'Escrow payment not found' })
    }

    const escrowData = escrowDoc.data()

    // Verify this escrow payment belongs to the user
    if (escrowData.businessId !== user.uid) {
      return res.status(403).json({ error: 'You can only activate your own bounties' })
    }

    console.log('📊 Escrow payment data:', {
      status: escrowData.status,
      amount: escrowData.amount,
      businessId: escrowData.businessId,
      bountyId: escrowData.bountyId,
      hasBountyData: !!escrowData.bountyData
    })

    // If bounty already exists, just activate it
    if (escrowData.bountyId) {
      console.log('🎯 Bounty already exists, activating it...')

      await db.collection('bounties').doc(escrowData.bountyId).update({
        status: 'active',
        paymentStatus: 'held_in_escrow',
        escrowPaymentId: escrowPaymentId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      console.log('✅ Bounty activated successfully')

      return res.status(200).json({
        success: true,
        message: 'Bounty activated successfully',
        bountyId: escrowData.bountyId,
        action: 'activated_existing'
      })
    }

    // If no bounty exists but we have bounty data, create it
    if (escrowData.bountyData) {
      console.log('🏗️ Creating bounty from escrow data...')

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

      const bountyRef = await db.collection('bounties').add(bountyData)
      const bountyId = bountyRef.id

      console.log(`✅ Bounty created with ID: ${bountyId}`)

      // Update escrow payment with bounty ID
      await db.collection('escrow_payments').doc(escrowPaymentId).update({
        bountyId: bountyId,
        status: 'held_in_escrow',
        bountyData: null, // Clear temporary data
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      console.log('✅ Escrow payment updated with bounty ID')

      return res.status(200).json({
        success: true,
        message: 'Bounty created and activated successfully',
        bountyId: bountyId,
        action: 'created_new'
      })
    }

    return res.status(400).json({
      error: 'No bounty data found in escrow payment',
      message: 'This escrow payment does not contain the necessary data to create a bounty'
    })

  } catch (error) {
    console.error('❌ Error manually activating bounty:', error)
    res.status(500).json({ 
      error: 'Failed to activate bounty',
      message: error.message
    })
  }
}
