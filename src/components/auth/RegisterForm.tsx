import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { motion } from 'framer-motion';
import { AuthLayout } from './AuthLayout';

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
        return;
      }
      
      // After registration, redirect to login. Organizer signups will be guided
      // into the organization onboarding flow after login.
      if (data.role === UserRole.ORGANIZER) {
        navigate('/login?next=/onboarding/organization');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-sunny to-teal bg-clip-text text-transparent mb-4">
            Join the Adventure!
          </h2>
          <p className="text-gray-600 mb-2">
            Create your account and start exploring amazing events
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-teal hover:text-teal-light transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <motion.div
          className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/15 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
        >
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
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-coral">{errors.name.message}</p>
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
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-coral">{errors.email.message}</p>
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
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                >
                  <option value={UserRole.PARTICIPANT}>Participant</option>
                  <option value={UserRole.ORGANIZER}>Organizer</option>
                </select>
                {errors.role && (
                  <p className="mt-2 text-sm text-coral">{errors.role.message}</p>
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
                    className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                    placeholder="Enter event code if you have one"
                  />
                  {errors.eventCode && (
                    <p className="mt-2 text-sm text-coral">{errors.eventCode.message}</p>
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
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Create a secure password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-coral">{errors.password.message}</p>
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
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-sunny/20 focus:border-sunny transition-all duration-200 bg-card/70 backdrop-blur-sm"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-coral">{errors.confirmPassword.message}</p>
                )}
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-xl text-base font-medium text-primary-foreground bg-gradient-to-r from-sunny to-teal shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunny disabled:opacity-50 disabled:cursor-not-allowed transition-transform transition-shadow duration-200 hover:-translate-y-0.5"
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
                <div className="text-sm text-teal">
                  <strong>Organizer Account:</strong> After you verify your email and sign in,
                  you'll be guided to set up your organization. Once your first organization is
                  created, you'll automatically get organizer access.
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
}