import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface ExportRow {
  full_name: string;
  email: string;
  phone?: string;
  ticket_type?: string;
  registration_date: string;
  status: string;
  check_in_time?: string;
  custom_fields?: Record<string, unknown>;
  notes?: string;
  quantity?: number;
  total_amount?: number;
}

export type ExportField = 
  | 'name' 
  | 'email' 
  | 'phone' 
  | 'ticketType' 
  | 'registrationDate' 
  | 'status' 
  | 'checkInTime' 
  | 'customFields' 
  | 'notes'
  | 'quantity'
  | 'totalAmount';

export const fieldLabels: Record<ExportField, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  ticketType: 'Ticket Type',
  registrationDate: 'Registration Date',
  status: 'Status',
  checkInTime: 'Check-in Time',
  customFields: 'Custom Fields',
  notes: 'Notes',
  quantity: 'Quantity',
  totalAmount: 'Total Amount',
};

// Map internal field IDs to data property names
const fieldToDataKey: Record<ExportField, keyof ExportRow> = {
  name: 'full_name',
  email: 'email',
  phone: 'phone',
  ticketType: 'ticket_type',
  registrationDate: 'registration_date',
  status: 'status',
  checkInTime: 'check_in_time',
  customFields: 'custom_fields',
  notes: 'notes',
  quantity: 'quantity',
  totalAmount: 'total_amount',
};

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getFieldValue(row: ExportRow, field: ExportField): string {
  const key = fieldToDataKey[field];
  const value = row[key];
  
  if (value === null || value === undefined) return '';
  
  if (field === 'customFields' && typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (field === 'totalAmount' && typeof value === 'number') {
    return `$${value.toFixed(2)}`;
  }
  
  return String(value);
}

export function generateCSV(data: ExportRow[], fields: ExportField[]): Blob {
  const headers = fields.map(f => fieldLabels[f]).join(',');
  const rows = data.map(row => 
    fields.map(f => escapeCSV(getFieldValue(row, f))).join(',')
  );
  const csvContent = headers + '\n' + rows.join('\n');
  return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

export function generateExcel(data: ExportRow[], fields: ExportField[]): Blob {
  // Generate tab-separated values with .xlsx extension (Excel compatible)
  const headers = fields.map(f => fieldLabels[f]).join('\t');
  const rows = data.map(row => 
    fields.map(f => getFieldValue(row, f)).join('\t')
  );
  const content = headers + '\n' + rows.join('\n');
  return new Blob(['\ufeff' + content], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

export function generatePDF(
  data: ExportRow[], 
  fields: ExportField[],
  eventName?: string
): Blob {
  const pdf = new jsPDF({ 
    orientation: data.length > 50 || fields.length > 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  pdf.setFontSize(16);
  pdf.text(eventName || 'Attendee Export', 14, 15);
  
  // Add metadata
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 22);
  pdf.text(`Total Records: ${data.length}`, 14, 27);
  
  // Generate table
  const headers = [fields.map(f => fieldLabels[f])];
  const body = data.map(row => 
    fields.map(f => getFieldValue(row, f))
  );
  
  autoTable(pdf, {
    head: headers,
    body: body,
    startY: 32,
    styles: { 
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: { 
      fillColor: [79, 70, 229], // Purple color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 32 },
    didDrawPage: (data) => {
      // Add page number footer
      const pageCount = pdf.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pdf.internal.pageSize.width / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });
  
  return pdf.output('blob');
}

export function generateJSON(data: ExportRow[], fields: ExportField[]): Blob {
  const filtered = data.map(row => {
    const obj: Record<string, unknown> = {};
    fields.forEach(f => {
      obj[fieldLabels[f]] = getFieldValue(row, f) || null;
    });
    return obj;
  });
  
  const jsonContent = JSON.stringify({
    exportedAt: new Date().toISOString(),
    recordCount: data.length,
    fields: fields.map(f => fieldLabels[f]),
    data: filtered,
  }, null, 2);
  
  return new Blob([jsonContent], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(
  eventName: string, 
  exportFormat: string, 
  statusFilter?: string,
  ticketFilter?: string
): string {
  const datePart = new Date().toISOString().split('T')[0];
  let name = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
  
  if (statusFilter && statusFilter !== 'all') {
    name += `_${statusFilter}`;
  }
  if (ticketFilter && ticketFilter !== 'all') {
    name += `_${ticketFilter}`;
  }
  
  return `${name}_${datePart}.${exportFormat}`;
}
