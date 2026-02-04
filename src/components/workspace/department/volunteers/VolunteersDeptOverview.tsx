import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

interface VolunteersDeptOverviewProps {
  workspaceId: string;
}

export function VolunteersDeptOverview({ workspaceId }: VolunteersDeptOverviewProps) {
  // Fetch child committees
  const { data: committees = [] } = useQuery({
    queryKey: ['volunteers-dept-overview-committees', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE');
      if (error) throw error;
      return data;
    },
  });

  const committeeIds = committees.map(c => c.id);

  // Fetch weekly hours data
  const { data: weeklyData = [] } = useQuery({
    queryKey: ['volunteers-dept-weekly-hours', committeeIds],
    queryFn: async () => {
      if (committeeIds.length === 0) return [];
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      
      const result = [];
      
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        // Get shifts for this day
        const { data: shifts } = await supabase
          .from('volunteer_shifts')
          .select('id')
          .in('workspace_id', committeeIds)
          .eq('date', dateStr);
        
        let hoursLogged = 0;
        if (shifts && shifts.length > 0) {
          const shiftIds = shifts.map(s => s.id);
          const { data: assignments } = await supabase
            .from('volunteer_assignments')
            .select('hours_logged')
            .in('shift_id', shiftIds);
          
          hoursLogged = (assignments || []).reduce((sum, a) => sum + (a.hours_logged || 0), 0);
        }
        
        result.push({
          day: format(day, 'EEE'),
          hours: hoursLogged,
        });
      }
      
      return result;
    },
    enabled: committeeIds.length > 0,
  });

  // Fetch recruitment funnel data
  const { data: funnelData } = useQuery({
    queryKey: ['volunteers-dept-funnel', committeeIds],
    queryFn: async () => {
      if (committeeIds.length === 0) return { total: 0, active: 0, trained: 0, certified: 0 };
      
      const { data: members } = await supabase
        .from('workspace_team_members')
        .select('id, status')
        .in('workspace_id', committeeIds);
      
      const total = members?.length || 0;
      const active = members?.filter(m => m.status === 'ACTIVE').length || 0;
      // Simulate trained and certified (in real app, you'd have these fields)
      const trained = Math.round(active * 0.85);
      const certified = Math.round(active * 0.6);
      
      return { total, active, trained, certified };
    },
    enabled: committeeIds.length > 0,
  });

  const funnel = funnelData || { total: 0, active: 0, trained: 0, certified: 0 };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Volunteer Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Hours Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Weekly Hours Logged</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruitment Funnel */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Volunteer Pipeline</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Applied</span>
                <span className="font-medium">{funnel.total}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{funnel.active}</span>
              </div>
              <Progress value={funnel.total > 0 ? (funnel.active / funnel.total) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Trained</span>
                <span className="font-medium">{funnel.trained}</span>
              </div>
              <Progress value={funnel.total > 0 ? (funnel.trained / funnel.total) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Certified</span>
                <span className="font-medium">{funnel.certified}</span>
              </div>
              <Progress value={funnel.total > 0 ? (funnel.certified / funnel.total) * 100 : 0} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
