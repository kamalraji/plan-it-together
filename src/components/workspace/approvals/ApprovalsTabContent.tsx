import { useState } from 'react';
import { Workspace, WorkspaceRole, WorkspaceType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomingApprovalsSection } from './IncomingApprovalsSection';
import { OutgoingRequestsSection } from './OutgoingRequestsSection';
import { useWorkspaceApprovals } from '@/hooks/useWorkspaceApprovals';
import { useOutgoingRequests } from '@/hooks/useOutgoingRequests';
import { Inbox, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApprovalsTabContentProps {
  workspace: Workspace;
  userRole?: WorkspaceRole | null;
}

export function ApprovalsTabContent({ workspace, userRole }: ApprovalsTabContentProps) {
  const [mainTab, setMainTab] = useState<'incoming' | 'outgoing'>('incoming');

  const { totalPending } = useWorkspaceApprovals(workspace.id, workspace.workspaceType);
  const { pendingCount: outgoingPendingCount } = useOutgoingRequests(workspace.id);

  // Determine if outgoing is available (has parent workspace and is not ROOT or TEAM)
  const canMakeRequests = 
    !!workspace.parentWorkspaceId && 
    workspace.workspaceType !== WorkspaceType.ROOT &&
    workspace.workspaceType !== WorkspaceType.TEAM;

  return (
    <div className="space-y-6">
      {/* Main Section Tabs: Incoming / Outgoing */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            <span>Incoming</span>
            {totalPending > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {totalPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="outgoing" 
            className="flex items-center gap-2"
            disabled={!canMakeRequests}
          >
            <Send className="h-4 w-4" />
            <span>Outgoing</span>
            {outgoingPendingCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {outgoingPendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="incoming" className="m-0">
            <IncomingApprovalsSection workspace={workspace} userRole={userRole ?? undefined} />
          </TabsContent>

          <TabsContent value="outgoing" className="m-0">
            {canMakeRequests && workspace.parentWorkspaceId && (
              <OutgoingRequestsSection
                workspaceId={workspace.id}
                parentWorkspaceId={workspace.parentWorkspaceId}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
