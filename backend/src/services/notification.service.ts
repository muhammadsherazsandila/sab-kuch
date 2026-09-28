/**
 * Notification Service
 *
 * Handles Web Push notifications (PWA) and in-app Notification persistence.
 * Respects user's `notificationsEnabled` profile preference.
 */

import webpush from 'web-push';
import { prisma } from '../lib/prisma';

// Configure Web Push VAPID keys
const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  'BL-amGCFkTUJYn1e0P3WgLmvkBH9q9Q-IP_sOtugutAl6beiqa8BynDefkoXcpW1hlK1mmpL5NAjY_sTcJFEBOA';
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || 'KaoK3WsuK0DsqJTXKMDS5S6qeFHVwb8BMiBv5HgADKo';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@sabkuch.com';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.warn('[NotificationService] VAPID configuration error:', err);
}

export const NotificationService = {
  /**
   * Send notification to user if `notificationsEnabled` is true in their profile.
   * Creates an in-app notification record and dispatches Web Push notifications.
   */
  async notifyUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ delivered: boolean; inAppCreated: boolean; reason?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, notificationsEnabled: true, pushSubscriptions: true },
      });

      if (!user) {
        return { delivered: false, inAppCreated: false, reason: 'User not found' };
      }

      // Check if user turned off notifications in profile
      if (user.notificationsEnabled === false) {
        console.log(`[NotificationService] Skipped: User ${userId} has notifications disabled in profile.`);
        return { delivered: false, inAppCreated: false, reason: 'Notifications disabled by user' };
      }

      // 1. Create In-App Notification record
      await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: data?.type || 'ORDER_UPDATE',
          data: data ? JSON.stringify(data) : undefined,
        },
      });

      // 2. Dispatch Web Push notification to all active browser subscriptions
      const subscriptions = user.pushSubscriptions || [];
      const payload = JSON.stringify({
        title,
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: {
          url: data?.orderId ? `/orders/${data.orderId}` : '/orders',
          ...data,
        },
      });

      await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dhKey,
                  auth: sub.authKey,
                },
              },
              payload,
              {
                TTL: 86400, // Store in push gateway queue for up to 24 hours
                urgency: 'high', // High priority push for instant wakeup
              }
            );
          } catch (pushErr: any) {
            // If subscription is expired / unsubscribed, remove from database
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
        })
      );

      console.log(`[NotificationService] Notification dispatched to user ${userId}: "${title}"`);
      return { delivered: true, inAppCreated: true };
    } catch (err: unknown) {
      console.error('[NotificationService] Error sending notification:', err);
      return { delivered: false, inAppCreated: false, reason: String(err) };
    }
  },

  /** Save or update a Web Push subscription */
  async subscribePush(
    userId: string,
    endpoint: string,
    p256dhKey: string,
    authKey: string
  ) {
    return prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dhKey,
        authKey,
      },
      create: {
        userId,
        endpoint,
        p256dhKey,
        authKey,
      },
    });
  },

  /** Unsubscribe from Web Push */
  async unsubscribePush(endpoint: string) {
    return prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  },
};
