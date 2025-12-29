import React, { useEffect, useState } from 'react';
import { checkApiHealth } from '../../lib/api';
import { FEATURE_FLAGS } from '../../lib/config';

interface ApiHealthCheckProps {
  onHealthChange?: (isHealthy: boolean) => void;
  showIndicator?: boolean;
}

export const ApiHealthCheck: React.FC<ApiHealthCheckProps> = ({
  onHealthChange,
  showIndicator = false,
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (!FEATURE_FLAGS.enableHealthCheck) {
      return;
    }

    const checkHealth = async () => {
      try {
        const healthy = await checkApiHealth();
        setIsHealthy(healthy);
        setLastCheck(new Date());
        onHealthChange?.(healthy);
      } catch (error) {
        setIsHealthy(false);
        setLastCheck(new Date());
        onHealthChange?.(false);
      }
    };

    // Initial check
    checkHealth();

    // Set up periodic health checks (every 30 seconds)
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [onHealthChange]);

  if (!showIndicator || !FEATURE_FLAGS.enableHealthCheck) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isHealthy === null
            ? 'bg-gray-400'
            : isHealthy
            ? 'bg-green-500'
            : 'bg-red-500'
        }`}
        title={
          isHealthy === null
            ? 'Checking API status...'
            : isHealthy
            ? 'API is healthy'
            : 'API is unavailable'
        }
      />
      <span className="text-gray-600">
        {isHealthy === null
          ? 'Checking...'
          : isHealthy
          ? 'API Online'
          : 'API Offline'}
      </span>
      {lastCheck && (
        <span className="text-xs text-gray-400">
          Last check: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ApiHealthCheck;