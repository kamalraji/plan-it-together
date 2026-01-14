// ID Card Template Registry
// Contains pre-built templates for the ID card designer

export interface IDCardTemplatePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'professional' | 'minimal' | 'modern' | 'corporate' | 'creative';
  canvasJSON: object;
  dimensions: {
    width: number;
    height: number;
  };
}

// Standard CR80 card dimensions (85.6mm × 53.98mm) at 96 DPI
// Aspect ratio: 1.586
export const ID_CARD_WIDTH = 324; // ~85.6mm at 96 DPI
export const ID_CARD_HEIGHT = 204; // ~53.98mm at 96 DPI

// ID card placeholders
export interface IDCardPlaceholder {
  key: string;
  label: string;
  category: 'attendee' | 'event' | 'media';
  description: string;
  sampleValue: string;
}

export const ID_CARD_PLACEHOLDERS: IDCardPlaceholder[] = [
  { key: '{name}', label: 'Attendee Name', category: 'attendee', description: 'Full name of the attendee', sampleValue: 'John Doe' },
  { key: '{role}', label: 'Role/Title', category: 'attendee', description: 'Role or job title', sampleValue: 'Software Engineer' },
  { key: '{organization}', label: 'Organization', category: 'attendee', description: 'Company or organization', sampleValue: 'Tech Corp' },
  { key: '{ticket_type}', label: 'Ticket Type', category: 'attendee', description: 'Ticket tier or pass type', sampleValue: 'VIP Pass' },
  { key: '{attendee_id}', label: 'Attendee ID', category: 'attendee', description: 'Unique attendee identifier', sampleValue: 'ATT-2026-001' },
  { key: '{event_name}', label: 'Event Name', category: 'event', description: 'Name of the event', sampleValue: 'TechConf 2026' },
  { key: '{event_date}', label: 'Event Date', category: 'event', description: 'Date of the event', sampleValue: 'Jan 15-17, 2026' },
  { key: '{event_location}', label: 'Event Location', category: 'event', description: 'Venue or location', sampleValue: 'Convention Center' },
  { key: '{photo}', label: 'Photo', category: 'media', description: 'Attendee photo placeholder', sampleValue: 'PHOTO_PLACEHOLDER' },
  { key: '{qr_code}', label: 'QR Code', category: 'media', description: 'QR code for check-in', sampleValue: 'QR_PLACEHOLDER' },
];

export function getIDCardPlaceholdersByCategory(): Record<string, IDCardPlaceholder[]> {
  return ID_CARD_PLACEHOLDERS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, IDCardPlaceholder[]>);
}

export interface IDCardSampleData {
  name: string;
  role: string;
  organization: string;
  ticket_type: string;
  attendee_id: string;
  event_name: string;
  event_date: string;
  event_location: string;
}

export function getSampleIDCardData(): IDCardSampleData {
  return {
    name: 'John Doe',
    role: 'Software Engineer',
    organization: 'Tech Corp',
    ticket_type: 'VIP Pass',
    attendee_id: 'ATT-2026-001',
    event_name: 'TechConf 2026',
    event_date: 'Jan 15-17, 2026',
    event_location: 'Convention Center',
  };
}

export function replaceIDCardPlaceholders(text: string, data: IDCardSampleData): string {
  let result = text;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return result;
}

