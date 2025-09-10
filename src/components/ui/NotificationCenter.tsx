import React, { useState } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, Calendar, DollarSign, FileText, Users } from 'lucide-react'
import { Notification, NotificationCategory } from '../../types/notification'
import { useNotifications } from '../../hooks/useNotifications'

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useNotifications()

  const getNotificationIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'application':
        return <Users className="w-5 h-5" />
      case 'submission':
        return <FileText className="w-5 h-5" />
      case 'payment':
        return <DollarSign className="w-5 h-5" />
      case 'bounty':
        return <Calendar className="w-5 h-5" />
      case 'celebration':
        return <span className="text-lg">🎉</span>
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'celebration':
        return 'text-green-500 bg-green-50'
      case 'error':
        return 'text-red-500 bg-red-50'
      case 'warning':
        return 'text-yellow-500 bg-yellow-50'
      case 'info':
        return 'text-blue-500 bg-blue-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You'll see updates about your bounties and applications here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          {notification.actionLabel && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-600 font-medium">
                                {notification.actionLabel} →
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter