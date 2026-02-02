import { Suspense, lazy } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { useSeo } from '@/hooks/useSeo';
import { Button } from '@/components/ui/button';
import { LogIn, ArrowRight } from 'lucide-react';

// Lazy load the full HelpPage component
const HelpPage = lazy(() => import('./HelpPage'));

const LoadingFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      <p className="text-muted-foreground text-sm">Loading help resources...</p>
    </div>
  </div>
);

export function PublicHelpPage() {
  const [searchParams] = useSearchParams();
  const intent = searchParams.get('intent');

  useSeo({
    title: 'Help Center | Thittam1Hub',
    description:
      'Get help with Thittam1Hub. Browse our knowledge base, FAQs, tutorials, and contact support for assistance with event management.',
    canonicalPath: '/help',
    jsonLdId: 'help-page-schema',
    jsonLdFactory: (canonicalUrl) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Thittam1Hub Help Center',
      description: 'Help and support resources for Thittam1Hub event management platform',
      url: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Thittam1Hub',
      },
    }),
  });

  // Determine current context based on intent
  const currentContext = intent === 'events' ? 'events' :
    intent === 'workspaces' ? 'workspaces' :
    intent === 'marketplace' ? 'marketplace' :
    intent === 'pricing' ? 'events' :
    intent === 'demo' ? 'events' :
    intent === 'feedback' ? undefined :
    undefined;

  return (
    <PublicPageLayout>
      {/* CTA Banner for Non-Authenticated Users */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/60">
        <div className="container max-w-6xl py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">
                Get the full Thittam1Hub experience
              </p>
              <p className="text-xs text-muted-foreground">
                Sign in to access personalized help, submit support tickets, and more.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Content */}
      <Suspense fallback={<LoadingFallback />}>
        <HelpPage currentContext={currentContext} isPublic />
      </Suspense>
    </PublicPageLayout>
  );
}

export default PublicHelpPage;
