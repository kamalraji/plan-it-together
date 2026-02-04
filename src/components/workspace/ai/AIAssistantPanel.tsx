/**
 * AIAssistantPanel - Floating AI helper for workspace content
 */
import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIContentAssist } from '@/hooks/useAIContentAssist';


type AssistType = 'task_description' | 'message_compose' | 'summarize' | 'suggest_subtasks';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (content: string) => void;
  workspaceName?: string;
  defaultType?: AssistType;
  defaultContent?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  onInsert,
  workspaceName,
  defaultType = 'task_description',
  defaultContent = '',
}) => {
  const [assistType, setAssistType] = useState<AssistType>(defaultType);
  const [input, setInput] = useState(defaultContent);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { generate, isLoading } = useAIContentAssist();

  const handleGenerate = async () => {
    if (!input.trim()) return;

    const content = await generate(assistType, input, { workspaceName });
    if (content) {
      setResult(content);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (result && onInsert) {
      onInsert(result);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleGenerate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Type Selector */}
          <Select value={assistType} onValueChange={(v) => setAssistType(v as AssistType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task_description">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Task Description
                </div>
              </SelectItem>
              <SelectItem value="message_compose">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Compose Message
                </div>
              </SelectItem>
              <SelectItem value="summarize">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Summarize
                </div>
              </SelectItem>
              <SelectItem value="suggest_subtasks">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Suggest Subtasks
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              assistType === 'task_description'
                ? 'Enter task title or brief description...'
                : assistType === 'message_compose'
                ? 'What do you want to communicate?'
                : assistType === 'summarize'
                ? 'Paste content to summarize...'
                : 'Enter task title and description...'
            }
            className="min-h-[80px] resize-none"
          />

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!input.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {result}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                {onInsert && (
                  <Button size="sm" onClick={handleInsert} className="flex-1">
                    Insert
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to generate
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
