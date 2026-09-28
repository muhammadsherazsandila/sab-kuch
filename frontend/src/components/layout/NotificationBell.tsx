/**
 * NotificationBell Component
 *
 * Renders an interactive bell icon with live unread counter badge.
 * Clicking toggles the NotificationDrawer.
 */

import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
}

export default function NotificationBell({ className, iconClassName }: NotificationBellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setOpen = useNotificationStore((s) => s.setOpen);

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="View notifications"
      className={cn(
        'relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-gray-600 hover:text-gray-900',
        className
      )}
    >
      <Bell size={20} className={cn('transition-transform', iconClassName)} />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none border-2 border-white shadow-sm animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
