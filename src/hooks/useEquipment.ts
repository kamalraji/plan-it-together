import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export interface Equipment {
  id: string;
  workspaceId: string;
  eventId: string | null;
  name: string;
  equipmentType: string;
  serialNumber: string | null;
  location: string | null;
  status: 'passed' | 'failed' | 'pending' | 'testing' | 'maintenance';
  assignedToId: string | null;
  assignedToName: string | null;
  lastTestedAt: string | null;
  lastTestedByName: string | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface EquipmentTest {
  id: string;
  equipmentId: string;
  workspaceId: string;
  testType: string;
  result: 'passed' | 'failed' | 'warning';
  testedByName: string | null;
  notes: string | null;
  metrics: Record<string, number> | null;
  createdAt: string;
}

interface UseEquipmentOptions {
  workspaceId: string;
  eventId?: string;
}

export function useEquipment({ workspaceId, eventId }: UseEquipmentOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['equipment', workspaceId, eventId];

  // Fetch equipment
  const { data: equipment = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('workspace_equipment')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true })
        .order('name', { ascending: true });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        workspaceId: item.workspace_id,
        eventId: item.event_id,
        name: item.name,
        equipmentType: item.equipment_type,
        serialNumber: item.serial_number,
        location: item.location,
        status: item.status,
        assignedToId: item.assigned_to,
        assignedToName: item.assigned_to_name,
        lastTestedAt: item.last_tested_at,
        lastTestedByName: item.last_tested_by_name,
        nextMaintenanceDate: item.next_maintenance_date,
        notes: item.notes,
        orderIndex: item.order_index,
      })) as Equipment[];
    },
    enabled: !!workspaceId,
  });

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['workspace-team', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select(`
          user_id,
          user_profiles:user_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.user_id,
        name: m.user_profiles?.full_name || 'Unknown',
        avatar: m.user_profiles?.avatar_url,
      }));
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const total = equipment.length;
    const passed = equipment.filter(e => e.status === 'passed').length;
    const failed = equipment.filter(e => e.status === 'failed').length;
    const pending = equipment.filter(e => e.status === 'pending').length;
    const testing = equipment.filter(e => e.status === 'testing').length;
    const maintenance = equipment.filter(e => e.status === 'maintenance').length;
    
    return { total, passed, failed, pending, testing, maintenance };
  }, [equipment]);

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`equipment-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_equipment',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Create equipment
  const createEquipment = useMutation({
    mutationFn: async (item: {
      name: string;
      equipmentType?: string;
      serialNumber?: string;
      location?: string;
      assignedToId?: string;
      assignedToName?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('workspace_equipment')
        .insert({
          workspace_id: workspaceId,
          event_id: eventId || null,
          name: item.name,
          equipment_type: item.equipmentType || 'general',
          serial_number: item.serialNumber || null,
          location: item.location || null,
          assigned_to: item.assignedToId || null,
          assigned_to_name: item.assignedToName || null,
          notes: item.notes || null,
          created_by: user?.id,
          order_index: equipment.length,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Equipment added');
    },
    onError: (error) => {
      toast.error('Failed to add equipment: ' + error.message);
    },
  });

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Equipment> & { id: string }) => {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.equipmentType !== undefined) dbUpdates.equipment_type = updates.equipmentType;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.assignedToId !== undefined) dbUpdates.assigned_to = updates.assignedToId;
      if (updates.assignedToName !== undefined) dbUpdates.assigned_to_name = updates.assignedToName;
      if (updates.lastTestedAt !== undefined) dbUpdates.last_tested_at = updates.lastTestedAt;
      if (updates.lastTestedByName !== undefined) dbUpdates.last_tested_by_name = updates.lastTestedByName;
      if (updates.nextMaintenanceDate !== undefined) dbUpdates.next_maintenance_date = updates.nextMaintenanceDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

      const { error } = await supabase
        .from('workspace_equipment')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to update equipment: ' + error.message);
    },
  });

  // Delete equipment
  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Equipment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete equipment: ' + error.message);
    },
  });

  // Run test on equipment
  const runTest = async (equipmentId: string, result: 'passed' | 'failed' | 'warning', notes?: string, metrics?: Record<string, number>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'Unknown';
    
    // Insert test record
    const { error: testError } = await supabase
      .from('workspace_equipment_tests')
      .insert({
        equipment_id: equipmentId,
        workspace_id: workspaceId,
        test_type: 'manual',
        result,
        tested_by: user?.id,
        tested_by_name: userName,
        notes: notes || null,
        metrics: metrics || null,
      });

    if (testError) throw testError;

    // Update equipment status
    const newStatus = result === 'warning' ? 'pending' : result;
    await updateEquipment.mutateAsync({
      id: equipmentId,
      status: newStatus as Equipment['status'],
      lastTestedAt: new Date().toISOString(),
      lastTestedByName: userName,
      notes: notes || undefined,
    });

    toast.success(`Test recorded: ${result}`);
  };

  // Get test history for an equipment
  const getTestHistory = async (equipmentId: string): Promise<EquipmentTest[]> => {
    const { data, error } = await supabase
      .from('workspace_equipment_tests')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data || []).map((test: any) => ({
      id: test.id,
      equipmentId: test.equipment_id,
      workspaceId: test.workspace_id,
      testType: test.test_type,
      result: test.result,
      testedByName: test.tested_by_name,
      notes: test.notes,
      metrics: test.metrics,
      createdAt: test.created_at,
    }));
  };

  // Set equipment to testing status
  const startTesting = async (equipmentId: string) => {
    await updateEquipment.mutateAsync({
      id: equipmentId,
      status: 'testing',
    });
    toast.info('Equipment testing started');
  };

  // Reset all equipment statuses
  const resetAllStatuses = async () => {
    const promises = equipment.map(item =>
      supabase
        .from('workspace_equipment')
        .update({
          status: 'pending',
          last_tested_at: null,
          last_tested_by_name: null,
        })
        .eq('id', item.id)
    );

    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey });
    toast.success('All equipment statuses reset');
  };

  // Create default equipment template
  const createDefaultTemplate = async () => {
    const defaultEquipment = [
      { name: 'Main Stage Projector', type: 'projector', location: 'Main Hall', serial: 'PRJ-001' },
      { name: 'Wireless Mic Set A', type: 'audio', location: 'Main Hall', serial: 'MIC-001' },
      { name: 'Wireless Mic Set B', type: 'audio', location: 'Main Hall', serial: 'MIC-002' },
      { name: 'PA System', type: 'audio', location: 'Main Hall', serial: 'PA-001' },
      { name: 'Breakout Room Display 1', type: 'display', location: 'Room 101', serial: 'DSP-001' },
      { name: 'Breakout Room Display 2', type: 'display', location: 'Room 102', serial: 'DSP-002' },
      { name: 'Registration Laptop 1', type: 'computer', location: 'Registration', serial: 'LAP-001' },
      { name: 'LED Wall Controller', type: 'display', location: 'Main Hall', serial: 'LED-001' },
      { name: 'Stage Lighting System', type: 'lighting', location: 'Main Hall', serial: 'LGT-001' },
      { name: 'Network Router', type: 'network', location: 'Tech Room', serial: 'NET-001' },
    ];

    const { data: { user } } = await supabase.auth.getUser();

    for (let i = 0; i < defaultEquipment.length; i++) {
      const item = defaultEquipment[i];
      await supabase.from('workspace_equipment').insert({
        workspace_id: workspaceId,
        event_id: eventId || null,
        name: item.name,
        equipment_type: item.type,
        serial_number: item.serial,
        location: item.location,
        order_index: i,
        created_by: user?.id,
      });
    }

    queryClient.invalidateQueries({ queryKey });
    toast.success('Default equipment template created');
  };

  return {
    equipment,
    stats,
    teamMembers,
    isLoading,
    isSaving: createEquipment.isPending || updateEquipment.isPending || deleteEquipment.isPending,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    runTest,
    getTestHistory,
    startTesting,
    resetAllStatuses,
    createDefaultTemplate,
  };
}
