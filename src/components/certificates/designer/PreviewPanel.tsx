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
  PlaceholderData,
  CERTIFICATE_PLACEHOLDERS,
  getSamplePlaceholderData,
  replacePlaceholders,
} from '@/lib/certificate-placeholders';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../templates';

interface PreviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCanvas: FabricCanvas | null;
}

export function PreviewPanel({
  open,
  onOpenChange,
  sourceCanvas,
}: PreviewPanelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewFabricRef = useRef<FabricCanvas | null>(null);
  const [sampleData, setSampleData] = useState<PlaceholderData>(getSamplePlaceholderData());
  const [isRendering, setIsRendering] = useState(false);

  // Initialize preview canvas
  useEffect(() => {
    if (!open || !previewCanvasRef.current || previewFabricRef.current) return;

    const canvas = new FabricCanvas(previewCanvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
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
            const newText = replacePlaceholders(textObj.text, sampleData);
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

  const updateSampleData = (key: keyof PlaceholderData, value: string) => {
    setSampleData((prev) => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSampleData(getSamplePlaceholderData());
  };

  // Group placeholders by category for the form
  const placeholdersByCategory = CERTIFICATE_PLACEHOLDERS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof CERTIFICATE_PLACEHOLDERS>);

  const categoryLabels: Record<string, string> = {
    recipient: '👤 Recipient',
    event: '📅 Event',
    certificate: '📜 Certificate',
    custom: '⚙️ Custom',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[800px] sm:max-w-[800px] p-0">
        <div className="flex h-full">
          {/* Preview area */}
          <div className="flex-1 bg-muted/30 p-4 flex flex-col">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Certificate Preview
              </SheetTitle>
              <SheetDescription>
                See how your certificate looks with real data
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
                    maxWidth: '100%',
                    height: 'auto',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top left',
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
          <div className="w-72 border-l border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Sample Data</h3>
              <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                Reset
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {Object.entries(placeholdersByCategory).map(([category, placeholders]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {categoryLabels[category]}
                    </h4>
                    <div className="space-y-3">
                      {placeholders.map((placeholder) => {
                        const key = placeholder.key.replace(/[{}]/g, '') as keyof PlaceholderData;
                        return (
                          <div key={placeholder.key} className="space-y-1">
                            <Label className="text-xs">{placeholder.label}</Label>
                            <Input
                              value={sampleData[key] || ''}
                              onChange={(e) => updateSampleData(key, e.target.value)}
                              placeholder={placeholder.sampleValue}
                              className="h-8 text-sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}

                {/* QR Code Preview Note */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> QR codes will be generated automatically during export using the certificate ID.
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
