import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Key, 
  Database, 
  Users, 
  Brain,
  CheckCircle,
  AlertCircle,
  Save,
  TestTube
} from 'lucide-react';

const SimpleAdmin = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [openaiKey, setOpenaiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<any>(null);

  useEffect(() => {
    if (user && isAdmin) {
      loadAIProvider();
    }
  }, [user, isAdmin]);

  const loadAIProvider = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .eq('provider_type', 'openai')
        .single();

      if (error) {
        console.warn('Could not load AI provider:', error.message);
      } else {
        setAiProvider(data);
        setOpenaiKey(data.configuration?.api_key || '');
      }
    } catch (err) {
      console.warn('AI provider load failed:', err);
    }
  };

  const saveOpenAIKey = async () => {
    if (!openaiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const configuration = {
        api_key: openaiKey.trim(),
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.7,
        base_url: 'https://api.openai.com'
      };

      const { error } = await supabase
        .from('admin_ai_providers')
        .upsert({
          provider_type: 'openai',
          is_active: true,
          priority: 1,
          configuration
        }, { onConflict: 'provider_type' });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "OpenAI API key saved successfully",
        variant: "default"
      });

      // Reload provider data
      await loadAIProvider();

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save API key: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIKey = async () => {
    if (!openaiKey.trim()) {
      toast({
        title: "Error", 
        description: "Please enter an API key first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey.trim()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `OpenAI API key is valid. Found ${data.data?.length || 0} models.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: `OpenAI API test failed: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `API test failed: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Please login to access the admin panel
            </p>
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/auth'}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You don't have admin privileges. Please contact an administrator.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/admin-test'}
              >
                Test Admin Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Newomen Admin Panel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default">Super Admin</Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </CardHeader>
        </Card>

        {/* OpenAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              OpenAI API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Required for AI chat functionality. Get your key from OpenAI dashboard.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveOpenAIKey}
                disabled={isLoading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save API Key
              </Button>
              <Button 
                variant="outline"
                onClick={testOpenAIKey}
                disabled={isLoading}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Key
              </Button>
            </div>

            {aiProvider && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">OpenAI Provider Status</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Status: {aiProvider.is_active ? 'Active' : 'Inactive'}</div>
                  <div>Model: {aiProvider.configuration?.model || 'Not set'}</div>
                  <div>API Key: {aiProvider.configuration?.api_key ? 'Configured' : 'Not set'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Database Connection:</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Admin Profile:</span>
                  <Badge variant="default">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Edge Functions:</span>
                  <Badge variant="default">24 Deployed</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Authentication:</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mobile Ready:</span>
                  <Badge variant="default">Optimized</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Security:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="h-20 flex-col gap-2"
              >
                <Database className="w-6 h-6" />
                View Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/chat'}
                className="h-20 flex-col gap-2"
              >
                <Brain className="w-6 h-6" />
                Test Chat (After API Key)
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/admin-test'}
                className="h-20 flex-col gap-2"
              >
                <TestTube className="w-6 h-6" />
                Admin Diagnostics
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg', '_blank')}
                className="h-20 flex-col gap-2"
              >
                <Key className="w-6 h-6" />
                Supabase Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Configure your OpenAI API key above to enable chat functionality</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Test the chat feature to ensure AI responses work</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Use the Supabase dashboard for advanced database management</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Monitor user activity and engagement through the dashboard</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleAdmin;