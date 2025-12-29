# Organizer Organization-Scoped Dashboard – Implementation Tasks

# Remember : backend is for reference only(future expansion plan). Use . kiro for all reference

This document tracks the implementation of the organizer login flow and organization-scoped routing (`/:orgSlug/...`).

## Legend

- ✅ Completed
- ⬜ Not started / In progress
  Right now all the attendance pieces (`QRCodeDisplay`, `QRCodeScanner`, `AttendanceList`, `VolunteerCheckInInterface`) still talk to the old **backend REST API** via `api.get/post(...)`. The Supabase schema only has `onboarding_checklist`, `organizations`, `organizer_approvals`, and `user_roles`, so:

- Attendance & events are **not yet modeled in Supabase**.
- QR codes are effectively **registration-specific** in the current frontend types (`Registration.qrCode`, `QRCodeData.registrationId`), not user-specific.

You want to:

1. Make the attendance QR **user-specific** (one QR reused across all events).
2. On scan, show **user profile information** to organizers/volunteers.
3. Implement **real-time attendance updates** (polling or websockets) using **Supabase**, not the Node backend.
4. If anything truly can’t be done in Supabase, note it in `.kiro/specs/thittam1hub/implementation-task.md`.

Everything you’re asking is feasible in Supabase. The main work is:

- Designing **Supabase tables & RLS** for events, registrations, attendance, and user QR.
- Implementing **Edge Functions** for attendance logic.
- Rewiring the React attendance components to use **Supabase** instead of `api`.

Below is a concrete implementation plan that replaces the backend implementation with a Supabase-based one.

---

1.  Clarify target behaviour and deprecate backend-based attendance
    1.1. Treat the existing `backend/` attendance code as **reference only**; do not rely on its APIs at runtime.
    1.2. Define the desired semantics clearly: - Each authenticated user has **one permanent QR code** (`qr_code`), stored in Supabase. - Check-in for a given event: - Organizer scans QR → system resolves user by `qr_code`. - System verifies there is a `registration` for `(user_id, event_id)` with `CONFIRMED` status. - If valid, insert a row into `attendance_records`. - Scanner UI shows **user profile info + registration status + check-in result**. - Organizer views **live** attendance stats and list per event (and optionally per session).
    1.3. Plan to **remove or ignore** old REST endpoints in frontend: - `/attendance/validate-qr`, `/attendance/check-in`,
    `/attendance/manual-check-in`, `/attendance/registrations/:id/*`,
    `/attendance/events/:eventId/report`, `/attendance/events/:eventId/sessions/:sessionId`. - Replace them with Supabase Edge Functions or direct table queries.

2.  Supabase data model for events, registrations, attendance, and user QR
    (using the `ltsniuflqfahdcirrmjh` project in `src/integrations/supabase/types.ts` as source of truth)

    2.1. **Add events table** (schema-level design) - Create table `public.events`: - `id uuid primary key default gen_random_uuid()` - `name text not null` - `description text` - `mode public.event_mode not null` - `start_date timestamptz not null` - `end_date timestamptz not null` - `capacity integer` - `visibility public.event_visibility not null default 'PUBLIC'` - `status public.event_status not null default 'DRAFT'` - `organization_id uuid references organizations(id) on delete set null` - `created_at timestamptz not null default now()` - `updated_at timestamptz not null default now()` - RLS policies: - `SELECT`: public (or at least all authenticated users), matching current app’s expectation that participants can see events. - `INSERT/UPDATE/DELETE`: restricted to organizers/admins: - e.g. `USING public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')`.

    2.2. **Add registrations table** - Create table `public.registrations`: - `id uuid primary key default gen_random_uuid()` - `event_id uuid not null references events(id) on delete cascade` - `user_id uuid not null references auth.users(id) on delete cascade` - `status public.registration_status not null default 'PENDING'` - `form_responses jsonb not null default '{}'::jsonb` - `created_at timestamptz not null default now()` - `updated_at timestamptz not null default now()` - Index: - Unique `(event_id, user_id)` to ensure one registration per user per event. - RLS: - Participants can `SELECT` & `UPDATE` **their own registrations**: - `USING (user_id = auth.uid())`, `WITH CHECK (user_id = auth.uid())`. - Organizers/admins can manage registrations for events they own: - `USING public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')`.

    2.3. **Add attendance_records table** - Create `public.attendance_records`: - `id uuid primary key default gen_random_uuid()` - `event_id uuid not null references events(id) on delete cascade` - `registration_id uuid not null references registrations(id) on delete cascade` - `user_id uuid not null references auth.users(id) on delete cascade` - `session_id text null` (or `uuid` if you later create a sessions table) - `check_in_time timestamptz not null default now()` - `check_in_method text not null check (check_in_method in ('QR_SCAN', 'MANUAL'))` - `volunteer_id uuid null references auth.users(id)` - Indexes: - `(event_id, registration_id)` to quickly check duplicates. - RLS: - Participants should be allowed to **view their own attendance**: - `USING (user_id = auth.uid())`. - Organizers/admins/volunteers can see attendance for their events: - `USING public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer')`. - Only organizers/admins/volunteers can `INSERT`: - `WITH CHECK (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'))`. - Optionally disallow `UPDATE/DELETE` except admins.

    2.4. **Add user_profiles table with a user-specific QR code** - Create `public.user_profiles`: - `id uuid primary key references auth.users(id) on delete cascade` - `full_name text` - `phone text` - `organization text` - `qr_code text unique not null` - `created_at timestamptz not null default now()` - RLS: - `SELECT/UPDATE` own profile: `USING (id = auth.uid())`, `WITH CHECK (id = auth.uid())`. - Organizers/admins/volunteers may need `SELECT` to display profile info at check-in: - `USING (id = auth.uid() OR public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'))`.

    2.5. **Automatic QR code assignment on signup** - Create a function `public.handle_new_user_with_qr()` (security definer) similar to the provided `profiles` example, that: - Inserts into `user_profiles (id, full_name, qr_code)` when a new row appears in `auth.users`. - Uses `gen_random_uuid()` or a secure random string for `qr_code`. - Create trigger `on_auth_user_created` on `auth.users` to call this function. - This guarantees every user has a **stable `qr_code`**.

    2.6. **Realtime support** - For `attendance_records`: - `ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;` - Add table to `supabase_realtime` publication: - `ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;` - This enables Supabase’s Realtime API to stream inserts to the frontend for live updates.

3.  Supabase Edge Functions for attendance + QR
    3.1. Create Edge Function `attendance-qr` - Purpose: return QR data for the **current user** (user-specific QR) and check-in status for a given event. - Input (via `supabase.functions.invoke('attendance-qr')`): - `{ eventId: string }` - Steps (inside `supabase/functions/attendance-qr/index.ts`): - Get authenticated user: `const { data: { user } } = await supabase.auth.getUser();` - Fetch `user_profiles` row for `user.id` to get `qr_code`. - Optionally ensure a `registrations` row exists for `(eventId, user.id)`; if none, return a clear error that they’re not registered for the event. - Generate (or reuse cached) QR image: - Either: - Store only `qr_code` and let frontend generate the image; or - Use a small Deno QR library to generate a PNG and return a data URL. - Fetch latest attendance record for `(eventId, user.id)` to show check-in status. - Return: - `code: profile.qr_code` - `imageUrl: 'data:image/png;base64,...'` (or `null` if frontend generates it) - `eventId`, `userId` - `latestAttendance` fields used by `QRCodeDisplay`.

    3.2. Create Edge Function `attendance-checkin` - Purpose: handle **scan + check-in** by volunteers/organizers. - Input: - `{ qrCode: string; eventId: string; sessionId?: string }` - Steps: - Get caller user (`volunteer`) and verify they have `organizer`/`admin`/`volunteer` role via `public.has_role`. - Look up `user_profiles` by `qr_code = qrCode`: - If not found, return `valid = false`. - Look up `registrations` where `event_id = eventId` and `user_id = profile.id` and `status in ('CONFIRMED', 'PENDING')`. - If none, return "User is not registered for this event". - Check if an `attendance_records` row already exists for `(eventId, registrationId, sessionId)`: - If yes, return a duplicate-check-in message (and avoid new insert). - Insert into `attendance_records`: - `event_id`, `registration_id`, `user_id`, `session_id`, `volunteer_id = auth.uid()`, `check_in_method = 'QR_SCAN'`. - Return: - `attendanceRecord`: inserted row. - `participantInfo`: `{ name: profile.full_name, email: auth.users.email, registrationId, qrCode }`. - A flag `valid: true`.

    3.3. Create Edge Function `attendance-report` - Purpose: replace `/attendance/events/:eventId/report` and `/sessions/:sessionId`. - Input: - `{ eventId: string; sessionId?: string }` - Steps: - Check that caller has permission (organizer/admin/volunteer). - Query `registrations` + join with: - `user_profiles` for `full_name` - `auth.users` for email (if needed; or store email in profiles). - Left join with `attendance_records` filtered by `eventId` and optional `sessionId`. - Build the `AttendanceReport` shape the frontend expects: - `eventId`, `totalRegistrations`, `attendedCount`, `checkInRate`, `attendanceRecords[]` with fields: - `registrationId`, `userId`, `userName`, `userEmail`, `status`, `attended`, `checkInTime`, `checkInMethod`, `sessionId`, `volunteerId`. - Return this JSON.

    3.4. Create Edge Function `attendance-manual-checkin` - Purpose: support the existing manual check-in flow in `AttendanceList`. - Input: - `{ registrationId: string; sessionId?: string }` - Steps: - Validate organizer/admin/volunteer role. - Find `registrations` row and ensure it matches the event expected (or require `eventId` in payload). - Insert attendance with `check_in_method = 'MANUAL'`. - Return the inserted record; frontend will refetch the report.

    3.5. Configure CORS & JWT - Each function: - Adds CORS headers as in the instructions. - Handles `OPTIONS` requests. - All functions remain **authenticated** (do not set `verify_jwt = false`), because they expose sensitive attendance data and write operations.

