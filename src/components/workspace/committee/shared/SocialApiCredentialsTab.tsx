import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Shield, CheckCircle, XCircle, Loader2, Eye, EyeOff, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocialApiCredentials, useSaveSocialApiCredentials } from '@/hooks/useContentApprovalWorkflow';
import { toast } from 'sonner';

// Platform icon components (simplified)
const TwitterIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const LinkedinIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const InstagramIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>;

interface SocialApiCredentialsTabProps { workspaceId: string; }
interface PlatformConfig { id: string; name: string; icon: React.FC; color: string; bgColor: string; fields: { key: string; label: string; type: 'text' | 'password' }[]; }

const PLATFORMS: PlatformConfig[] = [
  { id: 'twitter', name: 'Twitter / X', icon: TwitterIcon, color: 'text-sky-500', bgColor: 'bg-sky-500/10', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'api_secret', label: 'API Secret', type: 'password' }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, color: 'text-info', bgColor: 'bg-primary/10', fields: [{ key: 'client_id', label: 'Client ID', type: 'text' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500', bgColor: 'bg-pink-500/10', fields: [{ key: 'app_id', label: 'App ID', type: 'text' }, { key: 'app_secret', label: 'App Secret', type: 'password' }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
];

export function SocialApiCredentialsTab({ workspaceId }: SocialApiCredentialsTabProps) {
  const [editingPlatform, setEditingPlatform] = useState<PlatformConfig | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { data: apiCredentials } = useSocialApiCredentials(workspaceId);
  const { mutateAsync: saveApiCredentials, isPending: isSaving } = useSaveSocialApiCredentials(workspaceId);

  const getCredentialsForPlatform = (platformId: string) => apiCredentials?.find((c: { platform: string }) => c.platform === platformId);

  const handleSaveCredentials = async () => {
    if (!editingPlatform) return;
    try {
      await saveApiCredentials({ platform: editingPlatform.id, credential_type: 'api_key', credentials });
      toast.success(`${editingPlatform.name} credentials saved`);
      setEditingPlatform(null);
      setCredentials({});
    } catch { toast.error('Failed to save credentials'); }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/50 bg-amber-500/10"><Shield className="h-4 w-4 text-amber-500" /><AlertDescription className="text-amber-700 dark:text-amber-400">API credentials are encrypted and stored securely.</AlertDescription></Alert>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const creds = getCredentialsForPlatform(platform.id);
          const isConnected = creds?.is_active;
          return (
            <Card key={platform.id} className={cn('transition-all hover:shadow-md', isConnected && 'ring-2 ring-success/30')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={cn('p-3 rounded-xl', platform.bgColor)}><Icon /></div>
                  <Badge variant="outline" className={cn('text-xs', isConnected ? 'bg-success/10 text-success' : 'bg-muted')}>{isConnected ? <><CheckCircle className="h-3 w-3 mr-1" />Connected</> : <><XCircle className="h-3 w-3 mr-1" />Not Connected</>}</Badge>
                </div>
                <CardTitle className="text-lg">{platform.name}</CardTitle>
                <CardDescription className="text-xs">{isConnected ? 'Connected' : 'Configure to enable posting'}</CardDescription>
              </CardHeader>
              <CardContent><Button variant="outline" size="sm" className="w-full" onClick={() => { setEditingPlatform(platform); setCredentials({}); }}><Key className="h-4 w-4 mr-2" />{isConnected ? 'Update' : 'Configure'}</Button></CardContent>
            </Card>
          );
        })}
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />Integration Status</CardTitle></CardHeader><CardContent><div className="space-y-2">{PLATFORMS.map((p) => { const c = getCredentialsForPlatform(p.id); const Icon = p.icon; return (<div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><div className="flex items-center gap-3"><Icon /><span className="font-medium text-sm">{p.name}</span></div><div className={cn('w-2 h-2 rounded-full', c?.is_active ? 'bg-success' : 'bg-muted-foreground')} /></div>); })}</div></CardContent></Card>
      <Dialog open={!!editingPlatform} onOpenChange={() => setEditingPlatform(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{editingPlatform && <>Configure {editingPlatform.name}</>}</DialogTitle><DialogDescription>Enter API credentials to enable automated posting.</DialogDescription></DialogHeader>
          {editingPlatform && (<div className="space-y-4">{editingPlatform.fields.map((field) => (<div key={field.key} className="space-y-2"><Label htmlFor={field.key}>{field.label}</Label><div className="relative"><Input id={field.key} type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'} value={credentials[field.key] || ''} onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))} />{field.type === 'password' && <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}>{showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>}</div></div>))}</div>)}
          <DialogFooter><Button variant="outline" onClick={() => setEditingPlatform(null)}>Cancel</Button><Button onClick={handleSaveCredentials} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Credentials</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
