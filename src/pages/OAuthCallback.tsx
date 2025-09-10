import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { socialMediaService } from '../services/socialMedia'
import { useAuth } from '../hooks/useAuth'

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state') as any
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('Authentication was cancelled or failed')
          return
        }

        if (!code || !state) {
          setStatus('error')
          setMessage('Invalid OAuth response')
          return
        }

        if (!user?.id) {
          setStatus('error')
          setMessage('User not authenticated')
          return
        }

        // Exchange code for access token
        const success = await exchangeCodeForToken(code, state, user.id)
        
        if (success) {
          setStatus('success')
          setMessage(`${state} account connected successfully!`)
        } else {
          setStatus('error')
          setMessage(`Failed to connect ${state} account`)
        }

        // Close the popup and notify the parent window
        setTimeout(() => {
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                platform: state,
                success: success
              }, window.location.origin)
              window.close()
            } else {
              navigate('/profile')
            }
          } catch (error) {
            console.log('Could not communicate with parent window, navigating to profile')
            navigate('/profile')
          }
        }, 2000)

      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage('Failed to complete authentication')
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, user])

  const exchangeCodeForToken = async (code: string, platform: string, userId: string): Promise<boolean> => {
    try {
      // Get the user's Firebase auth token
      // Replace useAuth user.getIdToken with Firebase Auth to ensure method exists
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const currentUser = auth.currentUser
      const authToken = await currentUser?.getIdToken()
      if (!authToken) {
        console.error('No auth token available for OAuth exchange')
        return false
      }
      
      if (platform === 'youtube') {
        // Exchange Google OAuth code for access token via secure API
        const tokenResponse = await fetch('/api/oauth/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            code: code,
            userId: userId
          }),
        })

        const tokenData = await tokenResponse.json()
        
        if (tokenData.access_token) {
          // Connect the platform with the access token
          return await socialMediaService.connectYouTube(userId, tokenData.access_token)
        } else if (tokenData.error) {
          console.error('OAuth API error:', tokenData.error)
        }
      } else if (platform === 'instagram') {
        // Exchange Instagram OAuth code for access token via secure API
        const tokenResponse = await fetch('/api/oauth/instagram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            code: code,
            userId: userId
          }),
        })

        const tokenData = await tokenResponse.json()
        
        if (tokenData.access_token) {
          // Connect the platform with the access token
          return await socialMediaService.connectInstagram(userId, tokenData.access_token)
        } else if (tokenData.error) {
          console.error('Instagram OAuth API error:', tokenData.error)
        }
      } else if (platform === 'facebook') {
        // Exchange Facebook OAuth code for access token via secure API
        const tokenResponse = await fetch('/api/oauth/facebook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            code: code,
            userId: userId
          }),
        })

        const tokenData = await tokenResponse.json()
        
        if (tokenData.access_token) {
          // Connect the platform with the access token
          return await socialMediaService.connectFacebook(userId, tokenData.access_token)
        } else if (tokenData.error) {
          console.error('Facebook OAuth API error:', tokenData.error)
        }
      } else if (platform === 'tiktok') {
        // Exchange TikTok OAuth code for access token via secure API
        const tokenResponse = await fetch('/api/oauth/tiktok', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            code: code,
            userId: userId
          }),
        })

        const tokenData = await tokenResponse.json()
        
        if (tokenData.access_token) {
          // Connect the platform with the access token
          return await socialMediaService.connectTikTok(userId, tokenData.access_token)
        } else if (tokenData.error) {
          console.error('TikTok OAuth API error:', tokenData.error)
        }
      }
      
      return false
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting Account</h2>
            <p className="text-gray-600">Please wait while we complete the authentication...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">This window will close automatically...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuthCallback
