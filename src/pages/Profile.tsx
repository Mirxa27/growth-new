import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    personalityType: '',
    crystalsEarned: 0,
    completedAssessments: 0,
    streakDays: 0
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    pushNotifications: true,
    weeklyDigest: false,
    communityActivity: true,
    assessmentReminders: true
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
    }, 1000);
  };

  const achievements = [
    { name: 'First Steps', description: 'Completed your first assessment', earned: true, date: 'Jan 15, 2024' },
    { name: 'Consistent Growth', description: '7-day activity streak', earned: true, date: 'Jan 22, 2024' },
    { name: 'Community Member', description: 'Made your first community post', earned: true, date: 'Jan 25, 2024' },
    { name: 'Self-Aware', description: 'Completed personality assessment', earned: true, date: 'Jan 28, 2024' },
    { name: 'Balanced Life', description: 'Completed life balance wheel', earned: false, date: null },
    { name: 'Mentor', description: 'Helped 5 community members', earned: false, date: null }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
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

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <Card className="glass border-card-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => toast({ title: "Feature coming soon!", description: "Photo upload will be available soon." })}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge className="mt-3 bg-primary/20 text-primary">
                      {profile.personalityType}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                        <p className="text-muted-foreground">Member since {profile.joinDate}</p>
                      </div>
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        className="glass"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 glass rounded-lg">
                        <div className="text-2xl font-bold text-primary">{profile.crystalsEarned}</div>
                        <div className="text-xs text-muted-foreground">Crystals</div>
                      </div>
                      <div className="text-center p-3 glass rounded-lg">
                        <div className="text-2xl font-bold text-secondary">{profile.completedAssessments}</div>
                        <div className="text-xs text-muted-foreground">Assessments</div>
                      </div>
                      <div className="text-center p-3 glass rounded-lg">
                        <div className="text-2xl font-bold text-accent">{profile.streakDays}</div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and bio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 glass"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 glass"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 glass"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 glass"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    className="glass min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="bg-gradient-primary"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="glass"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  Track your progress and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.earned
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/5 border-muted/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.earned ? 'bg-primary text-white' : 'bg-muted'
                        }`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {achievement.earned && achievement.date && (
                            <Badge variant="secondary" className="text-xs">
                              Earned {achievement.date}
                            </Badge>
                          )}
                          {!achievement.earned && (
                            <Badge variant="outline" className="text-xs">
                              Not earned yet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'emailUpdates' && 'Receive updates via email'}
                        {key === 'pushNotifications' && 'Get push notifications on your device'}
                        {key === 'weeklyDigest' && 'Weekly summary of your progress'}
                        {key === 'communityActivity' && 'Notifications from community interactions'}
                        {key === 'assessmentReminders' && 'Reminders to complete assessments'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, [key]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => toast({ title: "Feature coming soon!", description: "Export functionality will be available soon." })}
                  variant="outline"
                  className="w-full glass"
                >
                  Export My Data
                </Button>
                <Button
                  onClick={() => toast({ title: "Feature coming soon!", description: "Account deletion will be available soon." })}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy settings and data sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to other community members
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Activity Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you're active in the community
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Assessment Results</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow sharing of assessment insights for better recommendations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="w-full glass"
                  >
                    Sign Out
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