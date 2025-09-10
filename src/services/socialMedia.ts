import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { 
  SocialPlatform, 
  SocialConnections, 
  SocialPlatformData, 
  PlatformStats, 
  OAuthResponse,
  PlatformConnectionStatus 
} from '../types/social'

class SocialMediaService {
  private socialConnectionsCollection = 'socialConnections'
  private youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || ''
  private youtubeApiBase = 'https://www.googleapis.com/youtube/v3'

  // Get user's social media connections
  async getUserSocialConnections(userId: string): Promise<SocialConnections | null> {
    try {
      console.log('📱 Getting social connections for userId:', userId)
      const docRef = doc(db, this.socialConnectionsCollection, userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('📱 Found existing social connections:', data)
        return {
          userId: docSnap.id,
          platforms: data.platforms || {},
          totalReach: data.totalReach || 0,
          verifiedPlatforms: data.verifiedPlatforms || [],
          averageEngagement: data.averageEngagement || 0,
          lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || data.lastUpdated,
        } as SocialConnections
      }
      
      // Create new social connections document if it doesn't exist
      console.log('📱 Creating new social connections document for userId:', userId)
      const newConnections: Omit<SocialConnections, 'id'> = {
        userId,
        platforms: {},
        lastUpdated: new Date().toISOString(),
        totalReach: 0,
        verifiedPlatforms: [],
        averageEngagement: 0
      }
      
      await setDoc(docRef, newConnections)
      console.log('📱 Created new social connections:', newConnections)
      return { userId, ...newConnections }
    } catch (error) {
      console.error('❌ Error getting social connections:', error)
      return null
    }
  }

  // Connect Instagram account
  async connectInstagram(userId: string, accessToken: string): Promise<boolean> {
    try {
      console.log('📸 Connecting Instagram for userId:', userId)
      // Get Instagram user info using the access token
      const userInfo = await this.getInstagramUserInfo(accessToken)
      
      if (!userInfo) {
        console.error('❌ Failed to get Instagram user information')
        throw new Error('Failed to get Instagram user information')
      }
      
      console.log('📸 Got Instagram user info:', userInfo)

      const platformData: SocialPlatformData = {
        id: `instagram_${userId}`,
        name: 'instagram',
        isConnected: true,
        accessToken,
        userId,
        stats: {
          followers: userInfo.followersCount,
          totalViews: userInfo.mediaCount,
          postsCount: userInfo.mediaCount,
          averageViews: userInfo.averageViews,
          platformUrl: `https://instagram.com/${userInfo.username}`,
          lastUpdated: new Date().toISOString()
        },
        lastSync: new Date().toISOString()
      }

      // Update social connections
      const connections = await this.getUserSocialConnections(userId)
      if (connections) {
        connections.platforms.instagram = platformData
        connections.lastUpdated = new Date().toISOString()
        connections.totalReach = this.calculateTotalReach(connections.platforms)
        connections.averageEngagement = this.calculateAverageEngagement(connections.platforms)

        await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
          platforms: connections.platforms,
          lastUpdated: serverTimestamp(),
          totalReach: connections.totalReach,
          verifiedPlatforms: connections.verifiedPlatforms,
          averageEngagement: connections.averageEngagement
        })
      }

