const { verifyAuth } = require('./middleware/auth')

/**
 * Test YouTube OAuth functionality
 * Helps debug YouTube OAuth issues
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action } = req.body || req.query

    if (!action) {
      return res.status(400).json({ 
        error: 'Missing action parameter. Use: test-config, test-oauth-url, test-api-call' 
      })
    }

    console.log(`🧪 YouTube OAuth test: ${action}`)

    switch (action) {
      case 'test-config':
        return await testConfiguration(res)
      
      case 'test-oauth-url':
        return await testOAuthUrl(res)
      
      case 'test-api-call':
        return await testApiCall(req, res)
      
      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: test-config, test-oauth-url, test-api-call' 
        })
    }
  } catch (error) {
    console.error('❌ YouTube OAuth test error:', error)
    return res.status(500).json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack 
    })
  }
}

// Test configuration
async function testConfiguration(res) {
  try {
    const results = {
      config: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test 1: Check environment variables
    const requiredEnvVars = [
      'VITE_GOOGLE_CLIENT_ID',
      'VITE_GOOGLE_CLIENT_SECRET'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length === 0) {
      results.config.details.push({ 
        test: 'env_vars', 
        status: 'success', 
        message: 'All required environment variables present' 
      })
    } else {
      results.config.details.push({ 
        test: 'env_vars', 
        status: 'error', 
        message: `Missing environment variables: ${missingVars.join(', ')}` 
      })
    }

    // Test 2: Check client ID format
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID
    if (clientId) {
      if (clientId.includes('.apps.googleusercontent.com')) {
        results.config.details.push({ 
          test: 'client_id_format', 
          status: 'success', 
          message: 'Client ID format looks correct' 
        })
      } else {
        results.config.details.push({ 
          test: 'client_id_format', 
          status: 'warning', 
          message: 'Client ID format may be incorrect (should end with .apps.googleusercontent.com)' 
        })
      }
    }

    // Test 3: Check redirect URI
    const redirectUri = 'https://www.creatorbounty.xyz/oauth/callback'
    results.config.details.push({ 
      test: 'redirect_uri', 
      status: 'info', 
      message: `Redirect URI: ${redirectUri}` 
    })

    results.config.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('Configuration test error:', error)
    return res.status(500).json({ 
      config: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Test OAuth URL generation
async function testOAuthUrl(res) {
  try {
    const results = {
      oauth_url: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = 'https://www.creatorbounty.xyz/oauth/callback'
    const scope = 'https://www.googleapis.com/auth/youtube.readonly'
    const state = 'youtube'

    if (!clientId) {
      results.oauth_url.details.push({ 
        test: 'url_generation', 
        status: 'error', 
        message: 'Cannot generate OAuth URL without client ID' 
      })
    } else {
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${state}`

      results.oauth_url.details.push({ 
        test: 'url_generation', 
        status: 'success', 
        message: 'OAuth URL generated successfully',
        url: oauthUrl
      })
    }

    results.oauth_url.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('OAuth URL test error:', error)
    return res.status(500).json({ 
      oauth_url: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Test API call (requires authentication)
async function testApiCall(req, res) {
  try {
    // Authenticate user first
    const { user, error: authError } = await verifyAuth(req, res, { 
      requireAuth: true, 
      allowedRoles: ['creator'] 
    })
    
    if (authError) {
      return res.status(authError.status).json({ error: authError.message })
    }

    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken parameter' })
    }

    const results = {
      api_call: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test YouTube API call
    try {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
      
      const channelResponse = await fetch(channelUrl)
      const channelData = await channelResponse.json()

      if (!channelResponse.ok) {
        results.api_call.details.push({ 
          test: 'youtube_api', 
          status: 'error', 
          message: `YouTube API error: ${channelData.error?.message || 'Unknown error'}`,
          error: channelData
        })
      } else if (!channelData.items || channelData.items.length === 0) {
        results.api_call.details.push({ 
          test: 'youtube_api', 
          status: 'error', 
          message: 'No YouTube channel found in response',
          response: channelData
        })
      } else {
        const channel = channelData.items[0]
        results.api_call.details.push({ 
          test: 'youtube_api', 
          status: 'success', 
          message: 'YouTube API call successful',
          channel: {
            id: channel.id,
            title: channel.snippet.title,
            subscriberCount: channel.statistics.subscriberCount,
            viewCount: channel.statistics.viewCount,
            videoCount: channel.statistics.videoCount
          }
        })
      }
    } catch (error) {
      results.api_call.details.push({ 
        test: 'youtube_api', 
        status: 'error', 
        message: `API call failed: ${error.message}` 
      })
    }

    results.api_call.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('API call test error:', error)
    return res.status(500).json({ 
      api_call: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}
