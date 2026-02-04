import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { NETWORK_ZONE_COLUMNS } from '@/lib/supabase-columns';

export type NetworkZoneStatus = 'online' | 'offline' | 'degraded' | 'maintenance';
export type NetworkZoneType = 'wifi' | 'wired' | 'av' | 'staff' | 'guest' | 'backup';

export interface NetworkZone {
  id: string;
  workspaceId: string;
  eventId: string | null;
  name: string;
  description: string | null;
  location: string | null;
  zoneType: NetworkZoneType;
  maxDevices: number;
  maxBandwidthMbps: number;
  currentDevices: number;
  currentBandwidthPercent: number;
  status: NetworkZoneStatus;
  statusMessage: string | null;
  deviceAlertThreshold: number;
  bandwidthAlertThreshold: number;
  ssid: string | null;
  ipRange: string | null;
  vlanId: number | null;
  lastCheckedAt: string | null;
  lastCheckedBy: string | null;
  lastCheckedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkZoneInput {
  name: string;
  description?: string;
  location?: string;
  zoneType?: NetworkZoneType;
  maxDevices?: number;
  maxBandwidthMbps?: number;
  ssid?: string;
  ipRange?: string;
  vlanId?: number;
  deviceAlertThreshold?: number;
  bandwidthAlertThreshold?: number;
}

export interface NetworkZoneStats {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  maintenance: number;
  totalDevices: number;
  maxDevices: number;
  avgBandwidth: number;
  alertsCount: number;
}

const mapDbToZone = (row: any): NetworkZone => ({
  id: row.id,
  workspaceId: row.workspace_id,
  eventId: row.event_id,
  name: row.name,
  description: row.description,
  location: row.location,
  zoneType: row.zone_type,
  maxDevices: row.max_devices,
  maxBandwidthMbps: row.max_bandwidth_mbps,
  currentDevices: row.current_devices,
  currentBandwidthPercent: row.current_bandwidth_percent,
  status: row.status,
  statusMessage: row.status_message,
  deviceAlertThreshold: row.device_alert_threshold,
  bandwidthAlertThreshold: row.bandwidth_alert_threshold,
  ssid: row.ssid,
  ipRange: row.ip_range,
  vlanId: row.vlan_id,
  lastCheckedAt: row.last_checked_at,
  lastCheckedBy: row.last_checked_by,
  lastCheckedByName: row.last_checked_by_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useNetworkZones(workspaceId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['network-zones', workspaceId];

  // Fetch network zones
  const { data: zones = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_network_zones')
        .select(NETWORK_ZONE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      return (data || []).map(mapDbToZone);
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`network-zones-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_network_zones',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey });
          
          // Show toast for status changes
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            if (oldData.status !== newData.status) {
              if (newData.status === 'offline') {
                toast.error(`${newData.name} is now OFFLINE`);
              } else if (newData.status === 'degraded') {
                toast.warning(`${newData.name} is experiencing issues`);
              } else if (newData.status === 'online' && oldData.status !== 'online') {
                toast.success(`${newData.name} is back online`);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Calculate stats
  const stats: NetworkZoneStats = useMemo(() => {
    const alertsCount = zones.filter(z => {
      const devicePercent = (z.currentDevices / z.maxDevices) * 100;
      return devicePercent >= z.deviceAlertThreshold || 
             z.currentBandwidthPercent >= z.bandwidthAlertThreshold ||
             z.status === 'offline' || z.status === 'degraded';
    }).length;

    return {
      total: zones.length,
      online: zones.filter(z => z.status === 'online').length,
      offline: zones.filter(z => z.status === 'offline').length,
      degraded: zones.filter(z => z.status === 'degraded').length,
      maintenance: zones.filter(z => z.status === 'maintenance').length,
      totalDevices: zones.reduce((sum, z) => sum + z.currentDevices, 0),
      maxDevices: zones.reduce((sum, z) => sum + z.maxDevices, 0),
      avgBandwidth: zones.length > 0 
        ? Math.round(zones.reduce((sum, z) => sum + z.currentBandwidthPercent, 0) / zones.length)
        : 0,
      alertsCount,
    };
  }, [zones]);

  // Create zone
  const createZone = useMutation({
    mutationFn: async (input: NetworkZoneInput) => {
      const { data, error } = await supabase
        .from('workspace_network_zones')
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          description: input.description,
          location: input.location,
          zone_type: input.zoneType || 'wifi',
          max_devices: input.maxDevices || 100,
          max_bandwidth_mbps: input.maxBandwidthMbps || 1000,
          ssid: input.ssid,
          ip_range: input.ipRange,
          vlan_id: input.vlanId,
          device_alert_threshold: input.deviceAlertThreshold || 80,
          bandwidth_alert_threshold: input.bandwidthAlertThreshold || 80,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToZone(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Network zone created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create zone: ${error.message}`);
    },
  });

  // Update zone
  const updateZone = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NetworkZone> & { id: string }) => {
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.zoneType !== undefined) dbUpdates.zone_type = updates.zoneType;
      if (updates.maxDevices !== undefined) dbUpdates.max_devices = updates.maxDevices;
      if (updates.maxBandwidthMbps !== undefined) dbUpdates.max_bandwidth_mbps = updates.maxBandwidthMbps;
      if (updates.ssid !== undefined) dbUpdates.ssid = updates.ssid;
      if (updates.ipRange !== undefined) dbUpdates.ip_range = updates.ipRange;
      if (updates.vlanId !== undefined) dbUpdates.vlan_id = updates.vlanId;
      if (updates.deviceAlertThreshold !== undefined) dbUpdates.device_alert_threshold = updates.deviceAlertThreshold;
      if (updates.bandwidthAlertThreshold !== undefined) dbUpdates.bandwidth_alert_threshold = updates.bandwidthAlertThreshold;

      const { data, error } = await supabase
        .from('workspace_network_zones')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToZone(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Zone updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update zone: ${error.message}`);
    },
  });

  // Update metrics (devices, bandwidth)
  const updateMetrics = useMutation({
    mutationFn: async ({ 
      id, 
      currentDevices, 
      currentBandwidthPercent 
    }: { 
      id: string; 
      currentDevices?: number; 
      currentBandwidthPercent?: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata?.full_name || userData.user?.email || 'Unknown';

      const updates: any = {
        last_checked_at: new Date().toISOString(),
        last_checked_by: userData.user?.id,
        last_checked_by_name: userName,
      };
      
      if (currentDevices !== undefined) updates.current_devices = currentDevices;
      if (currentBandwidthPercent !== undefined) updates.current_bandwidth_percent = currentBandwidthPercent;

      const { data, error } = await supabase
        .from('workspace_network_zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToZone(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update metrics: ${error.message}`);
    },
  });

  // Update status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      statusMessage 
    }: { 
      id: string; 
      status: NetworkZoneStatus; 
      statusMessage?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata?.full_name || userData.user?.email || 'Unknown';

      const { data, error } = await supabase
        .from('workspace_network_zones')
        .update({
          status,
          status_message: statusMessage || null,
          last_checked_at: new Date().toISOString(),
          last_checked_by: userData.user?.id,
          last_checked_by_name: userName,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToZone(data);
    },
    onSuccess: (zone) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${zone.name} status updated to ${zone.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Delete zone
  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_network_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Network zone deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete zone: ${error.message}`);
    },
  });

  return {
    zones,
    stats,
    isLoading,
    error,
    createZone,
    updateZone,
    updateMetrics,
    updateStatus,
    deleteZone,
  };
}
