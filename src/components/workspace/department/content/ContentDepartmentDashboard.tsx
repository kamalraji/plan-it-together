import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceType, WorkspaceStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Users, LayoutGrid, FileText } from 'lucide-react';

import { BudgetTrackerConnected } from '../BudgetTrackerConnected';
import { TaskSummaryCards } from '../../TaskSummaryCards';
import { TeamMemberRoster } from '../../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../../WorkspaceHierarchyMiniMap';

import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';

import { ContentStatsConnected } from './ContentStatsConnected';
import { ContentCommitteeHub } from './ContentCommitteeHub';
import { ContentPipelineDragDrop } from './ContentPipelineDragDrop';
import { SpeakerScheduleConnected } from './SpeakerScheduleConnected';
import { JudgingOverviewConnected } from './JudgingOverviewConnected';
import { MediaAssetsConnected } from './MediaAssetsConnected';
import { CreateContentItemModal } from './CreateContentItemModal';
import { AssignJudgeModal } from './AssignJudgeModal';
import { EnterScoreModal } from './EnterScoreModal';
import { UploadMediaAssetModal } from './UploadMediaAssetModal';
import { RegisterSpeakerModal } from './RegisterSpeakerModal';

interface ContentDepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks?: () => void;
}

export function ContentDepartmentDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: ContentDepartmentDashboardProps) {
  const navigate = useNavigate();
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Modal states
  const [createContentOpen, setCreateContentOpen] = useState(false);
  const [assignJudgeOpen, setAssignJudgeOpen] = useState(false);
  const [enterScoreOpen, setEnterScoreOpen] = useState(false);
  const [uploadMediaOpen, setUploadMediaOpen] = useState(false);
  const [registerSpeakerOpen, setRegisterSpeakerOpen] = useState(false);

  // Fetch child committees for this department
  const { data: committees = [] } = useQuery({
    queryKey: ['content-department-committees', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'COMMITTEE')
        .order('name');

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentWorkspaceId: row.parent_workspace_id,
        workspaceType: row.workspace_type as WorkspaceType,
        departmentId: row.department_id || undefined,
      })) as unknown as Workspace[];
    },
    enabled: !!workspace.id,
  });

  const handleCommitteeClick = (committee: Workspace) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${workspace.eventId}?workspaceId=${committee.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Department Header Card */}
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-emerald-500/10 rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20">
                Content Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage content creation, judging, media production, and speaker coordination across all committees
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span>{committees.length} Committees</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{workspace.teamMembers?.length || 0} Members</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full">
                  {pendingRequests.length} pending requests
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - Connected to real data */}
      <ContentStatsConnected workspaceId={workspace.id} />

      {/* Task Summary */}
      <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

      {/* Mini-Map & Committee Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorkspaceHierarchyMiniMap
          workspaceId={workspace.id}
          eventId={workspace.eventId}
          orgSlug={orgSlug}
          orientation="horizontal"
          showLabels={false}
        />
        <div className="lg:col-span-2">
          <ContentCommitteeHub 
            committees={committees}
            onCommitteeClick={handleCommitteeClick}
          />
        </div>
      </div>

      {/* Content Pipeline with Drag & Drop */}
      <ContentPipelineDragDrop workspaceId={workspace.id} />

      {/* Judging Overview - Connected to real data */}
      <JudgingOverviewConnected 
        eventId={workspace.eventId} 
        onAssignJudge={() => setAssignJudgeOpen(true)}
        onEnterScore={() => setEnterScoreOpen(true)}
      />

      {/* Speaker & Media Row - Connected to real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpeakerScheduleConnected workspaceId={workspace.id} />
        <MediaAssetsConnected workspaceId={workspace.id} />
      </div>

      {/* Budget Section */}
      <BudgetTrackerConnected 
        workspaceId={workspace.id}
        showBreakdown={true}
      />

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />

      {/* Modals */}
      <CreateContentItemModal
        open={createContentOpen}
        onOpenChange={setCreateContentOpen}
        workspaceId={workspace.id}
      />
      <AssignJudgeModal
        open={assignJudgeOpen}
        onOpenChange={setAssignJudgeOpen}
        eventId={workspace.eventId}
      />
      <EnterScoreModal
        open={enterScoreOpen}
        onOpenChange={setEnterScoreOpen}
        eventId={workspace.eventId}
      />
      <UploadMediaAssetModal
        open={uploadMediaOpen}
        onOpenChange={setUploadMediaOpen}
        workspaceId={workspace.id}
      />
      <RegisterSpeakerModal
        open={registerSpeakerOpen}
        onOpenChange={setRegisterSpeakerOpen}
        workspaceId={workspace.id}
      />
    </div>
  );
}
