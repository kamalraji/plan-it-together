import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  ClipboardList,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Folder,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  orgSlug?: string;
}

interface SearchResult {
  id: string;
  type: 'task' | 'workspace' | 'member' | 'action';
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  workspaceId,
  orgSlug,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<SearchResult[]>([]);
  const [workspaces, setWorkspaces] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Quick actions that are always available
  const quickActions: SearchResult[] = [
    {
      id: 'action-tasks',
      type: 'action',
      title: 'Go to Tasks',
      description: 'View and manage tasks',
      icon: <ClipboardList className="h-4 w-4" />,
      action: () => {
        if (workspaceId && orgSlug) {
          navigate(`/${orgSlug}/workspace/${workspaceId}?tab=tasks`);
        }
        onOpenChange(false);
      },
    },
    {
      id: 'action-team',
      type: 'action',
      title: 'Go to Team',
      description: 'Manage team members',
      icon: <Users className="h-4 w-4" />,
      action: () => {
        if (workspaceId && orgSlug) {
          navigate(`/${orgSlug}/workspace/${workspaceId}?tab=team`);
        }
        onOpenChange(false);
      },
    },
    {
      id: 'action-communication',
      type: 'action',
      title: 'Go to Communication',
      description: 'Chat and messages',
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => {
        if (workspaceId && orgSlug) {
          navigate(`/${orgSlug}/workspace/${workspaceId}?tab=communication`);
        }
        onOpenChange(false);
      },
    },
    {
      id: 'action-analytics',
      type: 'action',
      title: 'Go to Analytics',
      description: 'View metrics and reports',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        if (workspaceId && orgSlug) {
          navigate(`/${orgSlug}/workspace/${workspaceId}?tab=analytics`);
        }
        onOpenChange(false);
      },
    },
    {
      id: 'action-settings',
      type: 'action',
      title: 'Go to Settings',
      description: 'Workspace configuration',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        if (workspaceId && orgSlug) {
          navigate(`/${orgSlug}/workspace/${workspaceId}?tab=settings`);
        }
        onOpenChange(false);
      },
    },
  ];

  // Search for tasks and workspaces
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !user) {
      setTasks([]);
      setWorkspaces([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = `%${query}%`;

      // Search tasks
      const { data: taskData } = await supabase
        .from('workspace_tasks')
        .select('id, title, status, priority, workspace_id')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (taskData) {
        const taskResults: SearchResult[] = taskData.map((task) => ({
          id: task.id,
          type: 'task',
          title: task.title,
          description: `${task.status} • ${task.priority}`,
          icon: getTaskIcon(task.status),
          action: () => {
            if (orgSlug) {
              navigate(`/${orgSlug}/workspace/${task.workspace_id}?tab=tasks&taskId=${task.id}`);
            }
            onOpenChange(false);
          },
        }));
        setTasks(taskResults);
      }

      // Search workspaces
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type')
        .ilike('name', searchTerm)
        .limit(5);

      if (workspaceData) {
        const workspaceResults: SearchResult[] = workspaceData.map((ws) => ({
          id: ws.id,
          type: 'workspace',
          title: ws.name,
          description: ws.workspace_type || 'Workspace',
          icon: <Folder className="h-4 w-4" />,
          action: () => {
            if (orgSlug) {
              navigate(`/${orgSlug}/workspace/${ws.id}`);
            }
            onOpenChange(false);
          },
        }));
        setWorkspaces(workspaceResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, orgSlug, navigate, onOpenChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setTasks([]);
      setWorkspaces([]);
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tasks, workspaces, or type a command..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Tasks */}
        {tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.map((task) => (
              <CommandItem
                key={task.id}
                value={task.title}
                onSelect={task.action}
                className="cursor-pointer"
              >
                {task.icon}
                <div className="ml-2 flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Workspaces */}
        {workspaces.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Workspaces">
              {workspaces.map((ws) => (
                <CommandItem
                  key={ws.id}
                  value={ws.title}
                  onSelect={ws.action}
                  className="cursor-pointer"
                >
                  {ws.icon}
                  <div className="ml-2 flex-1">
                    <p className="text-sm font-medium">{ws.title}</p>
                    {ws.description && (
                      <p className="text-xs text-muted-foreground">{ws.description}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Quick Actions */}
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.id}
              value={action.title}
              onSelect={action.action}
              className="cursor-pointer"
            >
              {action.icon}
              <div className="ml-2 flex-1">
                <p className="text-sm font-medium">{action.title}</p>
                {action.description && (
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function getTaskIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'blocked':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
  }
}
