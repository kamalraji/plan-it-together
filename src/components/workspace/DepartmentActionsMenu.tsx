import React, { useState } from 'react';
import { Workspace } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  // Volunteers Department
  Users,
  Calendar,
  Megaphone,
  FileBarChart,
  ClipboardCheck,
  GraduationCap,
  Award,
  Mail,
  // Tech Department
  Server,
  Wifi,
  Shield,
  Monitor,
  HardDrive,
  AlertTriangle,
  Settings,
  FileText,
  // Operations Department
  ClipboardList,
  Truck,
  UtensilsCrossed,
  Building2,
  AlertCircle,
  Users2,
  BarChart3,
  // Finance Department
  DollarSign,
  Receipt,
  PieChart,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  // Growth Department
  Share2,
  Handshake,
  MessageSquare,
  Target,
  // Content Department
  Gavel,
  Plus,
  Upload,
  UserPlus,
  Star,
} from 'lucide-react';

interface DepartmentAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface DepartmentActionsMenuProps {
  workspace: Workspace;
  isCollapsed: boolean;
}

// Detect department type from workspace name
const detectDepartmentType = (workspaceName: string): string => {
  const name = workspaceName.toLowerCase();
  if (name.includes('volunteer')) return 'volunteers';
  if (name.includes('tech') || name.includes('technology') || name.includes('it')) return 'tech';
  if (name.includes('operation')) return 'operations';
  if (name.includes('finance') || name.includes('budget')) return 'finance';
  if (name.includes('growth') || name.includes('marketing') || name.includes('sponsor')) return 'growth';
  if (name.includes('content') || name.includes('media') || name.includes('judge')) return 'content';
  return 'generic';
};

