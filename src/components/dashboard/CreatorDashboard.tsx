import React, { useState, useEffect } from 'react'
import { DollarSign, Video, TrendingUp, Users, Eye, Clock, Crown, Star, Target, ArrowRight } from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'
import { useAuth } from '../../utils/authUtils'
import { firebaseDB } from '../../services/firebase'
import UpgradeModal from '../ui/UpgradeModal'
import PaymentNotification from '../ui/PaymentNotification'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Link } from 'react-router-dom'

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth()
  const { 
    isPremium, 
    usage, 
    upgradePrompts, 
    applicationsRemaining,
    hasReachedApplicationLimit 
  } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [recentWork, setRecentWork] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([
    { label: "Total Earnings", value: "$0", icon: DollarSign, color: "green" },
    { label: "Videos Created", value: "0", icon: Video, color: "blue" },
    { label: "Total Views", value: "0", icon: Eye, color: "purple" },
    { label: "Active Bounties", value: "0", icon: Clock, color: "orange" }
  ])

  // Fetch real creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // Get creator's applications and submissions
        const applications = await firebaseDB.getCreatorApplications(user.id)
        const submissions = await firebaseDB.getCreatorSubmissions(user.id)
        const bounties = await firebaseDB.getBounties()
        
        // Calculate real stats
        const completedBounties = applications.filter(app => app.status === 'accepted').length
        const totalEarnings = applications
          .filter(app => app.status === 'accepted')
          .reduce((sum, app) => {
            const bounty = bounties.find(b => b.id === app.bountyId)
            return sum + (bounty?.payment.amount || 0)
          }, 0)
        
        const activeBounties = applications.filter(app => app.status === 'accepted').length
        
        // Update stats with real data
        setStats([
          { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "green" },
          { label: "Videos Created", value: completedBounties.toString(), icon: Video, color: "blue" },
          { label: "Total Views", value: "0", icon: Eye, color: "purple" }, // Would need real analytics
          { label: "Active Bounties", value: activeBounties.toString(), icon: Clock, color: "orange" }
        ])
        
        // Build recent work from real data
        const workData = []
        
        // Add completed bounties
        applications
          .filter(app => app.status === 'accepted')
          .forEach(app => {
            const bounty = bounties.find(b => b.id === app.bountyId)
            if (bounty) {
              workData.push({
                title: bounty.title,
                brand: bounty.businessName || 'Unknown Brand',
                status: 'completed',
                earnings: bounty.payment.amount,
                views: '0', // Would need real analytics
                date: new Date(app.submittedAt).toLocaleDateString(),
                bountyId: bounty.id
              })
            }
          })
        
        // Add in-progress submissions
        submissions
          .filter(sub => sub.status === 'submitted' || sub.status === 'approved')
          .forEach(sub => {
            const bounty = bounties.find(b => b.id === sub.bountyId)
            if (bounty) {
              workData.push({
                title: bounty.title,
                brand: bounty.businessName || 'Unknown Brand',
                status: sub.status === 'approved' ? 'completed' : 'in-progress',
                earnings: bounty.payment.amount,
                views: '0', // Would need real analytics
                date: new Date(sub.submittedAt).toLocaleDateString(),
                bountyId: bounty.id
              })
            }
          })
        
        // Sort by date (most recent first) and take last 5
        workData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRecentWork(workData.slice(0, 5))
        
      } catch (error) {
        console.error('Error fetching creator data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCreatorData()
  }, [user?.id])

  return (
    <>
      {/* Subscription Status Banner */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {isPremium ? (
                  <Crown className="w-6 h-6 text-yellow-300" />
                ) : (
                  <Star className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isPremium ? 'Premium Creator' : 'Free Creator'}
                </h3>
                <p className="text-blue-100">
                  {isPremium 
                    ? 'Unlimited applications • Priority placement • Zero fees'
                    : `${applicationsRemaining} applications remaining this month • Zero fees`
                  }
                </p>
              </div>
            </div>
            {!isPremium && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Notification */}
      <PaymentNotification />

      {/* Upgrade Prompts */}
      {upgradePrompts.length > 0 && !isPremium && (
        <div className="mb-8">
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Upgrade Opportunity
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {upgradePrompts[0]?.message}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Upgrade Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center group hover:bg-white/20 transition-all duration-500 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-3">
              {loading ? '...' : stat.value}
            </div>
            <div className="text-gray-300 text-sm font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Work */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-300">Loading your work...</div>
          </div>
        ) : recentWork.length > 0 ? (
          <div className="space-y-6">
            {recentWork.map((work, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{work.title}</h3>
                  <p className="text-gray-300 font-medium">Brand: {work.brand}</p>
                  <p className="text-gray-400 text-sm">{work.date}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">Views</p>
                    <p className="text-white font-semibold">{work.views}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                    work.status === 'completed' ? 'bg-green-500 text-white' :
                    work.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {work.status}
                  </span>
                  <span className="font-bold text-2xl text-green-400">${work.earnings}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Recent Work</h3>
            <p className="text-gray-400 mb-6">
              You haven't completed any bounties yet. Start earning by finding and applying to bounties!
            </p>
            <Link 
              to="/bounties" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <span>Find Bounties</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={hasReachedApplicationLimit ? 'application_limit' : 'manual'}
      />
    </>
  )
}

export default CreatorDashboard
