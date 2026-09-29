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

import NotificationBell from "@/components/layout/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { useBanners } from "@/hooks/useBanners";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useVendors } from "@/hooks/useVendors";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { Product, Vendor } from "@/types";
import { ChevronRight, MapPin, Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Determine if a vendor is currently open based on today's operating hours */
function isVendorOpen(vendor?: Vendor | null): boolean {
  if (!vendor) return true;
  const today = new Date().getDay(); // 0=Sun
  const hours = vendor.operatingHours?.find((h) => h.dayOfWeek === today);
  if (!hours || hours.isClosed) return false;
  if (!hours.openTime || !hours.closeTime) return true;

  try {
    const now = new Date();
    const [openH, openM] = hours.openTime.split(":").map(Number);
    const [closeH, closeM] = hours.closeTime.split(":").map(Number);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return (
      currentMins >= openH * 60 + openM && currentMins < closeH * 60 + closeM
    );
  } catch {
    return true;
  }
}

function formatPrice(price?: number | string | null) {
  if (price === undefined || price === null) return "Rs. 0";
  const num = typeof price === "number" ? price : Number(price) || 0;
  return `Rs. ${num.toFixed(0)}`;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const totalItems = useCartStore((s) => s.totalItems());

  const { products, loading: productsLoading } = useFeaturedProducts();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { banners } = useBanners();
  const [trendingItems, setTrendingItems] = useState<Product[]>([]);

  // Randomize trending products on mount & reload every 1 minute
  useEffect(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (safeProducts.length === 0) {
      setTrendingItems([]);
      return;
    }

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
    if (!user) return "Welcome to Sab Kuch 👋";
    const hour = new Date().getHours();
    const name = user.name || "there";
    if (hour < 12) return `Good morning, ${name} 👋`;
    if (hour < 17) return `Good afternoon, ${name} 👋`;
    return `Good evening, ${name} 👋`;
  };

  const displayedProducts =
    Array.isArray(trendingItems) && trendingItems.length > 0
      ? trendingItems
      : Array.isArray(products)
        ? (products as Product[])
        : [];

  return (
    <div className="bg-white min-h-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-100 shadow-xs flex items-center justify-center p-0.5">
              <img
                src="/logo.jpg"
                alt="Sab Kuch"
                className="w-full h-full object-contain aspect-square"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-snug break-words">
                {greeting()}
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-primary-500 flex-shrink-0" />
                <p className="text-xs text-gray-400 truncate">
                  {user?.city?.name || "Hostel City, Islamabad"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
            <button
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => navigate("/checkout")}
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
          onClick={() => navigate("/search")}
          className="relative mt-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/search")}
        >
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors"
          />
          <div className="pl-10 pr-3 bg-gray-50 border border-gray-200 group-hover:border-primary-300 h-10 rounded-full text-sm text-gray-400 flex items-center justify-between select-none transition-all shadow-xs">
            <span>Search food, shops, items…</span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-4 pb-6">
        {/* ── Promotional & Update Banners (Managed via Admin) ─────────────── */}
        {banners.length > 0 && (
          <section>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  onClick={() => {
                    if (banner.linkUrl) {
                      if (banner.linkUrl.startsWith("http")) {
                        window.open(banner.linkUrl, "_blank");
                      } else {
                        navigate(banner.linkUrl);
                      }
                    }
                  }}
                  className={cn(
                    "flex-shrink-0 w-72 h-32 rounded-2xl relative overflow-hidden p-4 flex flex-col justify-end shadow-xs select-none transition-transform active:scale-[0.99]",
                    banner.linkUrl && "cursor-pointer",
                    !banner.imageUrl &&
                      (banner.gradient
                        ? `bg-gradient-to-r ${banner.gradient}`
                        : "bg-gradient-to-r from-orange-500 to-amber-500"),
                  )}
                >
                  {/* Background Image with Dark Gradient Overlay */}
                  {banner.imageUrl && (
                    <>
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    </>
                  )}

                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm leading-tight drop-shadow-xs">
                      {banner.title}
                    </p>
                    {banner.description && (
                      <p className="text-white/90 text-xs mt-1 leading-snug drop-shadow-xs line-clamp-2">
                        {banner.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Trending Products ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-base">
                🔥 Trending Products
              </h2>
            </div>
            <button
              className="text-primary-500 text-xs font-semibold hover:underline flex items-center gap-0.5"
              onClick={() => navigate("/shops")}
            >
              <span>See all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {productsLoading ? (
            <ProductGridSkeleton />
          ) : displayedProducts.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🍔</p>
              <p className="text-xs font-bold text-gray-800">
                Explore menu items from local shops
              </p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Browse our partner shops in Hostel City to order food,
                groceries, and essentials.
              </p>
              <button
                onClick={() => navigate("/shops")}
                className="mt-3.5 inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                <span>Browse All Shops</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayedProducts.map((product) => {
                const vendor = product.vendor?.id
                  ? vendorMap[product.vendor.id]
                  : null;
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

function ProductCard({
  product,
  isShopOpen,
}: {
  product: Product;
  isShopOpen: boolean;
}) {
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const cartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  const hasDiscount = Boolean(
    product.discountedPrice && product.discountedPrice < product.price,
  );
  const effectivePrice = hasDiscount ? product.discountedPrice! : product.price;

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col cursor-pointer",
      )}
    >
      {/* Product image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
        {/* Open/closed badge */}
        <div className="absolute top-2 right-2">
          <Badge
            variant={isShopOpen ? "success" : "destructive"}
            className="text-[10px] font-bold px-2 py-0.5 shadow-xs"
          >
            {isShopOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="warning"
              className="text-[10px] font-bold px-2 py-0.5 shadow-xs"
            >
              Sale
            </Badge>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
            {product.name}
          </h3>
          {product.vendor && (
            <p
              onClick={(e) => {
                if (product.vendor?.slug) {
                  e.stopPropagation();
                  navigate(`/shops/${product.vendor.slug}`);
                }
              }}
              className="text-xs text-gray-400 hover:text-primary-500 mt-0.5 line-clamp-1 transition-colors"
            >
              {product.vendor.name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
          <div>
            <span className="font-bold text-gray-900 text-sm">
              {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <div onClick={(e) => e.stopPropagation()}>
            {cartQty === 0 ? (
              <button
                onClick={() => {
                  if (!isShopOpen) {
                    toast.warning(
                      `${product.vendor?.name ?? "This shop"} is currently closed`,
                    );
                    return;
                  }
                  addItem(
                    product,
                    product.vendor?.id ?? "",
                    product.vendor?.name ?? "",
                  );
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold active:scale-95 transition-transform ${
                  isShopOpen
                    ? "bg-primary-500 text-white shadow-xs hover:bg-primary-600"
                    : "bg-gray-200 text-gray-400"
                }`}
                title={isShopOpen ? "Add to cart" : "Shop is currently closed"}
              >
                +
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => useCartStore.getState().removeItem(product.id)}
                  className="w-6 h-6 rounded-full border border-primary-500 text-primary-500 flex items-center justify-center font-bold text-sm hover:bg-primary-50 active:scale-95 transition-transform"
                >
                  −
                </button>
                <span className="text-xs font-bold text-primary-600 w-4 text-center">
                  {cartQty}
                </span>
                <button
                  onClick={() => {
                    if (!isShopOpen) {
                      toast.warning(
                        `${product.vendor?.name ?? "This shop"} is currently closed`,
                      );
                      return;
                    }
                    addItem(
                      product,
                      product.vendor?.id ?? "",
                      product.vendor?.name ?? "",
                    );
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                    isShopOpen
                      ? "bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-transform"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
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
