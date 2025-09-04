import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  getPublicAssessments, 
  getAssessments, 
  getAssessmentById, 
  getUserResults, 
  submitAssessmentResult, 
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentAnalytics,
  subscribeToAssessments,
  cleanup
} from '@/services/api/assessment.service';
import { Assessment, AssessmentResult } from '@/types/assessment';
import { useEffect } from 'react';

// Query keys factory
const queryKeys = {
  assessments: ['assessments'] as const,
  assessment: (id: string) => ['assessment', id] as const,
  publicAssessments: ['public-assessments'] as const,
  userResults: (userId: string) => ['user-results', userId] as const,
  assessmentAnalytics: (id: string) => ['analytics', id] as const,
};

// Hook for fetching public assessments
export const usePublicAssessments = () => {
  return useQuery({
    queryKey: queryKeys.publicAssessments,
    queryFn: getPublicAssessments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error.statusCode === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook for fetching assessments with filtering
export const useAssessments = (filters?: Parameters<typeof getAssessments>[0]) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.assessments, filters],
    queryFn: ({ pageParam = 0 }) => 
      getAssessments({ ...filters, offset: pageParam * (filters?.limit || 20) }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / (filters?.limit || 20));
      const currentPage = allPages.length;
      return currentPage < totalPages ? currentPage : undefined;
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
};

// Hook for fetching single assessment
export const useAssessment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.assessment(id),
    queryFn: () => getAssessmentById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error.statusCode === 404) return false;
      return failureCount < 2;
    },
  });
};

// Hook for fetching user results
export const useUserResults = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userResults(userId),
    queryFn: () => getUserResults(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for fetching assessment analytics
export const useAssessmentAnalytics = (assessmentId: string) => {
  return useQuery({
    queryKey: queryKeys.assessmentAnalytics(assessmentId),
    queryFn: () => getAssessmentAnalytics(assessmentId),
    enabled: !!assessmentId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Mutation for creating assessment
export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
    },
  });
};

// Mutation for updating assessment
export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Assessment> }) => 
      updateAssessment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
    },
  });
};

// Mutation for deleting assessment
export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
    },
  });
};

// Mutation for submitting assessment results
export const useSubmitAssessmentResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitAssessmentResult,
    onSuccess: (_, { userId }) => {
      if (userId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.userResults(userId) 
        });
      }
    },
  });
};

// Real-time subscription hook
export const useAssessmentSubscription = (onUpdate?: (assessment: Assessment) => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = subscribeToAssessments(({ eventType, assessment }) => {
      switch (eventType) {
        case 'INSERT':
          queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
          queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
          onUpdate?.(assessment);
          break;
        case 'UPDATE':
          queryClient.invalidateQueries({ queryKey: queryKeys.assessment(assessment.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
          queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
          onUpdate?.(assessment);
          break;
        case 'DELETE':
          queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
          queryClient.invalidateQueries({ queryKey: queryKeys.publicAssessments });
          break;
      }
    });

    return () => {
      cleanup();
    };
  }, [queryClient, onUpdate]);
};

// Optimistic update helper
export const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();

  const updateAssessmentOptimistically = (id: string, updates: Partial<Assessment>) => {
    queryClient.setQueryData(queryKeys.assessment(id), (old: Assessment | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  };

  return { updateAssessmentOptimistically };
};

// Loading states helper
export const useLoadingState = () => {
  const queryClient = useQueryClient();

  const isLoading = (queryKey: string[]) => {
    return queryClient.isFetching({ queryKey });
  };

  const isMutating = (mutationKey: string[]) => {
    return queryClient.isMutating({ mutationKey });
  };

  return { isLoading, isMutating };
};

// Error handling helper
export const useAssessmentErrorHandler = () => {
  const handleError = (error: any) => {
    console.error('Assessment error:', error);
    
    if (error.statusCode === 404) {
      return 'Assessment not found';
    }
    
    if (error.statusCode === 403) {
      return 'Access denied';
    }
    
    if (error.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }
    
    return 'An error occurred while processing your request. Please try again.';
  };

  return { handleError };
};