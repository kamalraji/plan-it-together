/**
 * Channel Templates and Naming System
 * Industrial-standard channel configuration for events
 */

// Standardized channel prefixes (Slack/Discord-style)
export const CHANNEL_PREFIXES = {
  announcement: 'announce-',
  session: 'session-',
  networking: 'network-',
  help: 'help-',
  booth: 'booth-',
  stage: 'stage-',
  team: 'team-',
  general: '',
} as const;

export type ChannelPrefix = keyof typeof CHANNEL_PREFIXES;

export type ChannelType = 'general' | 'announcement' | 'private' | 'task';
export type TemplateCategory = 'conference' | 'hackathon' | 'workshop' | 'networking' | 'meetup' | 'custom';
export type PermissionPresetId = 'read-only' | 'full-discussion' | 'moderated' | 'team-only';

export interface ChannelPermissions {
  can_read: boolean;
  can_write: boolean;
  can_react: boolean;
  can_thread_reply: boolean;
  can_upload_files: boolean;
  can_mention_all: boolean;
}

export interface ChannelPermissionPreset {
  id: PermissionPresetId;
  name: string;
  description: string;
  permissions: ChannelPermissions;
}

export interface ChannelConfig {
  name: string;
  type: ChannelType;
  autoJoin: boolean;
  participantCanWrite: boolean;
  description: string;
  icon?: string;
  prefix?: ChannelPrefix;
  permissionPreset?: PermissionPresetId;
  sortOrder?: number;
}

export interface ChannelTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  channels: ChannelConfig[];
  isDefault?: boolean;
}

// Permission presets for different channel types
export const PERMISSION_PRESETS: ChannelPermissionPreset[] = [
  {
    id: 'read-only',
    name: 'Announcements Only',
    description: 'Participants can only read messages. Perfect for official announcements.',
    permissions: {
      can_read: true,
      can_write: false,
      can_react: true,
      can_thread_reply: false,
      can_upload_files: false,
      can_mention_all: false,
    },
  },
  {
    id: 'full-discussion',
    name: 'Open Discussion',
    description: 'Participants can fully participate with all features.',
    permissions: {
      can_read: true,
      can_write: true,
      can_react: true,
      can_thread_reply: true,
      can_upload_files: true,
      can_mention_all: false,
    },
  },
  {
    id: 'moderated',
    name: 'Moderated',
    description: 'Participants can post but cannot upload files or mention everyone.',
    permissions: {
      can_read: true,
      can_write: true,
      can_react: true,
      can_thread_reply: true,
      can_upload_files: false,
      can_mention_all: false,
    },
  },
  {
    id: 'team-only',
    name: 'Team Only',
    description: 'Internal team channel with full permissions including @all mentions.',
    permissions: {
      can_read: true,
      can_write: true,
      can_react: true,
      can_thread_reply: true,
      can_upload_files: true,
      can_mention_all: true,
    },
  },
];

// Default channel templates for different event types
export const CHANNEL_TEMPLATES: ChannelTemplate[] = [
  {
    id: 'conference',
    name: 'Conference',
    description: 'Standard conference with announcements, networking, and help channels',
    category: 'conference',
    isDefault: true,
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Official event announcements from organizers',
        icon: 'megaphone',
        prefix: 'announcement',
        permissionPreset: 'read-only',
        sortOrder: 1,
      },
      {
        name: 'general',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Open discussion for all participants',
        icon: 'message-circle',
        permissionPreset: 'full-discussion',
        sortOrder: 2,
      },
      {
        name: 'help-desk',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Get help from event organizers and volunteers',
        icon: 'help-circle',
        prefix: 'help',
        permissionPreset: 'moderated',
        sortOrder: 3,
      },
      {
        name: 'networking',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Connect and network with other participants',
        icon: 'users',
        prefix: 'networking',
        permissionPreset: 'full-discussion',
        sortOrder: 4,
      },
      {
        name: 'job-board',
        type: 'general',
        autoJoin: false,
        participantCanWrite: true,
        description: 'Job opportunities and career discussions',
        icon: 'briefcase',
        permissionPreset: 'moderated',
        sortOrder: 5,
      },
      {
        name: 'feedback',
        type: 'general',
        autoJoin: false,
        participantCanWrite: true,
        description: 'Share your feedback about the event',
        icon: 'message-square',
        permissionPreset: 'moderated',
        sortOrder: 6,
      },
    ],
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Hackathon event with team formation and project channels',
    category: 'hackathon',
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Official hackathon announcements',
        icon: 'megaphone',
        permissionPreset: 'read-only',
        sortOrder: 1,
      },
      {
        name: 'general',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'General hackathon discussion',
        icon: 'message-circle',
        permissionPreset: 'full-discussion',
        sortOrder: 2,
      },
      {
        name: 'team-formation',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Find teammates and form your team',
        icon: 'users-plus',
        permissionPreset: 'full-discussion',
        sortOrder: 3,
      },
      {
        name: 'help-mentors',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Get help from mentors and sponsors',
        icon: 'life-buoy',
        prefix: 'help',
        permissionPreset: 'moderated',
        sortOrder: 4,
      },
      {
        name: 'resources',
        type: 'general',
        autoJoin: true,
        participantCanWrite: false,
        description: 'APIs, tools, and useful resources',
        icon: 'book-open',
        permissionPreset: 'read-only',
        sortOrder: 5,
      },
      {
        name: 'showcase',
        type: 'general',
        autoJoin: false,
        participantCanWrite: true,
        description: 'Show off your projects and demos',
        icon: 'trophy',
        permissionPreset: 'full-discussion',
        sortOrder: 6,
      },
    ],
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Interactive workshop with Q&A and resources',
    category: 'workshop',
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Workshop updates and schedule changes',
        icon: 'megaphone',
        permissionPreset: 'read-only',
        sortOrder: 1,
      },
      {
        name: 'questions',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Ask questions during the workshop',
        icon: 'help-circle',
        permissionPreset: 'moderated',
        sortOrder: 2,
      },
      {
        name: 'resources',
        type: 'general',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Workshop materials and downloads',
        icon: 'folder',
        permissionPreset: 'read-only',
        sortOrder: 3,
      },
      {
        name: 'general',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'General discussion',
        icon: 'message-circle',
        permissionPreset: 'full-discussion',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'networking-event',
    name: 'Networking Event',
    description: 'Focused on attendee connections and introductions',
    category: 'networking',
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Event updates',
        icon: 'megaphone',
        permissionPreset: 'read-only',
        sortOrder: 1,
      },
      {
        name: 'introductions',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Introduce yourself to the community',
        icon: 'user-plus',
        permissionPreset: 'full-discussion',
        sortOrder: 2,
      },
      {
        name: 'networking',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Connect with other attendees',
        icon: 'users',
        permissionPreset: 'full-discussion',
        sortOrder: 3,
      },
      {
        name: 'opportunities',
        type: 'general',
        autoJoin: false,
        participantCanWrite: true,
        description: 'Share job opportunities and collaborations',
        icon: 'briefcase',
        permissionPreset: 'moderated',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'meetup',
    name: 'Meetup',
    description: 'Simple meetup with essential channels',
    category: 'meetup',
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        autoJoin: true,
        participantCanWrite: false,
        description: 'Meetup announcements',
        icon: 'megaphone',
        permissionPreset: 'read-only',
        sortOrder: 1,
      },
      {
        name: 'general',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'General discussion',
        icon: 'message-circle',
        permissionPreset: 'full-discussion',
        sortOrder: 2,
      },
      {
        name: 'help',
        type: 'general',
        autoJoin: true,
        participantCanWrite: true,
        description: 'Get help from organizers',
        icon: 'help-circle',
        prefix: 'help',
        permissionPreset: 'moderated',
        sortOrder: 3,
      },
    ],
  },
];

