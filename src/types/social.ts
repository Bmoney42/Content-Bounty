export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter'

export interface PlatformStats {
  followers: number
  totalViews?: number
  postsCount: number
  averageViews?: number
  platformUrl: string
  lastUpdated: string
}

export interface SocialPlatformData {
  id: string
  name: SocialPlatform
  isConnected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  stats?: PlatformStats
  lastSync?: string
  userId: string
}

export interface SocialConnections {
  userId: string
  platforms: {
    youtube?: SocialPlatformData
    instagram?: SocialPlatformData
    tiktok?: SocialPlatformData
    facebook?: SocialPlatformData
    twitter?: SocialPlatformData
  }
  lastUpdated: string
  totalReach: number
}

export interface CreatorSocialStats {
  totalReach: number
  topPlatform: SocialPlatform
  crossPlatformPresence: number
  platformBreakdown: {
    [key in SocialPlatform]?: {
      followers: number
      postsCount: number
    }
  }
}

export interface SocialMediaFilters {
  platforms: SocialPlatform[]
  minFollowers: number
  maxFollowers: number
  platformSpecific: {
    youtube?: { minSubscribers: number }
    tiktok?: { minFollowers: number }
    instagram?: { minFollowers: number }
    facebook?: { minFollowers: number }
    twitter?: { minFollowers: number }
  }
}

export interface OAuthResponse {
  accessToken: string
  refreshToken?: string
  expiresAt: string
  platform: SocialPlatform
  userId: string
}

export interface PlatformConnectionStatus {
  platform: SocialPlatform
  isConnected: boolean
  isExpired: boolean
  lastSync?: string
  error?: string
}
