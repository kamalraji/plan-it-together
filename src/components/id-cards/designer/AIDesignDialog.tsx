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
import { Sparkles, Loader2, Wand2, ImageIcon, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import {
  ID_CARD_BACKGROUNDS,
  BACKGROUND_CATEGORIES,
  type IDCardBackground,
} from '../templates/backgrounds';
import {
  ID_CARD_IMAGE_BACKGROUNDS,
  IMAGE_BACKGROUND_THEMES,
  IMAGE_BACKGROUND_STYLES,
  getFilteredImageBackgrounds,
  type IDCardImageBackground,
} from '../templates/image-backgrounds';
import {
  ID_CARD_CONTENT_LAYOUTS,
  LAYOUT_STYLES,
} from '../templates/content-layouts';
import {
  applyColorTheme,
  scaleObjectsForOrientation,
  combineDesignElements,
  createCanvasWithImageBackground,
  COLOR_PALETTES,
} from '@/lib/idcard-theming';
import type { IDCardOrientation } from '../templates';

interface AIDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignGenerated: (canvasJSON: object) => void;
  workspaceId: string;
  orientation: IDCardOrientation;
}

export function AIDesignDialog({
  open,
  onOpenChange,
  onDesignGenerated,
  workspaceId,
  orientation,
}: AIDesignDialogProps) {
  const [step, setStep] = useState<'style' | 'colors' | 'background' | 'generate'>('style');
  const [selectedStyle, setSelectedStyle] = useState<string>('professional');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  
  // Pattern background state
  const [selectedBackground, setSelectedBackground] = useState<string>('gradient-top-fade');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Image background state
  const [backgroundType, setBackgroundType] = useState<'pattern' | 'image'>('pattern');
  const [selectedImageBackground, setSelectedImageBackground] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Get canvas dimensions based on orientation
  const canvasWidth = orientation === 'landscape' ? 324 : 204;
  const canvasHeight = orientation === 'landscape' ? 204 : 324;

  // Filter pattern backgrounds by category
  const filteredBackgrounds = useMemo(() => {
    if (categoryFilter === 'all') return ID_CARD_BACKGROUNDS;
    return ID_CARD_BACKGROUNDS.filter(bg => bg.category === categoryFilter);
  }, [categoryFilter]);

  // Filter image backgrounds by theme and style
  const filteredImageBackgrounds = useMemo(() => {
    return getFilteredImageBackgrounds(themeFilter, styleFilter);
  }, [themeFilter, styleFilter]);

  // Get layout for current style and orientation
  const currentLayout = useMemo(() => {
    return ID_CARD_CONTENT_LAYOUTS.find(
      layout => layout.style === selectedStyle && layout.orientation === orientation
    );
  }, [selectedStyle, orientation]);

  // Get background by ID
  const currentBackground = useMemo(() => {
    return ID_CARD_BACKGROUNDS.find(bg => bg.id === selectedBackground);
  }, [selectedBackground]);

  // Get image background by ID
  const currentImageBackground = useMemo(() => {
    return ID_CARD_IMAGE_BACKGROUNDS.find(bg => bg.id === selectedImageBackground);
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
          canvasWidth,
          canvasHeight
        );
      } else if (currentBackground) {
        // Use pattern background
        // 1. Apply color theme to background objects
        let backgroundObjects = applyColorTheme(
          currentBackground.objects,
          primaryColor,
          secondaryColor
        );

        // 2. Scale background if needed (backgrounds are designed for landscape)
        if (orientation === 'portrait' && currentBackground.supportsPortrait) {
          backgroundObjects = scaleObjectsForOrientation(
            backgroundObjects,
            'landscape',
            'portrait'
          );
        }

        // 3. Combine into final canvas JSON
        canvasJSON = combineDesignElements(
          backgroundObjects,
          contentObjects,
          canvasWidth,
          canvasHeight
        );
      } else {
        toast.error('Please select a background');
        setIsGenerating(false);
        return;
      }

      // Small delay for UX feel (instant feels too abrupt)
      await new Promise(resolve => setTimeout(resolve, 300));

      onDesignGenerated(canvasJSON);
      onOpenChange(false);
      toast.success('Design generated successfully!');
      
      // Reset state for next use
      setStep('style');
    } catch {
      // Fallback to AI generation if pre-built fails
      try {
        toast.info('Using AI fallback...');
        const { data, error: aiError } = await supabase.functions.invoke('generate-idcard-design', {
          body: {
            workspaceId,
            orientation,
            style: selectedStyle,
            primaryColor,
            secondaryColor,
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

  const handlePaletteSelect = (palette: typeof COLOR_PALETTES[number]) => {
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
              selectedStyle === style.id
                ? 'border-primary bg-primary/5'
                : 'border-border'
            )}
          >
            <div className="font-medium">{style.label}</div>
            <div className="text-sm text-muted-foreground">{style.description}</div>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setStep('colors')}>
          Next: Colors
        </Button>
      </div>
    </div>
  );

  const renderColorsStep = () => (
    <div className="space-y-6">
      {/* Quick palettes */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Quick Palettes</Label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handlePaletteSelect(palette)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                'hover:border-primary/50',
                primaryColor === palette.primary && secondaryColor === palette.secondary
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              )}
            >
              <div className="flex gap-1">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: palette.primary }}
                />
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: palette.secondary }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="color"
              id="primaryColor"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#3B82F6"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="secondaryColor" className="text-sm">Secondary Color</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="color"
              id="secondaryColor"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#1E40AF"
            />
          </div>
        </div>
      </div>

      {/* Preview swatch */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex gap-2">
          <div
            className="w-10 h-10 rounded-lg shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="w-10 h-10 rounded-lg shadow-sm"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Color preview for your ID card design
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('style')}>
          Back
        </Button>
        <Button onClick={() => setStep('background')}>
          Next: Background
        </Button>
      </div>
    </div>
  );

  const renderBackgroundStep = () => (
    <div className="space-y-4">
      <Tabs value={backgroundType} onValueChange={(v) => setBackgroundType(v as 'pattern' | 'image')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pattern" className="gap-2">
            <Shapes className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            AI Backgrounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pattern" className="space-y-4 mt-4">
          {/* Category filter */}
          <div className="flex gap-1 flex-wrap">
            {BACKGROUND_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
                className="text-xs"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Pattern grid */}
          <ScrollArea className="h-[240px]">
            <div className="grid grid-cols-3 gap-3 pr-4">
              {filteredBackgrounds.map((bg) => (
                <BackgroundPreview
                  key={bg.id}
                  background={bg}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  isSelected={selectedBackground === bg.id && backgroundType === 'pattern'}
                  onClick={() => {
                    setSelectedBackground(bg.id);
                    setBackgroundType('pattern');
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="image" className="space-y-4 mt-4">
          {/* Theme filter */}
          <div className="flex gap-1 flex-wrap">
            {IMAGE_BACKGROUND_THEMES.map((theme) => (
              <Button
                key={theme.id}
                variant={themeFilter === theme.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setThemeFilter(theme.id)}
                className="text-xs gap-1"
              >
                <span>{theme.icon}</span>
                {theme.label}
              </Button>
            ))}
          </div>

          {/* Style filter */}
          <div className="flex gap-1 flex-wrap">
            {IMAGE_BACKGROUND_STYLES.map((style) => (
              <Button
                key={style.id}
                variant={styleFilter === style.id ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setStyleFilter(style.id)}
                className="text-xs"
              >
                {style.label}
              </Button>
            ))}
          </div>

          {/* Image grid */}
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-3 gap-3 pr-4">
              {filteredImageBackgrounds.map((bg) => (
                <ImageBackgroundPreview
                  key={bg.id}
                  background={bg}
                  isSelected={selectedImageBackground === bg.id && backgroundType === 'image'}
                  onClick={() => {
                    setSelectedImageBackground(bg.id);
                    setBackgroundType('image');
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('colors')}>
          Back
        </Button>
        <Button onClick={() => setStep('generate')}>
          Next: Generate
        </Button>
      </div>
    </div>
  );

  const renderGenerateStep = () => {
    const backgroundName = backgroundType === 'image' 
      ? currentImageBackground?.name || 'None'
      : currentBackground?.name || 'None';

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="space-y-3">
          <h4 className="font-medium">Design Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Style</div>
              <div className="font-medium capitalize">{selectedStyle}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Orientation</div>
              <div className="font-medium capitalize">{orientation}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Colors</div>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Background</div>
              <div className="font-medium flex items-center gap-1">
                {backgroundType === 'image' ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <Shapes className="h-3 w-3" />
                )}
                {backgroundName}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('background')}>
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Design
              </>
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
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Design Generator
          </DialogTitle>
          <DialogDescription>
            Create a professional ID card design in seconds
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-2">
          {(['style', 'colors', 'background', 'generate'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {i + 1}
              </button>
              {i < 3 && (
                <div className="w-8 h-0.5 bg-muted mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[350px]">
          {step === 'style' && renderStyleStep()}
          {step === 'colors' && renderColorsStep()}
          {step === 'background' && renderBackgroundStep()}
          {step === 'generate' && renderGenerateStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pattern background preview component
interface BackgroundPreviewProps {
  background: IDCardBackground;
  primaryColor: string;
  secondaryColor: string;
  isSelected: boolean;
  onClick: () => void;
}

function BackgroundPreview({
  background,
  isSelected,
  onClick,
}: BackgroundPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
        'hover:border-primary/50 hover:bg-accent/30',
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      <div className="text-2xl">{background.thumbnail}</div>
      <div className="text-xs font-medium text-center">{background.name}</div>
      <div className="text-[10px] text-muted-foreground capitalize">
        {background.category}
      </div>
    </button>
  );
}

// Image background preview component
interface ImageBackgroundPreviewProps {
  background: IDCardImageBackground;
  isSelected: boolean;
  onClick: () => void;
}

function ImageBackgroundPreview({
  background,
  isSelected,
  onClick,
}: ImageBackgroundPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all',
        'hover:border-primary/50 hover:bg-accent/30',
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      {/* Color preview representing the background */}
      <div 
        className="w-full aspect-[16/10] rounded-md shadow-sm"
        style={{ 
          background: `linear-gradient(135deg, ${background.dominantColors.primary}, ${background.dominantColors.secondary})` 
        }}
      />
      <div className="text-xs font-medium text-center leading-tight">{background.name}</div>
      <div className="text-[10px] text-muted-foreground capitalize">
        {background.theme} • {background.style}
      </div>
    </button>
  );
}
