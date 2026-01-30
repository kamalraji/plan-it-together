import { useEffect, useRef, useState, useCallback } from 'react';
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
  getInitialPublicEventTemplate,
} from './pageBuilderBlocks';
import { getCanvasStyles } from './pageBuilderStyles';
import { slugify, extractTitleFromHtml, extractDescriptionFromHtml } from './pageBuilderUtils';
import { initializePlugins } from './grapesjsPlugins';
import { templatesPlugin } from './grapesjsTemplatesPlugin';
import { assetUploadPlugin } from './grapesjsAssetPlugin';
import { TemplateData } from './TemplatesGallery';
import { LayerData } from './LeftPanel';
import { AnimationConfig } from './RightPanel';
import { injectEventDataIntoTemplate } from './templates/templateDataInjector';

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
  organizationName?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'in_person' | 'virtual' | 'hybrid';
  capacity?: number | null;
  category?: string | null;
}

interface UsePageBuilderOptions {
  eventId?: string;
}

export function usePageBuilder({ eventId }: UsePageBuilderOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<Editor | null>(null);
  
  // Container refs for GrapesJS rendering
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blocksContainerRef = useRef<HTMLDivElement | null>(null);
  const layersContainerRef = useRef<HTMLDivElement | null>(null);
  const stylesContainerRef = useRef<HTMLDivElement | null>(null);
  const traitsContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        const { data: eventRow, error } = await supabase
          .from('events')
          .select(`
            id, name, description, organization_id, branding, landing_page_data, landing_page_slug,
            start_date, end_date, mode, capacity, category,
            organizations:organization_id ( name )
          `)
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

        const org = eventRow.organizations as { name: string } | null;

        const data: EventData = {
          name: eventRow.name,
          description: eventRow.description || '',
          branding: (eventRow.branding as any) || {},
          existingLanding: (eventRow as any).landing_page_data ?? null,
          existingSlug: (eventRow as any).landing_page_slug ?? '',
          organizationName: org?.name,
          startDate: eventRow.start_date,
          endDate: eventRow.end_date,
          mode: eventRow.mode as 'in_person' | 'virtual' | 'hybrid',
          capacity: eventRow.capacity,
          category: eventRow.category,
        };

        setEventData(data);
        setSlug(data.existingSlug || slugify(data.name));
        setLoading(false);
      } catch {
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

  // Initialize GrapesJS editor
  useEffect(() => {
    if (loading || !eventData || !containerRef.current || editorRef.current) return;

    const { name, description, branding, existingLanding, organizationName, startDate, endDate, mode, capacity, category } = eventData;
    const primaryColor = branding?.primaryColor || '#2563eb';
    const logoUrl = branding?.logoUrl as string | undefined;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      
      // Hide default panels - we use custom ones
      panels: { defaults: [] },
      
      selectorManager: {
        componentFirst: true,
      },

      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },

      styleManager: {
        sectors: [
          {
            name: 'General',
            open: true,
            buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'],
          },
          {
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
          },
          {
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-transform'],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'],
          },
          {
            name: 'Extra',
            open: false,
            buildProps: ['opacity', 'transition', 'transform', 'cursor', 'overflow'],
          },
        ],
      },

      blockManager: {
        // Render blocks directly into our custom left panel container when available
        appendTo: blocksContainerRef.current || undefined,
        blocks: [
          {
            id: 'section',
            label: 'Section',
            category: 'Basic',
            content: '<section class="gjs-section"><div class="gjs-container"></div></section>',
            media: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor"/></svg>',
          },
          {
            id: 'text',
            label: 'Text',
            category: 'Basic',
            content: '<div data-gjs-type="text">Insert your text here</div>',
            media: '<svg viewBox="0 0 24 24"><text x="3" y="17" font-size="14" fill="currentColor">T</text></svg>',
          },
          {
            id: 'image',
            label: 'Image',
            category: 'Basic',
            select: true,
            content: { type: 'image' },
            activate: true,
            media: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><path d="M21 15l-5-5L5 21" fill="white"/></svg>',
          },
          {
            id: 'video',
            label: 'Video',
            category: 'Basic',
            select: true,
            content: { type: 'video' },
            media: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor"/><polygon points="10,9 15,12 10,15" fill="white"/></svg>',
          },
          {
            id: 'button',
            label: 'Button',
            category: 'Basic',
            content: '<a class="gjs-button" href="#">Click me</a>',
            media: '<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="4" fill="currentColor"/></svg>',
          },
          {
            id: 'divider',
            label: 'Divider',
            category: 'Basic',
            content: '<hr class="gjs-divider" />',
            media: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
          },
          {
            id: 'columns-2',
            label: '2 Columns',
            category: 'Layout',
            content: `<div class="gjs-row"><div class="gjs-cell"></div><div class="gjs-cell"></div></div>`,
            media: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="9" height="16" fill="currentColor"/><rect x="13" y="4" width="9" height="16" fill="currentColor"/></svg>',
          },
          {
            id: 'columns-3',
            label: '3 Columns',
            category: 'Layout',
            content: `<div class="gjs-row"><div class="gjs-cell"></div><div class="gjs-cell"></div><div class="gjs-cell"></div></div>`,
            media: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="6" height="16" fill="currentColor"/><rect x="9" y="4" width="6" height="16" fill="currentColor"/><rect x="16" y="4" width="6" height="16" fill="currentColor"/></svg>',
          },
          {
            id: 'link',
            label: 'Link',
            category: 'Basic',
            content: '<a href="#">Link text</a>',
            media: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
          },
          {
            id: 'map',
            label: 'Map',
            category: 'Basic',
            content: { type: 'map' },
            media: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/><circle cx="12" cy="10" r="3" fill="white"/></svg>',
          },
        ],
      },

      canvas: {
        styles: getCanvasStyles(primaryColor),
      },
    });

    editorRef.current = editor;

    // Add event-specific blocks
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
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>',
    });
    blockManager.add('registration-block', {
      label: 'Registration Form',
      category: 'Event Sections',
      content: registrationBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
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
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    });
    blockManager.add('countdown-block', {
      label: 'Countdown Timer',
      category: 'Event Sections',
      content: countdownBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" stroke="white" stroke-width="2" fill="none"/></svg>',
    });
    blockManager.add('video-block', {
      label: 'Event Video',
      category: 'Media',
      content: videoBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15" fill="white"/></svg>',
    });
    blockManager.add('gallery-block', {
      label: 'Gallery',
      category: 'Media',
      content: galleryBlockHtml(),
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
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
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>',
    });

    // Render managers to custom containers
    editor.on('load', () => {
      // Render Style Manager to custom container
      if (stylesContainerRef.current) {
        const smEl = (editor.StyleManager as any).render?.();
        if (smEl) {
          stylesContainerRef.current.innerHTML = '';
          stylesContainerRef.current.appendChild(smEl);
        }
      }

      // Render Trait Manager to custom container  
      if (traitsContainerRef.current) {
        const tmEl = (editor.TraitManager as any).render?.();
        if (tmEl) {
          traitsContainerRef.current.innerHTML = '';
          traitsContainerRef.current.appendChild(tmEl);
        }
      }

      // Block Manager is rendered via `blockManager.appendTo` in the init config
      // (keeps native drag/drop behavior)

      // Render Layer Manager to custom container
      if (layersContainerRef.current) {
        const lmEl = (editor.LayerManager as any).render?.();
        if (lmEl) {
          layersContainerRef.current.innerHTML = '';
          layersContainerRef.current.appendChild(lmEl);
        }
      }
    });

    // Custom commands
    editor.Commands.add('set-device-desktop', { run: (ed) => ed.setDevice('Desktop') });
    editor.Commands.add('set-device-tablet', { run: (ed) => ed.setDevice('Tablet') });
    editor.Commands.add('set-device-mobile', { run: (ed) => ed.setDevice('Mobile') });

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
            .update({ landing_page_data: payload, landing_page_slug: slug })
            .eq('id', eventId);

          if (error) throw error;
          toast({ title: 'Landing page saved', description: 'Your event page has been saved successfully.' });
        } catch {
          toast({ title: 'Save failed', description: 'We could not save your landing page. Please try again.', variant: 'destructive' });
        } finally {
          setSaving(false);
        }
      },
    });

    editor.Commands.add('preview-page', {
      run: () => {
        if (eventId) {
          const publicUrl = `${window.location.origin}/events/${eventId}`;
          window.open(publicUrl, '_blank', 'noopener,noreferrer');
        }
      },
    });

    editor.Commands.add('clear-canvas', {
      run: () => {
        if (window.confirm('Are you sure you want to clear the canvas?')) {
          editor.DomComponents.clear();
          editor.CssComposer.clear();
        }
      },
    });

    // Initialize plugins
    initializePlugins(editor);
    templatesPlugin(editor);
    assetUploadPlugin(editor, { eventId });

    // Load existing content or use template with styles
    if (existingLanding?.html) {
      editor.setComponents(existingLanding.html);
      if (existingLanding.css) {
        editor.setStyle(existingLanding.css);
      }
    } else {
      // Use PublicEventPage-style template with real event data
      editor.setComponents(getInitialPublicEventTemplate({ 
        name, 
        description, 
        organizationName,
        startDate,
        endDate,
        mode,
        capacity,
        category,
      }));
      
      // Inject the canvas styles directly into the CSS composer so they render
      const canvasStylesCss = getCanvasStyles(primaryColor).join('\n');
      editor.setStyle(canvasStylesCss);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        editor.runCommand('save-page');
      }
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [loading, eventData, slug, eventId, toast]);

  // Device change handler
  const handleDeviceChange = useCallback((newDevice: 'Desktop' | 'Tablet' | 'Mobile') => {
    setDevice(newDevice);
    editorRef.current?.setDevice(newDevice);
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    editorRef.current?.runCommand('save-page');
  }, []);

  // Preview handler
  const handlePreview = useCallback(() => {
    editorRef.current?.runCommand('preview-page');
  }, []);

  // Apply template - inject real event data into template placeholders
  const handleSelectTemplate = useCallback((template: TemplateData) => {
    if (editorRef.current && template.html && eventData) {
      // Inject event data into template using the utility function
      const html = injectEventDataIntoTemplate(template.html, {
        name: eventData.name,
        description: eventData.description,
        organizationName: eventData.organizationName,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        mode: eventData.mode,
        category: eventData.category ?? undefined,
        capacity: eventData.capacity ?? undefined,
      });
      
      editorRef.current.setComponents(html);
      if (template.css) {
        editorRef.current.setStyle(template.css);
      }
      toast({ title: 'Template applied', description: `"${template.name}" template loaded with your event data.` });
    }
  }, [toast, eventData]);

  // Apply animation
  const handleApplyAnimation = useCallback((animationType: string, _config: AnimationConfig) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const selected = editor.getSelected();
    if (!selected) {
      toast({ title: 'No element selected', description: 'Select an element to apply animation.', variant: 'destructive' });
      return;
    }

    // Apply CSS animation class
    const animClass = `animate-${animationType}`;
    selected.addClass(animClass);
    
    toast({ title: 'Animation applied', description: `${animationType} animation added to element.` });
  }, [toast]);

  // Layer handlers
  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
  }, []);

  const handleLayerVisibilityToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  }, []);

  const handleLayerLockToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
  }, []);

  const handleLayerDelete = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
  }, []);

  const handleLayersReorder = useCallback((newLayers: LayerData[]) => {
    setLayers(newLayers);
  }, []);

  return {
    // Refs
    containerRef,
    blocksContainerRef,
    layersContainerRef,
    stylesContainerRef,
    traitsContainerRef,
    editorRef,
    // State
    loading,
    saving,
    device,
    layers,
    selectedLayerId,
    eventData,
    // Handlers
    handleDeviceChange,
    handleSave,
    handlePreview,
    handleSelectTemplate,
    handleApplyAnimation,
    handleLayerSelect,
    handleLayerVisibilityToggle,
    handleLayerLockToggle,
    handleLayerDelete,
    handleLayersReorder,
  };
}
