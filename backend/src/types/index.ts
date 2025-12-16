// Common types and interfaces for the backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event-related types
export interface BrandingConfig {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  bannerImage?: string;
  customCss?: string;
}

export interface VenueConfig {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  mapUrl?: string;
  instructions?: string;
}

export interface VirtualConfig {
  meetingUrl: string;
  platform: string;
  accessCode?: string;
  instructions?: string;
}

export interface CreateEventDTO {
  name: string;
  description: string;
  mode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  startDate: Date | string;
  endDate: Date | string;
  capacity?: number;
  registrationDeadline?: Date | string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  templateId?: string;
  organizationId?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  mode?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  startDate?: Date | string;
  endDate?: Date | string;
  capacity?: number;
  registrationDeadline?: Date | string;
  branding?: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  leaderboardEnabled?: boolean;
  organizationId?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
}

export interface EventResponse {
  id: string;
  name: string;
  description: string;
  mode: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  registrationDeadline?: Date;
  organizerId: string;
  organizationId?: string | null;
  visibility?: string;
  inviteLink?: string | null;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  status: string;
  landingPageUrl: string;
  leaderboardEnabled: boolean;
  registrationCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageData {
  event: EventResponse;
  registrationOpen: boolean;
  spotsRemaining?: number;
  organizerInfo: {
    name: string;
    email: string;
  };
  organizationInfo?: {
    id: string;
    name: string;
    branding: OrganizationBranding;
    verificationStatus: string;
  };
}

export interface EventAnalytics {
  eventId: string;
  registrationStats: {
    total: number;
    confirmed: number;
    waitlisted: number;
    cancelled: number;
    overTime: Array<{ date: string; count: number }>;
  };
  attendanceStats?: {
    totalCheckedIn: number;
    checkInRate: number;
    bySession?: Array<{ sessionId: string; count: number }>;
  };
  capacityUtilization?: number;
}

// Registration-related types
export interface RegistrationDTO {
  eventId: string;
  userId: string;
  formResponses: Record<string, any>;
}

export interface RegistrationResponse {
  id: string;
  eventId: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  formResponses: Record<string, any>;
  qrCode: string;
  registeredAt: Date;
  updatedAt: Date;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: Date;
  position: number;
}

// Attendance-related types
export interface QRCodeData {
  code: string;
  imageUrl: string;
  registrationId: string;
}

export interface CheckInDTO {
  qrCode: string;
  sessionId?: string;
  volunteerId?: string;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  sessionId?: string | null;
  checkInTime: Date;
  checkInMethod: string;
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
    checkInTime: Date | null;
    checkInMethod: string | null;
  }>;
}

// Judging-related types
export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100
  maxScore: number;
}

export interface CreateRubricDTO {
  eventId: string;
  criteria: Omit<RubricCriterion, 'id'>[];
}

export interface RubricResponse {
  id: string;
  eventId: string;
  criteria: RubricCriterion[];
  createdAt: Date;
}

export interface CreateSubmissionDTO {
  eventId: string;
  rubricId: string;
  teamName: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionResponse {
  id: string;
  eventId: string;
  rubricId: string;
  teamName: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitScoreDTO {
  submissionId: string;
  judgeId: string;
  scores: Record<string, number>; // criterionId -> score
}

export interface ScoreResponse {
  id: string;
  submissionId: string;
  judgeId: string;
  rubricId: string;
  scores: Record<string, number>;
  submittedAt: Date;
}

export interface FinalScore {
  submissionId: string;
  teamName: string;
  finalScore: number;
  rank: number;
  judgeScores: Array<{
    judgeId: string;
    judgeName: string;
    scores: Record<string, number>;
    totalScore: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  submissionId: string;
  teamName: string;
  finalScore: number;
  metadata?: Record<string, any>;
}

export interface JudgeAssignment {
  judgeId: string;
  submissionIds: string[];
}

// Certificate-related types
export interface CertificateMetadata {
  eventName: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: Date;
  position?: number;
  score?: number;
  role?: string;
  customFields?: Record<string, any>;
}

export interface GenerateCertificateDTO {
  recipientId: string;
  eventId: string;
  type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
  metadata: CertificateMetadata;
}

export interface CertificateCriteria {
  type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
  conditions: {
    minScore?: number;
    maxRank?: number;
    requiresAttendance?: boolean;
    requiresRole?: string[];
  };
}

export interface CertificateResponse {
  id: string;
  certificateId: string;
  recipientId: string;
  eventId: string;
  type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
  pdfUrl: string;
  qrCodeUrl: string;
  metadata: CertificateMetadata;
  issuedAt: Date;
  distributedAt?: Date;
}

export interface DistributionResult {
  successful: number;
  failed: number;
  failures: Array<{
    certificateId: string;
    recipientEmail: string;
    error: string;
  }>;
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: {
    certificateId: string;
    recipientName: string;
    eventName: string;
    type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
    issuedAt: Date;
  };
  error?: string;
}

// Organization-related types
export interface OrganizationBranding {
  logoUrl: string;
  bannerUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface CreateOrganizationDTO {
  name: string;
  description: string;
  category: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  branding: OrganizationBranding;
  socialLinks?: Record<string, string>;
}

export interface UpdateOrganizationDTO {
  name?: string;
  description?: string;
  category?: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  branding?: OrganizationBranding;
  socialLinks?: Record<string, string>;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  verificationStatus: string;
  branding: OrganizationBranding;
  socialLinks?: Record<string, string>;
  pageUrl: string;
  followerCount: number;
  eventCount: number;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  latestEvents?: EventResponse[];
}

export interface OrganizationAnalytics {
  totalEvents: number;
  totalFollowers: number;
  totalRegistrations: number;
  totalAttendance: number;
  followerGrowth: Record<string, number>;
  eventPerformance: Array<{
    eventId: string;
    eventName: string;
    registrationCount: number;
    attendanceCount: number;
    attendanceRate: number;
  }>;
  pageViews: number;
  followerDemographics: {
    byRole: Record<string, number>;
    byRegistrationDate: Record<string, number>;
  };
}

export interface OrganizationAnalyticsReport {
  organizationId: string;
  organizationName: string;
  generatedAt: Date;
  analytics: OrganizationAnalytics;
  summary: {
    totalEvents: number;
    totalFollowers: number;
    totalRegistrations: number;
    totalAttendance: number;
    averageAttendanceRate: number;
    followerGrowthRate: number;
    mostPopularEvent: {
      eventId: string;
      eventName: string;
      registrationCount: number;
    } | null;
  };
}

// Discovery-related types
export interface SearchOrganizationsDTO {
  query?: string;
  category?: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface FollowResponse {
  id: string;
  userId: string;
  organizationId: string;
  followedAt: Date;
}

// Organization Admin Management types
export interface InviteAdminDTO {
  email: string;
  role?: 'OWNER' | 'ADMIN';
}

export interface AddAdminDTO {
  userId: string;
  role?: 'OWNER' | 'ADMIN';
}

export interface OrganizationAdminResponse {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  addedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminInvitationResult {
  success: boolean;
  message: string;
}

// Marketplace-related types
export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
  order: number;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface WeeklySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface CustomAvailabilitySlot {
  date: Date;
  available: boolean;
  timeSlots?: TimeSlot[];
}

export interface AvailabilityCalendar {
  timezone: string;
  recurringAvailability: WeeklySchedule;
  blockedDates: Date[];
  customAvailability: CustomAvailabilitySlot[];
}

export interface PackageDeal {
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  packagePrice: number;
  savings: number;
}

export interface PricingModel {
  type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
  basePrice?: number;
  currency: string;
  minimumOrder?: number;
  packageDeals?: PackageDeal[];
}

export interface VerificationDocuments {
  businessLicense?: string;
  insuranceCertificate?: string;
  taxDocuments?: string[];
  identityVerification?: string;
  portfolioSamples?: string[];
}

// Vendor Profile types
export interface CreateVendorDTO {
  businessName: string;
  description: string;
  contactInfo: ContactInfo;
  serviceCategories: string[]; // ServiceCategory enum values
  businessAddress: Address;
  businessLicense?: string;
  insuranceCertificate?: string;
  portfolio: MediaFile[];
  businessHours?: WeeklySchedule;
}

export interface UpdateVendorDTO {
  businessName?: string;
  description?: string;
  contactInfo?: ContactInfo;
  serviceCategories?: string[];
  businessAddress?: Address;
  portfolio?: MediaFile[];
  businessHours?: WeeklySchedule;
}

export interface VerificationBadge {
  isVerified: boolean;
  badgeText: string;
  badgeColor: string;
  description: string;
}

export interface VendorProfileResponse {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  contactInfo: ContactInfo;
  serviceCategories: string[];
  businessAddress: Address;
  verificationStatus: string;
  verificationDocuments?: VerificationDocuments;
  rating: number;
  reviewCount: number;
  portfolio: MediaFile[];
  businessHours?: WeeklySchedule;
  responseTime: number;
  completionRate: number;
  rejectionReason?: string;
  verificationBadge?: VerificationBadge;
  createdAt: Date;
  updatedAt: Date;
}

// Service Listing types
export interface CreateServiceDTO {
  title: string;
  description: string;
  category: string; // ServiceCategory enum value
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
}

export interface UpdateServiceDTO {
  title?: string;
  description?: string;
  category?: string;
  pricing?: PricingModel;
  availability?: AvailabilityCalendar;
  serviceArea?: string[];
  requirements?: string;
  inclusions?: string[];
  exclusions?: string[];
  media?: MediaFile[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ServiceListingResponse {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: string;
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions: string[];
  media: MediaFile[];
  featured: boolean;
  status: string;
  viewCount: number;
  inquiryCount: number;
  bookingCount: number;
  vendor?: VendorProfileResponse;
  createdAt: Date;
  updatedAt: Date;
}

// Search and Discovery types
export interface SearchServicesDTO {
  query?: string;
  category?: string;
  location?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchServicesResponse {
  services: ServiceListingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    categories: Array<{ category: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    locations: Array<{ location: string; count: number }>;
  };
}

// Booking types
export interface CreateBookingDTO {
  eventId: string;
  serviceListingId: string;
  serviceDate: Date;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  additionalNotes?: string;
}

export interface UpdateBookingDTO {
  status?: string; // BookingStatus enum value
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
}

export interface BookingRequestResponse {
  id: string;
  eventId: string;
  serviceListingId: string;
  organizerId: string;
  vendorId: string;
  status: string;
  serviceDate: Date;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
  event?: EventResponse;
  serviceListing?: ServiceListingResponse;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  vendor?: VendorProfileResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingMessageDTO {
  message: string;
  attachments?: MediaFile[];
}

export interface BookingMessageResponse {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  attachments?: MediaFile[];
  sentAt: Date;
}

// Vendor Analytics types
export interface VendorAnalytics {
  vendorId: string;
  listingViews: number;
  inquiryCount: number;
  bookingCount: number;
  conversionRate: number;
  averageRating: number;
  totalReviews: number;
  revenue: number;
  performanceMetrics: {
    responseTime: number;
    completionRate: number;
    repeatCustomerRate: number;
  };
  trendData: {
    viewsOverTime: Array<{ date: string; views: number }>;
    bookingsOverTime: Array<{ date: string; bookings: number }>;
    revenueOverTime: Array<{ date: string; revenue: number }>;
  };
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
}

// Review types
export interface CreateReviewDTO {
  rating: number; // 1-5
  title: string;
  comment: string;
  serviceQuality: number;
  communication: number;
  timeliness: number;
  value: number;
  wouldRecommend: boolean;
}

export interface VendorReviewResponse {
  id: string;
  vendorId: string;
  bookingId: string;
  organizerId: string;
  rating: number;
  title: string;
  comment: string;
  serviceQuality: number;
  communication: number;
  timeliness: number;
  value: number;
  wouldRecommend: boolean;
  vendorResponse?: string;
  vendorResponseAt?: Date;
  verifiedPurchase: boolean;
  helpful: number;
  organizer?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Service Agreement types
export interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: Date;
}

export interface PaymentMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: Date;
}

export interface ServiceAgreementTemplate {
  id: string;
  name: string;
  category: string;
  terms: string;
  deliverableTemplates: Omit<Deliverable, 'id' | 'status' | 'completedAt'>[];
  paymentScheduleTemplate: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>[];
  cancellationPolicy: string;
}

export interface CreateServiceAgreementDTO {
  bookingId: string;
  templateId?: string;
  customTerms?: string;
  deliverables: Omit<Deliverable, 'id' | 'status' | 'completedAt'>[];
  paymentSchedule: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>[];
  cancellationPolicy?: string;
}

export interface ServiceAgreementResponse {
  id: string;
  bookingId: string;
  terms: string;
  deliverables: Deliverable[];
  paymentSchedule: PaymentMilestone[];
  cancellationPolicy: string;
  signedAt?: Date;
  organizerSignature?: string;
  vendorSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalSignatureDTO {
  agreementId: string;
  signatureType: 'ORGANIZER' | 'VENDOR';
  signature: string;
  ipAddress?: string;
  userAgent?: string;
}

// Event-Marketplace Integration types
export interface ServiceRecommendationDTO {
  preferredCategories?: string[]; // ServiceCategory enum values
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly?: boolean;
  limit?: number;
}

export interface VendorTimelineSyncDTO {
  sendReminders?: boolean;
  includeDeliverables?: boolean;
  includeServiceDates?: boolean;
}

export interface IntegratedCommunicationDTO {
  type: 'VENDOR_BROADCAST' | 'CATEGORY_SPECIFIC' | 'INDIVIDUAL_VENDOR' | 'TIMELINE_UPDATE';
  message: string;
  attachments?: MediaFile[];
  targetCategories?: string[]; // For CATEGORY_SPECIFIC type
  targetBookingId?: string; // For INDIVIDUAL_VENDOR type
}

export interface EventMarketplaceIntegrationResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface EventTimelineItem {
  id: string;
  eventId: string;
  bookingId?: string;
  deliverableId?: string;
  serviceDate?: Date;
  title: string;
  description: string;
  dueDate: Date;
  status: string;
  vendorId?: string;
  category: 'VENDOR_DELIVERABLE' | 'VENDOR_SERVICE' | 'EVENT_MILESTONE';
  createdAt: Date;
  updatedAt: Date;
}


// Workspace-related types
export interface WorkspaceSettings {
  autoInviteOrganizer: boolean;
  defaultChannels: string[];
  taskCategories: string[];
  retentionPeriodDays: number;
  allowExternalMembers: boolean;
}

export interface CreateWorkspaceDTO {
  eventId: string;
  name?: string;
  description?: string;
  settings?: WorkspaceSettings;
  templateId?: string;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  description?: string;
  settings?: WorkspaceSettings;
}

export interface WorkspaceResponse {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  status: string;
  settings?: WorkspaceSettings;
  templateId?: string;
  event?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  teamMembers: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  taskSummary?: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  channels: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    isPrivate: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  dissolvedAt?: Date;
}

// Team Management types
export interface TeamInvitationDTO {
  email: string;
  name?: string;
  role: 'WORKSPACE_OWNER' | 'TEAM_LEAD' | 'EVENT_COORDINATOR' | 'VOLUNTEER_MANAGER' | 'TECHNICAL_SPECIALIST' | 'MARKETING_LEAD' | 'GENERAL_VOLUNTEER';
}

export interface BulkInvitationDTO {
  invitations: TeamInvitationDTO[];
}

export interface InvitationResponse {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  status: string;
  invitationToken: string;
  workspace: {
    id: string;
    name: string;
    event?: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
    };
  };
  invitedAt: Date;
}

export interface TeamMemberResponse {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  permissions: string[];
  status: string;
  joinedAt: Date;
  leftAt?: Date;
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

// Task Management types
export interface CreateTaskDTO {
  title: string;
  description: string;
  assigneeId?: string;
  category: 'SETUP' | 'MARKETING' | 'LOGISTICS' | 'TECHNICAL' | 'REGISTRATION' | 'POST_EVENT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | string;
  dependencies?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  assigneeId?: string;
  category?: 'SETUP' | 'MARKETING' | 'LOGISTICS' | 'TECHNICAL' | 'REGISTRATION' | 'POST_EVENT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'BLOCKED';
  progress?: number;
  dueDate?: Date | string;
  dependencies?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskAssignmentDTO {
  assigneeId: string;
}

export interface TaskProgressDTO {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'BLOCKED';
  progress: number;
}

export interface TaskResponse {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  progress: number;
  dueDate?: Date;
  dependencies: string[];
  tags: string[];
  metadata?: Record<string, any>;
  assignee?: {
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  creator: {
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
    };
  };
  workspace?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Communication types
export interface CreateChannelDTO {
  name: string;
  type: 'GENERAL' | 'TASK_SPECIFIC' | 'ROLE_BASED' | 'ANNOUNCEMENT';
  description?: string;
  members?: string[];
  isPrivate?: boolean;
}

export interface ChannelResponse {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  description?: string;
  members: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  sentAt: Date;
  editedAt?: Date;
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