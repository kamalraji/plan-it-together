import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, ExternalLink, Users, TrendingUp, FileText, Instagram, Twitter, Linkedin, Facebook, Youtube, Edit2, Trash2, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSocialPlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform, SocialPlatform } from '@/hooks/useSocialMediaCommitteeData';

interface ManagePlatformsSocialTabProps {
  workspaceId: string;
}

const PLATFORM_CONFIG = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bgGradient: 'from-pink-500 to-purple-600' },
  { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-500', bgGradient: 'from-sky-400 to-sky-600' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-700' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', bgGradient: 'from-blue-400 to-blue-600' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bgGradient: 'from-red-500 to-red-700' },
  { id: 'tiktok', label: 'TikTok', icon: FileText, color: 'text-foreground', bgGradient: 'from-gray-800 to-gray-900' },
];

export function ManagePlatformsSocialTab({ workspaceId }: ManagePlatformsSocialTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<SocialPlatform | null>(null);

  // Form state
  const [platform, setPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [followersCount, setFollowersCount] = useState('');

  // Queries & Mutations
  const { data: platforms = [], isLoading } = useSocialPlatforms(workspaceId);
  const createPlatform = useCreatePlatform(workspaceId);
  const updatePlatform = useUpdatePlatform(workspaceId);
  const deletePlatform = useDeletePlatform(workspaceId);

  const connectedPlatformIds = platforms.map(p => p.platform);
  const availablePlatforms = PLATFORM_CONFIG.filter(p => !connectedPlatformIds.includes(p.id));

  const resetForm = () => {
    setPlatform('');
    setHandle('');
    setDisplayName('');
    setProfileUrl('');
    setFollowersCount('');
    setEditingPlatform(null);
  };

  const openEditDialog = (p: SocialPlatform) => {
    setEditingPlatform(p);
    setPlatform(p.platform);
    setHandle(p.handle);
    setDisplayName(p.display_name || '');
    setProfileUrl(p.profile_url || '');
    setFollowersCount(p.followers_count.toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!handle.trim()) return;

    const data = {
      platform: editingPlatform ? editingPlatform.platform : platform,
      handle: handle.replace(/^@/, ''),
      display_name: displayName || null,
      profile_url: profileUrl || null,
      followers_count: parseInt(followersCount) || 0,
    };

    if (editingPlatform) {
      updatePlatform.mutate({ id: editingPlatform.id, ...data });
    } else {
      createPlatform.mutate(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to disconnect this platform?')) {
      deletePlatform.mutate(id);
    }
  };

  const handleToggleConnection = (p: SocialPlatform) => {
    updatePlatform.mutate({ id: p.id, is_connected: !p.is_connected });
  };

  const getPlatformConfig = (platformId: string) => {
    return PLATFORM_CONFIG.find(p => p.id === platformId) || PLATFORM_CONFIG[0];
  };

  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers_count, 0);
  const avgEngagement = platforms.length > 0 
    ? platforms.reduce((sum, p) => sum + Number(p.engagement_rate), 0) / platforms.length 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Platforms</h2>
          <p className="text-muted-foreground">Connect and manage your social media accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={availablePlatforms.length === 0}>
              <Plus className="h-4 w-4" />
              Connect Platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlatform ? 'Edit Platform' : 'Connect New Platform'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {!editingPlatform && (
                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlatforms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <p.icon className={`h-4 w-4 ${p.color}`} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Handle / Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                    placeholder="username"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Display Name (optional)</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Brand Name"
                />
              </div>

              <div>
                <Label>Profile URL (optional)</Label>
                <Input
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <Label>Current Followers</Label>
                <Input
                  type="number"
                  value={followersCount}
                  onChange={(e) => setFollowersCount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!handle.trim() || (!editingPlatform && !platform)}>
                  {editingPlatform ? 'Update' : 'Connect'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Link2 className="h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
            <div className="text-2xl font-bold">{platforms.filter(p => p.is_connected).length} / {PLATFORM_CONFIG.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Followers</span>
            </div>
            <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Avg. Engagement</span>
            </div>
            <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Platforms */}
      {platforms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No platforms connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your social media accounts to start managing them
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Connect Platform</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => {
            const config = getPlatformConfig(p.platform);
            const Icon = config.icon;
            
            return (
              <Card key={p.id} className={`overflow-hidden ${!p.is_connected ? 'opacity-60' : ''}`}>
                <div className={`h-2 bg-gradient-to-r ${config.bgGradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <CardTitle className="text-base">{config.label}</CardTitle>
                    </div>
                    <Switch
                      checked={p.is_connected}
                      onCheckedChange={() => handleToggleConnection(p)}
                    />
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    @{p.handle}
                    {p.profile_url && (
                      <a 
                        href={p.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-lg font-bold">{p.followers_count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{p.posts_count}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{p.engagement_rate}%</p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                  </div>

                  {p.last_synced_at && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Last synced: {format(new Date(p.last_synced_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available Platforms to Connect */}
      {availablePlatforms.length > 0 && platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Platforms</CardTitle>
            <CardDescription>Connect more platforms to expand your reach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setPlatform(p.id);
                    setIsDialogOpen(true);
                  }}
                >
                  <p.icon className={`h-4 w-4 ${p.color}`} />
                  Connect {p.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
