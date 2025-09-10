import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB } from '../services/firebase'
import { Users, Star, Award, Calendar, Eye, MessageSquare, CheckCircle, XCircle, Clock, Target, DollarSign } from 'lucide-react'

interface CreatorStats {
  id: string
  name: string
  totalBounties: number
  completedBounties: number
  totalEarnings: number
  averageRating: number
  lastActive: string
  status: 'active' | 'inactive'
  totalViews: number
  totalSubmissions: number
  pendingSubmissions: number
  rejectedSubmissions: number
}

const Creators: React.FC = () => {
  const { user } = useAuth()
  const [creators, setCreators] = useState<CreatorStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreatorsData()
  }, [])

  const fetchCreatorsData = async () => {
    try {
      setLoading(true)
      
      // Fetch all creators from the users collection
      const allCreators = await firebaseDB.getAllCreators()
      
      // Fetch applications and submissions to build creator stats
      const applications = await firebaseDB.getAllBountyApplications()
      const submissions = await firebaseDB.getAllBountySubmissions()
      const bounties = await firebaseDB.getBounties()

      // Initialize creator map with ALL registered creators
      const creatorMap = new Map<string, CreatorStats>()
      
      // Add all registered creators first
      allCreators.forEach(creator => {
        creatorMap.set(creator.uid, {
          id: creator.uid,
          name: creator.displayName || 'Unknown Creator',
          totalBounties: 0,
          completedBounties: 0,
          totalEarnings: 0,
          averageRating: 0,
          lastActive: creator.createdAt || new Date().toISOString(),
          status: 'active',
          totalViews: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0,
          rejectedSubmissions: 0
        })
      })

      // Process applications to update stats
      applications.forEach(app => {
        if (creatorMap.has(app.creatorId)) {
          const creator = creatorMap.get(app.creatorId)!
          creator.totalBounties++
          if (app.status === 'accepted') {
            creator.completedBounties++
          }
          // Update last active if this is more recent
          if (new Date(app.submittedAt) > new Date(creator.lastActive)) {
            creator.lastActive = app.submittedAt
          }
        }
      })

      // Process submissions to update stats
      submissions.forEach(sub => {
        if (creatorMap.has(sub.creatorId)) {
          const creator = creatorMap.get(sub.creatorId)!
          creator.totalSubmissions++
          
          // Update last active if this is more recent
          if (new Date(sub.submittedAt) > new Date(creator.lastActive)) {
            creator.lastActive = sub.submittedAt
          }
          
          if (sub.status === 'submitted') {
            creator.pendingSubmissions++
          } else if (sub.status === 'rejected') {
            creator.rejectedSubmissions++
          } else if (sub.status === 'approved') {
            // Find the bounty to get payment amount
            const bounty = bounties.find(b => b.id === sub.bountyId)
            if (bounty) {
              creator.totalEarnings += bounty.payment.amount
            }
          }
        }
      })

      // Calculate average ratings from actual data
      creatorMap.forEach(creator => {
        // Only show rating if creator has completed bounties
        if (creator.completedBounties > 0) {
          // For now, set a default rating until we implement real rating system
          creator.averageRating = 4.0
        } else {
          creator.averageRating = 0
        }
        // Remove fake views data
        creator.totalViews = 0
      })

      setCreators(Array.from(creatorMap.values()))
      console.log(`Loaded ${creatorMap.size} creators from database`)
    } catch (error) {
      console.error('Error fetching creators data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300'
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!user || user.userType !== 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300">This page is only available for business users.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Creator Management</h1>
          <p className="text-gray-300 text-lg">
            Manage your creator community, track performance, and monitor submissions.
          </p>
        </div>

        <div className="space-y-8">
          {/* Creators Stats Summary */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{creators.length}</div>
              <div className="text-gray-300 text-sm">Total Creators</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {creators.filter(c => c.status === 'active').length}
              </div>
              <div className="text-gray-300 text-sm">Active Creators</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                ${creators.reduce((sum, c) => sum + c.totalEarnings, 0).toLocaleString()}
              </div>
              <div className="text-gray-300 text-sm">Total Paid Out</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {creators.reduce((sum, c) => sum + c.totalSubmissions, 0)}
              </div>
              <div className="text-gray-300 text-sm">Total Submissions</div>
            </div>
          </div>

          {/* Creators List */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Creator Community</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-300">Loading creators...</div>
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No creators yet</h3>
                <p className="text-gray-400">Creators will appear here once they apply to your bounties.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {creators.map((creator) => (
                  <div key={creator.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      {/* Creator Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {creator.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">{creator.name}</h3>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(creator.status)}`}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(creator.status)}
                              <span className="capitalize">{creator.status}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Creator Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{creator.totalBounties} bounties</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-gray-300">{creator.completedBounties} completed</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">${creator.totalEarnings}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-300">{creator.averageRating.toFixed(1)} rating</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{creator.totalSubmissions} submissions</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submission Status */}
                    {creator.pendingSubmissions > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400">{creator.pendingSubmissions} pending</span>
                          </div>
                          {creator.rejectedSubmissions > 0 && (
                            <div className="flex items-center space-x-2">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">{creator.rejectedSubmissions} rejected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Creators
