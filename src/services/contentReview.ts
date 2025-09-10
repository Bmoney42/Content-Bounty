import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FileUploadService, ContentFile } from './fileUpload'

// Content review status
export type ContentReviewStatus = 
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_changes'
  | 'flagged'

// Content validation result
export interface ContentValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: ContentIssue[]
  warnings: string[]
  recommendations: string[]
}

// Content issue
export interface ContentIssue {
  type: 'error' | 'warning' | 'info'
  category: 'quality' | 'compliance' | 'technical' | 'format'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  field?: string
}

// Content review
export interface ContentReview {
  id: string
  bountyId: string
  submissionId: string
  reviewerId: string
  reviewerName: string
  status: ContentReviewStatus
  score: number
  feedback: string
  issues: ContentIssue[]
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Content submission with review data
export interface ContentSubmission {
  id: string
  bountyId: string
  creatorId: string
  creatorName: string
  contentFiles: ContentFile[]
  description: string
  additionalNotes?: string
  submittedAt: Date
  status: ContentReviewStatus
  reviewScore?: number
  reviewFeedback?: string
  reviewIssues?: ContentIssue[]
  reviewedBy?: string
  reviewedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
}

export class ContentReviewService {
  // Validate content submission
  static async validateContent(submission: Partial<ContentSubmission>): Promise<ContentValidationResult> {
    const issues: ContentIssue[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Check required fields
    if (!submission.description || submission.description.trim().length < 10) {
      issues.push({
        type: 'error',
        category: 'quality',
        message: 'Description must be at least 10 characters long',
        severity: 'medium',
        field: 'description'
      })
      score -= 20
    }

    if (!submission.contentFiles || submission.contentFiles.length === 0) {
      issues.push({
        type: 'error',
        category: 'quality',
        message: 'At least one content file is required',
        severity: 'high',
        field: 'contentFiles'
      })
      score -= 30
    }

    // Validate content files
    if (submission.contentFiles) {
      for (const file of submission.contentFiles) {
        // Check file size
        if (file.fileSize > 100 * 1024 * 1024) { // 100MB
          issues.push({
            type: 'warning',
            category: 'technical',
            message: `File ${file.fileName} is very large (${FileUploadService.formatFileSize(file.fileSize)})`,
            severity: 'medium',
            field: 'contentFiles'
          })
          score -= 5
        }

        // Check file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
          'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
          'application/pdf', 'text/plain'
        ]

        if (!allowedTypes.includes(file.fileType)) {
          issues.push({
            type: 'error',
            category: 'technical',
            message: `File type ${file.fileType} is not supported`,
            severity: 'high',
            field: 'contentFiles'
          })
          score -= 15
        }
      }
    }

    // Check description quality
    if (submission.description) {
      const description = submission.description.trim()
      
      if (description.length < 50) {
        warnings.push('Consider providing a more detailed description')
        score -= 5
      }

      if (description.length > 1000) {
        warnings.push('Description is quite long - consider being more concise')
        score -= 3
      }

      // Check for common issues
      if (description.toLowerCase().includes('test') && description.length < 100) {
        issues.push({
          type: 'warning',
          category: 'quality',
          message: 'Description appears to be a test submission',
          severity: 'medium',
          field: 'description'
        })
        score -= 10
      }
    }

    // Generate recommendations
    if (score < 70) {
      recommendations.push('Please address the issues above before submitting')
    }

    if (submission.contentFiles && submission.contentFiles.length === 1) {
      recommendations.push('Consider providing multiple content files for better review')
    }

    if (!submission.additionalNotes) {
      recommendations.push('Consider adding additional notes to provide context')
    }

    return {
      isValid: score >= 60,
      score: Math.max(0, score),
      issues,
      warnings,
      recommendations
    }
  }

  // Create content review
  static async createReview(
    bountyId: string,
    submissionId: string,
    reviewerId: string,
    reviewerName: string,
    status: ContentReviewStatus,
    feedback: string,
    score: number,
    issues: ContentIssue[] = []
  ): Promise<string> {
    const reviewData: ContentReview = {
      id: `${submissionId}_${reviewerId}`,
      bountyId,
      submissionId,
      reviewerId,
      reviewerName,
      status,
      score,
      feedback,
      issues,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (status === 'approved') {
      reviewData.approvedAt = new Date()
    } else if (status === 'rejected') {
      reviewData.rejectedAt = new Date()
    }

    const reviewRef = doc(db, 'content_reviews', reviewData.id)
    await setDoc(reviewRef, {
      ...reviewData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: reviewData.approvedAt ? serverTimestamp() : null,
      rejectedAt: reviewData.rejectedAt ? serverTimestamp() : null
    })

    // Update submission status
    await this.updateSubmissionStatus(submissionId, status, score, feedback, issues)

    return reviewData.id
  }

  // Update submission status
  static async updateSubmissionStatus(
    submissionId: string,
    status: ContentReviewStatus,
    score?: number,
    feedback?: string,
    issues?: ContentIssue[]
  ): Promise<void> {
    const submissionRef = doc(db, 'submissions', submissionId)
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    }

    if (score !== undefined) updateData.reviewScore = score
    if (feedback) updateData.reviewFeedback = feedback
    if (issues) updateData.reviewIssues = issues

    if (status === 'approved') {
      updateData.approvedAt = serverTimestamp()
    } else if (status === 'rejected') {
      updateData.rejectedAt = serverTimestamp()
    }

    await updateDoc(submissionRef, updateData)
  }

  // Get content review
  static async getReview(reviewId: string): Promise<ContentReview | null> {
    try {
      const reviewRef = doc(db, 'content_reviews', reviewId)
      const reviewSnap = await getDoc(reviewRef)
      
      if (reviewSnap.exists()) {
        const data = reviewSnap.data()
        return {
          id: reviewSnap.id,
          bountyId: data.bountyId,
          submissionId: data.submissionId,
          reviewerId: data.reviewerId,
          reviewerName: data.reviewerName,
          status: data.status,
          score: data.score,
          feedback: data.feedback,
          issues: data.issues || [],
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ContentReview
      }
      
      return null
    } catch (error) {
      console.error('Error getting content review:', error)
      throw error
    }
  }

  // Get reviews for a submission
  static async getSubmissionReviews(submissionId: string): Promise<ContentReview[]> {
    try {
      const reviewsRef = collection(db, 'content_reviews')
      const q = query(reviewsRef, where('submissionId', '==', submissionId))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          bountyId: data.bountyId,
          submissionId: data.submissionId,
          reviewerId: data.reviewerId,
          reviewerName: data.reviewerName,
          status: data.status,
          score: data.score,
          feedback: data.feedback,
          issues: data.issues || [],
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ContentReview
      })
    } catch (error) {
      console.error('Error getting submission reviews:', error)
      throw error
    }
  }

  // Get pending reviews for a reviewer
  static async getPendingReviews(reviewerId: string): Promise<ContentReview[]> {
    try {
      const reviewsRef = collection(db, 'content_reviews')
      const q = query(
        reviewsRef, 
        where('reviewerId', '==', reviewerId),
        where('status', 'in', ['pending_review', 'under_review'])
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          bountyId: data.bountyId,
          submissionId: data.submissionId,
          reviewerId: data.reviewerId,
          reviewerName: data.reviewerName,
          status: data.status,
          score: data.score,
          feedback: data.feedback,
          issues: data.issues || [],
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ContentReview
      })
    } catch (error) {
      console.error('Error getting pending reviews:', error)
      throw error
    }
  }

  // Update review
  static async updateReview(
    reviewId: string,
    updates: Partial<ContentReview>
  ): Promise<void> {
    try {
      const reviewRef = doc(db, 'content_reviews', reviewId)
      await updateDoc(reviewRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  }

  // Auto-validate content using basic rules
  static async autoValidateContent(submission: Partial<ContentSubmission>): Promise<ContentValidationResult> {
    const issues: ContentIssue[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Basic validation rules
    if (!submission.description || submission.description.trim().length < 10) {
      issues.push({
        type: 'error',
        category: 'quality',
        message: 'Description too short',
        severity: 'medium'
      })
      score -= 20
    }

    if (!submission.contentFiles || submission.contentFiles.length === 0) {
      issues.push({
        type: 'error',
        category: 'quality',
        message: 'No content files provided',
        severity: 'high'
      })
      score -= 30
    }

    // Check for suspicious content
    if (submission.description) {
      const suspiciousWords = ['test', 'placeholder', 'dummy', 'sample']
      const hasSuspiciousContent = suspiciousWords.some(word => 
        submission.description!.toLowerCase().includes(word)
      )
      
      if (hasSuspiciousContent) {
        issues.push({
          type: 'warning',
          category: 'quality',
          message: 'Content appears to be test/placeholder content',
          severity: 'medium'
        })
        score -= 15
      }
    }

    return {
      isValid: score >= 60,
      score: Math.max(0, score),
      issues,
      warnings,
      recommendations
    }
  }

  // Get review statistics
  static async getReviewStats(reviewerId?: string): Promise<any> {
    try {
      const reviewsRef = collection(db, 'content_reviews')
      let q = query(reviewsRef)
      
      if (reviewerId) {
        q = query(reviewsRef, where('reviewerId', '==', reviewerId))
      }
      
      const querySnapshot = await getDocs(q)
      const reviews = querySnapshot.docs.map(doc => doc.data())
      
      const stats = {
        total: reviews.length,
        pending: reviews.filter(r => r.status === 'pending_review').length,
        underReview: reviews.filter(r => r.status === 'under_review').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length,
        requiresChanges: reviews.filter(r => r.status === 'requires_changes').length,
        averageScore: reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length 
          : 0
      }
      
      return stats
    } catch (error) {
      console.error('Error getting review stats:', error)
      throw error
    }
  }
}
