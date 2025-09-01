/**
 * Progress Tracking Service
 * Comprehensive progress tracking for all user activities
 */

import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notification.service';

export interface ProgressMetrics {
  overall: number;
  daily: number;
  weekly: number;
  monthly: number;
  streakDays: number;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_name: string;
  points_earned: number;
  duration_minutes?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  criteria: Record<string, any>;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  created_at: string;
  completed_at?: string;
}

class ProgressService {
  private userId: string | null = null;
  private metrics: ProgressMetrics | null = null;
  private achievements: Map<string, Achievement> = new Map();
  private goals: Goal[] = [];
  private streakData: { current: number; longest: number; lastActivity: string } | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize progress service
   */
  private async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      await this.loadProgressData();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        await this.loadProgressData();
      } else {
        this.userId = null;
        this.metrics = null;
        this.achievements.clear();
        this.goals = [];
      }
    });
  }

  /**
   * Load all progress data
   */
  private async loadProgressData() {
    if (!this.userId) return;

    await Promise.all([
      this.loadMetrics(),
      this.loadAchievements(),
      this.loadGoals(),
      this.loadStreakData()
    ]);
  }

  /**
   * Load progress metrics
   */
  private async loadMetrics() {
    if (!this.userId) return;

    // Get activity logs for different periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: activities } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', monthAgo.toISOString())
      .order('created_at', { ascending: false });

    if (activities) {
      // Calculate metrics
      const totalPoints = activities.reduce((sum, a) => sum + (a.points_earned || 0), 0);
      const dailyActivities = activities.filter(a => new Date(a.created_at) >= today);
      const weeklyActivities = activities.filter(a => new Date(a.created_at) >= weekAgo);
      
      const dailyPoints = dailyActivities.reduce((sum, a) => sum + (a.points_earned || 0), 0);
      const weeklyPoints = weeklyActivities.reduce((sum, a) => sum + (a.points_earned || 0), 0);
      const monthlyPoints = totalPoints;

      // Calculate level (100 points per level)
      const level = Math.floor(totalPoints / 100) + 1;
      const nextLevelPoints = (level * 100) - (totalPoints % 100);

      // Calculate progress percentages
      const dailyGoal = 50; // Daily points goal
      const weeklyGoal = 300; // Weekly points goal
      const monthlyGoal = 1000; // Monthly points goal

      this.metrics = {
        overall: Math.min(100, (totalPoints / 1000) * 100),
        daily: Math.min(100, (dailyPoints / dailyGoal) * 100),
        weekly: Math.min(100, (weeklyPoints / weeklyGoal) * 100),
        monthly: Math.min(100, (monthlyPoints / monthlyGoal) * 100),
        streakDays: this.streakData?.current || 0,
        totalPoints,
        level,
        nextLevelPoints
      };
    }
  }

  /**
   * Load achievements
   */
  private async loadAchievements() {
    if (!this.userId) return;

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    // Get user's unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', this.userId);

    const unlockedMap = new Map(
      unlockedAchievements?.map(ua => [ua.achievement_id, ua]) || []
    );

    // Process achievements
    allAchievements?.forEach(achievement => {
      const unlocked = unlockedMap.get(achievement.id);
      const processed: Achievement = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon || '🏆',
        points: achievement.points || 0,
        category: achievement.category || 'general',
        criteria: achievement.criteria || {},
        unlocked: !!unlocked,
        unlocked_at: unlocked?.unlocked_at,
        progress: this.calculateAchievementProgress(achievement)
      };
      this.achievements.set(achievement.id, processed);
    });
  }

  /**
   * Calculate achievement progress
   */
  private calculateAchievementProgress(achievement: any): number {
    // This would check the criteria and calculate progress
    // For now, return a random value for demonstration
    if (achievement.unlocked) return 100;
    return Math.floor(Math.random() * 80);
  }

  /**
   * Load user goals
   */
  private async loadGoals() {
    if (!this.userId) return;

    const { data } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    this.goals = data || [];
  }

  /**
   * Load streak data
   */
  private async loadStreakData() {
    if (!this.userId) return;

    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (data) {
      this.streakData = {
        current: data.current_streak || 0,
        longest: data.longest_streak || 0,
        lastActivity: data.last_activity_date
      };
    }
  }

  /**
   * Log activity
   */
  async logActivity(
    activityType: string,
    activityName: string,
    points: number = 0,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<ActivityLog> {
    if (!this.userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: this.userId,
        activity_type: activityType,
        activity_name: activityName,
        points_earned: points,
        duration_minutes: duration,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Update streak
    await this.updateStreak();

    // Check for achievements
    await this.checkAchievements(activityType, activityName);

    // Update metrics
    await this.loadMetrics();

    return data;
  }

  /**
   * Update streak
   */
  private async updateStreak() {
    if (!this.userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data: streak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching streak:', fetchError);
      return;
    }

    if (streak) {
      const lastActivity = new Date(streak.last_activity_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = streak.current_streak;
      
      if (lastActivity.toISOString().split('T')[0] === today) {
        // Already logged activity today
        return;
      } else if (lastActivity.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        // Continuing streak
        newStreak++;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak || 0),
          last_activity_date: today
        })
        .eq('user_id', this.userId);

      if (updateError) {
        console.error('Error updating streak:', updateError);
      }
    } else {
      // Create new streak
      const { error: insertError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: this.userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        });

      if (insertError) {
        console.error('Error creating streak:', insertError);
      }
    }
  }

  /**
   * Check and unlock achievements
   */
  private async checkAchievements(activityType: string, activityName: string) {
    if (!this.userId) return;

    // Check each achievement's criteria
    for (const [id, achievement] of this.achievements) {
      if (achievement.unlocked) continue;

      // Check if criteria are met
      const criteriaMe = await this.checkAchievementCriteria(achievement, activityType, activityName);
      
      if (criteriaMe) {
        await this.unlockAchievement(id);
      }
    }
  }

  /**
   * Check if achievement criteria are met
   */
  private async checkAchievementCriteria(
    achievement: Achievement,
    activityType: string,
    activityName: string
  ): Promise<boolean> {
    // Implement specific criteria checking logic
    // This is a simplified example
    if (achievement.criteria.activity_type === activityType) {
      if (achievement.criteria.count) {
        // Check if user has done this activity enough times
        const { count } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId!)
          .eq('activity_type', activityType);

        return (count || 0) >= achievement.criteria.count;
      }
    }

    return false;
  }

  /**
   * Unlock achievement
   */
  private async unlockAchievement(achievementId: string) {
    if (!this.userId) return;

    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: this.userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      });

    if (!error) {
      achievement.unlocked = true;
      achievement.unlocked_at = new Date().toISOString();
      achievement.progress = 100;

      // Send notification
      await notificationService.createNotification(this.userId, {
        title: 'Achievement Unlocked!',
        message: `Congratulations! You've earned "${achievement.name}"!`,
        type: 'achievement',
        category: 'achievement',
        action_url: '/achievements',
        action_label: 'View Achievement',
        metadata: { achievement_id: achievementId }
      });
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'status'>): Promise<Goal> {
    if (!this.userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: this.userId,
        ...goal,
        status: 'active',
        current_value: 0
      })
      .select()
      .single();

    if (error) throw error;

    this.goals.push(data);
    return data;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, progress: number) {
    if (!this.userId) return;

    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const newValue = Math.min(goal.target_value, progress);
    const isCompleted = newValue >= goal.target_value;

    const { error } = await supabase
      .from('user_goals')
      .update({
        current_value: newValue,
        status: isCompleted ? 'completed' : goal.status,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', goalId)
      .eq('user_id', this.userId);

    if (!error) {
      goal.current_value = newValue;
      if (isCompleted) {
        goal.status = 'completed';
        goal.completed_at = new Date().toISOString();

        // Send notification
        await notificationService.createNotification(this.userId, {
          title: 'Goal Achieved!',
          message: `Congratulations! You've completed your goal: "${goal.title}"!`,
          type: 'success',
          category: 'achievement',
          action_url: '/goals',
          action_label: 'View Goals',
          metadata: { goal_id: goalId }
        });
      }
    }
  }

  /**
   * Get progress metrics
   */
  getMetrics(): ProgressMetrics | null {
    return this.metrics;
  }

  /**
   * Get achievements
   */
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get goals
   */
  getGoals(): Goal[] {
    return this.goals;
  }

  /**
   * Get streak data
   */
  getStreakData() {
    return this.streakData;
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 10): Promise<ActivityLog[]> {
    if (!this.userId) return [];

    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

// Export singleton instance
export const progressService = new ProgressService();