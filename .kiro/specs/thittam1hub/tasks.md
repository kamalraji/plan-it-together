# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Initialize Node.js/TypeScript backend with Express
  - Initialize React/TypeScript frontend with Vite
  - Configure Prisma ORM with PostgreSQL
  - Set up ESLint, Prettier, and TypeScript configurations
  - Create Docker Compose for local development (PostgreSQL, Redis)
  - _Requirements: All_

- [x] 2. Implement authentication and user management

- [x] 2.1 Create user data models and database schema
  - Define User, UserRole, UserStatus enums in Prisma schema
  - Create database migrations
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Implement authentication service
  - Create registration endpoint with email verification
  - Implement login with JWT token generation
  - Create password hashing with bcrypt
  - Implement refresh token mechanism
  - _Requirements: 2.1, 2.2, 3.2, 3.3_

- [ ]* 2.3 Write property test for role assignment
  - **Property 1: Role assignment consistency**
  - **Validates: Requirements 1.2, 1.3, 3.2**

- [x] 2.4 Implement role-based access control middleware
  - Create permission validation middleware
  - Implement sub-role management (Volunteer, Judge, Speaker)
  - _Requirements: 1.4, 1.5_

- [ ]* 2.5 Write property test for permission enforcement
  - **Property 2: Sub-role permission enforcement**
  - **Validates: Requirements 1.5**

- [x] 2.6 Create user onboarding flows
  - Implement Organizer approval workflow
  - Create Participant self-registration flow
  - Build profile completion prompts
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 2.7 Write property test for account state transitions
  - **Property 3: Account state transitions**
  - **Validates: Requirements 2.1, 2.2, 2.3, 3.3**

- [ ]* 2.8 Write unit tests for authentication service
  - Test email verification flow
  - Test token generation and validation
  - Test password hashing
  - _Requirements: 2.1, 2.2, 3.2, 3.3_

- [x] 3. Implement event management system
- [x] 3.1 Create event data models
  - Define Event, EventMode, EventStatus in Prisma schema
  - Create branding and configuration schemas
  - Create database migrations
  - _Requirements: 4.1, 4.2, 4.3, 5.1_

- [x] 3.2 Implement event service
  - Create event creation endpoint with template support
  - Implement event update and retrieval
  - Build timeline and agenda management
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 3.3 Write property test for event data persistence
  - **Property 5: Event data round-trip consistency**
  - **Validates: Requirements 4.2, 4.3, 4.5**

- [x] 3.4 Implement event mode configuration
  - Create validation for Offline mode (venue required)
  - Create validation for Online mode (virtual links required)
  - Create validation for Hybrid mode (both required)
  - _Requirements: 5.2, 5.3, 5.4_

- [ ]* 3.5 Write property test for event mode validation
  - **Property 6: Event mode validation**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 3.6 Implement event landing page generation
  - Create landing page data aggregation
  - Generate unique URLs for events
  - Build SEO-optimized page structure
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 3.7 Write property test for URL uniqueness
  - **Property 20: Event URL uniqueness**
  - **Validates: Requirements 10.1**

- [ ]* 3.8 Write property test for landing page synchronization
  - **Property 21: Landing page data synchronization**
  - **Validates: Requirements 10.2**

- [ ]* 3.9 Write unit tests for event service
  - Test event creation with templates
  - Test event update operations
  - Test landing page generation
  - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.2_

- [x] 4. Implement registration and capacity management
- [x] 4.1 Create registration data models
  - Define Registration, RegistrationStatus in Prisma schema
  - Create form response schema
  - Create database migrations
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.2 Implement registration service
  - Create participant registration endpoint
  - Implement capacity checking and enforcement
  - Build waitlist management
  - Create registration form validation
  - _Requirements: 6.2, 6.3, 6.4_

- [ ]* 4.3 Write property test for capacity enforcement
  - **Property 8: Capacity enforcement and waitlist creation**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 4.4 Write property test for registration validation
  - **Property 9: Registration validation**
  - **Validates: Requirements 6.4**

- [x] 4.5 Implement waitlist approval workflow
  - Create approval endpoint for organizers
  - Implement status transition from waitlisted to confirmed
  - _Requirements: 6.5_

- [ ]* 4.6 Write property test for waitlist approval
  - **Property 10: Waitlist approval state transition**
  - **Validates: Requirements 6.5**

