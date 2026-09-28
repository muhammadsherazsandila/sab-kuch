import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { BannerCard } from '@/types';

export function useBanners() {
  const [banners, setBanners] = useState<BannerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/banners');
      setBanners(res.data.data || []);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to fetch banners:', err);
      setError(err?.response?.data?.message || 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return { banners, loading, error, refetch: fetchBanners };
}
