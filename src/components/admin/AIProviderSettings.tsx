import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Key,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  endpoint_url?: string;
  is_active: boolean;
  priority: number;
  configuration: any;
  available_models: string[];
  available_voices: string[];
  last_tested_at?: string;
  test_results: any;
}

export const AIProviderSettings = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedProviders: AIProvider[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        provider_type: item.provider_type,
        endpoint_url: item.endpoint_url,
        is_active: item.is_active,
        priority: item.priority,
        configuration: item.configuration,
        available_models: Array.isArray(item.available_models) 
          ? item.available_models.filter((model: any): model is string => typeof model === 'string')
          : [],
        available_voices: Array.isArray(item.available_voices) 
          ? item.available_voices.filter((voice: any): voice is string => typeof voice === 'string')
          : [],
        last_tested_at: item.last_tested_at,
        test_results: item.test_results
      }));
      
      setProviders(transformedProviders);
    } catch (error: any) {
      toast({
        title: "Error loading AI providers",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewProvider = () => {
    setSelectedProvider({
      id: '',
      name: '',
      provider_type: 'openai',
      endpoint_url: '',
      is_active: false,
      priority: providers.length + 1,
      configuration: {},
      available_models: [],
      available_voices: [],
      test_results: {}
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const editProvider = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsCreating(false);
    setIsEditing(true);
  };

  const saveProvider = async () => {
    if (!selectedProvider) return;

    try {
      const providerData = {
        name: selectedProvider.name,
        provider_type: selectedProvider.provider_type,
        endpoint_url: selectedProvider.endpoint_url,
        is_active: selectedProvider.is_active,
        priority: selectedProvider.priority,
        configuration: selectedProvider.configuration,
        available_models: selectedProvider.available_models,
        available_voices: selectedProvider.available_voices
      };

      if (isCreating) {
        const { error } = await supabase
          .from('admin_ai_providers')
          .insert(providerData);
        
        if (error) throw error;
        toast({ title: "AI Provider created successfully" });
      } else {
        const { error } = await supabase
          .from('admin_ai_providers')
          .update(providerData)
          .eq('id', selectedProvider.id);

        if (error) throw error;
        toast({ title: "AI Provider updated successfully" });
      }

      setIsEditing(false);
      setSelectedProvider(null);
      loadProviders();
    } catch (error: any) {
      toast({
        title: "Error saving AI provider",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testProvider = async (providerId: string) => {
    setTesting(providerId);
    try {
      // Call edge function to test AI provider
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { providerId }
      });

      if (error) throw error;

      // Update test results
      await supabase
        .from('admin_ai_providers')
        .update({ 
          last_tested_at: new Date().toISOString(),
          test_results: data
        })
        .eq('id', providerId);

      toast({ 
        title: data.success ? "Test successful" : "Test failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });

      loadProviders();
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const deleteProvider = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('admin_ai_providers')
        .update({ is_active: false })
        .eq('id', providerId);

      if (error) throw error;
      
      toast({ title: "AI Provider deactivated" });
      loadProviders();
    } catch (error: any) {
      toast({
        title: "Error deactivating provider",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'cohere': return '💬';
      case 'huggingface': return '🤗';
      default: return '⚡';
    }
  };

  const getTestStatus = (provider: AIProvider) => {
    if (!provider.last_tested_at) return null;
    
    const success = provider.test_results?.success;
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">AI Provider Settings</h2>
          <p className="text-muted-foreground">Manage AI providers and their configurations</p>
        </div>
        <Button onClick={createNewProvider} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="glass-card border-glass">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getProviderIcon(provider.provider_type)}</div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.provider_type}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTestStatus(provider)}
                  <Badge variant={provider.is_active ? "default" : "secondary"}>
                    {provider.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Priority: {provider.priority}</p>
                <p>Models: {provider.available_models?.length || 0}</p>
                <p>Voices: {provider.available_voices?.length || 0}</p>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editProvider(provider)}
                  className="glass flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testProvider(provider.id)}
                  disabled={testing === provider.id}
                  className="glass"
                >
                  {testing === provider.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteProvider(provider.id)}
                  className="glass text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {provider.last_tested_at && (
                <div className="text-xs text-muted-foreground">
                  Last tested: {new Date(provider.last_tested_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provider Configuration Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Add New AI Provider' : 'Edit AI Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure the AI provider settings and credentials
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_name">Provider Name</Label>
                  <Input
                    id="provider_name"
                    value={selectedProvider.name}
                    onChange={(e) => setSelectedProvider({
                      ...selectedProvider,
                      name: e.target.value
                    })}
                    placeholder="e.g., OpenAI GPT-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider_type">Provider Type</Label>
                  <Select
                    value={selectedProvider.provider_type}
                    onValueChange={(value) => setSelectedProvider({
                      ...selectedProvider,
                      provider_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="cohere">Cohere</SelectItem>
                      <SelectItem value="huggingface">Hugging Face</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint_url">Endpoint URL (Optional)</Label>
                <Input
                  id="endpoint_url"
                  value={selectedProvider.endpoint_url || ''}
                  onChange={(e) => setSelectedProvider({
                    ...selectedProvider,
                    endpoint_url: e.target.value
                  })}
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={selectedProvider.priority}
                    onChange={(e) => setSelectedProvider({
                      ...selectedProvider,
                      priority: parseInt(e.target.value)
                    })}
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={selectedProvider.is_active}
                    onCheckedChange={(checked) => setSelectedProvider({
                      ...selectedProvider,
                      is_active: checked
                    })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Available Models</h4>
                <Textarea
                  value={selectedProvider.available_models?.join('\n') || ''}
                  onChange={(e) => setSelectedProvider({
                    ...selectedProvider,
                    available_models: e.target.value.split('\n').filter(m => m.trim())
                  })}
                  placeholder="gpt-4&#10;gpt-3.5-turbo&#10;text-davinci-003"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">One model per line</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Available Voices</h4>
                <Textarea
                  value={selectedProvider.available_voices?.join('\n') || ''}
                  onChange={(e) => setSelectedProvider({
                    ...selectedProvider,
                    available_voices: e.target.value.split('\n').filter(v => v.trim())
                  })}
                  placeholder="alloy&#10;echo&#10;fable&#10;onyx&#10;nova&#10;shimmer"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">One voice per line</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveProvider} className="bg-gradient-primary">
              {isCreating ? 'Create Provider' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};