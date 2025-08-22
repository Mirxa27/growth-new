
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Settings, 
  Trophy, 
  Star, 
  Calendar,
  Heart,
  BookOpen,
  Target,
  Crown,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  crystals_count: number;
  level_progress: number;
  login_streak_count: number;
  subscription_tier: string;
  personality_type?: string;
  growth_areas: string[];
  last_login_at: string;
  created_at: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  crystal_reward: number;
  unlocked_at?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [completedExplorations, setCompletedExplorations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    growth_areas: [] as string[]
  });
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAchievements();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        growth_areas: data.growth_areas || []
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          unlocked_at,
          achievements (
            id,
            title,
            description,
            icon,
            crystal_reward
          )
        `)
        .eq('user_id', user?.id);

      if (userError) throw userError;

      const formattedAchievements = userAchievements?.map(ua => ({
        id: ua.achievements.id,
        title: ua.achievements.title,
        description: ua.achievements.description,
        icon: ua.achievements.icon,
        crystal_reward: ua.achievements.crystal_reward,
        unlocked_at: ua.unlocked_at
      })) || [];

      setAchievements(formattedAchievements);
    } catch (error: any) {
      console.log("Error fetching achievements:", error.message);
    }
  };

  const fetchStats = async () => {
    try {
      const { count } = await supabase
        .from('exploration_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      setCompletedExplorations(count || 0);
    } catch (error: any) {
      console.log("Error fetching stats:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          growth_areas: editForm.growth_areas
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'discovery': return { color: 'bg-blue-500/20 text-blue-600', icon: <Star className="w-3 h-3" /> };
      case 'growth': return { color: 'bg-purple-500/20 text-purple-600', icon: <Target className="w-3 h-3" /> };
      case 'transformation': return { color: 'bg-gold-500/20 text-gold-600', icon: <Crown className="w-3 h-3" /> };
      default: return { color: 'bg-gray-500/20 text-gray-600', icon: <User className="w-3 h-3" /> };
    }
  };

  const getPersonalityColor = (type: string) => {
    const colors = {
      'introvert': 'bg-blue-500/10 text-blue-600',
      'extrovert': 'bg-orange-500/10 text-orange-600',
      'analytical': 'bg-green-500/10 text-green-600',
      'creative': 'bg-purple-500/10 text-purple-600',
      'empathetic': 'bg-pink-500/10 text-pink-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Card className="glass-card border-glass p-8 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </Card>
      </div>
    );
  }

  const subscriptionBadge = getSubscriptionBadge(profile.subscription_tier);
  const currentLevel = Math.floor(profile.level_progress / 100) + 1;
  const progressInLevel = profile.level_progress % 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="glass-card border-glass mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {profile.display_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {editing ? (
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                      className="text-2xl font-bold bg-transparent border-0 p-0 h-auto"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{profile.display_name || 'Anonymous User'}</h1>
                  )}
                  
                  <Badge className={subscriptionBadge.color}>
                    {subscriptionBadge.icon}
                    <span className="ml-1 capitalize">{profile.subscription_tier}</span>
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">{profile.email}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-semibold text-lg">{profile.crystals_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Crystals</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-lg">{currentLevel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Level</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookOpen className="w-4 h-4 text-secondary" />
                      <span className="font-semibold text-lg">{completedExplorations}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Explorations</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="font-semibold text-lg">{profile.login_streak_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level Progress</span>
                    <span>{progressInLevel}/100</span>
                  </div>
                  <Progress value={progressInLevel} className="h-2" />
                </div>
                
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button onClick={updateProfile} size="sm" className="bg-gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="glass">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  
                  <Button onClick={signOut} variant="outline" size="sm" className="glass">
                    <Settings className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Growth Areas
                  </CardTitle>
                  <CardDescription>
                    Areas you're focusing on for personal development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-2">
                      <Label>Focus Areas</Label>
                      <Textarea
                        value={editForm.growth_areas.join(', ')}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          growth_areas: e.target.value.split(',').map(s => s.trim())
                        })}
                        placeholder="e.g., Self-confidence, Relationships, Career"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.growth_areas?.length > 0 ? (
                        profile.growth_areas.map((area, index) => (
                          <Badge key={index} variant="outline" className="glass">
                            {area}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No growth areas set. Edit your profile to add them.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-secondary" />
                    Personality Insights
                  </CardTitle>
                  <CardDescription>
                    Insights from your assessments and interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.personality_type ? (
                    <Badge className={getPersonalityColor(profile.personality_type)}>
                      {profile.personality_type}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Complete assessments to unlock personality insights.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your journey highlights and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Joined Newomen</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {profile.last_login_at && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Last Login</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(profile.last_login_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <Card key={achievement.id} className="glass-card border-glass">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <Badge className="bg-yellow-500/20 text-yellow-600">
                        <Star className="w-3 h-3 mr-1" />
                        {achievement.crystal_reward} crystals
                      </Badge>
                      {achievement.unlocked_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="glass-card border-glass col-span-full text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                    <p className="text-muted-foreground">
                      Complete explorations and engage with the platform to unlock achievements.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journal" className="space-y-6">
            <Card className="glass-card border-glass text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Journal entries coming soon</h3>
                <p className="text-muted-foreground">
                  Your completed exploration analyses and personal reflections will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/5">
                  <div>
                    <h4 className="font-medium">Subscription</h4>
                    <p className="text-sm text-muted-foreground">
                      Current plan: {profile.subscription_tier}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="glass">
                    Upgrade
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/5">
                  <div>
                    <h4 className="font-medium">Privacy</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your data and privacy settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="glass">
                    Manage
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
