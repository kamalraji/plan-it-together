import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Star, Loader2, Trophy } from 'lucide-react';

interface EnterScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

interface CriterionScore {
  name: string;
  score: number;
  maxScore: number;
}

export function EnterScoreModal({ open, onOpenChange, eventId }: EnterScoreModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [criteriaScores, setCriteriaScores] = useState<CriterionScore[]>([]);
  const [comments, setComments] = useState('');

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    enabled: open,
  });

  // Fetch judge's assigned submissions
  const { data: assignedSubmissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['my-judge-assignments', eventId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !eventId) return [];

      // Get submissions for this event
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, team_name, rubric_id')
        .eq('event_id', eventId);

      if (!submissions?.length) return [];

      // Get my assignments
      const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('submission_id')
        .eq('judge_id', currentUser.id)
        .in('submission_id', submissions.map(s => s.id));

      if (!assignments?.length) return [];

      // Get existing scores
      const { data: existingScores } = await supabase
        .from('scores')
        .select('submission_id')
        .eq('judge_id', currentUser.id)
        .in('submission_id', assignments.map(a => a.submission_id));

      const scoredIds = new Set(existingScores?.map(s => s.submission_id) || []);

      // Return unscored submissions
      return submissions
        .filter(s => assignments.some(a => a.submission_id === s.id))
        .map(s => ({
          ...s,
          isScored: scoredIds.has(s.id),
        }));
    },
    enabled: open && !!currentUser?.id && !!eventId,
  });

  // Fetch rubric for selected submission
  const selectedSubmission = assignedSubmissions.find(s => s.id === selectedSubmissionId);
  
  const { data: rubric, isLoading: loadingRubric } = useQuery({
    queryKey: ['rubric', selectedSubmission?.rubric_id],
    queryFn: async () => {
      if (!selectedSubmission?.rubric_id) return null;

      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('id', selectedSubmission.rubric_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSubmission?.rubric_id,
  });

  // Initialize criteria scores when rubric loads
  useEffect(() => {
    if (rubric?.criteria) {
      const criteria = rubric.criteria as Array<{ name: string; maxScore: number }>;
      setCriteriaScores(
        criteria.map(c => ({
          name: c.name,
          score: Math.floor(c.maxScore / 2),
          maxScore: c.maxScore || 10,
        }))
      );
    }
  }, [rubric]);

  const handleScoreChange = (index: number, value: number[]) => {
    setCriteriaScores(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: value[0] };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubmissionId || !rubric || !currentUser) {
      toast.error('Please select a submission');
      return;
    }

    setIsSubmitting(true);

    try {
      const scoresObject = criteriaScores.reduce((acc, criterion) => {
        acc[criterion.name] = criterion.score;
        return acc;
      }, {} as Record<string, number>);

      const { error } = await supabase
        .from('scores')
        .insert({
          judge_id: currentUser.id,
          submission_id: selectedSubmissionId,
          rubric_id: rubric.id,
          scores: scoresObject,
          comments: comments.trim() || null,
        });

      if (error) throw error;

      toast.success('Score submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-judge-assignments'] });
      onOpenChange(false);
      setSelectedSubmissionId('');
      setCriteriaScores([]);
      setComments('');
    } catch {
      toast.error('Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
  const unscoredSubmissions = assignedSubmissions.filter(s => !s.isScored);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Enter Score
          </DialogTitle>
        </DialogHeader>

        {loadingSubmissions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : unscoredSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
            <p className="text-lg font-medium text-foreground">All Done!</p>
            <p className="text-sm text-muted-foreground mt-1">
              You've scored all your assigned submissions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Submission</Label>
              <Select value={selectedSubmissionId} onValueChange={setSelectedSubmissionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a submission to score..." />
                </SelectTrigger>
                <SelectContent>
                  {unscoredSubmissions.map((submission) => (
                    <SelectItem key={submission.id} value={submission.id}>
                      {submission.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubmissionId && loadingRubric && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {selectedSubmissionId && rubric && criteriaScores.length > 0 && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scoring Criteria</Label>
                    <span className="text-sm font-medium text-primary">
                      Total: {totalScore}/{maxTotal}
                    </span>
                  </div>

                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-5">
                      {criteriaScores.map((criterion, index) => (
                        <div key={criterion.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{criterion.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {criterion.score}/{criterion.maxScore}
                            </span>
                          </div>
                          <Slider
                            value={[criterion.score]}
                            onValueChange={(value) => handleScoreChange(index, value)}
                            max={criterion.maxScore}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0</span>
                            <span>{criterion.maxScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide feedback for the team..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedSubmissionId || criteriaScores.length === 0}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Score
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
