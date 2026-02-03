import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileForm } from './ProfileForm';
import type { ProfileFormData } from './profileSchema';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
async function compressImageToTarget(file: File, maxBytes: number): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const maxDimension = 320;
  let { width, height } = imageBitmap;
  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height >= width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  let quality = 0.9;
  let blob: Blob | null = null;

  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    );
    if (!blob) break;
    if (blob.size <= maxBytes) break;
    quality -= 0.15;
    if (quality <= 0.3) break;
  }

  if (!blob) {
    throw new Error('Failed to compress image');
  }

  return blob;
}

const computeCompletion = (values: {
  full_name?: string | null;
  organization?: string | null;
  phone?: string | null;
  bio?: string | null;
  website?: string | null;
}): number => {
  const fields = ['full_name', 'organization', 'phone', 'bio', 'website'] as const;
  const filled = fields.filter((key) => {
    const v = values[key];
    return v != null && String(v).trim().length > 0;
  }).length;
  return Math.round((filled / fields.length) * 100);
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading, error, updateProfile } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Profile | Thittam1Hub';

    const description = 'Manage your Thittam1Hub profile, contact details, and social links.';
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + '/dashboard/profile');
  }, []);

  const completion = useMemo(() => {
    if (!profile) return 0;
    return computeCompletion(profile);
  }, [profile]);

  const initialValues: ProfileFormData = {
    name: profile?.full_name ?? user?.name ?? '',
    bio: profile?.bio ?? '',
    organization: profile?.organization ?? '',
    phone: profile?.phone ?? '',
    website: profile?.website ?? '',
    socialLinks: {
      linkedin: profile?.linkedin_url ?? '',
      twitter: profile?.twitter_url ?? '',
      github: profile?.github_url ?? '',
    },
  };

  const handleSubmit = async (values: ProfileFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error: updateError } = await updateProfile({
        full_name: values.name,
        bio: values.bio || null,
        organization: values.organization || null,
        phone: values.phone || null,
        website: values.website || null,
        linkedin_url: values.socialLinks?.linkedin || null,
        twitter_url: values.socialLinks?.twitter || null,
        github_url: values.socialLinks?.github || null,
      });

      if (!updateError) {
        await supabase.auth.updateUser({
          data: {
            name: values.name,
            profileCompleted: true,
          },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.[0]) return;
    const file = event.target.files[0];

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload an image file (JPEG or PNG).',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    if (file.size > 500 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please choose an image under 500KB. It will be compressed further.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    try {
      const compressed = await compressImageToTarget(file, 100 * 1024);
      if (compressed.size > 100 * 1024) {
        toast({
          title: 'Avatar too large after compression',
          description: 'Try a smaller image so we can keep it under 100KB.',
          variant: 'destructive',
        });
        event.target.value = '';
        return;
      }

      const fileExt = 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast({
          title: 'Upload failed',
          description: 'We could not upload your avatar. Please try again.',
          variant: 'destructive',
        });
        event.target.value = '';
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data?.path ?? filePath);

      if (publicUrlData?.publicUrl) {
        await updateProfile({ avatar_url: publicUrlData.publicUrl });
        toast({
          title: 'Avatar updated',
          description: 'Your profile picture has been updated.',
        });
      }
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'We could not process this image. Please try a different one.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">You need to be logged in to view your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-accent/20 px-4 sm:px-6 lg:px-8 py-8">
        <section className="max-w-5xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Your profile
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
                Keep your details up to date so organizers, teams, and collaborators know who you are.
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-default group">
                    <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden ring-2 ring-transparent transition-all group-hover:ring-primary/60 group-hover:shadow-md">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {(profile?.full_name ?? user.name ?? '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {profile?.full_name ?? user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Profile completeness: {completion}%
                      </p>
                      <label className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        Change avatar
                      </label>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    This avatar appears next to your name in attendance lists and organizer views. Use it to
                    make your public profile easy to recognize.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </header>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 lg:gap-8 items-start">
          <ProfileForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={saving ? 'Saving…' : 'Save profile'}
          />

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-2">Check-in QR</h2>
              {profile?.qr_code ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    Use this QR at events to check in quickly. A visual QR code will be added in a later step; for now, this is your unique check-in ID.
                  </p>
                  <div className="flex items-center justify-between rounded-md border border-dashed border-border/80 bg-background px-3 py-2">
                    <code className="text-xs text-muted-foreground truncate mr-2">{profile.qr_code}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(profile.qr_code)}
                      className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium text-foreground hover:bg-background"
                    >
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your QR check-in code will appear here after your first event registration.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Tips</h2>
              <p className="text-xs text-muted-foreground">
                Adding a short bio and links to your profiles helps organizers and teammates recognize you at a glance.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};
