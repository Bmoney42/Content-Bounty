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
    const { creatorId, runId, platform, jobId } = req.body

    // Validate input
    if (!creatorId || !runId || !platform) {
      return res.status(400).json({ error: 'Missing required fields: creatorId, runId, platform' })
    }

    // Verify user can only process results for themselves
    if (user.uid !== creatorId) {
      return res.status(403).json({ error: 'Unauthorized: Can only process results for your own account' })
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

    // Get run and results
    const run = await apifyClient.run(runId).get()
    
    if (!run) {
      return res.status(404).json({ error: 'Scraping run not found' })
    }

    if (run.status !== 'SUCCEEDED') {
      return res.status(400).json({ error: `Run is not completed. Status: ${run.status}` })
    }

    // Get all results
    const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems()
    const results = dataset.items || []

    // Process results for brand leads
    const brandLeads = processResultsForBrands(results, platform, creatorId)

    // Save brand leads to Firebase
    const { saveBrandLeads } = require('../lib/firebase')
    const savedLeads = await saveBrandLeads(brandLeads)

    // Update scraping job
    if (jobId) {
      try {
        const { updateScrapingJob } = require('../lib/firebase')
        await updateScrapingJob(jobId, {
          status: 'completed',
          leadsFound: savedLeads.length,
          progress: 100,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error updating scraping job:', error)
      }
    }

    console.log(`✅ Processed ${platform} results: ${savedLeads.length} brand leads saved`)

    // Return results
    res.json({
      success: true,
      message: 'Results processed successfully',
      runId,
      platform,
      resultsProcessed: results.length,
      brandLeadsFound: savedLeads.length,
      brandLeads: savedLeads
    })

  } catch (error) {
    console.error('Error processing Apify results:', error)
    res.status(500).json({ 
      error: 'Failed to process results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Process scraped results to extract brand leads
function processResultsForBrands(results, platform, creatorId) {
  const brandLeads = []
  const sponsorshipPatterns = {
    hashtags: ['#ad', '#sponsored', '#partnership', '#collab', '#brandambassador', '#paidpartnership'],
    text: [
      'paid partnership with',
      'sponsored by',
      'in collaboration with',
      'thanks to',
      'partnered with',
      'brand ambassador',
      'sponsored content'
    ]
  }

  for (const result of results) {
    const signals = detectSponsorshipSignals(result, sponsorshipPatterns)
    
    if (signals.length > 0) {
      const brandLead = {
        id: generateId(),
        creatorId,
        brandName: extractBrandName(result, platform),
        platform,
        sourcePostId: result.id,
        sourceUrl: result.url || result.videoUrl || result.webVideoUrl,
        detectedAt: new Date(),
        sponsorshipSignals: signals,
        brandHandle: extractBrandHandle(result, platform),
        websiteUrl: extractWebsite(result),
        engagementRate: calculateEngagementRate(result, platform),
        followerCount: extractFollowerCount(result, platform),
        status: 'new',
        priority: 'medium',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      brandLeads.push(brandLead)
    }
  }

  return brandLeads
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Detect sponsorship signals in content
function detectSponsorshipSignals(result, patterns) {
  const signals = []
  
  // Get text content based on platform
  const text = (result.caption || result.desc || result.title || '').toLowerCase()
  const hashtags = (result.hashtags || []).map(h => h.toLowerCase())
  
  // Check hashtags
  patterns.hashtags.forEach(pattern => {
    if (hashtags.includes(pattern.toLowerCase())) {
      signals.push(pattern)
    }
  })
  
  // Check text patterns
  patterns.text.forEach(pattern => {
    if (text.includes(pattern.toLowerCase())) {
      signals.push(pattern)
    }
  })
  
  return [...new Set(signals)] // Remove duplicates
}

// Extract brand name from result
function extractBrandName(result, platform) {
  switch (platform) {
    case 'instagram':
      return result.ownerUsername || 'Unknown Brand'
    case 'tiktok':
      return result.authorMeta?.name || 'Unknown Brand'
    case 'youtube':
      return result.channelTitle || 'Unknown Brand'
    default:
      return 'Unknown Brand'
  }
}

// Extract brand handle
function extractBrandHandle(result, platform) {
  switch (platform) {
    case 'instagram':
      return result.ownerUsername ? `@${result.ownerUsername}` : undefined
    case 'tiktok':
      return result.authorMeta?.name ? `@${result.authorMeta.name}` : undefined
    case 'youtube':
      return result.channelTitle ? `@${result.channelTitle}` : undefined
    default:
      return undefined
  }
}

// Extract website URL
function extractWebsite(result) {
  const text = result.bio || result.description || ''
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  return urlMatch ? urlMatch[0] : undefined
}

// Calculate engagement rate
function calculateEngagementRate(result, platform) {
  let likes, comments, shares, followers
  
  switch (platform) {
    case 'instagram':
      likes = result.likesCount || 0
      comments = result.commentsCount || 0
      shares = result.sharesCount || 0
      followers = result.ownerFollowersCount || 0
      break
    case 'tiktok':
      likes = result.diggCount || 0
      comments = result.commentCount || 0
      shares = result.shareCount || 0
      followers = result.authorMeta?.fans || 0
      break
    case 'youtube':
      likes = result.likeCount || 0
      comments = result.commentCount || 0
      shares = result.shareCount || 0
      followers = result.channelSubscriberCount || 0
      break
    default:
      return undefined
  }
  
  if (followers === 0) return undefined
  
  const engagement = likes + comments + shares
  return Math.round((engagement / followers) * 100 * 100) / 100 // Round to 2 decimal places
}

// Extract follower count
function extractFollowerCount(result, platform) {
  switch (platform) {
    case 'instagram':
      return result.ownerFollowersCount
    case 'tiktok':
      return result.authorMeta?.fans
    case 'youtube':
      return result.channelSubscriberCount
    default:
      return undefined
  }
}

