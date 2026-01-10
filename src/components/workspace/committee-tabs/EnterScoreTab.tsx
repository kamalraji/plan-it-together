import { useState, useEffect } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Loader2, CheckCircle, AlertCircle, Trophy } from 'lucide-react';

interface EnterScoreTabProps {
  workspace: Workspace;
}

interface Criterion {
  name: string;
  score: number;
  maxScore: number;
}

export function EnterScoreTab({ workspace }: EnterScoreTabProps) {
  const queryClient = useQueryClient();
  const eventId = workspace.eventId;

  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [criteriaScores, setCriteriaScores] = useState<Criterion[]>([]);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch judge's assigned submissions (excluding already scored)
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['my-assignments', eventId, currentUser?.id],
    queryFn: async () => {
      if (!eventId || !currentUser?.id) return [];

      // Get submissions for this event
      const { data: subs } = await supabase
        .from('submissions')
        .select('id, team_name, description, rubric_id')
        .eq('event_id', eventId);

      if (!subs?.length) return [];

      // Get this judge's assignments
      const { data: judgeAssignments } = await supabase
        .from('judge_assignments')
        .select('submission_id')
        .eq('judge_id', currentUser.id)
        .in('submission_id', subs.map(s => s.id));

      if (!judgeAssignments?.length) return [];

      // Get already scored submissions by this judge
      const { data: scores } = await supabase
        .from('scores')
        .select('submission_id')
        .eq('judge_id', currentUser.id)
        .in('submission_id', judgeAssignments.map(a => a.submission_id));

      const scoredIds = new Set(scores?.map(s => s.submission_id) || []);
      const assignedIds = new Set(judgeAssignments.map(a => a.submission_id));

      return subs.filter(s => assignedIds.has(s.id) && !scoredIds.has(s.id));
    },
    enabled: !!eventId && !!currentUser?.id,
  });

  // Fetch rubric for selected submission
  const selectedSub = assignments?.find(a => a.id === selectedSubmission);
  const { data: rubric, isLoading: loadingRubric } = useQuery({
    queryKey: ['rubric', selectedSub?.rubric_id],
    queryFn: async () => {
      if (!selectedSub?.rubric_id) return null;

      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('id', selectedSub.rubric_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSub?.rubric_id,
  });

  // Initialize criteria scores when rubric loads
  useEffect(() => {
    if (rubric?.criteria) {
      const criteria = rubric.criteria as Array<{ name: string; maxScore: number }>;
      setCriteriaScores(
        criteria.map(c => ({
          name: c.name,
          score: 0,
          maxScore: c.maxScore || 10,
        }))
      );
    }
  }, [rubric]);

  // Reset when submission changes
  useEffect(() => {
    setComments('');
  }, [selectedSubmission]);

  const handleScoreChange = (index: number, value: number[]) => {
    setCriteriaScores(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: value[0] };
      return updated;
    });
  };

  const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
  const scorePercentage = maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0;

  const handleSubmit = async () => {
    if (!selectedSubmission || !currentUser?.id || !selectedSub?.rubric_id) {
      toast.error('Please select a submission');
      return;
    }

    setIsSubmitting(true);

    try {
      const scoresObj: Record<string, number> = {};
      criteriaScores.forEach(c => {
        scoresObj[c.name] = c.score;
      });

      const { error } = await supabase
        .from('scores')
        .insert({
          judge_id: currentUser.id,
          submission_id: selectedSubmission,
          rubric_id: selectedSub.rubric_id,
          scores: scoresObj,
          comments: comments.trim() || null,
        });

      if (error) throw error;

      toast.success('Score submitted successfully!');
      setSelectedSubmission('');
      setCriteriaScores([]);
      setComments('');
      queryClient.invalidateQueries({ queryKey: ['my-assignments', eventId, currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ['scores', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats', eventId] });
    } catch (error: any) {
      toast.error('Failed to submit score: ' + error.message);
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
            This workspace is not linked to an event. Scoring requires an event context.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Pending to Score</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{Math.round(scorePercentage)}%</div>
            <div className="text-xs text-muted-foreground">Current Score</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Enter Score
          </CardTitle>
          <CardDescription>
            Score submissions assigned to you based on the rubric criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingAssignments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assignments?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold">All Done!</h3>
              <p className="text-muted-foreground mt-2">
                You have scored all your assigned submissions.
              </p>
            </div>
          ) : (
            <>
              {/* Submission Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Submission</label>
                <Select value={selectedSubmission} onValueChange={setSelectedSubmission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a submission to score..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scoring Interface */}
              {selectedSubmission && (
                <>
                  {loadingRubric ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !rubric ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No rubric found for this submission
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {/* Score Summary */}
                      <div className="p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Total Score</span>
                          <span className="text-lg font-bold">
                            {totalScore} / {maxTotal}
                          </span>
                        </div>
                        <Progress value={scorePercentage} className="h-2" />
                      </div>

                      {/* Criteria Sliders */}
                      <div className="space-y-6">
                        {criteriaScores.map((criterion, index) => (
                          <div key={criterion.name} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">{criterion.name}</label>
                              <Badge variant="outline">
                                {criterion.score} / {criterion.maxScore}
                              </Badge>
                            </div>
                            <Slider
                              value={[criterion.score]}
                              onValueChange={(value) => handleScoreChange(index, value)}
                              max={criterion.maxScore}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Comments */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Comments (Optional)</label>
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Add feedback or notes for this submission..."
                          rows={4}
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Submit Score
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
