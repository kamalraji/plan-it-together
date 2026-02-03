import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ClipboardList, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import RubricManagement from '@/components/judging/RubricManagement';

interface ViewRubricsTabProps {
  workspace: Workspace;
}

export function ViewRubricsTab({ workspace }: ViewRubricsTabProps) {
  const eventId = workspace.eventId;

  // Check if rubric exists
  const { data: rubric, isLoading } = useQuery({
    queryKey: ['rubric', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Event Associated</h3>
        <p className="text-muted-foreground max-w-md">
          This workspace is not linked to an event. Rubric management is only available for event-based workspaces.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats/Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-500" />
            Judging Rubric
          </CardTitle>
          <CardDescription>
            {rubric 
              ? 'View and edit the judging criteria for this event'
              : 'Create a rubric to define how submissions will be scored'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rubric && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {Array.isArray(rubric.criteria) ? rubric.criteria.length : 0}
                </div>
                <p className="text-xs text-muted-foreground">Criteria</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">Total Weight</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                <div className="text-sm font-medium truncate">{rubric.name || 'Default Rubric'}</div>
                <p className="text-xs text-muted-foreground">Rubric Name</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rubric Management Component - Styled to match the theme */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="[&_.bg-white]:bg-card [&_.text-gray-900]:text-foreground [&_.text-gray-600]:text-muted-foreground [&_.text-gray-700]:text-foreground [&_.text-gray-500]:text-muted-foreground [&_.border-gray-200]:border-border [&_.border-gray-300]:border-input [&_.bg-gray-100]:bg-muted [&_.hover\\:bg-gray-50]:hover:bg-muted/50 [&_.focus\\:ring-blue-500]:focus:ring-primary [&_.bg-blue-600]:bg-primary [&_.hover\\:bg-blue-700]:hover:bg-primary/90 [&_.text-blue-600]:text-primary [&_.border-blue-600]:border-primary [&_.hover\\:bg-blue-50]:hover:bg-primary/10 [&_.bg-red-50]:bg-destructive/10 [&_.border-red-200]:border-destructive/30 [&_.text-red-800]:text-destructive [&_.text-red-600]:text-destructive [&_.hover\\:text-red-800]:hover:text-destructive [&_.bg-green-50]:bg-green-500/10 [&_.border-green-200]:border-green-500/30 [&_.text-green-800]:text-green-600 [&_.text-green-600]:text-green-600 [&_input]:bg-background [&_textarea]:bg-background [&_.rounded-lg]:rounded-lg [&_.shadow-md]:shadow-none">
          <RubricManagement 
            eventId={eventId} 
            onRubricCreated={(rubric) => {
              console.log('Rubric created/updated:', rubric);
            }}
          />
        </div>
      </div>
    </div>
  );
}
