import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  getCommunityPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost,
  addComment,
  updateComment,
  deleteComment,
  likePost,
  unlikePost,
  reactToPost,
  getTrendingPosts,
  getUserPosts,
  subscribeToPosts,
  subscribeToComments,
  cleanup
} from '@/services/api/community.service';
import { CommunityPost, CommunityComment } from '@/types/community';
import { useEffect } from 'react';

// Query keys factory
const queryKeys = {
  posts: ['posts'] as const,
  post: (id: string) => ['post', id] as const,
  trending: ['trending-posts'] as const,
  userPosts: (userId: string) => ['user-posts', userId] as const,
  comments: (postId: string) => ['comments', postId] as const,
};

// Hook for fetching community posts with filtering
export const useCommunityPosts = (filters?: Parameters<typeof getCommunityPosts>[0]) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts, filters],
    queryFn: ({ pageParam = 0 }) => 
      getCommunityPosts({ ...filters, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / (filters?.limit || 20));
      const currentPage = allPages.length;
      return currentPage < totalPages ? currentPage : undefined;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: 0,
  });
};

// Hook for fetching single post
export const usePost = (postId: string) => {
  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => getPostById(postId),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching trending posts
export const useTrendingPosts = (limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.trending, limit],
    queryFn: () => getTrendingPosts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching user posts
export const useUserPosts = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userPosts(userId),
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation for creating post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
};

// Mutation for updating post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: any }) => 
      updatePost(postId, updates),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
};

// Mutation for deleting post
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
};

// Mutation for adding comment
export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addComment,
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

// Mutation for updating comment
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

// Mutation for deleting comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

// Mutation for liking post
export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) => 
      likePost(postId, userId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
};

// Mutation for unliking post
export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) => 
      unlikePost(postId, userId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
};

// Mutation for reacting to post
export const useReactToPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reactToPost,
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

// Real-time subscription hook
export const usePostsSubscription = (onUpdate?: (post: CommunityPost) => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = subscribeToPosts(({ eventType, post }) => {
      switch (eventType) {
        case 'INSERT':
          queryClient.invalidateQueries({ queryKey: queryKeys.posts });
          queryClient.invalidateQueries({ queryKey: queryKeys.trending });
          onUpdate?.(post);
          break;
        case 'UPDATE':
          queryClient.invalidateQueries({ queryKey: queryKeys.post(post.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.posts });
          queryClient.invalidateQueries({ queryKey: queryKeys.trending });
          onUpdate?.(post);
          break;
        case 'DELETE':
          queryClient.invalidateQueries({ queryKey: queryKeys.posts });
          queryClient.invalidateQueries({ queryKey: queryKeys.trending });
          break;
      }
    });

    return () => {
      cleanup();
    };
  }, [queryClient, onUpdate]);
};

// Comment subscription hook
export const useCommentsSubscription = (
  postId: string,
  onCommentUpdate?: (comment: CommunityComment) => void
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!postId) return;

    const channel = subscribeToComments(postId, ({ eventType, comment }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      onCommentUpdate?.(comment);
    });

    return () => {
      cleanup();
    };
  }, [queryClient, postId, onCommentUpdate]);
};

// Optimistic update helper
export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  const addCommentOptimistically = (postId: string, comment: CommunityComment) => {
    queryClient.setQueryData(queryKeys.post(postId), (old: CommunityPost | undefined) => {
      if (!old) return old;
      return {
        ...old,
        comments: [...old.comments, comment],
        commentsCount: old.commentsCount + 1
      };
    });
  };

  const likePostOptimistically = (postId: string, userId: string) => {
    queryClient.setQueryData(queryKeys.post(postId), (old: CommunityPost | undefined) => {
      if (!old) return old;
      return {
        ...old,
        likes: [...old.likes, { userId, user: { id: userId } }],
        likesCount: old.likesCount + 1
      };
    });
  };

  const unlikePostOptimistically = (postId: string, userId: string) => {
    queryClient.setQueryData(queryKeys.post(postId), (old: CommunityPost | undefined) => {
      if (!old) return old;
      return {
        ...old,
        likes: old.likes.filter(like => like.userId !== userId),
        likesCount: old.likesCount - 1
      };
    });
  };

  return { addCommentOptimistically, likePostOptimistically, unlikePostOptimistically };
};

// Loading states helper
export const useLoadingStates = () => {
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
export const useCommunityErrorHandler = () => {
  const handleError = (error: any) => {
    console.error('Community error:', error);
    
    if (error.statusCode === 404) {
      return 'Post or content not found';
    }
    
    if (error.statusCode === 403) {
      return 'Access denied. Please check your permissions.';
    }
    
    if (error.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }
    
    return 'An error occurred while processing your request. Please try again.';
  };

  return { handleError };
};

// Search posts hook
export const useSearchPosts = (query: string) => {
  return useQuery({
    queryKey: [...queryKeys.posts, { search: query }],
    queryFn: () => getCommunityPosts({ search: query }),
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Filter posts by category hook
export const usePostsByCategory = (category: string) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts, { category }],
    queryFn: ({ pageParam = 0 }) => 
      getCommunityPosts({ category, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / 20);
      const currentPage = allPages.length;
      return currentPage < totalPages ? currentPage : undefined;
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
};