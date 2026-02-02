/**
 * TicketDistributionChart
 * Pie chart showing distribution of tickets by tier
 */

import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Color palette for chart segments
const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

interface TierData {
  name: string;
  count: number;
}

interface TicketDistributionChartProps {
  data: TierData[] | undefined;
  isLoading?: boolean;
}

export const TicketDistributionChart: React.FC<TicketDistributionChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] sm:h-[300px] w-full rounded-full mx-auto max-w-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Ticket Distribution
        </CardTitle>
        <CardDescription>Breakdown by ticket tier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]" role="img" aria-label="Ticket distribution pie chart">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No ticket data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketDistributionChart;
