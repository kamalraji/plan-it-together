interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface WorkspaceAnalyticsChartProps {
  data: ChartDataPoint[];
  title: string;
  type: 'line' | 'bar';
  color?: string;
  height?: number;
}

export function WorkspaceAnalyticsChart({ 
  data, 
  title, 
  type = 'line', 
  color = '#4F46E5',
  height = 200 
}: WorkspaceAnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Simple SVG-based chart implementation
  const chartWidth = 600;
  const chartHeight = height;
  const padding = 40;
  const innerWidth = chartWidth - (padding * 2);
  const innerHeight = chartHeight - (padding * 2);

  const getX = (index: number) => padding + (index / (data.length - 1)) * innerWidth;
  const getY = (value: number) => padding + ((maxValue - value) / range) * innerHeight;

  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
      
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="w-full h-auto">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = minValue + (range * ratio);
            const y = padding + ((1 - ratio) * innerHeight);
            return (
              <g key={ratio}>
                <line 
                  x1={padding - 5} 
                  y1={y} 
                  x2={padding} 
                  y2={y} 
                  stroke="#6b7280" 
                  strokeWidth="1"
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-xs fill-gray-600"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
              const x = getX(index);
              return (
                <g key={index}>
                  <line 
                    x1={x} 
                    y1={chartHeight - padding} 
                    x2={x} 
                    y2={chartHeight - padding + 5} 
                    stroke="#6b7280" 
                    strokeWidth="1"
                  />
                  <text 
                    x={x} 
                    y={chartHeight - padding + 18} 
                    textAnchor="middle" 
                    className="text-xs fill-gray-600"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </text>
                </g>
              );
            }
            return null;
          })}
          
          {/* Chart content */}
          {type === 'line' ? (
            <>
              {/* Line path */}
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {data.map((point, index) => (
                <circle
                  key={index}
                  cx={getX(index)}
                  cy={getY(point.value)}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${point.date}: ${point.value}`}</title>
                </circle>
              ))}
            </>
          ) : (
            /* Bar chart */
            data.map((point, index) => {
              const x = getX(index) - 15;
              const y = getY(point.value);
              const barHeight = (chartHeight - padding) - y;
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="30"
                  height={barHeight}
                  fill={color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${point.date}: ${point.value}`}</title>
                </rect>
              );
            })
          )}
          
          {/* Axes */}
          <line 
            x1={padding} 
            y1={padding} 
            x2={padding} 
            y2={chartHeight - padding} 
            stroke="#374151" 
            strokeWidth="2"
          />
          <line 
            x1={padding} 
            y1={chartHeight - padding} 
            x2={chartWidth - padding} 
            y2={chartHeight - padding} 
            stroke="#374151" 
            strokeWidth="2"
          />
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          ></div>
          <span className="text-sm text-muted-foreground">
            {data.length} data points
          </span>
        </div>
      </div>
    </div>
  );
}