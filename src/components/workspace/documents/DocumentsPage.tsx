import { useState, useCallback } from 'react';
import { useDocuments, useDocument } from '@/hooks/useDocuments';
import { DocumentSidebar } from './DocumentSidebar';
import { DocumentEditor } from './DocumentEditor';
import { DocumentVersionHistory } from './DocumentVersionHistory';
import { Button } from '@/components/ui/button';
import { History, PanelLeftClose, PanelLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentsPageProps {
  workspaceId: string;
}

export function DocumentsPage({ workspaceId }: DocumentsPageProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    documentTree,
    isLoading: isLoadingList,
    createDocument,
    deleteDocument,
    archiveDocument,
  } = useDocuments(workspaceId);

  const {
    document: selectedDocument,
    versions,
    isLoading: isLoadingDoc,
    saveVersion,
    fetchVersions,
    restoreVersion,
  } = useDocument(selectedDocId);

  const handleCreate = useCallback(
    async (parentId?: string) => {
      const newDoc = await createDocument(parentId);
      if (newDoc) {
        setSelectedDocId(newDoc.id);
      }
    },
    [createDocument]
  );

  const handleUpdateDocument = useCallback(
    async (updates: any) => {
      if (!selectedDocId) return false;
      const { updateDocument } = await import('@/hooks/useDocuments').then(() =>
        import('@/integrations/supabase/client').then(({ supabase }) => ({
          updateDocument: async (updates: any) => {
            const { error } = await supabase
              .from('workspace_documents')
              .update(updates)
              .eq('id', selectedDocId);
            return !error;
          },
        }))
      );
      return updateDocument(updates);
    },
    [selectedDocId]
  );

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {sidebarOpen && (
          <DocumentSidebar
            documents={documentTree}
            selectedId={selectedDocId}
            onSelect={setSelectedDocId}
            onCreate={handleCreate}
            onDelete={deleteDocument}
            onArchive={archiveDocument}
            isLoading={isLoadingList}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-2 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          {selectedDocument && (
            <>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">
                  {selectedDocument.title || 'Untitled'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {isLoadingDoc ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : selectedDocument ? (
            <DocumentEditor
              document={selectedDocument}
              onUpdate={handleUpdateDocument}
              onSaveVersion={saveVersion}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-16 w-16 opacity-30 mb-4" />
              <p className="text-lg font-medium">No document selected</p>
              <p className="text-sm mt-1">
                Select a document from the sidebar or create a new one
              </p>
              <Button
                variant="outline"
                onClick={() => handleCreate()}
                className="mt-4"
              >
                Create Document
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Version History Sheet */}
      <DocumentVersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={versions}
        onFetchVersions={fetchVersions}
        onRestoreVersion={restoreVersion}
      />
    </div>
  );
}
