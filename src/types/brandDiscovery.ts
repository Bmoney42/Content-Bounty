export interface BrandLead {
  id: string
  creatorId: string
  brandName: string
  platform: 'instagram' | 'tiktok' | 'youtube' | 'manual'
  sourcePostId?: string
  sourceUrl?: string
  detectedAt: Date
  sponsorshipSignals: string[]
  brandHandle?: string
  websiteUrl?: string
  emailContact?: string
  phoneContact?: string
  industry?: string
  estimatedBudget?: number
  engagementRate?: number
  followerCount?: number
  status: 'new' | 'contacted' | 'responded' | 'negotiating' | 'closed' | 'rejected'
  notes?: string
  lastContactDate?: Date
  nextFollowUpDate?: Date
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  updatedAt: Date
}

export interface ScrapingJob {
  id: string
  creatorId: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  leadsFound: number
  errors?: string[]
  progress: number
}

export interface SponsorshipSignal {
  type: 'hashtag' | 'text' | 'tagged_account' | 'bio_link'
  value: string
  confidence: number
  context: string
}

export interface BrandDiscoveryFilters {
  status?: BrandLead['status']
  platform?: BrandLead['platform']
  priority?: BrandLead['priority']
  industry?: string
  tags?: string[]
}

export interface AddBrandLeadData {
  brandName: string
  platform: BrandLead['platform']
  sourceUrl?: string
  brandHandle?: string
  websiteUrl?: string
  emailContact?: string
  phoneContact?: string
  industry?: string
  estimatedBudget?: number
  sponsorshipSignals: string[]
  notes?: string
  tags: string[]
  priority: BrandLead['priority']
}

// Sponsorship signal detection patterns
export const SPONSORSHIP_PATTERNS = {
  hashtags: ['#ad', '#sponsored', '#partnership', '#collab', '#brandambassador', '#paidpartnership'],
  text: [
    'paid partnership with',
    'sponsored by',
    'in collaboration with',
    'thanks to',
    'partnered with',
    'brand ambassador',
    'sponsored content'
  ],
  bioKeywords: ['brand ambassador', 'influencer', 'creator', 'collaborations', 'partnerships']
} as const

// Platform-specific scraping configurations
export const PLATFORM_CONFIGS = {
  instagram: {
    actorId: 'apify/instagram-scraper',
    searchFields: ['hashtags', 'searchTerms'],
    resultFields: ['caption', 'hashtags', 'mentions', 'url', 'ownerUsername']
  },
  tiktok: {
    actorId: 'clockworks/tiktok-scraper',
    searchFields: ['searchTerms', 'hashtags'],
    resultFields: ['desc', 'hashtags', 'mentions', 'videoUrl', 'authorMeta.name']
  },
  youtube: {
    actorId: 'apify/youtube-scraper',
    searchFields: ['searchTerms'],
    resultFields: ['title', 'description', 'tags', 'url', 'channelTitle']
  }
} as const

