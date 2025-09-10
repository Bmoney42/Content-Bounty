import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuditEvent } from '../types/transaction'

export class AuditLogger {
  private static readonly COLLECTION = 'audit_logs'
  private static readonly MAX_RETRIES = 3

  /**
   * Log an audit event with cryptographic hashing
   */
  static async logEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    oldData?: any,
    newData?: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    const eventId = this.generateEventId()
    const timestamp = new Date().toISOString()
    
    const auditEvent: AuditEvent = {
      id: eventId,
      timestamp,
      userId,
      action,
      resourceType,
      resourceId,
      oldData: oldData ? this.sanitizeData(oldData) : undefined,
      newData: newData ? this.sanitizeData(newData) : undefined,
      metadata: metadata ? this.sanitizeData(metadata) : undefined,
      hash: ''
    }

    // Generate cryptographic hash for tamper-proof logging
    auditEvent.hash = await this.generateHash(auditEvent)

    // Store with retry logic
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const docRef = doc(db, this.COLLECTION, eventId)
        await setDoc(docRef, {
          ...auditEvent,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        })
        
        console.log(`✅ Audit event logged: ${action} on ${resourceType}:${resourceId}`)
        return eventId
      } catch (error) {
        console.error(`❌ Failed to log audit event (attempt ${attempt + 1}):`, error)
        if (attempt === this.MAX_RETRIES - 1) {
          throw new Error(`Failed to log audit event after ${this.MAX_RETRIES} attempts`)
        }
        await this.delay(1000 * Math.pow(2, attempt)) // Exponential backoff
      }
    }

    throw new Error('Failed to log audit event')
  }

  /**
   * Log bounty state transitions
   */
  static async logBountyStateTransition(
    bountyId: string,
    fromStatus: string,
    toStatus: string,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      userId,
      'bounty_state_transition',
      'bounty',
      bountyId,
      { status: fromStatus },
      { status: toStatus },
      {
        reason,
        transition: `${fromStatus} -> ${toStatus}`,
        ...metadata
      }
    )
  }

  /**
   * Log payment events
   */
  static async logPaymentEvent(
    paymentId: string,
    action: string,
    userId: string,
    amount?: number,
    currency?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      userId,
      `payment_${action}`,
      'payment',
      paymentId,
      undefined,
      { amount, currency },
      metadata
    )
  }

  /**
   * Log application events
   */
  static async logApplicationEvent(
    applicationId: string,
    action: string,
    userId: string,
    bountyId: string,
    oldStatus?: string,
    newStatus?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      userId,
      `application_${action}`,
      'application',
      applicationId,
      oldStatus ? { status: oldStatus } : undefined,
      newStatus ? { status: newStatus } : undefined,
      {
        bountyId,
        ...metadata
      }
    )
  }

  /**
   * Log user actions
   */
  static async logUserAction(
    action: string,
    userId: string,
    targetUserId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      userId,
      `user_${action}`,
      'user',
      targetUserId || userId,
      undefined,
      undefined,
      metadata
    )
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    action: string,
    adminUserId: string,
    targetResourceType: string,
    targetResourceId: string,
    oldData?: any,
    newData?: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      adminUserId,
      `admin_${action}`,
      targetResourceType,
      targetResourceId,
      oldData,
      newData,
      {
        adminAction: true,
        ...metadata
      }
    )
  }

  /**
   * Get audit trail for a specific resource
   */
  static async getAuditTrail(
    resourceType: string,
    resourceId: string,
    limitCount: number = 50
  ): Promise<AuditEvent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as AuditEvent)
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      return []
    }
  }

  /**
   * Get audit trail for a user
   */
  static async getUserAuditTrail(
    userId: string,
    limitCount: number = 50
  ): Promise<AuditEvent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as AuditEvent)
    } catch (error) {
      console.error('Error fetching user audit trail:', error)
      return []
    }
  }

  /**
   * Verify audit event integrity
   */
  static async verifyAuditEvent(eventId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION, eventId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return false
      }
      
      const event = docSnap.data() as AuditEvent
      const expectedHash = await this.generateHash(event)
      
      return event.hash === expectedHash
    } catch (error) {
      console.error('Error verifying audit event:', error)
      return false
    }
  }

  /**
   * Generate a unique event ID
   */
  private static generateEventId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `audit_${timestamp}_${random}`
  }

  /**
   * Generate cryptographic hash for tamper-proof logging
   */
  private static async generateHash(event: Omit<AuditEvent, 'hash'>): Promise<string> {
    const dataString = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      oldData: event.oldData,
      newData: event.newData,
      metadata: event.metadata
    })
    
    // Use Web Crypto API for hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(dataString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private static sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']
    const sanitized = { ...data }
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }
    
    return sanitized
  }

  /**
   * Delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
