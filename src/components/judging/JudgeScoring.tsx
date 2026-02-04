import React, { useState, useEffect } from 'react';
import { Rubric, Submission, Score, SubmitScoreDTO } from '../../types';
import { supabase } from '@/integrations/supabase/client';

interface JudgeScoringProps {
  eventId: string;
  judgeId: string;
}

const JudgeScoring: React.FC<JudgeScoringProps> = ({ eventId, judgeId }) => {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingScore, setExistingScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRubricAndSubmissions();
  }, [eventId, judgeId]);

  useEffect(() => {
    if (selectedSubmission && rubric) {
      fetchExistingScore();
    }
  }, [selectedSubmission, rubric]);

  const fetchRubricAndSubmissions = async () => {
    setLoading(true);
    try {
      const [rubricResult, submissionsResult] = await Promise.all([
        supabase.functions.invoke('judging-rubric', { body: { action: 'get', eventId } }),
        supabase.functions.invoke('judging-submissions', {
          body: { action: 'assignedSubmissions', eventId, judgeId },
        }),
      ]);

      if (rubricResult.error) throw rubricResult.error;
      if (submissionsResult.error) throw submissionsResult.error;

      const fetchedRubric = rubricResult.data?.rubric as Rubric | null;
      const fetchedSubmissions = (submissionsResult.data?.submissions || []) as Submission[];

      setRubric(fetchedRubric);
      setSubmissions(fetchedSubmissions);

      if (fetchedSubmissions.length > 0) {
        setSelectedSubmission(fetchedSubmissions[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load judging data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingScore = async () => {
    if (!selectedSubmission || !rubric) return;

    try {
      const { data, error } = await supabase.functions.invoke('judging-submissions', {
        body: {
          action: 'getScoreForSubmission',
          submissionId: selectedSubmission.id,
        },
      });

      if (error) throw error;

      const score = data?.score as Score | null;
      if (!score) {
        setExistingScore(null);
        const initialScores: Record<string, number> = {};
        rubric.criteria.forEach((criterion) => {
          if (criterion.id) {
            initialScores[criterion.id] = 0;
          }
        });
        setScores(initialScores);
      } else {
        setExistingScore(score);
        setScores(score.scores as any);
      }
    } catch {
      // Score fetch failed - will show empty form
    }
  };

  const updateScore = (criterionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const validateScores = (): string | null => {
    if (!rubric) return 'No rubric available';

    for (const criterion of rubric.criteria) {
      if (!criterion.id) continue;
      
      const score = scores[criterion.id];
      if (score === undefined || score === null) {
        return `Please provide a score for "${criterion.name}"`;
      }
      if (score < 0 || score > criterion.maxScore) {
        return `Score for "${criterion.name}" must be between 0 and ${criterion.maxScore}`;
      }
    }

    return null;
  };

  const calculateTotalScore = (): number => {
    if (!rubric) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    rubric.criteria.forEach(criterion => {
      if (criterion.id && scores[criterion.id] !== undefined) {
        const normalizedScore = (scores[criterion.id] / criterion.maxScore) * 100;
        totalScore += normalizedScore * (criterion.weight / 100);
        totalWeight += criterion.weight;
      }
    });

    return totalWeight > 0 ? totalScore : 0;
  };

  const handleSubmitScore = async () => {
    if (!selectedSubmission || !rubric) return;

    setError(null);
    setSuccess(null);

    const validationError = validateScores();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const scoreData: SubmitScoreDTO = {
        submissionId: selectedSubmission.id,
        scores,
      };

      const { data, error } = await supabase.functions.invoke('judging-submissions', {
        body: {
          action: 'submitScore',
          submissionId: scoreData.submissionId,
          scores: scoreData.scores,
        },
      });

      if (error) throw error;

      const savedScore = data.score as Score;
      setExistingScore(savedScore);
      setSuccess(existingScore ? 'Score updated successfully!' : 'Score submitted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rubric) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">No rubric has been created for this event yet.</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-blue-800">No submissions have been assigned to you for judging.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submission Selection */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Judge Scoring Interface</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Submission to Score
          </label>
          <select
            value={selectedSubmission?.id || ''}
            onChange={(e) => {
              const submission = submissions.find(s => s.id === e.target.value);
              setSelectedSubmission(submission || null);
            }}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
          >
            {submissions.map(submission => (
              <option key={submission.id} value={submission.id}>
                {submission.teamName}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-muted-foreground">
          Assigned Submissions: {submissions.length}
        </div>
      </div>

      {selectedSubmission && (
        <>
          {/* Submission Details */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Submission Details: {selectedSubmission.teamName}
            </h3>
            
            {selectedSubmission.description && (
              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedSubmission.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Submitted by:</span>
                <span className="ml-2 text-muted-foreground">{selectedSubmission.submittedBy}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Submitted at:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedSubmission.files && selectedSubmission.files.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-foreground mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedSubmission.files.map((file, index) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                    >
                      View File {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scoring Form */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Score Submission
              </h3>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Score</div>
                <div className="text-2xl font-bold text-blue-600">
                  {calculateTotalScore().toFixed(1)}%
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="space-y-6">
              {rubric.criteria.map((criterion) => {
                if (!criterion.id) return null;
                
                const currentScore = scores[criterion.id] || 0;
                const percentage = criterion.maxScore > 0 ? (currentScore / criterion.maxScore) * 100 : 0;

                return (
                  <div key={criterion.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{criterion.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm text-muted-foreground">Weight: {criterion.weight}%</div>
                        <div className="text-sm text-muted-foreground">Max: {criterion.maxScore}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={criterion.maxScore}
                          step="0.1"
                          value={currentScore}
                          onChange={(e) => updateScore(criterion.id!, parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>{criterion.maxScore}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          step="0.1"
                          value={currentScore}
                          onChange={(e) => updateScore(criterion.id!, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-input rounded text-center focus:outline-none focus:ring-2 focus-visible:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {existingScore ? 'Last updated: ' + new Date(existingScore.submittedAt).toLocaleString() : 'Not yet scored'}
              </div>
              
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : existingScore ? 'Update Score' : 'Submit Score'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JudgeScoring;