import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeUrl: string;
  crystalReward: number;
  unlockCriteria: {
    type: 'action_count' | 'streak' | 'assessment_complete' | 'level_reached' | 'special';
    target: number;
    action?: string;
  };
  category: 'growth' | 'exploration' | 'community' | 'wellness' | 'milestone';
}

export interface UserProgress {
  userId: string;
  currentLevel: number;
  crystalBalance: number;
  totalCrystalsEarned: number;
  dailyStreak: number;
  lastLoginDate: string;
  achievements: string[];
  actionCounts: Record<string, number>;
  levelProgress: number; // 0-100 percentage to next level
}

export class GamificationService {
  private static readonly LEVEL_CRYSTAL_REQUIREMENTS = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, // Levels 0-10
    5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300, 19200, // Levels 11-20
    21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800, 43700 // Levels 21-30
  ];

  private static readonly ACHIEVEMENTS: Achievement[] = [
    // Growth Achievements
    {
      id: 'first_chat',
      title: 'First Conversation',
      description: 'Started your first chat with NewMe',
      badgeUrl: '/achievements/first-chat.svg',
      crystalReward: 25,
      unlockCriteria: { type: 'action_count', target: 1, action: 'chat_message' },
      category: 'growth'
    },
    {
      id: 'chat_enthusiast',
      title: 'Chat Enthusiast',
      description: 'Sent 50 messages to NewMe',
      badgeUrl: '/achievements/chat-enthusiast.svg',
      crystalReward: 100,
      unlockCriteria: { type: 'action_count', target: 50, action: 'chat_message' },
      category: 'growth'
    },
    {
      id: 'daily_streak_7',
      title: 'Week Warrior',
      description: 'Maintained a 7-day login streak',
      badgeUrl: '/achievements/week-warrior.svg',
      crystalReward: 150,
      unlockCriteria: { type: 'streak', target: 7 },
      category: 'milestone'
    },
    {
      id: 'daily_streak_30',
      title: 'Month Master',
      description: 'Maintained a 30-day login streak',
      badgeUrl: '/achievements/month-master.svg',
      crystalReward: 500,
      unlockCriteria: { type: 'streak', target: 30 },
      category: 'milestone'
    },
    
    // Exploration Achievements
    {
      id: 'first_exploration',
      title: 'Explorer',
      description: 'Completed your first narrative exploration',
      badgeUrl: '/achievements/explorer.svg',
      crystalReward: 50,
      unlockCriteria: { type: 'action_count', target: 1, action: 'exploration_complete' },
      category: 'exploration'
    },
    {
      id: 'narrative_seeker',
      title: 'Narrative Seeker',
      description: 'Completed 5 narrative explorations',
      badgeUrl: '/achievements/narrative-seeker.svg',
      crystalReward: 200,
      unlockCriteria: { type: 'action_count', target: 5, action: 'exploration_complete' },
      category: 'exploration'
    },
    {
      id: 'identity_master',
      title: 'Identity Master',
      description: 'Completed the full narrative identity exploration',
      badgeUrl: '/achievements/identity-master.svg',
      crystalReward: 300,
      unlockCriteria: { type: 'action_count', target: 1, action: 'narrative_identity_complete' },
      category: 'exploration'
    },

    // Assessment Achievements
    {
      id: 'personality_revealed',
      title: 'Personality Revealed',
      description: 'Completed the personality assessment',
      badgeUrl: '/achievements/personality-revealed.svg',
      crystalReward: 75,
      unlockCriteria: { type: 'assessment_complete', target: 1, action: 'personality_test' },
      category: 'growth'
    },
    {
      id: 'balance_seeker',
      title: 'Balance Seeker',
      description: 'Completed the life balance wheel',
      badgeUrl: '/achievements/balance-seeker.svg',
      crystalReward: 75,
      unlockCriteria: { type: 'assessment_complete', target: 1, action: 'balance_wheel' },
      category: 'wellness'
    },
    {
      id: 'growth_planner',
      title: 'Growth Planner',
      description: 'Completed the diagnostic assessment',
      badgeUrl: '/achievements/growth-planner.svg',
      crystalReward: 100,
      unlockCriteria: { type: 'assessment_complete', target: 1, action: 'diagnostic_assessment' },
      category: 'growth'
    },

    // Community Achievements
    {
      id: 'community_member',
      title: 'Community Member',
      description: 'Joined the Newomen community',
      badgeUrl: '/achievements/community-member.svg',
      crystalReward: 50,
      unlockCriteria: { type: 'action_count', target: 1, action: 'community_join' },
      category: 'community'
    },
    {
      id: 'connection_maker',
      title: 'Connection Maker',
      description: 'Made your first community connection',
      badgeUrl: '/achievements/connection-maker.svg',
      crystalReward: 75,
      unlockCriteria: { type: 'action_count', target: 1, action: 'community_connect' },
      category: 'community'
    },
    {
      id: 'couples_challenger',
      title: 'Couples Challenger',
      description: 'Completed a couples challenge',
      badgeUrl: '/achievements/couples-challenger.svg',
      crystalReward: 150,
      unlockCriteria: { type: 'action_count', target: 1, action: 'couples_challenge_complete' },
      category: 'community'
    },

    // Level Achievements
    {
      id: 'level_5',
      title: 'Rising Star',
      description: 'Reached level 5',
      badgeUrl: '/achievements/rising-star.svg',
      crystalReward: 200,
      unlockCriteria: { type: 'level_reached', target: 5 },
      category: 'milestone'
    },
    {
      id: 'level_10',
      title: 'Growth Guru',
      description: 'Reached level 10',
      badgeUrl: '/achievements/growth-guru.svg',
      crystalReward: 400,
      unlockCriteria: { type: 'level_reached', target: 10 },
      category: 'milestone'
    },
    {
      id: 'level_20',
      title: 'Transformation Master',
      description: 'Reached level 20',
      badgeUrl: '/achievements/transformation-master.svg',
      crystalReward: 800,
      unlockCriteria: { type: 'level_reached', target: 20 },
      category: 'milestone'
    },

    // Wellness Achievements
    {
      id: 'mindful_listener',
      title: 'Mindful Listener',
      description: 'Listened to 10 guided audio practices',
      badgeUrl: '/achievements/mindful-listener.svg',
      crystalReward: 125,
      unlockCriteria: { type: 'action_count', target: 10, action: 'audio_complete' },
      category: 'wellness'
    },
    {
      id: 'wellness_warrior',
      title: 'Wellness Warrior',
      description: 'Completed 30 wellness activities',
      badgeUrl: '/achievements/wellness-warrior.svg',
      crystalReward: 250,
      unlockCriteria: { type: 'action_count', target: 30, action: 'wellness_activity' },
      category: 'wellness'
    }
  ];

  /**
   * Award crystals to a user and check for level up
   */
  static async awardCrystals(userId: string, amount: number, reason: string): Promise<{
    success: boolean;
    newBalance: number;
    leveledUp: boolean;
    newLevel?: number;
    achievements?: Achievement[];
  }> {
    try {
      // Award crystals using database function
      const { error: crystalError } = await supabase.rpc('award_crystals_to_user', {
        user_id_param: userId,
        crystal_amount: amount
      });

      if (crystalError) throw crystalError;

      // Get updated user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_memory_profiles')
        .select('current_level, crystal_balance')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const newBalance = profile.crystal_balance;
      const currentLevel = profile.current_level;

      // Check for level up
      const newLevel = this.calculateLevel(newBalance);
      const leveledUp = newLevel > currentLevel;

      if (leveledUp) {
        await supabase
          .from('user_memory_profiles')
          .update({ current_level: newLevel })
          .eq('user_id', userId);
      }

      // Check for new achievements
      const newAchievements = await this.checkForNewAchievements(userId, reason);

      // Log the crystal award
      await this.logCrystalActivity(userId, amount, reason);

      return {
        success: true,
        newBalance,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        achievements: newAchievements
      };
    } catch (error) {
      logger.error('Error awarding crystals', 'GamificationService', error);
      return {
        success: false,
        newBalance: 0,
        leveledUp: false
      };
    }
  }

  /**
   * Record user action and check for achievements
   */
  static async recordAction(userId: string, action: string, _metadata?: Record<string, unknown>): Promise<{
    achievements: Achievement[];
    crystalsAwarded: number;
  }> {
    try {
      void _metadata;
      // Update action count
      const { data: profile, error: profileError } = await supabase
        .from('user_memory_profiles')
        .select('progress_metrics')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const currentMetrics = profile?.progress_metrics || {};
      const actionCount = (currentMetrics[`${action}_count`] || 0) + 1;
      
      const updatedMetrics = {
        ...currentMetrics,
        [`${action}_count`]: actionCount,
        [`${action}_last_date`]: new Date().toISOString()
      };

      await supabase
        .from('user_memory_profiles')
        .update({ progress_metrics: updatedMetrics })
        .eq('user_id', userId);

      // Check for achievements
      const newAchievements = await this.checkForNewAchievements(userId, action);
      
      // Award crystals for achievements
      let totalCrystalsAwarded = 0;
      for (const achievement of newAchievements) {
        const result = await this.awardCrystals(userId, achievement.crystalReward, `achievement_${achievement.id}`);
        if (result.success) {
          totalCrystalsAwarded += achievement.crystalReward;
        }
      }

      return {
        achievements: newAchievements,
        crystalsAwarded: totalCrystalsAwarded
      };
    } catch (error) {
      logger.error('Error recording action', 'GamificationService', error);
      return {
        achievements: [],
        crystalsAwarded: 0
      };
    }
  }

  /**
   * Update daily streak
   */
  static async updateDailyStreak(userId: string): Promise<{
    streakCount: number;
    streakBroken: boolean;
    bonusCrystals: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profile, error } = await supabase
        .from('user_memory_profiles')
        .select('progress_metrics')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const metrics = profile?.progress_metrics || {};
      const lastLoginDate = metrics.last_login_date;
      const currentStreak = metrics.daily_streak || 0;

      let newStreak = 1;
      let streakBroken = false;
      let bonusCrystals = 0;

      if (lastLoginDate) {
        const lastLogin = new Date(lastLoginDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          newStreak = currentStreak + 1;
        } else if (daysDiff === 0) {
          // Same day, keep current streak
          newStreak = currentStreak;
        } else {
          // Streak broken
          newStreak = 1;
          streakBroken = daysDiff > 1;
        }
      }

      // Calculate bonus crystals based on streak
      if (newStreak > 1) {
        bonusCrystals = Math.min(newStreak * 5, 50); // Max 50 crystals per day
      }

      // Update metrics
      const updatedMetrics = {
        ...metrics,
        daily_streak: newStreak,
        last_login_date: today,
        total_login_days: (metrics.total_login_days || 0) + 1
      };

      await supabase
        .from('user_memory_profiles')
        .update({ progress_metrics: updatedMetrics })
        .eq('user_id', userId);

      // Award streak bonus crystals
      if (bonusCrystals > 0) {
        await this.awardCrystals(userId, bonusCrystals, `daily_streak_${newStreak}`);
      }

      return {
        streakCount: newStreak,
        streakBroken,
        bonusCrystals
      };
    } catch (error) {
      logger.error('Error updating daily streak', 'GamificationService', error);
      return {
        streakCount: 1,
        streakBroken: false,
        bonusCrystals: 0
      };
    }
  }

  /**
   * Get user's current progress and achievements
   */
  static async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_memory_profiles')
        .select('current_level, crystal_balance, progress_metrics')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const metrics = profile.progress_metrics || {};
      const currentLevel = profile.current_level;
      const crystalBalance = profile.crystal_balance;
      
      // Get user achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const achievements = userAchievements?.map(ua => ua.achievement_id) || [];

      // Calculate level progress
      const currentLevelRequirement = this.LEVEL_CRYSTAL_REQUIREMENTS[currentLevel] || 0;
      const nextLevelRequirement = this.LEVEL_CRYSTAL_REQUIREMENTS[currentLevel + 1] || currentLevelRequirement + 1000;
      const progressCrystals = crystalBalance - currentLevelRequirement;
      const requiredForNext = nextLevelRequirement - currentLevelRequirement;
      const levelProgress = Math.max(0, Math.min(100, (progressCrystals / requiredForNext) * 100));

      return {
        userId,
        currentLevel,
        crystalBalance,
        totalCrystalsEarned: metrics.total_crystals_earned || crystalBalance,
        dailyStreak: metrics.daily_streak || 0,
        lastLoginDate: metrics.last_login_date || new Date().toISOString().split('T')[0],
        achievements,
        actionCounts: this.extractActionCounts(metrics),
        levelProgress
      };
    } catch (error) {
      logger.error('Error getting user progress', 'GamificationService', error);
      return null;
    }
  }

  /**
   * Get available achievements for user
   */
  static getAvailableAchievements(): Achievement[] {
    return this.ACHIEVEMENTS;
  }

  /**
   * Get user's earned achievements with details
   */
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (!userAchievements) return [];

      return userAchievements
        .map(ua => this.ACHIEVEMENTS.find(a => a.id === ua.achievement_id))
        .filter(Boolean) as Achievement[];
    } catch (error) {
      logger.error('Error getting user achievements', 'GamificationService', error);
      return [];
    }
  }

  /**
   * Calculate level based on crystal balance
   */
  private static calculateLevel(crystalBalance: number): number {
    for (let level = this.LEVEL_CRYSTAL_REQUIREMENTS.length - 1; level >= 0; level--) {
      if (crystalBalance >= this.LEVEL_CRYSTAL_REQUIREMENTS[level]) {
        return level;
      }
    }
    return 0;
  }

  /**
   * Check for new achievements
   */
  private static async checkForNewAchievements(userId: string, action: string): Promise<Achievement[]> {
    try {
      // Get current user data
      const progress = await this.getUserProgress(userId);
      if (!progress) return [];

      // Get already earned achievements
      const { data: earnedAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const earnedIds = new Set(earnedAchievements?.map(ea => ea.achievement_id) || []);

      // Check each achievement
      const newAchievements: Achievement[] = [];

      for (const achievement of this.ACHIEVEMENTS) {
        if (earnedIds.has(achievement.id)) continue;

        let unlocked = false;

        switch (achievement.unlockCriteria.type) {
          case 'action_count': {
            const count = progress.actionCounts[achievement.unlockCriteria.action || action] || 0;
            unlocked = count >= achievement.unlockCriteria.target;
            break;
          }

          case 'streak':
            unlocked = progress.dailyStreak >= achievement.unlockCriteria.target;
            break;

          case 'level_reached':
            unlocked = progress.currentLevel >= achievement.unlockCriteria.target;
            break;

          case 'assessment_complete': {
            const assessmentCount = progress.actionCounts[achievement.unlockCriteria.action || ''] || 0;
            unlocked = assessmentCount >= achievement.unlockCriteria.target;
            break;
          }
        }

        if (unlocked) {
          // Award achievement
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              earned_at: new Date().toISOString()
            });

          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      logger.error('Error checking achievements', 'GamificationService', error);
      return [];
    }
  }

  /**
   * Log crystal activity for analytics
   */
  private static async logCrystalActivity(userId: string, amount: number, reason: string) {
    try {
      await supabase
        .from('crystal_activity_log')
        .insert({
          user_id: userId,
          amount,
          reason,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      // Non-critical, just log
      logger.warn('Failed to log crystal activity', 'GamificationService', error);
    }
  }

  /**
   * Extract action counts from metrics
   */
  private static extractActionCounts(metrics: Record<string, unknown>): Record<string, number> {
    const actionCounts: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(metrics)) {
      if (key.endsWith('_count') && typeof value === 'number') {
        const actionName = key.replace('_count', '');
        actionCounts[actionName] = value;
      }
    }

    return actionCounts;
  }
}

export const gamification = GamificationService;