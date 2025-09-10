import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSnapshot, collection, query, where, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './useAuth'

export function useRealTimeBounties() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    console.log('🔄 Setting up real-time bounties listener')
    
    const unsubscribe = onSnapshot(
      collection(db, 'bounties'),
      (snapshot) => {
        console.log('📡 Bounties collection updated, invalidating cache')
        // Invalidate and refetch bounties queries
        queryClient.invalidateQueries({ queryKey: ['bounties'] })
      },
      (error) => {
        console.error('❌ Error in bounties real-time listener:', error)
      }
    )

    return () => {
      console.log('🔄 Cleaning up bounties real-time listener')
      unsubscribe()
    }
  }, [queryClient])
}

export function useRealTimeApplications(userId?: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!userId) return

    console.log('🔄 Setting up real-time applications listener for user:', userId)
    
    // Listen for applications where the user is the creator
    const creatorQuery = query(
      collection(db, 'applications'),
      where('creatorId', '==', userId)
    )

    const unsubscribeCreator = onSnapshot(
      creatorQuery,
      (snapshot) => {
        console.log('📡 Creator applications updated, invalidating cache')
        queryClient.invalidateQueries({ queryKey: ['applications', 'user', userId] })
      },
      (error) => {
        console.error('❌ Error in creator applications real-time listener:', error)
      }
    )

    // Also listen for all applications (for businesses)
    const allQuery = collection(db, 'applications')
    const unsubscribeAll = onSnapshot(
      allQuery,
      (snapshot) => {
        console.log('📡 All applications updated, invalidating cache')
        queryClient.invalidateQueries({ queryKey: ['applications', 'all'] })
        // Invalidate individual bounty applications
        queryClient.invalidateQueries({ queryKey: ['applications', 'bounty'] })
      },
      (error) => {
        console.error('❌ Error in all applications real-time listener:', error)
      }
    )

    return () => {
      console.log('🔄 Cleaning up applications real-time listeners')
      unsubscribeCreator()
      unsubscribeAll()
    }
  }, [queryClient, userId])
}

export function useRealTimeSubmissions(userId?: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!userId) return

    console.log('🔄 Setting up real-time submissions listener for user:', userId)
    
    // Listen for submissions where the user is the creator
    const creatorQuery = query(
      collection(db, 'submissions'),
      where('creatorId', '==', userId)
    )

    const unsubscribeCreator = onSnapshot(
      creatorQuery,
      (snapshot) => {
        console.log('📡 Creator submissions updated, invalidating cache')
        queryClient.invalidateQueries({ queryKey: ['submissions', 'user', userId] })
      },
      (error) => {
        console.error('❌ Error in creator submissions real-time listener:', error)
      }
    )

    // Also listen for all submissions (for businesses)
    const allQuery = collection(db, 'submissions')
    const unsubscribeAll = onSnapshot(
      allQuery,
      (snapshot) => {
        console.log('📡 All submissions updated, invalidating cache')
        queryClient.invalidateQueries({ queryKey: ['submissions', 'all'] })
        // Invalidate individual bounty submissions
        queryClient.invalidateQueries({ queryKey: ['submissions', 'bounty'] })
      },
      (error) => {
        console.error('❌ Error in all submissions real-time listener:', error)
      }
    )

    return () => {
      console.log('🔄 Cleaning up submissions real-time listeners')
      unsubscribeCreator()
      unsubscribeAll()
    }
  }, [queryClient, userId])
}

export function useRealTimeUserData(userId?: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!userId) return

    console.log('🔄 Setting up real-time user data listener for user:', userId)
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          console.log('📡 User data updated, invalidating cache')
          queryClient.invalidateQueries({ queryKey: ['user', userId] })
          queryClient.invalidateQueries({ queryKey: ['user-stats', userId] })
        }
      },
      (error) => {
        console.error('❌ Error in user data real-time listener:', error)
      }
    )

    return () => {
      console.log('🔄 Cleaning up user data real-time listener')
      unsubscribe()
    }
  }, [queryClient, userId])
}

// Composite hook that sets up all real-time listeners for a user
export function useRealTimeUpdatesForUser() {
  const { user } = useAuth()
  
  useRealTimeBounties()
  useRealTimeApplications(user?.id)
  useRealTimeSubmissions(user?.id)
  useRealTimeUserData(user?.id)
}