-- Clean up duplicate root workspaces by keeping the oldest and converting others to departments
-- For event fd06a7c2-148c-4b40-94b8-fc560b221c89: keep 97f111f1-daa4-41b5-a460-786cb1636025 (oldest)
UPDATE public.workspaces 
SET parent_workspace_id = '97f111f1-daa4-41b5-a460-786cb1636025', 
    workspace_type = 'DEPARTMENT'
WHERE id IN (
  'a6658398-c236-4356-bbde-8e6f61f173eb',
  '9f8dd3fa-e801-4e87-8447-0bf2ff67da48',
  '4090ba27-9c94-45a2-854b-7c94ad46ab91'
);

-- For event 62e01a76-cc3c-4a8f-8bec-6fcf278a4515: keep 62b67785-4e57-4d55-a811-eec6d522cffb (oldest)
UPDATE public.workspaces 
SET parent_workspace_id = '62b67785-4e57-4d55-a811-eec6d522cffb', 
    workspace_type = 'DEPARTMENT'
WHERE id = 'fa3abe05-c9b4-4ed4-9068-46fa4d58942a';

-- Now create the unique constraint to prevent future duplicates
CREATE UNIQUE INDEX unique_root_workspace_per_event 
ON public.workspaces (event_id) 
WHERE parent_workspace_id IS NULL;