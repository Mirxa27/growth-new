
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  Compass, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalExplorations: number;
  completedSessions: number;
  totalMessages: number;
}

interface AdminUser {
  id: string;
  user_id: string;
  display_name?: string;
  masked_email: string;
  subscription_tier: string;
  crystals_count: number;
  created_at: string;
  last_login_at?: string;
  role: string;
  level_progress: number;
  login_streak_count: number;
  updated_at: string;
}

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  is_active: boolean;
  questions: string[];
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalExplorations: 0,
    completedSessions: 0,
    totalMessages: 0
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExploration, setSelectedExploration] = useState<Exploration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error || profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }
    } catch (error) {
      navigate('/dashboard');
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [usersRes, explorationsRes, sessionsRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('id, created_at, last_login_at'),
        supabase.from('explorations').select('id'),
        supabase.from('exploration_sessions').select('id, status'),
        supabase.from('messages').select('id')
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const activeUsers = usersRes.data?.filter(u => {
        const lastLogin = new Date(u.last_login_at || 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastLogin > weekAgo;
      }).length || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalExplorations: explorationsRes.data?.length || 0,
        completedSessions: sessionsRes.data?.filter(s => s.status === 'completed').length || 0,
        totalMessages: messagesRes.data?.length || 0
      });

      // Load users with safe profile data
      const { data: safeUsers, error: usersError } = await supabase
        .rpc('get_admin_safe_profiles');

      if (usersError) throw usersError;
      setUsers(safeUsers || []);

      // Load explorations
      const { data: explorationsData, error: explorationsError } = await supabase
        .from('explorations')
        .select('*')
        .order('created_at', { ascending: false });

      if (explorationsError) throw explorationsError;
      
      const transformedExplorations: Exploration[] = (explorationsData || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        difficulty_level: item.difficulty_level,
        is_active: item.is_active,
        questions: Array.isArray(item.questions) ? item.questions.filter((q): q is string => typeof q === 'string') : [],
        created_at: item.created_at
      }));
      
      setExplorations(transformedExplorations);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExploration = () => {
    setSelectedExploration({
      id: '',
      title: '',
      description: '',
      category: 'self-discovery',
      difficulty_level: 'beginner',
      is_active: true,
      questions: [''],
      created_at: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleEditExploration = (exploration: Exploration) => {
    setSelectedExploration(exploration);
    setIsEditing(true);
  };

  const handleSaveExploration = async () => {
    if (!selectedExploration) return;

    try {
      const explorationData = {
        title: selectedExploration.title,
        description: selectedExploration.description,
        category: selectedExploration.category,
        difficulty_level: selectedExploration.difficulty_level,
        is_active: selectedExploration.is_active,
        questions: selectedExploration.questions.filter(q => q.trim()),
        facilitator_prompt: "You are a gentle, empathetic facilitator guiding someone through a personal exploration. Ask each question with care and acknowledge their responses before moving to the next question.",
        higher_self_prompt: "You are the user's wise Higher Self. Analyze their responses with deep insight and provide a structured analysis that reveals patterns, potential, and actionable guidance.",
        analysis_structure: {
          corePattern: "Identify the main theme or pattern in their responses",
          hiddenPotential: "Reveal their untapped strengths and possibilities",
          actionableSteps: "Provide 3-5 specific, practical steps they can take",
          affirmations: "Give 3-5 personalized affirmations based on their responses",
          encouragement: "Offer heartfelt encouragement for their journey"
        },
        estimated_duration: 30,
        crystal_reward: 100
      };

      if (selectedExploration.id) {
        // Update existing
        const { error } = await supabase
          .from('explorations')
          .update(explorationData)
          .eq('id', selectedExploration.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('explorations')
          .insert(explorationData);

        if (error) throw error;
      }

      toast({
        title: "Success!",
        description: selectedExploration.id ? "Exploration updated" : "Exploration created",
      });

      setIsEditing(false);
      setSelectedExploration(null);
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error saving exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteExploration = async (explorationId: string) => {
    try {
      const { error } = await supabase
        .from('explorations')
        .update({ is_active: false })
        .eq('id', explorationId);

      if (error) throw error;

      toast({
        title: "Exploration deactivated",
        description: "The exploration has been hidden from users",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error deactivating exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage the Newomen platform
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            <Shield className="w-4 h-4 mr-1" />
            Admin Access
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Compass className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-secondary">{stats.totalExplorations}</p>
              <p className="text-xs text-muted-foreground">Explorations</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Database className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">{stats.completedSessions}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-500">{stats.totalMessages}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="explorations" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="explorations">Explorations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="explorations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Explorations Management</h2>
              <Button onClick={handleCreateExploration} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Exploration
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {explorations.map((exploration) => (
                <Card key={exploration.id} className="glass-card border-glass">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{exploration.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {exploration.description}
                        </CardDescription>
                      </div>
                      <Badge variant={exploration.is_active ? "default" : "secondary"}>
                        {exploration.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{exploration.category}</span>
                      <span>{exploration.difficulty_level}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExploration(exploration)}
                        className="glass flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExploration(exploration.id)}
                        className="glass text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-semibold">User Management</h2>
            
            <Card className="glass-card border-glass">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-glass">
                      <tr>
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Tier</th>
                        <th className="text-left p-4">Crystals</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-glass/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{user.masked_email}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {user.subscription_tier}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{user.crystals_count}</td>
                          <td className="p-4 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Button variant="outline" size="sm" className="glass">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-semibold">Platform Settings</h2>
            
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Settings panel would include platform configuration, AI provider settings, 
                  content moderation tools, and other administrative controls.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Exploration Editor Modal */}
        {isEditing && selectedExploration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-glass w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {selectedExploration.id ? 'Edit Exploration' : 'Create New Exploration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={selectedExploration.title}
                    onChange={(e) => setSelectedExploration({
                      ...selectedExploration,
                      title: e.target.value
                    })}
                    placeholder="Exploration title"
                    className="glass border-glass"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={selectedExploration.description}
                    onChange={(e) => setSelectedExploration({
                      ...selectedExploration,
                      description: e.target.value
                    })}
                    placeholder="Exploration description"
                    className="glass border-glass"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={selectedExploration.category}
                      onChange={(e) => setSelectedExploration({
                        ...selectedExploration,
                        category: e.target.value
                      })}
                      className="w-full p-2 glass border-glass rounded"
                    >
                      <option value="self-discovery">Self Discovery</option>
                      <option value="relationships">Relationships</option>
                      <option value="personal-growth">Personal Growth</option>
                      <option value="healing">Healing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={selectedExploration.difficulty_level}
                      onChange={(e) => setSelectedExploration({
                        ...selectedExploration,
                        difficulty_level: e.target.value
                      })}
                      className="w-full p-2 glass border-glass rounded"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Questions</label>
                  {selectedExploration.questions.map((question, index) => (
                    <div key={index} className="mb-2">
                      <Textarea
                        value={question}
                        onChange={(e) => {
                          const newQuestions = [...selectedExploration.questions];
                          newQuestions[index] = e.target.value;
                          setSelectedExploration({
                            ...selectedExploration,
                            questions: newQuestions
                          });
                        }}
                        placeholder={`Question ${index + 1}`}
                        className="glass border-glass"
                        rows={2}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExploration({
                      ...selectedExploration,
                      questions: [...selectedExploration.questions, '']
                    })}
                    className="glass"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveExploration}
                    className="bg-gradient-primary"
                  >
                    Save Exploration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedExploration(null);
                    }}
                    className="glass"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
