import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Image, 
  QrCode, 
  Square,
  Save,
  X,
  Palette,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IDCardTemplate {
  id?: string;
  name: string;
  card_type: string;
  design: Record<string, unknown>;
  dimensions: { width: number; height: number; unit: string };
  is_default: boolean;
}

interface IDCardDesignerProps {
  workspaceId: string;
  eventId: string;
  template?: IDCardTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'placeholder';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
  };
}

const CARD_TYPES = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'vip', label: 'VIP' },
  { value: 'staff', label: 'Staff' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'volunteer', label: 'Volunteer' },
];

const PLACEHOLDERS = [
  { id: 'name', label: 'Attendee Name', value: '{name}' },
  { id: 'role', label: 'Role/Title', value: '{role}' },
  { id: 'organization', label: 'Organization', value: '{organization}' },
  { id: 'ticket_type', label: 'Ticket Type', value: '{ticket_type}' },
  { id: 'event_name', label: 'Event Name', value: '{event_name}' },
  { id: 'qr_code', label: 'QR Code', value: '{qr_code}' },
  { id: 'photo', label: 'Photo', value: '{photo}' },
];

export function IDCardDesigner({ 
  workspaceId, 
  eventId, 
  template, 
  onSave, 
  onCancel 
}: IDCardDesignerProps) {
  const [name, setName] = useState(template?.name || '');
  const [cardType, setCardType] = useState(template?.card_type || 'attendee');
  const [isDefault, setIsDefault] = useState(template?.is_default || false);
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  
  const [elements, setElements] = useState<DesignElement[]>([
    {
      id: 'header',
      type: 'text',
      x: 10,
      y: 10,
      width: 65.6,
      height: 8,
      content: '{event_name}',
      style: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', backgroundColor: '#3b82f6' },
    },
    {
      id: 'photo',
      type: 'placeholder',
      x: 10,
      y: 22,
      width: 20,
      height: 24,
      content: '{photo}',
      style: { borderRadius: 4, backgroundColor: '#e5e7eb' },
    },
    {
      id: 'name',
      type: 'text',
      x: 35,
      y: 22,
      width: 40,
      height: 6,
      content: '{name}',
      style: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
    },
    {
      id: 'role',
      type: 'text',
      x: 35,
      y: 30,
      width: 40,
      height: 5,
      content: '{role}',
      style: { fontSize: 10, color: '#6b7280' },
    },
    {
      id: 'organization',
      type: 'text',
      x: 35,
      y: 36,
      width: 40,
      height: 5,
      content: '{organization}',
      style: { fontSize: 10, color: '#6b7280' },
    },
    {
      id: 'qr',
      type: 'qr',
      x: 65,
      y: 35,
      width: 15,
      height: 15,
      content: '{qr_code}',
      style: {},
    },
  ]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      const designData = JSON.parse(JSON.stringify({
        elements,
        backgroundColor,
        primaryColor,
      }));

      if (template?.id) {
        // Update existing template
        const { error } = await supabase
          .from('id_card_templates')
          .update({
            name,
            card_type: cardType,
            design: designData,
            is_default: isDefault,
          })
          .eq('id', template.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('id_card_templates')
          .insert([{
            workspace_id: workspaceId,
            event_id: eventId,
            name,
            card_type: cardType,
            design: designData,
            is_default: isDefault,
          }]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const addElement = (type: DesignElement['type'], content: string) => {
    const newElement: DesignElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 10,
      y: 10,
      width: type === 'qr' ? 15 : 30,
      height: type === 'qr' ? 15 : 6,
      content,
      style: {
        fontSize: 10,
        color: '#1f2937',
      },
    };
    setElements([...elements, newElement]);
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Standard Attendee Badge"
          />
        </div>
        <div className="space-y-2">
          <Label>Card Type</Label>
          <Select value={cardType} onValueChange={setCardType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Default Template</Label>
          <Select 
            value={isDefault ? 'yes' : 'no'} 
            onValueChange={(v) => setIsDefault(v === 'yes')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Canvas Preview */}
        <div className="col-span-2">
          <Label className="mb-2 block">Card Preview (85.6mm × 53.98mm)</Label>
          <Card className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-center bg-muted/30">
              {/* Card Canvas - scaled representation */}
              <div 
                className="relative shadow-lg rounded-lg overflow-hidden"
                style={{ 
                  width: '428px', // 5x scale of 85.6mm
                  height: '270px', // 5x scale of 53.98mm
                  backgroundColor,
                }}
              >
                {elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute cursor-move"
                    style={{
                      left: `${(el.x / 85.6) * 100}%`,
                      top: `${(el.y / 53.98) * 100}%`,
                      width: `${(el.width / 85.6) * 100}%`,
                      height: `${(el.height / 53.98) * 100}%`,
                      fontSize: el.style.fontSize ? `${el.style.fontSize}px` : undefined,
                      fontWeight: el.style.fontWeight,
                      color: el.style.color,
                      backgroundColor: el.style.backgroundColor,
                      borderRadius: el.style.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: el.type === 'qr' ? 'center' : 'flex-start',
                      padding: '2px 4px',
                    }}
                  >
                    {el.type === 'qr' ? (
                      <QrCode className="w-full h-full text-gray-800" />
                    ) : el.type === 'placeholder' && el.content === '{photo}' ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    ) : (
                      <span className="truncate">
                        {el.content.replace(/{(\w+)}/g, (_, key) => {
                          const samples: Record<string, string> = {
                            name: 'John Doe',
                            role: 'Developer',
                            organization: 'Tech Corp',
                            event_name: 'TechConf 2026',
                            ticket_type: 'VIP Pass',
                          };
                          return samples[key] || `[${key}]`;
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Panel */}
        <div>
          <Tabs defaultValue="elements" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="elements" className="gap-1 text-xs">
                <Layout className="h-3.5 w-3.5" />
                Elements
              </TabsTrigger>
              <TabsTrigger value="style" className="gap-1 text-xs">
                <Palette className="h-3.5 w-3.5" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Add Placeholders</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLACEHOLDERS.map((placeholder) => (
                    <Button
                      key={placeholder.id}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 justify-start"
                      onClick={() => addElement(
                        placeholder.id === 'qr_code' ? 'qr' : 
                        placeholder.id === 'photo' ? 'placeholder' : 'text',
                        placeholder.value
                      )}
                    >
                      {placeholder.id === 'qr_code' && <QrCode className="h-3 w-3 mr-1" />}
                      {placeholder.id === 'photo' && <Image className="h-3 w-3 mr-1" />}
                      {!['qr_code', 'photo'].includes(placeholder.id) && <Type className="h-3 w-3 mr-1" />}
                      {placeholder.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Add Elements</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addElement('text', 'Custom Text')}
                  >
                    <Type className="h-3 w-3 mr-1" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addElement('placeholder', '')}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Shape
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor" className="text-xs">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="bgColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
