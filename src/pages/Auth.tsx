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

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const signInData = { email: signInEmail, password: signInPassword };
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const message = result.error.issues[0].message;
      setError(message);
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(signInEmail, signInPassword);
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
    const signUpData = { name: signUpName, email: signUpEmail, password: signUpPassword };
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
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            display_name: signUpName, // Correctly pass display_name
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background - Matching Other Pages */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/hero-meditation.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Deep Purple Glassmorphism Overlay - Exact Match */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-pulse opacity-40" />
        <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-purple-300/30 animate-pulse delay-1000 opacity-30" />
        <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse delay-2000 opacity-25" />
        <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-purple-300/25 animate-pulse delay-500 opacity-20" />
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-white/10 animate-pulse delay-3000 opacity-15" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Tabs defaultValue="sign-in" className="max-w-md w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20">
            <TabsTrigger value="sign-in" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Sign Up</TabsTrigger>
            <TabsTrigger value="forgot" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Forgot Password</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Sign In</CardTitle>
                <CardDescription className="text-white/70">Enter your credentials to access your account.</CardDescription>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-in" className="text-white">Email</Label>
                  <Input id="email-in" name="email" type="email" placeholder="m@example.com" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-in" className="text-white">Password</Label>
                  <Input id="password-in" name="password" type="password" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Sign Up</CardTitle>
              <CardDescription className="text-white/70">Create a new account to start your journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-up" className="text-white">Name</Label>
                  <Input id="name-up" name="name" placeholder="Your Name" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up" className="text-white">Email</Label>
                  <Input id="email-up" name="email" type="email" placeholder="m@example.com" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-up" className="text-white">Password</Label>
                  <Input id="password-up" name="password" type="password" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="forgot">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Reset Password</CardTitle>
              <CardDescription className="text-white/70">Enter your email to receive reset instructions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault(); setLoading(true); setError(null);
                const data = { email: forgotEmail };
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
                  <Label htmlFor="email-forgot" className="text-white">Email</Label>
                  <Input id="email-forgot" name="email" type="email" placeholder="m@example.com" required className="bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-purple-300" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Auth;