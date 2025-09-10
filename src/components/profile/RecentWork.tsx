import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Search, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { firebaseDB } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { BountyCategory } from '../../types/bounty'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface CompletedBounty {
  id: string
  title: string
  description: string
  company: string
  businessName?: string
  amount: number
  completedAt: Date
  status: string
  category: BountyCategory
}

interface RecentWorkProps {
  userId: string
}

const RecentWork: React.FC<RecentWorkProps> = ({ userId }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [completedBounties, setCompletedBounties] = useState<CompletedBounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompletedWork()
  }, [userId])

  const fetchCompletedWork = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all bounties where this creator has completed work
      const allBounties = await firebaseDB.getBounties()
      
      // Get applications for this creator to find completed work
      const creatorApplications = await firebaseDB.getCreatorApplications(userId)
      
      // Filter for bounties where this creator has accepted applications and bounty is completed
      const completedApplications = creatorApplications.filter(
        app => app.status === 'accepted'
      )
      
      const creatorCompletedWork = completedApplications
        .map(application => {
          const bounty = allBounties.find(b => b.id === application.bountyId && b.status === 'completed')
          if (!bounty) return null
          
          return {
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            company: bounty.businessName || 'Anonymous Business',
            amount: bounty.payment.amount,
            completedAt: new Date(bounty.createdAt),
            status: 'completed',
            category: bounty.category
          }
        })
        .filter((work): work is CompletedBounty => work !== null)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 5) // Show last 5 completed works

      setCompletedBounties(creatorCompletedWork)
    } catch (err) {
      console.error('Error fetching completed work:', err)
      setError('Failed to load recent work')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewBounties = () => {
    navigate('/bounties')
  }

  const handleViewBounty = (bountyId: string) => {
    navigate(`/bounties/${bountyId}`)
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-xl animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-white/20 rounded w-64"></div>
                  <div className="h-4 bg-white/10 rounded w-48"></div>
                </div>
                <div className="h-8 bg-white/20 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchCompletedWork} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state for new creators
  if (completedBounties.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
        
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-4">Ready to Start Creating?</h3>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Your completed work will appear here once you finish your first bounty. Start by browsing available opportunities!
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleViewBounties}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Available Bounties
            </Button>
            
            <p className="text-sm text-gray-400">
              💡 <strong>Pro tip:</strong> Complete your profile and connect social media to increase your chances of getting selected!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show actual completed work
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Recent Work</h2>
        <span className="text-sm text-gray-400">
          {completedBounties.length} completed project{completedBounties.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-6">
        {completedBounties.map((bounty) => (
          <div 
            key={bounty.id} 
            className="group flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer"
            onClick={() => handleViewBounty(bounty.id)}
          >
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">
                      {bounty.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-gray-300 text-sm mb-2">
                    <span className="font-medium">{bounty.company}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(bounty.completedAt)}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                      {bounty.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm line-clamp-1">
                    {bounty.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 ml-6">
                  <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </span>
                  <span className="font-bold text-2xl text-green-400 flex items-center">
                    <DollarSign className="w-5 h-5" />
                    {bounty.amount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {completedBounties.length >= 5 && (
        <div className="mt-6 text-center">
          <button 
            onClick={handleViewBounties}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View all completed work →
          </button>
        </div>
      )}
    </div>
  )
}

export default RecentWork