- [ ]* 4.7 Write unit tests for registration service
  - Test registration with capacity limits
  - Test waitlist creation
  - Test form validation
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 5. Implement attendance tracking and QR code system
- [x] 5.1 Create attendance data models
  - Define Attendance schema in Prisma
  - Create database migrations
  - _Requirements: 7.1, 7.2_

- [x] 5.2 Implement QR code generation
  - Create QR code generation service using qrcode library
  - Generate unique codes for each registration
  - Store QR code data with registrations
  - _Requirements: 7.1_

- [ ]* 5.3 Write property test for QR code uniqueness
  - **Property 11: QR code uniqueness**
  - **Validates: Requirements 7.1**

- [x] 5.4 Implement check-in service
  - Create QR code scanning endpoint
  - Implement QR code validation
  - Record attendance with timestamps
  - Update participant attendance status
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ]* 5.5 Write property test for QR validation and attendance
  - **Property 12: QR code validation and attendance recording**
  - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [ ]* 5.6 Write unit tests for attendance service
  - Test QR code generation
  - Test check-in with valid codes
  - Test rejection of invalid codes
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement communication and email system
- [x] 7.1 Create communication data models
  - Define CommunicationLog schema in Prisma
  - Create email template schema
  - Create database migrations
  - _Requirements: 8.1, 8.4_

- [x] 7.2 Implement email service
  - Integrate SendGrid or AWS SES
  - Create email template management
  - Implement single and bulk email sending
  - _Requirements: 8.1, 8.3_

- [x] 7.3 Implement recipient segmentation
  - Create filtering by registration status
  - Create filtering by role
  - Create filtering by attendance status
  - _Requirements: 8.2, 8.5_

- [ ]* 7.4 Write property test for recipient filtering
  - **Property 13: Recipient filtering accuracy**
  - **Validates: Requirements 8.2, 8.5**

- [x] 7.5 Implement communication logging
  - Log all sent communications with timestamp
  - Track recipient counts and delivery status
  - _Requirements: 8.4_

- [ ]* 7.6 Write property test for communication logging
  - **Property 14: Communication logging**
  - **Validates: Requirements 8.4**

- [ ]* 7.7 Write unit tests for communication service
  - Test email template rendering
  - Test recipient segmentation
  - Test logging functionality
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 8. Implement judging and scoring system
- [x] 8.1 Create judging data models
  - Define Rubric, RubricCriterion, Score schemas in Prisma
  - Create submission schema
  - Create database migrations
  - _Requirements: 9.1, 9.3_

- [x] 8.2 Implement rubric management
  - Create rubric creation endpoint
  - Validate criterion weights sum to 100
  - Store rubric with criteria
  - _Requirements: 9.1_

- [ ]* 8.3 Write property test for rubric validation
  - **Property 15: Rubric criteria validation**
  - **Validates: Requirements 9.1**

- [x] 8.4 Implement judge access control
  - Filter submissions by judge assignment
  - Enforce judge-only access to scoring module
  - _Requirements: 9.2_

- [ ]* 8.5 Write property test for judge access control
  - **Property 16: Judge submission access control**
  - **Validates: Requirements 9.2**

- [x] 8.6 Implement score submission
  - Create score submission endpoint
  - Validate all criteria are scored
  - Store judge scores
  - _Requirements: 9.3_

- [ ]* 8.7 Write property test for score completeness
  - **Property 17: Score completeness validation**
  - **Validates: Requirements 9.3**

- [x] 8.8 Implement final score calculation
  - Calculate weighted averages from judge scores
  - Aggregate scores across all judges
  - _Requirements: 9.4_

- [ ]* 8.9 Write property test for score calculation
  - **Property 18: Weighted score calculation**
  - **Validates: Requirements 9.4**

- [x] 8.10 Implement leaderboard generation
  - Rank submissions by final score
  - Handle ties consistently
  - Create leaderboard endpoint
  - _Requirements: 9.5, 11.3_

- [ ]* 8.11 Write property test for leaderboard ranking
  - **Property 19: Leaderboard ranking consistency**
  - **Validates: Requirements 9.5**

- [x] 8.12 Implement leaderboard visibility control
  - Add enable/disable flag to events
  - Control leaderboard display based on flag
  - _Requirements: 11.1, 11.4_

- [ ]* 8.13 Write property test for leaderboard visibility
  - **Property 23: Leaderboard visibility control**
  - **Validates: Requirements 11.1, 11.4**

- [ ]* 8.14 Write unit tests for judging service
  - Test rubric creation
  - Test score submission
  - Test final score calculation
  - Test leaderboard generation
  - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [x] 9. Implement certificate generation and verification
- [x] 9.1 Create certificate data models
  - Define Certificate, CertificateType schemas in Prisma
  - Create certificate criteria schema
  - Create database migrations
  - _Requirements: 12.1, 12.3, 12.5_

- [x] 9.2 Implement certificate criteria management
  - Create criteria definition endpoint
  - Store trigger conditions for certificate types
  - _Requirements: 12.1_

- [ ]* 9.3 Write property test for criteria persistence
  - **Property 25: Certificate criteria round-trip**
  - **Validates: Requirements 12.1**

- [x] 9.4 Implement certificate generation service
  - Create PDF generation using PDFKit
  - Generate unique certificate IDs
  - Embed QR codes with verification links
  - Determine certificate type based on criteria
  - _Requirements: 12.2, 12.3, 12.4, 13.1_

- [ ]* 9.5 Write property test for certificate type selection
  - **Property 26: Certificate type selection**
  - **Validates: Requirements 12.2**

- [ ]* 9.6 Write property test for certificate ID uniqueness
  - **Property 27: Certificate ID uniqueness**
  - **Validates: Requirements 12.3**

- [ ]* 9.7 Write property test for QR code embedding
  - **Property 28: Certificate QR code embedding**
  - **Validates: Requirements 12.4**

- [ ]* 9.8 Write property test for PDF generation
  - **Property 29: Certificate PDF generation**
  - **Validates: Requirements 13.1**

- [x] 9.9 Implement certificate distribution
  - Send certificates via email with attachments
  - Log distribution with timestamps
  - Implement retry logic for failures
  - _Requirements: 13.2, 13.3, 13.4_

- [ ]* 9.10 Write property test for certificate distribution
  - **Property 30: Certificate distribution**
  - **Validates: Requirements 13.2, 13.3**

- [ ]* 9.11 Write property test for distribution retry
  - **Property 31: Certificate distribution retry**
  - **Validates: Requirements 13.4**

- [x] 9.12 Implement certificate verification portal
  - Create public verification endpoint
  - Query certificates by ID
  - Return certificate details or error message
  - Ensure no authentication required
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ]* 9.13 Write property test for certificate verification
  - **Property 32: Certificate verification lookup**
  - **Validates: Requirements 14.2, 14.3, 14.4**

- [ ]* 9.14 Write property test for public access
  - **Property 33: Verification portal public access**
  - **Validates: Requirements 14.5**

- [ ]* 9.15 Write unit tests for certificate service
  - Test PDF generation
  - Test QR code embedding
  - Test distribution
  - Test verification
  - _Requirements: 12.3, 12.4, 13.1, 14.2_

- [x] 10. Implement analytics and reporting
- [x] 10.1 Create analytics service
  - Calculate registration counts over time
  - Calculate check-in rates by session
  - Calculate score distributions
  - Aggregate judge participation data
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 10.2 Write property test for analytics accuracy
  - **Property 34: Analytics calculation accuracy**
  - **Validates: Requirements 15.1, 15.2, 15.3**

- [x] 10.3 Implement report export
  - Generate CSV exports
  - Generate PDF reports
  - Include all relevant analytics data
  - _Requirements: 15.4_

- [ ]* 10.4 Write property test for export formats
  - **Property 35: Report export format**
  - **Validates: Requirements 15.4**

- [ ]* 10.5 Write unit tests for analytics service
  - Test registration count calculations
  - Test check-in rate calculations
  - Test score distribution calculations
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement organization management system
- [x] 12.1 Create organization data models
  - Define Organization, OrganizationCategory, VerificationStatus in Prisma schema
  - Define OrganizationAdmin and Follow models
  - Add EventVisibility enum and organizationId to Event model
  - Create database migrations
  - _Requirements: 16.1, 16.5, 17.1_

- [x] 12.2 Implement organization service
  - Create organization creation endpoint
  - Implement organization update and retrieval
  - Generate unique URLs for organization pages
  - Store branding and social links
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ]* 12.3 Write property test for organization data persistence
  - **Property 36: Organization profile data persistence**
  - **Validates: Requirements 16.1, 16.3, 16.4**

- [ ]* 12.4 Write property test for organization URL uniqueness
  - **Property 37: Organization URL uniqueness**
  - **Validates: Requirements 16.2**

