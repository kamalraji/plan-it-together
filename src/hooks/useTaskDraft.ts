import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TaskFormData } from '@/components/workspace/TaskForm';

const DRAFT_STORAGE_KEY = 'task-draft';
const AUTOSAVE_DELAY = 500; // ms for debounce
const SYNC_INTERVAL = 30000; // 30s for server sync

interface UseTaskDraftOptions {
  workspaceId: string;
  onDraftRestored?: (draft: Partial<TaskFormData>) => void;
}

interface DraftState {
  data: Partial<TaskFormData>;
  savedAt: number;
  synced: boolean;
}

export function useTaskDraft({ workspaceId, onDraftRestored }: UseTaskDraftOptions) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  const getLocalKey = useCallback(() => {
    return `${DRAFT_STORAGE_KEY}-${workspaceId}`;
  }, [workspaceId]);

  // Save draft to localStorage
  const saveToLocal = useCallback((data: Partial<TaskFormData>) => {
    const draft: DraftState = {
      data,
      savedAt: Date.now(),
      synced: false,
    };
    localStorage.setItem(getLocalKey(), JSON.stringify(draft));
    setLastSaved(new Date());
  }, [getLocalKey]);

  // Load draft from localStorage
  const loadFromLocal = useCallback((): DraftState | null => {
    const stored = localStorage.getItem(getLocalKey());
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as DraftState;
    } catch {
      return null;
    }
  }, [getLocalKey]);

  // Clear draft from localStorage
  const clearLocal = useCallback(() => {
    localStorage.removeItem(getLocalKey());
    setLastSaved(null);
  }, [getLocalKey]);

  // Sync draft to server
  const syncToServer = useCallback(async (data: Partial<TaskFormData>) => {
    if (!user?.id || !workspaceId) return;

    try {
      await supabase
        .from('workspace_task_drafts')
        .upsert({
          user_id: user.id,
          workspace_id: workspaceId,
          draft_data: data as any,
        }, { onConflict: 'user_id,workspace_id' });

      // Mark local draft as synced
      const local = loadFromLocal();
      if (local) {
        local.synced = true;
        localStorage.setItem(getLocalKey(), JSON.stringify(local));
      }
    } catch (_error) {
      // Sync draft to server failed silently
    }
  }, [user?.id, workspaceId, loadFromLocal, getLocalKey]);

  // Load draft from server
  const loadFromServer = useCallback(async (): Promise<Partial<TaskFormData> | null> => {
    if (!user?.id || !workspaceId) return null;

    try {
      const { data } = await supabase
        .from('workspace_task_drafts')
        .select('draft_data, updated_at')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .single();

      if (data?.draft_data) {
        return data.draft_data as Partial<TaskFormData>;
      }
    } catch {
      // No draft found
    }
    return null;
  }, [user?.id, workspaceId]);

  // Clear draft from server
  const clearFromServer = useCallback(async () => {
    if (!user?.id || !workspaceId) return;

    try {
      await supabase
        .from('workspace_task_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);
    } catch (_error) {
      // Clear draft from server failed silently
    }
  }, [user?.id, workspaceId]);

  // Debounced save function
  const saveDraft = useCallback((data: Partial<TaskFormData>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    // Debounce local save
    saveTimeoutRef.current = setTimeout(() => {
      saveToLocal(data);
      setIsSaving(false);
    }, AUTOSAVE_DELAY);
  }, [saveToLocal]);

  // Clear all drafts
  const clearDraft = useCallback(async () => {
    clearLocal();
    await clearFromServer();
  }, [clearLocal, clearFromServer]);

  // Restore draft on mount
  useEffect(() => {
    const restoreDraft = async () => {
      // First check local storage
      const localDraft = loadFromLocal();
      
      // Then check server
      const serverDraft = await loadFromServer();

      // Use the most recent one
      let draftToRestore: Partial<TaskFormData> | null = null;

      if (localDraft && serverDraft) {
        // Compare timestamps - local has savedAt, assume server is newer if local is synced
        if (!localDraft.synced) {
          draftToRestore = localDraft.data;
        } else {
          draftToRestore = serverDraft;
        }
      } else {
        draftToRestore = localDraft?.data || serverDraft;
      }

      if (draftToRestore && onDraftRestored) {
        // Only restore if there's meaningful content
        if (draftToRestore.title || draftToRestore.description) {
          onDraftRestored(draftToRestore);
        }
      }
    };

    restoreDraft();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic server sync
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      const local = loadFromLocal();
      if (local && !local.synced && local.data) {
        syncToServer(local.data);
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadFromLocal, syncToServer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    clearDraft,
    isSaving,
    lastSaved,
  };
}
