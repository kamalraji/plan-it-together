// Offline Service for Mobile Workspace Access

export interface OfflineTaskUpdate {
  id: string;
  workspaceId: string;
  taskId: string;
  data: any;
  timestamp: number;
}

export interface OfflineMessage {
  id: string;
  channelId: string;
  content: string;
  timestamp: number;
  tempId: string;
}

class OfflineService {
  private dbName = 'ThittamHubOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!('indexedDB' in window)) {
        // IndexedDB not supported - gracefully degrade
        return false;
      }

      this.db = await this.openDatabase();

      // Register background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await navigator.serviceWorker.ready;
        // Background sync is available
      }

      return true;
    } catch (_error) {
      // Offline service initialization failed - gracefully degrade
      return false;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('taskUpdates')) {
          const taskStore = db.createObjectStore('taskUpdates', { keyPath: 'id' });
          taskStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          taskStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('channelId', 'channelId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Task Update Methods
  async saveTaskUpdate(workspaceId: string, taskId: string, updateData: any): Promise<void> {
    if (!this.db) return;

    const update: OfflineTaskUpdate = {
      id: `${workspaceId}-${taskId}-${Date.now()}`,
      workspaceId,
      taskId,
      data: updateData,
      timestamp: Date.now()
    };

    const transaction = this.db.transaction(['taskUpdates'], 'readwrite');
    const store = transaction.objectStore('taskUpdates');
    await store.add(update);

    // Register background sync
    this.registerBackgroundSync('task-update');
  }

  async getPendingTaskUpdates(): Promise<OfflineTaskUpdate[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['taskUpdates'], 'readonly');
    const store = transaction.objectStore('taskUpdates');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearTaskUpdate(updateId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['taskUpdates'], 'readwrite');
    const store = transaction.objectStore('taskUpdates');
    await store.delete(updateId);
  }

  // Message Methods
  async saveOfflineMessage(channelId: string, content: string): Promise<string> {
    if (!this.db) return '';

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message: OfflineMessage = {
      id: `${channelId}-${Date.now()}`,
      channelId,
      content,
      timestamp: Date.now(),
      tempId
    };

    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    await store.add(message);

    // Register background sync
    this.registerBackgroundSync('message-send');

    return tempId;
  }

  async getPendingMessages(): Promise<OfflineMessage[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearMessage(messageId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    await store.delete(messageId);
  }

  // Cache Methods
  async cacheData(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    await store.put(cacheEntry);
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if data has expired
        const now = Date.now();
        if (now - result.timestamp > result.ttl) {
          // Data expired, remove it
          this.clearCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCachedData(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    await store.delete(key);
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    const index = store.index('timestamp');
    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const entry = cursor.value;
        const now = Date.now();

        if (now - entry.timestamp > entry.ttl) {
          cursor.delete();
        }

        cursor.continue();
      }
    };
  }

  // Background Sync
  private async registerBackgroundSync(_tag: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await navigator.serviceWorker.ready;
        // Background sync registration would happen here
        // await registration.sync.register(tag); // Not supported in all browsers
      }
    } catch (_error) {
      // Background sync registration failed - will retry on next attempt
    }
  }

  // Sync Methods (called by service worker)
  async syncTaskUpdates(): Promise<void> {
    const pendingUpdates = await this.getPendingTaskUpdates();

    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/workspaces/${update.workspaceId}/tasks/${update.taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update.data)
        });

        if (response.ok) {
          await this.clearTaskUpdate(update.id);
        }
      } catch (_error) {
        // Task sync failed - will retry on next attempt
      }
    }
  }

  async syncMessages(): Promise<void> {
    const pendingMessages = await this.getPendingMessages();

    for (const message of pendingMessages) {
      try {
        const response = await fetch(`/api/channels/${message.channelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: message.content })
        });

        if (response.ok) {
          await this.clearMessage(message.id);
        }
      } catch (_error) {
        // Message sync failed - will retry on next attempt
      }
    }
  }

  // Network Status
  isOnline(): boolean {
    return navigator.onLine;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Utility Methods
  async getStorageUsage(): Promise<{ used: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return null;
  }

  async clearAllOfflineData(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['taskUpdates', 'messages', 'cachedData'], 'readwrite');

    await Promise.all([
      transaction.objectStore('taskUpdates').clear(),
      transaction.objectStore('messages').clear(),
      transaction.objectStore('cachedData').clear()
    ]);
  }
}

export const offlineService = new OfflineService();