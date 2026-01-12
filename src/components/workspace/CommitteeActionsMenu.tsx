import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workspace } from '@/types';
import { cn } from '@/lib/utils';
import { getCommitteeConfig, getCommitteeColors } from '@/lib/committeeConfig';
import { WorkspaceTab } from './WorkspaceSidebar';
import {
  ChevronDown,
  ChevronRight,
  // Volunteers Committee
  Calendar,
  Send,
  UserCheck,
  Users,
  GraduationCap,
  Award,
  ClipboardList,
  // Finance Committee
  Receipt,
  FileText,
  CheckCircle,
  DollarSign,
  Download,
  // Registration Committee
  Scan,
  UserPlus,
  Mail,
  ListChecks,
  // Catering Committee
  Utensils,
  Package,
  ClipboardCheck,
  // Logistics Committee
  Truck,
  Map,
  Bus,
  // Facility Committee
  Building,
  Shield,
  AlertTriangle,
  // Marketing Committee
  Megaphone,
  BarChart3,
  Zap,
  // Communication Committee
  MessageSquare,
  Newspaper,
  BellRing,
  // Sponsorship Committee
  Handshake,
  FileBarChart,
  Target,
  // Social Media Committee
  Share2,
  Hash,
  TrendingUp,
  // Content Committee
  Layers,
  Upload,
  Eye,
  // Speaker Liaison Committee
  Mic,
  Plane,
  FileCheck,
  // Judge Committee
  Scale,
  Star,
  // Media Committee
  Camera,
  Image,
  // Event Committee
  Clock,
  Crown,
  Activity,
  // Technical Committee
  Monitor,
  Headphones,
  Settings,
  // IT Committee
  Key,
  Server,
  AlertCircle,
} from 'lucide-react';

interface CommitteeAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  // Navigation config
  tab?: WorkspaceTab;
  sectionId?: string;
}

interface CommitteeActionsMenuProps {
  workspace: Workspace;
  isCollapsed: boolean;
  onTabChange: (tab: WorkspaceTab) => void;
}

