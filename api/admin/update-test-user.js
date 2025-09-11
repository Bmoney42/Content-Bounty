const { admin } = require('../lib/firebase.js')

// Admin access check function (inline to avoid import issues)
function hasAdminAccess(user) {
  if (!user || !user.email) {
    return false
  }
  
  const AUTHORIZED_ADMIN_EMAILS = [
    'brandon@themoneyfriends.com',
    // Add additional admin emails here as needed
  ]
  
  return user.isAdmin === true || AUTHORIZED_ADMIN_EMAILS.includes(user.email)
}

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify admin access
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // Check if user has admin access
    const user = {
      email: decodedToken.email,
      isAdmin: decodedToken.isAdmin || false
    }
    
    if (!hasAdminAccess(user)) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { userType, subscriptionStatus, isAdmin } = req.body

    // Validate input
    if (!userType || !['creator', 'business'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid userType. Must be "creator" or "business"' })
    }

    if (!subscriptionStatus || !['free', 'premium'].includes(subscriptionStatus)) {
      return res.status(400).json({ error: 'Invalid subscriptionStatus. Must be "free" or "premium"' })
    }

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'Invalid isAdmin. Must be boolean' })
    }

    // Update user document in Firestore
    const userRef = admin.firestore().collection('users').doc(decodedToken.uid)
    
    const updateData = {
      userType,
      isAdmin,
      updatedAt: new Date()
    }

    // Handle subscription status on both users doc and subscriptions collection
    if (subscriptionStatus === 'premium') {
      updateData.subscription = {
        status: 'active',
        planId: 'creator_premium',
        planName: 'Creator Premium',
        price: 14.99,
        interval: 'month',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      }
      // Mirror real subscriber structure
      await admin.firestore().collection('subscriptions').doc(decodedToken.uid).set({
        userId: decodedToken.uid,
        status: 'active',
        tier: 'premium', // This is the key field the app checks for
        planId: 'creator_premium',
        planName: 'Creator Premium',
        price: 1499, // cents for consistency if used that way
        currency: 'usd',
        interval: 'month',
        currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date()),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    } else {
      updateData.subscription = {
        status: 'inactive',
        planId: null,
        planName: 'Free',
        price: 0,
        interval: null,
        startDate: null,
        endDate: null,
        isActive: false
      }
      await admin.firestore().collection('subscriptions').doc(decodedToken.uid).set({
        userId: decodedToken.uid,
        status: 'inactive',
        tier: 'free', // Set to free tier
        isActive: false,
        canceledAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    await userRef.update(updateData)

    // Also update the custom claims in Firebase Auth for immediate effect
    const customClaims = {
      userType,
      isAdmin,
      subscriptionStatus: subscriptionStatus === 'premium' ? 'active' : 'inactive'
    }

    await admin.auth().setCustomUserClaims(decodedToken.uid, customClaims)

    return res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      updatedData: {
        userType,
        subscriptionStatus,
        isAdmin,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating test user settings:', error)
    return res.status(500).json({ 
      error: 'Failed to update user settings',
      details: error.message 
    })
  }
}

module.exports = handler
