import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Eye, EyeOff, Save, TestTube, Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { openaiService } from '@/services/ai/openai.service';
import { anthropicService } from '@/services/ai/anthropic.service';
import { googleAIService } from '@/services/ai/google.service';

interface APIKey {
  provider: string;
  key: string;
  isValid: boolean;
  lastTested?: string;
}

export const APIKeyManager: React.FC = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    { provider: 'openai', key: '', isValid: false },
    { provider: 'anthropic', key: '', isValid: false },
    { provider: 'google', key: '', isValid: false },
  ]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from admin_ai_providers
      const { data: providers } = await supabase
        .from('admin_ai_providers')
        .select('provider_type, configuration')
        .in('provider_type', ['openai', 'anthropic', 'google']);

      if (providers) {
        const loadedKeys = apiKeys.map(key => {
          const provider = providers.find(p => p.provider_type === key.provider);
          if (provider?.configuration?.api_key) {
            return {
              ...key,
              key: provider.configuration.api_key,
              isValid: true,
            };
          }
          return key;
        });
        setApiKeys(loadedKeys);

        // Set keys in services
        loadedKeys.forEach(key => {
          if (key.key) {
            switch (key.provider) {
              case 'openai':
                openaiService.setApiKey(key.key);
                break;
              case 'anthropic':
                anthropicService.setApiKey(key.key);
                break;
              case 'google':
                googleAIService.setApiKey(key.key);
                break;
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const testAPIKey = async (provider: string) => {
    setTesting({ ...testing, [provider]: true });
    
    const key = apiKeys.find(k => k.provider === provider);
    if (!key || !key.key) {
      toast({
        title: 'Error',
        description: 'Please enter an API key first',
        variant: 'destructive',
      });
      setTesting({ ...testing, [provider]: false });
      return;
    }

    try {
      let isValid = false;
      
      switch (provider) {
        case 'openai':
          isValid = await openaiService.testApiKey(key.key);
          break;
        case 'anthropic':
          isValid = await anthropicService.testApiKey(key.key);
          break;
        case 'google':
          isValid = await googleAIService.testApiKey(key.key);
          break;
      }

      setApiKeys(apiKeys.map(k => 
        k.provider === provider 
          ? { ...k, isValid, lastTested: new Date().toISOString() }
          : k
      ));

      toast({
        title: isValid ? 'Success' : 'Invalid Key',
        description: isValid 
          ? `${provider} API key is valid`
          : `${provider} API key is invalid or expired`,
        variant: isValid ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test API key',
        variant: 'destructive',
      });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  const saveAPIKeys = async () => {
    setSaving(true);
    
    try {
      // Save each API key to the database
      for (const key of apiKeys) {
        if (key.key) {
          // Check if provider exists
          const { data: existing } = await supabase
            .from('admin_ai_providers')
            .select('id')
            .eq('provider_type', key.provider)
            .single();

          const providerData = {
            name: `${key.provider.charAt(0).toUpperCase() + key.provider.slice(1)} Provider`,
            provider_type: key.provider,
            is_active: true,
            configuration: {
              api_key: key.key,
              model: key.provider === 'openai' ? 'gpt-4o-mini' : 
                     key.provider === 'anthropic' ? 'claude-3-sonnet-20240229' : 
                     'gemini-pro',
            },
          };

          if (existing) {
            // Update existing
            await supabase
              .from('admin_ai_providers')
              .update(providerData)
              .eq('id', existing.id);
          } else {
            // Insert new
            await supabase
              .from('admin_ai_providers')
              .insert(providerData);
          }

          // Set in service
          switch (key.provider) {
            case 'openai':
              openaiService.setApiKey(key.key);
              break;
            case 'anthropic':
              anthropicService.setApiKey(key.key);
              break;
            case 'google':
              googleAIService.setApiKey(key.key);
              break;
          }
        }
      }

      toast({
        title: 'Success',
        description: 'API keys saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API keys',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (provider: string, value: string) => {
    setApiKeys(apiKeys.map(k => 
      k.provider === provider 
        ? { ...k, key: value, isValid: false }
        : k
    ));
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'GPT-4, DALL-E, Whisper, and Realtime Voice',
          keyFormat: 'sk-proj-...',
          docsUrl: 'https://platform.openai.com/api-keys',
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          description: 'Claude 3 family of models',
          keyFormat: 'sk-ant-...',
          docsUrl: 'https://console.anthropic.com/settings/keys',
        };
      case 'google':
        return {
          name: 'Google AI',
          description: 'Gemini models',
          keyFormat: 'AIza...',
          docsUrl: 'https://makersuite.google.com/app/apikey',
        };
      default:
        return null;
    }
  };

  return (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-6 w-6" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Configure API keys for AI providers to enable voice chat and AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            API keys are stored securely and never exposed to the client. 
            Make sure to use production keys with appropriate rate limits.
          </AlertDescription>
        </Alert>

        {apiKeys.map((apiKey) => {
          const info = getProviderInfo(apiKey.provider);
          if (!info) return null;

          return (
            <div key={apiKey.provider} className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{info.name}</h3>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
                <Badge variant={apiKey.isValid ? 'success' : 'secondary'}>
                  {apiKey.isValid ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Valid
                    </>
                  ) : (
                    'Not Configured'
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${apiKey.provider}-key`}>
                  API Key
                  <a 
                    href={info.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Get API Key →
                  </a>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${apiKey.provider}-key`}
                      type={showKeys[apiKey.provider] ? 'text' : 'password'}
                      value={apiKey.key}
                      onChange={(e) => updateKey(apiKey.provider, e.target.value)}
                      placeholder={info.keyFormat}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => setShowKeys({
                        ...showKeys,
                        [apiKey.provider]: !showKeys[apiKey.provider]
                      })}
                    >
                      {showKeys[apiKey.provider] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIKey(apiKey.provider)}
                    disabled={!apiKey.key || testing[apiKey.provider]}
                    variant="outline"
                  >
                    {testing[apiKey.provider] ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
                {apiKey.lastTested && apiKey.isValid && (
                  <p className="text-xs text-muted-foreground">
                    Last tested: {new Date(apiKey.lastTested).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <Button
            onClick={saveAPIKeys}
            disabled={saving || !apiKeys.some(k => k.key)}
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save API Keys
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};