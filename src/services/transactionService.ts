import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  runTransaction,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { 
  VersionedDocument, 
  TransactionResult, 
  TransactionOptions, 
  ConflictResolution,
  ConcurrencyError,
  TransactionContext
} from '../types/transaction'

export class TransactionService {
  private static readonly DEFAULT_OPTIONS: TransactionOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  }

  /**
   * Execute a transaction with automatic retry and conflict resolution
   */
  static async executeTransaction<T>(
    operation: (transaction: any, context: TransactionContext) => Promise<T>,
    context: TransactionContext,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    let lastError: Error | null = null

    for (let attempt = 0; attempt < opts.maxRetries!; attempt++) {
      try {
        const result = await runTransaction(db, async (transaction) => {
          const transactionContext = {
            ...context,
            retryCount: attempt,
            timestamp: new Date().toISOString()
          }
          
          return await operation(transaction, transactionContext)
        })

        return {
          success: true,
          data: result
        }
      } catch (error: any) {
        lastError = error
        
        // Check if it's a concurrency error and we can retry
        if (this.isRetryableError(error) && attempt < opts.maxRetries! - 1) {
          console.warn(`Transaction attempt ${attempt + 1} failed, retrying...`, error.message)
          await this.delay(opts.retryDelay! * Math.pow(2, attempt)) // Exponential backoff
          continue
        }

        // Non-retryable error or max retries reached
        return {
          success: false,
          error: error.message,
          retryable: this.isRetryableError(error)
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Transaction failed after maximum retries',
      retryable: false
    }
  }

  /**
   * Create a document with version control
   */
  static async createVersionedDocument<T extends VersionedDocument>(
    collection: string,
    docId: string,
    data: Omit<T, keyof VersionedDocument>,
    userId: string
  ): Promise<TransactionResult<T>> {
    const versionedData: T = {
      ...data,
      _version: 1,
      _lastModified: new Date().toISOString(),
      _modifiedBy: userId
    } as T

    return this.executeTransaction(
      async (transaction) => {
        const docRef = doc(db, collection, docId)
        const docSnap = await transaction.get(docRef)
        
        if (docSnap.exists()) {
          throw new Error('Document already exists')
        }
        
        transaction.set(docRef, {
          ...versionedData,
          _lastModified: serverTimestamp()
        })
        
        return versionedData
      },
      { userId, sessionId: this.generateSessionId(), timestamp: new Date().toISOString(), operation: 'create', retryCount: 0 }
    )
  }

  /**
   * Update a document with optimistic concurrency control
   */
  static async updateVersionedDocument<T extends VersionedDocument>(
    collection: string,
    docId: string,
    updates: Partial<Omit<T, keyof VersionedDocument>>,
    expectedVersion: number,
    userId: string,
    conflictResolution: ConflictResolution = { strategy: 'reject' }
  ): Promise<TransactionResult<T>> {
    return this.executeTransaction(
      async (transaction) => {
        const docRef = doc(db, collection, docId)
        const docSnap = await transaction.get(docRef)
        
        if (!docSnap.exists()) {
          throw new Error('Document not found')
        }
        
        const currentData = docSnap.data() as T
        
        // Check version for optimistic concurrency control
        if (currentData._version !== expectedVersion) {
          const error: ConcurrencyError = new Error('Concurrent modification detected') as ConcurrencyError
          error.code = 'CONCURRENT_MODIFICATION'
          error.localVersion = expectedVersion
          error.remoteVersion = currentData._version
          error.conflictData = currentData
          throw error
        }
        
        // Apply conflict resolution if needed
        let resolvedData = { ...currentData, ...updates }
        if (conflictResolution.strategy === 'merge' && conflictResolution.mergeFunction) {
          resolvedData = conflictResolution.mergeFunction(currentData, updates)
        }
        
        const updatedData: T = {
          ...resolvedData,
          _version: currentData._version + 1,
          _lastModified: new Date().toISOString(),
          _modifiedBy: userId
        } as T
        
        transaction.update(docRef, {
          ...updatedData,
          _lastModified: serverTimestamp()
        })
        
        return updatedData
      },
      { userId, sessionId: this.generateSessionId(), timestamp: new Date().toISOString(), operation: 'update', retryCount: 0 }
    )
  }

  /**
   * Delete a document with version control
   */
  static async deleteVersionedDocument(
    collection: string,
    docId: string,
    expectedVersion: number,
    userId: string
  ): Promise<TransactionResult<boolean>> {
    return this.executeTransaction(
      async (transaction) => {
        const docRef = doc(db, collection, docId)
        const docSnap = await transaction.get(docRef)
        
        if (!docSnap.exists()) {
          throw new Error('Document not found')
        }
        
        const currentData = docSnap.data() as VersionedDocument
        
        // Check version for optimistic concurrency control
        if (currentData._version !== expectedVersion) {
          const error: ConcurrencyError = new Error('Concurrent modification detected') as ConcurrencyError
          error.code = 'CONCURRENT_MODIFICATION'
          error.localVersion = expectedVersion
          error.remoteVersion = currentData._version
          throw error
        }
        
        transaction.delete(docRef)
        return true
      },
      { userId, sessionId: this.generateSessionId(), timestamp: new Date().toISOString(), operation: 'delete', retryCount: 0 }
    )
  }

  /**
   * Execute a batch operation with version control
   */
  static async executeBatch<T>(
    operations: Array<{
      type: 'create' | 'update' | 'delete'
      collection: string
      docId: string
      data?: any
      expectedVersion?: number
    }>,
    userId: string
  ): Promise<TransactionResult<T[]>> {
    return this.executeTransaction(
      async (transaction) => {
        const results: T[] = []
        
        for (const op of operations) {
          const docRef = doc(db, op.collection, op.docId)
          
          switch (op.type) {
            case 'create':
              const docSnap = await transaction.get(docRef)
              if (docSnap.exists()) {
                throw new Error(`Document ${op.docId} already exists`)
              }
              transaction.set(docRef, {
                ...op.data,
                _version: 1,
                _lastModified: serverTimestamp(),
                _modifiedBy: userId
              })
              results.push({ ...op.data, _version: 1 } as T)
              break
              
            case 'update':
              const updateSnap = await transaction.get(docRef)
              if (!updateSnap.exists()) {
                throw new Error(`Document ${op.docId} not found`)
              }
              const currentData = updateSnap.data() as VersionedDocument
              if (op.expectedVersion && currentData._version !== op.expectedVersion) {
                throw new Error(`Version mismatch for ${op.docId}`)
              }
              transaction.update(docRef, {
                ...op.data,
                _version: currentData._version + 1,
                _lastModified: serverTimestamp(),
                _modifiedBy: userId
              })
              results.push({ ...currentData, ...op.data, _version: currentData._version + 1 } as T)
              break
              
            case 'delete':
              const deleteSnap = await transaction.get(docRef)
              if (!deleteSnap.exists()) {
                throw new Error(`Document ${op.docId} not found`)
              }
              const deleteData = deleteSnap.data() as VersionedDocument
              if (op.expectedVersion && deleteData._version !== op.expectedVersion) {
                throw new Error(`Version mismatch for ${op.docId}`)
              }
              transaction.delete(docRef)
              results.push(true as T)
              break
          }
        }
        
        return results
      },
      { userId, sessionId: this.generateSessionId(), timestamp: new Date().toISOString(), operation: 'batch', retryCount: 0 }
    )
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Firebase transaction errors that can be retried
    if (error.code === 'CONCURRENT_MODIFICATION') return true
    if (error.code === 'unavailable') return true
    if (error.code === 'deadline-exceeded') return true
    if (error.message?.includes('transaction')) return true
    
    return false
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
