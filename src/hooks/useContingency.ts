import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface BackupEquipment {
  id: string;
  workspaceId: string;
  name: string;
  equipmentType: string;
  primaryEquipmentId: string | null;
  primaryEquipmentName?: string | null;
  location: string | null;
  status: 'ready' | 'deployed' | 'in_use' | 'maintenance' | 'unavailable';
  lastTestedAt: string | null;
  lastTestedBy: string | null;
  testResult: 'passed' | 'failed' | 'warning' | null;
  deployedAt: string | null;
  deployedFor: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface ProcedureStep {
  step: number;
  action: string;
  responsible: string;
  timeLimit?: string;
}

export interface ContingencyProcedure {
  id: string;
  workspaceId: string;
  name: string;
  category: 'power_failure' | 'network_failure' | 'av_failure' | 'equipment_failure' | 'weather' | 'security' | 'medical' | 'evacuation' | 'other';
  triggerCondition: string;
  procedureSteps: ProcedureStep[];
  rtoMinutes: number | null;
  primaryContactName: string | null;
  primaryContactPhone: string | null;
  secondaryContactName: string | null;
  secondaryContactPhone: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  lastDrillAt: string | null;
  relatedEquipment: string[];
  relatedZones: string[];
  priority: number;
  notes: string | null;
}

interface UseContingencyOptions {
  workspaceId: string;
}

export function useContingency({ workspaceId }: UseContingencyOptions) {
  const queryClient = useQueryClient();
  const backupKey = ['backup-equipment', workspaceId];
  const proceduresKey = ['contingency-procedures', workspaceId];

  const { data: backupEquipment = [], isLoading: backupLoading } = useQuery({
    queryKey: backupKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_backup_equipment')
        .select(`
          *,
          primary_equipment:workspace_equipment(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('order_index');

      if (error) throw error;
      return (data || []).map(row => ({
        ...mapToBackup(row),
        primaryEquipmentName: row.primary_equipment?.name,
      }));
    },
    enabled: !!workspaceId,
  });

  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: proceduresKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_contingency_procedures')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToProcedure);
    },
    enabled: !!workspaceId,
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`contingency-${workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_backup_equipment',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => queryClient.invalidateQueries({ queryKey: backupKey }))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_contingency_procedures',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => queryClient.invalidateQueries({ queryKey: proceduresKey }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  // Backup Equipment mutations
  const addBackupEquipment = useMutation({
    mutationFn: async (data: Partial<BackupEquipment>) => {
      const { error } = await supabase.from('workspace_backup_equipment').insert([{
        workspace_id: workspaceId,
        name: data.name || 'Backup Equipment',
        equipment_type: data.equipmentType || 'general',
        primary_equipment_id: data.primaryEquipmentId,
        location: data.location,
        status: data.status || 'ready',
        notes: data.notes,
        order_index: backupEquipment.length,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Backup equipment added');
    },
    onError: () => toast.error('Failed to add backup equipment'),
  });

  const deployBackup = useMutation({
    mutationFn: async ({ id, deployedFor }: { id: string; deployedFor: string }) => {
      const { error } = await supabase
        .from('workspace_backup_equipment')
        .update({
          status: 'deployed',
          deployed_at: new Date().toISOString(),
          deployed_for: deployedFor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Backup deployed');
    },
    onError: () => toast.error('Failed to deploy'),
  });

  const returnBackup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_backup_equipment')
        .update({
          status: 'ready',
          deployed_at: null,
          deployed_for: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Backup returned to stock');
    },
    onError: () => toast.error('Failed to return'),
  });

  const testBackup = useMutation({
    mutationFn: async ({ id, result, testedBy }: { id: string; result: 'passed' | 'failed' | 'warning'; testedBy?: string }) => {
      const { error } = await supabase
        .from('workspace_backup_equipment')
        .update({
          last_tested_at: new Date().toISOString(),
          last_tested_by: testedBy,
          test_result: result,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Test recorded');
    },
    onError: () => toast.error('Failed to record test'),
  });

  const updateBackupEquipment = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<BackupEquipment>) => {
      const { error } = await supabase
        .from('workspace_backup_equipment')
        .update({
          name: data.name,
          equipment_type: data.equipmentType,
          primary_equipment_id: data.primaryEquipmentId,
          location: data.location,
          status: data.status,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Backup equipment updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteBackupEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_backup_equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKey });
      toast.success('Backup equipment deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Procedures mutations
  const createProcedure = useMutation({
    mutationFn: async (data: Partial<ContingencyProcedure>) => {
      const { error } = await supabase.from('workspace_contingency_procedures').insert([{
        workspace_id: workspaceId,
        name: data.name || 'New Procedure',
        category: data.category || 'other',
        trigger_condition: data.triggerCondition || 'When triggered',
        procedure_steps: JSON.parse(JSON.stringify(data.procedureSteps || [])),
        recovery_time_objective_minutes: data.rtoMinutes,
        primary_contact_name: data.primaryContactName,
        primary_contact_phone: data.primaryContactPhone,
        secondary_contact_name: data.secondaryContactName,
        secondary_contact_phone: data.secondaryContactPhone,
        related_equipment: data.relatedEquipment || [],
        related_zones: data.relatedZones || [],
        priority: data.priority || 0,
        notes: data.notes,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proceduresKey });
      toast.success('Procedure created');
    },
    onError: () => toast.error('Failed to create procedure'),
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ContingencyProcedure>) => {
      const { error } = await supabase
        .from('workspace_contingency_procedures')
        .update({
          name: data.name,
          category: data.category,
          trigger_condition: data.triggerCondition,
          procedure_steps: data.procedureSteps ? JSON.parse(JSON.stringify(data.procedureSteps)) : undefined,
          recovery_time_objective_minutes: data.rtoMinutes,
          primary_contact_name: data.primaryContactName,
          primary_contact_phone: data.primaryContactPhone,
          secondary_contact_name: data.secondaryContactName,
          secondary_contact_phone: data.secondaryContactPhone,
          related_equipment: data.relatedEquipment,
          related_zones: data.relatedZones,
          priority: data.priority,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proceduresKey });
      toast.success('Procedure updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const verifyProcedure = useMutation({
    mutationFn: async ({ id, verifiedBy }: { id: string; verifiedBy?: string }) => {
      const { error } = await supabase
        .from('workspace_contingency_procedures')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proceduresKey });
      toast.success('Procedure verified');
    },
    onError: () => toast.error('Failed to verify'),
  });

  const recordDrill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_contingency_procedures')
        .update({
          last_drill_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proceduresKey });
      toast.success('Drill recorded');
    },
    onError: () => toast.error('Failed to record drill'),
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_contingency_procedures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proceduresKey });
      toast.success('Procedure deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Stats
  const backupReady = backupEquipment.filter(b => b.status === 'ready').length;
  const backupDeployed = backupEquipment.filter(b => b.status === 'deployed').length;
  const proceduresVerified = procedures.filter(p => p.isVerified).length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const needsTest = backupEquipment.filter(b => !b.lastTestedAt || new Date(b.lastTestedAt) < sevenDaysAgo).length;

  return {
    backupEquipment,
    procedures,
    isLoading: backupLoading || proceduresLoading,
    stats: {
      backupReady,
      backupDeployed,
      proceduresVerified,
      proceduresTotal: procedures.length,
      needsTest,
    },
    addBackupEquipment: addBackupEquipment.mutateAsync,
    deployBackup: deployBackup.mutateAsync,
    returnBackup: returnBackup.mutateAsync,
    testBackup: testBackup.mutateAsync,
    updateBackupEquipment: updateBackupEquipment.mutateAsync,
    deleteBackupEquipment: deleteBackupEquipment.mutateAsync,
    createProcedure: createProcedure.mutateAsync,
    updateProcedure: updateProcedure.mutateAsync,
    verifyProcedure: verifyProcedure.mutateAsync,
    recordDrill: recordDrill.mutateAsync,
    deleteProcedure: deleteProcedure.mutateAsync,
  };
}

function mapToBackup(row: any): BackupEquipment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    equipmentType: row.equipment_type,
    primaryEquipmentId: row.primary_equipment_id,
    location: row.location,
    status: row.status,
    lastTestedAt: row.last_tested_at,
    lastTestedBy: row.last_tested_by,
    testResult: row.test_result,
    deployedAt: row.deployed_at,
    deployedFor: row.deployed_for,
    notes: row.notes,
    orderIndex: row.order_index || 0,
  };
}

function mapToProcedure(row: any): ContingencyProcedure {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    category: row.category,
    triggerCondition: row.trigger_condition,
    procedureSteps: (row.procedure_steps as ProcedureStep[]) || [],
    rtoMinutes: row.recovery_time_objective_minutes,
    primaryContactName: row.primary_contact_name,
    primaryContactPhone: row.primary_contact_phone,
    secondaryContactName: row.secondary_contact_name,
    secondaryContactPhone: row.secondary_contact_phone,
    isVerified: row.is_verified,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    lastDrillAt: row.last_drill_at,
    relatedEquipment: row.related_equipment || [],
    relatedZones: row.related_zones || [],
    priority: row.priority || 0,
    notes: row.notes,
  };
}
