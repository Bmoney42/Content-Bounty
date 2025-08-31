import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hybridData } from '../services/firebase'
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  Video, 
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Building,
  Globe,
  Star
} from 'lucide-react'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [creatorStats, setCreatorStats] = useState([
    { label: "Bounties Completed", value: "23", icon: Award },
    { label: "Videos Created", value: "45", icon: Video },
    { label: "Total Earned", value: "$1,750", icon: DollarSign }
  ])
  const [businessStats, setBusinessStats] = useState([
    { label: "Bounties Created", value: "12", icon: Target },
    { label: "Creators Worked With", value: "34", icon: Users },
    { label: "Total Spent", value: "$4,250", icon: DollarSign },
    { label: "Avg. Engagement", value: "8.2%", icon: TrendingUp }
  ])
  const [loading, setLoading] = useState(true)

  // Load real stats when user is available
  useEffect(() => {
    const loadStats = async () => {
      if (user?.id) {
        try {
          const stats = await hybridData.getUserStats(user.id, user.userType)
          
          if (user.userType === 'creator') {
            setCreatorStats([
              { label: "Bounties Completed", value: (stats.bountiesCompleted || 0).toString(), icon: Award },
              { label: "Videos Created", value: (stats.videosCreated || 0).toString(), icon: Video },
              { label: "Total Earned", value: `$${(stats.totalEarned || 0).toLocaleString()}`, icon: DollarSign }
            ])
          } else {
            setBusinessStats([
              { label: "Bounties Created", value: (stats.bountiesCreated || 0).toString(), icon: Target },
              { label: "Creators Worked With", value: (stats.creatorsWorkedWith || 0).toString(), icon: Users },
              { label: "Total Spent", value: `$${(stats.totalSpent || 0).toLocaleString()}`, icon: DollarSign },
              { label: "Avg. Engagement", value: stats.avgEngagement || "8.2%", icon: TrendingUp }
            ])
          }
        } catch (error) {
          console.error('Error loading stats:', error)
          // Keep existing mock data if there's an error
        }
      }
      setLoading(false)
    }

    loadStats()
  }, [user])

  const completedBounties = [
    { title: "Crypto Wallet Review", company: "SecureWallet", earned: 75, date: "2024-01-15" },
    { title: "Trading Platform Tutorial", company: "TradeEasy", earned: 100, date: "2024-01-10" },
    { title: "App Unboxing Video", company: "TechStart", earned: 50, date: "2024-01-05" }
  ]

  const businessBounties = [
    { title: "Product Review Campaign", status: "completed", creators: 3, spent: 450, date: "2024-01-15" },
    { title: "Tutorial Series", status: "in-progress", creators: 2, spent: 300, date: "2024-01-10" },
    { title: "Brand Awareness", status: "active", creators: 5, spent: 750, date: "2024-01-05" }
  ]

  const topCreators = [
    { name: "TechReviewer99", subscribers: "125K", videos: 8, rating: 4.9 },
    { name: "CryptoTeacher", subscribers: "89K", videos: 5, rating: 4.8 },
    { name: "TutorialMaster", subscribers: "67K", videos: 3, rating: 4.7 }
  ]

  // Show different content based on user type
  if (user?.userType === 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Business Profile Header */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
            <div className="flex items-center space-x-8 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Building className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{user.name || 'Business User'}</h1>
                <p className="text-gray-300 flex items-center mt-2 font-medium">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </p>
                <p className="text-gray-400 flex items-center mt-2 font-medium">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined January 2024
                </p>
                <div className="flex items-center mt-3">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-gray-300 font-medium">4.8/5.0 Business Rating</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {businessStats.map((stat, index) => (
                <div key={index} className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl group hover:scale-105 transition-all duration-300">
                  <stat.icon className="w-8 h-8 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                  <div className="text-gray-300 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">About Our Company</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              TechStart is a leading technology company specializing in innovative software solutions. 
              We partner with content creators to build authentic relationships with our audience and 
              showcase our products through engaging, high-quality content. Our mission is to make 
              technology accessible to everyone through creative storytelling and expert insights.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">techstart.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Technology & Software</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">50+ Employees</span>
              </div>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-8">Recent Campaigns</h2>
            <div className="space-y-6">
              {businessBounties.map((bounty, index) => (
                <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                  <div>
                    <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                    <p className="text-gray-300 font-medium">{bounty.creators} creators • {bounty.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                      bounty.status === 'completed' ? 'bg-green-500 text-white' :
                      bounty.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {bounty.status}
                    </span>
                    <span className="font-bold text-2xl text-blue-400">${bounty.spent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Creators */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Top Performing Creators</h2>
            <div className="space-y-6">
              {topCreators.map((creator, index) => (
                <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{creator.name}</h3>
                      <p className="text-gray-300 text-sm">{creator.subscribers} subscribers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-gray-300 text-sm">Videos</p>
                      <p className="text-white font-semibold">{creator.videos}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 text-sm">Rating</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-white font-semibold">{creator.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Creator profile (existing code)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
          <div className="flex items-center space-x-8 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{user?.name || 'Creator User'}</h1>
              <p className="text-gray-300 flex items-center mt-2 font-medium">
                <Mail className="w-4 h-4 mr-2" />
                {user?.email}
              </p>
              <p className="text-gray-400 flex items-center mt-2 font-medium">
                <Calendar className="w-4 h-4 mr-2" />
                Joined January 2024
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {creatorStats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl group hover:scale-105 transition-all duration-300">
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Bio */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">About</h2>
          <p className="text-gray-300 leading-relaxed">
            Content creator and marketing strategist with expertise in crypto, technology, and product reviews. 
            I specialize in creating authentic, engaging content that helps businesses connect with their target 
            audience. My content consistently achieves high engagement rates and drives real results for brands.
          </p>
        </div>

        {/* Portfolio */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
          <div className="space-y-6">
            {completedBounties.map((bounty, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div>
                  <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                  <p className="text-gray-300 font-medium">{bounty.company} • {bounty.date}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold">
                    Completed
                  </span>
                  <span className="font-bold text-2xl text-green-400">${bounty.earned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile