-- Create enums
create type "UserRole" as enum ('SUPER_ADMIN','ORGANIZER','PARTICIPANT','JUDGE','VOLUNTEER','SPEAKER');
create type "UserStatus" as enum ('PENDING','ACTIVE','SUSPENDED');
create type "EventMode" as enum ('OFFLINE','ONLINE','HYBRID');
create type "EventStatus" as enum ('DRAFT','PUBLISHED','ONGOING','COMPLETED','CANCELLED');
create type "RegistrationStatus" as enum ('PENDING','CONFIRMED','WAITLISTED','CANCELLED');
create type "CertificateType" as enum ('MERIT','COMPLETION','APPRECIATION');
create type "OrganizationCategory" as enum ('COLLEGE','COMPANY','INDUSTRY','NON_PROFIT');
create type "VerificationStatus" as enum ('PENDING','VERIFIED','REJECTED');
create type "EventVisibility" as enum ('PUBLIC','PRIVATE','UNLISTED');
create type "WorkspaceStatus" as enum ('PROVISIONING','ACTIVE','WINDING_DOWN','DISSOLVED');
create type "WorkspaceRole" as enum ('WORKSPACE_OWNER','TEAM_LEAD','EVENT_COORDINATOR','VOLUNTEER_MANAGER','TECHNICAL_SPECIALIST','MARKETING_LEAD','GENERAL_VOLUNTEER');
create type "TaskStatus" as enum ('NOT_STARTED','IN_PROGRESS','REVIEW_REQUIRED','COMPLETED','BLOCKED');
create type "TaskPriority" as enum ('LOW','MEDIUM','HIGH','URGENT');
create type "TaskCategory" as enum ('SETUP','MARKETING','LOGISTICS','TECHNICAL','REGISTRATION','POST_EVENT');
create type "ChannelType" as enum ('GENERAL','TASK_SPECIFIC','ROLE_BASED','ANNOUNCEMENT');
create type "MemberStatus" as enum ('INVITED','ACTIVE','INACTIVE');
create type "ServiceCategory" as enum ('VENUE','CATERING','PHOTOGRAPHY','VIDEOGRAPHY','ENTERTAINMENT','DECORATION','AUDIO_VISUAL','TRANSPORTATION','SECURITY','CLEANING','EQUIPMENT_RENTAL','PRINTING','MARKETING','OTHER');
create type "BookingStatus" as enum ('PENDING','VENDOR_REVIEWING','QUOTE_SENT','QUOTE_ACCEPTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','DISPUTED');
create type "PricingType" as enum ('FIXED','HOURLY','PER_PERSON','CUSTOM_QUOTE');
create type "PaymentStatus" as enum ('PENDING','COMPLETED','FAILED','REFUNDED');
create type "PaymentMethodType" as enum ('CREDIT_CARD','BANK_TRANSFER','DIGITAL_WALLET');

-- User
create table "User" (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  "passwordHash" text not null,
  name text not null,
  role "UserRole" not null,
  status "UserStatus" not null default 'PENDING',
  "emailVerified" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "User_email_idx" on "User"(email);

-- Organization
create table "Organization" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category "OrganizationCategory" not null,
  "verificationStatus" "VerificationStatus" not null default 'PENDING',
  branding jsonb not null,
  "socialLinks" jsonb,
  "pageUrl" text not null unique,
  "followerCount" integer not null default 0,
  "rejectionReason" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "Organization_pageUrl_idx" on "Organization"("pageUrl");
create index "Organization_category_idx" on "Organization"(category);
create index "Organization_verificationStatus_idx" on "Organization"("verificationStatus");

-- Event
create table "Event" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  mode "EventMode" not null,
  "startDate" timestamptz not null,
  "endDate" timestamptz not null,
  capacity integer,
  "registrationDeadline" timestamptz,
  "organizerId" uuid not null,
  "organizationId" uuid,
  visibility "EventVisibility" not null default 'PUBLIC',
  branding jsonb not null,
  venue jsonb,
  "virtualLinks" jsonb,
  status "EventStatus" not null default 'DRAFT',
  "landingPageUrl" text not null unique,
  "inviteLink" text unique,
  "leaderboardEnabled" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Event_organizer_fkey" foreign key ("organizerId") references "User"(id),
  constraint "Event_organization_fkey" foreign key ("organizationId") references "Organization"(id)
);
create index "Event_organizerId_idx" on "Event"("organizerId");
create index "Event_organizationId_idx" on "Event"("organizationId");
create index "Event_landingPageUrl_idx" on "Event"("landingPageUrl");
create index "Event_visibility_idx" on "Event"(visibility);

