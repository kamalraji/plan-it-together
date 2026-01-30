
# Event Page Builder Enhancement Plan - COMPLETED

## Implementation Status: 100% Complete

## Executive Summary

After thorough analysis of the codebase, I've identified the complete event page builder workflow and several gaps compared to industrial best practices. This plan addresses critical missing functionality including autosave, version history, draft/publish separation, proper preview modes, and SEO validation.

---

## Current Workflow Analysis

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     EVENT PAGE BUILDER WORKFLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │ Page Builder │───►│    Save      │───►│ events.landing_page_ │  │
│   │  (GrapesJS)  │    │   Button     │    │      data (JSONB)    │  │
│   └──────────────┘    └──────────────┘    └──────────────────────┘  │
│          │                                          │                │
│          │                                          ▼                │
│          │                               ┌──────────────────────┐   │
│          │                               │  EventLandingPage    │   │
│          │                               │  (/events/:eventId)  │   │
│          └───────────────────────────────►      renders         │   │
│                  Preview Button          │  sanitized HTML/CSS  │   │
│                  (new tab)               └──────────────────────┘   │
│                                                     │                │
│                                                     ▼                │
│                                          ┌──────────────────────┐   │
│                                          │   PublicEventPage    │   │
│                                          │  (/event/:slug)      │   │
│                                          │  (SEO-friendly URL)  │   │
│                                          └──────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Implementation Details

| Component | Location | Status |
|-----------|----------|--------|
| Page Builder UI | `EventPageBuilder.tsx` | Complete |
| GrapesJS Integration | `usePageBuilder.ts` | Complete |
| Block Library | `pageBuilderBlocks.ts` | Complete (12 event-specific blocks) |
| Template Gallery | `templates/*.ts` | Complete (9 templates) |
| Asset Upload | `grapesjsAssetPlugin.ts` | Complete (Supabase Storage) |
| HTML/CSS Sanitization | `src/utils/sanitize.ts` | Complete (DOMPurify) |
| Rendering (by ID) | `EventLandingPage.tsx` | Complete |
| Rendering (by slug) | `PublicEventPage.tsx` | Complete |
| Route: Builder | `/:orgSlug/eventmanagement/:eventId/page-builder` | Wired |
| Route: Preview by ID | `/events/:eventId` | Wired |
| Route: Public by slug | `/event/:slug` | Wired |

### Data Flow

1. **Builder saves to**: `events.landing_page_data` (JSONB with `html`, `css`, `meta`)
2. **Builder saves slug to**: `events.landing_page_slug` (text, unique)
3. **EventLandingPage** renders if `landingPageData.html` exists
4. **PublicEventPage** queries by `landing_page_slug` for SEO-friendly URLs

---

## Gap Analysis vs Industrial Standards

### Critical Missing Features

| Feature | Industry Standard | Current State | Priority |
|---------|-------------------|---------------|----------|
| Autosave | Every 30s + debounced | Manual save only | P0 |
| Draft/Live separation | Draft edits, publish to go live | Direct save = live | P0 |
| Version History | Rollback to previous versions | None | P1 |
| Undo/Redo persistence | Survives refresh | In-memory only | P1 |
| Preview Mode | Full-screen preview in builder | Opens new tab | P1 |
| Mobile Preview | Responsive preview in canvas | Device switcher only | P2 |
| SEO Validation | Real-time SEO score | None in builder | P2 |
| Collaborative Editing | Lock awareness, live cursors | Lock exists but unused | P2 |
| Template Versioning | Save custom templates | Not implemented | P3 |
| A/B Testing | Multiple variants | Not implemented | P3 |

---

## Implementation Plan

### Phase 1: Autosave & Draft System (P0)

#### 1.1 Add Draft Storage Column

```sql
-- Migration: Add draft_landing_page_data column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS draft_landing_page_data jsonb;

COMMENT ON COLUMN public.events.draft_landing_page_data IS 
  'Working draft of landing page (not yet published)';
```

#### 1.2 Autosave Implementation

Create `useAutosave.ts` hook:
- Debounced save (2 seconds after last change)
- Periodic save (every 30 seconds)
- Save indicator UI (Saving... / Saved / Unsaved changes)
- Save to `draft_landing_page_data` instead of `landing_page_data`

#### 1.3 Publish Draft to Live

Add "Publish" button distinct from "Save":
- "Save" saves to draft (autosave also saves to draft)
- "Publish" copies `draft_landing_page_data` to `landing_page_data`
- Show diff/preview before publishing

#### 1.4 Update Rendering Logic

**EventLandingPage.tsx** / **PublicEventPage.tsx**:
- Always render from `landing_page_data` (the published version)
- Draft is only visible in builder preview

**usePageBuilder.ts**:
- Load from `draft_landing_page_data` if exists, else from `landing_page_data`
- This allows resuming unpublished work

---

### Phase 2: Version History (P1)

