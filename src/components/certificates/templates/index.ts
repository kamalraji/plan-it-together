// Certificate Template Registry
// Contains pre-built templates for the certificate designer

export interface CertificateTemplatePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'formal' | 'modern' | 'minimal' | 'creative';
  canvasJSON: object;
  dimensions: {
    width: number;
    height: number;
  };
}

// A4 Landscape dimensions at 72 DPI
export const CANVAS_WIDTH = 842;
export const CANVAS_HEIGHT = 595;

// Classic Traditional Template
export const classicTemplate: CertificateTemplatePreset = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional formal design with ornate border',
  thumbnail: '🏛️',
  category: 'formal',
  dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        fill: '#fffef5',
        selectable: false,
        evented: false,
      },
      // Outer border
      {
        type: 'rect',
        left: 20,
        top: 20,
        width: CANVAS_WIDTH - 40,
        height: CANVAS_HEIGHT - 40,
        fill: 'transparent',
        stroke: '#b8860b',
        strokeWidth: 3,
        rx: 0,
        ry: 0,
      },
      // Inner border
      {
        type: 'rect',
        left: 30,
        top: 30,
        width: CANVAS_WIDTH - 60,
        height: CANVAS_HEIGHT - 60,
        fill: 'transparent',
        stroke: '#b8860b',
        strokeWidth: 1,
      },
      // Title
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 80,
        width: 600,
        text: 'Certificate of {certificate_type}',
        fontSize: 42,
        fontFamily: 'Georgia',
        fontWeight: 'normal',
        fill: '#1a1a1a',
        textAlign: 'center',
        originX: 'center',
      },
      // Decorative line
      {
        type: 'line',
        left: 171,
        top: 140,
        width: 500,
        stroke: '#b8860b',
        strokeWidth: 2,
        x1: 0,
        y1: 0,
        x2: 500,
        y2: 0,
      },
      // Presented to text
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 170,
        width: 400,
        text: 'This is to certify that',
        fontSize: 18,
        fontFamily: 'Georgia',
        fontStyle: 'italic',
        fill: '#4a4a4a',
        textAlign: 'center',
        originX: 'center',
      },
      // Recipient name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 220,
        width: 600,
        text: '{recipient_name}',
        fontSize: 48,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        fill: '#1a1a1a',
        textAlign: 'center',
        originX: 'center',
      },
      // Achievement text
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 300,
        width: 600,
        text: 'has successfully completed the requirements for',
        fontSize: 16,
        fontFamily: 'Georgia',
        fill: '#4a4a4a',
        textAlign: 'center',
        originX: 'center',
      },
      // Event name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 340,
        width: 600,
        text: '{event_name}',
        fontSize: 28,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        fill: '#1a1a1a',
        textAlign: 'center',
        originX: 'center',
      },
      // Date
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 400,
        width: 300,
        text: '{issue_date}',
        fontSize: 16,
        fontFamily: 'Georgia',
        fill: '#4a4a4a',
        textAlign: 'center',
        originX: 'center',
      },
      // Certificate ID
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 540,
        width: 300,
        text: '{certificate_id}',
        fontSize: 12,
        fontFamily: 'Courier New',
        fill: '#888888',
        textAlign: 'center',
        originX: 'center',
      },
    ],
  },
};

// Modern Minimal Template
export const modernTemplate: CertificateTemplatePreset = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean contemporary design with geometric accents',
  thumbnail: '✨',
  category: 'modern',
  dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
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
        height: CANVAS_HEIGHT,
        fill: '#3b82f6',
      },
      // Top accent line
      {
        type: 'rect',
        left: 40,
        top: 40,
        width: 100,
        height: 4,
        fill: '#3b82f6',
      },
      // Title
      {
        type: 'textbox',
        left: 60,
        top: 70,
        width: 400,
        text: 'CERTIFICATE',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#3b82f6',
        letterSpacing: 400,
        textAlign: 'left',
      },
      // Type
      {
        type: 'textbox',
        left: 60,
        top: 100,
        width: 500,
        text: 'of {certificate_type}',
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e293b',
        textAlign: 'left',
      },
      // Recipient name
      {
        type: 'textbox',
        left: 60,
        top: 200,
        width: 700,
        text: '{recipient_name}',
        fontSize: 52,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'left',
      },
      // Description
      {
        type: 'textbox',
        left: 60,
        top: 280,
        width: 500,
        text: 'For successfully completing',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#64748b',
        textAlign: 'left',
      },
      // Event name
      {
        type: 'textbox',
        left: 60,
        top: 310,
        width: 600,
        text: '{event_name}',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e293b',
        textAlign: 'left',
      },
      // Date section
      {
        type: 'textbox',
        left: 60,
        top: 480,
        width: 200,
        text: 'Date Issued',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#94a3b8',
        textAlign: 'left',
      },
      {
        type: 'textbox',
        left: 60,
        top: 500,
        width: 200,
        text: '{issue_date}',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e293b',
        textAlign: 'left',
      },
      // Certificate ID
      {
        type: 'textbox',
        left: 60,
        top: 550,
        width: 300,
        text: '{certificate_id}',
        fontSize: 11,
        fontFamily: 'Courier New',
        fill: '#94a3b8',
        textAlign: 'left',
      },
    ],
  },
};

