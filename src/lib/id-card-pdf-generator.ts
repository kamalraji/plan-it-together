import jsPDF from 'jspdf';
import { AttendeeForCard, GenerationProgress } from '@/hooks/useIDCardGeneration';

// CR80 card dimensions in mm (standard ID card size)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;

// Page dimensions
const PAGE_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

// Cards per page layouts
const LAYOUTS: Record<number, { cols: number; rows: number }> = {
  1: { cols: 1, rows: 1 },
  2: { cols: 1, rows: 2 },
  4: { cols: 2, rows: 2 },
  8: { cols: 2, rows: 4 },
  9: { cols: 3, rows: 3 },
};

interface RenderOptions {
  cardsPerPage: 1 | 2 | 4 | 8 | 9;
  pageSize: 'a4' | 'letter';
  includeCutMarks: boolean;
}

interface TemplateDesign {
  objects?: Array<{
    type: string;
    text?: string;
    fill?: string;
    fontSize?: number;
    fontFamily?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    radius?: number;
    rx?: number;
    ry?: number;
    stroke?: string;
    strokeWidth?: number;
    src?: string;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    opacity?: number;
  }>;
  background?: string;
  width?: number;
  height?: number;
}

// Simple QR code generator (uses a basic pattern, you may want to use a proper library)
function generateQRDataUrl(data: string): string {
  // Create a simple QR-like pattern for demo purposes
  // In production, use a library like 'qrcode' npm package
  const canvas = document.createElement('canvas');
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Create a simple pattern based on the data hash
  ctx.fillStyle = '#000000';
  const hash = simpleHash(data);
  const gridSize = 10;
  const cellSize = size / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Position patterns (corners)
      if ((i < 3 && j < 3) || (i < 3 && j >= gridSize - 3) || (i >= gridSize - 3 && j < 3)) {
        if (i === 0 || i === 2 || j === 0 || j === 2 || 
            i === gridSize - 1 || i === gridSize - 3 || 
            j === gridSize - 1 || j === gridSize - 3) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        } else if (i === 1 && j === 1) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      } else {
        // Data pattern based on hash
        if ((hash >> ((i * gridSize + j) % 32)) & 1) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  
  return canvas.toDataURL('image/png');
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Replace placeholders in text
function replacePlaceholders(text: string, attendee: AttendeeForCard, eventData?: { name?: string; date?: string }): string {
  const replacements: Record<string, string> = {
    '{name}': attendee.full_name || '',
    '{full_name}': attendee.full_name || '',
    '{email}': attendee.email || '',
    '{phone}': attendee.phone || '',
    '{organization}': attendee.organization || '',
    '{ticket_type}': attendee.ticket_type || '',
    '{ticketType}': attendee.ticket_type || '',
    '{event_name}': eventData?.name || '',
    '{event_date}': eventData?.date || '',
    '{{name}}': attendee.full_name || '',
    '{{full_name}}': attendee.full_name || '',
    '{{email}}': attendee.email || '',
    '{{phone}}': attendee.phone || '',
    '{{organization}}': attendee.organization || '',
    '{{ticket_type}}': attendee.ticket_type || '',
    '{{ticketType}}': attendee.ticket_type || '',
    '{{event_name}}': eventData?.name || '',
    '{{event_date}}': eventData?.date || '',
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi'), value);
  }
  return result;
}

// Render a single card to canvas
async function renderCardToCanvas(
  template: TemplateDesign,
  attendee: AttendeeForCard,
  eventData?: { name?: string; date?: string }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // Use high DPI for better print quality
  const dpi = 300;
  const mmToPx = dpi / 25.4;
  
  canvas.width = Math.round(CARD_WIDTH_MM * mmToPx);
  canvas.height = Math.round(CARD_HEIGHT_MM * mmToPx);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');
  
  const scaleX = canvas.width / (template.width || 342);
  const scaleY = canvas.height / (template.height || 216);
  
  // Draw background
  if (template.background) {
    ctx.fillStyle = template.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw each object
  for (const obj of template.objects || []) {
    ctx.save();
    
    const x = (obj.left || 0) * scaleX;
    const y = (obj.top || 0) * scaleY;
    const width = (obj.width || 0) * scaleX * (obj.scaleX || 1);
    const height = (obj.height || 0) * scaleY * (obj.scaleY || 1);
    
    // Apply rotation if needed
    if (obj.angle) {
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((obj.angle * Math.PI) / 180);
      ctx.translate(-(x + width / 2), -(y + height / 2));
    }
    
    // Apply opacity
    ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
    
    switch (obj.type) {
      case 'rect':
        ctx.fillStyle = obj.fill || '#cccccc';
        if (obj.rx || obj.ry) {
          // Rounded rectangle
          const rx = (obj.rx || 0) * scaleX;
          const ry = (obj.ry || 0) * scaleY;
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, [rx, ry]);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, width, height);
        }
        if (obj.stroke && obj.strokeWidth) {
          ctx.strokeStyle = obj.stroke;
          ctx.lineWidth = obj.strokeWidth * scaleX;
          ctx.strokeRect(x, y, width, height);
        }
        break;
        
      case 'circle':
        ctx.fillStyle = obj.fill || '#cccccc';
        ctx.beginPath();
        ctx.arc(x + (obj.radius || 0) * scaleX, y + (obj.radius || 0) * scaleY, 
                (obj.radius || 0) * scaleX, 0, Math.PI * 2);
        ctx.fill();
        if (obj.stroke && obj.strokeWidth) {
          ctx.strokeStyle = obj.stroke;
          ctx.lineWidth = obj.strokeWidth * scaleX;
          ctx.stroke();
        }
        break;
        
      case 'text':
      case 'i-text':
      case 'textbox':
        const text = replacePlaceholders(obj.text || '', attendee, eventData);
        const fontSize = (obj.fontSize || 16) * scaleY;
        ctx.font = `${fontSize}px ${obj.fontFamily || 'Arial'}`;
        ctx.fillStyle = obj.fill || '#000000';
        ctx.textBaseline = 'top';
        
        // Word wrap for textbox
        if (obj.type === 'textbox' && width > 0) {
          const words = text.split(' ');
          let line = '';
          let lineY = y;
          const lineHeight = fontSize * 1.2;
          
          for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > width && line !== '') {
              ctx.fillText(line.trim(), x, lineY);
              line = word + ' ';
              lineY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line.trim(), x, lineY);
        } else {
          ctx.fillText(text, x, y);
        }
        break;
        
      case 'image':
        if (obj.src) {
          let imageSrc = obj.src;
          
          // Handle QR code placeholder
          if (obj.src.includes('qr') || obj.src.includes('QR') || 
              (obj.text && obj.text.includes('qr'))) {
            imageSrc = generateQRDataUrl(`attendee:${attendee.id}`);
          }
          
          // Handle photo placeholder
          if (obj.src.includes('photo') || obj.src.includes('avatar') ||
              (obj.text && (obj.text.includes('photo') || obj.text.includes('Photo')))) {
            imageSrc = attendee.photo_url || generatePlaceholderAvatar(attendee.full_name);
          }
          
          try {
            const img = await loadImage(imageSrc);
            ctx.drawImage(img, x, y, width || img.width * scaleX, height || img.height * scaleY);
          } catch {
            // Draw placeholder if image fails to load
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(x, y, width || 50, height || 50);
          }
        }
        break;
    }
    
    ctx.restore();
  }
  
  return canvas;
}

// Load image helper
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Generate placeholder avatar
function generatePlaceholderAvatar(name: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Background color based on name
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  const colorIndex = simpleHash(name) % colors.length;
  ctx.fillStyle = colors[colorIndex];
  ctx.fillRect(0, 0, 100, 100);
  
  // Initials
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 50, 50);
  
  return canvas.toDataURL('image/png');
}

// Draw cut marks
function drawCutMarks(
  pdf: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  markLength: number = 5
): void {
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.1);
  
  // Top-left
  pdf.line(x - markLength, y, x - 1, y);
  pdf.line(x, y - markLength, x, y - 1);
  
  // Top-right
  pdf.line(x + width + 1, y, x + width + markLength, y);
  pdf.line(x + width, y - markLength, x + width, y - 1);
  
  // Bottom-left
  pdf.line(x - markLength, y + height, x - 1, y + height);
  pdf.line(x, y + height + 1, x, y + height + markLength);
  
  // Bottom-right
  pdf.line(x + width + 1, y + height, x + width + markLength, y + height);
  pdf.line(x + width, y + height + 1, x + width, y + height + markLength);
}

export async function generateIDCardsPDF(
  template: TemplateDesign,
  attendees: AttendeeForCard[],
  options: RenderOptions,
  eventData?: { name?: string; date?: string },
  onProgress?: (progress: GenerationProgress) => void
): Promise<Blob> {
  const pageSize = PAGE_SIZES[options.pageSize];
  const layout = LAYOUTS[options.cardsPerPage];
  const margin = 10; // mm
  
  // Calculate card placement
  const availableWidth = pageSize.width - (margin * 2);
  const availableHeight = pageSize.height - (margin * 2);
  
  const cardWidth = Math.min(CARD_WIDTH_MM, availableWidth / layout.cols - 5);
  const cardHeight = Math.min(CARD_HEIGHT_MM, availableHeight / layout.rows - 5);
  
  const horizontalSpacing = (availableWidth - (cardWidth * layout.cols)) / (layout.cols + 1);
  const verticalSpacing = (availableHeight - (cardHeight * layout.rows)) / (layout.rows + 1);
  
  const pdf = new jsPDF({
    orientation: pageSize.width > pageSize.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageSize.width, pageSize.height],
  });
  
  const cardsPerPage = layout.cols * layout.rows;
  const totalPages = Math.ceil(attendees.length / cardsPerPage);
  
  onProgress?.({
    current: 0,
    total: attendees.length,
    status: 'preparing',
    message: 'Preparing to generate cards...',
  });
  
  let cardIndex = 0;
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage([pageSize.width, pageSize.height]);
    }
    
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        if (cardIndex >= attendees.length) break;
        
        const attendee = attendees[cardIndex];
        
        onProgress?.({
          current: cardIndex + 1,
          total: attendees.length,
          status: 'generating',
          message: `Generating card for ${attendee.full_name}...`,
        });
        
        try {
          const cardCanvas = await renderCardToCanvas(template, attendee, eventData);
          const cardDataUrl = cardCanvas.toDataURL('image/png');
          
          const x = margin + horizontalSpacing + (col * (cardWidth + horizontalSpacing));
          const y = margin + verticalSpacing + (row * (cardHeight + verticalSpacing));
          
          pdf.addImage(cardDataUrl, 'PNG', x, y, cardWidth, cardHeight);
          
          if (options.includeCutMarks) {
            drawCutMarks(pdf, x, y, cardWidth, cardHeight);
          }
        } catch {
          // Skip this card on render failure
        }
        
        cardIndex++;
      }
    }
  }
  
  onProgress?.({
    current: attendees.length,
    total: attendees.length,
    status: 'composing',
    message: 'Finalizing PDF...',
  });
  
  const blob = pdf.output('blob');
  
  onProgress?.({
    current: attendees.length,
    total: attendees.length,
    status: 'complete',
    message: 'PDF generated successfully!',
  });
  
  return blob;
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
