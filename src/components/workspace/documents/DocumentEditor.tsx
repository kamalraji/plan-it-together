import { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document } from '@/hooks/useDocuments';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface DocumentEditorProps {
  document: Document;
  onUpdate: (updates: Partial<Document>) => Promise<boolean>;
  onSaveVersion?: () => void;
  readOnly?: boolean;
}

export function DocumentEditor({
  document,
  onUpdate,
  onSaveVersion,
  readOnly = false,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      Placeholder.configure({
        placeholder: 'Start typing or press "/" for commands...',
      }),
    ],
    content: document.content || { type: 'doc', content: [] },
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      debouncedSaveContent(editor.getJSON());
    },
  });

  // Debounced content save
  const debouncedSaveContent = useCallback(
    debounce(async (content: any) => {
      setIsSaving(true);
      await onUpdate({ content });
      setIsSaving(false);
    }, 1000),
    [onUpdate]
  );

  // Update editor content when document changes externally
  useEffect(() => {
    if (editor && document.content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(document.content);
      if (currentContent !== newContent) {
        editor.commands.setContent(document.content);
      }
    }
  }, [document.content, editor]);

  // Update title
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);
      await onUpdate({ title: newTitle });
    },
    [onUpdate]
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    tooltip,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled || readOnly}
          className={cn(
            'h-8 w-8 p-0',
            active && 'bg-muted text-foreground'
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur sticky top-0 z-10 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            tooltip="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            tooltip="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            tooltip="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            tooltip="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            tooltip="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            tooltip="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            tooltip="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            tooltip="Code Block"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addLink} active={editor.isActive('link')} tooltip="Add Link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          {onSaveVersion && (
            <Button variant="outline" size="sm" onClick={onSaveVersion} className="gap-2">
              <Save className="h-4 w-4" />
              Save Version
            </Button>
          )}

          {isSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
          )}
        </div>
      )}

      {/* Title */}
      <div className="px-8 md:px-16 lg:px-24 pt-8">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
          readOnly={readOnly}
        />
      </div>

      {/* Editor Content */}
      <div className="flex-1 px-8 md:px-16 lg:px-24 py-4 overflow-auto">
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[300px] focus:outline-none"
        />
      </div>
    </div>
  );
}
