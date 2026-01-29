/**
 * Centralized React Query configuration
 * Provides consistent caching strategies and query key factories
 */

// Query presets based on data freshness requirements
export const queryPresets = {
  /**
   * Static data that rarely changes
   * Use for: organizations, system settings, user profiles
   */
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    networkMode: 'offlineFirst' as const,
  },

  /**
   * Semi-static data that changes occasionally
   * Use for: workspaces, events, budgets, resources
   */
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    networkMode: 'offlineFirst' as const,
  },

  /**
   * Dynamic data that changes frequently
   * Use for: tasks, assignments, activities, time entries
   */
  dynamic: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Real-time data that needs frequent updates
   * Use for: notifications, live counts, active sessions
   */
  realtime: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
  },

  /**
   * Critical data that should work offline
   * Use for: user auth, core settings
   */
  critical: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    networkMode: 'offlineFirst' as const,
    retry: 3,
  },
} as const;

// Query key factories for consistent naming and cache management
export const queryKeys = {
  // Workspace-related queries
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: (eventId?: string) => [...queryKeys.workspaces.lists(), { eventId }] as const,
    details: () => [...queryKeys.workspaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workspaces.details(), id] as const,
    tasks: (id: string) => [...queryKeys.workspaces.detail(id), 'tasks'] as const,
    team: (id: string) => [...queryKeys.workspaces.detail(id), 'team'] as const,
    budget: (id: string) => [...queryKeys.workspaces.detail(id), 'budget'] as const,
    resources: (id: string) => [...queryKeys.workspaces.detail(id), 'resources'] as const,
    activities: (id: string) => [...queryKeys.workspaces.detail(id), 'activities'] as const,
    milestones: (id: string) => [...queryKeys.workspaces.detail(id), 'milestones'] as const,
    checklists: (id: string) => [...queryKeys.workspaces.detail(id), 'checklists'] as const,
    userWorkspaces: (workspaceId: string) => [...queryKeys.workspaces.all, 'user', workspaceId] as const,
  },

  // Organization-related queries
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.organizations.all, 'slug', slug] as const,
    events: (id: string) => [...queryKeys.organizations.detail(id), 'events'] as const,
    memberships: (id: string) => [...queryKeys.organizations.detail(id), 'memberships'] as const,
    myOrganizations: () => [...queryKeys.organizations.all, 'mine'] as const,
    myMemberships: () => [...queryKeys.organizations.all, 'memberships', 'me'] as const,
  },

  // Event-related queries
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    registrations: (id: string) => [...queryKeys.events.detail(id), 'registrations'] as const,
    registrationStats: (id: string) => [...queryKeys.events.detail(id), 'registration-stats'] as const,
    attendees: (id: string) => [...queryKeys.events.detail(id), 'attendees'] as const,
    waitlist: (id: string) => [...queryKeys.events.detail(id), 'waitlist'] as const,
    sessions: (id: string) => [...queryKeys.events.detail(id), 'sessions'] as const,
    tickets: (id: string) => [...queryKeys.events.detail(id), 'tickets'] as const,
    branding: (id: string) => [...queryKeys.events.detail(id), 'branding'] as const,
  },

  // Team-related queries
  team: {
    assignments: (workspaceId: string) => ['team-assignments', workspaceId] as const,
    workload: (workspaceId: string) => ['team-workload', workspaceId] as const,
    personalProgress: (workspaceId: string, userId: string) =>
      ['personal-progress', workspaceId, userId] as const,
    members: (workspaceId: string) => ['team-members', workspaceId] as const,
  },

  // User-related queries
  users: {
    profile: (id: string) => ['user-profile', id] as const,
    roles: (id: string) => ['user-roles', id] as const,
    notifications: () => ['notifications'] as const,
    preferences: (id: string) => ['notification-preferences', id] as const,
    current: () => ['current-user'] as const,
  },

  // Dashboard metrics
  dashboard: {
    metrics: () => ['dashboard-metrics'] as const,
    organizer: (orgId: string) => ['organizer-dashboard', orgId] as const,
    admin: () => ['admin-dashboard'] as const,
  },

  // Catering-related queries
  catering: {
    menuItems: (workspaceId: string) => ['catering-menu', workspaceId] as const,
    inventory: (workspaceId: string) => ['catering-inventory', workspaceId] as const,
    vendors: (workspaceId: string) => ['catering-vendors', workspaceId] as const,
    dietary: (workspaceId: string) => ['catering-dietary', workspaceId] as const,
    schedule: (workspaceId: string) => ['catering-schedule', workspaceId] as const,
  },

  // Media-related queries
  media: {
    assets: (workspaceId: string) => ['media-assets', workspaceId] as const,
    content: (workspaceId: string) => ['content-items', workspaceId] as const,
    speakers: (workspaceId: string) => ['speakers', workspaceId] as const,
  },

  // Tasks queries
  tasks: {
    all: ['tasks'] as const,
    list: (workspaceId: string) => [...queryKeys.tasks.all, 'list', workspaceId] as const,
    detail: (taskId: string) => [...queryKeys.tasks.all, 'detail', taskId] as const,
    comments: (taskId: string) => [...queryKeys.tasks.detail(taskId), 'comments'] as const,
    activities: (taskId: string) => [...queryKeys.tasks.detail(taskId), 'activities'] as const,
  },

  // Budget queries
  budget: {
    workspace: (workspaceId: string) => ['budget', workspaceId] as const,
    requests: (workspaceId: string) => ['budget-requests', workspaceId] as const,
    expenses: (workspaceId: string) => ['expenses', workspaceId] as const,
  },

  // Resources queries
  resources: {
    workspace: (workspaceId: string) => ['resources', workspaceId] as const,
    requests: (workspaceId: string) => ['resource-requests', workspaceId] as const,
  },

  // Checklists queries
  checklists: {
    workspace: (workspaceId: string) => ['checklists', workspaceId] as const,
    detail: (checklistId: string) => ['checklist', checklistId] as const,
    items: (checklistId: string) => ['checklist-items', checklistId] as const,
  },

  // Live streaming queries
  liveStreams: {
    all: ['live-streams'] as const,
    byWorkspace: (workspaceId: string) => ['live-streams', 'workspace', workspaceId] as const,
    byEvent: (eventId: string) => ['live-streams', 'event', eventId] as const,
    detail: (streamId: string) => ['live-streams', 'detail', streamId] as const,
    analytics: (streamId: string) => ['live-streams', 'detail', streamId, 'analytics'] as const,
    youtubeChannel: (workspaceId: string) => ['youtube-channel', workspaceId] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;

// Re-export column constants for convenience
export * from './supabase-columns';
