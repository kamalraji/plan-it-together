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
} from './pageBuilderBlocks';
import { getCanvasStyles } from './pageBuilderStyles';
import { slugify, extractTitleFromHtml, extractDescriptionFromHtml } from './pageBuilderUtils';
import type { LayerData } from './LeftPanel';
import type { AnimationConfig } from './RightPanel';

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
  const [device, setDevice] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const [hasCustomLanding, setHasCustomLanding] = useState(false);
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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

  // Update undo/redo state
  const updateUndoRedoState = useCallback(() => {
    if (editorRef.current) {
      const um = editorRef.current.UndoManager;
      setCanUndo(um.hasUndo());
      setCanRedo(um.hasRedo());
    }
  }, []);

  // Sync layers from GrapesJS components
  const syncLayers = useCallback(() => {
    if (!editorRef.current) return;
    
    const wrapper = editorRef.current.getWrapper();
    if (!wrapper) return;

    const extractLayers = (component: any, level: number = 0): LayerData[] => {
      const result: LayerData[] = [];
      const components = component.components?.() || [];
      
      components.forEach((comp: any) => {
        const tagName = comp.get('tagName')?.toLowerCase() || 'div';
        const customName = comp.get('custom-name') || comp.get('name');
        
        // Determine icon based on tag or class
        let IconComponent: any;
        const classList = comp.getClasses?.() || [];
        
        if (tagName === 'img' || classList.some((c: string) => c.includes('image'))) {
          const { Image } = require('lucide-react');
          IconComponent = Image;
        } else if (tagName === 'video' || classList.some((c: string) => c.includes('video'))) {
          const { Video } = require('lucide-react');
          IconComponent = Video;
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName)) {
          const { Type } = require('lucide-react');
          IconComponent = Type;
        } else if (tagName === 'nav') {
          const { Navigation } = require('lucide-react');
          IconComponent = Navigation;
        } else if (tagName === 'header' || tagName === 'footer') {
          const { LayoutTemplate } = require('lucide-react');
          IconComponent = LayoutTemplate;
        } else if (tagName === 'section') {
          const { Layout } = require('lucide-react');
          IconComponent = Layout;
        } else {
          const { Square } = require('lucide-react');
          IconComponent = Square;
        }

        const hasChildren = (comp.components?.()?.length || 0) > 0;
        
        result.push({
          id: comp.cid,
          icon: IconComponent,
          label: customName || tagName.toUpperCase(),
          level,
          expanded: hasChildren ? true : undefined,
          visible: comp.get('visible') !== false,
          locked: comp.get('locked') === true,
        });

        if (hasChildren && level < 5) {
          result.push(...extractLayers(comp, level + 1));
        }
      });

      return result;
    };

    const newLayers = extractLayers(wrapper);
    setLayers(newLayers);
  }, []);

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
          { name: 'Tablet', width: '768px' },
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
      traitManager: {
        appendTo: '.panel-traits',
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

    blockManager.add('speakers-block', {
      label: 'Speakers',
      category: 'Sections',
      content: speakersBlockHtml(),
    });

    blockManager.add('sponsors-block', {
      label: 'Sponsors',
      category: 'Sections',
      content: sponsorsBlockHtml(),
    });

    blockManager.add('faq-block', {
      label: 'FAQ',
      category: 'Sections',
      content: faqBlockHtml(),
    });

    blockManager.add('countdown-block', {
      label: 'Countdown Timer',
      category: 'Sections',
      content: countdownBlockHtml(),
    });

    blockManager.add('video-block', {
      label: 'Video',
      category: 'Media',
      content: videoBlockHtml(),
    });

    blockManager.add('gallery-block', {
      label: 'Gallery',
      category: 'Media',
      content: galleryBlockHtml(),
    });

    blockManager.add('cta-block', {
      label: 'CTA Section',
      category: 'Sections',
      content: ctaBlockHtml(),
    });

    blockManager.add('venue-block', {
      label: 'Venue',
      category: 'Sections',
      content: venueBlockHtml(),
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

    // Sync layers after content is loaded
    setTimeout(() => {
      syncLayers();
      updateUndoRedoState();
    }, 100);

    // Listen for component changes to sync layers
    editor.on('component:add', syncLayers);
    editor.on('component:remove', syncLayers);
    editor.on('component:update', syncLayers);
    editor.on('component:selected', (component) => {
      setSelectedLayerId(component?.cid);
    });
    editor.on('component:deselected', () => {
      setSelectedLayerId(undefined);
    });

    // Listen for undo/redo changes
    editor.on('change:changesCount', updateUndoRedoState);

    // Setup keyboard shortcuts for undo/redo
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.UndoManager.undo();
        updateUndoRedoState();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        editor.UndoManager.redo();
        updateUndoRedoState();
      }
    };
    document.addEventListener('keydown', handleKeyboard);

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [loading, eventData, syncLayers, updateUndoRedoState]);

  const handleDeviceChange = useCallback((nextDevice: 'Desktop' | 'Tablet' | 'Mobile') => {
    setDevice(nextDevice);
    if (editorRef.current) {
      editorRef.current.setDevice(nextDevice);
    }
  }, []);

  const handleUndo = useCallback(() => {
    editorRef.current?.UndoManager.undo();
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    editorRef.current?.UndoManager.redo();
    updateUndoRedoState();
  }, [updateUndoRedoState]);

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

  // Layer manipulation handlers
  const handleLayersReorder = useCallback((newLayers: LayerData[]) => {
    setLayers(newLayers);
    // In a full implementation, this would reorder components in GrapesJS
    toast({
      title: 'Layers reordered',
      description: 'Drag-and-drop reordering applied.',
    });
  }, [toast]);

  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
    if (editorRef.current) {
      const wrapper = editorRef.current.getWrapper();
      const findComponent = (parent: any, id: string): any => {
        const components = parent.components?.() || [];
        for (const comp of components) {
          if (comp.cid === id) return comp;
          const found = findComponent(comp, id);
          if (found) return found;
        }
        return null;
      };
      const component = findComponent(wrapper, layerId);
      if (component) {
        editorRef.current.select(component);
      }
    }
  }, []);

  const handleLayerVisibilityToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
    // Toggle visibility in GrapesJS
    if (editorRef.current) {
      const wrapper = editorRef.current.getWrapper();
      const findComponent = (parent: any, id: string): any => {
        const components = parent.components?.() || [];
        for (const comp of components) {
          if (comp.cid === id) return comp;
          const found = findComponent(comp, id);
          if (found) return found;
        }
        return null;
      };
      const component = findComponent(wrapper, layerId);
      if (component) {
        const currentVisibility = component.get('visible') !== false;
        component.set('visible', !currentVisibility);
        component.view?.el?.style?.setProperty('display', currentVisibility ? 'none' : '');
      }
    }
  }, []);

  const handleLayerLockToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, locked: !l.locked } : l
    ));
  }, []);

  const handleLayerDelete = useCallback((layerId: string) => {
    if (editorRef.current) {
      const wrapper = editorRef.current.getWrapper();
      const findComponent = (parent: any, id: string): any => {
        const components = parent.components?.() || [];
        for (const comp of components) {
          if (comp.cid === id) return comp;
          const found = findComponent(comp, id);
          if (found) return found;
        }
        return null;
      };
      const component = findComponent(wrapper, layerId);
      if (component) {
        component.remove();
        syncLayers();
      }
    }
  }, [syncLayers]);

  // Apply animation to selected element
  const handleApplyAnimation = useCallback((animationType: string, config: AnimationConfig) => {
    if (!editorRef.current) return;
    
    const selected = editorRef.current.getSelected();
    if (!selected) {
      toast({
        title: 'No element selected',
        description: 'Please select an element to apply the animation.',
        variant: 'destructive',
      });
      return;
    }

    // Generate CSS for the animation
    const animationCSS = generateAnimationCSS(animationType, config);
    
    // Apply to the selected component
    selected.addStyle(animationCSS);

    toast({
      title: 'Animation applied',
      description: `Applied ${animationType} animation to the selected element.`,
    });
  }, [toast]);

  return {
    containerRef,
    editorRef,
    slug,
    setSlug,
    loading,
    saving,
    device,
    hasCustomLanding,
    canUndo,
    canRedo,
    layers,
    selectedLayerId,
    handleDeviceChange,
    handleUndo,
    handleRedo,
    handlePreview,
    handleSave,
    handleLayersReorder,
    handleLayerSelect,
    handleLayerVisibilityToggle,
    handleLayerLockToggle,
    handleLayerDelete,
    handleApplyAnimation,
  };
}

// Helper to generate animation CSS
function generateAnimationCSS(animationType: string, config: AnimationConfig): Record<string, string> {
  const { duration, delay, easing } = config;
  const easingMap: Record<string, string> = {
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  const easingValue = easingMap[easing] || 'ease-out';
  
  if (config.type === 'hover') {
    // Hover effects
    switch (animationType) {
      case 'scale':
        return { 'transition': `transform ${duration}s ${easingValue}`, ':hover': 'transform: scale(1.05)' };
      case 'glow':
        return { 'transition': `box-shadow ${duration}s ${easingValue}`, ':hover': 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)' };
      case 'lift':
        return { 'transition': `transform ${duration}s ${easingValue}, box-shadow ${duration}s ${easingValue}`, ':hover': 'transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.2)' };
      default:
        return { 'transition': `all ${duration}s ${easingValue}` };
    }
  } else {
    // Entrance animations  
    const animationName = `anim-${animationType}-${Date.now()}`;
    
    return {
      'animation-name': animationName,
      'animation-duration': `${duration}s`,
      'animation-delay': `${delay}s`,
      'animation-timing-function': easingValue,
      'animation-fill-mode': 'forwards',
    };
  }
}
