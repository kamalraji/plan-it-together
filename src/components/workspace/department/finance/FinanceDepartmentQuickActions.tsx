import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Receipt, 
  FileText, 
  PieChart,
  CreditCard,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface FinanceDepartmentQuickActionsProps {
  onAction?: (action: string) => void;
}

export function FinanceDepartmentQuickActions({ onAction }: FinanceDepartmentQuickActionsProps) {
  const actions = [
    { id: 'budget-review', label: 'Budget Review', icon: DollarSign, variant: 'default' as const },
    { id: 'expense-report', label: 'Expense Report', icon: Receipt, variant: 'outline' as const },
    { id: 'invoice-status', label: 'Invoice Status', icon: FileText, variant: 'outline' as const },
    { id: 'spending-analysis', label: 'Spending Analysis', icon: PieChart, variant: 'outline' as const },
    { id: 'payment-status', label: 'Payment Status', icon: CreditCard, variant: 'outline' as const },
    { id: 'approval-queue', label: 'Approval Queue', icon: ClipboardList, variant: 'outline' as const },
    { id: 'forecast', label: 'Budget Forecast', icon: TrendingUp, variant: 'outline' as const },
    { id: 'export-data', label: 'Export Data', icon: FileSpreadsheet, variant: 'outline' as const },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Finance Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="sm"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => onAction?.(action.id)}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
