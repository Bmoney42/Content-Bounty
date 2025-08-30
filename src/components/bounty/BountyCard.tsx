import React from 'react'
import { DollarSign, Eye, Calendar, Tag, Users, Clock, ArrowRight, Star, MapPin } from 'lucide-react'
import { Bounty } from '../../types/bounty'

interface BountyCardProps {
  bounty: Bounty
  onApply?: (bountyId: string) => void
  onViewDetails?: (bountyId: string) => void
}

const BountyCard: React.FC<BountyCardProps> = ({ 
  bounty, 
  onApply, 
  onViewDetails 
}) => {
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
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{bounty.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{bounty.description}</p>
          </div>
          <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl ml-6 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <DollarSign className="w-6 h-6 mr-2" />
            <span className="font-bold text-2xl">${bounty.payment.amount}</span>
          </div>
        </div>

        {/* Company */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">By </span>
          <span className="font-semibold text-gray-900">{bounty.businessName}</span>
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
          {bounty.maxApplicants && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Max {bounty.maxApplicants} applicants</span>
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

        {/* Payment Milestones */}
        {bounty.payment.milestones.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-900">Payment structure:</span>
            </div>
            <p className="text-green-700 text-sm">
              {bounty.payment.milestones[0].percentage}% on {bounty.payment.milestones[0].description.toLowerCase()}
              {bounty.payment.milestones.length > 1 && ` + ${bounty.payment.milestones.length - 1} more milestones`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button 
            onClick={() => onApply?.(bounty.id)}
            disabled={bounty.status !== 'active'}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
          >
            Apply Now
          </button>
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