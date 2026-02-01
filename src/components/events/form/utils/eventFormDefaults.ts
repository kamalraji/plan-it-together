/**
 * Event Form Default Values and Constants
 * Centralized configuration for the event form
 */
import { EventFormValues } from '@/lib/event-form-schema';

/**
 * Detect browser timezone with fallback
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};

/**
 * Default form values for creating a new event
 */
export const getDefaultFormValues = (
  organizationId?: string
): EventFormValues => ({
  name: '',
  description: '',
  mode: 'ONLINE',
  visibility: 'PUBLIC',
  category: '',
  organizationId: organizationId || '',
  capacity: '',
  // Registration settings
  registrationType: 'OPEN',
  isFreeEvent: true,
  allowWaitlist: false,
  tags: '',
  // SEO defaults
  metaDescription: '',
  customSlug: '',
  // Accessibility defaults
  accessibilityLanguage: 'en',
  ageRestrictionEnabled: false,
  minAge: null,
  maxAge: null,
  // Schedule
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  timezone: getBrowserTimezone(),
  // Organizer contact
  contactEmail: '',
  contactPhone: '',
  supportUrl: '',
  eventWebsite: '',
  // Venue defaults
  venueName: '',
  venueAddress: '',
  venueCity: '',
  venueState: '',
  venueCountry: '',
  venuePostalCode: '',
  venueCapacity: '',
  accessibilityFeatures: [],
  accessibilityNotes: '',
  // Virtual defaults
  virtualPlatform: '',
  virtualMeetingUrl: '',
  virtualMeetingId: '',
  virtualPassword: '',
  virtualInstructions: '',
  // Branding defaults
  primaryColor: '#2563eb',
  logoUrl: '',
  heroSubtitle: '',
  bannerUrl: '',
  primaryCtaLabel: '',
  secondaryCtaLabel: '',
  canvasState: undefined,
});

/**
 * Initial section open states
 */
export const getInitialSectionState = () => ({
  basic: true,
  schedule: false,
  organizer: false,
  venue: false,
  virtual: false,
  branding: false,
  media: false,
  faqs: false,
  cta: false,
});

/**
 * Section field mappings for progress calculation
 */
export const sectionFieldMap: Record<string, string[]> = {
  basic: ['name', 'description', 'mode', 'organizationId'],
  schedule: ['startDate', 'endDate', 'timezone'],
  organizer: ['contactEmail'],
  venue: ['venueName', 'venueAddress', 'venueCity'],
  virtual: ['virtualMeetingUrl'],
  branding: ['primaryColor'],
};

/**
 * Registration type options
 */
export const registrationTypes = [
  { value: 'OPEN', label: '🌐 Open Registration', description: 'Anyone can register' },
  { value: 'INVITE_ONLY', label: '🔒 Invite Only', description: 'Only invited users can register' },
  { value: 'APPROVAL_REQUIRED', label: '✋ Approval Required', description: 'Registrations require manual approval' },
] as const;

/**
 * Accessibility feature options
 */
export const accessibilityOptions = [
  { id: 'wheelchair', label: '♿ Wheelchair Accessible' },
  { id: 'sign_language', label: '🤟 Sign Language Interpretation' },
  { id: 'closed_captions', label: '📝 Closed Captioning' },
  { id: 'parking', label: '🅿️ Parking Available' },
  { id: 'public_transport', label: '🚇 Public Transport Access' },
  { id: 'hearing_loop', label: '🔊 Hearing Loop' },
  { id: 'braille', label: '⠿ Braille Materials' },
] as const;

/**
 * Virtual platform options
 */
export const virtualPlatforms = [
  { value: 'zoom', label: '📹 Zoom' },
  { value: 'teams', label: '💼 Microsoft Teams' },
  { value: 'meet', label: '📞 Google Meet' },
  { value: 'webex', label: '🎥 Webex' },
  { value: 'other', label: '🔗 Other' },
] as const;

/**
 * Event category labels
 */
export const categoryLabels: Record<string, string> = {
  HACKATHON: '💻 Hackathon',
  BOOTCAMP: '🎓 Bootcamp',
  WORKSHOP: '🔧 Workshop',
  CONFERENCE: '🎤 Conference',
  MEETUP: '👥 Meetup',
  STARTUP_PITCH: '🚀 Startup Pitch',
  HIRING_CHALLENGE: '💼 Hiring Challenge',
  WEBINAR: '🖥️ Webinar',
  COMPETITION: '🏆 Competition',
  SEMINAR: '📚 Seminar',
  SYMPOSIUM: '🎓 Symposium',
  CULTURAL_FEST: '🎭 Cultural Fest',
  SPORTS_EVENT: '⚽ Sports Event',
  ORIENTATION: '🎯 Orientation',
  ALUMNI_MEET: '🤝 Alumni Meet',
  CAREER_FAIR: '💼 Career Fair',
  LECTURE: '📖 Lecture',
  QUIZ: '❓ Quiz',
  DEBATE: '🗣️ Debate',
  PRODUCT_LAUNCH: '🎉 Product Launch',
  TOWN_HALL: '🏛️ Town Hall',
  TEAM_BUILDING: '🏗️ Team Building',
  TRAINING: '📋 Training',
  AWARDS_CEREMONY: '🏅 Awards Ceremony',
  OFFSITE: '✈️ Offsite',
  NETWORKING: '🔗 Networking',
  TRADE_SHOW: '🏪 Trade Show',
  EXPO: '🎪 Expo',
  SUMMIT: '⛰️ Summit',
  PANEL_DISCUSSION: '💬 Panel Discussion',
  DEMO_DAY: '🎬 Demo Day',
  FUNDRAISER: '💰 Fundraiser',
  GALA: '🌟 Gala',
  CHARITY_EVENT: '❤️ Charity Event',
  VOLUNTEER_DRIVE: '🙋 Volunteer Drive',
  AWARENESS_CAMPAIGN: '📢 Awareness Campaign',
  CONCERT: '🎵 Concert',
  EXHIBITION: '🖼️ Exhibition',
  FESTIVAL: '🎊 Festival',
  SOCIAL_GATHERING: '🎈 Social Gathering',
  OTHER: '📌 Other',
};

/**
 * Language options for accessibility
 */
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mr', label: 'Marathi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
] as const;
