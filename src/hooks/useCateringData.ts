import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface CateringMenuItem {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  servings: number;
  status: 'draft' | 'confirmed' | 'prepared';
  created_at: string;
  updated_at: string;
}

export interface CateringVendor {
  id: string;
  workspace_id: string;
  name: string;
  vendor_type: 'caterer' | 'bakery' | 'beverage' | 'specialty';
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number;
  status: 'confirmed' | 'pending' | 'contacted';
  contract_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CateringInventoryItem {
  id: string;
  workspace_id: string;
  name: string;
  category: 'food' | 'beverage' | 'equipment' | 'supplies';
  current_stock: number;
  required_stock: number;
  unit: string;
  status: 'adequate' | 'low' | 'critical' | 'ordered';
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

export interface CateringMealSchedule {
  id: string;
  workspace_id: string;
  name: string;
  scheduled_time: string;
  location: string | null;
  expected_guests: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'tea';
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CateringDietaryRequirement {
  id: string;
  workspace_id: string;
  event_id: string;
  requirement_type: string;
  count: number;
  special_requests: Json | null;
  updated_at: string;
}

export interface CateringHeadcountConfirmation {
  id: string;
  workspace_id: string;
  event_id: string | null;
  meal_schedule_id: string | null;
  meal_name: string;
  meal_date: string;
  meal_type: string;
  expected_count: number;
  confirmed_count: number | null;
  confirmation_deadline: string | null;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Menu Items Hooks
export function useCateringMenuItems(workspaceId: string) {
  return useQuery({
    queryKey: ['catering-menu-items', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catering_menu_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('meal_type', { ascending: true });
      
      if (error) throw error;
      return data as CateringMenuItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useCateringMenuMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createMenuItem = useMutation({
    mutationFn: async (item: Omit<CateringMenuItem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('catering_menu_items')
        .insert({ ...item, workspace_id: workspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-menu-items', workspaceId] });
      toast.success('Menu item added');
    },
    onError: (error) => {
      toast.error('Failed to add menu item: ' + error.message);
    },
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CateringMenuItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('catering_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-menu-items', workspaceId] });
      toast.success('Menu item updated');
    },
    onError: (error) => {
      toast.error('Failed to update menu item: ' + error.message);
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catering_menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-menu-items', workspaceId] });
      toast.success('Menu item removed');
    },
    onError: (error) => {
      toast.error('Failed to remove menu item: ' + error.message);
    },
  });

  return { createMenuItem, updateMenuItem, deleteMenuItem };
}

// Vendors Hooks
export function useCateringVendors(workspaceId: string) {
  return useQuery({
    queryKey: ['catering-vendors', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_catering_vendors_secure', { _workspace_id: workspaceId });
      
      if (error) throw error;
      return (data ?? []) as CateringVendor[];
    },
    enabled: !!workspaceId,
  });
}

export function useCateringVendorMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createVendor = useMutation({
    mutationFn: async (vendor: Omit<CateringVendor, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('catering_vendors')
        .insert({ ...vendor, workspace_id: workspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-vendors', workspaceId] });
      toast.success('Vendor added');
    },
    onError: (error) => {
      toast.error('Failed to add vendor: ' + error.message);
    },
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CateringVendor> & { id: string }) => {
      const { data, error } = await supabase
        .from('catering_vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-vendors', workspaceId] });
      toast.success('Vendor updated');
    },
    onError: (error) => {
      toast.error('Failed to update vendor: ' + error.message);
    },
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catering_vendors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-vendors', workspaceId] });
      toast.success('Vendor removed');
    },
    onError: (error) => {
      toast.error('Failed to remove vendor: ' + error.message);
    },
  });

  return { createVendor, updateVendor, deleteVendor };
}

// Inventory Hooks
export function useCateringInventory(workspaceId: string) {
  return useQuery({
    queryKey: ['catering-inventory', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catering_inventory')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('status', { ascending: false });
      
      if (error) throw error;
      return data as CateringInventoryItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useCateringInventoryMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createItem = useMutation({
    mutationFn: async (item: Omit<CateringInventoryItem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('catering_inventory')
        .insert({ ...item, workspace_id: workspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory', workspaceId] });
      toast.success('Inventory item added');
    },
    onError: (error) => {
      toast.error('Failed to add item: ' + error.message);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CateringInventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('catering_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory', workspaceId] });
      toast.success('Inventory updated');
    },
    onError: (error) => {
      toast.error('Failed to update inventory: ' + error.message);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catering_inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory', workspaceId] });
      toast.success('Item removed');
    },
    onError: (error) => {
      toast.error('Failed to remove item: ' + error.message);
    },
  });

  return { createItem, updateItem, deleteItem };
}

// Meal Schedule Hooks
export function useCateringMealSchedule(workspaceId: string) {
  return useQuery({
    queryKey: ['catering-meal-schedule', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catering_meal_schedule')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as CateringMealSchedule[];
    },
    enabled: !!workspaceId,
  });
}

export function useCateringMealScheduleMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createMeal = useMutation({
    mutationFn: async (meal: Omit<CateringMealSchedule, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('catering_meal_schedule')
        .insert({ ...meal, workspace_id: workspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-meal-schedule', workspaceId] });
      toast.success('Meal added to schedule');
    },
    onError: (error) => {
      toast.error('Failed to add meal: ' + error.message);
    },
  });

  const updateMeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CateringMealSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('catering_meal_schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-meal-schedule', workspaceId] });
      toast.success('Schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catering_meal_schedule')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-meal-schedule', workspaceId] });
      toast.success('Meal removed from schedule');
    },
    onError: (error) => {
      toast.error('Failed to remove meal: ' + error.message);
    },
  });

  return { createMeal, updateMeal, deleteMeal };
}

// Dietary Requirements Hooks
export function useDietaryRequirements(workspaceId: string, eventId?: string) {
  return useQuery({
    queryKey: ['catering-dietary', workspaceId, eventId],
    queryFn: async () => {
      let query = supabase
        .from('catering_dietary_requirements')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query.order('requirement_type');
      if (error) throw error;
      return data as CateringDietaryRequirement[];
    },
    enabled: !!workspaceId,
  });
}

export function useDietaryRequirementMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createRequirement = useMutation({
    mutationFn: async (req: { requirement_type: string; count: number; special_requests: Json | null; event_id: string }) => {
      const { data, error } = await supabase
        .from('catering_dietary_requirements')
        .insert({ ...req, workspace_id: workspaceId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-dietary', workspaceId] });
      toast.success('Dietary requirement added');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; requirement_type?: string; count?: number; special_requests?: Json | null }) => {
      const { data, error } = await supabase
        .from('catering_dietary_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-dietary', workspaceId] });
      toast.success('Requirement updated');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catering_dietary_requirements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-dietary', workspaceId] });
      toast.success('Requirement removed');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  return { createRequirement, updateRequirement, deleteRequirement };
}

// Headcount Confirmations Hooks
export function useHeadcountConfirmations(workspaceId: string) {
  return useQuery({
    queryKey: ['catering-headcount', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catering_headcount_confirmations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('meal_date', { ascending: true });
      if (error) throw error;
      return data as CateringHeadcountConfirmation[];
    },
    enabled: !!workspaceId,
  });
}

export function useHeadcountMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createConfirmation = useMutation({
    mutationFn: async (conf: { meal_name: string; meal_date: string; meal_type: string; expected_count: number; confirmation_deadline: string | null; notes: string | null; event_id: string | null }) => {
      const { data, error } = await supabase
        .from('catering_headcount_confirmations')
        .insert({ ...conf, workspace_id: workspaceId, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-headcount', workspaceId] });
      toast.success('Headcount added');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  const confirmHeadcount = useMutation({
    mutationFn: async ({ id, confirmed_count }: { id: string; confirmed_count: number }) => {
      const { data, error } = await supabase
        .from('catering_headcount_confirmations')
        .update({ confirmed_count, status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-headcount', workspaceId] });
      toast.success('Headcount confirmed');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  const updateConfirmation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CateringHeadcountConfirmation> & { id: string }) => {
      const { data, error } = await supabase
        .from('catering_headcount_confirmations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-headcount', workspaceId] });
      toast.success('Updated');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  const deleteConfirmation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catering_headcount_confirmations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-headcount', workspaceId] });
      toast.success('Removed');
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });

  return { createConfirmation, confirmHeadcount, updateConfirmation, deleteConfirmation };
}

// Stats Hook
export function useCateringStats(workspaceId: string) {
  const { data: menuItems = [] } = useCateringMenuItems(workspaceId);
  const { data: vendors = [] } = useCateringVendors(workspaceId);
  const { data: inventory = [] } = useCateringInventory(workspaceId);
  const { data: schedule = [] } = useCateringMealSchedule(workspaceId);

  const totalHeadCount = schedule.reduce((acc, meal) => acc + meal.expected_guests, 0);
  const mealsPlanned = schedule.length;
  const vendorsConfirmed = vendors.filter(v => v.status === 'confirmed').length;
  const menuItemsCount = menuItems.length;
  const criticalInventory = inventory.filter(i => i.status === 'critical' || i.status === 'low').length;
  const pendingDeliveries = inventory.filter(i => i.status === 'ordered').length;

  return {
    totalHeadCount,
    mealsPlanned,
    vendorsConfirmed,
    menuItems: menuItemsCount,
    criticalInventory,
    pendingDeliveries,
    totalVendors: vendors.length,
  };
}