// Professional Template
const professionalTemplate: IDCardTemplatePreset = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean corporate design with dark header',
  thumbnail: '💼',
  category: 'professional',
  dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // White background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: ID_CARD_HEIGHT,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      },
      // Dark header
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: 50,
        fill: '#1e293b',
      },
      // Event name in header
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 18,
        width: 280,
        text: '{event_name}',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#ffffff',
        textAlign: 'center',
        originX: 'center',
      },
      // Photo placeholder area
      {
        type: 'rect',
        left: 15,
        top: 60,
        width: 70,
        height: 85,
        fill: '#f1f5f9',
        stroke: '#e2e8f0',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      // Photo placeholder text
      {
        type: 'textbox',
        left: 50,
        top: 95,
        width: 60,
        text: '{photo}',
        fontSize: 8,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'center',
        originX: 'center',
      },
      // Attendee name
      {
        type: 'textbox',
        left: 100,
        top: 65,
        width: 200,
        text: '{name}',
        fontSize: 18,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'left',
      },
      // Role
      {
        type: 'textbox',
        left: 100,
        top: 90,
        width: 200,
        text: '{role}',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#475569',
        textAlign: 'left',
      },
      // Organization
      {
        type: 'textbox',
        left: 100,
        top: 108,
        width: 200,
        text: '{organization}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#64748b',
        textAlign: 'left',
      },
      // Ticket type badge
      {
        type: 'textbox',
        left: 100,
        top: 130,
        width: 100,
        text: '{ticket_type}',
        fontSize: 10,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#3b82f6',
        textAlign: 'left',
      },
      // QR code area
      {
        type: 'rect',
        left: ID_CARD_WIDTH - 65,
        top: ID_CARD_HEIGHT - 65,
        width: 50,
        height: 50,
        fill: '#f8fafc',
        stroke: '#e2e8f0',
        strokeWidth: 1,
      },
      // QR placeholder text
      {
        type: 'textbox',
        left: ID_CARD_WIDTH - 40,
        top: ID_CARD_HEIGHT - 45,
        width: 40,
        text: '{qr_code}',
        fontSize: 6,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'center',
        originX: 'center',
      },
      // Attendee ID
      {
        type: 'textbox',
        left: 15,
        top: ID_CARD_HEIGHT - 20,
        width: 150,
        text: '{attendee_id}',
        fontSize: 8,
        fontFamily: 'Courier New',
        fill: '#94a3b8',
        textAlign: 'left',
      },
    ],
  },
};

// Modern Template
const modernTemplate: IDCardTemplatePreset = {
  id: 'modern',
  name: 'Modern',
  description: 'Bold gradient accent with clean layout',
  thumbnail: '✨',
  category: 'modern',
  dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: ID_CARD_HEIGHT,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      },
      // Left accent bar
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: 8,
        height: ID_CARD_HEIGHT,
        fill: '#8b5cf6',
      },
      // Event name
      {
        type: 'textbox',
        left: 20,
        top: 12,
        width: 200,
        text: '{event_name}',
        fontSize: 10,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#8b5cf6',
        textAlign: 'left',
      },
      // Name
      {
        type: 'textbox',
        left: 20,
        top: 35,
        width: 200,
        text: '{name}',
        fontSize: 22,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'left',
      },
      // Role
      {
        type: 'textbox',
        left: 20,
        top: 65,
        width: 180,
        text: '{role}',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#475569',
        textAlign: 'left',
      },
      // Organization
      {
        type: 'textbox',
        left: 20,
        top: 82,
        width: 180,
        text: '{organization}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#64748b',
        textAlign: 'left',
      },
      // Photo area (right side)
      {
        type: 'circle',
        left: ID_CARD_WIDTH - 90,
        top: 20,
        radius: 35,
        fill: '#f1f5f9',
        stroke: '#8b5cf6',
        strokeWidth: 2,
      },
      // Photo placeholder text
      {
        type: 'textbox',
        left: ID_CARD_WIDTH - 55,
        top: 50,
        width: 50,
        text: '{photo}',
        fontSize: 7,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'center',
        originX: 'center',
      },
      // Ticket type
      {
        type: 'textbox',
        left: 20,
        top: 110,
        width: 100,
        text: '{ticket_type}',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#8b5cf6',
        textAlign: 'left',
      },
      // Event date
      {
        type: 'textbox',
        left: 20,
        top: ID_CARD_HEIGHT - 25,
        width: 150,
        text: '{event_date}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'left',
      },
      // QR code area
      {
        type: 'rect',
        left: ID_CARD_WIDTH - 60,
        top: ID_CARD_HEIGHT - 60,
        width: 45,
        height: 45,
        fill: '#f8fafc',
        stroke: '#e2e8f0',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
    ],
  },
};

// Minimal Template
const minimalTemplate: IDCardTemplatePreset = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Ultra-clean with maximum whitespace',
  thumbnail: '◻️',
  category: 'minimal',
  dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: ID_CARD_HEIGHT,
        fill: '#fafafa',
        selectable: false,
        evented: false,
      },
      // Name centered
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 50,
        width: 280,
        text: '{name}',
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        fill: '#111111',
        textAlign: 'center',
        originX: 'center',
      },
      // Thin line
      {
        type: 'line',
        left: ID_CARD_WIDTH / 2 - 40,
        top: 85,
        width: 80,
        stroke: '#dddddd',
        strokeWidth: 1,
        x1: 0,
        y1: 0,
        x2: 80,
        y2: 0,
      },
      // Role
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 100,
        width: 280,
        text: '{role}',
        fontSize: 12,
        fontFamily: 'Helvetica',
        fill: '#666666',
        textAlign: 'center',
        originX: 'center',
      },
      // Event name
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 140,
        width: 280,
        text: '{event_name}',
        fontSize: 10,
        fontFamily: 'Helvetica',
        fill: '#999999',
        textAlign: 'center',
        originX: 'center',
      },
      // Ticket type (bottom)
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: ID_CARD_HEIGHT - 30,
        width: 280,
        text: '{ticket_type}',
        fontSize: 9,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        fill: '#333333',
        textAlign: 'center',
        originX: 'center',
      },
    ],
  },
};

