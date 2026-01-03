import { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import { supabase } from '@/integrations/supabase/looseClient';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  heroBlockHtml, 
  scheduleBlockHtml, 
  registrationBlockHtml,
  speakersBlockHtml,
  sponsorsBlockHtml,
  faqBlockHtml,
  countdownBlockHtml,
  videoBlockHtml,
  galleryBlockHtml,
  ctaBlockHtml,
  venueBlockHtml,
} from './pageBuilderBlocks';
import { getCanvasStyles } from './pageBuilderStyles';
import { slugify, extractTitleFromHtml, extractDescriptionFromHtml } from './pageBuilderUtils';

interface LandingPageDataMeta {
  title?: string;
  description?: string;
}

interface LandingPageData {
  html: string;
  css: string;
  meta?: LandingPageDataMeta;
}

interface EventData {
  name: string;
  description: string;
  branding: any;
  existingLanding: LandingPageData | null;
  existingSlug: string;
}

interface UsePageBuilderOptions {
  eventId?: string;
}

export function usePageBuilder({ eventId }: UsePageBuilderOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
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

        const data: EventData = {
          name: eventRow.name,
          description: eventRow.description || '',
          branding: (eventRow.branding as any) || {},
          existingLanding: (eventRow as any).landing_page_data ?? null,
          existingSlug: (eventRow as any).landing_page_slug ?? '',
        };

        setEventData(data);
        setSlug(data.existingSlug || slugify(data.name));
        setLoading(false);
      } catch (err) {
        console.error('Failed to load event', err);
        toast({
          title: 'Failed to load builder',
          description: 'Please refresh the page or try again later.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, toast, navigate]);

  // Initialize GrapesJS editor with default UI
  useEffect(() => {
    if (loading || !eventData || !containerRef.current || editorRef.current) return;

    const { name, description, branding, existingLanding } = eventData;
    const primaryColor = branding?.primaryColor || '#2563eb';
    const logoUrl = branding?.logoUrl as string | undefined;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      selectorManager: { componentFirst: true },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px' },
          { name: 'Mobile', width: '375px' },
        ],
      },
      canvas: {
        styles: getCanvasStyles(primaryColor),
      },
    });

    editorRef.current = editor;

    // Add device commands
    editor.Commands.add('set-device-desktop', {
      run: (ed) => ed.setDevice('Desktop'),
    });
    editor.Commands.add('set-device-tablet', {
      run: (ed) => ed.setDevice('Tablet'),
    });
    editor.Commands.add('set-device-mobile', {
      run: (ed) => ed.setDevice('Mobile'),
    });

    // Add custom blocks
    const blockManager = editor.BlockManager;

    blockManager.add('hero-block', {
      label: 'Hero Section',
      category: 'Event Sections',
      content: heroBlockHtml({ name, description, logoUrl }),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
    });

    blockManager.add('schedule-block', {
      label: 'Event Schedule',
      category: 'Event Sections',
      content: scheduleBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    });

    blockManager.add('registration-block', {
      label: 'Registration Form',
      category: 'Event Sections',
      content: registrationBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>',
    });

    blockManager.add('speakers-block', {
      label: 'Speakers',
      category: 'Event Sections',
      content: speakersBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
    });

    blockManager.add('sponsors-block', {
      label: 'Sponsors',
      category: 'Event Sections',
      content: sponsorsBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="8" width="18" height="8" rx="2"/></svg>',
    });

    blockManager.add('faq-block', {
      label: 'FAQ',
      category: 'Event Sections',
      content: faqBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    });

    blockManager.add('countdown-block', {
      label: 'Countdown Timer',
      category: 'Event Sections',
      content: countdownBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    });

    blockManager.add('video-block', {
      label: 'Video',
      category: 'Media',
      content: videoBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>',
    });

    blockManager.add('gallery-block', {
      label: 'Gallery',
      category: 'Media',
      content: galleryBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    });

    blockManager.add('cta-block', {
      label: 'CTA Section',
      category: 'Event Sections',
      content: ctaBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="8" width="16" height="8" rx="2"/></svg>',
    });

    blockManager.add('venue-block', {
      label: 'Venue',
      category: 'Event Sections',
      content: venueBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    });

    // Load existing content or seed with defaults
    if (existingLanding?.html) {
      editor.setComponents(existingLanding.html);
      if (existingLanding.css) {
        editor.setStyle(existingLanding.css);
      }
    } else {
      editor.setComponents(`
        ${heroBlockHtml({ name, description, logoUrl })}
        ${scheduleBlockHtml()}
        ${registrationBlockHtml()}
      `);
    }

    // Add save command
    editor.Commands.add('save-page', {
      run: async () => {
        const html = editor.getHtml();
        const css = editor.getCss() || '';
        const meta: LandingPageDataMeta = {
          title: extractTitleFromHtml(html) || undefined,
          description: extractDescriptionFromHtml(html) || undefined,
        };
        const payload: LandingPageData = { html, css, meta };

        try {
          setSaving(true);
          const { error } = await supabase
            .from('events')
            .update({
              landing_page_data: payload,
              landing_page_slug: slug,
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
          setSaving(false);
        }
      },
    });

    // Add save button to the default panel
    editor.Panels.addButton('options', {
      id: 'save',
      className: 'fa fa-floppy-o',
      command: 'save-page',
      attributes: { title: 'Save Page' },
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [loading, eventData, slug, eventId, toast]);

  return {
    containerRef,
    editorRef,
    loading,
    saving,
  };
}
