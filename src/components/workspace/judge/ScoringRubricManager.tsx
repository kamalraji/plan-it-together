import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Plus, Edit, Trash2, GripVertical } from 'lucide-react';

interface Criterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: Criterion[];
  isActive: boolean;
}

interface ScoringRubricManagerProps {
  workspaceId?: string;
}

export function ScoringRubricManager(_props: ScoringRubricManagerProps) {
  // Mock data - in production, fetch from database
  const [rubrics] = useState<Rubric[]>([
    {
      id: '1',
      name: 'Technical Excellence',
      description: 'Evaluates code quality, architecture, and innovation',
      isActive: true,
      criteria: [
        { id: '1', name: 'Code Quality', description: 'Clean, maintainable code', maxScore: 10, weight: 25 },
        { id: '2', name: 'Innovation', description: 'Novel approach or solution', maxScore: 10, weight: 30 },
        { id: '3', name: 'Scalability', description: 'Can handle growth', maxScore: 10, weight: 20 },
        { id: '4', name: 'Documentation', description: 'Clear documentation', maxScore: 10, weight: 15 },
        { id: '5', name: 'Testing', description: 'Test coverage', maxScore: 10, weight: 10 },
      ],
    },
    {
      id: '2',
      name: 'Business Impact',
      description: 'Evaluates market potential and business viability',
      isActive: true,
      criteria: [
        { id: '1', name: 'Problem-Solution Fit', description: 'Addresses real problem', maxScore: 10, weight: 35 },
        { id: '2', name: 'Market Potential', description: 'Size and accessibility', maxScore: 10, weight: 25 },
        { id: '3', name: 'Business Model', description: 'Clear revenue path', maxScore: 10, weight: 25 },
        { id: '4', name: 'Feasibility', description: 'Can be implemented', maxScore: 10, weight: 15 },
      ],
    },
  ]);

  const totalWeight = (criteria: Criterion[]) => 
    criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Scoring Rubrics
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          New Rubric
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rubrics.map((rubric) => (
          <div key={rubric.id} className="p-4 rounded-lg border border-border/50 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{rubric.name}</h4>
                  {rubric.isActive && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{rubric.description}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                    <Progress value={criterion.weight} className="h-1 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
