/**
 * RegistrationFunnelCard
 * Displays conversion funnel through registration stages
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  waitlisted: number;
  cancelled: number;
  checkedIn: number;
}

interface RegistrationFunnelCardProps {
  stats: RegistrationStats | undefined;
  isLoading?: boolean;
}

const FunnelStage: React.FC<{
  label: string;
  value: number;
  percentage: number;
}> = ({ label, value, percentage }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value} ({percentage}%)</span>
    </div>
    <Progress value={percentage} className="h-2" />
  </div>
);

export const RegistrationFunnelCard: React.FC<RegistrationFunnelCardProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const confirmedPercentage = stats?.total 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;
  
  const checkedInPercentage = stats?.confirmed 
    ? Math.round((stats.checkedIn / stats.confirmed) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Registration Funnel
        </CardTitle>
        <CardDescription>Conversion through registration stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FunnelStage 
            label="Total Registrations" 
            value={stats?.total ?? 0} 
            percentage={100}
          />
          <FunnelStage 
            label="Confirmed" 
            value={stats?.confirmed ?? 0} 
            percentage={confirmedPercentage}
          />
          <FunnelStage 
            label="Checked In" 
            value={stats?.checkedIn ?? 0} 
            percentage={checkedInPercentage}
          />
          
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">{stats?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Waitlisted</span>
              <span className="font-medium">{stats?.waitlisted ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cancelled</span>
              <span className="font-medium text-destructive">{stats?.cancelled ?? 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationFunnelCard;
