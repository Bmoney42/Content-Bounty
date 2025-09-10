import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { TransactionService } from './transactionService'
import { AuditLogger } from './auditLogger'
import { createStateMachine, StateMachineContext } from './stateMachine'
import { Bounty, BountyApplication, EscrowPayment, ApplicationStatus } from '../types/bounty'
import { VersionedDocument } from '../types/transaction'

// Enhanced Firebase service with transactions and state machines
export class EnhancedFirebaseService {
  private static bountyStateMachine = createStateMachine('bounty')
  private static applicationStateMachine = createStateMachine('application')
  private static paymentStateMachine = createStateMachine('payment')

  /**
   * Create a bounty with transaction and state machine
   */
  static async createBounty(
    bountyData: Omit<Bounty, 'id' | 'createdAt' | '_version' | '_lastModified' | '_modifiedBy'>,
    userId: string
  ): Promise<string> {
    const result = await TransactionService.createVersionedDocument(
      'bounties',
      '', // Let Firebase generate ID
      {
        ...bountyData,
        status: 'pending',
        applicationsCount: 0,
        paidCreatorsCount: 0,
        totalPaidAmount: 0,
        remainingBudget: bountyData.payment.amount * (bountyData.maxCreators || 1)
      },
      userId
    )

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create bounty')
    }

    // Log the creation
    const bountyId = (result.data as any)?.id || 'unknown'
    await AuditLogger.logEvent(
      userId,
      'bounty_created',
      'bounty',
      bountyId,
      undefined,
      result.data,
      { businessId: bountyData.businessId }
    )

