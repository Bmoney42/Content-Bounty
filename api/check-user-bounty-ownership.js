const { admin, db } = require('./lib/firebase')
const { verifyAuth } = require('./middleware/auth')

/**
 * Check User Bounty Ownership API
 * Helps debug user ID mismatches between current user and bounty ownership
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

    const { bountyId } = req.query

    if (!bountyId) {
      return res.status(400).json({ error: 'Bounty ID is required' })
    }

    console.log('🔍 Checking bounty ownership:', { bountyId, currentUserId: user.uid })

    // Get the bounty
    const bountyDoc = await db.collection('bounties').doc(bountyId).get()
    if (!bountyDoc.exists) {
      return res.status(404).json({ error: 'Bounty not found' })
    }

    const bountyData = bountyDoc.data()

    // Get user data for both current user and bounty owner
    const currentUserDoc = await db.collection('users').doc(user.uid).get()
    const bountyOwnerDoc = await db.collection('users').doc(bountyData.businessId).get()

    const currentUserData = currentUserDoc.exists ? currentUserDoc.data() : null
    const bountyOwnerData = bountyOwnerDoc.exists ? bountyOwnerDoc.data() : null

    res.status(200).json({
      success: true,
      currentUser: {
        id: user.uid,
        email: user.email,
        userType: user.userType,
        data: currentUserData
      },
      bounty: {
        id: bountyId,
        title: bountyData.title,
        businessId: bountyData.businessId,
        status: bountyData.status,
        createdAt: bountyData.createdAt?.toDate?.()?.toISOString()
      },
      bountyOwner: {
        id: bountyData.businessId,
        data: bountyOwnerData
      },
      ownershipMatch: user.uid === bountyData.businessId,
      analysis: {
        currentUserId: user.uid,
        bountyBusinessId: bountyData.businessId,
        isOwner: user.uid === bountyData.businessId,
        emailsMatch: currentUserData?.email === bountyOwnerData?.email
      }
    })

  } catch (error) {
    console.error('❌ Error checking bounty ownership:', error)
    res.status(500).json({ 
      error: 'Failed to check bounty ownership',
      message: error.message
    })
  }
}
