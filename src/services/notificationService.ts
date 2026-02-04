// Push Notification Service for Mobile Workspace Access

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  critical?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return true;
    } catch (_error) {
      // Notification service initialization failed - gracefully degrade
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (_error) {
      // Push subscription failed - gracefully degrade
      return null;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
      }

      return true;
    } catch (_error) {
      // Unsubscribe failed - subscription may already be invalid
      return false;
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Play sound & vibration for critical notifications (best-effort)
      if (payload.critical) {
        try {
          const audio = new Audio('/notification-sound.mp3');
          // Fire and forget; some browsers may block without user interaction
          void audio.play();
        } catch (_error) {
          // Sound playback failed - likely blocked by browser
        }

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            // Short vibration pattern for critical alerts
            // @ts-ignore
            navigator.vibrate([80, 40, 80]);
          } catch (_error) {
            // Vibration failed - not supported or blocked
          }
        }
      }

      if (this.registration) {
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag || 'workspace-notification',
          data: payload.data,
          // actions: payload.actions, // Commented out as actions is not supported in all browsers
          requireInteraction: payload.requireInteraction || false,
        });
      } else {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          tag: payload.tag || 'workspace-notification',
          data: payload.data,
        });
      }
    } catch (_error) {
      // Notification display failed - browser may have blocked it
    }
  }

  // Workspace-specific notification methods
  async notifyTaskAssignment(taskTitle: string, assigneeName: string, workspaceId: string): Promise<void> {
    await this.showLocalNotification({
      title: 'New Task Assignment',
      body: `${assigneeName} assigned you: ${taskTitle}`,
      tag: 'task-assignment',
      data: { type: 'task-assignment', workspaceId },
      actions: [
        { action: 'view-task', title: 'View Task' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true
    });
  }

  async notifyTaskDeadline(taskTitle: string, hoursUntilDeadline: number, workspaceId: string): Promise<void> {
    const urgency = hoursUntilDeadline <= 2 ? 'urgent' : 'reminder';
    const body =
      hoursUntilDeadline <= 2
        ? `Task "${taskTitle}" is due in ${hoursUntilDeadline} hours!`
        : `Reminder: Task "${taskTitle}" is due in ${hoursUntilDeadline} hours`;

    await this.showLocalNotification({
      title: urgency === 'urgent' ? 'Urgent: Task Due Soon' : 'Task Deadline Reminder',
      body,
      tag: 'task-deadline',
      data: { type: 'task-deadline', workspaceId, urgency },
      actions: [
        { action: 'view-task', title: 'View Task' },
        { action: 'mark-complete', title: 'Mark Complete' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      requireInteraction: urgency === 'urgent',
      critical: urgency === 'urgent',
    });
  }

  async notifyNewMessage(senderName: string, channelName: string, workspaceId: string): Promise<void> {
    await this.showLocalNotification({
      title: `New message in ${channelName}`,
      body: `${senderName} sent a message`,
      tag: 'new-message',
      data: { type: 'new-message', workspaceId },
      actions: [
        { action: 'view-message', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }

  async notifyTeamInvitation(workspaceName: string, inviterName: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Team Invitation',
      body: `${inviterName} invited you to join ${workspaceName}`,
      tag: 'team-invitation',
      data: { type: 'team-invitation' },
      actions: [
        { action: 'view-invitation', title: 'View Invitation' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true
    });
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      // Re-throw to let caller handle
      throw error;
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      // Re-throw to let caller handle
      throw error;
    }
  }

  // Check if notifications are supported and enabled
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return !!subscription;
  }
}

export const notificationService = new NotificationService();