    return bountyId
  }

  /**
   * Update bounty status with state machine validation
   */
  static async updateBountyStatus(
    bountyId: string,
    newStatus: Bounty['status'],
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Get current bounty data
    const bountyRef = doc(db, 'bounties', bountyId)
    const bountySnap = await getDoc(bountyRef)
    
    if (!bountySnap.exists()) {
      throw new Error('Bounty not found')
    }

    const currentData = bountySnap.data() as Bounty & VersionedDocument
    const currentStatus = currentData.status

    // Validate state transition
    const context: StateMachineContext = {
      userId,
      resourceId: bountyId,
      resourceType: 'bounty',
      currentData,
      metadata
    }

    // Execute state transition
    await this.bountyStateMachine.transition(currentStatus, newStatus, context, reason)

    // Update the bounty with transaction
    const result = await TransactionService.updateVersionedDocument(
      'bounties',
      bountyId,
      { status: newStatus },
      currentData._version || 1,
      userId
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to update bounty status')
    }
  }

  /**
   * Create application with transaction and validation
   */
  static async createApplication(
    applicationData: Omit<BountyApplication, 'id' | 'submittedAt' | '_version' | '_lastModified' | '_modifiedBy'>,
    userId: string
  ): Promise<string> {
    // First, validate that the bounty can accept applications
    const bountyRef = doc(db, 'bounties', applicationData.bountyId)
    const bountySnap = await getDoc(bountyRef)
    
    if (!bountySnap.exists()) {
      throw new Error('Bounty not found')
    }

    const bountyData = bountySnap.data() as Bounty & VersionedDocument

    // Check if bounty is active
    if (bountyData.status !== 'active') {
      throw new Error('Bounty is not active')
    }

    // Check application limits
    if (bountyData.maxApplications && bountyData.applicationsCount >= bountyData.maxApplications) {
      throw new Error('Bounty has reached maximum applications')
    }

    // Check if user already applied
    const existingApplication = await this.hasUserAppliedToBounty(applicationData.bountyId, applicationData.creatorId)
    if (existingApplication) {
      throw new Error('You have already applied to this bounty')
    }

    // Create application with transaction
    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        // Create application
        const appRef = doc(collection(db, 'applications'))
        const appData = {
          ...applicationData,
          status: 'pending' as ApplicationStatus,
          submittedAt: new Date().toISOString(),
          _version: 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        }
        
        transaction.set(appRef, {
          ...appData,
          _lastModified: serverTimestamp()
        })

        // Update bounty applications count
        const newApplicationsCount = bountyData.applicationsCount + 1
        const updateData: any = {
          applicationsCount: newApplicationsCount,
          _version: (bountyData._version || 1) + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        }

        // Check if applications limit is reached
        if (bountyData.maxApplications && newApplicationsCount >= bountyData.maxApplications) {
          updateData.status = 'in-progress'
          updateData.applicationsClosedAt = new Date().toISOString()
        }

        transaction.update(bountyRef, {
          ...updateData,
          _lastModified: serverTimestamp()
        })

        return appRef.id
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'create_application', retryCount: 0 }
    )

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create application')
    }

    // Log the application creation
    await AuditLogger.logEvent(
      userId,
      'application_created',
      'application',
      result.data,
      undefined,
      applicationData,
      { bountyId: applicationData.bountyId }
    )

    return result.data
  }

  /**
   * Update application status with state machine validation
   */
  static async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Get current application data
    const appRef = doc(db, 'applications', applicationId)
    const appSnap = await getDoc(appRef)
    
    if (!appSnap.exists()) {
      throw new Error('Application not found')
    }

    const currentData = appSnap.data() as BountyApplication & VersionedDocument
    const currentStatus = currentData.status

    // Validate state transition
    const context: StateMachineContext = {
      userId,
      resourceId: applicationId,
      resourceType: 'application',
      currentData,
      metadata
    }

    // Execute state transition
    await this.applicationStateMachine.transition(currentStatus, newStatus, context, reason)

    // Update the application with transaction
    const result = await TransactionService.updateVersionedDocument(
      'applications',
      applicationId,
      { 
        status: newStatus,
        reviewedAt: new Date().toISOString()
      },
      currentData._version || 1,
      userId
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to update application status')
    }

    // Log the status change
    await AuditLogger.logApplicationEvent(
      applicationId,
      'status_changed',
      userId,
      currentData.bountyId,
      currentStatus,
      newStatus,
      { reason, ...metadata }
    )
  }

  /**
   * Update bounty payment tracking with transaction
   */
  static async updateBountyPaymentTracking(
    bountyId: string,
    creatorPaymentAmount: number,
    userId: string
  ): Promise<void> {
    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        const bountyRef = doc(db, 'bounties', bountyId)
        const bountySnap = await transaction.get(bountyRef)
        
        if (!bountySnap.exists()) {
          throw new Error('Bounty not found')
        }

        const bountyData = bountySnap.data() as Bounty & VersionedDocument
        const newPaidCount = (bountyData.paidCreatorsCount || 0) + 1
        const newTotalPaid = (bountyData.totalPaidAmount || 0) + creatorPaymentAmount
        const newRemaining = (bountyData.remainingBudget || 0) - creatorPaymentAmount

        const updateData: any = {
          paidCreatorsCount: newPaidCount,
          totalPaidAmount: newTotalPaid,
          remainingBudget: newRemaining,
          _version: (bountyData._version || 1) + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        }

        // Check if bounty is exhausted
        if (newPaidCount >= (bountyData.maxCreators || 1) || newRemaining <= 0) {
          updateData.status = 'completed'
          updateData.completedAt = new Date().toISOString()
        }

        transaction.update(bountyRef, {
          ...updateData,
          _lastModified: serverTimestamp()
        })

        return { newPaidCount, newTotalPaid, newRemaining }
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'update_payment_tracking', retryCount: 0 }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to update payment tracking')
    }

    // Log the payment tracking update
    await AuditLogger.logEvent(
      userId,
      'payment_tracking_updated',
      'bounty',
      bountyId,
      undefined,
      result.data,
      { creatorPaymentAmount }
    )
  }

  /**
   * Check if user has already applied to a bounty
   */
  static async hasUserAppliedToBounty(bountyId: string, creatorId: string): Promise<boolean> {
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
  }

  /**
   * Get bounty with version information
   */
  static async getBounty(bountyId: string): Promise<(Bounty & VersionedDocument) | null> {
    try {
      const bountyRef = doc(db, 'bounties', bountyId)
      const bountySnap = await getDoc(bountyRef)
      
      if (!bountySnap.exists()) {
        return null
      }

      return bountySnap.data() as Bounty & VersionedDocument
    } catch (error) {
      console.error('Error fetching bounty:', error)
      return null
    }
  }

  /**
   * Get application with version information
   */
  static async getApplication(applicationId: string): Promise<(BountyApplication & VersionedDocument) | null> {
    try {
      const appRef = doc(db, 'applications', applicationId)
      const appSnap = await getDoc(appRef)
      
      if (!appSnap.exists()) {
        return null
      }

      return appSnap.data() as BountyApplication & VersionedDocument
    } catch (error) {
      console.error('Error fetching application:', error)
      return null
    }
  }

  /**
   * Get audit trail for a resource
   */
  static async getAuditTrail(resourceType: string, resourceId: string): Promise<any[]> {
    return AuditLogger.getAuditTrail(resourceType, resourceId)
  }

  /**
   * Get possible state transitions for a resource
   */
  static getPossibleTransitions(resourceType: string, currentStatus: string, context: StateMachineContext): string[] {
    switch (resourceType) {
      case 'bounty':
        return this.bountyStateMachine.getPossibleTransitions(currentStatus, context)
      case 'application':
        return this.applicationStateMachine.getPossibleTransitions(currentStatus, context)
      case 'payment':
        return this.paymentStateMachine.getPossibleTransitions(currentStatus, context)
      default:
        return []
    }
  }
}
