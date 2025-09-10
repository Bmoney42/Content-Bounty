// Task queue types and interfaces

export interface Task {
  id: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  payload: any
  attempts: number
  maxAttempts: number
  createdAt: string
  scheduledFor?: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  error?: string
  result?: any
  metadata?: Record<string, any>
}

export type TaskType = 
  | 'escrow_release'
  | 'notification_send'
  | 'analytics_process'
  | 'content_verification'
  | 'dispute_notification'
  | 'payment_retry'
  | 'user_cleanup'
  | 'audit_cleanup'
  | 'email_send'
  | 'webhook_retry'

export type TaskPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

export type TaskStatus = 
  | 'pending'
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface TaskQueueConfig {
  concurrency: number
  retryDelay: number
  maxRetries: number
  cleanupInterval: number
  deadLetterQueue: boolean
}

export interface TaskProcessor {
  type: TaskType
  processor: (task: Task) => Promise<TaskResult>
  retryable: boolean
  timeout?: number
}

export interface TaskResult {
  success: boolean
  data?: any
  error?: string
  retryable?: boolean
  nextTask?: Task
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
  averageProcessingTime: number
  successRate: number
}

export interface TaskFilter {
  type?: TaskType
  status?: TaskStatus
  priority?: TaskPriority
  createdAfter?: string
  createdBefore?: string
  limit?: number
  offset?: number
}

export interface TaskSchedule {
  task: Omit<Task, 'id' | 'createdAt' | 'status'>
  scheduleFor: string
  recurring?: {
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly'
    until?: string
  }
}

export interface DeadLetterTask extends Task {
  originalTaskId: string
  failureReason: string
  failureCount: number
  lastAttemptAt: string
}
