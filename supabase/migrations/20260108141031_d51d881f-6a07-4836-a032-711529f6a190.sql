-- Move Facility, Logistics, Catering, and Event committees under Operations department
UPDATE workspaces 
SET parent_workspace_id = 'c9fa9cad-92bc-4744-ae09-c10d00ae1cd6', -- Operations ID
    workspace_type = 'COMMITTEE'
WHERE id IN (
  '78791f8a-4d96-48ef-b260-752cbbf1737f', -- Facility
  '5ab5ed50-45a1-4c7b-bc7c-be2734045414', -- Logistics
  '6502b2c0-2d04-4314-a251-298f59977e16', -- Catering
  '432a5693-924d-42c7-ac7d-2c6fd62ee057'  -- Event
);