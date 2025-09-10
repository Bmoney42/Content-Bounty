import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseDB } from '../services/firebase'

export function useBountySubmissions(bountyId: string) {
  return useQuery({
    queryKey: ['submissions', 'bounty', bountyId],
    queryFn: async () => {
      const submissions = await firebaseDB.getBountySubmissions(bountyId)
      return submissions
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    enabled: !!bountyId,
  })
}

export function useCreatorSubmissions(creatorId: string) {
  return useQuery({
    queryKey: ['submissions', 'user', creatorId],
    queryFn: async () => {
      const submissions = await firebaseDB.getCreatorSubmissions(creatorId)
      return submissions
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!creatorId,
  })
}

export function useAllSubmissions() {
  return useQuery({
    queryKey: ['submissions', 'all'],
    queryFn: async () => {
      const submissions = await firebaseDB.getAllBountySubmissions()
      return submissions
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (submissionData: Parameters<typeof firebaseDB.createSubmission>[0]) => {
      const submissionId = await firebaseDB.createSubmission(submissionData)
      return submissionId
    },
    onSuccess: (_, variables) => {
      // Invalidate submissions for this bounty
      queryClient.invalidateQueries({ queryKey: ['submissions', 'bounty', variables.bountyId] })
      // Invalidate user submissions
      queryClient.invalidateQueries({ queryKey: ['submissions', 'user', variables.creatorId] })
      // Invalidate all submissions
      queryClient.invalidateQueries({ queryKey: ['submissions', 'all'] })
    },
  })
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      status, 
      feedback 
    }: { 
      submissionId: string; 
      status: string; 
      feedback?: string 
    }) => {
      await firebaseDB.updateSubmissionStatus(submissionId, status, feedback)
      return { submissionId, status, feedback }
    },
    onSuccess: () => {
      // Invalidate all submissions queries
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}

export function useUpdateSubmissionContent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      content 
    }: { 
      submissionId: string; 
      content: Parameters<typeof firebaseDB.updateSubmissionContent>[1] 
    }) => {
      await firebaseDB.updateSubmissionContent(submissionId, content)
      return { submissionId, content }
    },
    onSuccess: () => {
      // Invalidate all submissions queries
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}