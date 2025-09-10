import React, { useState } from 'react'
import { X, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: string) => void
  action: 'approve' | 'reject' | 'request-changes'
  submissionTitle?: string
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  action,
  submissionTitle
}) => {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const getActionConfig = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Submission',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          color: 'green',
          placeholder: 'Optional: Add a note of appreciation or specific feedback...',
          buttonText: 'Approve & Pay',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'reject':
        return {
          title: 'Reject Submission',
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          color: 'red',
          placeholder: 'Please explain why this submission was rejected and what needs to be improved...',
          buttonText: 'Reject Submission',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          required: true
        }
      case 'request-changes':
        return {
          title: 'Request Changes',
          icon: <MessageSquare className="w-6 h-6 text-orange-600" />,
          color: 'orange',
          placeholder: 'Please specify what changes are needed and provide clear instructions...',
          buttonText: 'Request Changes',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          required: true
        }
    }
  }

  const config = getActionConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (config.required && !feedback.trim()) {
      alert('Feedback is required for this action')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(feedback.trim())
      onClose()
      setFeedback('')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {config.icon}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
              {submissionTitle && (
                <p className="text-sm text-gray-600 mt-1">for: {submissionTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Feedback {config.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={config.placeholder}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${config.color}-500 focus:border-transparent ${
                config.required && !feedback.trim() ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={4}
              required={config.required}
            />
            {config.required && !feedback.trim() && (
              <p className="text-red-500 text-sm mt-1">Feedback is required for this action</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (config.required && !feedback.trim())}
              className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonColor}`}
            >
              {isSubmitting ? 'Submitting...' : config.buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FeedbackModal
