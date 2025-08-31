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
  TrendingUp
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
import { AIContentBuilder } from '@/components/admin/AIContentBuilder';
import { GeneralSettings } from '@/components/admin/GeneralSettings';
import { AIProviderSettings } from '@/components/admin/AIProviderSettings';
import { ContentModerationSettings } from '@/components/admin/ContentModerationSettings';
import { AssessmentManager } from '@/components/admin/AssessmentManager';
import { LibraryManager } from '@/components/admin/LibraryManager';

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
  | 'moderation';

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
                <Mic className<dyad-problem-report summary="2 problems">
<problem file="supabase/functions/submit-result/index.ts" line="1" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.39.6' or its corresponding type declarations.</problem>
<problem file="supabase/functions/realtime-voice-session/index.ts" line="2" column="23" code="2307">Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.</problem>
</dyad-problem-report><think>**Addressing TypeScript Errors**

I'm currently focused on the `TS 2307` error surfacing in my Supabase Edge Functions. The compiler seems to be having trouble locating specific modules. I suspect this stems from the build process or the configuration of my TypeScript environment. Right now, I'm examining my import statements and project structure closely. I also need to ensure that the dependencies are correctly installed and accessible during the build.


**Fixing Module Resolution**

I've zeroed in on the module resolution issue within the Supabase Edge Functions. It appears the root cause is the Vite-based build setup clashing with Deno-specific imports. The `TS 2307` error is a dead giveaway. I've decided to refine the approach. Instead of a blanket exclusion, I'm examining a more surgical method. I'm focusing on modifying the `tsconfig.app.json` file to explicitly exclude the `supabase/functions` directory from the main application's type checking. This should prevent the transpiler from stumbling over the Deno imports. I'll then review the provided function files for any other potential issues.


**Refining Exclusion Strategy**

I'm now implementing the `tsconfig.app.json` modification. This will explicitly exclude the `supabase/functions` directory from the main TypeScript build process. This prevents the TypeScript compiler within the Vite/Node.js environment from attempting to interpret Deno-specific imports, which are the root cause of the `TS 2307` errors. I've re-examined the function files, and the primary issue indeed lies in module resolution. No other immediate problems are apparent. I am now confident that this exclusion is the most direct and effective solution.


**Resolving Import Conflicts**

I'm now fully focused on updating the `tsconfig.app.json` file. The goal is to exclude the `supabase/functions` directory from the primary TypeScript build. This prevents the Node.js-based compiler from attempting to resolve Deno imports, which are the root cause of the `TS 2307` errors. I've confirmed this is the only necessary adjustment, given the function files are correctly formatted for a Deno environment. I'm confident in the solution now.


**Excluding Deno Functions**

The React app's TypeScript compiler is encountering errors because it's attempting to process Deno-specific code from your Supabase functions. The solution is to update `tsconfig.app.json` to exclude the `supabase/functions` directory from the primary application's TypeScript build process, as shown below.

```json
{
  "extends":  "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["supabase/functions"]
}
```

</think>Of course. I can fix these TypeScript errors for you.

The problem is that your application's TypeScript compiler is trying to process the code for your Supabase Edge Functions. Since these functions are designed to run in a Deno environment, they use URL imports (`https://...`) which the Vite/Node.js build process doesn't understand.

The solution is to tell the application's TypeScript configuration to ignore the `supabase/functions` directory. I will update your `tsconfig.app.json` to do just that.

<dyad-write path="tsconfig.app.json" description="Excluding Supabase functions from the TypeScript build.">
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "supabase/functions"]
}