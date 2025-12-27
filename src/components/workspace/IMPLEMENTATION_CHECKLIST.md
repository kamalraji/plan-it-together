# Workspace Frontend TODO Checklist

This checklist is a workspace-focused mirror of
`.kiro/specs/event-community-workspace/workspace-frontend-implementation-tasks.md`,
scoped specifically to components under `src/components/workspace/`.

Use it to track progress while implementing and polishing workspace UI.

---

## 1. Workspace Architecture Documentation

### 1.1 Workspace component map doc (README)

- [x] Create `src/components/workspace/README.md` with:
  - [x] High-level overview of the workspace feature (purpose, key flows)
  - [x] List of all workspace components (desktop + mobile) with 1–2 line descriptions
  - [x] Explanation of how `WorkspaceService` routes map to `WorkspaceDashboard` and related components

### 1.2 Spec alignment & cross-links

- [x] In `README.md`, add section **“Mapping to Event Community Workspace spec”**:
  - [x] Provisioning & lifecycle → backend services + `WorkspaceDashboard` and related views
  - [x] Team invitation & role management → `TeamInvitation`, `TeamManagement`, `TeamMemberRoster`, `TeamRosterManagement`
  - [x] Task creation & tracking → `TaskForm`, `TaskList`, `TaskKanbanBoard`, `TaskManagementInterface`, `TaskSummaryCards`
  - [x] Communication → `WorkspaceCommunication` and `communication/*`
  - [x] Analytics & reporting → `WorkspaceAnalyticsDashboard`, `WorkspaceHealthMetrics`, `WorkspaceReportExport`, `WorkspaceAnalyticsChart`
  - [x] Templates → `WorkspaceTemplate*` components and template types
  - [x] Mobile access → `mobile/*` workspace components
- [ ] From the spec files, add a short link/note pointing to
      `src/components/workspace/README.md` as the **frontend reference**.

### 1.3 Architecture visualization

- [x] Add Mermaid diagram in `README.md` showing:
  - [x] `WorkspaceService` → `WorkspaceServiceDashboard` → `WorkspaceListPage` → `WorkspaceDetailPage`
  - [x] How `WorkspaceDetailPage` plugs into `WorkspaceDashboard` tabs
        (Tasks, Team, Communication, Analytics, Reports, Marketplace, Templates)
  - [x] Relationship between desktop `WorkspaceDashboard` and `MobileWorkspaceDashboard`

---

## 2. Enhance Workspace Roles UI

Focus on: `TeamMemberRoster.tsx`, `TeamManagement.tsx`, `TeamRosterManagement.tsx`.

### 2.1 Roles display in team views

- [x] Ensure each member clearly shows workspace role(s) (badge/tag component)
- [x] Align role labels with backend roles / permissions model
- [x] Provide safe fallbacks for empty/unknown roles (e.g. "Member")

### 2.2 Role editing flows

- [x] In `TeamManagement` and related forms:
  - [x] Add clear control (select / segmented control) for changing member roles
  - [x] Show brief descriptions for each role so organizers understand permissions
  - [x] Add optimistic updates and success/error toasts when roles change

### 2.3 Accessibility & responsive behavior

- [x] Make role badges/controls keyboard accessible
- [x] Add screen-reader labels / descriptions for roles and changes
- [x] Verify layouts remain readable and usable on mobile breakpoints

---

## 3. Collaboration Timeline Integration

Main components: `WorkspaceCollaborationTimeline.tsx`, `WorkspaceDashboard.tsx`.

### 3.1 Timeline component

- [x] Implement `WorkspaceCollaborationTimeline` with:
  - [x] Visual timeline / activity feed layout using design tokens
  - [x] Item types: task updates, messages, invitations/role changes, template applications
  - [x] Basic filtering (All / Tasks / Communication / Team)

### 3.2 Data wiring

- [x] Define minimal frontend activity type (shared types)
- [x] Wire into `WorkspaceCollaborationTimeline`
- [x] For now, use mocked data behind feature flag or TODO if backend not ready
- [x] Plan to replace mocks with real queries (React Query + Supabase/REST) once available

### 3.3 Integration into workspace views

- [x] Embed `WorkspaceCollaborationTimeline` in Overview tab of `WorkspaceDashboard`
- [ ] Optionally embed as sidebar/secondary panel in Task and Communication tabs

---

## 4. Workspace Templates in Event Creation

These tasks are primarily about wiring template components into the
**event creation flow**, but tracked here as workspace-related UI work.

Key components: `WorkspaceTemplateLibrary.tsx`, `WorkspaceTemplatePreview.tsx`,
`WorkspaceTemplateRating.tsx`, `WorkspaceTemplateManagement.tsx`.

### 4.1 Template selection during event creation

- [ ] Identify event creation form/page (or wizard) to extend
- [ ] Add **Workspace template** section that uses:
  - [ ] `WorkspaceTemplateLibrary` for template selection
  - [ ] Basic template filters (event size / type / duration) if supported
  - [ ] `WorkspaceTemplatePreview` for live preview

### 4.2 Passing template choice to provisioning

- [ ] Ensure selected template ID/config is:
  - [ ] Stored in event creation form state
  - [ ] Sent with event creation / workspace-provision request
  - [ ] Reflected in organizer confirmation UI (e.g. “Workspace will use template X”)

### 4.3 Post-event template feedback

- [ ] After events complete, surface template feedback UI:
  - [ ] Use `WorkspaceTemplateRating` in a post-event page or workspace summary
  - [ ] Clearly associate feedback with the workspace template used

---

## 5. Enhance Mobile Workspace Experience

Focus on `mobile/*` workspace components.

### 5.1 Mobile navigation polish

- [ ] Review `MobileWorkspaceDashboard`, `MobileWorkspaceHeader`, `MobileNavigation` for:
  - [ ] Clear navigation between Overview / Tasks / Team / Communication / Analytics
  - [ ] Easy workspace switching on mobile
  - [ ] Consistent use of design tokens (colors, typography, spacing)

### 5.2 Mobile task & team flows

- [ ] In `MobileTaskManagement`, `MobileTaskSummary`:
  - [ ] Optimize list/board views for touch (tap targets, drag regions if applicable)
  - [ ] Ensure task creation/edit reuses `TaskForm` patterns and validation

- [ ] In `MobileTeamOverview`, `MobileTeamManagement`:
  - [ ] Make invitation and role management flows straightforward on mobile
  - [ ] Add relevant toasts for success/error

### 5.3 Mobile communication & utilities

- [ ] In `MobileCommunication`, `MobileFeaturesPanel`:
  - [ ] Confirm message composition and channel switching work well on small screens
  - [ ] Ensure optional utilities (photo, voice, location) are discoverable but not intrusive

---

## 6. Ongoing Workspace Maintenance

- [ ] Document any **new** workspace components in `src/components/workspace/README.md`
- [ ] Keep the spec files (`.kiro/specs/event-community-workspace/*`) in sync with
      major frontend milestones for `src/components/workspace/`
