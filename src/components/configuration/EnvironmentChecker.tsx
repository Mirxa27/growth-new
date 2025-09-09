/**
 * Environment Checker Component
 * Displays current environment configuration and API key status
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Settings, ExternalLink } from 'lucide-react';
import { env } from '@/config/environment';

export const EnvironmentChecker: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getApiKeyStatus = () => {
    const apiKey = env.openai.apiKey;
    if (!apiKey) {
      return { status: 'missing', message: 'Not configured', color: 'destructive' };
    }
    if (apiKey === 'your-openai-api-key-here') {
      return { status: 'placeholder', message: 'Placeholder value', color: 'warning' };
    }
    if (apiKey.length < 10) {
      return { status: 'invalid', message: 'Invalid format', color: 'destructive' };
    }
    return { status: 'configured', message: 'Configured', color: 'success' };
  };

  const getSupabaseStatus = () => {
    const url = env.supabase.url;
    const key = env.supabase.anonKey;
    if (!url || !key) {
      return { status: 'missing', message: 'Not configured', color: 'destructive' };
    }
    return { status: 'configured', message: 'Configured', color: 'success' };
  };

  const apiKeyStatus = getApiKeyStatus();
  const supabaseStatus = getSupabaseStatus();

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Environment Configuration
              </CardTitle>
              <CardDescription>
                Current API configuration and service status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenAI Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {apiKeyStatus.status === 'configured' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : apiKeyStatus.status === 'placeholder' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">OpenAI API</p>
                  <p className="text-sm text-muted-foreground">Real-time transcription</p>
                </div>
              </div>
              <Badge 
                variant={
                  apiKeyStatus.color === 'success' ? 'default' :
                  apiKeyStatus.color === 'warning' ? 'secondary' : 'destructive'
                }
              >
                {apiKeyStatus.message}
              </Badge>
            </div>

            {/* Supabase Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {supabaseStatus.status === 'configured' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Supabase</p>
                  <p className="text-sm text-muted-foreground">Database & Auth</p>
                </div>
              </div>
              <Badge 
                variant={supabaseStatus.color === 'success' ? 'default' : 'destructive'}
              >
                {supabaseStatus.message}
              </Badge>
            </div>
          </div>

          {/* Configuration Alerts */}
          {apiKeyStatus.status !== 'configured' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>OpenAI API Key Required:</strong> To use real-time transcription, please set your OpenAI API key in Vercel environment variables as <code>VITE_OPENAI_API_KEY</code>.
                <Button variant="link" className="p-0 ml-2 h-auto" asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Configure in Vercel <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Configuration */}
          {showDetails && (
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold">Configuration Details</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {/* OpenAI Configuration */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">OpenAI Configuration</h5>
                    <Badge variant="outline">{env.app.environment}</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Key:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {env.openai.apiKey ? 
                            (showApiKey ? env.openai.apiKey : maskApiKey(env.openai.apiKey)) : 
                            'Not set'
                          }
                        </span>
                        {env.openai.apiKey && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="h-6 w-6 p-0"
                          >
                            {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Default Model:</span>
                      <span>{env.openai.model}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span>{env.openai.maxTokens}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature:</span>
                      <span>{env.openai.temperature}</span>
                    </div>
                    
                    {env.openai.organizationId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Organization ID:</span>
                        <span className="font-mono">{maskApiKey(env.openai.organizationId)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Flags */}
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Feature Configuration</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voice Chat:</span>
                      <Badge variant={env.features.voiceChat ? 'default' : 'secondary'}>
                        {env.features.voiceChat ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Assessment:</span>
                      <Badge variant={env.features.aiAssessment ? 'default' : 'secondary'}>
                        {env.features.aiAssessment ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Community:</span>
                      <Badge variant={env.features.community ? 'default' : 'secondary'}>
                        {env.features.community ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analytics:</span>
                      <Badge variant={env.features.analytics ? 'default' : 'secondary'}>
                        {env.features.analytics ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Vercel Environment Setup</CardTitle>
          <CardDescription>
            How to configure your environment variables in Vercel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Required Variables</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_OPENAI_API_KEY</code>
                    <span className="text-muted-foreground">OpenAI API Key</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_SUPABASE_URL</code>
                    <span className="text-muted-foreground">Supabase Project URL</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_SUPABASE_ANON_KEY</code>
                    <span className="text-muted-foreground">Supabase Anon Key</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Optional Variables</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_OPENAI_ORGANIZATION_ID</code>
                    <span className="text-muted-foreground">OpenAI Org ID</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_ENABLE_VOICE_CHAT</code>
                    <span className="text-muted-foreground">Enable voice features</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <code>VITE_OPENAI_MODEL</code>
                    <span className="text-muted-foreground">Default AI model</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> After updating environment variables in Vercel, you'll need to redeploy your application for the changes to take effect.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button asChild>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Open Vercel Dashboard <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  Get OpenAI API Key <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};