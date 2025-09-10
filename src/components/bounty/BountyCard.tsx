import React from 'react'
import { DollarSign, Eye, Calendar, Tag, Users, Clock, ArrowRight, Star, MapPin, CheckCircle, Upload, Truck, XCircle, AlertCircle, Target, Shield, ShieldCheck } from 'lucide-react'
import { Bounty } from '../../types/bounty'
import { QuickRating } from '../ui/TrustBadge'
import { useUserReviewSummary, useUserStats } from '../../hooks/useRating'

interface BountyCardProps {
  bounty: Bounty
  onApply?: (bountyId: string) => void
  onViewDetails?: (bountyId: string) => void
  hasApplied?: boolean
  applicationStatus?: string
  onDeliver?: (bountyId: string) => void
  submissionStatus?: string
  feedback?: string
}

const BountyCard: React.FC<BountyCardProps> = ({ 
  bounty, 
  onApply, 
  onViewDetails,
  hasApplied = false,
  applicationStatus,
  onDeliver,
  submissionStatus,
  feedback
}) => {
  // Fetch business rating data
  const { data: businessSummary } = useUserReviewSummary(bounty.businessId)
  const { data: businessStats } = useUserStats(bounty.businessId)
  const getCategoryColor = (category: string) => {
    const colors = {
      review: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      interview: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
      tutorial: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white',
      unboxing: 'bg-gradient-to-r from-orange-500 to-red-600 text-white',
      demo: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white',
      testimonial: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white',
      download: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
      announcement: 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
    }
    return colors[category as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500 text-white',
      paused: 'bg-yellow-500 text-white',
      completed: 'bg-blue-500 text-white',
      cancelled: 'bg-red-500 text-white'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white'
  }

  const getFundingStatusBadge = () => {
    // Check if bounty has escrow payment (funded)
    const isFunded = bounty.escrowPaymentId || bounty.status === 'active'
    
    if (isFunded) {
      return (
        <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3 h-3" />
          <span>Funded</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
          <Shield className="w-3 h-3" />
          <span>Pending Payment</span>
        </div>
      )
    }
  }

  const minimumViewsRequirement = bounty.requirements.find(req => req.type === 'views')

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-gray-100 hover:border-blue-200">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getCategoryColor(bounty.category)} shadow-md`}>
                <Tag className="w-3 h-3 inline mr-1" />
                {bounty.category}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(bounty.status)} shadow-md`}>
                {bounty.status}
              </span>
              {getFundingStatusBadge()}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{bounty.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{bounty.description}</p>
          </div>
          <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl ml-6 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <DollarSign className="w-6 h-6 mr-2" />
            <span className="font-bold text-2xl">{bounty.payment.amount}</span>
          </div>
        </div>

        {/* Company */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">By </span>
            <span className="font-semibold text-gray-900">{bounty.businessName}</span>
          </div>
          {businessSummary && businessSummary.totalReviews > 0 && (
            <QuickRating
              rating={businessSummary.averageRating}
              reviewCount={businessSummary.totalReviews}
              trustLevel={businessStats?.trustLevel}
              showBadge={true}
            />
          )}
        </div>

        {/* Requirements Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          {minimumViewsRequirement && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{minimumViewsRequirement.description}</span>
            </div>
          )}
          {bounty.deadline && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Due {new Date(bounty.deadline).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4 text-green-500" />
            <span className="font-medium">{bounty.applicationsCount} applications</span>
          </div>
          {bounty.maxCreators && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Goal: {bounty.maxCreators} creators</span>
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
              </div>
              {/* Applications limit tracking */}
              {bounty.maxApplications && (
                <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-900">Applications: {bounty.applicationsCount}/{bounty.maxApplications}</span>
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
              {bounty.maxCreators > 1 && (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-900">Paid: {bounty.paidCreatorsCount || 0}/{bounty.maxCreators}</span>
                  <span className="text-sm text-blue-700">
                    (${bounty.totalPaidAmount || 0} paid, ${bounty.remainingBudget || 0} remaining)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Talking Points Preview */}
        {bounty.talkingPoints.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-blue-900">Key points:</span>
            </div>
            <p className="text-blue-700 text-sm">
              {bounty.talkingPoints.slice(0, 2).join(', ')}
              {bounty.talkingPoints.length > 2 && '...'}
            </p>
          </div>
        )}

        {/* Payment Security Notice */}
        {(bounty.escrowPaymentId || bounty.status === 'active') && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-900">Payment Guaranteed</span>
            </div>
            <p className="text-green-700 text-sm">
              {bounty.payment.amount} is secured in escrow and will be released upon completion and approval.
            </p>
          </div>
        )}

        {/* Payment Milestones */}
        {bounty.payment.milestones.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-blue-900">Payment structure:</span>
            </div>
            <p className="text-blue-700 text-sm">
              {bounty.payment.milestones[0].percentage}% on {bounty.payment.milestones[0].description.toLowerCase()}
              {bounty.payment.milestones.length > 1 && ` + ${bounty.payment.milestones.length - 1} more milestones`}
            </p>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (submissionStatus === 'rejected' || submissionStatus === 'requires_changes') && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-900">Business Feedback:</span>
            </div>
            <p className="text-orange-700 text-sm">{feedback}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          {(() => {
            const isFunded = bounty.escrowPaymentId || bounty.status === 'active'
            
            if (!hasApplied) {
              // Not applied yet
              if (!isFunded) {
                return (
                  <button 
                    disabled
                    className="flex-1 bg-gray-100 text-gray-500 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Awaiting Payment</span>
                    </span>
                  </button>
                )
              }
              return (
                <button 
                  onClick={() => onApply?.(bounty.id)}
                  disabled={bounty.status !== 'active'}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
                >
                  Apply Now
                </button>
              )
            } else if (applicationStatus === 'pending') {
              // Applied, waiting for approval
              return (
                <button 
                  disabled
                  className="flex-1 bg-yellow-100 text-yellow-700 border border-yellow-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Applied - Pending Review</span>
                  </span>
                </button>
              )
            } else if (applicationStatus === 'accepted') {
              // Check if content has been delivered
              if (submissionStatus === 'submitted') {
                return (
                  <button 
                    disabled
                    className="flex-1 bg-blue-100 text-blue-700 border border-blue-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Waiting for Approval</span>
                    </span>
                  </button>
                )
              } else if (submissionStatus === 'approved') {
                return (
                  <button 
                    disabled
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg"
                  >
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>✅ Completed & Paid!</span>
                    </span>
                  </button>
                )
              } else if (submissionStatus === 'requires_changes') {
                return (
                  <button 
                    onClick={() => onDeliver?.(bounty.id)}
                    className="flex-1 bg-orange-100 text-orange-700 border border-orange-300 font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    <span className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Resubmit Content</span>
                    </span>
                  </button>
                )
              } else if (submissionStatus === 'rejected') {
                return (
                  <button 
                    disabled
                    className="flex-1 bg-red-100 text-red-700 border border-red-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4" />
                      <span>Content Rejected</span>
                    </span>
                  </button>
                )
              } else {
                // No submission yet, show deliver button
                return (
                  <button 
                    onClick={() => onDeliver?.(bounty.id)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    <span className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Deliver Content</span>
                    </span>
                  </button>
                )
              }
            } else if (applicationStatus === 'rejected') {
              // Rejected
              return (
                <button 
                  disabled
                  className="flex-1 bg-red-100 text-red-700 border border-red-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4" />
                    <span>Not Selected</span>
                  </span>
                </button>
              )
            } else {
              // Fallback
              return (
                <button 
                  disabled
                  className="flex-1 bg-gray-100 text-gray-700 border border-gray-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Applied</span>
                  </span>
                </button>
              )
            }
          })()}
          <button 
            onClick={() => onViewDetails?.(bounty.id)}
            className="flex-1 bg-white text-gray-700 font-semibold py-4 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BountyCard