import { useSearchParams } from 'react-router-dom';
import { WorkspaceTab } from './useWorkspaceShell';

export interface WorkspaceQueryParams {
  workspaceId?: string;
  tab?: WorkspaceTab;
  taskId?: string;
  sectionId?: string;
}

/**
 * Lightweight hook for workspace URL query parameter management
 * Supports deep-linking for tabs, tasks, and sections
 */
export function useWorkspaceQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: WorkspaceQueryParams = {
    workspaceId: searchParams.get('workspaceId') || undefined,
    tab: (searchParams.get('tab') as WorkspaceTab) || undefined,
    taskId: searchParams.get('taskId') || undefined,
    sectionId: searchParams.get('sectionid') || undefined,
  };

  const setParam = (key: string, value: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  };

  const setMultipleParams = (updates: Partial<Record<string, string | null>>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        return next;
      },
      { replace: true }
    );
  };

  const buildWorkspaceUrl = (
    baseUrl: string,
    options: {
      workspaceId?: string;
      tab?: WorkspaceTab;
      taskId?: string;
      sectionId?: string;
    }
  ): string => {
    const params = new URLSearchParams();
    if (options.workspaceId) params.set('workspaceId', options.workspaceId);
    if (options.tab && options.tab !== 'overview') params.set('tab', options.tab);
    if (options.taskId) params.set('taskId', options.taskId);
    if (options.sectionId) params.set('sectionid', options.sectionId);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return {
    params,
    setParam,
    setMultipleParams,
    buildWorkspaceUrl,
    searchParams,
    setSearchParams,
  };
}
