import { 
  Utensils, 
  Megaphone, 
  Truck, 
  Building, 
  MessageSquare, 
  Handshake, 
  Share2,
  FileText,
  Mic,
  Scale,
  Camera,
  Wallet,
  ClipboardCheck,
  Monitor,
  Cpu,
  Users,
  Calendar,
} from 'lucide-react';

export interface CommitteeConfig {
  id: string;
  name: string;
  department: string;
  icon: React.ElementType;
  color: string;
  description: string;
  quickActions: { label: string; action: string }[];
  metrics: { label: string; key: string }[];
}

/**
 * Committee-specific configuration
 * Defines unique features, icons, and workflows for each committee type
 */
export const COMMITTEE_CONFIGS: Record<string, CommitteeConfig> = {
  // Operations Department
  event: {
    id: 'event',
    name: 'Event',
    department: 'operations',
    icon: Calendar,
    color: 'blue',
    description: 'Coordinate event schedule and execution',
    quickActions: [
      { label: 'Update Schedule', action: 'update_schedule' },
      { label: 'Brief Teams', action: 'brief_teams' },
    ],
    metrics: [
      { label: 'Schedule Items', key: 'schedule_items' },
      { label: 'VIP Arrivals', key: 'vip_arrivals' },
    ],
  },
  catering: {
    id: 'catering',
    name: 'Catering',
    department: 'operations',
    icon: Utensils,
    color: 'orange',
    description: 'Manage food and beverage services',
    quickActions: [
      { label: 'Update Menu', action: 'update_menu' },
      { label: 'Check Inventory', action: 'check_inventory' },
    ],
    metrics: [
      { label: 'Head Count', key: 'head_count' },
      { label: 'Dietary Requests', key: 'dietary_requests' },
    ],
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics',
    department: 'operations',
    icon: Truck,
    color: 'green',
    description: 'Manage transport and material handling',
    quickActions: [
      { label: 'Track Shipments', action: 'track_shipments' },
      { label: 'Update Layout', action: 'update_layout' },
    ],
    metrics: [
      { label: 'Shipments', key: 'shipments' },
      { label: 'Equipment Ready', key: 'equipment_ready' },
    ],
  },
  facility: {
    id: 'facility',
    name: 'Facility',
    department: 'operations',
    icon: Building,
    color: 'slate',
    description: 'Manage venue and safety compliance',
    quickActions: [
      { label: 'Safety Check', action: 'safety_check' },
      { label: 'Venue Walkthrough', action: 'venue_walkthrough' },
    ],
    metrics: [
      { label: 'Safety Checks', key: 'safety_checks' },
      { label: 'Rooms Ready', key: 'rooms_ready' },
    ],
  },

  // Growth Department
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    department: 'growth',
    icon: Megaphone,
    color: 'pink',
    description: 'Drive event promotion and awareness',
    quickActions: [
      { label: 'Schedule Post', action: 'schedule_post' },
      { label: 'View Analytics', action: 'view_analytics' },
    ],
    metrics: [
      { label: 'Reach', key: 'reach' },
      { label: 'Engagement Rate', key: 'engagement_rate' },
    ],
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    department: 'growth',
    icon: MessageSquare,
    color: 'cyan',
    description: 'Manage stakeholder communications',
    quickActions: [
      { label: 'Send Update', action: 'send_update' },
      { label: 'Draft Press Release', action: 'draft_press' },
    ],
    metrics: [
      { label: 'Emails Sent', key: 'emails_sent' },
      { label: 'Open Rate', key: 'open_rate' },
    ],
  },
  sponsorship: {
    id: 'sponsorship',
    name: 'Sponsorship',
    department: 'growth',
    icon: Handshake,
    color: 'amber',
    description: 'Manage sponsor relationships',
    quickActions: [
      { label: 'Add Sponsor', action: 'add_sponsor' },
      { label: 'Send Proposal', action: 'send_proposal' },
    ],
    metrics: [
      { label: 'Sponsors', key: 'sponsors' },
      { label: 'Revenue', key: 'revenue' },
    ],
  },
  social_media: {
    id: 'social_media',
    name: 'Social Media',
    department: 'growth',
    icon: Share2,
    color: 'indigo',
    description: 'Manage social media presence',
    quickActions: [
      { label: 'Schedule Content', action: 'schedule_content' },
      { label: 'Monitor Hashtags', action: 'monitor_hashtags' },
    ],
    metrics: [
      { label: 'Followers', key: 'followers' },
      { label: 'Impressions', key: 'impressions' },
    ],
  },

  // Content Department
  content: {
    id: 'content',
    name: 'Content',
    department: 'content',
    icon: FileText,
    color: 'purple',
    description: 'Manage session content and materials',
    quickActions: [
      { label: 'Review Content', action: 'review_content' },
      { label: 'Create Template', action: 'create_template' },
    ],
    metrics: [
      { label: 'Sessions', key: 'sessions' },
      { label: 'Materials Ready', key: 'materials_ready' },
    ],
  },
  speaker_liaison: {
    id: 'speaker_liaison',
    name: 'Speaker Liaison',
    department: 'content',
    icon: Mic,
    color: 'rose',
    description: 'Coordinate speaker management',
    quickActions: [
      { label: 'Invite Speaker', action: 'invite_speaker' },
      { label: 'Schedule Rehearsal', action: 'schedule_rehearsal' },
    ],
    metrics: [
      { label: 'Speakers', key: 'speakers' },
      { label: 'Confirmations', key: 'confirmations' },
    ],
  },
  judge: {
    id: 'judge',
    name: 'Judge',
    department: 'content',
    icon: Scale,
    color: 'emerald',
    description: 'Manage judging and evaluation',
    quickActions: [
      { label: 'Assign Judges', action: 'assign_judges' },
      { label: 'Setup Rubrics', action: 'setup_rubrics' },
    ],
    metrics: [
      { label: 'Judges', key: 'judges' },
      { label: 'Submissions', key: 'submissions' },
    ],
  },
  media: {
    id: 'media',
    name: 'Media',
    department: 'content',
    icon: Camera,
    color: 'fuchsia',
    description: 'Manage photography and videography',
    quickActions: [
      { label: 'Upload Media', action: 'upload_media' },
      { label: 'Create Shot List', action: 'create_shot_list' },
    ],
    metrics: [
      { label: 'Photos', key: 'photos' },
      { label: 'Videos', key: 'videos' },
    ],
  },

  // Tech & Finance Department
  finance: {
    id: 'finance',
    name: 'Finance',
    department: 'tech_finance',
    icon: Wallet,
    color: 'yellow',
    description: 'Manage budget and financial operations',
    quickActions: [
      { label: 'Record Expense', action: 'record_expense' },
      { label: 'Generate Report', action: 'generate_report' },
    ],
    metrics: [
      { label: 'Budget Used', key: 'budget_used' },
      { label: 'Pending Approvals', key: 'pending_approvals' },
    ],
  },
  registration: {
    id: 'registration',
    name: 'Registration',
    department: 'tech_finance',
    icon: ClipboardCheck,
    color: 'teal',
    description: 'Manage attendee registrations',
    quickActions: [
      { label: 'Export List', action: 'export_list' },
      { label: 'Send Reminders', action: 'send_reminders' },
    ],
    metrics: [
      { label: 'Registrations', key: 'registrations' },
      { label: 'Check-ins', key: 'checkins' },
    ],
  },
  technical: {
    id: 'technical',
    name: 'Technical',
    department: 'tech_finance',
    icon: Monitor,
    color: 'sky',
    description: 'Manage AV and technical equipment',
    quickActions: [
      { label: 'Test Equipment', action: 'test_equipment' },
      { label: 'Update Runsheet', action: 'update_runsheet' },
    ],
    metrics: [
      { label: 'Equipment', key: 'equipment' },
      { label: 'Issues', key: 'issues' },
    ],
  },
  it: {
    id: 'it',
    name: 'IT',
    department: 'tech_finance',
    icon: Cpu,
    color: 'violet',
    description: 'Manage IT infrastructure and support',
    quickActions: [
      { label: 'Check Systems', action: 'check_systems' },
      { label: 'Update Credentials', action: 'update_credentials' },
    ],
    metrics: [
      { label: 'Systems Up', key: 'systems_up' },
      { label: 'Tickets', key: 'tickets' },
    ],
  },

  // Volunteers Department
  volunteers: {
    id: 'volunteers',
    name: 'Volunteers',
    department: 'volunteers',
    icon: Users,
    color: 'pink',
    description: 'Coordinate volunteer management',
    quickActions: [
      { label: 'Assign Shifts', action: 'assign_shifts' },
      { label: 'Send Brief', action: 'send_brief' },
    ],
    metrics: [
      { label: 'Volunteers', key: 'volunteers' },
      { label: 'Shifts Filled', key: 'shifts_filled' },
    ],
  },
};

/**
 * Get committee configuration from workspace name
 */
export function getCommitteeConfig(workspaceName: string): CommitteeConfig | null {
  const normalizedName = workspaceName
    .toLowerCase()
    .replace(/\s+committee$/i, '')
    .replace(/\s+/g, '_')
    .trim();
  
  return COMMITTEE_CONFIGS[normalizedName] || null;
}

/**
 * Get color classes for committee
 */
export function getCommitteeColors(color: string): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', icon: 'text-blue-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', icon: 'text-orange-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', icon: 'text-green-500' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', icon: 'text-slate-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20', icon: 'text-pink-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', icon: 'text-cyan-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', icon: 'text-amber-500' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', icon: 'text-indigo-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', icon: 'text-purple-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', icon: 'text-rose-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', icon: 'text-emerald-500' },
    fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500/20', icon: 'text-fuchsia-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20', icon: 'text-yellow-500' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20', icon: 'text-teal-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20', icon: 'text-sky-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20', icon: 'text-violet-500' },
  };

  return colorMap[color] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', icon: 'text-muted-foreground' };
}
