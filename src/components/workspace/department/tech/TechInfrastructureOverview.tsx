import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Wifi, 
  Database, 
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function TechInfrastructureOverview() {
  const infrastructure = [
    {
      name: 'Main Event Network',
      type: 'Network',
      status: 'operational',
      load: 45,
      icon: Wifi,
    },
    {
      name: 'Registration Server',
      type: 'Server',
      status: 'operational',
      load: 62,
      icon: Server,
    },
    {
      name: 'Event Database',
      type: 'Database',
      status: 'operational',
      load: 38,
      icon: Database,
    },
    {
      name: 'Security Gateway',
      type: 'Security',
      status: 'maintenance',
      load: 0,
      icon: Shield,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Operational
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600/30 bg-yellow-500/10">
            <AlertCircle className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-red-600 border-red-600/30 bg-red-500/10">
            <AlertCircle className="h-3 w-3 mr-1" />
            Down
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Infrastructure Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {infrastructure.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>
              {getStatusBadge(item.status)}
            </div>
            {item.status === 'operational' && (
              <div className="flex items-center gap-2">
                <Progress value={item.load} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {item.load}%
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
