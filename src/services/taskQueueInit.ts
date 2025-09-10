import { TaskQueueService } from './taskQueue'
import { 
  EscrowReleaseProcessor,
  NotificationProcessor,
  AnalyticsProcessor,
  ContentVerificationProcessor,
  DisputeNotificationProcessor,
  PaymentRetryProcessor,
  EmailProcessor,
  WebhookRetryProcessor,
  UserCleanupProcessor,
  AuditCleanupProcessor
} from './taskProcessors'

/**
 * Initialize the task queue system with all processors
 */
export class TaskQueueInitializer {
  /**
   * Initialize all task processors
   */
  static async initialize(): Promise<void> {
    console.log('🚀 Initializing task queue system...')

    try {
      // Register all task processors
      TaskQueueService.registerProcessor({
        type: 'escrow_release',
        processor: EscrowReleaseProcessor.process,
        retryable: true,
        timeout: 60000 // 60 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'notification_send',
        processor: NotificationProcessor.process,
        retryable: true,
        timeout: 30000 // 30 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'analytics_process',
        processor: AnalyticsProcessor.process,
        retryable: true,
        timeout: 30000 // 30 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'content_verification',
        processor: ContentVerificationProcessor.process,
        retryable: true,
        timeout: 120000 // 2 minutes
      })

      TaskQueueService.registerProcessor({
        type: 'dispute_notification',
        processor: DisputeNotificationProcessor.process,
        retryable: true,
        timeout: 30000 // 30 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'payment_retry',
        processor: PaymentRetryProcessor.process,
        retryable: true,
        timeout: 60000 // 60 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'email_send',
        processor: EmailProcessor.process,
        retryable: true,
        timeout: 30000 // 30 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'webhook_retry',
        processor: WebhookRetryProcessor.process,
        retryable: true,
        timeout: 30000 // 30 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'user_cleanup',
        processor: UserCleanupProcessor.process,
        retryable: true,
        timeout: 60000 // 60 seconds
      })

      TaskQueueService.registerProcessor({
        type: 'audit_cleanup',
        processor: AuditCleanupProcessor.process,
        retryable: true,
        timeout: 120000 // 2 minutes
      })

      console.log('✅ All task processors registered successfully')

      // Start the task processor
      await TaskQueueService.startProcessor()
      console.log('✅ Task queue processor started')

      // Schedule recurring tasks
      await this.scheduleRecurringTasks()
      console.log('✅ Recurring tasks scheduled')

    } catch (error) {
      console.error('❌ Failed to initialize task queue system:', error)
      throw error
    }
  }

  /**
   * Schedule recurring maintenance tasks
   */
  private static async scheduleRecurringTasks(): Promise<void> {
    try {
      // Schedule daily audit cleanup
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(2, 0, 0, 0) // 2 AM

      await TaskQueueService.scheduleRecurringTask({
        task: {
          type: 'audit_cleanup',
          priority: 'low',
          payload: { retentionDays: 90 },
          attempts: 0,
          maxAttempts: 2,
          metadata: { recurring: true }
        },
        scheduleFor: tomorrow.toISOString(),
        recurring: {
          interval: 'daily',
          until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        }
      })

      // Schedule weekly user cleanup
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      nextWeek.setHours(3, 0, 0, 0) // 3 AM

      await TaskQueueService.scheduleRecurringTask({
        task: {
          type: 'user_cleanup',
          priority: 'low',
          payload: { cleanupType: 'inactive_users' },
          attempts: 0,
          maxAttempts: 2,
          metadata: { recurring: true }
        },
        scheduleFor: nextWeek.toISOString(),
        recurring: {
          interval: 'weekly',
          until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        }
      })

      console.log('✅ Recurring tasks scheduled successfully')

    } catch (error) {
      console.error('❌ Failed to schedule recurring tasks:', error)
      throw error
    }
  }

  /**
   * Stop the task queue system
   */
  static async shutdown(): Promise<void> {
    console.log('🛑 Shutting down task queue system...')
    
    try {
      TaskQueueService.stopProcessor()
      console.log('✅ Task queue system shut down successfully')
    } catch (error) {
      console.error('❌ Error shutting down task queue system:', error)
      throw error
    }
  }

  /**
   * Get task queue status
   */
  static async getStatus(): Promise<{
    isRunning: boolean
    stats: any
    processors: string[]
  }> {
    try {
      const stats = await TaskQueueService.getQueueStats()
      const processors = [
        'escrow_release',
        'notification_send',
        'analytics_process',
        'content_verification',
        'dispute_notification',
        'payment_retry',
        'email_send',
        'webhook_retry',
        'user_cleanup',
        'audit_cleanup'
      ]

      return {
        isRunning: true, // This would be tracked by the service
        stats,
        processors
      }
    } catch (error) {
      console.error('❌ Error getting task queue status:', error)
      return {
        isRunning: false,
        stats: null,
        processors: []
      }
    }
  }
}

/**
 * Utility functions for common task operations
 */
export class TaskQueueUtils {
  /**
   * Queue escrow release task
   */
  static async queueEscrowRelease(
    escrowPaymentId: string,
    creatorId: string,
    creatorEmail: string,
    connectAccountId?: string,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'escrow_release',
      {
        escrowPaymentId,
        creatorId,
        creatorEmail,
        connectAccountId
      },
      priority
    )
  }

  /**
   * Queue notification task
   */
  static async queueNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'notification_send',
      {
        userId,
        type,
        title,
        message,
        data
      },
      priority
    )
  }

  /**
   * Queue analytics processing task
   */
  static async queueAnalytics(
    eventType: string,
    userId: string,
    data: any,
    priority: 'low' | 'normal' | 'high' = 'low'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'analytics_process',
      {
        eventType,
        userId,
        data,
        timestamp: new Date().toISOString()
      },
      priority
    )
  }

  /**
   * Queue content verification task
   */
  static async queueContentVerification(
    submissionId: string,
    bountyId: string,
    creatorId: string,
    contentLinks: string[],
    priority: 'normal' | 'high' = 'normal'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'content_verification',
      {
        submissionId,
        bountyId,
        creatorId,
        contentLinks
      },
      priority
    )
  }

  /**
   * Queue dispute notification task
   */
  static async queueDisputeNotification(
    disputeId: string,
    notificationType: string,
    recipientId: string,
    priority: 'high' | 'urgent' = 'high'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'dispute_notification',
      {
        disputeId,
        notificationType,
        recipientId
      },
      priority
    )
  }

  /**
   * Queue payment retry task
   */
  static async queuePaymentRetry(
    paymentId: string,
    retryReason: string,
    priority: 'high' | 'urgent' = 'high'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'payment_retry',
      {
        paymentId,
        retryReason
      },
      priority
    )
  }

  /**
   * Queue email send task
   */
  static async queueEmail(
    to: string,
    subject: string,
    template: string,
    data: any,
    priority: 'normal' | 'high' = 'normal'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'email_send',
      {
        to,
        subject,
        template,
        data
      },
      priority
    )
  }

  /**
   * Queue webhook retry task
   */
  static async queueWebhookRetry(
    webhookUrl: string,
    payload: any,
    headers: any,
    eventType: string,
    priority: 'normal' | 'high' = 'normal'
  ): Promise<string> {
    return TaskQueueService.addTask(
      'webhook_retry',
      {
        webhookUrl,
        payload,
        headers,
        eventType
      },
      priority
    )
  }
}
