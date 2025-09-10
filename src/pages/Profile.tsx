import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hybridData, firebaseDB } from '../services/firebase'
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
  Star,
  Edit3,
  Save,
  X,
  MapPin,
  Phone,
  Briefcase,
  Share2,
  Clock
} from 'lucide-react'
import RatingSection from '../components/profile/RatingSection'
import SocialMediaTab from '../components/social/SocialMediaTab'
import RecentWork from '../components/profile/RecentWork'

interface BusinessProfile {
  companyName: string
  description: string
  website: string
  industry: string
  location: string
  phone: string
  employeeCount: string
  foundedYear: string
  mission: string
}

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'general' | 'social' | 'reviews'>('general')
  const [creatorStats, setCreatorStats] = useState([
    { label: "Bounties Completed", value: "0", icon: Award },
    { label: "Total Earned", value: "$0", icon: DollarSign }
  ])
  const [businessStats, setBusinessStats] = useState([
    { label: "Bounties Created", value: "0", icon: Target },
    { label: "Creators Worked With", value: "0", icon: Users },
    { label: "Total Spent", value: "$0", icon: DollarSign },
    { label: "Avg. Engagement", value: "0%", icon: TrendingUp }
  ])
  const [userRating, setUserRating] = useState<number | null>(null)
  const [joinDate, setJoinDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    companyName: user?.name || '',
    description: '',
    website: '',
    industry: '',
    location: '',
    phone: '',
    employeeCount: '',
    foundedYear: '',
    mission: ''
  })

  // Creator profile state
  const [creatorProfile, setCreatorProfile] = useState({
    bio: '',
    specialties: [],
    platforms: [],
    location: '',
    experience: '',
    languages: [],
    availability: '',
    rate: ''
  })

  // Load real stats and profile data when user is available
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const stats = await hybridData.getUserStats(user.id, user.userType)
          
          if (user.userType === 'creator') {
            setCreatorStats([
              { label: "Bounties Completed", value: (stats.bountiesCompleted || 0).toString(), icon: Award },
              { label: "Total Earned", value: `$${(stats.totalEarned || 0).toLocaleString()}`, icon: DollarSign }
            ])
            
            // Load creator profile data from Firestore
            const userDoc = await firebaseDB.getUser(user.id)
            if (userDoc) {
              const profile = userDoc.profile || {}
              setCreatorProfile({
                bio: profile.bio || '',
                specialties: (userDoc as any).specialties || [],
                platforms: (userDoc as any).platforms || [],
                location: (userDoc as any).location || '',
                experience: (userDoc as any).experience || '',
                languages: (userDoc as any).languages || [],
                availability: (userDoc as any).availability || '',
                rate: (userDoc as any).rate || ''
              })
              
              // Set real join date from user creation
              if (userDoc.createdAt) {
                const joinDate = new Date(userDoc.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })
                setJoinDate(joinDate)
              }
              
              // Set user rating (could come from reviews/feedback in the future)
              // For now, only show if there are actual ratings
              if ((userDoc as any).rating && (userDoc as any).reviewCount > 0) {
                setUserRating((userDoc as any).rating)
              }
            }
          } else if (user.userType === 'business') {
            setBusinessStats([
              { label: "Bounties Created", value: (stats.bountiesCreated || 0).toString(), icon: Target },
              { label: "Creators Worked With", value: (stats.creatorsWorkedWith || 0).toString(), icon: Users },
              { label: "Total Spent", value: `$${(stats.totalSpent || 0).toLocaleString()}`, icon: DollarSign },
              { label: "Avg. Engagement", value: stats.avgEngagement || "0%", icon: TrendingUp }
            ])
            
            // Load business profile data from Firestore
            const userDoc = await firebaseDB.getUser(user.id)
            if (userDoc) {
              const profile = userDoc.profile || {}
              setBusinessProfile({
                companyName: profile.company || user.name || '',
                description: profile.bio || '',
                website: profile.website || '',
                industry: (userDoc as any).industry || '',
                location: (userDoc as any).location || '',
                phone: (userDoc as any).phone || '',
                employeeCount: (userDoc as any).employeeCount || '',
                foundedYear: (userDoc as any).foundedYear || '',
                mission: (userDoc as any).mission || ''
              })
              
              // Set real join date from user creation
              if (userDoc.createdAt) {
                const joinDate = new Date(userDoc.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })
                setJoinDate(joinDate)
              }
              
              // Set user rating (could come from reviews/feedback in the future)
              // For now, only show if there are actual ratings
              if ((userDoc as any).rating && (userDoc as any).reviewCount > 0) {
                setUserRating((userDoc as any).rating)
              }
            }
            
            // Load business bounties
            const bounties = await firebaseDB.getBountiesByUser(user.id)
            const recentBounties = bounties.slice(0, 5).map(bounty => ({
              title: bounty.title,
              status: bounty.status,
              creators: bounty.applicationsCount || 0,
              spent: bounty.payment.amount,
              date: new Date(bounty.createdAt).toISOString().split('T')[0]
            }))
            setBusinessBounties(recentBounties)
            
            // Load top performing creators (for now, use placeholder until we have creator performance data)
            setTopCreators([])
          }
        } catch (error) {
          console.error('Error loading user data:', error)
          // Keep default empty values if there's an error
        }
      }
      setLoading(false)
    }

    loadUserData()
  }, [user])

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return
      
      if (user.userType === 'business') {
        console.log('Saving business profile:', businessProfile)
        await firebaseDB.updateBusinessProfile(user.id, businessProfile)
        alert('Business profile updated successfully!')
      } else {
        console.log('Saving creator profile:', creatorProfile)
        // TODO: Implement creator profile update in Firebase
        // await firebaseDB.updateCreatorProfile(user.id, creatorProfile)
        alert('Creator profile updated successfully!')
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleCancelEdit = async () => {
    setIsEditing(false)
    // Reset form to actual database values
    if (user?.userType === 'business') {
      try {
        const userDoc = await firebaseDB.getUser(user.id)
        if (userDoc) {
          const profile = userDoc.profile || {}
          setBusinessProfile({
            companyName: profile.company || user.name || '',
            description: profile.bio || '',
            website: profile.website || '',
            industry: (userDoc as any).industry || '',
            location: (userDoc as any).location || '',
            phone: (userDoc as any).phone || '',
            employeeCount: (userDoc as any).employeeCount || '',
            foundedYear: (userDoc as any).foundedYear || '',
            mission: (userDoc as any).mission || ''
          })
        }
      } catch (error) {
        console.error('Error resetting business profile:', error)
      }
    } else {
      try {
        const userDoc = await firebaseDB.getUser(user.id)
        if (userDoc) {
          const profile = userDoc.profile || {}
          setCreatorProfile({
            bio: profile.bio || '',
            specialties: (userDoc as any).specialties || [],
            platforms: (userDoc as any).platforms || [],
            location: (userDoc as any).location || '',
            experience: (userDoc as any).experience || '',
            languages: (userDoc as any).languages || [],
            availability: (userDoc as any).availability || '',
            rate: (userDoc as any).rate || ''
          })
        }
      } catch (error) {
        console.error('Error resetting creator profile:', error)
      }
    }
  }


  const [businessBounties, setBusinessBounties] = useState([])

  const [topCreators, setTopCreators] = useState([])

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
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-4xl font-bold text-white">{businessProfile.companyName}</h1>
                  <button
                    onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-300 flex items-center mt-2 font-medium">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </p>
                <p className="text-gray-400 flex items-center mt-2 font-medium">
                  <Calendar className="w-4 h-4 mr-2" />
                  {joinDate ? `Joined ${joinDate}` : 'Member since account creation'}
                </p>
                {userRating !== null && (
                  <div className="flex items-center mt-3">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-gray-300 font-medium">{userRating.toFixed(1)}/5.0 Business Rating</span>
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">About Our Company</h2>
              {isEditing && (
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={businessProfile.companyName}
                    onChange={(e) => setBusinessProfile({...businessProfile, companyName: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Company Description</label>
                  <textarea
                    value={businessProfile.description}
                    onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Describe your company and what you do..."
                  />
                </div>

                {/* Mission */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Mission Statement</label>
                  <textarea
                    value={businessProfile.mission}
                    onChange={(e) => setBusinessProfile({...businessProfile, mission: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="What is your company's mission?"
                  />
                </div>

                {/* Company Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={businessProfile.website}
                      onChange={(e) => setBusinessProfile({...businessProfile, website: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Industry</label>
                    <input
                      type="text"
                      value={businessProfile.industry}
                      onChange={(e) => setBusinessProfile({...businessProfile, industry: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={businessProfile.location}
                      onChange={(e) => setBusinessProfile({...businessProfile, location: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="City, State/Country"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={businessProfile.phone}
                      onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Employee Count</label>
                    <input
                      type="text"
                      value={businessProfile.employeeCount}
                      onChange={(e) => setBusinessProfile({...businessProfile, employeeCount: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., 50+, 100-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Founded Year</label>
                    <input
                      type="text"
                      value={businessProfile.foundedYear}
                      onChange={(e) => setBusinessProfile({...businessProfile, foundedYear: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {businessProfile.description || 'Add a company description to tell creators about your business and mission.'}
                </p>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Our Mission</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {businessProfile.mission || 'Share your company mission to help creators understand your values and goals.'}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.website || 'Website not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.industry || 'Industry not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.employeeCount ? `${businessProfile.employeeCount} Employees` : 'Employee count not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.phone || 'Phone not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">{businessProfile.foundedYear ? `Founded ${businessProfile.foundedYear}` : 'Founded year not specified'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Campaign Performance */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-8">Recent Campaigns</h2>
            {businessBounties.length > 0 ? (
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
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">No Campaigns Yet</h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Start creating bounties to build relationships with talented creators and grow your brand!
                </p>
                <button 
                  onClick={() => window.location.href = '/bounties/new'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <Target className="w-4 h-4 mr-2 inline" />
                  Create Your First Bounty
                </button>
              </div>
            )}
          </div>

          {/* Top Performing Creators */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Top Performing Creators</h2>
            {topCreators.length > 0 ? (
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
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">No Creator Data Yet</h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Creator performance data will appear here as you complete more campaigns and build relationships.
                </p>
                <button 
                  onClick={() => window.location.href = '/creators'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2 inline" />
                  Find Creators
                </button>
              </div>
            )}
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
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold text-white">{user?.name || 'Creator User'}</h1>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-300 flex items-center mt-2 font-medium">
                <Mail className="w-4 h-4 mr-2" />
                {user?.email}
              </p>
              <p className="text-gray-400 flex items-center mt-2 font-medium">
                <Calendar className="w-4 h-4 mr-2" />
                {joinDate ? `Joined ${joinDate}` : 'Member since account creation'}
              </p>
              {userRating !== null && (
                <div className="flex items-center mt-3">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-gray-300 font-medium">{userRating.toFixed(1)}/5.0 Creator Rating</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {creatorStats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl group hover:scale-105 transition-all duration-300">
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl mb-12">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'social'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Share2 className="w-4 h-4 inline mr-2" />
              Social Media
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Reviews
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <>
            {/* Creator Bio */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">About</h2>
                {isEditing && (
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-6">
                  {/* Bio */}
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Bio</label>
                    <textarea
                      value={creatorProfile.bio}
                      onChange={(e) => setCreatorProfile({...creatorProfile, bio: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Tell us about yourself and your content creation expertise..."
                    />
                  </div>

                  {/* Specialties */}
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Specialties (comma-separated)</label>
                    <input
                      type="text"
                      value={creatorProfile.specialties.join(', ')}
                      onChange={(e) => setCreatorProfile({...creatorProfile, specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Crypto, Technology, Product Reviews"
                    />
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Content Platforms (comma-separated)</label>
                    <input
                      type="text"
                      value={creatorProfile.platforms.join(', ')}
                      onChange={(e) => setCreatorProfile({...creatorProfile, platforms: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., YouTube, TikTok, Instagram"
                    />
                  </div>

                  {/* Creator Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={creatorProfile.location}
                        onChange={(e) => setCreatorProfile({...creatorProfile, location: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="City, State/Country"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Experience</label>
                      <input
                        type="text"
                        value={creatorProfile.experience}
                        onChange={(e) => setCreatorProfile({...creatorProfile, experience: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g., 5+ years, 2 years"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Languages (comma-separated)</label>
                      <input
                        type="text"
                        value={creatorProfile.languages.join(', ')}
                        onChange={(e) => setCreatorProfile({...creatorProfile, languages: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g., English, Spanish"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Availability</label>
                      <input
                        type="text"
                        value={creatorProfile.availability}
                        onChange={(e) => setCreatorProfile({...creatorProfile, availability: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g., Full-time, Part-time, Freelance"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Rate Range</label>
                      <input
                        type="text"
                        value={creatorProfile.rate}
                        onChange={(e) => setCreatorProfile({...creatorProfile, rate: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g., $50-100 per video"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-300 leading-relaxed">
                    {creatorProfile.bio || 'Complete your bio to let businesses know about your content creation expertise and style.'}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {creatorProfile.specialties.length > 0 ? (
                          creatorProfile.specialties.map((specialty, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                              {specialty}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm italic">Add your content specialties to help businesses find you</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Content Platforms</h3>
                      <div className="flex flex-wrap gap-2">
                        {creatorProfile.platforms.length > 0 ? (
                          creatorProfile.platforms.map((platform, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                              {platform}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm italic">Add the platforms where you create content</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">{creatorProfile.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">{creatorProfile.experience ? `${creatorProfile.experience} experience` : 'Experience not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">{creatorProfile.languages.length > 0 ? creatorProfile.languages.join(', ') : 'Languages not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">{creatorProfile.availability || 'Availability not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">{creatorProfile.rate || 'Rate not specified'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Work - Dynamic Component */}
            <RecentWork userId={user?.id || ''} />
          </>
        )}

        {activeTab === 'social' && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
            <SocialMediaTab />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <RatingSection 
              userId={user?.id || ''} 
              userName={user?.name || 'User'} 
              userType={user?.userType || 'creator'}
              isOwnProfile={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile