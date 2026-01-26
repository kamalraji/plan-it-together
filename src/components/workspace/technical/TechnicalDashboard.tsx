import { Workspace } from '@/types';
import { TechnicalStatsCards } from './TechnicalStatsCards';
import { TechnicalQuickActions } from './TechnicalQuickActions';
import { EquipmentInventory } from './EquipmentInventory';
import { SupportTicketQueue } from './SupportTicketQueue';
import { NetworkStatus } from './NetworkStatus';
import { VenueSetupChecklist } from './VenueSetupChecklist';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { LiveStreamDashboard } from '../livestream';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Video, Radio } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLiveStreams } from '@/hooks/useLiveStreaming';

interface TechnicalDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
}

export function TechnicalDashboard({
  workspace,
  orgSlug,
}: TechnicalDashboardProps) {
  const [showLiveStream, setShowLiveStream] = useState(false);
  const { data: streams = [] } = useLiveStreams(workspace.id);
  const activeStreams = streams.filter(s => s.stream_status === 'live');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <TechnicalStatsCards />

      {/* Quick Actions */}
      <TechnicalQuickActions />

      {/* Live Streaming Section */}
      {showLiveStream ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Video className="h-5 w-5 text-red-500" />
              Live Streaming
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowLiveStream(false)}>
              Hide
            </Button>
          </div>
          <LiveStreamDashboard workspaceId={workspace.id} eventId={workspace.eventId || ''} />
        </div>
      ) : (
        <Card 
          className="cursor-pointer hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
          onClick={() => setShowLiveStream(true)}
        >
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <Video className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-base">Live Streaming</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage YouTube live streams for your event
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeStreams.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
                  <Radio className="h-4 w-4 animate-pulse" />
                  {activeStreams.length} Live
                </span>
              )}
              <Button variant="outline" size="sm">
                Open Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid with Mini-Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Network Status & Support Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NetworkStatus workspaceId={workspace.id} />
            <SupportTicketQueue workspaceId={workspace.id} eventId={workspace.eventId} />
          </div>

          {/* Equipment & Setup Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EquipmentInventory workspaceId={workspace.id} eventId={workspace.eventId} />
            <VenueSetupChecklist workspaceId={workspace.id} eventId={workspace.eventId} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <WorkspaceHierarchyMiniMap
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
            orientation="vertical"
            showLabels={false}
          />
          <MilestoneTimeline workspaceId={workspace.id} />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
