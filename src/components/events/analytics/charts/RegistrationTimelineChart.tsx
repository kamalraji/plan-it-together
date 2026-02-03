/**
 * RegistrationTimelineChart
 * Displays daily registration trends over time
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

interface TimelineDataPoint {
  date: string;
  registrations: number;
  revenue: number;
}

interface RegistrationTimelineChartProps {
  data: TimelineDataPoint[] | undefined;
  isLoading?: boolean;
  dateRangeLabel?: string;
}

export const RegistrationTimelineChart: React.FC<RegistrationTimelineChartProps> = ({
  data,
  isLoading,
  dateRangeLabel = 'the selected period',
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Registration Timeline
        </CardTitle>
        <CardDescription>
          Daily registrations over {dateRangeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]" role="img" aria-label="Registration timeline chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationTimelineChart;
