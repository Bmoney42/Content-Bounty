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
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { Bounty as UIBounty, BountyApplication, ApplicationStatus, BountySubmission, Bounty } from '../types/bounty'
import { User as AuthUser } from '../types/auth'

// Types
export interface User {
  uid: string
  email: string
  displayName?: string
  userType: 'creator' | 'business'
  createdAt: any // serverTimestamp() | Timestamp | Date
  profile?: {
    bio?: string
    website?: string
    company?: string
    subscribers?: string
    category?: string
  }
}

// Firebase storage format for bounty
export interface FirebaseBounty {
  id?: string
  title: string
  description: string
  budget: number
  category: string
  requirements: string[]
  deadline: Date
  status: 'active' | 'in-progress' | 'completed' | 'pending'
  createdBy: string
  businessId: string // Add this field for Firestore rules
  createdAt: any // serverTimestamp() | Timestamp | Date
  applicationsCount?: number
  maxCreators?: number // How many creators will be paid
  maxApplications?: number // How many applications to accept (null = unlimited)
  paymentStatus?: 'pending' | 'held_in_escrow' | 'failed' | 'completed'
  // Payment tracking for multi-creator bounties
  paidCreatorsCount?: number
  totalPaidAmount?: number
  remainingBudget?: number
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
        createdAt: serverTimestamp(),
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
  // Get user data with retry logic
  async getUser(uid: string): Promise<User | null> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempting to get user data (attempt ${attempt}/${maxRetries})`)
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          console.log('✅ User data retrieved successfully')
          return userDoc.data() as User
        }
        console.log('ℹ️ User document does not exist')
        return null
      } catch (error) {
        lastError = error
        console.error(`❌ Get user error (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    console.error('❌ All attempts to get user data failed')
    return null
  },

  // Get all creators (for business use)
  async getAllCreators(): Promise<User[]> {
    try {
      console.log('Fetching all creators from Firebase...')
      const q = query(collection(db, 'users'), where('userType', '==', 'creator'))
      const querySnapshot = await getDocs(q)
      const creators: User[] = []
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User
        creators.push({
          ...userData,
          uid: doc.id
        })
      })
      
