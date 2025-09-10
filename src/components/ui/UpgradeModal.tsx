import React, { useState } from 'react'
import { X, Check, Star, Crown, Zap, DollarSign, Target } from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'
import { useAuth } from '../../utils/authUtils'
import { formatCurrency } from '../../config/stripe'
import Button from './Button'
import Card from './Card'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'application_limit' | 'bounty_limit' | 'manual'
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, trigger = 'manual' }) => {
  const { user } = useAuth()
  const { 
    upgradeToPremium, 
    getAllSubscriptionPlans, 
    usage, 
    isPremium,
    upgradePrompts 
  } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const plans = getAllSubscriptionPlans()
  const userPlan = plans.find(plan => plan.id.includes(user?.userType || 'creator'))

  // Filter plans to only show relevant ones for the user's type
  const relevantPlans = plans.filter(plan => {
    if (user?.userType === 'creator') {
      return plan.id.includes('creator')
    } else if (user?.userType === 'business') {
      return plan.id.includes('business')
    }
    return false
  })

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    setLoading(true)
    try {
      await upgradeToPremium(selectedPlan)
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'application_limit':
        return {
          title: 'Application Limit Reached',
          subtitle: 'Upgrade to apply to unlimited bounties',
          icon: <Target className="w-8 h-8 text-blue-500" />
        }
      case 'bounty_limit':
        return {
          title: 'Bounty Limit Reached',
          subtitle: 'Upgrade to create unlimited bounties',
          icon: <Zap className="w-8 h-8 text-green-500" />
        }

      default:
        return {
          title: 'Upgrade to Premium',
          subtitle: 'Unlock unlimited opportunities and better earnings',
          icon: <Crown className="w-8 h-8 text-purple-500" />
        }
    }
  }

  const triggerInfo = getTriggerMessage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {triggerInfo.icon}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {triggerInfo.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {triggerInfo.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Current Usage */}
          {usage && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Usage This Month
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage.applicationsUsed}/{usage.applicationsLimit === -1 ? '∞' : usage.applicationsLimit}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isPremium ? '0%' : '0%'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {relevantPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </h4>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${plan.price}/month
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Benefits */}
          {user?.userType === 'creator' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Premium Benefits
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Unlock unlimited opportunities with premium:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">∞</p>
                    <p className="text-xs text-gray-500">Applications</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">0%</p>
                    <p className="text-xs text-gray-500">Platform Fees</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">Priority</p>
                    <p className="text-xs text-gray-500">Placement</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Prompts */}
          {upgradePrompts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Why Upgrade Now?
              </h3>
              <div className="space-y-3">
                {upgradePrompts.map((prompt, index) => (
                  <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {prompt.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPlan ? (
                <span>Selected: {relevantPlans.find(p => p.id === selectedPlan)?.name}</span>
              ) : (
                <span>Choose a plan to continue</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={!selectedPlan || loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processing...' : 'Upgrade Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
