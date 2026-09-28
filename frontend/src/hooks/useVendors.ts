/**
 * useVendors — fetches paginated vendor list with optional filters.
 * useVendor  — fetches a single vendor by slug (includes menu).
 */

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Vendor, ApiResponse } from '@/types';

interface UseVendorsOptions {
  city?: string;
  type?: string;
  search?: string;
  page?: number;
}

export function useVendors(options: UseVendorsOptions = {}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (options.city)   params.set('city', options.city);
    if (options.type)   params.set('type', options.type);
    if (options.search) params.set('search', options.search);
    if (options.page)   params.set('page', String(options.page));

    setLoading(true);
    apiClient
      .get<ApiResponse<Vendor[]>>(`/vendors?${params}`)
      .then((res) => setVendors(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  // Re-fetch when search / filter params change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.city, options.type, options.search, options.page]);

  return { vendors, loading, error };
}

export function useVendor(slug: string) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiClient
      .get<ApiResponse<Vendor>>(`/vendors/${slug}`)
      .then((res) => setVendor(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { vendor, loading, error };
}
