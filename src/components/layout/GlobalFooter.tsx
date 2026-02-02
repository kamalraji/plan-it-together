import { Link } from 'react-router-dom';
import { Globe, Twitter, Linkedin, Github, Mail } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Events', href: '/events' },
      { label: 'Organizations', href: '/organizations' },
      { label: 'Workspaces', href: '/dashboard/workspaces' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs', external: true },
      { label: 'Blog', href: '/blog', external: true },
      { label: 'Status', href: 'https://status.thittam1hub.com', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/thittam1hub', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/thittam1hub', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/thittam1hub', label: 'GitHub' },
  { icon: Mail, href: 'mailto:hello@thittam1hub.com', label: 'Email' },
];

interface GlobalFooterProps {
  className?: string;
  /** Show minimal footer (just copyright and essential links) */
  minimal?: boolean;
}

export function GlobalFooter({ className, minimal = false }: GlobalFooterProps) {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer
        role="contentinfo"
        className={`border-t border-border/60 bg-card/80 backdrop-blur-sm py-6 ${className ?? ''}`}
      >
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Thittam1Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      role="contentinfo"
      className={`border-t border-border/60 bg-card/80 backdrop-blur-sm pt-12 pb-8 ${className ?? ''}`}
    >
      <div className="container">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md">
                TH
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Thittam1Hub
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Event marketing workspaces
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Unified event management and publishing platform for teams, campuses, and communities.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all min-w-[44px] min-h-[44px]"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 min-h-[44px]"
                      >
                        {link.label}
                        <Globe className="w-3 h-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Thittam1Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Made with ♥ for event organizers worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default GlobalFooter;
