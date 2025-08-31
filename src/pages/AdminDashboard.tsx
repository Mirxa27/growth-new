import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Globe,
  Activity,
  TrendingUp
} from 'lucide-react';

// Import admin components
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { CommunityPostsManager } from '@/components/admin/CommunityPostsManager';
import { ContentChallengeManager } from '@/components/admin/ContentChallengeManager';
import { VoiceAgentConfigManager } from '@/components/admin/VoiceAgentConfigManager';
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
      label: 'AI Content', 
      icon: Sparkles,
      description: 'AI-powered content generation'
    },
    { 
      id: 'settings' as AdminSection, 
      label: 'Settings', 
      icon: Settings,
      description: 'General platform settings'
    },
    { 
      id: 'ai-providers' as AdminSection, 
      label: 'AI Providers', 
      icon: Database,
      description: 'AI provider configurations'
    },
    { 
      id: 'moderation' as AdminSection, 
      label: 'Moderation', 
      icon: Shield,
      description: 'Content moderation settings'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">342</p>
                <p className="text-xs text-muted-foreground">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-xs text-muted-foreground">Community Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">23%</p>
                <p className="text-xs text-muted-foreground">Growth This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('assessments')}
            >
              <Target className="h-6 w-6" />
              <span>Create Assessment</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('users')}
            >
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('analytics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('voice')}
            >
              <Mic className="h-6 w-6" />
              <span>Configure Voice</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('ai-content')}
            >
              <Sparkles className="h-6 w-6" />
              <span>AI Content</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => setActiveSection('community')}
            >
              <MessageSquare className="h-6 w-6" />
              <span>Community</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">New User</Badge>
              <span className="text-sm">Sarah M. joined the platform</span>
              <span className="text-xs text-muted-foreground ml-auto">2 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline">Assessment</Badge>
              <span className="text-sm">New assessment "Career Clarity" was completed 15 times</span>
              <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge>Voice Agent</Badge>
              <span className="text-sm">Voice configuration "Therapy Bot" was updated</span>
              <span className="text-xs text-muted-foreground ml-auto">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
        return <VoiceAgentConfigManager />;
      case 'ai-content':
        return <AIContentBuilder />;
      case 'settings':
        return <GeneralSettings />;
      case 'ai-providers':
        return <AIProviderSettings />;
      case 'moderation':
        return <ContentModerationSettings />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-72 bg-white shadow-lg h-screen overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'hover:bg-gray-100 text-gray-700'
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
              <h2 className="text-3xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Overview'}
              </h2>
              <p className="text-gray-600 mt-2">
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