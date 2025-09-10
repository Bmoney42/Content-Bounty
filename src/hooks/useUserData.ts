import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseDB, hybridData } from '../services/firebase'

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const user = await firebaseDB.getUser(userId)
      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId,
  })
}

export function useUserStats(userId: string, userType: 'creator' | 'business') {
  return useQuery({
    queryKey: ['user-stats', userId, userType],
    queryFn: async () => {
      const stats = await hybridData.getUserStats(userId, userType)
      return stats
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!(userId && userType),
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, profile }: { 
      userId: string; 
      profile: Parameters<typeof firebaseDB.updateUserProfile>[1] 
    }) => {
      await firebaseDB.updateUserProfile(userId, profile)
      return { userId, profile }
    },
    onSuccess: (data) => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['user', data.userId] })
      queryClient.invalidateQueries({ queryKey: ['user-stats', data.userId] })
    },
  })
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, profile }: { 
      userId: string; 
      profile: Parameters<typeof firebaseDB.updateBusinessProfile>[1] 
    }) => {
      await firebaseDB.updateBusinessProfile(userId, profile)
      return { userId, profile }
    },
    onSuccess: (data) => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['user', data.userId] })
      queryClient.invalidateQueries({ queryKey: ['user-stats', data.userId] })
    },
  })
}