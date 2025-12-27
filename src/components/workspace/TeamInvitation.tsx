import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  PaperAirplaneIcon, 
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Workspace, WorkspaceRole } from '../../types';
import api from '../../lib/api';

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

export function TeamInvitation({ workspace, mode, pendingInvitations, onInvitationSent }: TeamInvitationProps) {
  const [singleInvitation, setSingleInvitation] = useState<InvitationData>({
    email: '',
    role: WorkspaceRole.GENERAL_VOLUNTEER,
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
      const response = await api.post(`/workspaces/${workspace.id}/invitations`, data);
      return response.data;
    },
    onSuccess: () => {
      setSingleInvitation({ email: '', role: WorkspaceRole.GENERAL_VOLUNTEER, customMessage: '' });
      onInvitationSent();
    },
  });

  // Bulk invitation mutation
  const bulkInviteMutation = useMutation({
    mutationFn: async (data: BulkInvitationData) => {
      const response = await api.post(`/workspaces/${workspace.id}/invitations/bulk`, data);
      return response.data;
    },
    onSuccess: () => {
      setBulkInvitations([]);
      setBulkMessage('');
      setCsvFile(null);
      setShowPreview(false);
      onInvitationSent();
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.post(`/workspaces/${workspace.id}/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      onInvitationSent();
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/workspaces/${workspace.id}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      onInvitationSent();
    },
  });

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleInvitation.email.trim()) return;
    
    await singleInviteMutation.mutateAsync(singleInvitation);
  };

  const handleBulkInvite = async () => {
    if (bulkInvitations.length === 0) return;
    
    await bulkInviteMutation.mutateAsync({
      invitations: bulkInvitations,
      customMessage: bulkMessage
    });
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

      // Skip header row if it exists
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [email, roleStr] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        
        if (!email || !email.includes('@')) {
          newErrors.push(`Line ${i + 1}: Invalid email address`);
          continue;
        }

        let role = WorkspaceRole.GENERAL_VOLUNTEER;
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

  const addManualInvitation = () => {
    setBulkInvitations([...bulkInvitations, { email: '', role: WorkspaceRole.GENERAL_VOLUNTEER }]);
  };

  const updateBulkInvitation = (index: number, field: keyof InvitationData, value: string) => {
    const updated = [...bulkInvitations];
    updated[index] = { ...updated[index], [field]: value };
    setBulkInvitations(updated);
  };

  const removeBulkInvitation = (index: number) => {
    setBulkInvitations(bulkInvitations.filter((_, i) => i !== index));
  };

  const roleOptions = [
    { value: WorkspaceRole.TEAM_LEAD, label: 'Team Lead' },
    { value: WorkspaceRole.EVENT_COORDINATOR, label: 'Event Coordinator' },
    { value: WorkspaceRole.VOLUNTEER_MANAGER, label: 'Volunteer Manager' },
    { value: WorkspaceRole.TECHNICAL_SPECIALIST, label: 'Technical Specialist' },
    { value: WorkspaceRole.MARKETING_LEAD, label: 'Marketing Lead' },
    { value: WorkspaceRole.GENERAL_VOLUNTEER, label: 'General Volunteer' },
  ];

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Accepted
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {mode === 'single' ? (
        /* Single Invitation Form */
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
          
          <form onSubmit={handleSingleInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={singleInvitation.email}
                onChange={(e) => setSingleInvitation({ ...singleInvitation, email: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={singleInvitation.role}
                onChange={(e) => setSingleInvitation({ ...singleInvitation, role: e.target.value as WorkspaceRole })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Custom Message (Optional)
              </label>
              <textarea
                id="message"
                rows={3}
                value={singleInvitation.customMessage}
                onChange={(e) => setSingleInvitation({ ...singleInvitation, customMessage: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a personal message to the invitation..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={singleInviteMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {singleInviteMutation.isPending ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                )}
                Send Invitation
              </button>
            </div>
          </form>

          {singleInviteMutation.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {(singleInviteMutation.error as any)?.response?.data?.message || 'Failed to send invitation'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Bulk Invitation Interface */
        <div className="space-y-6">
          {/* CSV Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Invite via CSV</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                    Choose File
                  </button>
                  {csvFile && (
                    <span className="text-sm text-gray-600">{csvFile.name}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  CSV format: email,role (one per line). Role is optional and defaults to General Volunteer.
                </p>
              </div>

              <div>
                <button
                  onClick={addManualInvitation}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Add Manual Entry
                </button>
              </div>
            </div>
          </div>

          {/* Manual Entries */}
          {bulkInvitations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Invitation Preview ({bulkInvitations.length} members)
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Errors found:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showPreview && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {bulkInvitations.map((invitation, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={invitation.email}
                          onChange={(e) => updateBulkInvitation(index, 'email', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Email address"
                        />
                      </div>
                      <div className="w-48">
                        <select
                          value={invitation.role}
                          onChange={(e) => updateBulkInvitation(index, 'role', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          {roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeBulkInvitation(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="bulk-message" className="block text-sm font-medium text-gray-700">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    id="bulk-message"
                    rows={3}
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add a message that will be included in all invitations..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setBulkInvitations([]);
                      setCsvFile(null);
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleBulkInvite}
                    disabled={bulkInviteMutation.isPending || bulkInvitations.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {bulkInviteMutation.isPending ? (
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    )}
                    Send {bulkInvitations.length} Invitations
                  </button>
                </div>
              </div>

              {bulkInviteMutation.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    {(bulkInviteMutation.error as any)?.response?.data?.message || 'Failed to send bulk invitations'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{invitation.email}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {roleOptions.find(r => r.value === invitation.role)?.label}
                    </span>
                    {getInvitationStatusBadge(invitation.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Invited by {invitation.invitedBy.name} on {new Date(invitation.invitedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => resendInvitationMutation.mutate(invitation.id)}
                    disabled={resendInvitationMutation.isPending}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowPathIcon className="w-3 h-3 mr-1" />
                    Resend
                  </button>
                  <button
                    onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                    disabled={cancelInvitationMutation.isPending}
                    className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                  >
                    <XMarkIcon className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}