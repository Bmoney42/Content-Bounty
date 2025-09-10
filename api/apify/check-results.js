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

  // Only process GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { runId, platform } = req.query

    // Validate input
    if (!runId || !platform) {
      return res.status(400).json({ error: 'Missing required fields: runId, platform' })
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

    // Get run status
    const run = await apifyClient.run(runId).get()
    
    if (!run) {
      return res.status(404).json({ error: 'Scraping run not found' })
    }

    let results = []
    let brandLeads = []

    // If run is completed, get results
    if (run.status === 'SUCCEEDED') {
      try {
        const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems()
        results = dataset.items || []
        
        // Process results for sponsorship signals
        brandLeads = processResultsForBrands(results, platform)
        
        console.log(`✅ ${platform} scraping completed: ${results.length} results, ${brandLeads.length} brand leads`)
        
      } catch (error) {
        console.error(`Error getting ${platform} results:`, error)
        return res.status(500).json({ error: 'Failed to get scraping results' })
      }
    } else if (run.status === 'FAILED') {
      console.error(`❌ ${platform} scraping failed:`, run.statusMessage)
      return res.status(500).json({ 
        error: 'Scraping failed',
        details: run.statusMessage
      })
    }

    // Return run status and results
    res.json({
      success: true,
      runId,
      platform,
      status: run.status,
      progress: run.status === 'RUNNING' ? Math.round((run.stats?.processedItems || 0) / (run.stats?.totalItems || 1) * 100) : 100,
      resultsCount: results.length,
      brandLeadsCount: brandLeads.length,
      brandLeads: brandLeads.slice(0, 10), // Return first 10 for preview
      completedAt: run.finishedAt,
      startedAt: run.startedAt
    })

  } catch (error) {
    console.error('Error checking Apify results:', error)
    res.status(500).json({ 
      error: 'Failed to check scraping results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Process scraped results to extract brand leads
function processResultsForBrands(results, platform) {
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
        brandName: extractBrandName(result, platform),
        platform,
        sourcePostId: result.id,
        sourceUrl: result.url || result.videoUrl || result.webVideoUrl,
        sponsorshipSignals: signals,
        brandHandle: extractBrandHandle(result, platform),
        websiteUrl: extractWebsite(result),
        engagementRate: calculateEngagementRate(result, platform),
        followerCount: extractFollowerCount(result, platform),
        detectedAt: new Date().toISOString(),
        status: 'new',
        priority: 'medium',
        tags: []
      }
      
      brandLeads.push(brandLead)
    }
  }

  return brandLeads
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

