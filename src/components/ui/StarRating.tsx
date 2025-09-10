import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { RatingDisplayProps } from '../../types/rating'

interface StarRatingProps extends RatingDisplayProps {
  onRatingChange?: (rating: number) => void
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'md',
  showValue = true,
  readonly = false,
  onRatingChange,
  category
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }
  
  const displayRating = hoverRating || rating
  
  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-200 p-0.5
              ${!readonly ? 'hover:shadow-sm' : ''}
            `}
          >
            <Star
              className={`
                ${sizeClasses[size]} 
                transition-colors duration-200
                ${star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
                }
                ${!readonly && star <= hoverRating ? 'fill-yellow-300 text-yellow-300' : ''}
              `}
            />
          </button>
        ))}
      </div>
      
      {showValue && (
        <span className={`${textSizeClasses[size]} text-gray-600 font-medium ml-2`}>
          {rating > 0 ? rating.toFixed(1) : 'No rating'}
        </span>
      )}
    </div>
  )
}

export default StarRating