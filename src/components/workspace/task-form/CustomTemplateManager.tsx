import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Bookmark, 
  X,
  Check,
  Loader2
} from 'lucide-react';
import { TaskCategory, TaskPriority } from '@/types';
import { TaskFormData } from '../TaskForm';

interface CustomTemplate {
  id: string;
  name: string;
  icon: string;
  category: TaskCategory;
  priority: TaskPriority;
  description: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

interface CustomTemplateManagerProps {
  workspaceId: string;
  currentFormData: TaskFormData;
  onTemplateSelect: (template: CustomTemplate) => void;
  disabled?: boolean;
}

const ICONS = ['📌', '⭐', '🎯', '📋', '🔧', '💡', '🚀', '📊', '🎨', '📝'];

export function CustomTemplateManager({
  workspaceId,
  currentFormData,
  onTemplateSelect,
  disabled = false
}: CustomTemplateManagerProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📌');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [workspaceId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_custom_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(
        (data || []).map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon || '📌',
          category: (t.category as TaskCategory) || TaskCategory.GENERAL,
          priority: (t.priority as TaskPriority) || TaskPriority.MEDIUM,
          description: t.description || '',
          tags: t.tags || [],
          createdBy: t.created_by || '',
          createdAt: t.created_at,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch custom templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase.from('workspace_custom_templates').insert({
        workspace_id: workspaceId,
        name: newTemplateName.trim(),
        icon: selectedIcon,
        category: currentFormData.category,
        priority: currentFormData.priority,
        description: currentFormData.description,
        tags: currentFormData.tags,
        created_by: user?.id,
      });

      if (error) throw error;

      await fetchTemplates();
      setShowSaveForm(false);
      setNewTemplateName('');
      setSelectedIcon('📌');
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_custom_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Custom Templates List */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative"
            >
              <button
                type="button"
                onClick={() => onTemplateSelect(template)}
                disabled={disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all",
                  "bg-secondary/50 border-secondary text-secondary-foreground hover:bg-secondary"
                )}
              >
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(template.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save as Template Button/Form */}
      {showSaveForm ? (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
          <div className="flex gap-1">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={cn(
                  "w-6 h-6 rounded text-sm flex items-center justify-center transition-all",
                  selectedIcon === icon
                    ? "bg-primary/20 ring-1 ring-primary"
                    : "hover:bg-muted"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
          <Input
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Template name..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowSaveForm(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveTemplate}
            disabled={saving || !newTemplateName.trim()}
            className="h-7 px-2"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSaveForm(true)}
          disabled={disabled || !currentFormData.title.trim()}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            (!currentFormData.title.trim() || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Bookmark className="h-3 w-3" />
          Save as template
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
