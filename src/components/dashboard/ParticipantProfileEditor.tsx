import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const profileSchema = z.object({
  full_name: z.string().trim().max(200).optional(),
  organization: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(1000).optional(),
  website: z.string().trim().url().max(300).optional().or(z.literal('')),
  linkedin_url: z.string().trim().url().max(300).optional().or(z.literal('')),
  twitter_url: z.string().trim().max(300).optional(),
  github_url: z.string().trim().max(300).optional(),
});

interface ParticipantProfileEditorProps {
  userId: string;
  userEmail?: string;
}

interface UserProfileRow {
  full_name: string | null;
  organization: string | null;
  phone: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  avatar_url: string | null;
}

export function ParticipantProfileEditor({ userId, userEmail }: ParticipantProfileEditorProps) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formState, setFormState] = useState<Partial<UserProfileRow>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: profile, refetch } = useQuery<UserProfileRow | null>({
    queryKey: ['participant-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, organization, phone, bio, website, linkedin_url, twitter_url, github_url, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfileRow | null;
    },
  });

  useEffect(() => {
    if (profile) {
      setFormState(profile);
    }
  }, [profile]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setAvatarUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setFormState((prev) => ({ ...prev, avatar_url: publicUrl }));
      setSuccess('Avatar updated successfully.');
    } catch (err) {
      console.error('Error uploading avatar', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      full_name: formState.full_name ?? '',
      organization: formState.organization ?? '',
      phone: formState.phone ?? '',
      bio: formState.bio ?? '',
      website: formState.website ?? '',
      linkedin_url: formState.linkedin_url ?? '',
      twitter_url: formState.twitter_url ?? '',
      github_url: formState.github_url ?? '',
    };

    const parsed = profileSchema.safeParse(payload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please fix the validation errors.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(parsed.data)
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully.');
      void refetch();
    } catch (err) {
      console.error('Error updating profile', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials =
    formState.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ||
    userEmail?.[0]?.toUpperCase() ||
    'P';

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Your profile</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Update your basic details, avatar, and social links used across events.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="flex flex-col items-center md:items-start gap-4 md:w-64">
          <div className="relative">
            {formState.avatar_url ? (
              <img
                src={formState.avatar_url}
                alt="Participant avatar"
                className="h-20 w-20 rounded-full border border-border/60 object-cover shadow-sm"
              />
            ) : (
              <div className="h-20 w-20 rounded-full border border-border/60 bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
                {initials}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 text-center md:text-left">
            <label className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors cursor-pointer">
              <span>{avatarUploading ? 'Uploading…' : 'Change avatar'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Recommended: square image, at least 200×200px.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="full_name">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formState.full_name ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your preferred display name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="organization">
                Organization
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                value={formState.organization ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="School, company, community, etc."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formState.phone ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional contact number"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formState.website ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formState.bio ?? ''}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="A short introduction that organizers and teammates may see."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="linkedin_url">
                LinkedIn
              </label>
              <input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                value={formState.linkedin_url ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://www.linkedin.com/in/username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="twitter_url">
                X / Twitter
              </label>
              <input
                id="twitter_url"
                name="twitter_url"
                type="text"
                value={formState.twitter_url ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="@handle or full URL"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="github_url">
                GitHub
              </label>
              <input
                id="github_url"
                name="github_url"
                type="text"
                value={formState.github_url ?? ''}
                onChange={handleChange}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-500 mt-1">{success}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
