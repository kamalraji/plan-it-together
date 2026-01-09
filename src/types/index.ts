// Common types and interfaces for the frontend

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  profileCompleted?: boolean;
  bio?: string;
  organization?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  JUDGE = 'JUDGE',
  VOLUNTEER = 'VOLUNTEER',
  SPEAKER = 'SPEAKER',
  VENDOR = 'VENDOR',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Event Management Types
export interface Event {
  id: string;
  name: string;
  description: string;
  mode: EventMode;
  category?: EventCategory;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline?: string;
  organizerId: string;
  organizationId?: string;
  visibility: EventVisibility;
  inviteLink?: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  status: EventStatus;
  landingPageUrl: string;
  timeline?: TimelineItem[];
  agenda?: AgendaItem[];
  prizes?: PrizeInfo[];
  sponsors?: SponsorInfo[];
  organization?: Organization;
  createdAt: string;
  updatedAt: string;

  /** Serialized canvas state for custom hero layouts */
  canvasState?: any;
  /** GrapesJS landing page output: html, css, and meta */
  landingPageData?: {
    html: string;
    css: string;
    meta?: {
      title?: string;
      description?: string;
    };
  } | null;
}



export enum EventMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED'
}

export enum EventCategory {
  HACKATHON = 'HACKATHON',
  BOOTCAMP = 'BOOTCAMP',
  WORKSHOP = 'WORKSHOP',
  CONFERENCE = 'CONFERENCE',
  MEETUP = 'MEETUP',
  STARTUP_PITCH = 'STARTUP_PITCH',
  HIRING_CHALLENGE = 'HIRING_CHALLENGE',
  WEBINAR = 'WEBINAR',
  COMPETITION = 'COMPETITION',
  OTHER = 'OTHER'
}

export interface BrandingConfig {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  workspaceTemplateId?: string;
  heroSubtitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

export interface VenueConfig {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  capacity?: number;
  facilities?: string[];
}

export interface VirtualConfig {
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  platform: 'zoom' | 'teams' | 'meet' | 'webex' | 'other';
  instructions?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'session' | 'break' | 'networking' | 'presentation';
  speaker?: string;
  location?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
  materials?: string[];
}

export interface PrizeInfo {
  id: string;
  title: string;
  description: string;
  value?: string;
  position: number;
  category?: string;
}

export interface SponsorInfo {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  tier: 'title' | 'platinum' | 'gold' | 'silver' | 'bronze';
  description?: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultMode: EventMode;
  defaultDuration: number; // in hours
  suggestedCapacity?: number;
  timeline?: Omit<TimelineItem, 'id'>[];
  branding?: Partial<BrandingConfig>;
}

export interface CreateEventDTO {
  name: string;
  description: string;
  mode: EventMode;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline?: string;
  organizationId?: string;
  visibility: EventVisibility;
  category?: EventCategory;
  templateId?: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  timeline?: Omit<TimelineItem, 'id'>[];
  agenda?: Omit<AgendaItem, 'id'>[];
  prizes?: Omit<PrizeInfo, 'id'>[];
  sponsors?: Omit<SponsorInfo, 'id'>[];
}

// Registration and Attendance Types
export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  formResponses: Record<string, any>;
  qrCode: string;
  registeredAt: string;
  updatedAt: string;
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED'
}

export interface RegistrationFormData {
  eventId: string;
  formResponses: Record<string, any>;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: string;
  position: number;
}

export interface QRCodeData {
  qrCode: string;
  userId: string;
  eventId: string;
  profile?: {
    fullName?: string | null;
    organization?: string | null;
  };
  registration?: {
    id: string;
    status: RegistrationStatus;
  } | null;
  latestAttendance?: {
    hasCheckedIn: boolean;
    checkInTime?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  sessionId?: string | null;
  checkInTime: string;
  checkInMethod: 'QR_SCAN' | 'MANUAL';
  volunteerId?: string | null;
}

export interface AttendanceReport {
  eventId: string;
  totalRegistrations: number;
  attendedCount: number;
  checkInRate: number;
  attendanceRecords: Array<{
    registrationId: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: string;
    attended: boolean;
    checkInTime: string | null;
    checkInMethod: 'QR_SCAN' | 'MANUAL' | null;
    sessionId?: string | null;
    volunteerId?: string | null;
    avatarUrl?: string | null;
  }>;
}

export interface CheckInData {
  qrCode: string;
  sessionId?: string;
}

// Communication Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface SendEmailDTO {
  to: string[];
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkEmailDTO {
  eventId: string;
  subject: string;
  body: string;
  templateId?: string;
  segmentCriteria: SegmentCriteria;
}

export interface SegmentCriteria {
  roles?: UserRole[];
  registrationStatus?: RegistrationStatus[];
  attendanceStatus?: 'ATTENDED' | 'NOT_ATTENDED';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  communicationLogId: string;
}

export interface CommunicationLog {
  id: string;
  eventId: string;
  senderId: string;
  recipientCount: number;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PARTIAL';
  sentAt: string;
  sender: {
    name: string;
    email: string;
  };
  event?: {
    name: string;
  };
}

export interface RecipientPreview {
  count: number;
  recipients: Array<{
    id: string;
    email: string;
    name: string;
  }>;
}

// Judging and Scoring Types
export interface RubricCriterion {
  id?: string;
  name: string;
  description: string;
  weight: number; // 0-100
  maxScore: number;
}

export interface Rubric {
  id: string;
  eventId: string;
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRubricDTO {
  eventId: string;
  criteria: Omit<RubricCriterion, 'id'>[];
}

export interface Submission {
  id: string;
  eventId: string;
  teamName: string;
  description?: string;
  submittedBy: string;
  submittedAt: string;
  files?: string[];
  metadata?: Record<string, any>;
}

export interface Score {
  id: string;
  submissionId: string;
  judgeId: string;
  rubricId: string;
  scores: Record<string, number>; // criterionId -> score
  submittedAt: string;
  judge?: {
    name: string;
    email: string;
  };
}

export interface SubmitScoreDTO {
  submissionId: string;
  scores: Record<string, number>; // criterionId -> score
}

export interface FinalScore {
  submissionId: string;
  teamName: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  rank: number;
  criteriaScores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
    weight: number;
  }>;
}

export interface LeaderboardEntry {
  id: string;
  submissionId: string;
  teamName: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  rank: number;
  lastUpdated: string;
}

export interface Leaderboard {
  eventId: string;
  enabled: boolean;
  entries: LeaderboardEntry[];
  lastUpdated: string;
}

// Analytics Types
export interface RegistrationOverTime {
  date: string;
  count: number;
  cumulativeCount: number;
}

export interface SessionCheckInRate {
  sessionId: string | null;
  sessionName: string;
  totalRegistrations: number;
  checkedIn: number;
  checkInRate: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface JudgeParticipation {
  judgeId: string;
  judgeName: string;
  assignedSubmissions: number;
  scoredSubmissions: number;
  completionRate: number;
}

export interface AnalyticsReport {
  eventId: string;
  eventName: string;
  generatedAt: string;
  registrationOverTime: RegistrationOverTime[];
  sessionCheckInRates: SessionCheckInRate[];
  scoreDistributions: ScoreDistribution[];
  judgeParticipation: JudgeParticipation[];
  summary: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalAttendance: number;
    overallCheckInRate: number;
    averageScore: number;
    totalSubmissions: number;
    totalJudges: number;
  };
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export type ExportFormat = 'CSV' | 'PDF';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  description: string;
  category: OrganizationCategory;
  verificationStatus: VerificationStatus;
  branding: OrganizationBranding;
  socialLinks: Record<string, string>;
  pageUrl: string;
  followerCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export enum OrganizationCategory {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  INDUSTRY = 'INDUSTRY',
  NON_PROFIT = 'NON_PROFIT'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface OrganizationBranding {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface OrganizationAdmin {
  id: string;
  organizationId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: 'OWNER' | 'ADMIN';
  addedAt: string;
}

export interface CreateOrganizationDTO {
  name: string;
  description: string;
  category: OrganizationCategory;
  branding: OrganizationBranding;
  socialLinks?: Record<string, string>;
}

export interface UpdateOrganizationDTO {
  name?: string;
  description?: string;
  category?: OrganizationCategory;
  branding?: OrganizationBranding;
  socialLinks?: Record<string, string>;
}

export interface Follow {
  id: string;
  userId: string;
  organizationId: string;
  followedAt: string;
}

export interface OrganizationAnalytics {
  totalEvents: number;
  followerGrowth: Array<{
    date: string;
    count: number;
  }>;
  pageViews: number;
  registrationStats: {
    totalRegistrations: number;
    averageAttendance: number;
  };
  followerDemographics: {
    byRole: Record<UserRole, number>;
    byLocation: Record<string, number>;
  };
}

// Workspace-related types
export interface MediaFile {
  filename: string;
  size: number;
  type: string;
  url: string;
}

export interface WorkspaceSettings {
  autoInviteOrganizer: boolean;
  defaultChannels: string[];
  taskCategories: string[];
  retentionPeriodDays: number;
  allowExternalMembers: boolean;
}

/**
 * Workspace hierarchy types for the 4-level structure
 */
export enum WorkspaceType {
  ROOT = 'ROOT',           // Level 1 - Main workspace
  DEPARTMENT = 'DEPARTMENT', // Level 2 - Department sub-workspace
  COMMITTEE = 'COMMITTEE',  // Level 3 - Committee under department
  TEAM = 'TEAM',           // Level 4 - Team under committee
}

export enum WorkspaceStatus {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  WINDING_DOWN = 'WINDING_DOWN',
  DISSOLVED = 'DISSOLVED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * 4-Level Workspace Hierarchy Roles
 * 
 * Level 1: WORKSPACE_OWNER - Full control & oversight
 * Level 2: *_MANAGER roles - Department-specific managers (Operations, Growth, Content, Tech/Finance, Volunteers)
 * Level 3: TEAM_LEAD, *_LEAD roles - Committee execution, manages coordinators
 * Level 4: *_COORDINATOR roles - Task execution
 */
export enum WorkspaceRole {
  // Level 1 - Workspace Owner
  WORKSPACE_OWNER = 'WORKSPACE_OWNER',
  
  // Level 2 - Department Managers (one per department)
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  GROWTH_MANAGER = 'GROWTH_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  TECH_FINANCE_MANAGER = 'TECH_FINANCE_MANAGER',
  VOLUNTEERS_MANAGER = 'VOLUNTEERS_MANAGER',
  
  // Level 3 - Team Leads (Committee Leads)
  EVENT_LEAD = 'EVENT_LEAD',
  CATERING_LEAD = 'CATERING_LEAD',
  LOGISTICS_LEAD = 'LOGISTICS_LEAD',
  FACILITY_LEAD = 'FACILITY_LEAD',
  MARKETING_LEAD = 'MARKETING_LEAD',
  COMMUNICATION_LEAD = 'COMMUNICATION_LEAD',
  SPONSORSHIP_LEAD = 'SPONSORSHIP_LEAD',
  SOCIAL_MEDIA_LEAD = 'SOCIAL_MEDIA_LEAD',
  CONTENT_LEAD = 'CONTENT_LEAD',
  SPEAKER_LIAISON_LEAD = 'SPEAKER_LIAISON_LEAD',
  JUDGE_LEAD = 'JUDGE_LEAD',
  MEDIA_LEAD = 'MEDIA_LEAD',
  FINANCE_LEAD = 'FINANCE_LEAD',
  REGISTRATION_LEAD = 'REGISTRATION_LEAD',
  TECHNICAL_LEAD = 'TECHNICAL_LEAD',
  IT_LEAD = 'IT_LEAD',
  VOLUNTEERS_LEAD = 'VOLUNTEERS_LEAD',
  
  // Level 4 - Coordinators
  EVENT_COORDINATOR = 'EVENT_COORDINATOR',
  CATERING_COORDINATOR = 'CATERING_COORDINATOR',
  LOGISTICS_COORDINATOR = 'LOGISTICS_COORDINATOR',
  FACILITY_COORDINATOR = 'FACILITY_COORDINATOR',
  MARKETING_COORDINATOR = 'MARKETING_COORDINATOR',
  COMMUNICATION_COORDINATOR = 'COMMUNICATION_COORDINATOR',
  SPONSORSHIP_COORDINATOR = 'SPONSORSHIP_COORDINATOR',
  SOCIAL_MEDIA_COORDINATOR = 'SOCIAL_MEDIA_COORDINATOR',
  CONTENT_COORDINATOR = 'CONTENT_COORDINATOR',
  SPEAKER_LIAISON_COORDINATOR = 'SPEAKER_LIAISON_COORDINATOR',
  JUDGE_COORDINATOR = 'JUDGE_COORDINATOR',
  MEDIA_COORDINATOR = 'MEDIA_COORDINATOR',
  FINANCE_COORDINATOR = 'FINANCE_COORDINATOR',
  REGISTRATION_COORDINATOR = 'REGISTRATION_COORDINATOR',
  TECHNICAL_COORDINATOR = 'TECHNICAL_COORDINATOR',
  IT_COORDINATOR = 'IT_COORDINATOR',
  VOLUNTEER_COORDINATOR = 'VOLUNTEER_COORDINATOR',
}

export type WorkspaceRoleScope = WorkspaceRole | 'ALL';


export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskCategory {
  // Core categories
  GENERAL = 'GENERAL',
  SETUP = 'SETUP',
  MARKETING = 'MARKETING',
  LOGISTICS = 'LOGISTICS',
  TECHNICAL = 'TECHNICAL',
  REGISTRATION = 'REGISTRATION',
  POST_EVENT = 'POST_EVENT',
  // Extended categories
  COMMUNICATION = 'COMMUNICATION',
  FINANCE = 'FINANCE',
  VOLUNTEER = 'VOLUNTEER',
  SPONSOR = 'SPONSOR',
  CONTENT = 'CONTENT',
  DESIGN = 'DESIGN',
  OPERATIONS = 'OPERATIONS',
  SAFETY = 'SAFETY',
  CATERING = 'CATERING',
  VENUE = 'VENUE',
}

export interface Workspace {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  status: WorkspaceStatus;
  settings?: WorkspaceSettings;
  templateId?: string;
  /** Workspace hierarchy type: ROOT, DEPARTMENT, COMMITTEE, or TEAM */
  workspaceType?: WorkspaceType;
  /** Department identifier for committees and teams (e.g., 'operations', 'growth') */
  departmentId?: string;
  event?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  teamMembers: TeamMember[];
  taskSummary?: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  channels: WorkspaceChannel[];
  createdAt: string;
  updatedAt: string;
  dissolvedAt?: string;
  parentWorkspaceId?: string | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  status: string;
  joinedAt: string;
  leftAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  invitedBy?: {
    id: string;
    name: string;
  };
}

// Subtask interface for child tasks
export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  status: 'TODO' | 'COMPLETED';
  assignedTo?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  dueDate?: string;
  dependencies: string[];
  tags: string[];
  metadata?: Record<string, any>;
  roleScope?: WorkspaceRoleScope;
  // Single assignee (backward compatible)
  assignee?: {
    id: string;
    userId: string;
    role: WorkspaceRole;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  // Multi-assignee support
  assignees?: Array<{
    id: string;
    userId: string;
    role: WorkspaceRole;
    user: { id: string; name: string; email?: string };
  }>;
  // Subtasks for progress tracking
  subtasks?: Subtask[];
  // Extended fields
  estimatedHours?: number;
  location?: string;
  attachments?: string[];
  creator: {
    id: string;
    userId: string;
    role: WorkspaceRole;
    user: {
      id: string;
      name: string;
    };
  };
  workspace?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WorkspaceChannel {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  description?: string;
  members: string[];
  isPrivate: boolean;
  roleScope?: WorkspaceRoleScope;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelDTO {
  name: string;
  type: 'GENERAL' | 'TASK_SPECIFIC' | 'ROLE_BASED' | 'ANNOUNCEMENT';
  description?: string;
  members?: string[];
  isPrivate?: boolean;
  roleScope?: WorkspaceRoleScope;
}

export interface SendMessageDTO {
  content: string;
  attachments?: MediaFile[];
}

export interface MessageResponse {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachments: MediaFile[];
  sentAt: string;
  editedAt?: string;
}

export interface BroadcastMessageDTO {
  content: string;
  attachments?: MediaFile[];
  targetType: 'ALL_MEMBERS' | 'ROLE_SPECIFIC';
  targetRoles?: string[];
}

export interface ChannelMessageHistory {
  channelId: string;
  messages: MessageResponse[];
  hasMore: boolean;
}

// Dashboard and Widget Types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'status' | 'quickAction';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data: any;
  refreshInterval?: number;
  loading?: boolean;
  error?: string;
}

export interface DashboardLayout {
  columns: number;
  rows: DashboardRow[];
  customizable: boolean;
}

export interface DashboardRow {
  id: string;
  widgets: string[];
  height?: string;
}

export interface QuickAction {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'primary' | 'secondary';
}