# Workspace Architecture & Component Map

This document describes the **Event Community Workspace** frontend architecture and how it maps to the spec in `.kiro/specs/event-community-workspace`.

It covers:
- Service-level routing for workspaces
- Core workspace components (desktop)
- Mobile workspace components
- How everything maps back to the Event Community Workspace requirements
- A high-level architecture diagram

---

## 1. High-level overview

The Event Community Workspace feature provides a **collaboration hub per event**, where organizers and team members can:

- Manage tasks and deadlines
- Coordinate team members and roles
- Communicate in workspace-scoped channels
- Track workspace health, analytics, and reports
- Use templates to standardize repeatable event workflows
- Access all of the above on both desktop and mobile

At a high level, the frontend is organized as:

- **Service layer (routing)** – `WorkspaceService` and related pages under `src/components/routing/services`.
- **Workspace feature components** – All workspace UI and logic under `src/components/workspace`.
- **Mobile workspace surface** – Mobile-optimized views under `src/components/workspace/mobile`.

---

## 2. Service-level pages (routing layer)

All workspace routes are owned by the **Workspace Management Service** under:

- `src/components/routing/services/WorkspaceService.tsx`
- `src/components/routing/services/WorkspaceServiceDashboard.tsx`
- `src/components/routing/services/WorkspaceListPage.tsx`
- `src/components/routing/services/WorkspaceDetailPage.tsx`

### 2.1. WorkspaceService

**File:** `src/components/routing/services/WorkspaceService.tsx`

Responsible for high-level routing:

- `index` → `WorkspaceServiceDashboard`
- `/list` → `WorkspaceListPage`
- `/:workspaceId` → `WorkspaceDetailPage` (overview)
- `/:workspaceId/tasks` → `WorkspaceDetailPage` (Tasks tab)
- `/:workspaceId/team` → `WorkspaceDetailPage` (Team tab)
- `/:workspaceId/communication` → `WorkspaceDetailPage` (Communication tab)
- `/:workspaceId/analytics` → `WorkspaceDetailPage` (Analytics tab)
- `/:workspaceId/reports` → `WorkspaceDetailPage` (Reports tab)
- `/:workspaceId/marketplace` → `WorkspaceDetailPage` (Marketplace tab)
- `/:workspaceId/templates` → `WorkspaceDetailPage` (Templates tab)

### 2.2. WorkspaceServiceDashboard

**File:** `src/components/routing/services/WorkspaceServiceDashboard.tsx`

Service “home” page for workspaces:

- Aggregated view of all workspaces (cards, metrics, shortcut actions)
- Entry point for navigators who think in terms of "services" rather than a single event

### 2.3. WorkspaceListPage

**File:** `src/components/routing/services/WorkspaceListPage.tsx`

Resource list page for all workspaces:

- Filterable/paginated list of workspaces
- Integration point for search, filters (status, event, owner, etc.)

### 2.4. WorkspaceDetailPage

**File:** `src/components/routing/services/WorkspaceDetailPage.tsx`

Per-workspace resource detail page:

- Creates workspace-scoped layout (tabs, header, context)
- Delegates inner UI to `WorkspaceDashboard` (desktop) and `MobileWorkspaceDashboard` (mobile)
- Exposes route-level `defaultTab` props to deep-link to specific tabs (Tasks, Team, Communication, etc.)

---

## 3. Core workspace components (desktop)

All exported via `src/components/workspace/index.ts`.

### 3.1. Dashboards & navigation

- **`WorkspaceDashboard.tsx`**
  - Main in-app workspace view.
  - Fetches workspace data and renders: `WorkspaceHeader`, `WorkspaceNavigation`, and tab content (Tasks, Team, Communication, Analytics, Reports, Marketplace, Templates).

- **`ResponsiveWorkspaceDashboard.tsx`**
  - Wrapper that chooses **desktop vs mobile** dashboard implementations based on screen size.
  - Entry point used by routing when you want a single "smart" workspace dashboard.

- **`WorkspaceHeader.tsx`**
  - Workspace title, description, status, related event info, primary actions (invite, manage tasks, etc.).

