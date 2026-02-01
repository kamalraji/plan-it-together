import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, ChevronRight } from 'lucide-react';

interface VolunteersDeptCommitteePanelProps {
  workspaceId: string;
  eventId: string;
  orgSlug?: string;
}

export function VolunteersDeptCommitteePanel({ workspaceId, eventId, orgSlug }: VolunteersDeptCommitteePanelProps) {
  const navigate = useNavigate();

  // Fetch child committees
  const { data: committees = [] } = useQuery({
    queryKey: ['volunteers-dept-committee-list', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch volunteer counts and shift coverage for each committee
  const { data: committeeStats = {} } = useQuery({
    queryKey: ['volunteers-dept-committee-stats', committees.map(c => c.id)],
    queryFn: async () => {
      const result: Record<string, { volunteers: number; shifts: number; assigned: number; required: number }> = {};
      
      for (const committee of committees) {
        // Get volunteer count
        const { data: volunteers } = await supabase
          .from('workspace_team_members')
          .select('id')
          .eq('workspace_id', committee.id)
          .eq('status', 'ACTIVE');
        
        // Get today's shifts
        const today = new Date().toISOString().split('T')[0];
        const { data: shifts } = await supabase
          .from('volunteer_shifts')
          .select('id, required_volunteers')
          .eq('workspace_id', committee.id)
          .eq('date', today);
        
        const shiftIds = (shifts || []).map(s => s.id);
        let assignedCount = 0;
        
        if (shiftIds.length > 0) {
          const { data: assignments } = await supabase
            .from('volunteer_assignments')
            .select('id')
            .in('shift_id', shiftIds)
            .neq('status', 'cancelled');
          assignedCount = assignments?.length || 0;
        }
        
        const requiredCount = (shifts || []).reduce((sum, s) => sum + s.required_volunteers, 0);
        
        result[committee.id] = {
          volunteers: volunteers?.length || 0,
          shifts: shifts?.length || 0,
          assigned: assignedCount,
          required: requiredCount,
        };
      }
      
      return result;
    },
    enabled: committees.length > 0,
  });

  const handleCommitteeClick = (committeeId: string) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${eventId}?workspaceId=${committeeId}`);
  };

  if (committees.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Volunteer Committees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No volunteer committees found. Create Volunteers committees to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Volunteer Committees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {committees.map((committee) => {
          const stats = committeeStats[committee.id] || { volunteers: 0, shifts: 0, assigned: 0, required: 0 };
          const coveragePercent = stats.required > 0 
            ? Math.round((stats.assigned / stats.required) * 100) 
            : 100;

          return (
            <div
              key={committee.id}
              className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleCommitteeClick(committee.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <Users className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {committee.name}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                    <span>{stats.volunteers} volunteers</span>
                    <span>•</span>
                    <span>{stats.shifts} shifts today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={coveragePercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {stats.assigned}/{stats.required}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
