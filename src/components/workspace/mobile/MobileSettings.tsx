import { useState } from 'react';
import { 
  BellIcon,
  CloudArrowDownIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../../hooks/useNotifications';
import { useOffline } from '../../../hooks/useOffline';
import { useAuth } from '../../../hooks/useAuth';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function MobileSettings() {
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  
  const { user } = useAuth();

  const {
    isSupported: notificationSupported,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    canEnable,
    isEnabled,
    preferences,
    updatePreferences,
  } = useNotifications(user?.id);


  const {
    isOnline,
    pendingUpdates,
    pendingMessages,
    syncPendingData,
    clearOfflineData,
    getStorageUsage
  } = useOffline();

  const handleNotificationToggle = async () => {
    if (isEnabled()) {
      await unsubscribe();
    } else if (canEnable()) {
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission === 'granted') {
          await subscribe();
        }
      } else if (permission === 'granted') {
        await subscribe();
      }
    }
  };

  const handleSyncData = async () => {
    if (isOnline) {
      await syncPendingData();
    }
  };

  const handleClearOfflineData = () => {
    setShowClearDataConfirm(true);
  };

  const confirmClearOfflineData = async () => {
    await clearOfflineData();
    setShowClearDataConfirm(false);
  };

  const handleShowStorageInfo = async () => {
    if (!showStorageInfo) {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    }
    setShowStorageInfo(!showStorageInfo);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNotificationStatus = () => {
    if (!notificationSupported) {
      return { icon: XCircleIcon, text: 'Not Supported', color: 'text-muted-foreground' };
    }
    
    if (permission === 'denied') {
      return { icon: XCircleIcon, text: 'Blocked', color: 'text-red-600' };
    }
    
    if (isEnabled()) {
      return { icon: CheckCircleIcon, text: 'Enabled', color: 'text-green-600' };
    }
    
    return { icon: ExclamationTriangleIcon, text: 'Disabled', color: 'text-yellow-600' };
  };

  const getOfflineStatus = () => {
    if (isOnline) {
      return { icon: CheckCircleIcon, text: 'Online', color: 'text-green-600' };
    }
    return { icon: ExclamationTriangleIcon, text: 'Offline', color: 'text-yellow-600' };
  };

  const notificationStatus = getNotificationStatus();
  const offlineStatus = getOfflineStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Mobile Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage notifications and offline features
        </p>
      </div>

      {/* Notifications Section */}
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">Push Notifications</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Notification Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <notificationStatus.icon className={`w-5 h-5 ${notificationStatus.color}`} />
              <div>
                <p className="text-sm font-medium text-foreground">Status</p>
                <p className={`text-xs ${notificationStatus.color}`}>
                  {notificationStatus.text}
                </p>
              </div>
            </div>
            
            {canEnable() && (
              <button
                onClick={handleNotificationToggle}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  isEnabled()
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {isEnabled() ? 'Disable' : 'Enable'}
              </button>
            )}
          </div>

          {/* Notification Types */}
          {isEnabled() && preferences && (
            <div className="space-y-3 pt-3 border-t border-border">
              <p className="text-sm font-medium text-foreground">Notification Categories</p>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.workspace_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ workspace_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Workspace activity</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.event_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ event_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Events</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.marketplace_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ marketplace_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Marketplace</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.organization_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ organization_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Organization updates</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.system_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ system_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">System alerts</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.sound_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ sound_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Play sound for important alerts</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.vibration_enabled}
                    onChange={(e) =>
                      updatePreferences?.({ vibration_enabled: e.target.checked })
                    }
                    className="rounded border-input text-indigo-600 focus-visible:ring-ring"
                  />
                  <span className="ml-2 text-sm text-foreground">Vibrate on critical alerts</span>
                </label>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-3 bg-yellow-50 rounded-md">
              <div className="flex">
                <InformationCircleIcon className="w-5 h-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Notifications are blocked. To enable them, go to your browser settings and allow notifications for this site.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offline Section */}
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <CloudArrowDownIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">Offline Features</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <offlineStatus.icon className={`w-5 h-5 ${offlineStatus.color}`} />
              <div>
                <p className="text-sm font-medium text-foreground">Connection</p>
                <p className={`text-xs ${offlineStatus.color}`}>
                  {offlineStatus.text}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Data */}
          {(pendingUpdates > 0 || pendingMessages > 0) && (
            <div className="space-y-2 pt-3 border-t border-border">
              <p className="text-sm font-medium text-foreground">Pending Sync</p>
              
              <div className="space-y-1">
                {pendingUpdates > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {pendingUpdates} task update{pendingUpdates !== 1 ? 's' : ''}
                  </p>
                )}
                {pendingMessages > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {pendingMessages} message{pendingMessages !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {isOnline && (
                <button
                  onClick={handleSyncData}
                  className="w-full mt-2 px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200"
                >
                  Sync Now
                </button>
              )}
            </div>
          )}

          {/* Storage Info */}
          <div className="pt-3 border-t border-border">
            <button
              onClick={handleShowStorageInfo}
              className="flex items-center justify-between w-full text-left"
            >
              <p className="text-sm font-medium text-foreground">Storage Usage</p>
              <InformationCircleIcon className="w-4 h-4 text-muted-foreground" />
            </button>

            {showStorageInfo && storageUsage && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Used: {formatBytes(storageUsage.used)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available: {formatBytes(storageUsage.quota - storageUsage.used)}
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((storageUsage.used / storageUsage.quota) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear Data */}
          <div className="pt-3 border-t border-border">
            <button
              onClick={handleClearOfflineData}
              className="flex items-center space-x-2 w-full p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Clear Offline Data</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              This will remove all cached data and pending updates
            </p>
          </div>
        </div>
      </div>

      {/* Offline Features Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Offline Features</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>View cached workspace data</li>
                <li>Update task status (syncs when online)</li>
                <li>Compose messages (sends when online)</li>
                <li>Access team member information</li>
                <li>View recent analytics data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={showClearDataConfirm}
        onOpenChange={setShowClearDataConfirm}
        title="Clear offline data"
        description="Are you sure you want to clear all offline data? This will remove all cached data and pending updates. This action cannot be undone."
        confirmLabel="Clear data"
        variant="warning"
        onConfirm={confirmClearOfflineData}
      />
    </div>
  );
}