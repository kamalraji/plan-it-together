import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Milestone {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  due_date: string | null;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export type EventPhase = 'pre_event' | 'during_event' | 'post_event';

export interface Checklist {
  id: string;
  workspace_id: string;
  title: string;
  committee_type: string | null;
  phase: EventPhase;
  items: ChecklistItem[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export function useMilestones(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const milestonesQuery = useQuery({
    queryKey: ['workspace-milestones', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!workspaceId,
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .insert(milestone)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
      toast({ title: 'Milestone created' });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Milestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_milestones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
      toast({ title: 'Milestone removed' });
    },
  });

  return {
    milestones: milestonesQuery.data ?? [],
    isLoading: milestonesQuery.isLoading,
    createMilestone: createMilestoneMutation.mutate,
    updateMilestone: updateMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
  };
}

export function useGoals(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const goalsQuery = useQuery({
    queryKey: ['workspace-goals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!workspaceId,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .insert(goal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast({ title: 'Goal created' });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast({ title: 'Goal removed' });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
  };
}

export function useChecklists(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checklistsQuery = useQuery({
    queryKey: ['workspace-checklists', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(c => ({
        ...c,
        items: (Array.isArray(c.items) ? c.items : []) as unknown as ChecklistItem[],
      })) as Checklist[];
    },
    enabled: !!workspaceId,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (checklist: Omit<Checklist, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .insert({
          ...checklist,
          items: JSON.stringify(checklist.items),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
      toast({ title: 'Checklist created' });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<Checklist> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .update({
          ...updates,
          ...(items ? { items: JSON.stringify(items) } : {}),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({
      checklistId,
      itemId,
      completed,
      userId,
    }: {
      checklistId: string;
      itemId: string;
      completed: boolean;
      userId: string;
    }) => {
      const checklist = checklistsQuery.data?.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              completedBy: completed ? userId : undefined,
            }
          : item
      );

      const { data, error } = await supabase
        .from('workspace_checklists')
        .update({ items: JSON.stringify(updatedItems) })
        .eq('id', checklistId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
    },
  });

  return {
    checklists: checklistsQuery.data ?? [],
    isLoading: checklistsQuery.isLoading,
    createChecklist: createChecklistMutation.mutate,
    updateChecklist: updateChecklistMutation.mutate,
    toggleItem: toggleItemMutation.mutate,
  };
}

// Pre-built checklist templates for different committee types with phase info
export const COMMITTEE_CHECKLIST_TEMPLATES: Record<string, { title: string; phase: EventPhase; items: string[] }[]> = {
  // ===== OPERATIONS DEPARTMENT =====
  event: [
    {
      title: 'Event Coordination',
      phase: 'pre_event',
      items: [
        'Finalize event schedule',
        'Brief all committee leads',
        'Prepare backup plans',
        'Setup communication channels',
        'Confirm VIP arrangements',
      ],
    },
    {
      title: 'Day-of Execution',
      phase: 'during_event',
      items: [
        'Morning team briefing',
        'Verify all stations staffed',
        'Coordinate opening ceremony',
        'Monitor event timeline',
        'Conduct closing procedures',
      ],
    },
    {
      title: 'Post-Event Wrap-up',
      phase: 'post_event',
      items: [
        'Collect feedback forms',
        'Debrief with committee leads',
        'Document lessons learned',
        'Send thank you notes',
        'Archive event materials',
      ],
    },
  ],
  catering: [
    {
      title: 'Vendor Setup',
      phase: 'pre_event',
      items: [
        'Finalize menu with vendors',
        'Confirm dietary restrictions handled',
        'Schedule delivery times',
        'Arrange serving equipment',
        'Confirm head count',
      ],
    },
    {
      title: 'Day-of Preparation',
      phase: 'during_event',
      items: [
        'Setup buffet stations',
        'Check food temperature',
        'Arrange refreshment stations',
        'Prepare waste disposal',
        'Brief serving staff',
      ],
    },
    {
      title: 'Catering Wrap-up',
      phase: 'post_event',
      items: [
        'Coordinate leftover food donation',
        'Settle vendor invoices',
        'Collect vendor feedback',
        'Return rented equipment',
        'Document costs and quantities',
      ],
    },
  ],
  logistics: [
    {
      title: 'Venue Preparation',
      phase: 'pre_event',
      items: [
        'Confirm venue booking',
        'Arrange seating layout',
        'Setup AV equipment',
        'Test sound system',
        'Prepare signage',
      ],
    },
    {
      title: 'Transport & Materials',
      phase: 'during_event',
      items: [
        'Arrange transport for equipment',
        'Prepare registration desk',
        'Print name badges',
        'Setup check-in system',
        'Coordinate parking',
      ],
    },
    {
      title: 'Logistics Teardown',
      phase: 'post_event',
      items: [
        'Coordinate equipment return',
        'Inspect venue for damages',
        'Collect all signage',
        'Return rented items',
        'Complete venue walkthrough',
      ],
    },
  ],
  facility: [
    {
      title: 'Facility Management',
      phase: 'pre_event',
      items: [
        'Inspect venue condition',
        'Confirm cleaning schedule',
        'Check emergency exits',
        'Verify fire safety equipment',
        'Setup first aid station',
      ],
    },
    {
      title: 'Safety & Compliance',
      phase: 'during_event',
      items: [
        'Review safety protocols',
        'Brief security team',
        'Post emergency signage',
        'Check accessibility routes',
        'Verify insurance coverage',
      ],
    },
    {
      title: 'Facility Closeout',
      phase: 'post_event',
      items: [
        'Final venue inspection',
        'Document any damages',
        'Coordinate deep cleaning',
        'Return keys and access cards',
        'Submit facility report',
      ],
    },
  ],

  // ===== GROWTH DEPARTMENT =====
  marketing: [
    {
      title: 'Pre-Event Marketing',
      phase: 'pre_event',
      items: [
        'Design promotional materials',
        'Schedule social media posts',
        'Send email invitations',
        'Create event landing page',
        'Prepare press release',
      ],
    },
    {
      title: 'Event Coverage',
      phase: 'during_event',
      items: [
        'Arrange photographer/videographer',
        'Setup live streaming',
        'Prepare social media templates',
        'Coordinate speaker interviews',
        'Collect attendee testimonials',
      ],
    },
    {
      title: 'Post-Event Marketing',
      phase: 'post_event',
      items: [
        'Send follow-up emails',
        'Publish event recap blog',
        'Share highlights on social media',
        'Create case studies',
        'Analyze marketing metrics',
      ],
    },
  ],
  sponsorship: [
    {
      title: 'Sponsor Acquisition',
      phase: 'pre_event',
      items: [
        'Create sponsorship tiers document',
        'Identify target sponsors',
        'Send sponsorship proposals',
        'Schedule sponsor meetings',
        'Finalize sponsor agreements',
      ],
    },
    {
      title: 'Sponsor Deliverables',
      phase: 'during_event',
      items: [
        'Collect sponsor logos and assets',
        'Setup sponsor booths/displays',
        'Prepare sponsor recognition slides',
        'Coordinate sponsor speaking slots',
        'Facilitate sponsor networking',
      ],
    },
    {
      title: 'Sponsor Follow-up',
      phase: 'post_event',
      items: [
        'Send post-event sponsor reports',
        'Share event photos with sponsors',
        'Collect sponsor feedback',
        'Discuss renewal opportunities',
        'Send thank you gifts',
      ],
    },
  ],
  registration: [
    {
      title: 'Pre-Event Setup',
      phase: 'pre_event',
      items: [
        'Configure registration platform',
        'Setup ticket types and pricing',
        'Create registration forms',
        'Test payment processing',
        'Prepare confirmation emails',
      ],
    },
    {
      title: 'Check-in Operations',
      phase: 'during_event',
      items: [
        'Print attendee badges',
        'Setup check-in stations',
        'Train check-in volunteers',
        'Prepare walk-in registration',
        'Handle waitlist management',
      ],
    },
    {
      title: 'Registration Wrap-up',
      phase: 'post_event',
      items: [
        'Export final attendee list',
        'Process refunds if needed',
        'Send attendance certificates',
        'Archive registration data',
        'Generate attendance report',
      ],
    },
  ],
  social_media: [
    {
      title: 'Content Planning',
      phase: 'pre_event',
      items: [
        'Create content calendar',
        'Design post templates',
        'Prepare event hashtags',
        'Schedule pre-event posts',
        'Setup social listening',
      ],
    },
    {
      title: 'Live Coverage',
      phase: 'during_event',
      items: [
        'Assign live posting shifts',
        'Capture behind-the-scenes content',
        'Engage with attendee posts',
        'Monitor mentions and hashtags',
        'Create real-time stories/reels',
      ],
    },
    {
      title: 'Post-Event Content',
      phase: 'post_event',
      items: [
        'Share event highlights',
        'Thank followers and attendees',
        'Compile user-generated content',
        'Create engagement report',
        'Plan follow-up content series',
      ],
    },
  ],
  communication: [
    {
      title: 'Communications Planning',
      phase: 'pre_event',
      items: [
        'Create communications timeline',
        'Draft announcement emails',
        'Prepare media kit',
        'Schedule press outreach',
        'Setup communication channels',
      ],
    },
    {
      title: 'Event Communications',
      phase: 'during_event',
      items: [
        'Send day-of reminders',
        'Coordinate announcements',
        'Handle media inquiries',
        'Manage emergency communications',
        'Document key moments',
      ],
    },
    {
      title: 'Post-Event Communications',
      phase: 'post_event',
      items: [
        'Send thank you emails',
        'Share event recap',
        'Distribute press coverage',
        'Collect testimonials',
        'Archive communications',
      ],
    },
  ],

  // ===== CONTENT DEPARTMENT =====
  content: [
    {
      title: 'Content Development',
      phase: 'pre_event',
      items: [
        'Define session topics and tracks',
        'Create presentation templates',
        'Gather speaker materials',
        'Review and edit presentations',
        'Prepare handout materials',
      ],
    },
    {
      title: 'Session Management',
      phase: 'during_event',
      items: [
        'Create session schedule',
        'Assign rooms and timeslots',
        'Prepare session signage',
        'Brief session moderators',
        'Handle session logistics',
      ],
    },
    {
      title: 'Content Archive',
      phase: 'post_event',
      items: [
        'Collect session recordings',
        'Edit and publish content',
        'Create resource library',
        'Gather presenter feedback',
        'Document content performance',
      ],
    },
  ],
  speaker_liaison: [
    {
      title: 'Speaker Coordination',
      phase: 'pre_event',
      items: [
        'Send speaker invitations',
        'Collect speaker bios and headshots',
        'Confirm speaker availability',
        'Arrange speaker travel and accommodation',
        'Schedule speaker rehearsals',
      ],
    },
    {
      title: 'Day-of Support',
      phase: 'during_event',
      items: [
        'Setup speaker green room',
        'Prepare speaker gifts',
        'Brief speakers on logistics',
        'Coordinate speaker introductions',
        'Handle speaker Q&A logistics',
      ],
    },
    {
      title: 'Speaker Follow-up',
      phase: 'post_event',
      items: [
        'Send speaker thank you notes',
        'Share session recordings',
        'Collect speaker feedback',
        'Process speaker payments',
        'Update speaker database',
      ],
    },
  ],
  media: [
    {
      title: 'Pre-Production',
      phase: 'pre_event',
      items: [
        'Book photographers/videographers',
        'Create shot list',
        'Scout venue for angles',
        'Prepare media release forms',
        'Setup photo backdrop',
      ],
    },
    {
      title: 'Event Coverage',
      phase: 'during_event',
      items: [
        'Capture keynote sessions',
        'Document networking moments',
        'Take VIP photos',
        'Cover all major activities',
        'Backup media files regularly',
      ],
    },
    {
      title: 'Post-Production',
      phase: 'post_event',
      items: [
        'Edit and deliver highlight reel',
        'Process and organize photos',
        'Create recap video',
        'Archive all media assets',
        'Distribute to stakeholders',
      ],
    },
  ],
  judge: [
    {
      title: 'Judging Preparation',
      phase: 'pre_event',
      items: [
        'Recruit qualified judges',
        'Create judging criteria and rubric',
        'Prepare scoring sheets',
        'Brief judges on process',
        'Schedule judging sessions',
      ],
    },
    {
      title: 'Judging Execution',
      phase: 'during_event',
      items: [
        'Distribute submissions to judges',
        'Coordinate judging rounds',
        'Collect and tally scores',
        'Resolve ties and disputes',
        'Prepare winner announcements',
      ],
    },
    {
      title: 'Judging Wrap-up',
      phase: 'post_event',
      items: [
        'Finalize and announce results',
        'Send certificates to winners',
        'Thank judges formally',
        'Document judging process',
        'Archive all submissions',
      ],
    },
  ],

  // ===== TECH & FINANCE DEPARTMENT =====
  technical: [
    {
      title: 'Technical Setup',
      phase: 'pre_event',
      items: [
        'Setup WiFi and networking',
        'Configure AV equipment',
        'Test microphones and projectors',
        'Setup livestream infrastructure',
        'Prepare backup equipment',
      ],
    },
    {
      title: 'Technical Support',
      phase: 'during_event',
      items: [
        'Create tech support schedule',
        'Setup help desk station',
        'Prepare troubleshooting guides',
        'Monitor stream quality',
        'Handle technical emergencies',
      ],
    },
    {
      title: 'Technical Teardown',
      phase: 'post_event',
      items: [
        'Breakdown and pack equipment',
        'Return rented equipment',
        'Document technical issues',
        'Archive recordings',
        'Create tech lessons learned',
      ],
    },
  ],
  it: [
    {
      title: 'IT Infrastructure',
      phase: 'pre_event',
      items: [
        'Setup event management systems',
        'Configure access credentials',
        'Test integrations',
        'Prepare backup procedures',
        'Document IT architecture',
      ],
    },
    {
      title: 'IT Operations',
      phase: 'during_event',
      items: [
        'Monitor system performance',
        'Handle access issues',
        'Support registration systems',
        'Manage data collection',
        'Ensure security protocols',
      ],
    },
    {
      title: 'IT Wrap-up',
      phase: 'post_event',
      items: [
        'Revoke temporary access',
        'Export and backup data',
        'Generate system reports',
        'Document incidents',
        'Archive configurations',
      ],
    },
  ],
  finance: [
    {
      title: 'Budget Management',
      phase: 'pre_event',
      items: [
        'Create detailed budget spreadsheet',
        'Track all expenses',
        'Process vendor invoices',
        'Manage reimbursement requests',
        'Monitor budget vs actuals',
      ],
    },
    {
      title: 'Financial Operations',
      phase: 'during_event',
      items: [
        'Process on-site payments',
        'Track real-time expenses',
        'Handle emergency purchases',
        'Document all transactions',
        'Manage petty cash',
      ],
    },
    {
      title: 'Financial Reporting',
      phase: 'post_event',
      items: [
        'Collect all receipts',
        'Reconcile payment accounts',
        'Prepare financial summary',
        'Document sponsor payments',
        'Create post-event financial report',
      ],
    },
  ],

  // ===== VOLUNTEER DEPARTMENT =====
  volunteers: [
    {
      title: 'Volunteer Recruitment',
      phase: 'pre_event',
      items: [
        'Create volunteer roles and descriptions',
        'Post volunteer opportunities',
        'Screen and select volunteers',
        'Send volunteer confirmations',
        'Collect volunteer agreements',
      ],
    },
    {
      title: 'Volunteer Management',
      phase: 'pre_event',
      items: [
        'Create shift schedule',
        'Conduct volunteer training',
        'Prepare volunteer handbook',
        'Assign volunteer stations',
        'Distribute volunteer t-shirts/badges',
      ],
    },
    {
      title: 'Day-of Coordination',
      phase: 'during_event',
      items: [
        'Check-in volunteers',
        'Brief team leads',
        'Monitor shift coverage',
        'Handle volunteer issues',
        'Coordinate break rotations',
      ],
    },
    {
      title: 'Volunteer Appreciation',
      phase: 'post_event',
      items: [
        'Thank and recognize volunteers',
        'Collect volunteer feedback',
        'Issue volunteer certificates',
        'Document volunteer hours',
        'Plan recognition event',
      ],
    },
  ],
};
