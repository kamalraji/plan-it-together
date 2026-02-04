import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Scale, AlertCircle, ChevronRight } from 'lucide-react';
import { JudgeScoringPortalTab } from '@/components/workspace/committee/judge/tabs/JudgeScoringPortalTab';

interface JudgeWorkspace {
  workspace_id: string;
  workspace_name: string;
  event_name: string | null;
  judge_status: string;
  assigned_count: number;
  completed_count: number;
}

export default function JudgePortalPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [workspaces, setWorkspaces] = useState<JudgeWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Judge Portal | Thittam1Hub';
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login', { state: { from: `/${orgSlug}/judge-portal` } });
      return;
    }

    const fetchJudgeWorkspaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Find all workspaces where the user is a judge
        const { data: judgeData, error: judgeError } = await supabase
          .from('workspace_judges')
          .select(`
            workspace_id,
            status,
            assigned_count,
            completed_count,
            workspace:workspaces!workspace_judges_workspace_id_fkey(
              id,
              name,
              event:events(name)
            )
          `)
          .eq('user_id', user.id);

        if (judgeError) throw judgeError;

        if (!judgeData || judgeData.length === 0) {
          setWorkspaces([]);
          setIsLoading(false);
          return;
        }

        const mapped: JudgeWorkspace[] = judgeData.map((j: any) => ({
          workspace_id: j.workspace_id,
          workspace_name: j.workspace?.name || 'Unknown Workspace',
          event_name: j.workspace?.event?.name || null,
          judge_status: j.status,
          assigned_count: j.assigned_count || 0,
          completed_count: j.completed_count || 0,
        }));

        setWorkspaces(mapped);

        // Auto-select if only one workspace
        if (mapped.length === 1) {
          setSelectedWorkspaceId(mapped[0].workspace_id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load judge data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJudgeWorkspaces();
  }, [user, authLoading, orgSlug, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading judge portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Portal</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Judge Assignments</h3>
            <p className="text-muted-foreground mb-4">
              You are not currently registered as a judge for any events. 
              If you believe this is an error, please contact the event organizers.
            </p>
            <Button variant="outline" onClick={() => navigate(`/${orgSlug || 'dashboard'}`)}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If workspace is selected, show the scoring portal
  if (selectedWorkspaceId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Judge Portal</h1>
                  <p className="text-sm text-muted-foreground">
                    {workspaces.find(w => w.workspace_id === selectedWorkspaceId)?.workspace_name}
                  </p>
                </div>
              </div>
              {workspaces.length > 1 && (
                <Button variant="outline" onClick={() => setSelectedWorkspaceId(null)}>
                  Switch Event
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <JudgeScoringPortalTab workspaceId={selectedWorkspaceId} />
        </div>
      </div>
    );
  }

  // Workspace selection screen
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="text-center mb-8">
          <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Judge Portal</h1>
          <p className="text-muted-foreground">
            Select an event to start scoring submissions
          </p>
        </div>

        <div className="space-y-4">
          {workspaces.map(workspace => {
            const progress = workspace.assigned_count > 0 
              ? Math.round((workspace.completed_count / workspace.assigned_count) * 100)
              : 0;

            return (
              <Card 
                key={workspace.workspace_id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedWorkspaceId(workspace.workspace_id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{workspace.workspace_name}</CardTitle>
                      {workspace.event_name && (
                        <CardDescription>{workspace.event_name}</CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={workspace.judge_status === 'active' || workspace.judge_status === 'confirmed' ? 'default' : 'secondary'}
                    >
                      {workspace.judge_status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {workspace.completed_count} / {workspace.assigned_count} scored
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
