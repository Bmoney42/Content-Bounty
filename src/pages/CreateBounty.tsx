import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Globe
} from 'lucide-react'

const CreateBounty: React.FC = () => {
  const navigate = useNavigate()
  const [bountyType, setBountyType] = useState<'assigned' | 'open'>('open')
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
    maxApplicants: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle bounty creation
    console.log('Creating bounty:', formData)
    navigate('/bounties')
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

        {/* Bounty Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Bounty Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="e.g., Crypto App Review"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    style={{ color: 'white' }}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value} className="bg-gray-800 text-white">
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                  placeholder="Describe what you want the creator to do..."
                  required
                />
              </div>
            </div>

            {/* Payment */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Payment</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Payment Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.payment.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        payment: { ...prev.payment, amount: e.target.value }
                      }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Creator Requirements</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Minimum Views</label>
                  <div className="relative">
                    <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.requirements.minViews}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, minViews: e.target.value }
                      }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                      placeholder="1000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Min Subscribers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.requirements.minSubscribers}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, minSubscribers: e.target.value }
                      }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Max Applicants</label>
                  <input
                    type="number"
                    value={formData.maxApplicants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxApplicants: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Assigned Creator (if assigned bounty) */}
            {bountyType === 'assigned' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Assign to Creator</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Creator Username or Email</label>
                  <input
                    type="text"
                    value={formData.assignedCreator}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedCreator: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="creator@example.com or @username"
                    required
                  />
                </div>
              </div>
            )}

            {/* Talking Points */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Talking Points</h3>
              <div className="space-y-4">
                {formData.talkingPoints.map((point, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="flex-1 relative">
                      <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateTalkingPoint(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                        placeholder="Key point to cover..."
                      />
                    </div>
                    {formData.talkingPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTalkingPoint(index)}
                        className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTalkingPoint}
                  className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white hover:border-white/40 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Talking Point</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4 pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={() => navigate('/bounties')}
                className="flex-1 py-4 px-6 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Create Bounty
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBounty
