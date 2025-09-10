import { useState, useCallback, useEffect } from 'react'
import { Notification, NotificationType, NotificationCategory, CelebrationData } from '../types/notification'

const NOTIFICATION_STORAGE_KEY = 'creator-bounty-notifications'
const MAX_NOTIFICATIONS = 50

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setNotifications(parsed)
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Error saving notifications to storage:', error)
    }
  }, [notifications])

  const addNotification = useCallback((
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    options?: {
      actionUrl?: string
      actionLabel?: string
      data?: Record<string, any>
    }
  ) => {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      ...options
    }

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS)
      return updated
    })

    return notification.id
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const triggerCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data)
    setShowCelebration(true)

    // Also add a success notification for the celebration
    addNotification(
      'celebration',
      'payment',
      'Payment Approved! 🎉',
      `Your submission for "${data.bountyTitle}" has been approved! You've earned $${data.paymentAmount}.`,
      {
        data: { celebrationData: data }
      }
    )
  }, [addNotification])

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false)
    setCelebrationData(null)
  }, [])

  // Convenience methods for common notification types
  const notifyApplicationSubmitted = useCallback((bountyTitle: string) => {
    addNotification(
      'success',
      'application',
      'Application Submitted',
      `Your application for "${bountyTitle}" has been submitted successfully.`
    )
  }, [addNotification])

  const notifyApplicationApproved = useCallback((bountyTitle: string) => {
    addNotification(
      'success',
      'application',
      'Application Approved! 🎉',
      `Great news! Your application for "${bountyTitle}" has been approved. You can now start working on the content.`
    )
  }, [addNotification])

  const notifyApplicationRejected = useCallback((bountyTitle: string) => {
    addNotification(
      'warning',
      'application',
      'Application Not Selected',
      `Unfortunately, your application for "${bountyTitle}" was not selected this time. Keep applying to other bounties!`
    )
  }, [addNotification])

  const notifySubmissionReceived = useCallback((creatorName: string, bountyTitle: string) => {
    addNotification(
      'info',
      'submission',
      'New Submission Received',
      `${creatorName} has submitted content for "${bountyTitle}". Review it in your dashboard.`
    )
  }, [addNotification])

  const notifySubmissionApproved = useCallback((bountyTitle: string, paymentAmount: number) => {
    addNotification(
      'success',
      'submission',
      'Submission Approved!',
      `Your submission for "${bountyTitle}" has been approved. Payment of $${paymentAmount} is being processed.`
    )
  }, [addNotification])

  const notifySubmissionNeedsChanges = useCallback((bountyTitle: string, feedback?: string) => {
    addNotification(
      'warning',
      'submission',
      'Submission Needs Changes',
      `Your submission for "${bountyTitle}" needs some updates.${feedback ? ` Feedback: ${feedback}` : ''}`,
      {
        actionUrl: '/bounties',
        actionLabel: 'View Details'
      }
    )
  }, [addNotification])

  const notifyNewBounty = useCallback((bountyTitle: string, paymentAmount: number) => {
    addNotification(
      'info',
      'bounty',
      'New Bounty Available',
      `A new bounty "${bountyTitle}" is available for $${paymentAmount}. Check it out!`,
      {
        actionUrl: '/bounties',
        actionLabel: 'View Bounty'
      }
    )
  }, [addNotification])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    celebrationData,
    showCelebration,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    triggerCelebration: triggerCelebration,
    dismissCelebration,
    // Convenience methods
    notifyApplicationSubmitted,
    notifyApplicationApproved,
    notifyApplicationRejected,
    notifySubmissionReceived,
    notifySubmissionApproved,
    notifySubmissionNeedsChanges,
    notifyNewBounty
  }
}