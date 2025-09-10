import React, { useState } from 'react'
import { Filter } from 'lucide-react'
import { Bounty } from '../../types/bounty'
import BountyCard from './BountyCard'
import Pagination from '../ui/Pagination'
import SearchFilterBar from '../ui/SearchFilterBar'
import { usePagination } from '../../hooks/usePagination'
import { useBountySearch } from '../../hooks/useBountySearch'

interface BountyListProps {
  bounties: Bounty[]
  loading?: boolean
  onApply?: (bountyId: string) => void
  onViewDetails?: (bountyId: string) => void
  onDeliver?: (bountyId: string) => void
  appliedBounties?: Set<string>
  applicationStatuses?: Record<string, string>
  submissionStatuses?: Record<string, string>
  submissionFeedback?: Record<string, string>
  itemsPerPage?: number
  showStatusTabs?: boolean
}

const BountyList: React.FC<BountyListProps> = ({
  bounties,
  loading = false,
  onApply,
  onViewDetails,
  onDeliver,
  appliedBounties,
  applicationStatuses,
  submissionStatuses,
  submissionFeedback,
  itemsPerPage = 5,
  showStatusTabs = true
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'in-progress' | 'completed'>('active')

  // Filter bounties by status first
  const statusFilteredBounties = showStatusTabs 
    ? bounties.filter(bounty => {
        switch (activeTab) {
          case 'active':
            return bounty.status === 'active'
          case 'in-progress':
            return bounty.status === 'in-progress'
          case 'completed':
            return bounty.status === 'completed'
          default:
            return true
        }
      })
    : bounties.filter(bounty => bounty.status === 'active') // For creators, only show active bounties

  const {
    filters,
    filteredBounties,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    totalResults
  } = useBountySearch(statusFilteredBounties)

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems: paginatedBounties,
    goToPage
  } = usePagination(filteredBounties, { itemsPerPage })

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
      {/* Status Tabs - Only show for business users */}
      {showStatusTabs && (
        <div className="flex space-x-1 bg-white/10 rounded-2xl p-1">
          {[
            { key: 'active', label: 'Active', count: bounties.filter(b => b.status === 'active').length },
            { key: 'in-progress', label: 'In Progress', count: bounties.filter(b => b.status === 'in-progress').length },
            { key: 'completed', label: 'Completed', count: bounties.filter(b => b.status === 'completed').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.key 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-white/20 text-white/80'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search and Filter Bar */}
      <SearchFilterBar
        filters={filters}
        onUpdateFilter={updateFilter}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        totalResults={totalResults}
        totalBounties={statusFilteredBounties.length}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Bounty Cards */}
      {filteredBounties.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-16 h-16 text-white/40 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-3">
            No {activeTab} bounties found
          </h3>
          <p className="text-white/60 body-text">
            {hasActiveFilters 
              ? 'Try adjusting your search or filter criteria to find more bounties.'
              : `No ${activeTab} bounties available at the moment.`
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-8">
            {paginatedBounties.map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onApply={onApply}
                onViewDetails={onViewDetails}
                onDeliver={onDeliver}
                hasApplied={appliedBounties?.has(bounty.id)}
                applicationStatus={applicationStatuses?.[bounty.id]}
                submissionStatus={submissionStatuses?.[bounty.id]}
                feedback={submissionFeedback?.[bounty.id]}
              />
            ))}
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  )
}

export default BountyList