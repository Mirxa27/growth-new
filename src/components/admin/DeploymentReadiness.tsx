import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Download,
  Copy,
  Rocket,
  Shield,
  Zap,
  Smartphone,
  Database,
  Key,
  FileCode,
  Terminal
} from 'lucide-react';
import { deploymentService, type DeploymentReport } from '@/services/deployment/deployment.service';
import { useToast } from '@/hooks/use-toast';

export const DeploymentReadiness: React.FC = () => {
  const [report, setReport] = useState<DeploymentReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const runDeploymentCheck = async () => {
    setIsChecking(true);
    try {
      const deploymentReport = await deploymentService.runDeploymentCheck();
      setReport(deploymentReport);
      
      if (deploymentReport.ready) {
        toast({
          title: "Ready for Deployment! 🚀",
          description: `Score: ${deploymentReport.score}/100. All critical checks passed.`,
        });
      } else {
        toast({
          title: "Not Ready for Deployment",
          description: `Score: ${deploymentReport.score}/100. Please fix critical issues.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Failed to run deployment check",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDeploymentCheck();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const downloadScript = () => {
    const script = deploymentService.generateDeploymentScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadEnvTemplate = () => {
    const template = deploymentService.generateEnvTemplate();
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.production';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIconForCategory = (name: string) => {
    if (name.includes('Environment')) return <FileCode className="h-4 w-4" />;
    if (name.includes('API')) return <Key className="h-4 w-4" />;
    if (name.includes('Database')) return <Database className="h-4 w-4" />;
    if (name.includes('Security')) return <Shield className="h-4 w-4" />;
    if (name.includes('Performance')) return <Zap className="h-4 w-4" />;
    if (name.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    if (name.includes('AI')) return <Rocket className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getCategoryBadgeVariant = (category: string): "default" | "secondary" | "destructive" => {
    switch (category) {
      case 'critical': return 'destructive';
      case 'important': return 'secondary';
      default: return 'default';
    }
  };

  if (!report && !isChecking) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No deployment report available</p>
          <Button onClick={runDeploymentCheck} className="mt-4 bg-gradient-primary">
            Run Deployment Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-6 w-6" />
                Deployment Readiness
              </CardTitle>
              <CardDescription>
                Production deployment checklist and validation
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadEnvTemplate}
                variant="outline"
                size="sm"
                className="glass"
              >
                <Download className="h-4 w-4 mr-2" />
                .env Template
              </Button>
              <Button
                onClick={downloadScript}
                variant="outline"
                size="sm"
                className="glass"
              >
                <Terminal className="h-4 w-4 mr-2" />
                Deploy Script
              </Button>
              <Button
                onClick={runDeploymentCheck}
                disabled={isChecking}
                className="bg-gradient-primary"
              >
                {isChecking ? 'Checking...' : 'Re-run Check'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {report && (
        <>
          {/* Score Card */}
          <Card className={`glass-card ${report.ready ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Deployment Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">
                      {report.score}
                      <span className="text-xl text-muted-foreground">/100</span>
                    </div>
                    <Badge 
                      variant={report.ready ? 'default' : 'destructive'}
                      className="text-lg px-4 py-1"
                    >
                      {report.ready ? 'Ready to Deploy' : 'Not Ready'}
                    </Badge>
                  </div>
                </div>
                <div className="w-32 h-32">
                  <Progress 
                    value={report.score} 
                    className="h-3"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {report.score >= 80 ? 'Excellent' : report.score >= 60 ? 'Good' : 'Needs Work'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checks Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical</p>
                    <p className="text-2xl font-bold">
                      {report.checks.filter(c => c.category === 'critical' && c.passed).length}
                      <span className="text-sm text-muted-foreground">
                        /{report.checks.filter(c => c.category === 'critical').length}
                      </span>
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Important</p>
                    <p className="text-2xl font-bold">
                      {report.checks.filter(c => c.category === 'important' && c.passed).length}
                      <span className="text-sm text-muted-foreground">
                        /{report.checks.filter(c => c.category === 'important').length}
                      </span>
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Optional</p>
                    <p className="text-2xl font-bold">
                      {report.checks.filter(c => c.category === 'optional' && c.passed).length}
                      <span className="text-sm text-muted-foreground">
                        /{report.checks.filter(c => c.category === 'optional').length}
                      </span>
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Alert variant="destructive" className="glass-card">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="space-y-1 mt-2">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Checks */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-4 glass">
              <TabsTrigger value="all">All Checks</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="important">Important</TabsTrigger>
              <TabsTrigger value="optional">Optional</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {report.checks.map((check, index) => (
                <Card 
                  key={index}
                  className={`glass-card ${
                    check.passed ? 'border-green-500/30' : 
                    check.category === 'critical' ? 'border-red-500/30' : 
                    'border-yellow-500/30'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {check.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getIconForCategory(check.name)}
                          <h4 className="font-medium">{check.name}</h4>
                          <Badge variant={getCategoryBadgeVariant(check.category)}>
                            {check.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                        {check.details && (
                          <details className="mt-2 cursor-pointer">
                            <summary className="text-sm text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-black/20 rounded text-xs overflow-x-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {['critical', 'important', 'optional'].map(category => (
              <TabsContent key={category} value={category} className="space-y-3">
                {report.checks
                  .filter(c => c.category === category)
                  .map((check, index) => (
                    <Card 
                      key={index}
                      className={`glass-card ${
                        check.passed ? 'border-green-500/30' : 
                        check.category === 'critical' ? 'border-red-500/30' : 
                        'border-yellow-500/30'
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {check.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getIconForCategory(check.name)}
                              <h4 className="font-medium">{check.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{check.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* Deployment Steps */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Deployment Steps</CardTitle>
              <CardDescription>Follow these steps to deploy to production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Fix all critical issues</p>
                    <p className="text-sm text-muted-foreground">
                      Resolve any failing critical checks before proceeding
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Build for production</p>
                    <code className="text-sm bg-black/20 px-2 py-1 rounded">npm run build</code>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Configure environment variables</p>
                    <p className="text-sm text-muted-foreground">
                      Set all production environment variables in your hosting platform
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Deploy to hosting service</p>
                    <p className="text-sm text-muted-foreground">
                      Upload the dist folder to Vercel, Netlify, or your preferred host
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    5
                  </span>
                  <div>
                    <p className="font-medium">Verify deployment</p>
                    <p className="text-sm text-muted-foreground">
                      Test all critical features in production environment
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};