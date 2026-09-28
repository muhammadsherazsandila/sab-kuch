/**
 * Push Notification Utility — Sab Kuch Frontend
 *
 * Handles:
 * 1. Requesting browser Notification permission
 * 2. Subscribing to Web Push through the Service Worker via VAPID
 * 3. Registering subscription with the backend API
 * 4. Displaying local notifications when user is in the app
 */

import apiClient from './apiClient';

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BL-amGCFkTUJYn1e0P3WgLmvkBH9q9Q-IP_sOtugutAl6beiqa8BynDefkoXcpW1hlK1mmpL5NAjY_sTcJFEBOA';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if Web Push is supported by the current browser */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Request notification permission and subscribe to Web Push */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    console.debug('[Push] Notifications not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Push] Notification permission denied by user');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // Send subscription to backend
    const rawSub = subscription.toJSON();
    if (rawSub.endpoint && rawSub.keys) {
      await apiClient.post('/users/me/push-subscription', {
        endpoint: rawSub.endpoint,
        keys: {
          p256dh: rawSub.keys.p256dh,
          auth: rawSub.keys.auth,
        },
      });
      console.log('[Push] Push subscription synced with backend successfully');
    }

    return true;
  } catch (err) {
    console.warn('[Push] Error subscribing to push notifications:', err);
    return false;
  }
}

/** Display a local notification if permission is granted */
export function displayNotification(title: string, body: string, data?: any) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data,
        });
      });
    } else {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
      });
    }
  }
}
