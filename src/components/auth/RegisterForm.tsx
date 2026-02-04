import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { motion } from 'framer-motion';
import { AuthLayout } from './AuthLayout';
import { useToast } from '@/hooks/use-toast';
import { GoogleSignInButton } from './GoogleSignInButton';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole),
  eventCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get event code from URL if present
  const eventCodeFromUrl = searchParams.get('eventCode');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.PARTICIPANT,
      eventCode: eventCodeFromUrl || '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...registerData } = data;
      const { error: registerError } = await registerUser(registerData);

      if (registerError) {
        setError(registerError.message || 'Registration failed. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: registerError.message || 'Please check your details and try again.',
        });
        return;
      }

      toast({
        title: 'Account created',
        description: 'Check your email to verify your account, then sign in.',
      });

      // After registration, redirect to login. Organizer signups will be guided
      // into the organization onboarding flow after login.
      if (data.role === UserRole.ORGANIZER) {
        navigate('/login?next=/onboarding/organization');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-1">
            Create your account
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Join your event workspace in a few clicks.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <motion.div className="relative rounded-2xl border border-border/70 bg-card/90 shadow-md">
          <form className="space-y-6 p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-destructive">⚠️</span>
                  <div className="text-sm text-destructive font-medium">{error}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-destructive">{errors.name.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.16 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  Account Type
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                >
                  <option value={UserRole.PARTICIPANT}>Participant</option>
                  <option value={UserRole.ORGANIZER}>Organizer</option>
                </select>
                {errors.role && (
                  <p className="mt-2 text-sm text-destructive">{errors.role.message}</p>
                )}
              </motion.div>

              {selectedRole === UserRole.PARTICIPANT && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.28 }}
                >
                  <label htmlFor="eventCode" className="block text-sm font-medium text-foreground mb-2">
                    Event Code (Optional)
                  </label>
                  <input
                    {...register('eventCode')}
                    type="text"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                    placeholder="Enter event code if you have one"
                  />
                  {errors.eventCode && (
                    <p className="mt-2 text-sm text-destructive">{errors.eventCode.message}</p>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.32 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Create a secure password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-destructive">{errors.password.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.36 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background/80"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-6 rounded-full text-base font-medium bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg hover:from-primary hover:to-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-transform transition-shadow duration-200 hover:-translate-y-0.5"
              whileHover={!isLoading ? { scale: 1.02 } : undefined}
              whileTap={!isLoading ? { scale: 0.99 } : undefined}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4, ease: 'easeOut' }}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <span>Create account</span>
              )}
            </motion.button>

            {selectedRole === UserRole.ORGANIZER && (
              <motion.div
                className="rounded-xl bg-teal/10 border border-teal/20 p-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.44 }}
              >
                <div className="text-sm text-primary">
                  <strong>Organizer Account:</strong> After you verify your email and sign in,
                  you'll be guided to set up your organization. Once your first organization is
                  created, you'll automatically get organizer access.
                </div>
              </motion.div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <GoogleSignInButton label="Sign up with Google" />
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
}