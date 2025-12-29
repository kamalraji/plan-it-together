import { WorkspaceRole } from '@/types';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';

interface RolePermission {
  role: WorkspaceRole;
  label: string;
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
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: true },
    reports: { view: true, export: true },
    settings: { edit: true },
  },
  {
    role: WorkspaceRole.TEAM_LEAD,
    label: 'Team Lead',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: false },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.EVENT_COORDINATOR,
    label: 'Event Coordinator',
    tasks: { create: true, edit: true, delete: true, assign: true },
    communication: { post: true, broadcast: true },
    team: { invite: true, manage: false },
    reports: { view: true, export: true },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.VOLUNTEER_MANAGER,
    label: 'Volunteer Manager',
    tasks: { create: false, edit: true, delete: false, assign: true },
    communication: { post: true, broadcast: false },
    team: { invite: false, manage: false },
    reports: { view: true, export: false },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.TECHNICAL_SPECIALIST,
    label: 'Technical Specialist',
    tasks: { create: false, edit: true, delete: false, assign: false },
    communication: { post: true, broadcast: false },
    team: { invite: false, manage: false },
    reports: { view: true, export: false },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.MARKETING_LEAD,
    label: 'Marketing Lead',
    tasks: { create: false, edit: true, delete: false, assign: false },
    communication: { post: true, broadcast: false },
    team: { invite: false, manage: false },
    reports: { view: true, export: false },
    settings: { edit: false },
  },
  {
    role: WorkspaceRole.GENERAL_VOLUNTEER,
    label: 'General Volunteer',
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

interface WorkspaceRolePermissionsTableProps {
  highlightedRole?: WorkspaceRole;
}

export function WorkspaceRolePermissionsTable({ highlightedRole }: WorkspaceRolePermissionsTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-muted/40 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Workspace Role Permissions</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Capabilities for each workspace role across tasks, communication, team, and reports
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/20 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
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
            {ROLE_PERMISSIONS.map((permission) => (
              <tr
                key={permission.role}
                className={
                  highlightedRole === permission.role
                    ? 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                    : 'hover:bg-muted/20'
                }
              >
                <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    {permission.label}
                    {highlightedRole === permission.role && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        You
                      </span>
                    )}
                  </span>
                </td>
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
        <p>
          <strong>Note:</strong> Organizers and admins at the event level have full access regardless of workspace
          role.
        </p>
      </div>
    </div>
  );
}
