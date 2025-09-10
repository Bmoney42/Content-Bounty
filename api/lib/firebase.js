const admin = require('firebase-admin')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Use FIREBASE_PROJECT_ID for server-side (not VITE_ prefixed)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  
  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin SDK credentials:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey
    })
    throw new Error('Firebase Admin SDK credentials not configured')
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

module.exports = { admin, db: admin.firestore() }