// Minimal Clean Template
export const minimalTemplate: CertificateTemplatePreset = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Ultra-clean design with maximum whitespace',
  thumbnail: '◻️',
  category: 'minimal',
  dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        fill: '#fafafa',
        selectable: false,
        evented: false,
      },
      // Title
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 120,
        width: 600,
        text: 'Certificate of {certificate_type}',
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        fill: '#333333',
        textAlign: 'center',
        originX: 'center',
      },
      // Recipient name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 240,
        width: 700,
        text: '{recipient_name}',
        fontSize: 56,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        fill: '#111111',
        textAlign: 'center',
        originX: 'center',
      },
      // Thin line
      {
        type: 'line',
        left: CANVAS_WIDTH / 2 - 60,
        top: 320,
        width: 120,
        stroke: '#cccccc',
        strokeWidth: 1,
        x1: 0,
        y1: 0,
        x2: 120,
        y2: 0,
      },
      // Event name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 350,
        width: 600,
        text: '{event_name}',
        fontSize: 20,
        fontFamily: 'Helvetica',
        fill: '#666666',
        textAlign: 'center',
        originX: 'center',
      },
      // Date
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 420,
        width: 300,
        text: '{issue_date}',
        fontSize: 14,
        fontFamily: 'Helvetica',
        fill: '#999999',
        textAlign: 'center',
        originX: 'center',
      },
      // Certificate ID
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 540,
        width: 300,
        text: '{certificate_id}',
        fontSize: 10,
        fontFamily: 'Courier New',
        fill: '#bbbbbb',
        textAlign: 'center',
        originX: 'center',
      },
    ],
  },
};

// Elegant Award Template
export const elegantTemplate: CertificateTemplatePreset = {
  id: 'elegant',
  name: 'Elegant',
  description: 'Sophisticated design with gold accents',
  thumbnail: '🏆',
  category: 'formal',
  dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        fill: '#0c1929',
        selectable: false,
        evented: false,
      },
      // Gold border
      {
        type: 'rect',
        left: 25,
        top: 25,
        width: CANVAS_WIDTH - 50,
        height: CANVAS_HEIGHT - 50,
        fill: 'transparent',
        stroke: '#d4af37',
        strokeWidth: 2,
      },
      // Inner gold border
      {
        type: 'rect',
        left: 35,
        top: 35,
        width: CANVAS_WIDTH - 70,
        height: CANVAS_HEIGHT - 70,
        fill: 'transparent',
        stroke: '#d4af37',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
      },
      // Award text
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 70,
        width: 400,
        text: '★ AWARD ★',
        fontSize: 16,
        fontFamily: 'Georgia',
        fill: '#d4af37',
        textAlign: 'center',
        originX: 'center',
        letterSpacing: 300,
      },
      // Title
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 100,
        width: 600,
        text: 'Certificate of Excellence',
        fontSize: 38,
        fontFamily: 'Georgia',
        fill: '#ffffff',
        textAlign: 'center',
        originX: 'center',
      },
      // Decorative line
      {
        type: 'line',
        left: CANVAS_WIDTH / 2 - 150,
        top: 160,
        width: 300,
        stroke: '#d4af37',
        strokeWidth: 1,
        x1: 0,
        y1: 0,
        x2: 300,
        y2: 0,
      },
      // Presented to
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 190,
        width: 400,
        text: 'Presented to',
        fontSize: 16,
        fontFamily: 'Georgia',
        fontStyle: 'italic',
        fill: '#a0a0a0',
        textAlign: 'center',
        originX: 'center',
      },
      // Recipient name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 230,
        width: 700,
        text: '{recipient_name}',
        fontSize: 48,
        fontFamily: 'Georgia',
        fill: '#d4af37',
        textAlign: 'center',
        originX: 'center',
      },
      // For text
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 310,
        width: 500,
        text: 'In recognition of outstanding achievement in',
        fontSize: 14,
        fontFamily: 'Georgia',
        fill: '#c0c0c0',
        textAlign: 'center',
        originX: 'center',
      },
      // Event name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 350,
        width: 600,
        text: '{event_name}',
        fontSize: 26,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        fill: '#ffffff',
        textAlign: 'center',
        originX: 'center',
      },
      // Date
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 430,
        width: 300,
        text: '{issue_date}',
        fontSize: 14,
        fontFamily: 'Georgia',
        fill: '#a0a0a0',
        textAlign: 'center',
        originX: 'center',
      },
      // Certificate ID
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 540,
        width: 300,
        text: '{certificate_id}',
        fontSize: 10,
        fontFamily: 'Courier New',
        fill: '#666666',
        textAlign: 'center',
        originX: 'center',
      },
    ],
  },
};