#### 2.1 Create Version History Table

```sql
CREATE TABLE public.landing_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  landing_page_data JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  label TEXT, -- Optional label like "v2.0 - Added sponsors"
  UNIQUE(event_id, version_number)
);

CREATE INDEX idx_lpv_event ON landing_page_versions(event_id);

ALTER TABLE landing_page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view versions" ON landing_page_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN workspace_memberships wm ON wm.workspace_id = w.id
      WHERE w.event_id = landing_page_versions.event_id
      AND wm.user_id = auth.uid()
    )
  );
```

#### 2.2 Version Creation Logic

- Auto-create version on "Publish"
- Manual "Save Version" button
- Keep last 20 versions per event
- Show version history panel in builder

#### 2.3 Rollback Functionality

- Select version from history
- Preview before restoring
- Restore copies version to `draft_landing_page_data`
- User must publish to make it live

---

### Phase 3: In-Builder Preview Mode (P1)

#### 3.1 Create PreviewOverlay Component

New file: `src/components/events/page-builder/PreviewOverlay.tsx`

Features:
- Full-screen modal overlay
- Device frame selector (Desktop/Tablet/Mobile)
- Zoom controls
- Close button
- Renders current editor HTML/CSS in isolated iframe

#### 3.2 Update Preview Command

Change `preview-page` command to open overlay instead of new tab:
- Keep "Open in New Tab" as secondary option
- Default to in-builder preview for faster iteration

---

### Phase 4: SEO Validation Panel (P2)

#### 4.1 Create SEO Validator Component

New file: `src/components/events/page-builder/SEOValidator.tsx`

Real-time checks:
- Title tag presence and length (50-60 chars)
- Meta description presence and length (150-160 chars)
- H1 tag presence (exactly one)
- Image alt attributes
- Link text quality
- Mobile viewport meta
- Open Graph tags

#### 4.2 Integrate with Right Panel

Add "SEO" tab to RightPanel alongside Design/Prototype tabs

---

### Phase 5: Collaborative Editing Awareness (P2)

#### 5.1 Use Existing Lock Infrastructure

Current `page_builder_sections` table has:
- `locked_by_user_id`
- `locked_at`

Enhance with:
- Real-time presence via Supabase Realtime
- Show who else is viewing/editing
- Lock warning if someone else has the page open

---

## File Changes Summary

### New Files to Create

| File | Description |
|------|-------------|
| `src/hooks/useAutosave.ts` | Autosave hook with debounce and periodic save |
| `src/components/events/page-builder/PreviewOverlay.tsx` | In-builder preview modal |
| `src/components/events/page-builder/SEOValidator.tsx` | SEO validation panel |
| `src/components/events/page-builder/VersionHistory.tsx` | Version history panel |
| `src/components/events/page-builder/PublishDialog.tsx` | Publish confirmation with preview |
| `src/components/events/page-builder/SaveIndicator.tsx` | Save status indicator |

### Files to Update

| File | Changes |
|------|---------|
| `usePageBuilder.ts` | Add autosave, draft loading, version creation |
| `EventPageBuilder.tsx` | Add SaveIndicator, Publish button, PreviewOverlay |
| `RightPanel.tsx` | Add SEO tab |
| `LeftPanel.tsx` | Add Version History section |
| `EventLandingPage.tsx` | Load from published only (no change needed) |
| `PublicEventPage.tsx` | Load from published only (no change needed) |

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `add_draft_landing_page_data.sql` | Draft storage column |
| `create_landing_page_versions.sql` | Version history table |

---

## Technical Architecture

### Autosave Flow

```text
User Types/Drags
      │
      ▼
  Debounce (2s)
      │
      ▼
┌─────────────┐
│ Save Draft  │───► events.draft_landing_page_data
└─────────────┘
      │
      ▼
 Update UI: "Saved"
```

### Publish Flow

```text
User Clicks "Publish"
         │
         ▼
┌─────────────────────┐
│  PublishDialog      │
│  - Show preview     │
│  - Confirm publish  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Create Version      │───► landing_page_versions
│ (auto-increment)    │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Copy draft to live  │───► events.landing_page_data
└─────────────────────┘
         │
         ▼
  UI: "Published!"
```

---

## Priority Implementation Order

1. **Phase 1: Autosave & Draft** - Critical for preventing data loss
2. **Phase 2: Version History** - Essential for rollback capability
3. **Phase 3: In-Builder Preview** - Improves iteration speed
4. **Phase 4: SEO Validation** - Improves content quality
5. **Phase 5: Collaborative Awareness** - Nice-to-have for teams

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Data loss incidents | Unknown | 0 |
| Save mechanism | Manual only | Autosave + Manual |
| Draft/Live separation | None | Full separation |
| Version rollback | Not possible | Last 20 versions |
| SEO issues caught | Post-publish | Real-time in builder |
| Preview latency | New tab load | Instant overlay |
