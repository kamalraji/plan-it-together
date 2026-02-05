/**
 * TeamCapacityChart - Recharts-based bar chart for team utilization
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MemberCapacity {
  name: string;
  assigned: number;
  capacity: number;
  utilization: number;
}

interface TeamCapacityChartProps {
  data: MemberCapacity[];
  title?: string;
  className?: string;
}

export const TeamCapacityChart: React.FC<TeamCapacityChartProps> = ({
  data,
  title = 'Team Capacity Overview',
  className,
}) => {
  const chartData = data.map((member) => ({
    name: member.name.split(' ')[0], // First name only for chart
    fullName: member.name,
    assigned: member.assigned,
    capacity: member.capacity,
    available: Math.max(0, member.capacity - member.assigned),
    utilization: member.utilization,
  }));

  const getBarColor = (utilization: number) => {
    if (utilization > 100) return 'hsl(var(--destructive))';
    if (utilization > 80) return 'hsl(45, 93%, 47%)'; // Yellow
    if (utilization < 30) return 'hsl(var(--muted-foreground))';
    return 'hsl(142, 76%, 36%)'; // Green
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-1">{data.fullName}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Assigned: {data.assigned}h</p>
            <p>Capacity: {data.capacity}h</p>
            <p>Available: {data.available}h</p>
            <p className="font-medium text-foreground">
              Utilization: {data.utilization}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 'dataMax']} unit="h" />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="hsl(var(--border))" />
              
              {/* Assigned hours bar */}
              <Bar dataKey="assigned" name="Assigned" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
                ))}
              </Bar>
              
              {/* Available capacity bar (stacked) */}
              <Bar
                dataKey="available"
                name="Available"
                fill="hsl(var(--muted))"
                radius={[0, 4, 4, 0]}
                stackId="capacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success" />
            <span>Healthy (30-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span>At Capacity (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>Overloaded (&gt;100%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
