import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PublicPortfolioProfile } from './PortfolioTypes';

interface PortfolioPreviewCardProps {
  userId?: string;
  profile?: PublicPortfolioProfile;
  href?: string;
}

export const PortfolioPreviewCard: React.FC<PortfolioPreviewCardProps> = ({
  userId,
  profile: providedProfile,
  href,
}) => {
  const [profile, setProfile] = useState<PublicPortfolioProfile | null>(providedProfile ?? null);
  const [isLoading, setIsLoading] = useState(!providedProfile && !!userId);

  useEffect(() => {
    if (!userId || providedProfile) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_public_portfolio', { _user_id: userId })
          .maybeSingle();

        if (error) {
          console.error('Failed to load portfolio preview', error);
        } else if (data) {
          setProfile(data as PublicPortfolioProfile);
        }
      } catch (err) {
        console.error('Unexpected error loading portfolio preview', err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, providedProfile]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-xs text-muted-foreground">
        Loading portfolio…
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initial = (profile.full_name ?? '?').charAt(0).toUpperCase();
  const sections = profile.portfolio_sections?.length
    ? profile.portfolio_sections
    : ['about', 'links', 'highlights'];
  const showAbout = sections.includes('about');
  const showLinks = sections.includes('links');

  const content = (
    <article className="relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-md hover:shadow-xl transform-gpu hover:-translate-y-0.5 transition-transform">
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px] shadow-lg">
          <div className="h-full w-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.full_name ?? 'Participant'} avatar`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-base font-semibold text-primary">{initial}</span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {profile.full_name || 'Participant'}
        </h3>
        {profile.organization && (
          <p className="truncate text-xs text-muted-foreground">{profile.organization}</p>
        )}
        {showAbout && profile.bio && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {profile.bio}
          </p>
        )}
        {showLinks && (
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            {profile.website && <span>Site</span>}
            {profile.linkedin_url && <span>LinkedIn</span>}
            {profile.twitter_url && <span>Twitter</span>}
            {profile.github_url && <span>GitHub</span>}
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <a href={href} className="block no-underline">
        {content}
      </a>
    );
  }

  return content;
};
