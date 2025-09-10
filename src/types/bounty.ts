export interface Bounty {
  id: string
  title: string
  description: string
  category: BountyCategory
  requirements: BountyRequirement[]
  talkingPoints: string[]
  payment: Payment
  businessId: string
  businessName: string
  status: BountyStatus
  createdAt: string
  deadline?: string
  applicationsCount: number
  maxCreators?: number // How many creators will be paid
  maxApplications?: number // How many applications to accept (null = unlimited)
  // Payment tracking for multi-creator bounties
  paidCreatorsCount?: number
  totalPaidAmount?: number
  remainingBudget?: number
  // Escrow payment details
  escrowPayment?: EscrowPayment
  escrowPaymentId?: string
  // Version control for optimistic concurrency
  _version?: number
  _lastModified?: string
  _modifiedBy?: string
}

export type BountyCategory = 
  | 'review'
  | 'interview' 
  | 'tutorial'
  | 'unboxing'
  | 'demo'
  | 'testimonial'
  | 'download'
  | 'announcement'

export type BountyStatus = 
  | 'pending'    // Created but not yet paid/funded
  | 'active'     // Paid and live in marketplace
  | 'paused' 
  | 'in-progress'
  | 'completed'
  | 'cancelled'

export interface BountyRequirement {
  id: string
  type: RequirementType
  description: string
  mandatory: boolean
}

export type RequirementType = 
  | 'platform'
  | 'views'
  | 'followers' 
  | 'engagement'
  | 'content'
  | 'hashtags'
  | 'links'
  | 'duration'

export interface Payment {
  amount: number
  currency: 'USD'
  milestones: PaymentMilestone[]
}

export interface PaymentMilestone {
  id: string
  description: string
  percentage: number
  minimumViews?: number
}

export interface BountyApplication {
  id: string
  bountyId: string
  creatorId: string
  creatorName: string
  message: string
  proposedTimeline: string
  status: ApplicationStatus
  submittedAt: string
  reviewedAt?: string
  bountyTitle?: string
  // Version control for optimistic concurrency
  _version?: number
  _lastModified?: string
  _modifiedBy?: string
}

export type ApplicationStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

// Content file interface for uploaded files
export interface ContentFile {
  id: string
  url: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  storagePath: string
  thumbnailUrl?: string
  duration?: number // for videos/audio
  dimensions?: { width: number; height: number } // for images/videos
}

// Content review status
export type ContentReviewStatus = 
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_changes'
  | 'flagged'

// Content issue for validation
export interface ContentIssue {
  type: 'error' | 'warning' | 'info'
  category: 'quality' | 'compliance' | 'technical' | 'format'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  field?: string
}

// Content validation result
export interface ContentValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: ContentIssue[]
  warnings: string[]
  recommendations: string[]
}

export interface BountySubmission {
  id: string
  bountyId: string
  creatorId: string
  creatorName: string
  contentLinks: string
  description: string
  additionalNotes?: string
  // Updated to use ContentFile instead of basic file info
  contentFiles?: ContentFile[]
  files?: Array<{
    name: string
    size: number
    type: string
  }>
  submittedAt: string
  status: SubmissionStatus
  payoutAmount?: number
  feedback?: string
  reviewedAt?: string
  // Content review fields
  reviewScore?: number
  reviewFeedback?: string
  reviewIssues?: ContentIssue[]
  reviewedBy?: string
  approvedAt?: string
  rejectedAt?: string
}

export type SubmissionStatus = 
  | 'submitted'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'requires_changes'
  | 'rejected'

// Escrow payment interface
export interface EscrowPayment {
  id: string
  bountyId: string
  businessId: string
  creatorId: string
  amount: number
  currency: string
  status: PaymentStatus
  creatorEarnings: number
  stripeCustomerId: string
  stripePaymentIntentId: string
  stripeTransferId?: string
  createdAt: Date
  heldUntil: Date
  releasedAt?: Date
  refundedAt?: Date
  failureReason?: string
  // Version control for optimistic concurrency
  _version?: number
  _lastModified?: string
  _modifiedBy?: string
}

export type PaymentStatus = 
  | 'pending'
  | 'held_in_escrow'
  | 'released'
  | 'refunded'
  | 'failed'