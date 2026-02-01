import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, FileCode, GitCompare, CheckCircle2, AlertTriangle, Clock, Eye, History } from 'lucide-react';

interface ConfigReviewTabProps {
  workspaceId: string;
}

const configItems = [
  { id: 1, name: 'firewall-rules.json', system: 'Network Firewall', lastModified: '2 hours ago', modifiedBy: 'Admin', status: 'reviewed', changes: 3 },
  { id: 2, name: 'nginx.conf', system: 'Web Server', lastModified: '1 day ago', modifiedBy: 'DevOps', status: 'pending', changes: 12 },
  { id: 3, name: 'database.yml', system: 'PostgreSQL', lastModified: '3 days ago', modifiedBy: 'DBA', status: 'reviewed', changes: 5 },
  { id: 4, name: 'ldap-config.xml', system: 'Active Directory', lastModified: '1 week ago', modifiedBy: 'Admin', status: 'reviewed', changes: 2 },
  { id: 5, name: 'backup-policy.json', system: 'Backup System', lastModified: '2 weeks ago', modifiedBy: 'IT Manager', status: 'outdated', changes: 0 },
];

const changeHistory = [
  { id: 1, config: 'firewall-rules.json', action: 'Modified', user: 'Admin', timestamp: '2 hours ago', description: 'Added new port rules for VPN' },
  { id: 2, config: 'nginx.conf', action: 'Modified', user: 'DevOps', timestamp: '1 day ago', description: 'Updated SSL configuration' },
  { id: 3, config: 'database.yml', action: 'Modified', user: 'DBA', timestamp: '3 days ago', description: 'Increased connection pool size' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'reviewed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Reviewed</Badge>;
    case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending Review</Badge>;
    case 'outdated': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Outdated</Badge>;
    default: return null;
  }
};

export function ConfigReviewTab({ workspaceId: _workspaceId }: ConfigReviewTabProps) {
  const pendingReviews = configItems.filter(c => c.status === 'pending').length;
  const outdatedConfigs = configItems.filter(c => c.status === 'outdated').length;
  const reviewedConfigs = configItems.filter(c => c.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Config Review</h2>
          <p className="text-muted-foreground">Review and manage system configurations</p>
        </div>
        <Button variant="outline" size="sm">
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Versions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileCode className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{configItems.length}</p>
                <p className="text-sm text-muted-foreground">Config Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{pendingReviews}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{reviewedConfigs}</p>
                <p className="text-sm text-muted-foreground">Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{outdatedConfigs}</p>
                <p className="text-sm text-muted-foreground">Outdated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {configItems.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <FileCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium font-mono text-sm">{config.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.system} • Modified by {config.modifiedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{config.lastModified}</p>
                    <p className="text-xs text-muted-foreground">{config.changes} changes</p>
                  </div>
                  {getStatusBadge(config.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {changeHistory.map((change) => (
              <div key={change.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      <span className="font-mono">{change.config}</span>
                      <span className="text-muted-foreground"> • {change.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{change.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{change.user}</p>
                  <p className="text-xs text-muted-foreground">{change.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
