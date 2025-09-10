import React, { useState } from 'react'
import { useAuth } from '../utils/authUtils'
import { authenticatedFetch } from '../utils/apiUtils'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface TestResult {
  success?: boolean
  error?: string
  message?: string
  config?: any
  oauth_url?: any
  api_call?: any
}

const YouTubeOAuthTest: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [accessToken, setAccessToken] = useState('')

  const runTest = async (action: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await authenticatedFetch('/api/test-youtube-oauth', {
        method: 'POST',
        body: JSON.stringify({
          action,
          accessToken: action === 'test-api-call' ? accessToken : undefined
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: 'Failed to run test', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube OAuth Test</h1>
          <p className="text-gray-600">
            Test YouTube OAuth configuration and API connectivity
          </p>
        </div>

        {/* Current User Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Type:</strong> {user?.userType || 'N/A'}</p>
          </div>
        </Card>

        {/* Test Actions */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={() => runTest('test-config')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Test Configuration'}
            </Button>
            
            <Button
              onClick={() => runTest('test-oauth-url')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Test OAuth URL'}
            </Button>
            
            <Button
              onClick={() => runTest('test-api-call')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Test API Call'}
            </Button>
          </div>
        </Card>

        {/* Access Token Input for API Test */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Call Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token (for API call test)
              </label>
              <input
                type="text"
                placeholder="Enter YouTube access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-600">
              Get an access token by going through the YouTube OAuth flow, then paste it here to test the API call.
            </p>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 font-medium">Error: {result.error}</p>
                {result.message && <p className="text-red-600 text-sm mt-1">{result.message}</p>}
              </div>
            )}

            {result.config && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Configuration Test</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.config, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.oauth_url && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">OAuth URL Test</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.oauth_url, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.api_call && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">API Call Test</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.api_call, null, 2)}</pre>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>1. Test Configuration:</strong> Check if all required environment variables are set</p>
            <p><strong>2. Test OAuth URL:</strong> Generate and verify the OAuth URL format</p>
            <p><strong>3. Test API Call:</strong> Test actual YouTube API connectivity with an access token</p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Common Issues:</strong>
            </p>
            <ul className="text-yellow-700 text-sm mt-2 space-y-1">
              <li>• Missing or incorrect Google Client ID/Secret</li>
              <li>• Incorrect redirect URI in Google Console</li>
              <li>• YouTube API not enabled in Google Console</li>
              <li>• OAuth consent screen not configured</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default YouTubeOAuthTest
