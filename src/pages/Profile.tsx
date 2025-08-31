import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Trophy,
  Edit,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Json } from '@/integrations/supabase/types';

// Base type from Supabase auto-generated types
type BaseProfileRow = Tables<'profiles'>;

// Define a type for the settings object that will be stored in the JSONB column
interface ProfileSettings {
  notifications: {
    emailUpdates: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    communityActivity: boolean;
    assessmentReminders: boolean;
  };
  privacy: {
    profileVisibility: boolean;
    activityStatus: boolean;
    shareAssessmentResults: boolean;
  };
}

// Extend the base profile type to include our new 'settings' column
// This resolves the TypeScript errors.
type ProfileWithSettings = BaseProfileRow & {
  settings: Json;
};

interface Achievement {
  name: string;
  description: string;
  earned: boolean;
  date: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Use our extended type for the profile state
  const [profile, setProfile] = useState<ProfileWithSettings | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        const defaultSettings: ProfileSettings = {
          notifications: {
            emailUpdates: true, pushNotifications: true, weeklyDigest: false,
            communityActivity: true, assessmentReminders: true
          },
          privacy: {
            profileVisibility: true, activityStatus: true, shareAssessmentResults: true
          }
        };
        
        // Merge fetched settings with defaults to ensure all keys exist
        const mergedSettings = {
          notifications: { ...defaultSettings.notifications, ...(data.settings as any)?.notifications },
          privacy: { ...defaultSettings.privacy, ...(data.settings as any)?.privacy }
        };

        setProfile({
          ...data,
          settings: mergedSettings,
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({ title: 'Error', description: 'Could not fetch your profile.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // This function remains the same
  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('unlocked_at, achievement:achievement_id(title, description, icon)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const mappedData = data
          .map(ua => {
            if (!ua.achievement || typeof ua.achievement !== 'object' || Array.isArray(ua.achievement)) {
              return null;
            }
            const achievementData = ua.achievement as { title: string; description: string };
            return {
              name: achievementData.title,
              description: achievementData.description,
              earned: !!ua.unlocked_at,
              date: ua.unlocked_at ? new Date(ua.unlocked_at).toLocaleDateString() : null
            };
          })
          .filter((a): a is Achievement => a !== null);
        setAchievements(mappedData);
      }
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
    }
  }, [user]);


  useEffect(() => {
    fetchProfile();
    fetchAchievements();
  }, [fetchProfile, fetchAchievements]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          phone: profile.phone, 
          location: profile.location,
          bio: profile.bio,
          settings: profile.settings, // Now this is a valid field
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      toast({ title: 'Profile updated!', description: 'Your changes have been saved successfully.' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingAvatar(true);
    try {
      const file = e.target.files[0];
      const path = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      if (updateError) throw updateError;
      
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : null);
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSettingsChange = (category: 'notifications' | 'privacy', key: string, value: boolean) => {
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      
      const newSettings = JSON.parse(JSON.stringify(prevProfile.settings || {}));
      
      if (!newSettings[category]) {
        newSettings[category] = {};
      }
      newSettings[category][key] = value;

      return { ...prevProfile, settings: newSettings };
    });
  };

  if (isLoading && !profile) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (!profile) {
    return <div className="text-center py-10">Could not load profile. Please try again later.</div>;
  }

  // Cast the settings from Json to our specific ProfileSettings type for safe access
  const profileSettings = profile.settings as unknown as ProfileSettings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="glass border-card-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name || 'User'} />
                        <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                          {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => document.getElementById('avatar-upload-input')?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? <LoadingSpinner size="sm" /> : <Camera className="w-4 h-4" />}
                      </Button>
                      <input id="avatar-upload-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarSelected} />
                    </div>
                    <Badge className="mt-3 bg-primary/20 text-primary">
                      {profile.personality_type || 'Explorer'}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                        <p className="text-muted-foreground">Member since {new Date(profile.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="glass">
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                      )}
                    </div>
                    {/* Stat cards can be added here */}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and bio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profile.display_name || ''} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} disabled={!isEditing} className="pl-10 glass" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled className="pl-10 glass" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={!isEditing} className="pl-10 glass" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={profile.location || ''} onChange={(e) => setProfile({ ...profile, location: e.target.value })} disabled={!isEditing} className="pl-10 glass" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} disabled={!isEditing} className="glass min-h-[100px]" />
                </div>
              </CardContent>
              {isEditing && (
                <CardFooter className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-gradient-primary">
                    {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                  </Button>
                  <Button onClick={() => { setIsEditing(false); fetchProfile(); }} variant="outline" className="glass">Cancel</Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Track your progress and milestones</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.name} className={`p-4 rounded-lg border-2 ${achievement.earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/5 border-muted/20'}`}>
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <Badge variant={achievement.earned ? 'secondary' : 'outline'} className="text-xs">
                      {achievement.earned ? `Earned ${achievement.date}` : 'Not earned yet'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(profileSettings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                    <Switch id={key} checked={value} onCheckedChange={(checked) => handleSettingsChange('notifications', key, checked)} />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />} Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Control your privacy settings and data sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(profileSettings.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                    <Switch id={key} checked={value} onCheckedChange={(checked) => handleSettingsChange('privacy', key, checked)} />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col gap-4 items-start">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />} Save Privacy Settings
                </Button>
                <Separator />
                <Button onClick={signOut} variant="outline" className="w-full glass">Sign Out</Button>
                <Button variant="destructive" className="w-full">Delete Account</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;