import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { 
  Home, 
  Target, 
  User, 
  BarChart3, 
  Settings, 
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Briefcase
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Bounties', href: '/bounties', icon: Target },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const stats = [
    { label: 'Active Bounties', value: '12', icon: Target, color: 'text-blue-600' },
    { label: 'Total Earned', value: '$2,450', icon: DollarSign, color: 'text-green-600' },
    { label: 'Followers', value: '1.2K', icon: Users, color: 'text-purple-600' },
    { label: 'Growth', value: '+23%', icon: TrendingUp, color: 'text-orange-600' },
  ]

  return (
    <aside className="w-80 bg-white border-r border-gray-200 p-6">
      {/* Action Buttons */}
      <div className="space-y-3 mb-8">
        {user?.userType === 'creator' ? (
          <>
            <Link
              to="/bounties"
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Browse Bounties</span>
            </Link>
            <Link
              to="/profile"
              className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/bounties/new"
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Bounty</span>
            </Link>
            <Link
              to="/bounties"
              className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>My Bounties</span>
            </Link>
            <Link
              to="/analytics"
              className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
          </>
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
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Platform Stats */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {user?.userType === 'creator' ? 'Your Stats' : 'Platform Stats'}
        </h3>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-sm text-gray-600">{stat.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar