import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { usePageBuildingResponsibilities, useRevokePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { useWorkspacePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { AssignPageBuilderDialog } from '../AssignPageBuilderDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Paintbrush, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Clock, 
  Eye,
  Edit3,
  Users,
  Loader2,
  FileEdit,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface LandingPageSettingsPanelProps {
  eventId: string;
  workspaceId: string;
  isRootOwner: boolean;
}

export const LandingPageSettingsPanel: React.FC<LandingPageSettingsPanelProps> = ({
  eventId,
  workspaceId,
  isRootOwner,
}) => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: responsibilities, isLoading: loadingResponsibilities } = usePageBuildingResponsibilities(eventId);
  const { data: myResponsibility, isLoading: loadingMyResponsibility } = useWorkspacePageResponsibility(workspaceId);
  const { mutate: revokeResponsibility, isPending: isRevoking } = useRevokePageResponsibility();

  // Fetch aggregate stats from page_builder_sections
  const { data: pageStats } = useQuery({
    queryKey: ['page-builder-stats', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_builder_sections')
        .select('id, updated_at, locked_by_user_id')
        .eq('event_id', eventId);

      if (error) throw error;

      const totalEdits = data?.length || 0;
      const lastEdited = data?.sort((a: { updated_at: string | null }, b: { updated_at: string | null }) => 
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      )[0]?.updated_at;

      return {
        totalSections: totalEdits,
        lastEdited: lastEdited ? new Date(lastEdited) : null,
      };
    },
    enabled: !!eventId,
  });

  // Fetch page views from event_page_views
  const { data: pageViews } = useQuery({
    queryKey: ['page-views-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_page_views')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });

  const handleOpenPageBuilder = () => {
    if (!eventId || !orgSlug) return;
    // Find event slug for navigation
    navigate(`/${orgSlug}/eventmanagement/${eventId}/pagebuilder`);
  };

  const handleRevokeAssignment = (responsibilityId: string, workspaceName: string) => {
    if (confirm(`Remove page building responsibility from ${workspaceName}?`)) {
      revokeResponsibility(responsibilityId, {
        onSuccess: () => {
          toast.success(`Responsibility removed from ${workspaceName}`);
        },
      });
    }
  };

  const getPageTypeLabel = (type: string | null) => {
    if (!type) return 'Page';
    switch (type) {
      case 'LANDING_PAGE': return 'Landing Page';
      case 'REGISTRATION_PAGE': return 'Registration';
      case 'SCHEDULE_PAGE': return 'Schedule';
      case 'SPEAKERS_PAGE': return 'Speakers';
      default: return type.replace(/_/g, ' ');
    }
  };

  if (loadingResponsibilities || loadingMyResponsibility) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ROOT OWNER VIEW - Full assignment management
  if (isRootOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            Landing Page Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assign page building responsibilities to committees and manage your event's landing page.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pageViews?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <FileEdit className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pageStats?.totalSections || 0}</p>
                  <p className="text-sm text-muted-foreground">Sections Edited</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {pageStats?.lastEdited 
                      ? formatDistanceToNow(pageStats.lastEdited, { addSuffix: true })
                      : 'Never'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleOpenPageBuilder} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Page Builder
          </Button>
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Assign Responsibility
          </Button>
        </div>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Assignments
            </CardTitle>
            <CardDescription>
              Workspaces with page building responsibilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {responsibilities && responsibilities.length > 0 ? (
              <div className="space-y-3">
                {responsibilities.map((resp) => (
                  <div 
                    key={resp.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Paintbrush className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{resp.workspaceName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {getPageTypeLabel(resp.responsibilityType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Assigned {formatDistanceToNow(new Date(resp.assignedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeAssignment(resp.id, resp.workspaceName)}
                      disabled={isRevoking}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Paintbrush className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No page building responsibilities assigned</p>
                <p className="text-xs mt-1">Assign a committee to manage your landing page</p>
              </div>
            )}
          </CardContent>
        </Card>

        <AssignPageBuilderDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          eventId={eventId}
          rootWorkspaceId={workspaceId}
        />
      </div>
    );
  }

  // ASSIGNED WORKSPACE VIEW - Status and edit access
  if (myResponsibility?.hasResponsibility) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            Landing Page
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your workspace is assigned to manage the event landing page.
          </p>
        </div>

        {/* Assignment Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Edit3 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Page Builder Access</p>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Assigned
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getPageTypeLabel(myResponsibility.responsibilityType)}
                  </p>
                </div>
              </div>
              <Button onClick={handleOpenPageBuilder} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Edit Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pageViews?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Page Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {pageStats?.lastEdited 
                      ? formatDistanceToNow(pageStats.lastEdited, { addSuffix: true })
                      : 'No edits yet'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // NO ACCESS VIEW
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Paintbrush className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Landing Page Access</h3>
          <p className="text-muted-foreground">
            This workspace hasn't been assigned landing page responsibilities.
            Contact the event organizer to request access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
