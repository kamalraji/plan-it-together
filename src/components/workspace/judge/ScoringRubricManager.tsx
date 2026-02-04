import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Plus, Edit, Trash2, GripVertical, Loader2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { useScoringRubrics } from '@/hooks/useScoringRubrics';
import { SkeletonCard } from '@/components/ui/skeleton-patterns';

interface ScoringRubricManagerProps {
  workspaceId: string;
}

export function ScoringRubricManager({ workspaceId }: ScoringRubricManagerProps) {
  const { 
    rubrics, 
    isLoading, 
    deleteRubric, 
    toggleActive, 
    duplicateRubric 
  } = useScoringRubrics(workspaceId);

  const totalWeight = (criteria: { weight: number }[]) => 
    criteria.reduce((sum, c) => sum + c.weight, 0);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Scoring Rubrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Scoring Rubrics
          {rubrics.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          New Rubric
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Empty State */}
        {rubrics.length === 0 && (
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No scoring rubrics</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create rubrics to define how submissions will be evaluated.
            </p>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Create First Rubric
            </Button>
          </div>
        )}

        {/* Rubric List */}
        {rubrics.map((rubric) => (
          <div 
            key={rubric.id} 
            className="p-4 rounded-lg border border-border/50 space-y-4"
            role="listitem"
            aria-label={`Rubric: ${rubric.name}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{rubric.name}</h4>
                  {rubric.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                  {rubric.category && (
                    <Badge variant="outline" className="text-xs">
                      {rubric.category}
                    </Badge>
                  )}
                </div>
                {rubric.description && (
                  <p className="text-sm text-muted-foreground">{rubric.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => toggleActive.mutate({ rubricId: rubric.id, isActive: !rubric.isActive })}
                  aria-label={rubric.isActive ? 'Deactivate rubric' : 'Activate rubric'}
                >
                  {rubric.isActive ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => duplicateRubric.mutate(rubric.id)}
                  aria-label="Duplicate rubric"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit rubric">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteRubric.mutate(rubric.id)}
                  disabled={deleteRubric.isPending}
                  aria-label="Delete rubric"
                >
                  {deleteRubric.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Criteria List */}
            {rubric.criteria.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{rubric.criteria.length} Criteria</span>
                  <span>Total Weight: {totalWeight(rubric.criteria)}%</span>
                </div>

                {rubric.criteria.map((criterion) => (
                  <div 
                    key={criterion.id}
                    className="flex items-center gap-3 p-2 rounded bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{criterion.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Max: {criterion.maxScore} pts ({criterion.weight}%)
                        </span>
                      </div>
                      {criterion.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                      )}
                      <Progress value={criterion.weight} className="h-1 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Criteria State */}
            {rubric.criteria.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No criteria defined. Edit the rubric to add scoring criteria.
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
