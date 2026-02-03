/**
 * Post-Event Rating Prompt
 * Surfaces template feedback UI after event completion
 */
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, X, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostEventRatingPromptProps {
  workspaceId: string;
  eventId: string;
  templateId?: string; // Optional - passed in if template was used
  templateName?: string;
  onDismiss: () => void;
  onRatingSubmitted?: () => void;
}

interface RatingFormData {
  overallRating: number;
  teamSatisfaction: number;
  completionRate: number;
  wouldRecommend: boolean | null;
  feedback: string;
}

export function PostEventRatingPrompt({
  workspaceId,
  eventId,
  templateId,
  templateName,
  onDismiss,
  onRatingSubmitted,
}: PostEventRatingPromptProps) {
  const [formData, setFormData] = useState<RatingFormData>({
    overallRating: 0,
    teamSatisfaction: 0,
    completionRate: 0,
    wouldRecommend: null,
    feedback: '',
  });
  const [showForm, setShowForm] = useState(false);

  // Fetch workspace name (unused but kept for potential future use)
  useQuery({
    queryKey: ['workspace-for-rating', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('id', workspaceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false, // Only fetch if needed
  });

  // Calculate task completion rate
  const { data: taskStats } = useQuery({
    queryKey: ['task-completion-stats', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      
      const total = data?.length || 0;
      const completed = data?.filter((t) => t.status === 'DONE').length || 0;
      return {
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
  });

  // Update completion rate when stats load
  React.useEffect(() => {
    if (taskStats?.rate) {
      setFormData((prev) => ({ ...prev, completionRate: taskStats.rate }));
    }
  }, [taskStats?.rate]);

  // Submit rating mutation
  const submitRating = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert template rating feedback as activity
      const { error } = await supabase.from('activity_feed_events').insert({
        event_id: eventId,
        workspace_id: workspaceId,
        user_id: user.id,
        activity_type: 'TEMPLATE_RATING',
        title: `Workspace Rating: ${formData.overallRating}/5`,
        summary: formData.feedback || 'No additional feedback provided',
        metadata: {
          template_id: templateId,
          template_name: templateName,
          overall_rating: formData.overallRating,
          team_satisfaction: formData.teamSatisfaction,
          completion_rate: formData.completionRate,
          would_recommend: formData.wouldRecommend,
        },
      });

      if (error) throw error;

      // Update template effectiveness if we have a template
      if (templateId) {
        // Get current stats
        const { data: currentTemplate } = await supabase
          .from('workspace_templates')
          .select('effectiveness, usage_count')
          .eq('id', templateId)
          .single();

        if (currentTemplate) {
          const currentRating = currentTemplate.effectiveness || 0;
          const usageCount = currentTemplate.usage_count || 1;
          // Calculate new weighted average
          const newRating = ((currentRating * usageCount) + formData.overallRating) / (usageCount + 1);

          await supabase
            .from('workspace_templates')
            .update({
              effectiveness: Math.round(newRating * 10) / 10,
              usage_count: usageCount + 1,
            })
            .eq('id', templateId);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Thank you for your feedback!',
        description: 'Your rating helps improve templates for future events.',
      });
      onRatingSubmitted?.();
      onDismiss();
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit rating',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleStarClick = (field: 'overallRating' | 'teamSatisfaction', value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStars = (
    field: 'overallRating' | 'teamSatisfaction',
    currentValue: number,
    label: string
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(field, star)}
            className={cn(
              'h-8 w-8 transition-colors',
              star <= currentValue ? 'text-yellow-400' : 'text-muted-foreground/40 hover:text-yellow-300'
            )}
          >
            <Star className={cn('h-6 w-6', star <= currentValue && 'fill-current')} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentValue > 0 ? `${currentValue}/5` : 'Click to rate'}
        </span>
      </div>
    </div>
  );

  // If template was used, show template-specific feedback
  const hasTemplate = !!templateId;

  if (!showForm) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">How did it go?</CardTitle>
                <CardDescription>
                  {hasTemplate
                    ? `Rate your experience with the "${templateName}" template`
                    : 'Share feedback about your event workspace'}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowForm(true)} className="flex-1">
              <Star className="h-4 w-4 mr-2" />
              Rate Experience
            </Button>
            <Button variant="outline" onClick={onDismiss}>
              Maybe Later
            </Button>
          </div>
          {taskStats && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasks completed:</span>
                <Badge variant="secondary">
                  {taskStats.completed}/{taskStats.total} ({taskStats.rate}%)
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rate Your Experience</CardTitle>
            <CardDescription>
              {hasTemplate
                ? `Help others by rating the "${templateName}" template`
                : 'Share your workspace feedback'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        {renderStars('overallRating', formData.overallRating, 'Overall Rating *')}

        {/* Team Satisfaction */}
        {renderStars('teamSatisfaction', formData.teamSatisfaction, 'Team Satisfaction')}

        {/* Task Completion */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Task Completion Rate</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${formData.completionRate}%` }}
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">{formData.completionRate}%</span>
          </div>
        </div>

        {/* Would Recommend */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Would you recommend this {hasTemplate ? 'template' : 'workspace setup'}?
          </label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={formData.wouldRecommend === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, wouldRecommend: true }))}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes
            </Button>
            <Button
              type="button"
              variant={formData.wouldRecommend === false ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, wouldRecommend: false }))}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Additional Feedback</label>
          <Textarea
            value={formData.feedback}
            onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value }))}
            placeholder="What worked well? What could be improved?"
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => submitRating.mutate()}
            disabled={formData.overallRating === 0 || submitRating.isPending}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitRating.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
          <Button variant="ghost" onClick={onDismiss}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
