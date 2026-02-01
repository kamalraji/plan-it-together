import { TaskCategory, TaskPriority } from '../types';

export type TaskPhase = 'PRE_EVENT' | 'DURING_EVENT' | 'POST_EVENT';

export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  category: TaskCategory;
  priority: TaskPriority;
  description: string;
  tags: string[];
  phase?: TaskPhase;
  estimatedHours?: number;
  subtasks?: { title: string }[];
}

export const PHASE_CONFIG: Record<TaskPhase, { label: string; color: string; bgColor: string }> = {
  PRE_EVENT: { 
    label: 'Pre-Event', 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/10 border-blue-500/20' 
  },
  DURING_EVENT: { 
    label: 'During Event', 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bgColor: 'bg-emerald-500/10 border-emerald-500/20' 
  },
  POST_EVENT: { 
    label: 'Post-Event', 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-500/10 border-purple-500/20' 
  },
};

export const PRIORITY_CONFIG_EXTENDED = {
  [TaskPriority.LOW]: { 
    label: 'Low', 
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/20',
    ringColor: 'ring-slate-500/30'
  },
  [TaskPriority.MEDIUM]: { 
    label: 'Medium', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    ringColor: 'ring-blue-500/30'
  },
  [TaskPriority.HIGH]: { 
    label: 'High', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    ringColor: 'ring-amber-500/30'
  },
  [TaskPriority.URGENT]: { 
    label: 'Urgent', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    ringColor: 'ring-red-500/30'
  },
};

