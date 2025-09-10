import { useState } from 'react'

interface RatingTrigger {
  id: string
  bountyId: string
  bountyTitle: string
  bountyCategory: string
  targetUserId: string
  targetUserName: string
  targetUserType: 'creator' | 'business'
  triggerCondition: 'submission_approved' | 'bounty_completed' | 'manual'
}

export const useRatingTrigger = () => {
  const [triggers, setTriggers] = useState<RatingTrigger[]>([])

  const addTrigger = (trigger: Omit<RatingTrigger, 'id'>) => {
    const id = `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setTriggers(prev => [...prev, { ...trigger, id }])
  }

  const removeTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id))
  }

  const clearTriggers = () => {
    setTriggers([])
  }

  return {
    triggers,
    addTrigger,
    removeTrigger,
    clearTriggers,
  }
}