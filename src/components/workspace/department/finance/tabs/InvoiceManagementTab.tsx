import { InvoiceManager } from '@/components/workspace/finance/InvoiceManager';
import { FileText } from 'lucide-react';

interface InvoiceManagementTabProps {
  workspaceId: string;
}

export function InvoiceManagementTab({ workspaceId }: InvoiceManagementTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-sm text-muted-foreground">
            Track invoices, payments, and vendor billing
          </p>
        </div>
      </div>

      {/* Invoice Manager */}
      <InvoiceManager workspaceId={workspaceId} />
    </div>
  );
}
