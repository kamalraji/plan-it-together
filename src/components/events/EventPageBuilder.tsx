import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { supabase } from '@/integrations/supabase/looseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EventPageBuilderState {
  slug: string;
  loading: boolean;
  saving: boolean;
}

interface LandingPageDataMeta {
  title?: string;
  description?: string;
}

interface LandingPageData {
  html: string;
  css: string;
  meta?: LandingPageDataMeta;
}

/**
 * EventPageBuilder
 *
 * Organizer-only GrapesJS-based landing page builder for events.
 * - Initializes a drag-and-drop editor
 * - Provides custom blocks (Hero, Schedule, Registration)
 * - Syncs default branding from the event's organization
 * - Saves HTML/CSS/meta into events.landing_page_data (jsonb)
 * - Manages a unique landing_page_slug per event
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<EventPageBuilderState>({ slug: '', loading: true, saving: false });
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');

  useEffect(() => {
    if (!eventId) return;

    const loadEventAndInit = async () => {
      try {
        const { data: eventRow, error } = await supabase
          .from('events')
          .select('id, name, description, organization_id, branding, landing_page_data, landing_page_slug')
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        if (!eventRow) {
          toast({
            title: 'Event not found',
            description: 'We could not find this event.',
            variant: 'destructive',
          });
          navigate(-1);
          return;
        }

        const branding = (eventRow.branding as any) || {};
        const existingLanding: LandingPageData | null = (eventRow as any).landing_page_data ?? null;
        const existingSlug: string = (eventRow as any).landing_page_slug ?? '';

        setState((prev) => ({
          ...prev,
          slug: existingSlug || slugify(eventRow.name),
          loading: false,
        }));

        const primaryColor = branding.primaryColor || '#2563eb';
        const logoUrl = branding.logoUrl as string | undefined;

        if (!containerRef.current) return;

        const editor = grapesjs.init({
          container: containerRef.current,
          height: '100%',
          fromElement: false,
          storageManager: false,
          selectorManager: { componentFirst: true },
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Mobile', width: '375px' },
            ],
          },
          canvas: {
            styles: [
              // Base Tailwind-like reset
              'body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; color: #020617; background-color: #ffffff; }',
              'a { color: inherit; text-decoration: none; }',
              'img { max-width: 100%; height: auto; display: block; }',
              // Thittam1Hub-inspired brand tokens
              `:root { --th-primary: ${primaryColor}; }`,
              'header.hero { padding: 3rem 1.5rem; text-align: center; background: linear-gradient(135deg, var(--th-primary), rgba(15, 23, 42, 0.95)); color: #f9fafb; }',
              'header.hero h1 { font-size: 2.25rem; line-height: 1.1; margin-bottom: 0.75rem; }',
              'header.hero p { max-width: 36rem; margin: 0 auto 1.5rem; font-size: 1rem; opacity: 0.9; }',
              'header.hero .hero-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem; }',
              'header.hero .pill { padding: 0.5rem 0.9rem; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.4); font-size: 0.75rem; background: rgba(15, 23, 42, 0.7); }',
              'header.hero .cta-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }',
              'header.hero .btn-primary { padding: 0.75rem 1.4rem; border-radius: 999px; background: #f9fafb; color: #0f172a; font-weight: 600; font-size: 0.9rem; }',
              'header.hero .btn-secondary { padding: 0.7rem 1.3rem; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.5); background: transparent; color: #e5e7eb; font-size: 0.85rem; }',
              'section.schedule, section.registration { padding: 2.5rem 1.5rem; max-width: 64rem; margin: 0 auto; }',
              'section.schedule h2, section.registration h2 { font-size: 1.5rem; margin-bottom: 0.75rem; }',
              'section.schedule ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }',
              'section.schedule li { padding: 0.9rem 1rem; border-radius: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.35); background: #f9fafb; }',
              'section.registration form { display: grid; gap: 0.75rem; max-width: 28rem; }',
              'section.registration label { font-size: 0.8rem; font-weight: 500; color: #0f172a; }',
              'section.registration input, section.registration select { margin-top: 0.3rem; border-radius: 0.6rem; border: 1px solid rgba(148, 163, 184, 0.7); padding: 0.55rem 0.75rem; font-size: 0.85rem; }',
              'section.registration button { margin-top: 0.5rem; padding: 0.75rem 1rem; border-radius: 0.75rem; border: none; background: var(--th-primary); color: #f9fafb; font-weight: 600; font-size: 0.9rem; }',
            ],
          },
        });

        editorRef.current = editor;

        // Devices
        editor.on('loaded', () => {
          editor.setDevice(device);
        });

        // Custom Blocks
        const blockManager = editor.BlockManager;

        blockManager.add('hero-block', {
          label: 'Hero Section',
          category: 'Sections',
          content: heroBlockHtml({
            name: eventRow.name,
            description: eventRow.description,
            logoUrl,
          }),
        });

        blockManager.add('schedule-block', {
          label: 'Event Schedule',
          category: 'Sections',
          content: scheduleBlockHtml(),
        });

        blockManager.add('registration-block', {
          label: 'Registration Form',
          category: 'Sections',
          content: registrationBlockHtml(),
        });

        // Load existing landing page content if available
        if (existingLanding?.html) {
          editor.setComponents(existingLanding.html);
          if (existingLanding.css) {
            editor.setStyle(existingLanding.css);
          }
        } else {
          // Seed with a default hero and schedule
          editor.setComponents(`
            ${heroBlockHtml({ name: eventRow.name, description: eventRow.description, logoUrl })}
            ${scheduleBlockHtml()}
            ${registrationBlockHtml()}
          `);
        }
      } catch (err) {
        console.error('Failed to initialize Event Page Builder', err);
        toast({
          title: 'Failed to load builder',
          description: 'Please refresh the page or try again later.',
          variant: 'destructive',
        });
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadEventAndInit();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [eventId, toast, navigate, device]);

  const handleSave = async () => {
    if (!editorRef.current || !eventId) return;
    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss() || '';

    const meta: LandingPageDataMeta = {
      title: extractTitleFromHtml(html) || undefined,
      description: extractDescriptionFromHtml(html) || undefined,
    };

    const payload: LandingPageData = {
      html,
      css,
      meta,
    };

    try {
      setState((prev) => ({ ...prev, saving: true }));

      const { error } = await supabase
        .from('events')
        .update({
          landing_page_data: payload,
          landing_page_slug: state.slug,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Landing page saved',
        description: 'Your event page is live on the public landing URL.',
      });
    } catch (err) {
      console.error('Failed to save landing page', err);
      toast({
        title: 'Save failed',
        description: 'We could not save your landing page. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDeviceChange = (nextDevice: 'Desktop' | 'Mobile') => {
    setDevice(nextDevice);
    if (editorRef.current) {
      editorRef.current.setDevice(nextDevice);
    }
  };

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Event page builder
            </p>
            <h1 className="text-xl font-semibold text-foreground">Design your public event page</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">Public URL slug</span>
              <Input
                value={state.slug}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                className="h-7 w-40 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                placeholder="my-event"
              />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1 py-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleDeviceChange('Desktop')}
                className={cn(
                  'rounded-full px-2 py-0.5 transition-colors',
                  device === 'Desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => handleDeviceChange('Mobile')}
                className={cn(
                  'rounded-full px-2 py-0.5 transition-colors',
                  device === 'Mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                Mobile
              </button>
            </div>
            <Button onClick={handleSave} disabled={state.saving} size="sm">
              {state.saving ? 'Saving…' : 'Save & publish'}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="h-[70vh] min-h-[480px] overflow-hidden rounded-xl bg-background" ref={containerRef} />
        </section>
        <p className="text-xs text-muted-foreground">
          Tip: Use the pre-built Hero, Schedule, and Registration blocks from the left sidebar to quickly assemble a
          high-converting event page.
        </p>
      </main>
    </div>
  );
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function heroBlockHtml({
  name,
  description,
  logoUrl,
}: {
  name: string;
  description: string;
  logoUrl?: string;
}): string {
  const safeName = name || 'Your event name';
  const safeDescription = description || 'Add a short description to explain why this event matters.';

  const logoImg = logoUrl
    ? `<div class="hero-logo" aria-hidden="true"><img src="${logoUrl}" alt="${safeName} logo" /></div>`
    : '';

  return `
  <header class="hero" data-type="hero">
    <div class="hero-inner">
      ${logoImg}
      <p class="eyebrow">Hosted on Thittam1Hub</p>
      <h1>${safeName}</h1>
      <p class="lead">${safeDescription}</p>
      <div class="hero-meta" aria-label="Event key info">
        <span class="pill">Date &amp; time</span>
        <span class="pill">Location or virtual link</span>
        <span class="pill">Limited seats • Reserve now</span>
      </div>
      <div class="cta-row" aria-label="Primary actions">
        <a href="#registration" class="btn-primary">Register now</a>
        <a href="#schedule" class="btn-secondary">View schedule</a>
      </div>
    </div>
  </header>
  `;
}

function scheduleBlockHtml(): string {
  return `
  <section id="schedule" class="schedule" aria-label="Event schedule">
    <h2>Schedule</h2>
    <p class="muted">Outline the key moments so attendees know what to expect.</p>
    <ul>
      <li>
        <strong>09:00 – Check-in &amp; networking</strong>
        <p>Welcome coffee and badge pickup.</p>
      </li>
      <li>
        <strong>10:00 – Opening keynote</strong>
        <p>Kick off the day with an inspiring keynote.</p>
      </li>
      <li>
        <strong>11:30 – Breakout sessions</strong>
        <p>Parallel tracks tailored to different audiences.</p>
      </li>
    </ul>
  </section>
  `;
}

function registrationBlockHtml(): string {
  return `
  <section id="registration" class="registration" aria-label="Registration form">
    <h2>Reserve your seat</h2>
    <p class="muted">This is a visual-only form. Actual registration happens on the main Thittam1Hub flow.</p>
    <form>
      <label>
        Full name
        <input type="text" name="name" placeholder="Jane Doe" />
      </label>
      <label>
        Email address
        <input type="email" name="email" placeholder="you@example.com" />
      </label>
      <label>
        Ticket type
        <select name="ticket">
          <option>General admission</option>
          <option>Student</option>
          <option>VIP</option>
        </select>
      </label>
      <button type="button">Complete registration on Thittam1Hub</button>
    </form>
  </section>
  `;
}

function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match ? stripTags(match[1]) : null;
}

function extractDescriptionFromHtml(html: string): string | null {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripTags(match[1]) : null;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}
