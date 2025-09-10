import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../utils/authUtils'
import { StripeService } from '../services/stripe'
import { useToast } from '../utils/toastUtils'

interface ConnectAccountStatus {
  success: boolean
  hasConnectAccount: boolean
  accountId?: string
  accountStatus: string
  payoutsEnabled: boolean
  chargesEnabled: boolean
  requiresAction: boolean
  message: string
  nextStep?: string
}

export const useConnectAccount = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [onboarding, setOnboarding] = useState(false)

  // Load Connect account status
  const loadConnectStatus = useCallback(async () => {
    if (!user?.id || user.userType !== 'creator') {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const status = await StripeService.checkConnectStatus()
      setConnectStatus(status)
    } catch (error) {
      console.error('Error loading Connect status:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load banking status'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.userType, addToast])

  // Create Connect account
  const createConnectAccount = useCallback(async (email: string, country: string = 'US') => {
    if (!user?.id) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please log in to set up banking'
      })
      return
    }

    try {
      setCreating(true)
      const result = await StripeService.createConnectAccount(email, country)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Account Created',
          message: 'Connect account created successfully. Complete onboarding to receive payments.'
        })
        
        // Reload status to get updated information
        await loadConnectStatus()
        
        return result
      } else {
        throw new Error(result.message || 'Failed to create Connect account')
      }
    } catch (error) {
      console.error('Error creating Connect account:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create banking account. Please try again.'
      })
      throw error
    } finally {
      setCreating(false)
    }
  }, [user?.id, addToast, loadConnectStatus])

  // Start onboarding process
  const startOnboarding = useCallback(async (accountId: string) => {
    try {
      setOnboarding(true)
      await StripeService.createConnectOnboardingLink(accountId)
      // The redirect will happen automatically
    } catch (error) {
      console.error('Error starting onboarding:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to start banking setup. Please try again.'
      })
    } finally {
      setOnboarding(false)
    }
  }, [addToast])

  // Check if creator can receive payments
  const canReceivePayments = useCallback(() => {
    return connectStatus?.payoutsEnabled && connectStatus?.chargesEnabled
  }, [connectStatus])

  // Get status message for UI
  const getStatusMessage = useCallback(() => {
    if (!connectStatus) return 'Loading...'
    
    if (!connectStatus.hasConnectAccount) {
      return 'No banking account set up. Create one to receive payments.'
    }
    
    if (connectStatus.requiresAction) {
      return 'Banking account needs setup. Complete onboarding to receive payments.'
    }
    
    if (connectStatus.payoutsEnabled && connectStatus.chargesEnabled) {
      return 'Banking account is fully set up and ready to receive payments.'
    }
    
    return connectStatus.message
  }, [connectStatus])

  // Get next action for UI
  const getNextAction = useCallback(() => {
    if (!connectStatus) return null
    
    if (!connectStatus.hasConnectAccount) {
      return 'create'
    }
    
    if (connectStatus.requiresAction && connectStatus.accountId) {
      return 'onboard'
    }
    
    return null
  }, [connectStatus])

  // Load status on mount and when user changes
  useEffect(() => {
    loadConnectStatus()
  }, [loadConnectStatus])

  return {
    connectStatus,
    loading,
    creating,
    onboarding,
    createConnectAccount,
    startOnboarding,
    loadConnectStatus,
    canReceivePayments: canReceivePayments(),
    statusMessage: getStatusMessage(),
    nextAction: getNextAction()
  }
}
