---
llm_metadata:
  purpose: Edge function documentation
  total_functions: 69
  last_updated: 2026-02-02
---

# Edge Function Registry

Complete documentation of all Supabase Edge Functions in the project.

---

## Function Categories

| Category | Count | Description |
|----------|-------|-------------|
| Workspace Management | 8 | Workspace provisioning, channels, analytics |
| Participant API | 3 | Participant-facing endpoints |
| Communication | 6 | Push notifications, chat, reminders |
| Certificates | 3 | Certificate generation and design |
| Attendance | 4 | Check-in, QR codes, reports |
| AI Matching | 5 | Profile embeddings, match suggestions |
| Security | 4 | Password breach, geo-anomaly, login alerts |
| Payments | 4 | Stripe integration, ticket purchases |
| Analytics | 4 | Page views, material downloads, route tracking |
| Social/Media | 5 | YouTube streaming, social media posting |
| Admin | 3 | Audit logs, user roles, organization |
| Other | 20 | Various utility functions |

---

## Workspace Functions

### workspace-provision
**Purpose:** Auto-create workspace structure with default channels and settings  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Owner  
**Rate Limit:** 10/hour

```typescript
// Request
{
  "workspace_id": "uuid",
  "template": "event" | "organization" | "minimal"
}

// Response
{
  "success": true,
  "created": {
    "channels": ["general", "announcements", "help"],
    "settings": {...}
  }
}
```

### workspace-channels
**Purpose:** Channel CRUD operations  
**Used By:** Web App  
**Methods:** GET, POST, PUT, DELETE  
**Auth:** JWT + Workspace Role  
**Rate Limit:** 60/min

### workspace-analytics
**Purpose:** Dashboard metrics and insights  
**Used By:** Web App  
**Method:** GET  
**Auth:** JWT + Manager Role  
**Rate Limit:** 30/min

### workspace-reports
**Purpose:** Generate exportable reports  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Manager Role  
**Rate Limit:** 5/hour

### channel-messages
**Purpose:** Message management in workspace channels  
**Used By:** Web App  
**Methods:** GET, POST  
**Auth:** JWT + Channel Member  
**Rate Limit:** 120/min

### invite-to-workspace
**Purpose:** Send workspace invitations  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Admin Role  
**Rate Limit:** 20/hour

### request-workspace-access
**Purpose:** Request access to a workspace  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 5/hour

### respond-access-request
**Purpose:** Approve/deny access requests  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Admin Role  
**Rate Limit:** 60/hour

---

## Participant API Functions

### participant-channels-api
**Purpose:** List channels available to participants  
**Used By:** Mobile App, Web App  
**Method:** GET  
**Auth:** JWT (participant)  
**Rate Limit:** 60/min

```typescript
// Request
GET /participant-channels-api?eventId=uuid

// Response
{
  "channels": [
    {
      "id": "uuid",
      "name": "General",
      "type": "general",
      "unread_count": 5,
      "last_message": {...}
    }
  ],
  "unread_total": 12
}
```

### participant-messages-api
**Purpose:** Read/write messages in participant channels  
**Used By:** Mobile App  
**Methods:** GET, POST  
**Auth:** JWT (participant)  
**Rate Limit:** 120/min

```typescript
// GET Request
GET /participant-messages-api?channelId=uuid&limit=50&cursor=uuid

// POST Request
{
  "channel_id": "uuid",
  "content": "Hello!",
  "message_type": "text"
}
```

### participant-channel-join
**Purpose:** Join a participant channel  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT (participant)  
**Rate Limit:** 10/hour

---

## Communication Functions

### send-push-notification
**Purpose:** Deliver push notifications via FCM/APNs  
**Used By:** Internal (triggers), Edge Functions  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 1000/hour

```typescript
// Request
{
  "user_id": "uuid",
  "title": "New Message",
  "body": "You have a new message",
  "data": {
    "type": "chat",
    "channel_id": "uuid"
  }
}
```

### trigger-chat-notification
**Purpose:** Trigger notification for new chat messages  
**Used By:** Database Trigger  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

### send-session-reminders
**Purpose:** Send reminders for upcoming sessions  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### send-reminder-emails
**Purpose:** Send scheduled email reminders  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 500/hour

### send-registration-confirmation
**Purpose:** Send confirmation email after registration  
**Used By:** Database Trigger  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### send-weekly-digest
**Purpose:** Send weekly digest emails to users  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 1000/run

---

## AI Matching Functions

### track-interaction
**Purpose:** Log user interactions for ML training  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 300/hour

```typescript
// Request
{
  "interaction_type": "profile_view" | "message_sent" | "connection_request",
  "target_user_id": "uuid",
  "context": "event" | "networking" | "chat",
  "event_id": "uuid" (optional)
}
```

### generate-profile-embedding
**Purpose:** Create ML embeddings for user profiles  
**Used By:** Internal  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### get-ai-matches
**Purpose:** Retrieve AI-powered match suggestions  
**Used By:** Mobile App  
**Method:** GET  
**Auth:** JWT  
**Rate Limit:** 30/hour

```typescript
// Request
GET /get-ai-matches?context=event&event_id=uuid&limit=10

// Response
{
  "matches": [
    {
      "target_user_id": "uuid",
      "match_score": 0.87,
      "match_category": "skills",
      "match_reasons": ["Both interested in AI", "Complementary skills"],
      "conversation_starters": ["Ask about their ML project"]
    }
  ]
}
```

### analyze-profile-match
**Purpose:** Deep analysis of a specific match  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 20/hour

### process-embedding-queue
**Purpose:** Background processing of embedding queue  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

---

## Security Functions

### check-password-breach
**Purpose:** Check if password appears in known breaches  
**Used By:** Mobile App, Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 10/hour

```typescript
// Request
{
  "password_hash": "sha1-prefix" // Only first 5 chars of SHA1
}

// Response
{
  "breached": true | false,
  "count": 1234 // If breached
}
```

### geo-anomaly-check
**Purpose:** Detect suspicious login locations  
**Used By:** Auth Flow  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### login-alert
**Purpose:** Send alerts for new device logins  
**Used By:** Auth Flow  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 50/hour

### export-user-data
**Purpose:** GDPR-compliant data export  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 1/day

---

## Certificate Functions

### certificates
**Purpose:** Generate and manage certificates  
**Used By:** Web App  
**Methods:** GET, POST  
**Auth:** JWT + Organizer Role  
**Rate Limit:** 100/hour

### generate-certificate-design
**Purpose:** AI-assisted certificate design  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Organizer Role  
**Rate Limit:** 10/hour

### generate-certificate-backgrounds
**Purpose:** Generate certificate background images  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Organizer Role  
**Rate Limit:** 10/hour

---

## Attendance Functions

### attendance-checkin
**Purpose:** Process event check-ins  
**Used By:** Mobile App, Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 60/min

### attendance-qr
**Purpose:** Generate and validate QR codes  
**Used By:** Web App  
**Methods:** GET, POST  
**Auth:** JWT  
**Rate Limit:** 120/min

### attendance-manual-checkin
**Purpose:** Manual check-in by staff  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Staff Role  
**Rate Limit:** 120/min

### attendance-report
**Purpose:** Generate attendance reports  
**Used By:** Web App  
**Method:** GET  
**Auth:** JWT + Manager Role  
**Rate Limit:** 10/hour

---

## Payment Functions

### stripe-webhook
**Purpose:** Handle Stripe webhook events  
**Used By:** Stripe  
**Method:** POST  
**Auth:** Stripe Signature  
**Rate Limit:** No limit

### create-ticket-checkout
**Purpose:** Create Stripe checkout session  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 30/hour

### validate-ticket-purchase
**Purpose:** Validate ticket purchase completion  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 60/hour

### verify-payment
**Purpose:** Verify payment status  
**Used By:** Web App  
**Method:** GET  
**Auth:** JWT  
**Rate Limit:** 60/min

---

## Analytics Functions

### track-page-view
**Purpose:** Track page views for analytics  
**Used By:** Web App  
**Method:** POST  
**Auth:** Optional JWT  
**Rate Limit:** 300/min

### track-material-download
**Purpose:** Track material/resource downloads  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 30/min

### track-route-analytics
**Purpose:** Track mobile app route navigation  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 120/min

### track-interaction
**Purpose:** Track user interactions for analytics  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 300/hour

---

## Social/Media Functions

### youtube-oauth-connect
**Purpose:** Initiate YouTube OAuth flow  
**Used By:** Web App  
**Method:** GET  
**Auth:** JWT  
**Rate Limit:** 10/hour

### youtube-stream-manage
**Purpose:** Create/manage YouTube live streams  
**Used By:** Web App  
**Methods:** GET, POST, PUT  
**Auth:** JWT + OAuth Token  
**Rate Limit:** 30/hour

