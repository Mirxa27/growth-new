import { supabase } from '@/integrations/supabase/client';
import { CommunityPost, CommunityComment, PostReaction } from '@/types/community';
import { Database } from '@/integrations/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Type aliases for better type safety
type CommunityPostRow = Database['public']['Tables']['community_posts']['Row'];
type CommunityCommentRow = Database['public']['Tables']['community_comments']['Row'];
type PostReactionRow = Database['public']['Tables']['post_reactions']['Row'];

// Enhanced error class for better error handling
export class CommunityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'CommunityError';
  }
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

// Real-time subscriptions
let realtimeChannels: RealtimeChannel[] = [];

// Utility function for error handling
const handleError = (error: any, context: string): never => {
  console.error(`[CommunityService] ${context}:`, error);
  
  if (error.code === 'PGRST116') {
    throw new CommunityError('Post not found', 'NOT_FOUND', 404);
  }
  
  if (error.code === '23503') {
    throw new CommunityError('Referenced resource not found', 'FOREIGN_KEY_ERROR', 400);
  }
  
  if (error.code === '23505') {
    throw new CommunityError('Duplicate action', 'DUPLICATE', 409);
  }
  
  throw new CommunityError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  );
};

// Cache utility functions
const getFromCache = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

const invalidateCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Fetch community posts with advanced filtering
export const getCommunityPosts = async (filters?: {
  category?: string;
  authorId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'latest' | 'popular' | 'trending';
}) => {
  const cacheKey = `posts-${JSON.stringify(filters || {})}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        ),
        reactions:post_reactions(count),
        comments:community_comments(count),
        likes:post_likes(count)
      `, { count: 'exact' });

    if (filters?.category) {
      query = query.eq('categories.category.slug', filters.category);
    }
    
    if (filters?.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    
    if (filters?.search) {
      query = query.ilike('content', `%${filters.search}%`);
    }

    // Sort based on criteria
    switch (filters?.sortBy) {
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'trending':
        query = query.order('comments_count', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const posts = (data || []).map(transformPostRow);
    const result = { posts, total: count || 0 };
    
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    handleError(error, 'getCommunityPosts');
  }
};

// Fetch single post with details
export const getPostById = async (postId: string): Promise<CommunityPost | null> => {
  const cacheKey = `post-${postId}`;
  const cached = getFromCache<CommunityPost>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        ),
        reactions:post_reactions!inner(
          *,
          user:profiles!inner(
            id,
            username,
            avatar_url
          )
        ),
        comments:community_comments!inner(
          *,
          author:profiles!inner(
            id,
            username,
            avatar_url,
            full_name
          ),
          reactions:comment_reactions(count)
        ),
        likes:post_likes!inner(
          *,
          user:profiles!inner(
            id,
            username,
            avatar_url,
            full_name
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const post = transformPostRow(data);
    setCache(cacheKey, post);
    return post;
  } catch (error) {
    handleError(error, 'getPostById');
  }
};

// Create new post
export const createPost = async (post: {
  title: string;
  content: string;
  authorId: string;
  categoryIds?: string[];
  isAnonymous?: boolean;
  tags?: string[];
}): Promise<CommunityPost> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        title: post.title,
        content: post.content,
        author_id: post.authorId,
        is_anonymous: post.isAnonymous || false,
        tags: post.tags || []
      })
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        )
      `)
      .single();

    if (error) throw error;

    // Add categories if provided
    if (post.categoryIds && post.categoryIds.length > 0) {
      const categoryInserts = post.categoryIds.map(categoryId => ({
        post_id: data.id,
        category_id: categoryId
      }));
      
      await supabase
        .from('post_categories')
        .insert(categoryInserts);
    }

    const newPost = transformPostRow(data);
    invalidateCache('posts');
    return newPost;
  } catch (error) {
    handleError(error, 'createPost');
  }
};

// Update post
export const updatePost = async (postId: string, updates: {
  title?: string;
  content?: string;
  tags?: string[];
  categoryIds?: string[];
}): Promise<CommunityPost> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .update({
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        )
      `)
      .single();

    if (error) throw error;

    // Update categories if provided
    if (updates.categoryIds) {
      await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', postId);

      if (updates.categoryIds.length > 0) {
        const categoryInserts = updates.categoryIds.map(categoryId => ({
          post_id: postId,
          category_id: categoryId
        }));
        
        await supabase
          .from('post_categories')
          .insert(categoryInserts);
      }
    }

    const updatedPost = transformPostRow(data);
    invalidateCache(`post-${postId}`);
    invalidateCache('posts');
    return updatedPost;
  } catch (error) {
    handleError(error, 'updatePost');
  }
};

// Delete post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    
    invalidateCache(`post-${postId}`);
    invalidateCache('posts');
  } catch (error) {
    handleError(error, 'deletePost');
  }
};

// Add comment to post
export const addComment = async (comment: {
  postId: string;
  content: string;
  authorId: string;
  parentId?: string;
  isAnonymous?: boolean;
}): Promise<CommunityComment> => {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: comment.postId,
        content: comment.content,
        author_id: comment.authorId,
        parent_id: comment.parentId,
        is_anonymous: comment.isAnonymous || false
      })
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        reactions:comment_reactions(count)
      `)
      .single();

    if (error) throw error;

    // Increment comment count on post
    await supabase
      .from('community_posts')
      .update({ comments_count: supabase.sql`comments_count + 1` })
      .eq('id', comment.postId);

    const newComment = transformCommentRow(data);
    invalidateCache(`post-${comment.postId}`);
    invalidateCache('posts');
    return newComment;
  } catch (error) {
    handleError(error, 'addComment');
  }
};

// Update comment
export const updateComment = async (commentId: string, content: string): Promise<CommunityComment> => {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        reactions:comment_reactions(count)
      `)
      .single();

    if (error) throw error;
    
    invalidateCache('posts');
    return transformCommentRow(data);
  } catch (error) {
    handleError(error, 'updateComment');
  }
};

