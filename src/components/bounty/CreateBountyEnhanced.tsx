import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { EnhancedFirebaseService } from '../../services/enhancedFirebase'
import { AuditLogger } from '../../services/auditLogger'
import { StripeService } from '../../services/stripe'
import { Bounty } from '../../types/bounty'

interface CreateBountyEnhancedProps {
  onSuccess?: (bountyId: string) => void
  onCancel?: () => void
}

const CreateBountyEnhanced: React.FC<CreateBountyEnhancedProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'review',
    maxCreators: '1',
    maxApplications: '',
    requirements: '',
    talkingPoints: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setError('You must be logged in to create a bounty')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Validate form data
      const sanitizedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: parseFloat(formData.budget),
        category: formData.category as Bounty['category'],
        maxCreators: parseInt(formData.maxCreators),
        maxApplications: formData.maxApplications ? parseInt(formData.maxApplications) : undefined,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        talkingPoints: formData.talkingPoints.split('\n').filter(point => point.trim())
      }

      // Validate required fields
      if (!sanitizedData.title || !sanitizedData.description || !sanitizedData.budget) {
        throw new Error('Please fill in all required fields')
      }

      if (sanitizedData.budget < 10) {
        throw new Error('Minimum bounty amount is $10')
      }

      // Create bounty with enhanced transaction system
      const bountyId = await EnhancedFirebaseService.createBounty({
        title: sanitizedData.title,
        description: sanitizedData.description,
        category: sanitizedData.category,
        requirements: sanitizedData.requirements.map((req, index) => ({
          id: `req_${index}`,
          type: 'content' as const,
          description: req,
          mandatory: true
        })),
        talkingPoints: sanitizedData.talkingPoints,
        payment: {
          amount: sanitizedData.budget,
          currency: 'USD',
          milestones: [{
            id: 'milestone_1',
            description: 'Content delivery and approval',
            percentage: 100
          }]
        },
        businessId: user.id,
        businessName: user.email || 'Unknown Business',
        status: 'pending',
        applicationsCount: 0,
        maxCreators: sanitizedData.maxCreators,
        maxApplications: sanitizedData.maxApplications,
        paidCreatorsCount: 0,
        totalPaidAmount: 0,
        remainingBudget: sanitizedData.budget * sanitizedData.maxCreators
      }, user.id)

      // Calculate payment amounts for Stripe
      const totalBountyAmount = sanitizedData.budget * sanitizedData.maxCreators
      const platformFee = totalBountyAmount * 0.05 // 5% platform fee
      const totalPayment = totalBountyAmount + platformFee
      const amountInCents = Math.round(totalPayment * 100)

      // Log the bounty creation attempt
      await AuditLogger.logEvent(
        user.id,
        'bounty_creation_attempt',
        'bounty',
        bountyId,
        undefined,
        {
          title: sanitizedData.title,
          budget: sanitizedData.budget,
          maxCreators: sanitizedData.maxCreators,
          totalPayment,
          platformFee
        },
        { step: 'payment_redirect' }
      )

      // Redirect to Stripe for payment
      await StripeService.createEscrowPayment(
        bountyId,
        user.id,
        amountInCents,
        user.email || ''
      )

      // Success - the redirect will handle the rest
      onSuccess?.(bountyId)

    } catch (error) {
      console.error('Error creating bounty:', error)
      setError(error instanceof Error ? error.message : 'Failed to create bounty. Please try again.')
      
      // Log the error
      if (user?.id) {
        await AuditLogger.logEvent(
          user.id,
          'bounty_creation_failed',
          'bounty',
          'unknown',
          undefined,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          { formData: sanitizedData }
        )
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Bounty</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white font-semibold mb-2">Bounty Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., Review our new product"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white font-semibold mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Describe what you're looking for in detail..."
            rows={4}
            required
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-white font-semibold mb-2">Budget per Creator *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="100"
              min="10"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Max Creators */}
        <div>
          <label className="block text-white font-semibold mb-2">Number of Creators</label>
          <input
            type="number"
            value={formData.maxCreators}
            onChange={(e) => setFormData(prev => ({ ...prev, maxCreators: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="1"
            min="1"
            max="10"
          />
          <p className="text-gray-400 text-sm mt-1">How many creators will be paid for this bounty</p>
        </div>

        {/* Max Applications */}
        <div>
          <label className="block text-white font-semibold mb-2">Max Applications to Accept</label>
          <input
            type="number"
            value={formData.maxApplications}
            onChange={(e) => setFormData(prev => ({ ...prev, maxApplications: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., 20 applications (leave empty for unlimited)"
            min="1"
          />
          <p className="text-gray-400 text-sm mt-1">How many applications to accept before closing (leave empty for unlimited)</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-white font-semibold mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="review">Product Review</option>
            <option value="tutorial">Tutorial</option>
            <option value="unboxing">Unboxing</option>
            <option value="demo">Demo</option>
            <option value="testimonial">Testimonial</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-white font-semibold mb-2">Requirements</label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Enter each requirement on a new line..."
            rows={3}
          />
        </div>

        {/* Talking Points */}
        <div>
          <label className="block text-white font-semibold mb-2">Talking Points</label>
          <textarea
            value={formData.talkingPoints}
            onChange={(e) => setFormData(prev => ({ ...prev, talkingPoints: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Enter each talking point on a new line..."
            rows={3}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isCreating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isCreating ? 'Creating & Redirecting to Payment...' : 'Create Bounty & Pay'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CreateBountyEnhanced
