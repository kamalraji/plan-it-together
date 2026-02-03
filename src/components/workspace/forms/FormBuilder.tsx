import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Settings2,
  Type,
  Hash,
  Mail,
  Calendar,
  List,
  ToggleLeft,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: {
    allowMultipleSubmissions: boolean;
    sendNotifications: boolean;
    autoCreateTask: boolean;
  };
}

interface FormBuilderProps {
  workspaceId: string;
  initialForm?: Partial<FormDefinition>;
  onSave?: (form: FormDefinition) => void;
  onPreview?: () => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Short Text', icon: <Type className="h-4 w-4" /> },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft className="h-4 w-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
  { type: 'select', label: 'Dropdown', icon: <List className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <ToggleLeft className="h-4 w-4" /> },
  { type: 'radio', label: 'Radio', icon: <List className="h-4 w-4" /> },
];

export function FormBuilder({
  workspaceId: _workspaceId,
  initialForm,
  onSave,
  onPreview,
}: FormBuilderProps) {
  const [title, setTitle] = useState(initialForm?.title || '');
  const [description, setDescription] = useState(initialForm?.description || '');
  const [fields, setFields] = useState<FormField[]>(initialForm?.fields || []);
  const [settings, setSettings] = useState(
    initialForm?.settings || {
      allowMultipleSubmissions: false,
      sendNotifications: true,
      autoCreateTask: false,
    }
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const addField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `${FIELD_TYPES.find(f => f.type === type)?.label} Field`,
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' 
        ? ['Option 1', 'Option 2'] 
        : undefined,
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev =>
      prev.map(f => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a form title',
        variant: 'destructive',
      });
      return;
    }

    const form: FormDefinition = {
      id: initialForm?.id || `form-${Date.now()}`,
      title,
      description,
      fields,
      settings,
    };

    onSave?.(form);
    toast({
      title: 'Form Saved',
      description: 'Your form has been saved successfully',
    });
  }, [title, description, fields, settings, initialForm?.id, onSave]);

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Field Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Field Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FIELD_TYPES.map((ft) => (
            <Button
              key={ft.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => addField(ft.type)}
            >
              {ft.icon}
              <span className="ml-2">{ft.label}</span>
              <Plus className="h-4 w-4 ml-auto opacity-50" />
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Center: Form Preview */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Form Preview</CardTitle>
            <div className="flex gap-2">
              {onPreview && (
                <Button variant="outline" size="sm" onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              )}
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Form Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
            <Textarea
              placeholder="Form description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {fields.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Add fields from the left panel
                    </p>
                  </div>
                ) : (
                  fields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFieldId === field.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px] px-1">
                            Required
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <FieldPreview field={field} />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Right: Field Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            {selectedField ? 'Field Settings' : 'Form Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedField ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={selectedField.placeholder || ''}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={selectedField.required}
                  onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                />
              </div>

              {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {selectedField.options?.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[idx] = e.target.value;
                          updateField(selectedField.id, { options: newOptions });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== idx);
                          updateField(selectedField.id, { options: newOptions });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      updateField(selectedField.id, {
                        options: [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`],
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Multiple Submissions</Label>
                  <p className="text-xs text-muted-foreground">Allow users to submit multiple times</p>
                </div>
                <Switch
                  checked={settings.allowMultipleSubmissions}
                  onCheckedChange={(checked) =>
                    setSettings(s => ({ ...s, allowMultipleSubmissions: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Notifications</Label>
                  <p className="text-xs text-muted-foreground">Notify on new submissions</p>
                </div>
                <Switch
                  checked={settings.sendNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(s => ({ ...s, sendNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Create Task</Label>
                  <p className="text-xs text-muted-foreground">Create a task for each submission</p>
                </div>
                <Switch
                  checked={settings.autoCreateTask}
                  onCheckedChange={(checked) =>
                    setSettings(s => ({ ...s, autoCreateTask: checked }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <Input
          type={field.type}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          disabled
        />
      );
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          rows={2}
          disabled
        />
      );
    case 'date':
      return <Input type="date" disabled />;
    case 'select':
      return (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );
    case 'checkbox':
    case 'radio':
      return (
        <div className="space-y-1">
          {field.options?.slice(0, 2).map((opt, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-4 h-4 border rounded-${field.type === 'radio' ? 'full' : 'sm'}`} />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}
