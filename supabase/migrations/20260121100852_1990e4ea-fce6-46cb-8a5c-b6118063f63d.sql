-- =============================================
-- Context-Aware Role Migration
-- Maps legacy roles (LEAD, COORDINATOR, member) to specific roles based on workspace context
-- =============================================

-- =============================================
-- STEP 1: MANAGER ROLE FIXES (DEPARTMENT workspaces)
-- =============================================

-- Operations Manager
UPDATE workspace_team_members wtm
SET role = 'OPERATIONS_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT'
  AND LOWER(w.name) LIKE '%operations%';

-- Growth Manager  
UPDATE workspace_team_members wtm
SET role = 'GROWTH_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT'
  AND LOWER(w.name) LIKE '%growth%';

-- Content Manager
UPDATE workspace_team_members wtm
SET role = 'CONTENT_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT'
  AND LOWER(w.name) LIKE '%content%'
  AND LOWER(w.name) NOT LIKE '%social%'; -- Exclude social media

-- Tech/Finance Manager
UPDATE workspace_team_members wtm
SET role = 'TECH_FINANCE_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT'
  AND (LOWER(w.name) LIKE '%tech%' OR LOWER(w.name) LIKE '%finance%');

-- Volunteers Manager
UPDATE workspace_team_members wtm
SET role = 'VOLUNTEERS_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT'
  AND LOWER(w.name) LIKE '%volunteer%';

-- =============================================
-- STEP 2: LEAD ROLE FIXES (COMMITTEE workspaces - for LEAD role)
-- =============================================

-- Event Lead
UPDATE workspace_team_members wtm
SET role = 'EVENT_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%event%';

-- Catering Lead
UPDATE workspace_team_members wtm
SET role = 'CATERING_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%catering%';

-- Logistics Lead
UPDATE workspace_team_members wtm
SET role = 'LOGISTICS_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%logistics%';

-- Facility Lead
UPDATE workspace_team_members wtm
SET role = 'FACILITY_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%facility%';

-- Marketing Lead
UPDATE workspace_team_members wtm
SET role = 'MARKETING_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%marketing%';

-- Communication Lead
UPDATE workspace_team_members wtm
SET role = 'COMMUNICATION_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%communication%';

-- Sponsorship Lead
UPDATE workspace_team_members wtm
SET role = 'SPONSORSHIP_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%sponsor%';

-- Social Media Lead
UPDATE workspace_team_members wtm
SET role = 'SOCIAL_MEDIA_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%social%';

-- Content Lead
UPDATE workspace_team_members wtm
SET role = 'CONTENT_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%content%'
  AND LOWER(w.name) NOT LIKE '%social%';

-- Speaker Liaison Lead
UPDATE workspace_team_members wtm
SET role = 'SPEAKER_LIAISON_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%speaker%';

-- Judge Lead
UPDATE workspace_team_members wtm
SET role = 'JUDGE_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%judge%';

-- Media Lead
UPDATE workspace_team_members wtm
SET role = 'MEDIA_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%media%'
  AND LOWER(w.name) NOT LIKE '%social%';

-- Finance Lead
UPDATE workspace_team_members wtm
SET role = 'FINANCE_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%finance%';

-- Registration Lead
UPDATE workspace_team_members wtm
SET role = 'REGISTRATION_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%registration%';

-- Technical Lead
UPDATE workspace_team_members wtm
SET role = 'TECHNICAL_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND (LOWER(w.name) LIKE '%tech%' OR LOWER(w.name) LIKE '%it %' OR LOWER(w.name) LIKE '%it-%');

-- Volunteers Lead
UPDATE workspace_team_members wtm
SET role = 'VOLUNTEERS_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%volunteer%';

-- =============================================
-- STEP 3: COORDINATOR ROLE FIXES (COMMITTEE workspaces)
-- =============================================

-- Event Coordinator
UPDATE workspace_team_members wtm
SET role = 'EVENT_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%event%';

-- Catering Coordinator
UPDATE workspace_team_members wtm
SET role = 'CATERING_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%catering%';

-- Logistics Coordinator
UPDATE workspace_team_members wtm
SET role = 'LOGISTICS_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%logistics%';

-- Facility Coordinator
UPDATE workspace_team_members wtm
SET role = 'FACILITY_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%facility%';

-- Marketing Coordinator
UPDATE workspace_team_members wtm
SET role = 'MARKETING_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%marketing%';

-- Communication Coordinator
UPDATE workspace_team_members wtm
SET role = 'COMMUNICATION_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%communication%';

-- Sponsorship Coordinator
UPDATE workspace_team_members wtm
SET role = 'SPONSORSHIP_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%sponsor%';

-- Social Media Coordinator
UPDATE workspace_team_members wtm
SET role = 'SOCIAL_MEDIA_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%social%';

-- Content Coordinator
UPDATE workspace_team_members wtm
SET role = 'CONTENT_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%content%'
  AND LOWER(w.name) NOT LIKE '%social%';

-- Speaker Liaison Coordinator
UPDATE workspace_team_members wtm
SET role = 'SPEAKER_LIAISON_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%speaker%';

-- Judge Coordinator
UPDATE workspace_team_members wtm
SET role = 'JUDGE_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%judge%';

-- Media Coordinator
UPDATE workspace_team_members wtm
SET role = 'MEDIA_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%media%'
  AND LOWER(w.name) NOT LIKE '%social%';

-- Finance Coordinator
UPDATE workspace_team_members wtm
SET role = 'FINANCE_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%finance%';

-- Registration Coordinator
UPDATE workspace_team_members wtm
SET role = 'REGISTRATION_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%registration%';

-- Technical Coordinator
UPDATE workspace_team_members wtm
SET role = 'TECHNICAL_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND (LOWER(w.name) LIKE '%tech%' OR LOWER(w.name) LIKE '%it %' OR LOWER(w.name) LIKE '%it-%');

-- Volunteer Coordinator
UPDATE workspace_team_members wtm
SET role = 'VOLUNTEER_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE'
  AND LOWER(w.name) LIKE '%volunteer%';

-- =============================================
-- STEP 4: FALLBACK - Catch any remaining legacy roles
-- =============================================

-- Remaining LEAD/member in DEPARTMENT -> OPERATIONS_MANAGER (safe fallback)
UPDATE workspace_team_members wtm
SET role = 'OPERATIONS_MANAGER'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('LEAD', 'member')
  AND w.workspace_type = 'DEPARTMENT';

-- Remaining LEAD in COMMITTEE -> EVENT_LEAD (safe fallback)
UPDATE workspace_team_members wtm
SET role = 'EVENT_LEAD'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role = 'LEAD'
  AND w.workspace_type = 'COMMITTEE';

-- Remaining COORDINATOR/member in COMMITTEE -> EVENT_COORDINATOR (safe fallback)
UPDATE workspace_team_members wtm
SET role = 'EVENT_COORDINATOR'
FROM workspaces w
WHERE wtm.workspace_id = w.id
  AND wtm.role IN ('COORDINATOR', 'member')
  AND w.workspace_type = 'COMMITTEE';

-- Final fallback: Any remaining legacy roles without workspace context -> EVENT_COORDINATOR
UPDATE workspace_team_members
SET role = 'EVENT_COORDINATOR'
WHERE role IN ('COORDINATOR', 'member', 'LEAD');