      console.log(`✅ Retrieved ${creators.length} creators from Firebase`)
      return creators
    } catch (error) {
      console.error('❌ Failed to fetch creators:', error)
      return []
    }
  },

  // Create user document if it doesn't exist with retry logic
  async createUserIfNotExists(firebaseUser: FirebaseUser, userType?: 'creator' | 'business'): Promise<User> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Checking if user document exists for: ${firebaseUser.uid} (attempt ${attempt}/${maxRetries})`)
        const existingUser = await this.getUser(firebaseUser.uid)
        
        if (existingUser) {
          // If user exists and userType is provided and different, update it
          if (userType && existingUser.userType !== userType) {
            console.log(`🔄 Updating user type from ${existingUser.userType} to ${userType}`)
            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                userType: userType
              })
              existingUser.userType = userType
              console.log('✅ User type updated successfully')
            } catch (updateError) {
              console.warn('⚠️ Failed to update user type:', updateError)
            }
          }
          console.log('✅ User document already exists')
          return existingUser
        }
        
        console.log('📝 Creating missing user document...')
        // Default to 'creator' if no userType specified
        const defaultUserType = userType || 'creator'
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          userType: defaultUserType,
          createdAt: serverTimestamp(),
          profile: {}
        }
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData)
        console.log('✅ User document created successfully')
        return userData
      } catch (error) {
        lastError = error
        console.error(`❌ Error creating user document (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    console.error('❌ All attempts to create user document failed')
    throw lastError
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

  // Create bounty (Firebase only)
  async createBounty(bountyData: Omit<FirebaseBounty, 'id' | 'createdAt'>): Promise<string> {
    const bountyWithTimestamp = {
      ...bountyData,
      createdAt: serverTimestamp()
    }

    try {
      console.log('Attempting to create bounty in Firebase...')
      
      // First, ensure the user document exists with proper userType
      const currentUser = firebaseAuth.getCurrentUser()
      if (currentUser) {
        console.log('🔄 Ensuring user document exists with business userType...')
        try {
          await this.createUserIfNotExists(currentUser, 'business')
        } catch (userCreateError) {
          console.warn('⚠️ Failed to ensure user document, proceeding with bounty creation:', userCreateError)
        }
      }
      
      const docRef = await addDoc(collection(db, 'bounties'), bountyWithTimestamp)
      console.log('✅ Bounty created successfully in Firebase:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Firebase bounty creation failed:', error)
      throw new Error('Unable to save bounty. Please check your connection and try again.')
    }
  },

  // Get all bounties (Firebase only)
  async getBounties(): Promise<UIBounty[]> {
    try {
      console.log('Fetching bounties from Firebase...')
      const querySnapshot = await getDocs(collection(db, 'bounties'))
      const firebaseBounties = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseBounty
        return this.transformFirebaseBountyToUI({
          ...data,
          id: doc.id
        })
      })
      // Filter out pending bounties from public marketplace (only paid bounties are visible)
      const publicBounties = firebaseBounties.filter(bounty => bounty.status !== 'pending')
      console.log(`✅ Retrieved ${firebaseBounties.length} bounties from Firebase (${publicBounties.length} public, ${firebaseBounties.length - publicBounties.length} pending)`)
      return publicBounties
    } catch (error) {
      console.error('❌ Failed to fetch bounties from Firebase:', error)
      return []
    }
  },

  // Get a single bounty by ID
  async getBounty(bountyId: string): Promise<UIBounty | null> {
    try {
      const docRef = doc(db, 'bounties', bountyId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseBounty
        return this.transformFirebaseBountyToUI({
          ...data,
          id: docSnap.id
        })
      } else {
        return null
      }
    } catch (error) {
      console.error('Error fetching bounty:', error)
      return null
    }
  },

  // Transform Firebase bounty format to UI bounty format
  transformFirebaseBountyToUI(firebaseBounty: FirebaseBounty): UIBounty {
    return {
      id: firebaseBounty.id || '',
      title: firebaseBounty.title,
      description: firebaseBounty.description,
      category: firebaseBounty.category as any,
      requirements: firebaseBounty.requirements.map((req, index) => ({
        id: `req_${index}`,
        type: 'content' as any,
        description: req,
        mandatory: true
      })),
      talkingPoints: firebaseBounty.requirements, // Use requirements as talking points for now
      payment: {
        amount: firebaseBounty.budget,
        currency: 'USD' as const,
        milestones: [
          {
            id: 'milestone_1',
            description: 'Complete bounty requirements',
            percentage: 100
          }
        ]
      },
      businessId: firebaseBounty.createdBy,
      businessName: 'Business User', // TODO: Get actual business name
      status: firebaseBounty.status as any,
      createdAt: firebaseBounty.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      deadline: firebaseBounty.deadline?.toISOString?.() || firebaseBounty.deadline?.toString(),
      applicationsCount: firebaseBounty.applicationsCount || 0,
      maxCreators: firebaseBounty.maxCreators
    }
  },

  // Get bounties by user
  async getBountiesByUser(uid: string): Promise<UIBounty[]> {
    try {
      const q = query(collection(db, 'bounties'), where('createdBy', '==', uid))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseBounty
        return this.transformFirebaseBountyToUI({
          ...data,
          id: doc.id
        })
      })
    } catch (error) {
      console.error('Get user bounties error:', error)
      return []
    }
  },

  // Create bounty application
  async createApplication(applicationData: Omit<BountyApplication, 'id' | 'submittedAt'>): Promise<string> {
    try {
      console.log('Creating bounty application:', applicationData)
      
      // Check if bounty is still accepting applications
      const bountyRef = doc(db, 'bounties', applicationData.bountyId)
      const bountyDoc = await getDoc(bountyRef)
      
      if (!bountyDoc.exists()) {
        throw new Error('Bounty not found')
      }
      
      const bountyData = bountyDoc.data() as FirebaseBounty
      
      // Check if bounty has maxApplications limit and if it's reached
      if (bountyData.maxApplications && bountyData.applicationsCount >= bountyData.maxApplications) {
        throw new Error('This bounty is no longer accepting applications')
      }
      
      // Check if bounty is still active
      if (bountyData.status !== 'active') {
        throw new Error('This bounty is no longer active')
      }
      
      const appWithTimestamp = {
        ...applicationData,
        submittedAt: new Date().toISOString(),
        status: 'pending' as ApplicationStatus
      }
      
      const docRef = await addDoc(collection(db, 'applications'), appWithTimestamp)
      console.log('✅ Application created successfully:', docRef.id)
      
      // Update bounty applicationsCount and check if applications limit is reached
      await this.updateBountyApplicationsCount(applicationData.bountyId)
      
      return docRef.id
    } catch (error) {
      console.error('❌ Failed to create application:', error)
      throw error
    }
  },

  // Get applications for a bounty
  async getBountyApplications(bountyId: string): Promise<BountyApplication[]> {
    try {
      const q = query(collection(db, 'applications'), where('bountyId', '==', bountyId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BountyApplication[]
    } catch (error) {
      console.error('Error fetching bounty applications:', error)
      return []
    }
  },

  // Get all bounty applications (for dashboard)
  async getAllBountyApplications(): Promise<BountyApplication[]> {
    try {
      console.log('Fetching all applications...')
      const applicationsRef = collection(db, 'applications')
      const querySnapshot = await getDocs(applicationsRef)
      
      const applications: BountyApplication[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        applications.push({
          id: doc.id,
          bountyId: data.bountyId,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          message: data.message || data.proposal || '',
          proposedTimeline: data.proposedTimeline || '1 week',
          status: data.status as ApplicationStatus,
          submittedAt: data.submittedAt || data.appliedAt || new Date().toISOString(),
          reviewedAt: data.reviewedAt
        })
      })
      
      console.log('✅ Fetched all applications:', applications.length)
      return applications
    } catch (error) {
      console.error('❌ Error fetching all applications:', error)
      throw error
    }
  },

  // Get applications by creator
  async getCreatorApplications(creatorId: string): Promise<BountyApplication[]> {
    try {
      const q = query(collection(db, 'applications'), where('creatorId', '==', creatorId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BountyApplication[]
    } catch (error) {
      console.error('Error fetching creator applications:', error)
      return []
    }
  },

  // Update application status (approve/reject)
  async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        reviewedAt: new Date().toISOString()
      })
      console.log(`✅ Application ${applicationId} ${status}`)
    } catch (error) {
      console.error('Error updating application status:', error)
      throw error
    }
  },

  // Check if user has already applied to bounty
  async hasUserAppliedToBounty(bountyId: string, creatorId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'applications'), 
        where('bountyId', '==', bountyId),
        where('creatorId', '==', creatorId)
      )
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking application status:', error)
      return false
    }
  },

  // Update bounty applications count
  async updateBountyApplicationsCount(bountyId: string): Promise<void> {
    try {
      const applications = await this.getBountyApplications(bountyId)
      const newApplicationsCount = applications.length
      
      // Get current bounty data to check maxApplications
      const bountyRef = doc(db, 'bounties', bountyId)
      const bountyDoc = await getDoc(bountyRef)
      
      if (!bountyDoc.exists()) {
        throw new Error('Bounty not found')
      }
      
      const bountyData = bountyDoc.data() as FirebaseBounty
      const updateData: any = {
        applicationsCount: newApplicationsCount,
        updatedAt: new Date().toISOString()
      }
      
      // Check if maxApplications limit is reached
      if (bountyData.maxApplications && newApplicationsCount >= bountyData.maxApplications) {
        // Close the bounty to new applications (but keep it active for existing applications)
        updateData.status = 'in-progress'
        updateData.applicationsClosedAt = new Date().toISOString()
        console.log('🎯 Bounty applications limit reached - closing to new applications')
      }
      
      await updateDoc(bountyRef, updateData)
      console.log('✅ Applications count updated:', newApplicationsCount)
    } catch (error) {
      console.error('Error updating applications count:', error)
    }
  },

  // Create bounty submission/delivery
  async createSubmission(submissionData: Omit<BountySubmission, 'id' | 'submittedAt'>): Promise<string> {
    try {
      console.log('Creating bounty submission:', submissionData)
      const submissionWithTimestamp = {
        ...submissionData,
        submittedAt: new Date().toISOString(),
        status: 'pending_review' as const
      }
      
      const docRef = await addDoc(collection(db, 'submissions'), submissionWithTimestamp)
      console.log('✅ Submission created successfully:', docRef.id)
      
      return docRef.id
    } catch (error) {
      console.error('❌ Failed to create submission:', error)
      throw error
    }
  },

  // Get submissions for a bounty
  async getBountySubmissions(bountyId: string): Promise<BountySubmission[]> {
    try {
      const q = query(collection(db, 'submissions'), where('bountyId', '==', bountyId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BountySubmission[]
    } catch (error) {
      console.error('Error fetching bounty submissions:', error)
      return []
    }
  },

  // Get submissions by creator
  async getCreatorSubmissions(creatorId: string): Promise<BountySubmission[]> {
    try {
      const q = query(collection(db, 'submissions'), where('creatorId', '==', creatorId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BountySubmission[]
    } catch (error) {
      console.error('Error fetching creator submissions:', error)
      return []
    }
  },

  // Get all bounty submissions (for dashboard)
  async getAllBountySubmissions(): Promise<BountySubmission[]> {
    try {
      console.log('Fetching all submissions...')
      const submissionsRef = collection(db, 'submissions')
      const querySnapshot = await getDocs(submissionsRef)
      
      const submissions: BountySubmission[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        submissions.push({
          id: doc.id,
          bountyId: data.bountyId,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          contentLinks: data.contentLinks,
          description: data.description,
          additionalNotes: data.additionalNotes,
          contentFiles: data.contentFiles || [],
          files: data.files,
          submittedAt: data.submittedAt,
          status: data.status,
          payoutAmount: data.payoutAmount,
          feedback: data.feedback,
          reviewedAt: data.reviewedAt,
          // Content review fields
          reviewScore: data.reviewScore,
          reviewFeedback: data.reviewFeedback,
          reviewIssues: data.reviewIssues,
          reviewedBy: data.reviewedBy,
          approvedAt: data.approvedAt,
          rejectedAt: data.rejectedAt
        })
      })
      
      console.log('✅ Fetched all submissions:', submissions.length)
      return submissions
    } catch (error) {
      console.error('❌ Error fetching all submissions:', error)
      throw error
    }
  },

  // Update business profile
  async updateBusinessProfile(userId: string, profile: {
    companyName: string
    description: string
    website: string
    industry: string
    location: string
    phone: string
    employeeCount: string
    foundedYear: string
    mission: string
  }): Promise<void> {
    try {
      console.log('Updating business profile for user:', userId)
      const userRef = doc(db, 'users', userId)
      
      await updateDoc(userRef, {
        'profile.business': {
          ...profile,
          updatedAt: serverTimestamp()
        }
      })
      
      console.log('✅ Business profile updated successfully')
    } catch (error) {
      console.error('❌ Error updating business profile:', error)
      throw error
    }
  },

      // Update submission status (approve, reject, request changes)
    async updateSubmissionStatus(submissionId: string, status: string, feedback?: string): Promise<void> {
      try {
        console.log('Updating submission status:', submissionId, status, feedback)
        const submissionRef = doc(db, 'submissions', submissionId)
        
        const updateData: any = {
          status,
          reviewedAt: new Date().toISOString()
        }
        
        if (feedback) {
          updateData.feedback = feedback
        }
        
        await updateDoc(submissionRef, updateData)
        console.log('✅ Submission status updated successfully')
      } catch (error) {
        console.error('❌ Failed to update submission status:', error)
        throw error
      }
    },

    // Update submission content (for resubmissions)
    async updateSubmissionContent(submissionId: string, content: {
      contentLinks: string
      description: string
      additionalNotes?: string
      files?: Array<{ name: string; size: number; type: string }>
      submittedAt: string
    }): Promise<void> {
      try {
        console.log('Updating submission content:', submissionId)
        const submissionRef = doc(db, 'submissions', submissionId)
        
        await updateDoc(submissionRef, {
          ...content,
          status: 'pending_review' // Reset status to pending_review for resubmission
        })
        console.log('✅ Submission content updated successfully')
      } catch (error) {
        console.error('❌ Failed to update submission content:', error)
        throw error
      }
    },

    // Bounty Management Functions
    
    // Update bounty (for editing pending bounties)
    async updateBounty(bountyId: string, updates: Partial<FirebaseBounty>): Promise<void> {
      try {
        console.log('Updating bounty:', bountyId)
        const bountyRef = doc(db, 'bounties', bountyId)
        await updateDoc(bountyRef, {
          ...updates,
          updatedAt: new Date().toISOString()
        })
        console.log('✅ Bounty updated successfully')
      } catch (error) {
        console.error('❌ Failed to update bounty:', error)
        throw error
      }
    },

    // Delete bounty (for pending bounties only)
    async deleteBounty(bountyId: string): Promise<void> {
      try {
        console.log('Deleting bounty:', bountyId)
        const bountyRef = doc(db, 'bounties', bountyId)
        
        // First check if bounty is pending (safety check)
        const bountyDoc = await getDoc(bountyRef)
        if (bountyDoc.exists()) {
          const bountyData = bountyDoc.data() as FirebaseBounty
          if (bountyData.status !== 'pending') {
            throw new Error('Only pending bounties can be deleted')
          }
        }
        
        await deleteDoc(bountyRef)
        console.log('✅ Bounty deleted successfully')
      } catch (error) {
        console.error('❌ Failed to delete bounty:', error)
        throw error
      }
    },

    // Pay/Fund bounty (move from pending to active)
    async payBounty(bountyId: string): Promise<void> {
      try {
        console.log('Paying bounty (moving to active):', bountyId)
        const bountyRef = doc(db, 'bounties', bountyId)
        
        // First check if bounty is pending
        const bountyDoc = await getDoc(bountyRef)
        if (!bountyDoc.exists()) {
          throw new Error('Bounty not found')
        }
        
        const bountyData = bountyDoc.data() as FirebaseBounty
        if (bountyData.status !== 'pending') {
          throw new Error('Only pending bounties can be paid/activated')
        }
        
        await updateDoc(bountyRef, {
          status: 'active',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        console.log('✅ Bounty funded and activated successfully')
      } catch (error) {
        console.error('❌ Failed to pay bounty:', error)
        throw error
      }
    },

    // Update bounty payment tracking when a creator gets paid
    async updateBountyPaymentTracking(bountyId: string, creatorPaymentAmount: number): Promise<void> {
      try {
        console.log('Updating bounty payment tracking:', bountyId, 'Amount:', creatorPaymentAmount)
        const bountyRef = doc(db, 'bounties', bountyId)
        
        const bountyDoc = await getDoc(bountyRef)
        if (!bountyDoc.exists()) {
          throw new Error('Bounty not found')
        }
        
        const bountyData = bountyDoc.data() as FirebaseBounty
        const currentPaidCount = bountyData.paidCreatorsCount || 0
        const currentTotalPaid = bountyData.totalPaidAmount || 0
        const currentRemaining = bountyData.remainingBudget || 0
        
        const newPaidCount = currentPaidCount + 1
        const newTotalPaid = currentTotalPaid + creatorPaymentAmount
        const newRemaining = currentRemaining - creatorPaymentAmount
        
        const updateData: any = {
          paidCreatorsCount: newPaidCount,
          totalPaidAmount: newTotalPaid,
          remainingBudget: Math.max(0, newRemaining), // Don't go negative
          updatedAt: new Date().toISOString()
        }
        
        // Check if bounty is exhausted (all creators paid or budget exhausted)
        const maxCreators = bountyData.maxCreators || 1
        const isExhausted = newPaidCount >= maxCreators || newRemaining <= 0
        
        if (isExhausted) {
          updateData.status = 'completed'
          updateData.completedAt = new Date().toISOString()
          console.log('🎉 Bounty exhausted - marking as completed')
        }
        
        await updateDoc(bountyRef, updateData)
        console.log('✅ Bounty payment tracking updated successfully')
      } catch (error) {
        console.error('❌ Failed to update bounty payment tracking:', error)
        throw error
      }
    },

    // Admin functions
    async getAllUsers(): Promise<AuthUser[]> {
      try {
        const usersRef = collection(db, 'users')
        const querySnapshot = await getDocs(usersRef)
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.id,
          email: doc.data().email || '',
          name: doc.data().name || doc.data().displayName || '',
          userType: doc.data().userType || 'creator',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          ...doc.data()
        } as AuthUser))
      } catch (error) {
        console.error('Error getting all users:', error)
        return []
      }
    },

    async getAllBounties(): Promise<Bounty[]> {
      try {
        const bountiesRef = collection(db, 'bounties')
        const querySnapshot = await getDocs(bountiesRef)
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt || new Date().toISOString()
        } as Bounty))
      } catch (error) {
        console.error('Error getting all bounties:', error)
        return []
      }
    },

    async getPendingSubmissions(): Promise<BountySubmission[]> {
      try {
        const submissionsRef = collection(db, 'submissions')
        const q = query(submissionsRef, where('status', '==', 'pending_review'))
        const querySnapshot = await getDocs(q)
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BountySubmission))
      } catch (error) {
        console.error('Error getting pending submissions:', error)
        return []
      }
    },

    async updateUserStatus(userId: string, action: 'suspend' | 'activate' | 'verify'): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId)
        const updates: any = {
          updatedAt: new Date().toISOString()
        }
        
        switch (action) {
          case 'suspend':
            updates.suspended = true
            updates.suspendedAt = new Date().toISOString()
            break
          case 'activate':
            updates.suspended = false
            updates.suspendedAt = null
            break
          case 'verify':
            updates.verified = true
            updates.verifiedAt = new Date().toISOString()
            break
        }
        
        await updateDoc(userRef, updates)
        console.log(`User ${action}d successfully`)
      } catch (error) {
        console.error(`Error ${action}ing user:`, error)
        throw error
      }
    },

    async updateBountyStatus(bountyId: string, action: 'approve' | 'reject' | 'flag'): Promise<void> {
      try {
        const bountyRef = doc(db, 'bounties', bountyId)
        const updates: any = {
          updatedAt: new Date().toISOString(),
          adminAction: action,
          adminActionAt: new Date().toISOString()
        }
        
        switch (action) {
          case 'flag':
            updates.flagged = true
            updates.flaggedAt = new Date().toISOString()
            break
          case 'approve':
            updates.adminApproved = true
            updates.approvedAt = new Date().toISOString()
            break
          case 'reject':
            updates.adminRejected = true
            updates.rejectedAt = new Date().toISOString()
            break
        }
        
        await updateDoc(bountyRef, updates)
        console.log(`Bounty ${action}d successfully`)
      } catch (error) {
        console.error(`Error ${action}ing bounty:`, error)
        throw error
      }
    },

    async reviewSubmission(submissionId: string, action: 'approve' | 'reject', feedback?: string): Promise<void> {
      try {
        const submissionRef = doc(db, 'submissions', submissionId)
        const updates: any = {
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewedAt: new Date().toISOString(),
          adminFeedback: feedback || ''
        }
        
        await updateDoc(submissionRef, updates)
        console.log(`Submission ${action}d successfully`)
      } catch (error) {
        console.error(`Error reviewing submission:`, error)
        throw error
      }
    }
}

