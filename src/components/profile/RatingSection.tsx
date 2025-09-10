import React, { useState } from 'react'
import { Star, Filter, Calendar } from 'lucide-react'
import { useUserRatings, useUserReviewSummary, useUserStats } from '../../hooks/useRating'
import { ReviewCard, ReviewSummaryCard } from '../rating/ReviewDisplay'
import TrustBadge from '../ui/TrustBadge'
import { RatingFilters } from '../../types/rating'

interface RatingSectionProps {
  userId: string
  userName: string
  userType: 'creator' | 'business'
  isOwnProfile?: boolean
}

const RatingSection: React.FC<RatingSectionProps> = ({
  userId,
  userName,
  userType,
  isOwnProfile = false
}) => {
  const [filters, setFilters] = useState<RatingFilters>({
    sortBy: 'newest'
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data: ratings = [], isLoading: ratingsLoading } = useUserRatings(userId, filters)
  const { data: summary, isLoading: summaryLoading } = useUserReviewSummary(userId)
  const { data: stats, isLoading: statsLoading } = useUserStats(userId)

  const handleFilterChange = (key: keyof RatingFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (summaryLoading || statsLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-400" />
          <span>Reviews & Ratings</span>
        </h2>
        
        {ratings.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && ratings.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as RatingFilters['sortBy'])}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/10 text-white"
              >
                <option value="newest" className="bg-gray-800 text-white">Newest First</option>
                <option value="oldest" className="bg-gray-800 text-white">Oldest First</option>
                <option value="highest" className="bg-gray-800 text-white">Highest Rating</option>
                <option value="lowest" className="bg-gray-800 text-white">Lowest Rating</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Minimum Rating
              </label>
              <select
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/10 text-white"
              >
                <option value="" className="bg-gray-800 text-white">All Ratings</option>
                <option value="5" className="bg-gray-800 text-white">5 Stars Only</option>
                <option value="4" className="bg-gray-800 text-white">4+ Stars</option>
                <option value="3" className="bg-gray-800 text-white">3+ Stars</option>
                <option value="2" className="bg-gray-800 text-white">2+ Stars</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Reviewer Type
              </label>
              <select
                value={filters.raterType || ''}
                onChange={(e) => handleFilterChange('raterType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/10 text-white"
              >
                <option value="" className="bg-gray-800 text-white">All Types</option>
                <option value="creator" className="bg-gray-800 text-white">From Creators</option>
                <option value="business" className="bg-gray-800 text-white">From Businesses</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Review Summary */}
      {summary && <ReviewSummaryCard summary={summary} userName={userName} />}

      {/* Trust Badge */}
      {summary && stats && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Level</h3>
          <TrustBadge 
            reviewSummary={summary}
            userStats={stats}
            size="lg"
            showDetails={true}
          />
        </div>
      )}

      {/* Individual Reviews */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Reviews {ratings.length > 0 && `(${ratings.length})`}
        </h3>
        
        {ratingsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {isOwnProfile 
                ? userType === 'creator'
                  ? 'Complete your first bounty to start receiving reviews from businesses.'
                  : 'Create your first bounty to start receiving reviews from creators.'
                : `${userName} hasn't received any reviews yet. Be the first to work with them!`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ratings.map((rating) => (
              <ReviewCard 
                key={rating.id} 
                review={rating} 
                showBountyContext={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Performance Insights for Own Profile */}
      {isOwnProfile && summary && stats && summary.totalReviews > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Your Performance Insights</span>
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.averageRating >= 4.5 ? 'Excellent!' : 
                 summary.averageRating >= 4.0 ? 'Great!' : 
                 summary.averageRating >= 3.5 ? 'Good' : 'Needs improvement'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(summary.completionRate * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Completion</div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.completionRate >= 0.95 ? 'Outstanding' : 
                 summary.completionRate >= 0.90 ? 'Excellent' : 
                 summary.completionRate >= 0.85 ? 'Good' : 'Focus area'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.communicationScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Communication</div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.communicationScore >= 4.5 ? 'Excellent' : 
                 summary.communicationScore >= 4.0 ? 'Great' : 'Can improve'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {summary.qualityScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Quality</div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.qualityScore >= 4.5 ? 'Top tier' : 
                 summary.qualityScore >= 4.0 ? 'High quality' : 'Room to grow'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatingSection