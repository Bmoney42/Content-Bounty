import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/authUtils'
import { socialMediaService } from '../services/socialMedia'
import { 
  SocialConnections, 
  SocialPlatform, 
  PlatformConnectionStatus,
  SocialPlatformData 
} from '../types/social'
import { useToast } from '../utils/toastUtils'

export const useSocialMedia = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [connections, setConnections] = useState<SocialConnections | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<PlatformConnectionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null)
  const [refreshing, setRefreshing] = useState<SocialPlatform | null>(null)

  // Load social media connections
  const loadConnections = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [connectionsData, statuses] = await Promise.all([
        socialMediaService.getUserSocialConnections(user.id),
        socialMediaService.getConnectionStatus(user.id)
      ])
      
      setConnections(connectionsData)
      setConnectionStatuses(statuses)
    } catch (error) {
      console.error('Error loading social connections:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load social media connections'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, addToast])

  // Connect a platform
  const connectPlatform = useCallback(async (platform: SocialPlatform) => {
    if (!user?.id) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please log in to connect social media accounts'
      })
      return
    }

    try {
      setConnecting(platform)
      const oauthUrl = socialMediaService.getOAuthUrl(platform)
      
      if (!oauthUrl) {
        throw new Error(`OAuth not configured for ${platform}`)
      }

      // Redirect to OAuth flow
      window.location.href = oauthUrl
    } catch (error) {
      console.error('Error connecting platform:', error)
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: `Failed to connect ${platform}. Please try again.`
      })
      setConnecting(null)
    }
  }, [user?.id, addToast])

  // Disconnect a platform
  const disconnectPlatform = useCallback(async (platform: SocialPlatform) => {
    if (!user?.id) return

    try {
      const success = await socialMediaService.disconnectPlatform(user.id, platform)
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Disconnected',
          message: `${platform} account disconnected successfully`
        })
        await loadConnections() // Reload connections
      } else {
        throw new Error('Failed to disconnect platform')
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: `Failed to disconnect ${platform}. Please try again.`
      })
    }
  }, [user?.id, addToast, loadConnections])

  // Refresh platform stats
  const refreshPlatformStats = useCallback(async (platform: SocialPlatform) => {
    if (!user?.id) return

    try {
      setRefreshing(platform)
      const success = await socialMediaService.refreshPlatformStats(user.id, platform)
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Stats Updated',
          message: `${platform} statistics refreshed successfully`
        })
        await loadConnections() // Reload connections
      } else {
        throw new Error('Failed to refresh stats')
      }
    } catch (error) {
      console.error('Error refreshing platform stats:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: `Failed to refresh ${platform} statistics. Please try again.`
      })
    } finally {
      setRefreshing(null)
    }
  }, [user?.id, addToast, loadConnections])

  // Get platform data
  const getPlatformData = useCallback((platform: SocialPlatform): SocialPlatformData | null => {
    return connections?.platforms[platform] || null
  }, [connections])

  // Check if platform is connected
  const isPlatformConnected = useCallback((platform: SocialPlatform): boolean => {
    return !!connections?.platforms[platform]?.isConnected
  }, [connections])

  // Get platform connection status
  const getPlatformStatus = useCallback((platform: SocialPlatform): PlatformConnectionStatus | null => {
    return connectionStatuses.find(status => status.platform === platform) || null
  }, [connectionStatuses])

  // Get total reach across all platforms
  const getTotalReach = useCallback((): number => {
    return connections?.totalReach || 0
  }, [connections])

  // Get verified platforms
  const getVerifiedPlatforms = useCallback((): SocialPlatform[] => {
    return connections?.verifiedPlatforms || []
  }, [connections])

  // Get average engagement
  const getAverageEngagement = useCallback((): number => {
    return connections?.averageEngagement || 0
  }, [connections])

  // Get connected platforms count
  const getConnectedPlatformsCount = useCallback((): number => {
    return connectionStatuses.filter(status => status.isConnected && !status.isExpired).length
  }, [connectionStatuses])

  // Load connections on mount and when user changes
  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  return {
    connections,
    connectionStatuses,
    loading,
    connecting,
    refreshing,
    connectPlatform,
    disconnectPlatform,
    refreshPlatformStats,
    loadConnections,
    getPlatformData,
    isPlatformConnected,
    getPlatformStatus,
    getTotalReach,
    getVerifiedPlatforms,
    getAverageEngagement,
    getConnectedPlatformsCount
  }
}
