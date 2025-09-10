import React from 'react'
import { useAuth } from '../hooks/useAuth'
import CreatorDashboard from '../components/dashboard/CreatorDashboard'
import BusinessDashboard from '../components/dashboard/BusinessDashboard'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-300 text-lg">
            {user.userType === 'creator' 
              ? 'Track your earnings and content performance' 
              : 'Monitor your bounties and platform performance'
            }
          </p>
        </div>

        {user.userType === 'creator' ? (
          <CreatorDashboard />
        ) : (
          <BusinessDashboard />
        )}
      </div>
    </div>
  )
}

export default Dashboard