      return true
    } catch (error) {
      console.error('Error connecting Instagram:', error)
      return false
    }
  }

  // Connect Facebook account
  async connectFacebook(userId: string, accessToken: string): Promise<boolean> {
    try {
      console.log('📘 Connecting Facebook for userId:', userId)
      // Get Facebook user info using the access token
      const userInfo = await this.getFacebookUserInfo(accessToken)
      
      if (!userInfo) {
        console.error('❌ Failed to get Facebook user information')
        throw new Error('Failed to get Facebook user information')
      }
      
      console.log('📘 Got Facebook user info:', userInfo)

      const platformData: SocialPlatformData = {
        id: `facebook_${userId}`,
        name: 'facebook',
        isConnected: true,
        accessToken,
        userId,
        stats: {
          followers: userInfo.followersCount,
          totalViews: userInfo.postsCount,
          postsCount: userInfo.postsCount,
          averageViews: userInfo.averageViews,
          platformUrl: `https://facebook.com/${userInfo.id}`,
          lastUpdated: new Date().toISOString()
        },
        lastSync: new Date().toISOString()
      }

      // Update social connections
      const connections = await this.getUserSocialConnections(userId)
      if (connections) {
        connections.platforms.facebook = platformData
        connections.lastUpdated = new Date().toISOString()
        
        // Update total reach and engagement
        connections.totalReach = Object.values(connections.platforms).reduce((total, platform) => 
          total + (platform.stats.followers || 0), 0
        )

        await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
          platforms: connections.platforms,
          lastUpdated: serverTimestamp(),
          totalReach: connections.totalReach,
          averageEngagement: connections.averageEngagement
        })
        
        console.log('✅ Facebook connection updated successfully')
      }

      return true
    } catch (error) {
      console.error('❌ Error connecting Facebook:', error)
      return false
    }
  }

  // Connect TikTok account
  async connectTikTok(userId: string, accessToken: string): Promise<boolean> {
    try {
      console.log('🎵 Connecting TikTok for userId:', userId)
      // Get TikTok user info using the access token
      const userInfo = await this.getTikTokUserInfo(accessToken)
      
      if (!userInfo) {
        console.error('❌ Failed to get TikTok user information')
        throw new Error('Failed to get TikTok user information')
      }
      
      console.log('🎵 Got TikTok user info:', userInfo)

      const platformData: SocialPlatformData = {
        id: `tiktok_${userId}`,
        name: 'tiktok',
        isConnected: true,
        accessToken,
        userId,
        stats: {
          followers: userInfo.followerCount || 0,
          totalViews: userInfo.videoCount || 0,
          postsCount: userInfo.videoCount || 0,
          averageViews: 0, // Would need additional API calls to calculate
          platformUrl: `https://tiktok.com/@${userInfo.displayName}`,
          lastUpdated: new Date().toISOString()
        },
        lastSync: new Date().toISOString()
      }

      // Update social connections
      const connections = await this.getUserSocialConnections(userId)
      if (connections) {
        connections.platforms.tiktok = platformData
        connections.lastUpdated = new Date().toISOString()
        
        // Update total reach and engagement
        connections.totalReach = Object.values(connections.platforms).reduce((total, platform) => 
          total + (platform.stats.followers || 0), 0
        )

        await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
          platforms: connections.platforms,
          lastUpdated: serverTimestamp(),
          totalReach: connections.totalReach,
          averageEngagement: connections.averageEngagement
        })
        
        console.log('✅ TikTok connection updated successfully')
      }

      return true
    } catch (error) {
      console.error('❌ Error connecting TikTok:', error)
      return false
    }
  }

  // Connect YouTube account
  async connectYouTube(userId: string, accessToken: string): Promise<boolean> {
    try {
      console.log('🎥 Connecting YouTube for userId:', userId)
      // Get YouTube channel info using the access token
      const channelInfo = await this.getYouTubeChannelInfo(accessToken)
      
      if (!channelInfo) {
        console.error('❌ Failed to get YouTube channel information')
        throw new Error('Failed to get YouTube channel information')
      }
      
      console.log('🎥 Got YouTube channel info:', channelInfo)

      const platformData: SocialPlatformData = {
        id: `youtube_${userId}`,
        name: 'youtube',
        isConnected: true,
        accessToken,
        userId,
        stats: {
          followers: channelInfo.subscriberCount,
          totalViews: channelInfo.viewCount,
          postsCount: channelInfo.videoCount,
          averageViews: channelInfo.averageViews,
          platformUrl: `https://youtube.com/channel/${channelInfo.channelId}`,
          lastUpdated: new Date().toISOString()
        },
        lastSync: new Date().toISOString()
      }

      // Update social connections
      const connections = await this.getUserSocialConnections(userId)
      if (connections) {
        connections.platforms.youtube = platformData
        connections.lastUpdated = new Date().toISOString()
        connections.totalReach = this.calculateTotalReach(connections.platforms)
        connections.averageEngagement = this.calculateAverageEngagement(connections.platforms)

        await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
          platforms: connections.platforms,
          lastUpdated: serverTimestamp(),
          totalReach: connections.totalReach,
          verifiedPlatforms: connections.verifiedPlatforms,
          averageEngagement: connections.averageEngagement
        })
      }

      return true
    } catch (error) {
      console.error('Error connecting YouTube:', error)
      return false
    }
  }

  // Get Facebook user information
  private async getFacebookUserInfo(accessToken: string) {
    try {
      console.log('📘 Fetching Facebook user info with access token')
      
      // Get user profile information
      const profileUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`
      const profileResponse = await fetch(profileUrl)
      const profileData = await profileResponse.json()

      if (profileData.error) {
        console.error('❌ Facebook API error:', profileData)
        throw new Error(`Facebook API error: ${profileData.error.message || 'Unknown error'}`)
      }

      // Get page information if available (for business accounts)
      let pageData = null
      try {
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        const pagesResponse = await fetch(pagesUrl)
        pageData = await pagesResponse.json()
      } catch (error) {
        console.log('📘 No Facebook pages found or accessible')
      }

      // Calculate basic stats (Facebook Graph API has limited public data)
      const followersCount = pageData?.data?.[0]?.fan_count || 0
      const postsCount = 0 // Would need additional API calls to get post count
      const averageViews = 0 // Would need additional API calls to calculate

      return {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture?.data?.url,
        followersCount,
        postsCount,
        averageViews
      }
    } catch (error) {
      console.error('Error getting Facebook user info:', error)
      return null
    }
  }

  // Get TikTok user information
  private async getTikTokUserInfo(accessToken: string) {
    try {
      console.log('🎵 Fetching TikTok user info with access token')
      
      // Get user profile information
      const userInfoResponse = await fetch('https://open-api.tiktok.com/user/info/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'follower_count', 'following_count', 'likes_count', 'video_count']
        })
      })

      const userInfoData = await userInfoResponse.json()

      if (userInfoData.error) {
        console.error('❌ TikTok API error:', userInfoData)
        throw new Error(`TikTok API error: ${userInfoData.error.message || 'Unknown error'}`)
      }

      const user = userInfoData.data?.user
      if (!user) {
        console.error('❌ No user data in TikTok response')
        return null
      }

      return {
        id: user.open_id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        likesCount: user.likes_count || 0,
        videoCount: user.video_count || 0,
        verified: false // TikTok API doesn't provide verification status
      }
    } catch (error) {
      console.error('Error getting TikTok user info:', error)
      return null
    }
  }

  // Get Instagram user information
  private async getInstagramUserInfo(accessToken: string) {
    try {
      console.log('📸 Fetching Instagram user info with access token')
      
      // Get user profile
      const profileUrl = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      console.log('📸 Instagram API URL:', profileUrl.replace(accessToken, '[REDACTED]'))
      
      const profileResponse = await fetch(profileUrl)
      const profileData = await profileResponse.json()

      console.log('📸 Instagram API response:', profileData)

      if (!profileResponse.ok) {
        console.error('❌ Instagram API error:', profileData)
        throw new Error(`Instagram API error: ${profileData.error?.message || 'Unknown error'}`)
      }

      // Get media data for engagement calculation
      const mediaUrl = `https://graph.instagram.com/me/media?fields=id,media_type,like_count,comments_count&access_token=${accessToken}`
      const mediaResponse = await fetch(mediaUrl)
      const mediaData = await mediaResponse.json()

      // Calculate engagement rate (simplified)
      let totalEngagement = 0
      let totalMedia = 0
      
      if (mediaData.data && mediaData.data.length > 0) {
        mediaData.data.forEach((media: any) => {
          totalEngagement += (media.like_count || 0) + (media.comments_count || 0)
          totalMedia++
        })
      }

      const followersCount = 0 // Instagram Basic Display API doesn't provide follower count

      return {
        id: profileData.id,
        username: profileData.username,
        accountType: profileData.account_type,
        mediaCount: profileData.media_count || 0,
        followersCount,
        averageViews: totalEngagement / Math.max(totalMedia, 1)
      }
    } catch (error) {
      console.error('Error getting Instagram user info:', error)
      return null
    }
  }

  // Get YouTube channel information
  private async getYouTubeChannelInfo(accessToken: string) {
    try {
      console.log('🎥 Fetching YouTube channel info with access token')
      // First get the channel ID
      const channelUrl = `${this.youtubeApiBase}/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
      console.log('🎥 YouTube API URL:', channelUrl.replace(accessToken, '[REDACTED]'))
      
      const channelResponse = await fetch(channelUrl)
      const channelData = await channelResponse.json()

      console.log('🎥 YouTube API response:', channelData)

      if (!channelResponse.ok) {
        console.error('❌ YouTube API error:', channelData)
        throw new Error(`YouTube API error: ${channelData.error?.message || 'Unknown error'}`)
      }

      if (!channelData.items || channelData.items.length === 0) {
        console.error('❌ No YouTube channel found in response')
        throw new Error('No YouTube channel found')
      }

      const channel = channelData.items[0]
      const channelId = channel.id
      const statistics = channel.statistics

      // Get recent videos for engagement calculation
      const videosResponse = await fetch(
        `${this.youtubeApiBase}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&access_token=${accessToken}`
      )
      const videosData = await videosResponse.json()

      const totalViews = parseInt(statistics.viewCount) || 0

      return {
        channelId,
        subscriberCount: parseInt(statistics.subscriberCount) || 0,
        viewCount: parseInt(statistics.viewCount) || 0,
        videoCount: parseInt(statistics.videoCount) || 0,
        averageViews: totalViews / Math.max(parseInt(statistics.videoCount), 1)
      }
    } catch (error) {
      console.error('Error getting YouTube channel info:', error)
      return null
    }
  }

  // Disconnect a platform
  async disconnectPlatform(userId: string, platform: SocialPlatform): Promise<boolean> {
    try {
      const connections = await this.getUserSocialConnections(userId)
      if (connections) {
        delete connections.platforms[platform]
        connections.lastUpdated = new Date().toISOString()
        connections.totalReach = this.calculateTotalReach(connections.platforms)
        connections.averageEngagement = this.calculateAverageEngagement(connections.platforms)

        await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
          platforms: connections.platforms,
          lastUpdated: serverTimestamp(),
          totalReach: connections.totalReach,
          verifiedPlatforms: connections.verifiedPlatforms,
          averageEngagement: connections.averageEngagement
        })
      }

      return true
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      return false
    }
  }

  // Refresh platform stats
  async refreshPlatformStats(userId: string, platform: SocialPlatform): Promise<boolean> {
    try {
      const connections = await this.getUserSocialConnections(userId)
      if (!connections || !connections.platforms[platform]) {
        return false
      }

      const platformData = connections.platforms[platform]!
      
      if (platform === 'youtube' && platformData.accessToken) {
        const channelInfo = await this.getYouTubeChannelInfo(platformData.accessToken)
        if (channelInfo) {
          platformData.stats = {
            followers: channelInfo.subscriberCount,
            totalViews: channelInfo.viewCount,
            engagementRate: channelInfo.engagementRate,
            postsCount: channelInfo.videoCount,
            averageViews: channelInfo.averageViews,
            verified: channelInfo.verified,
            platformUrl: `https://youtube.com/channel/${channelInfo.channelId}`,
            lastUpdated: new Date().toISOString()
          }
          platformData.lastSync = new Date().toISOString()

          await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
            [`platforms.${platform}`]: platformData,
            lastUpdated: serverTimestamp()
          })
        }
      } else if (platform === 'instagram' && platformData.accessToken) {
        const userInfo = await this.getInstagramUserInfo(platformData.accessToken)
        if (userInfo) {
          platformData.stats = {
            followers: userInfo.followersCount,
            totalViews: userInfo.mediaCount,
            engagementRate: userInfo.engagementRate,
            postsCount: userInfo.mediaCount,
            averageViews: userInfo.averageViews,
            verified: userInfo.verified,
            platformUrl: `https://instagram.com/${userInfo.username}`,
            lastUpdated: new Date().toISOString()
          }
          platformData.lastSync = new Date().toISOString()

          await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
            [`platforms.${platform}`]: platformData,
            lastUpdated: serverTimestamp()
          })
        }
      } else if (platform === 'facebook' && platformData.accessToken) {
        const userInfo = await this.getFacebookUserInfo(platformData.accessToken)
        if (userInfo) {
          platformData.stats = {
            followers: userInfo.followersCount,
            totalViews: userInfo.postsCount,
            engagementRate: userInfo.engagementRate,
            postsCount: userInfo.postsCount,
            averageViews: userInfo.averageViews,
            verified: userInfo.verified,
            platformUrl: `https://facebook.com/${userInfo.id}`,
            lastUpdated: new Date().toISOString()
          }
          platformData.lastSync = new Date().toISOString()

          await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
            [`platforms.${platform}`]: platformData,
            lastUpdated: serverTimestamp()
          })
        }
      } else if (platform === 'tiktok' && platformData.accessToken) {
        const userInfo = await this.getTikTokUserInfo(platformData.accessToken)
        if (userInfo) {
          platformData.stats = {
            followers: userInfo.followerCount,
            totalViews: userInfo.videoCount,
            engagementRate: 0, // TikTok API doesn't provide engagement rate directly
            postsCount: userInfo.videoCount,
            averageViews: 0, // Would need additional API calls to calculate
            verified: userInfo.verified,
            platformUrl: `https://tiktok.com/@${userInfo.displayName}`,
            lastUpdated: new Date().toISOString()
          }
          platformData.lastSync = new Date().toISOString()

          await updateDoc(doc(db, this.socialConnectionsCollection, userId), {
            [`platforms.${platform}`]: platformData,
            lastUpdated: serverTimestamp()
          })
        }
      }
      
      return true
    } catch (error) {
      console.error('Error refreshing platform stats:', error)
      return false
    }
  }

  // Get connection status for all platforms
  async getConnectionStatus(userId: string): Promise<PlatformConnectionStatus[]> {
    const platforms: SocialPlatform[] = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter']
    const connections = await this.getUserSocialConnections(userId)
    
    return platforms.map(platform => {
      const platformData = connections?.platforms[platform]
      const isConnected = !!platformData?.isConnected
      const isExpired = platformData?.expiresAt ? new Date(platformData.expiresAt) < new Date() : false
      
      return {
        platform,
        isConnected,
        isExpired,
        lastSync: platformData?.lastSync,
        error: isExpired ? 'Token expired' : undefined
      }
    })
  }

  // Helper methods
  private calculateTotalReach(platforms: SocialConnections['platforms']): number {
    return Object.values(platforms).reduce((total, platform) => {
      return total + (platform?.stats?.followers || 0)
    }, 0)
  }


  // Get OAuth URL for platform
  getOAuthUrl(platform: SocialPlatform): string {
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/oauth/callback`
    
    console.log('🔗 Generating OAuth URL for platform:', platform)
    console.log('🔗 Redirect URI:', redirectUri)
    
    switch (platform) {
      case 'youtube':
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
          console.error('❌ VITE_GOOGLE_CLIENT_ID not found in environment')
          return ''
        }
        const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}&` +
          `response_type=code&` +
          `access_type=offline&` +
          `state=${platform}`
        console.log('🔗 Generated YouTube OAuth URL:', url)
        return url
      
      case 'instagram':
        if (!import.meta.env.VITE_INSTAGRAM_CLIENT_ID) {
          console.error('❌ VITE_INSTAGRAM_CLIENT_ID not found in environment')
          return ''
        }
        return `https://api.instagram.com/oauth/authorize?` +
          `client_id=${import.meta.env.VITE_INSTAGRAM_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=user_profile,user_media&` +
          `response_type=code&` +
          `state=${platform}`
      
      case 'facebook':
        if (!import.meta.env.VITE_FACEBOOK_CLIENT_ID) {
          console.error('❌ VITE_FACEBOOK_CLIENT_ID not found in environment')
          return ''
        }
        const facebookUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${import.meta.env.VITE_FACEBOOK_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=pages_read_engagement,pages_show_list&` +
          `response_type=code&` +
          `state=${platform}`
        console.log('🔗 Generated Facebook OAuth URL:', facebookUrl)
        return facebookUrl
      
      case 'twitter':
        if (!import.meta.env.VITE_TWITTER_CLIENT_ID) {
          console.error('❌ VITE_TWITTER_CLIENT_ID not found in environment')
          return ''
        }
        return `https://twitter.com/i/oauth2/authorize?` +
          `client_id=${import.meta.env.VITE_TWITTER_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=tweet.read%20users.read%20follows.read&` +
          `response_type=code&` +
          `state=${platform}&` +
          `code_challenge=challenge&` +
          `code_challenge_method=plain`
      
      case 'tiktok':
        if (!import.meta.env.VITE_TIKTOK_CLIENT_ID) {
          console.error('❌ VITE_TIKTOK_CLIENT_ID not found in environment')
          return ''
        }
        return `https://www.tiktok.com/auth/authorize/?` +
          `client_key=${import.meta.env.VITE_TIKTOK_CLIENT_ID}&` +
          `scope=user.info.basic,video.list&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${platform}`
      
      default:
        console.error('❌ Unsupported platform:', platform)
        return ''
    }
  }
}

export const socialMediaService = new SocialMediaService()
export default socialMediaService
