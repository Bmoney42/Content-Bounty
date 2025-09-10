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

  // Only process POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { creatorId, platforms, searchTerms, jobId } = req.body

    // Validate input
    if (!creatorId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: creatorId, platforms' })
    }

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: searchTerms' })
    }

    // Verify user can only start scraping for themselves
    if (user.uid !== creatorId) {
      return res.status(403).json({ error: 'Unauthorized: Can only start scraping for your own account' })
    }

    // Check if user has premium subscription
    const { checkPremiumStatus } = require('../lib/firebase')
    const isPremium = await checkPremiumStatus(creatorId)
    if (!isPremium) {
      return res.status(403).json({ error: 'Premium subscription required for brand discovery' })
    }

    // Initialize Apify client
    const { ApifyApi } = require('apify-client')
    const apifyClient = new ApifyApi({
      token: process.env.APIFY_API_TOKEN
    })

    if (!process.env.APIFY_API_TOKEN) {
      console.error('APIFY_API_TOKEN not found in environment variables')
      return res.status(500).json({ error: 'Apify integration not configured' })
    }

    const results = {}
    const errors = []

    // Start scraping for each platform
    for (const platform of platforms) {
      try {
        console.log(`Starting ${platform} scraping for creator ${creatorId}`)
        
        let run
        switch (platform) {
          case 'instagram':
            run = await apifyClient.actor('apify/instagram-scraper').call({
              hashtags: searchTerms,
              resultsLimit: 1000,
              includeComments: true,
              includeHashtags: true,
              maxItems: 500 // Limit to control costs
            })
            break
            
          case 'tiktok':
            run = await apifyClient.actor('clockworks/tiktok-scraper').call({
              searchTerms,
              resultsLimit: 1000,
              maxItems: 500 // Limit to control costs
            })
            break
            
          case 'youtube':
            run = await apifyClient.actor('apify/youtube-scraper').call({
              searchTerms,
              resultsLimit: 1000,
              maxItems: 500 // Limit to control costs
            })
            break
            
          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }
        
        results[platform] = {
          runId: run.id,
          status: 'started',
          startedAt: new Date().toISOString()
        }
        
        console.log(`✅ ${platform} scraping started: ${run.id}`)
        
      } catch (error) {
        console.error(`❌ Error starting ${platform} scraping:`, error)
        errors.push({
          platform,
          error: error.message
        })
      }
    }

    // Update scraping job in Firebase
    if (jobId) {
      try {
        const { updateScrapingJob } = require('../lib/firebase')
        await updateScrapingJob(jobId, {
          status: 'running',
          runs: results,
          errors: errors.length > 0 ? errors : undefined,
          progress: 10,
          updatedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error updating scraping job:', error)
      }
    }

    // Return results
    res.json({
      success: true,
      message: 'Scraping jobs started successfully',
      runs: results,
      errors: errors.length > 0 ? errors : undefined,
      jobId
    })

  } catch (error) {
    console.error('Error starting Apify scraping:', error)
    res.status(500).json({ 
      error: 'Failed to start scraping',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

