/**
 * NotificationDrawer Component
 *
 * Bottom sheet / modal displaying user's in-app notifications,
 * status icons, relative timestamps, and one-tap order navigation.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCheck,
  Package,
  Bike,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';
import { AppNotification } from '@/types';
import { toast } from 'sonner';

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function getNotificationBadge(item: AppNotification) {
  const text = (item.title + ' ' + item.body).toUpperCase();

  if (text.includes('DELIVERED')) {
    return {
      icon: CheckCircle2,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: '🎉 Delivered',
    };
  }
  if (text.includes('ON THE WAY') || text.includes('DELIVERY') || text.includes('OUT FOR')) {
    return {
      icon: Bike,
      bg: 'bg-orange-50 text-orange-600 border-orange-200',
      badge: '🛵 On the way',
    };
  }
  if (text.includes('PREPARING') || text.includes('COOKING')) {
    return {
      icon: Clock,
      bg: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: '🍳 Preparing',
    };
  }
  if (text.includes('CONFIRMED')) {
    return {
      icon: CheckCircle2,
      bg: 'bg-blue-50 text-blue-600 border-blue-200',
      badge: '✅ Confirmed',
    };
  }
  if (text.includes('CANCEL')) {
    return {
      icon: AlertTriangle,
      bg: 'bg-rose-50 text-rose-600 border-rose-200',
      badge: '❌ Cancelled',
    };
  }

  return {
    icon: Bell,
    bg: 'bg-gray-100 text-gray-600 border-gray-200',
    badge: '🔔 Update',
  };
}

export default function NotificationDrawer() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    isOpen,
    setOpen,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, [isOpen]);

  // Refresh notifications when drawer is opened
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications(true);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const ok = await subscribeToPushNotifications();
      if (ok) {
        setPushPermission('granted');
        toast.success('Push notifications enabled successfully!');
      } else {
        toast.info('Push notification permission was not granted.');
        if ('Notification' in window) {
          setPushPermission(Notification.permission);
        }
      }
    } catch {
      toast.error('Failed to enable push notifications');
    } finally {
      setEnablingPush(false);
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }

    let orderId: string | undefined;
    try {
      if (typeof item.data === 'string') {
        const parsed = JSON.parse(item.data);
        orderId = parsed.orderId;
      } else if (item.data && typeof item.data === 'object') {
        orderId = item.data.orderId;
      }
    } catch {
      // ignore
    }

    setOpen(false);

    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-base">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-primary-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Order updates and alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Read all</span>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Push Permission Prompt (if not yet granted) ── */}
        {pushPermission === 'default' && (
          <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-xs font-bold text-orange-950">Enable Push Alerts</p>
                <p className="text-[11px] text-orange-800">Get order status alerts even when app is closed</p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={enablingPush}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {enablingPush ? 'Enabling...' : 'Enable'}
            </button>
          </div>
        )}

        {/* ── Notification List ── */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 divide-y divide-gray-50">
          {!user ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">
                👤
              </div>
              <p className="font-semibold text-gray-800 text-sm">Sign in to view notifications</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                You'll receive live order tracking notifications once you log in.
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/auth');
                }}
                className="gradient-primary text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Sign In / Register
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-primary-500 flex items-center justify-center mx-auto mb-3 text-xl">
                📬
              </div>
              <p className="font-semibold text-gray-800 text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                When you place an order, live status updates from the kitchen and rider will appear right here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const badgeMeta = getNotificationBadge(item);
              const BadgeIcon = badgeMeta.icon;
              const cleanTitle = item.title
                .replace(/\s*\(Order\s*#[^)]+\)/gi, '')
                .replace(/\s*\(Order[^)]+\)/gi, '')
                .trim();

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all cursor-pointer border ${
                    item.isRead
                      ? 'bg-white hover:bg-gray-50 border-transparent'
                      : 'bg-orange-50/50 hover:bg-orange-50 border-orange-100 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badgeMeta.bg}`}
                    >
                      <BadgeIcon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">
                          {cleanTitle}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100/60">
                        <span className="text-[10px] font-semibold text-primary-600 hover:underline">
                          Tap to view details →
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
