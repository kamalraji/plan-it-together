import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, DollarSign, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeBudget {
  id: string;
  name: string;
  allocated_hours: number;
  used_hours: number;
  category: string;
  period: 'weekly' | 'monthly' | 'project';
}


const categoryColors: Record<string, string> = {
  development: 'bg-blue-500',
  design: 'bg-purple-500',
  meetings: 'bg-amber-500',
  admin: 'bg-gray-500',
  planning: 'bg-emerald-500',
  review: 'bg-pink-500',
};

export function TimeBudgetingPanel({
  budgets = [],
  onCreateBudget,
}: {
  budgets?: TimeBudget[];
  onCreateBudget?: (budget: Omit<TimeBudget, 'id' | 'used_hours'>) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    allocated_hours: 40,
    category: 'development',
    period: 'weekly' as const,
  });

  const stats = useMemo(() => {
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_hours, 0);
    const totalUsed = budgets.reduce((sum, b) => sum + b.used_hours, 0);
    const overBudget = budgets.filter((b) => b.used_hours > b.allocated_hours);

    return { totalAllocated, totalUsed, overBudget: overBudget.length };
  }, [budgets]);

  const handleCreate = () => {
    if (onCreateBudget && newBudget.name) {
      onCreateBudget(newBudget);
      setDialogOpen(false);
      setNewBudget({
        name: '',
        allocated_hours: 40,
        category: 'development',
        period: 'weekly',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAllocated}h</p>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsed}h</p>
                <p className="text-sm text-muted-foreground">Hours Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overBudget}</p>
                <p className="text-sm text-muted-foreground">Over Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time Budgets</CardTitle>
              <CardDescription>Track time allocation across categories</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Time Budget</DialogTitle>
                  <DialogDescription>
                    Set up a new time budget for tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Budget Name</Label>
                    <Input
                      placeholder="e.g., Sprint Development"
                      value={newBudget.name}
                      onChange={(e) =>
                        setNewBudget((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allocated Hours</Label>
                    <Input
                      type="number"
                      value={newBudget.allocated_hours}
                      onChange={(e) =>
                        setNewBudget((prev) => ({
                          ...prev,
                          allocated_hours: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newBudget.name}>
                    Create Budget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No budgets configured yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Create your first budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const percentage = (budget.used_hours / budget.allocated_hours) * 100;
                const isOverBudget = percentage > 100;

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            categoryColors[budget.category] || 'bg-gray-500'
                          )}
                        />
                        <span className="font-medium">{budget.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {budget.period}
                        </Badge>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isOverBudget ? 'text-red-500' : 'text-muted-foreground'
                        )}
                      >
                        {budget.used_hours}h / {budget.allocated_hours}h
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn('h-2', isOverBudget && '[&>div]:bg-red-500')}
                    />
                    {isOverBudget && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {(percentage - 100).toFixed(0)}% over budget
                      </p>
                    )}
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
