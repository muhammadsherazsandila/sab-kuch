/**
 * useProducts — fetches featured products for the Home screen.
 */

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Product, ApiResponse } from '@/types';

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Product[]>>('/products/featured')
      .then((res) => {
        const data = res?.data?.data;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
