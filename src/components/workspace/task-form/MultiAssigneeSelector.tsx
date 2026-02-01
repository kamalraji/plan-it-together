import { useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeamMember, WorkspaceRole } from '@/types';

export interface ChildWorkspaceMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceType: string | null;
  role: string;
  path: string[];
}

interface MultiAssigneeSelectorProps {
  teamMembers: TeamMember[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  maxDisplay?: number;
  enableCrossWorkspace?: boolean;
  childWorkspaceMembers?: ChildWorkspaceMember[];
  onCrossWorkspaceChange?: (members: { userId: string; targetWorkspaceId: string }[]) => void;
}

// Group roles by department for quick assign
const ROLE_GROUPS: Record<string, WorkspaceRole[]> = {
  'Operations': [
    WorkspaceRole.OPERATIONS_MANAGER,
    WorkspaceRole.EVENT_LEAD, WorkspaceRole.EVENT_COORDINATOR,
    WorkspaceRole.CATERING_LEAD, WorkspaceRole.CATERING_COORDINATOR,
    WorkspaceRole.LOGISTICS_LEAD, WorkspaceRole.LOGISTICS_COORDINATOR,
    WorkspaceRole.FACILITY_LEAD, WorkspaceRole.FACILITY_COORDINATOR,
  ],
  'Growth': [
    WorkspaceRole.GROWTH_MANAGER,
    WorkspaceRole.MARKETING_LEAD, WorkspaceRole.MARKETING_COORDINATOR,
    WorkspaceRole.COMMUNICATION_LEAD, WorkspaceRole.COMMUNICATION_COORDINATOR,
    WorkspaceRole.SPONSORSHIP_LEAD, WorkspaceRole.SPONSORSHIP_COORDINATOR,
  ],
  'Content': [
    WorkspaceRole.CONTENT_MANAGER,
    WorkspaceRole.CONTENT_LEAD, WorkspaceRole.CONTENT_COORDINATOR,
    WorkspaceRole.SPEAKER_LIAISON_LEAD, WorkspaceRole.SPEAKER_LIAISON_COORDINATOR,
    WorkspaceRole.MEDIA_LEAD, WorkspaceRole.MEDIA_COORDINATOR,
  ],
  'Tech & Finance': [
    WorkspaceRole.TECH_FINANCE_MANAGER,
    WorkspaceRole.FINANCE_LEAD, WorkspaceRole.FINANCE_COORDINATOR,
    WorkspaceRole.TECHNICAL_LEAD, WorkspaceRole.TECHNICAL_COORDINATOR,
    WorkspaceRole.REGISTRATION_LEAD, WorkspaceRole.REGISTRATION_COORDINATOR,
  ],
  'Volunteers': [
    WorkspaceRole.VOLUNTEERS_MANAGER,
    WorkspaceRole.VOLUNTEERS_LEAD, WorkspaceRole.VOLUNTEER_COORDINATOR,
  ],
};

export function MultiAssigneeSelector({
  teamMembers,
  selectedIds,
  onChange,
  disabled = false,
  maxDisplay = 3,
  enableCrossWorkspace: _enableCrossWorkspace = false,
  childWorkspaceMembers = [],
  onCrossWorkspaceChange,
}: MultiAssigneeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCrossWorkspace, setSelectedCrossWorkspace] = useState<{ userId: string; targetWorkspaceId: string }[]>([]);
  void _enableCrossWorkspace; // Mark as intentionally unused for now

  const filteredMembers = teamMembers.filter(member =>
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChildMembers = childWorkspaceMembers.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.workspaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group child members by workspace (for future expansion UI)
  void filteredChildMembers; // Mark as used to prevent unused warning

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const handleCrossWorkspaceToggle = (userId: string, workspaceId: string) => {
    const existing = selectedCrossWorkspace.find(
      s => s.userId === userId && s.targetWorkspaceId === workspaceId
    );
    
    let updated: { userId: string; targetWorkspaceId: string }[];
    if (existing) {
      updated = selectedCrossWorkspace.filter(
        s => !(s.userId === userId && s.targetWorkspaceId === workspaceId)
      );
    } else {
      updated = [...selectedCrossWorkspace, { userId, targetWorkspaceId: workspaceId }];
    }
    
    setSelectedCrossWorkspace(updated);
    onCrossWorkspaceChange?.(updated);
  };

  const handleSelectByRole = (roles: WorkspaceRole[]) => {
    const memberIdsWithRole = teamMembers
      .filter(m => roles.includes(m.role))
      .map(m => m.userId);
    
    const newSelected = [...new Set([...selectedIds, ...memberIdsWithRole])];
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
    setSelectedCrossWorkspace([]);
    onCrossWorkspaceChange?.([]);
  };

  const selectedMembers = teamMembers.filter(m => selectedIds.includes(m.userId));
  const displayedMembers = selectedMembers.slice(0, maxDisplay);
  const remainingCount = selectedMembers.length - maxDisplay;
  const totalSelected = selectedIds.length + selectedCrossWorkspace.length;

  return (
    <div className="space-y-2">
      {/* Selected members display */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {displayedMembers.map(member => (
            <Badge
              key={member.userId}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 gap-1 text-xs h-6"
            >
              <span className="truncate max-w-[80px]">{member.user.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(member.userId)}
                disabled={disabled}
                className="hover:bg-foreground/10 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="outline" className="text-xs h-6">
              +{remainingCount} more
            </Badge>
          )}
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Cross-workspace selected badges */}
      {selectedCrossWorkspace.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {selectedCrossWorkspace.slice(0, 2).map(({ userId, targetWorkspaceId }) => {
            const member = childWorkspaceMembers.find(
              m => m.userId === userId && m.workspaceId === targetWorkspaceId
            );
            if (!member) return null;
            return (
              <Badge
                key={`${userId}-${targetWorkspaceId}`}
                variant="outline"
                className="pl-2 pr-1 py-0.5 gap-1 text-xs h-6 border-dashed"
              >
                <span className="truncate max-w-[60px]">{member.fullName}</span>
                <span className="text-muted-foreground">@ {member.workspaceName}</span>
                <button
                  type="button"
                  onClick={() => handleCrossWorkspaceToggle(userId, targetWorkspaceId)}
                  disabled={disabled}
                  className="hover:bg-foreground/10 rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
          {selectedCrossWorkspace.length > 2 && (
            <Badge variant="outline" className="text-xs h-6 border-dashed">
              +{selectedCrossWorkspace.length - 2} cross-workspace
            </Badge>
          )}
        </div>
      )}

      {/* Toggle expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Users className="h-3 w-3" />
        {isExpanded ? 'Hide team members' : `Select assignees (${totalSelected} selected)`}
      </button>

      {/* Expanded member list */}
      {isExpanded && (
        <div className="border border-border rounded-lg bg-muted/20 p-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="h-7 pl-7 text-xs"
              disabled={disabled}
            />
          </div>

          {/* Quick assign by department */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(ROLE_GROUPS).map(([group, roles]) => {
              const hasMembers = teamMembers.some(m => roles.includes(m.role));
              if (!hasMembers) return null;
              
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleSelectByRole(roles)}
                  disabled={disabled}
                  className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  + {group}
                </button>
              );
            })}
          </div>

          {/* Member list */}
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {filteredMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No team members found
              </p>
            ) : (
              filteredMembers.map(member => {
                const isSelected = selectedIds.includes(member.userId);
                return (
                  <label
                    key={member.userId}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(member.userId)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{member.user.name}</span>
                      <span className="text-muted-foreground truncate block">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
