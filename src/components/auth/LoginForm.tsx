import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/looseClient';
import { AuthLayout } from './AuthLayout';
import { useToast } from '@/hooks/use-toast';
import { useSeo } from '@/hooks/useSeo';
import { fetchPrimaryOrganizationForUser } from '@/hooks/usePrimaryOrganization';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useSeo({
    title: 'Sign in to your event workspace | Thittam1Hub',
    description:
      'Sign in to Thittam1Hub to access your event workspaces, registrations, attendance, and certificates.',
    canonicalPath: '/login',
    ogImagePath: '/images/attendflow-og.png',
    ogType: 'website',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await login(data.email, data.password);
    if (error) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: error.message || 'Please check your details and try again.',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Signed in',
      description: 'Redirecting you to your workspace...',
    });

    try {
      // Support deep-linking via ?next= param
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        navigate(next, { replace: true });
        return;
      }

      // Get current user to check role and fetch primary org
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const sbUser = userData.user;
      const desiredRole = sbUser.user_metadata?.desiredRole;

      // New organizers without an org go to onboarding
      if (desiredRole === 'ORGANIZER') {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', sbUser.id)
          .maybeSingle();

        if (!orgError && !org) {
          navigate('/onboarding/organization', { replace: true });
          return;
        }
      }

      // Direct navigation: fetch primary org and go directly to /{orgSlug}/dashboard
      const primaryOrg = await fetchPrimaryOrganizationForUser(sbUser.id);
      if (primaryOrg?.slug) {
        navigate(`/${primaryOrg.slug}/dashboard`, { replace: true });
      } else {
        // Participant or user without org membership
        navigate('/dashboard', { replace: true });
      }
    } catch {
      navigate('/dashboard', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AuthLayout>
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Sign in to your event workspace
          </p>
          <p className="text-sm text-muted-foreground">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          className="relative rounded-2xl border border-border/70 bg-card/90 shadow-md"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
        >
          <form className="space-y-6 p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <motion.div
                className="rounded-xl bg-destructive/10 border border-destructive/30 p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-destructive">⚠️</span>
                  <div className="text-sm text-destructive font-medium">{error}</div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-destructive">{errors.password.message}</p>
                )}
              </motion.div>
            </div>

            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.24 }}
            >
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-6 rounded-full text-base sm:text-[15px] font-medium tracking-tight bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg hover:from-primary hover:to-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-transform transition-shadow duration-200 hover:-translate-y-0.5"
              whileHover={!isLoading ? { scale: 1.02 } : undefined}
              whileTap={!isLoading ? { scale: 0.99 } : undefined}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign in</span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
