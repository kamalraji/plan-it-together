import { ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import { GlobalFooter } from './GlobalFooter';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PublicPageLayoutProps {
  children: ReactNode;
  /** Show breadcrumbs navigation */
  breadcrumbs?: Breadcrumb[];
  /** Additional class names for the main content area */
  className?: string;
  /** Use minimal footer (just copyright and essential links) */
  minimalFooter?: boolean;
}

export function PublicPageLayout({
  children,
  breadcrumbs,
  className,
  minimalFooter = false,
}: PublicPageLayoutProps) {
  return (
    <>
      <SkipLink />
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="container max-w-6xl py-3 border-b border-border/40"
          >
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Main Content */}
        <main id="main-content" className={`flex-1 ${className ?? ''}`}>
          {children}
        </main>

        <GlobalFooter minimal={minimalFooter} />
        <CookieConsentBanner />
      </div>
    </>
  );
}

export default PublicPageLayout;
