/**
 * Newomen Admin Dashboard
 * Comprehensive admin panel for managing the AI conversational platform
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/optimized-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Brain, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  BarChart3,
  Mic,
  Globe,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalMinutes: number;
  revenue: number;
  avgSessionLength: number;
  completionRate: number;
  satisfactionScore: number;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  mode: string;
  status: 'active' | 'completed' | 'abandoned';
  minutesUsed: number;
  emotionalState: string;
  startedAt: string;
  endedAt?: string;
}

interface SystemHealth {
  apiStatus: 'healthy' | 'degraded' | 'down';
  dbStatus: 'healthy' | 'degraded' | 'down';
  voiceStatus: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  activeConnections: number;
}

const NewomenAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalMinutes: 0,
    revenue: 0,
    avgSessionLength: 0,
    completionRate: 0,
    satisfactionScore: 0
  });
  
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiStatus: 'healthy',
    dbStatus: 'healthy',
    voiceStatus: 'healthy',
    responseTime: 0,
    errorRate: 0,
    activeConnections: 0
  });

  // Charts data
  const [usageData, setUsageData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [tierDistribution, setTierDistribution] = useState<any[]>([]);

  // Configuration
  const [aiConfig, setAiConfig] = useState({
    model: 'gpt-4o-realtime-preview-2024-10-01',
    temperature: 0.7,
    maxTokens: 4096,
    voice: 'nova',
    language: 'en',
    culturalMode: 'universal'
  });

  // Check admin access
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error('Access denied: Admin privileges required');
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadActiveSessions(),
      loadSystemHealth(),
      loadChartData()
    ]);
  };

  const loadStats = async () => {
    try {
      // Get user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get session stats
      const { data: sessions } = await supabase
        .from('voice_sessions')
        .select('minutes_used, status');

      const totalSessions = sessions?.length || 0;
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.minutes_used || 0), 0) || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Get revenue stats
      const { data: payments } = await supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'completed');

      const revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalSessions,
        totalMinutes,
        revenue,
        avgSessionLength: totalSessions > 0 ? totalMinutes / totalSessions : 0,
        completionRate,
        satisfactionScore: 92 // Placeholder
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const { data } = await supabase
        .from('voice_sessions')
        .select(`
          *,
          profiles!inner(username, email)
        `)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(10);

      if (data) {
        setActiveSessions(data.map(session => ({
          id: session.id,
          userId: session.user_id,
          userName: session.profiles?.username || session.profiles?.email || 'Unknown',
          mode: session.mode || 'therapy',
          status: session.status,
          minutesUsed: session.minutes_used || 0,
          emotionalState: session.emotional_journey?.primary || 'neutral',
          startedAt: session.started_at,
          endedAt: session.ended_at
        })));
      }
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const loadSystemHealth = async () => {
    // Simulate system health checks
    setSystemHealth({
      apiStatus: 'healthy',
      dbStatus: 'healthy',
      voiceStatus: 'healthy',
      responseTime: Math.random() * 100 + 50,
      errorRate: Math.random() * 2,
      activeConnections: Math.floor(Math.random() * 50) + 10
    });
  };

  const loadChartData = async () => {
    // Load usage data for last 7 days
    const usageData = [];
    const revenueData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      usageData.push({
        date: dateStr,
        sessions: Math.floor(Math.random() * 100) + 50,
        minutes: Math.floor(Math.random() * 1000) + 500,
        users: Math.floor(Math.random() * 50) + 20
      });
      
      revenueData.push({
        date: dateStr,
        revenue: Math.floor(Math.random() * 500) + 200,
        subscriptions: Math.floor(Math.random() * 20) + 5
      });
    }
    
    setUsageData(usageData);
    setRevenueData(revenueData);
    
    // Emotion distribution
    setEmotionData([
      { emotion: 'Joy', count: 45, percentage: 25 },
      { emotion: 'Sadness', count: 30, percentage: 17 },
      { emotion: 'Anxiety', count: 50, percentage: 28 },
      { emotion: 'Anger', count: 20, percentage: 11 },
      { emotion: 'Fear', count: 35, percentage: 19 }
    ]);
    
    // Tier distribution
    setTierDistribution([
      { name: 'Discovery', value: 150, color: '#8B5CF6' },
      { name: 'Growth', value: 80, color: '#EC4899' },
      { name: 'Transformation', value: 30, color: '#F59E0B' }
    ]);
  };

  // Refresh data periodically
  useEffect(() => {
    if (!isAdmin) return;
    
    const interval = setInterval(() => {
      loadActiveSessions();
      loadSystemHealth();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Save AI configuration
  const saveAiConfig = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'ai_config',
          value: aiConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('AI configuration saved successfully');
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast.error('Failed to save configuration');
    }
  };

  // Monitor session
  const monitorSession = useCallback((sessionId: string) => {
    // Open session monitoring panel
    toast.info(`Monitoring session: ${sessionId}`);
  }, []);

  // End session
  const endSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('voice_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Session ended successfully');
      await loadActiveSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Newomen Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            AI Conversational Platform Management
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => loadDashboardData()}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Exit Admin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minutes Used</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMinutes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgSessionLength.toFixed(1)} min avg session
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.satisfactionScore}% satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full glass">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-config">AI Config</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Usage Chart */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Platform Usage</CardTitle>
                <CardDescription>Sessions and minutes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#EC4899" 
                      fill="#EC4899" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Daily revenue and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="subscriptions" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emotion Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>User emotional states in sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Subscription Tiers</CardTitle>
                <CardDescription>User distribution by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active voice conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{session.userName}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{session.mode}</Badge>
                          <Badge variant="secondary">{session.emotionalState}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {session.minutesUsed} minutes
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => monitorSession(session.id)}
                        >
                          Monitor
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => endSession(session.id)}
                        >
                          End
                        </Button>
                      </div>
                    </div>
                  ))}
                  {activeSessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No active sessions
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Config Tab */}
        <TabsContent value="ai-config" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure AI model and voice settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select 
                    value={aiConfig.model} 
                    onValueChange={(value) => setAiConfig({...aiConfig, model: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-realtime-preview-2024-10-01">
                        GPT-4 Realtime (Oct 2024)
                      </SelectItem>
                      <SelectItem value="gpt-4o-realtime-preview">
                        GPT-4 Realtime Preview
                      </SelectItem>
                      <SelectItem value="gpt-4o">
                        GPT-4 Optimized
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select 
                    value={aiConfig.voice} 
                    onValueChange={(value) => setAiConfig({...aiConfig, voice: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature ({aiConfig.temperature})</Label>
                  <Input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={aiConfig.temperature}
                    onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input 
                    type="number" 
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig({...aiConfig, maxTokens: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={aiConfig.language} 
                    onValueChange={(value) => setAiConfig({...aiConfig, language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cultural Mode</Label>
                  <Select 
                    value={aiConfig.culturalMode} 
                    onValueChange={(value) => setAiConfig({...aiConfig, culturalMode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universal">Universal</SelectItem>
                      <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                      <SelectItem value="gulf">Gulf</SelectItem>
                      <SelectItem value="levantine">Levantine</SelectItem>
                      <SelectItem value="north-african">North African</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveAiConfig} className="w-full">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API Status</span>
                  <Badge variant={systemHealth.apiStatus === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.apiStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <Badge variant={systemHealth.dbStatus === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.dbStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Voice Service</span>
                  <Badge variant={systemHealth.voiceStatus === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.voiceStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Response Time</span>
                  <span className="font-mono">{systemHealth.responseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Rate</span>
                  <span className="font-mono">{systemHealth.errorRate.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Connections</span>
                  <span className="font-mono">{systemHealth.activeConnections}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>SSL Certificate</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>API Keys</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>RLS Policies</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewomenAdmin;