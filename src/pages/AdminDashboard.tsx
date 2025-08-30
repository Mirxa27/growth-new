import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings,
  MessageSquare,
  BookOpen,
  Brain,
  AlertTriangle,
  TrendingUp,
  Activity,
  UserCheck,
  FileText,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock admin data
  const stats = {
    totalUsers: 12547,
    activeUsers: 8934,
    totalAssessments: 25689,
    communityPosts: 3421,
    aiInteractions: 156789,
    crystalsAwarded: 2456789
  };

  const recentActivity = [
    { type: 'user_signup', message: 'New user registered: sarah@example.com', time: '2 minutes ago' },
    { type: 'assessment_completed', message: 'Personality assessment completed by user #1234', time: '5 minutes ago' },
    { type: 'community_post', message: 'New community post flagged for review', time: '10 minutes ago' },
    { type: 'ai_interaction', message: 'High volume of AI chat sessions detected', time: '15 minutes ago' }
  ];

  const handleSystemAction = (action: string) => {
    toast({
      title: `${action} initiated`,
      description: "System action has been queued for processing.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System management and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-500">
              System Healthy
            </Badge>
            <Badge variant="outline">
              Admin Access
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ai">AI Systems</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Active Users</div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalAssessments.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Assessments</div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.communityPosts.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Community Posts</div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.aiInteractions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">AI Interactions</div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.crystalsAwarded.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Crystals Awarded</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 glass rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Server Performance</span>
                      <span>98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Database Health</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>AI Response Time</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>User Satisfaction</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Search users..." className="glass" />
                  <Button className="bg-gradient-primary">Search</Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <div>
                      <div className="font-medium">Sarah Johnson</div>
                      <div className="text-sm text-muted-foreground">sarah@example.com</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                      <Button size="sm" variant="outline" className="glass">Manage</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <div>
                      <div className="font-medium">Maya Chen</div>
                      <div className="text-sm text-muted-foreground">maya@example.com</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                      <Button size="sm" variant="outline" className="glass">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Content Management
                </CardTitle>
                <CardDescription>
                  Manage library content and assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleSystemAction('Content Sync')}
                    className="h-20 bg-gradient-primary"
                  >
                    <div className="text-center">
                      <FileText className="w-6 h-6 mx-auto mb-1" />
                      <div>Sync Content</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleSystemAction('Assessment Review')}
                    variant="outline"
                    className="h-20 glass"
                  >
                    <div className="text-center">
                      <Brain className="w-6 h-6 mx-auto mb-1" />
                      <div>Review Assessments</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI System Management
                </CardTitle>
                <CardDescription>
                  Monitor and configure AI systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 glass rounded-lg text-center">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">AI Chat</div>
                    <Badge className="bg-green-500/20 text-green-500 mt-2">Online</Badge>
                  </div>
                  
                  <div className="p-4 glass rounded-lg text-center">
                    <Brain className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <div className="text-lg font-semibold">Assessment AI</div>
                    <Badge className="bg-green-500/20 text-green-500 mt-2">Online</Badge>
                  </div>
                  
                  <div className="p-4 glass rounded-lg text-center">
                    <Globe className="w-8 h-8 text-accent mx-auto mb-2" />
                    <div className="text-lg font-semibold">Translation</div>
                    <Badge className="bg-green-500/20 text-green-500 mt-2">Online</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">AI Configuration</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label>Enable AI Chat</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Auto-moderate Content</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Personalized Recommendations</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Community Moderation
                </CardTitle>
                <CardDescription>
                  Monitor and moderate community activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 glass rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <div className="font-medium">3 posts pending review</div>
                    <div className="text-sm text-muted-foreground">Community posts flagged for moderation</div>
                  </div>
                  <Button size="sm" className="bg-gradient-primary">Review</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleSystemAction('Community Cleanup')}
                    variant="outline"
                    className="h-16 glass"
                  >
                    <div className="text-center">
                      <UserCheck className="w-5 h-5 mx-auto mb-1" />
                      <div>Run Cleanup</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleSystemAction('Generate Report')}
                    variant="outline"
                    className="h-16 glass"
                  >
                    <div className="text-center">
                      <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                      <div>Generate Report</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure global system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Maintenance Mode</Label>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>New User Registration</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Analytics Tracking</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">System Actions</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleSystemAction('Database Backup')}
                      variant="outline"
                      className="glass"
                    >
                      Backup Database
                    </Button>
                    
                    <Button
                      onClick={() => handleSystemAction('Clear Cache')}
                      variant="outline"
                      className="glass"
                    >
                      Clear Cache
                    </Button>
                    
                    <Button
                      onClick={() => handleSystemAction('System Update')}
                      variant="outline"
                      className="glass"
                    >
                      Check Updates
                    </Button>
                    
                    <Button
                      onClick={() => handleSystemAction('Export Logs')}
                      variant="outline"
                      className="glass"
                    >
                      Export Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;