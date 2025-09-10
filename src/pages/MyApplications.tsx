import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB } from '../services/firebase'
import { BountyApplication } from '../types/bounty'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar,
  DollarSign,
  ArrowRight,
  User
} from 'lucide-react'

const MyApplications: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<(BountyApplication & { bountyTitle?: string, bountyAmount?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  useEffect(() => {
    const fetchMyApplications = async () => {
      if (!user || user.userType !== 'creator') return

      try {
        setLoading(true)
        // Get user's applications
        const userApplications = await firebaseDB.getCreatorApplications(user.id)
        
        // Get bounty details for each application
        const applicationsWithBountyInfo = await Promise.all(
          userApplications.map(async (app) => {
            try {
              const bounties = await firebaseDB.getBounties()
              const bounty = bounties.find(b => b.id === app.bountyId)
              return {
                ...app,
                bountyTitle: bounty?.title || 'Unknown Bounty',
                bountyAmount: bounty?.payment?.amount || 0
              }
            } catch (error) {
              console.error('Error fetching bounty details for application:', app.id, error)
              return {
                ...app,
                bountyTitle: 'Unknown Bounty',
                bountyAmount: 0
              }
            }
          })
        )
        
        // Sort by most recent first
        applicationsWithBountyInfo.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        
        setApplications(applicationsWithBountyInfo)
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyApplications()
  }, [user])

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

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  )

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    }
  }

  const statusCounts = getStatusCounts()

  if (user?.userType !== 'creator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">Only creators can view their applications.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Clock className="w-12 h-12 text-white/40 mx-auto mb-4 animate-spin" />
            <div className="text-white text-xl">Loading your applications...</div>
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
          <h1 className="text-4xl font-bold text-white mb-4">My Applications</h1>
          <p className="text-gray-300 text-lg">
            Track the status of all your bounty applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
            <div className="text-gray-300 text-sm">Total Applications</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{statusCounts.pending}</div>
            <div className="text-gray-300 text-sm">Pending Review</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{statusCounts.accepted}</div>
            <div className="text-gray-300 text-sm">Accepted</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{statusCounts.rejected}</div>
            <div className="text-gray-300 text-sm">Rejected</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'all', label: 'All Applications', count: statusCounts.all },
              { key: 'pending', label: 'Pending', count: statusCounts.pending },
              { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
              { key: 'rejected', label: 'Rejected', count: statusCounts.rejected }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">
              {filter === 'all' ? 'No Applications Yet' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`}
            </h3>
            <p className="text-white/60">
              {filter === 'all' 
                ? 'Start applying to bounties to track your application status here.'
                : `You don't have any ${filter} applications at the moment.`
              }
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
                      <h3 className="text-xl font-bold text-white">{application.bountyTitle}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(application.status)} flex items-center space-x-1`}>
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-gray-300 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>${application.bountyAmount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Applied {new Date(application.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                      {application.reviewedAt && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Reviewed {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Your Message</span>
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

                {/* Status-specific messaging */}
                {application.status === 'accepted' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Congratulations! Your application was accepted.</span>
                    </div>
                    <p className="text-green-300 text-sm">
                      The business has approved your application. You can now start working on this bounty. 
                      Make sure to deliver quality content according to the requirements.
                    </p>
                  </div>
                )}

                {application.status === 'rejected' && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 text-red-400 mb-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Application not selected</span>
                    </div>
                    <p className="text-red-300 text-sm">
                      Unfortunately, your application wasn't selected for this bounty. 
                      Keep applying to other bounties that match your skills and audience!
                    </p>
                  </div>
                )}

                {application.status === 'pending' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Application under review</span>
                    </div>
                    <p className="text-yellow-300 text-sm">
                      Your application is being reviewed by the business. They'll get back to you soon!
                    </p>
                  </div>
                )}

                {/* Action button to view original bounty */}
                <div className="pt-6 border-t border-white/10">
                  <button
                    onClick={() => window.location.href = '/bounties'}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>View All Bounties</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyApplications