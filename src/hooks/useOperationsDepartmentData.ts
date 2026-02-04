import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  INCIDENT_COLUMNS,
  LOGISTICS_COLUMNS,
  FACILITY_CHECK_COLUMNS,
  EVENT_BRIEFING_COLUMNS,
  CATERING_MEAL_SCHEDULE_COLUMNS,
  CATERING_MENU_ITEM_COLUMNS,
  CATERING_DIETARY_COLUMNS,
  CHECKLIST_COLUMNS,
} from '@/lib/supabase-columns';

// ============= Types =============

export interface Incident {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  location: string | null;
  reported_by: string | null;
  reported_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsItem {
  id: string;
  workspace_id: string;
  item_name: string;
  carrier: string | null;
  tracking_number: string | null;
  origin: string | null;
  destination: string | null;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  progress: number;
  eta: string | null;
  actual_arrival: string | null;
  notes: string | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityCheck {
  id: string;
  workspace_id: string;
  area: string;
  item: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  checked_by: string | null;
  checked_by_name: string | null;
  checked_at: string | null;
  notes: string | null;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventBriefing {
  id: string;
  workspace_id: string;
  scheduled_time: string;
  activity: string;
  location: string | null;
  lead_name: string | null;
  lead_id: string | null;
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  notes: string | null;
  sort_order: number;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============= Incidents =============

export function useIncidents(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-incidents', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_incidents')
        .select(INCIDENT_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Incident[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateIncident(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (incident: Partial<Incident>) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');
      const { data, error } = await supabase
        .from('workspace_incidents')
        .insert({
          workspace_id: workspaceId,
          title: incident.title || 'Untitled Incident',
          description: incident.description,
          severity: incident.severity || 'medium',
          status: incident.status || 'open',
          location: incident.location,
          reported_by: user.id,
          reported_by_name: (user as any).user_metadata?.full_name || user.email,
          assigned_to: incident.assigned_to,
          assigned_to_name: incident.assigned_to_name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incidents', workspaceId] });
      toast.success('Incident reported successfully');
    },
    onError: (_error) => {
      toast.error('Failed to report incident');
    },
  });
}

export function useUpdateIncident(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_incidents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incidents', workspaceId] });
      toast.success('Incident updated');
    },
    onError: (_error) => {
      toast.error('Failed to update incident');
    },
  });
}

export function useResolveIncident(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution_notes }: { id: string; resolution_notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_incidents')
        .update({
          status: 'resolved',
          resolution_notes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incidents', workspaceId] });
      toast.success('Incident resolved');
    },
    onError: (_error) => {
      toast.error('Failed to resolve incident');
    },
  });
}

export function useDeleteIncident(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_incidents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incidents', workspaceId] });
      toast.success('Incident deleted');
    },
    onError: (_error) => {
      toast.error('Failed to delete incident');
    },
  });
}

// ============= Logistics =============

export function useLogistics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-logistics', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_logistics')
        .select(LOGISTICS_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LogisticsItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateLogistics(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Partial<LogisticsItem>) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');
      const { data, error } = await supabase
        .from('workspace_logistics')
        .insert({
          workspace_id: workspaceId,
          item_name: item.item_name || 'Untitled Item',
          carrier: item.carrier,
          tracking_number: item.tracking_number,
          origin: item.origin,
          destination: item.destination,
          status: item.status || 'pending',
          progress: item.progress || 0,
          eta: item.eta,
          priority: item.priority || 'normal',
          notes: item.notes,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-logistics', workspaceId] });
      toast.success('Shipment added');
    },
    onError: (_error) => {
      toast.error('Failed to add shipment');
    },
  });
}

export function useUpdateLogistics(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogisticsItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_logistics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-logistics', workspaceId] });
      toast.success('Shipment updated');
    },
    onError: (_error) => {
      toast.error('Failed to update shipment');
    },
  });
}

export function useDeleteLogistics(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_logistics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-logistics', workspaceId] });
      toast.success('Shipment removed');
    },
    onError: (_error) => {
      toast.error('Failed to remove shipment');
    },
  });
}

// ============= Facility Checks =============

export function useFacilityChecks(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-facility-checks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_facility_checks')
        .select(FACILITY_CHECK_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('area', { ascending: true })
        .order('item', { ascending: true });
      if (error) throw error;
      return data as FacilityCheck[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateFacilityCheck(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (check: Partial<FacilityCheck>) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');
      const { data, error } = await supabase
        .from('workspace_facility_checks')
        .insert({
          workspace_id: workspaceId,
          area: check.area || 'General',
          item: check.item || 'Untitled Check',
          status: check.status || 'pending',
          notes: check.notes,
          follow_up_required: check.follow_up_required || false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-facility-checks', workspaceId] });
      toast.success('Facility check added');
    },
    onError: (_error) => {
      toast.error('Failed to add facility check');
    },
  });
}

export function useUpdateFacilityCheck(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FacilityCheck> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.status && updates.status !== 'pending') {
        updateData.checked_at = new Date().toISOString();
        updateData.checked_by = user?.id;
        updateData.checked_by_name = (user as any)?.user_metadata?.full_name || user?.email;
      }
      const { data, error } = await supabase
        .from('workspace_facility_checks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-facility-checks', workspaceId] });
      toast.success('Facility check updated');
    },
    onError: (_error) => {
      toast.error('Failed to update facility check');
    },
  });
}