// Utility functions
export function getTemplateById(id: string): ChannelTemplate | undefined {
  return CHANNEL_TEMPLATES.find(t => t.id === id);
}

export function getDefaultTemplate(): ChannelTemplate {
  return CHANNEL_TEMPLATES.find(t => t.isDefault) || CHANNEL_TEMPLATES[0];
}

export function getTemplatesByCategory(category: TemplateCategory): ChannelTemplate[] {
  return CHANNEL_TEMPLATES.filter(t => t.category === category);
}

export function getPermissionPreset(id: PermissionPresetId): ChannelPermissionPreset | undefined {
  return PERMISSION_PRESETS.find(p => p.id === id);
}

export function getDefaultPermissions(): ChannelPermissions {
  return PERMISSION_PRESETS.find(p => p.id === 'full-discussion')?.permissions || {
    can_read: true,
    can_write: true,
    can_react: true,
    can_thread_reply: true,
    can_upload_files: false,
    can_mention_all: false,
  };
}

// Generate channel name with proper prefix
export function formatChannelName(name: string, prefix?: ChannelPrefix): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  if (prefix && CHANNEL_PREFIXES[prefix]) {
    return `${CHANNEL_PREFIXES[prefix]}${cleanName}`;
  }
  return cleanName;
}

// Generate session channel name
export function generateSessionChannelName(sessionTitle: string): string {
  const slug = sessionTitle.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  return `${CHANNEL_PREFIXES.session}${slug}`;
}

// Generate booth channel name
export function generateBoothChannelName(boothName: string): string {
  const slug = boothName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  return `${CHANNEL_PREFIXES.booth}${slug}`;
}

// Channel category defaults
export interface ChannelCategoryConfig {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  defaultChannelTypes: ChannelType[];
}

export const DEFAULT_CHANNEL_CATEGORIES: ChannelCategoryConfig[] = [
  {
    id: 'information',
    name: 'Information',
    description: 'Official channels for announcements and resources',
    sortOrder: 1,
    defaultChannelTypes: ['announcement'],
  },
  {
    id: 'general',
    name: 'General',
    description: 'Open discussion channels',
    sortOrder: 2,
    defaultChannelTypes: ['general'],
  },
  {
    id: 'sessions',
    name: 'Sessions',
    description: 'Session-specific discussion channels',
    sortOrder: 3,
    defaultChannelTypes: ['general'],
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'Channels for connecting with others',
    sortOrder: 4,
    defaultChannelTypes: ['general'],
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Help and support channels',
    sortOrder: 5,
    defaultChannelTypes: ['general'],
  },
];

// Broadcast priority configuration
export interface BroadcastPriorityConfig {
  id: 'normal' | 'important' | 'urgent';
  name: string;
  description: string;
  color: string;
  sendPush: boolean;
  pinDuration?: number; // hours to pin
}

export const BROADCAST_PRIORITIES: BroadcastPriorityConfig[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Regular announcement, no special notification',
    color: 'gray',
    sendPush: false,
  },
  {
    id: 'important',
    name: 'Important',
    description: 'Important update, pinned for 24 hours',
    color: 'yellow',
    sendPush: true,
    pinDuration: 24,
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'Urgent notification with immediate push alert',
    color: 'red',
    sendPush: true,
    pinDuration: 48,
  },
];
