import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { BrandLead, BrandDiscoveryFilters } from '../../types/brandDiscovery'
import { brandDiscoveryService } from '../../services/brandDiscoveryService'
import BrandLeadCard from './BrandLeadCard'
import AddBrandLeadModal from './AddBrandLeadModal'
import PremiumUpgradePrompt from '../ui/PremiumUpgradePrompt'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Play,
  Instagram,
  Youtube,
  Zap,
  X
} from 'lucide-react'

const BrandDiscoveryTool: React.FC = () => {
  const { user } = useAuth()
  const { isPremium } = useSubscription()
  const [brandLeads, setBrandLeads] = useState<BrandLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<BrandLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<BrandDiscoveryFilters>({})
  const [selectedLead, setSelectedLead] = useState<BrandLead | null>(null)
  
  // Scraping state
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingJob, setScrapingJob] = useState<any>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [discoveredBrands, setDiscoveredBrands] = useState<any[]>([])
  const [showBrandReview, setShowBrandReview] = useState(false)

  // Load brand leads on component mount
  useEffect(() => {
    if (user?.id && isPremium) {
      loadBrandLeads()
    }
  }, [user?.id, isPremium])

  // Filter leads when search term or filters change
  useEffect(() => {
    let filtered = brandLeads

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status)
    }

    // Apply platform filter
    if (filters.platform) {
      filtered = filtered.filter(lead => lead.platform === filters.platform)
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(lead => lead.priority === filters.priority)
    }

    setFilteredLeads(filtered)
  }, [brandLeads, searchTerm, filters])

  const loadBrandLeads = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const leads = await brandDiscoveryService.getBrandLeads(user.id, filters)
      setBrandLeads(leads)
    } catch (error) {
      console.error('Error loading brand leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBrand = async (brandData: any) => {
    if (!user?.id) return

    try {
      const newLead = await brandDiscoveryService.addManualBrandLead(user.id, brandData)
      setBrandLeads(prev => [newLead, ...prev])
    } catch (error) {
      console.error('Error adding brand lead:', error)
    }
  }

  const handleUpdateStatus = async (leadId: string, status: BrandLead['status']) => {
    try {
      await brandDiscoveryService.updateBrandLeadStatus(leadId, status)
      setBrandLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status, updatedAt: new Date() } : lead
        )
      )
    } catch (error) {
      console.error('Error updating brand lead status:', error)
    }
  }

  const handleAddNote = async (leadId: string, note: string) => {
    try {
      await brandDiscoveryService.updateBrandLead(leadId, { notes: note })
      setBrandLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, notes: note, updatedAt: new Date() } : lead
        )
      )
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleUpdateLead = async (leadId: string, updates: Partial<BrandLead>) => {
    try {
      await brandDiscoveryService.updateBrandLead(leadId, updates)
      setBrandLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, ...updates, updatedAt: new Date() } : lead
        )
      )
    } catch (error) {
      console.error('Error updating brand lead:', error)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this brand lead?')) return

    try {
      await brandDiscoveryService.deleteBrandLead(leadId)
      setBrandLeads(prev => prev.filter(lead => lead.id !== leadId))
    } catch (error) {
      console.error('Error deleting brand lead:', error)
    }
  }

  const exportLeads = () => {
    const csvContent = [
      ['Brand Name', 'Platform', 'Status', 'Priority', 'Industry', 'Website', 'Email', 'Tags', 'Notes'],
      ...filteredLeads.map(lead => [
        lead.brandName,
        lead.platform,
        lead.status,
        lead.priority,
        lead.industry || '',
        lead.websiteUrl || '',
        lead.emailContact || '',
        lead.tags.join('; '),
        lead.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brand-leads.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStats = () => {
    const total = brandLeads.length
    const newLeads = brandLeads.filter(lead => lead.status === 'new').length
    const contacted = brandLeads.filter(lead => lead.status === 'contacted').length
    const closed = brandLeads.filter(lead => lead.status === 'closed').length

    return { total, newLeads, contacted, closed }
  }

  // Scraping functions
  const handleStartScraping = async () => {
    if (!user?.id || !selectedPlatform) {
      alert('Please select a platform to scrape')
      return
    }

    try {
      setIsScraping(true)
      const job = await brandDiscoveryService.startApifyScraping(user.id, [selectedPlatform], [])
      setScrapingJob(job)
      
      // Start polling for results
      pollScrapingResults(job.id)
    } catch (error) {
      console.error('Error starting scraping:', error)
      alert('Failed to start scraping job')
    } finally {
      setIsScraping(false)
    }
  }

  const pollScrapingResults = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const job = await brandDiscoveryService.getScrapingJob(jobId)
        setScrapingJob(job)
        
        if (job.status === 'completed') {
          clearInterval(pollInterval)
          // Load discovered brands for review
          await loadDiscoveredBrands(jobId)
          setShowBrandReview(true)
        } else if (job.status === 'failed') {
          clearInterval(pollInterval)
          alert('Scraping job failed. Please try again.')
        }
      } catch (error) {
        console.error('Error polling scraping results:', error)
        clearInterval(pollInterval)
      }
    }, 10000) // Poll every 10 seconds
  }

  const loadDiscoveredBrands = async (jobId: string) => {
    try {
      const brands = await brandDiscoveryService.getDiscoveredBrands(jobId)
      setDiscoveredBrands(brands)
    } catch (error) {
      console.error('Error loading discovered brands:', error)
    }
  }

  const handleAddBrandToCRM = async (brand: any) => {
    try {
      await brandDiscoveryService.addDiscoveredBrandToCRM(user!.id, brand)
      setDiscoveredBrands(prev => prev.filter(b => b.id !== brand.id))
      await loadBrandLeads() // Refresh CRM list
    } catch (error) {
      console.error('Error adding brand to CRM:', error)
      alert('Failed to add brand to CRM')
    }
  }

  const handleSkipBrand = (brandId: string) => {
    setDiscoveredBrands(prev => prev.filter(b => b.id !== brandId))
  }

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <PremiumUpgradePrompt 
          feature="Brand Discovery Engine"
          description="Find brands already spending on sponsorships and manage your outreach pipeline"
        />
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Discovery Engine</h1>
        <p className="text-gray-600">
          Find brands already spending on sponsorships and manage your outreach pipeline
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contacted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scraping Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Discover Brands</h2>
            <p className="text-gray-600">Automatically find brands spending on sponsorships in the last 24 hours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Platform Selection */}
          {[
            { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
            { id: 'tiktok', name: 'TikTok', icon: Play, color: 'bg-black' },
            { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500' }
          ].map(platform => (
            <label key={platform.id} className="flex items-center space-x-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="platform"
                value={platform.id}
                checked={selectedPlatform === platform.id}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                <platform.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-700 font-medium">{platform.name}</span>
            </label>
          ))}
        </div>

        {/* Scraping Status */}
        {scrapingJob && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Scraping {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</h4>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-medium ${
                    scrapingJob.status === 'completed' ? 'text-green-600' :
                    scrapingJob.status === 'failed' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {scrapingJob.status}
                  </span>
                </p>
                {scrapingJob.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scrapingJob.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{scrapingJob.progress}% complete</p>
                  </div>
                )}
              </div>
              {scrapingJob.leadsFound > 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{scrapingJob.leadsFound}</p>
                  <p className="text-xs text-gray-500">brands found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Scraping Button */}
        <div>
          <button
            onClick={handleStartScraping}
            disabled={isScraping || !selectedPlatform}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scraping {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Discover Brands on {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md flex items-center gap-2 ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadBrandLeads}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportLeads}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsAddingBrand(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Brand
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as BrandLead['status'] || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="responded">Responded</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select
                  value={filters.platform || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value as BrandLead['platform'] || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Platforms</option>
                  <option value="manual">Manual Entry</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as BrandLead['priority'] || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brand Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading brand leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brand leads found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first brand lead'
              }
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <button
                onClick={() => setIsAddingBrand(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Brand Lead
              </button>
            )}
          </div>
        ) : (
          filteredLeads.map(lead => (
            <BrandLeadCard
              key={lead.id}
              brand={lead}
              onUpdateStatus={(status) => handleUpdateStatus(lead.id, status)}
              onAddNote={(note) => handleAddNote(lead.id, note)}
              onUpdate={(updates) => handleUpdateLead(lead.id, updates)}
              onDelete={() => handleDeleteLead(lead.id)}
            />
          ))
        )}
      </div>

      {/* Add Brand Modal */}
      <AddBrandLeadModal
        isOpen={isAddingBrand}
        onClose={() => setIsAddingBrand(false)}
        onSubmit={handleAddBrand}
      />

      {/* Brand Review Modal */}
      {showBrandReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Discovered Brands</h2>
                  <p className="text-gray-600">Choose which brands to add to your CRM</p>
                </div>
                <button
                  onClick={() => setShowBrandReview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {discoveredBrands.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                  <p className="text-gray-600">No sponsored content was detected in the last 24 hours.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {discoveredBrands.map(brand => (
                    <div key={brand.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{brand.brandName}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {brand.platform}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Handle:</strong> {brand.brandHandle || 'N/A'}</p>
                              <p><strong>Website:</strong> {brand.websiteUrl || 'N/A'}</p>
                            </div>
                            <div>
                              <p><strong>Engagement:</strong> {brand.engagementRate ? `${brand.engagementRate}%` : 'N/A'}</p>
                              <p><strong>Followers:</strong> {brand.followerCount ? brand.followerCount.toLocaleString() : 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-1"><strong>Sponsorship Signals:</strong></p>
                            <div className="flex flex-wrap gap-1">
                              {brand.sponsorshipSignals.map((signal, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {signal}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleAddBrandToCRM(brand)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add to CRM
                          </button>
                          <button
                            onClick={() => handleSkipBrand(brand.id)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {discoveredBrands.length} brands found • Review and add the ones you want to your CRM
                </p>
                <button
                  onClick={() => setShowBrandReview(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandDiscoveryTool

