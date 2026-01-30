import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  portfolio_accent_color: string | null;
  portfolio_layout: string | null;
  portfolio_sections: string[] | null;
  created_at: string | null;
}

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('Missing user identifier.');
        setIsLoading(false);
        return;
      }

      try {
        // Use the secure RPC function that excludes sensitive fields like phone
        const { data, error: queryError } = await supabase
          .rpc('get_public_portfolio', { _user_id: userId });

        if (queryError) {
          setError('Unable to load profile.');
        } else if (!data || (Array.isArray(data) && data.length === 0)) {
          setError('Profile not found or is private.');
        } else {
          // RPC returns an array, get the first item
          const profileData = Array.isArray(data) ? data[0] : data;
          setProfile(profileData as PublicProfile);
        }
      } catch (err) {
        console.error('Error loading public profile', err);
        setError('Unexpected error while loading profile.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  useEffect(() => {
    const titleBase = profile?.full_name ? `${profile.full_name} | Thittam1Hub Profile` : 'Profile | Thittam1Hub';
    document.title = titleBase;

    const description = profile?.bio || 'View public profile details for this Thittam1Hub participant.';
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
    canonical.setAttribute('href', window.location.origin + `/dashboard/profiles/${userId ?? ''}`);
  }, [profile, userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 max-w-md text-center">
          {error ?? 'Profile not found.'}
        </p>
      </div>
    );
  }

  const initial = (profile.full_name ?? '?').charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-accent/20 px-4 sm:px-6 lg:px-8 py-8">
      <section className="max-w-3xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User avatar'}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                <span>{initial}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {profile.full_name || 'Participant'}
              </h1>
              {profile.organization && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.organization}</p>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 md:gap-8 items-start">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-card-foreground">About</h2>
            {profile.bio ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No bio has been added yet.</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2"
              >
                Visit website
              </a>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-card-foreground">Links</h2>
              <ul className="space-y-2 text-sm">
                {profile.linkedin_url && (
                  <li>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      LinkedIn
                    </a>
                  </li>
                )}
                {profile.twitter_url && (
                  <li>
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      X / Twitter
                    </a>
                  </li>
                )}
                {profile.github_url && (
                  <li>
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      GitHub
                    </a>
                  </li>
                )}
                {!profile.linkedin_url && !profile.twitter_url && !profile.github_url && (
                  <li className="text-muted-foreground">No public links shared.</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};