- [x] 12.5 Implement organization verification workflow
  - Create verification approval/rejection endpoints
  - Update verification status with reason
  - Send notification to organization admin
  - Display verification badge
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 12.6 Write property test for verification state transitions
  - **Property 38: Organization verification state transitions**
  - **Validates: Requirements 17.1, 17.3, 17.4**

- [x] 12.7 Implement organization admin management
  - Create admin invitation endpoint
  - Implement admin role assignment
  - Create admin removal endpoint
  - Support multiple admins per organization
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 12.8 Write property test for admin access control
  - **Property 39: Organization admin access control**
  - **Validates: Requirements 18.2, 18.3**

- [ ]* 12.9 Write property test for multiple admins
  - **Property 40: Multiple admins support**
  - **Validates: Requirements 18.4**

- [ ]* 12.10 Write unit tests for organization service
  - Test organization creation
  - Test verification workflow
  - Test admin management
  - _Requirements: 16.1, 17.2, 18.2_

- [x] 13. Implement event publishing under organizations
- [x] 13.1 Update event service for organizations
  - Link events to organizations
  - Display organization branding on event pages
  - Implement event visibility controls (Public/Private/Unlisted)
  - Generate unique invite links for private events
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ]* 13.2 Write property test for event-organization linking
  - **Property 41: Event-organization linking**
  - **Validates: Requirements 19.1, 19.2**

- [ ]* 13.3 Write property test for event visibility
  - **Property 42: Event visibility enforcement**
  - **Validates: Requirements 19.3, 19.4, 19.5**

- [x] 13.4 Implement private event access control
  - Validate invite links
  - Check member criteria
  - Deny unauthorized access
  - Log access attempts
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ]* 13.5 Write property test for private event access
  - **Property 50: Private event access control**
  - **Validates: Requirements 24.2, 24.3, 24.4**

- [ ]* 13.6 Write property test for invite link uniqueness
  - **Property 51: Private event invite link uniqueness**
  - **Validates: Requirements 24.1**

- [ ]* 13.7 Write unit tests for event visibility
  - Test public event access
  - Test private event access with invite
  - Test unlisted event access
  - _Requirements: 19.3, 19.4, 19.5_

- [x] 14. Implement organization discovery and search
- [x] 14.1 Create discovery service
  - Implement organization search with filters
  - Filter by category and verification status
  - Rank results by verification and follower count
  - Implement pagination
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ]* 14.2 Write property test for search accuracy
  - **Property 43: Organization search accuracy**
  - **Validates: Requirements 20.2, 20.3**

- [ ]* 14.3 Write property test for search ranking
  - **Property 44: Search result ranking consistency**
  - **Validates: Requirements 20.5**

- [x] 14.4 Implement organization event feed
  - Display public events on organization page
  - Show private events for members
  - Sort events by date (upcoming first)
  - Display event count and follower count
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ]* 14.5 Write property test for event feed ordering
  - **Property 45: Organization event feed ordering**
  - **Validates: Requirements 21.2**

- [ ]* 14.6 Write property test for private event visibility
  - **Property 46: Private event visibility for members**
  - **Validates: Requirements 21.3**

- [ ]* 14.7 Write unit tests for discovery service
  - Test organization search
  - Test category filtering
  - Test event feed generation
  - _Requirements: 20.2, 20.3, 21.1_

- [x] 15. Implement organization following system
- [x] 15.1 Create follow/unfollow functionality
  - Create follow relationship endpoint
  - Implement unfollow endpoint
  - Update follower count on follow/unfollow
  - Display followed organizations for user
  - _Requirements: 22.1, 22.2, 22.3, 22.5_

- [ ]* 15.2 Write property test for follow consistency
  - **Property 47: Follow relationship consistency**
  - **Validates: Requirements 22.2, 22.3**

- [x] 15.3 Implement follower notifications
  - Notify followers on new event publication
  - Send email notifications to followers
  - Track notification delivery
  - _Requirements: 22.4_

- [ ]* 15.4 Write property test for follower notifications
  - **Property 48: Follower notification delivery**
  - **Validates: Requirements 22.4**

- [ ]* 15.5 Write unit tests for following system
  - Test follow/unfollow operations
  - Test follower count updates
  - Test notification delivery
  - _Requirements: 22.1, 22.2, 22.4_

- [ ] 16. Implement organization analytics
- [ ] 16.1 Create organization analytics service
  - Calculate total event count
  - Track follower growth over time
  - Calculate page views
  - Aggregate registration and attendance across events
  - Display follower demographics
  - _Requirements: 23.1, 23.2, 23.3_

