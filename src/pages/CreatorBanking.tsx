import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useConnectAccount } from '../hooks/useConnectAccount'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Shield,
  Banknote,
  ExternalLink
} from 'lucide-react'

const CreatorBanking: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    connectStatus,
    loading,
    creating,
    onboarding,
    createConnectAccount,
    startOnboarding,
    canReceivePayments,
    statusMessage,
    nextAction,
    loadConnectStatus
  } = useConnectAccount()

  const [email, setEmail] = useState(user?.email || '')
  const [country, setCountry] = useState('US')

  // Handle return from Stripe onboarding
  useEffect(() => {
    const success = searchParams.get('success')
    const refresh = searchParams.get('refresh')

    if (success === 'true' || refresh === 'true') {
      // Clear the query params to avoid loops and refresh status
      navigate('/creator-banking', { replace: true })
      // Re-fetch latest Connect status
      loadConnectStatus()
    }
  }, [searchParams, navigate, loadConnectStatus])

  const handleCreateAccount = async () => {
    if (!email) {
      alert('Please enter your email address')
      return
    }

    try {
      const result = await createConnectAccount(email, country)
      if (result?.accountId) {
        // Start onboarding immediately after account creation
        await startOnboarding(result.accountId)
      }
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }

  const handleStartOnboarding = async () => {
    if (connectStatus?.accountId) {
      await startOnboarding(connectStatus.accountId)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Clock className="w-6 h-6 text-gray-400 animate-spin" />
    if (canReceivePayments) return <CheckCircle className="w-6 h-6 text-green-500" />
    if (connectStatus?.requiresAction) return <AlertCircle className="w-6 h-6 text-yellow-500" />
    return <AlertCircle className="w-6 h-6 text-red-500" />
  }

  const getStatusColor = () => {
    if (canReceivePayments) return 'text-green-400'
    if (connectStatus?.requiresAction) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (user?.userType !== 'creator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-6">This page is only available for creators.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Banking Setup</h1>
            <p className="text-gray-300">Set up your banking information to receive payments</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {getStatusIcon()}
            <div>
              <h2 className="text-xl font-semibold text-white">Payment Status</h2>
              <p className={`${getStatusColor()} font-medium`}>{statusMessage}</p>
            </div>
          </div>

          {canReceivePayments && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ready to receive payments!</span>
              </div>
              <p className="text-green-300 text-sm mt-1">
                Your banking account is fully set up. You'll receive payments automatically after completing bounties.
              </p>
            </div>
          )}
        </div>

        {/* Setup Form */}
        {!canReceivePayments && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Set Up Banking</h2>
            
            {nextAction === 'create' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Secure Banking Setup</span>
                  </div>
                  <p className="text-blue-300 text-sm">
                    We use Stripe Connect to securely handle your banking information. 
                    Your data is encrypted and protected by industry-standard security.
                  </p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={creating || !email}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Create Banking Account</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {nextAction === 'onboard' && (
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Finish Banking Setup</span>
                  </div>
                  <p className="text-yellow-300 text-sm">
                    Your account needs additional information. Complete onboarding to start receiving payments.
                  </p>
                </div>

                <button
                  onClick={handleStartOnboarding}
                  disabled={onboarding}
                  className="w-full px-6 py-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {onboarding ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Opening Stripe...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      <span>Continue in Stripe</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Get Paid Fast</h3>
            </div>
            <p className="text-gray-300 text-sm">Receive payments automatically after completing bounties. No more waiting for manual transfers.</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Secure & Protected</h3>
            </div>
            <p className="text-gray-300 text-sm">Your banking information is encrypted and protected by Stripe's industry-leading security.</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Banknote className="w-5 h-5 text-pink-400" />
              <h3 className="text-white font-semibold">Direct to Bank</h3>
            </div>
            <p className="text-gray-300 text-sm">Payments go directly to your bank account. No middleman, no delays, just fast and reliable transfers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatorBanking
