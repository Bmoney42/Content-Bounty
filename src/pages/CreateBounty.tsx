import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB } from '../services/firebase'
import { StripeService } from '../services/stripe'
import { formatFeeBreakdown, calculateBusinessTotal, formatCurrency } from '../config/stripe'
import { sanitizeInput, bountySchema, validateForm } from '../utils/validation'
import { 
  ArrowLeft, 
  Target, 
  DollarSign, 
  Calendar, 
  Users, 
  Eye, 
  Star,
  Plus,
  User,
  Globe,
  Shield,
  CreditCard
} from 'lucide-react'

const CreateBounty: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bountyType, setBountyType] = useState<'assigned' | 'open'>('open')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [escrowAmounts, setEscrowAmounts] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'review',
    payment: {
      amount: '',
      type: 'fixed',
      milestones: []
    },
    requirements: {
      minViews: '',
      minSubscribers: '',
      platform: 'any'
    },
    talkingPoints: [''],
    deadline: '',
    maxCreators: '',
    maxApplications: '',
    assignedCreator: ''
  })

  const categories = [
    { value: 'review', label: 'Product Review', icon: '📱' },
    { value: 'tutorial', label: 'Tutorial', icon: '🎓' },
    { value: 'unboxing', label: 'Unboxing', icon: '📦' },
    { value: 'demo', label: 'Demo', icon: '🎬' },
    { value: 'testimonial', label: 'Testimonial', icon: '💬' },
    { value: 'interview', label: 'Interview', icon: '🎤' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user) {
      setError('You must be logged in to create bounties')
      setLoading(false)
      return
    }

    if (user.userType !== 'business') {
      setError('Only business accounts can create bounties')
      setLoading(false)
      return
    }

    try {
      // Sanitize and validate form data
      const sanitizedData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        budget: parseFloat(formData.payment.amount),
        category: formData.category,
        requirements: formData.talkingPoints.filter(tp => tp.trim()).map(tp => sanitizeInput(tp)),
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      }

      // Basic validation
      if (!sanitizedData.title || !sanitizedData.description || !sanitizedData.budget) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (sanitizedData.budget < 10 || sanitizedData.budget > 10000) {
        setError('Budget must be between $10 and $10,000')
        setLoading(false)
        return
      }

      // Create bounty as pending first (payment can happen later)
      const maxCreators = formData.maxCreators ? parseInt(formData.maxCreators) : 1
      const maxApplications = formData.maxApplications ? parseInt(formData.maxApplications) : undefined
      
      const bountyData = {
        title: sanitizedData.title,
        description: sanitizedData.description,
        budget: sanitizedData.budget,
        category: formData.category,
        requirements: sanitizedData.requirements,
        deadline: sanitizedData.deadline || new Date(),
        status: 'pending' as const,
        createdBy: user.id,
        businessId: user.id,
        applicationsCount: 0,
        maxCreators: maxCreators > 1 ? maxCreators : undefined,
        maxApplications: maxApplications || undefined, // null = unlimited applications
        // Initialize payment tracking fields
        paidCreatorsCount: 0,
        totalPaidAmount: 0,
        remainingBudget: sanitizedData.budget * maxCreators
      }

      // Create the bounty in Firebase with pending status
      const bountyId = await firebaseDB.createBounty(bountyData)
      
      // Calculate payment amounts for Stripe
      const totalBountyAmount = sanitizedData.budget * maxCreators
      const platformFee = totalBountyAmount * 0.05 // 5% platform fee
      const totalPayment = totalBountyAmount + platformFee
      const amountInCents = Math.round(totalPayment * 100)
      
      // Now redirect to Stripe to pay for the pending bounty
      await StripeService.createEscrowPayment(
        bountyId,
        user.id,
        amountInCents,
        user.email || ''
      )
      
      // Payment will redirect to Stripe checkout
      // On success, the webhook will update the bounty status to 'active'
      
    } catch (err) {
      console.error('Error creating bounty:', err)
      setError('Failed to create bounty. Please try again.')
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!user || !escrowAmounts) return

    setLoading(true)
    setError('')

    try {
      // Calculate payment amounts
      const maxCreators = formData.maxCreators ? parseInt(formData.maxCreators) : 1
      const totalBudget = parseFloat(formData.payment.amount) * maxCreators
      const amountInCents = Math.round(totalBudget * 100)
      
      // Create escrow payment FIRST - this will redirect to Stripe checkout
      // The bounty will only be created after successful payment via webhook
      await StripeService.createEscrowPaymentUpfront(
        {
          title: sanitizeInput(formData.title),
          description: sanitizeInput(formData.description),
          budget: parseFloat(formData.payment.amount),
          category: formData.category,
          requirements: formData.talkingPoints.filter(tp => tp.trim()).map(tp => sanitizeInput(tp)),
          deadline: formData.deadline ? new Date(formData.deadline) : new Date(),
          maxCreators: formData.maxCreators ? parseInt(formData.maxCreators) : undefined,
        },
        user.id,
        amountInCents,
        user.email || ''
      )
      
      // Payment will redirect to Stripe checkout
      // On success, the webhook will create the bounty with 'active' status
      
    } catch (err) {
      console.error('Error creating escrow payment:', err)
      setError('Failed to create escrow payment. Please try again.')
      setLoading(false)
    }
  }

  const addTalkingPoint = () => {
    setFormData(prev => ({
      ...prev,
      talkingPoints: [...prev.talkingPoints, '']
    }))
  }

  const updateTalkingPoint = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      talkingPoints: prev.talkingPoints.map((point, i) => i === index ? value : point)
    }))
  }

  const removeTalkingPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      talkingPoints: prev.talkingPoints.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/bounties')}
            className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bounties</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">Create New Bounty</h1>
          <p className="text-gray-300 text-lg">Set up a bounty for creators to complete</p>
        </div>

        {/* Bounty Type Selection */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Bounty Type</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setBountyType('open')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                bountyType === 'open'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-white/20 text-gray-300 hover:border-white/40'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Globe className="w-6 h-6" />
                <span className="font-semibold text-lg">Open Bounty</span>
              </div>
              <p className="text-sm opacity-80">Available to all creators. First come, first served.</p>
            </button>
            <button
              onClick={() => setBountyType('assigned')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                bountyType === 'assigned'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-white/20 text-gray-300 hover:border-white/40'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-6 h-6" />
                <span className="font-semibold text-lg">Assigned Bounty</span>
              </div>
              <p className="text-sm opacity-80">Directly assign to a specific creator.</p>
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && escrowAmounts && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Secure Escrow Payment</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Bounty Amount:</span>
                    <span className="text-white font-semibold">${(escrowAmounts.totalAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Platform Fees:</span>
                    <span className="text-green-400">$0.00</span>
                  </div>
                  <div className="border-t border-white/20 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Creator Earnings:</span>
                      <span className="text-green-400 font-semibold">${(escrowAmounts.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Secure Upfront Payment</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Payment is required upfront to create your bounty. Funds are held securely in escrow until work completion and approval.
                  </p>
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <p className="text-xs text-green-400">
                      ✓ Guarantees creator payment<br/>
                      ✓ Shows serious commitment<br/>
                      ✓ Attracts quality applicants
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Secure Payment & Create</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <Target className="w-6 h-6" />
              <span>Basic Information</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Bounty Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Create a product review video"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-white font-semibold mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Describe what you want creators to do..."
                required
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <DollarSign className="w-6 h-6" />
              <span>Payment Details</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Budget Per Creator *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={formData.payment.amount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      payment: { ...prev.payment, amount: e.target.value }
                    }))}
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="100"
                    min="10"
                    max="10000"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">Minimum $10, Maximum $10,000 per creator</p>
                {formData.payment.amount && !formData.maxCreators && (
                  <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    {(() => {
                      const bountyAmount = parseFloat(formData.payment.amount)
                      const fees = formatFeeBreakdown(bountyAmount, 1)
                      return (
                        <div className="text-xs space-y-1">
                          <p className="text-purple-400">
                            <span className="font-semibold">Single Creator Estimate:</span>
                          </p>
                          <p className="text-purple-300">
                            Creator receives: {fees.bountyAmount} • You pay: {fees.businessTotal}
                          </p>
                          <p className="text-purple-300">
                            (Includes {fees.platformFee} service fee - that's it!)
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-white font-semibold mb-2">Goal: Max Creators Needed</label>
              <input
                type="number"
                value={formData.maxCreators}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCreators: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g., 5 creators needed (leave empty for unlimited)"
                min="1"
              />
              <p className="text-gray-400 text-sm mt-1">How many creators will be paid for this bounty</p>
              {formData.maxCreators && formData.payment.amount && (
                <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="space-y-2">
                    <p className="text-blue-400 text-sm">
                      <span className="font-semibold">Bounty per Creator:</span> {formData.payment.amount}
                    </p>
                    <p className="text-blue-400 text-sm">
                      <span className="font-semibold">Total Bounty Amount:</span> {formData.payment.amount} × {formData.maxCreators} = {(parseFloat(formData.payment.amount) * parseInt(formData.maxCreators)).toFixed(2)}
                    </p>
                    <div className="border-t border-blue-500/20 pt-2 mt-2">
                      {(() => {
                        const perCreatorAmount = parseFloat(formData.payment.amount)
                        const creatorCount = parseInt(formData.maxCreators)
                        const fees = formatFeeBreakdown(perCreatorAmount, creatorCount)
                        return (
                          <>
                            <p className="text-blue-300 text-xs">
                              <span className="font-semibold">Service Fee (5%):</span> {fees.platformFee}
                            </p>
                            <p className="text-white font-bold border-t border-blue-500/20 pt-2 mt-2">
                              <span className="font-semibold">Total You Pay:</span> {fees.businessTotal}
                            </p>
                            <p className="text-green-400 text-xs mt-1">
                              ✓ Creators receive the full {fees.bountyAmount} bounty amount
                            </p>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <label className="block text-white font-semibold mb-2">Max Applications to Accept</label>
              <input
                type="number"
                value={formData.maxApplications}
                onChange={(e) => setFormData(prev => ({ ...prev, maxApplications: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g., 20 applications (leave empty for unlimited)"
                min="1"
                onInvalid={(e) => {
                  // Allow empty values for unlimited applications
                  if (e.currentTarget.value === '') {
                    e.currentTarget.setCustomValidity('')
                  } else {
                    e.currentTarget.setCustomValidity('Please enter a number greater than 0')
                  }
                }}
              />
              <p className="text-gray-400 text-sm mt-1">How many applications to accept before closing (leave empty for unlimited)</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <Star className="w-6 h-6" />
              <span>Requirements & Talking Points</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Talking Points</label>
                {formData.talkingPoints.map((point, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateTalkingPoint(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder={`Talking point ${index + 1}`}
                    />
                    {formData.talkingPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTalkingPoint(index)}
                        className="px-3 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTalkingPoint}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Talking Point</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating & Redirecting to Payment...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Create Bounty & Pay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBounty
