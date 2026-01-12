import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialSummaryCards } from '@/components/workspace/finance/FinancialSummaryCards';
import { SpendingByCategory } from '@/components/workspace/finance/SpendingByCategory';
import { BudgetTrackerConnected } from '@/components/workspace/department/BudgetTrackerConnected';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { Wallet, TrendingUp, PieChart } from 'lucide-react';

interface BudgetOverviewTabProps {
  workspaceId: string;
}

export function BudgetOverviewTab({ workspaceId }: BudgetOverviewTabProps) {
  const { categories } = useWorkspaceBudget(workspaceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10">
          <Wallet className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Budget Overview</h1>
          <p className="text-sm text-muted-foreground">
            Complete view of budget allocation and spending
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <FinancialSummaryCards workspaceId={workspaceId} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Budget Tracker
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            By Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <BudgetTrackerConnected workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingByCategory workspaceId={workspaceId} />
            
            {/* Budget Categories Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Budget Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No budget categories defined yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => {
                      const used = cat.used || 0;
                      const allocated = cat.allocated || 0;
                      const percent = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
                      
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-muted-foreground">
                              ₹{used.toLocaleString()} / ₹{allocated.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
