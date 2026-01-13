import { useEffect, useState } from 'react';
import { FabricObject } from 'fabric';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';

interface PropertiesPanelProps {
  selectedObject: FabricObject | null;
  onUpdate: () => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
];

export function PropertiesPanel({ selectedObject, onUpdate }: PropertiesPanelProps) {
  const [properties, setProperties] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (selectedObject) {
      setProperties({
        fill: selectedObject.get('fill') || '#000000',
        stroke: selectedObject.get('stroke') || '',
        strokeWidth: selectedObject.get('strokeWidth') || 0,
        opacity: (selectedObject.get('opacity') || 1) * 100,
        fontSize: selectedObject.get('fontSize') || 24,
        fontFamily: selectedObject.get('fontFamily') || 'Arial',
        fontWeight: selectedObject.get('fontWeight') || 'normal',
        fontStyle: selectedObject.get('fontStyle') || 'normal',
        textAlign: selectedObject.get('textAlign') || 'left',
        text: selectedObject.get('text') || '',
      });
    }
  }, [selectedObject]);

  const updateProperty = (key: string, value: unknown) => {
    if (!selectedObject) return;
    
    let processedValue = value;
    if (key === 'opacity') {
      processedValue = (value as number) / 100;
    }
    
    selectedObject.set(key as keyof FabricObject, processedValue);
    setProperties((prev) => ({ ...prev, [key]: value }));
    onUpdate();
  };

  if (!selectedObject) {
    return (
      <div className="w-64 border-l border-border bg-card p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const isText = selectedObject.type === 'textbox' || selectedObject.type === 'text';

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Properties</h3>
        <p className="text-xs text-muted-foreground capitalize">{selectedObject.type}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Text-specific properties */}
          {isText && (
            <>
              <div className="space-y-2">
                <Label>Text</Label>
                <Input
                  value={properties.text as string}
                  onChange={(e) => updateProperty('text', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Font</Label>
                <Select
                  value={properties.fontFamily as string}
                  onValueChange={(v) => updateProperty('fontFamily', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={properties.fontSize as number}
                  onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                  min={8}
                  max={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <div className="flex gap-1">
                  <Button
                    variant={properties.fontWeight === 'bold' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() =>
                      updateProperty('fontWeight', properties.fontWeight === 'bold' ? 'normal' : 'bold')
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={properties.fontStyle === 'italic' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() =>
                      updateProperty('fontStyle', properties.fontStyle === 'italic' ? 'normal' : 'italic')
                    }
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  <Button
                    variant={properties.textAlign === 'left' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => updateProperty('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={properties.textAlign === 'center' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => updateProperty('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={properties.textAlign === 'right' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => updateProperty('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Common properties */}
          <div className="space-y-2">
            <Label>Fill Color</Label>
            <Input
              type="color"
              value={properties.fill as string}
              onChange={(e) => updateProperty('fill', e.target.value)}
              className="h-10 p-1"
            />
          </div>

          <div className="space-y-2">
            <Label>Stroke Color</Label>
            <Input
              type="color"
              value={properties.stroke as string || '#000000'}
              onChange={(e) => updateProperty('stroke', e.target.value)}
              className="h-10 p-1"
            />
          </div>

          <div className="space-y-2">
            <Label>Stroke Width: {String(properties.strokeWidth)}</Label>
            <Slider
              value={[Number(properties.strokeWidth) || 0]}
              onValueChange={([v]) => updateProperty('strokeWidth', v)}
              min={0}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Opacity: {String(properties.opacity)}%</Label>
            <Slider
              value={[Number(properties.opacity) || 100]}
              onValueChange={([v]) => updateProperty('opacity', v)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
