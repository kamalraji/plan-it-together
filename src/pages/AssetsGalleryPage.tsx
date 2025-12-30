import React, { useEffect } from 'react';

import dashboardLoginScreenshot from '@/assets/dashboard-login-screenshot.png';

/**
 * AssetsGalleryPage
 *
 * Internal gallery listing design reference screenshots and assets
 * used across the console. This is primarily for internal QA and
 * design review, not for end-users.
 */
const AssetsGalleryPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Design Assets Gallery | Thittam1Hub';

    const description =
      'Internal gallery of design reference screenshots and UI assets used in the Thittam1Hub console.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/dashboard/assets`);

    const existingLd = document.getElementById('assets-gallery-ld-json');
    if (existingLd) {
      existingLd.remove();
    }

    const ld = document.createElement('script');
    ld.id = 'assets-gallery-ld-json';
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'Thittam1Hub Design Assets',
      description,
      image: [
        `${window.location.origin}${dashboardLoginScreenshot}`,
      ],
    });
    document.head.appendChild(ld);

    return () => {
      const cleanupLd = document.getElementById('assets-gallery-ld-json');
      if (cleanupLd) {
        cleanupLd.remove();
      }
    };
  }, []);

  const assets = [
    {
      id: 'dashboard-login',
      title: 'Dashboard Login Screen',
      description: 'Current login experience for accessing the event workspace console.',
      src: dashboardLoginScreenshot,
      alt: 'Thittam1Hub dashboard login screen with welcome back message and sign in form',
      category: 'Authentication',
      tags: ['login', 'auth', 'console-entry'],
    },
  ];

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <header className="space-y-2 sm:space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Internal tools</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Design assets gallery
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Browse internal reference screenshots used for QA, visual reviews, and consistency checks
            across the Thittam1Hub console.
          </p>
        </header>

        <section aria-label="Design reference screenshots" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4 space-y-1.5 flex-1 flex flex-col">
                  <h2 className="text-sm sm:text-base font-medium text-foreground">
                    {asset.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                    {asset.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {asset.category}
                    </span>
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AssetsGalleryPage;
