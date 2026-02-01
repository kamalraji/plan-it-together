import { useState } from 'react';
import { BroadcastMessageDTO, WorkspaceRole } from '../../../types';

interface BroadcastComposerProps {
  workspace: any;
  onSendBroadcast: (broadcastData: BroadcastMessageDTO & { isPriority?: boolean }) => void;
  isSending: boolean;
}

export function BroadcastComposer({ workspace, onSendBroadcast, isSending }: BroadcastComposerProps) {
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'ALL_MEMBERS' | 'ROLE_SPECIFIC'>('ALL_MEMBERS');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isPriority, setIsPriority] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const roleOptions = [
    { value: WorkspaceRole.OPERATIONS_MANAGER, label: 'Operations Managers' },
    { value: WorkspaceRole.GROWTH_MANAGER, label: 'Growth Managers' },
    { value: WorkspaceRole.CONTENT_MANAGER, label: 'Content Managers' },
    { value: WorkspaceRole.TECH_FINANCE_MANAGER, label: 'Tech & Finance Managers' },
    { value: WorkspaceRole.VOLUNTEERS_MANAGER, label: 'Volunteers Managers' },
    { value: WorkspaceRole.EVENT_LEAD, label: 'Event Leads' },
    { value: WorkspaceRole.EVENT_COORDINATOR, label: 'Event Coordinators' },
    { value: WorkspaceRole.MARKETING_LEAD, label: 'Marketing Leads' },
    { value: WorkspaceRole.VOLUNTEER_COORDINATOR, label: 'Volunteer Coordinators' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const broadcastData: BroadcastMessageDTO & { isPriority?: boolean } = {
      content: message.trim(),
      attachments: attachments.map(file => ({
        filename: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary URL for demo
      })),
      targetType,
      targetRoles: targetType === 'ROLE_SPECIFIC' ? selectedRoles : undefined,
      isPriority,
    };

    onSendBroadcast(broadcastData);
    
    // Reset form
    setMessage('');
    setTargetType('ALL_MEMBERS');
    setSelectedRoles([]);
    setIsPriority(false);
    setAttachments([]);
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getRecipientCount = () => {
    if (!workspace?.teamMembers) return 0;
    
    if (targetType === 'ALL_MEMBERS') {
      return workspace.teamMembers.length;
    } else {
      return workspace.teamMembers.filter((member: any) => 
        selectedRoles.includes(member.role)
      ).length;
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground mb-2">Broadcast Message</h3>
        <p className="text-muted-foreground">
          Send important announcements to all team members or specific role groups.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Send to
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="ALL_MEMBERS"
                checked={targetType === 'ALL_MEMBERS'}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input"
              />
              <span className="ml-2 text-sm text-foreground">
                All team members ({workspace?.teamMembers?.length || 0} members)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value="ROLE_SPECIFIC"
                checked={targetType === 'ROLE_SPECIFIC'}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input"
              />
              <span className="ml-2 text-sm text-foreground">
                Specific roles
              </span>
            </label>
          </div>
        </div>

        {/* Role Selection */}
        {targetType === 'ROLE_SPECIFIC' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Select roles ({getRecipientCount()} members)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((role) => {
                const memberCount = workspace?.teamMembers?.filter((member: any) => 
                  member.role === role.value
                ).length || 0;

                return (
                  <label
                    key={role.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoles.includes(role.value)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-input hover:border-input'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {role.label}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your broadcast message here..."
            rows={6}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus:border-transparent"
            required
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Attachments
            </label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority and File Upload */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* File Upload */}
            <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-sm flex items-center space-x-1">
              <span className="text-xs uppercase">Attachment</span>
              <span>Add attachment</span>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachments(prev => [...prev, ...files]);
                }}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </label>

            {/* Priority Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-input rounded"
              />
              <span className={`text-sm ${isPriority ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Priority broadcast (immediate notifications)
              </span>
            </label>
          </div>
        </div>

        {/* Recipient Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Ready to send to {getRecipientCount()} recipient{getRecipientCount() !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {targetType === 'ALL_MEMBERS' 
                  ? 'All team members will receive this message'
                  : `Members with roles: ${selectedRoles.join(', ')}`
                }
              </p>
            </div>
            {isPriority && (
              <div className="text-red-600 text-sm font-medium">
                🚨 Priority Message
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending || !message.trim() || (targetType === 'ROLE_SPECIFIC' && selectedRoles.length === 0)}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              isPriority
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300'
            } disabled:cursor-not-allowed`}
          >
            {isSending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                <span>Sending broadcast...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send Broadcast</span>
                {isPriority && <span>Priority</span>}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}