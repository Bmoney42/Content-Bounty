import React from 'react'
import { Star, Shield, Award, Zap, Verified } from 'lucide-react'
import { ReviewSummary, UserStats } from '../../types/rating'
import StarRating from './StarRating'

interface TrustBadgeProps {
  reviewSummary: ReviewSummary | null
  userStats: UserStats | null
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  compact?: boolean
}

interface QuickRatingProps {
  rating: number
  reviewCount: number
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
  trustLevel?: UserStats['trustLevel']
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  reviewSummary,
  userStats,
  size = 'md',
  showDetails = false,
  compact = false
}) => {
  if (!reviewSummary || !userStats) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Star className="w-4 h-4" />
        <span className="text-sm">New User</span>
      </div>
    )
  }

  const getTrustColor = (trustLevel: UserStats['trustLevel']) => {
    switch (trustLevel) {
      case 'top_rated': return 'text-purple-600 bg-purple-100'
      case 'established': return 'text-green-600 bg-green-100'
      case 'emerging': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrustIcon = (trustLevel: UserStats['trustLevel']) => {
    switch (trustLevel) {
      case 'top_rated': return <Award className="w-4 h-4" />
      case 'established': return <Shield className="w-4 h-4" />
      case 'emerging': return <Zap className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getTrustLabel = (trustLevel: UserStats['trustLevel']) => {
    switch (trustLevel) {
      case 'top_rated': return 'Top Rated'
      case 'established': return 'Established'
      case 'emerging': return 'Rising Star'
      default: return 'New'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <StarRating 
          rating={reviewSummary.averageRating} 
          size="sm" 
          showValue={false} 
          readonly 
        />
        <span className="text-sm text-gray-600">
          {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews})
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Rating and Trust Level */}
      <div className="flex items-center space-x-2">
        <StarRating 
          rating={reviewSummary.averageRating} 
          size={size} 
          showValue={false} 
          readonly 
        />
        <span className="font-semibold text-gray-900">
          {reviewSummary.averageRating.toFixed(1)}
        </span>
        <span className="text-gray-600 text-sm">
          ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
        </span>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTrustColor(userStats.trustLevel)}`}>
          {getTrustIcon(userStats.trustLevel)}
          <span>{getTrustLabel(userStats.trustLevel)}</span>
        </div>
      </div>

      {/* Additional details */}
      {showDetails && (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Verified className="w-4 h-4 text-green-500" />
            <span>{(reviewSummary.completionRate * 100).toFixed(0)}% completion</span>
          </div>
          
          <div>
            Quality: {reviewSummary.qualityScore.toFixed(1)}/5
          </div>
          
          {userStats.badges.length > 0 && (
            <div className="flex space-x-1">
              {userStats.badges.slice(0, 2).map((badge) => (
                <span 
                  key={badge}
                  className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {badge}
                </span>
              ))}
              {userStats.badges.length > 2 && (
                <span className="text-gray-500 text-xs">
                  +{userStats.badges.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const QuickRating: React.FC<QuickRatingProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  showBadge = false,
  trustLevel = 'new'
}) => {
  const getTrustBadgeColor = (level: UserStats['trustLevel']) => {
    switch (level) {
      case 'top_rated': return 'bg-purple-500'
      case 'established': return 'bg-green-500'
      case 'emerging': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  if (reviewCount === 0) {
    return (
      <div className="flex items-center space-x-1 text-gray-500">
        <Star className="w-4 h-4" />
        <span className="text-sm">No reviews</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <StarRating 
          rating={rating} 
          size={size} 
          showValue={false} 
          readonly 
        />
        <span className="text-sm font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-600">
          ({reviewCount})
        </span>
      </div>
      
      {showBadge && trustLevel !== 'new' && (
        <div className={`w-2 h-2 rounded-full ${getTrustBadgeColor(trustLevel)}`} />
      )}
    </div>
  )
}

export default TrustBadge