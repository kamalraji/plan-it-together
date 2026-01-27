import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useJudgeAssignments, useJudgingStats } from '@/hooks/useJudgingData';
import { Gavel, Users, FileText, Loader2, Trash2, AlertCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssignJudgesTabProps {
  workspace: Workspace;
}

export function AssignJudgesTab({ workspace }: AssignJudgesTabProps) {
  const queryClient = useQueryClient();
  const eventId = workspace.eventId;
  
  const { data: stats, isLoading: statsLoading } = useJudgingStats(eventId);
  const { data: assignments, isLoading: assignmentsLoading } = useJudgeAssignments(eventId);
  
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<string>('');

  // Fetch submissions for this event
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['submissions', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('submissions')
        .select('id, team_name, description')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch judges (users with organizer role for this event)
  const { data: judges } = useQuery({
    queryKey: ['event-judges', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      // Get unique judge IDs from assignments
      const judgeIds = [...new Set(assignments?.map(a => a.judge_id) || [])];
      if (judgeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', judgeIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId && !!assignments,
  });

  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: async ({ judgeId, submissionIds }: { judgeId: string; submissionIds: string[] }) => {
      const inserts = submissionIds.map(submissionId => ({
        judge_id: judgeId,
        submission_id: submissionId,
      }));
      
      const { error } = await supabase
        .from('judge_assignments')
        .upsert(inserts, { onConflict: 'judge_id,submission_id', ignoreDuplicates: true });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats', eventId] });
      setSelectedSubmissions([]);
      setSelectedJudge('');
      toast.success('Judges assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign judges: ' + error.message);
    },
  });

  // Remove assignment mutation
  const unassignMutation = useMutation({
    mutationFn: async ({ judgeId, submissionId }: { judgeId: string; submissionId: string }) => {
      const { error } = await supabase
        .from('judge_assignments')
        .delete()
        .eq('judge_id', judgeId)
        .eq('submission_id', submissionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats', eventId] });
      toast.success('Assignment removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove assignment: ' + error.message);
    },
  });

  const handleBulkAssign = () => {
    if (!selectedJudge || selectedSubmissions.length === 0) return;
    assignMutation.mutate({ judgeId: selectedJudge, submissionIds: selectedSubmissions });
  };

  const toggleSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const getAssignedJudgesForSubmission = (submissionId: string) => {
    return assignments?.filter(a => a.submission_id === submissionId).map(a => a.judge_id) || [];
  };

  const getJudgeName = (judgeId: string) => {
    const judge = judges?.find(j => j.id === judgeId);
    return judge?.full_name || 'Unknown Judge';
  };

  const isLoading = statsLoading || assignmentsLoading || submissionsLoading;

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Event Associated</h3>
        <p className="text-muted-foreground max-w-md">
          This workspace is not linked to an event. Judge assignments are only available for event-based workspaces.
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.totalJudges || 0}</div>
            <p className="text-xs text-muted-foreground">Total Judges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats?.pendingAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Pending Evaluations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats?.evaluatedSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Evaluated</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Assign Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-amber-500" />
            Assign Judges
          </CardTitle>
          <CardDescription>Select submissions and assign them to a judge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Select Judge</label>
              <Select value={selectedJudge} onValueChange={setSelectedJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a judge" />
                </SelectTrigger>
                <SelectContent>
                  {judges?.map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      {judge.full_name || 'Unknown'}
                    </SelectItem>
                  ))}
                  {(!judges || judges.length === 0) && (
                    <SelectItem value="none" disabled>No judges found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkAssign}
                disabled={!selectedJudge || selectedSubmissions.length === 0 || assignMutation.isPending}
              >
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <UserPlus className="h-4 w-4 mr-2" />
                Assign ({selectedSubmissions.length})
              </Button>
              {selectedSubmissions.length > 0 && (
                <Button variant="outline" onClick={() => setSelectedSubmissions([])}>
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Submissions
          </CardTitle>
          <CardDescription>Click to select submissions for bulk assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found</p>
              <p className="text-sm">Submissions will appear here once participants submit their work.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const assignedJudges = getAssignedJudgesForSubmission(submission.id);
                const isSelected = selectedSubmissions.includes(submission.id);
                
                return (
                  <div
                    key={submission.id}
                    className={cn(
                      "flex items-start justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                    )}
                    onClick={() => toggleSubmission(submission.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSubmission(submission.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div className="font-medium">{submission.team_name}</div>
                        {submission.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {submission.description}
                          </p>
                        )}
                        {assignedJudges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assignedJudges.map((judgeId) => (
                              <Badge
                                key={judgeId}
                                variant="outline"
                                className="gap-1 cursor-pointer hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unassignMutation.mutate({ judgeId, submissionId: submission.id });
                                }}
                              >
                                <Users className="h-3 w-3" />
                                {getJudgeName(judgeId)}
                                <Trash2 className="h-3 w-3 ml-1 text-destructive" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={assignedJudges.length > 0 ? "default" : "secondary"}>
                        {assignedJudges.length} judge{assignedJudges.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
