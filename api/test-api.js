/**
 * Simple test API to verify basic functionality
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
    console.log('🧪 Test API called')
    
    res.status(200).json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        frontendUrl: process.env.FRONTEND_URL || 'Not set'
      }
    })
  } catch (error) {
    console.error('❌ Test API error:', error)
    res.status(500).json({
      error: 'Test API failed',
      message: error.message
    })
  }
}
