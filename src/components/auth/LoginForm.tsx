import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/looseClient';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await login(data.email, data.password);
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    try {
      // Support deep-linking into organizer onboarding after signup
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');

      // If a specific next URL is provided, always respect it
      if (next) {
        navigate(next);
        return;
      }

      // Otherwise, check if this is an organizer signup without an organization yet
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData?.user) {
        const sbUser = userData.user;
        const desiredRole = sbUser.user_metadata?.desiredRole;

        if (desiredRole === 'ORGANIZER') {
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', sbUser.id)
            .maybeSingle();

          // Only redirect to onboarding if there is clearly no organization yet
          if (!orgError && !org) {
            navigate('/onboarding/organization');
            return;
          }
        }
      }
    } catch (checkError) {
      console.warn('Failed to run organizer onboarding redirect logic', checkError);
    } finally {
      // Fallback: if we didn't navigate earlier, go to dashboard
      navigate('/dashboard');
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-lavender/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4">
            Welcome Back!
          </h2>
          <p className="text-muted-foreground mb-2">
            Sign in to continue your amazing journey
          </p>
          <p className="text-sm text-muted-foreground">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-teal hover:text-teal-light transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-coral/20 p-8 shadow-doodle">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl bg-coral/10 border border-coral/20 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-coral">⚠️</span>
                  <div className="text-sm text-coral font-medium">{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-coral">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-coral">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-teal hover:text-teal-light transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl text-base font-medium text-primary-foreground bg-gradient-to-r from-coral to-coral-light hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
