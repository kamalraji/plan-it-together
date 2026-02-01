import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortByPriorityToggleProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export function SortByPriorityToggle({ isActive, onToggle, className }: SortByPriorityToggleProps) {
  return (
    <Button
      variant={isActive ? 'secondary' : 'outline'}
      size="sm"
      onClick={onToggle}
      className={cn('gap-1.5', className)}
    >
      {isActive ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Sort by Priority</span>
      <span className="sm:hidden">Priority</span>
    </Button>
  );
}
