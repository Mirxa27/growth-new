/**
 * Configuration Management Page
 * Admin interface for managing environment and API configurations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Zap,
  Database,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { environmentValidator, ServiceStatus, ValidationResult } from '@/services/configuration/environment-validator.service';
import { EnvironmentChecker } from '@/components/configuration/EnvironmentChecker';
import { env } from '@/config/environment';

const ConfigurationPage: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [connectivityResults, setConnectivityResults] = useState<{ [service: string]: boolean }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsValidating(true);
    try {
      const results = await environmentValidator.validateEnvironment();
      const status = environmentValidator.getServiceStatus();
      
      setValidationResults(results);
      setServiceStatus(status);
    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: 'Could not validate environment configuration',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const testConnectivity = async () => {
    setIsTesting(true);
    try {
      const results = await environmentValidator.testConnectivity();
      setConnectivityResults(results);
      
      const successCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      
      toast({
        title: 'Connectivity Test Complete',
        description: `${successCount}/${totalCount} services responding`,
        variant: successCount === totalCount ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not test service connectivity',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'placeholder':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'missing':
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'configured':
        return 'default';
      case 'placeholder':
        return 'secondary';
      case 'missing':
      case 'invalid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Configuration Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Monitor and manage your environment configuration, API keys, and service status.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button onClick={loadConfiguration} disabled={isValidating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Refresh Status'}
          </Button>
          
          <Button onClick={testConnectivity} disabled={isTesting} variant="outline">
            <Globe className={`w-4 h-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test Connectivity'}
          </Button>
        </div>

        {/* Validation Summary */}
        {validationResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {validationResults.errors.length === 0 ? '✅' : '❌'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {validationResults.isValid ? 'Configuration Valid' : 'Issues Found'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {validationResults.warnings.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {validationResults.recommendations.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Recommendations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>
                  Current status of all integrated services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceStatus.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(service.status)}>
                          {service.status}
                        </Badge>
                        {service.required && (
                          <Badge variant="outline">Required</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResults && (validationResults.errors.length > 0 || validationResults.warnings.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validationResults.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                  
                  {validationResults.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="environment" className="space-y-6">
            <EnvironmentChecker />
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Connectivity</CardTitle>
                <CardDescription>
                  Test actual connectivity to external services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(connectivityResults).map(([service, isConnected]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isConnected ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{service}</p>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? 'Service responding' : 'Service unavailable'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isConnected ? 'default' : 'destructive'}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  ))}
                  
                  {Object.keys(connectivityResults).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Test Connectivity" to check service status</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vercel Setup Instructions</CardTitle>
                <CardDescription>
                  Step-by-step guide to configure environment variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 1: Access Vercel Dashboard</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Go to your Vercel dashboard and select your project
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                        Open Vercel Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </div>

                  {/* Step 2 */}
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 2: Get OpenAI API Key</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create an API key from OpenAI platform
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                        Get OpenAI API Key <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </div>

                  {/* Step 3 */}
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 3: Add Environment Variables</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        In Vercel Settings → Environment Variables, add:
                      </p>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded font-mono text-sm">
                        <strong>VITE_OPENAI_API_KEY</strong> = sk-your-actual-api-key-here
                      </div>
                      <div className="p-3 bg-muted rounded font-mono text-sm">
                        <strong>VITE_SUPABASE_URL</strong> = {env.supabase.url}
                      </div>
                      <div className="p-3 bg-muted rounded font-mono text-sm">
                        <strong>VITE_SUPABASE_ANON_KEY</strong> = {env.supabase.anonKey ? 'configured' : 'your-supabase-key'}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 4: Redeploy Application</h3>
                    <p className="text-sm text-muted-foreground">
                      After adding environment variables, redeploy your application for changes to take effect.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environment Template */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables Template</CardTitle>
                <CardDescription>
                  Complete list of all supported environment variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`# Required Variables
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional Variables
VITE_OPENAI_ORGANIZATION_ID=org-your-organization-id
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_ENABLE_VOICE_CHAT=true
VITE_ENABLE_AI_ASSESSMENT=true
VITE_ENABLE_COMMUNITY=true
VITE_APP_NAME=Newomen Platform
VITE_DEBUG_MODE=false`}</pre>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> All variables starting with <code>VITE_</code> are exposed to the browser. 
                      This is safe for API keys that are meant to be used client-side (like OpenAI).
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Current Configuration Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {env.app.environment.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">Environment</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {serviceStatus.filter(s => s.status === 'configured').length}/{serviceStatus.length}
                </div>
                <p className="text-sm text-muted-foreground">Services Ready</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {env.openai.apiKey ? '✅' : '❌'}
                </div>
                <p className="text-sm text-muted-foreground">OpenAI API</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {Object.values(env.features).filter(Boolean).length}
                </div>
                <p className="text-sm text-muted-foreground">Features Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigurationPage;