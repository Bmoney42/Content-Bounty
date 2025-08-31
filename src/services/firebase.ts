import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc 
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'

// Types
export interface User {
  uid: string
  email: string
  displayName?: string
  userType: 'creator' | 'business'
  createdAt: Date
  profile?: {
    bio?: string
    website?: string
    company?: string
    subscribers?: string
    category?: string
  }
}

export interface Bounty {
  id: string
  title: string
  description: string
  budget: number
  category: string
  requirements: string[]
  deadline: Date
  status: 'active' | 'in-progress' | 'completed'
  createdBy: string
  createdAt: Date
  applications?: string[]
}

// Authentication functions
export const firebaseAuth = {
  // Register new user
  async register(email: string, password: string, userType: 'creator' | 'business', displayName?: string): Promise<User> {
    try {
      console.log('🔥 Attempting Firebase registration with:', { email, userType, displayName })
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('✅ Firebase registration successful:', user.email)
      
      // Create user document in Firestore
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName || user.email?.split('@')[0],
        userType,
        createdAt: new Date(),
        profile: {}
      }
      
      console.log('📝 Creating user document in Firestore:', userData)
      await setDoc(doc(db, 'users', user.uid), userData)
      console.log('✅ User document created successfully')
      return userData
    } catch (error) {
      console.error('❌ Firebase registration error:', error)
      throw error
    }
  },

  // Login user
  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      console.log('Attempting Firebase login with:', email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase login successful:', userCredential.user.email)
      return userCredential.user
    } catch (error) {
      console.error('Firebase login error:', error)
      throw error
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback)
  }
}

// Database functions
export const firebaseDB = {
  // Get user data
  async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data() as User
      }
      return null
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  // Create user document if it doesn't exist
  async createUserIfNotExists(firebaseUser: FirebaseUser, userType: 'creator' | 'business' = 'creator'): Promise<User> {
    try {
      console.log('🔍 Checking if user document exists for:', firebaseUser.uid)
      const existingUser = await this.getUser(firebaseUser.uid)
      
      if (existingUser) {
        console.log('✅ User document already exists')
        return existingUser
      }
      
      console.log('📝 Creating missing user document...')
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        userType,
        createdAt: new Date(),
        profile: {}
      }
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData)
      console.log('✅ User document created successfully')
      return userData
    } catch (error) {
      console.error('❌ Error creating user document:', error)
      throw error
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, profile: Partial<User['profile']>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        profile: { ...profile }
      })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  // Create bounty
  async createBounty(bountyData: Omit<Bounty, 'id' | 'createdAt'>): Promise<string> {
    try {
      const bountyWithTimestamp = {
        ...bountyData,
        createdAt: new Date()
      }
      const docRef = await addDoc(collection(db, 'bounties'), bountyWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Create bounty error:', error)
      throw error
    }
  },

  // Get all bounties
  async getBounties(): Promise<Bounty[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'bounties'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bounty[]
    } catch (error) {
      console.error('Get bounties error:', error)
      return []
    }
  },

  // Get bounties by user
  async getBountiesByUser(uid: string): Promise<Bounty[]> {
    try {
      const q = query(collection(db, 'bounties'), where('createdBy', '==', uid))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bounty[]
    } catch (error) {
      console.error('Get user bounties error:', error)
      return []
    }
  }
}

// Hybrid data functions (combine real and mock data)
export const hybridData = {
  // Get user stats with fallback to mock data
  async getUserStats(uid: string, userType: 'creator' | 'business') {
    try {
      // Try to get real data first
      const user = await firebaseDB.getUser(uid)
      const userBounties = await firebaseDB.getBountiesByUser(uid)
      
      if (userType === 'creator') {
        return {
          bountiesCompleted: userBounties.filter(b => b.status === 'completed').length || 23,
          videosCreated: userBounties.filter(b => b.status === 'completed').length || 45,
          totalEarned: userBounties
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + b.budget, 0) || 1750
        }
      } else {
        return {
          bountiesCreated: userBounties.length || 12,
          creatorsWorkedWith: new Set(userBounties.flatMap(b => b.applications || [])).size || 34,
          totalSpent: userBounties.reduce((sum, b) => sum + b.budget, 0) || 4250,
          avgEngagement: '8.2%' // This would need real analytics data
        }
      }
    } catch (error) {
      console.error('Get user stats error:', error)
      // Return mock data as fallback
      if (userType === 'creator') {
        return {
          bountiesCompleted: 23,
          videosCreated: 45,
          totalEarned: 1750
        }
      } else {
        return {
          bountiesCreated: 12,
          creatorsWorkedWith: 34,
          totalSpent: 4250,
          avgEngagement: '8.2%'
        }
      }
    }
  }
}
