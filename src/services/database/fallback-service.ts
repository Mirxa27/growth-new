/**
 * Fallback service to handle missing database tables gracefully
 */

export class FallbackDatabaseService {
  private static mockData = {
    userProfiles: new Map(),
    communityPosts: [
      {
        id: '1',
        title: 'Welcome to Newomen!',
        content: 'So excited to be part of this amazing community of women supporting each other! 💕',
        author: 'Sara',
        likes: 12,
        category: 'welcome',
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        title: 'Morning Affirmations',
        content: 'Starting my day with positive affirmations has been life-changing. Anyone else trying this?',
        author: 'Maya',
        likes: 8,
        category: 'wellness',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    libraryItems: [
      {
        id: '1',
        title: 'Morning Mindfulness',
        description: 'Start your day with a gentle 5-minute mindfulness practice',
        type: 'audio',
        category: 'meditation',
        duration: 5,
        audio_url: '/audio/morning-mindfulness.mp3',
        is_featured: true
      },
      {
        id: '2',
        title: 'Confidence Building',
        description: 'A powerful 10-minute guided session to build inner confidence',
        type: 'audio',
        category: 'personal_growth',
        duration: 10,
        audio_url: '/audio/confidence-building.mp3',
        is_featured: false
      }
    ],
    explorationSessions: []
  };

  static async getUserProfile(userId: string) {
    // Return mock profile or create new one
    if (!this.mockData.userProfiles.has(userId)) {
      this.mockData.userProfiles.set(userId, {
        id: userId,
        user_id: userId,
        full_name: '',
        display_name: 'New User',
        avatar_url: null,
        onboarding_completed: false,
        created_at: new Date().toISOString()
      });
    }
    return this.mockData.userProfiles.get(userId);
  }

  static async getCommunityPosts(limit = 20) {
    return this.mockData.communityPosts.slice(0, limit);
  }

  static async getLibraryItems(limit = 50) {
    return this.mockData.libraryItems.slice(0, limit);
  }

  static async getExplorationSessions(userId: string) {
    return this.mockData.explorationSessions.filter((s: any) => s.user_id === userId);
  }

  static async recordPerformanceMetric(metricType: string, name: string, value: number) {
    // Just log to console instead of database
    console.log(`Performance Metric [${metricType}]: ${name} = ${value}ms`);
    return true;
  }

  static async logError(message: string, code?: string, severity = 'error') {
    // Just log to console instead of database
    console.error(`Error [${severity}]: ${message}`, code ? `(${code})` : '');
    return true;
  }
}

export const fallbackDb = FallbackDatabaseService;