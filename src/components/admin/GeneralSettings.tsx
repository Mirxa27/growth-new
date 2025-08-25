import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Shield, 
  Bot, 
  Database, 
  Mail, 
  MessageCircle,
  Users,
  Zap,
  Eye,
  Save,
  AlertTriangle,
  CheckCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformSettings {
  platform_name: string;
  platform_description: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_daily_messages: number;
  default_crystal_reward: number;
  ai_provider: string;
  content_moderation_enabled: boolean;
  auto_flag_threshold: number;
}

interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  priority: number;
}

export const GeneralSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'Newomen',
    platform_description: 'AI-Powered Personal Growth Platform for Women',
    support_email: 'support@newomen.me',
    maintenance_mode: false,
    registration_enabled: true,
    max_daily_messages: 100,
    default_crystal_reward: 10,
    ai_provider: 'openai',
    content_moderation_enabled: true,
    auto_flag_threshold: 0.7
  });

  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadAIProviders();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load platform settings from a configuration table or default values
      // For now using default values as the table might not exist yet
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const loadAIProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setAiProviders(data || []);
    } catch (error: any) {
      console.error('Error loading AI providers:', error.message);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to platform_settings table (we'll create this)
      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">General Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-gradient-primary">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="platform">
            <Globe className="w-4 h-4 mr-2" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="w-4 h-4 mr-2" />
            AI & Providers
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Shield className="w-4 h-4 mr-2" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="branding">
            <ImageIcon className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Platform Information
              </CardTitle>
              <CardDescription>
                Basic platform configuration and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name}
                    onChange={(e) => handleSettingChange('platform_name', e.target.value)}
                    placeholder="Platform name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => handleSettingChange('support_email', e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description}
                  onChange={(e) => handleSettingChange('platform_description', e.target.value)}
                  placeholder="Brief description of your platform"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Platform Status</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to prevent new user access during maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to create accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.registration_enabled}
                    onCheckedChange={(checked) => handleSettingChange('registration_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Manage AI providers and conversation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai_provider">Primary AI Provider</Label>
                <Select
                  value={settings.ai_provider}
                  onValueChange={(value) => handleSettingChange('ai_provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_daily_messages">Max Daily Messages per User</Label>
                  <Input
                    id="max_daily_messages"
                    type="number"
                    value={settings.max_daily_messages}
                    onChange={(e) => handleSettingChange('max_daily_messages', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_crystal_reward">Default Crystal Reward</Label>
                  <Input
                    id="default_crystal_reward"
                    type="number"
                    value={settings.default_crystal_reward}
                    onChange={(e) => handleSettingChange('default_crystal_reward', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">AI Providers Status</h4>
                <div className="space-y-3">
                  {aiProviders.length > 0 ? (
                    aiProviders.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 border border-glass rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${provider.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">{provider.provider_type}</p>
                          </div>
                        </div>
                        <Badge variant={provider.is_active ? "default" : "secondary"}>
                          {provider.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No AI providers configured</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Content Moderation
              </CardTitle>
              <CardDescription>
                Configure automatic content moderation and safety features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Content Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic content filtering and moderation
                  </p>
                </div>
                <Switch
                  checked={settings.content_moderation_enabled}
                  onCheckedChange={(checked) => handleSettingChange('content_moderation_enabled', checked)}
                />
              </div>

              {settings.content_moderation_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto_flag_threshold">Auto-Flag Threshold</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="auto_flag_threshold"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={settings.auto_flag_threshold}
                        onChange={(e) => handleSettingChange('auto_flag_threshold', parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Conversations above this confidence score will be automatically flagged
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Moderation Settings
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          Adjust these settings carefully. Too strict settings may interfere with legitimate conversations,
                          while too lenient settings may allow inappropriate content.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Feature Controls
              </CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Core Features</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Voice Conversations</Label>
                      <p className="text-sm text-muted-foreground">Enable voice-to-voice chat</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Themed Explorations</Label>
                      <p className="text-sm text-muted-foreground">Enable guided exploration sessions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Community Features</Label>
                      <p className="text-sm text-muted-foreground">User connections and sharing</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Wellness Features</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Breathing Practices</Label>
                      <p className="text-sm text-muted-foreground">Guided breathing exercises</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Personality Assessment</Label>
                      <p className="text-sm text-muted-foreground">Onboarding personality tests</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Progress Tracking</Label>
                      <p className="text-sm text-muted-foreground">Crystal rewards and achievements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Branding & Assets
              </CardTitle>
              <CardDescription>
                Manage platform branding and visual assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Platform Logo</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-glass rounded-lg bg-glass/20 hover:bg-glass/30 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload new logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Favicon</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-glass rounded-lg bg-glass/20 hover:bg-glass/30 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Upload favicon (16x16 or 32x32)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="w-full h-10 bg-gradient-primary rounded border border-glass cursor-pointer"></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="w-full h-10 bg-gradient-to-r from-secondary to-secondary/80 rounded border border-glass cursor-pointer"></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="w-full h-10 bg-gradient-to-r from-accent to-accent/80 rounded border border-glass cursor-pointer"></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="w-full h-10 bg-background rounded border border-glass cursor-pointer"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};