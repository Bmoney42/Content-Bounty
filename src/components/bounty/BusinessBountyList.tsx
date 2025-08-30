import React, { useState } from 'react'
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
  CheckSquare
} from 'lucide-react'
import { Bounty } from '../../types/bounty'

interface BusinessBountyListProps {
  bounties: Bounty[]
  onViewDetails: (bountyId: string) => void
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
  onViewDetails
}) => {
  const [selectedBounty, setSelectedBounty] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'deliveries'>('overview')

  // Mock applications data
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

  const handleApproveApplication = (bountyId: string, applicationId: string) => {
    console.log('Approving application:', applicationId, 'for bounty:', bountyId)
    alert('Application approved! (Demo)')
  }

  const handleRejectApplication = (bountyId: string, applicationId: string) => {
    console.log('Rejecting application:', applicationId, 'for bounty:', bountyId)
    alert('Application rejected! (Demo)')
  }

  const handleApproveDelivery = (bountyId: string, deliveryId: string) => {
    console.log('Approving delivery:', deliveryId, 'for bounty:', bountyId)
    alert('Delivery approved! Payment will be processed. (Demo)')
  }

  const handleRejectDelivery = (bountyId: string, deliveryId: string) => {
    console.log('Rejecting delivery:', deliveryId, 'for bounty:', bountyId)
    alert('Delivery rejected! Creator will be notified. (Demo)')
  }

  return (
    <div className="space-y-8">
      {bounties.map((bounty) => (
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
            <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl ml-6 shadow-lg">
              <DollarSign className="w-6 h-6 mr-2" />
              <span className="font-bold text-2xl">${bounty.payment.amount}</span>
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
                {mockApplications[bounty.id]?.filter(app => app.status === 'approved').length || 0}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Play className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-gray-900">
                {mockDeliveries[bounty.id]?.filter(del => del.status === 'pending').length || 0}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <CheckSquare className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-gray-900">
                {mockDeliveries[bounty.id]?.filter(del => del.status === 'approved').length || 0}
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
                Applications ({mockApplications[bounty.id]?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deliveries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Deliveries ({mockDeliveries[bounty.id]?.length || 0})
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
                        <span>Max Applicants: {bounty.maxApplicants || 'Unlimited'}</span>
                      </div>
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
              <div className="space-y-4">
                {mockApplications[bounty.id]?.length > 0 ? (
                  mockApplications[bounty.id].map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{application.creatorName}</h4>
                          <p className="text-gray-600 text-sm">{application.creatorEmail}</p>
                          <p className="text-gray-500 text-sm">
                            Applied: {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getApplicationStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      {application.message && (
                        <p className="text-gray-700 mb-4 italic">"{application.message}"</p>
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
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No applications yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="space-y-4">
                {mockDeliveries[bounty.id]?.length > 0 ? (
                  mockDeliveries[bounty.id].map((delivery) => (
                    <div key={delivery.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{delivery.creatorName}</h4>
                          <p className="text-gray-600 text-sm">
                            Submitted: {new Date(delivery.submittedAt).toLocaleDateString()}
                          </p>
                          <a 
                            href={delivery.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Video →
                          </a>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getApplicationStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </div>
                      {delivery.notes && (
                        <p className="text-gray-700 mb-4 italic">"{delivery.notes}"</p>
                      )}
                      {delivery.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveDelivery(bounty.id, delivery.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve & Pay</span>
                          </button>
                          <button
                            onClick={() => handleRejectDelivery(bounty.id, delivery.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Request Changes</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No deliveries yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default BusinessBountyList
