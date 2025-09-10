const { admin, db } = require('./lib/firebase')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * Test Features API
 * Comprehensive testing suite for all system components
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
    const { testType } = req.body || req.query

    if (!testType) {
      return res.status(400).json({ 
        error: 'Missing testType parameter. Use: firestore, stripe, auth, webhooks, all' 
      })
    }

    console.log(`🧪 Running test: ${testType}`)

    switch (testType) {
      case 'firestore':
        return await testFirestore(res)
      
      case 'stripe':
        return await testStripe(res)
      
      case 'auth':
        return await testAuth(res)
      
      case 'webhooks':
        return await testWebhooks(res)
      
      case 'all':
        return await runAllTests(res)
      
      default:
        return res.status(400).json({ 
          error: 'Invalid testType. Use: firestore, stripe, auth, webhooks, all' 
        })
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    return res.status(500).json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack 
    })
  }
}

// Test Firestore connection and basic operations
async function testFirestore(res) {
  try {
    const results = {
      firestore: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test 1: Basic connection
    try {
      const testDoc = await db.collection('_test').doc('connection').get()
      results.firestore.details.push({ test: 'connection', status: 'success', message: 'Firestore connected' })
    } catch (error) {
      results.firestore.details.push({ test: 'connection', status: 'error', message: error.message })
    }

    // Test 2: Write operation
    try {
      await db.collection('_test').doc('write').set({
        test: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      })
      results.firestore.details.push({ test: 'write', status: 'success', message: 'Write operation successful' })
    } catch (error) {
      results.firestore.details.push({ test: 'write', status: 'error', message: error.message })
    }

    // Test 3: Read operation
    try {
      const readDoc = await db.collection('_test').doc('write').get()
      if (readDoc.exists) {
        results.firestore.details.push({ test: 'read', status: 'success', message: 'Read operation successful' })
      } else {
        results.firestore.details.push({ test: 'read', status: 'error', message: 'Document not found' })
      }
    } catch (error) {
      results.firestore.details.push({ test: 'read', status: 'error', message: error.message })
    }

    // Test 4: Query operation
    try {
      const querySnapshot = await db.collection('users').limit(1).get()
      results.firestore.details.push({ 
        test: 'query', 
        status: 'success', 
        message: `Query successful, found ${querySnapshot.size} documents` 
      })
    } catch (error) {
      results.firestore.details.push({ test: 'query', status: 'error', message: error.message })
    }

    // Clean up test documents
    try {
      await db.collection('_test').doc('write').delete()
      results.firestore.details.push({ test: 'cleanup', status: 'success', message: 'Test cleanup successful' })
    } catch (error) {
      results.firestore.details.push({ test: 'cleanup', status: 'warning', message: 'Cleanup failed: ' + error.message })
    }

    results.firestore.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('Firestore test error:', error)
    return res.status(500).json({ 
      firestore: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Test Stripe API connection and basic operations
async function testStripe(res) {
  try {
    const results = {
      stripe: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test 1: API connection
    try {
      const balance = await stripe.balance.retrieve()
      results.stripe.details.push({ 
        test: 'connection', 
        status: 'success', 
        message: `Stripe connected, balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'USD'}` 
      })
    } catch (error) {
      results.stripe.details.push({ test: 'connection', status: 'error', message: error.message })
    }

    // Test 2: List customers
    try {
      const customers = await stripe.customers.list({ limit: 1 })
      results.stripe.details.push({ 
        test: 'customers', 
        status: 'success', 
        message: `Found ${customers.data.length} customers` 
      })
    } catch (error) {
      results.stripe.details.push({ test: 'customers', status: 'error', message: error.message })
    }

    // Test 3: List products
    try {
      const products = await stripe.products.list({ limit: 1 })
      results.stripe.details.push({ 
        test: 'products', 
        status: 'success', 
        message: `Found ${products.data.length} products` 
      })
    } catch (error) {
      results.stripe.details.push({ test: 'products', status: 'error', message: error.message })
    }

    // Test 4: List webhook endpoints
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 5 })
      results.stripe.details.push({ 
        test: 'webhooks', 
        status: 'success', 
        message: `Found ${webhooks.data.length} webhook endpoints` 
      })
    } catch (error) {
      results.stripe.details.push({ test: 'webhooks', status: 'error', message: error.message })
    }

    results.stripe.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('Stripe test error:', error)
    return res.status(500).json({ 
      stripe: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Test authentication system
async function testAuth(res) {
  try {
    const results = {
      auth: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test 1: Firebase Admin Auth
    try {
      const auth = admin.auth()
      results.auth.details.push({ test: 'admin_auth', status: 'success', message: 'Firebase Admin Auth initialized' })
    } catch (error) {
      results.auth.details.push({ test: 'admin_auth', status: 'error', message: error.message })
    }

    // Test 2: Check environment variables
    const requiredEnvVars = [
      'VITE_FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'STRIPE_SECRET_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length === 0) {
      results.auth.details.push({ test: 'env_vars', status: 'success', message: 'All required environment variables present' })
    } else {
      results.auth.details.push({ 
        test: 'env_vars', 
        status: 'warning', 
        message: `Missing environment variables: ${missingVars.join(', ')}` 
      })
    }

    results.auth.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('Auth test error:', error)
    return res.status(500).json({ 
      auth: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Test webhook functionality
async function testWebhooks(res) {
  try {
    const results = {
      webhooks: { status: 'testing', details: [] },
      timestamp: new Date().toISOString()
    }

    // Test 1: Check webhook endpoint configuration
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
      const creatorBountyWebhook = webhooks.data.find(wh => 
        wh.url.includes('creatorbounty.xyz') || wh.url.includes('vercel.app')
      )
      
      if (creatorBountyWebhook) {
        results.webhooks.details.push({ 
          test: 'endpoint_config', 
          status: 'success', 
          message: `Webhook endpoint found: ${creatorBountyWebhook.url}` 
        })
      } else {
        results.webhooks.details.push({ 
          test: 'endpoint_config', 
          status: 'warning', 
          message: 'No Creator Bounty webhook endpoint found' 
        })
      }
    } catch (error) {
      results.webhooks.details.push({ test: 'endpoint_config', status: 'error', message: error.message })
    }

    // Test 2: Check recent webhook events
    try {
      const events = await stripe.events.list({ limit: 5 })
      results.webhooks.details.push({ 
        test: 'recent_events', 
        status: 'success', 
        message: `Found ${events.data.length} recent webhook events` 
      })
    } catch (error) {
      results.webhooks.details.push({ test: 'recent_events', status: 'error', message: error.message })
    }

    results.webhooks.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('Webhook test error:', error)
    return res.status(500).json({ 
      webhooks: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}

// Run all tests
async function runAllTests(res) {
  try {
    const results = {
      all_tests: { status: 'running', details: [] },
      timestamp: new Date().toISOString()
    }

    // Run Firestore test
    try {
      const firestoreResult = await testFirestore({ status: () => {}, json: () => {} })
      results.firestore = firestoreResult.firestore
    } catch (error) {
      results.firestore = { status: 'error', message: error.message }
    }

    // Run Stripe test
    try {
      const stripeResult = await testStripe({ status: () => {}, json: () => {} })
      results.stripe = stripeResult.stripe
    } catch (error) {
      results.stripe = { status: 'error', message: error.message }
    }

    // Run Auth test
    try {
      const authResult = await testAuth({ status: () => {}, json: () => {} })
      results.auth = authResult.auth
    } catch (error) {
      results.auth = { status: 'error', message: error.message }
    }

    // Run Webhook test
    try {
      const webhookResult = await testWebhooks({ status: () => {}, json: () => {} })
      results.webhooks = webhookResult.webhooks
    } catch (error) {
      results.webhooks = { status: 'error', message: error.message }
    }

    results.all_tests.status = 'completed'
    return res.status(200).json(results)
  } catch (error) {
    console.error('All tests error:', error)
    return res.status(500).json({ 
      all_tests: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    })
  }
}
