import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  FileBarChart, 
  Download, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

interface OpsReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpsReportModal({ open, onOpenChange }: OpsReportModalProps) {
  const [generating, setGenerating] = useState(false);

  const metrics = {
    tasksCompleted: 42,
    totalTasks: 58,
    staffOnDuty: 24,
    totalStaff: 32,
    incidentsResolved: 3,
    incidentsOpen: 1,
    guestsCheckedIn: 187,
    expectedGuests: 250,
  };

  const highlights = [
    { type: 'success', message: 'Registration opened on time at 10:00 AM' },
    { type: 'success', message: 'AV equipment tested and verified' },
    { type: 'warning', message: 'Minor power issue in Hall B - resolved' },
    { type: 'success', message: 'Catering setup completed ahead of schedule' },
    { type: 'info', message: 'VIP lounge prepared for 35 guests' },
  ];

  const handleExport = (format: 'pdf' | 'csv') => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    }, 1500);
  };

  const handlePrint = () => {
    toast.info('Preparing print view...');
    window.print();
  };

  const taskProgress = Math.round((metrics.tasksCompleted / metrics.totalTasks) * 100);
  const checkInProgress = Math.round((metrics.guestsCheckedIn / metrics.expectedGuests) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-orange-500" />
            Operations Report - Event Summary
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 px-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Report Generated</p>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge variant="outline" className="text-success border-success">
            <Clock className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>

        <ScrollArea className="h-[380px] pr-4">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Task Completion</span>
                    <span className="text-sm font-medium">{metrics.tasksCompleted}/{metrics.totalTasks}</span>
                  </div>
                  <Progress value={taskProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{taskProgress}% complete</p>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Guest Check-in</span>
                    <span className="text-sm font-medium">{metrics.guestsCheckedIn}/{metrics.expectedGuests}</span>
                  </div>
                  <Progress value={checkInProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{checkInProgress}% arrived</p>
                </div>

                <div className="p-4 rounded-lg border border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.staffOnDuty}/{metrics.totalStaff}</p>
                    <p className="text-xs text-muted-foreground">Staff on duty</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.incidentsResolved}/{metrics.incidentsResolved + metrics.incidentsOpen}</p>
                    <p className="text-xs text-muted-foreground">Incidents resolved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Highlights */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Event Highlights</h4>
              <div className="space-y-2">
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      highlight.type === 'success' ? 'bg-success/5' :
                      highlight.type === 'warning' ? 'bg-warning/5' : 'bg-info/5'
                    }`}
                  >
                    {highlight.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    ) : highlight.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-info flex-shrink-0" />
                    )}
                    <span className="text-sm">{highlight.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Performance Summary</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-success">98%</p>
                  <p className="text-xs text-muted-foreground">On-time Rate</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-info">4.8/5</p>
                  <p className="text-xs text-muted-foreground">Team Rating</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-primary">15min</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')}
            disabled={generating}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => handleExport('pdf')}
            disabled={generating}
          >
            <Download className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
