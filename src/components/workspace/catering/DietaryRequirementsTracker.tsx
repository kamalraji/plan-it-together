import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Leaf, Wheat, Milk, Fish, Nut, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DietaryRequirementsTrackerProps {
  workspaceId: string;
  eventId?: string;
}

interface DietaryRequirement {
  type: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface SpecialRequest {
  id: string;
  name: string;
  requirement: string;
  notes: string;
}

// Map requirement types to display config
const requirementConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  'vegetarian': { icon: Leaf, color: 'text-success', bgColor: 'bg-success/10' },
  'vegan': { icon: Leaf, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  'gluten-free': { icon: Wheat, color: 'text-warning', bgColor: 'bg-warning/10' },
  'lactose-free': { icon: Milk, color: 'text-info', bgColor: 'bg-info/10' },
  'nut-allergy': { icon: Nut, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  'seafood-allergy': { icon: Fish, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
};

const defaultConfig = { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' };

export function DietaryRequirementsTracker({ workspaceId, eventId }: DietaryRequirementsTrackerProps) {
  // Fetch dietary requirements from database
  const { data: dietaryData, isLoading: dietaryLoading } = useQuery({
    queryKey: ['catering-dietary-requirements', workspaceId, eventId],
    queryFn: async () => {
      const query = supabase
        .from('catering_dietary_requirements')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (eventId) {
        query.eq('event_id', eventId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Fetch total registrations count for the event
  const { data: registrationCount, isLoading: registrationLoading } = useQuery({
    queryKey: ['registration-count', eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      
      const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'CONFIRMED');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });

  const isLoading = dietaryLoading || registrationLoading;
  const totalAttendees = registrationCount || 0;

  // Transform database data to display format
  const dietaryRequirements: DietaryRequirement[] = (dietaryData || []).map(req => {
    const typeKey = req.requirement_type.toLowerCase().replace(/\s+/g, '-');
    const config = requirementConfig[typeKey] || defaultConfig;
    return {
      type: req.requirement_type,
      count: req.count,
      ...config,
    };
  });

  // Extract special requests from the JSONB field
  const specialRequests: SpecialRequest[] = (dietaryData || [])
    .filter(req => req.special_requests)
    .flatMap(req => {
      const requests = req.special_requests as Record<string, unknown>[];
      if (!Array.isArray(requests)) return [];
      return requests.map((r, idx) => ({
        id: `${req.id}-${idx}`,
        name: String(r.name || 'Guest'),
        requirement: String(r.requirement || req.requirement_type),
        notes: String(r.notes || ''),
      }));
    });

  const totalDietary = dietaryRequirements.reduce((acc, d) => acc + d.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Dietary Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no data
  if (dietaryRequirements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Dietary Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No dietary requirements recorded yet.</p>
            <p className="text-xs mt-1">Requirements will appear here as registrations come in.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Dietary Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Dietary Requests</span>
            <Badge variant="secondary">{totalDietary} of {totalAttendees}</Badge>
          </div>
          {totalAttendees > 0 && (
            <>
              <Progress value={(totalDietary / totalAttendees) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {((totalDietary / totalAttendees) * 100).toFixed(1)}% of attendees have dietary requirements
              </p>
            </>
          )}
        </div>

        {/* Requirements List */}
        <div className="space-y-2">
          {dietaryRequirements.map((req) => {
            const Icon = req.icon;
            const percentage = totalAttendees > 0 ? (req.count / totalAttendees) * 100 : 0;
            return (
              <div key={req.type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${req.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${req.color}`} />
                  </div>
                  <span className="text-sm">{req.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                  <Badge variant="outline" className="text-xs min-w-[40px] justify-center">
                    {req.count}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Special Requests */}
        {specialRequests.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Special Requests ({specialRequests.length})
            </h4>
            <div className="space-y-2">
              {specialRequests.map((request) => (
                <div key={request.id} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{request.name}</span>
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {request.requirement}
                    </Badge>
                  </div>
                  {request.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{request.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
