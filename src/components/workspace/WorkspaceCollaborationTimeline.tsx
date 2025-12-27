import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircleIcon, UsersIcon, ClipboardListIcon, StarIcon } from 'lucide-react';
import { Workspace } from '../../types';
import { supabase } from '@/integrations/supabase/client';

export type WorkspaceActivityType = 'task' | 'communication' | 'team' | 'template';

export interface WorkspaceActivityItem {
  id: string;
  type: WorkspaceActivityType;
  title: string;
  description?: string;
  createdAt: string;
  actor: {
    name: string;
    avatarUrl?: string;
  };
  meta?: {
    taskStatus?: string;
    channelName?: string;
    roleChangedFrom?: string;
    roleChangedTo?: string;
    templateName?: string;
  };
}

interface WorkspaceCollaborationTimelineProps {
  workspace: Workspace;
}

const typeConfig: Record<WorkspaceActivityType, { label: string; Icon: React.ComponentType<any>; badgeClass: string }> = {
  task: {
    label: 'Task',
    Icon: ClipboardListIcon,
    badgeClass:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200',
  },
  communication: {
    label: 'Message',
    Icon: MessageCircleIcon,
    badgeClass:
      'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-200',
  },
  team: {
    label: 'Team',
    Icon: UsersIcon,
    badgeClass:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200',
  },
  template: {
    label: 'Template',
    Icon: StarIcon,
    badgeClass:
      'bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-200',
  },
};

export function WorkspaceCollaborationTimeline({ workspace }: WorkspaceCollaborationTimelineProps) {
  const [filter, setFilter] = useState<WorkspaceActivityType | 'all'>('all');

  type WorkspaceActivityRow = {
    id: string;
    workspace_id: string;
    type: WorkspaceActivityType;
    title: string;
    description: string | null;
    actor_id: string | null;
    actor_name: string | null;
    metadata: any | null;
    created_at: string;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workspace-activities', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_activities')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data || []) as WorkspaceActivityRow[];
    },
  });

  const activities: WorkspaceActivityItem[] = (data || []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    actor: {
      name: row.actor_name || 'Someone',
    },
    meta: row.metadata ?? undefined,
  }));

  const filteredActivities = activities.filter((item) => filter === 'all' || item.type === filter);

  return (
    <section
      aria-labelledby="workspace-collaboration-timeline-heading"
      className="bg-background rounded-xl shadow-sm border border-border/40 overflow-hidden"
    >
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/40 bg-muted/40">
        <div>
          <h2
            id="workspace-collaboration-timeline-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Collaboration timeline
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recent tasks, messages, team changes, and template activity for {workspace.name}.
          </p>
        </div>
        <div className="relative z-20">
          <label className="sr-only" htmlFor="activity-filter">
            Filter activity type
          </label>
          <select
            id="activity-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as WorkspaceActivityType | 'all')}
            className="bg-background text-xs sm:text-sm border border-border rounded-md pl-3 pr-8 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60"
          >
            <option value="all">All activity</option>
            <option value="task">Tasks</option>
            <option value="communication">Communication</option>
            <option value="team">Team</option>
            <option value="template">Templates</option>
          </select>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-4">
        {isLoading && (
          <p className="text-xs sm:text-sm text-muted-foreground">Loading recent activity…</p>
        )}

        {isError && !isLoading && (
          <p className="text-xs sm:text-sm text-destructive">Unable to load activity right now.</p>
        )}

        {!isLoading && !isError && (
          <ol className="relative space-y-4 before:content-[''] before:absolute before:left-4 sm:before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
            {filteredActivities.map((item, index) => {
              const config = typeConfig[item.type];
              const isLast = index === filteredActivities.length - 1;

              return (
                <li key={item.id} className="relative pl-7 sm:pl-9">
                  <div
                    className="absolute left-1 sm:left-3 mt-1 w-5 h-5 rounded-full bg-background ring-2 ring-offset-2 ring-offset-background ring-border flex items-center justify-center z-10"
                    aria-hidden="true"
                  >
                    <config.Icon className="w-3 h-3 text-muted-foreground" />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-medium text-foreground">{item.title}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-muted-foreground max-w-xl">{item.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>By {item.actor.name}</span>
                        <span aria-hidden="true">•</span>
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>

                        {item.meta?.channelName && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>Channel {item.meta.channelName}</span>
                          </>
                        )}
                        {item.meta?.taskStatus && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>Status {item.meta.taskStatus}</span>
                          </>
                        )}
                        {item.meta?.roleChangedFrom && item.meta?.roleChangedTo && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>
                              Role {item.meta.roleChangedFrom} → {item.meta.roleChangedTo}
                            </span>
                          </>
                        )}
                        {item.meta?.templateName && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>Template {item.meta.templateName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isLast && <div className="mt-4" />}
                </li>
              );
            })}

            {filteredActivities.length === 0 && (
              <li className="relative pl-7 sm:pl-9">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No activity yet for this filter. Try switching to a different type.
                </p>
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}

