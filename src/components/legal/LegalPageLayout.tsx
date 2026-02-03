import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { CookieConsentBanner } from './CookieConsentBanner';

interface TableOfContentsItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  canonicalPath: string;
  tableOfContents: TableOfContentsItem[];
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  canonicalPath,
  tableOfContents,
  children,
}: LegalPageLayoutProps) {
  useSeo({
    title: `${title} | Thittam1Hub`,
    description,
    canonicalPath,
    jsonLdId: 'legal-page-schema',
    jsonLdFactory: (canonicalUrl) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Thittam1Hub',
        url: 'https://thittam1hub.com',
      },
      dateModified: lastUpdated,
    }),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SkipLink />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container max-w-6xl py-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] print:hidden"
              aria-label="Print this page"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 container max-w-6xl py-8 md:py-12">
          <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            {/* Table of Contents Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start print:hidden">
              <nav aria-label="Table of contents" className="hidden lg:block">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  On this page
                </h2>
                <ul className="space-y-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-1"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile TOC */}
              <details className="lg:hidden rounded-xl border border-border/60 bg-card/80 p-4 mb-6">
                <summary className="text-sm font-semibold text-foreground cursor-pointer">
                  Table of Contents
                </summary>
                <ul className="mt-3 space-y-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-1"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </aside>

            {/* Content */}
            <article className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none">
              <header className="not-prose mb-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-3">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </header>

              {children}
            </article>
          </div>
        </main>

        <GlobalFooter />
        <CookieConsentBanner />
      </div>
    </>
  );
}

export default LegalPageLayout;
