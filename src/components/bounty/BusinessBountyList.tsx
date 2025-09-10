import React, { useState, useEffect } from 'react'
import { 
  Target, 
  Users, 
  DollarSign, 
  Calendar, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  Play,
  CheckSquare,
  FileText,
  Edit3,
  Trash2,
  CreditCard
} from 'lucide-react'
import { Bounty, BountyApplication } from '../../types/bounty'
import { firebaseDB } from '../../services/firebase'
import { StripeService } from '../../services/stripe'
import { useAuth } from '../../utils/authUtils'
import SubmissionsList from './SubmissionsList'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import Pagination from '../ui/Pagination'
import { usePagination } from '../../hooks/usePagination'

interface BusinessBountyListProps {
  bounties: Bounty[]
  onViewDetails: (bountyId: string) => void
  itemsPerPage?: number
  onBountyUpdated?: () => void // Callback to refresh bounties list after changes
}

interface Application {
  id: string
  creatorId: string
  creatorName: string
  creatorEmail: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  message?: string
}

interface Delivery {
  id: string
  creatorId: string
  creatorName: string
  videoUrl: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  notes?: string
}

const BusinessBountyList: React.FC<BusinessBountyListProps> = ({
  bounties,
  onViewDetails,
  itemsPerPage = 3,
  onBountyUpdated
}) => {
  const { user } = useAuth()
  const [selectedBounty, setSelectedBounty] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview')
  const [applications, setApplications] = useState<Record<string, BountyApplication[]>>({})
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [selectedBountyForSubmissions, setSelectedBountyForSubmissions] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({})
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems: paginatedBounties,
    goToPage
  } = usePagination(bounties, { itemsPerPage })

  // Fetch applications for all bounties
  useEffect(() => {
    const fetchData = async () => {
      setLoadingApplications(true)
      setLoadingSubmissions(true)
      const allApplications: Record<string, BountyApplication[]> = {}
      const allSubmissions: Record<string, any[]> = {}
      
      try {
        for (const bounty of paginatedBounties) {
          // Fetch applications
          const bountyApplications = await firebaseDB.getBountyApplications(bounty.id)
          allApplications[bounty.id] = bountyApplications
          
          // Fetch submissions
          const bountySubmissions = await firebaseDB.getBountySubmissions(bounty.id)
          allSubmissions[bounty.id] = bountySubmissions
        }
        setApplications(allApplications)
        setSubmissions(allSubmissions)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingApplications(false)
        setLoadingSubmissions(false)
      }
    }

    if (paginatedBounties.length > 0) {
      fetchData()
    }
  }, [paginatedBounties])

  // Mock applications data (keeping for now as fallback)
  const mockApplications: Record<string, Application[]> = {
    '4': [
      {
        id: 'app1',
        creatorId: 'creator1',
        creatorName: 'TechReviewer99',
        creatorEmail: 'tech@example.com',
        status: 'pending',
        appliedAt: '2024-01-12T10:00:00Z',
        message: 'I have 50K subscribers and specialize in tech reviews. Would love to work on this!'
      },
      {
        id: 'app2',
        creatorId: 'creator2',
        creatorName: 'CryptoTeacher',
        creatorEmail: 'crypto@example.com',
        status: 'approved',
        appliedAt: '2024-01-11T15:30:00Z',
        message: 'Perfect fit for my channel! I have experience with similar products.'
      }
    ],
    '5': [
      {
        id: 'app3',
        creatorId: 'creator3',
        creatorName: 'TutorialMaster',
        creatorEmail: 'tutorial@example.com',
        status: 'pending',
        appliedAt: '2024-01-09T09:15:00Z'
      }
    ]
  }

  // Mock deliveries data
  const mockDeliveries: Record<string, Delivery[]> = {
    '5': [
      {
        id: 'del1',
        creatorId: 'creator2',
        creatorName: 'CryptoTeacher',
        videoUrl: 'https://youtube.com/watch?v=example',
        status: 'pending',
        submittedAt: '2024-01-20T14:00:00Z',
        notes: 'Tutorial completed as requested. Please review and let me know if any changes needed.'
      }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'in-progress': return 'bg-yellow-500 text-white'
      case 'completed': return 'bg-blue-500 text-white'
      case 'pending': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white'
      case 'rejected': return 'bg-red-500 text-white'
      case 'pending': return 'bg-yellow-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleApproveApplication = async (bountyId: string, applicationId: string) => {
    try {
      await firebaseDB.updateApplicationStatus(applicationId, 'accepted')
      
      // Update local state
      setApplications(prev => ({
        ...prev,
        [bountyId]: prev[bountyId]?.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'accepted', reviewedAt: new Date().toISOString() }
            : app
        ) || []
      }))
      
      alert('Application approved successfully!')
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Failed to approve application. Please try again.')
    }
  }

  const handleRejectApplication = async (bountyId: string, applicationId: string) => {
    try {
      await firebaseDB.updateApplicationStatus(applicationId, 'rejected')
      
      // Update local state
      setApplications(prev => ({
        ...prev,
        [bountyId]: prev[bountyId]?.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'rejected', reviewedAt: new Date().toISOString() }
            : app
        ) || []
      }))
      
      alert('Application rejected successfully!')
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert('Failed to reject application. Please try again.')
    }
  }

  const handleApproveDelivery = (bountyId: string, deliveryId: string) => {
    console.log('Approving delivery:', deliveryId, 'for bounty:', bountyId)
    alert('Delivery approved! Payment will be processed. (Demo)')
  }

  const handleRejectDelivery = (bountyId: string, deliveryId: string) => {
    console.log('Rejecting delivery:', deliveryId, 'for bounty:', bountyId)
    alert('Delivery rejected! Creator will be notified. (Demo)')
  }

  const handleViewSubmissions = (bountyId: string) => {
    setSelectedBountyForSubmissions(bountyId)
    setShowSubmissions(true)
  }

  const closeSubmissions = () => {
    setShowSubmissions(false)
    setSelectedBountyForSubmissions(null)
  }

  const refreshSubmissions = async (bountyId: string) => {
    try {
      const fetchedSubmissions = await firebaseDB.getBountySubmissions(bountyId)
      setSubmissions(prev => ({
        ...prev,
        [bountyId]: fetchedSubmissions
      }))
    } catch (error) {
      console.error('Error refreshing submissions:', error)
    }
  }

  // Bounty management handlers
  const handleEditBounty = (bountyId: string) => {
    // TODO: Implement edit bounty modal/form
    console.log('Edit bounty:', bountyId)
    alert('Edit bounty functionality coming soon!')
  }

  const handleDeleteBounty = async (bountyId: string) => {
    if (!confirm('Are you sure you want to delete this bounty? This action cannot be undone.')) {
      return
    }

    try {
      await firebaseDB.deleteBounty(bountyId)
      alert('Bounty deleted successfully!')
      onBountyUpdated?.() // Refresh bounties list
    } catch (error) {
      console.error('Error deleting bounty:', error)
      alert('Failed to delete bounty. Please try again.')
    }
  }

  const handlePayBounty = async (bountyId: string) => {
    if (!user?.id || !user?.email) {
      alert('Please log in to fund this bounty.')
      return
    }

    // Find the bounty to get payment details
    const bounty = bounties.find(b => b.id === bountyId)
    if (!bounty) {
      alert('Bounty not found.')
      return
    }

    // Calculate total amount for multiple creators
    // bounty.payment.amount is the per-creator amount
    // Total payment = per-creator amount * number of creators + 5% platform fee
    const perCreatorAmount = bounty.payment.amount
    const maxCreators = bounty.maxCreators || 1
    const totalBountyAmount = perCreatorAmount * maxCreators
    const platformFee = totalBountyAmount * 0.05 // 5% platform fee
    const totalPayment = totalBountyAmount + platformFee
    
    if (!confirm(`Fund this bounty for $${totalPayment.toFixed(2)} total ($${perCreatorAmount} per creator × ${maxCreators} creators + $${platformFee.toFixed(2)} platform fee) and make it live on the marketplace?`)) {
      return
    }

    try {
      console.log('Creating escrow payment for bounty:', bountyId)
      console.log(`Per-creator amount: $${perCreatorAmount}, Max creators: ${maxCreators}, Total bounty: $${totalBountyAmount}, Platform fee: $${platformFee.toFixed(2)}, Total payment: $${totalPayment.toFixed(2)}`)
      
      // Calculate total amount in cents for Stripe (including platform fee)
      const totalAmountCents = Math.round(totalPayment * 100) // Convert to cents
      
      // Create escrow payment through Stripe - this will automatically redirect to Stripe checkout
      await StripeService.createEscrowPayment(
        bountyId,
        user.id,
        totalAmountCents,
        user.email
      )
      
      // Note: The bounty status will be updated to 'active' via webhook after successful payment
      // User will be redirected to Stripe checkout automatically
      
    } catch (error) {
      console.error('Error creating payment for bounty:', error)
      alert('Failed to process payment. Please try again.')
    }
  }

  // Test function to check all submissions
  const testAllSubmissions = async () => {
    try {
      console.log('🧪 Testing all submissions in database...')
      const q = query(collection(db, 'submissions'))
      const querySnapshot = await getDocs(q)
      const allSubs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('📊 All submissions in database:', allSubs)
      alert(`Found ${allSubs.length} total submissions in database`)
    } catch (error) {
      console.error('Error testing submissions:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Pagination Summary */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing {paginatedBounties.length} of {totalItems} bounties
          </p>
        </div>
      )}
      
      {paginatedBounties.map((bounty) => (
        <div key={bounty.id} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {/* Bounty Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(bounty.status)}`}>
                  {bounty.status}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {bounty.category}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{bounty.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{bounty.description}</p>
            </div>
            <div className="flex items-center space-x-4 ml-6">
              <div className="flex flex-col items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex items-center mb-1">
                  <DollarSign className="w-6 h-6 mr-2" />
                  <span className="font-bold text-2xl">{bounty.payment.amount}</span>
                </div>
                {bounty.maxCreators && bounty.maxCreators > 1 && (
                  <span className="text-sm opacity-90">per creator</span>
                )}
              </div>
              
              {/* Management buttons for pending bounties */}
              {bounty.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditBounty(bounty.id)}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 group"
                    title="Edit bounty"
                  >
                    <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleDeleteBounty(bounty.id)}
                    className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 group"
                    title="Delete bounty"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handlePayBounty(bounty.id)}
                    className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 group"
                    title="Pay & Fund bounty to make it live on marketplace"
                  >
                    <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-gray-900">{bounty.applicationsCount}</div>
              <div className="text-sm text-gray-600">Applications</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-gray-900">
                {applications[bounty.id]?.filter(app => app.status === 'accepted').length || 0}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
                              <Play className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {submissions[bounty.id]?.filter(sub => sub.status === 'submitted').length || 0}
                </div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <CheckSquare className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {submissions[bounty.id]?.filter(sub => sub.status === 'approved').length || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Applications & Submissions ({applications[bounty.id]?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                        <span>Deadline: {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : 'No deadline'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-3 text-green-500" />
                        <span>Goal: {bounty.maxCreators || 'Unlimited'} creators</span>
                        {bounty.maxCreators && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            bounty.applicationsCount >= bounty.maxCreators 
                              ? 'bg-green-100 text-green-800' 
                              : bounty.applicationsCount >= bounty.maxCreators * 0.8 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {bounty.applicationsCount >= bounty.maxCreators 
                              ? 'Goal Reached!' 
                              : `${bounty.applicationsCount}/${bounty.maxCreators}`
                            }
                          </span>
                        )}
                      </div>
                      {/* Applications limit tracking */}
                      {bounty.maxApplications && (
                        <div className="flex items-center text-gray-600">
                          <Target className="w-4 h-4 mr-3 text-orange-500" />
                          <span>Applications: {bounty.applicationsCount}/{bounty.maxApplications}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            bounty.applicationsCount >= bounty.maxApplications 
                              ? 'bg-red-100 text-red-800' 
                              : bounty.applicationsCount >= bounty.maxApplications * 0.8 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {bounty.applicationsCount >= bounty.maxApplications 
                              ? 'Applications Closed!' 
                              : `${bounty.applicationsCount}/${bounty.maxApplications}`
                            }
                          </span>
                        </div>
                      )}
                      {/* Payment tracking for multi-creator bounties */}
                      {bounty.maxCreators && bounty.maxCreators > 1 && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-3 text-blue-500" />
                          <span>Paid: {bounty.paidCreatorsCount || 0}/{bounty.maxCreators} creators</span>
                          <span className="ml-2 text-sm text-gray-500">
                            (${bounty.totalPaidAmount || 0} paid, ${bounty.remainingBudget || 0} remaining)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Structure</h4>
                    <div className="space-y-2">
                      {bounty.payment.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{milestone.description}</span>
                          <span className="font-semibold text-gray-900">
                            ${Math.round(bounty.payment.amount * (milestone.percentage / 100))} ({milestone.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails(bounty.id)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Full Details</span>
                </button>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                {/* Applications Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications</h3>
                  {loadingApplications ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
                      <p>Loading applications...</p>
                    </div>
                  ) : applications[bounty.id]?.length > 0 ? (
                    <div className="space-y-4">
                      {applications[bounty.id].map((application) => (
                        <div key={application.id} className="border border-gray-200 rounded-xl p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{application.creatorName}</h4>
                              <p className="text-gray-600 text-sm">Creator ID: {application.creatorId}</p>
                              <p className="text-gray-500 text-sm">
                                Applied: {new Date(application.submittedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getApplicationStatusColor(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Message:</h5>
                              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg italic">
                                "{application.message}"
                              </p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Proposed Timeline:</h5>
                              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                                {application.proposedTimeline}
                              </p>
                            </div>
                          </div>

                          {application.reviewedAt && (
                            <p className="text-gray-500 text-sm mb-4">
                              Reviewed: {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          
                          {application.status === 'pending' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleApproveApplication(bounty.id, application.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectApplication(bounty.id, application.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No applications yet</p>
                      <p className="text-sm mt-2">When creators apply to this bounty, you'll see their applications here.</p>
                    </div>
                  )}
                </div>

                {/* Submissions Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Content Submissions</h3>
                    <button
                      onClick={() => handleViewSubmissions(bounty.id)}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Submissions</span>
                    </button>
                  </div>
                  
                  {submissions[bounty.id]?.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
                      <p className="text-gray-600">
                        Creators will appear here once they submit their content for this bounty.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {submissions[bounty.id]?.length} submission{submissions[bounty.id]?.length !== 1 ? 's' : ''} received
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Click "View Submissions" to review and manage content.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
        />
      )}

      {/* Submissions Modal */}
      {showSubmissions && selectedBountyForSubmissions && (
        <SubmissionsList
          bountyId={selectedBountyForSubmissions}
          onClose={closeSubmissions}
          onSubmissionUpdated={() => {
            // Refresh submissions data when a submission is updated
            refreshSubmissions(selectedBountyForSubmissions)
          }}
        />
      )}
    </div>
  )
}

export default BusinessBountyList
