import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  ListTodo,
  Plus,
  Search,
  Settings,
  Users,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Zap,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Home,
  FolderTree,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

interface CommandPaletteProps {
  workspaceId?: string;
}

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'settings' | 'help';
}

export function CommandPalette({ workspaceId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  const commands: CommandAction[] = useMemo(() => {
    const base: CommandAction[] = [
      // Navigation
      {
        id: 'home',
        label: 'Go to Home',
        icon: <Home className="h-4 w-4" />,
        shortcut: 'G H',
        action: () => navigate('/'),
        keywords: ['home', 'dashboard', 'main'],
        group: 'navigation',
      },
      {
        id: 'events',
        label: 'Go to Events',
        icon: <Calendar className="h-4 w-4" />,
        shortcut: 'G E',
        action: () => navigate('/events'),
        keywords: ['events', 'calendar'],
        group: 'navigation',
      },
      {
        id: 'search',
        label: 'Search Everything',
        icon: <Search className="h-4 w-4" />,
        shortcut: '/',
        action: () => {
          setOpen(false);
          // Trigger global search
        },
        keywords: ['search', 'find'],
        group: 'navigation',
      },

      // Actions
      {
        id: 'new-task',
        label: 'Create New Task',
        icon: <Plus className="h-4 w-4" />,
        shortcut: 'N T',
        action: () => {
          setOpen(false);
          // Could emit an event or use a global state
        },
        keywords: ['new', 'task', 'create', 'add'],
        group: 'actions',
      },
      {
        id: 'new-document',
        label: 'Create New Document',
        icon: <FileText className="h-4 w-4" />,
        shortcut: 'N D',
        action: () => {
          setOpen(false);
        },
        keywords: ['new', 'document', 'page', 'create'],
        group: 'actions',
      },

      // Settings
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        action: () => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
          setOpen(false);
        },
        keywords: ['theme', 'dark', 'light', 'mode'],
        group: 'settings',
      },
      {
        id: 'settings',
        label: 'Open Settings',
        icon: <Settings className="h-4 w-4" />,
        shortcut: ',',
        action: () => {
          setOpen(false);
          navigate('/settings');
        },
        keywords: ['settings', 'preferences', 'options'],
        group: 'settings',
      },

      // Help
      {
        id: 'help',
        label: 'Help & Support',
        icon: <HelpCircle className="h-4 w-4" />,
        shortcut: '?',
        action: () => {
          setOpen(false);
          window.open('https://docs.lovable.dev', '_blank');
        },
        keywords: ['help', 'support', 'docs', 'documentation'],
        group: 'help',
      },
      {
        id: 'sign-out',
        label: 'Sign Out',
        icon: <LogOut className="h-4 w-4" />,
        action: handleSignOut,
        keywords: ['logout', 'sign out', 'exit'],
        group: 'help',
      },
    ];

    // Add workspace-specific commands
    if (workspaceId) {
      base.push(
        {
          id: 'workspace-dashboard',
          label: 'Workspace Dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}`);
          },
          keywords: ['workspace', 'dashboard'],
          group: 'navigation',
        },
        {
          id: 'workspace-tasks',
          label: 'View All Tasks',
          icon: <ListTodo className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}?tab=tasks`);
          },
          keywords: ['tasks', 'todos', 'list'],
          group: 'navigation',
        },
        {
          id: 'workspace-team',
          label: 'Team Members',
          icon: <Users className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}?tab=team`);
          },
          keywords: ['team', 'members', 'people'],
          group: 'navigation',
        },
        {
          id: 'workspace-chat',
          label: 'Open Chat',
          icon: <MessageSquare className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}?tab=communication`);
          },
          keywords: ['chat', 'messages', 'communication'],
          group: 'navigation',
        },
        {
          id: 'workspace-hierarchy',
          label: 'Workspace Hierarchy',
          icon: <FolderTree className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}?tab=hierarchy`);
          },
          keywords: ['hierarchy', 'structure', 'tree'],
          group: 'navigation',
        },
        {
          id: 'workspace-automations',
          label: 'Automation Rules',
          icon: <Zap className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate(`/workspace/${workspaceId}?tab=automations`);
          },
          keywords: ['automations', 'rules', 'workflows'],
          group: 'navigation',
        }
      );
    }

    return base;
  }, [navigate, theme, setTheme, handleSignOut, workspaceId]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {
      navigation: [],
      actions: [],
      settings: [],
      help: [],
    };

    commands.forEach((cmd) => {
      groups[cmd.group].push(cmd);
    });

    return groups;
  }, [commands]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {groupedCommands.navigation.length > 0 && (
          <CommandGroup heading="Navigation">
            {groupedCommands.navigation.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action}>
                {cmd.icon}
                <span className="ml-2">{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {groupedCommands.actions.length > 0 && (
          <CommandGroup heading="Actions">
            {groupedCommands.actions.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action}>
                {cmd.icon}
                <span className="ml-2">{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {groupedCommands.settings.length > 0 && (
          <CommandGroup heading="Settings">
            {groupedCommands.settings.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action}>
                {cmd.icon}
                <span className="ml-2">{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {groupedCommands.help.length > 0 && (
          <CommandGroup heading="Help">
            {groupedCommands.help.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action}>
                {cmd.icon}
                <span className="ml-2">{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
