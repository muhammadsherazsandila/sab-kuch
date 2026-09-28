/**
 * useOrders — fetches the authenticated user's orders.
 * useOrderMutations — place order, place custom order, update status.
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Order, ApiResponse } from '@/types';

type OrderFilter = 'all' | 'active' | 'history';

export function useOrders(filter: OrderFilter = 'all') {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    if (!user || !token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    apiClient
      .get<ApiResponse<Order[]>>(`/orders/mine${params}`)
      .then((res) => {
        setOrders(res.data.data || []);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter, user, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

/** Place a standard product order */
export async function placeOrder(payload: {
  vendorId: string;
  addressId?: string;
  items: { productId: string; quantity: number; notes?: string }[];
  notes?: string;
}): Promise<Order> {
  const res = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return res.data.data;
}

/** Place a custom (free-text) order */
export async function placeCustomOrder(payload: {
  addressId?: string;
  description: string;
  preferredShop?: string;
  estimatedBudget?: number;
}): Promise<Order> {
  const res = await apiClient.post<ApiResponse<Order>>('/orders/custom', payload);
  return res.data.data;
}
