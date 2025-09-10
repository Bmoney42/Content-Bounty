import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCreatorApplications } from '../hooks/useApplications'
import { useCreatorSubmissions } from '../hooks/useSubmissions'
import { useBounties } from '../hooks/useBounties'
import BountyCard from '../components/bounty/BountyCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Briefcase,
  DollarSign,
  TrendingUp,
  Eye
} from 'lucide-react'

const CreatorPipeline: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'completed'>('pipeline')

  // Get user's applications and submissions
  const { 
    data: userApplications = [], 
    isLoading: isLoadingApplications 
  } = useCreatorApplications(user?.id || '')
  
  const { 
    data: userSubmissions = [], 
    isLoading: isLoadingSubmissions 
  } = useCreatorSubmissions(user?.id || '')
  
  const { 
    data: allBounties = [], 
    isLoading: isLoadingBounties 
  } = useBounties()

  // Process application data
  const appliedBounties = new Set(userApplications.map(app => app.bountyId))
  const applicationStatuses: Record<string, string> = {}
  userApplications.forEach(app => {
    applicationStatuses[app.bountyId] = app.status
  })

  // Process submission data
  const submissionStatuses: Record<string, string> = {}
  const submissionFeedback: Record<string, string> = {}
  const existingSubmissionIds: Record<string, string> = {}
  
  userSubmissions.forEach(submission => {
    submissionStatuses[submission.bountyId] = submission.status
    existingSubmissionIds[submission.bountyId] = submission.id
    if (submission.feedback) {
      submissionFeedback[submission.bountyId] = submission.feedback
    }
  })

  // Get bounty details for applications
  const getBountyForApplication = (bountyId: string) => {
    return allBounties.find(bounty => bounty.id === bountyId)
  }

  // Filter applications based on the current tab
  const filteredApplications = userApplications.filter(app => {
    const bounty = getBountyForApplication(app.bountyId)
    if (!bounty) return false

    const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
    const isCompleted = submission && submission.status === 'approved'

    switch (activeTab) {
      case 'pipeline':
        // Show all applications that are not completed
        return !isCompleted
      case 'completed':
        // Show only completed applications
        return isCompleted
      default:
        return false
    }
  })

  // Group applications by status for pipeline view
  const pipelineGroups = {
    pending: filteredApplications.filter(app => app.status === 'pending'),
    accepted: filteredApplications.filter(app => app.status === 'accepted'),
    inProgress: filteredApplications.filter(app => {
      if (app.status !== 'accepted') return false
      const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
      return submission && (submission.status === 'submitted' || submission.status === 'under_review')
    }),
    review: filteredApplications.filter(app => {
      if (app.status !== 'accepted') return false
      const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
      return submission && submission.status === 'requires_changes'
    })
  }

  const handleApply = async (bountyId: string) => {
    // This shouldn't be called on Creator Pipeline page, but just in case
    console.log('Apply not available on Creator Pipeline page')
  }

  const handleViewDetails = (bountyId: string) => {
    // Could navigate to bounty details or open modal
    console.log('View details for bounty:', bountyId)
  }

  const handleDeliver = async (bountyId: string) => {
    // Handle delivery submission
    console.log('Deliver for bounty:', bountyId)
  }

  if (isLoadingApplications || isLoadingSubmissions || isLoadingBounties) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="lg" text="Loading your pipeline..." />
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'accepted': return 'text-green-600 bg-green-100 border-green-200'
      case 'rejected': return 'text-red-600 bg-red-100 border-red-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Creator Pipeline</h1>
          <p className="text-gray-300 text-lg">
            Track your complete journey from application to completion. See where you stand in each bounty's workflow.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 bg-white/10 rounded-2xl p-1 mb-8">
          {[
            { 
              key: 'pipeline', 
              label: 'Active Pipeline', 
              count: filteredApplications.filter(app => {
                const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                return !submission || submission.status !== 'approved'
              }).length,
              description: 'Bounties in progress'
            },
            { 
              key: 'completed', 
              label: 'Completed', 
              count: filteredApplications.filter(app => {
                const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                return submission && submission.status === 'approved'
              }).length,
              description: 'Successfully completed orders'
            }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center space-y-2 ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeTab === tab.key 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-white/20 text-white/80'
                }`}>
                  {tab.count}
                </span>
                <span className={`text-xs ${
                  activeTab === tab.key ? 'text-gray-600' : 'text-white/60'
                }`}>
                  {tab.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Pipeline View */}
        {activeTab === 'pipeline' && (
          <div className="space-y-8">
            {/* Pipeline Stages */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Pending Applications */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Pending</h3>
                    <p className="text-sm text-gray-400">Awaiting review</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">{pipelineGroups.pending.length}</div>
                <p className="text-sm text-gray-400">Applications submitted</p>
              </div>

              {/* Accepted Applications */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Accepted</h3>
                    <p className="text-sm text-gray-400">Ready to start</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">{pipelineGroups.accepted.length}</div>
                <p className="text-sm text-gray-400">Bounties won</p>
              </div>

              {/* In Progress */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">In Progress</h3>
                    <p className="text-sm text-gray-400">Content creation</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">{pipelineGroups.inProgress.length}</div>
                <p className="text-sm text-gray-400">Currently working</p>
              </div>

              {/* Under Review */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Under Review</h3>
                    <p className="text-sm text-gray-400">Awaiting feedback</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">{pipelineGroups.review.length}</div>
                <p className="text-sm text-gray-400">Pending approval</p>
              </div>
            </div>

            {/* Pipeline Items */}
            {filteredApplications.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="w-16 h-16 text-white/40 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">
                  No active pipeline items
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Start by applying to bounties! Your applications will appear here as they move through the pipeline.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map(app => {
                  const bounty = getBountyForApplication(app.bountyId)
                  const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                  
                  if (!bounty) return null

                  return (
                    <div key={app.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{bounty.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)}
                              <span className="ml-2">{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{bounty.description}</p>
                          
                          {/* Progress Indicators */}
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Applied {new Date(app.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {app.status === 'accepted' && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>Accepted</span>
                              </div>
                            )}
                            {submission && (
                              <div className="flex items-center space-x-2">
                                <Briefcase className="w-4 h-4 text-blue-400" />
                                <span>Content submitted</span>
                              </div>
                            )}
                            {submission?.status === 'approved' && (
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span>Payment ready</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-white mb-1">
                            {bounty.payment.amount}
                          </div>
                          <div className="text-sm text-gray-400">Payment</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleViewDetails(bounty.id)}
                          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          View Details
                        </button>
                        {app.status === 'accepted' && !submission && (
                          <button
                            onClick={() => handleDeliver(bounty.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Submit Content
                          </button>
                        )}
                        {submission && submission.status === 'requires_changes' && (
                          <button
                            onClick={() => handleDeliver(bounty.id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Update Content
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed View */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-white/40 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">
                  No completed orders yet
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Complete your first bounty to see it here! Keep working on your current assignments.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredApplications.map(app => {
                  const bounty = getBountyForApplication(app.bountyId)
                  const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                  
                  if (!bounty || !submission) return null

                  return (
                    <BountyCard
                      key={bounty.id}
                      bounty={bounty}
                      onApply={handleApply}
                      onViewDetails={handleViewDetails}
                      onDeliver={handleDeliver}
                      hasApplied={true}
                      applicationStatus={app.status}
                      submissionStatus={submission.status}
                      feedback={submission.feedback}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorPipeline
