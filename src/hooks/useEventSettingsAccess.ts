import { useMemo } from 'react';
import { Workspace, WorkspaceType, WorkspaceRole } from '@/types';

export type EventSettingsCategory = 
  | 'ticketing'
  | 'promo_codes'
  | 'seo'
  | 'accessibility';

export type CommitteeType = 
  | 'registration'
  | 'finance'
  | 'marketing'
  | 'logistics'
  | 'event'
  | 'unknown';

/**
 * Detects the committee type based on workspace name
 */
export function detectCommitteeType(workspaceName: string): CommitteeType {
  const name = workspaceName.toLowerCase();
  
  if (name.includes('registration')) return 'registration';
  if (name.includes('finance')) return 'finance';
  if (name.includes('marketing')) return 'marketing';
  if (name.includes('logistics')) return 'logistics';
  if (name.includes('event') && !name.includes('settings')) return 'event';
  
  return 'unknown';
}

/**
 * Determines which event settings a workspace can access based on its type and the user's role
 */
export interface EventSettingsAccess {
  /** Can access all ticketing/registration settings */
  canAccessTicketing: boolean;
  /** Can access promo code management */
  canAccessPromoCodes: boolean;
  /** Can access SEO settings */
  canAccessSEO: boolean;
  /** Can access accessibility settings */
  canAccessAccessibility: boolean;
  /** Can access ALL event settings (Root workspace owners only) */
  canAccessAllSettings: boolean;
  /** Should show the Event Settings tab in navigation */
  showEventSettingsTab: boolean;
  /** Detected committee type */
  committeeType: CommitteeType;
}

export function useEventSettingsAccess(
  workspace: Workspace | undefined,
  userRole: WorkspaceRole | null | undefined
): EventSettingsAccess {
  return useMemo(() => {
    const defaultAccess: EventSettingsAccess = {
      canAccessTicketing: false,
      canAccessPromoCodes: false,
      canAccessSEO: false,
      canAccessAccessibility: false,
      canAccessAllSettings: false,
      showEventSettingsTab: false,
      committeeType: 'unknown',
    };

    if (!workspace) return defaultAccess;

    const committeeType = detectCommitteeType(workspace.name);
    const isRootWorkspace = workspace.workspaceType === WorkspaceType.ROOT;
    const isCommittee = workspace.workspaceType === WorkspaceType.COMMITTEE;
    
    // Root workspace owner gets full access to all settings
    const isRootOwner = isRootWorkspace && userRole === WorkspaceRole.WORKSPACE_OWNER;
    
    // Root workspace members can also access if there are no committees created yet (fallback)
    const isRootMember = isRootWorkspace && !!userRole;

    // Determine access based on workspace type and committee type
    const canAccessTicketing = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'registration');
    
    const canAccessPromoCodes = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'finance');
    
    const canAccessSEO = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'marketing');
    
    const canAccessAccessibility = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && (committeeType === 'logistics' || committeeType === 'event'));

    const canAccessAllSettings = isRootOwner || isRootMember;

    // Show the tab for Root workspaces or committees with relevant functions
    const showEventSettingsTab = 
      isRootWorkspace || 
      (isCommittee && ['registration', 'finance', 'marketing', 'logistics', 'event'].includes(committeeType));

    return {
      canAccessTicketing,
      canAccessPromoCodes,
      canAccessSEO,
      canAccessAccessibility,
      canAccessAllSettings,
      showEventSettingsTab,
      committeeType,
    };
  }, [workspace, userRole]);
}
