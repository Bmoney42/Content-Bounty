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

    // Exchange code for access token using server-side secret
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `https://www.creatorbounty.xyz/oauth/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.error('OAuth token error:', tokenData.error)
      return res.status(400).json({ error: tokenData.error })
    }

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'No access token received' })
    }

    // Return the access token to be used client-side
    res.status(200).json({ 
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token
    })

  } catch (error) {
    console.error('YouTube OAuth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}