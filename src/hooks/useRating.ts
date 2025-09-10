import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Rating, ReviewSummary, UserStats, RatingFormData, RatingFilters } from '../types/rating'
import ratingService from '../services/ratingService'

// Hook to get user ratings
export function useUserRatings(userId: string, filters?: RatingFilters) {
  return useQuery({
    queryKey: ['userRatings', userId, filters],
    queryFn: () => ratingService.getUserRatings(userId, filters),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get user review summary
export function useUserReviewSummary(userId: string) {
  return useQuery({
    queryKey: ['reviewSummary', userId],
    queryFn: () => ratingService.getUserReviewSummary(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to get user stats
export function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => ratingService.getUserStats(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Hook to submit a rating
export function useSubmitRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bountyId,
      raterId,
      ratedUserId,
      raterType,
      ratedUserType,
      bountyTitle,
      bountyCategory,
      ratingData
    }: {
      bountyId: string
      raterId: string
      ratedUserId: string
      raterType: 'creator' | 'business'
      ratedUserType: 'creator' | 'business'
      bountyTitle: string
      bountyCategory: string
      ratingData: RatingFormData
    }) => {
      return ratingService.submitRating(
        bountyId,
        raterId,
        ratedUserId,
        raterType,
        ratedUserType,
        bountyTitle,
        bountyCategory,
        ratingData
      )
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userRatings', variables.ratedUserId] })
      queryClient.invalidateQueries({ queryKey: ['reviewSummary', variables.ratedUserId] })
      queryClient.invalidateQueries({ queryKey: ['userStats', variables.ratedUserId] })
    },
  })
}

// Hook to check if user can rate
export function useCanUserRate(raterId: string, ratedUserId: string, bountyId: string) {
  return useQuery({
    queryKey: ['canRate', raterId, ratedUserId, bountyId],
    queryFn: () => ratingService.canUserRate(raterId, ratedUserId, bountyId),
    enabled: !!raterId && !!ratedUserId && !!bountyId,
  })
}

// Hook for real-time rating updates
export function useRealTimeRatings(userId: string) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    const unsubscribe = ratingService.subscribeToUserRatings(userId, (newRatings) => {
      setRatings(newRatings)
      setIsLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { ratings, isLoading }
}

// Hook for rating form state management
export function useRatingForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<{
    id: string
    name: string
    type: 'creator' | 'business'
  } | null>(null)
  const [bountyData, setBountyData] = useState<{
    id: string
    title: string
    category: string
  } | null>(null)

  const openRatingForm = useCallback((
    user: { id: string; name: string; type: 'creator' | 'business' },
    bounty: { id: string; title: string; category: string }
  ) => {
    setTargetUser(user)
    setBountyData(bounty)
    setIsOpen(true)
  }, [])

  const closeRatingForm = useCallback(() => {
    setIsOpen(false)
    setTargetUser(null)
    setBountyData(null)
  }, [])

  return {
    isOpen,
    targetUser,
    bountyData,
    openRatingForm,
    closeRatingForm,
  }
}

// Hook to calculate trust level based on stats
export function useTrustLevel(reviewSummary: ReviewSummary | null, userStats: UserStats | null) {
  return useCallback(() => {
    if (!reviewSummary || !userStats) return 'new'

    const { averageRating, totalReviews, completionRate } = reviewSummary
    const { totalBounties } = userStats

    if (averageRating >= 4.8 && totalReviews >= 20 && completionRate >= 0.95) {
      return 'top_rated'
    } else if (averageRating >= 4.5 && totalReviews >= 10 && completionRate >= 0.90) {
      return 'established'
    } else if (averageRating >= 4.0 && totalReviews >= 5 && completionRate >= 0.85) {
      return 'emerging'
    }
    
    return 'new'
  }, [reviewSummary, userStats])
}

// Hook to get rating statistics for dashboard
export function useRatingStats(userId: string, userType: 'creator' | 'business') {
  const { data: summary } = useUserReviewSummary(userId)
  const { data: stats } = useUserStats(userId)

  return useCallback(() => {
    if (!summary || !stats) return null

    return {
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      completionRate: summary.completionRate,
      qualityScore: summary.qualityScore,
      trustLevel: stats.trustLevel,
      badges: stats.badges,
      recentTrend: summary.recentReviews.length >= 5 
        ? summary.recentReviews.slice(0, 5).reduce((sum, r) => sum + r.overallRating, 0) / 5
        : summary.averageRating,
    }
  }, [summary, stats])
}