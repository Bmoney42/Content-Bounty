import React, { useEffect, useState } from 'react'
import { useAuth } from '../../utils/authUtils'
import { useSubmitRating, useCanUserRate, useRatingForm } from '../../hooks/useRating'
import { useNotification } from '../../utils/notificationUtils'
import RatingForm from './RatingForm'

interface RatingTriggerProps {
  bountyId: string
  bountyTitle: string
  bountyCategory: string
  targetUserId: string
  targetUserName: string
  targetUserType: 'creator' | 'business'
  onRatingSubmitted?: () => void
  triggerCondition?: 'submission_approved' | 'bounty_completed' | 'manual'
}

const RatingTrigger: React.FC<RatingTriggerProps> = ({
  bountyId,
  bountyTitle,
  bountyCategory,
  targetUserId,
  targetUserName,
  targetUserType,
  onRatingSubmitted,
  triggerCondition = 'manual'
}) => {
  const { user } = useAuth()
  const { notifications } = useNotification()
  const submitRatingMutation = useSubmitRating()
  const [showPrompt, setShowPrompt] = useState(false)
  
  const {
    isOpen,
    targetUser,
    bountyData,
    openRatingForm,
    closeRatingForm,
  } = useRatingForm()

  // Check if user can rate
  const { data: canRate = false } = useCanUserRate(
    user?.id || '',
    targetUserId,
    bountyId
  )

  // Auto-trigger rating prompt based on conditions
  useEffect(() => {
    if (!user || !canRate || !triggerCondition) return

    const shouldShowPrompt = () => {
      switch (triggerCondition) {
        case 'submission_approved':
          // Show rating prompt when creator's submission gets approved
          return user.userType === 'business'
        case 'bounty_completed':
          // Show rating prompt when bounty is marked as completed
          return true
        case 'manual':
        default:
          return false
      }
    }

    if (shouldShowPrompt()) {
      // Delay prompt slightly to not interfere with other UI
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [user, canRate, triggerCondition])

  const handlePromptAccept = () => {
    setShowPrompt(false)
    openRatingForm(
      { id: targetUserId, name: targetUserName, type: targetUserType },
      { id: bountyId, title: bountyTitle, category: bountyCategory }
    )
  }

  const handlePromptDecline = () => {
    setShowPrompt(false)
    // Maybe show a "remind me later" option in the future
  }

  const handleRatingSubmit = async (ratingData: any) => {
    if (!user) return

    try {
      await submitRatingMutation.mutateAsync({
        bountyId,
        raterId: user.id,
        ratedUserId: targetUserId,
        raterType: user.userType,
        ratedUserType: targetUserType,
        bountyTitle,
        bountyCategory,
        ratingData
      })

      // Show success notification
      notifications.addNotification(
        'success',
        'submission',
        'Review Submitted!',
        `Thank you for rating ${targetUserName}. Your review helps build trust in our community.`
      )

      closeRatingForm()
      onRatingSubmitted?.()
    } catch (error) {
      console.error('Error submitting rating:', error)
      notifications.addNotification(
        'error',
        'submission',
        'Failed to Submit Review',
        'There was an error submitting your review. Please try again.'
      )
    }
  }

  // Render rating prompt
  if (showPrompt) {
    return (
      <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-2xl shadow-xl p-6 max-w-sm z-40 animate-slide-up">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Rate Your Experience
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              How was working with {targetUserName} on "{bountyTitle}"?
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePromptAccept}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Rate Now
            </button>
            <button
              onClick={handlePromptDecline}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render rating form modal
  return (
    <RatingForm
      isOpen={isOpen}
      onClose={closeRatingForm}
      onSubmit={handleRatingSubmit}
      targetUser={targetUser!}
      bountyTitle={bountyData?.title || bountyTitle}
      isSubmitting={submitRatingMutation.isPending}
    />
  )
}

export default RatingTrigger