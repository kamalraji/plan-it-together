import { WorkspaceRole } from '@/types';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useWorkspaceRBAC } from '@/hooks/useWorkspaceRBAC';
import { WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { Badge } from '@/components/ui/badge';

interface RolePermission {
  role: WorkspaceRole;
  label: string;
  level: WorkspaceHierarchyLevel;
  canManage: string;
  tasks: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
  };
  communication: {
    post: boolean;
    broadcast: boolean;
  };
  team: {
    invite: boolean;
    manage: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  settings: {
    edit: boolean;
  };
}

const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: WorkspaceRole.WORKSPACE_OWNER,
    label: 'Workspace Owner',
    level: WorkspaceHierarchyLevel.OWNER,
    canManage: 'Managers, Leads, Coordinators',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: true },
    reports: { view: true, export: true },
    settings: { edit: true },
  },
  {
    role: WorkspaceRole.OPERATIONS_MANAGER,
    label: 'Operations Manager',
    level: WorkspaceHierarchyLevel.MANAGER,
    canManage: 'Leads, Coordinators',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: true },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.GROWTH_MANAGER,
    label: 'Growth Manager',
    level: WorkspaceHierarchyLevel.MANAGER,
    canManage: 'Leads, Coordinators',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: true },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.EVENT_LEAD,
    label: 'Event Lead',
    level: WorkspaceHierarchyLevel.LEAD,
    canManage: 'Coordinators only',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: false },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.EVENT_COORDINATOR,
    label: 'Event Coordinator',
    level: WorkspaceHierarchyLevel.COORDINATOR,
    canManage: 'None',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: false },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.MARKETING_LEAD,
    label: 'Marketing Lead',
    level: WorkspaceHierarchyLevel.LEAD,
    canManage: 'Coordinators only',
    tasks: { create: false, edit: true, delete: false, assign: false },
    communication: { post: true, broadcast: false },
    team: { invite: false, manage: false },
    reports: { view: true, export: false },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.VOLUNTEER_COORDINATOR,
    label: 'Volunteer Coordinator',
    level: WorkspaceHierarchyLevel.COORDINATOR,
    canManage: 'None',
    tasks: { create: false, edit: false, delete: false, assign: false },
    communication: { post: true, broadcast: false },
    team: { invite: false, manage: false },
    reports: { view: true, export: false },
    settings: { edit: false },
  },
];

const PermissionIcon: React.FC<{ allowed: boolean }> = ({ allowed }) => {
  return allowed ? (
    <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" aria-label="Allowed" />
  ) : (
    <XMarkIcon className="h-5 w-5 text-muted-foreground/40" aria-label="Not allowed" />
  );
};

const LevelBadge: React.FC<{ level: WorkspaceHierarchyLevel }> = ({ level }) => {
  const getColorClass = () => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case WorkspaceHierarchyLevel.LEAD:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge variant="outline" className={`text-[10px] ${getColorClass()}`}>
      L{level}
    </Badge>
  );
};

interface WorkspaceRolePermissionsTableProps {
  highlightedRole?: WorkspaceRole;
  currentUserRole?: WorkspaceRole | null;
  showManagementColumn?: boolean;
}

export function WorkspaceRolePermissionsTable({ 
  highlightedRole,
  currentUserRole,
  showManagementColumn = true,
}: WorkspaceRolePermissionsTableProps) {
  const rbac = useWorkspaceRBAC(currentUserRole ?? null);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-muted/40 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Workspace Role Permissions</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Capabilities and management scope for each workspace role
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/20 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              {showManagementColumn && (
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Can Manage
                </th>
              )}
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Create Tasks
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Delete Tasks
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Post Messages
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Broadcast
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Export Reports
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Manage Team
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Edit Settings
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {ROLE_PERMISSIONS.map((permission) => {
              const isHighlighted = highlightedRole === permission.role;
              const canUserManageThisRole = currentUserRole 
                ? rbac.canManage(permission.role) 
                : false;

              return (
                <tr
                  key={permission.role}
                  className={
                    isHighlighted
                      ? 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                      : 'hover:bg-muted/20'
                  }
                >
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={permission.level} />
                      <span>{permission.label}</span>
                      {isHighlighted && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          You
                        </span>
                      )}
                      {currentUserRole && canUserManageThisRole && !isHighlighted && (
                        <span className="inline-flex items-center rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-500/20">
                          Can manage
                        </span>
                      )}
                    </div>
                  </td>
                  {showManagementColumn && (
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {permission.canManage}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.tasks.create} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.tasks.delete} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.communication.post} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.communication.broadcast} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.reports.export} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.team.manage} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <PermissionIcon allowed={permission.settings.edit} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Hierarchy Rule:</strong> Managers can only manage Leads, Leads can only manage Coordinators.
        </p>
        <p>
          <strong>Note:</strong> Organizers and admins at the event level have full access regardless of workspace role.
        </p>
      </div>
    </div>
  );
}