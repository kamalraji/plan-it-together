import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { DollarSign, Loader2, Plus, PieChart, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ViewBudgetTabProps {
  workspace: Workspace;
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function ViewBudgetTab({ workspace }: ViewBudgetTabProps) {
  const { 
    budget, 
    categories, 
    isLoading, 
    createBudget, 
    addCategory 
  } = useWorkspaceBudget(workspace.id);
  const { expenses } = useWorkspaceExpenses(workspace.id);

  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

  // Calculate expense breakdown by category
  const expensesByCategory = expenses
    .filter(e => e.status === 'approved')
    .reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const handleCreateBudget = () => {
    if (!newBudgetAmount) return;
    createBudget({ allocated: parseFloat(newBudgetAmount) }, {
      onSuccess: () => {
        setNewBudgetAmount('');
        setShowCreateBudget(false);
      },
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName || !newCategoryAmount || !budget) return;
    addCategory({
      budget_id: budget.id,
      name: newCategoryName,
      allocated: parseFloat(newCategoryAmount),
      used: 0,
    }, {
      onSuccess: () => {
        setNewCategoryName('');
        setNewCategoryAmount('');
        setShowAddCategory(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No budget setup yet
  if (!budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Set Up Budget
          </CardTitle>
          <CardDescription>No budget has been configured for this workspace yet.</CardDescription>
        </CardHeader>
        <CardContent>
          {showCreateBudget ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Initial Budget Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateBudget(false)}>Cancel</Button>
                <Button onClick={handleCreateBudget}>Create Budget</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateBudget(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const remaining = budget.allocated - budget.used;
  const usagePercent = budget.allocated > 0 ? (budget.used / budget.allocated) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <div className="text-2xl font-bold mt-1">₹{budget.allocated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Used</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">₹{budget.used.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">₹{remaining.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Usage</span>
            </div>
            <div className="text-2xl font-bold mt-1">{usagePercent.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>₹{budget.used.toLocaleString()} used</span>
              <span>₹{budget.allocated.toLocaleString()} total</span>
            </div>
            <Progress 
              value={usagePercent} 
              className={usagePercent > 90 ? '[&>div]:bg-red-500' : usagePercent > 70 ? '[&>div]:bg-amber-500' : ''}
            />
            {usagePercent > 90 && (
              <p className="text-sm text-red-600">⚠️ Budget is nearly exhausted!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spending by Category Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Spending by Category
            </CardTitle>
            <CardDescription>Breakdown of approved expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </RechartsChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>Allocate budget across different categories</CardDescription>
          </div>
          {!showAddCategory && (
            <Button size="sm" onClick={() => setShowAddCategory(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showAddCategory && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    placeholder="e.g., Marketing"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allocated Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={newCategoryAmount}
                    onChange={(e) => setNewCategoryAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddCategory}>Add Category</Button>
              </div>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No budget categories defined</p>
              <p className="text-sm">Add categories to track spending across different areas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category, index) => {
                const categoryUsage = category.allocated > 0 
                  ? (category.used / category.allocated) * 100 
                  : 0;
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ₹{category.used.toLocaleString()} / ₹{category.allocated.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={categoryUsage} className="h-2" />
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
