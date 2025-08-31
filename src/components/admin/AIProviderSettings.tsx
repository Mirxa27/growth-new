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
  TestTube2,
  Settings,
  Key,
  Server,
  Brain,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type AIProvider = Tables<'admin_ai_providers'>;
type AIProviderInsert = TablesInsert<'admin_ai_providers'>;

interface AIModel {
  id: string;
  name: string;
  description: string;
  provider_type: string;
  max_tokens: number;
  supports_voice: boolean;
  supports_vision: boolean;
  cost_per_1k_tokens: number;
}

interface ProviderConfig {
  provider_type: string;
  models: AIModel[];
  config_fields: string[];
  default_system_prompt: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    provider_type: 'openai',
    models: [
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable OpenAI model', provider_type: 'openai', max_tokens: 8192, supports_voice: false, supports_vision: true, cost_per_1k_tokens: 0.06 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and efficient', provider_type: 'openai', max_tokens: 128000, supports_voice: false, supports_vision: true, cost_per_1k_tokens: 0.01 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective', provider_type: 'openai', max_tokens: 4096, supports_voice: false, supports_vision: false, cost_per_1k_tokens: 0.0015 }
    ],
    config_fields: ['api_key', 'base_url', 'organization_id'],
    default_system_prompt: 'You are a helpful AI assistant specialized in personal growth and development.'
  },
  anthropic: {
    provider_type: 'anthropic',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Anthropic\'s most capable model', provider_type: 'anthropic', max_tokens: 200000, supports_voice: false, supports_vision: true, cost_per_1k_tokens: 0.003 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and cost-effective', provider_type: 'anthropic', max_tokens: 200000, supports_voice: false, supports_vision: false, cost_per_1k_tokens: 0.00025 }
    ],
    config_fields: ['api_key', 'base_url'],
    default_system_prompt: 'You are Claude, an AI assistant focused on providing thoughtful and helpful responses for personal development.'
  },
  google: {
    provider_type: 'google',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced AI model', provider_type: 'google', max_tokens: 30720, supports_voice: false, supports_vision: true, cost_per_1k_tokens: 0.0005 },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal capabilities', provider_type: 'google', max_tokens: 12288, supports_voice: false, supports_vision: true, cost_per_1k_tokens: 0.0025 }
    ],
    config_fields: ['api_key', 'project_id', 'region'],
    default_system_prompt: 'You are Gemini, an AI assistant designed to help with personal growth and learning.'
  },
  elevenlabs: {
    provider_type: 'elevenlabs',
    models: [
      { id: 'eleven_monolingual_v1', name: 'Eleven Multilingual v1', description: 'High-quality voice synthesis', provider_type: 'elevenlabs', max_tokens: 2500, supports_voice: true, supports_vision: false, cost_per_1k_tokens: 0.055 }
    ],
    config_fields: ['api_key', 'voice_id'],
    default_system_prompt: 'You are a voice assistant focused on natural conversation and support.'
  }
};

