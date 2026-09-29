/**
 * ProductDetailScreen
 *
 * Displays detailed information about a single product:
 * - High-resolution stock image
 * - Price, discount tag, unit
 * - Detailed description
 * - Associated shop info & shortcut to open shop
 * - Quantity selector, special notes input
 * - Direct Add to Cart / Update Cart
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Bike, ShoppingCart, Store, Check, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(id);
  const { addItem, items, setQuantity, removeItem } = useCartStore();
  const totalItems = useCartStore((s) => s.totalItems());

  const [quantity, setQuantityState] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
          <div className="w-32 h-5 bg-gray-100 rounded animate-pulse" />
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
        </div>
        {/* Image Skeleton */}
        <div className="w-full h-72 bg-gray-200 animate-pulse" />
        {/* Body Skeleton */}
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Product Not Found</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          The product you are looking for is either unavailable or has been removed.
        </p>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">
          Go Back
        </Button>
      </div>
    );
  }

  const vendor = product.vendor;
  const isOutOfStock = product.status === 'OUT_OF_STOCK';
  const hasDiscount = Boolean(product.discountedPrice && product.discountedPrice < product.price);
  const effectivePrice = hasDiscount ? product.discountedPrice! : product.price;
  const savings = hasDiscount ? product.price - product.discountedPrice! : 0;

  // Cart item matching this product
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCartQty = cartItem?.quantity ?? 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!vendor?.id || !vendor?.name) {
      toast.error('Unable to add item: shop details missing');
      return;
    }

    if (inCartQty > 0) {
      // If already in cart, update quantity
      setQuantity(product.id, inCartQty + quantity);
      toast.success(`Updated cart: +${quantity} ${product.name}`);
    } else {
      // Add fresh
      for (let i = 0; i < quantity; i++) {
        addItem(product, vendor.id, vendor.name, notes.trim() || undefined);
      }
      toast.success(`Added ${quantity} × ${product.name} to cart`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all text-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center px-2 flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium truncate">Product Details</p>
          <h1 className="text-sm font-bold text-gray-900 truncate">{product.name}</h1>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="relative w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all text-gray-700"
          aria-label="View Cart"
        >
          <ShoppingCart size={18} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-md mx-auto">
        {/* ── Hero Image ──────────────────────────────────────────────────── */}
        <div className="relative w-full h-72 sm:h-80 bg-gray-100 overflow-hidden shadow-inner">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-50 to-amber-100">
              🍽️
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {hasDiscount && (
              <Badge variant="warning" className="text-xs font-bold px-2.5 py-1 shadow-md">
                🔥 Rs. {savings} OFF
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 shadow-md">
                ⭐ Featured
              </Badge>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <Badge
              variant={isOutOfStock ? 'destructive' : 'success'}
              className="text-xs font-bold px-2.5 py-1 shadow-md"
            >
              {isOutOfStock ? 'Out of stock' : 'In stock'}
            </Badge>
          </div>
        </div>

        {/* ── Details Container ───────────────────────────────────────────── */}
        <div className="p-4 space-y-4">
          {/* Title & Category */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            {product.category && (
              <span className="inline-block text-[11px] font-semibold text-primary-600 uppercase tracking-wider mb-1">
                {product.category.name}
              </span>
            )}
            <h1 className="text-xl font-extrabold text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-2.5 mt-2.5">
              <span className="text-2xl font-black text-gray-900">
                Rs. {effectivePrice}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  Rs. {product.price}
                </span>
              )}
              {product.unit && (
                <span className="text-xs text-gray-500 font-medium">
                  / {product.unit}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-gray-600 text-sm leading-relaxed">
                {product.description}
              </div>
            )}
          </div>

          {/* Shop Card with direct link */}
          {vendor && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Store size={14} className="text-primary-500" />
                  <span>Available at</span>
                </div>
                <button
                  onClick={() => navigate(`/shops/${vendor.slug}`)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Visit Shop →
                </button>
              </div>

              <div
                onClick={() => navigate(`/shops/${vendor.slug}`)}
                className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-orange-50/50 rounded-xl transition-colors cursor-pointer border border-gray-100"
              >
                {vendor.logoUrl ? (
                  <img
                    src={vendor.logoUrl}
                    alt={vendor.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                    {vendor.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{vendor.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {vendor.estimatedDeliveryMinutes ?? 25} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Bike size={12} className="text-gray-400" />
                      Rs. {vendor.deliveryFee ?? 30}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions / Notes */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <label htmlFor="notes" className="block text-xs font-bold text-gray-700 mb-1.5">
              Special Instructions (Optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Less spicy, extra sauce, separate packing..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-gray-900 block">Quantity</span>
                <span className="text-xs text-gray-500">
                  Subtotal: Rs. {effectivePrice * quantity}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantityState((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <Minus size={14} />
                </button>
                <span className="text-base font-bold text-gray-900 w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantityState((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold active:scale-95 shadow-xs"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* If already in cart, show status banner */}
          {inCartQty > 0 && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center justify-between text-xs text-primary-800">
              <span className="flex items-center gap-1.5 font-medium">
                <Check size={14} className="text-primary-600" />
                You currently have {inCartQty} in your cart
              </span>
              <button
                onClick={() => removeItem(product.id)}
                className="text-red-500 font-semibold hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar ────────────────────────────────────────── */}
      <div
        className="fixed left-0 right-0 z-30 max-w-md mx-auto px-4 bg-white/95 backdrop-blur-md border-t border-gray-100 py-3 flex items-center gap-3 shadow-lg"
        style={{ bottom: 'calc(65px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex-1 min-w-0">
          <span className="text-[11px] text-gray-400 block font-medium">Total Amount</span>
          <span className="text-lg font-black text-gray-900 truncate block">
            Rs. {effectivePrice * quantity}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-2 gradient-primary text-white font-bold py-3.5 px-6 rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          <span>{inCartQty > 0 ? 'Add More to Cart' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
}
