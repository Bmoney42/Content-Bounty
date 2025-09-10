// Transaction and concurrency control types

export interface VersionedDocument {
  _version: number
  _lastModified: string
  _modifiedBy: string
}

export interface TransactionResult<T> {
  success: boolean
  data?: T
  error?: string
  retryable?: boolean
}

export interface TransactionOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual' | 'reject'
  mergeFunction?: (local: any, remote: any) => any
}

export interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  oldData?: any
  newData?: any
  metadata?: Record<string, any>
  hash: string
}

export interface StateTransition {
  from: string
  to: string
  timestamp: string
  userId: string
  reason?: string
  metadata?: Record<string, any>
}

export interface ConcurrencyError extends Error {
  code: 'CONCURRENT_MODIFICATION'
  localVersion: number
  remoteVersion: number
  conflictData?: any
}

export interface TransactionContext {
  userId: string
  sessionId: string
  timestamp: string
  operation: string
  retryCount: number
}
