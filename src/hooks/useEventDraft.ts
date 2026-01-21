import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';

const DRAFT_STORAGE_KEY = 'event-draft';
const AUTOSAVE_DELAY = 500; // ms for debounce
const SYNC_INTERVAL = 30000; // 30s for server sync

interface UseEventDraftOptions {
  organizationId: string;
  eventId?: string; // For edit mode - null for new events
  onDraftRestored?: (draft: Record<string, any>) => void;
}

interface DraftState {
  data: Record<string, any>;
  savedAt: number;
  synced: boolean;
}

export function useEventDraft({ organizationId, eventId, onDraftRestored }: UseEventDraftOptions) {
  // Safely get auth context - return null user if not available
  let user: { id: string } | null = null;
  try {
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch {
    // useAuth throws if not in AuthProvider - safe fallback
    user = null;
  }
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  const getLocalKey = useCallback(() => {
    return `${DRAFT_STORAGE_KEY}-${organizationId}-${eventId || 'new'}`;
  }, [organizationId, eventId]);

  // Save draft to localStorage
  const saveToLocal = useCallback((data: Record<string, any>) => {
    const draft: DraftState = {
      data,
      savedAt: Date.now(),
      synced: false,
    };
    localStorage.setItem(getLocalKey(), JSON.stringify(draft));
    setLastSaved(new Date());
    setHasDraft(true);
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
    setHasDraft(false);
  }, [getLocalKey]);

  // Sync draft to server
  const syncToServer = useCallback(async (data: Record<string, any>) => {
    if (!user?.id || !organizationId) return;

    try {
      await supabase
        .from('event_drafts')
        .upsert({
          user_id: user.id,
          organization_id: organizationId,
          event_id: eventId || null,
          draft_data: data,
        }, { 
          onConflict: 'user_id,organization_id,event_id'
        });

      // Mark local draft as synced
      const local = loadFromLocal();
      if (local) {
        local.synced = true;
        localStorage.setItem(getLocalKey(), JSON.stringify(local));
      }
    } catch (error) {
      console.error('Failed to sync event draft to server:', error);
    }
  }, [user?.id, organizationId, eventId, loadFromLocal, getLocalKey]);

  // Load draft from server
  const loadFromServer = useCallback(async (): Promise<Record<string, any> | null> => {
    if (!user?.id || !organizationId) return null;

    try {
      let query = supabase
        .from('event_drafts')
        .select('draft_data, updated_at')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        query = query.is('event_id', null);
      }

      const { data } = await query.single();

      if (data?.draft_data) {
        return data.draft_data as Record<string, any>;
      }
    } catch {
      // No draft found
    }
    return null;
  }, [user?.id, organizationId, eventId]);

  // Clear draft from server
  const clearFromServer = useCallback(async () => {
    if (!user?.id || !organizationId) return;

    try {
      let query = supabase
        .from('event_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        query = query.is('event_id', null);
      }

      await query;
    } catch (error) {
      console.error('Failed to clear event draft from server:', error);
    }
  }, [user?.id, organizationId, eventId]);

  // Debounced save function
  const saveDraft = useCallback((data: Record<string, any>) => {
    // Don't save empty data
    if (!data || Object.keys(data).length === 0) return;
    
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
    if (!organizationId || isInitializedRef.current) return;
    
    const restoreDraft = async () => {
      isInitializedRef.current = true;
      
      // First check local storage
      const localDraft = loadFromLocal();
      
      // Then check server
      const serverDraft = await loadFromServer();

      // Use the most recent one
      let draftToRestore: Record<string, any> | null = null;

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
        if (draftToRestore.name || draftToRestore.description) {
          setHasDraft(true);
          onDraftRestored(draftToRestore);
        }
      }
    };

    restoreDraft();
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic server sync
  useEffect(() => {
    if (!organizationId) return;
    
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
  }, [organizationId, loadFromLocal, syncToServer]);

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
    hasDraft,
  };
}