// Corporate Professional Template
export const corporateTemplate: CertificateTemplatePreset = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional business-oriented design',
  thumbnail: '💼',
  category: 'modern',
  dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasJSON: {
    version: '6.0.0',
    objects: [
      // Background
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      },
      // Top bar
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: 60,
        fill: '#1e3a5f',
      },
      // Bottom bar
      {
        type: 'rect',
        left: 0,
        top: CANVAS_HEIGHT - 40,
        width: CANVAS_WIDTH,
        height: 40,
        fill: '#1e3a5f',
      },
      // Title in header
      {
        type: 'textbox',
        left: 40,
        top: 18,
        width: 400,
        text: 'PROFESSIONAL CERTIFICATION',
        fontSize: 18,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#ffffff',
        textAlign: 'left',
        letterSpacing: 100,
      },
      // Main title
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 100,
        width: 600,
        text: 'Certificate of {certificate_type}',
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e3a5f',
        textAlign: 'center',
        originX: 'center',
      },
      // Recipient name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 200,
        width: 700,
        text: '{recipient_name}',
        fontSize: 44,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'center',
        originX: 'center',
      },
      // Line under name
      {
        type: 'line',
        left: CANVAS_WIDTH / 2 - 200,
        top: 260,
        width: 400,
        stroke: '#1e3a5f',
        strokeWidth: 2,
        x1: 0,
        y1: 0,
        x2: 400,
        y2: 0,
      },
      // Description
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 290,
        width: 600,
        text: 'Has successfully demonstrated competency in',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#4b5563',
        textAlign: 'center',
        originX: 'center',
      },
      // Event/Program name
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: 330,
        width: 600,
        text: '{event_name}',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e3a5f',
        textAlign: 'center',
        originX: 'center',
      },
      // Date label
      {
        type: 'textbox',
        left: 150,
        top: 450,
        width: 150,
        text: 'Date Issued',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#6b7280',
        textAlign: 'center',
      },
      // Date value
      {
        type: 'textbox',
        left: 150,
        top: 470,
        width: 150,
        text: '{issue_date}',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e3a5f',
        textAlign: 'center',
      },
      // Issuer label
      {
        type: 'textbox',
        left: CANVAS_WIDTH - 200,
        top: 450,
        width: 150,
        text: 'Issued By',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#6b7280',
        textAlign: 'center',
      },
      // Issuer value
      {
        type: 'textbox',
        left: CANVAS_WIDTH - 200,
        top: 470,
        width: 150,
        text: '{issuer_name}',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#1e3a5f',
        textAlign: 'center',
      },
      // Footer certificate ID
      {
        type: 'textbox',
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT - 28,
        width: 300,
        text: '{certificate_id}',
        fontSize: 11,
        fontFamily: 'Courier New',
        fill: '#ffffff',
        textAlign: 'center',
        originX: 'center',
      },
    ],
  },
};

// Export all templates
export const CERTIFICATE_TEMPLATES: CertificateTemplatePreset[] = [
  classicTemplate,
  modernTemplate,
  minimalTemplate,
  elegantTemplate,
  corporateTemplate,
];

// Get template by ID
export function getTemplateById(id: string): CertificateTemplatePreset | undefined {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === id);
}

// Get templates by category
export function getTemplatesByCategory(
  category: CertificateTemplatePreset['category']
): CertificateTemplatePreset[] {
  return CERTIFICATE_TEMPLATES.filter((t) => t.category === category);
}
