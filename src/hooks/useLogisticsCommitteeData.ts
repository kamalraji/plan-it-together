import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import {
  TRANSPORT_SCHEDULE_COLUMNS,
  LOGISTICS_REPORT_COLUMNS,
  LOGISTICS_COLUMNS,
} from '@/lib/supabase-columns';

// Types
export type TransportType = 'shuttle' | 'vip' | 'equipment' | 'staff' | 'cargo';
export type TransportStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
export type ReportType = 'daily_summary' | 'equipment_status' | 'shipment_status' | 'transport_summary' | 'venue_readiness' | 'full_report';

export interface TransportSchedule {
  id: string;
  workspace_id: string;
  name: string;
  transport_type: TransportType;
  departure_time: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  capacity: number;
  passengers_booked: number;
  vehicle_info: string | null;
  driver_name: string | null;
  driver_contact: string | null;
  status: TransportStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsReport {
  id: string;
  workspace_id: string;
  report_type: ReportType;
  title: string;
  content: Record<string, unknown>;
  generated_by: string | null;
  generated_by_name: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  created_at: string;
}

export interface LogisticsShipment {
  id: string;
  workspace_id: string;
  item_name: string;
  carrier: string | null;
  tracking_number: string | null;
  origin: string | null;
  destination: string | null;
  eta: string | null;
  actual_arrival: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Transport Schedules
// =============================================
export function useTransportSchedules(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['transport-schedules', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_transport_schedules')
        .select(TRANSPORT_SCHEDULE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('departure_time', { ascending: true });
      if (error) throw error;
      return data as TransportSchedule[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTransport(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transport: Partial<TransportSchedule>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_transport_schedules')
        .insert({
          name: transport.name || 'New Transport',
          transport_type: transport.transport_type || 'shuttle',
          departure_time: transport.departure_time,
          pickup_location: transport.pickup_location,
          dropoff_location: transport.dropoff_location,
          capacity: transport.capacity || 10,
          passengers_booked: transport.passengers_booked || 0,
          vehicle_info: transport.vehicle_info,
          driver_name: transport.driver_name,
          driver_contact: transport.driver_contact,
          status: transport.status || 'scheduled',
          notes: transport.notes,
          workspace_id: workspaceId,
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-schedules', workspaceId] });
      toast.success('Transport scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule transport: ${error.message}`);
    },
  });
}

export function useUpdateTransport(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TransportSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_transport_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-schedules', workspaceId] });
      toast.success('Transport updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transport: ${error.message}`);
    },
  });
}

export function useDeleteTransport(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_transport_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-schedules', workspaceId] });
      toast.success('Transport deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete transport: ${error.message}`);
    },
  });
}

// =============================================
// Logistics Reports
// =============================================
export function useLogisticsReports(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-reports', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_logistics_reports')
        .select(LOGISTICS_REPORT_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LogisticsReport[];
    },
    enabled: !!workspaceId,
  });
}

export function useGenerateReport(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: Partial<LogisticsReport>) => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;
      const { data: profile } = userId ? await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single() : { data: null };

      const insertData: {
        workspace_id: string;
        report_type: string;
        title: string;
        content: Json;
        date_range_start?: string;
        date_range_end?: string;
        generated_by?: string;
        generated_by_name?: string;
      } = {
        workspace_id: workspaceId,
        report_type: report.report_type || 'daily_summary',
        title: report.title || 'Report',
        content: (report.content || {}) as Json,
      };

      if (report.date_range_start) insertData.date_range_start = report.date_range_start;
      if (report.date_range_end) insertData.date_range_end = report.date_range_end;
      if (userId) insertData.generated_by = userId;
      insertData.generated_by_name = profile?.full_name || 'Unknown';

      const { data, error } = await supabase
        .from('workspace_logistics_reports')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-reports', workspaceId] });
      toast.success('Report generated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });
}

export function useDeleteReport(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_logistics_reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-reports', workspaceId] });
      toast.success('Report deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });
}

// =============================================
// Shipments (from workspace_logistics)
// =============================================
export function useLogisticsShipments(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-shipments', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_logistics')
        .select(LOGISTICS_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateShipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shipment: Partial<LogisticsShipment>) => {
      const { data, error } = await supabase
        .from('workspace_logistics')
        .insert({
          item_name: shipment.item_name || 'New Shipment',
          carrier: shipment.carrier,
          tracking_number: shipment.tracking_number,
          origin: shipment.origin,
          destination: shipment.destination,
          eta: shipment.eta,
          status: shipment.status || 'pending',
          priority: shipment.priority || 'normal',
          notes: shipment.notes,
          workspace_id: workspaceId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      toast.success('Shipment added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add shipment: ${error.message}`);
    },
  });
}

export function useUpdateShipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogisticsShipment> & { id: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      toast.success('Shipment updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update shipment: ${error.message}`);
    },
  });
}

export function useDeleteShipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_logistics')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      toast.success('Shipment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete shipment: ${error.message}`);
    },
  });
}

// =============================================
// Equipment (from workspace_resources with type='equipment')
// =============================================
export function useLogisticsEquipment(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-equipment', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'equipment')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateEquipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (equipment: { name: string; quantity: number; category?: string; status?: string }) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .insert({
          workspace_id: workspaceId,
          name: equipment.name,
          type: 'equipment',
          quantity: equipment.quantity,
          available: equipment.quantity,
          status: equipment.status || 'available',
          metadata: { category: equipment.category || 'general' },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      toast.success('Equipment added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add equipment: ${error.message}`);
    },
  });
}

