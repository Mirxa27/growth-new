import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings, AlertCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface SettingsMap {
  [key: string]: any;
}

export const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');
      
      if (error) throw error;

      const settingsMap = data.reduce((acc, { key, value }) => {
        try {
          acc[key] = JSON.parse(value);
        } catch {
          acc[key] = value;
        }
        return acc;
      }, {} as SettingsMap);
      
      setSettings(settingsMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load settings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updates = Object.entries(settings).map(([key, value]) => 
        supabase.rpc('update_platform_setting', {
          setting_key: key,
          setting_value: JSON.stringify(value)
        })
      );

      const results = await Promise.all(updates);
      
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      toast({ title: "Success", description: "Settings saved successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6" /> General Settings</CardTitle>
          <CardDescription>Manage platform-wide settings and configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Mode */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Maintenance Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
                  <span>Enable Maintenance Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    This will make the app unavailable to non-admin users.
                  </span>
                </Label>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenance_mode || false}
                  onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
                />
              </div>
              {settings.maintenance_mode && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    className="glass-input"
                    value={settings.maintenance_message || ''}
                    onChange={(e) => handleSettingChange('maintenance_message', e.target.value)}
                    placeholder="e.g., We'll be back shortly!"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* New User Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">New User Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-signups" className="flex flex-col space-y-1">
                  <span>Enable New Sign-ups</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow new users to register on the platform.
                  </span>
                </Label>
                <Switch
                  id="enable-signups"
                  checked={settings.enable_signups !== false} // default to true
                  onCheckedChange={(checked) => handleSettingChange('enable_signups', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-crystals">Welcome Crystal Amount</Label>
                <Input
                  id="welcome-crystals"
                  type="number"
                  className="glass-input"
                  value={settings.welcome_crystals || 100}
                  onChange={(e) => handleSettingChange('welcome_crystals', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/50 glass">
            <CardHeader>
              <CardTitle className="text-lg text-red-500 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="reset-leaderboard" className="flex flex-col space-y-1">
                  <span>Reset All Leaderboards</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    This action cannot be undone.
                  </span>
                </Label>
                <Button variant="destructive">Reset Now</Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};