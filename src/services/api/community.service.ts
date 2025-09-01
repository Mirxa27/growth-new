/**
 * Community Service
 * Handles all community-related operations including posts, comments, and interactions
 */

import { BaseApiService, type ApiResponse } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CommunityPost = Tables<'community_posts'>;
export type CommunityPostInsert = TablesInsert<'community_posts'>;
export type CommunityPostUpdate = TablesUpdate<'community_posts'>;

export interface CommunityPostWithAuthor extends CommunityPost {
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface PostInteraction {
  postId: string;
  userId: string;
  type: 'like' | 'share' | 'report';
  timestamp: Date;
}

export interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  activeDiscussions: number;
  trendingTopics: string[];
  engagementRate: number;
}

class CommunityService extends BaseApiService {
  constructor() {
    super('community_posts');
  }
  
  /**
   * Get all community posts with author information
   */
  async getPosts(options?: {
    category?: string;
    sortBy?: 'recent' | 'popular' | 'trending';
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<CommunityPostWithAuthor[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('is_published', true);
      
      // Apply category filter
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      
      // Apply sorting
      switch (options?.sortBy) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'trending':
          // Trending = recent posts with high engagement
          query = query
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('likes_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      if (options?.page && options?.pageSize) {
        const from = (options.page - 1) * options.pageSize;
        const to = from + options.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data: posts, error } = await query;
      
      if (error) throw error;
      
      // Transform data and check if user has liked each post
      const postsWithInteractions = await Promise.all(
        (posts || []).map(async (post: any) => {
          let userHasLiked = false;
          
          if (userId) {
            const { data: like } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .single();
            
            userHasLiked = !!like;
          }
          
          // Get comment count
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            author: {
              id: post.profiles.id,
              display_name: post.profiles.display_name,
              avatar_url: post.profiles.avatar_url,
            },
            likes_count: post.likes_count || 0,
            comments_count: commentsCount || 0,
            user_has_liked: userHasLiked,
          };
        })
      );
      
      return {
        data: postsWithInteractions as CommunityPostWithAuthor[],
        error: null,
      };
    } catch (error) {
      this.logError('getPosts', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get a single post with full details
   */
  async getPost(postId: string): Promise<ApiResponse<CommunityPostWithAuthor>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const { data: post, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Check if user has liked the post
      let userHasLiked = false;
      if (userId) {
        const { data: like } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();
        
        userHasLiked = !!like;
      }
      
      // Get comment count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      // Increment view count
      await this.incrementViewCount(postId);
      
      return {
        data: {
          ...post,
          author: {
            id: post.profiles.id,
            display_name: post.profiles.display_name,
            avatar_url: post.profiles.avatar_url,
          },
          likes_count: post.likes_count || 0,
          comments_count: commentsCount || 0,
          user_has_liked: userHasLiked,
        } as CommunityPostWithAuthor,
        error: null,
      };
    } catch (error) {
      this.logError('getPost', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Create a new community post
   */
  async createPost(post: Omit<CommunityPostInsert, 'user_id'>): Promise<ApiResponse<CommunityPost>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Validate and sanitize content
      const sanitizedPost = {
        ...post,
        user_id: user.id,
        content: this.sanitizeContent(post.content || ''),
        is_published: post.is_published ?? true,
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('community_posts')
        .insert(sanitizedPost)
        .select()
        .single();
      
      if (error) throw error;
      
      // Track post creation analytics
      await this.trackPostAnalytics(data.id, 'created');
      
      return {
        data: data as CommunityPost,
        error: null,
      };
    } catch (error) {
      this.logError('createPost', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Update a community post
   */
  async updatePost(
    postId: string,
    updates: CommunityPostUpdate
  ): Promise<ApiResponse<CommunityPost>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Verify ownership
      const { data: existingPost } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!existingPost || existingPost.user_id !== user.id) {
        throw new Error('Unauthorized to update this post');
      }
      
      // Sanitize content if provided
      if (updates.content) {
        updates.content = this.sanitizeContent(updates.content);
      }
      
      const { data, error } = await supabase
        .from('community_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: data as CommunityPost,
        error: null,
      };
    } catch (error) {
      this.logError('updatePost', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Delete a community post
   */
  async deletePost(postId: string): Promise<ApiResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Verify ownership or admin status
      const { data: existingPost } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!existingPost || existingPost.user_id !== user.id) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role !== 'admin') {
          throw new Error('Unauthorized to delete this post');
        }
      }
      
      // Soft delete by marking as unpublished
      const { error } = await supabase
        .from('community_posts')
        .update({
          is_published: false,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', postId);
      
      if (error) throw error;
      
      return {
        data: null,
        error: null,
      };
    } catch (error) {
      this.logError('deletePost', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Like or unlike a post
   */
  async toggleLike(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        
        // Decrement likes count
        await supabase.rpc('decrement_post_likes', { post_id: postId });
        
        // Get updated count
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        return {
          data: {
            liked: false,
            likesCount: post?.likes_count || 0,
          },
          error: null,
        };
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        
        // Increment likes count
        await supabase.rpc('increment_post_likes', { post_id: postId });
        
        // Get updated count
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        // Notify post author
        await this.notifyPostAuthor(postId, user.id, 'like');
        
        return {
          data: {
            liked: true,
            likesCount: post?.likes_count || 0,
          },
          error: null,
        };
      }
    } catch (error) {
      this.logError('toggleLike', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<ApiResponse<PostComment[]>> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const comments = (data || []).map((comment: any) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: {
          display_name: comment.profiles.display_name,
          avatar_url: comment.profiles.avatar_url,
        },
      }));
      
      return {
        data: comments,
        error: null,
      };
    } catch (error) {
      this.logError('getComments', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    content: string
  ): Promise<ApiResponse<PostComment>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const sanitizedContent = this.sanitizeContent(content);
      
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: sanitizedContent,
        })
        .select(`
          *,
          profiles!post_comments_user_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Notify post author
      await this.notifyPostAuthor(postId, user.id, 'comment');
      
      return {
        data: {
          id: data.id,
          post_id: data.post_id,
          user_id: data.user_id,
          content: data.content,
          created_at: data.created_at,
          author: {
            display_name: data.profiles.display_name,
            avatar_url: data.profiles.avatar_url,
          },
        },
        error: null,
      };
    } catch (error) {
      this.logError('addComment', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<ApiResponse<CommunityStats>> {
    try {
      // Get total posts
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);
      
      // Get total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      // Get active discussions (posts with recent comments)
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: activePostIds } = await supabase
        .from('post_comments')
        .select('post_id')
        .gte('created_at', recentDate);
      
      const uniqueActivePostIds = new Set(activePostIds?.map(c => c.post_id) || []);
      const activeDiscussions = uniqueActivePostIds.size;
      
      // Get trending topics (most used tags/categories)
      const { data: posts } = await supabase
        .from('community_posts')
        .select('tags, category')
        .eq('is_published', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const topicCounts: Record<string, number> = {};
      posts?.forEach(post => {
        if (post.category) {
          topicCounts[post.category] = (topicCounts[post.category] || 0) + 1;
        }
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            topicCounts[tag] = (topicCounts[tag] || 0) + 1;
          });
        }
      });
      
      const trendingTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);
      
      // Calculate engagement rate
      const { count: totalLikes } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true });
      
      const { count: totalComments } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true });
      
      const totalEngagements = (totalLikes || 0) + (totalComments || 0);
      const engagementRate = totalPosts ? (totalEngagements / totalPosts) * 100 : 0;
      
      return {
        data: {
          totalPosts: totalPosts || 0,
          totalMembers: totalMembers || 0,
          activeDiscussions,
          trendingTopics,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        error: null,
      };
    } catch (error) {
      this.logError('getCommunityStats', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  // Helper methods
  
  private sanitizeContent(content: string): string {
    // Basic sanitization - in production, use a proper library like DOMPurify
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  private async incrementViewCount(postId: string): Promise<void> {
    try {
      await supabase.rpc('increment_post_views', { post_id: postId });
    } catch (error) {
      // Non-critical error, log but don't throw
      this.logError('incrementViewCount', error);
    }
  }
  
  private async trackPostAnalytics(
    postId: string,
    action: 'created' | 'viewed' | 'liked' | 'commented'
  ): Promise<void> {
    try {
      await supabase.from('post_analytics').insert({
        post_id: postId,
        action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical error, log but don't throw
      this.logError('trackPostAnalytics', error);
    }
  }
  
  private async notifyPostAuthor(
    postId: string,
    actorId: string,
    action: 'like' | 'comment'
  ): Promise<void> {
    try {
      // Get post author
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id, title')
        .eq('id', postId)
        .single();
      
      if (!post || post.user_id === actorId) return; // Don't notify self
      
      // Get actor details
      const { data: actor } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', actorId)
        .single();
      
      if (!actor) return;
      
      // Create notification
      const message = action === 'like'
        ? `${actor.display_name} liked your post "${post.title}"`
        : `${actor.display_name} commented on your post "${post.title}"`;
      
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: `post_${action}`,
        message,
        data: { postId, actorId },
        read: false,
      });
    } catch (error) {
      // Non-critical error, log but don't throw
      this.logError('notifyPostAuthor', error);
    }
  }
}

export const communityService = new CommunityService();