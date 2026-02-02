import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, Cloud, Clock, CheckCircle2, AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface BackupStatusTabProps {
  workspaceId: string;
}

const backupJobs = [
  { id: 1, name: 'Production Database', type: 'database', status: 'completed', lastRun: '2 hours ago', nextRun: 'In 22 hours', size: '45.2 GB', retention: '30 days' },
  { id: 2, name: 'File Server', type: 'files', status: 'completed', lastRun: '6 hours ago', nextRun: 'In 18 hours', size: '128.5 GB', retention: '60 days' },
  { id: 3, name: 'Email Archive', type: 'email', status: 'running', lastRun: 'Now', nextRun: 'Tomorrow', size: '89.3 GB', retention: '365 days' },
  { id: 4, name: 'VM Snapshots', type: 'vm', status: 'failed', lastRun: '1 day ago', nextRun: 'Retrying...', size: '256 GB', retention: '14 days' },
  { id: 5, name: 'Config Backup', type: 'config', status: 'completed', lastRun: '4 hours ago', nextRun: 'In 20 hours', size: '1.2 GB', retention: '90 days' },
];

const storageLocations = [
  { name: 'Primary Storage', type: 'local', used: 2.4, total: 5, status: 'healthy' },
  { name: 'AWS S3', type: 'cloud', used: 1.8, total: 10, status: 'healthy' },
  { name: 'Offsite Tape', type: 'tape', used: 3.2, total: 8, status: 'healthy' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
    case 'running': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    case 'failed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
    default: return null;
  }
};

export function BackupStatusTab({ workspaceId: _workspaceId }: BackupStatusTabProps) {
  const completedJobs = backupJobs.filter(j => j.status === 'completed').length;
  const failedJobs = backupJobs.filter(j => j.status === 'failed').length;
  const totalSize = '520.2 GB';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup Status</h2>
          <p className="text-muted-foreground">Monitor backup jobs and storage capacity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run All Backups
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{backupJobs.length}</p>
                <p className="text-sm text-muted-foreground">Backup Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{completedJobs}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{failedJobs}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{totalSize}</p>
                <p className="text-sm text-muted-foreground">Total Backed Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Storage Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storageLocations.map((location) => (
              <div key={location.name} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">{location.name}</p>
                  <Badge variant="outline">{location.type}</Badge>
                </div>
                <Progress value={(location.used / location.total) * 100} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {location.used} TB / {location.total} TB used
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backupJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last: {job.lastRun} • Next: {job.nextRun}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.size}</p>
                    <p className="text-xs text-muted-foreground">Retention: {job.retention}</p>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
