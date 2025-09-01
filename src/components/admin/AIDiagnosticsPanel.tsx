import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Settings,
  Wifi,
  Database,
  Key,
  Mic,
  Globe,
  Copy,
  FileText
} from 'lucide-react';
import { aiDiagnostics, type DiagnosticResult } from '@/utils/ai-diagnostics';
import { useToast } from '@/hooks/use-toast';

export const AIDiagnosticsPanel: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Auto-run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const diagnosticResults = await aiDiagnostics.runFullDiagnostics();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(diagnosticResults);

      const errors = diagnosticResults.filter(r => r.status === 'error');
      if (errors.length > 0) {
        toast({
          title: "Diagnostics Complete",
          description: `Found ${errors.length} issue(s) that need attention`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnostics Complete",
          description: "All systems operational",
        });
      }
    } catch (error) {
      toast({
        title: "Diagnostic Error",
        description: "Failed to run diagnostics",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const exportResults = () => {
    const json = aiDiagnostics.exportResults();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-diagnostics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Diagnostic results exported successfully"
    });
  };

  const copyEnvTemplate = () => {
    const template = `# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE
VITE_OPENAI_ORGANIZATION_ID=

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Feature Flags
VITE_ENABLE_VOICE_CHAT=true
VITE_ENABLE_AI_ASSESSMENT=true

# Application
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="Life Navigation System"`;

    navigator.clipboard.writeText(template);
    toast({
      title: "Copied",
      description: ".env template copied to clipboard"
    });
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Environment': return <Settings className="h-4 w-4" />;
      case 'OpenAI': return <Key className="h-4 w-4" />;
      case 'Supabase': return <Database className="h-4 w-4" />;
      case 'Voice Agent': return <Mic className="h-4 w-4" />;
      case 'Network': return <Wifi className="h-4 w-4" />;
      case 'Browser': return <Globe className="h-4 w-4" />;
      case 'Database': return <Database className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>);

  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">AI Provider Diagnostics</CardTitle>
              <CardDescription>
                Comprehensive analysis of AI configuration and connectivity
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyEnvTemplate}
                variant="outline"
                size="sm"
                className="glass"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy .env Template
              </Button>
              <Button
                onClick={exportResults}
                variant="outline"
                size="sm"
                className="glass"
                disabled={results.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="bg-gradient-primary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Running...' : 'Run Diagnostics'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isRunning && (
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        )}
      </Card>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-500">{successCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Setup Guide */}
      {errorCount > 0 && (
        <Alert variant="destructive" className="glass-card">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>To enable AI features, please complete the following steps:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Create a <code className="text-xs bg-black/20 px-1 py-0.5 rounded">.env</code> file in your project root</li>
              <li>Add your OpenAI API key: <code className="text-xs bg-black/20 px-1 py-0.5 rounded">VITE_OPENAI_API_KEY=sk-...</code></li>
              <li>Ensure Supabase credentials are correct</li>
              <li>Restart your development server</li>
            </ol>
            <div className="mt-3">
              <Button 
                onClick={copyEnvTemplate} 
                size="sm" 
                variant="outline"
                className="glass"
              >
                <FileText className="h-3 w-3 mr-2" />
                Copy .env Template
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Tabs defaultValue={Object.keys(groupedResults)[0]} className="space-y-4">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 glass">
            {Object.keys(groupedResults).map(category => {
              const categoryResults = groupedResults[category];
              const hasErrors = categoryResults.some(r => r.status === 'error');
              const hasWarnings = categoryResults.some(r => r.status === 'warning');
              
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="relative"
                >
                  <span className="flex items-center gap-1">
                    {getIconForCategory(category)}
                    <span className="hidden lg:inline">{category}</span>
                  </span>
                  {hasErrors && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                  {!hasErrors && hasWarnings && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {Object.entries(groupedResults).map(([category, categoryResults]) => (
            <TabsContent key={category} value={category} className="space-y-3">
              {categoryResults.map((result, index) => (
                <Card 
                  key={index} 
                  className={`glass-card ${
                    result.status === 'error' ? 'border-red-500/30' :
                    result.status === 'warning' ? 'border-yellow-500/30' :
                    'border-green-500/30'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">{result.message}</p>
                        
                        {result.fix && (
                          <Alert className="glass-card">
                            <AlertDescription className="text-sm">
                              <strong>Fix:</strong> {result.fix}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {result.details && (
                          <details className="cursor-pointer">
                            <summary className="text-sm text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-black/20 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <Badge 
                        variant={
                          result.status === 'error' ? 'destructive' :
                          result.status === 'warning' ? 'secondary' :
                          'default'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Empty State */}
      {!isRunning && results.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Click "Run Diagnostics" to analyze your AI configuration
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};