// Comprehensive task templates organized by category
export const TASK_TEMPLATES: TaskTemplate[] = [
  // SETUP Category
  {
    id: 'venue-setup',
    name: 'Venue Setup',
    icon: '🏢',
    category: TaskCategory.SETUP,
    priority: TaskPriority.HIGH,
    description: 'Complete venue setup including furniture, signage, and decorations',
    tags: ['venue', 'setup'],
    phase: 'PRE_EVENT',
    estimatedHours: 4,
    subtasks: [
      { title: 'Confirm venue access time' },
      { title: 'Set up tables and chairs' },
      { title: 'Install event signage' },
      { title: 'Test lighting and AC' },
      { title: 'Verify emergency exits' },
    ]
  },
  {
    id: 'stage-setup',
    name: 'Stage & AV Setup',
    icon: '🎤',
    category: TaskCategory.SETUP,
    priority: TaskPriority.HIGH,
    description: 'Configure stage, audio, and visual equipment',
    tags: ['stage', 'av', 'technical'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Set up stage and podium' },
      { title: 'Install microphones and speakers' },
      { title: 'Configure projectors and screens' },
      { title: 'Test audio levels' },
    ]
  },
  {
    id: 'equipment-check',
    name: 'Equipment Check',
    icon: '🔧',
    category: TaskCategory.SETUP,
    priority: TaskPriority.MEDIUM,
    description: 'Verify all equipment is functioning properly',
    tags: ['equipment', 'qa'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },

  // MARKETING Category
  {
    id: 'social-campaign',
    name: 'Social Media Campaign',
    icon: '📱',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.MEDIUM,
    description: 'Plan and execute social media promotional campaign',
    tags: ['social', 'marketing'],
    phase: 'PRE_EVENT',
    estimatedHours: 6,
    subtasks: [
      { title: 'Create content calendar' },
      { title: 'Design graphics for posts' },
      { title: 'Write captions and hashtags' },
      { title: 'Schedule posts across platforms' },
    ]
  },
  {
    id: 'email-announcement',
    name: 'Email Announcement',
    icon: '📧',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.MEDIUM,
    description: 'Draft and send email announcements to subscribers',
    tags: ['email', 'communication'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
    subtasks: [
      { title: 'Write email copy' },
      { title: 'Design email template' },
      { title: 'Test email delivery' },
      { title: 'Schedule send time' },
    ]
  },
  {
    id: 'press-release',
    name: 'Press Release',
    icon: '📰',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.LOW,
    description: 'Draft and distribute press release to media outlets',
    tags: ['pr', 'media'],
    phase: 'PRE_EVENT',
    estimatedHours: 4,
  },
  {
    id: 'influencer-outreach',
    name: 'Influencer Outreach',
    icon: '🌟',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.MEDIUM,
    description: 'Contact and coordinate with influencers for event promotion',
    tags: ['influencer', 'partnership'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
  },

  // LOGISTICS Category
  {
    id: 'transport-coordination',
    name: 'Transport Coordination',
    icon: '🚌',
    category: TaskCategory.LOGISTICS,
    priority: TaskPriority.HIGH,
    description: 'Coordinate transportation for attendees and materials',
    tags: ['transport', 'logistics'],
    phase: 'PRE_EVENT',
    estimatedHours: 4,
    subtasks: [
      { title: 'Confirm vehicle bookings' },
      { title: 'Share pickup schedules' },
      { title: 'Coordinate loading/unloading' },
    ]
  },
  {
    id: 'vendor-management',
    name: 'Vendor Management',
    icon: '🤝',
    category: TaskCategory.LOGISTICS,
    priority: TaskPriority.HIGH,
    description: 'Coordinate with all external vendors',
    tags: ['vendors', 'coordination'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Confirm vendor contracts' },
      { title: 'Share venue access details' },
      { title: 'Coordinate delivery times' },
      { title: 'Prepare vendor parking passes' },
    ]
  },
  {
    id: 'material-inventory',
    name: 'Material Inventory',
    icon: '📦',
    category: TaskCategory.LOGISTICS,
    priority: TaskPriority.MEDIUM,
    description: 'Track and organize all event materials and supplies',
    tags: ['inventory', 'supplies'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },

  // TECHNICAL Category
  {
    id: 'wifi-setup',
    name: 'WiFi Configuration',
    icon: '📶',
    category: TaskCategory.TECHNICAL,
    priority: TaskPriority.HIGH,
    description: 'Set up and test WiFi network for attendees',
    tags: ['wifi', 'network'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
    subtasks: [
      { title: 'Configure network settings' },
      { title: 'Test bandwidth capacity' },
      { title: 'Create guest access credentials' },
      { title: 'Print WiFi cards for tables' },
    ]
  },
  {
    id: 'live-streaming',
    name: 'Live Streaming Setup',
    icon: '🎥',
    category: TaskCategory.TECHNICAL,
    priority: TaskPriority.HIGH,
    description: 'Configure live streaming for virtual attendees',
    tags: ['streaming', 'virtual'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Set up streaming equipment' },
      { title: 'Configure streaming platform' },
      { title: 'Test video and audio quality' },
      { title: 'Create backup stream' },
    ]
  },
  {
    id: 'app-testing',
    name: 'App Testing',
    icon: '📲',
    category: TaskCategory.TECHNICAL,
    priority: TaskPriority.MEDIUM,
    description: 'Test event app functionality before launch',
    tags: ['app', 'testing'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
  },

  // REGISTRATION Category
  {
    id: 'checkin-setup',
    name: 'Check-in Setup',
    icon: '✅',
    category: TaskCategory.REGISTRATION,
    priority: TaskPriority.HIGH,
    description: 'Set up registration and check-in stations',
    tags: ['checkin', 'registration'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
    subtasks: [
      { title: 'Set up check-in desks' },
      { title: 'Configure QR scanners' },
      { title: 'Prepare printed attendee lists' },
      { title: 'Test badge printers' },
    ]
  },
  {
    id: 'badge-printing',
    name: 'Badge Printing',
    icon: '🎫',
    category: TaskCategory.REGISTRATION,
    priority: TaskPriority.MEDIUM,
    description: 'Print and organize attendee badges',
    tags: ['badges', 'printing'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Finalize badge design' },
      { title: 'Print all badges' },
      { title: 'Organize alphabetically' },
      { title: 'Prepare lanyards' },
    ]
  },
  {
    id: 'attendee-database',
    name: 'Attendee Database',
    icon: '📊',
    category: TaskCategory.REGISTRATION,
    priority: TaskPriority.MEDIUM,
    description: 'Prepare and verify attendee database',
    tags: ['database', 'data'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },

  // FINANCE Category
  {
    id: 'budget-review',
    name: 'Budget Review',
    icon: '💰',
    category: TaskCategory.FINANCE,
    priority: TaskPriority.HIGH,
    description: 'Review and finalize event budget',
    tags: ['budget', 'finance'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Review all expenses' },
      { title: 'Verify vendor payments' },
      { title: 'Check remaining budget' },
      { title: 'Prepare financial report' },
    ]
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    icon: '🧾',
    category: TaskCategory.FINANCE,
    priority: TaskPriority.MEDIUM,
    description: 'Process and track all invoices',
    tags: ['invoices', 'payments'],
    phase: 'POST_EVENT',
    estimatedHours: 4,
  },
  {
    id: 'expense-tracking',
    name: 'Expense Tracking',
    icon: '📈',
    category: TaskCategory.FINANCE,
    priority: TaskPriority.MEDIUM,
    description: 'Track and reconcile all expenses',
    tags: ['expenses', 'tracking'],
    phase: 'POST_EVENT',
    estimatedHours: 3,
  },

  // VOLUNTEER Category
  {
    id: 'volunteer-training',
    name: 'Volunteer Training',
    icon: '👥',
    category: TaskCategory.VOLUNTEER,
    priority: TaskPriority.HIGH,
    description: 'Train volunteers on their roles and responsibilities',
    tags: ['training', 'volunteers'],
    phase: 'PRE_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Prepare training materials' },
      { title: 'Conduct orientation session' },
      { title: 'Distribute role assignments' },
      { title: 'Answer Q&A' },
    ]
  },
  {
    id: 'shift-assignment',
    name: 'Shift Assignment',
    icon: '📅',
    category: TaskCategory.VOLUNTEER,
    priority: TaskPriority.MEDIUM,
    description: 'Create and assign volunteer shifts',
    tags: ['shifts', 'scheduling'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },
  {
    id: 'volunteer-briefing',
    name: 'Day-of Briefing',
    icon: '📢',
    category: TaskCategory.VOLUNTEER,
    priority: TaskPriority.HIGH,
    description: 'Brief all volunteers on day-of procedures',
    tags: ['briefing', 'day-of'],
    phase: 'DURING_EVENT',
    estimatedHours: 1,
  },

  // OPERATIONS Category
  {
    id: 'safety-briefing',
    name: 'Safety Briefing',
    icon: '🛡️',
    category: TaskCategory.OPERATIONS,
    priority: TaskPriority.URGENT,
    description: 'Conduct safety and emergency procedures briefing',
    tags: ['safety', 'emergency'],
    phase: 'PRE_EVENT',
    estimatedHours: 1,
    subtasks: [
      { title: 'Review emergency exits' },
      { title: 'Brief security team' },
      { title: 'Test emergency equipment' },
      { title: 'Confirm first aid stations' },
    ]
  },
  {
    id: 'run-of-show',
    name: 'Run of Show',
    icon: '📋',
    category: TaskCategory.OPERATIONS,
    priority: TaskPriority.HIGH,
    description: 'Finalize and distribute run of show document',
    tags: ['schedule', 'timeline'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },
  {
    id: 'crowd-management',
    name: 'Crowd Management',
    icon: '👫',
    category: TaskCategory.OPERATIONS,
    priority: TaskPriority.HIGH,
    description: 'Monitor and manage crowd flow during event',
    tags: ['crowd', 'management'],
    phase: 'DURING_EVENT',
    estimatedHours: 8,
  },

  // CONTENT Category
  {
    id: 'photo-documentation',
    name: 'Photo Documentation',
    icon: '📸',
    category: TaskCategory.CONTENT,
    priority: TaskPriority.MEDIUM,
    description: 'Capture event photos for documentation and marketing',
    tags: ['photos', 'documentation'],
    phase: 'DURING_EVENT',
    estimatedHours: 6,
    subtasks: [
      { title: 'Photograph key moments' },
      { title: 'Capture speaker sessions' },
      { title: 'Get attendee candids' },
      { title: 'Document venue setup' },
    ]
  },
  {
    id: 'video-recording',
    name: 'Video Recording',
    icon: '🎬',
    category: TaskCategory.CONTENT,
    priority: TaskPriority.MEDIUM,
    description: 'Record sessions and highlights',
    tags: ['video', 'recording'],
    phase: 'DURING_EVENT',
    estimatedHours: 8,
  },
  {
    id: 'content-editing',
    name: 'Content Editing',
    icon: '✂️',
    category: TaskCategory.CONTENT,
    priority: TaskPriority.LOW,
    description: 'Edit photos and videos for distribution',
    tags: ['editing', 'post-production'],
    phase: 'POST_EVENT',
    estimatedHours: 8,
  },

  // CATERING Category
  {
    id: 'menu-finalization',
    name: 'Menu Finalization',
    icon: '🍽️',
    category: TaskCategory.CATERING,
    priority: TaskPriority.HIGH,
    description: 'Finalize menu with caterer',
    tags: ['menu', 'catering'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
    subtasks: [
      { title: 'Confirm menu items' },
      { title: 'Finalize dietary options' },
      { title: 'Confirm headcount' },
      { title: 'Arrange tasting if needed' },
    ]
  },
  {
    id: 'dietary-requirements',
    name: 'Dietary Requirements',
    icon: '🥗',
    category: TaskCategory.CATERING,
    priority: TaskPriority.MEDIUM,
    description: 'Collect and organize dietary requirements',
    tags: ['dietary', 'allergies'],
    phase: 'PRE_EVENT',
    estimatedHours: 2,
  },
  {
    id: 'service-coordination',
    name: 'Service Coordination',
    icon: '🍴',
    category: TaskCategory.CATERING,
    priority: TaskPriority.HIGH,
    description: 'Coordinate meal service timing',
    tags: ['service', 'timing'],
    phase: 'DURING_EVENT',
    estimatedHours: 4,
  },

  // POST_EVENT Category
  {
    id: 'feedback-collection',
    name: 'Feedback Collection',
    icon: '📝',
    category: TaskCategory.POST_EVENT,
    priority: TaskPriority.HIGH,
    description: 'Collect attendee feedback and surveys',
    tags: ['feedback', 'survey'],
    phase: 'POST_EVENT',
    estimatedHours: 2,
    subtasks: [
      { title: 'Send feedback survey' },
      { title: 'Follow up with non-responders' },
      { title: 'Compile responses' },
      { title: 'Generate report' },
    ]
  },
  {
    id: 'thank-you-emails',
    name: 'Thank You Emails',
    icon: '💌',
    category: TaskCategory.POST_EVENT,
    priority: TaskPriority.MEDIUM,
    description: 'Send thank you emails to attendees, speakers, and sponsors',
    tags: ['thankyou', 'communication'],
    phase: 'POST_EVENT',
    estimatedHours: 2,
  },
  {
    id: 'event-retrospective',
    name: 'Event Retrospective',
    icon: '🔄',
    category: TaskCategory.POST_EVENT,
    priority: TaskPriority.MEDIUM,
    description: 'Conduct team retrospective and document lessons learned',
    tags: ['retrospective', 'improvement'],
    phase: 'POST_EVENT',
    estimatedHours: 3,
    subtasks: [
      { title: 'Schedule retro meeting' },
      { title: 'Gather team feedback' },
      { title: 'Document what went well' },
      { title: 'Document improvements' },
      { title: 'Create action items' },
    ]
  },
];

// Group templates by category for display
export function getTemplatesByCategory(): Record<TaskCategory, TaskTemplate[]> {
  const grouped = {} as Record<TaskCategory, TaskTemplate[]>;
  
  for (const category of Object.values(TaskCategory)) {
    grouped[category] = TASK_TEMPLATES.filter(t => t.category === category);
  }
  
  return grouped;
}

// Get templates by phase
export function getTemplatesByPhase(phase: TaskPhase): TaskTemplate[] {
  return TASK_TEMPLATES.filter(t => t.phase === phase);
}

// Search templates
export function searchTemplates(query: string): TaskTemplate[] {
  const lowerQuery = query.toLowerCase();
  return TASK_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Get quick templates (most commonly used)
export const QUICK_TEMPLATES = TASK_TEMPLATES.filter(t => 
  ['venue-setup', 'social-campaign', 'volunteer-training', 'checkin-setup', 'safety-briefing'].includes(t.id)
);
