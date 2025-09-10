import React, { useState } from 'react'
import { useAuth } from '../utils/authUtils'
import { authenticatedFetch } from '../utils/apiUtils'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface DebugResult {
  success?: boolean
  error?: string
  message?: string
  user?: any
  subscription?: any
  customer?: any
  subscriptions?: any[]
  events?: any[]
  total?: number
}

const SubscriptionDebug: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DebugResult | null>(null)
  const [email, setEmail] = useState('')

  const runDiagnostic = async (action: string, targetEmail?: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await authenticatedFetch('/api/debug-subscription', {
        method: 'POST',
        body: JSON.stringify({
          action,
          userId: targetEmail || email ? null : user?.id, // Only use userId if no email specified
          email: targetEmail || email
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Diagnostic error:', error)
      setResult({ error: 'Failed to run diagnostic', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fixSubscription = async () => {
    if (!confirm('This will manually create a subscription record. Continue?')) {
      return
    }
    await runDiagnostic('fix-subscription', email)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Debug Tool</h1>
          <p className="text-gray-600">
            Debug subscription issues for creators who paid but didn't get upgraded
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current User Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Type:</strong> {user?.userType || 'N/A'}</p>
            </div>
          </Card>

          {/* Email Input */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Another User</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email to debug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </Card>
        </div>

        {/* Diagnostic Actions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => runDiagnostic('check-user')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Check User'}
            </Button>
            
            <Button
              onClick={() => runDiagnostic('check-stripe')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Check Stripe'}
            </Button>
            
            <Button
              onClick={() => runDiagnostic('check-webhook')}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Check Webhooks'}
            </Button>
            
            <Button
              onClick={fixSubscription}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Loading...' : 'Fix Subscription'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 font-medium">Error: {result.error}</p>
                {result.message && <p className="text-red-600 text-sm mt-1">{result.message}</p>}
              </div>
            )}

            {result.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="text-green-800 font-medium">Success: {result.message}</p>
              </div>
            )}

            {result.user && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.user, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.subscription && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Subscription Information</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.subscription, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.customer && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Stripe Customer</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.customer, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.subscriptions && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Stripe Subscriptions</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{JSON.stringify(result.subscriptions, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.events && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Recent Webhook Events ({result.total})
                </h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm max-h-96 overflow-y-auto">
                  <pre>{JSON.stringify(result.events, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.message && !result.error && !result.success && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-800">{result.message}</p>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>1. Check User:</strong> Verify the user exists in Firestore and check their subscription status</p>
            <p><strong>2. Check Stripe:</strong> Look up the customer in Stripe and their active subscriptions</p>
            <p><strong>3. Check Webhooks:</strong> Review recent webhook events to see if subscription events were received</p>
            <p><strong>4. Fix Subscription:</strong> Manually create the subscription record in Firestore (use with caution)</p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Common Issues:</strong>
            </p>
            <ul className="text-yellow-700 text-sm mt-2 space-y-1">
              <li>• Webhook not configured properly in Stripe dashboard</li>
              <li>• Webhook endpoint returning errors</li>
              <li>• User metadata missing from Stripe customer</li>
              <li>• Subscription created but not synced to Firestore</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SubscriptionDebug
