/**
 * Canvas styles for the Event Page Builder
 */

export function getCanvasStyles(primaryColor: string): string[] {
  return [
    // Base reset
    'body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; color: #020617; background-color: #ffffff; }',
    'a { color: inherit; text-decoration: none; }',
    'img { max-width: 100%; height: auto; display: block; }',
    // Brand tokens
    `:root { --th-primary: ${primaryColor}; }`,
    'header.hero { padding: 3rem 1.5rem; text-align: center; background: linear-gradient(135deg, var(--th-primary), rgba(15, 23, 42, 0.95)); color: #f9fafb; }',
    'header.hero h1 { font-size: 2.25rem; line-height: 1.1; margin-bottom: 0.75rem; }',
    'header.hero p { max-width: 36rem; margin: 0 auto 1.5rem; font-size: 1rem; opacity: 0.9; }',
    'header.hero .hero-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem; }',
    'header.hero .pill { padding: 0.5rem 0.9rem; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.4); font-size: 0.75rem; background: rgba(15, 23, 42, 0.7); }',
    'header.hero .cta-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }',
    'header.hero .btn-primary { padding: 0.75rem 1.4rem; border-radius: 999px; background: #f9fafb; color: #0f172a; font-weight: 600; font-size: 0.9rem; }',
    'header.hero .btn-secondary { padding: 0.7rem 1.3rem; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.5); background: transparent; color: #e5e7eb; font-size: 0.85rem; }',
    'section.schedule, section.registration, section.speakers, section.sponsors, section.faq, section.countdown, section.video-section, section.gallery, section.cta-section, section.venue { padding: 2.5rem 1.5rem; max-width: 64rem; margin: 0 auto; }',
    'section.schedule h2, section.registration h2, section.speakers h2, section.sponsors h2, section.faq h2, section.countdown h2, section.video-section h2, section.gallery h2, section.cta-section h2, section.venue h2 { font-size: 1.5rem; margin-bottom: 0.75rem; }',
    'section.schedule ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }',
    'section.schedule li { padding: 0.9rem 1rem; border-radius: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.35); background: #f9fafb; }',
    'section.registration form { display: grid; gap: 0.75rem; max-width: 28rem; }',
    'section.registration label { font-size: 0.8rem; font-weight: 500; color: #0f172a; }',
    'section.registration input, section.registration select { margin-top: 0.3rem; border-radius: 0.6rem; border: 1px solid rgba(148, 163, 184, 0.7); padding: 0.55rem 0.75rem; font-size: 0.85rem; }',
    'section.registration button { margin-top: 0.5rem; padding: 0.75rem 1rem; border-radius: 0.75rem; border: none; background: var(--th-primary); color: #f9fafb; font-weight: 600; font-size: 0.9rem; }',
    // Speakers section
    '.speakers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }',
    '.speaker-card { padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.35); background: #f9fafb; text-align: center; }',
    '.speaker-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--th-primary), rgba(37, 99, 235, 0.7)); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff; }',
    '.speaker-card h3 { font-size: 1.1rem; margin-bottom: 0.25rem; }',
    '.speaker-role { font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; }',
    '.speaker-bio { font-size: 0.8rem; color: #475569; line-height: 1.5; }',
    // Sponsors section
    '.sponsors-tier { margin-bottom: 2rem; }',
    '.tier-label { font-size: 0.9rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }',
    '.sponsors-row { display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; }',
    '.sponsor-logo { width: 140px; height: 70px; border-radius: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.35); background: #f9fafb; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #94a3b8; }',
    '.sponsor-gold { width: 120px; height: 60px; }',
    '.sponsor-silver { width: 100px; height: 50px; }',
    // FAQ section
    '.faq-list { display: grid; gap: 0.75rem; margin-top: 1.5rem; }',
    '.faq-item { border-radius: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.35); background: #f9fafb; overflow: hidden; }',
    '.faq-item summary { padding: 1rem 1.25rem; font-weight: 500; cursor: pointer; list-style: none; }',
    '.faq-item summary::-webkit-details-marker { display: none; }',
    '.faq-item p { padding: 0 1.25rem 1rem; color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0; }',
    // Countdown section
    '.countdown { text-align: center; background: linear-gradient(135deg, var(--th-primary), rgba(15, 23, 42, 0.95)); color: #f9fafb; }',
    '.countdown-timer { display: flex; justify-content: center; gap: 1.5rem; margin: 2rem 0; }',
    '.countdown-unit { display: flex; flex-direction: column; align-items: center; }',
    '.countdown-value { font-size: 3rem; font-weight: 700; line-height: 1; background: rgba(255,255,255,0.15); padding: 1rem 1.5rem; border-radius: 0.75rem; min-width: 80px; }',
    '.countdown-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; opacity: 0.8; }',
    // Video section
    '.video-wrapper { margin-top: 1.5rem; }',
    '.video-placeholder { aspect-ratio: 16/9; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed rgba(148, 163, 184, 0.3); }',
    '.play-button { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff; margin-bottom: 1rem; transition: transform 0.2s; }',
    '.play-button:hover { transform: scale(1.1); }',
    '.video-placeholder p { color: #94a3b8; font-size: 0.9rem; }',
    // Gallery section
    '.gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 150px); gap: 1rem; margin-top: 1.5rem; }',
    '.gallery-item { border-radius: 0.75rem; overflow: hidden; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); }',
    '.gallery-item-large { grid-column: span 2; grid-row: span 2; }',
    '.gallery-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 1.5rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); }',
    // CTA section
    '.cta-section { text-align: center; background: linear-gradient(135deg, var(--th-primary), rgba(37, 99, 235, 0.8)); color: #f9fafb; padding: 4rem 1.5rem !important; }',
    '.cta-content { max-width: 600px; margin: 0 auto; }',
    '.cta-section h2 { font-size: 2rem; margin-bottom: 1rem; }',
    '.cta-section p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }',
    '.cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }',
    '.btn-large { padding: 1rem 2rem !important; font-size: 1rem !important; }',
    // Venue section
    '.venue-content { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem; }',
    '.venue-map { border-radius: 1rem; overflow: hidden; min-height: 250px; }',
    '.map-placeholder { width: 100%; height: 100%; min-height: 250px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); display: flex; align-items: center; justify-content: center; font-size: 3rem; }',
    '.venue-details { padding: 1rem 0; }',
    '.venue-details h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }',
    '.venue-address { color: #64748b; margin-bottom: 1.5rem; line-height: 1.6; }',
    '.venue-features { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }',
    '.venue-feature { padding: 0.5rem 1rem; background: #f1f5f9; border-radius: 999px; font-size: 0.85rem; color: #475569; }',
    // Shared
    '.muted { color: #64748b; font-size: 0.9rem; }',
    '.countdown .muted, .cta-section .muted { color: rgba(255,255,255,0.7); }',

    // =====================================================
    // PublicEventPage Template Styles
    // =====================================================
    
    // Hero Section - matches PublicEventPage design with cyan-purple gradient
    '.public-hero { position: relative; overflow: hidden; min-height: 380px; }',
    '.public-hero-overlay { background: linear-gradient(135deg, #67e8f9 0%, #a78bfa 50%, #818cf8 100%); color: #1e293b; padding: 3rem 1rem; text-align: center; }',
    '@media (min-width: 640px) { .public-hero-overlay { padding: 4rem 1.5rem; } }',
    '.public-hero-container { max-width: 900px; margin: 0 auto; }',
    
    // Organization badge - no visible badge in the design
    '.org-badge { display: none; }',
    '.org-badge-text { display: none; }',
    
    // Hero typography - large centered title
    '.public-hero-title { font-size: 2.5rem; font-weight: 300; margin-bottom: 0.75rem; line-height: 1.1; color: #1e293b; font-family: ui-serif, Georgia, Cambria, serif; letter-spacing: -0.02em; }',
    '@media (min-width: 640px) { .public-hero-title { font-size: 3.5rem; } }',
    '@media (min-width: 1024px) { .public-hero-title { font-size: 4rem; } }',
    '.public-hero-description { font-size: 1rem; color: rgba(30, 41, 59, 0.8); margin-bottom: 1.5rem; line-height: 1.6; }',
    '@media (min-width: 640px) { .public-hero-description { font-size: 1.125rem; } }',
    
    // Info chips - pill style badges
    '.info-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; justify-content: center; }',
    '.info-chip { display: inline-flex; align-items: center; gap: 0.375rem; background: rgba(255,255,255,0.25); backdrop-filter: blur(8px); padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.875rem; color: #1e293b; border: 1px solid rgba(255,255,255,0.3); }',
    '.chip-icon { font-size: 0.875rem; }',
    
    // Hero CTA - white button with shadow
    '.hero-cta-row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; align-items: center; }',
    '.cta-primary { display: inline-block; padding: 0.875rem 2rem; background: #ffffff; color: #6366f1; font-weight: 600; border-radius: 0.5rem; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid rgba(255,255,255,0.8); }',
    '.cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }',
    '.cta-secondary { display: inline-flex; align-items: center; gap: 0.5rem; color: #374151; font-size: 0.875rem; }',
    '.cta-secondary:hover { color: #1f2937; }',
    
    // Share icons row
    '.share-icons { display: flex; gap: 0.5rem; }',
    '.share-icon { width: 2rem; height: 2rem; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; color: #475569; font-size: 0.75rem; transition: background 0.2s; }',
    '.share-icon:hover { background: rgba(255,255,255,0.5); }',
    
    // Tabs navigation
    '.event-tabs { display: flex; gap: 0.25rem; padding: 0 1rem; background: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }',
    '.tab-item { padding: 0.875rem 1.25rem; font-size: 0.875rem; color: #64748b; font-weight: 500; border-radius: 0.5rem 0.5rem 0 0; transition: all 0.2s; cursor: pointer; }',
    '.tab-item:hover { color: #1e293b; background: #f8fafc; }',
    '.tab-item.active { background: #6366f1; color: #ffffff; }',
    
    // Details Section - two column layout
    '.public-details { background: #f8fafc; }',
    '.details-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; display: grid; gap: 2rem; }',
    '@media (min-width: 1024px) { .details-container { grid-template-columns: 1fr 340px; padding: 2.5rem 1.5rem; } }',
    
    // Main content cards
    '.details-main { display: grid; gap: 1.5rem; align-content: start; }',
    '.content-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem 1.75rem; }',
    '.card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #0f172a; }',
    '.card-content { color: #475569; line-height: 1.7; margin-bottom: 0.75rem; font-size: 0.95rem; }',
    
    // Highlights list
    '.highlights-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }',
    '.highlight-item { color: #475569; font-size: 0.95rem; padding: 0.5rem 0; }',
    
    // Sidebar
    '.details-sidebar { display: grid; gap: 1.5rem; align-content: start; }',
    '.sidebar-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }',
    '.sidebar-title { font-size: 1rem; font-weight: 600; padding: 1.25rem 1.5rem 1rem; color: #0f172a; margin: 0; }',
    '.sidebar-content { padding: 0 1.5rem 1.25rem; display: grid; gap: 1rem; }',
    
    // Sidebar CTA - purple gradient button
    '.sidebar-cta { display: block; text-align: center; padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; font-weight: 600; margin: 1rem 1.25rem 1.25rem; border-radius: 0.5rem; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3); }',
    '.sidebar-cta:hover { opacity: 0.95; transform: translateY(-1px); }',
    
    // Detail rows with icons
    '.detail-row { display: flex; align-items: flex-start; gap: 0.75rem; }',
    '.detail-icon { width: 2rem; height: 2rem; border-radius: 0.375rem; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0; }',
    '.detail-text { flex: 1; }',
    '.detail-label { font-weight: 500; color: #0f172a; margin-bottom: 0.125rem; font-size: 0.875rem; }',
    '.detail-value { color: #64748b; font-size: 0.875rem; }',
    '.detail-value-muted { color: #94a3b8; font-size: 0.8rem; }',
    
    // Organizer card
    '.organizer-info { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; }',
    '.organizer-avatar { width: 2.75rem; height: 2.75rem; border-radius: 0.5rem; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 600; color: #4f46e5; }',
    '.organizer-details { flex: 1; }',
    '.organizer-name { font-weight: 600; color: #0f172a; font-size: 0.95rem; margin-bottom: 0.125rem; }',
    '.organizer-link { font-size: 0.75rem; color: #6366f1; cursor: pointer; }',
    '.organizer-link:hover { text-decoration: underline; }',
  ];
}
