// Certificate PDF Generation Utilities
// Handles client-side PDF generation for certificate templates

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Canvas as FabricCanvas } from 'fabric';
import { replacePlaceholders, PlaceholderData, getSamplePlaceholderData } from './certificate-placeholders';

export type ExportFormat = 'A4' | 'Letter' | 'A3' | 'A5' | 'Custom';
export type ExportQuality = 'standard' | 'high' | 'print' | 'print-300dpi';

export interface CertificateExportOptions {
  format: ExportFormat;
  orientation: 'landscape' | 'portrait';
  quality: ExportQuality;
  filename?: string;
  includeBleed?: boolean;
  bleedMm?: number;
}

// Quality settings with DPI specifications
const QUALITY_SETTINGS: Record<ExportQuality, { scale: number; imageQuality: number; dpi: number }> = {
  standard: { scale: 1, imageQuality: 0.8, dpi: 72 },
  high: { scale: 2, imageQuality: 0.92, dpi: 150 },
  print: { scale: 3, imageQuality: 1, dpi: 200 },
  'print-300dpi': { scale: 4.17, imageQuality: 1, dpi: 300 }, // 300/72 ≈ 4.17
};

// Paper sizes in mm (width x height for landscape orientation)
const FORMAT_SIZES: Record<ExportFormat, { width: number; height: number }> = {
  A4: { width: 297, height: 210 },
  Letter: { width: 279.4, height: 215.9 },
  A3: { width: 420, height: 297 },
  A5: { width: 210, height: 148 },
  Custom: { width: 297, height: 210 }, // Default to A4
};

// Calculate pixel dimensions at a given DPI
export function getPixelDimensions(
  format: ExportFormat,
  orientation: 'landscape' | 'portrait',
  dpi: number
): { width: number; height: number } {
  const size = FORMAT_SIZES[format];
  const mmToInch = 1 / 25.4;
  
  const baseWidth = orientation === 'landscape' ? size.width : size.height;
  const baseHeight = orientation === 'landscape' ? size.height : size.width;
  
  return {
    width: Math.round(baseWidth * mmToInch * dpi),
    height: Math.round(baseHeight * mmToInch * dpi),
  };
}

/**
 * Generate QR code URL for a certificate
 */
export function generateQRCodeUrl(
  certificateId: string,
  size: number = 150,
  baseVerifyUrl: string = window.location.origin
): string {
  const verifyUrl = `${baseVerifyUrl}/verify/${certificateId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verifyUrl)}&format=png`;
}

/**
 * Export Fabric.js canvas to PDF with advanced options
 */
export async function exportCanvasToPDF(
  canvas: FabricCanvas,
  options: CertificateExportOptions = {
    format: 'A4',
    orientation: 'landscape',
    quality: 'high',
  }
): Promise<Blob> {
  const quality = QUALITY_SETTINGS[options.quality];
  const format = FORMAT_SIZES[options.format];
  const bleed = options.includeBleed ? (options.bleedMm || 3) : 0;

  // Get canvas dimensions with bleed
  let width = options.orientation === 'landscape' ? format.width : format.height;
  let height = options.orientation === 'landscape' ? format.height : format.width;
  
  // Add bleed on all sides
  const totalWidth = width + (bleed * 2);
  const totalHeight = height + (bleed * 2);

  // Create high-resolution data URL from canvas
  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: quality.imageQuality,
    multiplier: quality.scale,
  });

  // Create PDF
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: [totalWidth, totalHeight],
  });

  // Add image to PDF (with bleed offset if applicable)
  pdf.addImage(dataUrl, 'PNG', bleed, bleed, width, height);

  // Add crop marks if bleed is included
  if (bleed > 0) {
    addCropMarks(pdf, bleed, width, height, totalWidth, totalHeight);
  }

  // Return as blob
  return pdf.output('blob');
}

/**
 * Add crop marks to PDF for professional printing
 */
function addCropMarks(
  pdf: jsPDF,
  bleed: number,
  contentWidth: number,
  contentHeight: number,
  totalWidth: number,
  totalHeight: number
): void {
  const markLength = 5; // mm
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.1);

  // Top-left corner
  pdf.line(0, bleed, markLength, bleed);
  pdf.line(bleed, 0, bleed, markLength);
  
  // Top-right corner
  pdf.line(totalWidth - markLength, bleed, totalWidth, bleed);
  pdf.line(bleed + contentWidth, 0, bleed + contentWidth, markLength);
  
  // Bottom-left corner
  pdf.line(0, bleed + contentHeight, markLength, bleed + contentHeight);
  pdf.line(bleed, totalHeight - markLength, bleed, totalHeight);
  
  // Bottom-right corner
  pdf.line(totalWidth - markLength, bleed + contentHeight, totalWidth, bleed + contentHeight);
  pdf.line(bleed + contentWidth, totalHeight - markLength, bleed + contentWidth, totalHeight);
}

/**
 * Download PDF directly
 */
