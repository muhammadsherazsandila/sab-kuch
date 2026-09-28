/**
 * AppLayout — wraps main app screens.
 * Renders the main content area + fixed BottomNav.
 *
 * Implements swipe / slide left & right gestures:
 * - Slide left  -> switch to next tab (Home -> Shops -> Cart -> Orders -> Settings)
 * - Slide right -> switch to previous tab (Settings -> Orders -> Cart -> Shops -> Home)
 */

import { useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import NotificationDrawer from './NotificationDrawer';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';

const TAB_ROUTES = ['/', '/shops', '/checkout', '/orders', '/settings'];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (
      user &&
      user.notificationsEnabled !== false &&
      typeof window !== 'undefined' &&
      'Notification' in window
    ) {
      if (Notification.permission === 'granted') {
        subscribeToPushNotifications().catch(() => {});
      }
    }
  }, [user]);

  // Real-time polling for in-app notifications
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications(true);

    // Poll every 8 seconds
    const timer = setInterval(() => {
      fetchNotifications(true);
    }, 8000);

    return () => clearInterval(timer);
  }, [user, fetchNotifications]);

  const touchStartRef = useRef<{ x: number; y: number; time: number; isHorizontalScroll: boolean } | null>(null);

  // Normalize path (e.g. /cart -> /checkout)
  const currentPath = location.pathname === '/cart' ? '/checkout' : location.pathname;
  const currentTabIndex = TAB_ROUTES.indexOf(currentPath);


  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track if currently on one of the main tabs
    if (currentTabIndex === -1) return;

    // Check if touch target is an input or inside a horizontal scroll container
    let target = e.target as HTMLElement | null;
    let isHorizontalScroll = false;
    while (target && target !== e.currentTarget) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        isHorizontalScroll = true;
        break;
      }
      const overflowX = window.getComputedStyle(target).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
        if (target.scrollWidth > target.clientWidth) {
          isHorizontalScroll = true;
          break;
        }
      }
      target = target.parentElement;
    }

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      isHorizontalScroll,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || currentTabIndex === -1) return;
    if (touchStartRef.current.isHorizontalScroll) {
      touchStartRef.current = null;
      return;
    }

    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartRef.current.x;
    const deltaY = touchEnd.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Swipe criteria: horizontal distance > 60px, mostly horizontal, duration < 500ms
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && duration < 500) {
      if (deltaX < 0) {
        // Swiped Left -> Advance to next tab
        if (currentTabIndex < TAB_ROUTES.length - 1) {
          navigate(TAB_ROUTES[currentTabIndex + 1]);
        }
      } else {
        // Swiped Right -> Go to previous tab
        if (currentTabIndex > 0) {
          navigate(TAB_ROUTES[currentTabIndex - 1]);
        }
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Page content — padded bottom so it never hides behind the sticky bottom bar */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
      <NotificationDrawer />
    </div>
  );
}
