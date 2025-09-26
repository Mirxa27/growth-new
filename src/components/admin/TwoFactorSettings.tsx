import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Mail,
  Key,
  Copy,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Trash2,
  LogOut
} from 'lucide-react'
import { twoFactorAuthService, type TOTPSetup, type TwoFactorStatus, type SessionInfo } from '@/services/auth/two-factor-auth.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function TwoFactorSettings() {
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [verifyToken, setVerifyToken] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const queryClient = useQueryClient()

  // Get 2FA status
  const { data: twoFactorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['twoFactorStatus'],
    queryFn: () => twoFactorAuthService.getTwoFactorStatus(),
  })

  // Get user sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => twoFactorAuthService.getUserSessions(),
  })

  // Generate TOTP setup
  const generateTOTPMutation = useMutation({
    mutationFn: () => twoFactorAuthService.generateTOTPSetup(),
    onSuccess: (data) => {
      if (data.setup) {
        setTotpSetup(data.setup)
      }
    }
  })

  // Enable TOTP
  const enableTOTPMutation = useMutation({
    mutationFn: (token: string) => twoFactorAuthService.enableTOTP(token),
    onSuccess: () => {
      setTotpSetup(null)
      setVerifyToken('')
      queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] })
    }
  })

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: (password: string) => twoFactorAuthService.disable2FA(password),
    onSuccess: () => {
      setDisablePassword('')
      queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] })
    }
  })

  // Regenerate backup codes
  const regenerateBackupCodesMutation = useMutation({
    mutationFn: (password: string) => twoFactorAuthService.regenerateBackupCodes(password),
    onSuccess: (data) => {
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
      }
    }
  })

  // Revoke session
  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => twoFactorAuthService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] })
    }
  })

  // Revoke all other sessions
  const revokeAllOtherSessionsMutation = useMutation({
    mutationFn: () => twoFactorAuthService.revokeAllOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] })
    }
  })

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'))
    }
  }

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length > 0) {
      const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'backup-codes.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (statusLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Settings</h2>
          <p className="text-muted-foreground">
            Manage two-factor authentication and session security
          </p>
        </div>
        <div className="flex items-center gap-2">
          {twoFactorStatus?.status?.enabled ? (
            <ShieldCheck className="w-6 h-6 text-green-600" />
          ) : (
            <ShieldX className="w-6 h-6 text-red-600" />
          )}
          <Badge variant={twoFactorStatus?.status?.enabled ? 'default' : 'destructive'}>
            2FA {twoFactorStatus?.status?.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="2fa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="2fa">Two-Factor Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="2fa" className="space-y-4">
          {/* 2FA Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication Status
              </CardTitle>
              <CardDescription>
                Current 2FA configuration and security status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {twoFactorStatus?.status?.enabled ? (
                      <ShieldCheck className="w-8 h-8 text-green-600" />
                    ) : (
                      <ShieldX className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <h3 className="font-medium">
                        {twoFactorStatus?.status?.enabled ? '2FA is Enabled' : '2FA is Disabled'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorStatus?.status?.enabled
                          ? `Method: ${twoFactorStatus.status.method?.toUpperCase()}`
                          : 'Add an extra layer of security to your account'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {twoFactorStatus?.status?.enabled ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <ShieldX className="w-4 h-4 mr-2" />
                            Disable 2FA
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to disable 2FA? This will make your account less secure.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="password">Confirm Password</Label>
                              <Input
                                id="password"
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Enter your password"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setDisablePassword('')}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => disable2FAMutation.mutate(disablePassword)}
                                disabled={!disablePassword || disable2FAMutation.isPending}
                              >
                                {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => generateTOTPMutation.mutate()}>
                            <Shield className="w-4 h-4 mr-2" />
                            Enable 2FA
                          </Button>
                        </DialogTrigger>
                        {totpSetup && (
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                              <DialogDescription>
                                Scan this QR code with your authenticator app
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                <img
                                  src={totpSetup.qrCodeUrl}
                                  alt="TOTP QR Code"
                                  className="w-48 h-48"
                                />
                              </div>
                              <div>
                                <Label>Manual Setup Key</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Input value={totpSetup.secret} readOnly />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(totpSetup.secret)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="verify-token">Verification Code</Label>
                                <Input
                                  id="verify-token"
                                  maxLength={6}
                                  value={verifyToken}
                                  onChange={(e) => setVerifyToken(e.target.value)}
                                  placeholder="Enter 6-digit code"
                                />
                              </div>
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Make sure to save your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
                                </AlertDescription>
                              </Alert>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setTotpSetup(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => enableTOTPMutation.mutate(verifyToken)}
                                  disabled={verifyToken.length !== 6 || enableTOTPMutation.isPending}
                                >
                                  {enableTOTPMutation.isPending ? 'Verifying...' : 'Enable 2FA'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}
                  </div>
                </div>

                {twoFactorStatus?.status?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Key className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Backup Codes</p>
                            <p className="text-sm text-muted-foreground">
                              {twoFactorStatus.status.backupCodesRemaining} remaining
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Last Used</p>
                            <p className="text-sm text-muted-foreground">
                              {twoFactorStatus.status.lastUsed
                                ? new Date(twoFactorStatus.status.lastUsed).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Regenerate</p>
                            <p className="text-sm text-muted-foreground">Generate new backup codes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backup Codes Management */}
          {twoFactorStatus?.status?.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Backup Codes
                </CardTitle>
                <CardDescription>
                  Generate and manage your backup codes for account recovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Backup Codes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Regenerate Backup Codes</DialogTitle>
                        <DialogDescription>
                          This will invalidate all existing backup codes and generate new ones.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setDisablePassword('')}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => regenerateBackupCodesMutation.mutate(disablePassword)}
                            disabled={!disablePassword || regenerateBackupCodesMutation.isPending}
                          >
                            {regenerateBackupCodesMutation.isPending ? 'Generating...' : 'Regenerate'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {backupCodes.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        New backup codes generated! Save them in a safe place.
                      </AlertDescription>
                    </Alert>
                  )}

                  {(backupCodes.length > 0 || showBackupCodes) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Your Backup Codes</Label>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={handleCopyBackupCodes}>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadBackupCodes}>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={backupCodes.join('\n')}
                        readOnly
                        rows={5}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {sessions?.sessions?.length || 0} active session(s)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeAllOtherSessionsMutation.mutate()}
                    disabled={revokeAllOtherSessionsMutation.isPending}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out All Other Sessions
                  </Button>
                </div>

                <div className="space-y-2">
                  {sessions?.sessions?.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Monitor className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium">{session.device}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.ipAddress} • Last active: {new Date(session.lastActivity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.isCurrent && (
                          <Badge variant="default">Current</Badge>
                        )}
                        {!session.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeSessionMutation.mutate(session.id)}
                            disabled={revokeSessionMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}