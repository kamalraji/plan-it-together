import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GLOBAL_SHORTCUTS, formatShortcutKey, KeyboardShortcut } from '@/hooks/useGlobalKeyboardShortcuts';
import { Keyboard, Navigation, Zap, ListTodo, Settings } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons = {
  navigation: Navigation,
  actions: Zap,
  task: ListTodo,
  general: Settings,
};

const categoryLabels = {
  navigation: 'Navigation',
  actions: 'Quick Actions',
  task: 'Task Management',
  general: 'General',
};

function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm">
        {formatShortcutKey(shortcut)}
      </kbd>
    </div>
  );
}

function ShortcutCategory({ 
  category, 
  shortcuts 
}: { 
  category: keyof typeof categoryLabels; 
  shortcuts: KeyboardShortcut[] 
}) {
  const Icon = categoryIcons[category];
  
  if (shortcuts.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {categoryLabels[category]}
      </div>
      <div className="space-y-1">
        {shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const groupedShortcuts = GLOBAL_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <ShortcutCategory 
            category="navigation" 
            shortcuts={groupedShortcuts.navigation || []} 
          />
          <ShortcutCategory 
            category="actions" 
            shortcuts={groupedShortcuts.actions || []} 
          />
          <ShortcutCategory 
            category="task" 
            shortcuts={groupedShortcuts.task || []} 
          />
          <ShortcutCategory 
            category="general" 
            shortcuts={groupedShortcuts.general || []} 
          />
        </div>
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> anytime to show this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