- [ ]* 16.2 Write property test for organization analytics accuracy
  - **Property 49: Organization analytics accuracy**
  - **Validates: Requirements 23.1, 23.2, 23.3**

- [ ] 16.3 Implement organization report export
  - Generate CSV exports for organization data
  - Generate PDF reports
  - Include all relevant analytics data
  - _Requirements: 23.4_

- [ ]* 16.4 Write unit tests for organization analytics
  - Test event count calculations
  - Test follower growth tracking
  - Test report export
  - _Requirements: 23.1, 23.2, 23.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Build frontend - Authentication and user management
- [ ] 18.1 Create authentication UI components
  - Build login form with validation
  - Build registration form for Organizers and Participants
  - Create email verification page
  - Implement JWT token storage and refresh
  - _Requirements: 2.1, 2.2, 3.2, 3.3_

- [ ] 18.2 Create user dashboard components
  - Build Organizer dashboard with event management
  - Build Participant dashboard with event details
  - Implement profile completion flow
  - _Requirements: 2.4, 2.5, 3.4, 3.5_

- [ ]* 18.3 Write unit tests for authentication components
  - Test form validation
  - Test login flow
  - Test registration flow
  - _Requirements: 2.1, 2.2, 3.2_

- [ ] 19. Build frontend - Event management
- [ ] 19.1 Create event creation and editing UI
  - Build event creation form with template selection
  - Create branding upload interface
  - Build timeline and agenda builder
  - Implement event mode selection with conditional fields
  - _Requirements: 4.1, 4.2, 4.3, 5.2, 5.3, 5.4_

- [ ] 19.2 Create event landing page component
  - Build public-facing event page
  - Display event details, branding, and schedule
  - Implement registration button
  - Add social sharing functionality
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ]* 19.3 Write unit tests for event components
  - Test event form validation
  - Test landing page rendering
  - Test mode-specific field display
  - _Requirements: 4.1, 4.2, 5.2, 5.3_

- [ ] 20. Build frontend - Registration and attendance
- [ ] 20.1 Create registration UI
  - Build participant registration form
  - Display capacity and waitlist status
  - Show registration confirmation
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 20.2 Create QR code display component
  - Display participant QR code
  - Allow QR code download
  - Show check-in status
  - _Requirements: 7.1, 7.5_

- [ ] 20.3 Create volunteer check-in interface
  - Build QR code scanner component
  - Display scan results and errors
  - Show attendance list
  - _Requirements: 7.2, 7.3, 7.4_

- [ ]* 20.4 Write unit tests for registration components
  - Test form validation
  - Test capacity display
  - Test QR code rendering
  - _Requirements: 6.4, 7.1_

- [ ] 21. Build frontend - Communication
- [ ] 21.1 Create communication UI
  - Build email composition interface
  - Create recipient segmentation controls
  - Display email templates
  - Show communication history
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 21.2 Write unit tests for communication components
  - Test email form validation
  - Test recipient filtering UI
  - Test template selection
  - _Requirements: 8.1, 8.2_

- [ ] 22. Build frontend - Judging and leaderboard
- [ ] 22.1 Create rubric management UI
  - Build rubric creation form
  - Display criteria with weights
  - Validate weight totals
  - _Requirements: 9.1_

- [ ] 22.2 Create judge scoring interface
  - Display assigned submissions
  - Build scoring form with rubric criteria
  - Show submission details
  - _Requirements: 9.2, 9.3_

- [ ] 22.3 Create leaderboard component
  - Display rankings with scores
  - Implement real-time updates
  - Add enable/disable toggle for organizers
  - _Requirements: 9.5, 11.1, 11.3, 11.4_

- [ ]* 22.4 Write unit tests for judging components
  - Test rubric form validation
  - Test scoring form validation
  - Test leaderboard rendering
  - _Requirements: 9.1, 9.3, 11.3_

- [ ] 23. Build frontend - Certificates and verification
- [ ] 23.1 Create certificate management UI
  - Display certificate criteria configuration
  - Show generated certificates list
  - Implement batch generation trigger
  - Display distribution status
  - _Requirements: 12.1, 13.5_

- [ ] 23.2 Create certificate verification page
  - Build public verification interface
  - Display certificate details
  - Show verification status
  - Handle invalid certificate IDs
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 23.3 Write unit tests for certificate components
  - Test criteria form validation
  - Test verification page rendering
  - Test error handling
  - _Requirements: 12.1, 14.3, 14.4_

