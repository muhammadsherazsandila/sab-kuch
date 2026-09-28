/**
 * Cart Store — Zustand
 *
 * Guest-friendly cart: items live in memory (and localStorage) until checkout.
 * At checkout, the user is prompted to log in, then the cart is submitted.
 *
 * Design rules:
 * - A cart is scoped to one vendor at a time (like most delivery apps).
 * - Adding an item from a different vendor clears the cart (with a warning).
 * - Cart is persisted so it survives page refreshes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;

  /** Add or increment an item. If vendor changes, clears existing cart. */
  addItem: (product: Product, vendorId: string, vendorName: string, notes?: string) => void;

  /** Remove one unit of an item */
  removeItem: (productId: string) => void;

  /** Set explicit quantity (0 = remove) */
  setQuantity: (productId: string, qty: number) => void;

  /** Wipe the entire cart */
  clearCart: () => void;

  /** Computed: total item count */
  totalItems: () => number;

  /** Computed: subtotal */
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,

      addItem: (product, vendorId, vendorName, notes) => {
        const state = get();

        // If adding from a different vendor, reset the cart first
        if (state.vendorId && state.vendorId !== vendorId) {
          set({ items: [], vendorId: null, vendorName: null });
          toast.info(`Cart reset: started new cart from ${vendorName}`, {
            id: 'cart-vendor-switch',
            duration: 2500,
          });
        }

        const existing = get().items.find((i) => i.product.id === product.id);

        if (existing) {
          // Increment existing item
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
          toast.success(`Updated ${product.name} quantity (${existing.quantity + 1})`, {
            id: `cart-item-${product.id}`,
            duration: 1500,
          });
        } else {
          // Add new item
          set((s) => ({
            items: [...s.items, { product, quantity: 1, notes }],
            vendorId,
            vendorName,
          }));
          toast.success(`Added ${product.name} to cart`, {
            id: `cart-item-${product.id}`,
            duration: 1500,
          });
        }
      },

      removeItem: (productId) => {
        set((s) => {
          const updated = s.items
            .map((i) =>
              i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0);
          return {
            items: updated,
            // Clear vendor reference if cart becomes empty
            vendorId: updated.length ? s.vendorId : null,
            vendorName: updated.length ? s.vendorName : null,
          };
        });
      },

      setQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: qty } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], vendorId: null, vendorName: null });
        toast.info('Cart cleared', { id: 'cart-cleared', duration: 1500 });
      },

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((acc, i) => {
          const price = i.product.discountedPrice ?? i.product.price;
          return acc + price * i.quantity;
        }, 0),
    }),
    { name: 'sk_cart' }
  )
);
