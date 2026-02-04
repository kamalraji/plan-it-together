import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

// Fallback placeholder logos for demo
const placeholderOrgs: Organization[] = [
  { id: "1", name: "Tech University", logo_url: null },
  { id: "2", name: "Innovation Labs", logo_url: null },
  { id: "3", name: "Community Hub", logo_url: null },
  { id: "4", name: "StartupX", logo_url: null },
  { id: "5", name: "DevCommunity", logo_url: null },
  { id: "6", name: "CodeCamp", logo_url: null },
];

export function LogoMarquee() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchOrganizations() {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("verification_status", "VERIFIED")
        .not("logo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data && data.length > 0) {
        setOrganizations(data);
      } else {
        setOrganizations(placeholderOrgs);
      }
    }

    fetchOrganizations();
  }, []);

  if (organizations.length === 0) {
    return null;
  }

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...organizations, ...organizations];

  return (
    <section className="relative py-12 md:py-16 bg-background overflow-hidden">
      <div className="container mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center">
          Teams running events on Thittam1Hub
        </p>
      </div>

      {/* Marquee container */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 h-full w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div
          className={`flex items-center gap-8 md:gap-12 ${
            isPaused ? "[animation-play-state:paused]" : ""
          } animate-marquee`}
        >
          {duplicatedLogos.map((org, index) => (
            <div
              key={`${org.id}-${index}`}
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
            >
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  loading="lazy"
                  className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-contain bg-background border border-border/40"
                />
              ) : (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {org.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {org.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Second row scrolling in reverse (optional for richer effect) */}
      <div
        className="relative mt-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 h-full w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          className={`flex items-center gap-8 md:gap-12 ${
            isPaused ? "[animation-play-state:paused]" : ""
          } animate-marquee-reverse`}
        >
          {[...duplicatedLogos].reverse().map((org, index) => (
            <div
              key={`rev-${org.id}-${index}`}
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
            >
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  loading="lazy"
                  className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-contain bg-background border border-border/40"
                />
              ) : (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent-foreground font-semibold text-sm">
                  {org.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {org.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
