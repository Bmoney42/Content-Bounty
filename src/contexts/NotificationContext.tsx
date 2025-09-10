/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { CelebrationData } from '../types/notification'

interface NotificationContextType {
  showCelebration: (data: CelebrationData) => void
  hideCelebration: () => void
  celebrationData: CelebrationData | null
  isCelebrationVisible: boolean
  // Expose the full notification system
  notifications: ReturnType<typeof useNotifications>
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Moved useNotification to utils/notificationUtils.ts to avoid fast refresh issues

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notifications = useNotifications()

  const showCelebration = (data: CelebrationData) => {
    notifications.triggerCelebration(data)
  }

  const hideCelebration = () => {
    notifications.dismissCelebration()
  }

  return (
    <NotificationContext.Provider
      value={{
        showCelebration,
        hideCelebration,
        celebrationData: notifications.celebrationData,
        isCelebrationVisible: notifications.showCelebration,
        notifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
