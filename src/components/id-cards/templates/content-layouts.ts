/**
 * Pre-built ID Card Content Layouts
 * These define the positioning of text elements and placeholders
 * Text content uses placeholder syntax like {name}, {role}, etc.
 */

export interface IDCardContentLayout {
  id: string;
  name: string;
  style: 'professional' | 'modern' | 'minimal' | 'corporate' | 'creative';
  orientation: 'landscape' | 'portrait';
  objects: object[];
}

// Landscape dimensions: 324 x 204
// Portrait dimensions: 204 x 324

export const ID_CARD_CONTENT_LAYOUTS: IDCardContentLayout[] = [
  // ===== PROFESSIONAL LAYOUTS =====
  {
    id: 'professional-landscape',
    name: 'Professional',
    style: 'professional',
    orientation: 'landscape',
    objects: [
      // Photo placeholder - left side
      {
        type: 'rect',
        left: 16,
        top: 60,
        width: 70,
        height: 85,
        fill: '#E5E7EB',
        stroke: 'TEXT_COLOR',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // Name
      {
        type: 'textbox',
        left: 100,
        top: 65,
        width: 200,
        text: '{name}',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        selectable: true,
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
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 100,
        top: 110,
        width: 200,
        text: '{organization}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Event name - bottom
      {
        type: 'textbox',
        left: 100,
        top: 140,
        width: 140,
        text: '{event_name}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // QR Code - right side
      {
        type: 'rect',
        left: 254,
        top: 64,
        width: 55,
        height: 55,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
      // QR label
      {
        type: 'textbox',
        left: 254,
        top: 122,
        width: 55,
        text: 'SCAN',
        fontSize: 8,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
    ],
  },
  {
    id: 'professional-portrait',
    name: 'Professional',
    style: 'professional',
    orientation: 'portrait',
    objects: [
      // Photo placeholder - centered top
      {
        type: 'rect',
        left: 62,
        top: 55,
        width: 80,
        height: 95,
        fill: '#E5E7EB',
        stroke: 'TEXT_COLOR',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // Name
      {
        type: 'textbox',
        left: 15,
        top: 165,
        width: 174,
        text: '{name}',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 188,
        width: 174,
        text: '{role}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 15,
        top: 206,
        width: 174,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // QR Code - bottom center
      {
        type: 'rect',
        left: 72,
        top: 235,
        width: 60,
        height: 60,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
      // Event name
      {
        type: 'textbox',
        left: 15,
        top: 302,
        width: 174,
        text: '{event_name}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
    ],
  },

  // ===== MODERN LAYOUTS =====
  {
    id: 'modern-landscape',
    name: 'Modern',
    style: 'modern',
    orientation: 'landscape',
    objects: [
      // Name - large, bold
      {
        type: 'textbox',
        left: 20,
        top: 65,
        width: 180,
        text: '{name}',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        selectable: true,
      },
      // Role with accent bar
      {
        type: 'rect',
        left: 20,
        top: 95,
        width: 40,
        height: 3,
        fill: 'PRIMARY_COLOR',
        selectable: false,
      },
      {
        type: 'textbox',
        left: 20,
        top: 105,
        width: 180,
        text: '{role}',
        fontSize: 13,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Organization & Event
      {
        type: 'textbox',
        left: 20,
        top: 128,
        width: 180,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      {
        type: 'textbox',
        left: 20,
        top: 145,
        width: 180,
        text: '{event_name}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Photo - right side, circular feel
      {
        type: 'circle',
        left: 255,
        top: 60,
        radius: 35,
        fill: '#E5E7EB',
        stroke: 'PRIMARY_COLOR',
        strokeWidth: 2,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // QR Code - bottom right
      {
        type: 'rect',
        left: 255,
        top: 140,
        width: 45,
        height: 45,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },
  {
    id: 'modern-portrait',
    name: 'Modern',
    style: 'modern',
    orientation: 'portrait',
    objects: [
      // Photo - top, circular
      {
        type: 'circle',
        left: 102,
        top: 65,
        radius: 45,
        fill: '#E5E7EB',
        stroke: 'PRIMARY_COLOR',
        strokeWidth: 3,
        originX: 'center',
        originY: 'center',
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // Accent line
      {
        type: 'rect',
        left: 82,
        top: 125,
        width: 40,
        height: 3,
        fill: 'PRIMARY_COLOR',
        selectable: false,
      },
      // Name
      {
        type: 'textbox',
        left: 15,
        top: 140,
        width: 174,
        text: '{name}',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 168,
        width: 174,
        text: '{role}',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 15,
        top: 188,
        width: 174,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // QR Code
      {
        type: 'rect',
        left: 72,
        top: 220,
        width: 60,
        height: 60,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
      // Event name
      {
        type: 'textbox',
        left: 15,
        top: 290,
        width: 174,
        text: '{event_name}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
    ],
  },

  // ===== MINIMAL LAYOUTS =====
  {
    id: 'minimal-landscape',
    name: 'Minimal',
    style: 'minimal',
    orientation: 'landscape',
    objects: [
      // Name - centered, clean
      {
        type: 'textbox',
        left: 100,
        top: 70,
        width: 200,
        text: '{name}',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 100,
        top: 98,
        width: 200,
        text: '{role}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Separator
      {
        type: 'line',
        x1: 140, y1: 120, x2: 185, y2: 120,
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        opacity: 0.5,
        selectable: false,
      },
      // Organization
      {
        type: 'textbox',
        left: 100,
        top: 130,
        width: 200,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // QR - small, bottom right
      {
        type: 'rect',
        left: 274,
        top: 159,
        width: 35,
        height: 35,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },
  {
    id: 'minimal-portrait',
    name: 'Minimal',
    style: 'minimal',
    orientation: 'portrait',
    objects: [
      // Name
      {
        type: 'textbox',
        left: 15,
        top: 100,
        width: 174,
        text: '{name}',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 128,
        width: 174,
        text: '{role}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Separator
      {
        type: 'line',
        x1: 82, y1: 150, x2: 122, y2: 150,
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        opacity: 0.5,
        selectable: false,
      },
      // Organization
      {
        type: 'textbox',
        left: 15,
        top: 160,
        width: 174,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // QR - bottom
      {
        type: 'rect',
        left: 77,
        top: 250,
        width: 50,
        height: 50,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },

  // ===== CORPORATE LAYOUTS =====
  {
    id: 'corporate-landscape',
    name: 'Corporate',
    style: 'corporate',
    orientation: 'landscape',
    objects: [
      // Badge type indicator
      {
        type: 'textbox',
        left: 16,
        top: 16,
        width: 80,
        text: '{badge_type}',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: '#FFFFFF',
        selectable: true,
      },
      // Photo - structured
      {
        type: 'rect',
        left: 20,
        top: 65,
        width: 65,
        height: 80,
        fill: '#E5E7EB',
        stroke: 'TEXT_COLOR',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // Name
      {
        type: 'textbox',
        left: 100,
        top: 65,
        width: 145,
        text: '{name}',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 100,
        top: 88,
        width: 145,
        text: '{role}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 100,
        top: 106,
        width: 145,
        text: '{organization}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Event & Date
      {
        type: 'textbox',
        left: 100,
        top: 130,
        width: 145,
        text: '{event_name}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // QR Code
      {
        type: 'rect',
        left: 256,
        top: 65,
        width: 55,
        height: 55,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
      // ID number
      {
        type: 'textbox',
        left: 256,
        top: 125,
        width: 55,
        text: '{attendee_id}',
        fontSize: 7,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
    ],
  },
  {
    id: 'corporate-portrait',
    name: 'Corporate',
    style: 'corporate',
    orientation: 'portrait',
    objects: [
      // Badge type indicator
      {
        type: 'textbox',
        left: 15,
        top: 12,
        width: 174,
        text: '{badge_type}',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: '#FFFFFF',
        textAlign: 'center',
        selectable: true,
      },
      // Photo
      {
        type: 'rect',
        left: 57,
        top: 60,
        width: 90,
        height: 110,
        fill: '#E5E7EB',
        stroke: 'TEXT_COLOR',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // Name
      {
        type: 'textbox',
        left: 15,
        top: 185,
        width: 174,
        text: '{name}',
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 208,
        width: 174,
        text: '{role}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 15,
        top: 225,
        width: 174,
        text: '{organization}',
        fontSize: 9,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // QR Code
      {
        type: 'rect',
        left: 72,
        top: 248,
        width: 60,
        height: 60,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },

  // ===== CREATIVE LAYOUTS =====
  {
    id: 'creative-landscape',
    name: 'Creative',
    style: 'creative',
    orientation: 'landscape',
    objects: [
      // Large name - diagonal or dynamic feel
      {
        type: 'textbox',
        left: 20,
        top: 75,
        width: 200,
        text: '{name}',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        selectable: true,
      },
      // Accent underline
      {
        type: 'rect',
        left: 20,
        top: 105,
        width: 60,
        height: 4,
        fill: 'SECONDARY_COLOR',
        selectable: false,
      },
      // Role with icon-style badge
      {
        type: 'textbox',
        left: 20,
        top: 118,
        width: 200,
        text: '{role}',
        fontSize: 14,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // Event
      {
        type: 'textbox',
        left: 20,
        top: 145,
        width: 200,
        text: '{event_name}',
        fontSize: 10,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        selectable: true,
      },
      // QR in stylized frame
      {
        type: 'circle',
        left: 275,
        top: 102,
        radius: 38,
        fill: '#FFFFFF',
        stroke: 'PRIMARY_COLOR',
        strokeWidth: 3,
        originX: 'center',
        originY: 'center',
        selectable: false,
      },
      {
        type: 'rect',
        left: 250,
        top: 77,
        width: 50,
        height: 50,
        fill: '#F3F4F6',
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },
  {
    id: 'creative-portrait',
    name: 'Creative',
    style: 'creative',
    orientation: 'portrait',
    objects: [
      // Large name at top
      {
        type: 'textbox',
        left: 15,
        top: 55,
        width: 174,
        text: '{name}',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        fill: 'TEXT_COLOR',
        textAlign: 'center',
        selectable: true,
      },
      // Decorative elements
      {
        type: 'rect',
        left: 72,
        top: 88,
        width: 60,
        height: 4,
        fill: 'SECONDARY_COLOR',
        selectable: false,
      },
      // Role
      {
        type: 'textbox',
        left: 15,
        top: 105,
        width: 174,
        text: '{role}',
        fontSize: 14,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Organization
      {
        type: 'textbox',
        left: 15,
        top: 130,
        width: 174,
        text: '{organization}',
        fontSize: 11,
        fontFamily: 'Arial',
        fill: 'TEXT_MUTED',
        textAlign: 'center',
        selectable: true,
      },
      // Photo - offset creative placement
      {
        type: 'circle',
        left: 102,
        top: 195,
        radius: 50,
        fill: '#E5E7EB',
        stroke: 'PRIMARY_COLOR',
        strokeWidth: 3,
        originX: 'center',
        originY: 'center',
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'photo' },
      },
      // QR
      {
        type: 'rect',
        left: 77,
        top: 260,
        width: 50,
        height: 50,
        fill: '#F3F4F6',
        stroke: 'TEXT_MUTED',
        strokeWidth: 1,
        selectable: true,
        data: { isPlaceholder: true, placeholderType: 'qr' },
      },
    ],
  },
];

export function getLayoutsByStyle(style: string): IDCardContentLayout[] {
  return ID_CARD_CONTENT_LAYOUTS.filter(layout => layout.style === style);
}

export function getLayoutByStyleAndOrientation(
  style: string,
  orientation: 'landscape' | 'portrait'
): IDCardContentLayout | undefined {
  return ID_CARD_CONTENT_LAYOUTS.find(
    layout => layout.style === style && layout.orientation === orientation
  );
}

export function getLayoutById(id: string): IDCardContentLayout | undefined {
  return ID_CARD_CONTENT_LAYOUTS.find(layout => layout.id === id);
}

export const LAYOUT_STYLES = [
  { id: 'professional', label: 'Professional', description: 'Clean and structured corporate design' },
  { id: 'modern', label: 'Modern', description: 'Bold accents with contemporary feel' },
  { id: 'minimal', label: 'Minimal', description: 'Ultra-clean with maximum whitespace' },
  { id: 'corporate', label: 'Corporate', description: 'Formal business card layout' },
  { id: 'creative', label: 'Creative', description: 'Vibrant and dynamic styling' },
] as const;