// Delete comment
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId)
      .select('post_id')
      .single();

    if (error) throw error;

    // Decrement comment count on post
    await supabase
      .from('community_posts')
      .update({ comments_count: supabase.sql`comments_count - 1` })
      .eq('id', data.post_id);

    invalidateCache(`post-${data.post_id}`);
    invalidateCache('posts');
  } catch (error) {
    handleError(error, 'deleteComment');
  }
};

// React to post
export const reactToPost = async (params: {
  postId: string;
  userId: string;
  reactionType: 'like' | 'love' | 'insightful' | 'inspiring';
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('post_reactions')
      .upsert({
        post_id: params.postId,
        user_id: params.userId,
        reaction_type: params.reactionType
      }, {
        onConflict: 'post_id,user_id'
      });

    if (error) throw error;
    
    invalidateCache(`post-${params.postId}`);
    invalidateCache('posts');
  } catch (error) {
    handleError(error, 'reactToPost');
  }
};

// Like post
export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    // Use the stored procedure for atomic increment
    const { error } = await supabase
      .rpc('increment_post_likes', { post_id: postId });

    if (error) throw error;
    
    invalidateCache(`post-${postId}`);
    invalidateCache('posts');
  } catch (error) {
    handleError(error, 'likePost');
  }
};

// Unlike post
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Update like count
    await supabase
      .from('community_posts')
      .update({ likes_count: supabase.sql`likes_count - 1` })
      .eq('id', postId);

    invalidateCache(`post-${postId}`);
    invalidateCache('posts');
  } catch (error) {
    handleError(error, 'unlikePost');
  }
};

// Get trending posts
export const getTrendingPosts = async (limit: number = 10): Promise<CommunityPost[]> => {
  const cacheKey = `trending-${limit}`;
  const cached = getFromCache<CommunityPost[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        ),
        reactions:post_reactions(count),
        comments:community_comments(count),
        likes:post_likes(count)
      `)
      .order('likes_count', { ascending: false })
      .order('comments_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const posts = (data || []).map(transformPostRow);
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    handleError(error, 'getTrendingPosts');
  }
};

// Get user posts
export const getUserPosts = async (userId: string): Promise<CommunityPost[]> => {
  const cacheKey = `user-posts-${userId}`;
  const cached = getFromCache<CommunityPost[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!inner(
          id,
          username,
          avatar_url,
          full_name
        ),
        categories:post_categories!inner(
          category:categories!inner(*)
        ),
        reactions:post_reactions(count),
        comments:community_comments(count),
        likes:post_likes(count)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const posts = (data || []).map(transformPostRow);
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    handleError(error, 'getUserPosts');
  }
};

// Real-time subscriptions
export const subscribeToPosts = (
  callback: (payload: { eventType: string; post: CommunityPost }) => void
): RealtimeChannel => {
  const channel = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_posts' },
      async (payload) => {
        const post = await getPostById(payload.new.id);
        if (post) {
          callback({
            eventType: payload.eventType,
            post
          });
          
          invalidateCache('posts');
          invalidateCache(`post-${payload.new.id}`);
        }
      }
    )
    .subscribe();

  realtimeChannels.push(channel);
  return channel;
};

// Subscribe to comments
export const subscribeToComments = (
  postId: string,
  callback: (payload: { eventType: string; comment: CommunityComment }) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`comments-${postId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_comments', filter: `post_id=eq.${postId}` },
      (payload) => {
        const comment = transformCommentRow(payload.new as any);
        callback({
          eventType: payload.eventType,
          comment
        });
        
        invalidateCache(`post-${postId}`);
      }
    )
    .subscribe();

  realtimeChannels.push(channel);
  return channel;
};

// Utility functions for data transformation
function transformPostRow(row: any): CommunityPost {
  return {
    id: row.id.toString(),
    title: row.title,
    content: row.content,
    author: {
      id: row.author?.id,
      username: row.author?.username,
      avatarUrl: row.author?.avatar_url,
      fullName: row.author?.full_name
    },
    categories: (row.categories || []).map((c: any) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
      color: c.category.color
    })),
    tags: row.tags || [],
    reactions: (row.reactions || []).map((r: any) => ({
      id: r.id,
      type: r.reaction_type,
      userId: r.user_id,
      user: r.user
    })),
    comments: (row.comments || []).map((c: any) => transformCommentRow(c)),
    likes: (row.likes || []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      user: l.user,
      createdAt: l.created_at
    })),
    likesCount: row.likes_count || 0,
    commentsCount: row.comments_count || 0,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function transformCommentRow(row: any): CommunityComment {
  return {
    id: row.id.toString(),
    postId: row.post_id?.toString(),
    content: row.content,
    author: {
      id: row.author?.id,
      username: row.author?.username,
      avatarUrl: row.author?.avatar_url,
      fullName: row.author?.full_name
    },
    parentId: row.parent_id?.toString(),
    replies: (row.replies || []).map((r: any) => transformCommentRow(r)),
    reactions: (row.reactions || []).map((r: any) => ({
      id: r.id,
      type: r.reaction_type,
      userId: r.user_id
    })),
    likesCount: row.likes_count || 0,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Cleanup function
export const cleanup = () => {
  realtimeChannels.forEach(channel => {
    channel.unsubscribe();
  });
  realtimeChannels = [];
  cache.clear();
};

// Export types for external use
export type { CommunityPostRow, CommunityCommentRow, PostReactionRow };