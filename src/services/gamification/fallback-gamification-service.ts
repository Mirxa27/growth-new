
/**
 * Fallback Gamification Service
 * Works without missing database tables
 */

export class FallbackGamificationService {
  async updateDailyStreak(userId) {
    // Return default streak data
    return {
      bonusCrystals: 0,
      currentStreak: 1,
      longestStreak: 1
    };
  }

  async getUserProgress(userId) {
    // Return default progress data
    return {
      currentLevel: 1,
      crystalBalance: 0,
      levelProgress: 0,
      dailyStreak: 1,
      achievements: [],
      experiencePoints: 0
    };
  }

  async getUserAchievements(userId) {
    // Return default achievements
    return [
      {
        id: 'welcome',
        title: 'Welcome to Newomen',
        description: 'Started your growth journey',
        crystals: 50,
        unlocked: true,
        unlocked_at: new Date().toISOString()
      }
    ];
  }

  async awardCrystals(userId, amount, reason) {
    // Return success without actually awarding
    return {
      success: true,
      newBalance: amount,
      awarded: amount
    };
  }

  async checkLevelUp(userId) {
    // Return no level up
    return {
      leveledUp: false,
      currentLevel: 1,
      newLevel: 1
    };
  }

  async updateProgress(userId, metric, value) {
    // Return success without updating
    return {
      success: true,
      metric,
      value
    };
  }

  async getLeaderboard(limit = 10) {
    // Return empty leaderboard
    return [];
  }
}

export const gamification = new FallbackGamificationService();
