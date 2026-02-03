import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJudgingStats, useScores, useJudgeAssignments } from '@/hooks/useJudgingData';
import { Star, Loader2, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface EnterScoreTabProps {
  workspace: Workspace;
}

interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export function EnterScoreTab({ workspace }: EnterScoreTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const eventId = workspace.eventId;
  
  const { data: stats, isLoading: statsLoading } = useJudgingStats(eventId);
  const { data: scores } = useScores(eventId);
  const { data: assignments } = useJudgeAssignments(eventId);
  
  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');

  // Fetch rubric for this event
  const { data: rubric, isLoading: rubricLoading } = useQuery({
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

  // Fetch submissions assigned to current user
  const { data: mySubmissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['my-submissions', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user?.id) return [];
      
      // Get submissions assigned to this judge
      const myAssignments = assignments?.filter(a => a.judge_id === user.id) || [];
      if (myAssignments.length === 0) return [];
      
      const submissionIds = myAssignments.map(a => a.submission_id);
      const { data, error } = await supabase
        .from('submissions')
        .select('id, team_name, description')
        .in('id', submissionIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId && !!user?.id && !!assignments,
  });

  // Check which submissions are already scored
  const getScoredSubmissionIds = () => {
    return scores?.filter(s => s.judge_id === user?.id).map(s => s.submission_id) || [];
  };

  // Submit score mutation
  const submitScoreMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubmission || !rubric?.id || !user?.id) throw new Error('Missing required data');
      
      const { error } = await supabase
        .from('scores')
        .upsert({
          submission_id: selectedSubmission,
          judge_id: user.id,
          rubric_id: rubric.id,
          scores: criteriaScores,
          comments,
        }, { onConflict: 'submission_id,judge_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores', eventId] });
      queryClient.invalidateQueries({ queryKey: ['judging-stats', eventId] });
      setSelectedSubmission('');
      setCriteriaScores({});
      setComments('');
      toast.success('Score submitted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit score: ' + error.message);
    },
  });

  const handleCriterionScoreChange = (criterionName: string, value: number[]) => {
    setCriteriaScores(prev => ({ ...prev, [criterionName]: value[0] }));
  };

  const calculateTotalScore = () => {
    if (!rubric?.criteria) return 0;
    const criteria = rubric.criteria as unknown as RubricCriterion[];
    let total = 0;
    let maxTotal = 0;
    
    criteria.forEach(c => {
      const score = criteriaScores[c.name] || 0;
      total += (score / c.maxScore) * c.weight;
      maxTotal += c.weight;
    });
    
    return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  };

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmission(submissionId);
    // Load existing score if any
    const existingScore = scores?.find(s => s.submission_id === submissionId && s.judge_id === user?.id);
    if (existingScore) {
      setCriteriaScores((existingScore.scores as unknown as Record<string, number>) || {});
      setComments(existingScore.comments || '');
    } else {
      setCriteriaScores({});
      setComments('');
    }
  };

  const scoredIds = getScoredSubmissionIds();
  const isLoading = statsLoading || rubricLoading || submissionsLoading;

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Event Associated</h3>
        <p className="text-muted-foreground max-w-md">
          This workspace is not linked to an event. Scoring is only available for event-based workspaces.
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

  const rubricCriteria = (rubric?.criteria as unknown as RubricCriterion[]) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{mySubmissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Assigned to You</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{scoredIds.length}</div>
            <p className="text-xs text-muted-foreground">Scored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {(mySubmissions?.length || 0) - scoredIds.length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.averageScore || 0}</div>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Submission Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Enter Score
          </CardTitle>
          <CardDescription>Select a submission to score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Submission</Label>
              <Select value={selectedSubmission} onValueChange={handleSelectSubmission}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a submission to score" />
                </SelectTrigger>
                <SelectContent>
                  {mySubmissions?.map((submission) => {
                    const isScored = scoredIds.includes(submission.id);
                    return (
                      <SelectItem key={submission.id} value={submission.id}>
                        <div className="flex items-center gap-2">
                          {isScored ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                          {submission.team_name}
                          {isScored && <span className="text-xs text-muted-foreground">(scored)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                  {(!mySubmissions || mySubmissions.length === 0) && (
                    <SelectItem value="none" disabled>No submissions assigned to you</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSubmission && mySubmissions?.find(s => s.id === selectedSubmission)?.description && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {mySubmissions?.find(s => s.id === selectedSubmission)?.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Form */}
      {selectedSubmission && rubricCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scoring Rubric</CardTitle>
            <CardDescription>
              Rate each criterion. Current total: <span className="font-bold text-primary">{calculateTotalScore()}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rubricCriteria.map((criterion) => (
              <div key={criterion.name} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{criterion.name}</h4>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                  <Badge variant="outline">Weight: {criterion.weight}%</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[criteriaScores[criterion.name] || 0]}
                    max={criterion.maxScore}
                    step={1}
                    onValueChange={(value) => handleCriterionScoreChange(criterion.name, value)}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-medium">
                    {criteriaScores[criterion.name] || 0} / {criterion.maxScore}
                  </span>
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Provide feedback for the team..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <span className="text-sm text-muted-foreground">Total Score:</span>
                <span className="text-2xl font-bold ml-2 text-primary">{calculateTotalScore()}%</span>
              </div>
              <Button
                onClick={() => submitScoreMutation.mutate()}
                disabled={submitScoreMutation.isPending}
              >
                {submitScoreMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Submit Score
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSubmission && rubricCriteria.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rubric has been created for this event.</p>
              <p className="text-sm">Please create a rubric in the "View Rubrics" tab first.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
