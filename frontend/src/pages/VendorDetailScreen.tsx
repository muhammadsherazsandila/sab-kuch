import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Bike, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendor } from '@/hooks/useVendors';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';

export default function VendorDetailScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { vendor, loading, error } = useVendor(slug ?? '');
  const { addItem, items } = useCartStore();
  const totalItems = useCartStore((s) => s.totalItems());

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-48 bg-gray-100 animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-3">🏪</p>
        <p className="font-semibold text-gray-700">Shop not found</p>
        <Button className="mt-4" onClick={() => navigate('/shops')}>Back to Shops</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100">
        {vendor.coverImageUrl ? (
          <img src={vendor.coverImageUrl} alt={vendor.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🏪</div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Info */}
      <div className="bg-white px-4 py-4 -mt-4 rounded-t-2xl relative z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
        {vendor.description && <p className="text-sm text-gray-500 mt-1">{vendor.description}</p>}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="font-semibold text-gray-700">{vendor.averageRating.toFixed(1)}</span>
            <span>({vendor.totalRatings})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>{vendor.estimatedDeliveryMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Bike size={12} className="text-gray-400" />
            <span>{vendor.deliveryFee === 0 ? 'Free delivery' : `Rs. ${vendor.deliveryFee}`}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-4">
        {vendor.categories && vendor.categories.length > 0 ? (
          vendor.categories.map((cat) => (
            <div key={cat.id} className="mb-6">
              <h2 className="font-bold text-gray-900 text-base mb-3">{cat.name}</h2>
              <div className="space-y-3">
                {cat.products?.map((product: Product) => {
                  const cartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
                  const effectivePrice = product.discountedPrice ?? product.price;
                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 cursor-pointer hover:shadow-xs transition-shadow"
                    >
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-sm text-gray-900">Rs. {effectivePrice}</span>
                          {product.discountedPrice && (
                            <span className="text-xs text-gray-400 line-through">Rs. {product.price}</span>
                          )}
                        </div>
                      </div>
                      <div
                        className="flex flex-col items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.status === 'OUT_OF_STOCK' ? (
                          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                            Out of stock
                          </span>
                        ) : cartQty === 0 ? (
                          <button
                            onClick={() => addItem(product, vendor.id, vendor.name)}
                            className="px-4 py-1.5 rounded-lg border-2 border-primary-500 text-primary-500 text-sm font-bold active:scale-95 transition-transform"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => useCartStore.getState().removeItem(product.id)}
                              className="w-7 h-7 rounded-lg border-2 border-primary-500 text-primary-500 flex items-center justify-center font-bold"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold text-primary-500 w-4 text-center">{cartQty}</span>
                            <button
                              onClick={() => addItem(product, vendor.id, vendor.name)}
                              className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">Menu coming soon</p>
          </div>
        )}
      </div>

      {/* Floating cart bar — sits strictly above sticky BottomNav */}
      {totalItems > 0 && (
        <div
          className="fixed left-0 right-0 z-30 max-w-md mx-auto px-4"
          style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => navigate('/checkout')}
            className="w-full gradient-primary text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-bold text-sm">{totalItems} item{totalItems > 1 ? 's' : ''} in cart</span>
            </div>
            <span className="font-bold text-sm">View Cart →</span>
          </button>
        </div>
      )}
    </div>
  );
}
