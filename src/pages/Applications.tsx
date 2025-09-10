import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB } from '../services/firebase'
import { BountyApplication } from '../types/bounty'
import { User, Clock, CheckCircle, XCircle, MessageSquare, Calendar } from 'lucide-react'

const Applications: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBounty, setSelectedBounty] = useState<string>('all')

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || user.userType !== 'business') return

      try {
        setLoading(true)
        // Get all bounties created by this business user
        const userBounties = await firebaseDB.getBountiesByUser(user.id)
        
        // Get applications for all their bounties
        const allApplications: BountyApplication[] = []
        for (const bounty of userBounties) {
          const bountyApps = await firebaseDB.getBountyApplications(bounty.id)
          // Add bounty title to each application for display
          const appsWithBountyInfo = bountyApps.map(app => ({
            ...app,
            bountyTitle: bounty.title
          }))
          allApplications.push(...appsWithBountyInfo)
        }
        
        // Sort by most recent first
        allApplications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        setApplications(allApplications)
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [user])

  const handleApplicationAction = async (applicationId: string, action: 'accepted' | 'rejected') => {
    try {
      await firebaseDB.updateApplicationStatus(applicationId, action)
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: action, reviewedAt: new Date().toISOString() }
            : app
        )
      )
      
      alert(`Application ${action} successfully!`)
    } catch (error) {
      console.error(`Error ${action} application:`, error)
      alert(`Failed to ${action.slice(0, -2)} application. Please try again.`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const filteredApplications = selectedBounty === 'all' 
    ? applications 
    : applications.filter(app => app.bountyId === selectedBounty)

  const uniqueBounties = Array.from(new Set(applications.map(app => app.bountyId)))
    .map(bountyId => {
      const app = applications.find(a => a.bountyId === bountyId)
      return { id: bountyId, title: app?.bountyTitle || 'Unknown Bounty' }
    })

  if (user?.userType !== 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">Only business users can view applications.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-white text-xl">Loading applications...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Applications</h1>
          <p className="text-gray-300 text-lg">
            Review and manage applications for your bounties
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-white mb-3">Filter by Bounty</label>
            <select
              value={selectedBounty}
              onChange={(e) => setSelectedBounty(e.target.value)}
              className="w-full md:w-auto px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all" className="bg-gray-800">All Bounties ({applications.length})</option>
              {uniqueBounties.map(bounty => (
                <option key={bounty.id} value={bounty.id} className="bg-gray-800">
                  {bounty.title} ({applications.filter(app => app.bountyId === bounty.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applications */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-white/40 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">No Applications Yet</h3>
            <p className="text-white/60">
              When creators apply to your bounties, you'll see their applications here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div 
                key={application.id} 
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">{application.creatorName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(application.status)} flex items-center space-x-1`}>
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </span>
                    </div>
                    <p className="text-blue-300 font-medium mb-4">Applied to: {application.bountyTitle}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </h4>
                        <p className="text-gray-300 text-sm bg-white/5 p-4 rounded-xl">
                          {application.message}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Proposed Timeline</span>
                        </h4>
                        <p className="text-gray-300 text-sm bg-white/5 p-4 rounded-xl">
                          {application.proposedTimeline}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      Applied: {new Date(application.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {application.reviewedAt && (
                        <span className="ml-4">
                          Reviewed: {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {application.status === 'pending' && (
                  <div className="flex space-x-4 pt-6 border-t border-white/20">
                    <button
                      onClick={() => handleApplicationAction(application.id, 'accepted')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleApplicationAction(application.id, 'rejected')}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Applications