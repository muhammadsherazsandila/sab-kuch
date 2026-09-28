/**
 * HomeScreen
 *
 * Layout (top→bottom):
 *   1. Header — personalized greeting + cart icon
 *   2. Search bar
 *   3. Promotional banners (horizontal scroll)
 *   4. Trending Products grid
 *
 * Guest users see the full screen; the cart/checkout requires login.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useVendors } from '@/hooks/useVendors';
import { Product, Vendor } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Determine if a vendor is currently open based on today's operating hours */
function isVendorOpen(vendor: Vendor): boolean {
  const today = new Date().getDay(); // 0=Sun
  const hours = vendor.operatingHours?.find((h) => h.dayOfWeek === today);
  if (!hours || hours.isClosed) return false;

  const now = new Date();
  const [openH, openM]   = hours.openTime.split(':').map(Number);
  const [closeH, closeM] = hours.closeTime.split(':').map(Number);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= openH * 60 + openM && currentMins < closeH * 60 + closeM;
}

function formatPrice(price: number) {
  return `Rs. ${price.toFixed(0)}`;
}

// ── Promotional banners data (static until CMS is added) ──────────────────
const BANNERS = [
  { id: 1, title: '50% OFF your first order', subtitle: 'Use code WELCOME50', gradient: 'from-primary-500 to-orange-400' },
  { id: 2, title: 'Free delivery today 🛵',   subtitle: 'On all orders above Rs. 300', gradient: 'from-amber-500 to-orange-500' },
  { id: 3, title: 'Custom orders now live!',   subtitle: 'We\'ll buy anything for you', gradient: 'from-red-500 to-primary-500' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const totalItems = useCartStore((s) => s.totalItems());

  const { products, loading: productsLoading } = useFeaturedProducts();
  const { vendors } = useVendors();
  const [trendingItems, setTrendingItems] = useState<Product[]>([]);

  // Randomize trending products on mount & reload every 1 minute
  useEffect(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (safeProducts.length === 0) return;

    const pickRandomTrending = () => {
      const shuffled = [...safeProducts].sort(() => Math.random() - 0.5);
      // Pick random 8 items (or all if fewer)
      setTrendingItems(shuffled.slice(0, 8));
    };

    pickRandomTrending();
    const intervalId = setInterval(pickRandomTrending, 60000); // Reshuffle every 1 min

    return () => clearInterval(intervalId);
  }, [products]);

  // Build a map for quick vendor lookup when rendering products
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const vendorMap = Object.fromEntries(safeVendors.map((v) => [v.id, v]));

  const greeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name} 👋`;
    if (hour < 17) return `Good afternoon, ${name} 👋`;
    return `Good evening, ${name} 👋`;
  };

  return (
    <div className="bg-white min-h-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-100 shadow-xs flex items-center justify-center p-0.5">
              <img
                src="/logo.jpg"
                alt="Sab Kuch"
                className="w-full h-full object-contain aspect-square"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate leading-tight">{greeting()}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-primary-500 flex-shrink-0" />
                <p className="text-xs text-gray-400 truncate">{user?.city?.name || 'Hostel City, Islamabad'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />
            <button
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/checkout')}
              aria-label="View cart"
            >
              <ShoppingCart size={20} className="text-gray-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar — Click navigates to /search */}
        <div
          onClick={() => navigate('/search')}
          className="relative mt-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" />
          <div className="pl-10 pr-3 bg-gray-50 border border-gray-200 group-hover:border-primary-300 h-10 rounded-full text-sm text-gray-400 flex items-center justify-between select-none transition-all shadow-xs">
            <span>Search food, shops, items…</span>
            <span className="text-[10px] bg-orange-100 text-primary-600 font-semibold px-2 py-0.5 rounded-full">
              Paratha, Roti...
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-4 pb-4">
        {/* ── Promotional Banners ────────────────────────────────────────── */}
        <section>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {BANNERS.map((banner) => (
              <div
                key={banner.id}
                className={cn(
                  'flex-shrink-0 w-72 h-28 rounded-2xl bg-gradient-to-r p-4 flex flex-col justify-end',
                  banner.gradient
                )}
              >
                <p className="text-white font-bold text-sm leading-tight">{banner.title}</p>
                <p className="text-white/80 text-xs mt-0.5">{banner.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending Products ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-base">🔥 Trending Now</h2>
              <span className="text-[10px] text-gray-400 font-normal">(Auto-refreshed)</span>
            </div>
            <button
              className="text-primary-500 text-xs font-semibold"
              onClick={() => navigate('/shops')}
            >
              See all
            </button>
          </div>

          {productsLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(trendingItems) && trendingItems.length > 0
                ? trendingItems
                : Array.isArray(products)
                ? (products as Product[])
                : []
              ).map((product) => {
                const vendor = product.vendor?.id ? vendorMap[product.vendor.id] : null;
                const open = vendor ? isVendorOpen(vendor) : true;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isShopOpen={open}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );

}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, isShopOpen }: { product: Product; isShopOpen: boolean }) {
  const { addItem, items } = useCartStore();
  const cartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  const effectivePrice = product.discountedPrice ?? product.price;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Product image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
        {/* Open/closed badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={isShopOpen ? 'success' : 'destructive'} className="text-[10px]">
            {isShopOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
        {/* Discount badge */}
        {product.discountedPrice && (
          <div className="absolute top-2 left-2">
            <Badge variant="warning" className="text-[10px]">Sale</Badge>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{product.name}</h3>
        {product.vendor && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.vendor.name}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-gray-900 text-sm">{formatPrice(effectivePrice)}</span>
            {product.discountedPrice && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(product.price)}</span>
            )}
          </div>
          {/* Add to cart */}
          {cartQty === 0 ? (
            <button
              onClick={() => {
                if (!isShopOpen) {
                  toast.warning(`${product.vendor?.name ?? 'This shop'} is currently closed`);
                  return;
                }
                addItem(
                  product,
                  product.vendor?.id ?? '',
                  product.vendor?.name ?? '',
                );
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold active:scale-95 transition-transform ${
                isShopOpen ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}
              title={isShopOpen ? 'Add to cart' : 'Shop is currently closed'}
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => useCartStore.getState().removeItem(product.id)}
                className="w-6 h-6 rounded-full border-2 border-primary-500 text-primary-500 flex items-center justify-center font-bold text-sm"
              >
                −
              </button>
              <span className="text-sm font-bold text-primary-500 w-4 text-center">{cartQty}</span>
              <button
                onClick={() => {
                  if (!isShopOpen) {
                    toast.warning(`${product.vendor?.name ?? 'This shop'} is currently closed`);
                    return;
                  }
                  addItem(product, product.vendor?.id ?? '', product.vendor?.name ?? '');
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                  isShopOpen ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1,2,3,4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="h-36 bg-gray-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
