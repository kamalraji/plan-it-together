import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Gavel, Loader2, Users } from 'lucide-react';

interface AssignJudgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function AssignJudgeModal({ open, onOpenChange, eventId }: AssignJudgeModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  // Fetch judges (workspace team members with JUDGE_COORDINATOR role for this event)
  const { data: judges = [], isLoading: loadingJudges } = useQuery({
    queryKey: ['judges', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('user_id, workspaces!inner(event_id)')
        .eq('workspaces.event_id', eventId)
        .eq('role', 'JUDGE_COORDINATOR')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      if (!data?.length) return [];

      // Get profiles for these judges
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', data.map(r => r.user_id));

      if (profilesError) throw profilesError;

      return profiles || [];
    },
    enabled: open,
  });

  // Fetch submissions for this event
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('submissions')
        .select('id, team_name, description')
        .eq('event_id', eventId)
        .order('team_name');

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!eventId,
  });

  // Fetch existing assignments for selected judge
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ['judge-existing-assignments', selectedJudgeId, eventId],
    queryFn: async () => {
      if (!selectedJudgeId || !eventId) return [];

      const submissionIds = submissions.map(s => s.id);
      if (!submissionIds.length) return [];

      const { data, error } = await supabase
        .from('judge_assignments')
        .select('submission_id')
        .eq('judge_id', selectedJudgeId)
        .in('submission_id', submissionIds);

      if (error) throw error;
      return data?.map(a => a.submission_id) || [];
    },
    enabled: open && !!selectedJudgeId && submissions.length > 0,
  });

  // Reset selected submissions when judge changes
  useEffect(() => {
    setSelectedSubmissions([]);
  }, [selectedJudgeId]);

  const handleSubmissionToggle = (submissionId: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    const unassigned = submissions
      .filter(s => !existingAssignments.includes(s.id))
      .map(s => s.id);
    setSelectedSubmissions(unassigned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJudgeId) {
      toast.error('Please select a judge');
      return;
    }

    if (selectedSubmissions.length === 0) {
      toast.error('Please select at least one submission');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignments = selectedSubmissions.map(submissionId => ({
        judge_id: selectedJudgeId,
        submission_id: submissionId,
      }));

      const { error } = await supabase
        .from('judge_assignments')
        .insert(assignments);

      if (error) throw error;

      toast.success(`Assigned ${selectedSubmissions.length} submission(s) to judge`);
      queryClient.invalidateQueries({ queryKey: ['judge-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats'] });
      onOpenChange(false);
      setSelectedJudgeId('');
      setSelectedSubmissions([]);
    } catch (_error) {
      toast.error('Failed to assign submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingJudges || loadingSubmissions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-amber-500" />
            Assign Judge to Submissions
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Judge</Label>
              {judges.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 inline mr-2" />
                  No judges found. Add users with the "judge" role first.
                </div>
              ) : (
                <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a judge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {judges.map((judge) => (
                      <SelectItem key={judge.id} value={judge.id}>
                        {judge.full_name || 'Unnamed Judge'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedJudgeId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Submissions</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All Unassigned
                  </Button>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    No submissions found for this event.
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] border rounded-lg p-3">
                    <div className="space-y-2">
                      {submissions.map((submission) => {
                        const isAssigned = existingAssignments.includes(submission.id);
                        const isSelected = selectedSubmissions.includes(submission.id);

                        return (
                          <div
                            key={submission.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              isAssigned
                                ? 'bg-muted/50 border-muted opacity-60'
                                : isSelected
                                ? 'bg-primary/5 border-primary/30'
                                : 'hover:bg-accent'
                            }`}
                          >
                            <Checkbox
                              id={submission.id}
                              checked={isSelected || isAssigned}
                              disabled={isAssigned}
                              onCheckedChange={() => handleSubmissionToggle(submission.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={submission.id}
                                className={`text-sm font-medium cursor-pointer ${isAssigned ? 'cursor-not-allowed' : ''}`}
                              >
                                {submission.team_name}
                                {isAssigned && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Already assigned)</span>
                                )}
                              </label>
                              {submission.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {submission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {selectedSubmissions.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmissions.length} submission(s) selected
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedJudgeId || selectedSubmissions.length === 0}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign Judge
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
