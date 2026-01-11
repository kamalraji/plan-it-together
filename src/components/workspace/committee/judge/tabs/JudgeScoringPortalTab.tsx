import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Github,
  Presentation,
  MapPin,
  Send,
  SkipForward,
  User,
  Trophy,
  Loader2,
} from 'lucide-react';
import {
  useCurrentUserAsJudge,
  useJudgeAssignmentsByJudge,
  useWorkspaceRubrics,
  useSubmitScore,
  useUpdateAssignmentStatus,
} from '@/hooks/useJudgeCommitteeData';

interface JudgeScoringPortalTabProps {
  workspaceId: string;
}

export function JudgeScoringPortalTab({ workspaceId }: JudgeScoringPortalTabProps) {
  const { data: currentJudge, isLoading: isLoadingJudge } = useCurrentUserAsJudge(workspaceId);
  const { data: assignments, isLoading: isLoadingAssignments } = useJudgeAssignmentsByJudge(workspaceId, currentJudge?.id);
  const { data: rubrics } = useWorkspaceRubrics(workspaceId);
  const submitScore = useSubmitScore(workspaceId);
  const updateAssignment = useUpdateAssignmentStatus(workspaceId);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter(a => {
      if (filter === 'pending') return a.status !== 'completed';
      if (filter === 'completed') return a.status === 'completed';
      return true;
    });
  }, [assignments, filter]);

  // Get selected assignment
  const selectedAssignment = useMemo(() => {
    return filteredAssignments.find(a => a.id === selectedAssignmentId);
  }, [filteredAssignments, selectedAssignmentId]);

  // Get rubric for selected assignment
  const selectedRubric = useMemo(() => {
    if (!selectedAssignment?.rubric_id || !rubrics) return null;
    return rubrics.find(r => r.id === selectedAssignment.rubric_id);
  }, [selectedAssignment, rubrics]);

  // Stats
  const stats = useMemo(() => {
    if (!assignments) return { total: 0, completed: 0, pending: 0 };
    return {
      total: assignments.length,
      completed: assignments.filter(a => a.status === 'completed').length,
      pending: assignments.filter(a => a.status !== 'completed').length,
    };
  }, [assignments]);

  // Auto-select first pending assignment
  useEffect(() => {
    if (!selectedAssignmentId && filteredAssignments.length > 0) {
      const firstPending = filteredAssignments.find(a => a.status !== 'completed');
      setSelectedAssignmentId(firstPending?.id || filteredAssignments[0].id);
    }
  }, [filteredAssignments, selectedAssignmentId]);

  // Reset scores when assignment changes
  useEffect(() => {
    if (selectedRubric) {
      const initialScores: Record<string, number> = {};
      selectedRubric.criteria.forEach(c => {
        initialScores[c.id] = 0;
      });
      setScores(initialScores);
    }
    setComments('');
    setPrivateNotes('');
  }, [selectedAssignmentId, selectedRubric]);

  // Calculate running total
  const runningTotal = useMemo(() => {
    if (!selectedRubric) return { total: 0, weighted: 0, maxPossible: 0 };
    
    let total = 0;
    let weighted = 0;
    let maxPossible = 0;
    
    selectedRubric.criteria.forEach(criterion => {
      const score = scores[criterion.id] || 0;
      total += score;
      weighted += (score / criterion.maxScore) * criterion.weight;
      maxPossible += criterion.maxScore;
    });
    
    return { total, weighted: Math.round(weighted * 10) / 10, maxPossible };
  }, [scores, selectedRubric]);

  const handleScoreChange = (criterionId: string, value: number[]) => {
    setScores(prev => ({ ...prev, [criterionId]: value[0] }));
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !currentJudge) return;

    await submitScore.mutateAsync({
      assignment_id: selectedAssignment.id,
      judge_id: currentJudge.id,
      submission_id: selectedAssignment.submission_id,
      rubric_id: selectedAssignment.rubric_id,
      scores,
      comments,
      private_notes: privateNotes,
    });

    // Move to next pending assignment
    const currentIndex = filteredAssignments.findIndex(a => a.id === selectedAssignmentId);
    const nextPending = filteredAssignments.slice(currentIndex + 1).find(a => a.status !== 'completed');
    if (nextPending) {
      setSelectedAssignmentId(nextPending.id);
    }
  };

  const handleSkip = () => {
    const currentIndex = filteredAssignments.findIndex(a => a.id === selectedAssignmentId);
    if (currentIndex < filteredAssignments.length - 1) {
      setSelectedAssignmentId(filteredAssignments[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = filteredAssignments.findIndex(a => a.id === selectedAssignmentId);
    if (currentIndex > 0) {
      setSelectedAssignmentId(filteredAssignments[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    const currentIndex = filteredAssignments.findIndex(a => a.id === selectedAssignmentId);
    if (currentIndex < filteredAssignments.length - 1) {
      setSelectedAssignmentId(filteredAssignments[currentIndex + 1].id);
    }
  };

  const handleStartScoring = async () => {
    if (!selectedAssignment || selectedAssignment.status !== 'assigned') return;
    await updateAssignment.mutateAsync({ assignmentId: selectedAssignment.id, status: 'in_progress' });
  };

  if (isLoadingJudge || isLoadingAssignments) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentJudge) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Not Registered as Judge</h3>
          <p className="text-muted-foreground">
            You are not registered as a judge for this workspace. Please contact the committee lead to be added as a judge.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6 text-center">
          <Scale className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Assignments Yet</h3>
          <p className="text-muted-foreground">
            You haven't been assigned any submissions to evaluate yet. Check back later or contact the committee lead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Welcome, {currentJudge.judge_name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.completed} of {stats.total} submissions scored
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={(stats.completed / stats.total) * 100} className="w-32 h-2" />
          <Badge variant={stats.pending === 0 ? 'default' : 'secondary'}>
            {stats.pending === 0 ? (
              <>
                <Trophy className="h-3 w-3 mr-1" />
                Complete
              </>
            ) : (
              `${stats.pending} pending`
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Queue */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submission Queue</CardTitle>
            <div className="flex gap-1 mt-2">
              {(['all', 'pending', 'completed'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'ghost'}
                  onClick={() => setFilter(f)}
                  className="text-xs capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="px-4 pb-4 space-y-2">
                {filteredAssignments.map(assignment => {
                  const isSelected = assignment.id === selectedAssignmentId;
                  const isCompleted = assignment.status === 'completed';
                  
                  return (
                    <button
                      key={assignment.id}
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {assignment.submission?.team_name || 'Unknown Team'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {assignment.submission?.project_name || 'No project name'}
                          </p>
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : assignment.status === 'in_progress' ? (
                          <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      {assignment.submission?.track && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {assignment.submission.track}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scoring Form */}
        <Card className="lg:col-span-2">
          {selectedAssignment ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedAssignment.submission?.team_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedAssignment.submission?.project_name}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      selectedAssignment.status === 'completed' ? 'default' :
                      selectedAssignment.status === 'in_progress' ? 'secondary' : 'outline'
                    }
                  >
                    {selectedAssignment.status}
                  </Badge>
                </div>

                {/* Submission Details */}
                {selectedAssignment.submission?.description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {selectedAssignment.submission.description}
                  </p>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedAssignment.submission?.demo_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={selectedAssignment.submission.demo_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {selectedAssignment.submission?.repo_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={selectedAssignment.submission.repo_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3 w-3 mr-1" />
                        Repository
                      </a>
                    </Button>
                  )}
                  {selectedAssignment.submission?.presentation_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={selectedAssignment.submission.presentation_url} target="_blank" rel="noopener noreferrer">
                        <Presentation className="h-3 w-3 mr-1" />
                        Slides
                      </a>
                    </Button>
                  )}
                  {selectedAssignment.submission?.table_number && (
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      Table {selectedAssignment.submission.table_number}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                {selectedAssignment.status === 'completed' ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">Already Scored</p>
                    <p className="text-sm text-muted-foreground">
                      This submission has been evaluated. Use navigation to view other submissions.
                    </p>
                  </div>
                ) : selectedAssignment.status === 'assigned' ? (
                  <div className="text-center py-8">
                    <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium mb-4">Ready to Score</p>
                    <Button onClick={handleStartScoring} disabled={updateAssignment.isPending}>
                      {updateAssignment.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Start Scoring
                    </Button>
                  </div>
                ) : selectedRubric ? (
                  <div className="space-y-6">
                    {/* Rubric Criteria */}
                    <div className="space-y-6">
                      {selectedRubric.criteria.map(criterion => (
                        <div key={criterion.id} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{criterion.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {criterion.weight}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{criterion.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-primary">
                                {scores[criterion.id] || 0}
                              </span>
                              <span className="text-muted-foreground">/{criterion.maxScore}</span>
                            </div>
                          </div>
                          <Slider
                            value={[scores[criterion.id] || 0]}
                            onValueChange={(value) => handleScoreChange(criterion.id, value)}
                            max={criterion.maxScore}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Running Total */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Running Total</span>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-primary">{runningTotal.weighted}</span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <Progress value={runningTotal.weighted} className="mt-2" />
                    </div>

                    {/* Comments */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Comments (visible to committee)</label>
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Share feedback about this submission..."
                          className="mt-1.5"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Private Notes (only visible to you)</label>
                        <Textarea
                          value={privateNotes}
                          onChange={(e) => setPrivateNotes(e.target.value)}
                          placeholder="Personal notes for your reference..."
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrevious} disabled={filteredAssignments.indexOf(selectedAssignment) === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button variant="outline" onClick={handleNext} disabled={filteredAssignments.indexOf(selectedAssignment) === filteredAssignments.length - 1}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleSkip}>
                          <SkipForward className="h-4 w-4 mr-1" />
                          Skip
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitScore.isPending}>
                          {submitScore.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Submit Score
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">No Rubric Assigned</p>
                    <p className="text-sm text-muted-foreground">
                      This submission does not have a rubric assigned. Please contact the committee lead.
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Select a submission to start scoring</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
