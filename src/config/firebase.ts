import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration - NEVER expose real credentials in client code
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
}

// Only log configuration status in development, never the actual values
if (import.meta.env.DEV) {
  const hasAllCredentials = Object.values(firebaseConfig).every(val => val && val !== "")
  if (!hasAllCredentials) {
    console.warn('⚠️ Firebase configuration incomplete - using offline mode')
  } else {
    console.log('✅ Firebase configuration loaded')
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    // Only connect to emulators if they're running
    // connectAuthEmulator(auth, 'http://localhost:9099')
    // connectFirestoreEmulator(db, 'localhost', 8080)
    // connectStorageEmulator(storage, 'localhost', 9199)
  } catch (error) {
    console.log('Firebase emulators not running, using production services')
  }
}

export default app
