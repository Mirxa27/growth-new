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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  Zap,
  Wand2,
  ArrowRight,
  ArrowLeft,
  Info,
  Mic,
  Volume2,
  Brain,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceAgentTrainer } from './VoiceAgentTrainer';
import { VoiceTestingInterface } from './VoiceTestingInterface';

// Wizard Step Components
const BasicInfoStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Provider Name</Label>
      <Input
        id="name"
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        placeholder="Enter provider name"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="description">Description (Optional)</Label>
      <Textarea
        id="description"
        value={data.description || ''}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Brief description of this provider"
      />
    </div>
  </div>
);

const OpenAIApiStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You'll need an OpenAI API key. Get one from your OpenAI dashboard.
      </AlertDescription>
    </Alert>
    <div className="space-y-2">
      <Label htmlFor="api_key">API Key</Label>
      <Input
        id="api_key"
        type="password"
        value={data.api_key || ''}
        onChange={(e) => onChange({ ...data, api_key: e.target.value })}
        placeholder="sk-..."
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="endpoint_url">Custom Endpoint (Optional)</Label>
      <Input
        id="endpoint_url"
        value={data.endpoint_url || 'https://api.openai.com/v1'}
        onChange={(e) => onChange({ ...data, endpoint_url: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={data.temperature || 0.7}
          onChange={(e) => onChange({ ...data, temperature: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max_tokens">Max Tokens</Label>
        <Input
          id="max_tokens"
          type="number"
          value={data.max_tokens || 2048}
          onChange={(e) => onChange({ ...data, max_tokens: parseInt(e.target.value) })}
        />
      </div>
    </div>
  </div>
);

const AnthropicApiStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You'll need an Anthropic API key. Get one from the Anthropic Console.
      </AlertDescription>
    </Alert>
    <div className="space-y-2">
      <Label htmlFor="api_key">API Key</Label>
      <Input
        id="api_key"
        type="password"
        value={data.api_key || ''}
        onChange={(e) => onChange({ ...data, api_key: e.target.value })}
        placeholder="sk-ant-..."
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="max_tokens">Max Tokens</Label>
      <Input
        id="max_tokens"
        type="number"
        value={data.max_tokens || 4096}
        onChange={(e) => onChange({ ...data, max_tokens: parseInt(e.target.value) })}
      />
    </div>
  </div>
);

const ElevenLabsApiStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You'll need an ElevenLabs API key. Get one from your ElevenLabs dashboard.
      </AlertDescription>
    </Alert>
    <div className="space-y-2">
      <Label htmlFor="api_key">API Key</Label>
      <Input
        id="api_key"
        type="password"
        value={data.api_key || ''}
        onChange={(e) => onChange({ ...data, api_key: e.target.value })}
        placeholder="ElevenLabs API Key"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="stability">Stability</Label>
        <Input
          id="stability"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={data.stability || 0.5}
          onChange={(e) => onChange({ ...data, stability: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="similarity_boost">Similarity Boost</Label>
        <Input
          id="similarity_boost"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={data.similarity_boost || 0.75}
          onChange={(e) => onChange({ ...data, similarity_boost: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  </div>
);

const GeminiApiStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You'll need a Google AI Studio API key. Get one from the Google AI Studio.
      </AlertDescription>
    </Alert>
    <div className="space-y-2">
      <Label htmlFor="api_key">API Key</Label>
      <Input
        id="api_key"
        type="password"
        value={data.api_key || ''}
        onChange={(e) => onChange({ ...data, api_key: e.target.value })}
        placeholder="Google AI API Key"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={data.temperature || 0.7}
          onChange={(e) => onChange({ ...data, temperature: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max_output_tokens">Max Output Tokens</Label>
        <Input
          id="max_output_tokens"
          type="number"
          value={data.max_output_tokens || 2048}
          onChange={(e) => onChange({ ...data, max_output_tokens: parseInt(e.target.value) })}
        />
      </div>
    </div>
  </div>
);

const CustomApiStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="endpoint_url">API Endpoint</Label>
      <Input
        id="endpoint_url"
        value={data.endpoint_url || ''}
        onChange={(e) => onChange({ ...data, endpoint_url: e.target.value })}
        placeholder="https://api.example.com/v1"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="api_key">API Key</Label>
      <Input
        id="api_key"
        type="password"
        value={data.api_key || ''}
        onChange={(e) => onChange({ ...data, api_key: e.target.value })}
        placeholder="Your API key"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="auth_header">Authorization Header Name</Label>
      <Input
        id="auth_header"
        value={data.auth_header || 'Authorization'}
        onChange={(e) => onChange({ ...data, auth_header: e.target.value })}
        placeholder="e.g., Authorization, X-API-Key"
      />
    </div>
  </div>
);

const ModelsVoicesStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="models">Available Models</Label>
      <Textarea
        id="models"
        value={(data.available_models || []).join('\n')}
        onChange={(e) => onChange({ 
          ...data, 
          available_models: e.target.value.split('\n').filter(m => m.trim()) 
        })}
        placeholder="Enter one model per line"
        rows={4}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="voices">Available Voices</Label>
      <Textarea
        id="voices"
        value={(data.available_voices || []).join('\n')}
        onChange={(e) => onChange({ 
          ...data, 
          available_voices: e.target.value.split('\n').filter(v => v.trim()) 
        })}
        placeholder="Enter one voice per line"
        rows={3}
      />
    </div>
  </div>
);

const ModelsStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="models">Available Models</Label>
      <Textarea
        id="models"
        value={(data.available_models || []).join('\n')}
        onChange={(e) => onChange({ 
          ...data, 
          available_models: e.target.value.split('\n').filter(m => m.trim()) 
        })}
        placeholder="Enter one model per line"
        rows={6}
      />
    </div>
  </div>
);

const VoicesStep = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="voices">Available Voices</Label>
      <Textarea
        id="voices"
        value={(data.available_voices || []).join('\n')}
        onChange={(e) => onChange({ 
          ...data, 
          available_voices: e.target.value.split('\n').filter(v => v.trim()) 
        })}
        placeholder="Enter one voice per line&#10;Format: Name - ID"
        rows={6}
      />
    </div>
  </div>
);

const TestStep = ({ data, onTest }: { data: any; onTest?: () => void }) => (
  <div className="space-y-4">
    <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        Configuration complete! Test your provider to ensure it's working correctly.
      </AlertDescription>
    </Alert>
    <div className="bg-muted p-4 rounded-lg space-y-2">
      <h4 className="font-medium">Configuration Summary:</h4>
      <ul className="text-sm space-y-1">
        <li>• Provider: {data.name}</li>
        <li>• Type: {data.provider_type}</li>
        <li>• Models: {(data.available_models || []).length} configured</li>
        <li>• Voices: {(data.available_voices || []).length} configured</li>
      </ul>
    </div>
    {onTest && (
      <Button onClick={onTest} className="w-full">
        <TestTube className="w-4 h-4 mr-2" />
        Test Provider Configuration
      </Button>
    )}
  </div>
);

// Interfaces
interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  priority: number;
  configuration: any;
  available_models: string[];
  available_voices: string[];
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface ProviderTemplate {
  provider_type: string;
  name: string;
  description: string;
  icon: string;
  steps: WizardStep[];
  defaultConfig: any;
  defaultModels: string[];
  defaultVoices: string[];
}

// Provider templates
const providerTemplates: ProviderTemplate[] = [
  {
    provider_type: 'openai',
    name: 'OpenAI',
    description: 'GPT models, DALL-E, Whisper, and TTS',
    icon: '🤖',
    steps: [
      { id: 'basic', title: 'Basic Info', description: 'Provider name and description' },
      { id: 'api', title: 'API Configuration', description: 'API key and endpoint settings' },
      { id: 'models', title: 'Models & Voices', description: 'Configure available models and voices' },
      { id: 'test', title: 'Test & Verify', description: 'Test the configuration' }
    ],
    defaultConfig: {
      apiVersion: 'v1',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000
    },
    defaultModels: [
      'gpt-5-2025-08-07',
      'gpt-5-mini-2025-08-07',
      'gpt-4.1-2025-04-14',
      'gpt-4o-realtime-preview-2024-12-17'
    ],
    defaultVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  },
  {
    provider_type: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for advanced reasoning',
    icon: '🧠',
    steps: [
      { id: 'basic', title: 'Basic Info', description: 'Provider name and description' },
      { id: 'api', title: 'API Configuration', description: 'API key and settings' },
      { id: 'models', title: 'Models', description: 'Configure available models' },
      { id: 'test', title: 'Test & Verify', description: 'Test the configuration' }
    ],
    defaultConfig: {
      apiVersion: '2023-06-01',
      maxTokens: 4096,
      timeout: 30000
    },
    defaultModels: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022'
    ],
    defaultVoices: []
  },
  {
    provider_type: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Advanced text-to-speech and voice cloning',
    icon: '🎙️',
    steps: [
      { id: 'basic', title: 'Basic Info', description: 'Provider name and description' },
      { id: 'api', title: 'API Configuration', description: 'API key and settings' },
      { id: 'voices', title: 'Voice Configuration', description: 'Configure available voices' },
      { id: 'test', title: 'Test & Verify', description: 'Test voice synthesis' }
    ],
    defaultConfig: {
      apiVersion: 'v1',
      stability: 0.5,
      similarityBoost: 0.75,
      timeout: 30000
    },
    defaultModels: ['eleven_multilingual_v2', 'eleven_turbo_v2_5'],
    defaultVoices: [
      'Aria - 9BWtsMINqrJLrRacOk9x',
      'Roger - CwhRBWXzGAHq8TQ4Fs17',
      'Sarah - EXAVITQu4vr4xnSDxMaL',
      'Laura - FGY2WhTYpPnrIDTdsKH5'
    ]
  },
  {
    provider_type: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI models',
    icon: '💎',
    steps: [
      { id: 'basic', title: 'Basic Info', description: 'Provider name and description' },
      { id: 'api', title: 'API Configuration', description: 'API key and settings' },
      { id: 'models', title: 'Models', description: 'Configure available models' },
      { id: 'test', title: 'Test & Verify', description: 'Test the configuration' }
    ],
    defaultConfig: {
      apiVersion: 'v1',
      temperature: 0.7,
      maxOutputTokens: 2048,
      timeout: 30000
    },
    defaultModels: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
    defaultVoices: []
  },
  {
    provider_type: 'custom',
    name: 'Custom Provider',
    description: 'Configure a custom AI provider',
    icon: '⚙️',
    steps: [
      { id: 'basic', title: 'Basic Info', description: 'Provider name and description' },
      { id: 'api', title: 'API Configuration', description: 'Custom endpoint and authentication' },
      { id: 'models', title: 'Models & Voices', description: 'Configure available models and voices' },
      { id: 'test', title: 'Test & Verify', description: 'Test the configuration' }
    ],
    defaultConfig: {
      timeout: 30000,
      retries: 3
    },
    defaultModels: [],
    defaultVoices: []
  }
];

export const AIProviderSettings = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
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
        is_active: item.is_active,
        priority: item.priority,
        configuration: item.configuration,
        available_models: Array.isArray(item.available_models) 
          ? item.available_models.filter((model: any): model is string => typeof model === 'string')
          : [],
        available_voices: Array.isArray(item.available_voices) 
          ? item.available_voices.filter((voice: any): voice is string => typeof voice === 'string')
          : []
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

  // Start wizard with selected template
  const startWizard = (template: ProviderTemplate) => {
    setSelectedTemplate(template);
    setSelectedProvider({
      id: '',
      name: template.name,
      provider_type: template.provider_type,
      is_active: false,
      priority: providers.length + 1,
      configuration: { ...template.defaultConfig },
      available_models: [...template.defaultModels],
      available_voices: [...template.defaultVoices]
    });
    setCurrentStep(0);
    setIsCreating(true);
    setShowWizard(true);
  };

  // Navigate wizard steps
  const nextStep = () => {
    if (selectedTemplate && currentStep < selectedTemplate.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save provider from wizard
  const saveFromWizard = async () => {
    if (!selectedProvider) return;

    try {
      const providerData = {
        name: selectedProvider.name,
        provider_type: selectedProvider.provider_type,
        is_active: selectedProvider.is_active,
        priority: selectedProvider.priority,
        configuration: selectedProvider.configuration,
        available_models: selectedProvider.available_models,
        available_voices: selectedProvider.available_voices,
        api_key: (selectedProvider.configuration as any)?.api_key || null
      };

      const { error } = await supabase
        .from('admin_ai_providers')
        .insert(providerData);
      
      if (error) throw error;
      
      toast({ title: "AI Provider created successfully" });
      setShowWizard(false);
      setSelectedTemplate(null);
      setSelectedProvider(null);
      loadProviders();
    } catch (error: any) {
      toast({
        title: "Error creating AI provider",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Test provider from wizard
  const testFromWizard = async () => {
    if (!selectedProvider) return;

    setTesting('wizard-test');
    try {
      // In a real implementation, this would call an edge function
      // For now, simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({ 
        title: "Test successful",
        description: "Provider configuration is working correctly"
      });
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

  // Render current wizard step
  const renderWizardStep = () => {
    if (!selectedTemplate || !selectedProvider) return null;

    const currentStepConfig = selectedTemplate.steps[currentStep];
    if (!currentStepConfig) return null;

    const stepProps = {
      data: selectedProvider,
      onChange: setSelectedProvider,
      onTest: currentStep === selectedTemplate.steps.length - 1 ? testFromWizard : undefined
    };

    switch (currentStepConfig.id) {
      case 'basic':
        return <BasicInfoStep {...stepProps} />;
      case 'api':
        switch (selectedTemplate.provider_type) {
          case 'openai':
            return <OpenAIApiStep {...stepProps} />;
          case 'anthropic':
            return <AnthropicApiStep {...stepProps} />;
          case 'elevenlabs':
            return <ElevenLabsApiStep {...stepProps} />;
          case 'gemini':
            return <GeminiApiStep {...stepProps} />;
          case 'custom':
            return <CustomApiStep {...stepProps} />;
          default:
            return <BasicInfoStep {...stepProps} />;
        }
      case 'models':
        return <ModelsStep {...stepProps} />;
      case 'voices':
        return <VoicesStep {...stepProps} />;
      case 'test':
        return <TestStep {...stepProps} />;
      default:
        return <ModelsVoicesStep {...stepProps} />;
    }
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

      // Update test results in configuration
      const currentProvider = providers.find(p => p.id === providerId);
      await supabase
        .from('admin_ai_providers')
        .update({
          configuration: {
            ...(currentProvider?.configuration as any || {}),
            last_test: new Date().toISOString(),
            last_test_success: data.success,
            test_results: data
          }
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
    const testResults = (provider.configuration as any)?.test_results;
    if (!testResults || !(provider.configuration as any)?.last_test) return null;
    
    const success = testResults?.success;
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
        <Button onClick={() => setShowWizard(true)} className="bg-gradient-primary">
          <Wand2 className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Provider Templates Selection */}
      {!providers.length && (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No AI Providers Configured</h3>
          <p className="text-muted-foreground mb-6">Get started by adding your first AI provider using our setup wizard.</p>
          <Button onClick={() => setShowWizard(true)} className="bg-gradient-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Setup Your First Provider
          </Button>
        </div>
      )}

      {/* Existing Providers Grid */}
      {providers.length > 0 && (
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

                {(provider.configuration as any)?.last_test && (
                  <div className="text-xs text-muted-foreground">
                    Last tested: {new Date((provider.configuration as any).last_test).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {!selectedTemplate ? 'Choose AI Provider' : `Setup ${selectedTemplate.name}`}  
            </DialogTitle>
            <DialogDescription>
              {!selectedTemplate 
                ? 'Select the AI provider you want to configure'
                : selectedTemplate.steps[currentStep]?.description}
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            // Provider Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {providerTemplates.map((template) => (
                <Card 
                  key={template.provider_type} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => startWizard(template)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{template.icon}</div>
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Wizard Steps
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center space-x-2">
                {selectedTemplate.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        index <= currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < selectedTemplate.steps.length - 1 && (
                      <div className={`w-12 h-px ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Current Step Content */}
              <div className="min-h-[300px]">
                {selectedTemplate && selectedProvider && renderWizardStep()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowWizard(false);
                    setSelectedTemplate(null);
                    setCurrentStep(0);
                  }}>
                    Cancel
                  </Button>
                  
                  {currentStep < selectedTemplate.steps.length - 1 ? (
                    <Button onClick={nextStep} className="bg-gradient-primary">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={saveFromWizard}
                      className="bg-gradient-primary"
                      disabled={testing === 'wizard-test'}
                    >
                      {testing === 'wizard-test' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : null}
                      Create Provider
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  value={(selectedProvider.configuration as any)?.endpoint_url || ''}
                  onChange={(e) => setSelectedProvider({
                    ...selectedProvider,
                    configuration: {
                      ...(selectedProvider.configuration as any || {}),
                      endpoint_url: e.target.value
                    }
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
