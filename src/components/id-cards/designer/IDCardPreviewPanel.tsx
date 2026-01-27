import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Eye, RefreshCw } from 'lucide-react';
import {
  IDCardSampleData,
  getSampleIDCardData,
  replaceIDCardPlaceholders,
  ID_CARD_PLACEHOLDERS,
  ID_CARD_WIDTH,
  ID_CARD_HEIGHT,
} from '../templates';

interface IDCardPreviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCanvas: FabricCanvas | null;
}

export function IDCardPreviewPanel({
  open,
  onOpenChange,
  sourceCanvas,
}: IDCardPreviewPanelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewFabricRef = useRef<FabricCanvas | null>(null);
  const [sampleData, setSampleData] = useState<IDCardSampleData>(getSampleIDCardData());
  const [isRendering, setIsRendering] = useState(false);

  // Initialize preview canvas
  useEffect(() => {
    if (!open || !previewCanvasRef.current || previewFabricRef.current) return;

    const canvas = new FabricCanvas(previewCanvasRef.current, {
      width: ID_CARD_WIDTH,
      height: ID_CARD_HEIGHT,
      backgroundColor: '#ffffff',
      selection: false,
      interactive: false,
    });

    previewFabricRef.current = canvas;

    return () => {
      canvas.dispose();
      previewFabricRef.current = null;
    };
  }, [open]);

  // Render preview when source canvas or sample data changes
  const renderPreview = useCallback(async () => {
    if (!sourceCanvas || !previewFabricRef.current) return;

    setIsRendering(true);
    try {
      // Clone the source canvas JSON
      const sourceJSON = sourceCanvas.toJSON();
      
      // Load into preview canvas
      await previewFabricRef.current.loadFromJSON(sourceJSON);
      
      // Replace placeholders in all text objects
      const objects = previewFabricRef.current.getObjects();
      objects.forEach((obj) => {
        if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
          const textObj = obj as { text?: string; set: (props: Record<string, unknown>) => void };
          if (textObj.text) {
            const newText = replaceIDCardPlaceholders(textObj.text, sampleData);
            textObj.set({ text: newText });
          }
        }
      });
      
      // Disable selection on all objects
      objects.forEach((obj) => {
        obj.set({
          selectable: false,
          evented: false,
        });
      });
      
      previewFabricRef.current.renderAll();
    } catch (error) {
      console.error('Failed to render preview:', error);
    } finally {
      setIsRendering(false);
    }
  }, [sourceCanvas, sampleData]);

  // Re-render when panel opens or data changes
  useEffect(() => {
    if (open && sourceCanvas) {
      renderPreview();
    }
  }, [open, sourceCanvas, renderPreview]);

  const updateSampleData = (key: keyof IDCardSampleData, value: string) => {
    setSampleData((prev) => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSampleData(getSampleIDCardData());
  };

  // Group placeholders by category for the form
  const placeholdersByCategory = ID_CARD_PLACEHOLDERS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof ID_CARD_PLACEHOLDERS>);

  const categoryLabels: Record<string, string> = {
    attendee: '👤 Attendee',
    event: '📅 Event',
    media: '📷 Media',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[650px] sm:max-w-[650px] p-0">
        <div className="flex h-full">
          {/* Preview area */}
          <div className="flex-1 bg-muted/30 p-4 flex flex-col">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                ID Card Preview
              </SheetTitle>
              <SheetDescription>
                See how your ID card looks with real data
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 flex items-center justify-center overflow-auto">
              <div className="shadow-xl border border-border rounded-lg overflow-hidden bg-white relative">
                {isRendering && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    transform: 'scale(1.3)',
                    transformOrigin: 'center',
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={renderPreview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Preview
              </Button>
            </div>
          </div>

          {/* Sample data editor */}
          <div className="w-56 border-l border-border bg-card flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Sample Data</h3>
              <Button variant="ghost" size="sm" onClick={resetToDefaults} className="h-7 text-xs">
                Reset
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {Object.entries(placeholdersByCategory)
                  .filter(([cat]) => cat !== 'media') // Skip media placeholders
                  .map(([category, placeholders]) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        {categoryLabels[category]}
                      </h4>
                      <div className="space-y-2">
                        {placeholders.map((placeholder) => {
                          const key = placeholder.key.replace(/[{}]/g, '') as keyof IDCardSampleData;
                          return (
                            <div key={placeholder.key} className="space-y-1">
                              <Label className="text-xs">{placeholder.label}</Label>
                              <Input
                                value={sampleData[key] || ''}
                                onChange={(e) => updateSampleData(key, e.target.value)}
                                placeholder={placeholder.sampleValue}
                                className="h-7 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}

                {/* Note about media */}
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Photo and QR code placeholders will be replaced during batch generation.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
