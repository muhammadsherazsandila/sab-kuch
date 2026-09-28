/**
 * CheckoutScreen
 *
 * Implements:
 * 1. Default address selection from user profile with 1-click toggle to custom address.
 * 2. Deferred PWA install gate & login gate.
 * 3. All prices in Pakistani Rupees (Rs.).
 * 4. Campus delivery for Hostel City, Islamabad.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, MapPin, Share, PlusSquare,
  ShieldCheck, AlertCircle, Sparkles, Building, DoorClosed,
  CheckCircle, Edit3, Navigation, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { placeOrder } from '@/hooks/useOrders';
import apiClient from '@/lib/apiClient';
import { Address, ApiResponse } from '@/types';
import { toast } from 'sonner';

import {
  triggerInstallPrompt,
  isIOS,
  isAndroid,
  isInStandaloneMode,
  canInstall
} from '@/lib/pwa';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, vendorId, vendorName, clearCart, subtotal, removeItem, addItem } = useCartStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address states
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  // Custom address fields
  const [customHostelName, setCustomHostelName] = useState('');
  const [customStreetNo, setCustomStreetNo] = useState('');
  const [customRoomNo, setCustomRoomNo] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // PWA Prompt state
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  const deliveryFee = 30;
  const total = subtotal() + deliveryFee;

  // Deferred PWA prompt trigger
  useEffect(() => {
    if (!isInStandaloneMode()) {
      if (canInstall() && isAndroid()) {
        triggerInstallPrompt().catch(() => {});
      } else if (isIOS()) {
        setShowIosInstallModal(true);
      }
    }
  }, []);

  // Fetch saved default address if logged in
  useEffect(() => {
    async function fetchSavedAddresses() {
      if (!user) {
        setUseCustomAddress(true);
        return;
      }
      setAddressesLoading(true);
      try {
        const res = await apiClient.get<ApiResponse<Address[]>>('/users/me/addresses');
        const list = res.data.data;
        if (list && list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setDefaultAddress(def);
          setUseCustomAddress(false);
        } else {
          setUseCustomAddress(true);
        }
      } catch {
        setUseCustomAddress(true);
      } finally {
        setAddressesLoading(false);
      }
    }

    fetchSavedAddresses();
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl mb-4">
          🛒
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">
          Browse food, chai, snacks & essentials from shops in Hostel City, Islamabad.
        </p>
        <Button onClick={() => navigate('/shops')} className="w-full">
          Browse Shops Now
        </Button>
      </div>
    );
  }

  async function handleCheckout() {
    setError(null);

    // 1. PWA Deferred Prompt Trigger if not yet installed
    if (!isInStandaloneMode()) {
      if (canInstall()) {
        await triggerInstallPrompt();
      } else if (isIOS()) {
        setShowIosInstallModal(true);
      }
    }

    // 2. Login Gate: Require login/signup at checkout
    if (!user) {
      navigate('/auth?redirect=/checkout');
      return;
    }

    if (!vendorId) {
      const msg = 'Please add items from a single shop.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    // Address verification
    if (useCustomAddress && !customHostelName.trim()) {
      const msg = 'Please enter your hostel name for delivery.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setSubmitting(true);
    try {
      let finalAddressId = defaultAddress?.id;

      // If user provided a custom address and opted to save it as default
      if (useCustomAddress) {
        if (saveAsDefault) {
          try {
            const addrRes = await apiClient.post<ApiResponse<Address>>('/users/me/addresses', {
              hostelName: customHostelName.trim(),
              streetNo: customStreetNo.trim() || undefined,
              roomNo: customRoomNo.trim() || undefined,
              isDefault: true,
            });
            if (addrRes.data.data) {
              finalAddressId = addrRes.data.data.id;
            }
          } catch {
            // non-fatal, proceed with order notes
          }
        } else {
          finalAddressId = undefined; // one-off custom delivery
        }
      }

      // Build delivery summary notes
      let fullNotes = '';
      if (useCustomAddress) {
        fullNotes = [
          `Hostel: ${customHostelName.trim()}`,
          customStreetNo.trim() ? `Street: ${customStreetNo.trim()}` : '',
          customRoomNo.trim() ? `Room: ${customRoomNo.trim()}` : '',
          customNotes.trim() ? `Note: ${customNotes.trim()}` : '',
        ].filter(Boolean).join(' | ');
      } else if (defaultAddress) {
        fullNotes = [
          defaultAddress.line1,
          defaultAddress.line2,
          customNotes.trim() ? `Note: ${customNotes.trim()}` : '',
        ].filter(Boolean).join(' | ');
      }

      await placeOrder({
        vendorId,
        addressId: finalAddressId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
        notes: fullNotes || undefined,
      });

      clearCart();
      toast.success('Order placed successfully! We have notified the shop.');
      navigate('/orders');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to place order. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }

  }

  return (
    <div className="min-h-screen bg-gray-50 pb-56 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Checkout</h1>
            <p className="text-xs text-orange-600 font-semibold">{vendorName}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* iOS PWA Install Banner */}
        {showIosInstallModal && !isInStandaloneMode() && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 animate-slide-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-orange-400" />
                <h4 className="font-bold text-sm">Install SabKuch App</h4>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Install to get instant order notifications right on your home screen:
            </p>
            <div className="mt-2.5 bg-slate-800 p-2.5 rounded-xl text-xs space-y-1.5">
              <p className="flex items-center gap-1.5 text-slate-200">
                1. Tap the <Share size={13} className="text-orange-400" /> <strong>Share</strong> button in Safari
              </p>
              <p className="flex items-center gap-1.5 text-slate-200">
                2. Tap <PlusSquare size={13} className="text-orange-400" /> <strong>Add to Home Screen</strong>
              </p>
            </div>
          </div>
        )}

        {/* ── DELIVERY ADDRESS SECTION ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-orange-600" />
              <h3 className="font-bold text-sm text-gray-900">Delivery Address</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
              Hostel City, Islamabad
            </span>
          </div>

          {/* Option A: Default Address Available & Selected */}
          {defaultAddress && !useCustomAddress && (
            <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-xs text-gray-900">Default Saved Address</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustomAddress(true)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Edit3 size={13} /> Use Custom Address
                </button>
              </div>

              <div className="pl-7 text-xs text-gray-700 space-y-0.5">
                <p className="font-bold text-gray-900 text-sm">{defaultAddress.line1}</p>
                {defaultAddress.line2 && <p className="text-gray-600 font-medium">{defaultAddress.line2}</p>}
                <p className="text-gray-500 text-[11px]">Hostel City, Islamabad Capital Territory</p>
              </div>

              {/* Instructions input for default address */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Special instructions (e.g. call on arrival, leave at gate)"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Option B: Custom Address Form */}
          {useCustomAddress && (
            <div className="space-y-3 pt-1">
              {defaultAddress && (
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-700">Enter Custom Delivery Details:</span>
                  <button
                    type="button"
                    onClick={() => setUseCustomAddress(false)}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    ← Use My Default Address
                  </button>
                </div>
              )}

              {/* Hostel Name */}
              <div className="relative">
                <Building size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Hostel / Building Name *"
                  value={customHostelName}
                  onChange={(e) => setCustomHostelName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              {/* Street No & Room No */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Navigation size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Street / Block No"
                    value={customStreetNo}
                    onChange={(e) => setCustomStreetNo(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="relative">
                  <DoorClosed size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Room / Floor #"
                    value={customRoomNo}
                    onChange={(e) => setCustomRoomNo(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <input
                type="text"
                placeholder="Special delivery instructions (e.g. call on arrival)"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />

              {/* Save as default checkbox */}
              {user && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Save this as my default address for future orders</span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* ── ORDER ITEMS SECTION ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900">Order Items</h3>
            <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const price = item.product.discountedPrice ?? item.product.price;
              return (
                <div key={item.product.id} className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-semibold text-sm text-gray-900 leading-tight">{item.product.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Rs. {price} × {item.quantity} = <span className="font-bold text-gray-800">Rs. {price * item.quantity}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addItem(item.product, vendorId!, vendorName!)}
                      className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BILL BREAKDOWN ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items Subtotal</span>
            <span className="font-semibold text-gray-800">Rs. {subtotal()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery Fee (Hostel City)</span>
            <span className="font-semibold text-gray-800">Rs. {deliveryFee}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold border-t border-gray-100 pt-3 text-gray-900">
            <span>Total Amount</span>
            <span className="text-orange-600">Rs. {total}</span>
          </div>
        </div>

        {/* Guest Warning */}
        {!user && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-orange-800">
            <ShieldCheck size={18} className="text-orange-600 flex-shrink-0" />
            <span>Ordering as Guest. You will quickly sign in via email code to confirm this order.</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Fixed Sticky Checkout Button — sits strictly above sticky BottomNav */}
      <div
        className="fixed left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 max-w-md mx-auto shadow-xl"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        <Button
          className="w-full h-12 text-base font-bold shadow-md"
          disabled={submitting}
          onClick={handleCheckout}
        >
          {submitting ? 'Placing Order...' : !user ? `Sign In & Pay Rs. ${total}` : `Place Order (Rs. ${total})`}
        </Button>
      </div>
    </div>
  );
}
