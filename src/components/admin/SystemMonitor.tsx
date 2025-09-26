import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Zap,
  Database,
  Users,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

interface SystemMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  trend: 'up' | 'down' | 'stable'
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  responseTime: number
  lastCheck: string
  uptime: number
}

interface ActiveSession {
  id: string
  userId: string
  userEmail: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivity: string
  isCurrent: boolean
}

export function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Mock data - in real implementation, this would come from monitoring APIs
  const mockMetrics: SystemMetric[] = [
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trend: 'stable'
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 78,
      unit: '%',
      status: 'warning',
      timestamp: new Date().toISOString(),
      trend: 'up'
    },
    {
      id: 'disk',
      name: 'Disk Usage',
      value: 62,
      unit: '%',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trend: 'stable'
    },
    {
      id: 'database',
      name: 'Database Connections',
      value: 23,
      unit: '/100',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trend: 'down'
    },
    {
      id: 'api',
      name: 'API Response Time',
      value: 145,
      unit: 'ms',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trend: 'stable'
    },
    {
      id: 'bandwidth',
      name: 'Bandwidth',
      value: 2.3,
      unit: 'MB/s',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trend: 'up'
    }
  ]

  const mockServices: ServiceStatus[] = [
    {
      name: 'Web Server',
      status: 'online',
      responseTime: 45,
      lastCheck: new Date().toISOString(),
      uptime: 99.9
    },
    {
      name: 'Database',
      status: 'online',
      responseTime: 12,
      lastCheck: new Date().toISOString(),
      uptime: 99.8
    },
    {
      name: 'Redis Cache',
      status: 'online',
      responseTime: 3,
      lastCheck: new Date().toISOString(),
      uptime: 100
    },
    {
      name: 'Email Service',
      status: 'degraded',
      responseTime: 250,
      lastCheck: new Date().toISOString(),
      uptime: 95.2
    },
    {
      name: 'File Storage',
      status: 'online',
      responseTime: 78,
      lastCheck: new Date().toISOString(),
      uptime: 99.5
    }
  ]

  const mockSessions: ActiveSession[] = [
    {
      id: '1',
      userId: 'user1',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastActivity: new Date().toISOString(),
      isCurrent: true
    },
    {
      id: '2',
      userId: 'user2',
      userEmail: 'user@example.com',
      ipAddress: '192.168.1.101',
      userAgent: 'Firefox/119.0',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      lastActivity: new Date(Date.now() - 300000).toISOString(),
      isCurrent: false
    }
  ]

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMetrics(mockMetrics)
      setServices(mockServices)
      setSessions(mockSessions)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'default'
      case 'warning':
      case 'degraded':
        return 'secondary'
      case 'critical':
      case 'offline':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'critical':
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const overallHealth = services.every(s => s.status === 'online') ? 'healthy' :
                        services.some(s => s.status === 'offline') ? 'critical' : 'warning'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallHealth)}
            <span className="text-sm font-medium capitalize">
              Overall: {overallHealth}
            </span>
          </div>
          <Button
            onClick={fetchSystemData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Cpu className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {metrics.find(m => m.id === 'cpu')?.value || 0}%
                </p>
                <p className="text-xs text-muted-foreground">CPU Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {metrics.find(m => m.id === 'memory')?.value || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Memory Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {sessions.length}
                </p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wifi className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {services.filter(s => s.status === 'online').length}/{services.length}
                </p>
                <p className="text-xs text-muted-foreground">Services Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="services">Service Status</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {metric.id === 'cpu' && <Cpu className="w-4 h-4" />}
                      {metric.id === 'memory' && <HardDrive className="w-4 h-4" />}
                      {metric.id === 'disk' && <Database className="w-4 h-4" />}
                      {metric.id === 'database' && <Database className="w-4 h-4" />}
                      {metric.id === 'api' && <Globe className="w-4 h-4" />}
                      {metric.id === 'bandwidth' && <Wifi className="w-4 h-4" />}
                      {metric.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <Badge variant={getStatusColor(metric.status)} className="text-xs">
                        {metric.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value}{metric.unit}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(metric.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <Progress
                      value={metric.unit === '%' ? metric.value : Math.min(metric.value * 10, 100)}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Health Status</CardTitle>
              <CardDescription>
                Status of all system services and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Response: {service.responseTime}ms • Uptime: {service.uptime}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(service.lastCheck), 'HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Currently active user sessions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.isCurrent ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <h3 className="font-medium">{session.userEmail}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.ipAddress} • {session.userAgent.split(' ')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {format(new Date(session.lastActivity), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.createdAt), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last Refresh</p>
              <p className="font-medium">{format(lastRefresh, 'MMM dd, yyyy HH:mm:ss')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Services</p>
              <p className="font-medium">{services.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Metrics</p>
              <p className="font-medium">{metrics.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">System Status</p>
              <Badge variant={getStatusColor(overallHealth)} className="text-xs">
                {overallHealth.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}