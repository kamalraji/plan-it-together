-- Create catering menu items table
CREATE TABLE public.catering_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  is_gluten_free BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[] DEFAULT '{}',
  servings INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'prepared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catering vendors table
CREATE TABLE public.catering_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('caterer', 'bakery', 'beverage', 'specialty')),
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'contacted' CHECK (status IN ('confirmed', 'pending', 'contacted')),
  contract_value NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catering inventory table
CREATE TABLE public.catering_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'beverage', 'equipment', 'supplies')),
  current_stock INTEGER NOT NULL DEFAULT 0,
  required_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  status TEXT NOT NULL DEFAULT 'adequate' CHECK (status IN ('adequate', 'low', 'critical', 'ordered')),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catering meal schedule table
CREATE TABLE public.catering_meal_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  location TEXT,
  expected_guests INTEGER NOT NULL DEFAULT 0,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'tea')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catering dietary requirements table (linked to registrations)
CREATE TABLE public.catering_dietary_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  special_requests JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.catering_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_meal_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_dietary_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies for catering_menu_items
CREATE POLICY "Workspace members can view menu items"
ON public.catering_menu_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = catering_menu_items.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_menu_items.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Workspace organizers can manage menu items"
ON public.catering_menu_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_menu_items.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);

-- RLS policies for catering_vendors
CREATE POLICY "Workspace members can view vendors"
ON public.catering_vendors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = catering_vendors.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_vendors.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Workspace organizers can manage vendors"
ON public.catering_vendors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_vendors.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);

-- RLS policies for catering_inventory
CREATE POLICY "Workspace members can view inventory"
ON public.catering_inventory FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = catering_inventory.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_inventory.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Workspace organizers can manage inventory"
ON public.catering_inventory FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_inventory.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);

-- RLS policies for catering_meal_schedule
CREATE POLICY "Workspace members can view meal schedule"
ON public.catering_meal_schedule FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = catering_meal_schedule.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_meal_schedule.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Workspace organizers can manage meal schedule"
ON public.catering_meal_schedule FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_meal_schedule.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);

-- RLS policies for catering_dietary_requirements
CREATE POLICY "Workspace members can view dietary requirements"
ON public.catering_dietary_requirements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = catering_dietary_requirements.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_dietary_requirements.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Workspace organizers can manage dietary requirements"
ON public.catering_dietary_requirements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = catering_dietary_requirements.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'organizer'::app_role)
);

-- Create indexes for performance
CREATE INDEX idx_catering_menu_items_workspace ON public.catering_menu_items(workspace_id);
CREATE INDEX idx_catering_vendors_workspace ON public.catering_vendors(workspace_id);
CREATE INDEX idx_catering_inventory_workspace ON public.catering_inventory(workspace_id);
CREATE INDEX idx_catering_meal_schedule_workspace ON public.catering_meal_schedule(workspace_id);
CREATE INDEX idx_catering_dietary_workspace ON public.catering_dietary_requirements(workspace_id);

-- Create updated_at triggers
CREATE TRIGGER update_catering_menu_items_updated_at
  BEFORE UPDATE ON public.catering_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catering_vendors_updated_at
  BEFORE UPDATE ON public.catering_vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catering_inventory_updated_at
  BEFORE UPDATE ON public.catering_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catering_meal_schedule_updated_at
  BEFORE UPDATE ON public.catering_meal_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();