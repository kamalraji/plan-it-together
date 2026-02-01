export { ITDashboard } from './ITDashboard';
export { ITStatsCards } from './ITStatsCards';
export { ITQuickActions } from './ITQuickActions';
export { SystemHealthMonitor } from './SystemHealthMonitor';
export { HelpdeskTickets } from './HelpdeskTickets';
export { SecurityAlerts } from './SecurityAlerts';
export { AccessManagement } from './AccessManagement';
export { SoftwareLicenses } from './SoftwareLicenses';

// Re-export types for external use
export type { ITTicket, ITAccessRequest, ITSystemStatus, ITSecurityAlert } from '@/hooks/useITDashboardData';
