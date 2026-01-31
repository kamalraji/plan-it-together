

# Comprehensive Workspace Features Implementation Plan

## Industrial Standards Gap Analysis

Based on thorough codebase analysis, I've identified **72 gaps** across workspace features that need resolution to meet industrial standards.

---

## Executive Summary

| Category | Issues Found | Priority |
|----------|-------------|----------|
| Mock Data Components | 25 components | P0 |
| External API Dependencies | 13 components | P0 |
| Missing Database Tables | 2 tables | P1 |
| Incomplete Hook Implementations | 4 hooks | P1 |
| Mobile UX Gaps | 8 checklist items | P2 |
| Database-UI Feature Gaps | 15 tables unused | P2 |

---

## Phase 1: Critical - Mock Data Replacement (P0)

### 1.1 Components Using Hardcoded Mock Data

The following components use `const mock*` arrays instead of database queries:

**Sponsorship Module:**
| Component | Mock Variable | Required Table |
|-----------|--------------|----------------|
| `SponsorTracker.tsx` | `mockSponsors` | `workspace_sponsors` |
| `SponsorCommunications.tsx` | `mockCommunications` | `workspace_sponsor_communications` |
| `DeliverableTracker.tsx` | `mockDeliverables` | `workspace_sponsor_deliverables` |
| `ProposalPipeline.tsx` | `mockProposals` | `workspace_sponsor_proposals` |
| `BenefitsManager.tsx` | `mockBenefits` | `workspace_sponsor_benefits` |

**Marketing Module:**
| Component | Mock Variable | Required Table |
|-----------|--------------|----------------|
| `CampaignTracker.tsx` | `mockCampaigns` | `workspace_campaigns` |
| `AdPerformancePanel.tsx` | `mockChannels` | `workspace_campaigns` (ads) |
| `BrandingAssetsManager.tsx` | `mockAssets` | `workspace_media_assets` |

**Communication Module:**
| Component | Mock Variable | Required Table |
|-----------|--------------|----------------|
| `AnnouncementManager.tsx` | `mockAnnouncements` | `workspace_announcements` |
| `EmailCampaignTracker.tsx` | `mockCampaigns` | `workspace_email_campaigns` |
| `PressReleaseTracker.tsx` | `mockPressReleases` | `workspace_press_releases` |

**Volunteers Module:**
| Component | Mock Variable | Required Table |
|-----------|--------------|----------------|
| `TrainingStatusTab.tsx` | `mockModules`, `mockVolunteers` | New: `volunteer_training_progress` |
| `RecognitionTab.tsx` | `mockRecognitions`, `mockTopPerformers` | New: `volunteer_recognitions` |
| `HoursReportTab.tsx` | `mockHoursData` | `workspace_time_entries` |
| `RecruitmentTab.tsx` | `mockApplications` | New: `volunteer_applications` |
| `ApproveTimesheetsTab.tsx` | `mockTimesheets` | New: `volunteer_time_logs` |
| `MassAnnouncementTab.tsx` | `mockAnnouncements` | `workspace_announcements` |

**Content Module:**
| Component | Mock Variable | Required Table |
|-----------|--------------|----------------|
| `ContentPipelineOverview.tsx` | `mockContentPipeline` | `workspace_content_items` |
| `SpeakerScheduleWidget.tsx` | `mockSpeakers` | `workspace_speakers` |
| `JudgingOverview.tsx` | `mockStats` | `workspace_judges` + `workspace_scores` |
| `ContentCommitteeHub.tsx` | `mockCommitteeStatus` | Aggregate from workspaces |

### 1.2 Implementation Pattern

Create dedicated hooks following the established `useWorkspaceBudget` pattern:

```text
src/hooks/
├── useSponsors.ts           # For SponsorTracker
├── useCampaigns.ts          # For CampaignTracker, AdPerformance
├── useAnnouncements.ts      # For AnnouncementManager
├── useEmailCampaigns.ts     # For EmailCampaignTracker
├── usePressReleases.ts      # For PressReleaseTracker
├── useVolunteerTraining.ts  # For TrainingStatusTab
├── useVolunteerRecognitions.ts  # For RecognitionTab
└── useVolunteerApplications.ts  # For RecruitmentTab
```

Each hook will:
- Use TanStack Query with `queryKeys` factory
- Apply `queryPresets.standard` or `queryPresets.dynamic`
- Include optimistic mutations
- Implement real-time subscriptions where needed

---

## Phase 2: Critical - External API Migration (P0)

### 2.1 Components Using Non-Existent External API

These components import `api from '../../lib/api'` and call endpoints that don't exist:

| Component | API Calls | Migration Target |
|-----------|-----------|------------------|
| `WorkspaceCommunication.tsx` | `/workspaces/:id/channels`, `/broadcast` | Supabase `workspace_channels` + Edge Function |
| `WorkspaceTemplateLibrary.tsx` | `/api/workspace-templates` | Supabase `workspace_custom_templates` |
| `WorkspaceTemplateManagement.tsx` | `/api/workspace-templates/*` | Edge Functions |
| `WorkspaceTemplateCreation.tsx` | `/api/workspace-templates` | Edge Function |
| `WorkspaceTemplateRating.tsx` | `/api/workspace-templates/:id/rate` | New table: `workspace_template_ratings` |
| `WorkspaceAnalyticsDashboard.tsx` | `/workspaces/:id/analytics` | Supabase aggregation queries |
| `WorkspaceReportExport.tsx` | `/workspaces/:id/reports` | Edge Function |
| `MessageThread.tsx` | `/channels/:id/messages` | Supabase `workspace_broadcast_messages` |
| `MessageSearch.tsx` | `/channels/:id/messages/search` | Supabase full-text search |
| `MobileTaskSummary.tsx` | Various `/workspaces/*` | Direct Supabase |
| `MobileTeamOverview.tsx` | `/workspaces/:id` | Direct Supabase |
| `MobileTeamManagement.tsx` | `/workspaces/:id/team` | Supabase + existing hooks |
| `MobileCommunication.tsx` | `/channels/*` | Supabase channels |

### 2.2 Required Edge Functions

Create the following edge functions:

```text
supabase/functions/
├── workspace-templates/
│   ├── index.ts       # CRUD for templates
│   ├── apply.ts       # Apply template to workspace
│   └── rate.ts        # Rate a template
├── workspace-reports/
│   └── index.ts       # Generate PDF/Excel reports
└── workspace-broadcast/
    └── index.ts       # Send broadcast messages
```

---

## Phase 3: Database Schema Completion (P1)

### 3.1 Missing Tables

