const { admin } = require('../lib/firebase')

/**
 * Middleware to verify Firebase Auth token and extract user info
 * Usage: const { user, error } = await verifyAuth(req, res)
 */
async function verifyAuth(req, res, options = {}) {
  const { requireAuth = true, allowedRoles = null } = options

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (requireAuth) {
        return {
          error: { status: 401, message: 'Missing or invalid authorization header' },
          user: null
        }
      }
      return { user: null, error: null }
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get()
    
    if (!userDoc.exists) {
      return {
        error: { status: 401, message: 'User not found in database' },
        user: null
      }
    }

    const userData = userDoc.data()
    
    // Check role permissions if specified
    if (allowedRoles && !allowedRoles.includes(userData.userType)) {
      return {
        error: { status: 403, message: `Access denied. Required role: ${allowedRoles.join(' or ')}` },
        user: null
      }
    }

    // Return user data with Firebase UID
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        userType: userData.userType,
        ...userData
      },
      error: null
    }

  } catch (error) {
    console.error('Auth verification failed:', error.message)
    
    if (error.code === 'auth/id-token-expired') {
      return {
        error: { status: 401, message: 'Token expired. Please log in again.' },
        user: null
      }
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return {
        error: { status: 401, message: 'Token revoked. Please log in again.' },
        user: null
      }
    }

    return {
      error: { status: 401, message: 'Invalid authentication token' },
      user: null
    }
  }
}

/**
 * Express middleware wrapper for easy integration
 */
function requireAuth(options = {}) {
  return async (req, res, next) => {
    const { user, error } = await verifyAuth(req, res, options)
    
    if (error) {
      return res.status(error.status).json({ error: error.message })
    }
    
    req.user = user
    next()
  }
}

module.exports = {
  verifyAuth,
  requireAuth
}