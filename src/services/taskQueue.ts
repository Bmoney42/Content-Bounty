import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuditLogger } from './auditLogger'
import { 
  Task, 
  TaskType, 
  TaskPriority, 
  TaskStatus, 
  TaskQueueConfig, 
  TaskProcessor, 
  TaskResult, 
  QueueStats, 
  TaskFilter,
  TaskSchedule,
  DeadLetterTask
} from '../types/taskQueue'

export class TaskQueueService {
  private static readonly COLLECTION = 'task_queue'
  private static readonly DEAD_LETTER_COLLECTION = 'dead_letter_queue'
  private static readonly CONFIG_COLLECTION = 'task_queue_config'
  
  private static readonly DEFAULT_CONFIG: TaskQueueConfig = {
    concurrency: 5,
    retryDelay: 5000,
    maxRetries: 3,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    deadLetterQueue: true
  }

  private static processors: Map<TaskType, TaskProcessor> = new Map()
  private static isProcessing = false
  private static processingInterval: NodeJS.Timeout | null = null

  /**
   * Register a task processor
   */
  static registerProcessor(processor: TaskProcessor): void {
    this.processors.set(processor.type, processor)
    console.log(`✅ Registered processor for task type: ${processor.type}`)
  }

  /**
   * Add a task to the queue
   */
  static async addTask(
    type: TaskType,
    payload: any,
    priority: TaskPriority = 'normal',
    scheduledFor?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const taskId = this.generateTaskId()
    
    const task: Omit<Task, 'id'> = {
      type,
      priority,
      status: scheduledFor ? 'scheduled' : 'pending',
      payload,
      attempts: 0,
      maxAttempts: this.getMaxAttempts(type),
      createdAt: new Date().toISOString(),
      scheduledFor,
      metadata
    }

    try {
      const docRef = doc(db, this.COLLECTION, taskId)
      await setDoc(docRef, {
        ...task,
        createdAt: serverTimestamp()
      })

      // Log task creation
      await AuditLogger.logEvent(
        'system',
        'task_created',
        'task_queue',
        taskId,
        undefined,
        task,
        { type, priority }
      )

      console.log(`✅ Task added to queue: ${type} (${taskId})`)
      return taskId
    } catch (error) {
      console.error('❌ Failed to add task to queue:', error)
      throw error
    }
  }

  /**
   * Schedule a recurring task
   */
  static async scheduleRecurringTask(schedule: TaskSchedule): Promise<string> {
    const taskId = this.generateTaskId()
    
    const task: Omit<Task, 'id'> = {
      ...schedule.task,
      status: 'scheduled',
      attempts: 0,
      maxAttempts: this.getMaxAttempts(schedule.task.type),
      createdAt: new Date().toISOString(),
      scheduledFor: schedule.scheduleFor,
      metadata: {
        ...schedule.task.metadata,
        recurring: schedule.recurring
      }
    }

    try {
      const docRef = doc(db, this.COLLECTION, taskId)
      await setDoc(docRef, {
        ...task,
        createdAt: serverTimestamp()
      })

      console.log(`✅ Recurring task scheduled: ${schedule.task.type} (${taskId})`)
      return taskId
    } catch (error) {
      console.error('❌ Failed to schedule recurring task:', error)
      throw error
    }
  }

  /**
   * Start the task processor
   */
  static async startProcessor(): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️ Task processor is already running')
      return
    }

    this.isProcessing = true
    console.log('🚀 Starting task queue processor...')

    // Process tasks every 5 seconds
    this.processingInterval = setInterval(async () => {
      try {
        await this.processTasks()
      } catch (error) {
        console.error('❌ Error in task processor:', error)
      }
    }, 5000)

    // Cleanup old tasks every hour
    setInterval(async () => {
      try {
        await this.cleanupOldTasks()
      } catch (error) {
        console.error('❌ Error in task cleanup:', error)
      }
    }, 60 * 60 * 1000)
  }

  /**
   * Stop the task processor
   */
  static stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log('🛑 Task queue processor stopped')
  }

  /**
   * Process pending tasks
   */
  private static async processTasks(): Promise<void> {
    const config = await this.getConfig()
    const pendingTasks = await this.getPendingTasks(config.concurrency)

    if (pendingTasks.length === 0) {
      return
    }

    console.log(`🔄 Processing ${pendingTasks.length} tasks...`)

    // Process tasks in parallel (up to concurrency limit)
    const processingPromises = pendingTasks.map(task => this.processTask(task))
    await Promise.allSettled(processingPromises)
  }

  /**
   * Process a single task
   */
  private static async processTask(task: Task): Promise<void> {
    const processor = this.processors.get(task.type)
    
    if (!processor) {
      console.error(`❌ No processor found for task type: ${task.type}`)
      await this.markTaskFailed(task.id, `No processor found for type: ${task.type}`)
      return
    }

    try {
      // Mark task as processing
      await this.updateTaskStatus(task.id, 'processing', {
        startedAt: new Date().toISOString()
      })

      // Process the task with timeout
      const timeout = processor.timeout || 30000 // 30 seconds default
      const result = await this.withTimeout(
        processor.processor(task),
        timeout
      )

      if (result.success) {
        await this.markTaskCompleted(task.id, result.data)
        console.log(`✅ Task completed: ${task.type} (${task.id})`)
      } else {
        await this.handleTaskFailure(task, result.error || 'Unknown error', result.retryable)
      }

    } catch (error: any) {
      console.error(`❌ Task processing error: ${task.type} (${task.id})`, error)
      await this.handleTaskFailure(task, error.message, true)
    }
  }

  /**
   * Handle task failure
   */
  private static async handleTaskFailure(
    task: Task, 
    error: string, 
    retryable: boolean = true
  ): Promise<void> {
    const newAttempts = task.attempts + 1
    const processor = this.processors.get(task.type)
    
    if (retryable && newAttempts < task.maxAttempts && processor?.retryable) {
      // Retry the task
      const retryDelay = this.calculateRetryDelay(newAttempts)
      const scheduledFor = new Date(Date.now() + retryDelay).toISOString()
      
      await this.updateTaskStatus(task.id, 'scheduled', {
        attempts: newAttempts,
        scheduledFor,
        error: undefined
      })

      console.log(`🔄 Task scheduled for retry: ${task.type} (${task.id}) - attempt ${newAttempts}/${task.maxAttempts}`)
    } else {
      // Move to dead letter queue or mark as failed
      await this.markTaskFailed(task.id, error)
      
      if (this.DEFAULT_CONFIG.deadLetterQueue) {
        await this.moveToDeadLetterQueue(task, error)
      }
    }
  }

  /**
   * Get pending tasks
   */
  private static async getPendingTasks(limitCount: number): Promise<Task[]> {
    try {
      const now = new Date().toISOString()
      
      // Get pending tasks
      const pendingQuery = query(
        collection(db, this.COLLECTION),
        where('status', '==', 'pending'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      )
      
      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingTasks = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[]

      // Get scheduled tasks that are ready
      const scheduledQuery = query(
        collection(db, this.COLLECTION),
        where('status', '==', 'scheduled'),
        where('scheduledFor', '<=', now),
        orderBy('scheduledFor', 'asc'),
        limit(limitCount - pendingTasks.length)
      )
      
      const scheduledSnapshot = await getDocs(scheduledQuery)
      const scheduledTasks = scheduledSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[]

      return [...pendingTasks, ...scheduledTasks].slice(0, limitCount)
    } catch (error) {
      console.error('❌ Error getting pending tasks:', error)
      return []
    }
  }

  /**
   * Update task status
   */
  private static async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    updates: any = {}
  ): Promise<void> {
    try {
      const taskRef = doc(db, this.COLLECTION, taskId)
      await updateDoc(taskRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('❌ Error updating task status:', error)
      throw error
    }
  }

  /**
   * Mark task as completed
   */
  private static async markTaskCompleted(taskId: string, result?: any): Promise<void> {
    await this.updateTaskStatus(taskId, 'completed', {
      completedAt: new Date().toISOString(),
      result
    })
  }

  /**
   * Mark task as failed
   */
  private static async markTaskFailed(taskId: string, error: string): Promise<void> {
    await this.updateTaskStatus(taskId, 'failed', {
      failedAt: new Date().toISOString(),
      error
    })
  }

  /**
   * Move task to dead letter queue
   */
  private static async moveToDeadLetterQueue(task: Task, error: string): Promise<void> {
    try {
      const deadLetterTask: DeadLetterTask = {
        ...task,
        originalTaskId: task.id,
        failureReason: error,
        failureCount: task.attempts,
        lastAttemptAt: new Date().toISOString()
      }

      const docRef = doc(db, this.DEAD_LETTER_COLLECTION, task.id)
      await setDoc(docRef, {
        ...deadLetterTask,
        createdAt: serverTimestamp()
      })

      // Delete from main queue
      await deleteDoc(doc(db, this.COLLECTION, task.id))

      console.log(`💀 Task moved to dead letter queue: ${task.type} (${task.id})`)
    } catch (error) {
      console.error('❌ Error moving task to dead letter queue:', error)
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<QueueStats> {
    try {
      const [pending, processing, completed, failed] = await Promise.all([
        this.getTaskCount('pending'),
        this.getTaskCount('processing'),
        this.getTaskCount('completed'),
        this.getTaskCount('failed')
      ])

      const total = pending + processing + completed + failed
      const successRate = total > 0 ? (completed / total) * 100 : 0

      return {
        pending,
        processing,
        completed,
        failed,
        total,
        averageProcessingTime: 0, // TODO: Calculate from completed tasks
        successRate
      }
    } catch (error) {
      console.error('❌ Error getting queue stats:', error)
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
        averageProcessingTime: 0,
        successRate: 0
      }
    }
  }

  /**
   * Get task count by status
   */
  private static async getTaskCount(status: TaskStatus): Promise<number> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', status)
      )
      const snapshot = await getDocs(q)
      return snapshot.size
    } catch (error) {
      console.error(`❌ Error getting task count for ${status}:`, error)
      return 0
    }
  }

  /**
   * Cleanup old completed tasks
   */
  private static async cleanupOldTasks(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.DEFAULT_CONFIG.cleanupInterval)
      const cutoffString = cutoffDate.toISOString()

      const q = query(
        collection(db, this.COLLECTION),
        where('status', 'in', ['completed', 'failed']),
        where('completedAt', '<', cutoffString)
      )

      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return
      }

      const batch = writeBatch(db)
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      await batch.commit()
      console.log(`🧹 Cleaned up ${snapshot.size} old tasks`)
    } catch (error) {
      console.error('❌ Error cleaning up old tasks:', error)
    }
  }

  /**
   * Get queue configuration
   */
  private static async getConfig(): Promise<TaskQueueConfig> {
    try {
      const configRef = doc(db, this.CONFIG_COLLECTION, 'default')
      const configSnap = await getDoc(configRef)
      
      if (configSnap.exists()) {
        return { ...this.DEFAULT_CONFIG, ...configSnap.data() } as TaskQueueConfig
      }
      
      return this.DEFAULT_CONFIG
    } catch (error) {
      console.error('❌ Error getting queue config:', error)
      return this.DEFAULT_CONFIG
    }
  }

  /**
   * Get max attempts for task type
   */
  private static getMaxAttempts(type: TaskType): number {
    const attemptsMap: Record<TaskType, number> = {
      'escrow_release': 5,
      'notification_send': 3,
      'analytics_process': 2,
      'content_verification': 3,
      'dispute_notification': 3,
      'payment_retry': 5,
      'user_cleanup': 2,
      'audit_cleanup': 2,
      'email_send': 3,
      'webhook_retry': 5
    }
    
    return attemptsMap[type] || 3
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private static calculateRetryDelay(attempt: number): number {
    const baseDelay = 5000 // 5 seconds
    const maxDelay = 300000 // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
    return delay
  }

  /**
   * Generate unique task ID
   */
  private static generateTaskId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `task_${timestamp}_${random}`
  }

  /**
   * Execute function with timeout
   */
  private static async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }
}
