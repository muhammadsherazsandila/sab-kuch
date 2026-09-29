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

export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient
      .get<ApiResponse<Product>>(`/products/${id}`)
      .then((res) => {
        setProduct(res?.data?.data ?? null);
      })
      .catch((err) => {
        setError(err.message);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error };
}

