import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseDB } from '../services/firebase'
import { Bounty } from '../types/bounty'

export function useBounties() {
  return useQuery({
    queryKey: ['bounties'],
    queryFn: async () => {
      const bounties = await firebaseDB.getBounties()
      return bounties
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

export function useBountiesByUser(userId: string) {
  return useQuery({
    queryKey: ['bounties', 'user', userId],
    queryFn: async () => {
      const bounties = await firebaseDB.getBountiesByUser(userId)
      return bounties
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  })
}

export function useBounty(bountyId: string) {
  return useQuery({
    queryKey: ['bounty', bountyId],
    queryFn: async () => {
      const bounty = await firebaseDB.getBounty(bountyId)
      return bounty
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!bountyId,
  })
}

export function useCreateBounty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bountyData: Parameters<typeof firebaseDB.createBounty>[0]) => {
      const bountyId = await firebaseDB.createBounty(bountyData)
      return bountyId
    },
    onSuccess: () => {
      // Invalidate and refetch bounties
      queryClient.invalidateQueries({ queryKey: ['bounties'] })
      queryClient.invalidateQueries({ queryKey: ['bounties', 'user'] })
    },
  })
}

export function useBountyApplications(bountyId: string) {
  return useQuery({
    queryKey: ['applications', 'bounty', bountyId],
    queryFn: async () => {
      const applications = await firebaseDB.getBountyApplications(bountyId)
      return applications
    },
    staleTime: 1 * 60 * 1000, // 1 minute for fresher data
    gcTime: 5 * 60 * 1000,
    enabled: !!bountyId,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (applicationData: Parameters<typeof firebaseDB.createApplication>[0]) => {
      const applicationId = await firebaseDB.createApplication(applicationData)
      return applicationId
    },
    onSuccess: (_, variables) => {
      // Invalidate applications for this bounty
      queryClient.invalidateQueries({ queryKey: ['applications', 'bounty', variables.bountyId] })
      // Invalidate all applications for the user
      queryClient.invalidateQueries({ queryKey: ['applications', 'user'] })
      // Invalidate bounties to update application counts
      queryClient.invalidateQueries({ queryKey: ['bounties'] })
    },
  })
}