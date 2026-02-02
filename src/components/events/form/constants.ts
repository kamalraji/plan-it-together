/**
 * Event Form Constants and Configuration
 * Extracted from EventFormPage.tsx for better maintainability
 */

// Common timezones list
export const commonTimezones = [
  { value: 'Asia/Kolkata', label: '(UTC+05:30) India Standard Time' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Gulf Standard Time' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore Time' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Japan Standard Time' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) China Standard Time' },
  { value: 'Europe/London', label: '(UTC+00:00) Greenwich Mean Time' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Central European Time' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Central European Time' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time' },
  { value: 'Australia/Sydney', label: '(UTC+11:00) Australian Eastern Time' },
  { value: 'Pacific/Auckland', label: '(UTC+13:00) New Zealand Time' },
];

// Registration types
export const registrationTypes = [
  { value: 'OPEN', label: '🌐 Open Registration', description: 'Anyone can register' },
  { value: 'INVITE_ONLY', label: '🔒 Invite Only', description: 'Only invited users can register' },
  { value: 'APPROVAL_REQUIRED', label: '✋ Approval Required', description: 'Registrations require manual approval' },
];

// Accessibility features
export const accessibilityOptions = [
  { id: 'wheelchair', label: '♿ Wheelchair Accessible' },
  { id: 'sign_language', label: '🤟 Sign Language Interpretation' },
  { id: 'closed_captions', label: '📝 Closed Captioning' },
  { id: 'parking', label: '🅿️ Parking Available' },
  { id: 'public_transport', label: '🚇 Public Transport Access' },
  { id: 'hearing_loop', label: '🔊 Hearing Loop' },
  { id: 'braille', label: '⠿ Braille Materials' },
];

// Category display config
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

// Virtual platforms
export const virtualPlatforms = [
  { value: 'zoom', label: '📹 Zoom' },
  { value: 'teams', label: '💼 Microsoft Teams' },
  { value: 'meet', label: '📞 Google Meet' },
  { value: 'webex', label: '🎥 Webex' },
  { value: 'other', label: '🔗 Other' },
];

// Language options
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
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
];

// Section field mapping for progress tracking
export const sectionFieldMap: Record<string, string[]> = {
  basic: ['name', 'description', 'mode', 'organizationId'],
  schedule: ['startDate', 'endDate', 'timezone'],
  organizer: ['contactEmail'],
  venue: ['venueName', 'venueAddress', 'venueCity'],
  virtual: ['virtualMeetingUrl'],
  branding: ['primaryColor'],
};
