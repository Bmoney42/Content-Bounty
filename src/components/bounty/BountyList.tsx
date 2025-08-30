import React, { useState } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Bounty, BountyCategory } from '../../types/bounty'
import BountyCard from './BountyCard'

interface BountyListProps {
  bounties: Bounty[]
  loading?: boolean
  onApply?: (bountyId: string) => void
  onViewDetails?: (bountyId: string) => void
}

const BountyList: React.FC<BountyListProps> = ({
  bounties,
  loading = false,
  onApply,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<BountyCategory | 'all'>('all')
  const [minPayment, setMinPayment] = useState('')
  const [maxPayment, setMaxPayment] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const categories: (BountyCategory | 'all')[] = [
    'all', 'review', 'interview', 'tutorial', 'unboxing', 
    'demo', 'testimonial', 'download', 'announcement'
  ]

  const filteredBounties = bounties.filter(bounty => {
    const matchesSearch = bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bounty.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || bounty.category === selectedCategory
    
    const matchesMinPayment = !minPayment || bounty.payment.amount >= parseInt(minPayment)
    const matchesMaxPayment = !maxPayment || bounty.payment.amount <= parseInt(maxPayment)
    
    return matchesSearch && matchesCategory && matchesMinPayment && matchesMaxPayment
  })

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-3xl p-8 animate-pulse">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex space-x-3 mb-4">
                    <div className="h-6 bg-white/10 rounded-full w-20"></div>
                    <div className="h-6 bg-white/10 rounded-full w-16"></div>
                  </div>
                  <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
                <div className="h-12 w-20 bg-white/10 rounded-2xl ml-6"></div>
              </div>
              <div className="flex space-x-4">
                <div className="h-4 bg-white/10 rounded w-24"></div>
                <div className="h-4 bg-white/10 rounded w-24"></div>
                <div className="h-4 bg-white/10 rounded w-24"></div>
              </div>
              <div className="flex space-x-4 pt-6 border-t border-white/10">
                <div className="h-12 bg-white/10 rounded-2xl flex-1"></div>
                <div className="h-12 bg-white/10 rounded-2xl flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              placeholder="Search bounties by title, description, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 modern-input rounded-2xl text-white placeholder-white/50 font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="secondary-modern-button px-6 py-4 rounded-2xl font-semibold flex items-center space-x-3"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BountyCategory | 'all')}
                className="w-full px-4 py-3 modern-input rounded-2xl text-white font-medium"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Min Payment ($)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                min="0"
                className="w-full px-4 py-3 modern-input rounded-2xl text-white placeholder-white/50 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Max Payment ($)
              </label>
              <input
                type="number"
                placeholder="1000"
                value={maxPayment}
                onChange={(e) => setMaxPayment(e.target.value)}
                min="0"
                className="w-full px-4 py-3 modern-input rounded-2xl text-white placeholder-white/50 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60 font-medium">
          Showing {filteredBounties.length} of {bounties.length} bounties
        </p>
        <div className="text-sm text-white/50 font-medium">
          Active bounties • Updated recently
        </div>
      </div>

      {/* Bounty Cards */}
      {filteredBounties.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-16 h-16 text-white/40 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-3">No bounties found</h3>
          <p className="text-white/60 body-text">
            Try adjusting your search or filter criteria to find more bounties.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredBounties.map(bounty => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              onApply={onApply}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BountyList