-- Workspace & collaboration
create table "Workspace" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null unique,
  name text not null,
  description text,
  status "WorkspaceStatus" not null default 'PROVISIONING',
  settings jsonb,
  "templateId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "dissolvedAt" timestamptz,
  constraint "Workspace_event_fkey" foreign key ("eventId") references "Event"(id) on delete cascade
);
create index "Workspace_eventId_idx" on "Workspace"("eventId");
create index "Workspace_status_idx" on "Workspace"(status);
create index "Workspace_templateId_idx" on "Workspace"("templateId");

create table "TeamMember" (
  id uuid primary key default gen_random_uuid(),
  "workspaceId" uuid not null,
  "userId" uuid not null,
  role "WorkspaceRole" not null,
  permissions jsonb,
  "joinedAt" timestamptz not null default now(),
  "leftAt" timestamptz,
  "invitedBy" uuid not null,
  status "MemberStatus" not null default 'ACTIVE',
  constraint "TeamMember_workspace_fkey" foreign key ("workspaceId") references "Workspace"(id) on delete cascade,
  constraint "TeamMember_user_fkey" foreign key ("userId") references "User"(id),
  constraint "TeamMember_inviter_fkey" foreign key ("invitedBy") references "User"(id)
);
create unique index "TeamMember_workspace_user_unique" on "TeamMember"("workspaceId","userId");
create index "TeamMember_workspaceId_idx" on "TeamMember"("workspaceId");
create index "TeamMember_userId_idx" on "TeamMember"("userId");
create index "TeamMember_role_idx" on "TeamMember"(role);

create table "WorkspaceTask" (
  id uuid primary key default gen_random_uuid(),
  "workspaceId" uuid not null,
  "assigneeId" uuid,
  "creatorId" uuid not null,
  title text not null,
  description text not null,
  category "TaskCategory" not null,
  priority "TaskPriority" not null default 'MEDIUM',
  status "TaskStatus" not null default 'NOT_STARTED',
  progress integer not null default 0,
  "dueDate" timestamptz,
  dependencies jsonb,
  tags text[] not null default '{}',
  metadata jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "completedAt" timestamptz,
  constraint "WorkspaceTask_workspace_fkey" foreign key ("workspaceId") references "Workspace"(id) on delete cascade,
  constraint "WorkspaceTask_assignee_fkey" foreign key ("assigneeId") references "TeamMember"(id),
  constraint "WorkspaceTask_creator_fkey" foreign key ("creatorId") references "TeamMember"(id)
);
create index "WorkspaceTask_workspaceId_idx" on "WorkspaceTask"("workspaceId");
create index "WorkspaceTask_assigneeId_idx" on "WorkspaceTask"("assigneeId");
create index "WorkspaceTask_creatorId_idx" on "WorkspaceTask"("creatorId");
create index "WorkspaceTask_status_idx" on "WorkspaceTask"(status);
create index "WorkspaceTask_priority_idx" on "WorkspaceTask"(priority);
create index "WorkspaceTask_dueDate_idx" on "WorkspaceTask"("dueDate");

create table "WorkspaceChannel" (
  id uuid primary key default gen_random_uuid(),
  "workspaceId" uuid not null,
  name text not null,
  type "ChannelType" not null,
  description text,
  members text[] not null default '{}',
  "isPrivate" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "WorkspaceChannel_workspace_fkey" foreign key ("workspaceId") references "Workspace"(id) on delete cascade
);
create index "WorkspaceChannel_workspaceId_idx" on "WorkspaceChannel"("workspaceId");
create index "WorkspaceChannel_type_idx" on "WorkspaceChannel"(type);

create table "WorkspaceMessage" (
  id uuid primary key default gen_random_uuid(),
  "channelId" uuid not null,
  "senderId" uuid not null,
  content text not null,
  attachments jsonb,
  "isPriority" boolean not null default false,
  "sentAt" timestamptz not null default now(),
  "editedAt" timestamptz,
  "deletedAt" timestamptz,
  constraint "WorkspaceMessage_channel_fkey" foreign key ("channelId") references "WorkspaceChannel"(id) on delete cascade,
  constraint "WorkspaceMessage_sender_fkey" foreign key ("senderId") references "User"(id)
);
create index "WorkspaceMessage_channelId_idx" on "WorkspaceMessage"("channelId");
create index "WorkspaceMessage_senderId_idx" on "WorkspaceMessage"("senderId");
create index "WorkspaceMessage_sentAt_idx" on "WorkspaceMessage"("sentAt");
create index "WorkspaceMessage_isPriority_idx" on "WorkspaceMessage"("isPriority");

-- Registration & attendance
create table "Registration" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null,
  "userId" uuid not null,
  status "RegistrationStatus" not null default 'PENDING',
  metadata jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Registration_event_fkey" foreign key ("eventId") references "Event"(id),
  constraint "Registration_user_fkey" foreign key ("userId") references "User"(id)
);
create unique index "Registration_event_user_unique" on "Registration"("eventId","userId");
create index "Registration_eventId_idx" on "Registration"("eventId");
create index "Registration_userId_idx" on "Registration"("userId");
create index "Registration_status_idx" on "Registration"(status);

create table "Attendance" (
  id uuid primary key default gen_random_uuid(),
  "registrationId" uuid not null,
  "sessionId" text,
  "checkInTime" timestamptz not null default now(),
  "checkInMethod" text not null,
  "volunteerId" text,
  constraint "Attendance_registration_fkey" foreign key ("registrationId") references "Registration"(id)
);
create index "Attendance_registrationId_idx" on "Attendance"("registrationId");

-- Judging & scoring
create table "Rubric" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null unique,
  criteria jsonb not null,
  "createdAt" timestamptz not null default now(),
  constraint "Rubric_event_fkey" foreign key ("eventId") references "Event"(id)
);

create table "Submission" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null,
  "rubricId" uuid not null,
  "teamName" text not null,
  description text,
  metadata jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Submission_rubric_fkey" foreign key ("rubricId") references "Rubric"(id)
);
create index "Submission_eventId_idx" on "Submission"("eventId");
create index "Submission_rubricId_idx" on "Submission"("rubricId");

create table "Score" (
  id uuid primary key default gen_random_uuid(),
  "submissionId" uuid not null,
  "judgeId" uuid not null,
  "rubricId" uuid not null,
  scores jsonb not null,
  "submittedAt" timestamptz not null default now(),
  constraint "Score_judge_fkey" foreign key ("judgeId") references "User"(id),
  constraint "Score_rubric_fkey" foreign key ("rubricId") references "Rubric"(id),
  constraint "Score_submission_fkey" foreign key ("submissionId") references "Submission"(id)
);
create index "Score_submissionId_idx" on "Score"("submissionId");
create index "Score_judgeId_idx" on "Score"("judgeId");
create index "Score_rubricId_idx" on "Score"("rubricId");

-- Certificates & communication
create table "Certificate" (
  id uuid primary key default gen_random_uuid(),
  "certificateId" text not null unique,
  "recipientId" uuid not null,
  "eventId" uuid not null,
  type "CertificateType" not null,
  "pdfUrl" text not null,
  "qrCodeUrl" text not null,
  metadata jsonb not null,
  "issuedAt" timestamptz not null default now(),
  "distributedAt" timestamptz,
  constraint "Certificate_recipient_fkey" foreign key ("recipientId") references "User"(id),
  constraint "Certificate_event_fkey" foreign key ("eventId") references "Event"(id)
);
create index "Certificate_certificateId_idx" on "Certificate"("certificateId");
create index "Certificate_recipientId_idx" on "Certificate"("recipientId");
create index "Certificate_eventId_idx" on "Certificate"("eventId");

create table "CommunicationLog" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null,
  "senderId" uuid not null,
  "recipientCount" integer not null,
  subject text not null,
  "sentAt" timestamptz not null default now(),
  status text not null,
  metadata jsonb,
  constraint "CommunicationLog_event_fkey" foreign key ("eventId") references "Event"(id),
  constraint "CommunicationLog_sender_fkey" foreign key ("senderId") references "User"(id)
);
create index "CommunicationLog_eventId_idx" on "CommunicationLog"("eventId");
create index "CommunicationLog_senderId_idx" on "CommunicationLog"("senderId");

-- Organization relations
create table "OrganizationAdmin" (
  id uuid primary key default gen_random_uuid(),
  "organizationId" uuid not null,
  "userId" uuid not null,
  role text not null default 'ADMIN',
  "addedAt" timestamptz not null default now(),
  constraint "OrganizationAdmin_organization_fkey" foreign key ("organizationId") references "Organization"(id) on delete cascade,
  constraint "OrganizationAdmin_user_fkey" foreign key ("userId") references "User"(id) on delete cascade
);
create unique index "OrganizationAdmin_org_user_unique" on "OrganizationAdmin"("organizationId","userId");
create index "OrganizationAdmin_organizationId_idx" on "OrganizationAdmin"("organizationId");
create index "OrganizationAdmin_userId_idx" on "OrganizationAdmin"("userId");

create table "Follow" (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null,
  "organizationId" uuid not null,
  "followedAt" timestamptz not null default now(),
  constraint "Follow_user_fkey" foreign key ("userId") references "User"(id) on delete cascade,
  constraint "Follow_organization_fkey" foreign key ("organizationId") references "Organization"(id) on delete cascade
);
create unique index "Follow_user_org_unique" on "Follow"("userId","organizationId");
create index "Follow_userId_idx" on "Follow"("userId");
create index "Follow_organizationId_idx" on "Follow"("organizationId");

-- Marketplace & payments
create table "VendorProfile" (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null unique,
  "businessName" text not null,
  description text not null,
  "contactInfo" jsonb not null,
  "serviceCategories" "ServiceCategory"[] not null,
  "businessAddress" jsonb not null,
  "verificationStatus" "VerificationStatus" not null default 'PENDING',
  "verificationDocuments" jsonb,
  rating double precision not null default 0,
  "reviewCount" integer not null default 0,
  portfolio jsonb not null,
  "businessHours" jsonb,
  "responseTime" integer not null default 24,
  "completionRate" double precision not null default 100,
  "rejectionReason" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "VendorProfile_user_fkey" foreign key ("userId") references "User"(id) on delete cascade
);
create index "VendorProfile_userId_idx" on "VendorProfile"("userId");
create index "VendorProfile_verificationStatus_idx" on "VendorProfile"("verificationStatus");
create index "VendorProfile_serviceCategories_idx" on "VendorProfile" using gin ("serviceCategories");

create table "ServiceListing" (
  id uuid primary key default gen_random_uuid(),
  "vendorId" uuid not null,
  title text not null,
  description text not null,
  category "ServiceCategory" not null,
  pricing jsonb not null,
  availability jsonb not null,
  "serviceArea" text[] not null,
  requirements text,
  inclusions text[] not null,
  exclusions text[] not null,
  media jsonb not null,
  featured boolean not null default false,
  status text not null default 'ACTIVE',
  "viewCount" integer not null default 0,
  "inquiryCount" integer not null default 0,
  "bookingCount" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "ServiceListing_vendor_fkey" foreign key ("vendorId") references "VendorProfile"(id) on delete cascade
);
create index "ServiceListing_vendorId_idx" on "ServiceListing"("vendorId");
create index "ServiceListing_category_idx" on "ServiceListing"(category);
create index "ServiceListing_status_idx" on "ServiceListing"(status);
create index "ServiceListing_featured_idx" on "ServiceListing"(featured);

create table "BookingRequest" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null,
  "serviceListingId" uuid not null,
  "organizerId" uuid not null,
  "vendorId" uuid not null,
  status "BookingStatus" not null default 'PENDING',
  "serviceDate" timestamptz not null,
  requirements text not null,
  "budgetRange" jsonb,
  "quotedPrice" double precision,
  "finalPrice" double precision,
  "additionalNotes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "BookingRequest_event_fkey" foreign key ("eventId") references "Event"(id),
  constraint "BookingRequest_serviceListing_fkey" foreign key ("serviceListingId") references "ServiceListing"(id),
  constraint "BookingRequest_organizer_fkey" foreign key ("organizerId") references "User"(id),
  constraint "BookingRequest_vendor_fkey" foreign key ("vendorId") references "VendorProfile"(id)
);
create index "BookingRequest_eventId_idx" on "BookingRequest"("eventId");
create index "BookingRequest_serviceListingId_idx" on "BookingRequest"("serviceListingId");
create index "BookingRequest_organizerId_idx" on "BookingRequest"("organizerId");
create index "BookingRequest_vendorId_idx" on "BookingRequest"("vendorId");
create index "BookingRequest_status_idx" on "BookingRequest"(status);

create table "BookingMessage" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null,
  "senderId" uuid not null,
  "senderType" text not null,
  message text not null,
  attachments jsonb,
  "sentAt" timestamptz not null default now(),
  constraint "BookingMessage_booking_fkey" foreign key ("bookingId") references "BookingRequest"(id) on delete cascade
);
create index "BookingMessage_bookingId_idx" on "BookingMessage"("bookingId");
create index "BookingMessage_sentAt_idx" on "BookingMessage"("sentAt");

