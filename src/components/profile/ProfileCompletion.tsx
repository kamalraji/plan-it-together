import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { profileSchema, type ProfileFormData } from './profileSchema';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';

export function ProfileCompletion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: primaryOrg } = usePrimaryOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put('/auth/profile', {
        ...data,
        profileCompleted: true
      });
      return response.data;
    },
    onSuccess: () => {
      // Update the auth context with the new user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Navigate to primary org dashboard to avoid redirect chain
      if (primaryOrg?.slug) {
        navigate(`/${primaryOrg.slug}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const skipProfile = () => {
    if (primaryOrg?.slug) {
      navigate(`/${primaryOrg.slug}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Help others get to know you better by completing your profile.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-foreground">
                Organization
              </label>
              <input
                {...register('organization')}
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                placeholder="Your company, school, or organization"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-foreground">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                placeholder="https://your-website.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Social Links (Optional)
              </label>
              
              <div>
                <input
                  {...register('socialLinks.linkedin')}
                  type="url"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                  placeholder="LinkedIn profile URL"
                />
                {errors.socialLinks?.linkedin && (
                  <p className="mt-1 text-sm text-red-600">{errors.socialLinks.linkedin.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register('socialLinks.twitter')}
                  type="url"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                  placeholder="Twitter profile URL"
                />
                {errors.socialLinks?.twitter && (
                  <p className="mt-1 text-sm text-red-600">{errors.socialLinks.twitter.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register('socialLinks.github')}
                  type="url"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                  placeholder="GitHub profile URL"
                />
                {errors.socialLinks?.github && (
                  <p className="mt-1 text-sm text-red-600">{errors.socialLinks.github.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
            <button
              type="button"
              onClick={skipProfile}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}