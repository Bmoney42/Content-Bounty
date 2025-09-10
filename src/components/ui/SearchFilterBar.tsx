import React from 'react'
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'
import { BountyCategory } from '../../types/bounty'
import { SearchFilters } from '../../hooks/useBountySearch'

interface SearchFilterBarProps {
  filters: SearchFilters
  onUpdateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  totalResults: number
  totalBounties: number
  showFilters: boolean
  onToggleFilters: () => void
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onUpdateFilter,
  onResetFilters,
  hasActiveFilters,
  totalResults,
  totalBounties,
  showFilters,
  onToggleFilters
}) => {
  const categories: (BountyCategory | 'all')[] = [
    'all', 'review', 'interview', 'tutorial', 'unboxing', 
    'demo', 'testimonial', 'download', 'announcement'
  ]

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'payment-high', label: 'Highest Payment' },
    { value: 'payment-low', label: 'Lowest Payment' },
    { value: 'applications', label: 'Most Applications' }
  ]

  return (
    <div className="glass-card rounded-3xl p-8 mb-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Search bounties by title, description, or company..."
            value={filters.searchTerm}
            onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
            className="w-full pl-12 pr-4 py-4 modern-input rounded-2xl text-gray-900 placeholder-gray-500 font-medium"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleFilters}
            className={`secondary-modern-button px-6 py-4 rounded-2xl font-semibold flex items-center space-x-3 ${
              hasActiveFilters ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {Object.entries(filters).filter(([key, value]) => 
                  key !== 'sortBy' && value !== '' && value !== 'all'
                ).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2"
              title="Reset filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600 font-medium">
          Showing {totalResults} of {totalBounties} bounties
          {hasActiveFilters && <span className="text-blue-600"> (filtered)</span>}
        </p>
        
        <div className="flex items-center space-x-3">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => onUpdateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
            className="px-3 py-2 text-sm modern-input rounded-lg text-gray-900 font-medium bg-white border border-gray-300"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-white text-gray-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onUpdateFilter('category', e.target.value as BountyCategory | 'all')}
              className="w-full px-4 py-3 rounded-2xl text-gray-900 font-medium bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-white text-gray-900">
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onUpdateFilter('status', e.target.value as SearchFilters['status'])}
              className="w-full px-4 py-3 rounded-2xl text-gray-900 font-medium bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value} className="bg-white text-gray-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Min Payment ($)
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPayment}
              onChange={(e) => onUpdateFilter('minPayment', e.target.value)}
              min="0"
              className="w-full px-4 py-3 rounded-2xl text-gray-900 placeholder-gray-500 font-medium bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Max Payment ($)
            </label>
            <input
              type="number"
              placeholder="1000"
              value={filters.maxPayment}
              onChange={(e) => onUpdateFilter('maxPayment', e.target.value)}
              min="0"
              className="w-full px-4 py-3 rounded-2xl text-gray-900 placeholder-gray-500 font-medium bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilterBar