import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Mic, 
  Shield, 
  Database,
  Sparkles,
  BookOpen,
  Target,
  Activity,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Import admin components
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { CommunityPostsManager } from '@/components/admin/CommunityPostsManager';
import { ContentChallengeManager } from '@/components/admin/ContentChallengeManager';
import { VoiceAgentConfigManager } from '@/components/admin/VoiceAgentConfigManager';
import { VoicePlayground } from '@/components/admin/VoicePlayground';
import { VoiceTestingInterface } from '@/components/admin/VoiceTestingInterface';
import { VoiceAgentTrainer } from '@/components/admin/VoiceAgentTrainer';
// import { AIContentBuilder } from '@/components/admin/AIContentBuilder';
import { GeneralSettings } from '@/components/admin/GeneralSettings';
import { AIProviderSettings } from '@/components/admin/AIProviderSettings';
import { ContentModerationSettings } from '@/components/admin/ContentModerationSettings';
import { AssessmentManager } from '@/components/admin/AssessmentManager';
import { LibraryManager } from '@/components/admin/LibraryManager';
import { AIDiagnosticsPanel } from '@/components/admin/AIDiagnosticsPanel';
import { MigrationHelper } from '@/components/admin/MigrationHelper';
import { APIKeyManager } from '@/components/admin/APIKeyManager';

type AdminSection = 
  | 'overview'
  | 'analytics' 
  | 'users'
  | 'assessments'
  | 'library'
  | 'community'
  | 'content'
  | 'voice'
  | 'ai-content'
  | 'settings'
  | 'ai-providers'
  | 'moderation'
  | 'diagnostics';

interface RecentActivityItem {
  id: string;
  type: 'user' | 'assessment' | 'community' | 'library';
  message: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const navigationItems = [
    { 
      id: 'overview' as AdminSection, 
      label: 'Overview', 
      icon: Activity,
      description: 'Dashboard overview and key metrics'
    },
    { 
      id: 'analytics' as AdminSection, 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'User engagement and platform statistics'
    },
    { 
      id: 'users' as AdminSection, 
      label: 'Users', 
      icon: Users,
      description: 'User management and permissions'
    },
    { 
      id: 'assessments' as AdminSection, 
      label: 'Assessments', 
      icon: Target,
      description: 'Create and manage assessments'
    },
    { 
      id: 'library' as AdminSection, 
      label: 'Library', 
      icon: BookOpen,
      description: 'Content library management'
    },
    { 
      id: 'community' as AdminSection, 
      label: 'Community', 
      icon: MessageSquare,
      description: 'Community posts and discussions'
    },
    { 
      id: 'content' as AdminSection, 
      label: 'Content', 
      icon: FileText,
      description: 'Content challenges and exploration'
    },
    { 
      id: 'voice' as AdminSection, 
      label: 'Voice Agent', 
      icon: Mic,
      description: 'Voice agent configuration'
    },
    { 
      id: 'ai-content' as AdminSection, 
      label: 'Content Builder', 
      icon: Sparkles,
      description: 'Smart content generation'
    },
    { 
      id: 'settings' as AdminSection, 
      label: 'Settings', 
      icon: Settings,
      description: 'General platform settings'
    },
    { 
      id: 'ai-providers' as AdminSection, 
      label: 'Providers', 
      icon: Database,
      description: 'Model provider configurations'
    },
    { 
      id: 'moderation' as AdminSection, 
      label: 'Moderation', 
      icon: Shield,
      description: 'Content moderation settings'
    },
    { 
      id: 'diagnostics' as AdminSection, 
      label: 'Diagnostics', 
      icon: Stethoscope,
      description: 'AI provider diagnostics and troubleshooting'
    }
  ];

  const [overviewData, setOverviewData] = useState<{
    totalUsers: number;
    totalAssessments: number;
    totalCommunityPosts: number;
    totalLibraryItems: number;
    newUsersThisWeek: number;
    activeUsersToday: number;
    completionsThisMonth: number;
    growthPercentage: number;
    recentActivity: RecentActivityItem[];
  }>({
    totalUsers: 0,
    totalAssessments: 0,
    totalCommunityPosts: 0,
    totalLibraryItems: 0,
    newUsersThisWeek: 0,
    activeUsersToday: 0,
    completionsThisMonth: 0,
    growthPercentage: 0,
    recentActivity: []
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    if (activeSection === 'overview') {
      fetchOverviewData();
    }
  }, [activeSection]);

  const fetchOverviewData = async () => {
    try {
      setOverviewLoading(true);

      // Fetch all data in parallel
      const [
        usersResponse,
        assessmentsResponse,
        communityResponse,
        libraryResponse,
        explorationSessionsResponse,
      ] = await Promise.all([
        supabase.from('profiles').select('created_at, last_login_at'),
        supabase.from('assessments').select('id, title, created_at'),
        supabase.from('community_posts').select('id, created_at').limit(1000),
        supabase.from('library_items').select('id, created_at').limit(1000),
        supabase.from('exploration_sessions').select('created_at, status').limit(1000),
      ]);

      const users: Tables<'profiles'>[] = usersResponse.data || [];
      const assessments: Tables<'assessments'>[] = assessmentsResponse.data || [];
      const communityPosts: Tables<'community_posts'>[] = communityResponse.data || [];
      const libraryItems: Tables<'library_items'>[] = libraryResponse.data || [];
      const explorationSessions: Tables<'exploration_sessions'>[] = explorationSessionsResponse.data || [];

      // Calculate metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const newUsersThisWeek = users.filter(u => new Date(u.created_at || '').getTime() > weekAgo.getTime()).length;
      const newUsersLastWeek = users.filter(u => {
        const created = new Date(u.created_at || '');
        return created.getTime() > new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).getTime() && created.getTime() <= weekAgo.getTime();
      }).length;

      const activeUsersToday = users.filter(u => 
        u.last_login_at && new Date(u.last_login_at).getTime() > dayAgo.getTime()
      ).length;

      const completionsThisMonth = explorationSessions.filter(s => 
        s.status === 'completed' && new Date(s.created_at).getTime() > monthAgo.getTime()
      ).length;

      const growthPercentage = newUsersLastWeek > 0 
        ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
        : newUsersThisWeek > 0 ? 100 : 0;

      // Generate recent activity
      const recentActivity: RecentActivityItem[] = [];
      
      // Recent user registrations
      users
        .filter(u => new Date(u.created_at || '').getTime() > dayAgo.getTime())
        .slice(0, 3)
        .forEach((user, index) => {
          recentActivity.push({
            id: `user-${index}`,
            type: 'user' as const,
            message: 'New user joined the platform',
            timestamp: user.created_at || new Date().toISOString()
          });
        });

      // Recent assessments
      assessments
        .filter(a => new Date(a.created_at).getTime() > dayAgo.getTime())
        .slice(0, 2)
        .forEach((assessment, index) => {
          recentActivity.push({
            id: `assessment-${index}`,
            type: 'assessment' as const,
            message: `New assessment "${assessment.title}" was created`,
            timestamp: assessment.created_at
          });
        });

      // Recent community posts
      communityPosts
        .filter(p => new Date(p.created_at).getTime() > dayAgo.getTime())
        .slice(0, 2)
        .forEach((post, index) => {
          recentActivity.push({
            id: `community-${index}`,
            type: 'community' as const,
            message: 'New community post was published',
            timestamp: post.created_at
          });
        });

      // Sort by timestamp and limit
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setOverviewData({
        totalUsers: users.length,
        totalAssessments: assessments.length,
        totalCommunityPosts: communityPosts.length,
        totalLibraryItems: libraryItems.length,
        newUsersThisWeek,
        activeUsersToday,
        completionsThisMonth,
        growthPercentage,
        recentActivity: recentActivity.slice(0, 6)
      });

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'assessment': return <Target className="h-4 w-4" />;
      case 'community': return <MessageSquare className="h-4 w-4" />;
      case 'library': return <BookOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const renderOverview = () => {
    if (overviewLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-strong"><CardContent className="p-6"><div className="flex items-center space-x-2"><Users className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{overviewData.totalUsers.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
          
          <Card className="glass-strong"><CardContent className="p-6"><div className="flex items-center space-x-2"><Target className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{overviewData.totalAssessments}</p><p className="text-xs text-muted-foreground">Assessments</p></div></div></CardContent></Card>
          
          <Card className="glass-strong"><CardContent className="p-6"><div className="flex items-center space-x-2"><MessageSquare className="h-8 w-8 text-purple-600" /><div><p className="text-2xl font-bold">{overviewData.totalCommunityPosts}</p><p className="text-xs text-muted-foreground">Community Posts</p></div></div></CardContent></Card>
          
          <Card className="glass-strong"><CardContent className="p-6"><div className="flex items-center space-x-2"><TrendingUp className="h-8 w-8 text-orange-600" /><div><p className="text-2xl font-bold">
                    {overviewData.growthPercentage > 0 ? '+' : ''}{overviewData.growthPercentage}%
                  </p><p className="text-xs text-muted-foreground">Growth This Week</p></div></div></CardContent></Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{overviewData.activeUsersToday}</p>
                  <p className="text-xs text-muted-foreground">Active Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{overviewData.newUsersThisWeek}</p>
                  <p className="text-xs text-muted-foreground">New This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{overviewData.completionsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Completions This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('assessments')}
              >
                <Target className="h-6 w-6" />
                <span>Create Assessment</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('users')}
              >
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('analytics')}
              >
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('voice')}
              >
                <Mic className="h-6 w-6" />
                <span>Configure Voice</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('ai-content')}
              >
                <Sparkles className="h-6 w-6" />
                <span>Content Builder</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 glass"
                onClick={() => setActiveSection('community')}
              >
                <MessageSquare className="h-6 w-6" />
                <span>Community</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live activity feed from across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overviewData.recentActivity.length > 0 ? (
                overviewData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg glass">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm">{activity.message}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'analytics':
        return <AdminAnalytics />;
      case 'users':
        return <UserManagement />;
      case 'assessments':
        return <AssessmentManager />;
      case 'library':
        return <LibraryManager />;
      case 'community':
        return <CommunityPostsManager />;
      case 'content':
        return <ContentChallengeManager />;
      case 'voice':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <VoiceAgentConfigManager />
              <VoicePlayground />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <VoiceTestingInterface />
              <VoiceAgentTrainer />
            </div>
          </div>
        );
      case 'ai-content':
        return (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">AI Content Builder</h3>
              <p className="text-muted-foreground">Content management features coming soon...</p>
            </CardContent>
          </Card>
        );
      case 'settings':
        return <GeneralSettings />;
      case 'ai-providers':
        return (
          <div className="space-y-6">
            <APIKeyManager />
            <AIProviderSettings />
          </div>
        );
      case 'moderation':
        return <ContentModerationSettings />;
      case 'diagnostics':
        return (
          <div className="space-y-6">
            <MigrationHelper />
            <AIDiagnosticsPanel />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-72 glass-strong h-screen overflow-y-auto border-r border-glass">
          <div className="p-6 border-b border-glass">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <img src="/symbol.svg" alt="Newomen Logo" className="w-8 h-8" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Newomen.me</h1>
                <p className="text-sm text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeSection === item.id
                        ? 'glass-strong border border-primary/20 text-primary'
                        : 'glass hover:glass-strong text-foreground hover:text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 h-screen overflow-y-auto">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Overview'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {navigationItems.find(item => item.id === activeSection)?.description}
              </p>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;