import React, { useState, useEffect } from 'react';
import { User, OrganizationAdmin, Organization } from '../../types';
import api from '../../lib/api';

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
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState<InviteAdminForm>({
    email: '',
    role: 'ADMIN'
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, [organization.id]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizations/${organization.id}/admins`);
      setAdmins(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;

    try {
      setInviting(true);
      setError(null);
      
      await api.post(`/organizations/${organization.id}/admins/invite`, {
        email: inviteForm.email,
        role: inviteForm.role
      });

      setInviteForm({ email: '', role: 'ADMIN' });
      setShowInviteForm(false);
      await fetchAdmins();
      onUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite admin');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      setError(null);
      await api.delete(`/organizations/${organization.id}/admins/${adminId}`);
      await fetchAdmins();
      onUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove admin');
    }
  };

  const canManageAdmins = () => {
    const currentUserAdmin = admins.find(admin => admin.userId === currentUser.id);
    return currentUserAdmin?.role === 'OWNER' || currentUser.role === 'SUPER_ADMIN';
  };

  if (loading) {
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring"
            >
              Invite Admin
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                  className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
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
                  className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
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
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
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
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Roles & Permissions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Owner:</strong> Full access to organization settings, events, and team management</p>
            <p><strong>Admin:</strong> Can manage events and view analytics, but cannot modify organization settings or manage other admins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationAdminManagement;