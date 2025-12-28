import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, MapPin, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = (email: string, password: string) => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(loginEmail, loginPassword)) return;
    
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Email or password is incorrect' 
          : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(signupEmail, signupPassword)) return;
    
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account exists',
          description: 'An account with this email already exists. Please log in.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Welcome to Noura',
        description: 'Your account has been created successfully.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-safe/8 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-fastest/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo and tagline - Art Deco inspired */}
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-glow-md">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              {/* Decorative corner accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary/40 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary/40 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary/40 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary/40 rounded-br" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Noura
              <span className="text-primary">.</span>
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.3em] mt-2">Paris</p>
            <p className="text-muted-foreground mt-3 text-sm">Navigate safely through the city</p>
          </div>
        </div>

        {/* Features - geometric style */}
        <div className="flex justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-safe/10 flex items-center justify-center group-hover:bg-safe/20 transition-colors">
              <MapPin className="w-4 h-4 text-safe" />
            </div>
            <span className="text-xs uppercase tracking-wider">Safe routes</span>
          </div>
          <div className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xs uppercase tracking-wider">Check-ins</span>
          </div>
        </div>

        {/* Auth card - glass morphism */}
        <Card className="glass-strong shadow-elevated animate-fade-in-up stagger-3">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger 
                  value="login" 
                  className="font-display font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  Log in
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="font-display font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  Sign up
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all"
                      required
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all"
                      required
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-11 font-display font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Logging in...
                      </span>
                    ) : 'Log in'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-xs uppercase tracking-wider text-muted-foreground">Full name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jane Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all"
                      required
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all"
                      required
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-11 font-display font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Creating account...
                      </span>
                    ) : 'Create account'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70 animate-fade-in-up stagger-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
