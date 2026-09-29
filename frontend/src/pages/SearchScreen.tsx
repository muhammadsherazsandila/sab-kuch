/**
 * SearchScreen
 *
 * Dedicated search screen featuring:
 * 1. Auto-focused search input with back navigation and clear button
 * 2. Search tags managed by Admin (e.g. Paratha, Roti, Biryani, Chai, etc.)
 * 3. Search query fetches matching Shops and Products
 * 4. Resilient error handling and defensive data parsing so the page never crashes
 * 5. Users can open shops directly or add products to cart
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  Store,
  ShoppingBag,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { Badge } from '@/components/ui/badge';
import { Vendor, Product, SearchTag, ApiResponse } from '@/types';

// Fallback tags in case database is empty or loading
const DEFAULT_FALLBACK_TAGS = [
  'Paratha',
  'Roti',
  'Biryani',
  'Chai',
  'Burger',
  'Shawarma',
  'Samosa',
  'Roll Paratha',
  'Cold Drinks',
  'Grocery',
];

interface SearchResult {
  vendors: Vendor[];
  shops?: Vendor[];
  products: Product[];
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tags, setTags] = useState<string[]>(DEFAULT_FALLBACK_TAGS);
  const [loadingTags, setLoadingTags] = useState(true);
  const [results, setResults] = useState<SearchResult>({ vendors: [], shops: [], products: [] });
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem, items } = useCartStore();

  // 1. Fetch tags from backend
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<ApiResponse<SearchTag[]>>('/search/tags')
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setTags(res.data.data.map((t) => t.name));
        }
      })
      .catch((err) => {
        console.warn('Failed to load search tags, using defaults:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingTags(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Perform search
  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults({ vendors: [], shops: [], products: [] });
      setHasSearched(false);
      setError(null);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const res = await apiClient.get<ApiResponse<any>>(`/search?q=${encodeURIComponent(trimmed)}`);
      const data = res.data?.data;

      // Extract vendors / shops defensively
      const rawVendors = data?.vendors ?? data?.shops ?? [];
      const rawProducts = data?.products ?? [];

      const parsedVendors: Vendor[] = Array.isArray(rawVendors) ? rawVendors : [];
      const parsedProducts: Product[] = Array.isArray(rawProducts) ? rawProducts : [];

      setResults({
        vendors: parsedVendors,
        shops: parsedVendors,
        products: parsedProducts,
      });
    } catch (err: any) {
      console.error('Search failed:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to complete search. Please check your network connection.';
      setError(errMsg);
      toast.error(errMsg);
      setResults({ vendors: [], shops: [], products: [] });
    } finally {
      setSearching(false);
    }
  };

  // If initial query provided via URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // Auto focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Handle typing with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ vendors: [], shops: [], products: [] });
      setHasSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
      setSearchParams(query ? { q: query } : {});
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleTagClick = (tagName: string) => {
    setQuery(tagName);
    setSearchParams({ q: tagName });
    performSearch(tagName);
  };

  const handleClear = () => {
    setQuery('');
    setSearchParams({});
    setResults({ vendors: [], shops: [], products: [] });
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  // Safe references
  const vendorList: Vendor[] = Array.isArray(results?.vendors)
    ? results.vendors
    : Array.isArray(results?.shops)
    ? results.shops
    : [];

  const productList: Product[] = Array.isArray(results?.products) ? results.products : [];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* ── Search Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 pt-10 pb-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition-transform shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative flex-1">
            <SearchIcon
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search paratha, roti, biryani, shops..."
              className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 pl-10 pr-9 py-2.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full bg-gray-200/70"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Popular Search Tags ── */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-500">
            <Sparkles size={13} className="text-primary-500" />
            <span>Popular in Hostel City:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {tags.map((tag) => {
              const isActive = query.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search Body ── */}
      <div className="px-4 py-4 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => performSearch(query)}
              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold flex items-center gap-1 shrink-0"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {searching && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Finding delicious food & shops...</p>
          </div>
        )}

        {/* Not searching and no query: show prompt */}
        {!searching && !hasSearched && !error && (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-primary-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <SearchIcon size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">What are you craving today?</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Select one of the tags above or type any food, drink, or shop name in Hostel City, Islamabad.
            </p>
          </div>
        )}

        {/* Has results or empty */}
        {!searching && hasSearched && (
          <>
            {vendorList.length === 0 && productList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">No results found for "{query}"</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  We couldn't find matching shops or items. Try searching for "Paratha", "Roti", or check popular tags.
                </p>
              </div>
            ) : (
              <>
                {/* ── Shops Found ── */}
                {vendorList.length > 0 && (
                  <section>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Store size={16} className="text-primary-500" />
                      <h2 className="text-sm font-bold text-gray-900">
                        Shops ({vendorList.length})
                      </h2>
                    </div>

                    <div className="space-y-2.5">
                      {vendorList.map((vendor) => (
                        <div
                          key={vendor.id}
                          onClick={() => navigate(`/shops/${vendor.slug}`)}
                          className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-primary-200 transition-all active:scale-[0.99]"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                            {vendor.logoUrl ? (
                              <img
                                src={vendor.logoUrl}
                                alt={vendor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl bg-orange-50">
                                🏬
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900 truncate">
                                {vendor.name}
                              </h3>
                              <Badge
                                variant={vendor.status === 'ACTIVE' ? 'success' : 'destructive'}
                                className="text-[9px] py-0 px-1.5"
                              >
                                {vendor.status === 'ACTIVE' ? 'Open' : 'Closed'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {vendor.vendorType?.name || 'Restaurant & Snacks'} • {vendor.address || 'Hostel City'}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-gray-400" />
                                {vendor.estimatedDeliveryMinutes || 25} mins
                              </span>
                              <span>•</span>
                              <span>Delivery: Rs. {vendor.deliveryFee ?? 50}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Products Found ── */}
                {productList.length > 0 && (
                  <section>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <ShoppingBag size={16} className="text-primary-500" />
                      <h2 className="text-sm font-bold text-gray-900">
                        Dishes & Items ({productList.length})
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {productList.map((product) => {
                        const cartQty = items.find((i) => i.product?.id === product.id)?.quantity ?? 0;
                        const effectivePrice = product.discountedPrice ?? product.price ?? 0;

                        return (
                          <div
                            key={product.id}
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all"
                          >
                            <div className="relative h-28 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}
                              {product.discountedPrice != null && (
                                <div className="absolute top-1.5 left-1.5">
                                  <Badge variant="warning" className="text-[9px] py-0 px-1">
                                    Sale
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-2.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1">
                                  {product.name}
                                </h4>
                                {product.vendor && (
                                  <p
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/shops/${product.vendor?.slug}`);
                                    }}
                                    className="text-[11px] text-primary-600 hover:underline mt-0.5 line-clamp-1 cursor-pointer"
                                  >
                                    {product.vendor.name}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                                <div>
                                  <span className="font-bold text-gray-900 text-xs">
                                    Rs. {effectivePrice}
                                  </span>
                                  {product.discountedPrice != null && (
                                    <span className="text-[10px] text-gray-400 line-through ml-1">
                                      Rs. {product.price}
                                    </span>
                                  )}
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                  {cartQty === 0 ? (
                                    <button
                                      onClick={() =>
                                        addItem(
                                          product,
                                          product.vendor?.id ?? '',
                                          product.vendor?.name ?? ''
                                        )
                                      }
                                      className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => useCartStore.getState().removeItem(product.id)}
                                        className="w-5 h-5 rounded-full border border-primary-500 text-primary-500 flex items-center justify-center font-bold text-xs"
                                      >
                                        −
                                      </button>
                                      <span className="text-xs font-bold text-primary-500 w-3 text-center">
                                        {cartQty}
                                      </span>
                                      <button
                                        onClick={() =>
                                          addItem(
                                            product,
                                            product.vendor?.id ?? '',
                                            product.vendor?.name ?? ''
                                          )
                                        }
                                        className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs"
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
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
