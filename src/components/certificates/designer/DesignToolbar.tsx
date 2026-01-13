import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type,
  Square,
  Circle,
  Minus,
  LayoutTemplate,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { getPlaceholdersByCategory } from '@/lib/certificate-placeholders';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AIDesignDialog } from './AIDesignDialog';

interface DesignToolbarProps {
  onAddText: (text: string) => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onOpenGallery: () => void;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  onLoadAIDesign?: (canvasJSON: object) => void;
  workspaceId: string;
}

export function DesignToolbar({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddLine,
  onOpenGallery,
  onDeleteSelected,
  onClearCanvas,
  onLoadAIDesign,
  workspaceId,
}: DesignToolbarProps) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const placeholdersByCategory = getPlaceholdersByCategory();

  const categoryLabels: Record<string, string> = {
    recipient: '👤 Recipient',
    event: '📅 Event',
    certificate: '📜 Certificate',
    custom: '⚙️ Custom',
  };

  const handleAIDesignGenerated = (canvasJSON: object) => {
    onLoadAIDesign?.(canvasJSON);
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Design Tools</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* AI Design */}
          <div>
            <Button
              className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80"
              onClick={() => setAiDialogOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              AI Design Generator
            </Button>
          </div>

          <Separator />

          {/* Templates */}
          <div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onOpenGallery}
            >
              <LayoutTemplate className="h-4 w-4" />
              Template Gallery
            </Button>
          </div>

          <Separator />

          {/* Elements */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Elements</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => onAddText('New Text')}
              >
                <Type className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={onAddRect}
              >
                <Square className="h-4 w-4" />
                Rectangle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={onAddCircle}
              >
                <Circle className="h-4 w-4" />
                Circle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={onAddLine}
              >
                <Minus className="h-4 w-4" />
                Line
              </Button>
            </div>
          </div>

          <Separator />

          {/* Placeholders */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Placeholders</h4>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(placeholdersByCategory).map(([category, placeholders]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm py-2">
                    {categoryLabels[category] || category}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {placeholders.map((placeholder) => (
                        <Button
                          key={placeholder.key}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => onAddText(placeholder.key)}
                          title={placeholder.description}
                        >
                          {placeholder.label}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={onClearCanvas}
            >
              Clear Canvas
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* AI Design Dialog */}
      <AIDesignDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onDesignGenerated={handleAIDesignGenerated}
        workspaceId={workspaceId}
      />
    </div>
  );
}
