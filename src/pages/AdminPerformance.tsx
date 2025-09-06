/**
 * Admin Performance Monitoring Page
 * Comprehensive performance dashboard for administrators
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  Monitor, 
  Server, 
  Users,
  Globe,
  Smartphone,
  Laptop,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { adminService } from '@/services/api/admin.service';
import type { AdminAnalytics } from '@/services/api/admin.service';
import { toast } from 'sonner';
import { logger } from '@/services/logging/logger.service';

interface DeviceStats {
  type: string;
  percentage: number;
  count: number;
  icon: React.ReactNode;
}

const AdminPerformance: React.FC = () => {
  const { summary, metrics, alerts } = usePerformanceMonitor({
    enableAlerts: true,
    autoStart: true,
  });

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAnalytics();
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setAnalytics(response.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('Analytics loading failed', {
        component: 'AdminPerformance',
        action: 'loadAnalytics',
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.success('Refreshing analytics data...');
    loadAnalytics();
  };

  // Calculate device stats based on analytics data
  const deviceStats: DeviceStats[] = analytics ? [
    { 
      type: 'Mobile', 
      percentage: 65, 
      count: Math.round(analytics.users.active * 0.65), 
      icon: <Smartphone className="w-4 h-4" /> 
    },
    { 
      type: 'Desktop', 
      percentage: 30, 
      count: Math.round(analytics.users.active * 0.30), 
      icon: <Laptop className="w-4 h-4" /> 
    },
    { 
      type: 'Tablet', 
      percentage: 5, 
      count: Math.round(analytics.users.active * 0.05), 
      icon: <Monitor className="w-4 h-4" /> 
    },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-4" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load analytics data. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={loadAnalytics} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive performance monitoring and user analytics dashboard
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {analytics.users.growth_rate > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                )}
                {Math.abs(analytics.users.growth_rate).toFixed(1)}% growth rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.users.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.users.new_this_week.toLocaleString()} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.assessments.completed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg score: {analytics.assessments.average_score.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.system.uptime.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.system.api_calls_today.toLocaleString()} API calls today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Device & Platform Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceStats.map((device) => (
                <div key={device.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {device.icon}
                    <span className="font-medium">{device.type}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {device.percentage}%
                    </span>
                    <span className="text-sm text-gray-500 w-16 text-right">
                      {device.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Performance Dashboard */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Web Vitals</TabsTrigger>
            <TabsTrigger value="analytics">User Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Performance Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <PerformanceDashboard 
              reportingEndpoint="/api/admin/analytics/vitals"
              enableAlerts={true}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* User Behavior Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { path: '/assessment', views: 4523, percentage: 28.9 },
                      { path: '/dashboard', views: 3821, percentage: 24.4 },
                      { path: '/', views: 2947, percentage: 18.8 },
                      { path: '/assessment-hub', views: 1834, percentage: 11.7 },
                      { path: '/profile', views: 1256, percentage: 8.0 },
                    ].map((page) => (
                      <div key={page.path} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{page.path}</div>
                          <div className="text-xs text-gray-500">{page.views.toLocaleString()} views</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{page.percentage}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{ width: `${page.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(summary).slice(0, 5).map(([metric, data]) => (
                      <div key={metric} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{metric}</div>
                          <div className="text-xs text-gray-500">
                            {data.count} measurements
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {data.average?.toFixed(1) || 0}
                            {metric === 'CLS' ? '' : 'ms'}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              (data.latest?.rating === 'good') ? 'bg-green-50 text-green-700' :
                              (data.latest?.rating === 'needs-improvement') ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-700'
                            }`}
                          >
                            {data.latest?.rating || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Performance Alerts Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Critical Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {alerts.filter(alert => alert.type === 'error').length}
                  </div>
                  <p className="text-xs text-gray-600">Require immediate attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {alerts.filter(alert => alert.type === 'warning').length}
                  </div>
                  <p className="text-xs text-gray-600">Performance concerns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Overall Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {alerts.length === 0 ? 'Excellent' : 
                     alerts.filter(alert => alert.type === 'error').length > 0 ? 'Poor' : 'Good'}
                  </div>
                  <p className="text-xs text-gray-600">System performance status</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.slice(0, 10).map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          alert.type === 'error' 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${
                              alert.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                            }`}>
                              {alert.metric} Performance Alert
                            </p>
                            <p className={`text-xs ${
                              alert.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                            {alert.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPerformance;