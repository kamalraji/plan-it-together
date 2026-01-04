import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { BudgetTracker } from './BudgetTracker';

interface BudgetTrackerConnectedProps {
  workspaceId: string;
  showBreakdown?: boolean;
}

export function BudgetTrackerConnected({ workspaceId, showBreakdown = true }: BudgetTrackerConnectedProps) {
  const { budget, categories, isLoading } = useWorkspaceBudget(workspaceId);

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <BudgetTracker
      allocated={budget?.allocated || 0}
      used={budget?.used || 0}
      currency={budget?.currency || '₹'}
      showBreakdown={showBreakdown}
      categories={categories}
    />
  );
}
