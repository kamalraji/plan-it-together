import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Shield, Clock, AlertTriangle, Eye, EyeOff, RefreshCw, Plus } from "lucide-react";
import { useState } from "react";

interface UpdateCredentialsTabProps {
  workspaceId: string;
}

export function UpdateCredentialsTab({ workspaceId: _workspaceId }: UpdateCredentialsTabProps) {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const credentials = [
    { id: 1, name: "Database Admin", type: "database", lastRotated: "15 days ago", expiresIn: "15 days", status: "valid" },
    { id: 2, name: "API Key - Production", type: "api", lastRotated: "45 days ago", expiresIn: "45 days", status: "valid" },
    { id: 3, name: "SSL Certificate", type: "certificate", lastRotated: "320 days ago", expiresIn: "45 days", status: "expiring" },
    { id: 4, name: "AWS Access Key", type: "cloud", lastRotated: "5 days ago", expiresIn: "85 days", status: "valid" },
    { id: 5, name: "SMTP Credentials", type: "service", lastRotated: "90 days ago", expiresIn: "0 days", status: "expired" },
    { id: 6, name: "OAuth Client Secret", type: "api", lastRotated: "30 days ago", expiresIn: "60 days", status: "valid" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/10 text-green-600 text-xs">Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Expiring Soon</Badge>;
      case "expired": return <Badge className="bg-red-500/10 text-red-600 text-xs">Expired</Badge>;
      default: return null;
    }
  };

  const validCount = credentials.filter(c => c.status === "valid").length;
  const expiringCount = credentials.filter(c => c.status === "expiring").length;
  const expiredCount = credentials.filter(c => c.status === "expired").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Credential Management</h2>
          <p className="text-sm text-muted-foreground">Manage and rotate system credentials</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">{validCount}</div>
            <p className="text-xs text-muted-foreground">Valid</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">Expiring</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-red-600">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Stored Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{cred.name}</span>
                    <Badge variant="outline" className="text-xs">{cred.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Rotated {cred.lastRotated}
                    </span>
                    {cred.status !== "valid" && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expires in {cred.expiresIn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(cred.status)}
                <Button variant="ghost" size="sm" onClick={() => setShowPasswords(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}>
                  {showPasswords[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
