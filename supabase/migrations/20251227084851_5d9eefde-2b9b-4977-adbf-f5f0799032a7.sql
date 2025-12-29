-- Create rubrics, submissions, and scores tables for judging

-- 1) Rubrics table
create table public.rubrics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  criteria jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rubrics enable row level security;

-- Organizers/admins manage rubrics
create policy "Organizers manage rubrics"
  on public.rubrics
  as restrictive
  for all
  using (
    has_role(auth.uid(), 'admin')
    or has_role(auth.uid(), 'organizer')
  )
  with check (
    has_role(auth.uid(), 'admin')
    or has_role(auth.uid(), 'organizer')
  );

-- Public can read rubrics (for transparency in judging)
create policy "Public read rubrics"
  on public.rubrics
  as restrictive
  for select
  using (true);


-- 2) Submissions table
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  rubric_id uuid not null references public.rubrics(id) on delete restrict,
  team_name text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

-- Organizers/admins can manage all submissions
create policy "Organizers manage submissions"
  on public.submissions
  as restrictive
  for all
  using (
    has_role(auth.uid(), 'admin')
    or has_role(auth.uid(), 'organizer')
  )
  with check (
    has_role(auth.uid(), 'admin')
    or has_role(auth.uid(), 'organizer')
  );

-- Participants can create and manage their own submissions
create policy "Participants create submissions"
  on public.submissions
  as restrictive
  for insert
  with check (
    submitted_by = auth.uid()
    and has_role(auth.uid(), 'participant')
  );

create policy "Participants manage own submissions select"
  on public.submissions
  as restrictive
  for select
  using (
    submitted_by = auth.uid()
  );

create policy "Participants manage own submissions update"
  on public.submissions
  as restrictive
  for update
  using (
    submitted_by = auth.uid()
  )
  with check (
    submitted_by = auth.uid()
  );


-- 3) Scores table
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  judge_id uuid not null,
  rubric_id uuid not null references public.rubrics(id) on delete restrict,
  scores jsonb not null,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, judge_id)
);

alter table public.scores enable row level security;

-- Judges can manage their own scores
create policy "Judges manage own scores"
  on public.scores
  as restrictive
  for all
  using (
    judge_id = auth.uid()
    and has_role(auth.uid(), 'judge')
  )
  with check (
    judge_id = auth.uid()
    and has_role(auth.uid(), 'judge')
  );

-- Organizers/admins can read all scores
create policy "Organizers read scores"
  on public.scores
  as restrictive
  for select
  using (
    has_role(auth.uid(), 'admin')
    or has_role(auth.uid(), 'organizer')
  );
