export interface Rating {
  id: string
  bountyId: string
  raterId: string // ID of person giving the rating
  ratedUserId: string // ID of person being rated
  raterType: 'creator' | 'business'
  ratedUserType: 'creator' | 'business'
  
  // Rating scores (1-5 stars)
  overallRating: number
  communicationRating: number
  qualityRating: number
  timelinesRating: number
  professionalismRating: number
  
  // Review content
  review?: string
  title?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  isVerified: boolean // Only from actual completed bounties
  
  // Additional context
  bountyTitle: string
  bountyCategory: string
}

export interface ReviewSummary {
  userId: string
  userType: 'creator' | 'business'
  
  // Overall metrics
  averageRating: number
  totalReviews: number
  
  // Detailed ratings
  communicationScore: number
  qualityScore: number
  timelinesScore: number
  professionalismScore: number
  
  // Rating distribution
  fiveStars: number
  fourStars: number
  threeStars: number
  twoStars: number
  oneStar: number
  
  // Recent reviews (for display)
  recentReviews: Rating[]
  
  // Trust indicators
  verifiedReviewsCount: number
  completionRate: number
  
  lastUpdated: string
}

export interface UserStats {
  userId: string
  userType: 'creator' | 'business'
  
  // Completion metrics
  totalBounties: number
  completedBounties: number
  cancelledBounties: number
  completionRate: number
  
  // Quality metrics
  approvedSubmissions: number
  rejectedSubmissions: number
  revisionRequests: number
  qualityScore: number
  
  // Time metrics
  averageCompletionTime: number // in days
  onTimeDeliveries: number
  lateDeliveries: number
  
  // Financial metrics
  totalEarnings?: number // for creators
  totalSpent?: number // for businesses
  averageBountyValue: number
  
  // Activity metrics
  joinDate: string
  lastActiveDate: string
  responsivenesScore: number // based on message response times
  
  // Trust level
  trustLevel: 'new' | 'emerging' | 'established' | 'top_rated'
  badges: string[]
  
  lastCalculated: string
}

export interface RatingFormData {
  overallRating: number
  communicationRating: number
  qualityRating: number
  timelinesRating: number
  professionalismRating: number
  title: string
  review: string
}

export interface RatingFilters {
  minRating?: number
  category?: string
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest'
  raterType?: 'creator' | 'business'
}

// Helper types for components
export type RatingCategory = 'overall' | 'communication' | 'quality' | 'timeliness' | 'professionalism'

export interface RatingDisplayProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  readonly?: boolean
  category?: RatingCategory
}