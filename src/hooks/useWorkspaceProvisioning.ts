import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  EnhancedWorkspaceTemplate, 
  COMMITTEE_DEFINITIONS,
  DEPARTMENT_DEFINITIONS 
} from '@/lib/workspaceTemplates';
import { COMMITTEE_CHECKLIST_TEMPLATES } from './useCommitteeDashboard';

interface ProvisionWorkspaceParams {
  name: string;
  eventId: string;
  userId: string;
  template: EnhancedWorkspaceTemplate;
  organizationId?: string;
}

interface ProvisionedWorkspace {
  rootWorkspace: { id: string; name: string };
  departments: Array<{ id: string; name: string }>;
  committees: Array<{ id: string; name: string; departmentId: string }>;
  tasksCreated: number;
  milestonesCreated: number;
}

export function useWorkspaceProvisioning() {
  const queryClient = useQueryClient();

  const provisionMutation = useMutation({
    mutationFn: async ({
      name,
      eventId,
      userId,
      template,
    }: ProvisionWorkspaceParams): Promise<ProvisionedWorkspace> => {
      // Check if a root workspace already exists for this event
      const { data: existingRoot, error: checkError } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('event_id', eventId)
        .is('parent_workspace_id', null)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRoot) {
        throw new Error(
          `This event already has a root workspace "${existingRoot.name}". Each event can only have one root workspace.`
        );
      }

      // 1. Create ROOT workspace
      const { data: rootWorkspace, error: rootError } = await supabase
        .from('workspaces')
        .insert({
          name,
          event_id: eventId,
          organizer_id: userId,
          status: 'ACTIVE',
          workspace_type: 'ROOT',
          parent_workspace_id: null,
        })
        .select('id, name')
        .single();

      if (rootError) throw rootError;

      // Add current user as owner in team members
      await supabase.from('workspace_team_members').insert({
        workspace_id: rootWorkspace.id,
        user_id: userId,
        role: 'OWNER',
        status: 'ACTIVE',
      });

      // For blank template, just return the root workspace
      if (template.id === 'blank' || template.structure.departments.length === 0) {
        return {
          rootWorkspace,
          departments: [],
          committees: [],
          tasksCreated: 0,
          milestonesCreated: 0,
        };
      }

      const createdDepartments: Array<{ id: string; name: string }> = [];
      const createdCommittees: Array<{ id: string; name: string; departmentId: string }> = [];

      // 2. Create DEPARTMENT sub-workspaces
      for (const deptConfig of template.structure.departments) {
        const deptDef = DEPARTMENT_DEFINITIONS[deptConfig.id];
        const deptName = deptConfig.name || deptDef?.name || deptConfig.id;

        const { data: dept, error: deptError } = await supabase
          .from('workspaces')
          .insert({
            name: deptName,
            event_id: eventId,
            organizer_id: userId,
            status: 'ACTIVE',
            workspace_type: 'DEPARTMENT',
            parent_workspace_id: rootWorkspace.id,
            department_id: deptConfig.id,
          })
          .select('id, name')
          .single();

        if (deptError) {
          console.error('Failed to create department:', deptError);
          continue;
        }

        createdDepartments.push(dept);

        // Add user as member of department
        await supabase.from('workspace_team_members').insert({
          workspace_id: dept.id,
          user_id: userId,
          role: 'LEAD',
          status: 'ACTIVE',
        });

        // 3. Create COMMITTEE sub-workspaces under each department
        for (const committeeId of deptConfig.committees) {
          const committeeDef = COMMITTEE_DEFINITIONS[committeeId];
          const committeeName = committeeDef?.name || committeeId;

          const { data: committee, error: committeeError } = await supabase
            .from('workspaces')
            .insert({
              name: committeeName,
              event_id: eventId,
              organizer_id: userId,
              status: 'ACTIVE',
              workspace_type: 'COMMITTEE',
              parent_workspace_id: dept.id,
            })
            .select('id, name')
            .single();

          if (committeeError) {
            console.error('Failed to create committee:', committeeError);
            continue;
          }

          createdCommittees.push({ ...committee, departmentId: dept.id });

          // Add user as member of committee
          await supabase.from('workspace_team_members').insert({
            workspace_id: committee.id,
            user_id: userId,
            role: 'COORDINATOR',
            status: 'ACTIVE',
          });

          // 4. Load committee-specific checklists if available
          const checklistTemplates = COMMITTEE_CHECKLIST_TEMPLATES[committeeId];
          if (checklistTemplates && checklistTemplates.length > 0) {
            for (const checklistTemplate of checklistTemplates) {
              const items = checklistTemplate.items.map((text, idx) => ({
                id: `item-${idx}-${Date.now()}`,
                text,
                completed: false,
              }));

              await supabase.from('workspace_checklists').insert({
                workspace_id: committee.id,
                title: checklistTemplate.title,
                committee_type: committeeId,
                items: JSON.stringify(items),
                is_template: false,
              });
            }
          }
        }
      }

      // 5. Create tasks at appropriate levels
      let tasksCreated = 0;
      const rootTasks = template.structure.tasks.filter(t => t.targetLevel === 'ROOT');
      const committeeTasks = template.structure.tasks.filter(t => t.targetLevel === 'COMMITTEE' || !t.targetLevel);

      // Create root-level tasks
      if (rootTasks.length > 0) {
        const { error: rootTasksError } = await supabase
          .from('workspace_tasks')
          .insert(
            rootTasks.map(task => ({
              workspace_id: rootWorkspace.id,
              title: task.title,
              description: task.description || null,
              priority: task.priority,
              status: task.status === 'TODO' ? 'PENDING' : task.status,
            }))
          );

        if (!rootTasksError) {
          tasksCreated += rootTasks.length;
        }
      }

      // Distribute committee-level tasks across committees
      if (committeeTasks.length > 0 && createdCommittees.length > 0) {
        const tasksPerCommittee = Math.ceil(committeeTasks.length / createdCommittees.length);
        
        for (let i = 0; i < createdCommittees.length; i++) {
          const committee = createdCommittees[i];
          const startIdx = i * tasksPerCommittee;
          const endIdx = Math.min(startIdx + tasksPerCommittee, committeeTasks.length);
          const committeeBatch = committeeTasks.slice(startIdx, endIdx);

          if (committeeBatch.length > 0) {
            const { error: taskError } = await supabase
              .from('workspace_tasks')
              .insert(
                committeeBatch.map(task => ({
                  workspace_id: committee.id,
                  title: task.title,
                  description: task.description || null,
                  priority: task.priority,
                  status: task.status === 'TODO' ? 'PENDING' : task.status,
                }))
              );

            if (!taskError) {
              tasksCreated += committeeBatch.length;
            }
          }
        }
      }

      // 6. Create milestones on the root workspace
      let milestonesCreated = 0;
      if (template.structure.milestones.length > 0) {
        const { error: milestoneError } = await supabase
          .from('workspace_milestones')
          .insert(
            template.structure.milestones.map((milestone, idx) => ({
              workspace_id: rootWorkspace.id,
              title: milestone.name,
              description: milestone.description,
              status: 'pending',
              sort_order: idx,
            }))
          );

        if (!milestoneError) {
          milestonesCreated = template.structure.milestones.length;
        }
      }

      // 7. Create budget categories if available
      if (template.structure.budgetCategories.length > 0) {
        // First create a budget record
        const { data: budget, error: budgetError } = await supabase
          .from('workspace_budgets')
          .insert({
            workspace_id: rootWorkspace.id,
            allocated: 0,
            used: 0,
            currency: 'USD',
          })
          .select('id')
          .single();

        if (!budgetError && budget) {
          // Then create budget categories
          await supabase.from('workspace_budget_categories').insert(
            template.structure.budgetCategories.map(category => ({
              budget_id: budget.id,
              name: category,
              allocated: 0,
              used: 0,
            }))
          );
        }
      }

      // Log workspace activity
      await supabase.from('workspace_activities').insert({
        workspace_id: rootWorkspace.id,
        type: 'template',
        title: `Workspace created with "${template.name}" template`,
        description: `Created ${createdDepartments.length} departments, ${createdCommittees.length} committees, ${tasksCreated} tasks, and ${milestonesCreated} milestones.`,
        actor_id: userId,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          departments: createdDepartments.map(d => d.name),
          committees: createdCommittees.map(c => c.name),
        },
      });

      return {
        rootWorkspace,
        departments: createdDepartments,
        committees: createdCommittees,
        tasksCreated,
        milestonesCreated,
      };
    },
    onSuccess: (data, variables) => {
      const templateName = variables.template.id !== 'blank' ? ` with "${variables.template.name}" template` : '';
      
      if (data.departments.length > 0) {
        toast.success(
          `Workspace created${templateName}! Created ${data.departments.length} departments and ${data.committees.length} committees.`
        );
      } else {
        toast.success(`Workspace created successfully${templateName}`);
      }

      // Invalidate workspace queries
      queryClient.invalidateQueries({ queryKey: ['org-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (error) => {
      console.error('Failed to provision workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    },
  });

  return {
    provisionWorkspace: provisionMutation.mutate,
    provisionWorkspaceAsync: provisionMutation.mutateAsync,
    isPending: provisionMutation.isPending,
    isError: provisionMutation.isError,
    error: provisionMutation.error,
  };
}
