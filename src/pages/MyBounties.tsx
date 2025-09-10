import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCreatorApplications } from '../hooks/useApplications'
import { useCreatorSubmissions } from '../hooks/useSubmissions'
import { useBounties } from '../hooks/useBounties'
import BountyCard from '../components/bounty/BountyCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Filter } from 'lucide-react'

const MyBounties: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

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

  // Filter bounties based on the current tab - only show bounties you WON
  const filteredBounties = allBounties.filter(bounty => {
    const application = userApplications.find(app => app.bountyId === bounty.id)
    const submission = userSubmissions.find(sub => sub.bountyId === bounty.id)

    // Only show bounties where user's application was accepted (they WON the bounty)
    const hasWonBounty = application && application.status === 'accepted'
    if (!hasWonBounty) return false

    const isCompleted = submission && submission.status === 'approved'

    switch (activeTab) {
      case 'active':
        // Show accepted bounties that are not yet completed (active orders)
        // Explicitly exclude completed submissions
        return !isCompleted
      case 'completed':
        // Show accepted bounties where work is completed and approved
        return isCompleted
      default:
        return false
    }
  })

  const handleApply = async (bountyId: string) => {
    // This shouldn't be called on My Bounties page, but just in case
    console.log('Apply not available on My Bounties page')
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
          <LoadingSpinner size="lg" text="Loading your bounties..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">My Orders</h1>
          <p className="text-gray-300 text-lg">
            Manage bounties you've won and are working on. Track your active orders and completed work.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 bg-white/10 rounded-2xl p-1 mb-8">
          {[
            { 
              key: 'active', 
              label: 'Active Orders', 
              count: userApplications.filter(app => {
                const isAccepted = app.status === 'accepted'
                const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                const isNotCompleted = !submission || submission.status !== 'approved'
                return isAccepted && isNotCompleted
              }).length,
              description: 'Bounties you won and are currently working on'
            },
            { 
              key: 'completed', 
              label: 'Completed', 
              count: userApplications.filter(app => {
                const isAccepted = app.status === 'accepted'
                const submission = userSubmissions.find(sub => sub.bountyId === app.bountyId)
                const isCompleted = submission && submission.status === 'approved'
                return isAccepted && isCompleted
              }).length,
              description: 'Orders you\'ve completed successfully'
            }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.key 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-white/20 text-white/80'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Current Tab Info */}
        <div className="mb-6 text-center">
          <p className="text-white/70">
            {activeTab === 'active' && 'Orders where you\'ve been selected and are currently working on the content'}
            {activeTab === 'completed' && 'Orders where you\'ve successfully delivered and been paid for your work'}
          </p>
        </div>

        {/* Bounty Cards */}
        {filteredBounties.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-white/40 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">
              No {activeTab} orders found
            </h3>
            <p className="text-white/60 max-w-md mx-auto">
              {activeTab === 'active' && 'You don\'t have any active orders. Apply to bounties and get selected to start earning!'}
              {activeTab === 'completed' && 'You haven\'t completed any orders yet. Keep working on your current assignments!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {filteredBounties.map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onApply={handleApply}
                onViewDetails={handleViewDetails}
                onDeliver={handleDeliver}
                hasApplied={appliedBounties.has(bounty.id)}
                applicationStatus={applicationStatuses[bounty.id]}
                submissionStatus={submissionStatuses[bounty.id]}
                feedback={submissionFeedback[bounty.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBounties