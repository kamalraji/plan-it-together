// Certificate Placeholder System
// Handles dynamic text substitution in certificate templates

export interface PlaceholderDefinition {
  key: string;
  label: string;
  category: 'recipient' | 'event' | 'certificate' | 'custom';
  description: string;
  sampleValue: string;
}

export const CERTIFICATE_PLACEHOLDERS: PlaceholderDefinition[] = [
  // Recipient placeholders
  {
    key: '{recipient_name}',
    label: 'Recipient Name',
    category: 'recipient',
    description: 'Full name of the certificate recipient',
    sampleValue: 'John Smith',
  },
  {
    key: '{recipient_email}',
    label: 'Recipient Email',
    category: 'recipient',
    description: 'Email address of the recipient',
    sampleValue: 'john.smith@example.com',
  },
  {
    key: '{recipient_organization}',
    label: 'Recipient Organization',
    category: 'recipient',
    description: 'Organization/company of the recipient',
    sampleValue: 'Acme Corporation',
  },

  // Event placeholders
  {
    key: '{event_name}',
    label: 'Event Name',
    category: 'event',
    description: 'Name of the event',
    sampleValue: 'Tech Conference 2024',
  },
  {
    key: '{event_date}',
    label: 'Event Date',
    category: 'event',
    description: 'Start date of the event (formatted)',
    sampleValue: 'January 15, 2024',
  },
  {
    key: '{event_end_date}',
    label: 'Event End Date',
    category: 'event',
    description: 'End date of the event (formatted)',
    sampleValue: 'January 17, 2024',
  },
  {
    key: '{event_location}',
    label: 'Event Location',
    category: 'event',
    description: 'Location/venue of the event',
    sampleValue: 'San Francisco, CA',
  },

  // Certificate placeholders
  {
    key: '{certificate_id}',
    label: 'Certificate ID',
    category: 'certificate',
    description: 'Unique certificate identifier',
    sampleValue: 'CERT-2024-ABC123',
  },
  {
    key: '{certificate_type}',
    label: 'Certificate Type',
    category: 'certificate',
    description: 'Type of certificate (Completion/Merit/Appreciation)',
    sampleValue: 'Certificate of Completion',
  },
  {
    key: '{issue_date}',
    label: 'Issue Date',
    category: 'certificate',
    description: 'Date when certificate was issued',
    sampleValue: 'January 20, 2024',
  },
  {
    key: '{issuer_name}',
    label: 'Issuer Name',
    category: 'certificate',
    description: 'Name of the issuing organization/workspace',
    sampleValue: 'TechCorp Events',
  },

  // QR Code placeholder
  {
    key: '{qr_code}',
    label: 'QR Code',
    category: 'certificate',
    description: 'QR code for certificate verification',
    sampleValue: 'QR_PLACEHOLDER',
  },
  {
    key: '{verification_url}',
    label: 'Verification URL',
    category: 'certificate',
    description: 'Full URL for certificate verification',
    sampleValue: 'https://verify.example.com/CERT-2024-ABC123',
  },

  // Custom/Score placeholders
  {
    key: '{score}',
    label: 'Score',
    category: 'custom',
    description: 'Participant score (if applicable)',
    sampleValue: '95%',
  },
  {
    key: '{rank}',
    label: 'Rank',
    category: 'custom',
    description: 'Ranking position (if applicable)',
    sampleValue: '1st Place',
  },
  {
    key: '{custom_field_1}',
    label: 'Custom Field 1',
    category: 'custom',
    description: 'Custom data field 1',
    sampleValue: 'Custom Value 1',
  },
  {
    key: '{custom_field_2}',
    label: 'Custom Field 2',
    category: 'custom',
    description: 'Custom data field 2',
    sampleValue: 'Custom Value 2',
  },
];

export interface PlaceholderData {
  recipient_name?: string;
  recipient_email?: string;
  recipient_organization?: string;
  event_name?: string;
  event_date?: string;
  event_end_date?: string;
  event_location?: string;
  certificate_id?: string;
  certificate_type?: string;
  issue_date?: string;
  issuer_name?: string;
  qr_code?: string;
  verification_url?: string;
  score?: string;
  rank?: string;
  custom_field_1?: string;
  custom_field_2?: string;
}

/**
 * Replace placeholders in text with actual data
 */
export function replacePlaceholders(text: string, data: PlaceholderData): string {
  let result = text;

  // Replace each placeholder with its corresponding data value
  result = result.replace(/\{recipient_name\}/g, data.recipient_name || '');
  result = result.replace(/\{recipient_email\}/g, data.recipient_email || '');
  result = result.replace(/\{recipient_organization\}/g, data.recipient_organization || '');
  result = result.replace(/\{event_name\}/g, data.event_name || '');
  result = result.replace(/\{event_date\}/g, data.event_date || '');
  result = result.replace(/\{event_end_date\}/g, data.event_end_date || '');
  result = result.replace(/\{event_location\}/g, data.event_location || '');
  result = result.replace(/\{certificate_id\}/g, data.certificate_id || '');
  result = result.replace(/\{certificate_type\}/g, data.certificate_type || '');
  result = result.replace(/\{issue_date\}/g, data.issue_date || '');
  result = result.replace(/\{issuer_name\}/g, data.issuer_name || '');
  result = result.replace(/\{qr_code\}/g, data.qr_code || '');
  result = result.replace(/\{verification_url\}/g, data.verification_url || '');
  result = result.replace(/\{score\}/g, data.score || '');
  result = result.replace(/\{rank\}/g, data.rank || '');
  result = result.replace(/\{custom_field_1\}/g, data.custom_field_1 || '');
  result = result.replace(/\{custom_field_2\}/g, data.custom_field_2 || '');

  return result;
}

/**
 * Get sample data for preview mode
 */
export function getSamplePlaceholderData(): PlaceholderData {
  return CERTIFICATE_PLACEHOLDERS.reduce((acc, placeholder) => {
    const key = placeholder.key.replace(/[{}]/g, '') as keyof PlaceholderData;
    acc[key] = placeholder.sampleValue;
    return acc;
  }, {} as PlaceholderData);
}

/**
 * Check if text contains any placeholders
 */
export function containsPlaceholders(text: string): boolean {
  return CERTIFICATE_PLACEHOLDERS.some(p => text.includes(p.key));
}

/**
 * Get all placeholders found in text
 */
export function extractPlaceholders(text: string): PlaceholderDefinition[] {
  return CERTIFICATE_PLACEHOLDERS.filter(p => text.includes(p.key));
}

/**
 * Group placeholders by category
 */
export function getPlaceholdersByCategory(): Record<string, PlaceholderDefinition[]> {
  return CERTIFICATE_PLACEHOLDERS.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, PlaceholderDefinition[]>);
}
