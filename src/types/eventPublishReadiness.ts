/**
 * Types for Event Publish Readiness and Settings Completion Tracking
 */

// Individual setting completion status
export interface SettingCompletionStatus {
  configured: boolean;
  details?: string;
}

// Landing Page completion
export interface LandingPageReadiness extends SettingCompletionStatus {
  hasContent: boolean;
  hasSlug: boolean;
}

// Ticketing/Registration completion
export interface TicketingReadiness extends SettingCompletionStatus {
  registrationType: 'open' | 'approval' | 'invite' | null;
  isFree: boolean;
  hasTicketTiers: boolean;
}

// SEO completion
export interface SEOReadiness extends SettingCompletionStatus {
  hasMetaDescription: boolean;
  hasSlug: boolean;
  hasOgImage: boolean;
}

// Accessibility completion
export interface AccessibilityReadiness extends SettingCompletionStatus {
  hasLanguage: boolean;
  featuresCount: number;
}

// Promo Codes status
export interface PromoCodesReadiness {
  hasActiveCodes: boolean;
  codeCount: number;
}

// Complete Event Space Settings Readiness
export interface EventSettingsReadiness {
  landingPage: LandingPageReadiness;
  ticketing: TicketingReadiness;
  seo: SEOReadiness;
  accessibility: AccessibilityReadiness;
  promoCodes: PromoCodesReadiness;
}

// Workspace configurable publish requirements
export interface PublishRequirements {
  requireLandingPage: boolean;
  requireTicketingConfig: boolean;
  requireSEO: boolean;
  requireAccessibility: boolean;
}

// Default publish requirements
export const DEFAULT_PUBLISH_REQUIREMENTS: PublishRequirements = {
  requireLandingPage: true,
  requireTicketingConfig: true,
  requireSEO: false,
  requireAccessibility: false,
};

// Checklist category for grouping
export type ChecklistCategory = 'basic' | 'event-space';

// Extended checklist item with category and link
export interface EnhancedChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  required: boolean;
  category: ChecklistCategory;
  settingsLink?: string;
  settingsTab?: string;
}

// Enhanced publish checklist with categories
export interface EnhancedPublishChecklist {
  items: EnhancedChecklistItem[];
  categories: {
    basic: EnhancedChecklistItem[];
    eventSpace: EnhancedChecklistItem[];
  };
  settingsReadiness: EventSettingsReadiness;
  canPublish: boolean;
  warningCount: number;
  failCount: number;
  completionPercentage: number;
}
