/**
 * Notification Store — Zustand
 *
 * Manages in-app notifications, unread count badge, and polling for real-time order updates.
 * Fires in-app Sonner toasts and browser notifications when new updates arrive from Admin.
 */

import { create } from 'zustand';
import apiClient from '@/lib/apiClient';
import { AppNotification, ApiResponse } from '@/types';
import { toast } from 'sonner';
import { displayNotification } from '@/lib/pushNotifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  isOpen: boolean;
  hasPolledOnce: boolean;
  knownNotificationIds: Set<string>;

  setOpen: (open: boolean) => void;
  fetchNotifications: (silent?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  isOpen: false,
  hasPolledOnce: false,
  knownNotificationIds: new Set<string>(),

  setOpen: (open: boolean) => set({ isOpen: open }),

  fetchNotifications: async (silent = false) => {
    if (!silent) set({ loading: true });

    try {
      const res = await apiClient.get<ApiResponse<AppNotification[]>>('/users/me/notifications');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const currentKnown = get().knownNotificationIds;
      const isFirstFetch = !get().hasPolledOnce;

      // Detect brand new notifications that weren't known before
      const newItems: AppNotification[] = [];
      const updatedKnown = new Set(currentKnown);

      data.forEach((item) => {
        if (!updatedKnown.has(item.id)) {
          updatedKnown.add(item.id);
          if (!isFirstFetch && !item.isRead) {
            newItems.push(item);
          }
        }
      });

      // Fire in-app toast & local notification for newly arrived notifications
      newItems.forEach((item) => {
        let orderId: string | undefined;
        try {
          if (typeof item.data === 'string') {
            const parsed = JSON.parse(item.data);
            orderId = parsed.orderId;
          } else if (item.data && typeof item.data === 'object') {
            orderId = item.data.orderId;
          }
        } catch {
          // ignore parse error
        }

        // Clean title (remove any "(Order #SK-...)")
        const cleanTitle = item.title
          .replace(/\s*\(Order\s*#[^)]+\)/gi, '')
          .replace(/\s*\(Order[^)]+\)/gi, '')
          .trim();

        toast.info(cleanTitle, {
          description: item.body,
          duration: 7000,
          action: orderId
            ? {
                label: 'View Order',
                onClick: () => {
                  window.location.href = `/orders/${orderId}`;
                },
              }
            : undefined,
        });

        // Trigger browser system notification if permitted
        displayNotification(cleanTitle, item.body, { orderId });
      });

      const unread = data.filter((n) => !n.isRead).length;

      set({
        notifications: data,
        unreadCount: unread,
        hasPolledOnce: true,
        knownNotificationIds: updatedKnown,
        loading: false,
      });
    } catch {
      // Silently fail during background poll to prevent UI disruption
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await apiClient.patch(`/users/me/notifications/${id}/read`);
    } catch {
      // Revert if error
      get().fetchNotifications(true);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await apiClient.patch('/users/me/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch {
      get().fetchNotifications(true);
    }
  },
}));
