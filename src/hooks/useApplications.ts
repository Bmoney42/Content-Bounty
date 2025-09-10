import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseDB } from '../services/firebase'

export function useAllApplications() {
  return useQuery({
    queryKey: ['applications', 'all'],
    queryFn: async () => {
      const applications = await firebaseDB.getAllBountyApplications()
      return applications
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreatorApplications(creatorId: string) {
  return useQuery({
    queryKey: ['applications', 'user', creatorId],
    queryFn: async () => {
      const applications = await firebaseDB.getCreatorApplications(creatorId)
      return applications
    },
    staleTime: 30 * 1000, // 30 seconds for user's own data
    gcTime: 2 * 60 * 1000,
    enabled: !!creatorId,
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      await firebaseDB.updateApplicationStatus(applicationId, status as any)
      return { applicationId, status }
    },
    onSuccess: (data) => {
      // Invalidate all applications queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      // Invalidate bounties to update counts
      queryClient.invalidateQueries({ queryKey: ['bounties'] })
    },
  })
}

export function useHasUserApplied(bountyId: string, creatorId: string) {
  return useQuery({
    queryKey: ['application', 'check', bountyId, creatorId],
    queryFn: async () => {
      const hasApplied = await firebaseDB.hasUserAppliedToBounty(bountyId, creatorId)
      return hasApplied
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
    enabled: !!(bountyId && creatorId),
  })
}