// Committee-specific action sets with navigation targets
const committeeActions: Record<string, CommitteeAction[]> = {
  volunteers: [
    { id: 'assign-shifts', label: 'Assign Shifts', icon: Calendar, color: 'text-pink-500', tab: 'assign-shifts' },
    { id: 'send-brief', label: 'Send Brief', icon: Send, color: 'text-rose-500', tab: 'send-brief' },
    { id: 'check-in', label: 'Check-in Volunteer', icon: UserCheck, color: 'text-emerald-500', tab: 'check-in' },
    { id: 'create-team', label: 'Create Team', icon: Users, color: 'text-blue-500', tab: 'create-team' },
    { id: 'training-status', label: 'Training Status', icon: GraduationCap, color: 'text-amber-500', tab: 'training-status' },
    { id: 'performance-review', label: 'Performance Review', icon: Award, color: 'text-yellow-500', tab: 'performance-review' },
  ],
  finance: [
    { id: 'record-expense', label: 'Record Expense', icon: Receipt, color: 'text-green-500', tab: 'record-expense' },
    { id: 'generate-report', label: 'Generate Report', icon: FileText, color: 'text-blue-500', tab: 'generate-report' },
    { id: 'approve-request', label: 'Approve Request', icon: CheckCircle, color: 'text-amber-500', tab: 'approve-request' },
    { id: 'view-budget', label: 'View Budget', icon: DollarSign, color: 'text-emerald-500', tab: 'view-budget' },
    { id: 'export-data', label: 'Export Data', icon: Download, color: 'text-purple-500', tab: 'export-data' },
  ],
  registration: [
    { id: 'scan-checkin', label: 'Scan Check-in', icon: Scan, color: 'text-teal-500', tab: 'scan-checkin' },
    { id: 'add-attendee', label: 'Add Attendee', icon: UserPlus, color: 'text-blue-500', tab: 'add-attendee' },
    { id: 'export-list', label: 'Export List', icon: Download, color: 'text-purple-500', tab: 'export-list' },
    { id: 'send-reminders', label: 'Send Reminders', icon: Mail, color: 'text-amber-500', tab: 'send-reminders' },
    { id: 'view-waitlist', label: 'View Waitlist', icon: ListChecks, color: 'text-cyan-500', tab: 'view-waitlist' },
  ],
  catering: [
    { id: 'update-menu', label: 'Update Menu', icon: Utensils, color: 'text-orange-500', tab: 'update-menu-catering' },
    { id: 'check-inventory', label: 'Check Inventory', icon: Package, color: 'text-amber-500', tab: 'check-inventory-catering' },
    { id: 'dietary-report', label: 'Dietary Report', icon: ClipboardCheck, color: 'text-emerald-500', tab: 'dietary-report-catering' },
    { id: 'confirm-headcount', label: 'Confirm Headcount', icon: Users, color: 'text-blue-500', tab: 'confirm-headcount-catering' },
  ],
  logistics: [
    { id: 'track-shipment', label: 'Track Shipment', icon: Truck, color: 'text-blue-500', tab: 'track-shipment-logistics' },
    { id: 'add-equipment', label: 'Add Equipment', icon: Package, color: 'text-amber-500', tab: 'add-equipment-logistics' },
    { id: 'schedule-transport', label: 'Schedule Transport', icon: Bus, color: 'text-green-500', tab: 'schedule-transport-logistics' },
    { id: 'add-venue', label: 'Add Venue', icon: Map, color: 'text-purple-500', tab: 'add-venue-logistics' },
    { id: 'create-checklist', label: 'Create Checklist', icon: ClipboardList, color: 'text-indigo-500', tab: 'create-checklist-logistics' },
    { id: 'generate-report', label: 'Generate Report', icon: FileText, color: 'text-emerald-500', tab: 'generate-report-logistics' },
    { id: 'report-issue', label: 'Report Issue', icon: AlertTriangle, color: 'text-red-500', tab: 'report-issue-logistics' },
    { id: 'view-timeline', label: 'View Timeline', icon: Calendar, color: 'text-cyan-500', tab: 'view-timeline-logistics' },
  ],
  facility: [
    { id: 'safety-check-facility', label: 'Safety Check', icon: Shield, color: 'text-red-500', tab: 'safety-check-facility' },
    { id: 'venue-walkthrough-facility', label: 'Venue Walkthrough', icon: Building, color: 'text-slate-500', tab: 'venue-walkthrough-facility' },
    { id: 'report-issue-facility', label: 'Report Issue', icon: AlertTriangle, color: 'text-amber-500', tab: 'report-issue-facility' },
    { id: 'room-status-facility', label: 'Room Status', icon: Map, color: 'text-blue-500', tab: 'room-status-facility' },
  ],
  marketing: [
    { id: 'schedule-post-marketing', label: 'Schedule Post', icon: Megaphone, color: 'text-pink-500', tab: 'schedule-post-marketing' },
    { id: 'view-analytics-marketing', label: 'View Analytics', icon: BarChart3, color: 'text-blue-500', tab: 'view-analytics-marketing' },
    { id: 'create-campaign-marketing', label: 'Create Campaign', icon: Zap, color: 'text-amber-500', tab: 'create-campaign-marketing' },
    { id: 'ab-test-marketing', label: 'A/B Testing', icon: Target, color: 'text-purple-500', tab: 'ab-test-marketing' },
    { id: 'edit-landing-page', label: 'Edit Landing Page', icon: Layers, color: 'text-indigo-500', tab: 'page-builder' },
  ],
  communication: [
    { id: 'send-announcement-communication', label: 'Send Announcement', icon: Megaphone, color: 'text-pink-500', tab: 'send-announcement-communication' },
    { id: 'create-email-communication', label: 'Create Email', icon: Mail, color: 'text-blue-500', tab: 'create-email-communication' },
    { id: 'draft-press-release-communication', label: 'Draft Press Release', icon: Newspaper, color: 'text-purple-500', tab: 'draft-press-release-communication' },
    { id: 'broadcast-message-communication', label: 'Broadcast Message', icon: Send, color: 'text-cyan-500', tab: 'broadcast-message-communication' },
    { id: 'schedule-update-communication', label: 'Schedule Update', icon: Calendar, color: 'text-amber-500', tab: 'schedule-update-communication' },
    { id: 'contact-stakeholders-communication', label: 'Contact Stakeholders', icon: Users, color: 'text-emerald-500', tab: 'contact-stakeholders-communication' },
  ],
  sponsorship: [
    { id: 'add-sponsor', label: 'Add Sponsor', icon: Handshake, color: 'text-amber-500', tab: 'overview' },
    { id: 'send-proposal', label: 'Send Proposal', icon: FileText, color: 'text-blue-500', tab: 'tasks' },
    { id: 'track-deliverables', label: 'Track Deliverables', icon: ClipboardCheck, color: 'text-emerald-500', tab: 'tasks' },
    { id: 'revenue-report', label: 'Revenue Report', icon: FileBarChart, color: 'text-green-500', tab: 'reports' },
  ],
  social_media: [
    { id: 'schedule-content-social', label: 'Schedule Content', icon: Share2, color: 'text-indigo-500', tab: 'schedule-content-social' },
    { id: 'monitor-hashtags-social', label: 'Monitor Hashtags', icon: Hash, color: 'text-blue-500', tab: 'monitor-hashtags-social' },
    { id: 'engagement-report-social', label: 'Engagement Report', icon: TrendingUp, color: 'text-emerald-500', tab: 'engagement-report-social' },
    { id: 'post-now-social', label: 'Post Now', icon: Send, color: 'text-pink-500', tab: 'post-now-social' },
    { id: 'manage-platforms-social', label: 'Manage Platforms', icon: Monitor, color: 'text-cyan-500', tab: 'manage-platforms-social' },
    { id: 'content-library-social', label: 'Content Library', icon: Image, color: 'text-purple-500', tab: 'content-library-social' },
  ],
  content: [
    { id: 'review-content', label: 'Review Content', icon: Eye, color: 'text-purple-500', tab: 'review-content-committee' },
    { id: 'create-template', label: 'Create Template', icon: Layers, color: 'text-blue-500', tab: 'create-template-committee' },
    { id: 'assign-reviewer', label: 'Assign Reviewer', icon: UserPlus, color: 'text-amber-500', tab: 'assign-reviewer-committee' },
    { id: 'publish', label: 'Publish', icon: Upload, color: 'text-emerald-500', tab: 'publish-content-committee' },
    { id: 'content-calendar', label: 'Content Calendar', icon: Calendar, color: 'text-cyan-500', tab: 'content-calendar-committee' },
    { id: 'content-pipeline', label: 'Pipeline', icon: Activity, color: 'text-rose-500', tab: 'content-pipeline-committee' },
    { id: 'edit-landing-page', label: 'Edit Landing Page', icon: Layers, color: 'text-indigo-500', tab: 'page-builder' },
  ],
  speaker_liaison: [
    { id: 'speaker-roster', label: 'Speaker Roster', icon: Mic, color: 'text-rose-500', tab: 'speaker-roster-committee' },
    { id: 'add-speaker', label: 'Add Speaker', icon: UserPlus, color: 'text-purple-500', tab: 'speaker-roster-committee' },
    { id: 'materials-collection', label: 'Materials', icon: FileCheck, color: 'text-orange-500', tab: 'materials-collection-committee' },
    { id: 'session-schedule', label: 'Sessions', icon: Calendar, color: 'text-emerald-500', tab: 'session-schedule-committee' },
    { id: 'travel-coordination', label: 'Travel', icon: Plane, color: 'text-cyan-500', tab: 'travel-coordination-committee' },
    { id: 'communication-log', label: 'Communication', icon: MessageSquare, color: 'text-amber-500', tab: 'communication-log-committee' },
    { id: 'send-reminder', label: 'Send Reminder', icon: Mail, color: 'text-blue-500', tab: 'communication-log-committee' },
  ],
  judge: [
    { id: 'assign-judges', label: 'Assign Judges', icon: Scale, color: 'text-emerald-500', tab: 'assign-judges-committee' },
    { id: 'setup-rubrics', label: 'Setup Rubrics', icon: ClipboardList, color: 'text-blue-500', tab: 'setup-rubrics-committee' },
    { id: 'judge-portal', label: 'Judge Portal', icon: ClipboardCheck, color: 'text-primary', tab: 'judge-scoring-portal' },
    { id: 'view-scores', label: 'View Scores', icon: Star, color: 'text-amber-500', tab: 'view-scores-committee' },
    { id: 'export-results', label: 'Export Results', icon: Download, color: 'text-purple-500', tab: 'export-results-committee' },
  ],
  media: [
    { id: 'upload-media', label: 'Upload Media', icon: Upload, color: 'text-fuchsia-500', tab: 'upload-media-committee' },
    { id: 'create-shot-list', label: 'Create Shot List', icon: Camera, color: 'text-blue-500', tab: 'create-shot-list' },
    { id: 'gallery-review', label: 'Gallery Review', icon: Image, color: 'text-purple-500', tab: 'gallery-review' },
    { id: 'export-assets', label: 'Export Assets', icon: Download, color: 'text-emerald-500', tab: 'export-assets' },
  ],
  event: [
    { id: 'update-schedule', label: 'Update Schedule', icon: Clock, color: 'text-blue-500', tab: 'update-schedule-event' },
    { id: 'brief-teams', label: 'Brief Teams', icon: BellRing, color: 'text-amber-500', tab: 'brief-teams-event' },
    { id: 'vip-tracker', label: 'VIP Tracker', icon: Crown, color: 'text-purple-500', tab: 'vip-tracker-event' },
    { id: 'run-of-show', label: 'Run of Show', icon: Activity, color: 'text-emerald-500', tab: 'run-of-show-event' },
  ],
  technical: [
    { id: 'test-equipment', label: 'Test Equipment', icon: Monitor, color: 'text-sky-500', tab: 'test-equipment' },
    { id: 'update-runsheet', label: 'Update Runsheet', icon: ClipboardList, color: 'text-blue-500', tab: 'update-runsheet' },
    { id: 'tech-check', label: 'Tech Check', icon: Settings, color: 'text-amber-500', tab: 'tech-check' },
    { id: 'issue-report', label: 'Issue Report', icon: AlertCircle, color: 'text-red-500', tab: 'issue-report' },
  ],
  it: [
    { id: 'check-systems', label: 'Check Systems', icon: Server, color: 'text-violet-500', tab: 'check-systems' },
    { id: 'update-credentials', label: 'Update Credentials', icon: Key, color: 'text-amber-500', tab: 'update-credentials' },
    { id: 'service-status', label: 'Service Status', icon: Activity, color: 'text-emerald-500', tab: 'service-status' },
    { id: 'ticket-queue', label: 'Ticket Queue', icon: Headphones, color: 'text-blue-500', tab: 'ticket-queue' },
  ],
};

