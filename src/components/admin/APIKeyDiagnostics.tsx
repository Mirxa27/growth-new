import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { env } from '@/config/environment';

const APIKeyDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const results: any = {};

    // 1. Check environment variable
    const apiKey = env.openai.apiKey;
    results.envVarExists = !!apiKey;
    results.apiKeyFormat = apiKey?.startsWith('sk-') || false;
    results.apiKeyLength = apiKey?.length || 0;
    results.apiKeyPrefix = apiKey?.substring(0, 7) || 'Not found';

    // 2. Check import.meta.env directly
    results.directEnvCheck = !!import.meta.env.VITE_OPENAI_API_KEY;
    results.allEnvVars = Object.keys(import.meta.env)
      .filter(k => k.startsWith('VITE_'))
      .map(k => {
        if (k.includes('KEY') || k.includes('SECRET')) {
          return `${k}: ${import.meta.env[k]?.substring(0, 7)}...`;
        }
        return `${k}: ${import.meta.env[k]}`;
      });

    // 3. Test API if key exists
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        results.apiStatus = response.status;
        results.apiStatusText = response.statusText;
        
        if (response.ok) {
          const data = await response.json();
          results.apiSuccess = true;
          results.modelsCount = data.data?.length || 0;
          results.hasGPT4 = data.data?.some((m: any) => m.id.includes('gpt-4'));
        } else {
          const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
          results.apiSuccess = false;
          results.apiError = error.error?.message || response.statusText;
        }
      } catch (err: any) {
        results.apiSuccess = false;
        results.apiError = err.message;
        results.networkError = true;
      }
    } else {
      results.apiSuccess = false;
      results.apiError = 'No API key found';
    }

    // 4. Check browser storage
    results.localStorage = {
      hasKey: !!localStorage.getItem('openai_api_key'),
      keyPrefix: localStorage.getItem('openai_api_key')?.substring(0, 7)
    };

    // 5. Check if running in production
    results.environment = {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL
    };

    setDiagnostics(results);
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Diagnostics
          </span>
          <Button onClick={runDiagnostics} disabled={testing} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Rerun
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variable Check */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            {getStatusIcon(diagnostics.envVarExists)}
            Environment Variable
          </h3>
          <div className="pl-6 space-y-1 text-sm">
            <div>Exists: <Badge variant={diagnostics.envVarExists ? 'default' : 'destructive'}>
              {diagnostics.envVarExists ? 'Yes' : 'No'}
            </Badge></div>
            <div>Format Valid: <Badge variant={diagnostics.apiKeyFormat ? 'default' : 'destructive'}>
              {diagnostics.apiKeyFormat ? 'Yes (sk-...)' : 'No'}
            </Badge></div>
            <div>Length: {diagnostics.apiKeyLength} characters</div>
            <div>Prefix: <code>{diagnostics.apiKeyPrefix}</code></div>
          </div>
        </div>

        {/* Direct Environment Check */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            {getStatusIcon(diagnostics.directEnvCheck)}
            Direct Environment Check
          </h3>
          <div className="pl-6 space-y-1 text-sm">
            <div>import.meta.env.VITE_OPENAI_API_KEY: {diagnostics.directEnvCheck ? '✅ Found' : '❌ Not Found'}</div>
            {diagnostics.allEnvVars && (
              <details>
                <summary className="cursor-pointer text-muted-foreground">All VITE_ variables ({diagnostics.allEnvVars.length})</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {diagnostics.allEnvVars.join('\n')}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* API Test */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            {getStatusIcon(diagnostics.apiSuccess)}
            OpenAI API Test
          </h3>
          <div className="pl-6 space-y-1 text-sm">
            <div>Status: <Badge variant={diagnostics.apiSuccess ? 'default' : 'destructive'}>
              {diagnostics.apiStatus || 'Not tested'}
            </Badge></div>
            {diagnostics.apiSuccess ? (
              <>
                <div>Models Available: {diagnostics.modelsCount}</div>
                <div>GPT-4 Access: {diagnostics.hasGPT4 ? '✅' : '❌'}</div>
              </>
            ) : (
              <div className="text-red-500">Error: {diagnostics.apiError}</div>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="space-y-2">
          <h3 className="font-medium">Environment</h3>
          <div className="pl-6 space-y-1 text-sm">
            <div>Mode: <Badge>{diagnostics.environment?.mode}</Badge></div>
            <div>Development: {diagnostics.environment?.dev ? 'Yes' : 'No'}</div>
            <div>Production: {diagnostics.environment?.prod ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Troubleshooting */}
        {!diagnostics.apiSuccess && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting Steps:</strong>
              <ol className="mt-2 ml-4 space-y-1 list-decimal">
                {!diagnostics.envVarExists && (
                  <>
                    <li>Create a <code>.env</code> file in the project root</li>
                    <li>Add: <code>VITE_OPENAI_API_KEY=sk-your-key-here</code></li>
                    <li>Restart the development server</li>
                  </>
                )}
                {diagnostics.envVarExists && !diagnostics.apiKeyFormat && (
                  <li>Your API key should start with "sk-". Get a valid key from OpenAI dashboard.</li>
                )}
                {diagnostics.apiStatus === 401 && (
                  <>
                    <li>Your API key is invalid or expired</li>
                    <li>Check your OpenAI dashboard: https://platform.openai.com/api-keys</li>
                    <li>Ensure you have active billing: https://platform.openai.com/account/billing</li>
                  </>
                )}
                {diagnostics.networkError && (
                  <li>Network error - check your internet connection or firewall settings</li>
                )}
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {diagnostics.apiSuccess && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <strong>✅ API Key is working correctly!</strong>
              <p className="mt-1">Your OpenAI integration is properly configured.</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default APIKeyDiagnostics;