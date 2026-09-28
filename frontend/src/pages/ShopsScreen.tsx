/**
 * ShopsScreen
 *
 * Layout:
 *   1. Search bar (full-width, sticky)
 *   2. Category filter chips (horizontal scroll)
 *   3. Shop cards grid/list
 *
 * Each card shows:
 *   - Cover image
 *   - Shop name + type badge
 *   - Star rating
 *   - Estimated delivery time
 *   - Operating hours (today's)
 *   - Open/closed status
 *   - "Menu" button → navigates to vendor detail
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, Bike } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVendors } from '@/hooks/useVendors';
import { Vendor } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Returns today's operating hours string or "Closed today" */
function getTodayHours(vendor: Vendor): string {
  const today = new Date().getDay();
  const h = vendor.operatingHours?.find((x) => x.dayOfWeek === today);
  if (!h || h.isClosed) return 'Closed today';
  return `${h.openTime} – ${h.closeTime}`;
}

/** Returns true if the vendor is currently accepting orders */
function isOpen(vendor: Vendor): boolean {
  const today = new Date().getDay();
  const h = vendor.operatingHours?.find((x) => x.dayOfWeek === today);
  if (!h || h.isClosed) return false;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const [oh, om] = h.openTime.split(':').map(Number);
  const [ch, cm] = h.closeTime.split(':').map(Number);
  return now >= oh * 60 + om && now < ch * 60 + cm;
}

export default function ShopsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);

  // Fetch vendors with search + type filter
  const { vendors, loading } = useVendors({ search, type: activeType ?? undefined });

  // Derive unique vendor types for filter chips
  const vendorTypes = useMemo(() => {
    const types = new Set(vendors.map((v) => v.vendorType.name));
    return ['All', ...Array.from(types)];
  }, [vendors]);

  return (
    <div className="bg-gray-50 min-h-full">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900 mb-3">Shops Near You</h1>

        {/* Full-width search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search shops, restaurants…"
            className="pl-9 bg-gray-50 border-gray-200 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {vendorTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type === 'All' ? null : type)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                (activeType === null && type === 'All') || activeType === type
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shop List ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-4 pb-4">
        {loading ? (
          <ShopListSkeleton />
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 font-medium">No shops found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <ShopCard
              key={vendor.id}
              vendor={vendor}
              onMenuClick={() => navigate(`/shops/${vendor.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Shop Card ─────────────────────────────────────────────────────────────────

interface ShopCardProps {
  vendor: Vendor;
  onMenuClick: () => void;
}

function ShopCard({ vendor, onMenuClick }: ShopCardProps) {
  const open = isOpen(vendor);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Cover image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-100 to-amber-100">
        {vendor.coverImageUrl ? (
          <img src={vendor.coverImageUrl} alt={vendor.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏪</div>
        )}
        {/* Open/closed badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={open ? 'success' : 'destructive'}>
            {open ? '● Open' : '● Closed'}
          </Badge>
        </div>
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 gradient-card" />
        {/* Vendor type chip */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
            {vendor.vendorType.name}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight">{vendor.name}</h3>
            {vendor.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{vendor.description}</p>
            )}
          </div>
          {/* Logo thumbnail */}
          {vendor.logoUrl && (
            <img
              src={vendor.logoUrl}
              alt=""
              className="w-10 h-10 rounded-xl object-cover border border-gray-100 ml-3 flex-shrink-0"
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="font-semibold text-gray-700">{vendor.averageRating.toFixed(1)}</span>
            <span>({vendor.totalRatings})</span>
          </div>
          {/* Delivery time */}
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>{vendor.estimatedDeliveryMinutes} min</span>
          </div>
          {/* Delivery fee */}
          <div className="flex items-center gap-1">
            <Bike size={12} className="text-gray-400" />
            <span>{vendor.deliveryFee === 0 ? 'Free' : `Rs. ${vendor.deliveryFee}`}</span>
          </div>
        </div>

        {/* Today's hours */}
        <p className="text-xs text-gray-400 mt-2">
          Today: <span className="font-medium text-gray-600">{getTodayHours(vendor)}</span>
          {!open && (
            <span className="text-primary-500 ml-2 font-medium">
              · Opens {vendor.operatingHours?.find((h) => h.dayOfWeek === (new Date().getDay() + 1) % 7)?.openTime ?? 'tomorrow'}
            </span>
          )}
        </p>

        {/* Menu CTA */}
        <Button
          className="w-full mt-3 h-10"
          disabled={!open}
          onClick={onMenuClick}
        >
          {open ? (
            <><span>View Menu</span><ChevronRight size={16} className="ml-1" /></>
          ) : (
            'Shop is Closed'
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ShopListSkeleton() {
  return (
    <>
      {[1,2,3].map((i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="h-36 bg-gray-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      ))}
    </>
  );
}
