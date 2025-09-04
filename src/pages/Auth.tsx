import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

  // Validation schemas
  const signInSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  });

  const signUpSchema = signInSchema.extend({
    name: z.string().min(1, { message: 'Name is required' }),
  });

  // Forgot password schema
  const forgotSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { email, password } = Object.fromEntries(new FormData(event.currentTarget));
    // Validate input
    const signInData = { email: email as string, password: password as string };
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const message = result.error.issues[0].message;
      setError(message);
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email as string, password as string);
      if (error) throw error;
      toast({ title: "Success", description: "Signed in successfully." });
      navigate('/dashboard');
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
    // Validate input
    const signUpData = { name: name as string, email: email as string, password: password as string };
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const message = result.error.issues[0].message;
      setError(message);
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setLoading(false);
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Tabs defaultValue="sign-in" className="max-w-md w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
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
                <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
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
                <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="forgot">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email to receive reset instructions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault(); setLoading(true); setError(null);
                const { email } = Object.fromEntries(new FormData(e.currentTarget));
                const data = { email: email as string };
                const parsed = forgotSchema.safeParse(data);
                if (!parsed.success) {
                  const msg = parsed.error.issues[0].message;
                  setError(msg); toast({ title: 'Validation Error', description: msg, variant: 'destructive' });
                  setLoading(false); return;
                }
                // Replace signUp call with reset password
                try {
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: window.location.origin + '/auth' });
                  if (resetError) throw resetError;
                  toast({ title: 'Email Sent', description: 'Check your email for reset link.' });
                } catch (err: any) {
                  setError(err.message); toast({ title: 'Error', description: err.message, variant: 'destructive' });
                } finally { setLoading(false); }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-forgot">Email</Label>
                  <Input id="email-forgot" name="email" type="email" placeholder="m@example.com" required className="glass-input" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
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