const { verifyAuth } = require('../middleware/auth')
const { authRateLimit } = require('../middleware/rateLimit')

module.exports = async function handler(req, res) {
  // 🔒 SECURITY: RATE LIMITING FIRST
  const rateLimitResult = authRateLimit(req, res)
  if (rateLimitResult) {
    return // Rate limit exceeded, response already sent
  }

  // 🔒 SECURITY: AUTHENTICATE FIRST - BEFORE ANY PROCESSING
  const { user, error: authError } = await verifyAuth(req, res, { 
    requireAuth: true, 
    allowedRoles: ['creator'] 
  })
  
  if (authError) {
    return res.status(authError.status).json({ error: authError.message })
  }

  // Only process request after successful authentication
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.body
    const userId = user.uid // Use authenticated user's ID

    if (!code) {
      return res.status(400).json({ error: 'Missing OAuth code' })
    }

    console.log('🎵 TikTok OAuth code exchange for user:', userId)

    // Exchange code for access token using server-side secret
    const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.VITE_TIKTOK_CLIENT_ID,
        client_secret: process.env.VITE_TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL || 'https://www.creatorbounty.xyz'}/oauth/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.error('TikTok OAuth token error:', tokenData.error)
      return res.status(400).json({ error: tokenData.error })
    }

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'No access token received' })
    }

    console.log('✅ TikTok access token obtained successfully')

    // Get user information from TikTok
    const userInfoResponse = await fetch('https://open-api.tiktok.com/user/info/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'follower_count', 'following_count', 'likes_count', 'video_count']
      })
    })

    const userInfo = await userInfoResponse.json()
    
    if (userInfo.error) {
      console.error('TikTok user info error:', userInfo.error)
      return res.status(400).json({ error: userInfo.error })
    }

    console.log('✅ TikTok user info retrieved:', userInfo.data?.user?.display_name)

    // Return the access token and user info
    res.status(200).json({ 
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'bearer',
      user_info: userInfo.data?.user || {}
    })

  } catch (error) {
    console.error('TikTok OAuth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
