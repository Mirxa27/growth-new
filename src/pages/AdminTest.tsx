import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const AdminTest = () => {
  const { user, isAdmin, loading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runAdminTests = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    const results: any = {};

    try {
      // Test 1: Profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      results.profileExists = !profileError;
      results.profileData = profile;
      results.profileError = profileError?.message;

      // Test 2: Admin role check
      results.hasAdminRole = profile?.role === 'admin';
      results.hasAdminFlag = profile?.is_admin === true;
      results.adminViaMetadata = user.user_metadata?.role === 'admin';
      results.adminViaEmail = user.email === 'admin@newomen.me';

      // Test 3: Admin table access
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_ai_providers')
          .select('*')
          .limit(1);
        
        results.canAccessAdminTables = !adminError;
        results.adminTableError = adminError?.message;
      } catch (adminTestError) {
        results.canAccessAdminTables = false;
        results.adminTableError = 'Admin table access failed';
      }

      setProfileData(profile);
      setTestResults(results);
    } catch (error) {
      console.error('Admin test failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      runAdminTests();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading admin test...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please login to test admin access
            </p>
            <Button 
              className="w-full mt-4"
              onClick={() => window.location.href = '/auth'}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Admin Access Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Current Admin Status:</span>
                <Badge variant={isAdmin ? "default" : "destructive"}>
                  {isAdmin ? "ADMIN" : "NOT ADMIN"}
                </Badge>
              </div>
              
              <Button 
                onClick={runAdminTests}
                disabled={isRefreshing}
                className="w-full"
              >
                {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Refresh Admin Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>User Metadata:</strong> {JSON.stringify(user.user_metadata, null, 2)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Data</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData ? (
              <div className="space-y-2">
                <div><strong>Role:</strong> {profileData.role}</div>
                <div><strong>Is Admin Flag:</strong> {String(profileData.is_admin)}</div>
                <div><strong>Email:</strong> {profileData.email}</div>
                <div><strong>Created:</strong> {profileData.created_at}</div>
                <div><strong>Updated:</strong> {profileData.updated_at}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">No profile data loaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Profile Exists:</span>
                <StatusIcon status={testResults.profileExists} />
              </div>
              <div className="flex items-center justify-between">
                <span>Has Admin Role:</span>
                <StatusIcon status={testResults.hasAdminRole} />
              </div>
              <div className="flex items-center justify-between">
                <span>Has Admin Flag:</span>
                <StatusIcon status={testResults.hasAdminFlag} />
              </div>
              <div className="flex items-center justify-between">
                <span>Admin via Metadata:</span>
                <StatusIcon status={testResults.adminViaMetadata} />
              </div>
              <div className="flex items-center justify-between">
                <span>Admin via Email:</span>
                <StatusIcon status={testResults.adminViaEmail} />
              </div>
              <div className="flex items-center justify-between">
                <span>Can Access Admin Tables:</span>
                <StatusIcon status={testResults.canAccessAdminTables} />
              </div>
              
              {testResults.profileError && (
                <div className="text-red-500 text-sm">
                  Profile Error: {testResults.profileError}
                </div>
              )}
              
              {testResults.adminTableError && (
                <div className="text-red-500 text-sm">
                  Admin Table Error: {testResults.adminTableError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin'}
                disabled={!isAdmin}
              >
                {isAdmin ? 'Go to Admin Panel' : 'Admin Panel (Access Denied)'}
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/auth'}
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTest;