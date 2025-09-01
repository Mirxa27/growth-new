/**
 * Achievement & Gamification Service
 * Complete achievement system with points, levels, badges, and rewards
 */

import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notification.service';
import { progressService } from './progress.service';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'growth' | 'wellness' | 'social' | 'learning' | 'streak' | 'special';
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    target: number;
    current?: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  rewards?: {
    badge?: string;
    title?: string;
    feature?: string;
    bonus_points?: number;
  };
}

export interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  progress: number;
  perks: string[];
}

export interface Leaderboard {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  points: number;
  level: number;
  achievements: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  expiresAt: string;
  completed: boolean;
  progress: number;
  target: number;
}

class AchievementService {
  private userId: string | null = null;
  private achievements: Map<string, Achievement> = new Map();
  private userLevel: UserLevel | null = null;
  private dailyChallenges: DailyChallenge[] = [];
  private totalPoints: number = 0;
  private unlockedCount: number = 0;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      await this.loadAchievements();
      await this.loadUserLevel();
      await this.loadDailyChallenges();
      this.setupRealtimeSubscriptions();
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        await this.loadAchievements();
        await this.loadUserLevel();
        await this.loadDailyChallenges();
      } else {
        this.userId = null;
        this.achievements.clear();
        this.userLevel = null;
      }
    });
  }

  /**
   * Load all achievements
   */
  private async loadAchievements() {
    if (!this.userId) return;

    // Get all achievement definitions
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: true });

    // Get user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', this.userId);

    const unlockedMap = new Map(
      userAchievements?.map(ua => [ua.achievement_id, ua]) || []
    );

    // Process achievements
    this.achievements.clear();
    this.unlockedCount = 0;
    
    allAchievements?.forEach(achievement => {
      const unlocked = unlockedMap.get(achievement.id);
      const processed: Achievement = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon || '🏆',
        points: achievement.points,
        rarity: achievement.rarity || 'common',
        criteria: achievement.criteria,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlocked_at,
        progress: unlocked ? 100 : this.calculateProgress(achievement.criteria),
        rewards: achievement.rewards
      };
      
      if (processed.unlocked) {
        this.unlockedCount++;
      }
      
      this.achievements.set(achievement.id, processed);
    });
  }

  /**
   * Calculate achievement progress
   */
  private async calculateProgress(criteria: any): Promise<number> {
    if (!this.userId || !criteria) return 0;

    switch (criteria.type) {
      case 'sessions_count':
        const { count: sessionCount } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId);
        return Math.min(100, ((sessionCount || 0) / criteria.target) * 100);

      case 'messages_count':
        const { data: sessions } = await supabase
          .from('chat_sessions')
          .select('messages')
          .eq('user_id', this.userId);
        const totalMessages = sessions?.reduce((sum, s) => 
          sum + (Array.isArray(s.messages) ? s.messages.length : 0), 0) || 0;
        return Math.min(100, (totalMessages / criteria.target) * 100);

      case 'streak_days':
        const streakData = progressService.getStreakData();
        return Math.min(100, ((streakData?.current || 0) / criteria.target) * 100);

      case 'assessments_completed':
        const { count: assessmentCount } = await supabase
          .from('assessment_results')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId);
        return Math.min(100, ((assessmentCount || 0) / criteria.target) * 100);

      default:
        return 0;
    }
  }

  /**
   * Load user level information
   */
  private async loadUserLevel() {
    if (!this.userId) return;

    const { data: userData } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (userData) {
      this.totalPoints = userData.total_points || 0;
      const level = this.calculateLevel(this.totalPoints);
      
      this.userLevel = {
        level: level.number,
        title: level.title,
        currentXP: this.totalPoints - level.minPoints,
        requiredXP: level.maxPoints - level.minPoints,
        progress: ((this.totalPoints - level.minPoints) / (level.maxPoints - level.minPoints)) * 100,
        perks: level.perks
      };
    } else {
      // Create initial gamification record
      await supabase
        .from('user_gamification')
        .insert({
          user_id: this.userId,
          total_points: 0,
          current_level: 1,
          achievements_unlocked: 0
        });
      
      this.userLevel = {
        level: 1,
        title: 'Beginner',
        currentXP: 0,
        requiredXP: 100,
        progress: 0,
        perks: []
      };
    }
  }

  /**
   * Calculate level from points
   */
  private calculateLevel(points: number): {
    number: number;
    title: string;
    minPoints: number;
    maxPoints: number;
    perks: string[];
  } {
    const levels = [
      { number: 1, title: 'Beginner', minPoints: 0, maxPoints: 100, perks: ['Basic features'] },
      { number: 2, title: 'Explorer', minPoints: 100, maxPoints: 250, perks: ['Custom themes'] },
      { number: 3, title: 'Achiever', minPoints: 250, maxPoints: 500, perks: ['Advanced analytics'] },
      { number: 4, title: 'Expert', minPoints: 500, maxPoints: 1000, perks: ['Priority support'] },
      { number: 5, title: 'Master', minPoints: 1000, maxPoints: 2000, perks: ['Beta features'] },
      { number: 6, title: 'Champion', minPoints: 2000, maxPoints: 4000, perks: ['Custom AI models'] },
      { number: 7, title: 'Legend', minPoints: 4000, maxPoints: 8000, perks: ['Unlimited storage'] },
      { number: 8, title: 'Mythic', minPoints: 8000, maxPoints: 16000, perks: ['Personal coach'] },
      { number: 9, title: 'Transcendent', minPoints: 16000, maxPoints: 32000, perks: ['All perks'] },
      { number: 10, title: 'Enlightened', minPoints: 32000, maxPoints: Infinity, perks: ['Master status'] }
    ];

    return levels.find(l => points >= l.minPoints && points < l.maxPoints) || levels[0];
  }

  /**
   * Load daily challenges
   */
  private async loadDailyChallenges() {
    if (!this.userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data: challenges } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today);

    const { data: userProgress } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', this.userId)
      .eq('date', today);

    const progressMap = new Map(
      userProgress?.map(up => [up.challenge_id, up]) || []
    );

    this.dailyChallenges = challenges?.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      points: challenge.points,
      expiresAt: `${today}T23:59:59`,
      completed: progressMap.get(challenge.id)?.completed || false,
      progress: progressMap.get(challenge.id)?.progress || 0,
      target: challenge.target
    })) || [];
  }

  /**
   * Setup realtime subscriptions
   */
  private setupRealtimeSubscriptions() {
    if (!this.userId) return;

    // Subscribe to achievement unlocks
    supabase
      .channel(`achievements:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleAchievementUnlock(payload.new as any);
        }
      )
      .subscribe();
  }

  /**
   * Handle achievement unlock
   */
  private async handleAchievementUnlock(data: any) {
    const achievement = this.achievements.get(data.achievement_id);
    if (!achievement) return;

    achievement.unlocked = true;
    achievement.unlockedAt = data.unlocked_at;
    achievement.progress = 100;
    this.unlockedCount++;

    // Show notification
    await notificationService.createNotification(this.userId!, {
      title: '🏆 Achievement Unlocked!',
      message: `Congratulations! You've earned "${achievement.name}"!`,
      type: 'achievement',
      category: 'achievement',
      action_url: '/achievements',
      action_label: 'View Achievement',
      metadata: { achievement_id: achievement.id }
    });

    // Award points
    await this.awardPoints(achievement.points, `Achievement: ${achievement.name}`);

    // Apply rewards
    if (achievement.rewards) {
      await this.applyRewards(achievement.rewards);
    }
  }

  /**
   * Award points to user
   */
  async awardPoints(points: number, reason: string): Promise<void> {
    if (!this.userId) return;

    this.totalPoints += points;
    
    // Update database
    const { error } = await supabase
      .from('user_gamification')
      .update({
        total_points: this.totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);

    if (!error) {
      // Check for level up
      const newLevel = this.calculateLevel(this.totalPoints);
      if (this.userLevel && newLevel.number > this.userLevel.level) {
        await this.handleLevelUp(newLevel);
      }

      // Log activity
      await progressService.logActivity('points_earned', reason, points);
    }
  }

  /**
   * Handle level up
   */
  private async handleLevelUp(newLevel: any) {
    this.userLevel = {
      level: newLevel.number,
      title: newLevel.title,
      currentXP: this.totalPoints - newLevel.minPoints,
      requiredXP: newLevel.maxPoints - newLevel.minPoints,
      progress: ((this.totalPoints - newLevel.minPoints) / (newLevel.maxPoints - newLevel.minPoints)) * 100,
      perks: newLevel.perks
    };

    // Update database
    await supabase
      .from('user_gamification')
      .update({
        current_level: newLevel.number
      })
      .eq('user_id', this.userId);

    // Send notification
    await notificationService.createNotification(this.userId!, {
      title: '🎉 Level Up!',
      message: `Congratulations! You've reached Level ${newLevel.number}: ${newLevel.title}!`,
      type: 'achievement',
      category: 'achievement',
      action_url: '/profile',
      action_label: 'View Profile'
    });
  }

  /**
   * Apply achievement rewards
   */
  private async applyRewards(rewards: any) {
    if (!this.userId) return;

    // Apply badge
    if (rewards.badge) {
      await supabase
        .from('user_badges')
        .insert({
          user_id: this.userId,
          badge_id: rewards.badge,
          earned_at: new Date().toISOString()
        });
    }

    // Apply title
    if (rewards.title) {
      await supabase
        .from('user_titles')
        .insert({
          user_id: this.userId,
          title: rewards.title,
          earned_at: new Date().toISOString()
        });
    }

    // Award bonus points
    if (rewards.bonus_points) {
      await this.awardPoints(rewards.bonus_points, 'Achievement bonus');
    }
  }

  /**
   * Check and unlock achievements based on activity
   */
  async checkAchievements(activityType: string, value: number = 1): Promise<void> {
    if (!this.userId) return;

    for (const [id, achievement] of this.achievements) {
      if (achievement.unlocked) continue;

      if (achievement.criteria.type === activityType) {
        // Update progress
        const progress = await this.calculateProgress(achievement.criteria);
        achievement.progress = progress;

        // Check if completed
        if (progress >= 100) {
          await this.unlockAchievement(id);
        }
      }
    }
  }

  /**
   * Unlock an achievement
   */
  private async unlockAchievement(achievementId: string): Promise<void> {
    if (!this.userId) return;

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: this.userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      });

    if (!error) {
      // Will trigger realtime subscription handler
    }
  }

  /**
   * Update daily challenge progress
   */
  async updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
    if (!this.userId) return;

    const challenge = this.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    challenge.progress = Math.min(progress, challenge.target);
    const completed = challenge.progress >= challenge.target;

    const { error } = await supabase
      .from('user_daily_challenges')
      .upsert({
        user_id: this.userId,
        challenge_id: challengeId,
        date: new Date().toISOString().split('T')[0],
        progress: challenge.progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });

    if (!error && completed && !challenge.completed) {
      challenge.completed = true;
      await this.awardPoints(challenge.points, `Daily Challenge: ${challenge.title}`);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'): Promise<LeaderboardEntry[]> {
    let dateFilter = new Date();
    
    switch (period) {
      case 'daily':
        dateFilter.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'monthly':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
    }

    const query = supabase
      .from('user_gamification')
      .select(`
        user_id,
        total_points,
        current_level,
        achievements_unlocked,
        profiles!inner(username, avatar_url)
      `)
      .order('total_points', { ascending: false })
      .limit(100);

    if (period !== 'allTime') {
      query.gte('updated_at', dateFilter.toISOString());
    }

    const { data } = await query;

    return (data || []).map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      username: entry.profiles?.username || 'Anonymous',
      avatar: entry.profiles?.avatar_url || '',
      points: entry.total_points,
      level: entry.current_level,
      achievements: entry.achievements_unlocked
    }));
  }

  /**
   * Get all achievements
   */
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get user level
   */
  getUserLevel(): UserLevel | null {
    return this.userLevel;
  }

  /**
   * Get daily challenges
   */
  getDailyChallenges(): DailyChallenge[] {
    return this.dailyChallenges;
  }

  /**
   * Get total points
   */
  getTotalPoints(): number {
    return this.totalPoints;
  }

  /**
   * Get achievement count
   */
  getAchievementCount(): { unlocked: number; total: number } {
    return {
      unlocked: this.unlockedCount,
      total: this.achievements.size
    };
  }
}

// Export singleton instance
export const achievementService = new AchievementService();