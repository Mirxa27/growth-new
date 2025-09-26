import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'

interface AuditLogEntry {
  id: string
  user_id?: string
  action_type: string
  resource_type: string
  resource_id?: string
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: string
  error_message?: string
  created_at: string
  user_email?: string
}

interface AuditFilters {
  user_id?: string
  action_type?: string
  resource_type?: string
  status?: string
  date_range?: {
    from: Date
    to: Date
  }
  search?: string
}

const actionTypeIcons: Record<string, React.ComponentType<any>> = {
  create: Activity,
  update: Settings,
  delete: AlertTriangle,
  read: Eye,
  login: User,
  logout: User,
  assign: Activity,
  remove: AlertTriangle,
  terminate: AlertTriangle,
  audit: Shield
}

const statusColors: Record<string, string> = {
  success: 'default',
  failed: 'destructive',
  warning: 'secondary'
}

const statusIcons: Record<string, React.ComponentType<any>> = {
  success: CheckCircle,
  failed: XCircle,
  warning: AlertTriangle,
  pending: Clock
}

export function AuditTrailSystem() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [isExporting, setIsExporting] = useState(false)

  // Available filter options
  const actionTypes = ['create', 'update', 'delete', 'read', 'login', 'logout', 'assign', 'remove', 'terminate', 'audit']
  const resourceTypes = ['user', 'role', 'permission', 'assessment', 'content', 'system', 'security', 'billing']
  const statuses = ['success', 'failed', 'warning']

  useEffect(() => {
    fetchAuditLogs()
  }, [page, pageSize, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(email)
        `, { count: 'exact' })

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type)
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.from.toISOString())
          .lte('created_at', filters.date_range.to.toISOString())
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      // Transform data to include user email
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        user_email: log.profiles?.email
      }))

      setAuditLogs(transformedData)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        const csvContent = convertToCSV(data)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: any[]) => {
    const headers = [
      'ID', 'User Email', 'Action Type', 'Resource Type', 'Resource ID',
      'Description', 'Status', 'IP Address', 'Created At'
    ]

    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        row.user_email || '',
        row.action_type,
        row.resource_type,
        row.resource_id || '',
        `"${row.description.replace(/"/g, '""')}"`,
        row.status,
        row.ip_address || '',
        row.created_at
      ].join(','))
    ]

    return csvRows.join('\n')
  }

  const applyFilters = (newFilters: Partial<AuditFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const getActionIcon = (actionType: string) => {
    const Icon = actionTypeIcons[actionType] || Activity
    return <Icon className="w-4 h-4" />
  }

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status] || Clock
    return <Icon className="w-4 h-4" />
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Trail System</h2>
          <p className="text-muted-foreground">
            Monitor all administrative actions and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchAuditLogs}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => log.status === 'success').length}
                </p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => log.status === 'failed').length}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => log.status === 'warning').length}
                </p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search || ''}
                  onChange={(e) => applyFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action-type">Action Type</Label>
              <Select
                value={filters.action_type || ''}
                onValueChange={(value) => applyFilters({ action_type: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resource-type">Resource Type</Label>
              <Select
                value={filters.resource_type || ''}
                onValueChange={(value) => applyFilters({ resource_type: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => applyFilters({ status: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="text-sm text-muted-foreground">
              Showing {auditLogs.length} of {totalCount.toLocaleString()} events
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
          <CardDescription>
            Recent administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{log.user_email || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action_type)}
                            <span className="capitalize">{log.action_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (ID: {log.resource_id.slice(0, 8)}...)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.status)}
                            <Badge variant={statusColors[log.status] as any}>
                              {log.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCount > pageSize && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}