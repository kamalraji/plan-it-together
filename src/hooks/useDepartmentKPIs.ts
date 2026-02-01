import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENT_COMMITTEES } from '@/lib/workspaceHierarchy';

export interface DepartmentKPI {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export interface DepartmentInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
}

/**
 * Department-specific KPI definitions
 * Each department has unique metrics based on their responsibilities
 */
export const DEPARTMENT_KPI_DEFINITIONS: Record<string, {
  name: string;
  kpis: Omit<DepartmentKPI, 'value' | 'trend'>[];
}> = {
  operations: {
    name: 'Operations',
    kpis: [
      { id: 'venue_readiness', label: 'Venue Readiness', target: 100, unit: '%', description: 'Venue setup completion percentage' },
      { id: 'logistics_completion', label: 'Logistics Tasks', target: 100, unit: '%', description: 'Transport and material preparation' },
      { id: 'catering_confirmed', label: 'Catering Status', target: 100, unit: '%', description: 'Menu and vendor confirmations' },
      { id: 'safety_compliance', label: 'Safety Compliance', target: 100, unit: '%', description: 'Safety checks and certifications' },
    ],
  },
  growth: {
    name: 'Growth',
    kpis: [
      { id: 'registration_rate', label: 'Registration Rate', target: 100, unit: '%', description: 'Current vs target registrations' },
      { id: 'sponsor_acquisition', label: 'Sponsors Acquired', target: 10, unit: '', description: 'Number of confirmed sponsors' },
      { id: 'social_reach', label: 'Social Reach', target: 10000, unit: '', description: 'Combined social media impressions' },
      { id: 'email_engagement', label: 'Email Open Rate', target: 40, unit: '%', description: 'Email campaign engagement' },
    ],
  },
  content: {
    name: 'Content',
    kpis: [
      { id: 'speakers_confirmed', label: 'Speakers Confirmed', target: 10, unit: '', description: 'Number of confirmed speakers' },
      { id: 'sessions_ready', label: 'Sessions Ready', target: 100, unit: '%', description: 'Session content preparation' },
      { id: 'media_coverage', label: 'Media Assets', target: 50, unit: '', description: 'Photos, videos, and graphics prepared' },
      { id: 'judges_assigned', label: 'Judges Assigned', target: 5, unit: '', description: 'Number of assigned judges' },
    ],
  },
  tech_finance: {
    name: 'Tech & Finance',
    kpis: [
      { id: 'budget_utilization', label: 'Budget Used', target: 80, unit: '%', description: 'Budget utilization rate' },
      { id: 'systems_ready', label: 'Systems Ready', target: 100, unit: '%', description: 'Technical infrastructure readiness' },
      { id: 'payment_processed', label: 'Payments Processed', target: 100, unit: '%', description: 'Registration payments collected' },
      { id: 'backup_systems', label: 'Backup Ready', target: 100, unit: '%', description: 'Disaster recovery preparation' },
    ],
  },
  volunteers: {
    name: 'Volunteers',
    kpis: [
      { id: 'volunteers_recruited', label: 'Volunteers Recruited', target: 50, unit: '', description: 'Number of active volunteers' },
      { id: 'training_complete', label: 'Training Complete', target: 100, unit: '%', description: 'Volunteers who completed training' },
      { id: 'shift_coverage', label: 'Shift Coverage', target: 100, unit: '%', description: 'All shifts have assigned volunteers' },
      { id: 'retention_rate', label: 'Retention Rate', target: 90, unit: '%', description: 'Volunteer retention from previous events' },
    ],
  },
};

/**
 * Hook for department-specific metrics and KPIs
 */
export function useDepartmentKPIs(workspaceId: string, departmentId: string | undefined) {
  // Fetch department-specific data
  const { data: tasks = [] } = useQuery({
    queryKey: ['department-kpi-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  // Fetch goals for potential future use in KPI calculations
  useQuery({
    queryKey: ['department-kpi-goals', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['department-kpi-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  // Calculate KPIs based on department type
  const calculateKPIs = (): DepartmentKPI[] => {
    const deptDef = departmentId ? DEPARTMENT_KPI_DEFINITIONS[departmentId] : null;
    if (!deptDef) return [];

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const totalTasks = tasks.length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Generate KPIs with calculated values
    return deptDef.kpis.map((kpi, index) => {
      // Simulate values based on task progress and goals
      // In production, these would come from actual data sources
      let value = 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      // Use task progress as a base and add some variation
      if (kpi.unit === '%') {
        value = Math.min(100, taskProgress + (index * 5) - 10);
        value = Math.max(0, Math.round(value));
      } else {
        // For count-based KPIs, use member count or derived values
        value = Math.round((taskProgress / 100) * kpi.target);
      }

      // Determine trend based on completion
      if (taskProgress > 70) trend = 'up';
      else if (taskProgress < 30) trend = 'down';

      return {
        ...kpi,
        value,
        trend,
      };
    });
  };

  // Generate insights based on data
  const generateInsights = (): DepartmentInsight[] => {
    const insights: DepartmentInsight[] = [];
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const totalTasks = tasks.length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
    ).length;

    if (totalTasks > 0 && completedTasks / totalTasks >= 0.8) {
      insights.push({
        type: 'success',
        message: 'Department is on track with 80%+ task completion',
      });
    }

    if (blockedTasks > 0) {
      insights.push({
        type: 'warning',
        message: `${blockedTasks} task${blockedTasks > 1 ? 's' : ''} blocked and need attention`,
      });
    }

    if (overdueTasks > 0) {
      insights.push({
        type: 'warning',
        message: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} overdue`,
      });
    }

    if (members.length < 3) {
      insights.push({
        type: 'info',
        message: 'Consider adding more team members to this department',
      });
    }

    return insights;
  };

  return {
    kpis: calculateKPIs(),
    insights: generateInsights(),
    departmentInfo: departmentId ? DEPARTMENT_KPI_DEFINITIONS[departmentId] : null,
    committees: departmentId ? DEPARTMENT_COMMITTEES[departmentId] : [],
  };
}
