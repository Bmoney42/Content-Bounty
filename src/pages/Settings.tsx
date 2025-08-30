import React, { useState } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Palette,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    bountyUpdates: true,
    newBounties: true,
    payments: true
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEarnings: true,
    allowMessages: true
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handlePrivacyChange = (key: string, value: string | boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Settings</h1>
          <p className="text-gray-300 text-lg">Manage your account preferences and privacy</p>
        </div>

        <div className="space-y-8">
          {/* Account Settings */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Account Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Brandon Duff"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Email</label>
                  <input
                    type="email"
                    defaultValue="brandon@contentbounty.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200 pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white">Email Notifications</h3>
                  <p className="text-gray-300 text-sm">Receive updates via email</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    notifications.email ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white">Push Notifications</h3>
                  <p className="text-gray-300 text-sm">Receive browser notifications</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('push')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    notifications.push ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white">Bounty Updates</h3>
                  <p className="text-gray-300 text-sm">Get notified about bounty status changes</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('bountyUpdates')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    notifications.bountyUpdates ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    notifications.bountyUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Privacy</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Profile Visibility</label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="public" className="bg-gray-800 text-white">Public</option>
                  <option value="private" className="bg-gray-800 text-white">Private</option>
                  <option value="friends" className="bg-gray-800 text-white">Friends Only</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white">Show Earnings</h3>
                  <p className="text-gray-300 text-sm">Display your earnings on your profile</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showEarnings', !privacy.showEarnings)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    privacy.showEarnings ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    privacy.showEarnings ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white">Allow Messages</h3>
                  <p className="text-gray-300 text-sm">Let other users send you messages</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('allowMessages', !privacy.allowMessages)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    privacy.allowMessages ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    privacy.allowMessages ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300">
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
