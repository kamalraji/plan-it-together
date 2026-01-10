import { useState, useEffect } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Scale, Users, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AssignJudgesTabProps {
  workspace: Workspace;
}

interface Judge {
  id: string;
  full_name: string;
  assignmentCount: number;
}

interface Submission {
  id: string;
  team_name: string;
  description: string | null;
  assignedJudges: string[];
}

export function AssignJudgesTab({ workspace }: AssignJudgesTabProps) {
  const queryClient = useQueryClient();
  const eventId = workspace.eventId;

  const [selectedJudge, setSelectedJudge] = useState<string>('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch judges with role 'judge'
  const { data: judges, isLoading: loadingJudges } = useQuery({
    queryKey: ['judges-list', eventId],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (error) throw error;

      if (!roles?.length) return [];

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Get assignment counts
      const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('judge_id');

      const assignmentCounts: Record<string, number> = {};
      assignments?.forEach(a => {
        assignmentCounts[a.judge_id] = (assignmentCounts[a.judge_id] || 0) + 1;
      });

      return (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown Judge',
        assignmentCount: assignmentCounts[p.id] || 0,
      })) as Judge[];
    },
    enabled: !!eventId,
  });

  // Fetch submissions for the event
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions-list', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data: subs, error } = await supabase
        .from('submissions')
        .select('id, team_name, description')
        .eq('event_id', eventId);

      if (error) throw error;

      // Get all assignments
      const subIds = subs?.map(s => s.id) || [];
      if (!subIds.length) return [];

      const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('judge_id, submission_id')
        .in('submission_id', subIds);

      const assignmentMap: Record<string, string[]> = {};
      assignments?.forEach(a => {
        if (!assignmentMap[a.submission_id]) {
          assignmentMap[a.submission_id] = [];
        }
        assignmentMap[a.submission_id].push(a.judge_id);
      });

      return (subs || []).map(s => ({
        id: s.id,
        team_name: s.team_name,
        description: s.description,
        assignedJudges: assignmentMap[s.id] || [],
      })) as Submission[];
    },
    enabled: !!eventId,
  });

  // Reset selections when judge changes
  useEffect(() => {
    setSelectedSubmissions([]);
  }, [selectedJudge]);

  const handleSubmissionToggle = (submissionId: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    if (!submissions || !selectedJudge) return;
    const unassigned = submissions
      .filter(s => !s.assignedJudges.includes(selectedJudge))
      .map(s => s.id);
    setSelectedSubmissions(unassigned);
  };

  const handleAssign = async () => {
    if (!selectedJudge || selectedSubmissions.length === 0) {
      toast.error('Please select a judge and at least one submission');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignments = selectedSubmissions.map(submissionId => ({
        judge_id: selectedJudge,
        submission_id: submissionId,
      }));

      const { error } = await supabase
        .from('judge_assignments')
        .insert(assignments);

      if (error) throw error;

      toast.success(`Assigned ${selectedSubmissions.length} submissions to judge`);
      setSelectedSubmissions([]);
      queryClient.invalidateQueries({ queryKey: ['submissions-list', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judges-list', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judge-assignments', eventId] });
    } catch (error: any) {
      toast.error('Failed to assign: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eventId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Event Linked</h3>
          <p className="text-muted-foreground mt-2">
            This workspace is not linked to an event. Judge assignments require an event context.
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    totalJudges: judges?.length || 0,
    totalSubmissions: submissions?.length || 0,
    unassignedSubmissions: submissions?.filter(s => s.assignedJudges.length === 0).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.totalJudges}</div>
            <div className="text-xs text-muted-foreground">Available Judges</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <div className="text-xs text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{stats.unassignedSubmissions}</div>
            <div className="text-xs text-muted-foreground">Unassigned</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Assign Judges to Submissions
          </CardTitle>
          <CardDescription>
            Select a judge and choose submissions to assign for evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Judge Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Judge</label>
            {loadingJudges ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading judges...
              </div>
            ) : judges?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No judges available</p>
            ) : (
              <Select value={selectedJudge} onValueChange={setSelectedJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a judge..." />
                </SelectTrigger>
                <SelectContent>
                  {judges?.map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      <span className="flex items-center gap-2">
                        {judge.full_name}
                        <Badge variant="outline" className="text-xs">
                          {judge.assignmentCount} assigned
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Submissions List */}
          {selectedJudge && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Submissions</label>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All Unassigned
                </Button>
              </div>

              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : submissions?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No submissions found for this event
                </p>
              ) : (
                <ScrollArea className="h-[350px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {submissions?.map((submission) => {
                      const isAlreadyAssigned = submission.assignedJudges.includes(selectedJudge);
                      const isSelected = selectedSubmissions.includes(submission.id);

                      return (
                        <div
                          key={submission.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isAlreadyAssigned
                              ? 'bg-muted/50 opacity-60'
                              : isSelected
                              ? 'bg-primary/10 border-primary'
                              : 'bg-card hover:bg-muted/30'
                          }`}
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={isSelected || isAlreadyAssigned}
                              disabled={isAlreadyAssigned}
                              onCheckedChange={() => handleSubmissionToggle(submission.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{submission.team_name}</span>
                                {isAlreadyAssigned && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Already Assigned
                                  </Badge>
                                )}
                              </div>
                              {submission.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {submission.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {submission.assignedJudges.length} judges assigned
                                </Badge>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Assign Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedSubmissions.length} submissions selected
                </span>
                <Button
                  onClick={handleAssign}
                  disabled={selectedSubmissions.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Scale className="h-4 w-4 mr-2" />
                      Assign Judge
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