4.  Frontend: wire attendance components to Supabase + user-specific QR
    4.1. Replace `api` usage in attendance components - In `src/components/attendance/QRCodeDisplay.tsx`: - Replace: - `api.get('/attendance/registrations/${registration.id}/qr-code')` - `api.get('/attendance/registrations/${registration.id}')` - With `supabase.functions.invoke`: - For QR: - `supabase.functions.invoke('attendance-qr', { body: { eventId: registration.eventId } })` - Use current auth session; server infers `user_id`. - For attendance records: - Either: - Call `attendance-report` filtered to that user & event; or - Create a small function to fetch attendance by `registrationId`. - Update `QRCodeData` type if needed to reflect that it is **user-based** (contains `userId` and does not rely strongly on `registrationId`). - Update UI copy to clarify: - “This QR code is your personal check-in ID. You can reuse it at any event you’re registered for.”

        - In `src/components/attendance/QRCodeScanner.tsx`:
          - Replace `api.post('/attendance/validate-qr', ...)` with:
            - `supabase.functions.invoke('attendance-checkin', { body: { qrCode, eventId, sessionId } })`.
            - Parse the result to update `ScanResult`:
              - `participantInfo` from `participantInfo` in the function response.
              - `data` from `attendanceRecord`.
          - For manual mode:
            - Use the same `attendance-checkin` function; the function itself will validate the QR and perform check-in in one step.
          - Ensure `onSuccess` handler invalidates:
            - `['attendance-report', eventId, sessionId]` via `queryClient.invalidateQueries(...)`.

        - In `src/components/attendance/AttendanceList.tsx`:
          - Replace:
            - `api.get(/attendance/events/.../report)` with:
              - `supabase.functions.invoke('attendance-report', { body: { eventId, sessionId } })`.
          - Replace manual check-in POST with:
            - `supabase.functions.invoke('attendance-manual-checkin', { body: { registrationId, sessionId } })`.
          - Keep `refetchInterval: 5000` for near real-time polling.

        - In `VolunteerCheckInInterface.tsx`:
          - Replace `api.get(/events/${eventId})` with a Supabase call:
            - Either:
              - Direct table query `supabase.from('events').select('*').eq('id', eventId).maybeSingle()`.
            - Or:
              - A small edge function if additional derived data is needed.
          - Everything else (passing `eventId` to `QRCodeScanner` and `AttendanceList`) remains the same.

        - In any other places where attendance endpoints are used (search for `/attendance/`), migrate them similarly to Supabase functions.

    4.2. Show profile information on scan - Ensure `attendance-checkin` returns `participantInfo`: - `{ name: profile.full_name, email: user.email, organization: profile.organization, qrCode }`. - In `QRCodeScanner`, extend the `participantInfo` type to include `organization` (and later avatar, etc.). - After a scan: - Render a card with: - Name, email, organization. - “Registered for this event: Yes/No”. - Check-in status / time.

    4.3. Confirm user-specific QR semantics in UI - In `ParticipantDashboard` (where QR passes are surfaced): - Keep existing “View Event Pass” modal but clarify copy: - “This QR is your universal check-in code; it works for any event where you have a confirmed registration.”

5.  Real-time updates with Supabase (polling + optional Realtime)
    5.1. Keep **polling** as baseline - You already set `refetchInterval: 5000` in `AttendanceList`; that’s acceptable as “real-time via polling”. - After migrating to Supabase functions, keep this interval.

    5.2. Add **Realtime push updates** (optional but recommended) - In components that should react instantly to new check-ins: - `VolunteerCheckInInterface` (for `recentCheckIns` list and quick stats). - Possibly any organizer analytics page that shows attendance counts. - Use Supabase Realtime: - In a `useEffect` in `VolunteerCheckInInterface`: - `const channel = supabase.channel('attendance_events')...` - Subscribe to `postgres_changes` on: - `{ event: 'INSERT', schema: 'public', table: 'attendance_records', filter: 'event_id=eq.' }`. - On each payload: - Update `recentCheckIns` state with the new record. - Optionally trigger: - `queryClient.invalidateQueries(['attendance-report', eventId])` to refresh counts. - Cleanup with `supabase.removeChannel(channel)`.

    5.3. Edge function integration - Edge functions themselves do not need special Realtime logic: - They insert into `attendance_records`, and Supabase Realtime emits events automatically. - Ensure the DB configuration from step 2.6 is applied so row data is available in the payload.

6.  Update `.kiro/specs/thittam1hub/implementation-task.md` to reflect Supabase-based attendance
    6.1. Add a new section **14. Supabase-based attendance & user QR migration**: - `14.1 Model events, registrations, attendance_records, user_profiles in Supabase (tables + RLS).` - `14.2 Implement Edge Functions for attendance-qr, attendance-checkin, attendance-report, attendance-manual-checkin.` - `14.3 Migrate frontend attendance flows to Supabase (QRCodeDisplay, QRCodeScanner, AttendanceList, VolunteerCheckInInterface).` - `14.4 Implement real-time attendance updates using Supabase polling + Realtime channels.` - `14.5 Deprecate backend REST attendance APIs (documented as reference only).`
    6.2. Note explicitly in 13’s description that the previous implementation used a Node backend but has been **superseded by Supabase-based implementation in section 14**.
    6.3. For now, **no tasks need to be marked “cannot be done in Supabase”**: - User-specific QR, profile display on scan, and real-time updates are all achievable within Supabase’s capabilities.

7.  Testing & rollout plan
    7.1. After implementing DB + Supabase Edge Functions (✅): - Use the Supabase SQL Editor to verify: - `user_profiles` rows are created on signup and have non-null unique `qr_code`. - `attendance_records` inserts work with RLS in place. - Use Supabase Edge Functions logs to confirm no RBAC/RLS errors.

    7.2. Frontend acceptance tests (in progress): - Participant: - Sign in, ensure `user_profiles` created. - Open “View Event Pass”; verify the same QR appears across multiple events. - Organizer/Volunteer: - Open Volunteer Check-in for an event. - Scan participant’s QR for an event they are: - Registered for (expect success and profile info). - Not registered for (expect clear error). - Organizer dashboard: - Watch attendance list/stats update automatically: - Polling every 5s. - Realtime push (if implemented) when check-in happens on another device.

    7.3. Backward compatibility: - Since backend is now only “for reference”, we do not need to keep compatibility with its APIs. - Ensure there are no remaining calls to `api.get/post('/attendance/...')` to avoid confusion.

14. Supabase-based attendance & user QR migration – IMPLEMENTED
   14.1. Modeled `events`, `registrations`, `attendance_records`, and `user_profiles` (with `qr_code`) in Supabase with appropriate RLS.
   14.2. Implemented Supabase Edge Functions: `attendance-qr`, `attendance-checkin`, `attendance-report`, and `attendance-manual-checkin` with CORS + JWT.
   14.3. Migrated frontend attendance flows (QRCodeDisplay, QRCodeScanner, AttendanceList) to Supabase functions; VolunteerCheckInInterface continues to orchestrate these components.
   14.4. Real-time attendance updates provided via React Query polling (5s) on `attendance-report`, with Realtime channels available for future enhancement.
   14.5. Backend REST attendance APIs are now considered reference-only; all runtime attendance features go through Supabase.

15. Participant dashboard Supabase migration – PARTIALLY IMPLEMENTED
   15.1. Participant registrations tab now reads directly from Supabase `registrations`, `events`, and `attendance_records` instead of `/registrations/my-registrations`.
   15.2. Certificates tab still uses legacy `/certificates/my-certificates` backend API because no Supabase `certificates` schema or functions exist yet; requires future Supabase data model before migration.


