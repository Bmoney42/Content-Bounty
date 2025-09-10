import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Rating, ReviewSummary, UserStats, RatingFormData, RatingFilters } from '../types/rating'

class RatingService {
  private ratingsCollection = 'ratings'
  private reviewSummariesCollection = 'reviewSummaries'
  private userStatsCollection = 'userStats'

  // Create a new rating/review
  async submitRating(
    bountyId: string,
    raterId: string,
    ratedUserId: string,
    raterType: 'creator' | 'business',
    ratedUserType: 'creator' | 'business',
    bountyTitle: string,
    bountyCategory: string,
    ratingData: RatingFormData
  ): Promise<string> {
    try {
      const rating: Omit<Rating, 'id'> = {
        bountyId,
        raterId,
        ratedUserId,
        raterType,
        ratedUserType,
        ...ratingData,
        bountyTitle,
        bountyCategory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: true // Since it's from a completed bounty
      }

      const docRef = await addDoc(collection(db, this.ratingsCollection), {
        ...rating,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Update user's review summary and stats
      await this.updateUserSummaryAndStats(ratedUserId, ratedUserType)

      return docRef.id
    } catch (error) {
      console.error('Error submitting rating:', error)
      throw error
    }
  }

  // Get ratings for a specific user
  async getUserRatings(
    userId: string,
    filters?: RatingFilters
  ): Promise<Rating[]> {
    try {
      let q = query(
        collection(db, this.ratingsCollection),
        where('ratedUserId', '==', userId)
      )

      // Apply filters
      if (filters?.minRating) {
        q = query(q, where('overallRating', '>=', filters.minRating))
      }

      if (filters?.raterType) {
        q = query(q, where('raterType', '==', filters.raterType))
      }

      if (filters?.category) {
        q = query(q, where('bountyCategory', '==', filters.category))
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'))
          break
        case 'oldest':
          q = query(q, orderBy('createdAt', 'asc'))
          break
        case 'highest':
          q = query(q, orderBy('overallRating', 'desc'))
          break
        case 'lowest':
          q = query(q, orderBy('overallRating', 'asc'))
          break
        default:
          q = query(q, orderBy('createdAt', 'desc'))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Rating[]
    } catch (error) {
      console.error('Error getting user ratings:', error)
      return []
    }
  }

  // Get review summary for a user
  async getUserReviewSummary(userId: string): Promise<ReviewSummary | null> {
    try {
      const docRef = doc(db, this.reviewSummariesCollection, userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          userId: docSnap.id,
          userType: data.userType || 'creator',
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          communicationScore: data.communicationScore || 0,
          qualityScore: data.qualityScore || 0,
          timelinesScore: data.timelinesScore || 0,
          professionalismScore: data.professionalismScore || 0,
          fiveStars: data.fiveStars || 0,
          fourStars: data.fourStars || 0,
          threeStars: data.threeStars || 0,
          twoStars: data.twoStars || 0,
          oneStar: data.oneStar || 0,
          recentReviews: data.recentReviews || [],
          verifiedReviewsCount: data.verifiedReviewsCount || 0,
          completionRate: data.completionRate || 0,
          lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || data.lastUpdated,
        } as ReviewSummary
      }
      
      return null
    } catch (error) {
      console.error('Error getting review summary:', error)
      return null
    }
  }

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const docRef = doc(db, this.userStatsCollection, userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          userId: docSnap.id,
          userType: data.userType || 'creator',
          totalBounties: data.totalBounties || 0,
          completedBounties: data.completedBounties || 0,
          cancelledBounties: data.cancelledBounties || 0,
          completionRate: data.completionRate || 0,
          approvedSubmissions: data.approvedSubmissions || 0,
          rejectedSubmissions: data.rejectedSubmissions || 0,
          revisionRequests: data.revisionRequests || 0,
          qualityScore: data.qualityScore || 0,
          averageCompletionTime: data.averageCompletionTime || 0,
          onTimeDeliveries: data.onTimeDeliveries || 0,
          lateDeliveries: data.lateDeliveries || 0,
          totalEarnings: data.totalEarnings || 0,
          totalSpent: data.totalSpent || 0,
          averageBountyValue: data.averageBountyValue || 0,
          joinDate: data.joinDate?.toDate?.()?.toISOString() || data.joinDate,
          lastActiveDate: data.lastActiveDate?.toDate?.()?.toISOString() || data.lastActiveDate,
          responsivenesScore: data.responsivenesScore || 0,
          trustLevel: data.trustLevel || 'new',
          badges: data.badges || [],
          lastCalculated: data.lastCalculated?.toDate?.()?.toISOString() || data.lastCalculated,
        } as UserStats
      }
      
      return null
    } catch (error) {
      console.error('Error getting user stats:', error)
      return null
    }
  }

  // Check if user can rate another user for a specific bounty
  async canUserRate(raterId: string, ratedUserId: string, bountyId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.ratingsCollection),
        where('raterId', '==', raterId),
        where('ratedUserId', '==', ratedUserId),
        where('bountyId', '==', bountyId)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.empty // Can rate if no existing rating
    } catch (error) {
      console.error('Error checking rating eligibility:', error)
      return false
    }
  }

  // Update user's review summary and stats (called after new rating)
  private async updateUserSummaryAndStats(userId: string, userType: 'creator' | 'business'): Promise<void> {
    try {
      // Get all ratings for this user
      const ratings = await this.getUserRatings(userId)
      
      if (ratings.length === 0) return

      // Calculate summary statistics
      const summary = this.calculateReviewSummary(userId, userType, ratings)
      const stats = await this.calculateUserStats(userId, userType, ratings)

      // Update summary document
      const summaryRef = doc(db, this.reviewSummariesCollection, userId)
      await updateDoc(summaryRef, {
        ...summary,
        lastUpdated: serverTimestamp(),
      })

      // Update stats document
      const statsRef = doc(db, this.userStatsCollection, userId)
      await updateDoc(statsRef, {
        ...stats,
        lastCalculated: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating user summary and stats:', error)
    }
  }

  // Calculate review summary from ratings
  private calculateReviewSummary(userId: string, userType: 'creator' | 'business', ratings: Rating[]): Omit<ReviewSummary, 'lastUpdated'> {
    const totalReviews = ratings.length
    
    if (totalReviews === 0) {
      return {
        userId,
        userType,
        averageRating: 0,
        totalReviews: 0,
        communicationScore: 0,
        qualityScore: 0,
        timelinesScore: 0,
        professionalismScore: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
        recentReviews: [],
        verifiedReviewsCount: 0,
        completionRate: 0,
      }
    }

    // Calculate averages
    const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews
    const communicationScore = ratings.reduce((sum, r) => sum + r.communicationRating, 0) / totalReviews
    const qualityScore = ratings.reduce((sum, r) => sum + r.qualityRating, 0) / totalReviews
    const timelinesScore = ratings.reduce((sum, r) => sum + r.timelinesRating, 0) / totalReviews
    const professionalismScore = ratings.reduce((sum, r) => sum + r.professionalismRating, 0) / totalReviews

    // Calculate distribution
    const fiveStars = ratings.filter(r => r.overallRating === 5).length
    const fourStars = ratings.filter(r => r.overallRating === 4).length
    const threeStars = ratings.filter(r => r.overallRating === 3).length
    const twoStars = ratings.filter(r => r.overallRating === 2).length
    const oneStar = ratings.filter(r => r.overallRating === 1).length

    // Get recent reviews (last 5)
    const recentReviews = ratings.slice(0, 5)

    // Count verified reviews
    const verifiedReviewsCount = ratings.filter(r => r.isVerified).length

    return {
      userId,
      userType,
      averageRating,
      totalReviews,
      communicationScore,
      qualityScore,
      timelinesScore,
      professionalismScore,
      fiveStars,
      fourStars,
      threeStars,
      twoStars,
      oneStar,
      recentReviews,
      verifiedReviewsCount,
      completionRate: 0.85, // This would be calculated from bounty completion data
    }
  }

  // Calculate user stats (this would integrate with bounty data)
  private async calculateUserStats(userId: string, userType: 'creator' | 'business', ratings: Rating[]): Promise<Omit<UserStats, 'lastCalculated'>> {
    // This is a simplified version - in a real implementation, 
    // you'd fetch bounty data to calculate accurate completion rates, etc.
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length 
      : 0

    let trustLevel: UserStats['trustLevel'] = 'new'
    if (averageRating >= 4.8 && ratings.length >= 20) trustLevel = 'top_rated'
    else if (averageRating >= 4.5 && ratings.length >= 10) trustLevel = 'established'
    else if (averageRating >= 4.0 && ratings.length >= 5) trustLevel = 'emerging'

    const badges: string[] = []
    if (ratings.length >= 50) badges.push('Veteran')
    if (averageRating >= 4.8) badges.push('Excellence')
    if (ratings.filter(r => r.timelinesRating >= 4.5).length / ratings.length >= 0.9) {
      badges.push('On-Time Delivery')
    }

    return {
      userId,
      userType,
      totalBounties: ratings.length, // Simplified
      completedBounties: ratings.length,
      cancelledBounties: 0,
      completionRate: 0.95,
      approvedSubmissions: ratings.length,
      rejectedSubmissions: Math.floor(ratings.length * 0.1),
      revisionRequests: Math.floor(ratings.length * 0.2),
      qualityScore: ratings.reduce((sum, r) => sum + r.qualityRating, 0) / ratings.length || 0,
      averageCompletionTime: 5.5,
      onTimeDeliveries: Math.floor(ratings.length * 0.9),
      lateDeliveries: Math.floor(ratings.length * 0.1),
      averageBountyValue: 250,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveDate: new Date().toISOString(),
      responsivenesScore: 4.6,
      trustLevel,
      badges,
    }
  }

  // Real-time listener for user ratings
  subscribeToUserRatings(userId: string, callback: (ratings: Rating[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.ratingsCollection),
      where('ratedUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    return onSnapshot(q, (snapshot) => {
      const ratings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Rating[]

      callback(ratings)
    })
  }
}

export const ratingService = new RatingService()
export default ratingService