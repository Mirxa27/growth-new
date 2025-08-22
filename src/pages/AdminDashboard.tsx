import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageCircle, 
  Trophy, 
  TrendingUp, 
  Settings, 
  Database,
  BookOpen,
  Palette,
  BarChart3,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  activeConversations: number;
  completedExplorations: number;
  totalCrystalsAwarded: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeConversations: 0,
    completedExplorations: 0,
    totalCrystalsAwarded: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      if (data?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        return;
      }
    } catch (error: any) {
      toast({
        title: "Error checking permissions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active conversations
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch completed explorations
      const { count: explorationsCount } = await supabase
        .from('exploration_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Calculate total crystals (simplified - in real app would sum from ledger)
      const totalCrystals = (explorationsCount || 0) * 100; // Assuming 100 crystals per exploration

      setStats({
        totalUsers: usersCount || 0,
        activeConversations: conversationsCount || 0,
        completedExplorations: explorationsCount || 0,
        totalCrystalsAwarded: totalCrystals
      });
    } catch (error: any) {
      toast({
        title: "Error fetching stats",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      id: 'explorations',
      title: 'Explorations CMS',
      description: 'Manage themed explorations and questions',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: <Users className="w-5 h-5" />,
      color: 'from-green-500 to-blue-500'
    },
    {
      id: 'content',
      title: 'Content Management',
      description: 'Manage affirmations, breathing practices',
      icon: <Database className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'View usage statistics and insights',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'security',
      title: 'Security & Moderation',
      description: 'Review flagged content and logs',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'branding',
      title: 'Branding & Assets',
      description: 'Manage logos and visual identity',
      icon: <Palette className="w-5 h-5" />,
      color: 'from-pink-500 to-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage the Newomen platform and monitor user engagement
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Conversations</p>
                  <p className="text-3xl font-bold text-secondary">{stats.activeConversations}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Explorations</p>
                  <p className="text-3xl font-bold text-accent">{stats.completedExplorations}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crystals Awarded</p>
                  <p className="text-3xl font-bold text-green-500">{stats.totalCrystalsAwarded}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Card key={section.id} className="glass-card border-glass hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${section.color} flex items-center justify-center`}>
                    <div className="text-white">
                      {section.icon}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                    Admin Only
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 glass-button group-hover:bg-primary/10"
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="glass-card border-glass mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks and system operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="glass-button h-auto p-4 flex flex-col items-center gap-2">
                <Database className="w-6 h-6" />
                <span>Backup Database</span>
              </Button>
              <Button variant="outline" className="glass-button h-auto p-4 flex flex-col items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Review Flagged Content</span>
              </Button>
              <Button variant="outline" className="glass-button h-auto p-4 flex flex-col items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span>Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="glass-card border-glass mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of platform services and components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <span className="text-sm font-medium">Database</span>
                <Badge className="bg-green-500/20 text-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <span className="text-sm font-medium">AI Services</span>
                <Badge className="bg-green-500/20 text-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <span className="text-sm font-medium">Storage</span>
                <Badge className="bg-yellow-500/20 text-yellow-600">Monitoring</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <span className="text-sm font-medium">Authentication</span>
                <Badge className="bg-green-500/20 text-green-600">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;