export async function downloadCertificatePDF(
  canvas: FabricCanvas,
  options: CertificateExportOptions & { filename: string }
): Promise<void> {
  const blob = await exportCanvasToPDF(canvas, options);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export canvas to PNG image
 */
export function exportCanvasToPNG(
  canvas: FabricCanvas,
  quality: ExportQuality = 'high'
): string {
  const settings = QUALITY_SETTINGS[quality];
  return canvas.toDataURL({
    format: 'png',
    quality: settings.imageQuality,
    multiplier: settings.scale,
  });
}

/**
 * Download PNG directly
 */
export function downloadCertificatePNG(
  canvas: FabricCanvas,
  filename: string,
  quality: ExportQuality = 'high'
): void {
  const dataUrl = exportCanvasToPNG(canvas, quality);
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export HTML element to PDF (fallback method)
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: CertificateExportOptions = {
    format: 'A4',
    orientation: 'landscape',
    quality: 'high',
  }
): Promise<Blob> {
  const quality = QUALITY_SETTINGS[options.quality];
  const format = FORMAT_SIZES[options.format];

  // Capture element as canvas
  const capturedCanvas = await html2canvas(element, {
    scale: quality.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });

  // Get dimensions
  const width = options.orientation === 'landscape' ? format.width : format.height;
  const height = options.orientation === 'landscape' ? format.height : format.width;

  // Create PDF
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: [width, height],
  });

  const imgData = capturedCanvas.toDataURL('image/png', quality.imageQuality);
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);

  return pdf.output('blob');
}

/**
 * Prepare canvas for export by replacing placeholders with actual data
 */
export function prepareCanvasForExport(
  canvas: FabricCanvas,
  data: PlaceholderData
): void {
  const objects = canvas.getObjects();
  
  objects.forEach((obj) => {
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
      const textObj = obj as { text?: string; set: (props: Record<string, unknown>) => void };
      if (textObj.text) {
        const newText = replacePlaceholders(textObj.text, data);
        textObj.set({ text: newText });
      }
    }
  });
  
  canvas.renderAll();
}

/**
 * Replace QR code placeholder images with actual QR codes
 */
export async function replaceQRPlaceholders(
  canvas: FabricCanvas,
  certificateId: string
): Promise<void> {
  const objects = canvas.getObjects();
  const qrCodeUrl = generateQRCodeUrl(certificateId, 300); // 300px for high-res

  for (const obj of objects) {
    // Check if this is a QR placeholder (has special data attribute)
    const customData = (obj as { data?: { isQrPlaceholder?: boolean } }).data;
    if (customData?.isQrPlaceholder && obj.type === 'image') {
      try {
        // Load new QR code image
        const { FabricImage } = await import('fabric');
        const newImg = await FabricImage.fromURL(qrCodeUrl, { crossOrigin: 'anonymous' });
        
        // Copy position and size from placeholder
        newImg.set({
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
        });
        
        // Remove old and add new
        canvas.remove(obj);
        canvas.add(newImg);
      } catch (_error) {
        // QR placeholder replacement failed silently
      }
    }
  }
  
  canvas.renderAll();
}

/**
 * Preview certificate with sample data
 */
export function previewWithSampleData(canvas: FabricCanvas): void {
  const sampleData = getSamplePlaceholderData();
  prepareCanvasForExport(canvas, sampleData);
}

/**
 * Store original placeholder text for restoration
 */
export function storeOriginalText(canvas: FabricCanvas): Map<string, string> {
  const originalText = new Map<string, string>();
  const objects = canvas.getObjects();
  
  objects.forEach((obj, index) => {
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
      const textObj = obj as { text?: string };
      if (textObj.text) {
        originalText.set(`obj_${index}`, textObj.text);
      }
    }
  });
  
  return originalText;
}

/**
 * Restore original placeholder text
 */
export function restoreOriginalText(
  canvas: FabricCanvas,
  originalText: Map<string, string>
): void {
  const objects = canvas.getObjects();
  
  objects.forEach((obj, index) => {
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
      const key = `obj_${index}`;
      const original = originalText.get(key);
      if (original) {
        const textObj = obj as { set: (props: Record<string, unknown>) => void };
        textObj.set({ text: original });
      }
    }
  });
  
  canvas.renderAll();
}

/**
 * Generate certificate with data and download
 */
export async function generateAndDownloadCertificate(
  canvas: FabricCanvas,
  data: PlaceholderData,
  filename: string,
  options?: Partial<CertificateExportOptions>
): Promise<void> {
  // Store original text
  const original = storeOriginalText(canvas);
  
  try {
    // Replace placeholders
    prepareCanvasForExport(canvas, data);
    
    // Replace QR placeholders if certificate_id is provided
    if (data.certificate_id) {
      await replaceQRPlaceholders(canvas, data.certificate_id);
    }
    
    // Download
    await downloadCertificatePDF(canvas, {
      format: 'A4',
      orientation: 'landscape',
      quality: 'high',
      filename,
      ...options,
    });
  } finally {
    // Restore original
    restoreOriginalText(canvas, original);
  }
}

/**
 * Export with advanced options (called from ExportDialog)
 */
export async function exportWithOptions(
  canvas: FabricCanvas,
  options: {
    format: ExportFormat;
    orientation: 'landscape' | 'portrait';
    quality: ExportQuality;
    fileType: 'pdf' | 'png' | 'both';
    includeBleed: boolean;
    bleedMm: number;
    filename: string;
  }
): Promise<void> {
  const exportOptions: CertificateExportOptions = {
    format: options.format,
    orientation: options.orientation,
    quality: options.quality,
    includeBleed: options.includeBleed,
    bleedMm: options.bleedMm,
  };

  if (options.fileType === 'pdf' || options.fileType === 'both') {
    await downloadCertificatePDF(canvas, {
      ...exportOptions,
      filename: `${options.filename}.pdf`,
    });
  }

  if (options.fileType === 'png' || options.fileType === 'both') {
    downloadCertificatePNG(canvas, `${options.filename}.png`, options.quality);
  }
}
