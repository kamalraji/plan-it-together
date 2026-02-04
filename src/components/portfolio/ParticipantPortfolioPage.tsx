import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { PublicPortfolioProfile } from './PortfolioTypes';

export const ParticipantPortfolioPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicPortfolioProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('Missing participant identifier.');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .rpc('get_public_portfolio', { _user_id: userId })
          .maybeSingle();

        if (queryError) {
          console.error('Unable to load participant portfolio.', queryError);
          setError('Unable to load participant portfolio.');
        } else if (!data) {
          setError('Participant not found or portfolio is private.');
        } else {
          setProfile(data as PublicPortfolioProfile);
        }
      } catch (err) {
        console.error('Error loading participant portfolio', err);
        setError('Unexpected error while loading portfolio.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  useEffect(() => {
    const name = profile?.full_name ?? 'Participant';
    document.title = `${name} | Portfolio | Thittam1Hub`;

    const description = profile?.bio
      ? `${name}'s public portfolio on Thittam1Hub. ${profile.bio.slice(0, 120)}`
      : `View ${name}'s public portfolio on Thittam1Hub.`;

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
    canonical.setAttribute('href', window.location.origin + `/portfolio/${userId ?? ''}`);
  }, [profile, userId]);

  const sections = profile?.portfolio_sections?.length
    ? profile.portfolio_sections
    : ['about', 'links', 'highlights'];
  const showAbout = sections.includes('about');
  const showLinks = sections.includes('links');
  const showHighlights = sections.includes('highlights');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/30">
        <div className="h-10 w-10 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/30 px-4">
        <p className="text-sm text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 max-w-md text-center">
          {error ?? 'Participant not found.'}
        </p>
      </main>
    );
  }

  const initial = (profile.full_name ?? '?').charAt(0).toUpperCase();
  const joinedDate = new Date(profile.created_at);
  const joinedLabel = isNaN(joinedDate.getTime())
    ? null
    : joinedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });

  const layout = profile.portfolio_layout ?? 'stacked';

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/40 px-4 sm:px-6 lg:px-10 py-10">
      <section className="max-w-6xl mx-auto space-y-10">
        {/* Hero Section */}
        <header className="relative rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background/80 to-accent/20 shadow-[0_24px_80px_rgba(15,23,42,0.45)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary/40 to-accent/60 blur-3xl" />
            <div className="absolute -bottom-32 -right-10 h-64 w-64 rounded-full bg-gradient-to-tr from-accent/60 to-primary/40 blur-3xl" />
          </div>

          <div className="relative px-6 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center gap-8">
            {/* Avatar */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="relative">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-br from-primary to-accent p-[3px] shadow-[0_18px_45px_rgba(0,0,0,0.45)] transform-gpu rotate-[-3deg]">
                  <div className="h-full w-full rounded-3xl bg-background flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={`${profile.full_name ?? 'Participant'} avatar`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl font-semibold text-primary">{initial}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-card/90 text-[11px] font-medium text-card-foreground shadow-md backdrop-blur">
                  Portfolio
                </div>
              </div>
            </div>

            {/* Primary Info */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Thittam1Hub Participant</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">
                  {profile.full_name || 'Participant'}
                </h1>
                {profile.organization && (
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                    {profile.organization}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
                {joinedLabel && (
                  <span className="inline-flex items-center rounded-full bg-card/80 border border-border/60 px-3 py-1 text-muted-foreground backdrop-blur hover:-translate-y-0.5 hover:shadow-md transition-transform">
                    Joined {joinedLabel}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-[11px] sm:text-xs font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-transform"
                  >
                    Visit personal site
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* About & Highlights */}
        <section
          className={
            layout === 'grid'
              ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-start'
              : 'flex flex-col gap-6 lg:gap-8'
          }
        >
          {/* About */}
          {showAbout && (
            <article className="rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-[0_22px_60px_rgba(15,23,42,0.35)] p-5 sm:p-6 lg:p-7 transform-gpu hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.5)] transition-transform">
              <h2 className="text-sm font-semibold text-card-foreground tracking-wide uppercase mb-3">About &amp; Story</h2>
              {profile.bio ? (
                <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
                  This participant hasn&apos;t added a bio yet. Once they do, their story, interests, and goals will
                  appear here.
                </p>
              )}
            </article>
          )}

          {/* Highlights & Links */}
          {(showHighlights || showLinks) && (
            <aside className="space-y-4 lg:space-y-5">
              {showHighlights && (
                <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-[0_20px_55px_rgba(15,23,42,0.4)] p-5 sm:p-6 transform-gpu hover:-translate-y-1.5 hover:shadow-[0_32px_90px_rgba(15,23,42,0.6)] transition-transform">
                  <h2 className="text-sm font-semibold text-card-foreground tracking-wide uppercase mb-3">
                    Highlights
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {profile.organization && (
                      <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        {profile.organization}
                      </span>
                    )}
                    {joinedLabel && (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                        Thittam1Hub member since {joinedLabel}
                      </span>
                    )}
                    {(profile.linkedin_url || profile.twitter_url || profile.github_url) && (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        Active across the web
                      </span>
                    )}
                    {!profile.organization && !joinedLabel &&
                      !(profile.linkedin_url || profile.twitter_url || profile.github_url) && (
                        <span className="inline-flex items-center rounded-full border border-dashed border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                          Portfolio highlights will appear here as activity grows.
                        </span>
                      )}
                  </div>
                </div>
              )}

              {showLinks && (
                <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-[0_18px_50px_rgba(15,23,42,0.45)] p-5 sm:p-6">
                  <h2 className="text-sm font-semibold text-card-foreground tracking-wide uppercase mb-3">
                    Links &amp; Presence
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {profile.linkedin_url && (
                      <li>
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="story-link text-primary"
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
                          className="story-link text-primary"
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
                          className="story-link text-primary"
                        >
                          GitHub
                        </a>
                      </li>
                    )}
                    {!profile.linkedin_url && !profile.twitter_url && !profile.github_url && (
                      <li className="text-xs text-muted-foreground">No public links shared yet.</li>
                    )}
                  </ul>
                </div>
              )}
            </aside>
          )}
        </section>

        <section className="mt-2 rounded-2xl border border-dashed border-border/60 bg-background/60 px-5 py-4 text-xs sm:text-sm text-muted-foreground">
          This is a read-only public portfolio view powered by the participant&apos;s Thittam1Hub profile. Future
          versions can surface featured projects, event participation, and certificates in interactive 3D-style
          carousels.
        </section>
      </section>
    </main>
  );
};

export default ParticipantPortfolioPage;
