import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Mic, AlertCircle } from 'lucide-react';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';

type VoiceConfig = Tables<'voice_agent_configs'>;
type VoiceConfigUpdate = TablesUpdate<'voice_agent_configs'>;

export const VoiceAgentTrainer: React.FC = () => {
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('voice_agent_configs').select('*').eq('is_active', true).limit(1);
        if (error) throw error;
        const row = data?.[0];
        if (row) {
          setConfig(row);
          setInstructions(row?.instructions ?? '');
        }
      } catch (e: any) {
        toast({ title: "Error", description: `Failed to load config: ${e.message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast]);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('voice_agent_configs').update({ instructions }).eq('id', config.id);
      if (error) throw error;
      toast({ title: "Success", description: "Instructions updated successfully." });
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save: ${e.message}`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading trainer...</div>;

  if (!config) {
    return (
      <Card className="glass-strong">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Voice Configuration</h3>
          <p className="text-muted-foreground">
            Please set an active voice agent configuration in the Voice Agent Manager.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mic className="h-6 w-6" /> Voice Agent Trainer</CardTitle>
          <CardDescription>
            Fine-tune the active voice agent's system prompt and instructions.
            Current active config: <span className="font-semibold text-primary">{config.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="instructions" className="text-lg font-semibold">System Instructions</label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[400px] font-mono text-sm glass-input mt-2"
              placeholder="Enter the detailed system prompt and instructions for the AI voice agent..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Instructions'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};