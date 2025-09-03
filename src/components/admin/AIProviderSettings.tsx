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
  TestTube2,
  Settings,
  Key,
  Server,
  Brain,
  AlertCircle,
  Eye,
  RefreshCw,
  Mic,
  Volume2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tables, TablesInsert, Json } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { aiProviderModelsService, type AIModel, type Voice } from '@/services/ai-provider-models.service';
import { logger } from '@/utils/logger';
// Import Zod for schema validation

// Define a more specific type for our form data and provider structure
type AIProvider = z.infer<typeof AIProviderSchema>;
type AIProviderInsert = TablesInsert<'admin_ai_providers'>;

// Use the type from Zod schema for configuration
type ProviderConfiguration = z.infer<typeof ProviderConfigurationSchema>;
// Define Zod schemas for validation
const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  provider_type: z.string(),
  max_tokens: z.number(),
  supports_voice: z.boolean(),
  supports_vision: z.boolean(),
  cost_per_1k_tokens: z.number()
});

const ProviderConfigurationSchema = z.object({
  model: z.string().optional(),
  max_tokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeout: z.number().positive().optional(),
  api_key: z.string().optional(),
  base_url: z.string().url().optional().or(z.string().length(0)),
  organization_id: z.string().optional(),
  project_id: z.string().optional(),
  region: z.string().optional(),
  voice_id: z.string().optional()
}).catchall(z.unknown());

const AIProviderSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Provider name is required"),
  provider_type: z.string().min(1, "Provider type is required"),
  is_active: z.boolean(),
  priority: z.number().int().positive().optional(),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
  configuration: ProviderConfigurationSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// No need to redefine AIProviderInsert here

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
  interface ProviderTestResult { success: boolean; error?: string }
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResult>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [fetchedModels, setFetchedModels] = useState<AIModel[]>([]);
  const [fetchedVoices, setFetchedVoices] = useState<Voice[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
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
      // Auto-fetch models for active OpenAI provider when API key present
      const activeOpenAI = (data || []).find((p: any) => p.provider_type === 'openai' && p.is_active);
      if (activeOpenAI && activeOpenAI.configuration?.api_key) {
        setFormData(activeOpenAI);
        setSelectedProviderType('openai');
        // Fire and forget model+voice fetch
        fetchModelsForCurrentProvider();
        fetchVoicesForCurrentProvider();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to fetch providers: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const validateProviderConfig = (config: ProviderConfiguration): { isValid: boolean; errors: string[] } => {
    // First validate using Zod schema
    const result = ProviderConfigurationSchema.safeParse(config);
    
    if (!result.success) {
      return { 
        isValid: false, 
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    // Then validate required fields based on provider type
    const errors: string[] = [];
    const providerConfig = PROVIDER_CONFIGS[selectedProviderType];
    
    if (!providerConfig) {
      errors.push('Invalid provider type');
      return { isValid: false, errors };
    }

    providerConfig.config_fields.forEach(field => {
      if (!config[field] || String(config[field]).trim() === '') {
        errors.push(`${field.replace(/_/g, ' ')} is required`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const getProviderModels = (providerType: string): AIModel[] => {
    // Use fetched models if available, otherwise use defaults
    if (fetchedModels.length > 0) {
      return fetchedModels.filter(m => m.provider_type === providerType);
    }
    return PROVIDER_CONFIGS[providerType]?.models || [];
  };

  const fetchModelsForCurrentProvider = async () => {
    const config = formData.configuration as ProviderConfiguration;
    const apiKey = config?.api_key;
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to fetch available models",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingModels(true);
    try {
      const models = await aiProviderModelsService.fetchModelsForProvider(
        selectedProviderType,
        apiKey
      );
      setFetchedModels(models);
      
      // Auto-select first model if none selected
      if (models.length > 0 && !config.model) {
        handleFormConfigurationChange('model', models[0].id);
      }
      
      toast({
        title: "Models Fetched",
        description: `Found ${models.length} available models`,
      });
    } catch (error) {
      logger.error('Failed to fetch models', 'AIProviderSettings', error);
      toast({
        title: "Failed to fetch models",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const fetchVoicesForCurrentProvider = async () => {
    const config = formData.configuration as ProviderConfiguration;
    const apiKey = config?.api_key;
    
    if (selectedProviderType !== 'openai' && selectedProviderType !== 'elevenlabs') {
      return;
    }

    if (selectedProviderType === 'elevenlabs' && !apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key to fetch available voices",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingVoices(true);
    try {
      const voices = await aiProviderModelsService.fetchVoicesForProvider(
        selectedProviderType,
        apiKey
      );
      setFetchedVoices(voices);
      
      // Auto-select first voice if none selected
      if (voices.length > 0 && !config.voice_id) {
        handleFormConfigurationChange('voice_id', voices[0].id);
      }
      
      toast({
        title: "Voices Fetched",
        description: `Found ${voices.length} available voices`,
      });
    } catch (error) {
      logger.error('Failed to fetch voices', 'AIProviderSettings', error);
      toast({
        title: "Failed to fetch voices",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsFetchingVoices(false);
    }
  };

  const applyPresetConfig = (providerType: string) => {
    const config = PROVIDER_CONFIGS[providerType];
    if (config) {
      setSelectedProviderType(providerType);
      setFormData(prev => ({
        ...prev,
        provider_type: providerType,
        system_prompt: config.default_system_prompt,
        configuration: {
            ...(prev.configuration as object),
            model: config.models[0]?.id || ''
        }
      }));
    }
  };

  const testProviderConnection = async (provider: AIProvider) => {
    setIsTesting(prev => ({ ...prev, [String(provider.id)]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { providerId: provider.id }
      });

      if (error) throw error;
      const result = (data || { success: false }) as ProviderTestResult;
      setTestResults(prev => ({ ...prev, [String(provider.id)]: result }));
      toast({
        title: "Connection Test",
        description: result.success ? "Connection successful" : `Connection failed: ${result.error}`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(prev => ({ ...prev, [String(provider.id)]: { success: false, error: errorMessage } }));
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [String(provider.id)]: false }));
    }
  };

  const handleOpenDialog = (provider?: AIProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({ 
        name: provider.name,
        provider_type: provider.provider_type,
        description: provider.description || '',
        is_active: provider.is_active,
        priority: provider.priority,
        system_prompt: provider.system_prompt,
        configuration: (provider.configuration as Json) || {}
      });
      setSelectedProviderType(provider.provider_type || 'openai');
    } else {
      setEditingProvider(null);
      const initialProviderType = 'openai';
      const initialConfig = PROVIDER_CONFIGS[initialProviderType];
      setFormData({ 
        name: '', 
        provider_type: initialProviderType, 
        is_active: true, 
        priority: 10,
        system_prompt: initialConfig.default_system_prompt,
        configuration: {
            model: initialConfig.models[0].id,
            max_tokens: 1000,
            temperature: 0.7,
            timeout: 30,
        }
      });
      setSelectedProviderType(initialProviderType);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // First validate the provider configuration
      const configValidation = validateProviderConfig(formData.configuration as ProviderConfiguration || {});
      if (!configValidation.isValid) {
        toast({
          title: "Configuration Validation Error",
          description: configValidation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }
      
      // Then validate the entire provider object
      const providerValidation = AIProviderSchema.safeParse({
        id: editingProvider?.id,
        name: formData.name,
        provider_type: formData.provider_type,
        is_active: formData.is_active,
        configuration: formData.configuration,
        created_at: editingProvider?.created_at,
        updated_at: new Date().toISOString()
      });
      
      if (!providerValidation.success) {
        toast({
          title: "Provider Validation Error",
          description: providerValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
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
          .insert([formData as AIProviderInsert]);
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
    if (!window.confirm('Are you sure you want to delete this provider?')) return;
    try {
      const { error } = await supabase
        .from('admin_ai_providers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Provider deleted" });
      fetchProviders();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to delete provider: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  const handleFormConfigurationChange = (
    field: keyof ProviderConfiguration,
    value: string | number | boolean | null
  ) => {
    setFormData(prev => ({
        ...prev,
        configuration: {
            ...(prev.configuration as object),
            [field]: value
        }
    }));
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
    const testResult = testResults[String(provider.id)];
    const configuration = provider.configuration as ProviderConfiguration || {};
    const modelInfo = models.find(m => m.id === configuration.model);

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
                disabled={isTesting[String(provider.id)]}
              >
                {isTesting[String(provider.id)] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <TestTube2 className="h-4 w-4" />
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
                onClick={() => handleDelete(String(provider.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>{provider.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {provider.provider_type}
              </div>
              <div>
                <span className="font-medium">Model:</span> {configuration.model}
              </div>
              <div>
                <span className="font-medium">Max Tokens:</span> {configuration.max_tokens || 'Default'}
              </div>
              <div>
                <span className="font-medium">Temperature:</span> {configuration.temperature || 0.7}
              </div>
            </div>
            
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {testResult.success ? "Connection successful" : testResult.error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-wrap gap-2">
              {modelInfo?.supports_voice && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" /> Voice
                </Badge>
              )}
              {modelInfo?.supports_vision && (
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'providers' | 'models' | 'config')}>
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
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 py-4">
            {/* Replace existing form fields with form-controlled ones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Provider Type</Label>
                <Select
                  value={selectedProviderType}
                  onValueChange={applyPresetConfig}
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
                <Label className="flex items-center justify-between">
                  Model
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchModelsForCurrentProvider}
                    disabled={isFetchingModels}
                    className="h-6 text-xs"
                  >
                    {isFetchingModels ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Fetch Models
                      </>
                    )}
                  </Button>
                </Label>
                <Select
                  value={(formData.configuration as ProviderConfiguration)?.model || ""}
                  onValueChange={(value) => handleFormConfigurationChange('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProviderModels(selectedProviderType).map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name} - {model.description}</span>
                          <div className="flex gap-1 ml-2">
                            {model.supports_voice && <Mic className="h-3 w-3" />}
                            {model.supports_vision && <Eye className="h-3 w-3" />}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voice Selection for OpenAI and ElevenLabs */}
            {(selectedProviderType === 'openai' || selectedProviderType === 'elevenlabs') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Voice Selection
                    </span>
                    {selectedProviderType === 'elevenlabs' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fetchVoicesForCurrentProvider}
                        disabled={isFetchingVoices}
                        className="h-6 text-xs"
                      >
                        {isFetchingVoices ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Fetch Voices
                          </>
                        )}
                      </Button>
                    )}
                  </Label>
                  <Select
                    value={(formData.configuration as ProviderConfiguration)?.voice_id || ""}
                    onValueChange={(value) => handleFormConfigurationChange('voice_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {(fetchedVoices.length > 0 ? fetchedVoices : 
                        selectedProviderType === 'openai' ? 
                          [
                            { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
                            { id: 'echo', name: 'Echo', description: 'Warm and engaging' },
                            { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
                            { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
                            { id: 'nova', name: 'Nova', description: 'Friendly and conversational' },
                            { id: 'shimmer', name: 'Shimmer', description: 'Soft and pleasant' }
                          ] : []
                      ).map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.name}</span>
                            {voice.description && (
                              <span className="text-xs text-muted-foreground">{voice.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProviderType === 'elevenlabs' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your API key first, then click "Fetch Voices" to load available voices
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={(formData.configuration as ProviderConfiguration)?.max_tokens ?? ''}
                  onChange={(e) => handleFormConfigurationChange('max_tokens', Number.isNaN(parseInt(e.target.value, 10)) ? null : parseInt(e.target.value, 10))}
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
                      value={String((formData.configuration as ProviderConfiguration)?.[field] ?? "")}
                      onChange={(e) => handleFormConfigurationChange(field, e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={(formData.configuration as ProviderConfiguration)?.temperature ?? 0.7}
                    onChange={(e) => handleFormConfigurationChange('temperature', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={(formData.configuration as ProviderConfiguration)?.timeout ?? 30}
                    onChange={(e) => handleFormConfigurationChange('timeout', parseInt(e.target.value, 10))}
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
                id="is-active-switch"
              />
              <Label htmlFor="is-active-switch">Active</Label>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProvider ? "Update Provider" : "Create Provider"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Removed unused zod schema and external onSubmit; submission handled by handleSave.
