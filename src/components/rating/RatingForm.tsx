import React, { useState } from 'react'
import { X, Star, Send } from 'lucide-react'
import StarRating from '../ui/StarRating'
import { RatingFormData } from '../../types/rating'

interface RatingFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: RatingFormData) => Promise<void>
  targetUser: {
    id: string
    name: string
    type: 'creator' | 'business'
  }
  bountyTitle: string
  isSubmitting?: boolean
}

const RatingForm: React.FC<RatingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetUser,
  bountyTitle,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<RatingFormData>({
    overallRating: 0,
    communicationRating: 0,
    qualityRating: 0,
    timelinesRating: 0,
    professionalismRating: 0,
    title: '',
    review: ''
  })

  const [errors, setErrors] = useState<Partial<RatingFormData>>({})

  const ratingCategories = [
    { key: 'overallRating' as keyof RatingFormData, label: 'Overall Experience', description: 'How was your overall experience?' },
    { key: 'communicationRating' as keyof RatingFormData, label: 'Communication', description: 'How responsive and clear was the communication?' },
    { key: 'qualityRating' as keyof RatingFormData, label: 'Quality', description: targetUser.type === 'creator' ? 'How was the quality of work delivered?' : 'How clear were the requirements and feedback?' },
    { key: 'timelinesRating' as keyof RatingFormData, label: 'Timeliness', description: 'How well did they meet deadlines and expectations?' },
    { key: 'professionalismRating' as keyof RatingFormData, label: 'Professionalism', description: 'How professional was their conduct throughout?' }
  ]

  const handleRatingChange = (category: keyof RatingFormData, rating: number) => {
    setFormData(prev => ({ ...prev, [category]: rating }))
    if (errors[category]) {
      setErrors(prev => ({ ...prev, [category]: undefined }))
    }
  }

  const handleTextChange = (field: 'title' | 'review', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RatingFormData> = {}

    if (formData.overallRating === 0) {
      newErrors.overallRating = 0
    }
    if (formData.communicationRating === 0) {
      newErrors.communicationRating = 0
    }
    if (formData.qualityRating === 0) {
      newErrors.qualityRating = 0
    }
    if (!formData.title.trim()) {
      newErrors.title = ''
    }
    if (!formData.review.trim()) {
      newErrors.review = ''
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        overallRating: 0,
        communicationRating: 0,
        qualityRating: 0,
        timelinesRating: 0,
        professionalismRating: 0,
        title: '',
        review: ''
      })
      onClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Rate Your Experience
            </h2>
            <p className="text-gray-600 mt-1">
              How was working with {targetUser.name} on "{bountyTitle}"?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating Categories */}
          <div className="space-y-6 mb-8">
            {ratingCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div>
                  <label className="text-sm font-semibold text-gray-900">
                    {category.label}
                  </label>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </div>
                <div className="flex items-center">
                  <StarRating
                    rating={formData[category.key] as number}
                    onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                    size="lg"
                    showValue={false}
                  />
                  {(errors[category.key] !== undefined) && (
                    <span className="ml-3 text-sm text-red-500">Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Review Title */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-semibold text-gray-900">
              Review Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTextChange('title', e.target.value)}
              placeholder="Summarize your experience in one line"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.title !== undefined
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } focus:outline-none focus:ring-2`}
            />
            {errors.title !== undefined && (
              <span className="text-sm text-red-500">Title is required</span>
            )}
          </div>

          {/* Review Content */}
          <div className="space-y-2 mb-8">
            <label className="text-sm font-semibold text-gray-900">
              Detailed Review
            </label>
            <textarea
              value={formData.review}
              onChange={(e) => handleTextChange('review', e.target.value)}
              placeholder="Share your detailed experience to help other users..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                errors.review !== undefined
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } focus:outline-none focus:ring-2`}
            />
            {errors.review !== undefined && (
              <span className="text-sm text-red-500">Review is required</span>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingForm