import { useState, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  PaperAirplaneIcon, 
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { Workspace, WorkspaceRole } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceRoleSelect, getDefaultRoleForWorkspace } from './WorkspaceRoleSelect';
import { getContextualRolesForWorkspace } from '@/lib/workspaceRoleContext';
import { getWorkspaceRoleLabel } from '@/lib/workspaceHierarchy';


interface TeamInvitationProps {
  workspace: Workspace;
  mode: 'single' | 'bulk';
  pendingInvitations: Array<{
    id: string;
    email: string;
    role: WorkspaceRole;
    status: string;
    invitedAt: string;
    invitedBy: { name: string };
  }>;
  onInvitationSent: () => void;
  currentUserRole?: WorkspaceRole | null;
}

interface InvitationData {
  email: string;
  role: WorkspaceRole;
  customMessage?: string;
}

interface BulkInvitationData {
  invitations: InvitationData[];
  customMessage?: string;
}

export function TeamInvitation({ workspace, mode, pendingInvitations, onInvitationSent, currentUserRole }: TeamInvitationProps) {
  // Get contextual roles based on workspace
  const contextualRoles = useMemo(() => {
    return getContextualRolesForWorkspace(
      {
        workspaceType: workspace.workspaceType,
        workspaceName: workspace.name,
        departmentId: workspace.departmentId,
      },
      currentUserRole
    );
  }, [workspace.workspaceType, workspace.name, workspace.departmentId, currentUserRole]);
  
  // Get the default role based on workspace context
  const getDefaultRole = (): WorkspaceRole => {
    return getDefaultRoleForWorkspace({
      workspaceType: workspace.workspaceType,
      workspaceName: workspace.name,
      departmentId: workspace.departmentId,
    });
  };

  const [singleInvitation, setSingleInvitation] = useState<InvitationData>({
    email: '',
    role: getDefaultRole(),
    customMessage: ''
  });
  
  const [bulkInvitations, setBulkInvitations] = useState<InvitationData[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single invitation mutation
  const singleInviteMutation = useMutation({
    mutationFn: async (data: InvitationData) => {
      const { data: response, error } = await supabase.functions.invoke('invite-to-workspace', {
        body: {
          workspace_id: workspace.id,
          email: data.email,
          role: data.role,
          custom_message: data.customMessage,
        },
      });
      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      setSingleInvitation({ email: '', role: getDefaultRole(), customMessage: '' });
      onInvitationSent();
    },
  });

  // Bulk invitation mutation
  const bulkInviteMutation = useMutation({
    mutationFn: async (data: BulkInvitationData) => {
      const results = await Promise.allSettled(
        data.invitations.map(inv =>
          supabase.functions.invoke('invite-to-workspace', {
            body: { workspace_id: workspace.id, email: inv.email, role: inv.role, custom_message: data.customMessage },
          })
        )
      );
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) throw new Error(`${failures.length} invitations failed`);
      return results;
    },
    onSuccess: () => {
      setBulkInvitations([]);
      setBulkMessage('');
      setCsvFile(null);
      setShowPreview(false);
      onInvitationSent();
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const invitation = pendingInvitations.find(i => i.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');
      return { success: true };
    },
    onSuccess: () => onInvitationSent(),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.from('workspace_invitations').update({ status: 'CANCELLED' }).eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => onInvitationSent(),
  });

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleInvitation.email.trim()) return;
    await singleInviteMutation.mutateAsync(singleInvitation);
  };

  const handleBulkInvite = async () => {
    if (bulkInvitations.length === 0) return;
    await bulkInviteMutation.mutateAsync({ invitations: bulkInvitations, customMessage: bulkMessage });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      const invitations: InvitationData[] = [];
      const newErrors: string[] = [];
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [email, roleStr] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (!email || !email.includes('@')) {
          newErrors.push(`Line ${i + 1}: Invalid email address`);
          continue;
        }
        let role = getDefaultRole();
        if (roleStr && Object.values(WorkspaceRole).includes(roleStr as WorkspaceRole)) {
          role = roleStr as WorkspaceRole;
        }
        invitations.push({ email, role });
      }
      setBulkInvitations(invitations);
      setErrors(newErrors);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const addManualInvitation = () => setBulkInvitations([...bulkInvitations, { email: '', role: getDefaultRole() }]);
  const updateBulkInvitation = (index: number, field: keyof InvitationData, value: string | WorkspaceRole) => {
    const updated = [...bulkInvitations];
    updated[index] = { ...updated[index], [field]: value };
    setBulkInvitations(updated);
  };
  const removeBulkInvitation = (index: number) => setBulkInvitations(bulkInvitations.filter((_, i) => i !== index));

  const canInviteAnyone = contextualRoles.length > 0;

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-yellow-800"><ClockIcon className="w-3 h-3 mr-1" />Pending</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success"><CheckCircleIcon className="w-3 h-3 mr-1" />Accepted</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-red-800"><ExclamationTriangleIcon className="w-3 h-3 mr-1" />Expired</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!canInviteAnyone && currentUserRole && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldExclamationIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Limited Invitation Permissions</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Your role doesn't allow you to invite team members.</p>
            </div>
          </div>
        </div>
      )}

      {mode === 'single' ? (
        <div className="bg-card shadow rounded-lg p-6">
          {canInviteAnyone ? (
            <>
              <h3 className="text-lg font-medium text-foreground mb-4">Invite Team Member</h3>
              <form onSubmit={handleSingleInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email Address</label>
                  <input type="email" id="email" value={singleInvitation.email} onChange={(e) => setSingleInvitation({ ...singleInvitation, email: e.target.value })} className="mt-1 block w-full border-border bg-background text-foreground rounded-md shadow-sm focus:ring-primary focus:border-primary" placeholder="Enter email address" required />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-muted-foreground">Role</label>
                  <WorkspaceRoleSelect workspace={workspace} value={singleInvitation.role} onChange={(role) => setSingleInvitation({ ...singleInvitation, role })} currentUserRole={currentUserRole} className="mt-1" />
                  <p className="mt-1 text-xs text-muted-foreground">Showing roles you can assign based on your hierarchy level</p>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-muted-foreground">Custom Message (Optional)</label>
                  <textarea id="message" rows={3} value={singleInvitation.customMessage} onChange={(e) => setSingleInvitation({ ...singleInvitation, customMessage: e.target.value })} className="mt-1 block w-full border-border bg-background text-foreground rounded-md shadow-sm focus:ring-primary focus:border-primary" placeholder="Add a personal message..." />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={singleInviteMutation.isPending} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50">
                    {singleInviteMutation.isPending ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <PaperAirplaneIcon className="w-4 h-4 mr-2" />}
                    Send Invitation
                  </button>
                </div>
              </form>
              {singleInviteMutation.error && <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md"><p className="text-sm text-destructive">Failed to send invitation</p></div>}
            </>
          ) : (
            <div className="text-center py-8">
              <ShieldExclamationIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Invitation Permission</h3>
              <p className="text-sm text-muted-foreground">Your current role doesn't allow you to invite team members.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Bulk Invite via CSV</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Upload CSV File</label>
                <div className="flex items-center space-x-4">
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50">
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />Choose File
                  </button>
                  {csvFile && <span className="text-sm text-muted-foreground">{csvFile.name}</span>}
                </div>
              </div>
              <button onClick={addManualInvitation} className="inline-flex items-center px-3 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50">Add Manual Entry</button>
            </div>
          </div>

          {bulkInvitations.length > 0 && (
            <div className="bg-card shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Invitation Preview ({bulkInvitations.length} members)</h3>
                <button onClick={() => setShowPreview(!showPreview)} className="inline-flex items-center px-3 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50">
                  <EyeIcon className="w-4 h-4 mr-2" />{showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              {errors.length > 0 && <div className="mb-4 p-4 bg-destructive/10 border border-red-200 rounded-md"><h4 className="text-sm font-medium text-red-800 mb-2">Errors found:</h4><ul className="text-sm text-destructive space-y-1">{errors.map((error, index) => <li key={index}>• {error}</li>)}</ul></div>}
              {showPreview && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {bulkInvitations.map((invitation, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                      <div className="flex-1">
                        <input type="email" value={invitation.email} onChange={(e) => updateBulkInvitation(index, 'email', e.target.value)} className="block w-full border-input rounded-md shadow-sm text-sm" placeholder="Email address" />
                      </div>
                      <div className="w-56">
                        <WorkspaceRoleSelect workspace={workspace} value={invitation.role} onChange={(role) => updateBulkInvitation(index, 'role', role)} currentUserRole={currentUserRole} />
                      </div>
                      <button onClick={() => removeBulkInvitation(index)} className="p-1 text-red-600 hover:text-red-800"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="bulk-message" className="block text-sm font-medium text-foreground">Custom Message (Optional)</label>
                  <textarea id="bulk-message" rows={3} value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} className="mt-1 block w-full border-input rounded-md shadow-sm" placeholder="Add a message..." />
                </div>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => { setBulkInvitations([]); setCsvFile(null); setShowPreview(false); }} className="px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50">Clear All</button>
                  <button onClick={handleBulkInvite} disabled={bulkInviteMutation.isPending || bulkInvitations.length === 0} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50">
                    {bulkInviteMutation.isPending ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <PaperAirplaneIcon className="w-4 h-4 mr-2" />}
                    Send {bulkInvitations.length} Invitations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Pending Invitations ({pendingInvitations.length})</h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-foreground">{invitation.email}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/20 text-blue-800">{getWorkspaceRoleLabel(invitation.role)}</span>
                    {getInvitationStatusBadge(invitation.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Invited by {invitation.invitedBy.name} on {new Date(invitation.invitedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => resendInviteMutation.mutate(invitation.id)} disabled={resendInviteMutation.isPending} className="inline-flex items-center px-3 py-1 border border-input text-xs font-medium rounded text-foreground bg-card hover:bg-muted/50"><ArrowPathIcon className="w-3 h-3 mr-1" />Resend</button>
                  <button onClick={() => cancelInviteMutation.mutate(invitation.id)} disabled={cancelInviteMutation.isPending} className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-card hover:bg-red-50"><XMarkIcon className="w-3 h-3 mr-1" />Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
