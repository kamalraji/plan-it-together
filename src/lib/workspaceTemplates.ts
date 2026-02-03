import { 
  Squares2X2Icon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  GlobeAltIcon,
  HeartIcon,
  MusicalNoteIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

// Department IDs matching the hierarchy system
export type DepartmentId = 
  | 'operations' 
  | 'growth' 
  | 'content' 
  | 'tech_finance' 
  | 'volunteers';

// Committee IDs for each department
export type CommitteeId = 
  | 'event' 
  | 'catering' 
  | 'logistics' 
  | 'facility'
  | 'marketing' 
  | 'sponsorship' 
  | 'registration'
  | 'content' 
  | 'speaker_liaison' 
  | 'media'
  | 'technical' 
  | 'finance'
  | 'volunteers' 
  | 'social_media'
  | 'judge';

export interface DepartmentConfig {
  id: DepartmentId;
  name: string;
  description: string;
  committees: CommitteeId[];
}

export interface RoleConfig {
  role: string;
  count: number;
  level: 'MANAGER' | 'LEAD' | 'COORDINATOR' | 'MEMBER';
  description?: string;
}

export interface TaskConfig {
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category?: string;
  estimatedHours?: number;
  targetLevel?: 'ROOT' | 'DEPARTMENT' | 'COMMITTEE' | 'TEAM';
}

export interface MilestoneConfig {
  name: string;
  description: string;
  daysFromEventStart: number; // negative = before event, positive = after
}

export interface WorkspaceTemplateStructure {
  departments: DepartmentConfig[];
  roles: RoleConfig[];
  tasks: TaskConfig[];
  milestones: MilestoneConfig[];
  budgetCategories: string[];
}

export interface EnhancedWorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  category: 'social' | 'business' | 'education' | 'competition' | 'celebration' | 'entertainment';
  eventSizeRange: { min: number; max: number };
  suggestedTeamSize: { min: number; max: number };
  structure: WorkspaceTemplateStructure;
}

// Department definitions with their committees
export const DEPARTMENT_DEFINITIONS: Record<DepartmentId, Omit<DepartmentConfig, 'committees'>> = {
  operations: {
    id: 'operations',
    name: 'Operations',
    description: 'Core event execution, logistics, and venue management',
  },
  growth: {
    id: 'growth',
    name: 'Growth & Outreach',
    description: 'Marketing, sponsorship, and attendee acquisition',
  },
  content: {
    id: 'content',
    name: 'Content & Experience',
    description: 'Program content, speakers, and attendee experience',
  },
  tech_finance: {
    id: 'tech_finance',
    name: 'Tech & Finance',
    description: 'Technical infrastructure and financial management',
  },
  volunteers: {
    id: 'volunteers',
    name: 'Volunteer Corps',
    description: 'Volunteer recruitment, training, and coordination',
  },
};

// Committee definitions
export const COMMITTEE_DEFINITIONS: Record<CommitteeId, { name: string; description: string; department: DepartmentId }> = {
  event: { name: 'Event Coordination', description: 'Overall event flow and timeline', department: 'operations' },
  catering: { name: 'Catering', description: 'Food, beverages, and dietary management', department: 'operations' },
  logistics: { name: 'Logistics', description: 'Transportation, equipment, and materials', department: 'operations' },
  facility: { name: 'Facility Management', description: 'Venue setup, safety, and maintenance', department: 'operations' },
  marketing: { name: 'Marketing', description: 'Promotion, branding, and communications', department: 'growth' },
  sponsorship: { name: 'Sponsorship', description: 'Sponsor acquisition and management', department: 'growth' },
  registration: { name: 'Registration', description: 'Attendee registration and check-in', department: 'growth' },
  content: { name: 'Content', description: 'Session planning and materials', department: 'content' },
  speaker_liaison: { name: 'Speaker Liaison', description: 'Speaker coordination and support', department: 'content' },
  media: { name: 'Media & Production', description: 'Photography, videography, and live production', department: 'content' },
  technical: { name: 'Technical/IT', description: 'AV, streaming, and tech support', department: 'tech_finance' },
  finance: { name: 'Finance', description: 'Budget tracking and payments', department: 'tech_finance' },
  volunteers: { name: 'Volunteer Coordination', description: 'Volunteer scheduling and management', department: 'volunteers' },
  social_media: { name: 'Social Media', description: 'Real-time social coverage', department: 'growth' },
  judge: { name: 'Judging', description: 'Judge coordination and scoring', department: 'content' },
};

// ============================================================================
// WORKSPACE TEMPLATES
// ============================================================================

