import React from 'react'
import { Search, LogOut, User, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationCenter from '../ui/NotificationCenter'

interface HeaderProps {
  onToggleSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button & Logo */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden transition-colors duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Creator Bounty</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">CB</span>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bounties, creators..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu - Responsive */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.userType}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header