-- Add phase column to workspace_checklists for event lifecycle management
ALTER TABLE workspace_checklists 
ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'pre_event';

-- Add check constraint for valid phases
ALTER TABLE workspace_checklists 
ADD CONSTRAINT workspace_checklists_phase_check 
CHECK (phase IN ('pre_event', 'during_event', 'post_event'));

-- Update existing checklists based on title keywords
UPDATE workspace_checklists 
SET phase = 'during_event' 
WHERE title ILIKE '%day-of%' OR title ILIKE '%execution%' OR title ILIKE '%during%';

UPDATE workspace_checklists 
SET phase = 'post_event' 
WHERE title ILIKE '%post%' OR title ILIKE '%follow-up%' OR title ILIKE '%after%';