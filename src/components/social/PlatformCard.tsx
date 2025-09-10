import React from 'react'
import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Link,
  Unlink
} from 'lucide-react'
import { SocialPlatform, SocialPlatformData } from '../../types/social'

interface PlatformCardProps {
  platform: SocialPlatform
  platformData?: SocialPlatformData
  onConnect: (platform: SocialPlatform) => void
  onDisconnect: (platform: SocialPlatform) => void
  onRefresh: (platform: SocialPlatform) => void
  isLoading?: boolean
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  platformData,
  onConnect,
  onDisconnect,
  onRefresh,
  isLoading = false
}) => {
  const isConnected = platformData?.isConnected || false
  const isExpired = platformData?.expiresAt ? new Date(platformData.expiresAt) < new Date() : false

  const getPlatformIcon = () => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-6 h-6" />
      case 'instagram':
        return <Instagram className="w-6 h-6" />
      case 'facebook':
        return <Facebook className="w-6 h-6" />
      case 'twitter':
        return <Twitter className="w-6 h-6" />
      case 'tiktok':
        return <div className="w-6 h-6 bg-black text-white rounded flex items-center justify-center text-xs font-bold">T</div>
      default:
        return <Link className="w-6 h-6" />
    }
  }

  const getPlatformColor = () => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-500'
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'twitter':
        return 'bg-blue-400'
      case 'tiktok':
        return 'bg-black'
      default:
        return 'bg-gray-500'
    }
  }

  const getPlatformName = () => {
    switch (platform) {
      case 'youtube':
        return 'YouTube'
      case 'instagram':
        return 'Instagram'
      case 'facebook':
        return 'Facebook'
      case 'twitter':
        return 'Twitter'
      case 'tiktok':
        return 'TikTok'
      default:
        return platform
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

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Expired</span>
        </div>
      )
    }
    
    if (isConnected) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle className="w-3 h-3" />
          <span>Connected</span>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
        <Link className="w-3 h-3" />
        <span>Not Connected</span>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      isConnected 
        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
        : 'border-gray-200 bg-white hover:bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getPlatformColor()}`}>
            {getPlatformIcon()}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{getPlatformName()}</h4>
            {getStatusBadge()}
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onRefresh(platform)}
              disabled={isLoading}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Refresh stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {platformData?.stats?.platformUrl && (
              <a
                href={platformData.stats.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-500 hover:text-gray-700"
                title="View profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {isConnected && platformData?.stats ? (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(platformData.stats.followers)}
            </div>
            <div className="text-xs text-gray-500">
              {platform === 'youtube' ? 'Subscribers' : 'Followers'}
            </div>
          </div>
          
          {platformData.lastSync && (
            <div className="text-xs text-gray-500 text-center">
              Last updated: {new Date(platformData.lastSync).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            Connect your {getPlatformName()} account to show your stats
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        {isConnected ? (
          <button
            onClick={() => onDisconnect(platform)}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Unlink className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            onClick={() => onConnect(platform)}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Link className="w-4 h-4" />
            <span>Connect</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default PlatformCard
