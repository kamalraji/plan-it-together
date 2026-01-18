import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface PowerZone {
  id: string;
  workspaceId: string;
  name: string;
  location: string | null;
  zoneType: 'standard' | 'high_power' | 'backup' | 'generator' | 'ups';
  totalCapacityAmps: number | null;
  allocatedAmps: number;
  status: 'active' | 'inactive' | 'overloaded' | 'fault' | 'maintenance';
  isGeneratorBacked: boolean;
  generatorId: string | null;
  fuelLevelPercent: number | null;
  notes: string | null;
  emergencyProcedure: string | null;
  orderIndex: number;
  circuits: PowerCircuit[];
}

export interface PowerCircuit {
  id: string;
  workspaceId: string;
  zoneId: string;
  name: string;
  circuitNumber: string | null;
  ratedAmps: number;
  currentLoadAmps: number;
  loadPercentage: number;
  assignedTo: string | null;
  equipmentConnected: string[];
  status: 'active' | 'inactive' | 'tripped' | 'overloaded' | 'reserved';
  lastCheckedAt: string | null;
  lastCheckedBy: string | null;
  notes: string | null;
}

interface UsePowerDistributionOptions {
  workspaceId: string;
}

export function usePowerDistribution({ workspaceId }: UsePowerDistributionOptions) {
  const queryClient = useQueryClient();
  const zonesQueryKey = ['power-zones', workspaceId];
  const circuitsQueryKey = ['power-circuits', workspaceId];

  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: zonesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_power_zones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index');

      if (error) throw error;
      return (data || []).map(mapToZone);
    },
    enabled: !!workspaceId,
  });

  const { data: circuits = [], isLoading: circuitsLoading } = useQuery({
    queryKey: circuitsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_power_circuits')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at');

      if (error) throw error;
      return (data || []).map(mapToCircuit);
    },
    enabled: !!workspaceId,
  });

  // Combine zones with their circuits
  const zonesWithCircuits: PowerZone[] = zones.map(zone => ({
    ...zone,
    circuits: circuits.filter(c => c.zoneId === zone.id),
  }));

  // Real-time subscriptions
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`power-${workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_power_zones',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => queryClient.invalidateQueries({ queryKey: zonesQueryKey }))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_power_circuits',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => queryClient.invalidateQueries({ queryKey: circuitsQueryKey }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  // Zone mutations
  const createZone = useMutation({
    mutationFn: async (data: Partial<PowerZone>) => {
      const { error } = await supabase.from('workspace_power_zones').insert([{
        workspace_id: workspaceId,
        name: data.name || 'New Zone',
        location: data.location,
        zone_type: data.zoneType || 'standard',
        total_capacity_amps: data.totalCapacityAmps,
        status: data.status || 'active',
        is_generator_backed: data.isGeneratorBacked || false,
        generator_id: data.generatorId,
        fuel_level_percent: data.fuelLevelPercent,
        notes: data.notes,
        emergency_procedure: data.emergencyProcedure,
        order_index: zones.length,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesQueryKey });
      toast.success('Power zone created');
    },
    onError: () => toast.error('Failed to create zone'),
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PowerZone>) => {
      const { error } = await supabase
        .from('workspace_power_zones')
        .update({
          name: data.name,
          location: data.location,
          zone_type: data.zoneType,
          total_capacity_amps: data.totalCapacityAmps,
          status: data.status,
          is_generator_backed: data.isGeneratorBacked,
          generator_id: data.generatorId,
          fuel_level_percent: data.fuelLevelPercent,
          notes: data.notes,
          emergency_procedure: data.emergencyProcedure,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesQueryKey });
      toast.success('Zone updated');
    },
    onError: () => toast.error('Failed to update zone'),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_power_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesQueryKey });
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Zone deleted');
    },
    onError: () => toast.error('Failed to delete zone'),
  });

  const updateGeneratorFuel = useMutation({
    mutationFn: async ({ zoneId, fuelPercent }: { zoneId: string; fuelPercent: number }) => {
      const { error } = await supabase
        .from('workspace_power_zones')
        .update({ fuel_level_percent: fuelPercent, updated_at: new Date().toISOString() })
        .eq('id', zoneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesQueryKey });
      toast.success('Fuel level updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  // Circuit mutations
  const createCircuit = useMutation({
    mutationFn: async ({ zoneId, ...data }: { zoneId: string } & Partial<PowerCircuit>) => {
      const { error } = await supabase.from('workspace_power_circuits').insert([{
        workspace_id: workspaceId,
        zone_id: zoneId,
        name: data.name || 'New Circuit',
        circuit_number: data.circuitNumber,
        rated_amps: data.ratedAmps || 20,
        current_load_amps: data.currentLoadAmps || 0,
        assigned_to: data.assignedTo,
        equipment_connected: data.equipmentConnected || [],
        status: data.status || 'active',
        notes: data.notes,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Circuit added');
    },
    onError: () => toast.error('Failed to add circuit'),
  });

  const updateCircuitLoad = useMutation({
    mutationFn: async ({ id, loadAmps }: { id: string; loadAmps: number }) => {
      const circuit = circuits.find(c => c.id === id);
      const newStatus = circuit && loadAmps > circuit.ratedAmps ? 'overloaded' : 'active';
      
      const { error } = await supabase
        .from('workspace_power_circuits')
        .update({
          current_load_amps: loadAmps,
          status: newStatus,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Load updated');
    },
    onError: () => toast.error('Failed to update load'),
  });

  const markCircuitTripped = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_power_circuits')
        .update({ status: 'tripped', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.warning('Circuit marked as tripped');
    },
    onError: () => toast.error('Failed to update'),
  });

  const resetCircuit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_power_circuits')
        .update({ status: 'active', current_load_amps: 0, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Circuit reset');
    },
    onError: () => toast.error('Failed to reset'),
  });

  const assignCircuit = useMutation({
    mutationFn: async ({ id, assignedTo, equipment }: { id: string; assignedTo: string; equipment: string[] }) => {
      const { error } = await supabase
        .from('workspace_power_circuits')
        .update({
          assigned_to: assignedTo,
          equipment_connected: equipment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Circuit assigned');
    },
    onError: () => toast.error('Failed to assign'),
  });

  const deleteCircuit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_power_circuits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circuitsQueryKey });
      toast.success('Circuit deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Stats
  const activeCircuits = circuits.filter(c => c.status === 'active');
  const trippedCircuits = circuits.filter(c => c.status === 'tripped');
  const overloadedCircuits = circuits.filter(c => c.status === 'overloaded');
  const avgLoad = circuits.length > 0
    ? circuits.reduce((acc, c) => acc + c.loadPercentage, 0) / circuits.length
    : 0;

  return {
    zones: zonesWithCircuits,
    circuits,
    isLoading: zonesLoading || circuitsLoading,
    stats: {
      totalZones: zones.length,
      activeCircuits: activeCircuits.length,
      trippedCircuits: trippedCircuits.length,
      overloadedCircuits: overloadedCircuits.length,
      avgLoadPercentage: Math.round(avgLoad),
    },
    createZone: createZone.mutateAsync,
    updateZone: updateZone.mutateAsync,
    deleteZone: deleteZone.mutateAsync,
    updateGeneratorFuel: updateGeneratorFuel.mutateAsync,
    createCircuit: createCircuit.mutateAsync,
    updateCircuitLoad: updateCircuitLoad.mutateAsync,
    markCircuitTripped: markCircuitTripped.mutateAsync,
    resetCircuit: resetCircuit.mutateAsync,
    assignCircuit: assignCircuit.mutateAsync,
    deleteCircuit: deleteCircuit.mutateAsync,
  };
}

function mapToZone(row: any): PowerZone {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    location: row.location,
    zoneType: row.zone_type,
    totalCapacityAmps: row.total_capacity_amps,
    allocatedAmps: row.allocated_amps || 0,
    status: row.status,
    isGeneratorBacked: row.is_generator_backed,
    generatorId: row.generator_id,
    fuelLevelPercent: row.fuel_level_percent,
    notes: row.notes,
    emergencyProcedure: row.emergency_procedure,
    orderIndex: row.order_index || 0,
    circuits: [],
  };
}

function mapToCircuit(row: any): PowerCircuit {
  const loadPercentage = row.rated_amps > 0 
    ? Math.round((row.current_load_amps / row.rated_amps) * 100) 
    : 0;
  
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    zoneId: row.zone_id,
    name: row.name,
    circuitNumber: row.circuit_number,
    ratedAmps: row.rated_amps,
    currentLoadAmps: row.current_load_amps || 0,
    loadPercentage,
    assignedTo: row.assigned_to,
    equipmentConnected: row.equipment_connected || [],
    status: row.status,
    lastCheckedAt: row.last_checked_at,
    lastCheckedBy: row.last_checked_by,
    notes: row.notes,
  };
}