export function useUpdateEquipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; quantity?: number; available?: number }) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      toast.success('Equipment updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });
}

export function useDeleteEquipment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      toast.success('Equipment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete equipment: ${error.message}`);
    },
  });
}

// =============================================
// Venues (from workspace_resources with type='venue')
// =============================================
export function useLogisticsVenues(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-venues', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'venue')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateVenue(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (venue: { name: string; capacity?: number; address?: string; status?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .insert({
          workspace_id: workspaceId,
          name: venue.name,
          type: 'venue',
          quantity: venue.capacity || 0,
          available: venue.capacity || 0,
          status: venue.status || 'pending',
          metadata: { address: venue.address, notes: venue.notes },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-venues', workspaceId] });
      toast.success('Venue added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add venue: ${error.message}`);
    },
  });
}

export function useUpdateVenue(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; quantity?: number }) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-venues', workspaceId] });
      toast.success('Venue updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update venue: ${error.message}`);
    },
  });
}

export function useDeleteVenue(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-venues', workspaceId] });
      toast.success('Venue deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete venue: ${error.message}`);
    },
  });
}

// =============================================
// Checklists (from workspace_checklists)
// =============================================
export function useLogisticsChecklists(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-checklists', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateChecklist(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checklist: { title: string; phase?: string; items?: { label: string; checked: boolean }[] }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_checklists')
        .insert({
          workspace_id: workspaceId,
          title: checklist.title,
          phase: checklist.phase || 'pre_event',
          items: checklist.items || [],
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-checklists', workspaceId] });
      toast.success('Checklist created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checklist: ${error.message}`);
    },
  });
}

export function useUpdateChecklist(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; items?: { label: string; checked: boolean }[]; status?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['logistics-checklists', workspaceId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update checklist: ${error.message}`);
    },
  });
}

export function useDeleteChecklist(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-checklists', workspaceId] });
      toast.success('Checklist deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete checklist: ${error.message}`);
    },
  });
}

// =============================================
// Milestones (from workspace_milestones)
// =============================================
export function useLogisticsMilestones(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-milestones', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateMilestone(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestone: { title: string; due_date?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .insert({
          workspace_id: workspaceId,
          title: milestone.title,
          due_date: milestone.due_date,
          description: milestone.description,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-milestones', workspaceId] });
      toast.success('Milestone added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add milestone: ${error.message}`);
    },
  });
}

export function useUpdateMilestone(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; title?: string; due_date?: string }) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-milestones', workspaceId] });
      toast.success('Milestone updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });
}

export function useDeleteMilestone(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_milestones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-milestones', workspaceId] });
      toast.success('Milestone deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });
}

// =============================================
// Issues (from workspace_incidents)
// =============================================
export function useLogisticsIssues(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['logistics-issues', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_incidents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateIssue(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (issue: { title: string; description?: string; severity?: string; location?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;
      const { data: profile } = userId ? await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single() : { data: null };

      const { data, error } = await supabase
        .from('workspace_incidents')
        .insert({
          workspace_id: workspaceId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity || 'medium',
          location: issue.location,
          status: 'open',
          reported_by: user.user?.id,
          reported_by_name: profile?.full_name || 'Unknown',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-issues', workspaceId] });
      toast.success('Issue reported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to report issue: ${error.message}`);
    },
  });
}

export function useUpdateIssue(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; resolution_notes?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['logistics-issues', workspaceId] });
      toast.success('Issue updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update issue: ${error.message}`);
    },
  });
}

// =============================================
// Stats Aggregations
// =============================================
export function useLogisticsStats(workspaceId: string | undefined) {
  const { data: shipments } = useLogisticsShipments(workspaceId);
  const { data: equipment } = useLogisticsEquipment(workspaceId);
  const { data: transports } = useTransportSchedules(workspaceId);
  const { data: venues } = useLogisticsVenues(workspaceId);
  const { data: issues } = useLogisticsIssues(workspaceId);

  return {
    shipments: {
      total: shipments?.length || 0,
      pending: shipments?.filter(s => s.status === 'pending').length || 0,
      inTransit: shipments?.filter(s => s.status === 'in_transit').length || 0,
      delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
      delayed: shipments?.filter(s => s.status === 'delayed').length || 0,
    },
    equipment: {
      total: equipment?.length || 0,
      available: equipment?.filter(e => e.status === 'available').length || 0,
      inUse: equipment?.filter(e => e.status === 'in_use').length || 0,
      maintenance: equipment?.filter(e => e.status === 'maintenance').length || 0,
    },
    transports: {
      total: transports?.length || 0,
      scheduled: transports?.filter(t => t.status === 'scheduled').length || 0,
      inProgress: transports?.filter(t => t.status === 'in_progress').length || 0,
      completed: transports?.filter(t => t.status === 'completed').length || 0,
    },
    venues: {
      total: venues?.length || 0,
      pending: venues?.filter(v => v.status === 'pending').length || 0,
      confirmed: venues?.filter(v => v.status === 'confirmed').length || 0,
      ready: venues?.filter(v => v.status === 'ready').length || 0,
    },
    issues: {
      total: issues?.length || 0,
      open: issues?.filter(i => i.status === 'open').length || 0,
      investigating: issues?.filter(i => i.status === 'investigating').length || 0,
      resolved: issues?.filter(i => i.status === 'resolved').length || 0,
    },
  };
}
