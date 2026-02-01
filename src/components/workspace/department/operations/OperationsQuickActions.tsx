import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Truck, 
  UtensilsCrossed, 
  Building2,
  ClipboardList,
  AlertCircle,
  Users,
  FileBarChart
} from 'lucide-react';
import { EventBriefingModal } from './modals/EventBriefingModal';
import { LogisticsStatusModal } from './modals/LogisticsStatusModal';
import { CateringUpdateModal } from './modals/CateringUpdateModal';
import { FacilityCheckModal } from './modals/FacilityCheckModal';
import { MasterChecklistModal } from './modals/MasterChecklistModal';
import { IncidentReportModal } from './modals/IncidentReportModal';
import { TeamRosterModal } from './modals/TeamRosterModal';
import { OpsReportModal } from './modals/OpsReportModal';

type ModalType = 
  | 'eventBriefing' 
  | 'logistics' 
  | 'catering' 
  | 'facility' 
  | 'checklist' 
  | 'incident' 
  | 'roster' 
  | 'report' 
  | null;

export function OperationsQuickActions() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const actions = [
    {
      id: 'eventBriefing' as ModalType,
      label: 'Event Briefing',
      description: 'Review day-of schedule',
      icon: CalendarDays,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
    },
    {
      id: 'logistics' as ModalType,
      label: 'Logistics Status',
      description: 'Check shipment tracking',
      icon: Truck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hoverColor: 'hover:bg-green-500/20',
    },
    {
      id: 'catering' as ModalType,
      label: 'Catering Update',
      description: 'View meal schedules',
      icon: UtensilsCrossed,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverColor: 'hover:bg-amber-500/20',
    },
    {
      id: 'facility' as ModalType,
      label: 'Facility Check',
      description: 'Safety & setup status',
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
    },
    {
      id: 'checklist' as ModalType,
      label: 'Master Checklist',
      description: 'All operations tasks',
      icon: ClipboardList,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      hoverColor: 'hover:bg-indigo-500/20',
    },
    {
      id: 'incident' as ModalType,
      label: 'Incident Report',
      description: 'Log issues & alerts',
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      hoverColor: 'hover:bg-red-500/20',
    },
    {
      id: 'roster' as ModalType,
      label: 'Team Roster',
      description: 'Staff assignments',
      icon: Users,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      hoverColor: 'hover:bg-teal-500/20',
    },
    {
      id: 'report' as ModalType,
      label: 'Ops Report',
      description: 'Generate summary',
      icon: FileBarChart,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      hoverColor: 'hover:bg-orange-500/20',
    },
  ];

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Operations Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className={`flex flex-col h-auto py-3 px-2 ${action.bgColor} ${action.hoverColor} border-0`}
                onClick={() => setActiveModal(action.id)}
              >
                <action.icon className={`h-5 w-5 mb-1.5 ${action.color}`} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
                <span className="text-[10px] text-muted-foreground">{action.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EventBriefingModal 
        open={activeModal === 'eventBriefing'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <LogisticsStatusModal 
        open={activeModal === 'logistics'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <CateringUpdateModal 
        open={activeModal === 'catering'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <FacilityCheckModal 
        open={activeModal === 'facility'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <MasterChecklistModal 
        open={activeModal === 'checklist'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <IncidentReportModal 
        open={activeModal === 'incident'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <TeamRosterModal 
        open={activeModal === 'roster'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <OpsReportModal 
        open={activeModal === 'report'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
    </>
  );
}
