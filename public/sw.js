// Service Worker for Thittam1Hub Mobile Workspace Access
const CACHE_NAME = 'thittam1hub-workspace-v2';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the service worker takes control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache API responses for offline access
            if (event.request.url.includes('/api/')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return cached API response if available
            if (event.request.url.includes('/api/')) {
              return caches.match(event.request);
            }
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Thittam1Hub Workspace',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'workspace-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };

  // Parse notification data from push payload
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (e) {
      console.error('Error parsing push payload:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes('/workspaces/') && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if no existing workspace window found
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/dashboard';
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline task updates and mobile features
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'task-update') {
    event.waitUntil(syncTaskUpdates());
  } else if (event.tag === 'message-send') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'photo-upload') {
    event.waitUntil(syncPhotoUploads());
  } else if (event.tag === 'voice-message') {
    event.waitUntil(syncVoiceMessages());
  } else if (event.tag === 'location-update') {
    event.waitUntil(syncLocationUpdates());
  }
});

// Sync pending task updates when back online
async function syncTaskUpdates() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingUpdates = await cache.match('/pending-task-updates');
    
    if (pendingUpdates) {
      const updates = await pendingUpdates.json();
      
      for (const update of updates) {
        try {
          await fetch(`/api/workspaces/${update.workspaceId}/tasks/${update.taskId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(update.data)
          });
        } catch (error) {
          console.error('Failed to sync task update:', error);
        }
      }
      
      // Clear pending updates after successful sync
      await cache.delete('/pending-task-updates');
    }
  } catch (error) {
    console.error('Error syncing task updates:', error);
  }
}

// Sync pending messages when back online
async function syncMessages() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingMessages = await cache.match('/pending-messages');
    
    if (pendingMessages) {
      const messages = await pendingMessages.json();
      
      for (const message of messages) {
        try {
          await fetch(`/api/channels/${message.channelId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: message.content })
          });
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }
      
      // Clear pending messages after successful sync
      await cache.delete('/pending-messages');
    }
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

// Sync pending photo uploads when back online
async function syncPhotoUploads() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingPhotos = await cache.match('/pending-photos');
    
    if (pendingPhotos) {
      const photos = await pendingPhotos.json();
      
      for (const photo of photos) {
        try {
          const formData = new FormData();
          formData.append('photo', photo.file);
          formData.append('taskId', photo.taskId);
          
          await fetch(`/api/workspaces/${photo.workspaceId}/tasks/${photo.taskId}/photos`, {
            method: 'POST',
            body: formData
          });
        } catch (error) {
          console.error('Failed to sync photo upload:', error);
        }
      }
      
      // Clear pending photos after successful sync
      await cache.delete('/pending-photos');
    }
  } catch (error) {
    console.error('Error syncing photo uploads:', error);
  }
}

// Sync pending voice messages when back online
async function syncVoiceMessages() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingVoiceMessages = await cache.match('/pending-voice-messages');
    
    if (pendingVoiceMessages) {
      const voiceMessages = await pendingVoiceMessages.json();
      
      for (const voiceMessage of voiceMessages) {
        try {
          const formData = new FormData();
          formData.append('audio', voiceMessage.audioBlob);
          formData.append('channelId', voiceMessage.channelId);
          
          await fetch(`/api/channels/${voiceMessage.channelId}/voice-messages`, {
            method: 'POST',
            body: formData
          });
        } catch (error) {
          console.error('Failed to sync voice message:', error);
        }
      }
      
      // Clear pending voice messages after successful sync
      await cache.delete('/pending-voice-messages');
    }
  } catch (error) {
    console.error('Error syncing voice messages:', error);
  }
}

// Sync pending location updates when back online
async function syncLocationUpdates() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingLocations = await cache.match('/pending-locations');
    
    if (pendingLocations) {
      const locations = await pendingLocations.json();
      
      for (const location of locations) {
        try {
          await fetch(`/api/workspaces/${location.workspaceId}/tasks/${location.taskId}/checkin`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: {
                latitude: location.latitude,
                longitude: location.longitude
              },
              timestamp: location.timestamp
            })
          });
        } catch (error) {
          console.error('Failed to sync location update:', error);
        }
      }
      
      // Clear pending locations after successful sync
      await cache.delete('/pending-locations');
    }
  } catch (error) {
    console.error('Error syncing location updates:', error);
  }
}