// Fallback generic actions
const genericActions: CommitteeAction[] = [
  { id: 'view-tasks', label: 'View Tasks', icon: ClipboardList, color: 'text-blue-500', tab: 'tasks' },
  { id: 'manage-team', label: 'Manage Team', icon: Users, color: 'text-emerald-500', tab: 'team' },
  { id: 'send-update', label: 'Send Update', icon: MessageSquare, color: 'text-purple-500', tab: 'communication' },
  { id: 'create-report', label: 'Create Report', icon: FileText, color: 'text-amber-500', tab: 'reports' },
];

// Detect committee type from workspace name
function detectCommitteeType(workspaceName: string): string {
  const name = workspaceName.toLowerCase().replace(/\s+committee$/i, '').replace(/\s+/g, '_').trim();
  
  // Direct match first
  if (committeeActions[name]) return name;
  
  // Fuzzy matching for common variations
  if (name.includes('volunteer')) return 'volunteers';
  if (name.includes('finance') || name.includes('budget')) return 'finance';
  if (name.includes('registr') || name.includes('check-in') || name.includes('checkin')) return 'registration';
  if (name.includes('cater') || name.includes('food')) return 'catering';
  if (name.includes('logist') || name.includes('transport')) return 'logistics';
  if (name.includes('facilit') || name.includes('venue')) return 'facility';
  if (name.includes('market') || name.includes('promo')) return 'marketing';
  if (name.includes('communi') || name.includes('pr')) return 'communication';
  if (name.includes('sponsor') || name.includes('partner')) return 'sponsorship';
  if (name.includes('social') || name.includes('media')) return 'social_media';
  if (name.includes('content') || name.includes('editorial')) return 'content';
  if (name.includes('speaker') || name.includes('liaison')) return 'speaker_liaison';
  if (name.includes('judge') || name.includes('judging')) return 'judge';
  if (name.includes('media') || name.includes('photo') || name.includes('video')) return 'media';
  if (name.includes('event') || name.includes('program')) return 'event';
  if (name.includes('tech') || name.includes('av') || name.includes('audio')) return 'technical';
  if (name.includes('it') || name.includes('infra')) return 'it';
  
  return 'generic';
}

export function CommitteeActionsMenu({ workspace, isCollapsed, onTabChange }: CommitteeActionsMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const committeeType = detectCommitteeType(workspace.name);
  const actions = committeeActions[committeeType] || genericActions;
  
  // Get committee config for color theming
  const config = getCommitteeConfig(workspace.name);
  const colors = config ? getCommitteeColors(config.color) : null;
  const headerColor = colors?.text || 'text-amber-500';

  const handleAction = (action: CommitteeAction) => {
    if (!action.tab) return;
    
    // Navigate to the tab
    const newParams = new URLSearchParams(searchParams);
    
    if (action.tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', action.tab);
    }
    
    // Add section ID if specified (for scrolling to specific section)
    // Note: use lowercase 'sectionid' to match WorkspaceDashboard's useEffect
    if (action.sectionId) {
      newParams.set('sectionid', action.sectionId);
    } else {
      newParams.delete('sectionid');
    }
    
    newParams.delete('taskId');
    setSearchParams(newParams, { replace: true });
    onTabChange(action.tab);
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
        <span className={cn('uppercase tracking-wider', headerColor)}>
          Committee Actions
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
                onClick={() => handleAction(action)}
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
