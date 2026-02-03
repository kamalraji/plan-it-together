import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  workspace_id: string;
  parent_document_id: string | null;
  title: string;
  content: any;
  cover_image_url: string | null;
  icon: string | null;
  is_published: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  content: any;
  version_number: number;
  created_by: string;
  created_at: string;
}

export function useDocuments(workspaceId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as unknown as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`documents:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_documents',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments((prev) => [payload.new as Document, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as Document) : doc
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) =>
              prev.filter((doc) => doc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const createDocument = useCallback(
    async (parentId?: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('workspace_documents')
          .insert({
            workspace_id: workspaceId,
            parent_document_id: parentId || null,
            title: 'Untitled',
            content: { type: 'doc', content: [] },
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        
        toast({ title: 'Document created' });
        return data as unknown as Document;
      } catch (error) {
        console.error('Error creating document:', error);
        toast({
          title: 'Error',
          description: 'Failed to create document',
          variant: 'destructive',
        });
        return null;
      }
    },
    [workspaceId, toast]
  );

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Pick<Document, 'title' | 'content' | 'cover_image_url' | 'icon' | 'is_published' | 'is_archived'>>) => {
      try {
        const { error } = await supabase
          .from('workspace_documents')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error updating document:', error);
        toast({
          title: 'Error',
          description: 'Failed to update document',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('workspace_documents')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast({ title: 'Document deleted' });
        return true;
      } catch (error) {
        console.error('Error deleting document:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete document',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const archiveDocument = useCallback(
    async (id: string) => {
      return updateDocument(id, { is_archived: true });
    },
    [updateDocument]
  );

  // Build document tree structure
  const documentTree = documents.reduce((acc, doc) => {
    if (!doc.parent_document_id) {
      acc.push({
        ...doc,
        children: documents.filter((d) => d.parent_document_id === doc.id),
      });
    }
    return acc;
  }, [] as (Document & { children: Document[] })[]);

  return {
    documents,
    documentTree,
    isLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    refetch: fetchDocuments,
  };
}

export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data as unknown as Document);
    } catch (error) {
      console.error('Error fetching document:', error);
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Real-time updates for single document
  useEffect(() => {
    if (!documentId) return;

    const channel = supabase
      .channel(`document:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_documents',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          setDocument(payload.new as Document);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const saveVersion = useCallback(async () => {
    if (!documentId || !document) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get current version count
      const { count } = await supabase
        .from('document_versions')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId);

      await supabase.from('document_versions').insert({
        document_id: documentId,
        content: document.content,
        version_number: (count || 0) + 1,
        created_by: userData.user.id,
      });
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }, [documentId, document]);

  const fetchVersions = useCallback(async () => {
    if (!documentId) return;

    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVersions((data as unknown as DocumentVersion[]) || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  }, [documentId]);

  const restoreVersion = useCallback(
    async (version: DocumentVersion) => {
      if (!documentId) return;

      try {
        const { error } = await supabase
          .from('workspace_documents')
          .update({ content: version.content })
          .eq('id', documentId);

        if (error) throw error;
        toast({ title: 'Version restored' });
        await fetchDocument();
      } catch (error) {
        console.error('Error restoring version:', error);
        toast({
          title: 'Error',
          description: 'Failed to restore version',
          variant: 'destructive',
        });
      }
    },
    [documentId, toast, fetchDocument]
  );

  return {
    document,
    versions,
    isLoading,
    saveVersion,
    fetchVersions,
    restoreVersion,
    refetch: fetchDocument,
  };
}
