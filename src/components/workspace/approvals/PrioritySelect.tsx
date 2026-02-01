import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApprovalPriority } from './PriorityBadge';
import { ArrowDown, ArrowUp, AlertTriangle, Flame } from 'lucide-react';

interface PrioritySelectProps {
  value: ApprovalPriority;
  onChange: (value: ApprovalPriority) => void;
  disabled?: boolean;
}

const priorities: { value: ApprovalPriority; label: string; icon: typeof ArrowDown; color: string }[] = [
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', icon: ArrowUp, color: 'text-blue-500' },
  { value: 'high', label: 'High', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', icon: Flame, color: 'text-red-500' },
];

export function PrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32 h-8 text-sm">
        <SelectValue placeholder="Priority" />
      </SelectTrigger>
      <SelectContent>
        {priorities.map((p) => {
          const Icon = p.icon;
          return (
            <SelectItem key={p.value} value={p.value}>
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${p.color}`} />
                <span>{p.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
