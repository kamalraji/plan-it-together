import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { INDUSTRY_TEMPLATES, getTemplatesByIndustry, getTemplateById } from '@/lib/industryTaskTemplates';
import { IndustryType, IndustryTaskTemplate } from '@/lib/industryTemplateTypes';
import { TaskStatus } from '@/types';
import { toast } from 'sonner';

interface ImportOptions {
  adjustDates: boolean;
  eventDate?: Date;
  assignToCurrentUser: boolean;
  selectedTaskIds?: string[];
}

export function useIndustryTemplates(workspaceId: string) {
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    let templates: IndustryTaskTemplate[] = selectedIndustry === 'all' 
      ? INDUSTRY_TEMPLATES 
      : getTemplatesByIndustry(selectedIndustry);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t: IndustryTaskTemplate) => t.name.toLowerCase().includes(query) ||
             t.description.toLowerCase().includes(query) ||
             t.eventType.toLowerCase().includes(query)
      );
    }
    
    return templates;
  }, [selectedIndustry, searchQuery]);

  const calculateDueDate = useCallback((daysFromEvent: number, eventDate: Date): string => {
    const date = new Date(eventDate);
    date.setDate(date.getDate() + daysFromEvent);
    return date.toISOString();
  }, []);

  const importTemplateMutation = useMutation({
    mutationFn: async ({ templateId, options }: { templateId: string; options: ImportOptions }) => {
      const template = getTemplateById(templateId);
      if (!template) throw new Error('Template not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tasksToImport = options.selectedTaskIds 
        ? template.tasks.filter(t => options.selectedTaskIds!.includes(t.id))
        : template.tasks;

      const taskIdMap = new Map<string, string>();
      const createdTasks: any[] = [];

      for (const templateTask of tasksToImport) {
        const dueDate = options.adjustDates && options.eventDate
          ? calculateDueDate(templateTask.daysFromEvent, options.eventDate)
          : null;

        const taskData = {
          workspace_id: workspaceId,
          title: templateTask.title,
          description: templateTask.description,
          category: templateTask.category,
          priority: templateTask.priority,
          status: TaskStatus.NOT_STARTED,
          due_date: dueDate,
          estimated_hours: templateTask.estimatedHours,
          tags: templateTask.tags,
          assigned_to: options.assignToCurrentUser ? user.id : null,
          created_by: user.id,
          role_scope: templateTask.roleScope || null,
          metadata: {
            imported_from_template: templateId,
            template_task_id: templateTask.id,
            phase: templateTask.phase,
          },
        };

        const { data, error } = await supabase
          .from('workspace_tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;
        
        taskIdMap.set(templateTask.id, data.id);
        createdTasks.push({ templateTask, dbTask: data });
      }

      // Create subtasks
      for (const { templateTask, dbTask } of createdTasks) {
        if (templateTask.subtasks && templateTask.subtasks.length > 0) {
          for (const subtask of templateTask.subtasks) {
            await supabase.from('workspace_tasks').insert([{
              workspace_id: workspaceId,
              parent_task_id: dbTask.id,
              title: subtask.title,
              description: '',
              category: templateTask.category,
              priority: templateTask.priority,
              status: TaskStatus.NOT_STARTED,
              created_by: user.id,
            }]);
          }
        }
      }

      // Note: Dependencies require task_dependencies table - skip if not available
      // Dependencies would be created here if table exists

      // Log template usage
      await supabase.from('industry_template_usage').insert([{
        workspace_id: workspaceId,
        template_id: templateId,
        user_id: user.id,
        tasks_imported: tasksToImport.length,
        import_options: JSON.parse(JSON.stringify(options)),
      }]);

      return { tasksImported: tasksToImport.length, template };
    },
    onSuccess: ({ tasksImported, template }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success(`Imported ${tasksImported} tasks from "${template.name}"`);
    },
    onError: (error) => {
      console.error('Failed to import template:', error);
      toast.error('Failed to import template');
    },
  });

  return {
    templates: INDUSTRY_TEMPLATES,
    filteredTemplates,
    selectedIndustry,
    setSelectedIndustry,
    searchQuery,
    setSearchQuery,
    getTemplateById,
    importTemplate: importTemplateMutation.mutate,
    isImporting: importTemplateMutation.isPending,
  };
}
