export interface User {
  id: string
  uid?: string
  email: string
  name: string
  userType: 'creator' | 'business' | 'admin'
  createdAt: string
  isAdmin?: boolean
  suspended?: boolean
  verified?: boolean
}

export interface Creator extends User {
  userType: 'creator'
  bio?: string
  platforms: Platform[]
  stats: CreatorStats
  portfolio: PortfolioItem[]
}

export interface Business extends User {
  userType: 'business'
  companyName: string
  industry?: string
  website?: string
}

export interface Platform {
  name: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin'
  handle: string
  followers: number
  verified?: boolean
}

export interface CreatorStats {
  totalBountiesCompleted: number
  totalEarned: number
  averageRating: number
  completionRate: number
}

export interface PortfolioItem {
  id: string
  title: string
  url: string
  views: number
  platform: string
  completedAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
  userType: 'creator' | 'business'
  companyName?: string
}