// Firebase connection test
export const firebaseTest = {
  // Test Firestore connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firestore connection...')
      const testDoc = doc(db, '_test', 'connection')
      await setDoc(testDoc, { timestamp: serverTimestamp() })
      await getDoc(testDoc)
      console.log('✅ Firestore connection test successful')
      return true
    } catch (error) {
      console.error('❌ Firestore connection test failed:', error)
      return false
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
        const completedBounties = userBounties.filter(b => b.status === 'completed')
        return {
          bountiesCompleted: completedBounties.length,
          totalEarned: completedBounties.reduce((sum, b) => sum + b.payment.amount, 0)
        }
      } else {
        // For business stats - calculate real values
        const totalSpent = userBounties
          .filter(b => b.status === 'active' || b.status === 'completed')
          .reduce((sum, b) => sum + (b.payment.amount * (b.maxCreators || 1)), 0)
        
        // Calculate unique creators worked with from applications
        const allApplications = await Promise.all(
          userBounties.map(bounty => firebaseDB.getBountyApplications(bounty.id))
        )
        const uniqueCreators = new Set(
          allApplications.flat().filter(app => app.status === 'accepted').map(app => app.creatorId)
        ).size
        
        return {
          bountiesCreated: userBounties.length,
          creatorsWorkedWith: uniqueCreators,
          totalSpent: totalSpent,
          avgEngagement: '0%' // Would need real analytics data - showing 0% until implemented
        }
      }
    } catch (error) {
      console.error('Get user stats error:', error)
      // Return zero values if there's an error loading real data
      if (userType === 'creator') {
        return {
          bountiesCompleted: 0,
          totalEarned: 0
        }
      } else {
        return {
          bountiesCreated: 0,
          creatorsWorkedWith: 0,
          totalSpent: 0,
          avgEngagement: '0%'
        }
      }
    }
  }
}
