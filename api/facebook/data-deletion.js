import { firebaseDB } from '../lib/firebase.js'

/**
 * Facebook Data Deletion Callback
 * 
 * This endpoint handles Facebook's data deletion requests as required by their
 * platform policies and GDPR compliance.
 * 
 * Facebook will send a POST request to this endpoint when a user requests
 * data deletion through Facebook's interface.
 */

export default async function handler(req, res) {
  // Set CORS headers for Facebook
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Facebook data deletion request received:', req.body)

    const { 
      signed_request,
      user_id: facebookUserId,
      confirmation_code 
    } = req.body

    // Validate that we have the required parameters
    if (!facebookUserId) {
      console.error('❌ Missing facebook user_id in data deletion request')
      return res.status(400).json({ 
        error: 'Missing required parameter: user_id' 
      })
    }

    // Find user by Facebook ID in our database
    const user = await findUserByFacebookId(facebookUserId)
    
    if (!user) {
      console.log(`ℹ️ No user found with Facebook ID: ${facebookUserId}`)
      return res.status(200).json({
        url: `${process.env.FRONTEND_URL || 'https://www.creatorbounty.xyz'}/data-deletion-instructions`,
        confirmation_code: confirmation_code || 'no_user_found'
      })
    }

    console.log(`🗑️ Processing data deletion for user: ${user.email} (ID: ${user.id})`)

    // Process the data deletion
    const deletionResult = await processUserDataDeletion(user.id, facebookUserId)

    if (deletionResult.success) {
      console.log(`✅ Data deletion completed for user: ${user.email}`)
      
      // Return success response to Facebook
      return res.status(200).json({
        url: `${process.env.FRONTEND_URL || 'https://www.creatorbounty.xyz'}/data-deletion-instructions?status=completed&code=${confirmation_code}`,
        confirmation_code: confirmation_code || 'deletion_completed'
      })
    } else {
      console.error(`❌ Data deletion failed for user: ${user.email}`, deletionResult.error)
      
      // Return instructions URL for manual deletion
      return res.status(200).json({
        url: `${process.env.FRONTEND_URL || 'https://www.creatorbounty.xyz'}/data-deletion-instructions?status=failed&code=${confirmation_code}`,
        confirmation_code: confirmation_code || 'deletion_failed'
      })
    }

  } catch (error) {
    console.error('❌ Error processing Facebook data deletion request:', error)
    
    // Return instructions URL for manual deletion
    return res.status(200).json({
      url: `${process.env.FRONTEND_URL || 'https://www.creatorbounty.xyz'}/data-deletion-instructions?status=error&code=${req.body.confirmation_code || 'error'}`,
      confirmation_code: req.body.confirmation_code || 'error'
    })
  }
}

/**
 * Find user by Facebook ID
 */
async function findUserByFacebookId(facebookUserId) {
  try {
    const usersRef = firebaseDB.collection('users')
    const snapshot = await usersRef.where('facebookId', '==', facebookUserId).get()
    
    if (snapshot.empty) {
      return null
    }
    
    const userDoc = snapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    console.error('Error finding user by Facebook ID:', error)
    return null
  }
}

/**
 * Process user data deletion
 */
async function processUserDataDeletion(userId, facebookUserId) {
  try {
    console.log(`🗑️ Starting data deletion for user: ${userId}`)
    
    // 1. Remove Facebook connection from user profile
    await firebaseDB.collection('users').doc(userId).update({
      facebookId: null,
      socialConnections: {
        facebook: null
      },
      updatedAt: new Date().toISOString()
    })

    // 2. Remove any Facebook-related data from socialConnections
    const userRef = firebaseDB.collection('users').doc(userId)
    const userDoc = await userRef.get()
    
    if (userDoc.exists) {
      const userData = userDoc.data()
      if (userData.socialConnections && userData.socialConnections.facebook) {
        await userRef.update({
          'socialConnections.facebook': null,
          updatedAt: new Date().toISOString()
        })
      }
    }

    // 3. Log the deletion for audit purposes
    await firebaseDB.collection('dataDeletions').add({
      userId: userId,
      facebookUserId: facebookUserId,
      platform: 'facebook',
      deletedAt: new Date().toISOString(),
      status: 'completed',
      dataTypes: ['facebook_connection', 'social_media_data']
    })

    console.log(`✅ Facebook data deletion completed for user: ${userId}`)
    
    return { success: true }
    
  } catch (error) {
    console.error('Error processing user data deletion:', error)
    
    // Log the failed deletion
    try {
      await firebaseDB.collection('dataDeletions').add({
        userId: userId,
        facebookUserId: facebookUserId,
        platform: 'facebook',
        attemptedAt: new Date().toISOString(),
        status: 'failed',
        error: error.message
      })
    } catch (logError) {
      console.error('Error logging failed deletion:', logError)
    }
    
    return { success: false, error: error.message }
  }
}
