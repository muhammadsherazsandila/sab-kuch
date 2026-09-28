/**
 * BottomNav — Fixed bottom navigation bar (5 tabs)
 *
 * Tabs: Home · Shops · Cart · My Orders · Settings
 * Replaced Custom order with Cart icon and live cart counter badge.
 */

import { NavLink } from 'react-router-dom';
import { Home, Store, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { to: '/',         icon: Home,          label: 'Home'      },
  { to: '/shops',    icon: Store,         label: 'Shops'     },
  { to: '/checkout', icon: ShoppingBag,   label: 'Cart'      },
  { to: '/orders',   icon: ClipboardList, label: 'My Orders' },
  { to: '/settings', icon: User,          label: 'Profile'   },
] as const;

export default function BottomNav() {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center h-[60px] max-w-md mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isCart = to === '/checkout';

        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}  // exact match for home only
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-1 gap-0.5 transition-colors relative',
                isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isCart ? (
                  <div className="relative">
                    <div
                      className={cn(
                        'w-11 h-11 -mt-4 rounded-full flex items-center justify-center transition-all duration-300 transform',
                        'bg-gradient-to-tr from-primary-600 via-orange-500 to-amber-400 text-white',
                        'shadow-[0_0_18px_rgba(249,115,22,0.75)] ring-2 ring-white',
                        isActive
                          ? 'scale-110 shadow-[0_0_24px_rgba(249,115,22,0.95)] ring-orange-200'
                          : 'hover:scale-105'
                      )}
                    >
                      <Icon size={21} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" strokeWidth={2.4} />
                      {/* Cart badge on Cart icon */}
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center leading-none border-2 border-white shadow-md animate-pulse">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                )}
                <span
                  className={cn(
                    'text-[10px]',
                    isCart
                      ? 'font-bold text-primary-600 mt-0.5'
                      : isActive
                      ? 'font-semibold'
                      : 'font-medium'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

