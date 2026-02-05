export interface IndustryTaskTemplate {
  id: string;
  name: string;
  description: string;
  industry: IndustryType;
  eventType: string;
  icon: string;
  color: string;
  estimatedTeamSize: { min: number; max: number };
  eventSizeRange: { min: number; max: number };
  tasks: IndustryTaskItem[];
  metadata: {
    author: string;
    version: string;
    lastUpdated: string;
    usageCount: number;
    rating: number;
  };
}

export interface IndustryTaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  phase: TaskPhase;
  daysFromEvent: number; // Negative = before, positive = after
  estimatedHours: number;
  roleScope?: string;
  tags: string[];
  subtasks: { title: string }[];
  dependsOn?: string[]; // IDs of tasks this depends on
}

export type IndustryType = 
  | 'corporate'
  | 'social'
  | 'educational'
  | 'entertainment'
  | 'sports'
  | 'nonprofit';

export type TaskCategory = 
  | 'PLANNING'
  | 'LOGISTICS'
  | 'MARKETING'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'CONTENT'
  | 'TECHNOLOGY'
  | 'CATERING'
  | 'VENUE'
  | 'REGISTRATION'
  | 'COMMUNICATION'
  | 'SAFETY';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskPhase = 'PRE_EVENT' | 'DURING_EVENT' | 'POST_EVENT';

export const INDUSTRY_CONFIG: Record<IndustryType, { label: string; icon: string; color: string; description: string }> = {
  corporate: {
    label: 'Corporate Events',
    icon: 'Building2',
    color: 'text-info',
    description: 'Conferences, seminars, trade shows, and corporate gatherings',
  },
  social: {
    label: 'Social Events',
    icon: 'PartyPopper',
    color: 'text-pink-500',
    description: 'Weddings, parties, celebrations, and reunions',
  },
  educational: {
    label: 'Educational Events',
    icon: 'GraduationCap',
    color: 'text-primary',
    description: 'Hackathons, workshops, bootcamps, and graduations',
  },
  entertainment: {
    label: 'Entertainment Events',
    icon: 'Music',
    color: 'text-orange-500',
    description: 'Concerts, festivals, exhibitions, and performances',
  },
  sports: {
    label: 'Sports Events',
    icon: 'Trophy',
    color: 'text-success',
    description: 'Tournaments, marathons, competitions, and matches',
  },
  nonprofit: {
    label: 'Non-Profit Events',
    icon: 'Heart',
    color: 'text-destructive',
    description: 'Fundraisers, galas, charity auctions, and community events',
  },
};

export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string }> = {
  PLANNING: { label: 'Planning', color: 'bg-info/20 text-blue-800' },
  LOGISTICS: { label: 'Logistics', color: 'bg-warning/20 text-amber-800' },
  MARKETING: { label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
  OPERATIONS: { label: 'Operations', color: 'bg-success/20 text-success' },
  FINANCE: { label: 'Finance', color: 'bg-emerald-100 text-emerald-800' },
  CONTENT: { label: 'Content', color: 'bg-primary/20 text-indigo-800' },
  TECHNOLOGY: { label: 'Technology', color: 'bg-cyan-100 text-cyan-800' },
  CATERING: { label: 'Catering', color: 'bg-orange-100 text-orange-800' },
  VENUE: { label: 'Venue', color: 'bg-rose-100 text-rose-800' },
  REGISTRATION: { label: 'Registration', color: 'bg-teal-100 text-teal-800' },
  COMMUNICATION: { label: 'Communication', color: 'bg-sky-100 text-sky-800' },
  SAFETY: { label: 'Safety', color: 'bg-destructive/20 text-red-800' },
};

export const PHASE_CONFIG: Record<TaskPhase, { label: string; color: string }> = {
  PRE_EVENT: { label: 'Pre-Event', color: 'bg-info' },
  DURING_EVENT: { label: 'During Event', color: 'bg-success' },
  POST_EVENT: { label: 'Post-Event', color: 'bg-primary' },
};
