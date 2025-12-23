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

export interface BrandingConfig {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
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
  code: string;
  imageUrl: string;
  registrationId: string;
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
    checkInMethod: string | null;
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

export enum WorkspaceStatus {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  WINDING_DOWN = 'WINDING_DOWN',
  DISSOLVED = 'DISSOLVED'
}

export enum WorkspaceRole {
  WORKSPACE_OWNER = 'WORKSPACE_OWNER',
  TEAM_LEAD = 'TEAM_LEAD',
  EVENT_COORDINATOR = 'EVENT_COORDINATOR',
  VOLUNTEER_MANAGER = 'VOLUNTEER_MANAGER',
  TECHNICAL_SPECIALIST = 'TECHNICAL_SPECIALIST',
  MARKETING_LEAD = 'MARKETING_LEAD',
  GENERAL_VOLUNTEER = 'GENERAL_VOLUNTEER'
}

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
  SETUP = 'SETUP',
  MARKETING = 'MARKETING',
  LOGISTICS = 'LOGISTICS',
  TECHNICAL = 'TECHNICAL',
  REGISTRATION = 'REGISTRATION',
  POST_EVENT = 'POST_EVENT'
}

export interface Workspace {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  status: WorkspaceStatus;
  settings?: WorkspaceSettings;
  templateId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelDTO {
  name: string;
  type: 'GENERAL' | 'TASK_SPECIFIC' | 'ROLE_BASED' | 'ANNOUNCEMENT';
  description?: string;
  members?: string[];
  isPrivate?: boolean;
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