create table "VendorReview" (
  id uuid primary key default gen_random_uuid(),
  "vendorId" uuid not null,
  "bookingId" uuid not null unique,
  "organizerId" uuid not null,
  rating integer not null,
  title text not null,
  comment text not null,
  "serviceQuality" integer not null,
  communication integer not null,
  timeliness integer not null,
  value integer not null,
  "wouldRecommend" boolean not null,
  "vendorResponse" text,
  "vendorResponseAt" timestamptz,
  "verifiedPurchase" boolean not null default true,
  helpful integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "VendorReview_vendor_fkey" foreign key ("vendorId") references "VendorProfile"(id),
  constraint "VendorReview_booking_fkey" foreign key ("bookingId") references "BookingRequest"(id),
  constraint "VendorReview_organizer_fkey" foreign key ("organizerId") references "User"(id)
);
create index "VendorReview_vendorId_idx" on "VendorReview"("vendorId");
create index "VendorReview_bookingId_idx" on "VendorReview"("bookingId");
create index "VendorReview_organizerId_idx" on "VendorReview"("organizerId");
create index "VendorReview_rating_idx" on "VendorReview"(rating);
create index "VendorReview_createdAt_idx" on "VendorReview"("createdAt");

create table "PaymentRecord" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null,
  "payerId" uuid not null,
  "payeeId" uuid not null,
  amount double precision not null,
  currency text not null default 'USD',
  status "PaymentStatus" not null default 'PENDING',
  "paymentMethod" jsonb not null,
  "transactionId" text,
  "platformFee" double precision not null,
  "vendorPayout" double precision not null,
  "processedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  constraint "PaymentRecord_booking_fkey" foreign key ("bookingId") references "BookingRequest"(id),
  constraint "PaymentRecord_payer_fkey" foreign key ("payerId") references "User"(id),
  constraint "PaymentRecord_payee_fkey" foreign key ("payeeId") references "User"(id)
);
create index "PaymentRecord_bookingId_idx" on "PaymentRecord"("bookingId");
create index "PaymentRecord_payerId_idx" on "PaymentRecord"("payerId");
create index "PaymentRecord_payeeId_idx" on "PaymentRecord"("payeeId");
create index "PaymentRecord_status_idx" on "PaymentRecord"(status);
create index "PaymentRecord_processedAt_idx" on "PaymentRecord"("processedAt");

create table "ServiceAgreement" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null unique,
  terms text not null,
  deliverables jsonb not null,
  "paymentSchedule" jsonb not null,
  "cancellationPolicy" text not null,
  "signedAt" timestamptz,
  "organizerSignature" text,
  "vendorSignature" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "ServiceAgreement_booking_fkey" foreign key ("bookingId") references "BookingRequest"(id)
);
create index "ServiceAgreement_bookingId_idx" on "ServiceAgreement"("bookingId");
create index "ServiceAgreement_signedAt_idx" on "ServiceAgreement"("signedAt");

create table "EventTimelineItem" (
  id uuid primary key default gen_random_uuid(),
  "eventId" uuid not null,
  "bookingId" uuid,
  "deliverableId" text,
  "serviceDate" timestamptz,
  title text not null,
  description text not null,
  "dueDate" timestamptz not null,
  status text not null,
  "vendorId" uuid,
  category text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "EventTimelineItem_event_fkey" foreign key ("eventId") references "Event"(id) on delete cascade,
  constraint "EventTimelineItem_booking_fkey" foreign key ("bookingId") references "BookingRequest"(id) on delete cascade,
  constraint "EventTimelineItem_vendor_fkey" foreign key ("vendorId") references "VendorProfile"(id)
);
create unique index "EventTimelineItem_event_booking_deliverable_unique" on "EventTimelineItem"("eventId","bookingId","deliverableId");
create unique index "EventTimelineItem_event_booking_serviceDate_unique" on "EventTimelineItem"("eventId","bookingId","serviceDate");
create index "EventTimelineItem_eventId_idx" on "EventTimelineItem"("eventId");
create index "EventTimelineItem_bookingId_idx" on "EventTimelineItem"("bookingId");
create index "EventTimelineItem_vendorId_idx" on "EventTimelineItem"("vendorId");
create index "EventTimelineItem_dueDate_idx" on "EventTimelineItem"("dueDate");
create index "EventTimelineItem_status_idx" on "EventTimelineItem"(status);