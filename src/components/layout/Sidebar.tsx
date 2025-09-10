import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useConnectAccount } from '../../hooks/useConnectAccount'
import { useSubscription } from '../../hooks/useSubscription'
import { firebaseDB } from '../../services/firebase'
import { 
  Home, 
  Target, 
  User, 
  BarChart3, 
  Settings, 
  Plus,
  Users,
  Briefcase,
  Crown,
  CreditCard
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const { canReceivePayments } = useConnectAccount()
  const { isPremium } = useSubscription()
  const [unreadApplications, setUnreadApplications] = useState(0)

  // Check for application status updates for creators
  useEffect(() => {
    const checkApplicationUpdates = async () => {
      if (user?.userType === 'creator' && user.id) {
        try {
          const applications = await firebaseDB.getCreatorApplications(user.id)
          // Count applications that have been reviewed recently (within last 7 days)
          const recentUpdates = applications.filter(app => {
            if (!app.reviewedAt || app.status === 'pending') return false
            const reviewDate = new Date(app.reviewedAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return reviewDate > weekAgo
          })
          setUnreadApplications(recentUpdates.length)
        } catch (error) {
          console.error('Error checking application updates:', error)
        }
      }
    }

    checkApplicationUpdates()
    // Check every 5 minutes for updates
    const interval = setInterval(checkApplicationUpdates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  const creatorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Creator Pipeline', href: '/creator-pipeline', icon: Briefcase, hasNotification: unreadApplications > 0, notificationCount: unreadApplications },
    { name: 'Banking Setup', href: '/creator-banking', icon: CreditCard, hasNotification: user?.userType === 'creator' && !canReceivePayments },
    ...(isPremium ? [] : [{ name: 'Upgrade', href: '/upgrade', icon: Crown }]),
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const businessNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Bounties', href: '/bounties', icon: Target },
    { name: 'Find Creators', href: '/creators', icon: Users },
    ...(isPremium ? [] : [{ name: 'Upgrade', href: '/upgrade', icon: Crown }]),
    { name: 'Company Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const navigation = user?.userType === 'creator' ? creatorNavigation : businessNavigation


  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 p-6 
      transform transition-transform duration-300 ease-in-out lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Action Buttons */}
      <div className="space-y-3 mb-8">
        {user?.userType === 'creator' ? (
          <Link
            to="/bounties"
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Find New Bounties</span>
          </Link>
        ) : (
          <Link
            to="/bounties/new"
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Bounty</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Navigation
        </h3>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => {
                if (item.name === 'My Applications') {
                  setUnreadApplications(0)
                }
                onClose()
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}

export default Sidebar