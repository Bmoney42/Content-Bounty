import React, { useState } from 'react'
import { useAuth } from '../utils/authUtils'
import { useSubscription } from '../hooks/useSubscription'
import UpgradeModal from '../components/ui/UpgradeModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  DollarSign, 
  Users, 
  Target, 
  TrendingUp,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react'

const Upgrade: React.FC = () => {
  const { user } = useAuth()
  const { 
    isPremium, 
    usage, 
    upgradePrompts, 
    getAllSubscriptionPlans,
    applicationsRemaining,
    bountiesRemaining,
    hasReachedApplicationLimit,
    hasReachedBountyLimit
  } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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

  const features = {
    creator: {
      free: [
        '3 applications per month',
        'Zero platform fees',
        'Basic profile',
        'Standard support'
      ],
      premium: [
        'Unlimited applications',
        'Zero platform fees',
        'Priority placement',
        'Enhanced profile',
        'Advanced analytics',
        'Priority support',
        'Early access to new features'
      ]
    },
    business: {
      free: [
        '2 active bounties',
        'Basic bounty creation',
        'Standard support',
        'Basic analytics'
      ],
      premium: [
        'Unlimited bounties',
        'Priority placement',
        'Enhanced bounty creation',
        'Advanced analytics',
        'Priority support',
        'Team collaboration',
        'Custom branding'
      ]
    }
  }

  const currentFeatures = features[user?.userType || 'creator']
  const isCreator = user?.userType === 'creator'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            {isPremium ? 'Premium Plan Active' : 'Upgrade to Premium'}
          </h1>
                     <p className="text-xl text-gray-200 max-w-2xl mx-auto">
             {isPremium 
               ? 'You\'re already enjoying all the premium benefits!'
               : 'Unlock unlimited opportunities and maximize your earnings'
             }
           </p>
        </div>

        {/* Current Status */}
        <div className="mb-12">
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {isPremium ? (
                    <Crown className="w-8 h-8 text-yellow-300" />
                  ) : (
                    <Star className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {isPremium 
                      ? 'You have access to all premium features'
                      : isCreator 
                        ? `${applicationsRemaining} applications remaining this month`
                        : `${bountiesRemaining} bounties remaining this month`
                    }
                  </p>
                </div>
              </div>
              {!isPremium && (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4"
                >
                  Upgrade Now
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="p-8 border-2 border-gray-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Star className="w-8 h-8 text-gray-800" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
               <p className="text-gray-900">Perfect for getting started</p>
            </div>
            
            <div className="space-y-4 mb-8">
                             {currentFeatures.free.map((feature, index) => (
                 <div key={index} className="flex items-center space-x-3">
                   <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                   <span className="text-gray-900">{feature}</span>
                 </div>
               ))}
            </div>

                         <div className="text-center">
               <div className="text-3xl font-bold text-gray-900 mb-2">$0</div>
               <div className="text-gray-900">Forever free</div>
             </div>
          </Card>

          {/* Premium Plan */}
          <Card className="p-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Crown className="w-8 h-8 text-white" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Plan</h3>
               <p className="text-gray-900">Unlock your full potential</p>
            </div>
            
            <div className="space-y-4 mb-8">
                             {currentFeatures.premium.map((feature, index) => (
                 <div key={index} className="flex items-center space-x-3">
                   <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                   <span className="text-gray-900">{feature}</span>
                 </div>
               ))}
            </div>

                         <div className="text-center">
               <div className="text-3xl font-bold text-gray-900 mb-2">
                 ${userPlan?.price}/month
               </div>
               <div className="text-gray-900">Cancel anytime</div>
             </div>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Why Upgrade to Premium?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Unlimited Access</h3>
                              <p className="text-gray-600">
                  {isCreator 
                    ? 'Apply to unlimited bounties without restrictions'
                    : 'Create unlimited bounties to grow your business'
                  }
                </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">
                 {isCreator ? 'Zero Platform Fees' : 'Better ROI'}
               </h3>
                              <p className="text-gray-600">
                  {isCreator 
                    ? 'Keep 100% of your earnings with zero platform fees'
                    : 'Create unlimited bounties to grow your business'
                  }
                </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Priority Features</h3>
                              <p className="text-gray-600">
                  Get priority placement, advanced analytics, and exclusive features
                </p>
            </Card>
          </div>
        </div>

        {/* Upgrade Prompts */}
        {upgradePrompts.length > 0 && !isPremium && (
          <div className="mb-12">
            <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                      Upgrade Opportunity
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {upgradePrompts[0]?.message}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-yellow-500 text-white hover:bg-yellow-600 font-semibold"
                >
                  Upgrade Now
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
                             <h3 className="text-lg font-bold text-gray-900 mb-3">
                 Can I cancel anytime?
               </h3>
                              <p className="text-gray-600">
                  Yes! You can cancel your premium subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
            </Card>

            <Card className="p-6">
                             <h3 className="text-lg font-bold text-gray-900 mb-3">
                 What happens if I reach my limit?
               </h3>
                              <p className="text-gray-600">
                  {isCreator 
                    ? 'You\'ll see an upgrade prompt when you reach your 3-application limit. Upgrade to continue applying to bounties.'
                    : 'You\'ll see an upgrade prompt when you reach your 2-bounty limit. Upgrade to create unlimited bounties.'
                  }
                </p>
            </Card>

            <Card className="p-6">
                             <h3 className="text-lg font-bold text-gray-900 mb-3">
                 How do I get support?
               </h3>
                              <p className="text-gray-600">
                  Premium users get priority support with faster response times. Free users get standard support.
                </p>
            </Card>

            <Card className="p-6">
                             <h3 className="text-lg font-bold text-gray-900 mb-3">
                 Is my payment secure?
               </h3>
                              <p className="text-gray-600">
                  Absolutely! We use Stripe for secure payment processing. Your payment information is never stored on our servers.
                </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        {!isPremium && (
          <div className="text-center">
            <Card className="p-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Upgrade?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of creators and businesses who have already upgraded to premium and are maximizing their success.
              </p>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-12 py-4 text-lg"
              >
                Start Your Premium Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
          </div>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger={
            hasReachedApplicationLimit ? 'application_limit' :
            hasReachedBountyLimit ? 'bounty_limit' : 'manual'
          }
        />
      </div>
    </div>
  )
}

export default Upgrade