- [ ] 24. Build frontend - Analytics and reporting
- [ ] 24.1 Create analytics dashboard
  - Build registration charts
  - Display attendance metrics
  - Show judging statistics
  - Implement date range filters
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 24.2 Create report export UI
  - Add export buttons for CSV and PDF
  - Show export progress
  - Handle download
  - _Requirements: 15.4_

- [ ]* 24.3 Write unit tests for analytics components
  - Test chart rendering
  - Test metric calculations
  - Test export functionality
  - _Requirements: 15.1, 15.2, 15.4_

- [ ] 25. Build frontend - Organization management
- [ ] 25.1 Create organization profile UI
  - Build organization creation form
  - Create branding upload interface
  - Display organization category selection
  - Show verification status badge
  - _Requirements: 16.1, 16.2, 16.3, 16.5, 17.5_

- [ ] 25.2 Create organization admin management UI
  - Build admin invitation interface
  - Display team members list
  - Implement admin removal functionality
  - Show admin roles and permissions
  - _Requirements: 18.1, 18.3, 18.5_

- [ ] 25.3 Create organization page component
  - Build public-facing organization page
  - Display organization branding and description
  - Show event feed with upcoming/past events
  - Display follower count and event count
  - Implement follow/unfollow button
  - _Requirements: 21.1, 21.2, 21.4, 21.5, 22.1_

- [ ]* 25.4 Write unit tests for organization components
  - Test organization form validation
  - Test admin management UI
  - Test organization page rendering
  - _Requirements: 16.1, 18.1, 21.1_

- [ ] 26. Build frontend - Organization discovery
- [ ] 26.1 Create organization directory UI
  - Build organization search interface
  - Implement category filters
  - Display search results with ranking
  - Show organization cards with logo and verification badge
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 26.2 Create followed organizations view
  - Display list of followed organizations
  - Show latest events from followed organizations
  - Implement unfollow functionality
  - _Requirements: 22.5_

- [ ]* 26.3 Write unit tests for discovery components
  - Test search functionality
  - Test category filtering
  - Test result ranking display
  - _Requirements: 20.2, 20.3, 20.5_

- [ ] 27. Build frontend - Event visibility and access control
- [ ] 27.1 Update event creation UI for organizations
  - Add organization selection dropdown
  - Implement visibility controls (Public/Private/Unlisted)
  - Generate and display invite links for private events
  - Show organization branding on event pages
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 24.1_

- [ ] 27.2 Create private event access UI
  - Build invite link validation page
  - Display access denied message for unauthorized users
  - Show member criteria information
  - _Requirements: 24.2, 24.3_

- [ ]* 27.3 Write unit tests for event visibility components
  - Test visibility control UI
  - Test invite link generation
  - Test access control display
  - _Requirements: 19.3, 19.4, 24.2_

- [ ] 28. Build frontend - Organization analytics
- [ ] 28.1 Create organization analytics dashboard
  - Display event count and follower growth charts
  - Show page views over time
  - Display registration and attendance metrics across events
  - Show follower demographics
  - _Requirements: 23.1, 23.2, 23.3_

- [ ] 28.2 Create organization report export UI
  - Add export buttons for organization analytics
  - Show export progress
  - Handle download
  - _Requirements: 23.4_

- [ ]* 28.3 Write unit tests for organization analytics components
  - Test chart rendering
  - Test metric calculations
  - Test export functionality
  - _Requirements: 23.1, 23.2, 23.4_

- [ ] 29. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 30. Integration and deployment setup
- [ ] 30.1 Set up API integration
  - Configure API client with authentication
  - Implement error handling and retry logic
  - Set up request/response interceptors
  - _Requirements: All_

- [ ] 30.2 Configure deployment
  - Set up environment variables
  - Create production build configuration
  - Configure database migrations for production
  - Set up CI/CD pipeline
  - _Requirements: All_

- [ ]* 30.3 Write integration tests
  - Test complete user flows
  - Test API error handling
  - Test authentication flow
  - Test organization and event flows
  - _Requirements: All_

- [ ]* 30.4 Write end-to-end tests
  - Test organizer event creation flow
  - Test participant registration and check-in flow
  - Test judging and certificate generation flow
  - Test organization creation and event publishing flow
  - Test organization discovery and following flow
  - _Requirements: All_