// Department-specific action sets
const departmentActions: Record<string, DepartmentAction[]> = {
  volunteers: [
    { id: 'view-committees', label: 'View Committees', icon: Users, color: 'text-rose-500' },
    { id: 'shift-overview', label: 'Shift Overview', icon: Calendar, color: 'text-pink-500' },
    { id: 'mass-announcement', label: 'Mass Announcement', icon: Megaphone, color: 'text-purple-500' },
    { id: 'hours-report', label: 'Hours Report', icon: FileBarChart, color: 'text-blue-500' },
    { id: 'approve-timesheets', label: 'Approve Timesheets', icon: ClipboardCheck, color: 'text-emerald-500' },
    { id: 'training-schedule', label: 'Training Schedule', icon: GraduationCap, color: 'text-amber-500' },
    { id: 'recognition', label: 'Recognition', icon: Award, color: 'text-yellow-500' },
    { id: 'recruitment', label: 'Recruitment', icon: Mail, color: 'text-indigo-500' },
  ],
  tech: [
    { id: 'system-check', label: 'System Health Check', icon: Server, color: 'text-blue-500' },
    { id: 'network-status', label: 'Network Status', icon: Wifi, color: 'text-cyan-500' },
    { id: 'security-audit', label: 'Security Audit', icon: Shield, color: 'text-red-500' },
    { id: 'equipment-report', label: 'Equipment Report', icon: Monitor, color: 'text-purple-500' },
    { id: 'backup-status', label: 'Backup Status', icon: HardDrive, color: 'text-gray-500' },
    { id: 'incident-report', label: 'Report Incident', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'config-review', label: 'Config Review', icon: Settings, color: 'text-emerald-500' },
    { id: 'documentation', label: 'Documentation', icon: FileText, color: 'text-indigo-500' },
  ],
  operations: [
    { id: 'event-briefing', label: 'Event Briefing', icon: ClipboardList, color: 'text-orange-500' },
    { id: 'logistics-status', label: 'Logistics Status', icon: Truck, color: 'text-blue-500' },
    { id: 'catering-update', label: 'Catering Update', icon: UtensilsCrossed, color: 'text-amber-500' },
    { id: 'facility-check', label: 'Facility Check', icon: Building2, color: 'text-purple-500' },
    { id: 'master-checklist', label: 'Master Checklist', icon: ClipboardCheck, color: 'text-emerald-500' },
    { id: 'incident-report', label: 'Incident Report', icon: AlertCircle, color: 'text-red-500' },
    { id: 'team-roster', label: 'Team Roster', icon: Users2, color: 'text-cyan-500' },
    { id: 'ops-report', label: 'Ops Report', icon: BarChart3, color: 'text-indigo-500' },
  ],
  finance: [
    { id: 'budget-review', label: 'Budget Review', icon: DollarSign, color: 'text-green-500' },
    { id: 'expense-report', label: 'Expense Report', icon: Receipt, color: 'text-blue-500' },
    { id: 'invoice-status', label: 'Invoice Status', icon: FileText, color: 'text-purple-500' },
    { id: 'spending-analysis', label: 'Spending Analysis', icon: PieChart, color: 'text-amber-500' },
    { id: 'payment-status', label: 'Payment Status', icon: CreditCard, color: 'text-cyan-500' },
    { id: 'approval-queue', label: 'Approval Queue', icon: ClipboardList, color: 'text-orange-500' },
    { id: 'forecast', label: 'Budget Forecast', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'export-data', label: 'Export Data', icon: FileSpreadsheet, color: 'text-indigo-500' },
  ],
  growth: [
    { id: 'launch-campaign', label: 'Launch Campaign', icon: Megaphone, color: 'text-blue-500' },
    { id: 'schedule-content', label: 'Schedule Content', icon: Share2, color: 'text-pink-500' },
    { id: 'add-sponsor', label: 'Add Sponsor', icon: Handshake, color: 'text-amber-500' },
    { id: 'send-announcement', label: 'Send Announcement', icon: MessageSquare, color: 'text-emerald-500' },
    { id: 'view-analytics', label: 'View Analytics', icon: BarChart3, color: 'text-violet-500' },
    { id: 'set-goals', label: 'Set Goals', icon: Target, color: 'text-cyan-500' },
    { id: 'manage-partners', label: 'Manage Partners', icon: Users, color: 'text-indigo-500' },
    { id: 'pr-outreach', label: 'PR Outreach', icon: MessageSquare, color: 'text-orange-500' },
  ],
  content: [
    { id: 'create-content', label: 'Create Content', icon: Plus, color: 'text-blue-500' },
    { id: 'assign-judges', label: 'Assign Judges', icon: Gavel, color: 'text-amber-500' },
    { id: 'enter-score', label: 'Enter Score', icon: Star, color: 'text-yellow-500' },
    { id: 'upload-media', label: 'Upload Media', icon: Upload, color: 'text-purple-500' },
    { id: 'add-speaker', label: 'Add Speaker', icon: UserPlus, color: 'text-emerald-500' },
    { id: 'schedule-session', label: 'Schedule Session', icon: Calendar, color: 'text-pink-500' },
    { id: 'view-rubrics', label: 'View Rubrics', icon: ClipboardList, color: 'text-cyan-500' },
  ],
  generic: [
    { id: 'view-overview', label: 'View Overview', icon: BarChart3, color: 'text-blue-500' },
    { id: 'manage-team', label: 'Manage Team', icon: Users, color: 'text-emerald-500' },
    { id: 'create-task', label: 'Create Task', icon: Plus, color: 'text-purple-500' },
    { id: 'send-message', label: 'Send Message', icon: MessageSquare, color: 'text-amber-500' },
  ],
};

// Department display names and colors
const departmentMeta: Record<string, { name: string; color: string }> = {
  volunteers: { name: 'Volunteer Actions', color: 'text-rose-500' },
  tech: { name: 'Tech Actions', color: 'text-blue-500' },
  operations: { name: 'Operations Actions', color: 'text-orange-500' },
  finance: { name: 'Finance Actions', color: 'text-green-500' },
  growth: { name: 'Growth Actions', color: 'text-emerald-500' },
  content: { name: 'Content Actions', color: 'text-purple-500' },
  generic: { name: 'Department Actions', color: 'text-primary' },
};

export function DepartmentActionsMenu({ workspace, isCollapsed }: DepartmentActionsMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const departmentType = detectDepartmentType(workspace.name);
  const actions = departmentActions[departmentType] || departmentActions.generic;
  const meta = departmentMeta[departmentType] || departmentMeta.generic;

  const handleAction = (_actionId: string, label: string) => {
    toast.info(`${label} action coming soon`);
  };

  if (isCollapsed) {
    return null; // Don't render in collapsed state
  }

  return (
    <div className="mt-1">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
      >
        <span className={cn('uppercase tracking-wider', meta.color)}>
          {meta.name}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className="mt-1 space-y-0.5 px-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id, action.label)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', action.color)} />
                <span className="truncate text-foreground/80 group-hover:text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
