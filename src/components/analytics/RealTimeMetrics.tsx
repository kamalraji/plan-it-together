import React, { useState, useEffect, useRef } from 'react';
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  SignalIcon,
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface RealTimeMetricsProps {
  scope: 'event' | 'organization' | 'workspace' | 'global';
  eventId?: string;
  organizationId?: string;
  workspaceId?: string;
  refreshInterval?: number | null;
  onRefreshIntervalChange: (interval: number | null) => void;
}

interface RealTimeData {
  timestamp: string;
  activeUsers: number;
  registrations: number;
  checkIns: number;
  pageViews: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number[];
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  scope,
  eventId,
  organizationId,
  workspaceId,
  refreshInterval,
  onRefreshIntervalChange,
}) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<RealTimeData[]>([]);
  const intervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!refreshInterval || isPaused) {
      return;
    }

    const connectWebSocket = () => {
      try {
        let wsUrl = `ws://localhost:3001/ws/analytics`;

        if (scope === 'event' && eventId) {
          wsUrl += `?eventId=${eventId}`;
        } else if (scope === 'organization' && organizationId) {
          wsUrl += `?organizationId=${organizationId}`;
        } else if (scope === 'workspace' && workspaceId) {
          wsUrl += `?workspaceId=${workspaceId}`;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data: RealTimeData = JSON.parse(event.data);
            setRealTimeData(data);
            setHistoricalData(prev => [...prev.slice(-29), data]); // Keep last 30 data points
          } catch (_err) {
            // Parse WebSocket message failed silently
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (_err) => {
          setError('Connection error');
          setIsConnected(false);
        };
      } catch (_err) {
        setError('Failed to establish real-time connection');
      }
    };

    // Fallback to polling if WebSocket is not available
    const startPolling = () => {
      intervalRef.current = window.setInterval(async () => {
        try {
          let endpoint = '/api/analytics/realtime';

          if (scope === 'event' && eventId) {
            endpoint = `/api/events/${eventId}/analytics/realtime`;
          } else if (scope === 'organization' && organizationId) {
            endpoint = `/api/organizations/${organizationId}/analytics/realtime`;
          } else if (scope === 'workspace' && workspaceId) {
            endpoint = `/api/workspaces/${workspaceId}/analytics/realtime`;
          }

          const response = await fetch(endpoint, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch real-time data');
          }

          const data: RealTimeData = await response.json();
          setRealTimeData(data);
          setHistoricalData(prev => [...prev.slice(-29), data]);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      }, refreshInterval * 1000);
    };

    // Try WebSocket first, fallback to polling
    if (typeof WebSocket !== 'undefined') {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scope, eventId, organizationId, workspaceId, refreshInterval, isPaused]);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleRefreshIntervalChange = (interval: number | null) => {
    onRefreshIntervalChange(interval);
  };

  const getMetricCards = (): MetricCard[] => {
    if (!realTimeData) return [];

    const cards: MetricCard[] = [
      {
        id: 'active-users',
        title: 'Active Users',
        value: realTimeData.activeUsers,
        icon: UserGroupIcon,
        color: 'text-blue-600',
        trend: historicalData.map(d => d.activeUsers),
      },
      {
        id: 'registrations',
        title: 'New Registrations',
        value: realTimeData.registrations,
        icon: ChartBarIcon,
        color: 'text-green-600',
        trend: historicalData.map(d => d.registrations),
      },
      {
        id: 'check-ins',
        title: 'Check-ins',
        value: realTimeData.checkIns,
        icon: BoltIcon,
        color: 'text-purple-600',
        trend: historicalData.map(d => d.checkIns),
      },
      {
        id: 'page-views',
        title: 'Page Views',
        value: realTimeData.pageViews,
        icon: EyeIcon,
        color: 'text-orange-600',
        trend: historicalData.map(d => d.pageViews),
      },
    ];

    // Add system metrics for admin users
    if (scope === 'global') {
      cards.push(
        {
          id: 'system-load',
          title: 'System Load',
          value: `${(realTimeData.systemLoad * 100).toFixed(1)}%`,
          icon: SignalIcon,
          color: realTimeData.systemLoad > 0.8 ? 'text-red-600' : 'text-green-600',
        },
        {
          id: 'response-time',
          title: 'Response Time',
          value: `${realTimeData.responseTime}ms`,
          icon: ClockIcon,
          color: realTimeData.responseTime > 1000 ? 'text-red-600' : 'text-green-600',
        }
      );
    }

    return cards;
  };

  const refreshIntervalOptions = [
    { label: 'Paused', value: null },
    { label: '1 second', value: 1 },
    { label: '5 seconds', value: 5 },
    { label: '10 seconds', value: 10 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-foreground">Real-time Metrics</h2>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                } ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Refresh Interval Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">
                Refresh:
              </label>
              <select
                value={refreshInterval || ''}
                onChange={(e) => handleRefreshIntervalChange(
                  e.target.value ? parseInt(e.target.value) : null
                )}
                className="border-input rounded-md text-sm focus-visible:ring-ring focus-visible:border-primary"
              >
                {refreshIntervalOptions.map((option) => (
                  <option key={option.label} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pause/Resume Button */}
            <button
              onClick={handlePauseToggle}
              className={`inline-flex items-center px-3 py-2 border border-input rounded-md text-sm font-medium ${isPaused
                  ? 'text-green-700 bg-green-50 hover:bg-green-100'
                  : 'text-foreground bg-card hover:bg-muted/50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring`}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getMetricCards().map((metric) => (
          <div key={metric.id} className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
                {metric.change && (
                  <p className={`text-sm ${metric.changeType === 'increase' ? 'text-green-600' :
                      metric.changeType === 'decrease' ? 'text-red-600' :
                        'text-muted-foreground'
                    }`}>
                    {metric.change}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
                {metric.trend && metric.trend.length > 1 && (
                  <div className="mt-2">
                    <MiniChart data={metric.trend} color={metric.color} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      {realTimeData && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(realTimeData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* No Data State */}
      {!realTimeData && !error && (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Waiting for data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time metrics will appear here once data starts flowing.
          </p>
        </div>
      )}
    </div>
  );
};

// Mini chart component for trend visualization
const MiniChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60; // 60px width
    const y = 20 - ((value - min) / range) * 20; // 20px height, inverted
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="60" height="20" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={color}
      />
    </svg>
  );
};

export default RealTimeMetrics;