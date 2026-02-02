-- Step 1: Drop the ambiguous single-argument has_workspace_access function
-- Keep only the 2-argument version to avoid function resolution issues

DROP FUNCTION IF EXISTS public.has_workspace_access(uuid);

-- Now the 2-arg version with default will be used automatically