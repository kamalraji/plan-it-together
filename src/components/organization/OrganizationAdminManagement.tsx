import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User, Organization } from '../../types';

interface OrganizationAdmin {
  id: string;
  userId: string;
  role: 'ADMIN' | 'OWNER' | 'ORGANIZER' | 'VIEWER';
  addedAt: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
}

interface OrganizationAdminManagementProps {
  organization: Organization;
  currentUser: User;
  onUpdate?: () => void;
}

interface InviteAdminForm {
  email: string;
  role: 'ADMIN' | 'OWNER';
}

const OrganizationAdminManagement: React.FC<OrganizationAdminManagementProps> = ({
  organization,
  currentUser,
  onUpdate
}) => {
  const queryClient = useQueryClient();
  const [inviteForm, setInviteForm] = useState<InviteAdminForm>({
    email: '',
    role: 'ADMIN'
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch admins using Supabase organization_memberships table
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['organization-admins', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          user_profiles (
            id,
            display_name,
            email
          )
        `)
        .eq('organization_id', organization.id)
        .in('role', ['ADMIN', 'OWNER'])
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role as 'ADMIN' | 'OWNER',
        status: row.status,
        addedAt: row.created_at,
        user: {
          name: row.user_profiles?.display_name || 'Unknown',
          email: row.user_profiles?.email || ''
        }
      })) as OrganizationAdmin[];
    },
  });

  // Invite admin mutation
  const inviteMutation = useMutation({
    mutationFn: async (form: InviteAdminForm) => {
      // First find user by email
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', form.email.toLowerCase())
        .single();

      if (userError || !userProfile) {
        throw new Error('User not found with that email address');
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', userProfile.id)
        .single();

      if (existing) {
        throw new Error('User is already a member of this organization');
      }

      // Add as member
      const { error: insertError } = await supabase
        .from('organization_memberships')
        .insert({
          organization_id: organization.id,
          user_id: userProfile.id,
          role: form.role,
          status: 'ACTIVE'
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-admins', organization.id] });
      setInviteForm({ email: '', role: 'ADMIN' });
      setShowInviteForm(false);
      setError(null);
      onUpdate?.();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  // Remove admin mutation
  const removeMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-admins', organization.id] });
      onUpdate?.();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;
    setError(null);
    inviteMutation.mutate(inviteForm);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    setError(null);
    removeMutation.mutate(adminId);
  };

  const canManageAdmins = () => {
    const currentUserAdmin = admins.find(admin => admin.userId === currentUser.id);
    return currentUserAdmin?.role === 'OWNER' || currentUser.role === 'SUPER_ADMIN';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Team Members</h3>
          {canManageAdmins() && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus-visible:ring-ring"
            >
              Invite Admin
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-6 bg-muted/50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-foreground mb-3">Invite New Admin</h4>
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary px-3 py-2 border bg-background"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'ADMIN' | 'OWNER' })}
                  className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary px-3 py-2 border bg-background"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin List */}
        <div className="space-y-4">
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members found.</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground">
                      {admin.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{admin.user.name}</h4>
                    <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.role === 'OWNER' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-info/20 text-info'
                    }`}>
                      {admin.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(admin.addedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {canManageAdmins() && admin.userId !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id)}
                      disabled={removeMutation.isPending}
                      className="text-destructive hover:text-destructive/80 text-sm font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Permissions Info */}
        <div className="mt-6 bg-primary/5 p-4 rounded-lg border border-primary/10">
          <h4 className="text-sm font-medium text-foreground mb-2">Admin Roles & Permissions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Owner:</strong> Full access to organization settings, events, and team management</p>
            <p><strong>Admin:</strong> Can manage events and view analytics, but cannot modify organization settings or manage other admins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationAdminManagement;
