import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  downlink: number | null;
  rtt: number | null;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInfo;
  }
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: navigator.connection?.effectiveType ?? null,
    downlink: navigator.connection?.downlink ?? null,
    rtt: navigator.connection?.rtt ?? null,
    lastOnlineAt: navigator.onLine ? new Date() : null,
    lastOfflineAt: navigator.onLine ? null : new Date(),
  }));

  const updateConnectionInfo = useCallback(() => {
    const connection = navigator.connection;
    if (connection) {
      const isSlowConnection = 
        connection.effectiveType === '2g' || 
        connection.effectiveType === 'slow-2g' ||
        (connection.rtt != null && connection.rtt > 500);

      setStatus(prev => ({
        ...prev,
        connectionType: connection.effectiveType ?? null,
        downlink: connection.downlink ?? null,
        rtt: connection.rtt ?? null,
        isSlowConnection,
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: new Date(),
      }));
      updateConnectionInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOfflineAt: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = navigator.connection;
    if (connection) {
      // @ts-expect-error - connection change event
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        // @ts-expect-error - connection change event
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateConnectionInfo]);

  return status;
}
