import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, Loader2, ImageIcon, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import {
  CERTIFICATE_BACKGROUNDS,
  BACKGROUND_CATEGORIES,
} from '../templates/backgrounds';
import {
  CERTIFICATE_IMAGE_BACKGROUNDS,
  IMAGE_BACKGROUND_THEMES,
  IMAGE_BACKGROUND_STYLES,
  getFilteredImageBackgrounds,
} from '../templates/image-backgrounds';
import {
  LAYOUT_STYLES,
  CERTIFICATE_TYPES,
  getLayoutByStyleAndType,
} from '../templates/content-layouts';
import {
  applyColorTheme,
  combineDesignElements,
  createCanvasWithImageBackground,
  CERTIFICATE_COLOR_PALETTES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/lib/certificate-theming';

interface AIDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignGenerated: (canvasJSON: object) => void;
  workspaceId: string;
}

export function AIDesignDialog({
  open,
  onOpenChange,
  onDesignGenerated,
  workspaceId,
}: AIDesignDialogProps) {
  const [step, setStep] = useState<'style' | 'colors' | 'background' | 'generate'>('style');
  const [selectedStyle, setSelectedStyle] = useState<string>('elegant');
  const [certificateType, setCertificateType] = useState<string>('Completion');
  const [primaryColor, setPrimaryColor] = useState('#1a365d');
  const [secondaryColor, setSecondaryColor] = useState('#c9a227');
  
  // Pattern background state
  const [selectedBackground, setSelectedBackground] = useState<string>('gradient-radial-glow');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Image background state
  const [backgroundType, setBackgroundType] = useState<'pattern' | 'image'>('pattern');
  const [selectedImageBackground, setSelectedImageBackground] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter pattern backgrounds by category
  const filteredBackgrounds = useMemo(() => {
    if (categoryFilter === 'all') return CERTIFICATE_BACKGROUNDS;
    return CERTIFICATE_BACKGROUNDS.filter(bg => bg.category === categoryFilter);
  }, [categoryFilter]);

  // Filter image backgrounds by theme and style
  const filteredImageBackgrounds = useMemo(() => {
    return getFilteredImageBackgrounds(themeFilter, styleFilter);
  }, [themeFilter, styleFilter]);

  // Get layout for current style and certificate type
  const currentLayout = useMemo(() => {
    return getLayoutByStyleAndType(selectedStyle, certificateType);
  }, [selectedStyle, certificateType]);

  // Get background by ID
  const currentBackground = useMemo(() => {
    return CERTIFICATE_BACKGROUNDS.find(bg => bg.id === selectedBackground);
  }, [selectedBackground]);

  // Get image background by ID
  const currentImageBackground = useMemo(() => {
    return CERTIFICATE_IMAGE_BACKGROUNDS.find(bg => bg.id === selectedImageBackground);
  }, [selectedImageBackground]);

  const handleGenerate = async () => {
    if (!currentLayout) {
      toast.error('Please select a style');
      return;
    }

    setIsGenerating(true);

    try {
      // Apply color theme to content layout
      const contentObjects = applyColorTheme(
        currentLayout.objects,
        primaryColor,
        secondaryColor
      );

      let canvasJSON: object;

      if (backgroundType === 'image' && currentImageBackground) {
        // Use pre-generated image background
        canvasJSON = createCanvasWithImageBackground(
          currentImageBackground.imageUrl,
          contentObjects,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );
      } else if (currentBackground) {
        // Use pattern background
        const backgroundObjects = applyColorTheme(
          currentBackground.objects,
          primaryColor,
          secondaryColor
        );

        canvasJSON = combineDesignElements(
          backgroundObjects,
          contentObjects,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );
      } else {
        toast.error('Please select a background');
        setIsGenerating(false);
        return;
      }

      // Small delay for UX feel
      await new Promise(resolve => setTimeout(resolve, 300));

      onDesignGenerated(canvasJSON);
      onOpenChange(false);
      toast.success('Design generated successfully!');
      
      // Reset state for next use
      setStep('style');
    } catch {
      // Fallback to AI generation
      try {
        toast.info('Using AI fallback...');
        const { data, error: aiError } = await supabase.functions.invoke('generate-certificate-design', {
          body: {
            workspaceId,
            eventTheme: 'Professional Event',
            certificateType,
            primaryColor,
            secondaryColor,
            style: selectedStyle,
          },
        });

        if (aiError) throw aiError;
        
        if (data?.canvasJSON) {
          onDesignGenerated(data.canvasJSON);
          onOpenChange(false);
          toast.success('Design generated with AI fallback');
        }
      } catch {
        toast.error('Failed to generate design. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaletteSelect = (palette: typeof CERTIFICATE_COLOR_PALETTES[number]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
  };

  const renderStyleStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {LAYOUT_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              selectedStyle === style.id ? 'border-primary bg-primary/5' : 'border-border'
            )}
          >
            <div className="font-medium">{style.label}</div>
            <div className="text-sm text-muted-foreground">{style.description}</div>
          </button>
        ))}
      </div>
      
      <div className="pt-2">
        <Label className="text-sm mb-2 block">Certificate Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {CERTIFICATE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setCertificateType(type.value)}
              className={cn(
                'px-3 py-2 rounded-md border text-sm transition-all',
                certificateType === type.value ? 'border-primary bg-primary/10' : 'border-border'
              )}
            >
              {type.value}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button onClick={() => setStep('colors')}>Next: Colors</Button>
      </div>
    </div>
  );

  const renderColorsStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Quick Palettes</Label>
        <div className="grid grid-cols-4 gap-2">
          {CERTIFICATE_COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handlePaletteSelect(palette)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:border-primary/50',
                primaryColor === palette.primary && secondaryColor === palette.secondary
                  ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.primary }} />
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.secondary }} />
              </div>
              <span className="text-xs text-muted-foreground">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Primary Color</Label>
          <div className="flex gap-2 mt-1.5">
            <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-9 p-1 cursor-pointer" />
            <Input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-sm">Secondary Color</Label>
          <div className="flex gap-2 mt-1.5">
            <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-9 p-1 cursor-pointer" />
            <Input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('style')}>Back</Button>
        <Button onClick={() => setStep('background')}>Next: Background</Button>
      </div>
    </div>
  );

  const renderBackgroundStep = () => (
    <div className="space-y-4">
      <Tabs value={backgroundType} onValueChange={(v) => setBackgroundType(v as 'pattern' | 'image')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pattern" className="gap-2"><Shapes className="h-4 w-4" />Patterns</TabsTrigger>
          <TabsTrigger value="image" className="gap-2"><ImageIcon className="h-4 w-4" />AI Backgrounds</TabsTrigger>
        </TabsList>

        <TabsContent value="pattern" className="space-y-4 mt-4">
          <div className="flex gap-1 flex-wrap">
            {BACKGROUND_CATEGORIES.map((cat) => (
              <Button key={cat.id} variant={categoryFilter === cat.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setCategoryFilter(cat.id)} className="text-xs">
                {cat.label}
              </Button>
            ))}
          </div>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-4 gap-2 pr-4">
              {filteredBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => { setSelectedBackground(bg.id); setBackgroundType('pattern'); }}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    selectedBackground === bg.id && backgroundType === 'pattern' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-2xl mb-1">{bg.thumbnail}</div>
                  <div className="text-xs truncate">{bg.name}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="image" className="space-y-4 mt-4">
          <div className="flex gap-1 flex-wrap">
            {IMAGE_BACKGROUND_THEMES.map((theme) => (
              <Button key={theme.id} variant={themeFilter === theme.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setThemeFilter(theme.id)} className="text-xs gap-1">
                <span>{theme.icon}</span>{theme.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {IMAGE_BACKGROUND_STYLES.map((style) => (
              <Button key={style.id} variant={styleFilter === style.id ? 'outline' : 'ghost'} size="sm" onClick={() => setStyleFilter(style.id)} className="text-xs">
                {style.label}
              </Button>
            ))}
          </div>
          <ScrollArea className="h-[160px]">
            <div className="grid grid-cols-4 gap-2 pr-4">
              {filteredImageBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => { setSelectedImageBackground(bg.id); setBackgroundType('image'); }}
                  className={cn(
                    'p-2 rounded-lg border-2 transition-all',
                    selectedImageBackground === bg.id && backgroundType === 'image' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex gap-1 justify-center mb-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: bg.dominantColors.primary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: bg.dominantColors.secondary }} />
                  </div>
                  <div className="text-xs truncate">{bg.name}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('colors')}>Back</Button>
        <Button onClick={() => setStep('generate')}>Next: Generate</Button>
      </div>
    </div>
  );

  const renderGenerateStep = () => {
    const backgroundName = backgroundType === 'image' ? currentImageBackground?.name || 'None' : currentBackground?.name || 'None';

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium">Design Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Style</div>
              <div className="font-medium capitalize">{selectedStyle}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">{certificateType}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Colors</div>
              <div className="flex gap-2 mt-1">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }} />
                <div className="w-6 h-6 rounded" style={{ backgroundColor: secondaryColor }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Background</div>
              <div className="font-medium flex items-center gap-1">
                {backgroundType === 'image' ? <ImageIcon className="h-3 w-3" /> : <Shapes className="h-3 w-3" />}
                {backgroundName}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('background')}>Back</Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate Design</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Certificate Designer
          </DialogTitle>
          <DialogDescription>
            Create a custom certificate design in just a few steps.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'style' && renderStyleStep()}
          {step === 'colors' && renderColorsStep()}
          {step === 'background' && renderBackgroundStep()}
          {step === 'generate' && renderGenerateStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
