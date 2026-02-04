import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  PERMISSION_PRESETS, 
  ChannelPermissions, 
  PermissionPresetId,
  getPermissionPreset 
} from '@/lib/channelTemplates';
import { 
  Eye, 
  Pencil, 
  ThumbsUp, 
  MessageSquare, 
  Paperclip, 
  AtSign, 
  Shield, 
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelPermissionsEditorProps {
  channelId?: string;
  channelName: string;
  currentPermissions: ChannelPermissions;
  onPermissionsChange: (permissions: ChannelPermissions) => void;
  onSave?: () => void;
  isLoading?: boolean;
}

const permissionItems = [
  { key: 'can_read' as const, label: 'Read Messages', icon: Eye, description: 'View messages in this channel' },
  { key: 'can_write' as const, label: 'Send Messages', icon: Pencil, description: 'Post new messages' },
  { key: 'can_react' as const, label: 'Add Reactions', icon: ThumbsUp, description: 'React to messages with emoji' },
  { key: 'can_thread_reply' as const, label: 'Thread Replies', icon: MessageSquare, description: 'Reply in message threads' },
  { key: 'can_upload_files' as const, label: 'Upload Files', icon: Paperclip, description: 'Share files and attachments' },
  { key: 'can_mention_all' as const, label: 'Mention @all', icon: AtSign, description: 'Send notifications to all members' },
];

export function ChannelPermissionsEditor({
  channelName,
  currentPermissions,
  onPermissionsChange,
  onSave,
  isLoading = false,
}: ChannelPermissionsEditorProps) {
  const [selectedPreset, setSelectedPreset] = useState<PermissionPresetId | 'custom'>(() => {
    // Detect if current permissions match any preset
    for (const preset of PERMISSION_PRESETS) {
      const match = Object.keys(preset.permissions).every(
        key => preset.permissions[key as keyof ChannelPermissions] === currentPermissions[key as keyof ChannelPermissions]
      );
      if (match) return preset.id;
    }
    return 'custom';
  });

  const handlePresetChange = (presetId: PermissionPresetId | 'custom') => {
    setSelectedPreset(presetId);
    if (presetId !== 'custom') {
      const preset = getPermissionPreset(presetId as PermissionPresetId);
      if (preset) {
        onPermissionsChange(preset.permissions);
      }
    }
  };

  const handleTogglePermission = (key: keyof ChannelPermissions) => {
    setSelectedPreset('custom');
    onPermissionsChange({
      ...currentPermissions,
      [key]: !currentPermissions[key],
    });
  };

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold">Participant Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure what participants can do in #{channelName}
          </p>
        </div>
      </div>

      {/* Preset Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Presets</CardTitle>
          <CardDescription>Choose a permission preset or customize individually</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedPreset} 
            onValueChange={(val) => handlePresetChange(val as PermissionPresetId | 'custom')}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {PERMISSION_PRESETS.map((preset) => (
              <div key={preset.id} className="relative">
                <RadioGroupItem
                  value={preset.id}
                  id={`preset-${preset.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`preset-${preset.id}`}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{preset.name}</span>
                    {selectedPreset === preset.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.permissions.can_write ? (
                      <Badge variant="secondary" className="text-xs">
                        <Unlock className="h-3 w-3 mr-1" />
                        Can post
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Read only
                      </Badge>
                    )}
                    {preset.permissions.can_upload_files && (
                      <Badge variant="secondary" className="text-xs">
                        <Paperclip className="h-3 w-3 mr-1" />
                        Files
                      </Badge>
                    )}
                    {preset.permissions.can_mention_all && (
                      <Badge variant="secondary" className="text-xs">
                        <AtSign className="h-3 w-3 mr-1" />
                        @all
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Custom Permissions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Custom Permissions</CardTitle>
              <CardDescription>Fine-tune individual permissions</CardDescription>
            </div>
            {selectedPreset === 'custom' && (
              <Badge variant="outline">Custom</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permissionItems.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor={`perm-${key}`} className="font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                id={`perm-${key}`}
                checked={currentPermissions[key]}
                onCheckedChange={() => handleTogglePermission(key)}
                disabled={key === 'can_read'} // Read is always required
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      )}
    </div>
  );
}
