import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-20" 
           style={{ backgroundImage: 'url(/lovable-uploads/3ca516cd-6dbf-4a00-831a-85462d71db33.png)' }} />
      
      <Card className="w-full max-w-md glass-card border-glass relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {isSignUp ? 'Join Newomen' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? 'Start your journey of self-discovery and empowerment' 
              : 'Continue your path to personal growth'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="glass-input"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full glass-button"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>
          
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground glass-bg">
                OR
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <Button
              variant="link"
              onClick={toggleMode}
              className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;