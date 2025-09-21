import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { email, password } = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const { error } = await signIn(email as string, password as string);
      if (error) throw error;
      toast({ title: "Success", description: "Signed in successfully." });
      
      // Check for redirect destination
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath && redirectPath !== '/auth') {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { name, email, password } = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const { error } = await signUp({
        email: email as string,
        password: password as string,
        options: {
          data: {
            display_name: name as string, // Correctly pass display_name
          }
        }
      });
      if (error) throw error;
      toast({ title: "Success", description: "Account created. Please check your email to verify." });
    } catch (error: any) {
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe flex items-center justify-center bg-gradient-to-br from-primary-100 via-background to-secondary/5 p-4 sm:p-6">
      <Tabs defaultValue="sign-in" className="w-full max-w-[400px]">
        <TabsList className="grid w-full grid-cols-2 touch-target-large">
          <TabsTrigger value="sign-in" className="touch-target">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up" className="touch-target">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" name="email" type="email" placeholder="m@example.com" required className="glass-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-in">Password</Label>
                  <Input id="password-in" name="password" type="password" required className="glass-input" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-primary touch-target-large" size="lg" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account to start your journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-up">Name</Label>
                  <Input id="name-up" name="name" placeholder="Your Name" required className="glass-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" name="email" type="email" placeholder="m@example.com" required className="glass-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-up">Password</Label>
                  <Input id="password-up" name="password" type="password" required className="glass-input" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-primary touch-target-large" size="lg" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auth;