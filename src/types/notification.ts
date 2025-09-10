export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'celebration'

export type NotificationCategory =
  | 'application'
  | 'submission' 
  | 'payment'
  | 'bounty'
  | 'system'
  | 'celebration'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  timestamp: number
  read: boolean
  actionUrl?: string
  actionLabel?: string
  data?: Record<string, any>
}

export interface CelebrationData {
  bountyTitle: string
  paymentAmount: number
  creatorName: string
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  celebrationData: CelebrationData | null
  showCelebration: boolean
}