# Thittam1Hub Design Document

## Overview

Thittam1Hub is a full-stack web application that provides unified event management and publishing capabilities. The system architecture follows a modern three-tier pattern with a React-based frontend, Node.js/Express backend API, and PostgreSQL database. The platform is designed to handle multiple concurrent events with thousands of participants, supporting real-time updates for features like leaderboards and attendance tracking.

The system emphasizes security, scalability, and user experience, with role-based access control (RBAC) enforced at both the API and UI layers. Certificate generation and verification form the core SaaS value proposition, providing tamper-proof digital credentials with public verification.

**Official Pages Extension:** The platform now supports organization profiles, allowing colleges, companies, and industry associations to establish official presences. Organizations can host multiple events under their brand, manage visibility (public/private/unlisted), and build follower communities. This creates a trusted event discovery ecosystem where users can find events from verified organizations.

**Event Marketplace Integration:** The platform includes an integrated B2B marketplace that seamlessly connects event organizers with verified service providers. The marketplace features comprehensive vendor management, service discovery, booking workflows, payment processing, and review systems, all integrated within the unified event management experience.

## Architecture

### System Architecture

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Organizer  │  │ Participant  │  │  Volunteer   │      │
│  │      UI      │  │      UI      │  │   Mobile     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer (Node.js)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │    Event     │  │ Certificate  │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Attendance  │  │   Judging    │  │    Email     │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Organization  │  │  Discovery   │  │ Marketplace  │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Vendor     │  │   Booking    │  │   Payment    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Users     │  │    Events    │  │ Certificates │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Registrations│  │  Attendance  │  │   Judging    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Email     │  │   Storage    │  │     QR       │      │
│  │   Provider   │  │     (S3)     │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript for type safety
- React Router for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS for styling
- Recharts for analytics visualization
- React Hook Form for form management

**Backend:**
- Node.js with Express.js framework
- TypeScript for type safety
- JWT for authentication
- Bcrypt for password hashing
- Node-cron for scheduled tasks

**Database:**
- PostgreSQL 14+ for relational data
- Prisma ORM for type-safe database access

**External Services:**
- SendGrid or AWS SES for email delivery
- AWS S3 or similar for file storage (certificates, event assets)
- QRCode library for QR code generation
- PDFKit for certificate PDF generation

## Components and Interfaces

### 1. Authentication Service

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing and verification
- Email verification
- Role-based access control

**Key Interfaces:**

```typescript
interface AuthService {
  register(userData: RegisterDTO): Promise<User>;
  login(credentials: LoginDTO): Promise<AuthResponse>;
  verifyEmail(token: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  validatePermission(userId: string, permission: Permission): Promise<boolean>;
}

interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  eventCode?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
```

### 2. Event Service

**Responsibilities:**
- Event creation and configuration
- Event template management
- Event mode configuration (Offline/Online/Hybrid)
- Landing page generation
- Event analytics

**Key Interfaces:**

```typescript
interface EventService {
  createEvent(eventData: CreateEventDTO): Promise<Event>;
  updateEvent(eventId: string, updates: UpdateEventDTO): Promise<Event>;
  getEvent(eventId: string): Promise<Event>;
  generateLandingPage(eventId: string): Promise<LandingPageData>;
  getEventAnalytics(eventId: string): Promise<EventAnalytics>;
}

interface CreateEventDTO {
  name: string;
  description: string;
  mode: EventMode;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  templateId?: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
}

enum EventMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID'
}
```

### 3. Registration Service

**Responsibilities:**
- Participant registration processing
- Capacity management and waitlist
- Registration form customization
- RSVP management

**Key Interfaces:**

```typescript
interface RegistrationService {
  registerParticipant(registrationData: RegistrationDTO): Promise<Registration>;
  updateRegistrationStatus(registrationId: string, status: RegistrationStatus): Promise<Registration>;
  getWaitlist(eventId: string): Promise<Registration[]>;
  approveWaitlistEntry(registrationId: string): Promise<Registration>;
}

interface RegistrationDTO {
  eventId: string;
  userId: string;
  formResponses: Record<string, any>;
}

enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED'
}
```

### 4. Attendance Service

**Responsibilities:**
- QR code generation for participants
- Check-in processing
- Attendance tracking and reporting
- Session-level attendance

**Key Interfaces:**

```typescript
interface AttendanceService {
  generateQRCode(registrationId: string): Promise<QRCodeData>;
  checkIn(qrCode: string, sessionId?: string): Promise<AttendanceRecord>;
  validateQRCode(qrCode: string): Promise<boolean>;
  getAttendanceReport(eventId: string): Promise<AttendanceReport>;
}

interface QRCodeData {
  code: string;
  imageUrl: string;
  registrationId: string;
}

interface AttendanceRecord {
  id: string;
  registrationId: string;
  sessionId?: string;
  checkInTime: Date;
  checkInMethod: 'QR_SCAN' | 'MANUAL';
}
```

### 5. Judging Service