export const AIProviderSettings: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState<Partial<AIProviderInsert>>({});
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'config'>('providers');
  const [selectedProviderType, setSelectedProviderType] = useState<string>('openai');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
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

  const validateProviderConfig = (config: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const providerConfig = PROVIDER_CONFIGS[selectedProviderType];
    
    if (!providerConfig) {
      errors.push('Invalid provider type');
      return { isValid: false, errors };
    }

    providerConfig.config_fields.forEach(field => {
      if (!config[field] || config[field].trim() === '') {
        errors.push(`${field.replace('_', ' ')} is required`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const getProviderModels = (providerType: string): AIModel[] => {
    return PROVIDER_CONFIGS[providerType]?.models || [];
  };

  const applyPresetConfig = (providerType: string) => {
    const config = PROVIDER_CONFIGS[providerType];
    if (config) {
      setFormData(prev => ({
        ...prev,
        provider_type: providerType,
        system_prompt: config.default_system_prompt,
        configuration: {}
      }));
      setSelectedProviderType(providerType);
    }
  };

  const testProviderConnection = async (provider: AIProvider) => {
    setIsTesting(prev => ({ ...prev, [provider.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { provider }
      });

      if (error) throw error;
      
      setTestResults(prev => ({ ...prev, [provider.id]: data }));
      toast({
        title: "Connection Test",
        description: data.success ? "Connection successful" : `Connection failed: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [provider.id]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleOpenDialog = (provider?: AIProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({ 
        name: provider.name,
        provider_type: provider.provider_type,
        api_key: provider.api_key,
        description: provider.description || '',
        is_active: provider.is_active,
        priority: provider.priority,
        model: provider.model,
        max_tokens: provider.max_tokens,
        temperature: provider.temperature,
        timeout: provider.timeout,
        system_prompt: provider.system_prompt,
        configuration: provider.configuration || {}
      });
      if (provider.provider_type) {
        setSelectedProviderType(provider.provider_type);
      }
    } else {
      setEditingProvider(null);
      setFormData({ 
        name: '', 
        provider_type: 'openai', 
        is_active: true, 
        priority: 10,
        model: PROVIDER_CONFIGS.openai.models[0].id,
        max_tokens: 1000,
        temperature: 0.7,
        timeout: 30,
        system_prompt: PROVIDER_CONFIGS.openai.default_system_prompt,
        configuration: {}
      });
      setSelectedProviderType('openai');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const validation = validateProviderConfig(formData.configuration || {});
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      let result;
      if (editingProvider) {
        result = await supabase
          .from('admin_ai_providers')
          .update(formData)
          .eq('id', editingProvider.id);
      } else {
        result = await supabase
          .from('admin_ai_providers')
          .insert(formData as AIProviderInsert);
      }

      if (result.error) throw result.error;

      toast({
        title: editingProvider ? "Provider updated" : "Provider created",
        description: "AI provider has been saved successfully",
      });

      setIsDialogOpen(false);
      setFormData({});
      setEditingProvider(null);
      fetchProviders();
    } catch (error) {
      toast({
        title: "Error saving provider",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderProviderCard = (provider: AIProvider) => {
    if (!provider.provider_type) return null;
    const config = PROVIDER_CONFIGS[provider.provider_type];
    const models = config?.models || [];
    const testResult = testResults[provider.id];

    return (
      <Card key={provider.id}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>{provider.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={provider.is_active ? "default" : "secondary"}>
                {provider.is_active ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testProviderConnection(provider)}
                disabled={isTesting[provider.id]}
              >
                {isTesting[provider.id] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDialog(provider)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(provider.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>{provider.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {provider.provider_type}
              </div>
              <div>
                <span className="font-medium">Model:</span> {provider.model}
              </div>
              <div>
                <span className="font-medium">Max Tokens:</span> {provider.max_tokens || 'Default'}
              </div>
              <div>
                <span className="font-medium">Temperature:</span> {provider.temperature || 0.7}
              </div>
            </div>
            
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  {testResult.success ? "Connection successful" : testResult.error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-wrap gap-2">
              {models.find(m => m.id === provider.model)?.supports_voice && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" /> Voice
                </Badge>
              )}
              {models.find(m => m.id === provider.model)?.supports_vision && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" /> Vision
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Provider Settings</h2>
          <p className="text-muted-foreground">Manage AI providers and models for your application</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {providers.length === 0 ? (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No providers configured</h3>
              <p className="text-muted-foreground mb-4">Add your first AI provider to get started</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {providers.map(renderProviderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(PROVIDER_CONFIGS).map(([providerType, config]) => (
              <Card key={providerType}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span className="capitalize">{providerType}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {config.models.map((model) => (
                      <div key={model.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{model.name}</h4>
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${model.cost_per_1k_tokens}/1k tokens</p>
                            <p className="text-xs text-muted-foreground">Max: {model.max_tokens}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {model.supports_voice && (
                            <Badge variant="outline" className="text-xs">Voice</Badge>
                          )}
                          {model.supports_vision && (
                            <Badge variant="outline" className="text-xs">Vision</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration Guide</CardTitle>
              <CardDescription>Quick setup guide for different AI providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PROVIDER_CONFIGS).map(([providerType, config]) => (
                  <div key={providerType} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2 capitalize">{providerType}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Required fields:</strong> {config.config_fields.join(', ')}
                      </div>
                      <div>
                        <strong>Default prompt:</strong> {config.default_system_prompt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
                  <DialogTitle>
                    {editingProvider ? "Edit Provider" : "Add New Provider"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure your AI provider settings and select appropriate models
                  </DialogDescription>
                </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Type</Label>
                <Select
                  value={selectedProviderType}
                  onValueChange={(value) => applyPresetConfig(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PROVIDER_CONFIGS).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Model</Label>
                <Select
                  value={formData.model || ""}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProviderModels(selectedProviderType).map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Provider name"
                />
              </div>
              <div>
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={formData.max_tokens || ''}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  placeholder="Maximum tokens"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this provider"
                rows={2}
              />
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Configuration
              </h4>
              <div className="space-y-3">
                {PROVIDER_CONFIGS[selectedProviderType]?.config_fields.map(field => (
                  <div key={field}>
                    <Label className="capitalize">{field.replace('_', ' ')}</Label>
                    <Input
                      type={field.includes('key') || field.includes('secret') ? 'password' : 'text'}
                      value={(formData.configuration as any)?.[field] || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        configuration: { ...(formData.configuration as any), [field]: e.target.value }
                      })}
                      placeholder={`Enter ${field.replace('_', ' ')}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature || 0.7}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.timeout || 30}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={formData.system_prompt || ""}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="System prompt for the AI model"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProvider ? "Update Provider" : "Create Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};