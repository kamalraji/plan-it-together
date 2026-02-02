import { Globe, Twitter, Linkedin, Instagram, Facebook, Youtube, Github, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SocialLink {
  platform: string;
  url: string;
}

interface EventSocialLinksProps {
  links: SocialLink[] | Record<string, string> | null | undefined;
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
  showLabels?: boolean;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; label: string; color?: string }> = {
  website: { icon: Globe, label: 'Website' },
  twitter: { icon: Twitter, label: 'Twitter' },
  x: { icon: Twitter, label: 'X (Twitter)' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  instagram: { icon: Instagram, label: 'Instagram' },
  facebook: { icon: Facebook, label: 'Facebook' },
  youtube: { icon: Youtube, label: 'YouTube' },
  github: { icon: Github, label: 'GitHub' },
};

function normalizeLinks(links: SocialLink[] | Record<string, string> | null | undefined): SocialLink[] {
  if (!links) return [];
  
  if (Array.isArray(links)) {
    return links.filter(l => l.url && l.url.trim() !== '');
  }
  
  // Handle object format { twitter: "url", linkedin: "url" }
  return Object.entries(links)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([platform, url]) => ({ platform: platform.toLowerCase(), url }));
}

export function EventSocialLinks({
  links,
  className,
  variant = 'default',
  showLabels = false,
}: EventSocialLinksProps) {
  const normalizedLinks = normalizeLinks(links);
  
  if (normalizedLinks.length === 0) return null;

  const getIcon = (platform: string) => {
    const config = PLATFORM_CONFIG[platform.toLowerCase()];
    return config?.icon || ExternalLink;
  };

  const getLabel = (platform: string) => {
    const config = PLATFORM_CONFIG[platform.toLowerCase()];
    return config?.label || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)} role="list" aria-label="Social media links">
        {normalizedLinks.map((link) => {
          const Icon = getIcon(link.platform);
          const label = getLabel(link.platform);
          
          return (
            <TooltipProvider key={link.platform}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label={`Visit ${label}`}
                    role="listitem"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={cn('flex items-center gap-2', className)} role="list" aria-label="Social media links">
        {normalizedLinks.map((link) => {
          const Icon = getIcon(link.platform);
          const label = getLabel(link.platform);
          
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-3 py-2 text-sm hover:bg-background/30 transition-colors"
              aria-label={`Visit ${label}`}
              role="listitem"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {showLabels && <span>{label}</span>}
            </a>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="list" aria-label="Social media links">
      {normalizedLinks.map((link) => {
        const Icon = getIcon(link.platform);
        const label = getLabel(link.platform);
        
        return (
          <Button
            key={link.platform}
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${label}`}
              role="listitem"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {showLabels && <span>{label}</span>}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

export default EventSocialLinks;
