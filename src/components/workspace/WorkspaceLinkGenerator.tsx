import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardCopy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  buildWorkspaceUrl, 
  buildHierarchyChain, 
  slugify,
  WorkspacePathSegment,
  DeepLinkParams,
} from '@/lib/workspaceNavigation';
import { WorkspaceTab } from '@/hooks/useWorkspaceShell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface WorkspaceLinkGeneratorProps {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: string;
  hierarchy?: WorkspacePathSegment[];
  allWorkspaces?: Array<{
    id: string;
    name: string;
    slug: string | null;
    workspace_type: string | null;
    parent_workspace_id: string | null;
  }>;
}

const TABS: { value: WorkspaceTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'team', label: 'Team' },
  { value: 'communication', label: 'Communication' },
  { value: 'analytics', label: 'Analytics' },
];

const SECTIONS = [
  { value: '', label: 'None' },
  { value: 'hierarchy', label: 'Hierarchy Tree' },
  { value: 'budget', label: 'Budget' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'team-stats', label: 'Team Stats' },
  { value: 'tasks-overview', label: 'Tasks Overview' },
];

export function WorkspaceLinkGenerator({
  orgSlug,
  eventSlug,
  eventId,
  workspaceId,
  workspaceName,
  workspaceType,
  hierarchy: providedHierarchy,
  allWorkspaces,
}: WorkspaceLinkGeneratorProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<WorkspaceTab>('overview');
  const [selectedSection, setSelectedSection] = useState('');
  const [taskId, setTaskId] = useState('');

  // Build hierarchy if not provided
  const hierarchy = useMemo(() => {
    if (providedHierarchy) return providedHierarchy;
    
    if (allWorkspaces) {
      return buildHierarchyChain(workspaceId, allWorkspaces.map(ws => ({
        id: ws.id,
        slug: ws.slug || slugify(ws.name),
        name: ws.name,
        workspaceType: ws.workspace_type,
        parentWorkspaceId: ws.parent_workspace_id,
      })));
    }
    
    // Fallback: single-level hierarchy
    const levelMap: Record<string, 'root' | 'department' | 'committee' | 'team'> = {
      'ROOT': 'root',
      'DEPARTMENT': 'department',
      'COMMITTEE': 'committee',
      'TEAM': 'team',
    };
    
    return [{
      level: levelMap[workspaceType] || 'root',
      slug: slugify(workspaceName),
      workspaceId,
    }];
  }, [providedHierarchy, allWorkspaces, workspaceId, workspaceName, workspaceType]);

  // Build deep link params
  const deepLink: DeepLinkParams = useMemo(() => ({
    tab: selectedTab !== 'overview' ? selectedTab : undefined,
    taskId: taskId.trim() || undefined,
    sectionId: selectedSection || undefined,
  }), [selectedTab, selectedSection, taskId]);

  // Generate URL
  const generatedUrl = useMemo(() => {
    const fullUrl = buildWorkspaceUrl(
      { orgSlug, eventSlug, eventId, hierarchy },
      deepLink
    );
    
    // Return as absolute URL
    return `${window.location.origin}${fullUrl}`;
  }, [orgSlug, eventSlug, eventId, hierarchy, deepLink]);

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="h-4 w-4" />
        <span>Generate Shareable Link</span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tab Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Open Tab</Label>
          <Select value={selectedTab} onValueChange={(v) => setSelectedTab(v as WorkspaceTab)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select tab" />
            </SelectTrigger>
            <SelectContent>
              {TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Section Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Scroll to Section</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((section) => (
                <SelectItem key={section.value || 'none'} value={section.value}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Task ID (optional) */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Task ID (optional)</Label>
          <Input
            placeholder="Enter task UUID to open directly"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="h-9"
          />
        </div>
      </div>
      
      {/* Generated Link */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Generated Link</Label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={generatedUrl}
            className={cn(
              "h-9 text-xs font-mono flex-1",
              "bg-muted/30 text-foreground"
            )}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3"
            onClick={() => handleCopy('generated', generatedUrl)}
          >
            {copiedId === 'generated' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <ClipboardCopy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Quick copy buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            const simpleUrl = buildWorkspaceUrl(
              { orgSlug, eventSlug, eventId, hierarchy },
            );
            handleCopy('simple', `${window.location.origin}${simpleUrl}`);
          }}
        >
          <ClipboardCopy className="h-3 w-3 mr-1" />
          Copy Basic Link
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            const tasksUrl = buildWorkspaceUrl(
              { orgSlug, eventSlug, eventId, hierarchy },
              { tab: 'tasks' }
            );
            handleCopy('tasks', `${window.location.origin}${tasksUrl}`);
          }}
        >
          <ClipboardCopy className="h-3 w-3 mr-1" />
          Copy Tasks Link
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            const teamUrl = buildWorkspaceUrl(
              { orgSlug, eventSlug, eventId, hierarchy },
              { tab: 'team' }
            );
            handleCopy('team', `${window.location.origin}${teamUrl}`);
          }}
        >
          <ClipboardCopy className="h-3 w-3 mr-1" />
          Copy Team Link
        </Button>
      </div>
    </div>
  );
}

export default WorkspaceLinkGenerator;
