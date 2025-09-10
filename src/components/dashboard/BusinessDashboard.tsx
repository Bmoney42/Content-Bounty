import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Video, Target, Clock, Crown, Star } from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'
import { useAuth } from '../../utils/authUtils'
import UpgradeModal from '../ui/UpgradeModal'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { firebaseDB } from '../../services/firebase'

const BusinessDashboard: React.FC = () => {
  const { user } = useAuth()
  const { 
    isPremium, 
    usage, 
    upgradePrompts, 
    bountiesRemaining,
    hasReachedBountyLimit 
  } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    activeBounties: 0,
    totalCreators: 0,
    totalPaid: 0,
    videosCreated: 0
  })
  const [recentBounties, setRecentBounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // Get user's bounties
        const userBounties = await firebaseDB.getBountiesByUser(user.id)
        
        // Calculate stats
        const activeBounties = userBounties.filter(b => b.status === 'active' || b.status === 'in-progress').length
        const completedBounties = userBounties.filter(b => b.status === 'completed')
        const totalPaid = completedBounties.reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
        
        // Get unique creators who applied to user's bounties (using applicationsCount as proxy)
        const totalApplications = userBounties.reduce((sum, b) => sum + (b.applicationsCount || 0), 0)
        
        // Count videos/content created from completed bounties (using completed status as proxy)
        const videosCreated = completedBounties.length
        
        setDashboardStats({
          activeBounties,
          totalCreators: totalApplications, // Using total applications as estimate
          totalPaid,
          videosCreated
        })
        
        // Get recent bounties (last 5)
        const recent = userBounties
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(bounty => ({
            id: bounty.id,
            title: bounty.title,
            creator: bounty.status === 'completed' ? 'Creator' : 'TBD', // Simplified creator display
            status: bounty.status,
            payout: bounty.payment?.amount || 0,
            date: new Date(bounty.createdAt).toLocaleDateString()
          }))
        
        setRecentBounties(recent)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set empty state on error
        setDashboardStats({
          activeBounties: 0,
          totalCreators: 0,
          totalPaid: 0,
          videosCreated: 0
        })
        setRecentBounties([])
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user?.id])
  
  const stats = [
    { label: "Active Bounties", value: dashboardStats.activeBounties.toString(), icon: Target, color: "blue" },
    { label: "Total Creators", value: dashboardStats.totalCreators.toString(), icon: Users, color: "green" },
    { label: "Bounties Paid", value: `$${dashboardStats.totalPaid.toLocaleString()}`, icon: DollarSign, color: "purple" },
    { label: "Videos Created", value: dashboardStats.videosCreated.toString(), icon: Video, color: "orange" }
  ]

  return (
    <>
      {/* Subscription Status Banner */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-r from-green-600 to-blue-600 border-0">
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
                  {isPremium ? 'Premium Business' : 'Free Business'}
                </h3>
                <p className="text-green-100">
                  {isPremium 
                    ? 'Unlimited bounties • Priority placement • Advanced tools'
                    : `${bountiesRemaining} bounties remaining this month • Basic features`
                  }
                </p>
              </div>
            </div>
            {!isPremium && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </Card>
      </div>

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
      {loading ? (
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center animate-pulse">
              <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto mb-6"></div>
              <div className="h-8 bg-white/20 rounded mb-3"></div>
              <div className="h-4 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center group hover:bg-white/20 transition-all duration-500 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-3">{stat.value}</div>
            <div className="text-gray-300 text-sm font-semibold">{stat.label}</div>
          </div>
        ))}
        </div>
      )}

      {/* Recent Bounties */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Bounties</h2>
        {loading ? (
          <div className="space-y-6">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl animate-pulse">
                <div className="flex-1">
                  <div className="h-6 bg-white/20 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded mb-1 w-1/2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/4"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-6 bg-white/20 rounded-full"></div>
                  <div className="w-16 h-8 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentBounties.length > 0 ? (
          <div className="space-y-6">
            {recentBounties.map((bounty, index) => (
              <div key={bounty.id || index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                  <p className="text-gray-300 font-medium">Creator: {bounty.creator}</p>
                  <p className="text-gray-400 text-sm">{bounty.date}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                    bounty.status === 'completed' ? 'bg-green-500 text-white' :
                    bounty.status === 'active' ? 'bg-blue-500 text-white' :
                    bounty.status === 'pending' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {bounty.status}
                  </span>
                  <span className="font-bold text-2xl text-blue-400">${bounty.payout}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No bounties yet</h3>
            <p className="text-gray-400 mb-6">Create your first bounty to get started with content creators!</p>
            <Button
              onClick={() => window.location.href = '/bounties/new'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Your First Bounty
            </Button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={hasReachedBountyLimit ? 'bounty_limit' : 'manual'}
      />
    </>
  )
}

export default BusinessDashboard
