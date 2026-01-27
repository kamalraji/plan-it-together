import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface MasterChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChecklistSection {
  id: string;
  title: string;
  expanded: boolean;
  items: ChecklistItem[];
}

export function MasterChecklistModal({ open, onOpenChange }: MasterChecklistModalProps) {
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      id: 'pre-event',
      title: 'Pre-Event Setup',
      expanded: true,
      items: [
        { id: '1', task: 'Venue walkthrough complete', completed: true, assignee: 'John D.', priority: 'high' },
        { id: '2', task: 'AV equipment tested', completed: true, assignee: 'Sarah M.', priority: 'high' },
        { id: '3', task: 'Registration system ready', completed: true, assignee: 'Lisa K.', priority: 'high' },
        { id: '4', task: 'Signage installed', completed: false, assignee: 'Mike R.', priority: 'medium' },
        { id: '5', task: 'Staff briefing done', completed: false, assignee: 'David P.', priority: 'high' },
      ]
    },
    {
      id: 'during-event',
      title: 'During Event',
      expanded: false,
      items: [
        { id: '6', task: 'Welcome guests at entrance', completed: false, assignee: 'Team A', priority: 'high' },
        { id: '7', task: 'Monitor session timing', completed: false, assignee: 'Stage Mgr', priority: 'high' },
        { id: '8', task: 'Coordinate meal breaks', completed: false, assignee: 'Catering', priority: 'medium' },
        { id: '9', task: 'Handle VIP arrivals', completed: false, assignee: 'VIP Team', priority: 'high' },
        { id: '10', task: 'Photo documentation', completed: false, assignee: 'Media', priority: 'low' },
      ]
    },
    {
      id: 'post-event',
      title: 'Post-Event Breakdown',
      expanded: false,
      items: [
        { id: '11', task: 'Guest departure management', completed: false, assignee: 'Security', priority: 'medium' },
        { id: '12', task: 'Equipment breakdown', completed: false, assignee: 'AV Team', priority: 'medium' },
        { id: '13', task: 'Venue cleanup', completed: false, assignee: 'Facilities', priority: 'high' },
        { id: '14', task: 'Lost & found collection', completed: false, assignee: 'Staff', priority: 'low' },
        { id: '15', task: 'Final venue inspection', completed: false, assignee: 'Ops Lead', priority: 'high' },
      ]
    },
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) }
        : s
    ));
    toast.success('Task updated');
  };

  const getPriorityBadge = (priority: ChecklistItem['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-600 text-[10px]">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">Med</Badge>;
      case 'low':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground text-[10px]">Low</Badge>;
    }
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = sections.reduce((acc, s) => acc + s.items.filter(i => i.completed).length, 0);
  const progress = Math.round((completedItems / totalItems) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            Master Checklist - Operations Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium">{completedItems}/{totalItems} tasks</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{progress}% complete</p>
        </div>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {sections.map((section) => {
              const sectionComplete = section.items.filter(i => i.completed).length;
              const sectionTotal = section.items.length;
              
              return (
                <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto rounded-none"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-2">
                      {section.expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <Badge variant="secondary">{sectionComplete}/{sectionTotal}</Badge>
                  </Button>
                  
                  {section.expanded && (
                    <div className="border-t border-border">
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleItem(section.id, item.id)}
                            />
                            <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.task}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{item.assignee}</span>
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
