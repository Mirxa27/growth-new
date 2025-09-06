/**
 * Performance Dashboard Component
 * Real-time Web Vitals monitoring and performance insights
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Gauge, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp,
  X,
  Zap
} from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import type { EnhancedMetric } from '@/utils/webVitals';

interface MetricCardProps {
  metric: EnhancedMetric | undefined;
  name: string;
  description: string;
  unit?: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, name, description, unit = 'ms', icon }) => {
  if (!metric) {
    return (
      <Card className="opacity-60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            {icon}
            <span className="ml-2">{name}</span>
          </CardTitle>
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-400">--</div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-3 h-3" />;
      case 'needs-improvement': return <Clock className="w-3 h-3" />;
      case 'poor': return <AlertTriangle className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          {icon}
          <span className="ml-2">{name}</span>
        </CardTitle>
        <Badge variant="outline" className={`${getRatingColor(metric.rating)} border-0`}>
          {getRatingIcon(metric.rating)}
          <span className="ml-1 text-xs font-medium">{metric.rating}</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {unit === 'ms' ? metric.value.toFixed(0) : metric.value.toFixed(3)}
          <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
        <div className="text-xs text-gray-400 mt-2">
          Updated {new Date(metric.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

const AlertItem: React.FC<{ 
  alert: any; 
  onDismiss: (id: string) => void; 
}> = ({ alert, onDismiss }) => {
  const isError = alert.type === 'error';
  
  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      isError ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {isError ? (
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
          ) : (
            <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              isError ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {alert.metric} Performance Issue
            </p>
            <p className={`text-xs ${
              isError ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {alert.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(alert.id)}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

interface PerformanceDashboardProps {
  className?: string;
  reportingEndpoint?: string;
  enableAlerts?: boolean;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  reportingEndpoint,
  enableAlerts = true,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    metrics,
    summary,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    dismissAlert,
    refreshSummary,
    hasAlerts,
    errorAlerts,
    warningAlerts,
    coreWebVitals,
  } = usePerformanceMonitor({
    enableAlerts,
    reportingEndpoint,
    autoStart: true,
  });

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const overallScore = React.useMemo(() => {
    const vitals = Object.values(coreWebVitals).filter(Boolean);
    if (vitals.length === 0) return 0;
    
    const scores = vitals.map(vital => {
      switch (vital?.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 30;
        default: return 0;
      }
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [coreWebVitals]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Monitor</h2>
          <p className="text-gray-600">Real-time Web Vitals and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Monitoring' : 'Paused'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshSummary}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMonitoring}>
            {isMonitoring ? 'Pause' : 'Start'}
          </Button>
          <Button variant="outline" size="sm" onClick={clearMetrics}>
            Clear
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gauge className="w-5 h-5 mr-2" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    overallScore >= 80 ? 'bg-green-500' : 
                    overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Based on Core Web Vitals performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {hasAlerts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Performance Alerts
              </span>
              <Badge variant="destructive">
                {errorAlerts.length} critical, {warningAlerts.length} warnings
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 10).map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onDismiss={dismissAlert}
                />
              ))}
              {alerts.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  and {alerts.length - 10} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Core Web Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              metric={coreWebVitals.LCP}
              name="LCP"
              description="Largest Contentful Paint - Main content loading speed"
              icon={<Eye className="w-4 h-4" />}
            />
            <MetricCard
              metric={coreWebVitals.FID}
              name="FID"
              description="First Input Delay - Interactivity responsiveness"
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              metric={coreWebVitals.CLS}
              name="CLS"
              description="Cumulative Layout Shift - Visual stability"
              icon={<Activity className="w-4 h-4" />}
              unit=""
            />
            <MetricCard
              metric={coreWebVitals.FCP}
              name="FCP"
              description="First Contentful Paint - Initial render speed"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <MetricCard
              metric={coreWebVitals.TTFB}
              name="TTFB"
              description="Time to First Byte - Server response time"
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* All Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metrics).map(([name, metric]) => (
              <MetricCard
                key={name}
                metric={metric}
                name={name}
                description={`${name} performance metric`}
                icon={<Activity className="w-4 h-4" />}
                unit={name === 'CLS' ? '' : 'ms'}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(summary).map(([metricName, data]) => (
                    <div key={metricName} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{metricName}</span>
                      <div className="text-right">
                        <div className="text-sm">
                          Avg: {data.average?.toFixed(1) || 0}
                          {metricName === 'CLS' ? '' : 'ms'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.count} measurements
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(coreWebVitals).map(([name, metric]) => {
                    if (!metric || metric.rating === 'good') return null;
                    
                    const recommendations = {
                      LCP: 'Optimize images, improve server response times, eliminate render-blocking resources',
                      FID: 'Optimize JavaScript execution, break up long tasks, use a web worker',
                      CLS: 'Use explicit sizes for images/videos, avoid inserting content above existing content',
                      FCP: 'Eliminate render-blocking resources, minify CSS, improve server response times',
                      TTFB: 'Optimize server-side processing, use a CDN, upgrade hosting',
                    };

                    return (
                      <div key={name} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm text-gray-900">
                          Improve {name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {recommendations[name as keyof typeof recommendations]}
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.values(coreWebVitals).every(metric => !metric || metric.rating === 'good') && (
                    <div className="text-center py-6">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Great job! All Core Web Vitals are performing well.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;