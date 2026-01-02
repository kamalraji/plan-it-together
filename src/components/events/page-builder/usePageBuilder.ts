import { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import { supabase } from '@/integrations/supabase/looseClient';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { heroBlockHtml, scheduleBlockHtml, registrationBlockHtml } from './pageBuilderBlocks';
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
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');
  const [hasCustomLanding, setHasCustomLanding] = useState(false);

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
        setHasCustomLanding(!!data.existingLanding?.html);
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

  // Initialize GrapesJS editor when container and data are ready
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
          { name: 'Mobile', width: '375px' },
        ],
      },
      panels: {
        defaults: [],
      },
      blockManager: {
        appendTo: '.panel-blocks',
      },
      layerManager: {
        appendTo: '.panel-layers',
      },
      styleManager: {
        appendTo: '.panel-styles',
        sectors: [
          {
            name: 'General',
            open: true,
            properties: ['display', 'float', 'position', 'top', 'right', 'left', 'bottom'],
          },
          {
            name: 'Dimension',
            open: false,
            properties: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
          },
          {
            name: 'Typography',
            open: false,
            properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-shadow'],
          },
          {
            name: 'Decorations',
            open: false,
            properties: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'],
          },
        ],
      },
      canvas: {
        styles: getCanvasStyles(primaryColor),
      },
    });

    editorRef.current = editor;

    // Add custom blocks
    const blockManager = editor.BlockManager;

    blockManager.add('hero-block', {
      label: 'Hero Section',
      category: 'Sections',
      content: heroBlockHtml({ name, description, logoUrl }),
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

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [loading, eventData]);

  const handleDeviceChange = useCallback((nextDevice: 'Desktop' | 'Mobile') => {
    setDevice(nextDevice);
    if (editorRef.current) {
      editorRef.current.setDevice(nextDevice);
    }
  }, []);

  const handlePreview = useCallback(() => {
    if (!eventId) return;
    const publicUrl = `${window.location.origin}/events/${eventId}`;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  }, [eventId]);

  const handleSave = useCallback(async () => {
    if (!editorRef.current || !eventId) return;
    const editor = editorRef.current;
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
  }, [eventId, slug, toast]);

  return {
    containerRef,
    slug,
    setSlug,
    loading,
    saving,
    device,
    hasCustomLanding,
    handleDeviceChange,
    handlePreview,
    handleSave,
  };
}