export function useRecheckFacility(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_facility_checks')
        .update({
          status: 'pass',
          checked_at: new Date().toISOString(),
          checked_by: user?.id,
          checked_by_name: (user as any)?.user_metadata?.full_name || user?.email,
          follow_up_required: false,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-facility-checks', workspaceId] });
      toast.success('Facility re-checked and passed');
    },
    onError: (_error) => {
      toast.error('Failed to re-check facility');
    },
  });
}

export function useDeleteFacilityCheck(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_facility_checks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-facility-checks', workspaceId] });
      toast.success('Facility check removed');
    },
    onError: (_error) => {
      toast.error('Failed to remove facility check');
    },
  });
}

// ============= Event Briefings =============

export function useEventBriefings(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-event-briefings', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .select(EVENT_BRIEFING_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data as EventBriefing[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateEventBriefing(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefing: Partial<EventBriefing>) => {
      if (!workspaceId) throw new Error('Missing workspace');
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .insert({
          workspace_id: workspaceId,
          scheduled_time: briefing.scheduled_time || '09:00',
          activity: briefing.activity || 'Untitled Activity',
          location: briefing.location,
          lead_name: briefing.lead_name,
          lead_id: briefing.lead_id,
          status: briefing.status || 'upcoming',
          notes: briefing.notes,
          sort_order: briefing.sort_order || 0,
          event_date: briefing.event_date,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-event-briefings', workspaceId] });
      toast.success('Schedule item added');
    },
    onError: (_error) => {
      toast.error('Failed to add schedule item');
    },
  });
}

export function useUpdateEventBriefing(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventBriefing> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_event_briefings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-event-briefings', workspaceId] });
      toast.success('Schedule item updated');
    },
    onError: (_error) => {
      toast.error('Failed to update schedule item');
    },
  });
}

export function useDeleteEventBriefing(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_event_briefings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-event-briefings', workspaceId] });
      toast.success('Schedule item removed');
    },
    onError: (_error) => {
      toast.error('Failed to remove schedule item');
    },
  });
}

// ============= Team Members (read from existing table) =============

interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  member_name: string | null;
  avatar_url: string | null;
  department: string | null;
}

export function useOperationsTeamRoster(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-team-roster', workspaceId],
    queryFn: async (): Promise<TeamMemberWithProfile[]> => {
      if (!workspaceId) return [];
      
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role, status, joined_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE')
        .order('role', { ascending: true });
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];
      
      // Fetch user profiles for these members
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, organization')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Merge data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return members.map(member => {
        const profile = profileMap.get(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at,
          member_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          department: profile?.organization || null,
        };
      });
    },
    enabled: !!workspaceId,
  });
}

// ============= Catering (read from existing tables) =============

export function useCateringMealSchedule(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['catering-meal-schedule', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('catering_meal_schedule')
        .select(CATERING_MEAL_SCHEDULE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCateringMenuItems(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['catering-menu-items', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('catering_menu_items')
        .select(CATERING_MENU_ITEM_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('meal_type', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useDietaryRequirements(eventId: string | undefined) {
  return useQuery({
    queryKey: ['catering-dietary-requirements', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('catering_dietary_requirements')
        .select(CATERING_DIETARY_COLUMNS.detail)
        .eq('event_id', eventId)
        .order('requirement_type', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

// ============= Master Checklist (read from existing table) =============

export function useMasterChecklist(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-checklists-master', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select(CHECKLIST_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useUpdateChecklist(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists-master', workspaceId] });
      toast.success('Checklist updated');
    },
    onError: (_error) => {
      toast.error('Failed to update checklist');
    },
  });
}

// ============= Operations Stats (aggregated) =============

export function useOperationsStats(workspaceId: string | undefined) {
  const { data: incidents } = useIncidents(workspaceId);
  const { data: logistics } = useLogistics(workspaceId);
  const { data: facilityChecks } = useFacilityChecks(workspaceId);
  const { data: briefings } = useEventBriefings(workspaceId);
  const { data: teamRoster } = useOperationsTeamRoster(workspaceId);

  const stats = {
    incidentsOpen: incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0,
    incidentsResolved: incidents?.filter(i => i.status === 'resolved' || i.status === 'closed').length || 0,
    incidentsCritical: incidents?.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length || 0,
    logisticsDelivered: logistics?.filter(l => l.status === 'delivered').length || 0,
    logisticsInTransit: logistics?.filter(l => l.status === 'in_transit').length || 0,
    logisticsDelayed: logistics?.filter(l => l.status === 'delayed').length || 0,
    facilityPassed: facilityChecks?.filter(f => f.status === 'pass').length || 0,
    facilityWarnings: facilityChecks?.filter(f => f.status === 'warning').length || 0,
    facilityFailed: facilityChecks?.filter(f => f.status === 'fail').length || 0,
    briefingsCompleted: briefings?.filter(b => b.status === 'completed').length || 0,
    briefingsTotal: briefings?.length || 0,
    teamOnDuty: teamRoster?.length || 0,
  };

  return stats;
}
