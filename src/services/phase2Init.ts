import { TaskQueueInitializer } from './taskQueueInit'
import { ErrorMonitoringService } from './errorMonitoring'
import { AuditLogger } from './auditLogger'

/**
 * Phase 2 Initialization Service
 * Sets up task queuing, error monitoring, and other reliability improvements
 */
export class Phase2Initializer {
  private static isInitialized = false

  /**
   * Initialize all Phase 2 services
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Phase 2 services already initialized')
      return
    }

    console.log('🚀 Initializing Phase 2 services...')

    try {
      // Initialize error monitoring
      await this.initializeErrorMonitoring()

      // Initialize task queue system
      await this.initializeTaskQueue()

      // Log successful initialization
      await AuditLogger.logEvent(
        'system',
        'phase2_initialized',
        'system',
        'initialization',
        undefined,
        {
          timestamp: new Date().toISOString(),
          services: ['error_monitoring', 'task_queue']
        },
        { phase: 2 }
      )

      this.isInitialized = true
      console.log('✅ Phase 2 services initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize Phase 2 services:', error)
      throw error
    }
  }

  /**
   * Initialize error monitoring
   */
  private static async initializeErrorMonitoring(): Promise<void> {
    try {
      console.log('🔍 Initializing error monitoring...')

      const sentryConfig = {
        dsn: process.env.VITE_SENTRY_DSN || '',
        environment: process.env.NODE_ENV || 'development',
        release: process.env.VITE_APP_VERSION || '1.0.0',
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
      }

      if (sentryConfig.dsn) {
        await ErrorMonitoringService.initialize(sentryConfig)
        console.log('✅ Error monitoring initialized with Sentry')
      } else {
        console.log('⚠️ Sentry DSN not configured, using fallback error monitoring')
        // Initialize with fallback configuration
        await ErrorMonitoringService.initialize({
          ...sentryConfig,
          dsn: 'fallback'
        })
      }

    } catch (error) {
      console.error('❌ Failed to initialize error monitoring:', error)
      throw error
    }
  }

  /**
   * Initialize task queue system
   */
  private static async initializeTaskQueue(): Promise<void> {
    try {
      console.log('📋 Initializing task queue system...')

      await TaskQueueInitializer.initialize()
      console.log('✅ Task queue system initialized')

    } catch (error) {
      console.error('❌ Failed to initialize task queue system:', error)
      throw error
    }
  }

  /**
   * Shutdown Phase 2 services
   */
  static async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('⚠️ Phase 2 services not initialized')
      return
    }

    console.log('🛑 Shutting down Phase 2 services...')

    try {
      // Shutdown task queue
      await TaskQueueInitializer.shutdown()

      // Log shutdown
      await AuditLogger.logEvent(
        'system',
        'phase2_shutdown',
        'system',
        'shutdown',
        undefined,
        {
          timestamp: new Date().toISOString()
        },
        { phase: 2 }
      )

      this.isInitialized = false
      console.log('✅ Phase 2 services shut down successfully')

    } catch (error) {
      console.error('❌ Error shutting down Phase 2 services:', error)
      throw error
    }
  }

  /**
   * Get Phase 2 services status
   */
  static async getStatus(): Promise<{
    isInitialized: boolean
    errorMonitoring: any
    taskQueue: any
  }> {
    try {
      const errorMonitoringStatus = ErrorMonitoringService.getStatus()
      const taskQueueStatus = await TaskQueueInitializer.getStatus()

      return {
        isInitialized: this.isInitialized,
        errorMonitoring: errorMonitoringStatus,
        taskQueue: taskQueueStatus
      }
    } catch (error) {
      console.error('❌ Error getting Phase 2 status:', error)
      return {
        isInitialized: false,
        errorMonitoring: null,
        taskQueue: null
      }
    }
  }

  /**
   * Health check for Phase 2 services
   */
  static async healthCheck(): Promise<{
    healthy: boolean
    services: Record<string, boolean>
    errors: string[]
  }> {
    const services: Record<string, boolean> = {}
    const errors: string[] = []

    try {
      // Check error monitoring
      const errorMonitoringStatus = ErrorMonitoringService.getStatus()
      services.errorMonitoring = errorMonitoringStatus.isInitialized
      if (!errorMonitoringStatus.isInitialized) {
        errors.push('Error monitoring not initialized')
      }

      // Check task queue
      const taskQueueStatus = await TaskQueueInitializer.getStatus()
      services.taskQueue = taskQueueStatus.isRunning
      if (!taskQueueStatus.isRunning) {
        errors.push('Task queue not running')
      }

      const healthy = Object.values(services).every(status => status === true)

      return {
        healthy,
        services,
        errors
      }
    } catch (error: any) {
      errors.push(`Health check failed: ${error.message}`)
      return {
        healthy: false,
        services,
        errors
      }
    }
  }
}

