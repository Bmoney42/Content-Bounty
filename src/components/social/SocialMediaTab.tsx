import React, { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  TrendingUp, 
  Award, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { socialMediaService } from '../../services/socialMedia'
import { SocialPlatform, SocialConnections, PlatformConnectionStatus } from '../../types/social'
import PlatformCard from './PlatformCard'

const SocialMediaTab: React.FC = () => {
  const { user } = useAuth()
  const [socialConnections, setSocialConnections] = useState<SocialConnections | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<PlatformConnectionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingPlatform, setRefreshingPlatform] = useState<SocialPlatform | null>(null)
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null)

  const platforms: SocialPlatform[] = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter']

  const loadSocialConnections = useCallback(async () => {
    try {
      setLoading(true)
      const connections = await socialMediaService.getUserSocialConnections(user!.id)
      const status = await socialMediaService.getConnectionStatus(user!.id)
      
      setSocialConnections(connections)
      setConnectionStatus(status)
    } catch (error) {
      console.error('Error loading social connections:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?.id) {
      loadSocialConnections()
    }
  }, [user, loadSocialConnections])

  const handleConnectPlatform = async (platform: SocialPlatform) => {
    try {
      setConnectingPlatform(platform)
      
      const oauthUrl = socialMediaService.getOAuthUrl(platform)
      
      if (oauthUrl) {
        // Open OAuth popup
        const popup = window.open(
          oauthUrl,
          `${platform}_oauth`,
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        if (!popup) {
          alert('Popup blocked! Please allow popups for this site.')
          setConnectingPlatform(null)
          return
        }

        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            if (event.data.success) {
              // OAuth was successful, refresh the connections
              loadSocialConnections()
              alert(`${platform} connected successfully!`)
            } else {
              alert(`Failed to connect ${platform}. Please try again.`)
            }
            setConnectingPlatform(null)
            window.removeEventListener('message', handleMessage)
          }
        }

        window.addEventListener('message', handleMessage)

        // Check if popup was closed manually (with COOP error handling)
        let hasCoopError = false
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkClosed)
              setConnectingPlatform(null)
              window.removeEventListener('message', handleMessage)
            }
          } catch (error) {
            // COOP policy blocks popup.closed access, use timeout instead
            if (!hasCoopError) {
              console.warn('COOP policy detected - using timeout fallback for popup detection')
              hasCoopError = true
            }
            clearInterval(checkClosed)
            
            // Set a timeout to clean up if no message is received
            setTimeout(() => {
              setConnectingPlatform(null)
              window.removeEventListener('message', handleMessage)
            }, 30000) // 30 second timeout
          }
        }, 1000)

      } else {
        alert(`${platform} OAuth is not configured yet.`)
        setConnectingPlatform(null)
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      alert('Failed to connect platform. Please try again.')
      setConnectingPlatform(null)
    }
  }



  const handleDisconnectPlatform = async (platform: SocialPlatform) => {
    try {
      const success = await socialMediaService.disconnectPlatform(user!.id, platform)
      if (success) {
        await loadSocialConnections()
        alert(`${platform} disconnected successfully!`)
      } else {
        alert('Failed to disconnect platform. Please try again.')
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      alert('Failed to disconnect platform. Please try again.')
    }
  }

  const handleRefreshPlatform = async (platform: SocialPlatform) => {
    try {
      setRefreshingPlatform(platform)
      const success = await socialMediaService.refreshPlatformStats(user!.id, platform)
      if (success) {
        await loadSocialConnections()
        alert(`${platform} stats refreshed successfully!`)
      } else {
        alert('Failed to refresh stats. Please try again.')
      }
    } catch (error) {
      console.error('Error refreshing platform:', error)
      alert('Failed to refresh stats. Please try again.')
    } finally {
      setRefreshingPlatform(null)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading social media connections...</p>
        </div>
      </div>
    )
  }

  const connectedPlatforms = platforms.filter(platform => 
    socialConnections?.platforms[platform]?.isConnected
  )

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(socialConnections?.totalReach || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Reach</div>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {connectedPlatforms.length}
              </div>
              <div className="text-sm text-gray-500">Connected Platforms</div>
            </div>
          </div>
        </div>

      </div>

      {/* Platform Connection Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connected Platforms</h3>
            <p className="text-sm text-gray-500">
              {connectedPlatforms.length} of {platforms.length} platforms connected
            </p>
          </div>
          <button
            onClick={loadSocialConnections}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(platform => (
            <PlatformCard
              key={platform}
              platform={platform}
              platformData={socialConnections?.platforms[platform]}
              onConnect={handleConnectPlatform}
              onDisconnect={handleDisconnectPlatform}
              onRefresh={handleRefreshPlatform}
              isLoading={connectingPlatform === platform || refreshingPlatform === platform}
            />
          ))}
        </div>
      </div>

      {/* Connection Tips */}
      {connectedPlatforms.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Connect Your Social Media</h4>
              <p className="text-sm text-blue-700">
                Connect your social media accounts to showcase your reach and engagement to businesses. 
                This helps you get matched with better bounties and increases your earning potential.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialMediaTab
