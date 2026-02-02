/**
 * English translations
 * Organized by feature/section for maintainability
 */
const en = {
  // Common/shared strings
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    more: 'More',
    less: 'Less',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
  },

  // Navigation
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    events: 'Events',
    workspaces: 'Workspaces',
    marketplace: 'Marketplace',
    community: 'Community',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    logout: 'Log out',
  },

  // Authentication
  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset password',
    confirmPassword: 'Confirm password',
    createAccount: 'Create account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  },

  // Tasks
  tasks: {
    title: 'Tasks',
    createTask: 'Create task',
    editTask: 'Edit task',
    deleteTask: 'Delete task',
    taskTitle: 'Task title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due date',
    assignee: 'Assignee',
    category: 'Category',
    tags: 'Tags',
    noTasks: 'No tasks found',
    createFirst: 'Create your first task',
    statuses: {
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      reviewRequired: 'Review Required',
      completed: 'Completed',
      blocked: 'Blocked',
    },
    priorities: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    },
  },

  // Workspace
  workspace: {
    title: 'Workspace',
    myWorkspaces: 'My Workspaces',
    createWorkspace: 'Create workspace',
    settings: 'Workspace settings',
    members: 'Members',
    invite: 'Invite members',
    leave: 'Leave workspace',
    delete: 'Delete workspace',
    budget: 'Budget',
    tasks: 'Tasks',
    team: 'Team',
    approvals: 'Approvals',
    communication: 'Communication',
    checklists: 'Checklists',
    timeline: 'Timeline',
    analytics: 'Analytics',
  },

  // Events
  events: {
    title: 'Events',
    createEvent: 'Create event',
    editEvent: 'Edit event',
    publishEvent: 'Publish event',
    upcomingEvents: 'Upcoming Events',
    pastEvents: 'Past Events',
    noEvents: 'No events found',
    eventDetails: 'Event details',
    registration: 'Registration',
    schedule: 'Schedule',
    speakers: 'Speakers',
    sponsors: 'Sponsors',
  },

  // Approvals
  approvals: {
    title: 'Approvals',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    reject: 'Reject',
    requestApproval: 'Request approval',
    noApprovals: 'No pending approvals',
  },

  // Reports
  reports: {
    title: 'Reports',
    generate: 'Generate report',
    export: 'Export',
    schedule: 'Schedule report',
    frequency: 'Frequency',
    recipients: 'Recipients',
    types: {
      tasks: 'Task Summary',
      progress: 'Progress Report',
      team: 'Team Performance',
      budget: 'Budget Report',
    },
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
    },
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
  },

  // Errors
  errors: {
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try again',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
    serverError: 'Server error',
    networkError: 'Network error',
  },

  // Time/Date
  time: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    now: 'Now',
    ago: 'ago',
    in: 'in',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
  },

  // Accessibility
  a11y: {
    skipToContent: 'Skip to main content',
    skipToNav: 'Skip to navigation',
    loading: 'Loading content',
    menuOpen: 'Menu open',
    menuClosed: 'Menu closed',
    expanded: 'Expanded',
    collapsed: 'Collapsed',
    selected: 'Selected',
    notSelected: 'Not selected',
  },
};

export default en;
