import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB, firebaseAuth } from '../services/firebase'
import { hasAdminAccess } from '../config/adminConfig'
import AdminAccessInfo from '../components/admin/AdminAccessInfo'
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  UserCheck,
  Calendar,
  Activity,
  FileText,
  Shield,
  Settings,
  BarChart3,
  Clock,
  Star,
  TestTube,
  Bug
} from 'lucide-react'
import { Bounty, BountySubmission } from '../types/bounty'
import { User } from '../types/auth'

interface AdminStats {
  totalUsers: number
  totalCreators: number
  totalBusinesses: number
  totalBounties: number
  activeBounties: number
  completedBounties: number
  totalRevenue: number
  pendingReviews: number
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bounties' | 'content' | 'payments' | 'debug'>('overview')
  
  // Stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCreators: 0,
    totalBusinesses: 0,
    totalBounties: 0,
    activeBounties: 0,
    completedBounties: 0,
    totalRevenue: 0,
    pendingReviews: 0
  })
  
  // Data
  const [users, setUsers] = useState<User[]>([])
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [submissions, setSubmissions] = useState<BountySubmission[]>([])
  
  // Filters
  const [userFilter, setUserFilter] = useState<'all' | 'creator' | 'business'>('all')
  const [bountyFilter, setBountyFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debug tools state
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [activationResult, setActivationResult] = useState<any>(null)
  const [manualActivationId, setManualActivationId] = useState('')
  
  // Manual bounty creation state
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [bountyTitle, setBountyTitle] = useState('')
  const [bountyDescription, setBountyDescription] = useState('')
  const [creationResult, setCreationResult] = useState<any>(null)
  
  // Link existing bounty state
  const [linkPaymentIntentId, setLinkPaymentIntentId] = useState('')
  const [linkBountyId, setLinkBountyId] = useState('')
  const [linkResult, setLinkResult] = useState<any>(null)

  // Check admin access
  useEffect(() => {
    if (!user) {
      return
    }
    
    // Secure admin access check using authorized admin list
    const isAdmin = hasAdminAccess(user)
    
    if (!isAdmin) {
      console.warn('⚠️ SECURITY: Unauthorized admin access attempt by:', user.email)
      // Show access info instead of redirecting
      setLoading(false)
      return
    }
    
    loadAdminData()
  }, [user])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Load all users (this would need pagination in production)
      const allUsers = await firebaseDB.getAllUsers()
      setUsers(allUsers)
      
      // Load all bounties
      const allBounties = await firebaseDB.getAllBounties()
      setBounties(allBounties)
      
      // Load pending submissions for review
      const pendingSubmissions = await firebaseDB.getPendingSubmissions()
      setSubmissions(pendingSubmissions)
      
      // Calculate stats
      const creators = allUsers.filter(u => u.userType === 'creator')
      const businesses = allUsers.filter(u => u.userType === 'business')
      const activeBounties = allBounties.filter(b => b.status === 'active')
      const completedBounties = allBounties.filter(b => b.status === 'completed')
      
      // Calculate total revenue (5% platform fee)
      const totalSpent = completedBounties.reduce((sum, b) => {
        const amount = b.payment?.amount || 0
        const creators = b.maxCreators || 1
        return sum + (amount * creators)
      }, 0)
      const platformRevenue = totalSpent * 0.05
      
      setStats({
        totalUsers: allUsers.length,
        totalCreators: creators.length,
        totalBusinesses: businesses.length,
        totalBounties: allBounties.length,
        activeBounties: activeBounties.length,
        completedBounties: completedBounties.length,
        totalRevenue: platformRevenue,
        pendingReviews: pendingSubmissions.length
      })
      
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'verify') => {
    try {
      await firebaseDB.updateUserStatus(userId, action)
      await loadAdminData() // Refresh data
      alert(`User ${action}d successfully`)
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Failed to ${action} user`)
    }
  }

  const handleBountyAction = async (bountyId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      await firebaseDB.updateBountyStatus(bountyId, action)
      await loadAdminData() // Refresh data
      alert(`Bounty ${action}d successfully`)
    } catch (error) {
      console.error(`Error ${action}ing bounty:`, error)
      alert(`Failed to ${action} bounty`)
    }
  }

  const handleSubmissionReview = async (submissionId: string, action: 'approve' | 'reject', feedback?: string) => {
    try {
      await firebaseDB.reviewSubmission(submissionId, action, feedback)
      await loadAdminData() // Refresh data
      alert(`Submission ${action}d successfully`)
    } catch (error) {
      console.error(`Error reviewing submission:`, error)
      alert(`Failed to review submission`)
    }
  }

  // Debug functions
  const checkPaymentStatus = async () => {
    try {
      const firebaseUser = firebaseAuth.getCurrentUser()
      if (!firebaseUser) {
        alert('No user authenticated')
        return
      }
      
      const token = await firebaseUser.getIdToken()
      const response = await fetch('/api/check-payment-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }
      
      const data = await response.json()
      setPaymentStatus(data)
      console.log('Payment status:', data)
    } catch (error) {
      console.error('Error checking payment status:', error)
      alert('Failed to check payment status')
    }
  }

  const manualActivateBounty = async () => {
    if (!manualActivationId) {
      alert('Please enter an escrow payment ID')
      return
    }

    const firebaseUser = firebaseAuth.getCurrentUser()
    if (!firebaseUser) {
      alert('No user authenticated')
      return
    }

    try {
      const token = await firebaseUser.getIdToken()
      const response = await fetch('/api/manual-bounty-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          escrowPaymentId: manualActivationId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to activate bounty')
      }
      
      const data = await response.json()
      setActivationResult(data)
      console.log('Activation result:', data)
      
      if (data.success) {
        setManualActivationId('') // Clear the input
        await loadAdminData() // Refresh admin data
      }
    } catch (error) {
      console.error('Error activating bounty:', error)
      setActivationResult({
        success: false,
        message: 'Failed to activate bounty: ' + error.message
      })
    }
  }

  const checkEnvironment = async () => {
    try {
      const firebaseUser = firebaseAuth.getCurrentUser()
      if (!firebaseUser) {
        alert('No user authenticated')
        return
      }
      
      const token = await firebaseUser.getIdToken()
      const response = await fetch('/api/check-payment-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to check environment')
      }
      
      const data = await response.json()
      setPaymentStatus(data) // This includes environment info
      console.log('Environment check:', data.environment)
    } catch (error) {
      console.error('Error checking environment:', error)
      alert('Failed to check environment')
    }
  }

  const createBountyFromPayment = async () => {
    if (!paymentIntentId) {
      alert('Please enter a Payment Intent ID')
      return
    }

    const firebaseUser = firebaseAuth.getCurrentUser()
    if (!firebaseUser) {
      alert('No user authenticated')
      return
    }

    try {
      const token = await firebaseUser.getIdToken()
      const response = await fetch('/api/manual-bounty-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentIntentId,
          bountyData: {
            title: bountyTitle || 'Promote Creator Bounty',
            description: bountyDescription || 'Fund this bounty to make it live on the marketplace',
            category: 'marketing'
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create bounty')
      }
      
      const data = await response.json()
      setCreationResult(data)
      console.log('Bounty creation result:', data)
      alert('Bounty created successfully!')
    } catch (error) {
      console.error('Error creating bounty:', error)
      alert('Failed to create bounty: ' + error.message)
    }
  }

  const linkExistingBounty = async () => {
    if (!linkPaymentIntentId || !linkBountyId) {
      alert('Please enter both Payment Intent ID and Bounty ID')
      return
    }

    const firebaseUser = firebaseAuth.getCurrentUser()
    if (!firebaseUser) {
      alert('No user authenticated')
      return
    }

    try {
      const token = await firebaseUser.getIdToken()
      const response = await fetch('/api/link-bounty-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentIntentId: linkPaymentIntentId,
          bountyId: linkBountyId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link bounty')
      }
      
      const data = await response.json()
      setLinkResult(data)
      console.log('Bounty linking result:', data)
      alert('Bounty linked successfully!')
    } catch (error) {
      console.error('Error linking bounty:', error)
      alert('Failed to link bounty: ' + error.message)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = userFilter === 'all' || user.userType === userFilter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredBounties = bounties.filter(bounty => {
    const matchesFilter = bountyFilter === 'all' || bounty.status === bountyFilter
    const matchesSearch = bounty.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Check if user is authorized for admin access
  if (user && !hasAdminAccess(user)) {
    return <AdminAccessInfo />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-300">Platform management and oversight</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalUsers}</h3>
            <p className="text-gray-300 text-sm">Platform Users</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.totalCreators} creators • {stats.totalBusinesses} businesses
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-green-400" />
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalBounties}</h3>
            <p className="text-gray-300 text-sm">Total Bounties</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.activeBounties} active • {stats.completedBounties} completed
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">${stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-gray-300 text-sm">Platform Revenue</p>
            <div className="text-xs text-gray-400 mt-2">5% platform fee</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.pendingReviews}</h3>
            <p className="text-gray-300 text-sm">Pending Reviews</p>
            <div className="text-xs text-gray-400 mt-2">Content awaiting review</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl mb-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'bounties', label: 'Bounties', icon: Target },
              { id: 'content', label: 'Content Review', icon: FileText },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'debug', label: 'Debug Tools', icon: Bug }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">Platform Overview</h2>
              
              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Bounties</h3>
                  <div className="space-y-3">
                    {bounties.slice(0, 5).map(bounty => (
                      <div key={bounty.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{bounty.title}</p>
                          <p className="text-gray-400 text-sm">{bounty.businessName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            bounty.status === 'active' ? 'bg-green-500/20 text-green-300' :
                            bounty.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {bounty.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.userType === 'creator' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {user.userType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">User Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as any)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Users</option>
                    <option value="creator">Creators</option>
                    <option value="business">Businesses</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.userType === 'creator' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {user.userType}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUserAction(user.id, 'verify')}
                          className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                          title="Verify User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                          title="Suspend User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bounties' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Bounty Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search bounties..."
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                  <select
                    value={bountyFilter}
                    onChange={(e) => setBountyFilter(e.target.value as any)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Bounties</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredBounties.map(bounty => (
                  <div key={bounty.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{bounty.title}</h3>
                        <p className="text-gray-400 text-sm">{bounty.businessName}</p>
                        <p className="text-gray-400 text-sm">${bounty.payment?.amount || 0} • {bounty.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          bounty.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          bounty.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          bounty.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {bounty.status}
                        </span>
                        <button
                          onClick={() => handleBountyAction(bounty.id, 'flag')}
                          className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                          title="Flag Bounty"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{bounty.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Content Review</h2>
              
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
                    <p className="text-gray-400">No pending content reviews at this time.</p>
                  </div>
                ) : (
                  submissions.map(submission => (
                    <div key={submission.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">Submission for Bounty</h3>
                          <p className="text-gray-400 text-sm">{submission.creatorName}</p>
                          <p className="text-gray-400 text-sm">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSubmissionReview(submission.id, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleSubmissionReview(submission.id, 'reject', 'Needs revision')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm">
                        <p><strong>Description:</strong> {submission.description}</p>
                        {submission.contentLinks && (
                          <p><strong>Links:</strong> {submission.contentLinks}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Payment Management</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Platform Revenue</h3>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    ${stats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm">Total platform commission (5%)</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Completed Payments</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stats.completedBounties}
                  </div>
                  <p className="text-gray-400 text-sm">Successful bounty completions</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Activity</h3>
                <p className="text-gray-400">
                  Payment processing is handled automatically through Stripe. 
                  All escrow payments and creator payouts are managed by the system.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Debug Tools</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TestTube className="h-6 w-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Test Features</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Run comprehensive tests to verify system functionality and performance.
                  </p>
                  <a
                    href="/test-features"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Open Test Dashboard
                  </a>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Bug className="h-6 w-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Subscription Debug</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Diagnose subscription issues and manually fix payment problems.
                  </p>
                  <a
                    href="/subscription-debug"
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Open Debug Tools
                  </a>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TestTube className="h-6 w-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">YouTube OAuth Test</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Test YouTube OAuth configuration and API connectivity.
                  </p>
                  <a
                    href="/youtube-oauth-test"
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test YouTube OAuth
                  </a>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">Payment Status Check</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Check escrow payments, bounty status, and payment processing.
                  </p>
                  <button
                    onClick={() => checkPaymentStatus()}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Check Payments
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="h-6 w-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Manual Bounty Activation</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Manually activate bounties if payment went through but bounty wasn't created.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Escrow Payment ID"
                      value={manualActivationId}
                      onChange={(e) => setManualActivationId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
                    />
                    <button
                      onClick={() => manualActivateBounty()}
                      disabled={!manualActivationId}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Activate Bounty
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Settings className="h-6 w-6 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Environment Check</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Verify environment variables and configuration settings.
                  </p>
                  <button
                    onClick={() => checkEnvironment()}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Check Environment
                  </button>
                </div>

                {/* Manual Bounty Creation */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="h-6 w-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Manual Bounty Creation</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Create a bounty from a successful Stripe payment that didn't process properly.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Payment Intent ID (e.g., pi_3S5PvzHnrJ5Y7G900lHWdD4D)"
                      value={paymentIntentId}
                      onChange={(e) => setPaymentIntentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Bounty Title (optional)"
                      value={bountyTitle}
                      onChange={(e) => setBountyTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <textarea
                      placeholder="Bounty Description (optional)"
                      value={bountyDescription}
                      onChange={(e) => setBountyDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    <button
                      onClick={createBountyFromPayment}
                      disabled={!paymentIntentId}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Create Bounty from Payment
                    </button>
                  </div>
                </div>

                {/* Link Existing Bounty */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="h-6 w-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Link Existing Bounty</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Link an existing pending bounty with a successful Stripe payment to activate it.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Payment Intent ID (e.g., pi_3S5PvzHnrJ5Y7G900lHWdD4D)"
                      value={linkPaymentIntentId}
                      onChange={(e) => setLinkPaymentIntentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Bounty ID (from your pending bounties)"
                      value={linkBountyId}
                      onChange={(e) => setLinkBountyId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={linkExistingBounty}
                      disabled={!linkPaymentIntentId || !linkBountyId}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Link Bounty with Payment
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Status Results */}
              {paymentStatus && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Status Results</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded p-4">
                        <h4 className="text-white font-medium mb-2">Summary</h4>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p>Total Escrow Payments: {paymentStatus.summary.totalEscrowPayments}</p>
                          <p>Total Bounties: {paymentStatus.summary.totalBounties}</p>
                          <p>Recent Payments: {paymentStatus.summary.recentPayments}</p>
                          <p>Active Bounties: {paymentStatus.summary.activeBounties}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-4">
                        <h4 className="text-white font-medium mb-2">Environment</h4>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p>Frontend URL: {paymentStatus.environment.frontendUrl}</p>
                          <p>Node Env: {paymentStatus.environment.nodeEnv}</p>
                          <p>Has Stripe Key: {paymentStatus.environment.hasStripeKey ? '✅' : '❌'}</p>
                          <p>Has Webhook Secret: {paymentStatus.environment.hasWebhookSecret ? '✅' : '❌'}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-4">
                        <h4 className="text-white font-medium mb-2">Recent Payments</h4>
                        <div className="space-y-1 text-sm text-gray-300">
                          {paymentStatus.recentPayments.length > 0 ? (
                            paymentStatus.recentPayments.map((payment, index) => (
                              <div key={index} className="flex justify-between">
                                <span>${(payment.amount / 100).toFixed(2)}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  payment.status === 'held_in_escrow' ? 'bg-green-500/20 text-green-300' :
                                  payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p>No recent payments</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Activation Results */}
              {activationResult && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Manual Activation Result</h3>
                  <div className={`p-4 rounded-lg ${
                    activationResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <p className={`font-medium ${activationResult.success ? 'text-green-300' : 'text-red-300'}`}>
                      {activationResult.message}
                    </p>
                    {activationResult.bountyId && (
                      <p className="text-gray-300 text-sm mt-2">Bounty ID: {activationResult.bountyId}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <p><strong>Payment Status Check:</strong> View all escrow payments and bounty status</p>
                  <p><strong>Manual Bounty Activation:</strong> Activate bounties if payment went through but bounty wasn't created</p>
                  <p><strong>Environment Check:</strong> Verify configuration and environment variables</p>
                  <p><strong>Access Level:</strong> Admin only - these tools are restricted to administrators</p>
                  <p><strong>Status:</strong> ✅ Re-enabled with Vercel Pro plan (unlimited functions)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard