import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your Firebase configuration
// You'll need to replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.FIREBASE_APP_ID || "your-app-id"
}

// Debug: Log Firebase configuration
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
})

// Check if we're using fallback values
if (firebaseConfig.apiKey === "your-api-key") {
  console.error('⚠️ Firebase configuration is using fallback values! Environment variables not loaded.')
}

// Log environment variables to see what's available
console.log('Environment Variables:', {
  FIREBASE_API_KEY: import.meta.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.FIREBASE_APP_ID
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
