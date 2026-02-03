import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  File,
  FilePlus,
  Search,
  MoreHorizontal,
  Trash2,
  Archive,
  Star,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document } from '@/hooks/useDocuments';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DocumentSidebarProps {
  documents: (Document & { children: Document[] })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId?: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  isLoading?: boolean;
}

export function DocumentSidebar({
  documents,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onArchive,
  isLoading,
}: DocumentSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.children.some((child) =>
        child.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Documents</h3>
          <Button variant="ghost" size="sm" onClick={() => onCreate()} className="h-7 w-7 p-0">
            <FilePlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => onCreate()}
                className="mt-1"
              >
                Create your first document
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  isSelected={selectedId === doc.id}
                  isExpanded={expandedIds.has(doc.id)}
                  onToggleExpand={() => toggleExpanded(doc.id)}
                  onSelect={onSelect}
                  onCreate={onCreate}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  selectedId={selectedId}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface DocumentItemProps {
  document: Document & { children?: Document[] };
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: (id: string) => void;
  onCreate: (parentId?: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  selectedId: string | null;
  level?: number;
}

function DocumentItem({
  document,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onCreate,
  onDelete,
  onArchive,
  selectedId,
  level = 0,
}: DocumentItemProps) {
  const hasChildren = document.children && document.children.length > 0;

  return (
    <Collapsible open={isExpanded}>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-muted/80',
          isSelected && 'bg-muted text-foreground',
          !isSelected && 'text-muted-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="h-5 w-5 p-0 hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="w-5" />
        )}

        <div
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => onSelect(document.id)}
        >
          {document.icon ? (
            <span className="text-base">{document.icon}</span>
          ) : (
            <File className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{document.title || 'Untitled'}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onCreate(document.id)}>
              <FilePlus className="h-4 w-4 mr-2" />
              Add subpage
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              Add to favorites
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(document.id)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(document.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && (
        <CollapsibleContent>
          {document.children?.map((child) => (
            <DocumentItem
              key={child.id}
              document={{ ...child, children: [] }}
              isSelected={selectedId === child.id}
              isExpanded={false}
              onToggleExpand={() => {}}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onArchive={onArchive}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
