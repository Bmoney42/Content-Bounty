import React, { useState } from 'react'
import { AddBrandLeadData } from '../../types/brandDiscovery'
import { X, Plus, Tag } from 'lucide-react'

interface AddBrandLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddBrandLeadData) => void
}

const AddBrandLeadModal: React.FC<AddBrandLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<AddBrandLeadData>({
    brandName: '',
    platform: 'manual',
    sourceUrl: '',
    brandHandle: '',
    websiteUrl: '',
    emailContact: '',
    phoneContact: '',
    industry: '',
    estimatedBudget: undefined,
    sponsorshipSignals: [],
    notes: '',
    tags: [],
    priority: 'medium'
  })
  
  const [newSignal, setNewSignal] = useState('')
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof AddBrandLeadData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const addSponsorshipSignal = () => {
    if (newSignal.trim() && !formData.sponsorshipSignals.includes(newSignal.trim())) {
      setFormData(prev => ({
        ...prev,
        sponsorshipSignals: [...prev.sponsorshipSignals, newSignal.trim()]
      }))
      setNewSignal('')
    }
  }

  const removeSponsorshipSignal = (signal: string) => {
    setFormData(prev => ({
      ...prev,
      sponsorshipSignals: prev.sponsorshipSignals.filter(s => s !== signal)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required'
    }
    
    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL'
    }
    
    if (formData.emailContact && !isValidEmail(formData.emailContact)) {
      newErrors.emailContact = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
      onClose()
      // Reset form
      setFormData({
        brandName: '',
        platform: 'manual',
        sourceUrl: '',
        brandHandle: '',
        websiteUrl: '',
        emailContact: '',
        phoneContact: '',
        industry: '',
        estimatedBudget: undefined,
        sponsorshipSignals: [],
        notes: '',
        tags: [],
        priority: 'medium'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Brand Lead</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => handleInputChange('brandName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.brandName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter brand name"
              />
              {errors.brandName && (
                <p className="text-red-500 text-sm mt-1">{errors.brandName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual Entry</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
              />
              {errors.websiteUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.websiteUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Handle
              </label>
              <input
                type="text"
                value={formData.brandHandle}
                onChange={(e) => handleInputChange('brandHandle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@brandname"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Contact
              </label>
              <input
                type="email"
                value={formData.emailContact}
                onChange={(e) => handleInputChange('emailContact', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emailContact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contact@brand.com"
              />
              {errors.emailContact && (
                <p className="text-red-500 text-sm mt-1">{errors.emailContact}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Contact
              </label>
              <input
                type="tel"
                value={formData.phoneContact}
                onChange={(e) => handleInputChange('phoneContact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fashion, Tech, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Budget
              </label>
              <input
                type="number"
                value={formData.estimatedBudget || ''}
                onChange={(e) => handleInputChange('estimatedBudget', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          {/* Sponsorship Signals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sponsorship Signals
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSignal}
                onChange={(e) => setNewSignal(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., #ad, #sponsored, paid partnership"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSponsorshipSignal())}
              />
              <button
                type="button"
                onClick={addSponsorshipSignal}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.sponsorshipSignals.map(signal => (
                <span
                  key={signal}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1"
                >
                  {signal}
                  <button
                    type="button"
                    onClick={() => removeSponsorshipSignal(signal)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., fashion, luxury, tech"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about this brand..."
            />
          </div>
          
          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source URL
            </label>
            <input
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://instagram.com/p/..."
            />
          </div>
          
          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Brand Lead
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBrandLeadModal

