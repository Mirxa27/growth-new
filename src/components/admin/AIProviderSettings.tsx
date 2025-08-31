import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  Save,
  X,
  Database,
  Zap,
  TestTube2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type AIProvider = Tables<'admin_ai_providers'>;
type AIProviderInsert = TablesInsert<'admin_ai_providers'>;

export const AIProviderSettings: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState<Partial<AIProviderInsert>>({});
  const { toast } = useToast();

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch providers: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleOpenDialog = (provider: AIProvider | null = null) => {
    setEditingProvider(provider);
    setFormData(provider ? { ...provider } : { 
      name: '', 
      provider_type: 'openai', 
      is_active: true, 
      priority: 10
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('admin_ai_providers').upsert([formData as AIProviderInsert]);
      if (error) throw error;
      toast({ title: "Success", description: `Provider ${editingProvider ? 'updated' : 'created'}` });
      setIsDialogOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save provider: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      const { error } = await supabase
        .from('admin_ai_providers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Provider deleted" });
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete provider: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleTestProvider = async (provider: AIProvider) => {
    toast({ title: "Testing Provider...", description: `Sending a test request to ${provider.name}` });
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { providerId: provider.id }
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Test Successful!", description: `Response from ${provider.name}: ${data.response}` });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>AI Provider Settings</CardTitle>
            <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Add New Provider</Button>
          </div>
          <CardDescription>Manage and configure AI model providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map(provider => (
              <Card key={provider.id} className="glass">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.provider_type}</p>
                    <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestProvider(provider)}><TestTube2 className="w-4 h-4 mr-2" />Test</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(provider)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(provider.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit' : 'Create'} AI Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider Name</Label>
              <Input value={formData.name || ''} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={formData.provider_type || ''} onValueChange={(v: any) => setFormData(p => ({...p, provider_type: v}))}>
                <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" value={formData.api_key || ''} onChange={e => setFormData(p => ({...p, api_key: e.target.value}))} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea value={formData.system_prompt || ''} onChange={e => setFormData(p => ({...p, system_prompt: e.target.value}))} className="glass-input" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active || false} onCheckedChange={c => setFormData(p => ({...p, is_active: c}))} />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-primary"><Save className="w-4 h-4 mr-2" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};