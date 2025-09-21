import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Settings, 
  Save, 
  TestTube, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Shield,
  DollarSign,
  Globe,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { z } from 'zod';
import { errorHandler } from '@/lib/error-handler';
import { logger } from '@/utils/logger';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const PayPalConfigSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().min(1, 'Client Secret is required'),
  mode: z.enum(['sandbox', 'live'], { required_error: 'Mode is required' }),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  webhook_id: z.string().optional(),
  return_url: z.string().url('Invalid return URL').optional(),
  cancel_url: z.string().url('Invalid cancel URL').optional(),
  is_active: z.boolean().default(false),
});

type PayPalConfig = z.infer<typeof PayPalConfigSchema>;

interface PayPalPlan {
  id: string;
  name: string;
  description: string;
  status: string;
  billing_cycles: any[];
  created_at: string;
}

export const PayPalSettings: React.FC = () => {
  const { isAdmin, verified } = useAdminAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<PayPalConfig>({
    client_id: '',
    client_secret: '',
    mode: 'sandbox',
    currency: 'USD',
    webhook_id: '',
    return_url: '',
    cancel_url: '',
    is_active: false,
  });
  
  const [plans, setPlans] = useState<PayPalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfig();
    fetchPlans();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', [
          'paypal_client_id',
          'paypal_client_secret', 
          'paypal_mode',
          'paypal_currency',
          'paypal_webhook_id',
          'paypal_return_url',
          'paypal_cancel_url',
          'paypal_active'
        ]);

      if (error) throw error;

      const configData: Partial<PayPalConfig> = {};
      data?.forEach(({ key, value }) => {
        switch (key) {
          case 'paypal_client_id':
            configData.client_id = value;
            break;
          case 'paypal_client_secret':
            configData.client_secret = value;
            break;
          case 'paypal_mode':
            configData.mode = value as 'sandbox' | 'live';
            break;
          case 'paypal_currency':
            configData.currency = value;
            break;
          case 'paypal_webhook_id':
            configData.webhook_id = value;
            break;
          case 'paypal_return_url':
            configData.return_url = value;
            break;
          case 'paypal_cancel_url':
            configData.cancel_url = value;
            break;
          case 'paypal_active':
            configData.is_active = value === 'true';
            break;
        }
      });

      setConfig(prev => ({ ...prev, ...configData }));
    } catch (error) {
      const appError = errorHandler.handleError(error, 'PayPalSettings');
      logger.error('Failed to fetch PayPal config', 'PayPalSettings', appError);
      
      toast({
        title: "Error",
        description: errorHandler.getUserFriendlyMessage(appError),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('payment_provider', 'paypal')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleConfigChange = (field: keyof PayPalConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateConfig = (): boolean => {
    try {
      PayPalConfigSchema.parse(config);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const saveConfig = async () => {
    if (!validateConfig()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const settings = [
        { key: 'paypal_client_id', value: config.client_id },
        { key: 'paypal_client_secret', value: config.client_secret },
        { key: 'paypal_mode', value: config.mode },
        { key: 'paypal_currency', value: config.currency },
        { key: 'paypal_webhook_id', value: config.webhook_id || '' },
        { key: 'paypal_return_url', value: config.return_url || '' },
        { key: 'paypal_cancel_url', value: config.cancel_url || '' },
        { key: 'paypal_active', value: config.is_active.toString() },
      ];

      const updates = settings.map(({ key, value }) =>
        supabase.rpc('update_platform_setting', {
          setting_key: key,
          setting_value: value
        })
      );

      const results = await Promise.all(updates);
      
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      toast({
        title: "Success",
        description: "PayPal configuration saved successfully",
      });
    } catch (error) {
      const appError = errorHandler.handleError(error, 'PayPalSettings');
      logger.error('Failed to save PayPal configuration', 'PayPalSettings', appError);
      
      toast({
        title: "Error",
        description: errorHandler.getUserFriendlyMessage(appError),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.client_id || !config.client_secret) {
      toast({
        title: "Configuration Required",
        description: "Please enter Client ID and Client Secret first",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);
      
      const { data, error } = await supabase.functions.invoke('test-paypal-connection', {
        body: {
          client_id: config.client_id,
          client_secret: config.client_secret,
          mode: config.mode
        }
      });

      if (error) throw error;

      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      const appError = errorHandler.handleError(error, 'PayPalSettings');
      logger.error('PayPal connection test failed', 'PayPalSettings', appError);
      
      toast({
        title: "Test Failed",
        description: errorHandler.getUserFriendlyMessage(appError),
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  if (!isAdmin) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access PayPal Settings.
          </p>
        </CardContent>
      </Card>
    );
  }

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
          <h2 className="text-2xl font-bold flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-primary" />
            PayPal Settings
          </h2>
          <p className="text-muted-foreground">
            Configure PayPal payment processing and subscription management
          </p>
        </div>
        <Badge variant={config.is_active ? "default" : "secondary"}>
          {config.is_active ? (
            <><CheckCircle className="h-4 w-4 mr-1" /> Active</>
          ) : (
            <><XCircle className="h-4 w-4 mr-1" /> Inactive</>
          )}
        </Badge>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                PayPal API Configuration
              </CardTitle>
              <CardDescription>
                Configure your PayPal API credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID *</Label>
                  <Input
                    id="client_id"
                    className="glass-input"
                    value={config.client_id}
                    onChange={(e) => handleConfigChange('client_id', e.target.value)}
                    placeholder="Your PayPal Client ID"
                  />
                  {errors.client_id && (
                    <p className="text-sm text-red-500">{errors.client_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret *</Label>
                  <div className="relative">
                    <Input
                      id="client_secret"
                      type={showSecret ? "text" : "password"}
                      className="glass-input pr-10"
                      value={config.client_secret}
                      onChange={(e) => handleConfigChange('client_secret', e.target.value)}
                      placeholder="Your PayPal Client Secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.client_secret && (
                    <p className="text-sm text-red-500">{errors.client_secret}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Environment *</Label>
                  <Select
                    value={config.mode}
                    onValueChange={(value) => handleConfigChange('mode', value)}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.mode && (
                    <p className="text-sm text-red-500">{errors.mode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Input
                    id="currency"
                    className="glass-input"
                    value={config.currency}
                    onChange={(e) => handleConfigChange('currency', e.target.value.toUpperCase())}
                    placeholder="USD"
                    maxLength={3}
                  />
                  {errors.currency && (
                    <p className="text-sm text-red-500">{errors.currency}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="return_url">Return URL</Label>
                  <Input
                    id="return_url"
                    className="glass-input"
                    value={config.return_url}
                    onChange={(e) => handleConfigChange('return_url', e.target.value)}
                    placeholder="https://yourdomain.com/payment/success"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancel_url">Cancel URL</Label>
                  <Input
                    id="cancel_url"
                    className="glass-input"
                    value={config.cancel_url}
                    onChange={(e) => handleConfigChange('cancel_url', e.target.value)}
                    placeholder="https://yourdomain.com/payment/cancel"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg glass">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleConfigChange('is_active', checked)}
                  />
                  <div>
                    <Label htmlFor="is_active" className="text-base font-medium">
                      Enable PayPal Payments
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Activate PayPal payment processing
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={testConnection}
                  disabled={testing || !config.client_id || !config.client_secret}
                  variant="outline"
                  className="glass"
                >
                  {testing ? (
                    <><TestTube className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
                  ) : (
                    <><TestTube className="h-4 w-4 mr-2" /> Test Connection</>
                  )}
                </Button>
                
                <Button
                  onClick={saveConfig}
                  disabled={saving}
                  className="bg-gradient-primary"
                >
                  {saving ? (
                    <><Save className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Configuration</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {config.mode === 'sandbox' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sandbox Mode:</strong> You're currently using PayPal sandbox for testing. 
                No real payments will be processed. Switch to Live mode for production.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Subscription Plans
              </CardTitle>
              <CardDescription>
                Manage PayPal subscription plans and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Plans Found</h3>
                  <p className="text-muted-foreground">
                    Create subscription plans to start accepting payments
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{plan.name}</h4>
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {plan.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View in PayPal
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure PayPal webhooks for real-time payment notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook_id">Webhook ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook_id"
                    className="glass-input"
                    value={config.webhook_id}
                    onChange={(e) => handleConfigChange('webhook_id', e.target.value)}
                    placeholder="Your PayPal Webhook ID"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.webhook_id || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg glass">
                <h4 className="font-semibold mb-2">Webhook URL</h4>
                <div className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {window.location.origin}/api/webhooks/paypal
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/paypal`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security:</strong> Webhook signatures are automatically verified to ensure 
                  the requests are coming from PayPal. Make sure to configure this webhook URL 
                  in your PayPal Developer Dashboard.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};