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
  maxApplicants?: number
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
  | 'active'
  | 'paused' 
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
}

export type ApplicationStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface BountySubmission {
  id: string
  bountyId: string
  applicationId: string
  creatorId: string
  contentUrl: string
  platform: string
  views: number
  submittedAt: string
  status: SubmissionStatus
  payoutAmount?: number
}

export type SubmissionStatus = 
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'requires_changes'
  | 'rejected'