import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface ViewCommitteesTabProps {
  workspace: Workspace;
}

export function ViewCommitteesTab({ workspace }: ViewCommitteesTabProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch child committees
  const { data: committees, isLoading } = useQuery({
    queryKey: ['child-committees', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, created_at')
        .eq('parent_workspace_id', workspace.id)
        .in('workspace_type', ['COMMITTEE', 'TEAM'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch member counts
  const { data: memberCounts } = useQuery({
    queryKey: ['committee-member-counts', committees?.map(c => c.id)],
    queryFn: async () => {
      if (!committees || committees.length === 0) return {};
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('workspace_id')
        .in('workspace_id', committees.map(c => c.id))
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(member => {
        counts[member.workspace_id] = (counts[member.workspace_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!committees && committees.length > 0,
  });

  const totalMembers = Object.values(memberCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-rose-500" />
          View Committees
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage and monitor all volunteer committees
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{committees?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Committees</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
            <div className="text-xs text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {committees?.length ? Math.round(totalMembers / committees.length) : 0}
            </div>
            <div className="text-xs text-muted-foreground">Avg Team Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Committees List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Committees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            </div>
          ) : !committees || committees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No committees found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {committees.map(committee => (
                <div
                  key={committee.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    // Navigate to committee
                    const basePath = location.pathname;
                    const searchParams = new URLSearchParams(location.search);
                    searchParams.set('workspaceId', committee.id);
                    navigate(`${basePath}/committee/${committee.slug}?${searchParams.toString()}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10">
                      <Building2 className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{committee.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {memberCounts?.[committee.id] || 0} members
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {committee.workspace_type?.toLowerCase()}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