- **`WorkspaceNavigation.tsx`**
  - Tabbed navigation across workspace sections (Overview, Tasks, Team, Communication, Analytics, Reports, Marketplace, Templates).

- **`WorkspaceHealthMetrics.tsx`**
  - High-level health cards: completion %, overdue tasks, active members, channel activity.

### 3.2. Analytics & reporting

- **`WorkspaceAnalyticsDashboard.tsx`**
  - Detailed analytics view for a single workspace (task burn-down, workload distribution, channel activity, etc.).

- **`WorkspaceAnalyticsChart.tsx`**
  - Reusable chart primitive (SVG/`recharts`) used for workspace metrics.

- **`WorkspaceReportExport.tsx`**
  - UI to export workspace data (CSV/PDF or similar) for reporting and post-event analysis.

### 3.3. Team management

- **`TeamMemberRoster.tsx`**
  - List of workspace members with roles, statuses, and activity details.

- **`TeamManagement.tsx`**
  - Full team management surface (inviting, promoting/demoting, removing members).

- **`TeamInvitation.tsx`**
  - Invitation form and workflow for adding new team members.

- **`TeamRosterManagement.tsx`**
  - Advanced roster controls (filters, bulk actions, role changes).

### 3.4. Task management

- **`TaskSummaryCards.tsx`**
  - Summary stats for tasks (completed, in progress, overdue, per-category breakdowns).

- **`TaskList.tsx`**
  - Tabular/list view of tasks, often used in the Tasks tab and mobile overlays.

- **`TaskKanbanBoard.tsx`**
  - Kanban board grouped by status (e.g., Backlog, In Progress, Blocked, Done).

- **`TaskManagementInterface.tsx`**
  - High-level task surface combining list/board, filters, and quick actions.

- **`TaskForm.tsx`**
  - Form used to create or edit a workspace task.

- **`TaskFormModal.tsx`**
  - Modal wrapper for `TaskForm` used for quick-create/edit flows.

- **`TaskDetailView.tsx`**
  - Full detail page/section for a single task (description, assignee, comments, files).

### 3.5. Templates

- **`WorkspaceTemplateLibrary.tsx`**
  - Browsing and picking workspace templates (by event type, size, etc.).

- **`WorkspaceTemplateCreation.tsx`**
  - Turn an existing workspace into a reusable template.

- **`WorkspaceTemplatePreview.tsx`**
  - Preview template contents (roles, tasks, channels, milestones).

- **`WorkspaceTemplateRating.tsx`**
  - Capture post-event feedback on how effective a template was.

- **`WorkspaceTemplateManagement.tsx`**
  - Orchestrates full template lifecycle: browse → create → apply → rate.

### 3.6. Communication (workspace-scoped)

**Folder:** `src/components/workspace/communication`

- **`BroadcastComposer.tsx`** – Compose and send broadcast messages to workspace members.
- **`ChannelList.tsx`** – List of workspace communication channels.
- **`MessageComposer.tsx`** – Channel message composer.
- **`MessageSearch.tsx`** – Search over workspace messages.
- **`MessageThread.tsx`** – View a channel conversation.
- **`index.ts`** – Re-exports communication components.

- **`WorkspaceCommunication.tsx`** (in the workspace root)
  - Main workspace communication hub; integrates `ChannelList`, `MessageThread`, `BroadcastComposer`, and search.

---

## 4. Mobile workspace components

All mobile-specific components live under `src/components/workspace/mobile` and are re-exported via `src/components/workspace/mobile/index.ts` and then `src/components/workspace/index.ts`.

- **`MobileWorkspaceDashboard.tsx`**
  - Mobile-first view of the workspace dashboard with bottom navigation and condensed sections.

- **`MobileWorkspaceHeader.tsx`**
  - Compact header with workspace name, status, menu toggle, and notifications.

- **`MobileNavigation.tsx`**
  - Slide-out navigation for tabs and workspace switching.

- **`MobileTaskSummary.tsx`**
  - Compact statistics and upcoming tasks list.

- **`MobileTaskManagement.tsx`**
  - Task list/board optimized for touch interactions.

- **`MobileTeamOverview.tsx`**
  - Snapshot of team metrics and key members.

- **`MobileTeamManagement.tsx`**
  - Manage team invitations and roles on mobile.

- **`MobileCommunication.tsx`**
  - Mobile communication hub (channels + messages).

- **`MobileSettings.tsx`**
  - Mobile-specific settings for notifications, offline behavior, etc.

- **`MobileFeaturesPanel.tsx`**
  - Utility panel for photos, voice notes, and location capture in workspace context.

---

## 5. Supporting types & templates

- **`src/types/workspace-template.ts`**
  - Frontend type definitions for `WorkspaceTemplate` (roles, tasks, channels, milestones, metadata, effectiveness, etc.).

These types are used across:

- `WorkspaceTemplate*` components
- Event creation / workspace provisioning flows (when templates are applied)

---

## 6. Architecture diagram (Mermaid)

Below is a high-level diagram of how the workspace routing and components fit together.

<presentation-mermaid>
flowchart LR
  subgraph ServiceLayer[Workspace Service Routing]
    WSVC[WorkspaceService]
    WSD[WorkspaceServiceDashboard]
    WSL[WorkspaceListPage]
    WDET[WorkspaceDetailPage]
  end

  subgraph WorkspaceDesktop[Workspace Desktop]
    WD[WorkspaceDashboard]
    WH[WorkspaceHeader]
    WN[WorkspaceNavigation]

    subgraph Tasks
      TMS[TaskManagementInterface]
      TL[TaskList]
      TKB[TaskKanbanBoard]
      TF[TaskForm]
      TFM[TaskFormModal]
      TDV[TaskDetailView]
    end

    subgraph Team
      TMR[TeamMemberRoster]
      TMGT[TeamManagement]
      TINV[TeamInvitation]
      TRM[TeamRosterManagement]
    end

    subgraph Comm[Communication]
      WC[WorkspaceCommunication]
      CL[ChannelList]
      MT[MessageThread]
      MC[MessageComposer]
      MS[MessageSearch]
      BC[BroadcastComposer]
    end

    subgraph Analytics
      WAD[WorkspaceAnalyticsDashboard]
      WAC[WorkspaceAnalyticsChart]
      WRX[WorkspaceReportExport]
      WHM[WorkspaceHealthMetrics]
    end

    subgraph Templates
      WTL[WorkspaceTemplateLibrary]
      WTC[WorkspaceTemplateCreation]
      WTP[WorkspaceTemplatePreview]
      WTR[WorkspaceTemplateRating]
      WTM[WorkspaceTemplateManagement]
    end
  end

  subgraph WorkspaceMobile[Workspace Mobile]
    RWD[ResponsiveWorkspaceDashboard]
    MWD[MobileWorkspaceDashboard]
    MWH[MobileWorkspaceHeader]
    MN[MobileNavigation]
    MTS[MobileTaskSummary]
    MTM[MobileTaskManagement]
    MTO[MobileTeamOverview]
    MTMG[MobileTeamManagement]
    MCOM[MobileCommunication]
    MSF[MobileSettings]
    MFP[MobileFeaturesPanel]
  end

  WSVC -->|index| WSD
  WSVC -->|/list| WSL
  WSVC -->|/:workspaceId/*| WDET

  WDET --> WD
  WD --> WH
  WD --> WN

  WD --> TMS & TMGT & WC & WAD & WTL
  RWD --> WD
  RWD --> MWD
  MWD --> MWH & MN & MTS & MTM & MTO & MTMG & MCOM & MSF & MFP
</presentation-mermaid>

---

## 7. Mapping to Event Community Workspace spec

This section ties the live code to key requirements in:

- `.kiro/specs/event-community-workspace/requirements.md`
- `.kiro/specs/event-community-workspace/tasks.md`

> Note: IDs and numbering below refer to that spec; this section should be updated whenever the spec evolves.

### 7.1. Provisioning & lifecycle (Req 1, 10)

- **Concept:** Automatically create and manage workspaces for events, handle status transitions, and lifecycle.
- **Backend:** Prisma models and services (`WorkspaceService` backend, not to be confused with the React component), plus routes under `backend/src/routes/workspace.routes.ts`.
- **Frontend:**
  - `WorkspaceService.tsx` – entry point for workspace-related routes.
  - `WorkspaceServiceDashboard.tsx` – global view of provisioned workspaces.
  - `WorkspaceDashboard.tsx` – per-workspace view showing lifecycle status and health.

### 7.2. Team invitation & role management (Req 2, 3)

- **Concept:** Invite collaborators, assign roles, manage roster.
- **Frontend components:**
  - `TeamInvitation.tsx` – invite flows.
  - `TeamManagement.tsx` – role changes, removal, and roster actions.
  - `TeamMemberRoster.tsx` and `TeamRosterManagement.tsx` – roster views and filters.
  - `MobileTeamOverview.tsx` and `MobileTeamManagement.tsx` – mobile equivalents.

### 7.3. Task creation, assignment, and progress tracking (Req 4, 5)

- **Concept:** Create tasks with owners, deadlines, categories; track status over time.
- **Frontend components:**
  - `TaskForm.tsx` & `TaskFormModal.tsx` – task creation/edit.
  - `TaskList.tsx` – list/table view.
  - `TaskKanbanBoard.tsx` – Kanban by status.
  - `TaskManagementInterface.tsx` – combined control surface.
  - `TaskSummaryCards.tsx` – high-level stats.
  - `MobileTaskSummary.tsx` & `MobileTaskManagement.tsx` – mobile views.

### 7.4. Integrated communication system (Req 7)

- **Concept:** Workspace-scoped channels, broadcasts, and history search.
- **Frontend components:**
  - `WorkspaceCommunication.tsx` – main hub.
  - `communication/ChannelList.tsx`, `MessageThread.tsx`, `MessageComposer.tsx`, `MessageSearch.tsx`, `BroadcastComposer.tsx` – supporting pieces.
  - `MobileCommunication.tsx` – mobile communication surface.

### 7.5. Workspace dashboard, analytics, and reports (Req 8, 9)

- **Concept:** Provide organizers with visibility into progress, workload, and collaboration health.
- **Frontend components:**
  - `WorkspaceDashboard.tsx` – overview tab.
  - `WorkspaceHealthMetrics.tsx` – health indicators.
  - `WorkspaceAnalyticsDashboard.tsx` & `WorkspaceAnalyticsChart.tsx` – charts and metrics.
  - `WorkspaceReportExport.tsx` – reporting/export.
  - `WorkspaceServiceDashboard.tsx` – cross-workspace analytics entry.

### 7.6. Workspace templates & standardization (Req 11)

- **Concept:** Reusable templates for typical event workspaces.
- **Frontend components:**
  - `WorkspaceTemplateLibrary.tsx` – discover/pick templates.
  - `WorkspaceTemplateCreation.tsx` – create templates from existing workspaces.
  - `WorkspaceTemplatePreview.tsx` – preview structure.
  - `WorkspaceTemplateRating.tsx` – feedback.
  - `WorkspaceTemplateManagement.tsx` – lifecycle orchestration.
- **Types:**
  - `src/types/workspace-template.ts` – shared template model.

### 7.7. Mobile workspace access (Req 12)

- **Concept:** Ensure workspace collaboration is usable from phones on event day.
- **Frontend components:**
  - `ResponsiveWorkspaceDashboard.tsx` – chooses mobile vs desktop.
  - `MobileWorkspaceDashboard.tsx` & `MobileWorkspaceHeader.tsx` – top-level mobile layout.
  - `MobileNavigation.tsx` – mobile navigation.
  - `MobileTaskSummary.tsx`, `MobileTaskManagement.tsx` – tasks on mobile.
  - `MobileTeamOverview.tsx`, `MobileTeamManagement.tsx` – team management.
  - `MobileCommunication.tsx` – messaging.
  - `MobileSettings.tsx`, `MobileFeaturesPanel.tsx` – utilities and settings.

---

## 8. How to maintain this document

- Whenever you add a **new workspace-related component**, append it to the relevant section above.
- When you update or extend the **Event Community Workspace spec**, revisit the mapping in §7.
- Use this README as a starting point when onboarding contributors or planning new workspace features.
