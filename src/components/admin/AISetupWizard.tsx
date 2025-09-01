import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Key,
  Database,
  Mic,
  ArrowRight,
  FileText,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const AISetupWizard: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps: SetupStep[] = [
    {
      id: 'env-file',
      title: 'Create Environment File',
      description: 'Set up your .env file with API keys',
      completed: false
    },
    {
      id: 'openai',
      title: 'Configure OpenAI',
      description: 'Add your OpenAI API key for AI features',
      completed: false
    },
    {
      id: 'supabase',
      title: 'Configure Supabase',
      description: 'Set up database connection',
      completed: false
    },
    {
      id: 'test',
      title: 'Test Configuration',
      description: 'Verify everything is working',
      completed: false
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const envTemplate = `# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE
VITE_OPENAI_ORGANIZATION_ID=

# Supabase Configuration  
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Feature Flags
VITE_ENABLE_VOICE_CHAT=true
VITE_ENABLE_AI_ASSESSMENT=true
VITE_ENABLE_COMMUNITY=true

# Application
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="Life Navigation System"
VITE_APP_VERSION=1.0.0

# Security
VITE_JWT_SECRET=your-secure-jwt-secret-minimum-32-chars
VITE_ENCRYPTION_KEY=your-secure-encryption-key-minimum-32-chars`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">AI Provider Setup Wizard</CardTitle>
          <CardDescription>
            Follow these steps to configure AI features in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep 
                      ? 'bg-gradient-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-2 ${
                    index < currentStep ? 'bg-gradient-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Tabs value={steps[currentStep].id} className="space-y-4">
            <TabsContent value="env-file" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 1: Create .env File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="glass-card">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Create a file named <code className="bg-black/20 px-1 rounded">.env</code> in your project root directory
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label>Copy this template:</Label>
                    <div className="relative">
                      <pre className="bg-black/20 p-4 rounded text-xs overflow-x-auto">
                        {envTemplate}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 glass"
                        onClick={() => copyToClipboard(envTemplate, '.env template')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Terminal command:</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-black/20 p-2 rounded text-sm">
                        touch .env && echo "{envTemplate.split('\n')[0]}" > .env
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass"
                        onClick={() => copyToClipboard('touch .env', 'Command')}
                      >
                        <Terminal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="openai" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Step 2: Configure OpenAI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="glass-card">
                    <AlertDescription>
                      You need an OpenAI API key to enable voice and AI features
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">How to get your API key:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          platform.openai.com <ExternalLink className="h-3 w-3" />
                        </a></li>
                        <li>Sign in or create an account</li>
                        <li>Navigate to API Keys section</li>
                        <li>Click "Create new secret key"</li>
                        <li>Copy the key (starts with sk-proj-...)</li>
                      </ol>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-key">Paste your API key here:</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="api-key"
                          type="password"
                          placeholder="sk-proj-..."
                          className="glass-input"
                        />
                        <Button variant="outline" className="glass">
                          Validate
                        </Button>
                      </div>
                    </div>

                    <Alert variant="default" className="glass-card">
                      <AlertDescription>
                        <strong>Important:</strong> Keep your API key secret. Never commit it to version control.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supabase" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Step 3: Configure Supabase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="glass-card bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Supabase is already configured with default values. You can customize if needed.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Supabase URL</Label>
                        <Input 
                          value="https://ufgqmqoykddaotdbwteg.supabase.co"
                          readOnly
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Badge variant="default" className="w-full justify-center py-2">
                          Connected
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Database Features:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Authentication', 'Real-time', 'Storage', 'Edge Functions'].map(feature => (
                          <div key={feature} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Step 4: Test Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-gradient-primary"
                      onClick={() => {
                        window.location.href = '/admin?section=diagnostics';
                      }}
                    >
                      Run Full Diagnostics
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="glass-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">OpenAI</p>
                              <p className="font-medium">Test Connection</p>
                            </div>
                            <Button size="sm" variant="outline" className="glass">
                              Test
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Voice Agent</p>
                              <p className="font-medium">Test Voice</p>
                            </div>
                            <Button size="sm" variant="outline" className="glass">
                              Test
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="glass"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};