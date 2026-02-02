import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, ShieldCheck, ShieldAlert, Lock, Key, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SecurityAuditTabProps {
  workspaceId: string;
}

const auditItems = [
  { category: 'Access Control', score: 92, status: 'passed', issues: 1, lastAudit: '2 days ago' },
  { category: 'Data Encryption', score: 100, status: 'passed', issues: 0, lastAudit: '1 week ago' },
  { category: 'Network Security', score: 78, status: 'warning', issues: 3, lastAudit: '3 days ago' },
  { category: 'User Authentication', score: 95, status: 'passed', issues: 1, lastAudit: '1 day ago' },
  { category: 'Backup & Recovery', score: 65, status: 'critical', issues: 5, lastAudit: '5 days ago' },
  { category: 'Compliance', score: 88, status: 'passed', issues: 2, lastAudit: '1 week ago' },
];

const recentFindings = [
  { id: 1, severity: 'high', title: 'Outdated SSL Certificate', system: 'Web Server', status: 'open' },
  { id: 2, severity: 'medium', title: 'Weak Password Policy', system: 'Active Directory', status: 'in-progress' },
  { id: 3, severity: 'low', title: 'Unused Admin Accounts', system: 'Database', status: 'resolved' },
  { id: 4, severity: 'high', title: 'Missing Firewall Rules', system: 'Network', status: 'open' },
  { id: 5, severity: 'medium', title: 'Backup Verification Failed', system: 'Storage', status: 'in-progress' },
];

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'high': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High</Badge>;
    case 'medium': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
    case 'low': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low</Badge>;
    default: return null;
  }
};

export function SecurityAuditTab({ workspaceId: _workspaceId }: SecurityAuditTabProps) {
  const overallScore = Math.round(auditItems.reduce((acc, item) => acc + item.score, 0) / auditItems.length);
  const totalIssues = auditItems.reduce((acc, item) => acc + item.issues, 0);
  const openFindings = recentFindings.filter(f => f.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Audit</h2>
          <p className="text-muted-foreground">Review security compliance and vulnerabilities</p>
        </div>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Run Full Audit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{overallScore}%</p>
                <p className="text-sm text-muted-foreground">Security Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{totalIssues}</p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{openFindings}</p>
                <p className="text-sm text-muted-foreground">Open Findings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{auditItems.filter(a => a.status === 'passed').length}</p>
                <p className="text-sm text-muted-foreground">Categories Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Audit Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditItems.map((item) => (
              <div key={item.category} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {item.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {item.status === 'critical' && <ShieldAlert className="h-4 w-4 text-red-500" />}
                    <p className="font-medium">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.issues} issues</span>
                    <span className="text-sm font-medium">{item.score}%</span>
                  </div>
                </div>
                <Progress value={item.score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Last audit: {item.lastAudit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFindings.map((finding) => (
              <div key={finding.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{finding.title}</p>
                    <p className="text-xs text-muted-foreground">{finding.system}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(finding.severity)}
                  <Badge variant={finding.status === 'resolved' ? 'secondary' : 'outline'}>
                    {finding.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
