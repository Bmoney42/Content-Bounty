import React, { useState } from 'react'
import { X, Upload, Link, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Bounty } from '../../types/bounty'
import { firebaseDB } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { FileUploadService, ContentFile } from '../../services/fileUpload'
import { ContentReviewService } from '../../services/contentReview'
import FileUpload from '../content/FileUpload'
import ContentPreview from '../content/ContentPreview'

interface DeliveryModalProps {
  bounty: Bounty | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  existingSubmissionId?: string
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  bounty,
  isOpen,
  onClose,
  onSuccess,
  existingSubmissionId
}) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    contentLinks: '',
    description: '',
    additionalNotes: '',
    contentFiles: [] as ContentFile[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<any>(null)

  if (!isOpen || !bounty) return null

  const handleFilesUploaded = (files: ContentFile[]) => {
    setFormData(prev => ({
      ...prev,
      contentFiles: [...prev.contentFiles, ...files]
    }))
  }

  const handleFilesRemoved = (fileIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      contentFiles: prev.contentFiles.filter(file => !fileIds.includes(file.id))
    }))
  }

  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.contentLinks.trim() && formData.contentFiles.length === 0) {
      newErrors.content = 'Either content links or uploaded files are required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    
    // Validate content using the review service
    if (Object.keys(newErrors).length === 0) {
      try {
        const validation = await ContentReviewService.validateContent({
          description: formData.description,
          contentFiles: formData.contentFiles,
          additionalNotes: formData.additionalNotes
        })
        setValidationResult(validation)
        return validation.isValid
      } catch (error) {
        console.error('Content validation error:', error)
        return true // Allow submission even if validation fails
      }
    }
    
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!await validateForm()) return
    
    if (!user?.id) {
      alert('You must be logged in to submit content')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create submission data
      const submissionData = {
        bountyId: bounty.id,
        creatorId: user.id,
        creatorName: user.email || 'Anonymous',
        contentLinks: formData.contentLinks,
        description: formData.description,
        additionalNotes: formData.additionalNotes,
        contentFiles: formData.contentFiles,
        submittedAt: new Date().toISOString(),
        status: 'pending_review' as const
      }

      // Submit to Firebase - handle resubmissions
      if (existingSubmissionId) {
        // Update existing submission for resubmission
        await firebaseDB.updateSubmissionStatus(existingSubmissionId, 'pending_review')
        // Also update the content
        await firebaseDB.updateSubmissionContent(existingSubmissionId, {
          contentLinks: formData.contentLinks,
          description: formData.description,
          additionalNotes: formData.additionalNotes,
          // contentFiles: formData.contentFiles, // Removed - not in type
          submittedAt: new Date().toISOString()
        })
      } else {
        // Create new submission
        await firebaseDB.createSubmission(submissionData)
      }
      
      alert('✅ Content delivered successfully! The business will review your submission.')
      onSuccess?.()
      onClose()
      
      // Reset form
      setFormData({
        contentLinks: '',
        description: '',
        additionalNotes: '',
        contentFiles: []
      })
      setValidationResult(null)
      
    } catch (error) {
      console.error('Error submitting content:', error)
      alert('❌ Failed to submit content. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deliver Content</h2>
            <p className="text-gray-600 mt-1">Submit your content for: {bounty.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Links */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content Links
            </label>
            <div className="flex items-center space-x-2">
              <Link className="w-5 h-5 text-gray-400" />
              <textarea
                value={formData.contentLinks}
                onChange={(e) => setFormData(prev => ({ ...prev, contentLinks: e.target.value }))}
                placeholder="Paste your video/content URLs here (YouTube, TikTok, Instagram, etc.)"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.contentLinks ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
              />
            </div>
            {errors.contentLinks && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.contentLinks}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Content Files
            </label>
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              onFilesRemoved={handleFilesRemoved}
              maxFiles={10}
              maxFileSize={100 * 1024 * 1024} // 100MB
              allowedTypes={[
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
                'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
                'application/pdf', 'text/plain'
              ]}
              uploadPath={`bounties/${bounty.id}/submissions`}
            />
          </div>

          {/* Content Preview */}
          {formData.contentFiles.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content Preview ({formData.contentFiles.length} files)
              </label>
              <ContentPreview 
                files={formData.contentFiles}
                onRemoveFile={(fileId) => handleFilesRemoved([fileId])}
                showRemoveButton={true}
                maxPreviewSize={150}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start space-x-2">
              <FileText className="w-5 h-5 text-gray-400 mt-3" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your content, how it meets the requirements, and any key highlights..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
              />
            </div>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Any additional information, context, or special instructions..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Content Validation */}
          {validationResult && (
            <div className={`border rounded-xl p-4 ${
              validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <h4 className="font-semibold text-gray-900">
                  Content Quality Score: {validationResult.score}/100
                </h4>
              </div>
              
              {validationResult.issues.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Issues to address:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {validationResult.issues.map((issue: any, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.warnings.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Warnings:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {validationResult.warnings.map((warning: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {validationResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Requirements Reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Bounty Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {bounty.requirements.map((req, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  {req.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Deliver Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeliveryModal
