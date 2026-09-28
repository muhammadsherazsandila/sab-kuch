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
      .then((res) => setProducts(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
