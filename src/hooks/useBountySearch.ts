import { useMemo, useState } from 'react'
import { Bounty, BountyCategory } from '../types/bounty'

export interface SearchFilters {
  searchTerm: string
  category: BountyCategory | 'all'
  minPayment: string
  maxPayment: string
  status: 'all' | 'active' | 'in-progress' | 'completed'
  sortBy: 'newest' | 'oldest' | 'payment-high' | 'payment-low' | 'applications'
  businessName: string
}

const initialFilters: SearchFilters = {
  searchTerm: '',
  category: 'all',
  minPayment: '',
  maxPayment: '',
  status: 'all',
  sortBy: 'newest',
  businessName: ''
}

export function useBountySearch(bounties: Bounty[]) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)

  const filteredAndSortedBounties = useMemo(() => {
    let filtered = bounties.filter(bounty => {
      // Search term filter
      const matchesSearch = !filters.searchTerm || 
        bounty.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        bounty.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        bounty.businessName.toLowerCase().includes(filters.searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = filters.category === 'all' || bounty.category === filters.category

      // Payment filters
      const matchesMinPayment = !filters.minPayment || bounty.payment.amount >= parseInt(filters.minPayment)
      const matchesMaxPayment = !filters.maxPayment || bounty.payment.amount <= parseInt(filters.maxPayment)

      // Status filter
      const matchesStatus = filters.status === 'all' || bounty.status === filters.status

      // Business name filter
      const matchesBusinessName = !filters.businessName || 
        bounty.businessName.toLowerCase().includes(filters.businessName.toLowerCase())

      return matchesSearch && matchesCategory && matchesMinPayment && 
             matchesMaxPayment && matchesStatus && matchesBusinessName
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'payment-high':
          return b.payment.amount - a.payment.amount
        case 'payment-low':
          return a.payment.amount - b.payment.amount
        case 'applications':
          return b.applicationsCount - a.applicationsCount
        default:
          return 0
      }
    })

    return filtered
  }, [bounties, filters])

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'sortBy') return false // sortBy doesn't count as an active filter
      return value !== initialFilters[key as keyof SearchFilters]
    })
  }, [filters])

  return {
    filters,
    filteredBounties: filteredAndSortedBounties,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    totalResults: filteredAndSortedBounties.length,
    totalBounties: bounties.length
  }
}