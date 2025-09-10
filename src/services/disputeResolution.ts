import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuditLogger } from './auditLogger'
import { TransactionService } from './transactionService'

export interface Dispute {
  id: string
  type: DisputeType
  status: DisputeStatus
  priority: DisputePriority
  title: string
  description: string
  
  // Parties involved
  initiatorId: string
  initiatorType: 'creator' | 'business'
  respondentId: string
  respondentType: 'creator' | 'business'
  
  // Related resources
  bountyId: string
  applicationId?: string
  submissionId?: string
  paymentId?: string
  
  // Evidence and documentation
  evidence: DisputeEvidence[]
  messages: DisputeMessage[]
  
  // Resolution
  resolution?: DisputeResolution
  resolvedBy?: string
  resolvedAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  deadline?: string
  
  // Version control
  _version?: number
  _lastModified?: string
  _modifiedBy?: string
}

export type DisputeType = 
  | 'payment_dispute'
  | 'content_quality'
  | 'delivery_timeline'
  | 'requirement_violation'
  | 'communication_issue'
  | 'refund_request'
  | 'other'

export type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'evidence_collection'
  | 'mediation'
  | 'escalated'
  | 'resolved'
  | 'closed'

export type DisputePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export interface DisputeEvidence {
  id: string
  type: 'document' | 'screenshot' | 'message' | 'video' | 'audio' | 'other'
  title: string
  description?: string
  url?: string
  content?: string
  submittedBy: string
  submittedAt: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
}

export interface DisputeMessage {
  id: string
  senderId: string
  senderType: 'creator' | 'business' | 'admin' | 'system'
  message: string
  timestamp: string
  attachments?: string[]
  isInternal: boolean // Admin-only messages
}

export interface DisputeResolution {
  outcome: 'favor_initiator' | 'favor_respondent' | 'partial_favor' | 'no_fault'
  reason: string
  actions: DisputeAction[]
  compensation?: {
    amount: number
    currency: string
    recipient: string
  }
  penalties?: {
    userId: string
    type: 'warning' | 'suspension' | 'ban'
    duration?: number // days
    reason: string
  }[]
}

export interface DisputeAction {
  type: 'refund' | 'payment_release' | 'content_revision' | 'account_suspension' | 'warning' | 'other'
  description: string
  status: 'pending' | 'completed' | 'failed'
  completedAt?: string
  completedBy?: string
}

export class DisputeResolutionService {
  private static readonly COLLECTION = 'disputes'
  private static readonly MAX_RETRIES = 3

  /**
   * Create a new dispute
   */
  static async createDispute(
    disputeData: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt' | '_version' | '_lastModified' | '_modifiedBy'>,
    userId: string
  ): Promise<string> {
    const result = await TransactionService.createVersionedDocument(
      this.COLLECTION,
      '', // Let Firebase generate ID
      {
        ...disputeData,
        status: 'open',
        priority: this.calculatePriority(disputeData.type, disputeData.bountyId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: this.calculateDeadline(disputeData.priority)
      },
      userId
    )

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create dispute')
    }

    // Log the dispute creation
    const disputeId = (result.data as any)?.id || 'unknown'
    await AuditLogger.logEvent(
      userId,
      'dispute_created',
      'dispute',
      disputeId,
      undefined,
      result.data,
      { 
        type: disputeData.type,
        bountyId: disputeData.bountyId,
        respondentId: disputeData.respondentId
      }
    )

    // Notify the respondent
    await this.notifyRespondent(disputeId, disputeData.respondentId, disputeData.type)

    return disputeId
  }

  /**
   * Update dispute status
   */
  static async updateDisputeStatus(
    disputeId: string,
    newStatus: DisputeStatus,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        const disputeRef = doc(db, this.COLLECTION, disputeId)
        const disputeSnap = await transaction.get(disputeRef)
        
        if (!disputeSnap.exists()) {
          throw new Error('Dispute not found')
        }

        const currentData = disputeSnap.data() as Dispute & { _version: number }
        const oldStatus = currentData.status

        // Validate status transition
        if (!this.isValidStatusTransition(oldStatus, newStatus)) {
          throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`)
        }

        const updateData = {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          _version: currentData._version + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        }

        // Set resolution timestamp if resolved
        if (newStatus === 'resolved') {
          const resolvedAt = new Date().toISOString()
          (updateData as any).resolvedAt = resolvedAt
          (updateData as any).resolvedBy = userId
        }

        transaction.update(disputeRef, {
          ...updateData,
          updatedAt: serverTimestamp()
        })

        return { oldStatus, newStatus }
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'update_dispute_status', retryCount: 0 }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to update dispute status')
    }

    // Log the status change
    await AuditLogger.logEvent(
      userId,
      'dispute_status_changed',
      'dispute',
      disputeId,
      { status: result.data?.oldStatus },
      { status: result.data?.newStatus },
      { reason, ...metadata }
    )
  }

  /**
   * Add evidence to a dispute
   */
  static async addEvidence(
    disputeId: string,
    evidence: Omit<DisputeEvidence, 'id' | 'submittedAt' | 'verified'>,
    userId: string
  ): Promise<string> {
    const evidenceId = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const evidenceData: DisputeEvidence = {
      ...evidence,
      id: evidenceId,
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      verified: false
    }

    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        const disputeRef = doc(db, this.COLLECTION, disputeId)
        const disputeSnap = await transaction.get(disputeRef)
        
        if (!disputeSnap.exists()) {
          throw new Error('Dispute not found')
        }

        const currentData = disputeSnap.data() as Dispute & { _version: number }
        const updatedEvidence = [...(currentData.evidence || []), evidenceData]

        transaction.update(disputeRef, {
          evidence: updatedEvidence,
          updatedAt: serverTimestamp(),
          _version: currentData._version + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        })

        return evidenceId
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'add_evidence', retryCount: 0 }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to add evidence')
    }

    // Log the evidence addition
    await AuditLogger.logEvent(
      userId,
      'dispute_evidence_added',
      'dispute',
      disputeId,
      undefined,
      evidenceData,
      { evidenceType: evidence.type }
    )

    return result.data || evidenceId
  }

  /**
   * Add message to dispute
   */
  static async addMessage(
    disputeId: string,
    message: Omit<DisputeMessage, 'id' | 'timestamp'>,
    userId: string
  ): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const messageData: DisputeMessage = {
      ...message,
      id: messageId,
      timestamp: new Date().toISOString()
    }

    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        const disputeRef = doc(db, this.COLLECTION, disputeId)
        const disputeSnap = await transaction.get(disputeRef)
        
        if (!disputeSnap.exists()) {
          throw new Error('Dispute not found')
        }

        const currentData = disputeSnap.data() as Dispute & { _version: number }
        const updatedMessages = [...(currentData.messages || []), messageData]

        transaction.update(disputeRef, {
          messages: updatedMessages,
          updatedAt: serverTimestamp(),
          _version: currentData._version + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        })

        return messageId
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'add_message', retryCount: 0 }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to add message')
    }

    return result.data || messageId
  }

  /**
   * Resolve a dispute
   */
  static async resolveDispute(
    disputeId: string,
    resolution: DisputeResolution,
    userId: string,
    reason?: string
  ): Promise<void> {
    const result = await TransactionService.executeTransaction(
      async (transaction) => {
        const disputeRef = doc(db, this.COLLECTION, disputeId)
        const disputeSnap = await transaction.get(disputeRef)
        
        if (!disputeSnap.exists()) {
          throw new Error('Dispute not found')
        }

        const currentData = disputeSnap.data() as Dispute & { _version: number }

        transaction.update(disputeRef, {
          status: 'resolved',
          resolution,
          resolvedBy: userId,
          resolvedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          _version: currentData._version + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        })

        return resolution
      },
      { userId, sessionId: TransactionService['generateSessionId'](), timestamp: new Date().toISOString(), operation: 'resolve_dispute', retryCount: 0 }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to resolve dispute')
    }

    // Log the resolution
    await AuditLogger.logEvent(
      userId,
      'dispute_resolved',
      'dispute',
      disputeId,
      undefined,
      resolution,
      { reason, outcome: resolution.outcome }
    )

    // Execute resolution actions
    await this.executeResolutionActions(disputeId, resolution, userId)
  }

  /**
   * Get dispute by ID
   */
  static async getDispute(disputeId: string): Promise<Dispute | null> {
    try {
      const disputeRef = doc(db, this.COLLECTION, disputeId)
      const disputeSnap = await getDoc(disputeRef)
      
      if (!disputeSnap.exists()) {
        return null
      }

      return disputeSnap.data() as Dispute
    } catch (error) {
      console.error('Error fetching dispute:', error)
      return null
    }
  }

  /**
   * Get disputes by user
   */
  static async getUserDisputes(userId: string, limitCount: number = 20): Promise<Dispute[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('initiatorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as Dispute)
    } catch (error) {
      console.error('Error fetching user disputes:', error)
      return []
    }
  }

  /**
   * Get disputes requiring admin attention
   */
  static async getAdminDisputes(limitCount: number = 50): Promise<Dispute[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', 'in', ['open', 'under_review', 'escalated']),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as Dispute)
    } catch (error) {
      console.error('Error fetching admin disputes:', error)
      return []
    }
  }

  /**
   * Calculate dispute priority based on type and context
   */
  private static calculatePriority(type: DisputeType, bountyId: string): DisputePriority {
    switch (type) {
      case 'payment_dispute':
      case 'refund_request':
        return 'high'
      case 'content_quality':
      case 'delivery_timeline':
        return 'medium'
      case 'communication_issue':
      case 'requirement_violation':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Calculate dispute deadline based on priority
   */
  private static calculateDeadline(priority: DisputePriority): string {
    const now = new Date()
    let daysToAdd = 7 // Default 7 days

    switch (priority) {
      case 'urgent':
        daysToAdd = 1
        break
      case 'high':
        daysToAdd = 3
        break
      case 'medium':
        daysToAdd = 7
        break
      case 'low':
        daysToAdd = 14
        break
    }

    now.setDate(now.getDate() + daysToAdd)
    return now.toISOString()
  }

  /**
   * Validate status transition
   */
  private static isValidStatusTransition(from: DisputeStatus, to: DisputeStatus): boolean {
    const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
      'open': ['under_review', 'evidence_collection', 'closed'],
      'under_review': ['evidence_collection', 'mediation', 'escalated', 'resolved'],
      'evidence_collection': ['under_review', 'mediation', 'escalated'],
      'mediation': ['under_review', 'escalated', 'resolved'],
      'escalated': ['under_review', 'resolved'],
      'resolved': ['closed'],
      'closed': []
    }

    return validTransitions[from]?.includes(to) || false
  }

  /**
   * Notify respondent about dispute
   */
  private static async notifyRespondent(disputeId: string, respondentId: string, type: DisputeType): Promise<void> {
    // This would integrate with your notification system
    console.log(`Notifying user ${respondentId} about dispute ${disputeId} of type ${type}`)
    
    // Add to notifications collection
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: respondentId,
        type: 'dispute_created',
        title: 'New Dispute Filed',
        message: `A dispute has been filed against you. Please review and respond.`,
        data: {
          disputeId,
          disputeType: type
        },
        createdAt: serverTimestamp(),
        read: false
      })
    } catch (error) {
      console.error('Failed to send dispute notification:', error)
    }
  }

  /**
   * Execute resolution actions
   */
  private static async executeResolutionActions(
    disputeId: string,
    resolution: DisputeResolution,
    userId: string
  ): Promise<void> {
    for (const action of resolution.actions) {
      try {
        switch (action.type) {
          case 'refund':
            // Execute refund logic
            console.log(`Executing refund action for dispute ${disputeId}`)
            break
          case 'payment_release':
            // Execute payment release logic
            console.log(`Executing payment release action for dispute ${disputeId}`)
            break
          case 'content_revision':
            // Execute content revision logic
            console.log(`Executing content revision action for dispute ${disputeId}`)
            break
          case 'account_suspension':
            // Execute account suspension logic
            console.log(`Executing account suspension action for dispute ${disputeId}`)
            break
          case 'warning':
            // Execute warning logic
            console.log(`Executing warning action for dispute ${disputeId}`)
            break
        }

        // Mark action as completed
        action.status = 'completed'
        action.completedAt = new Date().toISOString()
        action.completedBy = userId

      } catch (error) {
        console.error(`Failed to execute action ${action.type} for dispute ${disputeId}:`, error)
        action.status = 'failed'
      }
    }
  }
}
