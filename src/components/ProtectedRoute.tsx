import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  fallbackPath = '/auth'
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Store the intended destination for redirect after login
        sessionStorage.setItem('redirectAfterLogin', location.pathname);
        
        // Set a timeout to show retry option if redirect doesn't happen
        const timeout = setTimeout(() => {
          setShowRetry(true);
        }, 3000);
        setRedirectTimeout(timeout);
        
        navigate(fallbackPath, { replace: true });
      } else if (requireAdmin && !isAdmin) {
        // User is authenticated but doesn't have admin privileges
        navigate('/dashboard', { replace: true });
      } else {
        // Clear any existing timeout
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
          setRedirectTimeout(null);
        }
        setShowRetry(false);
      }
    }

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [user, loading, isAdmin, requireAdmin, navigate, location.pathname, fallbackPath, redirectTimeout]);

  // Loading state with better UX
  if (loading) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 p-4">
        <div className="text-center space-y-4 max-w-md">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading your space...</h3>
            <p className="text-sm text-muted-foreground">
              We're preparing your personalized experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error state
  if (!user) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">
              You need to sign in to access this page
            </p>
          </div>
          
          {showRetry && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you're not redirected automatically, please sign in manually.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin access error state
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              This area is only available to administrators
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};