### youtube-token-refresh
**Purpose:** Refresh YouTube OAuth tokens  
**Used By:** Internal  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### social-media-post
**Purpose:** Post to connected social accounts  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + OAuth Token  
**Rate Limit:** 20/hour

### social-media-sync
**Purpose:** Sync social media metrics  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

---

## Utility Functions

### giphy-proxy
**Purpose:** Proxy requests to Giphy API  
**Used By:** Mobile App  
**Method:** GET  
**Auth:** JWT  
**Rate Limit:** 60/min

### link-preview
**Purpose:** Fetch link preview metadata  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 60/min

### agora-token
**Purpose:** Generate Agora RTC tokens for video calls  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 30/min

```typescript
// Request
{
  "channel_name": "call-uuid",
  "uid": 12345,
  "role": "publisher" | "subscriber"
}

// Response
{
  "token": "006..."
}
```

### send-quote-request
**Purpose:** Send vendor quote requests  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 10/hour

### send-vendor-status-email
**Purpose:** Send vendor status updates  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 20/hour

### send-webhook-notification
**Purpose:** Send webhook notifications to external systems  
**Used By:** Internal  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

### suggest-tasks
**Purpose:** AI-powered task suggestions  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 20/hour

### check-deadlines
**Purpose:** Check and notify about approaching deadlines  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

### process-automation-rules
**Purpose:** Execute workspace automation rules  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

### process-recurring-tasks
**Purpose:** Create instances of recurring tasks  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

### process-scheduled-reports
**Purpose:** Generate and send scheduled reports  
**Used By:** Scheduled (cron)  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** No limit

---

## Admin Functions

### admin-audit-log
**Purpose:** Log admin actions for audit trail  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Admin Role  
**Rate Limit:** 300/min

### admin-user-roles
**Purpose:** Manage user roles  
**Used By:** Web App  
**Methods:** GET, POST, PUT, DELETE  
**Auth:** JWT + Super Admin  
**Rate Limit:** 60/hour

### create-organization
**Purpose:** Create new organization  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 5/day

---

## Judging Functions

### judging-submissions
**Purpose:** Manage hackathon submissions  
**Used By:** Web App  
**Methods:** GET, POST, PUT  
**Auth:** JWT  
**Rate Limit:** 60/min

### judging-rubric
**Purpose:** Manage judging rubrics  
**Used By:** Web App  
**Methods:** GET, POST, PUT  
**Auth:** JWT + Organizer  
**Rate Limit:** 30/min

### judging-leaderboard
**Purpose:** Calculate and display leaderboards  
**Used By:** Web App  
**Method:** GET  
**Auth:** JWT  
**Rate Limit:** 60/min

---

## ID Card Functions

### generate-idcard-design
**Purpose:** AI-assisted ID card design  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Organizer  
**Rate Limit:** 10/hour

### generate-idcard-backgrounds
**Purpose:** Generate ID card backgrounds  
**Used By:** Web App  
**Method:** POST  
**Auth:** JWT + Organizer  
**Rate Limit:** 10/hour

---

## Invitation Functions

### accept-invitation
**Purpose:** Accept workspace/event invitation  
**Used By:** Web App, Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 30/hour

### intent-contact
**Purpose:** Express interest in contacting someone  
**Used By:** Mobile App  
**Method:** POST  
**Auth:** JWT  
**Rate Limit:** 50/hour

### organizer-application-notification
**Purpose:** Notify about organizer applications  
**Used By:** Internal  
**Method:** POST  
**Auth:** Service Role  
**Rate Limit:** 100/hour

---

## Shared Utilities (`_shared/`)

All functions should import from `_shared/`:

### security.ts
```typescript
export {
  corsHeaders,           // CORS headers
  validateAuth,          // JWT validation
  checkRateLimit,        // Rate limiting
  validateUUID,          // UUID validation
  sanitizeString,        // Input sanitization
  errorResponse,         // Error response builder
  successResponse,       // Success response builder
  logSecurityEvent,      // Security audit logging
  initRequestContext,    // Request context setup
  logInfo,               // Info logging
  logError,              // Error logging
  logRequestComplete,    // Request completion logging
};
```

### validation.ts
```typescript
export {
  validateEmail,
  validatePhone,
  validateUrl,
  validateDateRange,
  sanitizeHtml,
  validateFileType,
  validateFileSize,
};
```
