import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormData } from './profileSchema';
import { UsernameInput } from './UsernameInput';

interface ProfileFormProps {
  initialValues: Partial<ProfileFormData>;
  onSubmit: (values: ProfileFormData) => Promise<void> | void;
  submitLabel?: string;
  currentUsername?: string | null;
  usernameChangedAt?: string | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialValues,
  onSubmit,
  submitLabel = 'Save changes',
  currentUsername,
  usernameChangedAt,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full name *</label>
          <input
            {...register('name')}
            type="text"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Username Input */}
        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <UsernameInput
              value={field.value || ''}
              onChange={field.onChange}
              currentUsername={currentUsername}
              usernameChangedAt={usernameChangedAt}
              error={errors.username?.message}
            />
          )}
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Tell others about yourself"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Organization</label>
            <input
              {...register('organization')}
              type="text"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
            <input
              {...register('phone')}
              type="tel"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Website</label>
          <input
            {...register('website')}
            type="url"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="https://your-site.com"
          />
          {errors.website && (
            <p className="mt-1 text-xs text-destructive">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground mb-1">Social links</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                {...register('socialLinks.linkedin')}
                type="url"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="LinkedIn URL"
              />
              {errors.socialLinks?.linkedin && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.socialLinks.linkedin?.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register('socialLinks.twitter')}
                type="url"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="Twitter URL"
              />
              {errors.socialLinks?.twitter && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.socialLinks.twitter?.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register('socialLinks.github')}
                type="url"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="GitHub URL"
              />
              {errors.socialLinks?.github && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.socialLinks.github?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
