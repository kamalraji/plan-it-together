import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ListChecks, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface RunOfShowChecklistProps {
  workspaceId?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  phase: 'pre-event' | 'day-of' | 'during' | 'post-event';
  items: { id: string; task: string; completed: boolean; critical?: boolean }[];
}

export function RunOfShowChecklist(_props: RunOfShowChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['day-of']);

  const sections: ChecklistSection[] = [
    {
      id: 'pre-event',
      title: 'Pre-Event Setup',
      phase: 'pre-event',
      items: [
        { id: '1', task: 'Venue walkthrough completed', completed: true },
        { id: '2', task: 'AV equipment tested', completed: true },
        { id: '3', task: 'Signage placed at all entry points', completed: true },
        { id: '4', task: 'Catering order confirmed', completed: false, critical: true },
      ],
    },
    {
      id: 'day-of',
      title: 'Day-Of Execution',
      phase: 'day-of',
      items: [
        { id: '5', task: 'Registration desk setup', completed: true },
        { id: '6', task: 'VIP welcome kits prepared', completed: false, critical: true },
        { id: '7', task: 'Staff briefing completed', completed: false },
        { id: '8', task: 'Emergency contacts distributed', completed: true },
        { id: '9', task: 'Photography team briefed', completed: false },
      ],
    },
    {
      id: 'during',
      title: 'During Event',
      phase: 'during',
      items: [
        { id: '10', task: 'Session timing monitored', completed: false },
        { id: '11', task: 'Break announcements made', completed: false },
        { id: '12', task: 'VIP escort coordination', completed: false },
        { id: '13', task: 'Issue log updated', completed: false },
      ],
    },
    {
      id: 'post-event',
      title: 'Post-Event Wrap',
      phase: 'post-event',
      items: [
        { id: '14', task: 'Venue walkthrough (damage check)', completed: false },
        { id: '15', task: 'Thank you notes sent', completed: false },
        { id: '16', task: 'Debrief meeting scheduled', completed: false },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getPhaseColor = (phase: ChecklistSection['phase']) => {
    switch (phase) {
      case 'pre-event': return 'bg-purple-500/10 text-purple-600';
      case 'day-of': return 'bg-blue-500/10 text-blue-600';
      case 'during': return 'bg-emerald-500/10 text-emerald-600';
      case 'post-event': return 'bg-amber-500/10 text-amber-600';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-blue-500" />
            Run of Show Checklist
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {sections.flatMap(s => s.items).filter(i => i.completed).length} / {sections.flatMap(s => s.items).length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {sections.map((section) => {
          const completedCount = section.items.filter(i => i.completed).length;
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div key={section.id} className="border border-border/50 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                onClick={() => toggleSection(section.id)}
                className="w-full justify-between h-auto py-3 px-4 hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-xs ${getPhaseColor(section.phase)}`}>
                    {section.phase.replace('-', ' ')}
                  </Badge>
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {completedCount}/{section.items.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md ${
                        item.completed ? 'bg-muted/30' : 'bg-background/50'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed}
                        className={item.completed ? 'border-emerald-500 data-[state=checked]:bg-emerald-500' : ''}
                      />
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.task}
                      </span>
                      {item.critical && !item.completed && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
