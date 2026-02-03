import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Image } from 'lucide-react';

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

interface IDCardTemplate {
  id?: string;
  name: string;
  card_type: string;
  design: {
    elements?: DesignElement[];
    backgroundColor?: string;
    primaryColor?: string;
  };
  dimensions: { width: number; height: number; unit: string };
}

interface SampleData {
  name: string;
  role: string;
  organization?: string;
  ticketType?: string;
  eventName?: string;
  photoUrl?: string;
}

interface IDCardPreviewProps {
  template: IDCardTemplate;
  sampleData: SampleData;
}

export function IDCardPreview({ template, sampleData }: IDCardPreviewProps) {
  const { design } = template;
  const elements = (design.elements as DesignElement[]) || [];
  const backgroundColor = design.backgroundColor || '#ffffff';

  const replacePlaceholders = (content: string): string => {
    return content.replace(/{(\w+)}/g, (_, key) => {
      const mappings: Record<string, string | undefined> = {
        name: sampleData.name,
        role: sampleData.role,
        organization: sampleData.organization,
        event_name: sampleData.eventName || 'Event Name',
        ticket_type: sampleData.ticketType,
      };
      return mappings[key] || `[${key}]`;
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 flex items-center justify-center bg-muted/30">
        {/* Card Preview - scaled representation */}
        <div 
          className="relative shadow-xl rounded-lg overflow-hidden"
          style={{ 
            width: '342px', // 4x scale of 85.6mm
            height: '216px', // 4x scale of 53.98mm
            backgroundColor,
          }}
        >
          {elements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No design elements</p>
              </div>
            </div>
          ) : (
            elements.map((el) => (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: `${(el.x / 85.6) * 100}%`,
                  top: `${(el.y / 53.98) * 100}%`,
                  width: `${(el.width / 85.6) * 100}%`,
                  height: `${(el.height / 53.98) * 100}%`,
                  fontSize: el.style.fontSize ? `${el.style.fontSize * 0.8}px` : undefined,
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
                  <div className="w-full h-full bg-white p-1 rounded flex items-center justify-center">
                    <QrCode className="w-full h-full text-gray-800" />
                  </div>
                ) : el.type === 'placeholder' && el.content === '{photo}' ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                    {sampleData.photoUrl ? (
                      <img 
                        src={sampleData.photoUrl} 
                        alt={sampleData.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                ) : (
                  <span className="truncate">
                    {replacePlaceholders(el.content)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* Card Info */}
      <div className="px-4 py-3 bg-muted/20 border-t text-center">
        <p className="text-xs text-muted-foreground">
          {template.dimensions.width}mm × {template.dimensions.height}mm • {template.card_type} card
        </p>
      </div>
    </Card>
  );
}
