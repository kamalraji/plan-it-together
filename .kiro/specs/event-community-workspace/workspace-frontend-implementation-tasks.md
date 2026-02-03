# Event Community Workspace – Frontend Implementation Tasks

This implementation task file tracks the **workspace frontend** work, based on the current component map and the Event Community Workspace spec. Check items off as they are completed.

---

## Legend

- [ ] ⬜ Not started / In progress
- [x] ✅ Completed

Update this file as you complete tasks (one by one), marking each checkbox.

---

## 1. Add Workspace Architecture Doc

Create a source-of-truth document that maps the spec to actual components and routes.

### 1.1. Workspace component map doc

- [x] Create `src/components/workspace/README.md` with:
  - [x] High-level overview of the workspace feature (purpose, key flows)
  - [x] List of all workspace components (desktop + mobile) with 1–2 line descriptions
  - [x] Section explaining how `WorkspaceService` routes map to `WorkspaceDashboard` and related components

### 1.2. Spec alignment & cross-links

- [x] In the new README, add a section **"Mapping to Event Community Workspace spec"**:
  - [x] Map provisioning & lifecycle requirements to backend services + `WorkspaceService`/`WorkspaceDashboard`
  - [x] Map team invitation & role management requirements to `TeamInvitation`, `TeamManagement`, `TeamRosterManagement`
  - [x] Map task creation and tracking requirements to task components (`TaskForm`, `TaskList`, `TaskKanbanBoard`, `TaskManagementInterface`, `TaskSummaryCards`)
  - [x] Map communication requirements to `WorkspaceCommunication` and `communication/*`
  - [x] Map analytics and reporting requirements to `WorkspaceAnalyticsDashboard`, `WorkspaceHealthMetrics`, `WorkspaceReportExport`
  - [x] Map template requirements to `WorkspaceTemplate*` components and `workspace-template` types
  - [x] Map mobile access requirements to all `Mobile*` workspace components

- [x] Add a short link/note from `.kiro/specs/event-community-workspace/tasks.md` or `implementation-task.md` pointing to the new `src/components/workspace/README.md` as the frontend reference.

### 1.3. Architecture visualization

- [x] Add a Mermaid diagram in `src/components/workspace/README.md` that shows:
  - [x] `WorkspaceService` (service entry) → `WorkspaceServiceDashboard` → `WorkspaceListPage` → `WorkspaceDetailPage`
  - [x] How `WorkspaceDetailPage` plugs into `WorkspaceDashboard` and tabs (Tasks, Team, Communication, Analytics, Reports, Marketplace, Templates)
  - [x] Relationship between desktop `WorkspaceDashboard` and `MobileWorkspaceDashboard`

---

## 2. Enhance Workspace Roles UI

Clarify and improve how roles are surfaced and managed in the workspace UI.

### 2.1. Roles display in team views

- [ ] Review `TeamMemberRoster`, `TeamManagement`, and `TeamRosterManagement` to ensure:
  - [ ] Each member shows their workspace role(s) clearly (badge or tag)
  - [ ] Role labels align with backend roles / permissions model
  - [ ] Empty or unknown roles have safe fallbacks in the UI

### 2.2. Role editing flows

- [ ] In `TeamManagement` and/or related forms:
  - [ ] Provide a clear control (select / segmented control) for changing member roles
  - [ ] Show brief descriptions for each role so organizers understand permissions
  - [ ] Add optimistic updates and clear success/error toasts when roles change

### 2.3. Accessibility & responsive behavior

- [ ] Ensure role badges and controls are:
  - [ ] Keyboard accessible
  - [ ] Screen-reader friendly (ARIA labels, role descriptions)
  - [ ] Responsive and readable on mobile breakpoints

---

## 3. Add Collaboration Timeline

Add a timeline view that surfaces recent workspace activity (tasks, messages, team changes).

### 3.1. Timeline component

- [x] Design and create a new `WorkspaceCollaborationTimeline` component under `src/components/workspace/`:
  - [x] Visual timeline or activity feed layout using existing design system tokens
  - [x] Item types: task updates, new messages, invitations/role changes, template applications
  - [x] Support basic filtering (e.g., All / Tasks / Communication / Team)

### 3.2. Data wiring

- [x] Define a minimal frontend activity type (in a shared types file) and wire it into the component
- [x] Integrate with existing data sources or placeholders:
  - [x] For now, if backend endpoints are not ready, use mocked data behind a feature flag or clearly marked TODO
  - [x] Once backend API is available, replace mocks with real queries (e.g., via React Query + Supabase/REST)

### 3.3. Integration into workspace views

- [x] Embed `WorkspaceCollaborationTimeline` into appropriate pages:
  - [x] Overview tab of `WorkspaceDashboard`
  - [x] Optionally as a sidebar/secondary panel in task and communication tabs
  - [x] Added MessageDeliveryAnalytics, ChannelModerationTools, ScheduledMessageComposer to WorkspaceCommunication

---

## 4. Integrate Workspace Templates into Event Creation

Wire workspace templates into the event creation and workspace provisioning flow (frontend side).

### 4.1. Template selection during event creation

- [x] Identify the event creation form/page (or wizard) to extend
- [x] Add a **"Workspace template"** step/section with:
  - [x] A template selector powered by `TemplateSection` component in EventFormPage
  - [x] Basic filters (event size, type) available in the template types
  - [x] Preview shows template name, complexity, usage count

### 4.2. Passing template choice to workspace provisioning

- [x] Ensure the selected template ID or config is:
  - [x] Stored in local form state (`selectedTemplate` state in EventFormPage)
  - [x] Sent with workspace provision call on submit (via URL param `templateId`)
  - [x] Reflected in UI confirmation via `PostCreateOptionsDialog`

### 4.3. Post-event feedback into templates

- [x] After events complete, expose template feedback UI:
  - [x] `PostEventRatingPrompt` component exists for template feedback
  - [x] Tied to template used via workspace metadata

---

## 5. Enhance Mobile Workspace Experience

Refine and polish the mobile workspace experience using existing responsive components.

### 5.1. Mobile navigation polish

- [x] Using `ResponsiveWorkspaceDashboard` and `useIsMobile` hook for:
  - [x] Clear navigation between Overview / Tasks / Team / Communication / Analytics
  - [x] Easy workspace switching via responsive sidebar
  - [x] Consistent use of design tokens (colors, typography, spacing)

### 5.2. Mobile task & team flows

- [x] Task management:
  - [x] `TaskManagementInterface` is responsive with touch-friendly controls
  - [x] Task creation/edit uses shared `TaskFormModal` with validation

- [x] Team management:
  - [x] `TeamManagement` and `TeamRosterManagement` work on mobile breakpoints
  - [x] Toast notifications implemented via `useToast` hook

### 5.3. Mobile communication & utilities

- [x] Communication:
  - [x] `WorkspaceCommunication` uses responsive grid layouts
  - [x] Channel switching and message composition work on small screens
  - [x] Activity tab provides timeline view on mobile

---

## 6. Ongoing maintenance

Use this section to log ad-hoc improvements or bug fixes discovered while working on the above tasks.

- [x] Document any new workspace-related components in `src/components/workspace/README.md`
- [x] Keep `.kiro/specs/event-community-workspace/tasks.md` in sync with major frontend milestones
