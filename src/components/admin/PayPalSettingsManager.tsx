import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Settings, 
  Shield, 
  Key, 
  Globe,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-mobile';
import { MobileAdminWrapper } from '@/components/admin/MobileAdminWrapper';

interface PayPalConfig {
  client_id: string;
  client_secret: string;
  mode: 'sandbox' | 'live';
  webhook_id: string;
  currency: string;
  business_name: string;
  return_url: string;
  cancel_url: string;
  is_active: boolean;
}

interface PayPalPlan {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CREATED';
  price: string;
  currency: string;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  interval_count: number;
  created_at: string;
}

interface PayPalSubscription {
  id: string;
  plan_id: string;
  status: string;
  subscriber_email: string;
  created_at: string;
  next_billing_time?: string;
}

export const PayPalSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, verified } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'config' | 'plans' | 'subscriptions' | 'webhooks'>('config');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Configuration state
  const [config, setConfig] = useState<PayPalConfig>({
    client_id: '',
    client_secret: '',
    mode: 'sandbox',
    webhook_id: '',
    currency: 'USD',
    business_name: '',
    return_url: '',
    cancel_url: '',
    is_active: false
  });

  // Plans and subscriptions
  const [plans, setPlans] = useState<PayPalPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<PayPalSubscription[]>([]);
  const [editingPlan, setEditingPlan] = useState<PayPalPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'MONTH' as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    interval_count: 1
  });
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    if (verified) {
      loadPayPalConfig();
      loadPlans();
      loadSubscriptions();
    }
  }, [verified]);

  const loadPayPalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_payment_settings')
        .select('*')
        .eq('provider', 'paypal')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig({
          client_id: data.configuration?.client_id || '',
          client_secret: data.configuration?.client_secret || '',
          mode: data.configuration?.mode || 'sandbox',
          webhook_id: data.configuration?.webhook_id || '',
          currency: data.configuration?.currency || 'USD',
          business_name: data.configuration?.business_name || '',
          return_url: data.configuration?.return_url || '',
          cancel_url: data.configuration?.cancel_url || '',
          is_active: data.is_active || false
        });
      }
    } catch (error) {
      logger.error('Failed to load PayPal configuration', 'PayPalSettings', error);
      toast({
        title: 'Loading Failed',
        description: 'Unable to load PayPal configuration.',
        variant: 'destructive'
      });
    }
  };

  const savePayPalConfig = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('admin_payment_settings')
        .upsert({
          provider: 'paypal',
          configuration: config,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'provider'
        });

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'PayPal settings have been saved successfully.',
      });

    } catch (error) {
      logger.error('Failed to save PayPal configuration', 'PayPalSettings', error);
      toast({
        title: 'Save Failed',
        description: 'Unable to save PayPal configuration.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testPayPalConnection = async () => {
    try {
      setTesting(true);

      // Call edge function to test PayPal connection
      const { data, error } = await supabase.functions.invoke('test-paypal-connection', {
        body: {
          client_id: config.client_id,
          client_secret: config.client_secret,
          mode: config.mode
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: 'PayPal API connection is working correctly.',
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }

    } catch (error) {
      logger.error('PayPal connection test failed', 'PayPalSettings', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Unable to connect to PayPal API.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('paypal_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      logger.error('Failed to load PayPal plans', 'PayPalSettings', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('paypal_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      logger.error('Failed to load PayPal subscriptions', 'PayPalSettings', error);
    }
  };

  const createPlan = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-paypal-plan', {
        body: {
          name: newPlan.name,
          description: newPlan.description,
          price: newPlan.price,
          currency: config.currency,
          interval: newPlan.interval,
          interval_count: newPlan.interval_count
        }
      });

      if (error) throw error;

      // Reset form
      setNewPlan({
        name: '',
        description: '',
        price: '',
        interval: 'MONTH',
        interval_count: 1
      });

      // Reload plans
      await loadPlans();

      toast({
        title: 'Plan Created',
        description: 'PayPal subscription plan created successfully.',
      });

    } catch (error) {
      logger.error('Failed to create PayPal plan', 'PayPalSettings', error);
      toast({
        title: 'Plan Creation Failed',
        description: error instanceof Error ? error.message : 'Unable to create subscription plan.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      const { error } = await supabase.functions.invoke('update-paypal-plan', {
        body: {
          plan_id: planId,
          status: newStatus
        }
      });

      if (error) throw error;

      await loadPlans();

      toast({
        title: 'Plan Updated',
        description: `Plan status changed to ${newStatus}.`,
      });

    } catch (error) {
      logger.error('Failed to update plan status', 'PayPalSettings', error);
      toast({
        title: 'Update Failed',
        description: 'Unable to update plan status.',
        variant: 'destructive'
      });
    }
  };

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card className="glass-strong hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-glass flex items-center">
            <Key className="h-5 w-5 mr-2 text-primary" />
            API Configuration
          </CardTitle>
          <CardDescription className="text-glass-muted">
            Configure your PayPal API credentials and basic settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <Label htmlFor="mode">Environment Mode</Label>
              <Select value={config.mode} onValueChange={(value: 'sandbox' | 'live') => 
                setConfig(prev => ({ ...prev, mode: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="live">Live (Production)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={config.currency} onValueChange={(value: string) => 
                setConfig(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={config.business_name}
              onChange={(e) => setConfig(prev => ({ ...prev, business_name: e.target.value }))}
              placeholder="Your Business Name"
            />
          </div>

          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <Label htmlFor="client_id">Client ID</Label>
              <div className="relative">
                <Input
                  id="client_id"
                  type={showSecrets.client_id ? "text" : "password"}
                  value={config.client_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="PayPal Client ID"
                  className="input-glass pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecrets(prev => ({ ...prev, client_id: !prev.client_id }))}
                >
                  {showSecrets.client_id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="client_secret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="client_secret"
                  type={showSecrets.client_secret ? "text" : "password"}
                  value={config.client_secret}
                  onChange={(e) => setConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                  placeholder="PayPal Client Secret"
                  className="input-glass pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecrets(prev => ({ ...prev, client_secret: !prev.client_secret }))}
                >
                  {showSecrets.client_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="webhook_id">Webhook ID</Label>
            <Input
              id="webhook_id"
              value={config.webhook_id}
              onChange={(e) => setConfig(prev => ({ ...prev, webhook_id: e.target.value }))}
              placeholder="PayPal Webhook ID"
            />
          </div>
        </CardContent>
      </Card>

      {/* URLs Configuration */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            URL Configuration
          </CardTitle>
          <CardDescription>
            Configure return and cancel URLs for payment flows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="return_url">Return URL</Label>
            <Input
              id="return_url"
              value={config.return_url}
              onChange={(e) => setConfig(prev => ({ ...prev, return_url: e.target.value }))}
              placeholder="https://your-domain.com/payment/success"
            />
          </div>

          <div>
            <Label htmlFor="cancel_url">Cancel URL</Label>
            <Input
              id="cancel_url"
              value={config.cancel_url}
              onChange={(e) => setConfig(prev => ({ ...prev, cancel_url: e.target.value }))}
              placeholder="https://your-domain.com/payment/cancel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
            />
            <Label>Enable PayPal Payments</Label>
          </div>

          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button onClick={savePayPalConfig} disabled={loading} className={`btn-glass ${isMobile ? 'w-full' : ''}`}>
              <Save className="h-4 w-4 mr-2" />
              {isMobile ? 'Save' : 'Save Configuration'}
            </Button>
            
            <Button 
              onClick={testPayPalConnection} 
              disabled={testing || !config.client_id || !config.client_secret} 
              variant="outline"
              className={`btn-glass border-green-400/20 hover:border-green-400/40 ${isMobile ? 'w-full' : ''}`}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isMobile ? 'Test' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Create New Plan */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create New Plan
          </CardTitle>
          <CardDescription>
            Create subscription plans for your services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan_name">Plan Name</Label>
              <Input
                id="plan_name"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Basic Plan"
              />
            </div>

            <div>
              <Label htmlFor="plan_price">Price ({config.currency})</Label>
              <Input
                id="plan_price"
                type="number"
                step="0.01"
                value={newPlan.price}
                onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                placeholder="9.99"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plan_description">Description</Label>
            <Textarea
              id="plan_description"
              value={newPlan.description}
              onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this plan includes..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interval">Billing Interval</Label>
              <Select value={newPlan.interval} onValueChange={(value: any) => 
                setNewPlan(prev => ({ ...prev, interval: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY">Daily</SelectItem>
                  <SelectItem value="WEEK">Weekly</SelectItem>
                  <SelectItem value="MONTH">Monthly</SelectItem>
                  <SelectItem value="YEAR">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interval_count">Interval Count</Label>
              <Input
                id="interval_count"
                type="number"
                min="1"
                value={newPlan.interval_count}
                onChange={(e) => setNewPlan(prev => ({ ...prev, interval_count: parseInt(e.target.value) }))}
                placeholder="1"
              />
            </div>
          </div>

          <Button 
            onClick={createPlan} 
            disabled={loading || !newPlan.name || !newPlan.price}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </CardContent>
      </Card>

      {/* Existing Plans */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Existing Plans</CardTitle>
          <CardDescription>
            Manage your subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Plans Created</h3>
              <p className="text-muted-foreground">
                Create your first subscription plan above.
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
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="font-medium">{plan.price} {plan.currency}</span>
                          <span>Every {plan.interval_count} {plan.interval.toLowerCase()}</span>
                          <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'outline'}>
                            {plan.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePlanStatus(plan.id, plan.status)}
                        >
                          {plan.status === 'ACTIVE' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
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
    </div>
  );

  const renderSubscriptionsTab = () => (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Active Subscriptions
        </CardTitle>
        <CardDescription>
          View and manage customer subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground">
              Subscriptions will appear here once customers start subscribing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{subscription.subscriber_email}</h4>
                      <p className="text-sm text-muted-foreground">
                        Subscription ID: {subscription.id}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'outline'}>
                          {subscription.status}
                        </Badge>
                        <span>Created: {format(new Date(subscription.created_at), 'PPp')}</span>
                        {subscription.next_billing_time && (
                          <span>Next billing: {format(new Date(subscription.next_billing_time), 'PPp')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWebhooksTab = () => (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Configure webhooks to receive real-time PayPal notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-1">Webhook Setup Instructions</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your PayPal Developer Dashboard</li>
                <li>Navigate to your application settings</li>
                <li>Add the webhook URL: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/webhooks/paypal</code></li>
                <li>Select the events you want to receive</li>
                <li>Copy the Webhook ID and paste it in the configuration above</li>
              </ol>
            </div>
          </div>
        </div>

        <div>
          <Label>Recommended Webhook Events</Label>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <code>BILLING.SUBSCRIPTION.CREATED</code>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <code>BILLING.SUBSCRIPTION.ACTIVATED</code>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <code>BILLING.SUBSCRIPTION.CANCELLED</code>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <code>PAYMENT.CAPTURE.COMPLETED</code>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <code>PAYMENT.CAPTURE.DENIED</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isAdmin) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access PayPal settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center text-glass">
            <CreditCard className="h-6 w-6 mr-2 text-primary" />
            PayPal Settings
          </h2>
          <p className="text-glass-muted">
            Configure PayPal payments and subscriptions
          </p>
        </div>
        <Badge variant={config.is_active ? "default" : "outline"} className="badge-glass bg-primary/10">
          <DollarSign className="h-4 w-4 mr-1" />
          <span className="text-glass">{config.is_active ? 'Active' : 'Inactive'}</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <TabsTrigger value="config" className={`${isMobile ? 'text-xs px-2' : ''}`}>
            {isMobile ? 'Config' : 'Configuration'}
          </TabsTrigger>
          <TabsTrigger value="plans" className={`${isMobile ? 'text-xs px-2' : ''}`}>
            Plans
          </TabsTrigger>
          {!isMobile && (
            <>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </>
          )}
          {isMobile && (
            <TabsTrigger value="subscriptions" className="text-xs px-2">
              Subs
            </TabsTrigger>
          )}
        </TabsList>
        
        {isMobile && (
          <div className="mt-2">
            <Button
              variant={activeTab === 'webhooks' ? 'default' : 'outline'}
              onClick={() => setActiveTab('webhooks')}
              className="w-full text-sm"
            >
              Webhook Configuration
            </Button>
          </div>
        )}

        <TabsContent value="config">
          {renderConfigTab()}
        </TabsContent>

        <TabsContent value="plans">
          {renderPlansTab()}
        </TabsContent>

        <TabsContent value="subscriptions">
          {renderSubscriptionsTab()}
        </TabsContent>

        <TabsContent value="webhooks">
          {renderWebhooksTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};