**volunteer_time_logs** (Referenced by `useVolunteerTimesheets.ts`):
```sql
CREATE TABLE volunteer_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  volunteer_id UUID NOT NULL REFERENCES profiles(id),
  shift_id UUID REFERENCES workspace_tasks(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  hours_logged DECIMAL(5,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600
  ) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**escalation_rules** (Currently hardcoded in `useEscalationWorkflow.ts`):
```sql
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'approval', 'issue', 'ticket')),
  trigger_after_hours INTEGER NOT NULL DEFAULT 24,
  escalate_to TEXT NOT NULL DEFAULT 'parent_workspace',
  notify_roles TEXT[] DEFAULT ARRAY['MANAGER'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**workspace_template_ratings**:
```sql
CREATE TABLE workspace_template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workspace_custom_templates(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, user_id)
);
```

### 3.2 Tables Existing But Unused in Frontend

The following tables exist but have no frontend implementation:

| Table | Recommended Component |
|-------|----------------------|
| `workspace_ab_tests` | ABTestManager in Marketing |
| `workspace_vip_guests` | VIPGuestManager in Event/Registration |
| `workspace_contingency_procedures` | ContingencyPlanManager in Operations |
| `workspace_venue_walkthroughs` | VenueWalkthroughTracker in Facility |
| `workspace_team_briefings` | TeamBriefingScheduler in Management |
| `workspace_event_briefings` | EventBriefingManager in Root Dashboard |
| `workspace_gallery_reviews` | GalleryReviewPanel in Media |
| `workspace_shot_lists` | ShotListManager in Media |
| `workspace_power_circuits` | PowerCircuitMonitor in Technical |
| `workspace_network_zones` | NetworkZoneManager in IT |
| `workspace_software_licenses` | LicenseManager in IT |
| `workspace_logistics_reports` | LogisticsReportGenerator |
| `workspace_stakeholders` | Already used in Communication |
| `workspace_hashtags` | HashtagManager in Social Media |
| `workspace_engagement_reports` | EngagementDashboard in Social Media |

---

## Phase 4: Hook Completions (P1)

### 4.1 Incomplete Hooks

**useVolunteerTimesheets.ts:**
- Current: Returns empty array with TODO comment
- Fix: Implement after creating `volunteer_time_logs` table
- Pattern: Follow `useWorkspaceBudget` structure

**useEscalationWorkflow.ts (useEscalationRules):**
- Current: Returns hardcoded rules array
- Fix: Query from `escalation_rules` table
- Add: CRUD mutations for rule management

### 4.2 Missing Query Key Registrations

Add to `src/lib/query-config.ts`:
```typescript
// Sponsorship
sponsors: (workspaceId: string) => ['sponsors', workspaceId] as const,
sponsorDeliverables: (workspaceId: string) => ['sponsor-deliverables', workspaceId] as const,

// Volunteers
volunteerTimeLogs: (workspaceId: string) => ['volunteer-time-logs', workspaceId] as const,
volunteerTraining: (workspaceId: string) => ['volunteer-training', workspaceId] as const,
volunteerRecognitions: (workspaceId: string) => ['volunteer-recognitions', workspaceId] as const,

// Templates
templates: () => ['workspace-templates'] as const,
templateRatings: (templateId: string) => ['template-ratings', templateId] as const,

// Escalation
escalationRules: (workspaceId: string) => ['escalation-rules', workspaceId] as const,
```

---

## Phase 5: Mobile Experience Completion (P2)

From `IMPLEMENTATION_CHECKLIST.md`, incomplete items:

### 5.1 Mobile Navigation Polish
- Review `MobileWorkspaceDashboard`, `MobileWorkspaceHeader` for clear navigation
- Implement easy workspace switching on mobile
- Ensure consistent design token usage

### 5.2 Mobile Task Flows
- Optimize touch targets in `MobileTaskManagement`
- Implement drag regions for task reordering
- Ensure `TaskForm` validation patterns are reused

### 5.3 Mobile Team Flows
- Simplify invitation flow in `MobileTeamManagement`
- Add success/error toasts for role changes

### 5.4 Mobile Communication
- Confirm message composition works on small screens
- Make photo/voice/location utilities discoverable

---

## Phase 6: Real-Time & Activity Feed Integration (P2)

### 6.1 Activity Feed Expansion

Currently `ActivityFeedWidget` is used in some dashboards. Extend to:
- Sponsorship dashboard (sponsor status changes)
- Volunteers dashboard (shift check-ins, timesheet approvals)
- IT dashboard (ticket updates)

### 6.2 Real-Time Subscriptions

Add Supabase Realtime subscriptions for:
- `workspace_sponsors` (status changes)
- `workspace_sponsor_deliverables` (completion tracking)
- `volunteer_time_logs` (new check-ins)
- `workspace_it_tickets` (status updates)

---

## Implementation Order

### Week 1: Foundation (P0)
1. Create missing database tables (`volunteer_time_logs`, `escalation_rules`, `workspace_template_ratings`)
2. Create 8 new data hooks replacing mock data
3. Update 10 sponsorship/marketing components

### Week 2: Communication & Templates (P0)
4. Create edge functions for templates and broadcasts
5. Migrate `WorkspaceCommunication` to Supabase channels
6. Migrate all template components to new architecture
7. Update mobile components to use Supabase directly

### Week 3: Volunteers & Escalation (P1)
8. Complete `useVolunteerTimesheets` implementation
9. Complete `useEscalationRules` with database backing
10. Update volunteer tab components (5 tabs)

### Week 4: Mobile & Polish (P2)
11. Complete mobile checklist items (8 items)
12. Add real-time subscriptions to dashboards
13. Integration testing across all workspace types
14. Performance audit and optimization

---

## Technical Standards Enforcement

### Code Quality
- Remove all `console.log` statements (use Sentry)
- Add proper TypeScript types for all hook returns
- Implement error boundaries for each dashboard section

### Security
- Ensure RLS policies cover new tables
- Add input validation for all mutations
- Implement rate limiting on edge functions

### Performance
- Use `queryPresets` consistently
- Implement proper cache invalidation patterns
- Add prefetching for predictable navigation

### Accessibility
- WCAG 2.1 AA compliance for all new components
- Keyboard navigation for all interactive elements
- Screen reader labels for status indicators

---

## Files to Create

```text
New Files:
├── src/hooks/useSponsors.ts
├── src/hooks/useSponsorDeliverables.ts
├── src/hooks/useCampaigns.ts
├── src/hooks/useAnnouncements.ts
├── src/hooks/useEmailCampaigns.ts
├── src/hooks/usePressReleases.ts
├── src/hooks/useVolunteerTraining.ts
├── src/hooks/useVolunteerRecognitions.ts
├── src/hooks/useVolunteerApplications.ts
├── src/hooks/useWorkspaceTemplates.ts
├── supabase/functions/workspace-templates/index.ts
├── supabase/functions/workspace-reports/index.ts
├── supabase/functions/workspace-broadcast/index.ts
└── supabase/migrations/YYYYMMDD_volunteer_time_logs.sql
```

## Files to Modify

```text
Modified Files (25 components):
├── src/components/workspace/sponsorship/SponsorTracker.tsx
├── src/components/workspace/sponsorship/SponsorCommunications.tsx
├── src/components/workspace/sponsorship/DeliverableTracker.tsx
├── src/components/workspace/sponsorship/ProposalPipeline.tsx
├── src/components/workspace/sponsorship/BenefitsManager.tsx
├── src/components/workspace/marketing/CampaignTracker.tsx
├── src/components/workspace/marketing/AdPerformancePanel.tsx
├── src/components/workspace/marketing/BrandingAssetsManager.tsx
├── src/components/workspace/communication/AnnouncementManager.tsx
├── src/components/workspace/communication/EmailCampaignTracker.tsx
├── src/components/workspace/communication/PressReleaseTracker.tsx
├── src/components/workspace/committee-tabs/TrainingStatusTab.tsx
├── src/components/workspace/department/volunteers/tabs/RecognitionTab.tsx
├── src/components/workspace/department/volunteers/tabs/HoursReportTab.tsx
├── src/components/workspace/department/volunteers/tabs/RecruitmentTab.tsx
├── src/components/workspace/department/volunteers/tabs/ApproveTimesheetsTab.tsx
├── src/components/workspace/department/volunteers/tabs/MassAnnouncementTab.tsx
├── src/components/workspace/WorkspaceCommunication.tsx
├── src/components/workspace/WorkspaceTemplateLibrary.tsx
├── src/components/workspace/WorkspaceTemplateManagement.tsx
├── src/components/workspace/WorkspaceTemplateCreation.tsx
├── src/components/workspace/WorkspaceTemplateRating.tsx
├── src/components/workspace/WorkspaceAnalyticsDashboard.tsx
├── src/hooks/useVolunteerTimesheets.ts
├── src/hooks/useEscalationWorkflow.ts
└── src/lib/query-config.ts
```

---

## Success Metrics

- Zero mock data arrays in production code
- All API calls route through Supabase or Edge Functions
- 100% of workspace tables have corresponding frontend UI
- Mobile checklist fully completed
- Lighthouse performance score > 90
- Zero console errors in production

