import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Receipt, 
  FileText, 
  Download,
  Calculator,
  BarChart3
} from 'lucide-react';

interface FinanceQuickActionsProps {
  onAddExpense?: () => void;
  onCreateInvoice?: () => void;
  onGenerateReport?: () => void;
}

export function FinanceQuickActions({ 
  onAddExpense, 
  onCreateInvoice, 
  onGenerateReport 
}: FinanceQuickActionsProps) {
  const actions = [
    {
      label: 'Add Expense',
      icon: Receipt,
      onClick: onAddExpense,
      variant: 'default' as const,
    },
    {
      label: 'Create Invoice',
      icon: FileText,
      onClick: onCreateInvoice,
      variant: 'outline' as const,
    },
    {
      label: 'Budget Report',
      icon: BarChart3,
      onClick: onGenerateReport,
      variant: 'outline' as const,
    },
    {
      label: 'Export Data',
      icon: Download,
      variant: 'ghost' as const,
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-3 flex-col gap-1.5 text-xs"
              onClick={action.onClick}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
