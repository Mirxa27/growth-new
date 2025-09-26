import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
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


// Lazy load all admin components
const UserManagement = lazy(() => import('@/components/admin/UserManagementOptimized'));
const AdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics'));
const CommunityPostsManager = lazy(() => import('@/components/admin/CommunityPostsManager'));
const ContentChallengeManager = lazy(() => import('@/components/admin/ContentChallengeManager'));
const VoiceAgentConfigManager = lazy(() => import('@/components/admin/VoiceAgentConfigManager'));
const VoicePlayground = lazy(() => import('@/components/admin/VoicePlayground'));
const VoiceTestingInterface = lazy(() => import('@/components/admin/VoiceTestingInterface'));
const VoiceAgentTrainer = lazy(() => import('@/components/admin/VoiceAgentTrainer'));
const AIContentBuilder = lazy(() => import('@/components/admin/AIContentBuilder'));
const GeneralSettings = lazy(() => import('@/components/admin/GeneralSettings'));
const AIRealtimeVoiceAgentAdminPanel = lazy(() => import('@/components/admin/AIRealtimeVoiceAgentAdminPanel'));
const ContentModerationSettings = lazy(() => import('@/components/admin/ContentModerationSettings'));
const AssessmentManager = lazy(() => import('@/components/admin/AssessmentManager'));
const LibraryManager = lazy(() => import('@/components/admin/LibraryManager'));
const AIDiagnosticsPanel = lazy(() => import('@/components/admin/AIDiagnosticsPanel'));
const MigrationHelper = lazy(() => import('@/components/admin/MigrationHelper'));
const APIKeyManager = lazy(() => import('@/components/admin/APIKeyManager'));
const EnhancedVoiceAgentConfigManager = lazy(() => import('@/components/admin/EnhancedVoiceAgentConfigManager'));
const RBACManager = lazy(() => import('@/components/admin/RBACManager'));
const AuditTrailSystem = lazy(() => import('@/components/admin/AuditTrailSystem'));
const SystemMonitor = lazy(() => import('@/components/admin/SystemMonitor'));
const TwoFactorSettings = lazy(() => import('@/components/admin/TwoFactorSettings'));
const EnhancedRealtimeVoiceAgent = lazy(() => import('@/components/voice/EnhancedRealtimeVoiceAgent'));

// Loading component for lazy loaded components
const ComponentLoader = React.memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
));

ComponentLoader.displayName = 'ComponentLoader';

type AdminSection =
  | 'overview'
  | 'analytics'
  | 'users'
  | 'rbac'
  | 'audit'
  | 'system'
  | 'security'
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

  // If an explicit section is provided via query param (e.g. ?section=ai-providers),
  // use it to initialize the active section. This makes e2e tests and direct links reliable.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section') as AdminSection | null;
      if (section) {
        setActiveSection(section);
      }
    } catch (e) {
      // ignore in non-browser contexts
    }
  }, []);

  // Memoize navigation items to prevent re-renders
  const navigationItems = useMemo(() => [
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
      description: 'User management and profiles'
    },
    {
      id: 'rbac' as AdminSection,
      label: 'RBAC',
      icon: Shield,
      description: 'Role-based access control and permissions'
    },
    {
      id: 'system' as AdminSection,
      label: 'System Monitor',
      icon: Stethoscope,
      description: 'System health and performance monitoring'
    },
    {
      id: 'security' as AdminSection,
      label: 'Security Settings',
      icon: Shield,
      description: 'Two-factor authentication and session management'
    },
    {
      id: 'audit' as AdminSection,
      label: 'Audit Trail',
      icon: Activity,
      description: 'Comprehensive audit logging and monitoring'
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
  ], []); // Empty dependency array ensures this is computed only once

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

  // Memoize overview render to prevent unnecessary re-computations
  const renderOverview = useMemo(() => {
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
  }, [overviewLoading, overviewData]); // Add dependencies

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'analytics':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AdminAnalytics />
          </Suspense>
        );
      case 'users':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <UserManagement />
          </Suspense>
        );
      case 'rbac':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <RBACManager />
          </Suspense>
        );
      case 'audit':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AuditTrailSystem />
          </Suspense>
        );
      case 'assessments':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AssessmentManager />
          </Suspense>
        );
      case 'library':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LibraryManager />
          </Suspense>
        );
      case 'community':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CommunityPostsManager />
          </Suspense>
        );
      case 'content':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ContentChallengeManager />
          </Suspense>
        );
      case 'voice':
        return (
          <div className="space-y-6">
            {/* Enhanced Real-time Voice Assistant */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-6 w-6" />
                  Enhanced Voice Assistant
                </CardTitle>
                <CardDescription>
                  Test the latest OpenAI GPT-4o Realtime voice assistant with enhanced features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ComponentLoader />}>
                  <EnhancedRealtimeVoiceAgent />
                </Suspense>
              </CardContent>
            </Card>

            {/* Enhanced Voice Agent Configuration */}
            <Suspense fallback={<ComponentLoader />}>
              <EnhancedVoiceAgentConfigManager />
            </Suspense>

            {/* Legacy Components */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Legacy Voice Components</CardTitle>
                <CardDescription>
                  Previous voice assistant implementations and testing tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Suspense fallback={<ComponentLoader />}>
                    <AIRealtimeVoiceAgentAdminPanel />
                  </Suspense>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Suspense fallback={<ComponentLoader />}>
                      <VoiceAgentConfigManager />
                    </Suspense>
                    <Suspense fallback={<ComponentLoader />}>
                      <VoicePlayground />
                    </Suspense>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Suspense fallback={<ComponentLoader />}>
                      <VoiceTestingInterface />
                    </Suspense>
                    <Suspense fallback={<ComponentLoader />}>
                      <VoiceAgentTrainer />
                    </Suspense>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'ai-content':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AIContentBuilder />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <GeneralSettings />
          </Suspense>
        );
      case 'ai-providers':
        return (
          <div className="space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <APIKeyManager />
            </Suspense>
            <Suspense fallback={<ComponentLoader />}>
              <AIRealtimeVoiceAgentAdminPanel />
            </Suspense>
          </div>
        );
      case 'moderation':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ContentModerationSettings />
          </Suspense>
        );
      case 'diagnostics':
        return (
          <div className="space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <MigrationHelper />
            </Suspense>
            <Suspense fallback={<ComponentLoader />}>
              <AIDiagnosticsPanel />
            </Suspense>
          </div>
        );
      case 'system':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SystemMonitor />
          </Suspense>
        );
      case 'security':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <TwoFactorSettings />
          </Suspense>
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