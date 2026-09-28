/**
 * Axios API Client
 *
 * Centralised HTTP client with:
 * - Base URL from env
 * - Auto-attach JWT from localStorage
 * - Response unwrapping (returns data.data directly)
 * - 401 → clear auth + redirect to login
 */

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — unwrap envelope + handle auth errors ────────────
apiClient.interceptors.response.use(
  (response) => {
    // If the server returned an HTML page (e.g., Vercel SPA rewrite fallback because API is unreachable or VITE_API_URL is missing)
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE html') || response.data.trim().startsWith('<html'))
    ) {
      console.warn(
        '[apiClient] Received HTML document instead of JSON. Ensure your backend server is running and VITE_API_URL is set in Vercel environment variables.'
      );
      return Promise.reject(
        new Error('API returned an HTML response instead of JSON. Check backend server URL.')
      );
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state cleanly
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
