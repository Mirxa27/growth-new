import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Gem, Trophy, Target, Calendar, Edit3, Save, X, Star, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  crystals_count: number;
  level_progress: number;
  created_at: string;
  subscription_tier: string;
  growth_areas: string[];
  personality_type: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  crystal_reward: number;
  unlocked: boolean;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    growth_areas: [] as string[]
  });
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAchievements();
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
        bio: '',
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
      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError) throw achievementsError;

      // Get user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user?.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const achievementsWithStatus = allAchievements?.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id)
      })) || [];

      setAchievements(achievementsWithStatus);
    } catch (error: any) {
      toast({
        title: "Error loading achievements",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
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
        description: "Your profile has been saved successfully"
      });

      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'discovery':
        return <Badge variant="outline">Discovery</Badge>;
      case 'growth':
        return <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">Growth</Badge>;
      case 'transformation':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Transformation</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getCurrentLevel = (progress: number) => {
    return Math.floor(progress / 100) + 1;
  };

  const getLevelProgress = (progress: number) => {
    return progress % 100;
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
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Header */}
            <Card className="glass-card border-glass">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                      {profile.display_name?.[0] || user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">
                        {profile.display_name || 'Anonymous User'}
                      </h1>
                      {getSubscriptionBadge(profile.subscription_tier)}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Gem className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-primary">
                            {profile.crystals_count}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Crystals</p>
                      </div>
                      
                      <div className="text-center p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Trophy className="w-5 h-5 text-secondary" />
                          <span className="text-2xl font-bold text-secondary">
                            Level {getCurrentLevel(profile.level_progress)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Current Level</p>
                      </div>
                      
                      <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/10">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Target className="w-5 h-5 text-accent" />
                          <span className="text-2xl font-bold text-accent">
                            {achievements.filter(a => a.unlocked).length}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Achievements</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Level Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Level {getCurrentLevel(profile.level_progress)} Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getLevelProgress(profile.level_progress)}%
                    </span>
                  </div>
                  <Progress value={getLevelProgress(profile.level_progress)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Growth Areas */}
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Growth Areas
                </CardTitle>
                <CardDescription>
                  Areas you're focusing on for personal development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.growth_areas.length > 0 ? (
                    profile.growth_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {area.replace('_', ' ')}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No growth areas selected yet. Edit your profile to add some!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">AI Conversation</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                    <BookOpen className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Completed Assessment</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <Trophy className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Achievement Unlocked</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`glass-card border-glass transition-all duration-300 ${
                    achievement.unlocked ? 'ring-2 ring-primary/20' : 'opacity-60'
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      achievement.unlocked ? 'bg-gradient-primary' : 'bg-muted'
                    }`}>
                      {achievement.unlocked ? (
                        <Trophy className="w-8 h-8 text-white" />
                      ) : (
                        <Trophy className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <Gem className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {achievement.crystal_reward} crystals
                      </span>
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="outline" className="mt-2">
                        Unlocked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card border-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage your personal information and preferences
                    </CardDescription>
                  </div>
                  {!editing ? (
                    <Button 
                      onClick={() => setEditing(true)}
                      variant="outline"
                      className="glass-button"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={saveProfile}
                        className="bg-gradient-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditing(false)}
                        variant="outline"
                        className="glass-button"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editing ? editForm.display_name : profile.display_name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                    disabled={!editing}
                    className="glass-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="glass-input"
                  />
                </div>

                <div>
                  <Label>Subscription Tier</Label>
                  <div className="mt-2">
                    {getSubscriptionBadge(profile.subscription_tier)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Actions that cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={signOut}
                  variant="destructive"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;