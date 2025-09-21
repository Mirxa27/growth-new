import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { RefreshCw, Save, CheckCircle2, ShieldOff, CreditCard } from 'lucide-react';
import { logger } from '@/utils/logger';

interface PayPalConfigForm {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  currency: string;
  productId: string;
  planId: string;
  webhookId: string;
  brandName: string;
  returnUrl: string;
  cancelUrl: string;
  lastVerifiedAt?: string;
}

type PersistedPayPalConfig = Omit<PayPalConfigForm, 'clientSecret'>;

const DEFAULT_CONFIG: PayPalConfigForm = {
  clientId: '',
  clientSecret: '',
  mode: 'sandbox',
  currency: 'USD',
  productId: '',
  planId: '',
  webhookId: '',
  brandName: 'Newomen',
  returnUrl: 'https://newomen.me/paypal/success',
  cancelUrl: 'https://newomen.me/paypal/cancel',
};

export const PayPalSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<PayPalConfigForm>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [secretUpdatedAt, setSecretUpdatedAt] = useState<string | null>(null);
  const [secretActionLoading, setSecretActionLoading] = useState(false);

  const sanitizeConfigForPersistence = (form: PayPalConfigForm): PersistedPayPalConfig => {
    const { clientSecret: _clientSecret, ...rest } = form;
    void _clientSecret;
    return rest;
  };

  const refreshSecretMetadata = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_secret_metadata', {
        key_name: 'paypal_client_secret',
      });

      if (error) throw error;

      const metadata = Array.isArray(data) ? data[0] : data;
      setHasStoredSecret(Boolean(metadata?.has_secret));
      setSecretUpdatedAt(metadata?.updated_at ?? null);
    } catch (error) {
      logger.warn('Failed to load PayPal secret metadata', 'PayPalSettings', error);
      setHasStoredSecret(false);
      setSecretUpdatedAt(null);
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const { data, error } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'paypal_config')
          .maybeSingle();

        if (error) throw error;

        if (data?.setting_value) {
          try {
            const parsed = typeof data.setting_value === 'string'
              ? JSON.parse(data.setting_value)
              : data.setting_value;

            setConfig({
              ...DEFAULT_CONFIG,
              ...parsed,
              clientSecret: '',
            });
          } catch (parseError) {
            logger.warn('Failed to parse PayPal config, falling back to defaults', 'PayPalSettings', parseError);
            setConfig(DEFAULT_CONFIG);
          }
        } else {
          setConfig(DEFAULT_CONFIG);
        }

        await refreshSecretMetadata();
      } catch (error) {
        logger.error('Failed to load PayPal settings', 'PayPalSettings', error);
        setLoadError(error instanceof Error ? error.message : 'Unable to load PayPal configuration');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [refreshSecretMetadata]);

  const handleChange = (field: keyof PayPalConfigForm, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const persistConfig = async (payload: PersistedPayPalConfig) => {
    const { error } = await supabase.rpc('update_platform_setting', {
      key_name: 'paypal_config',
      new_value: payload,
    });

    if (error) throw error;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const configToPersist = sanitizeConfigForPersistence(config);
      await persistConfig(configToPersist);

      if (config.clientSecret.trim()) {
        const { error: secretError } = await supabase.rpc('set_platform_secret', {
          key_name: 'paypal_client_secret',
          secret_value: config.clientSecret.trim(),
        });

        if (secretError) throw secretError;
        setConfig(prev => ({ ...prev, clientSecret: '' }));
        await refreshSecretMetadata();
      }

      toast({
        title: 'PayPal settings saved',
        description: 'Your PayPal configuration has been stored securely.',
      });
    } catch (error) {
      logger.error('Failed to save PayPal settings', 'PayPalSettings', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to save PayPal configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.clientId) {
      toast({
        title: 'Client ID required',
        description: 'Provide a PayPal client ID before testing the connection.',
        variant: 'destructive',
      });
      return;
    }

    if (!config.clientSecret && !hasStoredSecret) {
      toast({
        title: 'Secret required',
        description: 'Add a client secret or store one before testing the integration.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(true);
      const testedAt = new Date().toISOString();
      const requestBody: Record<string, string> = {
        grant_type: 'client_credentials',
        mode: config.mode,
      };

      if (config.clientId) {
        requestBody.client_id = config.clientId;
      }

      if (config.clientSecret) {
        requestBody.client_secret = config.clientSecret;
      }

      const { data, error } = await supabase.functions.invoke('paypal-oauth', {
        body: requestBody,
      });

      if (error) throw error;
      if (!data?.access_token) {
        throw new Error('The PayPal API did not return an access token.');
      }

      const updatedConfig: PayPalConfigForm = { ...config, lastVerifiedAt: testedAt };
      await persistConfig(sanitizeConfigForPersistence(updatedConfig));
      setConfig(updatedConfig);

      toast({
        title: 'Connection verified',
        description: 'Successfully authenticated with the PayPal API.',
      });
    } catch (error) {
      logger.error('Failed to verify PayPal credentials', 'PayPalSettings', error);
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Unable to verify PayPal credentials.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSecretRemoval = async () => {
    if (!hasStoredSecret) return;

    try {
      setSecretActionLoading(true);
      const { error } = await supabase.rpc('delete_platform_secret', {
        key_name: 'paypal_client_secret',
      });

      if (error) throw error;

      setHasStoredSecret(false);
      setSecretUpdatedAt(null);
      setConfig(prev => ({ ...prev, clientSecret: '' }));
      toast({
        title: 'Secret removed',
        description: 'The stored PayPal client secret has been deleted.',
      });
    } catch (error) {
      logger.error('Failed to delete PayPal secret', 'PayPalSettings', error);
      toast({
        title: 'Unable to remove secret',
        description: error instanceof Error ? error.message : 'Failed to delete the stored PayPal secret.',
        variant: 'destructive',
      });
    } finally {
      setSecretActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-12 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          <span className="text-muted-foreground">Loading PayPal settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            PayPal Integration
          </CardTitle>
          <CardDescription>
            Configure PayPal API credentials and endpoints for secure payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paypal-client-id">Client ID</Label>
            <Input
              id="paypal-client-id"
              placeholder="PayPal REST client ID"
              value={config.clientId}
              onChange={(event) => handleChange('clientId', event.target.value)}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-client-secret">Client Secret</Label>
            <Input
              id="paypal-client-secret"
              type="password"
              placeholder={hasStoredSecret ? 'Secret stored securely — enter to replace' : 'PayPal REST client secret'}
              value={config.clientSecret}
              onChange={(event) => handleChange('clientSecret', event.target.value)}
              className="glass-input"
            />
            {hasStoredSecret ? (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Secret stored securely
                  {secretUpdatedAt && (
                    <span>• updated {format(new Date(secretUpdatedAt), 'PPP p')}</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSecretRemoval}
                  disabled={secretActionLoading}
                  className="h-7 px-2"
                >
                  {secretActionLoading ? 'Removing…' : 'Remove secret'}
                </Button>
              </div>
            ) : (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldOff className="h-3.5 w-3.5" />
                No secret stored yet
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={config.mode} onValueChange={(value: 'sandbox' | 'live') => handleChange('mode', value)}>
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-currency">Currency</Label>
            <Input
              id="paypal-currency"
              value={config.currency}
              onChange={(event) => handleChange('currency', event.target.value.toUpperCase())}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-brand">Brand Name</Label>
            <Input
              id="paypal-brand"
              value={config.brandName}
              onChange={(event) => handleChange('brandName', event.target.value)}
              className="glass-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paypal-product">Product ID</Label>
            <Input
              id="paypal-product"
              value={config.productId}
              onChange={(event) => handleChange('productId', event.target.value)}
              placeholder="Optional catalog product"
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-plan">Plan ID</Label>
            <Input
              id="paypal-plan"
              value={config.planId}
              onChange={(event) => handleChange('planId', event.target.value)}
              placeholder="Subscription plan identifier"
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-webhook">Webhook ID</Label>
            <Input
              id="paypal-webhook"
              value={config.webhookId}
              onChange={(event) => handleChange('webhookId', event.target.value)}
              placeholder="Webhook used for PayPal notifications"
              className="glass-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paypal-return">Return URL</Label>
            <Input
              id="paypal-return"
              value={config.returnUrl}
              onChange={(event) => handleChange('returnUrl', event.target.value)}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-cancel">Cancel URL</Label>
            <Input
              id="paypal-cancel"
              value={config.cancelUrl}
              onChange={(event) => handleChange('cancelUrl', event.target.value)}
              className="glass-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          {config.lastVerifiedAt && (
            <Badge variant="outline" className="glass">
              Last verified {format(new Date(config.lastVerifiedAt), 'PPpp')}
            </Badge>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Payment Plans Configuration */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Payment Plans</CardTitle>
          <CardDescription>
            Configure subscription plans and pricing tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg glass">
              <h4 className="font-semibold">Basic Plan</h4>
              <p className="text-2xl font-bold">$9.99/mo</p>
              <p className="text-sm text-muted-foreground">Essential features</p>
            </div>
            <div className="p-4 border rounded-lg glass">
              <h4 className="font-semibold">Premium Plan</h4>
              <p className="text-2xl font-bold">$19.99/mo</p>
              <p className="text-sm text-muted-foreground">Advanced features</p>
            </div>
            <div className="p-4 border rounded-lg glass">
              <h4 className="font-semibold">Enterprise</h4>
              <p className="text-2xl font-bold">$49.99/mo</p>
              <p className="text-sm text-muted-foreground">Full access</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Monitor payment activity and transaction status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent transactions</p>
            <p className="text-sm">Payment data will appear here once configured</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayPalSettings;
