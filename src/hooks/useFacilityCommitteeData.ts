import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import {
  WORKSPACE_TASK_COLUMNS,
  RESOURCE_COLUMNS,
  INCIDENT_COLUMNS,
} from '@/lib/supabase-columns';

// ============= Types =============
export interface SafetyItem {
  id: string;
  workspace_id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  role_scope: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  status: string;
  quantity: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
  // Derived
  capacity?: number | null;
  floor?: string | null;
}

export interface FacilityIncident {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  location: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalkthroughFinding {
  area: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface VenueWalkthrough {
  id: string;
  workspace_id: string;
  name: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  route_areas: string[] | null;
  lead_name: string | null;
  lead_id: string | null;
  attendees: string[] | null;
  notes: string | null;
  findings: WalkthroughFinding[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============= Safety Check Hooks =============

const DEFAULT_SAFETY_ITEMS = [
  'Fire extinguishers checked and accessible',
  'Emergency exits clearly marked and unobstructed',
  'First aid kits stocked and accessible',
  'Security personnel briefed',
  'Emergency contact list posted',
  'Fire alarm system tested',
  'Evacuation routes marked',
  'AED devices checked',
  'Floor hazards addressed',
  'Electrical safety verified',
];

export function useSafetyChecklist(workspaceId: string) {
  return useQuery({
    queryKey: ['facility-safety-checklist', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select(WORKSPACE_TASK_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .eq('role_scope', 'SAFETY')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as SafetyItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useInitializeSafetyDefaults(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const items = DEFAULT_SAFETY_ITEMS.map((title, index) => ({
        workspace_id: workspaceId,
        title,
        status: 'TODO',
        role_scope: 'SAFETY',
        priority_level: index + 1,
      }));

      const { error } = await supabase
        .from('workspace_tasks')
        .insert(items);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety-checklist', workspaceId] });
      toast.success('Default safety items loaded');
    },
    onError: () => {
      toast.error('Failed to load default safety items');
    },
  });
}

export function useAddSafetyItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title,
          status: 'TODO',
          role_scope: 'SAFETY',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety-checklist', workspaceId] });
      toast.success('Safety item added');
    },
    onError: () => {
      toast.error('Failed to add safety item');
    },
  });
}

export function useToggleSafetyItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety-checklist', workspaceId] });
    },
    onError: () => {
      toast.error('Failed to update safety item');
    },
  });
}

// ============= Room Status Hooks =============

export function useRooms(workspaceId: string) {
  return useQuery({
    queryKey: ['facility-rooms', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select(RESOURCE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .eq('type', 'venue')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Room[];
    },
    enabled: !!workspaceId,
  });
}

export function useAddRoom(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: { name: string; type: string; capacity?: number; floor?: string }) => {
      const { error } = await supabase
        .from('workspace_resources')
        .insert({
          workspace_id: workspaceId,
          name: room.name,
          type: 'venue',
          status: 'pending',
          capacity: room.capacity,
          floor: room.floor,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-rooms', workspaceId] });
      toast.success('Room added');
    },
    onError: () => {
      toast.error('Failed to add room');
    },
  });
}

export function useUpdateRoomStatus(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('workspace_resources')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-rooms', workspaceId] });
      toast.success('Room status updated');
    },
    onError: () => {
      toast.error('Failed to update room status');
    },
  });
}

// ============= Incident Report Hooks =============

export function useFacilityIncidents(workspaceId: string) {
  return useQuery({
    queryKey: ['facility-incidents', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_incidents')
        .select(INCIDENT_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FacilityIncident[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateFacilityIncident(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incident: {
      title: string;
      description?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location?: string;
      category?: string;
    }) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .insert({
          workspace_id: workspaceId,
          title: incident.title,
          description: incident.description || null,
          severity: incident.severity,
          location: incident.location || null,
          category: incident.category || null,
          status: 'open',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-incidents', workspaceId] });
      toast.success('Issue reported');
    },
    onError: () => {
      toast.error('Failed to report issue');
    },
  });
}

export function useUpdateFacilityIncident(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<FacilityIncident>) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('workspace_incidents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-incidents', workspaceId] });
      toast.success('Issue updated');
    },
    onError: () => {
      toast.error('Failed to update issue');
    },
  });
}

// ============= Venue Walkthrough Hooks =============

export function useVenueWalkthroughs(workspaceId: string) {
  return useQuery({
    queryKey: ['facility-walkthroughs', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_venue_walkthroughs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        findings: Array.isArray(row.findings) 
          ? row.findings as unknown as WalkthroughFinding[]
          : [],
      })) as VenueWalkthrough[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWalkthrough(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walkthrough: {
      name: string;
      scheduled_date?: string;
      scheduled_time?: string;
      route_areas?: string[];
      lead_name?: string;
      attendees?: string[];
    }) => {
      const { error } = await supabase
        .from('workspace_venue_walkthroughs')
        .insert({
          workspace_id: workspaceId,
          name: walkthrough.name,
          scheduled_date: walkthrough.scheduled_date || null,
          scheduled_time: walkthrough.scheduled_time || null,
          route_areas: walkthrough.route_areas || null,
          lead_name: walkthrough.lead_name || null,
          attendees: walkthrough.attendees || null,
          status: 'scheduled',
          findings: [],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-walkthroughs', workspaceId] });
      toast.success('Walkthrough scheduled');
    },
    onError: () => {
      toast.error('Failed to schedule walkthrough');
    },
  });
}

export function useUpdateWalkthrough(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<VenueWalkthrough, 'findings'>> & { findings?: WalkthroughFinding[] }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (updates.findings) {
        updateData.findings = updates.findings as unknown as Json;
      }

      const { error } = await supabase
        .from('workspace_venue_walkthroughs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-walkthroughs', workspaceId] });
      toast.success('Walkthrough updated');
    },
    onError: () => {
      toast.error('Failed to update walkthrough');
    },
  });
}

export function useStartWalkthrough(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_venue_walkthroughs')
        .update({ status: 'in_progress' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-walkthroughs', workspaceId] });
      toast.success('Walkthrough started');
    },
    onError: () => {
      toast.error('Failed to start walkthrough');
    },
  });
}

export function useCompleteWalkthrough(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_venue_walkthroughs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-walkthroughs', workspaceId] });
      toast.success('Walkthrough completed');
    },
    onError: () => {
      toast.error('Failed to complete walkthrough');
    },
  });
}

export function useAddWalkthroughFinding(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, finding, currentFindings }: { 
      id: string; 
      finding: WalkthroughFinding;
      currentFindings: WalkthroughFinding[];
    }) => {
      const updatedFindings = [...currentFindings, finding];
      const { error } = await supabase
        .from('workspace_venue_walkthroughs')
        .update({ findings: updatedFindings as unknown as Json })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-walkthroughs', workspaceId] });
      toast.success('Finding added');
    },
    onError: () => {
      toast.error('Failed to add finding');
    },
  });
}

// ============= Stats Hook =============

export function useFacilityStats(workspaceId: string) {
  const { data: safetyItems } = useSafetyChecklist(workspaceId);
  const { data: rooms } = useRooms(workspaceId);
  const { data: incidents } = useFacilityIncidents(workspaceId);
  const { data: walkthroughs } = useVenueWalkthroughs(workspaceId);

  const safetyCompleted = safetyItems?.filter(i => i.status === 'DONE').length || 0;
  const safetyTotal = safetyItems?.length || 0;
  const safetyPercent = safetyTotal > 0 ? Math.round((safetyCompleted / safetyTotal) * 100) : 0;

  const roomsReady = rooms?.filter(r => r.status === 'ready').length || 0;
  const roomsTotal = rooms?.length || 0;

  const openIncidents = incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0;
  const criticalIncidents = incidents?.filter(i => i.severity === 'critical' && i.status !== 'closed').length || 0;

  const scheduledWalkthroughs = walkthroughs?.filter(w => w.status === 'scheduled').length || 0;
  const completedWalkthroughs = walkthroughs?.filter(w => w.status === 'completed').length || 0;

  return {
    safetyCompleted,
    safetyTotal,
    safetyPercent,
    roomsReady,
    roomsTotal,
    openIncidents,
    criticalIncidents,
    scheduledWalkthroughs,
    completedWalkthroughs,
  };
}