// Corporate Template
const corporateTemplate: IDCardTemplatePreset = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Formal business design with structured layout',
  thumbnail: '🏢',
  category: 'corporate',
  dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: ID_CARD_HEIGHT,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      },
      // Top blue bar
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: 8,
        fill: '#1e40af',
      },
      // Event name
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 20,
        width: 280,
        text: '{event_name}',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e40af',
        textAlign: 'center',
        originX: 'center',
      },
      // Photo placeholder
      {
        type: 'rect',
        left: ID_CARD_WIDTH / 2 - 35,
        top: 45,
        width: 70,
        height: 70,
        fill: '#f1f5f9',
        stroke: '#1e40af',
        strokeWidth: 2,
      },
      // Photo text
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 75,
        width: 60,
        text: '{photo}',
        fontSize: 8,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'center',
        originX: 'center',
      },
      // Name
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 125,
        width: 280,
        text: '{name}',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'center',
        originX: 'center',
      },
      // Role
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 148,
        width: 280,
        text: '{role}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#475569',
        textAlign: 'center',
        originX: 'center',
      },
      // Organization
      {
        type: 'textbox',
        left: ID_CARD_WIDTH / 2,
        top: 165,
        width: 280,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#64748b',
        textAlign: 'center',
        originX: 'center',
      },
      // Bottom bar
      {
        type: 'rect',
        left: 0,
        top: ID_CARD_HEIGHT - 8,
        width: ID_CARD_WIDTH,
        height: 8,
        fill: '#1e40af',
      },
    ],
  },
};

// Creative Template
const creativeTemplate: IDCardTemplatePreset = {
  id: 'creative',
  name: 'Creative',
  description: 'Colorful asymmetric design',
  thumbnail: '🎨',
  category: 'creative',
  dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: ID_CARD_WIDTH,
        height: ID_CARD_HEIGHT,
        fill: '#fef3c7',
        selectable: false,
        evented: false,
      },
      // Colored corner triangle (simulated with rect)
      {
        type: 'rect',
        left: -50,
        top: -50,
        width: 150,
        height: 150,
        fill: '#f97316',
        angle: 45,
      },
      // Circle decoration
      {
        type: 'circle',
        left: ID_CARD_WIDTH - 30,
        top: ID_CARD_HEIGHT - 80,
        radius: 60,
        fill: '#fbbf24',
        opacity: 0.5,
      },
      // Event name
      {
        type: 'textbox',
        left: 15,
        top: 55,
        width: 200,
        text: '{event_name}',
        fontSize: 10,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#92400e',
        textAlign: 'left',
      },
      // Name
      {
        type: 'textbox',
        left: 15,
        top: 75,
        width: 250,
        text: '{name}',
        fontSize: 22,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#451a03',
        textAlign: 'left',
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 105,
        width: 200,
        text: '{role}',
        fontSize: 13,
        fontFamily: 'Arial',
        fill: '#78350f',
        textAlign: 'left',
      },
      // Ticket type
      {
        type: 'textbox',
        left: 15,
        top: 130,
        width: 120,
        text: '{ticket_type}',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#f97316',
        textAlign: 'left',
      },
      // Photo circle
      {
        type: 'circle',
        left: ID_CARD_WIDTH - 85,
        top: 20,
        radius: 32,
        fill: '#ffffff',
        stroke: '#f97316',
        strokeWidth: 3,
      },
      // QR area
      {
        type: 'rect',
        left: ID_CARD_WIDTH - 55,
        top: ID_CARD_HEIGHT - 55,
        width: 40,
        height: 40,
        fill: '#ffffff',
        stroke: '#fbbf24',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      // Event date
      {
        type: 'textbox',
        left: 15,
        top: ID_CARD_HEIGHT - 25,
        width: 150,
        text: '{event_date}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: '#92400e',
        textAlign: 'left',
      },
    ],
  },
};

// Export all templates
export const ID_CARD_TEMPLATES: IDCardTemplatePreset[] = [
  professionalTemplate,
  modernTemplate,
  minimalTemplate,
  corporateTemplate,
  creativeTemplate,
];
