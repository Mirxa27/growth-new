import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, ShieldCheck } from 'lucide-react';
import { logger } from '@/utils/logger';

export const ContentModerationSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('platform_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['content_moderation_enabled', 'auto_flag_threshold']);

        if (error) throw error;

        const map = new Map<string, any>((data || []).map(record => {
          const key = record.setting_key;
          const rawValue = record.setting_value;
          if (!key) {
            return ['__invalid__', null];
          }

          try {
            return [key, typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue];
          } catch {
            return [key, rawValue];
          }
        }));

        setEnabled(Boolean(map.get('content_moderation_enabled') ?? true));
        setThreshold(Number(map.get('auto_flag_threshold') ?? 0.8));
      } catch (e: any) {
        logger.error('Failed to load moderation settings', 'ContentModerationSettings', e);
        toast({ title: "Error", description: `Failed to load settings: ${e.message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = [
        supabase.rpc('update_platform_setting', { key_name: 'content_moderation_enabled', new_value: enabled }),
        supabase.rpc('update_platform_setting', { key_name: 'auto_flag_threshold', new_value: threshold }),
      ];

      const results = await Promise.all(updates);
      results.forEach(res => { if (res.error) throw res.error; });

      toast({ title: "Success", description: "Moderation settings saved." });
    } catch (e: any) {
      logger.error('Failed to save moderation settings', 'ContentModerationSettings', e);
      toast({ title: "Error", description: `Failed to save settings: ${e.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Content Moderation</CardTitle>
          <CardDescription>Configure automatic content moderation settings for community posts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-moderation" className="flex flex-col space-y-1">
              <span>Enable Automatic Moderation</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Automatically flag or remove content based on toxicity scores.
              </span>
            </Label>
            <Switch id="enable-moderation" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-4">
            <Label htmlFor="threshold">Auto-flag Threshold</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="threshold"
                min={0}
                max={1}
                step={0.05}
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                disabled={!enabled}
              />
              <span className="font-mono text-lg w-16 text-center">{threshold.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Content with a toxicity score above this value will be automatically flagged for review.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Moderation Settings'}
        </Button>
      </div>
    </div>
  );
};