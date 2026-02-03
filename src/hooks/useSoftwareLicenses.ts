import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export interface SoftwareLicense {
  id: string;
  workspace_id: string;
  event_id: string | null;
  name: string;
  vendor: string | null;
  version: string | null;
  license_key: string | null;
  license_type: 'perpetual' | 'subscription' | 'trial' | 'open_source';
  total_seats: number;
  used_seats: number;
  cost_per_seat: number | null;
  total_cost: number | null;
  currency: string;
  purchase_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  status: 'active' | 'expiring' | 'expired' | 'suspended';
  expiry_alert_days: number;
  seat_alert_threshold: number;
  assigned_to_department: string | null;
  primary_contact_name: string | null;
  notes: string | null;
  documentation_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SoftwareLicenseStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  suspended: number;
  totalSeats: number;
  usedSeats: number;
  seatUtilization: number;
  totalAnnualCost: number;
  expiringThisMonth: number;
}

export type SoftwareLicenseInsert = Omit<SoftwareLicense, 'id' | 'created_at' | 'updated_at'>;
export type SoftwareLicenseUpdate = Partial<SoftwareLicenseInsert> & { id: string };

const DEFAULT_LICENSE_TEMPLATES: Omit<SoftwareLicenseInsert, 'workspace_id'>[] = [
  {
    name: 'Badge Printing Suite',
    vendor: 'BadgeTech',
    version: 'v3.2.1',
    license_type: 'subscription',
    total_seats: 10,
    used_seats: 0,
    status: 'active',
    expiry_alert_days: 30,
    seat_alert_threshold: 80,
    auto_renew: true,
    event_id: null,
    license_key: null,
    cost_per_seat: null,
    total_cost: null,
    currency: 'USD',
    purchase_date: null,
    expiry_date: null,
    renewal_date: null,
    assigned_to_department: null,
    primary_contact_name: null,
    notes: null,
    documentation_url: null,
    created_by: null,
  },
  {
    name: 'Registration Portal',
    vendor: 'EventReg Pro',
    version: 'v2.0.0',
    license_type: 'subscription',
    total_seats: 20,
    used_seats: 0,
    status: 'active',
    expiry_alert_days: 30,
    seat_alert_threshold: 80,
    auto_renew: true,
    event_id: null,
    license_key: null,
    cost_per_seat: null,
    total_cost: null,
    currency: 'USD',
    purchase_date: null,
    expiry_date: null,
    renewal_date: null,
    assigned_to_department: null,
    primary_contact_name: null,
    notes: null,
    documentation_url: null,
    created_by: null,
  },
  {
    name: 'Analytics Dashboard',
    vendor: 'DataViz Inc',
    version: 'v1.5.3',
    license_type: 'subscription',
    total_seats: 5,
    used_seats: 0,
    status: 'active',
    expiry_alert_days: 30,
    seat_alert_threshold: 80,
    auto_renew: false,
    event_id: null,
    license_key: null,
    cost_per_seat: null,
    total_cost: null,
    currency: 'USD',
    purchase_date: null,
    expiry_date: null,
    renewal_date: null,
    assigned_to_department: null,
    primary_contact_name: null,
    notes: null,
    documentation_url: null,
    created_by: null,
  },
  {
    name: 'Email Campaign Tool',
    vendor: 'MailFlow',
    version: 'v4.1.0',
    license_type: 'subscription',
    total_seats: 5,
    used_seats: 0,
    status: 'active',
    expiry_alert_days: 30,
    seat_alert_threshold: 80,
    auto_renew: true,
    event_id: null,
    license_key: null,
    cost_per_seat: null,
    total_cost: null,
    currency: 'USD',
    purchase_date: null,
    expiry_date: null,
    renewal_date: null,
    assigned_to_department: null,
    primary_contact_name: null,
    notes: null,
    documentation_url: null,
    created_by: null,
  },
];

function calculateStatus(expiryDate: string | null, alertDays: number): 'active' | 'expiring' | 'expired' {
  if (!expiryDate) return 'active';
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= alertDays) return 'expiring';
  return 'active';
}

export function useSoftwareLicenses(workspaceId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['software-licenses', workspaceId];

  // Fetch licenses
  const {
    data: licenses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_software_licenses')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      return (data || []) as SoftwareLicense[];
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`software-licenses-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_software_licenses',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info('New license added');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('License updated');
          } else if (payload.eventType === 'DELETE') {
            toast.info('License removed');
          }
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Check for expiring licenses and show alerts
  useEffect(() => {
    if (licenses.length === 0) return;

    const expiringLicenses = licenses.filter(
      (l) => l.status === 'expiring' || calculateStatus(l.expiry_date, l.expiry_alert_days) === 'expiring'
    );

    if (expiringLicenses.length > 0) {
      toast.warning(`${expiringLicenses.length} license(s) expiring soon`, {
        description: expiringLicenses.map((l) => l.name).join(', '),
      });
    }
  }, [licenses.length]);

  // Calculate stats
  const stats = useMemo<SoftwareLicenseStats>(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      total: licenses.length,
      active: licenses.filter((l) => l.status === 'active').length,
      expiring: licenses.filter((l) => l.status === 'expiring').length,
      expired: licenses.filter((l) => l.status === 'expired').length,
      suspended: licenses.filter((l) => l.status === 'suspended').length,
      totalSeats: licenses.reduce((sum, l) => sum + (l.total_seats || 0), 0),
      usedSeats: licenses.reduce((sum, l) => sum + (l.used_seats || 0), 0),
      seatUtilization:
        licenses.reduce((sum, l) => sum + (l.total_seats || 0), 0) > 0
          ? Math.round(
              (licenses.reduce((sum, l) => sum + (l.used_seats || 0), 0) /
                licenses.reduce((sum, l) => sum + (l.total_seats || 0), 0)) *
                100
            )
          : 0,
      totalAnnualCost: licenses.reduce((sum, l) => sum + (l.total_cost || 0), 0),
      expiringThisMonth: licenses.filter((l) => {
        if (!l.expiry_date) return false;
        const expiry = new Date(l.expiry_date);
        return expiry >= now && expiry <= endOfMonth;
      }).length,
    };
  }, [licenses]);

  // Create license
  const createLicense = useMutation({
    mutationFn: async (license: Omit<SoftwareLicenseInsert, 'workspace_id'>) => {
      const { data: user } = await supabase.auth.getUser();
      const newLicense = {
        ...license,
        workspace_id: workspaceId,
        created_by: user.user?.id || null,
        status: calculateStatus(license.expiry_date || null, license.expiry_alert_days || 30),
      };

      const { data, error } = await supabase
        .from('workspace_software_licenses')
        .insert(newLicense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('License added successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to add license', { description: error.message });
    },
  });

  // Update license
  const updateLicense = useMutation({
    mutationFn: async ({ id, ...updates }: SoftwareLicenseUpdate) => {
      const updatedData = {
        ...updates,
        status: updates.expiry_date
          ? calculateStatus(updates.expiry_date, updates.expiry_alert_days || 30)
          : updates.status,
      };

      const { data, error } = await supabase
        .from('workspace_software_licenses')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('License updated successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to update license', { description: error.message });
    },
  });

  // Delete license
  const deleteLicense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_software_licenses').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('License deleted successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to delete license', { description: error.message });
    },
  });

  // Update seat usage
  const updateSeatUsage = useMutation({
    mutationFn: async ({ id, usedSeats }: { id: string; usedSeats: number }) => {
      const { data, error } = await supabase
        .from('workspace_software_licenses')
        .update({ used_seats: usedSeats })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to update seat usage', { description: error.message });
    },
  });

  // Load default templates
  const loadDefaultTemplates = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const templatesWithWorkspace = DEFAULT_LICENSE_TEMPLATES.map((template) => ({
        ...template,
        workspace_id: workspaceId,
        created_by: user.user?.id || null,
      }));

      const { data, error } = await supabase
        .from('workspace_software_licenses')
        .insert(templatesWithWorkspace)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Default licenses loaded');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to load templates', { description: error.message });
    },
  });

  return {
    licenses,
    stats,
    isLoading,
    error,
    refetch,
    createLicense,
    updateLicense,
    deleteLicense,
    updateSeatUsage,
    loadDefaultTemplates,
  };
}
