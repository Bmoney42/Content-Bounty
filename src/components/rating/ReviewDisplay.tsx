import React from 'react'
import { Calendar, Verified, Star } from 'lucide-react'
import { Rating, ReviewSummary } from '../../types/rating'
import StarRating from '../ui/StarRating'

interface ReviewDisplayProps {
  review: Rating
  showBountyContext?: boolean
}

interface ReviewSummaryProps {
  summary: ReviewSummary
  userName: string
}

export const ReviewCard: React.FC<ReviewDisplayProps> = ({ 
  review, 
  showBountyContext = true 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <StarRating rating={review.overallRating} size="sm" showValue={false} readonly />
            <span className="text-sm font-semibold text-gray-900">
              {review.overallRating.toFixed(1)}
            </span>
            {review.isVerified && (
              <div className="flex items-center space-x-1">
                <Verified className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Verified</span>
              </div>
            )}
          </div>
          
          {review.title && (
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {review.title}
            </h3>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>By {review.raterType}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bounty Context */}
      {showBountyContext && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm">
            <span className="text-gray-600">Bounty: </span>
            <span className="font-medium text-gray-900">{review.bountyTitle}</span>
            <span className="text-gray-500 ml-2">({review.bountyCategory})</span>
          </div>
        </div>
      )}

      {/* Review Content */}
      {review.review && (
        <div className="text-gray-700 leading-relaxed">
          {review.review}
        </div>
      )}

      {/* Detailed Ratings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Communication</div>
          <div className="flex justify-center">
            <StarRating rating={review.communicationRating} size="sm" showValue={false} readonly />
          </div>
          <div className="text-xs text-gray-600 font-medium mt-1">
            {review.communicationRating.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Quality</div>
          <div className="flex justify-center">
            <StarRating rating={review.qualityRating} size="sm" showValue={false} readonly />
          </div>
          <div className="text-xs text-gray-600 font-medium mt-1">
            {review.qualityRating.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Timeliness</div>
          <div className="flex justify-center">
            <StarRating rating={review.timelinesRating} size="sm" showValue={false} readonly />
          </div>
          <div className="text-xs text-gray-600 font-medium mt-1">
            {review.timelinesRating.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Professionalism</div>
          <div className="flex justify-center">
            <StarRating rating={review.professionalismRating} size="sm" showValue={false} readonly />
          </div>
          <div className="text-xs text-gray-600 font-medium mt-1">
            {review.professionalismRating.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ReviewSummaryCard: React.FC<ReviewSummaryProps> = ({ 
  summary, 
  userName 
}) => {
  const getRatingDistribution = () => {
    const total = summary.totalReviews
    if (total === 0) return []
    
    return [
      { stars: 5, count: summary.fiveStars, percentage: (summary.fiveStars / total) * 100 },
      { stars: 4, count: summary.fourStars, percentage: (summary.fourStars / total) * 100 },
      { stars: 3, count: summary.threeStars, percentage: (summary.threeStars / total) * 100 },
      { stars: 2, count: summary.twoStars, percentage: (summary.twoStars / total) * 100 },
      { stars: 1, count: summary.oneStar, percentage: (summary.oneStar / total) * 100 },
    ]
  }

  const getTrustBadge = () => {
    if (summary.averageRating >= 4.8 && summary.totalReviews >= 20) {
      return { label: 'Top Rated', color: 'bg-purple-100 text-purple-800' }
    } else if (summary.averageRating >= 4.5 && summary.totalReviews >= 10) {
      return { label: 'Highly Rated', color: 'bg-green-100 text-green-800' }
    } else if (summary.averageRating >= 4.0 && summary.totalReviews >= 5) {
      return { label: 'Well Rated', color: 'bg-blue-100 text-blue-800' }
    }
    return null
  }

  const trustBadge = getTrustBadge()
  const distribution = getRatingDistribution()

  if (summary.totalReviews === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">
          {userName} hasn't received any reviews yet. Be the first to work with them!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {summary.averageRating.toFixed(1)}
            </div>
            <StarRating rating={summary.averageRating} size="md" showValue={false} readonly />
            <div className="text-sm text-gray-600 mt-1">
              {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {trustBadge && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${trustBadge.color}`}>
            {trustBadge.label}
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {distribution.map((item) => (
          <div key={item.stars} className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 w-16">
              <span className="text-sm text-gray-600">{item.stars}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 w-8">
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <div className="text-sm text-gray-600 mb-1">Communication</div>
          <div className="flex items-center space-x-2">
            <StarRating rating={summary.communicationScore} size="sm" showValue={false} readonly />
            <span className="text-sm font-medium">{summary.communicationScore.toFixed(1)}</span>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600 mb-1">Quality</div>
          <div className="flex items-center space-x-2">
            <StarRating rating={summary.qualityScore} size="sm" showValue={false} readonly />
            <span className="text-sm font-medium">{summary.qualityScore.toFixed(1)}</span>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600 mb-1">Timeliness</div>
          <div className="flex items-center space-x-2">
            <StarRating rating={summary.timelinesScore} size="sm" showValue={false} readonly />
            <span className="text-sm font-medium">{summary.timelinesScore.toFixed(1)}</span>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600 mb-1">Professionalism</div>
          <div className="flex items-center space-x-2">
            <StarRating rating={summary.professionalismScore} size="sm" showValue={false} readonly />
            <span className="text-sm font-medium">{summary.professionalismScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-center">
        <div>
          <div className="text-lg font-bold text-green-600">
            {(summary.completionRate * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-blue-600">
            {summary.verifiedReviewsCount}
          </div>
          <div className="text-sm text-gray-600">Verified Reviews</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-purple-600">
            {summary.qualityScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Quality Score</div>
        </div>
      </div>
    </div>
  )
}