/**
 * Utility functions for Phase 2 services
 */
export class Phase2Utils {
  /**
   * Wrap a function with error monitoring and performance tracking
   */
  static async withMonitoring<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: {
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    }
  ): Promise<T> {
    const transaction = ErrorMonitoringService.startTransaction(
      operation,
      'function_call',
      context
    )

    try {
      const result = await fn()
      await transaction.finish('ok')
      return result
    } catch (error: any) {
      await transaction.finish('internal_error')
      await ErrorMonitoringService.captureError(error, {
        userId: context?.userId,
        sessionId: context?.sessionId,
        operation,
        metadata: context?.metadata
      })
      throw error
    }
  }

  /**
   * Queue a task with error monitoring
   */
  static async queueTaskWithMonitoring(
    taskType: string,
    payload: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    context?: {
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    }
  ): Promise<string> {
    return this.withMonitoring(
      `queue_task_${taskType}`,
      async () => {
        const { TaskQueueUtils } = await import('./taskQueueInit')
        
        // Map task type to appropriate queue function
        switch (taskType) {
          case 'escrow_release':
            return TaskQueueUtils.queueEscrowRelease(
              payload.escrowPaymentId,
              payload.creatorId,
              payload.creatorEmail,
              payload.connectAccountId,
              priority
            )
          case 'notification':
            return TaskQueueUtils.queueNotification(
              payload.userId,
              payload.type,
              payload.title,
              payload.message,
              payload.data,
              priority
            )
          case 'analytics':
            return TaskQueueUtils.queueAnalytics(
              payload.eventType,
              payload.userId,
              payload.data,
              priority
            )
          case 'content_verification':
            return TaskQueueUtils.queueContentVerification(
              payload.submissionId,
              payload.bountyId,
              payload.creatorId,
              payload.contentLinks,
              priority
            )
          case 'dispute_notification':
            return TaskQueueUtils.queueDisputeNotification(
              payload.disputeId,
              payload.notificationType,
              payload.recipientId,
              priority
            )
          case 'payment_retry':
            return TaskQueueUtils.queuePaymentRetry(
              payload.paymentId,
              payload.retryReason,
              priority
            )
          case 'email':
            return TaskQueueUtils.queueEmail(
              payload.to,
              payload.subject,
              payload.template,
              payload.data,
              priority
            )
          case 'webhook_retry':
            return TaskQueueUtils.queueWebhookRetry(
              payload.webhookUrl,
              payload.payload,
              payload.headers,
              payload.eventType,
              priority
            )
          default:
            throw new Error(`Unknown task type: ${taskType}`)
        }
      },
      context
    )
  }

  /**
   * Capture performance metric
   */
  static async captureMetric(
    name: string,
    value: number,
    unit: 'millisecond' | 'byte' | 'count' = 'count',
    tags?: Record<string, string>
  ): Promise<void> {
    try {
      await ErrorMonitoringService.captureMetric({
        name,
        value,
        unit,
        tags,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Failed to capture metric:', error)
    }
  }

  /**
   * Add breadcrumb with error monitoring
   */
  static async addBreadcrumb(
    message: string,
    category: string,
    level: 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await ErrorMonitoringService.addBreadcrumb(message, category, level, data)
    } catch (error) {
      console.error('❌ Failed to add breadcrumb:', error)
    }
  }
}
