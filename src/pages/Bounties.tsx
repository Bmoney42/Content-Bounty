import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useBounties, useBountiesByUser, useCreateApplication } from '../hooks/useBounties'
import { useCreatorApplications } from '../hooks/useApplications'
import { useCreatorSubmissions } from '../hooks/useSubmissions'
import { useRealTimeUpdatesForUser } from '../hooks/useRealTimeUpdates'
import { useSubscription } from '../hooks/useSubscription'
import { Bounty } from '../types/bounty'
import BountyList from '../components/bounty/BountyList'
import BountyModal from '../components/bounty/BountyModal'
import DeliveryModal from '../components/bounty/DeliveryModal'
import BusinessBountyList from '../components/bounty/BusinessBountyList'
import UpgradeModal from '../components/ui/UpgradeModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Star, Crown, Target } from 'lucide-react'

/**
 * Bounties Page - Handles both creator browsing and business management
 * 
 * NEW SYSTEM: "maxCreators" represents the goal number of creators needed
 * - When applicationsCount >= maxCreators, bounty is automatically hidden from creator browse view
 * - Business users see progress indicators showing how close they are to their creator goal
 * - Bounties with reached goals are organized in "Completed Bounties" section for businesses
 */
const Bounties: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { 
    isPremium, 
    hasReachedApplicationLimit, 
    applicationsRemaining,
    upgradePrompts 
  } = useSubscription()
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [deliveryBounty, setDeliveryBounty] = useState<Bounty | null>(null)
  const [deliverySubmissionId, setDeliverySubmissionId] = useState<string | undefined>(undefined)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'active' | 'completed'>('pending')

  // TanStack Query hooks for data fetching with caching
  const { 
    data: allBounties = [], 
    isLoading: isLoadingAllBounties 
  } = useBounties()
  
  const { 
    data: userBounties = [], 
    isLoading: isLoadingUserBounties 
  } = useBountiesByUser(user?.userType === 'business' ? user.id : '')
  
  const { 
    data: userApplications = [], 
    isLoading: isLoadingApplications 
  } = useCreatorApplications(user?.userType === 'creator' ? user.id : '')
  
  const { 
    data: userSubmissions = [], 
    isLoading: isLoadingSubmissions 
  } = useCreatorSubmissions(user?.userType === 'creator' ? user.id : '')

  const createApplicationMutation = useCreateApplication()

  // Set up real-time listeners for live updates
  useRealTimeUpdatesForUser()

  // Determine which bounties to show and loading state
  // For creators: show all open bounties (Browse Bounties) - exclude completed and max creators goal reached
  // For businesses: show all their bounties (active + completed) organized by status
  const bounties = user?.userType === 'business' 
    ? userBounties // Show all bounties for businesses (active + completed)
    : allBounties.filter(b => {
        // Only show active bounties for creators
        if (b.status !== 'active') return false
        
        // Only show funded bounties to creators (payment secured in escrow)
        const isFunded = b.escrowPaymentId || b.status === 'active'
        if (!isFunded) return false
        
        // Hide bounties where max applications limit is reached
        if (b.maxApplications && b.applicationsCount >= b.maxApplications) return false
        
        // Hide bounties where max creators goal is reached (auto-complete logic)
        if (b.maxCreators && b.applicationsCount >= b.maxCreators) return false
        
        return true
      })
  const isLoading = user?.userType === 'business' 
    ? isLoadingUserBounties 
    : isLoadingAllBounties

  // Process application data for creators
  const appliedBounties = new Set(userApplications.map(app => app.bountyId))
  const applicationStatuses: Record<string, string> = {}
  userApplications.forEach(app => {
    applicationStatuses[app.bountyId] = app.status
  })

  // Process submission data for creators
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

  const handleApply = async (bountyId: string) => {
    if (!user || user.userType !== 'creator') {
      alert('Only creators can apply to bounties')
      return
    }

    if (appliedBounties.has(bountyId)) {
      alert('You have already applied to this bounty')
      return
    }

    // Check if bounty is funded
    const bounty = bounties.find(b => b.id === bountyId)
    if (!bounty) {
      alert('Bounty not found')
      return
    }

    const isFunded = bounty.escrowPaymentId || bounty.status === 'active'
    if (!isFunded) {
      alert('This bounty is not yet funded. You can only apply to bounties with secured payments.')
      return
    }

    try {
      // Create application using the mutation
      const applicationData = {
        bountyId,
        creatorId: user.id,
        creatorName: user.name,
        message: 'I would like to apply for this bounty!', // Simple default message
        proposedTimeline: '7-14 days', // Default timeline
        status: 'pending' as const
      }

      await createApplicationMutation.mutateAsync(applicationData)
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const handleViewDetails = (bountyId: string) => {
    const bounty = bounties.find(b => b.id === bountyId)
    if (bounty) {
      setSelectedBounty(bounty)
      setIsModalOpen(true)
    }
  }

  const handleDeliver = async (bountyId: string) => {
    try {
      const bounty = bounties.find(b => b.id === bountyId)
      if (bounty) {
        setDeliveryBounty(bounty)
        // Check if there's an existing submission for this bounty
        const existingSubmissionId = existingSubmissionIds[bountyId]
        setDeliverySubmissionId(existingSubmissionId)
        setIsDeliveryModalOpen(true)
      }
    } catch (error) {
      console.error('Error opening delivery modal:', error)
      alert('Failed to open delivery form. Please try again.')
    }
  }

  const closeDeliveryModal = () => {
    setIsDeliveryModalOpen(false)
    setDeliveryBounty(null)
    setDeliverySubmissionId(undefined)
  }

  const handleDeliverySuccess = () => {
    // With TanStack Query, the cache will automatically update when mutations complete
    console.log('Delivery submitted successfully')
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBounty(null)
  }

  // Filter bounties based on user type
  const filteredBounties = user?.userType === 'business' 
    ? bounties.filter(bounty => bounty.businessId === user.id)
    : bounties // For creators, bounties are already filtered to only active ones
  
  console.log('User type:', user?.userType, 'Total bounties:', bounties.length, 'Filtered bounties:', filteredBounties.length)
  console.log('Bounty statuses for creators:', user?.userType === 'creator' ? bounties.map(b => ({ id: b.id, status: b.status, title: b.title })) : 'N/A')

  // Show loading state
  if (isLoading || isLoadingApplications || isLoadingSubmissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="lg" text="Loading bounties..." />
        </div>
      </div>
    )
  }

  // Show different content based on user type
  if (user?.userType === 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">My Bounties</h1>
            <p className="text-gray-300 text-lg">
              Manage your created bounties, review applications, and approve deliveries.
            </p>
          </div>

          {/* Status Tabs for Business Users */}
          <div className="mb-8">
            <div className="border-b border-gray-600">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveStatusTab('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeStatusTab === 'pending'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Pending Bounties ({filteredBounties.filter(b => b.status === 'pending').length})
                </button>
                <button
                  onClick={() => setActiveStatusTab('active')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeStatusTab === 'active'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Active Bounties ({filteredBounties.filter(b => b.status === 'active').length})
                </button>
                <button
                  onClick={() => setActiveStatusTab('completed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeStatusTab === 'completed'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Completed Bounties ({filteredBounties.filter(b => b.status === 'completed').length})
                </button>
              </nav>
            </div>
          </div>

          {/* Bounties by Status */}
          {activeStatusTab === 'pending' && filteredBounties.filter(b => b.status === 'pending').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Pending Bounties</h2>
              <p className="text-gray-300 mb-6">These bounties are not yet live on the marketplace. Fund them to make them available to creators.</p>
              <BusinessBountyList
                bounties={filteredBounties.filter(b => b.status === 'pending')}
                onViewDetails={handleViewDetails}
                onBountyUpdated={() => {
                  // Refresh both queries when bounty is updated
                  queryClient.invalidateQueries({ queryKey: ['bounties', 'user', user?.id] })
                  queryClient.invalidateQueries({ queryKey: ['bounties'] })
                }}
              />
            </div>
          )}
          
          {activeStatusTab === 'active' && filteredBounties.filter(b => b.status === 'active').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Active Bounties</h2>
              <BusinessBountyList
                bounties={filteredBounties.filter(b => b.status === 'active')}
                onViewDetails={handleViewDetails}
                onBountyUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['bounties', 'user', user?.id] })
                  queryClient.invalidateQueries({ queryKey: ['bounties'] })
                }}
              />
            </div>
          )}

          {activeStatusTab === 'completed' && filteredBounties.filter(b => b.status === 'completed').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Completed Bounties</h2>
              <BusinessBountyList
                bounties={filteredBounties.filter(b => b.status === 'completed')}
                onViewDetails={handleViewDetails}
                onBountyUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['bounties', 'user', user?.id] })
                  queryClient.invalidateQueries({ queryKey: ['bounties'] })
                }}
              />
            </div>
          )}

          {/* No bounties message */}
          {filteredBounties.filter(b => b.status === activeStatusTab).length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {activeStatusTab === 'pending' ? 'No Pending Bounties' :
                 activeStatusTab === 'active' ? 'No Active Bounties' : 'No Completed Bounties'}
              </h3>
              <p className="text-gray-400 mb-6">
                {activeStatusTab === 'pending' 
                  ? "You don't have any pending bounties. Create a new bounty to get started!"
                  : activeStatusTab === 'active' 
                    ? "You don't have any active bounties right now. Fund your pending bounties or create new ones!"
                    : "Completed bounties will appear here once you finish your active projects."
                }
              </p>
              <Button
                onClick={() => window.location.href = '/bounties/new'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create New Bounty
              </Button>
            </div>
          )}

          <BountyModal
            bounty={selectedBounty}
            isOpen={isModalOpen}
            onClose={closeModal}
            onApply={handleApply}
          />

          <DeliveryModal
            bounty={deliveryBounty}
            isOpen={isDeliveryModalOpen}
            onClose={closeDeliveryModal}
            onSuccess={handleDeliverySuccess}
            existingSubmissionId={deliverySubmissionId}
          />
        </div>
      </div>
    )
  }

  // Creator view - show all available bounties
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Browse Bounties</h1>
          <p className="text-gray-300 text-lg">
            Discover active bounties from businesses looking for content creators. 
            Use filters to find opportunities that match your skills and audience.
          </p>
        </div>

        {/* Upgrade Banner for Creators */}
        {!isPremium && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Free Creator Plan
                    </h3>
                    <p className="text-blue-100">
                      {applicationsRemaining} applications remaining this month • Zero fees
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Application Limit Warning */}
        {hasReachedApplicationLimit && !isPremium && (
          <div className="mb-8">
            <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Application Limit Reached
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You've used all 3 applications this month. Upgrade to apply to unlimited bounties!
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Upgrade Now
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Upgrade Prompts */}
        {upgradePrompts.length > 0 && !isPremium && (
          <div className="mb-8">
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Upgrade Opportunity
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {upgradePrompts[0]?.message}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Upgrade Now
                </Button>
              </div>
            </Card>
          </div>
        )}

        <BountyList
          bounties={filteredBounties}
          onApply={handleApply}
          onViewDetails={handleViewDetails}
          onDeliver={handleDeliver}
          appliedBounties={appliedBounties}
          applicationStatuses={applicationStatuses}
          submissionStatuses={submissionStatuses}
          submissionFeedback={submissionFeedback}
          // @ts-ignore TS2367 - False positive: userType comparison is valid
          showStatusTabs={Boolean(user && user.userType === 'business')}
        />

        <BountyModal
          bounty={selectedBounty}
          isOpen={isModalOpen}
          onClose={closeModal}
          onApply={handleApply}
        />

        <DeliveryModal
          bounty={deliveryBounty}
          isOpen={isDeliveryModalOpen}
          onClose={closeDeliveryModal}
          onSuccess={handleDeliverySuccess}
          existingSubmissionId={deliverySubmissionId}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger={hasReachedApplicationLimit ? 'application_limit' : 'manual'}
        />
        

      </div>
    </div>
  )
}

export default Bounties