**Responsibilities:**
- Rubric creation and management
- Score submission and validation
- Final score calculation
- Leaderboard generation

**Key Interfaces:**

```typescript
interface JudgingService {
  createRubric(rubricData: CreateRubricDTO): Promise<Rubric>;
  submitScore(scoreData: SubmitScoreDTO): Promise<Score>;
  calculateFinalScores(eventId: string): Promise<FinalScore[]>;
  getLeaderboard(eventId: string): Promise<LeaderboardEntry[]>;
}

interface CreateRubricDTO {
  eventId: string;
  criteria: RubricCriterion[];
}

interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0-100
  maxScore: number;
}

interface SubmitScoreDTO {
  submissionId: string;
  judgeId: string;
  scores: Record<string, number>; // criterionId -> score
}
```

### 6. Certificate Service

**Responsibilities:**
- Certificate generation based on criteria
- PDF creation with QR codes
- Certificate distribution
- Certificate verification

**Key Interfaces:**

```typescript
interface CertificateService {
  generateCertificate(certificateData: GenerateCertificateDTO): Promise<Certificate>;
  batchGenerateCertificates(eventId: string): Promise<Certificate[]>;
  verifyCertificate(certificateId: string): Promise<CertificateVerification>;
  distributeCertificates(certificateIds: string[]): Promise<DistributionResult>;
}

interface GenerateCertificateDTO {
  recipientId: string;
  eventId: string;
  type: CertificateType;
  metadata: CertificateMetadata;
}

enum CertificateType {
  MERIT = 'MERIT',
  COMPLETION = 'COMPLETION',
  APPRECIATION = 'APPRECIATION'
}

interface Certificate {
  id: string;
  certificateId: string; // Unique public ID
  recipientId: string;
  eventId: string;
  type: CertificateType;
  pdfUrl: string;
  qrCodeUrl: string;
  issuedAt: Date;
}
```

### 7. Communication Service

**Responsibilities:**
- Email template management
- Recipient segmentation
- Mass email delivery
- Communication logging

**Key Interfaces:**

```typescript
interface CommunicationService {
  sendEmail(emailData: SendEmailDTO): Promise<EmailResult>;
  sendBulkEmail(bulkEmailData: BulkEmailDTO): Promise<BulkEmailResult>;
  getEmailTemplates(eventId: string): Promise<EmailTemplate[]>;
  segmentRecipients(eventId: string, criteria: SegmentCriteria): Promise<User[]>;
}

interface SendEmailDTO {
  to: string[];
  subject: string;
  body: string;
  templateId?: string;
  attachments?: Attachment[];
}

interface SegmentCriteria {
  roles?: UserRole[];
  registrationStatus?: RegistrationStatus[];
  attendanceStatus?: 'ATTENDED' | 'NOT_ATTENDED';
}
```

### 8. Organization Service

**Responsibilities:**
- Organization profile creation and management
- Organization verification workflow
- Organization admin management
- Organization branding and page generation

**Key Interfaces:**

```typescript
interface OrganizationService {
  createOrganization(orgData: CreateOrganizationDTO): Promise<Organization>;
  updateOrganization(orgId: string, updates: UpdateOrganizationDTO): Promise<Organization>;
  getOrganization(orgId: string): Promise<Organization>;
  verifyOrganization(orgId: string, approved: boolean, reason?: string): Promise<Organization>;
  addAdmin(orgId: string, userId: string): Promise<OrganizationAdmin>;
  removeAdmin(orgId: string, userId: string): Promise<boolean>;
  getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics>;
}

interface CreateOrganizationDTO {
  name: string;
  description: string;
  category: OrganizationCategory;
  branding: OrganizationBranding;
  socialLinks?: Record<string, string>;
}

enum OrganizationCategory {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  INDUSTRY = 'INDUSTRY',
  NON_PROFIT = 'NON_PROFIT'
}

enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

interface Organization {
  id: string;
  name: string;
  description: string;
  category: OrganizationCategory;
  verificationStatus: VerificationStatus;
  branding: OrganizationBranding;
  pageUrl: string;
  followerCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 9. Discovery Service

**Responsibilities:**
- Organization search and filtering
- Event discovery across organizations
- Following/unfollowing organizations
- Notification management for followers

**Key Interfaces:**

```typescript
interface DiscoveryService {
  searchOrganizations(query: SearchOrganizationsDTO): Promise<Organization[]>;
  getOrganizationEvents(orgId: string, visibility?: EventVisibility): Promise<Event[]>;
  followOrganization(userId: string, orgId: string): Promise<Follow>;
  unfollowOrganization(userId: string, orgId: string): Promise<boolean>;
  getFollowedOrganizations(userId: string): Promise<Organization[]>;
  notifyFollowers(orgId: string, notification: NotificationData): Promise<void>;
}

interface SearchOrganizationsDTO {
  query?: string;
  category?: OrganizationCategory;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED'
}

interface Follow {
  id: string;
  userId: string;
  organizationId: string;
  followedAt: Date;
}
```

### 10. Marketplace Service

**Responsibilities:**
- Service listing management and discovery
- Vendor profile and verification management
- Search and filtering for event services
- Integration with event planning workflows

**Key Interfaces:**

```typescript
interface MarketplaceService {
  searchServices(query: SearchServicesDTO): Promise<ServiceListing[]>;
  getServicesByCategory(category: ServiceCategory): Promise<ServiceListing[]>;
  getVendorProfile(vendorId: string): Promise<VendorProfile>;
  getFeaturedServices(eventType?: string, location?: string): Promise<ServiceListing[]>;
  getServiceRecommendations(eventId: string): Promise<ServiceListing[]>;
}

interface SearchServicesDTO {
  query?: string;
  category?: ServiceCategory;
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

enum ServiceCategory {
  VENUE = 'VENUE',
  CATERING = 'CATERING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEOGRAPHY = 'VIDEOGRAPHY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  DECORATION = 'DECORATION',
  AUDIO_VISUAL = 'AUDIO_VISUAL',
  TRANSPORTATION = 'TRANSPORTATION',
  SECURITY = 'SECURITY',
  CLEANING = 'CLEANING',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  PRINTING = 'PRINTING',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}
```

### 11. Vendor Service

**Responsibilities:**
- Vendor registration and profile management
- Service listing creation and management
- Vendor verification workflow
- Portfolio and media management

**Key Interfaces:**

```typescript
interface VendorService {
  registerVendor(vendorData: CreateVendorDTO): Promise<VendorProfile>;
  updateVendorProfile(vendorId: string, updates: UpdateVendorDTO): Promise<VendorProfile>;
  createServiceListing(vendorId: string, serviceData: CreateServiceDTO): Promise<ServiceListing>;
  updateServiceListing(listingId: string, updates: UpdateServiceDTO): Promise<ServiceListing>;
  getVendorAnalytics(vendorId: string): Promise<VendorAnalytics>;
  submitVerificationDocuments(vendorId: string, documents: VerificationDocuments): Promise<void>;
}

interface CreateVendorDTO {
  businessName: string;
  description: string;
  contactInfo: ContactInfo;
  serviceCategories: ServiceCategory[];
  businessAddress: Address;
  businessLicense?: string;
  insuranceCertificate?: string;
  portfolio: MediaFile[];
}

interface CreateServiceDTO {
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
}

interface PricingModel {
  type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
  basePrice?: number;
  currency: string;
  minimumOrder?: number;
  packageDeals?: PackageDeal[];
}
```

### 12. Booking Service

**Responsibilities:**
- Booking request management
- Service agreement generation
- Timeline coordination with events
- Communication between organizers and vendors

**Key Interfaces:**

```typescript
interface BookingService {
  createBookingRequest(bookingData: CreateBookingDTO): Promise<BookingRequest>;
  updateBookingStatus(bookingId: string, status: BookingStatus): Promise<BookingRequest>;
  generateServiceAgreement(bookingId: string): Promise<ServiceAgreement>;
  getBookingsByEvent(eventId: string): Promise<BookingRequest[]>;
  getBookingsByVendor(vendorId: string): Promise<BookingRequest[]>;
  sendBookingMessage(bookingId: string, message: BookingMessage): Promise<void>;
}

interface CreateBookingDTO {
  eventId: string;
  serviceListingId: string;
  organizerId: string;
  serviceDate: Date;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  additionalNotes?: string;
}

enum BookingStatus {
  PENDING = 'PENDING',
  VENDOR_REVIEWING = 'VENDOR_REVIEWING',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

interface ServiceAgreement {
  id: string;
  bookingId: string;
  terms: string;
  deliverables: Deliverable[];
  paymentSchedule: PaymentMilestone[];
  cancellationPolicy: string;
  signedAt?: Date;
  organizerSignature?: string;
  vendorSignature?: string;
}
```

### 13. Payment Service

**Responsibilities:**
- Secure payment processing
- Escrow management
- Vendor payout automation
- Invoice and receipt generation

**Key Interfaces:**

```typescript
interface PaymentService {
  processPayment(paymentData: ProcessPaymentDTO): Promise<PaymentResult>;
  createEscrow(bookingId: string, amount: number): Promise<EscrowAccount>;
  releaseFunds(escrowId: string, milestoneId: string): Promise<PaymentResult>;
  generateInvoice(bookingId: string): Promise<Invoice>;
  getPaymentHistory(userId: string, userType: 'ORGANIZER' | 'VENDOR'): Promise<PaymentRecord[]>;
  processRefund(paymentId: string, amount: number, reason: string): Promise<RefundResult>;
}

interface ProcessPaymentDTO {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description: string;
  milestoneId?: string;
}

interface PaymentMethod {
  type: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  details: Record<string, any>;
}

interface EscrowAccount {
  id: string;
  bookingId: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
  milestones: PaymentMilestone[];
}
```

## Data Models

### Core Entities

```typescript
// User Entity
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  JUDGE = 'JUDGE',
  VOLUNTEER = 'VOLUNTEER',
  SPEAKER = 'SPEAKER'
}

enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// Event Entity
interface Event {
  id: string;
  name: string;
  description: string;
  mode: EventMode;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  registrationDeadline?: Date;
  organizerId: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  status: EventStatus;
  landingPageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Registration Entity
interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  formResponses: Record<string, any>;
  qrCode: string;
  registeredAt: Date;
  updatedAt: Date;
}

// Attendance Entity
interface Attendance {
  id: string;
  registrationId: string;
  sessionId?: string;
  checkInTime: Date;
  checkInMethod: 'QR_SCAN' | 'MANUAL';
  volunteerId?: string;
}

// Rubric Entity
interface Rubric {
  id: string;
  eventId: string;
  criteria: RubricCriterion[];
  createdAt: Date;
}

// Score Entity
interface Score {
  id: string;
  submissionId: string;
  judgeId: string;
  rubricId: string;
  scores: Record<string, number>;
  submittedAt: Date;
}

// Certificate Entity (as defined above)

// Communication Log Entity
interface CommunicationLog {
  id: string;
  eventId: string;
  senderId: string;
  recipientCount: number;
  subject: string;
  sentAt: Date;
  status: 'SENT' | 'FAILED' | 'PARTIAL';
}

// Organization Entity
interface Organization {
  id: string;
  name: string;
  description: string;
  category: OrganizationCategory;
  verificationStatus: VerificationStatus;
  branding: OrganizationBranding;
  socialLinks: Record<string, string>;
  pageUrl: string;
  followerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

enum OrganizationCategory {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  INDUSTRY = 'INDUSTRY',
  NON_PROFIT = 'NON_PROFIT'
}

enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

interface OrganizationBranding {
  logoUrl: string;
  bannerUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Organization Admin Entity
interface OrganizationAdmin {
  id: string;
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN';
  addedAt: Date;
}

// Follow Entity
interface Follow {
  id: string;
  userId: string;
  organizationId: string;
  followedAt: Date;
}

// Event Visibility Extension
enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED'
}

// Marketplace Entities
interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  contactInfo: ContactInfo;
  serviceCategories: ServiceCategory[];
  businessAddress: Address;
  verificationStatus: VerificationStatus;
  verificationDocuments: VerificationDocuments;
  rating: number;
  reviewCount: number;
  portfolio: MediaFile[];
  businessHours: BusinessHours;
  responseTime: number; // in hours
  completionRate: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  viewCount: number;
  inquiryCount: number;
  bookingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingRequest {
  id: string;
  eventId: string;
  serviceListingId: string;
  organizerId: string;
  vendorId: string;
  status: BookingStatus;
  serviceDate: Date;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
  messages: BookingMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  attachments?: MediaFile[];
  sentAt: Date;
}

interface VendorReview {
  id: string;
  vendorId: string;
  bookingId: string;
  organizerId: string;
  rating: number; // 1-5
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
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRecord {
  id: string;
  bookingId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: PaymentMethod;
  transactionId: string;
  platformFee: number;
  vendorPayout: number;
  processedAt: Date;
  createdAt: Date;
}

// Supporting Types
interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

interface Address {
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

interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
  order: number;
}

interface AvailabilityCalendar {
  timezone: string;
  recurringAvailability: WeeklySchedule;
  blockedDates: Date[];
  customAvailability: CustomAvailabilitySlot[];
}

interface WeeklySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

interface CustomAvailabilitySlot {
  date: Date;
  available: boolean;
  timeSlots?: TimeSlot[];
}

interface PackageDeal {
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  packagePrice: number;
  savings: number;
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: Date;
}

interface PaymentMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: Date;
}
```

### Database Relationships

```
Users (1) ──── (N) Events [organizerId]
Events (1) ──── (N) Registrations
Users (1) ──── (N) Registrations
Registrations (1) ──── (N) Attendance
Events (1) ──── (1) Rubric
Rubric (1) ──── (N) Scores
Users (1) ──── (N) Scores [judgeId]
Events (1) ──── (N) Certificates
Users (1) ──── (N) Certificates [recipientId]
Events (1) ──── (N) CommunicationLogs
Organizations (1) ──── (N) Events [organizationId]
Organizations (1) ──── (N) OrganizationAdmins
Users (1) ──── (N) OrganizationAdmins
Organizations (1) ──── (N) Follows
Users (1) ──── (N) Follows
Users (1) ──── (1) VendorProfile [userId]
VendorProfile (1) ──── (N) ServiceListings
Events (1) ──── (N) BookingRequests
ServiceListings (1) ──── (N) BookingRequests
Users (1) ──── (N) BookingRequests [organizerId]
VendorProfile (1) ──── (N) BookingRequests [vendorId]
BookingRequests (1) ──── (N) BookingMessages
BookingRequests (1) ──── (N) PaymentRecords
VendorProfile (1) ──── (N) VendorReviews
BookingRequests (1) ──── (1) VendorReviews
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all testable acceptance criteria, the following properties have been consolidated to eliminate redundancy and provide comprehensive validation coverage:

### Property 1: Role assignment consistency
*For any* user account creation, the assigned role should match the registration type (Organizer accounts get ORGANIZER role with admin privileges, Participant accounts get PARTICIPANT role with standard permissions).
**Validates: Requirements 1.2, 1.3, 3.2**

### Property 2: Sub-role permission enforcement
*For any* user with an assigned sub-role (Volunteer, Judge, Speaker), the system should enforce only the permissions associated with that specific sub-role.
**Validates: Requirements 1.5**

### Property 3: Account state transitions
*For any* user account, state transitions should follow the valid flow: Pending → Email Confirmed → Active (for Organizers with admin approval, for Participants after email verification).
**Validates: Requirements 2.1, 2.2, 2.3, 3.3**

### Property 4: Dashboard access control
*For any* user with completed profile, the appropriate dashboard (Organizer or Participant) should be accessible based on their role.
**Validates: Requirements 2.5, 3.5**

### Property 5: Event data round-trip consistency
*For any* event with timeline, branding, and configuration data, storing and retrieving the event should preserve all data fields without loss or corruption.
**Validates: Requirements 4.2, 4.3, 4.5**

### Property 6: Event mode validation
*For any* event creation, the system should enforce mode-specific requirements: Offline requires venue address, Online requires virtual links, Hybrid requires both.
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 7: Mode-appropriate feature display
*For any* event with a configured mode, only features appropriate to that mode should be displayed to participants (e.g., venue map for Offline, meeting links for Online).
**Validates: Requirements 5.5**

### Property 8: Capacity enforcement and waitlist creation
*For any* event with a capacity limit, registration attempts beyond capacity should be rejected for confirmed status and automatically placed on the waitlist.
**Validates: Requirements 6.2, 6.3**

### Property 9: Registration validation
*For any* registration submission, all required fields must be present and valid, otherwise the registration should be rejected.
**Validates: Requirements 6.4**

### Property 10: Waitlist approval state transition
*For any* waitlisted registration, organizer approval should transition the status from WAITLISTED to CONFIRMED.
**Validates: Requirements 6.5**

### Property 11: QR code uniqueness
*For any* set of participant registrations, each should receive a unique QR code that can be used to identify that specific registration.
**Validates: Requirements 7.1**

### Property 12: QR code validation and attendance recording
*For any* valid participant QR code, scanning should create an attendance record with timestamp and update the participant's attendance status; invalid QR codes should be rejected with an error.
**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 13: Recipient filtering accuracy
*For any* communication with specified recipient criteria (role, registration status, attendance), the filtered recipient list should contain only participants matching all specified criteria.
**Validates: Requirements 8.2, 8.5**

### Property 14: Communication logging
*For any* sent communication, a log entry should be created containing the timestamp, recipient count, and delivery status.
**Validates: Requirements 8.4**

### Property 15: Rubric criteria validation
*For any* rubric with defined criteria and weights, the sum of all criterion weights should equal 100, and each criterion should have a positive maximum score.
**Validates: Requirements 9.1**

### Property 16: Judge submission access control
*For any* judge accessing the judging module, only submissions explicitly assigned to that judge should be visible.
**Validates: Requirements 9.2**

### Property 17: Score completeness validation
*For any* score submission, all rubric criteria must have assigned scores, otherwise the submission should be rejected.
**Validates: Requirements 9.3**

### Property 18: Weighted score calculation
*For any* submission with complete judge scores, the final score should be calculated as the weighted average of all criterion scores using the rubric weights.
**Validates: Requirements 9.4**

### Property 19: Leaderboard ranking consistency
*For any* set of submissions with final scores, the leaderboard should rank them in descending order by score, with ties handled consistently.
**Validates: Requirements 9.5**

### Property 20: Event URL uniqueness
*For any* created event, the generated landing page URL should be unique across all events in the system.
**Validates: Requirements 10.1**

### Property 21: Landing page data synchronization
*For any* event with updated details, the landing page should reflect those changes when retrieved.
**Validates: Requirements 10.2**

### Property 22: Landing page content completeness
*For any* event landing page, it should contain the event branding, schedule, and registration options.
**Validates: Requirements 10.3**

### Property 23: Leaderboard visibility control
*For any* event, the leaderboard should be visible on the landing page if and only if the organizer has enabled it.
**Validates: Requirements 11.1, 11.4**

### Property 24: Leaderboard content completeness
*For any* displayed leaderboard, each entry should include ranking position, team/participant name, and score.
**Validates: Requirements 11.3**

### Property 25: Certificate criteria round-trip
*For any* defined certificate criteria, storing and retrieving the criteria should preserve all trigger conditions.
**Validates: Requirements 12.1**

### Property 26: Certificate type selection
*For any* participant meeting certificate criteria, the generated certificate type should match the criteria (Merit for winners, Completion for attendees, Appreciation for judges/speakers).
**Validates: Requirements 12.2**

### Property 27: Certificate ID uniqueness
*For any* set of generated certificates, each should have a unique Certificate ID that can be used for verification.
**Validates: Requirements 12.3**

### Property 28: Certificate QR code embedding
*For any* generated certificate PDF, it should contain an embedded QR code that links to the verification portal with the certificate's unique ID.
**Validates: Requirements 12.4**

### Property 29: Certificate PDF generation
*For any* certificate generation request, a high-resolution PDF file should be created and stored.
**Validates: Requirements 13.1**

### Property 30: Certificate distribution
*For any* generated certificate, it should be sent as an email attachment to the recipient, with distribution logged including timestamp.
**Validates: Requirements 13.2, 13.3**

### Property 31: Certificate distribution retry
*For any* failed certificate distribution, the system should attempt retry and log the failure.
**Validates: Requirements 13.4**

### Property 32: Certificate verification lookup
*For any* certificate ID provided to the verification portal, the system should query the database and return certificate details if valid, or an error message if invalid.
**Validates: Requirements 14.2, 14.3, 14.4**

### Property 33: Verification portal public access
*For any* request to the verification portal, access should be granted without requiring authentication.
**Validates: Requirements 14.5**

### Property 34: Analytics calculation accuracy
*For any* event with registration and attendance data, calculated metrics (registration counts over time, check-in rates, score distributions) should accurately reflect the underlying data.
**Validates: Requirements 15.1, 15.2, 15.3**

### Property 35: Report export format
*For any* analytics export request, the generated file should be in the requested format (CSV or PDF) and contain all relevant data.
**Validates: Requirements 15.4**

### Property 36: Organization profile data persistence
*For any* organization with name, description, category, and branding data, storing and retrieving the organization should preserve all data fields without loss or corruption.
**Validates: Requirements 16.1, 16.3, 16.4**

### Property 37: Organization URL uniqueness
*For any* created organization, the generated organization page URL should be unique across all organizations in the system.
**Validates: Requirements 16.2**

### Property 38: Organization verification state transitions
*For any* organization, verification status transitions should follow the valid flow: Pending → Verified or Pending → Rejected, with appropriate notifications sent.
**Validates: Requirements 17.1, 17.3, 17.4**

### Property 39: Organization admin access control
*For any* organization admin, they should have full access to manage the organization's profile, events, and team members.
**Validates: Requirements 18.2, 18.3**

### Property 40: Multiple admins support
*For any* organization, multiple users can be granted Organization Admin role simultaneously without conflicts.
**Validates: Requirements 18.4**

### Property 41: Event-organization linking
*For any* event created by an Organization Admin, the event should be linked to the organization and display organization branding.
**Validates: Requirements 19.1, 19.2**

### Property 42: Event visibility enforcement
*For any* event with visibility set to Public, it should be searchable and visible on the organization page; Private events should require authorization; Unlisted events should be accessible only via direct link.
**Validates: Requirements 19.3, 19.4, 19.5**

### Property 43: Organization search accuracy
*For any* organization search query with filters (category, verification status), the results should contain only organizations matching all specified criteria.
**Validates: Requirements 20.2, 20.3**

### Property 44: Search result ranking consistency
*For any* set of organizations in search results, they should be ranked by verification status (verified first) and follower count in descending order.
**Validates: Requirements 20.5**

### Property 45: Organization event feed ordering
*For any* organization page, events should be displayed with upcoming events before past events, sorted by start date.
**Validates: Requirements 21.2**

### Property 46: Private event visibility for members
*For any* user who is an organization member, they should see both public and private events on the organization page; non-members should see only public events.
**Validates: Requirements 21.3**

### Property 47: Follow relationship consistency
*For any* follow action, the follower count should increment by 1; for any unfollow action, the follower count should decrement by 1.
**Validates: Requirements 22.2, 22.3**

### Property 48: Follower notification delivery
*For any* new event published by an organization, all followers should receive a notification.
**Validates: Requirements 22.4**

### Property 49: Organization analytics accuracy
*For any* organization with events and followers, calculated metrics (event count, follower growth, registration counts, attendance rates) should accurately reflect the underlying data.
**Validates: Requirements 23.1, 23.2, 23.3**

### Property 50: Private event access control
*For any* private event, only users with valid invite links or meeting member criteria should be able to access and register; unauthorized access attempts should be denied.
**Validates: Requirements 24.2, 24.3, 24.4**

### Property 51: Private event invite link uniqueness
*For any* private event, the generated invite link should be unique and grant access only to that specific event.
**Validates: Requirements 24.1**

### Property 52: Vendor profile data persistence
*For any* vendor with business information, contact details, and service categories, storing and retrieving the vendor profile should preserve all data fields without loss or corruption.
**Validates: Requirements 25.1, 25.3, 25.5**

### Property 53: Service listing search accuracy
*For any* service search query with filters (category, location, date range, budget), the results should contain only services matching all specified criteria.
**Validates: Requirements 28.1, 28.2**

### Property 54: Vendor verification state transitions
*For any* vendor, verification status transitions should follow the valid flow: Pending → Verified or Pending → Rejected, with appropriate notifications and badge display.
**Validates: Requirements 27.2, 27.3**

### Property 55: Service pricing model validation
*For any* service listing with pricing information, the pricing model should be consistent with the specified type (fixed, hourly, per-person, custom quote) and include all required fields.
**Validates: Requirements 26.2**

### Property 56: Booking request state transitions
*For any* booking request, status transitions should follow valid business rules: Pending → Vendor Reviewing → Quote Sent → Quote Accepted → Confirmed → Completed, with proper authorization at each step.
**Validates: Requirements 29.1, 29.2**

### Property 57: Payment processing integrity
*For any* payment transaction, the total amount should equal the sum of vendor payout and platform commission, with proper escrow management and milestone tracking.
**Validates: Requirements 29.3, 29.4**

### Property 58: Review authenticity validation
*For any* vendor review, it should be linked to a verified booking completion and include all required rating components (service quality, communication, timeliness, value).
**Validates: Requirements 30.1, 30.2**

### Property 59: Vendor analytics accuracy
*For any* vendor with service listings and bookings, calculated metrics (listing views, inquiry conversion rates, booking success ratios) should accurately reflect the underlying data.
**Validates: Requirements 31.1, 31.2**

### Property 60: Event-marketplace integration consistency
*For any* event with marketplace bookings, vendor deliverables and timelines should be properly synchronized with the event project management system.
**Validates: Requirements 32.2, 32.4**

## Error Handling

### Error Categories

**1. Validation Errors (400 Bad Request)**
- Invalid input data (missing required fields, invalid formats)
- Business rule violations (capacity exceeded, invalid state transitions)
- Authentication failures (invalid credentials)

**2. Authorization Errors (403 Forbidden)**
- Insufficient permissions for requested action
- Role-based access control violations

**3. Not Found Errors (404 Not Found)**
- Requested resource does not exist
- Invalid IDs or URLs

**4. Conflict Errors (409 Conflict)**
- Duplicate entries (email already registered)
- Concurrent modification conflicts

**5. Server Errors (500 Internal Server Error)**
- Database connection failures
- External service failures (email, storage)
- Unexpected exceptions

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### Error Handling Strategies

**Database Errors:**
- Implement connection pooling with retry logic
- Use transactions for multi-step operations
- Log all database errors for monitoring

**External Service Failures:**
- Implement circuit breaker pattern for email and storage services
- Queue failed operations for retry
- Provide graceful degradation (e.g., store email in queue if service is down)

**Validation Errors:**
- Validate input at API boundary before processing
- Return detailed validation errors to help users correct issues
- Use schema validation libraries (e.g., Zod, Joi)

**Authentication/Authorization Errors:**
- Return generic error messages to prevent information leakage
- Log security-related errors for audit
- Implement rate limiting to prevent brute force attacks

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

**Backend Unit Tests:**
- Service layer business logic (score calculation, filtering, validation)
- Data transformation functions
- Utility functions (QR code generation, PDF creation)
- Authentication and authorization logic

**Frontend Unit Tests:**
- React component rendering
- Form validation logic
- State management functions
- Utility functions

**Testing Framework:** Jest for both frontend and backend
**Coverage Target:** 80% code coverage for critical paths

### Property-Based Testing

Property-based testing will verify that universal properties hold across all inputs using **fast-check** library for JavaScript/TypeScript.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Use custom generators for domain-specific data (events, users, registrations)
- Shrink failing cases to minimal reproducible examples

**Property Test Tagging:**
Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: thittam1hub, Property {number}: {property_text}
```

**Key Property Tests:**
- Role assignment and permission enforcement (Properties 1, 2)
- State transition validity (Properties 3, 10)
- Data round-trip consistency (Properties 5, 25)
- Validation rules (Properties 6, 9, 17)
- Uniqueness constraints (Properties 11, 20, 27)
- Calculation accuracy (Properties 18, 34)
- Access control (Properties 16, 33)

### Integration Testing

Integration tests will verify that components work correctly together:

**API Integration Tests:**
- Complete user flows (registration → verification → login)
- Event lifecycle (creation → registration → attendance → certificates)
- Multi-service interactions (judging → scoring → leaderboard)

**Database Integration Tests:**
- CRUD operations with real database
- Transaction handling
- Constraint enforcement

**Testing Framework:** Jest with Supertest for API testing
**Test Database:** Separate PostgreSQL instance for testing

### End-to-End Testing

E2E tests will verify complete user workflows through the UI:

**Critical Flows:**
- Organizer onboarding and event creation
- Participant registration and check-in
- Judge scoring and leaderboard updates
- Certificate generation and verification

**Testing Framework:** Playwright or Cypress
**Test Environment:** Staging environment with test data

### Testing Best Practices

1. **Test Isolation:** Each test should be independent and not rely on other tests
2. **Test Data:** Use factories or fixtures for consistent test data generation
3. **Mocking:** Mock external services (email, storage) in unit and integration tests
4. **Assertions:** Use descriptive assertions that clearly indicate what is being tested
5. **Cleanup:** Ensure tests clean up after themselves (database, files)
6. **CI/CD Integration:** Run all tests on every commit and pull request

## Security Considerations

### Authentication
- Use bcrypt with salt rounds ≥ 10 for password hashing
- Implement JWT with short expiration (15 minutes for access tokens)
- Use refresh tokens with longer expiration (7 days) stored securely
- Implement token rotation on refresh

### Authorization
- Enforce role-based access control at API layer
- Validate permissions on every protected endpoint
- Use middleware for consistent authorization checks
- Implement principle of least privilege

### Data Protection
- Encrypt sensitive data at rest (passwords, tokens)
- Use HTTPS for all communications
- Implement CORS with whitelist of allowed origins
- Sanitize all user inputs to prevent XSS and SQL injection

### Certificate Security
- Use cryptographically secure random IDs for certificates
- Implement rate limiting on verification portal to prevent enumeration
- Store certificate PDFs in private storage with signed URLs
- Log all verification attempts for audit

### API Security
- Implement rate limiting (e.g., 100 requests per minute per IP)
- Use API keys for mobile app authentication
- Implement CSRF protection for state-changing operations
- Validate and sanitize all file uploads

## Performance Considerations

### Database Optimization
- Index frequently queried fields (user email, event ID, certificate ID)
- Use database connection pooling
- Implement query result caching for read-heavy operations
- Use pagination for large result sets

### API Performance
- Implement response caching for public endpoints (landing pages, leaderboards)
- Use compression for API responses
- Optimize N+1 queries with eager loading
- Implement request batching where appropriate

### Frontend Performance
- Code splitting for route-based lazy loading
- Optimize images and assets
- Implement virtual scrolling for large lists
- Use React.memo and useMemo for expensive computations

### Scalability
- Design stateless API for horizontal scaling
- Use message queue for async operations (email, certificate generation)
- Implement CDN for static assets
- Consider read replicas for database scaling

## Deployment Architecture

### Infrastructure
- **Application Servers:** Node.js instances behind load balancer
- **Database:** PostgreSQL with automated backups
- **Storage:** S3 or equivalent for certificates and assets
- **Email:** SendGrid or AWS SES
- **Monitoring:** Application performance monitoring (APM) and logging

### Environments
- **Development:** Local development with Docker Compose
- **Staging:** Cloud-hosted environment for testing
- **Production:** High-availability setup with redundancy

### CI/CD Pipeline
1. Code commit triggers automated tests
2. Successful tests trigger build process
3. Build artifacts deployed to staging
4. Manual approval for production deployment
5. Automated rollback on deployment failure

## Future Enhancements

### Phase 2 Features
- Mobile app for volunteers (native iOS/Android)
- Advanced analytics with custom reports
- Integration with payment gateways for paid events
- Multi-language support

### Phase 3 Features
- AI-powered event recommendations
- Automated event scheduling optimization
- Integration with calendar systems (Google Calendar, Outlook)
- Advanced networking features for participants

## Appendix

### API Endpoint Summary

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-email
- POST /api/auth/refresh-token

**Events:**
- POST /api/events
- GET /api/events/:id
- PUT /api/events/:id
- GET /api/events/:id/landing-page
- GET /api/events/:id/analytics

**Registrations:**
- POST /api/registrations
- GET /api/registrations/:id
- PUT /api/registrations/:id/status
- GET /api/events/:id/registrations

**Attendance:**
- POST /api/attendance/check-in
- GET /api/events/:id/attendance
- GET /api/registrations/:id/qr-code

**Judging:**
- POST /api/rubrics
- POST /api/scores
- GET /api/events/:id/leaderboard

**Certificates:**
- POST /api/certificates/generate
- POST /api/certificates/distribute
- GET /api/certificates/verify/:id

**Communications:**
- POST /api/communications/email
- GET /api/communications/templates

### Database Schema Summary

**Tables:**
- users
- events
- registrations
- attendance
- rubrics
- scores
- certificates
- communication_logs
- event_sessions
- event_templates
- organizations
- organization_admins
- follows
- vendor_profiles
- service_listings
- booking_requests
- booking_messages
- vendor_reviews
- payment_records
- service_agreements

**Key Indexes:**
- users(email)
- events(organizer_id)
- registrations(event_id, user_id)
- certificates(certificate_id)
- attendance(registration_id)
- organizations(page_url)
- vendor_profiles(user_id)
- service_listings(vendor_id, category)
- booking_requests(event_id, vendor_id)
- vendor_reviews(vendor_id, booking_id)
- payment_records(booking_id)