export const ENHANCED_WORKSPACE_TEMPLATES: EnhancedWorkspaceTemplate[] = [
  // -------------------------------------------------------------------------
  // BLANK TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'blank',
    name: 'Blank Workspace',
    description: 'Start from scratch with a clean slate',
    icon: Squares2X2Icon,
    complexity: 'SIMPLE',
    category: 'social',
    eventSizeRange: { min: 1, max: 10000 },
    suggestedTeamSize: { min: 1, max: 100 },
    structure: {
      departments: [],
      roles: [],
      tasks: [],
      milestones: [],
      budgetCategories: [],
    },
  },

  // -------------------------------------------------------------------------
  // SIMPLE TEMPLATES (1-2 departments)
  // -------------------------------------------------------------------------
  {
    id: 'networking-mixer',
    name: 'Networking Mixer',
    description: 'Casual professional meetups and networking events',
    icon: UsersIcon,
    complexity: 'SIMPLE',
    category: 'social',
    eventSizeRange: { min: 20, max: 150 },
    suggestedTeamSize: { min: 3, max: 8 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Core event execution', committees: ['event', 'logistics'] },
        { id: 'growth', name: 'Growth', description: 'Marketing and outreach', committees: ['marketing', 'social_media'] },
      ],
      roles: [
        { role: 'EVENT_LEAD', count: 1, level: 'MANAGER' },
        { role: 'VENUE_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'MARKETING_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Secure venue and confirm capacity', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Create event landing page', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Order refreshments and snacks', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare name tags and registration', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create icebreaker activities', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Post event on social media', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Venue Confirmed', description: 'Venue booked and contract signed', daysFromEventStart: -30 },
        { name: 'Registration Opens', description: 'Attendee registration goes live', daysFromEventStart: -21 },
        { name: 'Event Day', description: 'Mixer takes place', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Refreshments', 'Marketing', 'Supplies'],
    },
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'New product or service unveiling event',
    icon: RocketLaunchIcon,
    complexity: 'SIMPLE',
    category: 'business',
    eventSizeRange: { min: 50, max: 300 },
    suggestedTeamSize: { min: 5, max: 15 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Event execution', committees: ['event', 'logistics', 'facility'] },
        { id: 'content', name: 'Content', description: 'Presentation and demos', committees: ['content', 'media'] },
        { id: 'growth', name: 'Growth', description: 'PR and marketing', committees: ['marketing', 'social_media'] },
      ],
      roles: [
        { role: 'EVENT_LEAD', count: 1, level: 'MANAGER' },
        { role: 'CONTENT_LEAD', count: 1, level: 'LEAD' },
        { role: 'MARKETING_LEAD', count: 1, level: 'LEAD' },
        { role: 'DEMO_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'MEDIA_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Finalize product demo script', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Set up demo stations', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare press kit and materials', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Invite media and influencers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create launch video', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate product giveaways', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup live streaming', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Demo Ready', description: 'Product demos tested and ready', daysFromEventStart: -7 },
        { name: 'Media Outreach Complete', description: 'All invites sent', daysFromEventStart: -14 },
        { name: 'Launch Day', description: 'Product officially launches', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Production', 'Marketing', 'Giveaways', 'Media'],
    },
  },
  {
    id: 'community-meetup',
    name: 'Community Meetup',
    description: 'Local community gatherings and interest groups',
    icon: HeartIcon,
    complexity: 'SIMPLE',
    category: 'social',
    eventSizeRange: { min: 10, max: 100 },
    suggestedTeamSize: { min: 2, max: 5 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Event logistics', committees: ['event', 'logistics'] },
        { id: 'volunteers', name: 'Volunteers', description: 'Community helpers', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'COMMUNITY_LEAD', count: 1, level: 'MANAGER' },
        { role: 'VOLUNTEER_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Book community space', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Create Eventbrite or meetup page', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit volunteers', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare refreshments', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Send reminder to attendees', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Venue Secured', description: 'Location confirmed', daysFromEventStart: -14 },
        { name: 'Meetup Day', description: 'Community gathers', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Refreshments', 'Supplies'],
    },
  },

  // -------------------------------------------------------------------------
  // MODERATE TEMPLATES (3-4 departments)
  // -------------------------------------------------------------------------
  {
    id: 'trade-show',
    name: 'Trade Show / Exhibition',
    description: 'Multi-booth exhibitions with exhibitors and attendees',
    icon: BuildingOfficeIcon,
    complexity: 'MODERATE',
    category: 'business',
    eventSizeRange: { min: 200, max: 2000 },
    suggestedTeamSize: { min: 15, max: 40 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'facility', 'logistics'] },
        { id: 'growth', name: 'Growth', description: 'Exhibitors and sponsors', committees: ['sponsorship', 'registration', 'marketing'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Payments and tech', committees: ['technical', 'finance'] },
      ],
      roles: [
        { role: 'SHOW_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'OPERATIONS_MANAGER', count: 1, level: 'MANAGER' },
        { role: 'EXHIBITOR_MANAGER', count: 1, level: 'LEAD' },
        { role: 'REGISTRATION_LEAD', count: 1, level: 'LEAD' },
        { role: 'FLOOR_COORDINATOR', count: 3, level: 'COORDINATOR' },
        { role: 'BOOTH_SUPPORT', count: 5, level: 'MEMBER' },
      ],
      tasks: [
        { title: 'Create floor plan and booth assignments', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Recruit exhibitors and sponsors', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup exhibitor portal', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange booth equipment rentals', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create attendee registration system', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate loading dock schedule', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan networking sessions', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Floor Plan Finalized', description: 'Booth layout approved', daysFromEventStart: -60 },
        { name: 'Exhibitor Registration Closes', description: 'Final exhibitor list', daysFromEventStart: -30 },
        { name: 'Setup Day', description: 'Exhibitors set up booths', daysFromEventStart: -1 },
        { name: 'Show Opens', description: 'Doors open to attendees', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Equipment', 'Marketing', 'Signage', 'Staff', 'Catering'],
    },
  },
  {
    id: 'corporate-summit',
    name: 'Corporate Summit',
    description: 'Executive meetings and enterprise conferences',
    icon: BuildingOfficeIcon,
    complexity: 'MODERATE',
    category: 'business',
    eventSizeRange: { min: 100, max: 500 },
    suggestedTeamSize: { min: 10, max: 25 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'VIP handling and venue', committees: ['event', 'catering', 'facility'] },
        { id: 'content', name: 'Content', description: 'Speakers and sessions', committees: ['content', 'speaker_liaison'] },
        { id: 'growth', name: 'Growth', description: 'Registration and marketing', committees: ['registration', 'marketing'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'AV and budgets', committees: ['technical', 'finance'] },
      ],
      roles: [
        { role: 'SUMMIT_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'OPERATIONS_LEAD', count: 1, level: 'LEAD' },
        { role: 'CONTENT_LEAD', count: 1, level: 'LEAD' },
        { role: 'VIP_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'SPEAKER_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'REGISTRATION_COORDINATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Develop summit agenda and tracks', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Confirm executive speakers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange VIP transportation', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create branded materials', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup executive networking dinner', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare presentation templates', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Speakers Confirmed', description: 'All keynotes locked in', daysFromEventStart: -45 },
        { name: 'Agenda Published', description: 'Full schedule released', daysFromEventStart: -21 },
        { name: 'Summit Day 1', description: 'Event begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Catering', 'Speaker Fees', 'Travel', 'Production', 'Marketing'],
    },
  },
  {
    id: 'charity-gala',
    name: 'Charity Gala',
    description: 'Fundraising events with auctions and entertainment',
    icon: SparklesIcon,
    complexity: 'MODERATE',
    category: 'celebration',
    eventSizeRange: { min: 100, max: 500 },
    suggestedTeamSize: { min: 10, max: 30 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and catering', committees: ['event', 'catering', 'facility'] },
        { id: 'growth', name: 'Growth', description: 'Sponsors and donors', committees: ['sponsorship', 'marketing', 'social_media'] },
        { id: 'tech_finance', name: 'Finance', description: 'Donations and tracking', committees: ['finance'] },
      ],
      roles: [
        { role: 'GALA_CHAIR', count: 1, level: 'MANAGER' },
        { role: 'FUNDRAISING_LEAD', count: 1, level: 'LEAD' },
        { role: 'AUCTION_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'SPONSOR_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'ENTERTAINMENT_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define fundraising goals', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Secure auction items', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit table sponsors', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Book entertainment', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create donation tracking system', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Design gala invitations', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan recognition ceremony', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Sponsorship Goal Met', description: 'Target sponsors secured', daysFromEventStart: -45 },
        { name: 'Auction Items Complete', description: 'All items catalogued', daysFromEventStart: -14 },
        { name: 'Gala Night', description: 'Event takes place', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Catering', 'Entertainment', 'Decor', 'Marketing', 'Printing'],
    },
  },
  {
    id: 'awards-ceremony',
    name: 'Awards Ceremony',
    description: 'Recognition events celebrating achievements',
    icon: TrophyIcon,
    complexity: 'MODERATE',
    category: 'celebration',
    eventSizeRange: { min: 100, max: 1000 },
    suggestedTeamSize: { min: 8, max: 20 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Ceremony logistics', committees: ['event', 'facility', 'logistics'] },
        { id: 'content', name: 'Content', description: 'Program and production', committees: ['content', 'media'] },
        { id: 'growth', name: 'Growth', description: 'Nominees and promotion', committees: ['marketing', 'registration'] },
      ],
      roles: [
        { role: 'CEREMONY_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'PRODUCTION_LEAD', count: 1, level: 'LEAD' },
        { role: 'NOMINATIONS_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'STAGE_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'MEDIA_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define award categories and criteria', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Open nominations process', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create ceremony script and run of show', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Order trophies and awards', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate red carpet arrivals', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare winner packages', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup photo backdrop', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Nominations Close', description: 'All nominations received', daysFromEventStart: -30 },
        { name: 'Winners Selected', description: 'Judging complete', daysFromEventStart: -14 },
        { name: 'Awards Night', description: 'Ceremony takes place', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Production', 'Awards', 'Catering', 'Photography', 'Marketing'],
    },
  },
  {
    id: 'bootcamp',
    name: 'Bootcamp / Training',
    description: 'Intensive learning programs and skill workshops',
    icon: AcademicCapIcon,
    complexity: 'MODERATE',
    category: 'education',
    eventSizeRange: { min: 20, max: 200 },
    suggestedTeamSize: { min: 5, max: 15 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'logistics'] },
        { id: 'content', name: 'Content', description: 'Curriculum and instructors', committees: ['content', 'speaker_liaison'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Tools and payments', committees: ['technical', 'registration'] },
      ],
      roles: [
        { role: 'BOOTCAMP_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'CURRICULUM_LEAD', count: 1, level: 'LEAD' },
        { role: 'INSTRUCTOR_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'TECH_SUPPORT', count: 2, level: 'MEMBER' },
      ],
      tasks: [
        { title: 'Develop curriculum and learning objectives', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Recruit and onboard instructors', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create hands-on exercises', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup development environments', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare participant workbooks', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create assessment rubrics', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan graduation ceremony', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Curriculum Finalized', description: 'All modules ready', daysFromEventStart: -21 },
        { name: 'Materials Prepared', description: 'Workbooks printed', daysFromEventStart: -7 },
        { name: 'Bootcamp Starts', description: 'Day 1 of training', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Instructors', 'Materials', 'Equipment', 'Catering', 'Certificates'],
    },
  },

  // -------------------------------------------------------------------------
  // COMPLEX TEMPLATES (4-5 departments)
  // -------------------------------------------------------------------------
  {
    id: 'hybrid-summit',
    name: 'Hybrid Virtual Summit',
    description: 'Combined in-person and virtual event with global reach',
    icon: GlobeAltIcon,
    complexity: 'COMPLEX',
    category: 'business',
    eventSizeRange: { min: 500, max: 10000 },
    suggestedTeamSize: { min: 25, max: 60 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and hybrid logistics', committees: ['event', 'facility', 'logistics', 'catering'] },
        { id: 'content', name: 'Content', description: 'Programming and speakers', committees: ['content', 'speaker_liaison', 'media'] },
        { id: 'growth', name: 'Growth', description: 'Marketing and registration', committees: ['marketing', 'registration', 'sponsorship', 'social_media'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Streaming and payments', committees: ['technical', 'finance'] },
        { id: 'volunteers', name: 'Volunteers', description: 'On-site and virtual support', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'SUMMIT_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'OPERATIONS_MANAGER', count: 1, level: 'MANAGER' },
        { role: 'VIRTUAL_EXPERIENCE_LEAD', count: 1, level: 'LEAD' },
        { role: 'CONTENT_LEAD', count: 1, level: 'LEAD' },
        { role: 'MARKETING_LEAD', count: 1, level: 'LEAD' },
        { role: 'TECH_LEAD', count: 1, level: 'LEAD' },
        { role: 'SPEAKER_COORDINATOR', count: 3, level: 'COORDINATOR' },
        { role: 'STREAM_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'MODERATOR', count: 4, level: 'MEMBER' },
      ],
      tasks: [
        { title: 'Select hybrid event platform', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Design multi-track agenda', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Setup streaming infrastructure', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create virtual networking spaces', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit global speakers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate timezone coverage', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare on-demand content', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup virtual sponsor booths', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Train virtual moderators', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Platform Configured', description: 'Virtual platform ready', daysFromEventStart: -30 },
        { name: 'Speakers Confirmed', description: 'Full lineup locked', daysFromEventStart: -45 },
        { name: 'Tech Rehearsal', description: 'Full run-through complete', daysFromEventStart: -3 },
        { name: 'Summit Day 1', description: 'Event goes live', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Platform', 'Production', 'Speakers', 'Marketing', 'Staff', 'Catering'],
    },
  },
  {
    id: 'wedding',
    name: 'Wedding / Social Celebration',
    description: 'Personal celebrations with vendor coordination',
    icon: HeartIcon,
    complexity: 'COMPLEX',
    category: 'celebration',
    eventSizeRange: { min: 50, max: 500 },
    suggestedTeamSize: { min: 8, max: 20 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and vendors', committees: ['event', 'catering', 'facility', 'logistics'] },
        { id: 'content', name: 'Experience', description: 'Ceremony and reception', committees: ['content', 'media'] },
        { id: 'growth', name: 'Guest Management', description: 'Invitations and RSVPs', committees: ['registration'] },
        { id: 'volunteers', name: 'Day-of Support', description: 'Helpers and coordinators', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'WEDDING_PLANNER', count: 1, level: 'MANAGER' },
        { role: 'DAY_OF_COORDINATOR', count: 2, level: 'LEAD' },
        { role: 'VENDOR_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'GUEST_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'DECOR_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Create wedding timeline', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Book venue and vendors', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Manage guest list and RSVPs', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate seating chart', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan ceremony flow', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Finalize menu and dietary needs', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate photography/videography', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan transportation for wedding party', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Venue Booked', description: 'Location secured', daysFromEventStart: -180 },
        { name: 'Invitations Sent', description: 'All guests invited', daysFromEventStart: -60 },
        { name: 'RSVP Deadline', description: 'Final headcount', daysFromEventStart: -30 },
        { name: 'Wedding Day', description: 'The big day', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Catering', 'Photography', 'Flowers', 'Music', 'Attire', 'Decor', 'Transportation'],
    },
  },
  {
    id: 'multi-day-festival',
    name: 'Multi-Day Festival',
    description: 'Large-scale entertainment festivals with multiple stages',
    icon: MusicalNoteIcon,
    complexity: 'COMPLEX',
    category: 'entertainment',
    eventSizeRange: { min: 1000, max: 50000 },
    suggestedTeamSize: { min: 50, max: 200 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Site and logistics', committees: ['event', 'facility', 'logistics', 'catering'] },
        { id: 'content', name: 'Programming', description: 'Artists and stages', committees: ['content', 'speaker_liaison', 'media'] },
        { id: 'growth', name: 'Growth', description: 'Tickets and sponsors', committees: ['marketing', 'registration', 'sponsorship', 'social_media'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Production and budgets', committees: ['technical', 'finance'] },
        { id: 'volunteers', name: 'Festival Crew', description: 'Staff and volunteers', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'FESTIVAL_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'OPERATIONS_MANAGER', count: 2, level: 'MANAGER' },
        { role: 'PROGRAMMING_LEAD', count: 1, level: 'LEAD' },
        { role: 'PRODUCTION_LEAD', count: 1, level: 'LEAD' },
        { role: 'MARKETING_LEAD', count: 1, level: 'LEAD' },
        { role: 'STAGE_MANAGER', count: 4, level: 'COORDINATOR' },
        { role: 'ARTIST_LIAISON', count: 3, level: 'COORDINATOR' },
        { role: 'SECURITY_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'VOLUNTEER_MANAGER', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Secure festival grounds', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Book headline artists', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Design stage layouts', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create festival schedule', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate vendor village', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan crowd management', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup camping areas', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit 200+ volunteers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange artist hospitality', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Lineup Announced', description: 'Artists revealed', daysFromEventStart: -90 },
        { name: 'Tickets On Sale', description: 'Public sales begin', daysFromEventStart: -120 },
        { name: 'Site Build Begins', description: 'Construction starts', daysFromEventStart: -7 },
        { name: 'Gates Open', description: 'Festival begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Artists', 'Production', 'Security', 'Marketing', 'Staff', 'Catering', 'Insurance'],
    },
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch Competition',
    description: 'Investment and demo day events for startups',
    icon: RocketLaunchIcon,
    complexity: 'COMPLEX',
    category: 'competition',
    eventSizeRange: { min: 100, max: 1000 },
    suggestedTeamSize: { min: 15, max: 35 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'logistics', 'facility'] },
        { id: 'content', name: 'Competition', description: 'Judging and demos', committees: ['content', 'judge', 'speaker_liaison'] },
        { id: 'growth', name: 'Growth', description: 'Startups and investors', committees: ['marketing', 'registration', 'sponsorship'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Demo setup and prizes', committees: ['technical', 'finance'] },
      ],
      roles: [
        { role: 'COMPETITION_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'JUDGING_LEAD', count: 1, level: 'LEAD' },
        { role: 'STARTUP_LIAISON', count: 2, level: 'COORDINATOR' },
        { role: 'INVESTOR_COORDINATOR', count: 1, level: 'COORDINATOR' },
        { role: 'DEMO_TECH_LEAD', count: 1, level: 'COORDINATOR' },
        { role: 'MENTOR_COORDINATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define competition criteria and prizes', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Recruit judges and mentors', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Open startup applications', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create judging rubrics', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup demo stations and tech', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Invite investor audience', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan pitch training sessions', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate networking lunch', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Applications Open', description: 'Startups can apply', daysFromEventStart: -60 },
        { name: 'Finalists Selected', description: 'Top startups chosen', daysFromEventStart: -21 },
        { name: 'Pitch Day', description: 'Competition takes place', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Prizes', 'Judges', 'Marketing', 'Catering', 'Production'],
    },
  },
  {
    id: 'tech-conference',
    name: 'Tech Conference',
    description: 'Multi-track technology conference with workshops',
    icon: ClipboardDocumentListIcon,
    complexity: 'COMPLEX',
    category: 'education',
    eventSizeRange: { min: 300, max: 5000 },
    suggestedTeamSize: { min: 20, max: 50 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'facility', 'logistics', 'catering'] },
        { id: 'content', name: 'Content', description: 'Speakers and sessions', committees: ['content', 'speaker_liaison', 'media'] },
        { id: 'growth', name: 'Growth', description: 'Marketing and sponsors', committees: ['marketing', 'registration', 'sponsorship', 'social_media'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'AV and budgets', committees: ['technical', 'finance'] },
        { id: 'volunteers', name: 'Volunteers', description: 'Event support', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'CONFERENCE_CHAIR', count: 1, level: 'MANAGER' },
        { role: 'PROGRAM_CHAIR', count: 1, level: 'MANAGER' },
        { role: 'OPERATIONS_LEAD', count: 1, level: 'LEAD' },
        { role: 'SPEAKER_LEAD', count: 1, level: 'LEAD' },
        { role: 'MARKETING_LEAD', count: 1, level: 'LEAD' },
        { role: 'TRACK_COORDINATOR', count: 4, level: 'COORDINATOR' },
        { role: 'WORKSHOP_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'VOLUNTEER_COORDINATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define conference theme and tracks', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Open CFP (Call for Proposals)', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Confirm keynote speakers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Review and select talks', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan workshop sessions', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup conference app', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Coordinate sponsor booths', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare attendee swag bags', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create post-conference survey', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'CFP Opens', description: 'Accepting talk proposals', daysFromEventStart: -120 },
        { name: 'CFP Closes', description: 'Submission deadline', daysFromEventStart: -75 },
        { name: 'Schedule Published', description: 'Full agenda released', daysFromEventStart: -30 },
        { name: 'Conference Day 1', description: 'Event begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Catering', 'Speakers', 'Production', 'Marketing', 'Swag', 'Staff'],
    },
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Competition-style coding event with teams and prizes',
    icon: TrophyIcon,
    complexity: 'COMPLEX',
    category: 'competition',
    eventSizeRange: { min: 100, max: 2000 },
    suggestedTeamSize: { min: 15, max: 40 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'logistics', 'catering'] },
        { id: 'content', name: 'Hacking', description: 'Tracks and judging', committees: ['content', 'judge', 'speaker_liaison'] },
        { id: 'growth', name: 'Growth', description: 'Participants and sponsors', committees: ['marketing', 'registration', 'sponsorship'] },
        { id: 'tech_finance', name: 'Tech & Prizes', description: 'Infrastructure and awards', committees: ['technical', 'finance'] },
        { id: 'volunteers', name: 'Mentors', description: 'Mentors and volunteers', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'HACKATHON_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'TECH_LEAD', count: 1, level: 'LEAD' },
        { role: 'JUDGING_COORDINATOR', count: 1, level: 'LEAD' },
        { role: 'SPONSOR_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'MENTOR_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'HACKER_SUCCESS', count: 3, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define hackathon themes and tracks', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Setup team registration system', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create judging criteria and rubric', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit mentors and judges', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare development environment and APIs', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Organize sponsor booths', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan opening and closing ceremonies', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup submission platform', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange prizes and swag', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Registration Opens', description: 'Hackers can sign up', daysFromEventStart: -45 },
        { name: 'Sponsor Tiers Filled', description: 'All sponsors confirmed', daysFromEventStart: -21 },
        { name: 'Hacking Begins', description: 'Start building', daysFromEventStart: 0 },
        { name: 'Submissions Close', description: 'Final demos', daysFromEventStart: 2 },
      ],
      budgetCategories: ['Venue', 'Prizes', 'Catering', 'Swag', 'APIs', 'Marketing', 'Staff'],
    },
  },
  // -------------------------------------------------------------------------
  // ADDITIONAL TEMPLATES
  // -------------------------------------------------------------------------
  {
    id: 'academic-conference',
    name: 'Academic Conference',
    description: 'Scholarly conferences with paper presentations and peer review',
    icon: AcademicCapIcon,
    complexity: 'COMPLEX',
    category: 'education',
    eventSizeRange: { min: 200, max: 3000 },
    suggestedTeamSize: { min: 15, max: 40 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'facility', 'logistics', 'catering'] },
        { id: 'content', name: 'Academic Program', description: 'Papers and sessions', committees: ['content', 'speaker_liaison', 'judge'] },
        { id: 'growth', name: 'Outreach', description: 'Participants and sponsors', committees: ['marketing', 'registration', 'sponsorship'] },
        { id: 'tech_finance', name: 'Tech & Finance', description: 'Publishing and budgets', committees: ['technical', 'finance'] },
      ],
      roles: [
        { role: 'PROGRAM_CHAIR', count: 1, level: 'MANAGER' },
        { role: 'GENERAL_CHAIR', count: 1, level: 'MANAGER' },
        { role: 'PAPER_TRACK_LEAD', count: 3, level: 'LEAD' },
        { role: 'REVIEWER_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'SESSION_CHAIR', count: 6, level: 'COORDINATOR' },
        { role: 'POSTER_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define conference tracks and themes', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Setup paper submission system', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit program committee reviewers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Manage peer review process', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Send acceptance/rejection notifications', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create conference proceedings', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Organize poster sessions', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan keynote speaker sessions', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange student travel grants', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'CFP Published', description: 'Call for papers goes live', daysFromEventStart: -180 },
        { name: 'Submission Deadline', description: 'Papers due', daysFromEventStart: -90 },
        { name: 'Reviews Complete', description: 'All reviews submitted', daysFromEventStart: -60 },
        { name: 'Camera Ready Due', description: 'Final papers due', daysFromEventStart: -30 },
        { name: 'Conference Day 1', description: 'Event begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Catering', 'Proceedings', 'Keynotes', 'Travel Grants', 'Marketing', 'Staff'],
    },
  },
  {
    id: 'sports-tournament',
    name: 'Sports Tournament',
    description: 'Competitive sports events with teams, brackets, and awards',
    icon: TrophyIcon,
    complexity: 'MODERATE',
    category: 'competition',
    eventSizeRange: { min: 50, max: 2000 },
    suggestedTeamSize: { min: 10, max: 30 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and equipment', committees: ['event', 'facility', 'logistics'] },
        { id: 'content', name: 'Competition', description: 'Brackets and officiating', committees: ['content', 'judge'] },
        { id: 'growth', name: 'Participants', description: 'Teams and sponsors', committees: ['registration', 'sponsorship', 'marketing'] },
        { id: 'volunteers', name: 'Game Day', description: 'Referees and support', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'TOURNAMENT_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'HEAD_REFEREE', count: 1, level: 'LEAD' },
        { role: 'TEAM_COORDINATOR', count: 2, level: 'COORDINATOR' },
        { role: 'FIELD_COORDINATOR', count: 3, level: 'COORDINATOR' },
        { role: 'SCOREKEEPER', count: 4, level: 'MEMBER' },
      ],
      tasks: [
        { title: 'Define tournament format and rules', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Secure playing fields/courts', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create team registration system', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Generate tournament brackets', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit and train referees', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Order trophies and medals', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup live scoring system', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange first aid coverage', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Team Registration Opens', description: 'Teams can sign up', daysFromEventStart: -45 },
        { name: 'Registration Closes', description: 'Final team list', daysFromEventStart: -14 },
        { name: 'Brackets Released', description: 'Match schedule published', daysFromEventStart: -7 },
        { name: 'Tournament Begins', description: 'First games', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Equipment', 'Referees', 'Trophies', 'Insurance', 'Marketing', 'First Aid'],
    },
  },
  {
    id: 'workshop-series',
    name: 'Workshop Series',
    description: 'Multi-session hands-on learning workshops',
    icon: AcademicCapIcon,
    complexity: 'SIMPLE',
    category: 'education',
    eventSizeRange: { min: 10, max: 100 },
    suggestedTeamSize: { min: 3, max: 10 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and materials', committees: ['event', 'logistics'] },
        { id: 'content', name: 'Curriculum', description: 'Workshop content', committees: ['content', 'speaker_liaison'] },
      ],
      roles: [
        { role: 'WORKSHOP_LEAD', count: 1, level: 'MANAGER' },
        { role: 'FACILITATOR', count: 2, level: 'COORDINATOR' },
        { role: 'MATERIALS_COORDINATOR', count: 1, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define workshop curriculum and learning outcomes', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Create hands-on exercises', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare workshop materials and supplies', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup participant registration', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create pre-workshop assignments', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Design completion certificates', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Curriculum Finalized', description: 'All sessions planned', daysFromEventStart: -21 },
        { name: 'Materials Ready', description: 'Supplies prepared', daysFromEventStart: -7 },
        { name: 'First Session', description: 'Workshop begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Materials', 'Facilitators', 'Refreshments', 'Certificates'],
    },
  },
  {
    id: 'webinar-series',
    name: 'Webinar Series',
    description: 'Virtual presentation series with Q&A sessions',
    icon: GlobeAltIcon,
    complexity: 'SIMPLE',
    category: 'education',
    eventSizeRange: { min: 50, max: 5000 },
    suggestedTeamSize: { min: 3, max: 8 },
    structure: {
      departments: [
        { id: 'content', name: 'Content', description: 'Speakers and topics', committees: ['content', 'speaker_liaison'] },
        { id: 'tech_finance', name: 'Tech', description: 'Platform and streaming', committees: ['technical'] },
        { id: 'growth', name: 'Promotion', description: 'Registration and marketing', committees: ['registration', 'marketing', 'social_media'] },
      ],
      roles: [
        { role: 'SERIES_HOST', count: 1, level: 'MANAGER' },
        { role: 'TECH_PRODUCER', count: 1, level: 'COORDINATOR' },
        { role: 'MODERATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define webinar topics and schedule', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Recruit and confirm speakers', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup webinar platform', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create registration landing page', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Prepare Q&A moderation strategy', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan post-webinar follow-up', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Speakers Confirmed', description: 'All presenters locked', daysFromEventStart: -30 },
        { name: 'Registration Opens', description: 'Attendees can sign up', daysFromEventStart: -21 },
        { name: 'First Webinar', description: 'Series begins', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Platform', 'Speaker Fees', 'Marketing', 'Recording'],
    },
  },
  {
    id: 'corporate-retreat',
    name: 'Corporate Retreat',
    description: 'Team-building offsite with activities and workshops',
    icon: BuildingOfficeIcon,
    complexity: 'MODERATE',
    category: 'business',
    eventSizeRange: { min: 20, max: 200 },
    suggestedTeamSize: { min: 5, max: 15 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Venue and logistics', committees: ['event', 'facility', 'catering', 'logistics'] },
        { id: 'content', name: 'Programming', description: 'Activities and sessions', committees: ['content'] },
      ],
      roles: [
        { role: 'RETREAT_COORDINATOR', count: 1, level: 'MANAGER' },
        { role: 'ACTIVITIES_LEAD', count: 1, level: 'LEAD' },
        { role: 'LOGISTICS_COORDINATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define retreat goals and themes', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Book retreat venue and accommodations', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan team-building activities', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Arrange transportation', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Create retreat agenda', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Organize evening social events', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Venue Booked', description: 'Location confirmed', daysFromEventStart: -60 },
        { name: 'Agenda Finalized', description: 'Full schedule ready', daysFromEventStart: -14 },
        { name: 'Retreat Begins', description: 'Offsite starts', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Venue', 'Accommodations', 'Activities', 'Catering', 'Transportation'],
    },
  },
  {
    id: 'fundraising-run',
    name: 'Charity Run / Walk',
    description: 'Fundraising running or walking events for a cause',
    icon: HeartIcon,
    complexity: 'MODERATE',
    category: 'social',
    eventSizeRange: { min: 100, max: 5000 },
    suggestedTeamSize: { min: 10, max: 25 },
    structure: {
      departments: [
        { id: 'operations', name: 'Operations', description: 'Course and logistics', committees: ['event', 'logistics', 'facility'] },
        { id: 'growth', name: 'Fundraising', description: 'Donors and sponsors', committees: ['sponsorship', 'registration', 'marketing', 'social_media'] },
        { id: 'volunteers', name: 'Race Day', description: 'Volunteers and support', committees: ['volunteers'] },
      ],
      roles: [
        { role: 'RACE_DIRECTOR', count: 1, level: 'MANAGER' },
        { role: 'COURSE_MARSHAL', count: 1, level: 'LEAD' },
        { role: 'REGISTRATION_LEAD', count: 1, level: 'COORDINATOR' },
        { role: 'VOLUNTEER_COORDINATOR', count: 2, level: 'COORDINATOR' },
      ],
      tasks: [
        { title: 'Define race course and distances', priority: 'HIGH', status: 'TODO', targetLevel: 'ROOT' },
        { title: 'Obtain permits and insurance', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Setup online fundraising pages', priority: 'HIGH', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Recruit course volunteers', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Order race bibs and timing chips', priority: 'MEDIUM', status: 'TODO', targetLevel: 'COMMITTEE' },
        { title: 'Plan post-race celebration', priority: 'LOW', status: 'TODO', targetLevel: 'COMMITTEE' },
      ],
      milestones: [
        { name: 'Permits Approved', description: 'Course officially approved', daysFromEventStart: -45 },
        { name: 'Registration Opens', description: 'Runners can sign up', daysFromEventStart: -60 },
        { name: 'Race Day', description: 'Event takes place', daysFromEventStart: 0 },
      ],
      budgetCategories: ['Permits', 'Insurance', 'Timing', 'Medals', 'Water Stations', 'Marketing', 'Volunteers'],
    },
  },
];

// Get templates by complexity
export function getTemplatesByComplexity(complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX') {
  return ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === complexity);
}

// Get templates by category
export function getTemplatesByCategory(category: string) {
  return ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.category === category);
}

// Get template by ID
export function getTemplateById(id: string) {
  return ENHANCED_WORKSPACE_TEMPLATES.find(t => t.id === id);
}

// Get all available categories
export function getTemplateCategories() {
  const categories = new Set(ENHANCED_WORKSPACE_TEMPLATES.map(t => t.category));
  return Array.from(categories);
}

// Clone template for customization
export function cloneTemplateForCustomization(template: EnhancedWorkspaceTemplate): EnhancedWorkspaceTemplate {
  return JSON.parse(JSON.stringify(template));
}
